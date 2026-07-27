#!/usr/bin/env python3
"""
Full catalog → Supabase sync (Python port of consolidate-restaurants.mjs + missing inserts).

1. Dedupe/enrich existing Supabase rows from data/restaurants.json
2. Insert catalog rows missing from Supabase (creates owner auth users)
3. Sync real catalog images to matched slugs

Usage:
  python3 scripts/full-catalog-sync-supabase.py --dry-run
  python3 scripts/full-catalog-sync-supabase.py
"""
from __future__ import annotations

import argparse
import json
import re
import secrets
import string
import urllib.error
import urllib.parse
import urllib.request
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
ENV_PATH = ROOT / ".env.local"
REPORT_PATH = ROOT / "data" / "consolidate-report.json"
CREDENTIALS_PATH = ROOT / "import-credentials.txt"

BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg"
STOCK_PREFIX = "https://images.unsplash.com/"

DAY_MAP = {
    "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6,
    "sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3,
    "thursday": 4, "friday": 5, "saturday": 6,
}

DEFAULT_TABLES = [
    {"table_number": "T1", "capacity": 2},
    {"table_number": "T2", "capacity": 2},
    {"table_number": "T3", "capacity": 4},
    {"table_number": "T4", "capacity": 4},
    {"table_number": "T5", "capacity": 4},
    {"table_number": "T6", "capacity": 6},
    {"table_number": "T7", "capacity": 6},
]


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def parse_address_line(addr: str | None) -> dict[str, str] | None:
    s = str(addr or "").strip()
    m = re.match(r"^(.+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})", s)
    if m:
        return {"street": m.group(1).strip(), "city": m.group(2).strip(), "state": m.group(3), "zip": m.group(4)}
    return None


def address_fingerprint_from_obj(a: dict | None) -> str:
    if not a or not isinstance(a, dict):
        return ""
    street = re.sub(r"[^a-z0-9]", "", str(a.get("street") or "").lower())[:48]
    zip_code = re.sub(r"\D", "", str(a.get("zip") or ""))[:5]
    city = str(a.get("city") or "").lower().strip()
    if not street or not city:
        return ""
    return f"{street}|{zip_code}|{city}"


def catalog_fingerprint(c: dict) -> str:
    return address_fingerprint_from_obj(parse_address_line(c.get("address")))


def parse_price_range(price_str: str | None) -> int:
    n = len(re.findall(r"\$", str(price_str or "")))
    return min(4, max(1, n or 2))


def to_hhmm(time_str: str | None) -> str | None:
    if not time_str:
        return None
    s = str(time_str)
    if re.match(r"^\d{2}:\d{2}$", s):
        return s
    m = re.match(r"(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?", s, re.I)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or "0")
    period = (m.group(3) or "").lower()
    if period == "pm" and hour != 12:
        hour += 12
    if period == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def parse_catalog_hours(hours_obj: dict | None) -> list[dict]:
    result: list[dict] = []
    if not hours_obj or not isinstance(hours_obj, dict):
        return result
    for key, value in hours_obj.items():
        if value == "Closed" or not value:
            continue
        tm = re.match(
            r"(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)",
            str(value),
            re.I,
        )
        if not tm:
            continue
        open_time = to_hhmm(tm.group(1))
        close_time = to_hhmm(tm.group(2))
        if not open_time or not close_time:
            continue
        days = key.lower().split("_")
        if len(days) == 1 and days[0] in DAY_MAP:
            result.append({"day_of_week": DAY_MAP[days[0]], "open_time": open_time, "close_time": close_time})
        elif len(days) == 2:
            start_idx = DAY_MAP.get(days[0])
            end_idx = DAY_MAP.get(days[1])
            if start_idx is None or end_idx is None:
                continue
            if start_idx > end_idx:
                for i in range(start_idx, 7):
                    result.append({"day_of_week": i, "open_time": open_time, "close_time": close_time})
                for i in range(0, end_idx + 1):
                    result.append({"day_of_week": i, "open_time": open_time, "close_time": close_time})
            else:
                for i in range(start_idx, end_idx + 1):
                    result.append({"day_of_week": i, "open_time": open_time, "close_time": close_time})
    return result


def normalize_instagram(v: str | None) -> str | None:
    if not v:
        return None
    s = (
        str(v)
        .replace("@", "")
        .replace("https://www.instagram.com/", "")
        .replace("https://instagram.com/", "")
        .replace("http://www.instagram.com/", "")
        .replace("http://instagram.com/", "")
        .rstrip("/")
        .strip()
    )
    return s or None


def normalize_facebook(v: str | None) -> str | None:
    if not v:
        return None
    s = str(v).strip()
    if not s:
        return None
    if s.startswith("http://") or s.startswith("https://"):
        return s
    handle = re.sub(r"\s+", "", s)
    return f"https://www.facebook.com/{handle}"


def is_generic_description(d: str | None) -> bool:
    s = str(d or "").lower()
    return "discovered via serpapi" in s or "listing sourced from public maps" in s or len(s) < 30


def has_real_images(images: list | None) -> bool:
    if not images:
        return False
    for raw in images:
        url = str(raw or "").strip()
        if not url:
            continue
        if url == BRAND_PLACEHOLDER or url.endswith("/restaurant-card-placeholder.svg"):
            continue
        if url.startswith(STOCK_PREFIX):
            continue
        return True
    return False


def score_row(row: dict, canonical_slug: str) -> int:
    s = 0
    if row.get("slug") == canonical_slug:
        s += 10000
    sources = row.get("sources") or {}
    if sources.get("catalog_id") == canonical_slug:
        s += 9000
    if row.get("is_active"):
        s += 500
    s += int(row.get("external_review_count") or 0) * 3
    s += float(row.get("external_avg_rating") or 0) * 20
    if row.get("our_story") and len(row["our_story"]) > 40:
        s += 300
    if row.get("website"):
        s += 80
    hours = row.get("hours")
    if isinstance(hours, list) and len(hours) > 0:
        s += 120
    if row.get("description") and not is_generic_description(row.get("description")):
        s += 150
    if not sources.get("serpapi"):
        s += 200
    return int(s)


def pick_richer(a: Any, b: Any) -> Any:
    if a is None:
        return b
    if b is None:
        return a
    if isinstance(a, str) and isinstance(b, str):
        if is_generic_description(a) and not is_generic_description(b):
            return b
        if not is_generic_description(a) and is_generic_description(b):
            return a
        return b if len(b) > len(a) else a
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return max(a, b)
    return a


def merge_row_data(keeper: dict, donor: dict) -> dict:
    patch: dict[str, Any] = {}
    for field in (
        "phone", "website", "description", "our_story", "cultural_roots",
        "instagram_handle", "facebook_url", "external_avg_rating", "external_review_count",
    ):
        patch[field] = pick_richer(keeper.get(field), donor.get(field))

    kh = len(keeper.get("hours") or []) if isinstance(keeper.get("hours"), list) else 0
    dh = len(donor.get("hours") or []) if isinstance(donor.get("hours"), list) else 0
    if dh > kh:
        patch["hours"] = donor.get("hours")

    km = len((keeper.get("menu") or {}).keys()) if isinstance(keeper.get("menu"), dict) else 0
    dm = len((donor.get("menu") or {}).keys()) if isinstance(donor.get("menu"), dict) else 0
    if dm > km:
        patch["menu"] = donor.get("menu")

    sources = {**(donor.get("sources") or {}), **(keeper.get("sources") or {})}
    donor_pid = (donor.get("sources") or {}).get("google_place_id")
    if donor_pid and not sources.get("google_place_id"):
        sources["google_place_id"] = donor_pid
    patch["sources"] = sources
    return patch


def build_catalog_patch(catalog: dict) -> dict | None:
    addr = parse_address_line(catalog.get("address"))
    if not addr or not addr.get("street") or not addr.get("city"):
        return None

    hours = parse_catalog_hours(catalog.get("hours") or {})
    menu = {"highlights": catalog["menu_highlights"]} if catalog.get("menu_highlights") else None
    social = catalog.get("social") or {}

    address = dict(addr)
    if catalog.get("lat") is not None and catalog.get("lng") is not None:
        address["coordinates"] = {"lat": catalog["lat"], "lng": catalog["lng"]}

    images = catalog.get("images") if has_real_images(catalog.get("images")) else None

    return {
        "name": catalog["name"],
        "slug": catalog["id"],
        "cuisine_types": [x for x in [catalog.get("cuisine"), catalog.get("region")] if x],
        "address": address,
        "phone": catalog.get("phone") or None,
        "website": catalog.get("website") or None,
        "instagram_handle": normalize_instagram(social.get("instagram")),
        "facebook_url": normalize_facebook(social.get("facebook")),
        "price_range": parse_price_range(catalog.get("price_range")),
        "description": catalog.get("about") or None,
        "our_story": catalog.get("our_story") or None,
        "cultural_roots": catalog.get("cultural_roots") or None,
        "menu": menu,
        "hours": hours if hours else None,
        "images": images,
        "external_avg_rating": catalog.get("rating") if isinstance(catalog.get("rating"), (int, float)) else None,
        "sources": {
            "catalog_id": catalog["id"],
            "catalog": True,
            **({"google_place_id": catalog["google_place_id"]} if catalog.get("google_place_id") else {}),
        },
        "is_active": bool(catalog.get("phone") and addr.get("street") and addr.get("city")),
    }


def apply_catalog_enrichment(row: dict, catalog: dict) -> dict:
    patch = build_catalog_patch(catalog)
    if not patch:
        return {}

    out: dict[str, Any] = {}
    for k, v in patch.items():
        if k in ("slug", "is_active"):
            continue
        if v is None:
            continue

        if k == "description" and row.get("description") and not is_generic_description(row.get("description")):
            continue
        if k == "hours" and isinstance(row.get("hours"), list) and len(row["hours"]) > 0:
            continue
        if k == "our_story":
            cat_story = catalog.get("our_story") or ""
            if cat_story and (not row.get("our_story") or len(row["our_story"]) < len(cat_story)):
                out["our_story"] = cat_story
            continue
        if k == "cultural_roots":
            cat_roots = catalog.get("cultural_roots") or ""
            if cat_roots and (not row.get("cultural_roots") or len(row["cultural_roots"]) < len(cat_roots)):
                out["cultural_roots"] = cat_roots
            continue
        if k == "menu" and row.get("menu") and len(row["menu"]) > 0:
            continue
        if k == "phone" and row.get("phone") and row["phone"] != "000-000-0000":
            continue
        if k == "website" and row.get("website"):
            continue
        if k == "images" and has_real_images(row.get("images")):
            continue

        out[k] = v

    out["sources"] = {
        **(row.get("sources") or {}),
        **(patch.get("sources") or {}),
        "catalog_id": catalog["id"],
        "catalog": True,
    }
    if patch.get("is_active"):
        out["is_active"] = True
    return out


class SupabaseClient:
    def __init__(self, url: str, key: str) -> None:
        self.url = url.rstrip("/")
        self.key = key

    def _request(
        self,
        method: str,
        path: str,
        body: Any | None = None,
        prefer: str | None = None,
    ) -> tuple[int, Any]:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(f"{self.url}{path}", data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(detail)
            except json.JSONDecodeError:
                parsed = {"message": detail[:500]}
            raise RuntimeError(f"HTTP {exc.code} {method} {path}: {parsed}") from exc

    def fetch_restaurants(self) -> list[dict]:
        fields = (
            "id,owner_id,name,slug,cuisine_types,address,display_city,phone,website,"
            "instagram_handle,facebook_url,price_range,description,our_story,cultural_roots,"
            "menu,hours,images,external_avg_rating,external_review_count,sources,is_active,created_at"
        )
        status, data = self._request("GET", f"/rest/v1/restaurants?select={fields}&limit=2000")
        if status != 200 or not isinstance(data, list):
            raise RuntimeError("Failed to fetch restaurants")
        return data

    def update_restaurant(self, row_id: str, patch: dict) -> None:
        q = urllib.parse.quote(row_id, safe="")
        self._request("PATCH", f"/rest/v1/restaurants?id=eq.{q}", patch, prefer="return=minimal")

    def delete_restaurant_cascade(self, row_id: str) -> None:
        q = urllib.parse.quote(row_id, safe="")
        for table, col in (
            ("restaurant_tables", "restaurant_id"),
            ("availability_settings", "restaurant_id"),
            ("reservations", "restaurant_id"),
            ("reviews", "restaurant_id"),
        ):
            self._request("DELETE", f"/rest/v1/{table}?{col}=eq.{q}", prefer="return=minimal")
        self._request("DELETE", f"/rest/v1/restaurants?id=eq.{q}", prefer="return=minimal")

    def count_restaurants(self, active_only: bool = False) -> int:
        path = "/rest/v1/restaurants?select=id"
        if active_only:
            path += "&is_active=eq.true"
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Prefer": "count=exact",
            "Range": "0-0",
        }
        req = urllib.request.Request(f"{self.url}{path}", method="HEAD", headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            cr = resp.headers.get("Content-Range", "")
            m = re.search(r"/(\d+)$", cr)
            return int(m.group(1)) if m else 0

    def upsert_profile(self, owner_id: str, name: str, phone: str | None) -> None:
        self._request(
            "POST",
            "/rest/v1/profiles?on_conflict=id",
            {
                "id": owner_id,
                "full_name": f"{name} Owner",
                "role": "restaurant_owner",
                "phone": phone,
            },
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def insert_restaurant(self, payload: dict) -> dict:
        _, data = self._request("POST", "/rest/v1/restaurants", payload, prefer="return=representation")
        if isinstance(data, list) and data:
            return data[0]
        if isinstance(data, dict):
            return data
        raise RuntimeError("Insert restaurant returned unexpected payload")

    def seed_tables_and_availability(self, restaurant_id: str, hours: list) -> None:
        q = urllib.parse.quote(restaurant_id, safe="")
        self._request("DELETE", f"/rest/v1/restaurant_tables?restaurant_id=eq.{q}", prefer="return=minimal")
        rows = [{"restaurant_id": restaurant_id, **t, "is_active": True} for t in DEFAULT_TABLES]
        self._request("POST", "/rest/v1/restaurant_tables", rows, prefer="return=minimal")
        self._request(
            "POST",
            "/rest/v1/availability_settings?on_conflict=restaurant_id",
            {
                "restaurant_id": restaurant_id,
                "slot_duration_minutes": 90,
                "advance_booking_days": 30,
                "same_day_cutoff_hours": 2,
                "max_party_size": 20,
                "operating_hours": hours or [],
            },
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def list_users(self, page: int = 1) -> list[dict]:
        _, data = self._request("GET", f"/auth/v1/admin/users?page={page}&per_page=200")
        return (data or {}).get("users") or []

    def find_user_by_email(self, email: str) -> str | None:
        target = email.lower()
        for page in range(1, 21):
            users = self.list_users(page)
            for u in users:
                if (u.get("email") or "").lower() == target:
                    return u.get("id")
            if len(users) < 200:
                break
        return None

    def create_owner(self, slug: str, name: str, phone: str | None) -> tuple[str, str, str | None]:
        chars = string.ascii_letters + string.digits + "!@#$%"
        base_email = re.sub(r"[^a-z0-9@._+-]", "", f"{slug}@owners.afri-table.com")
        for attempt in range(5):
            email = base_email if attempt == 0 else f"{slug}-{secrets.token_hex(2)}@owners.afri-table.com"
            password = "".join(secrets.choice(chars) for _ in range(16))
            try:
                _, data = self._request(
                    "POST",
                    "/auth/v1/admin/users",
                    {
                        "email": email,
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": f"{name} Owner",
                            "role": "restaurant_owner",
                            "phone": phone,
                        },
                    },
                )
                user_id = (data or {}).get("id") or ((data or {}).get("user") or {}).get("id")
                if user_id:
                    return user_id, email, password
            except RuntimeError as err:
                if "already" in str(err).lower():
                    existing = self.find_user_by_email(email)
                    if existing:
                        return existing, email, None
                if attempt == 4:
                    raise
        raise RuntimeError(f"Could not create/find owner for {name}")


def generate_password() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    return "".join(secrets.choice(chars) for _ in range(16))


def consolidate(client: SupabaseClient, catalog: list[dict], dry_run: bool) -> dict:
    catalog_by_id = {c["id"]: c for c in catalog}
    catalog_by_fp: dict[str, dict] = {}
    for c in catalog:
        fp = catalog_fingerprint(c)
        if fp:
            catalog_by_fp[fp] = c

    rows = client.fetch_restaurants()
    report: dict[str, Any] = {
        "dryRun": dry_run,
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "mergedGroups": [],
        "deleted": [],
        "slugRenamed": [],
        "enriched": 0,
        "activated": 0,
        "inserted": [],
        "imagesSynced": 0,
        "errors": [],
    }

    by_fp: dict[str, list[dict]] = {}
    by_place_id: dict[str, list[dict]] = {}
    for r in rows:
        fp = address_fingerprint_from_obj(r.get("address"))
        if fp:
            by_fp.setdefault(fp, []).append(r)
        pid = (r.get("sources") or {}).get("google_place_id")
        if pid:
            by_place_id.setdefault(pid, []).append(r)

    delete_ids: set[str] = set()
    pending_updates: dict[str, dict] = {}

    def schedule_update(row_id: str, patch: dict) -> None:
        cur = pending_updates.get(row_id, {})
        merged = {**cur, **patch}
        if "sources" in cur or "sources" in patch:
            merged["sources"] = {**(cur.get("sources") or {}), **(patch.get("sources") or {})}
        pending_updates[row_id] = merged

    def resolve_group(group: list[dict], reason: str) -> None:
        if len(group) < 2:
            return

        fps = {address_fingerprint_from_obj(r.get("address")) for r in group}
        catalog_entry = next((catalog_by_fp.get(fp) for fp in fps if catalog_by_fp.get(fp)), None)
        if not catalog_entry:
            for r in group:
                catalog_entry = catalog_by_id.get(r.get("slug")) or catalog_by_id.get((r.get("sources") or {}).get("catalog_id"))
                if catalog_entry:
                    break

        canonical_slug = catalog_entry["id"] if catalog_entry else sorted(group, key=lambda r: score_row(r, ""), reverse=True)[0]["slug"]
        sorted_group = sorted(group, key=lambda r: score_row(r, canonical_slug), reverse=True)
        keeper = deepcopy(sorted_group[0])

        for donor in sorted_group[1:]:
            if donor["id"] in delete_ids:
                continue
            merged = merge_row_data(keeper, donor)
            schedule_update(keeper["id"], merged)
            keeper = {**keeper, **merged}
            delete_ids.add(donor["id"])
            report["deleted"].append({"slug": donor["slug"], "keeper": keeper["slug"], "reason": reason})

        if catalog_entry:
            schedule_update(keeper["id"], apply_catalog_enrichment(keeper, catalog_entry))

        if keeper["slug"] != canonical_slug:
            taken = next(
                (r for r in rows if r["slug"] == canonical_slug and r["id"] != keeper["id"] and r["id"] not in delete_ids),
                None,
            )
            if taken:
                merged = merge_row_data(keeper, taken)
                schedule_update(keeper["id"], merged)
                keeper = {**keeper, **merged}
                delete_ids.add(taken["id"])
                report["deleted"].append({"slug": taken["slug"], "keeper": keeper["slug"], "reason": "slug-collision"})
            report["slugRenamed"].append({"from": keeper["slug"], "to": canonical_slug})
            schedule_update(keeper["id"], {"slug": canonical_slug})
            keeper["slug"] = canonical_slug

        report["mergedGroups"].append({
            "reason": reason,
            "canonicalSlug": canonical_slug,
            "kept": keeper["slug"],
            "removed": [g["slug"] for g in group if g["id"] in delete_ids],
        })

    for fp, group in by_fp.items():
        live = [g for g in group if g["id"] not in delete_ids]
        if len(live) > 1:
            resolve_group(live, f"address:{fp}")

    for pid, group in by_place_id.items():
        live = [g for g in group if g["id"] not in delete_ids]
        if len(live) > 1:
            resolve_group(live, f"place_id:{pid}")

    if not dry_run:
        for row_id, patch in pending_updates.items():
            try:
                client.update_restaurant(row_id, patch)
            except RuntimeError as err:
                report["errors"].append({"id": row_id, "message": str(err)})

        for del_id in delete_ids:
            row = next((r for r in rows if r["id"] == del_id), None)
            try:
                client.delete_restaurant_cascade(del_id)
            except RuntimeError as err:
                report["errors"].append({"slug": row["slug"] if row else del_id, "message": str(err)})

    refreshed = client.fetch_restaurants() if not dry_run else rows
    slug_taken = {r["slug"] for r in refreshed if r["id"] not in delete_ids}

    for row in refreshed:
        if row["id"] in delete_ids:
            continue
        catalog_entry = (
            catalog_by_id.get(row["slug"])
            or catalog_by_id.get((row.get("sources") or {}).get("catalog_id"))
            or catalog_by_fp.get(address_fingerprint_from_obj(row.get("address")))
        )
        if not catalog_entry:
            continue

        if row["slug"] != catalog_entry["id"] and catalog_entry["id"] not in slug_taken:
            report["slugRenamed"].append({"from": row["slug"], "to": catalog_entry["id"]})
            slug_taken.discard(row["slug"])
            slug_taken.add(catalog_entry["id"])
            if not dry_run:
                try:
                    client.update_restaurant(row["id"], {"slug": catalog_entry["id"]})
                    row["slug"] = catalog_entry["id"]
                except RuntimeError as err:
                    report["errors"].append({"slug": row["slug"], "message": str(err)})
                    slug_taken.add(row["slug"])
                    slug_taken.discard(catalog_entry["id"])
                    continue
            else:
                row["slug"] = catalog_entry["id"]

        patch = apply_catalog_enrichment(row, catalog_entry)
        if not patch:
            continue
        report["enriched"] += 1
        if patch.get("is_active") and not row.get("is_active"):
            report["activated"] += 1
        if not dry_run:
            try:
                client.update_restaurant(row["id"], patch)
            except RuntimeError as err:
                report["errors"].append({"slug": row["slug"], "message": str(err)})

    live_rows = [r for r in refreshed if r["id"] not in delete_ids]
    missing = [
        c["id"]
        for c in catalog
        if not any(r["slug"] == c["id"] or (r.get("sources") or {}).get("catalog_id") == c["id"] for r in live_rows)
    ]
    report["missingCatalogIdsBeforeInsert"] = missing

    cred_lines: list[str] = []
    for catalog_id in missing:
        c = catalog_by_id[catalog_id]
        patch = build_catalog_patch(c)
        if not patch:
            report["errors"].append({"slug": catalog_id, "message": "Could not build catalog patch (address?)"})
            continue

        if dry_run:
            report["inserted"].append({"slug": catalog_id, "dry_run": True})
            continue

        try:
            owner_id, email, password = client.create_owner(catalog_id, c["name"], patch.get("phone"))
            client.upsert_profile(owner_id, c["name"], patch.get("phone"))
            insert_payload = {
                "owner_id": owner_id,
                "name": patch["name"],
                "slug": patch["slug"],
                "cuisine_types": patch["cuisine_types"],
                "address": patch["address"],
                "phone": patch.get("phone"),
                "website": patch.get("website"),
                "instagram_handle": patch.get("instagram_handle"),
                "facebook_url": patch.get("facebook_url"),
                "external_avg_rating": patch.get("external_avg_rating"),
                "description": patch.get("description"),
                "our_story": patch.get("our_story"),
                "cultural_roots": patch.get("cultural_roots"),
                "price_range": patch["price_range"],
                "hours": patch.get("hours") or [],
                "menu": patch.get("menu"),
                "images": patch.get("images") or [],
                "sources": patch.get("sources") or {},
                "is_active": patch.get("is_active", False),
            }
            inserted = client.insert_restaurant(insert_payload)
            client.seed_tables_and_availability(inserted["id"], patch.get("hours") or [])
            report["inserted"].append({"slug": catalog_id, "id": inserted["id"]})
            cred_lines.append(f"{c['name']}\nEmail: {email}\nPassword: {password or '(existing user)'}\nSlug: {catalog_id}\n")
        except RuntimeError as err:
            report["errors"].append({"slug": catalog_id, "message": str(err)})

    if cred_lines and not dry_run:
        with CREDENTIALS_PATH.open("a", encoding="utf-8") as fh:
            fh.write("\n".join(cred_lines) + "\n")

    final_rows = client.fetch_restaurants()
    final_slugs = {r["slug"] for r in final_rows}
    for c in catalog:
        if not has_real_images(c.get("images")):
            continue
        if c["id"] not in final_slugs:
            continue
        if dry_run:
            report["imagesSynced"] += 1
            continue
        try:
            client.update_restaurant(
                next(r["id"] for r in final_rows if r["slug"] == c["id"]),
                {"images": c["images"]},
            )
            report["imagesSynced"] += 1
        except RuntimeError as err:
            report["errors"].append({"slug": c["id"], "message": f"image sync: {err}"})

    report["missingCatalogIds"] = [
        c["id"]
        for c in catalog
        if c["id"] not in {r["slug"] for r in final_rows}
        and c["id"] not in {(r.get("sources") or {}).get("catalog_id") for r in final_rows}
    ]
    report["finishedAt"] = datetime.now(timezone.utc).isoformat()
    report["finalTotal"] = client.count_restaurants()
    report["finalActive"] = client.count_restaurants(active_only=True)
    report["catalogTotal"] = len(catalog)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Full catalog → Supabase sync")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") or ""
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not key:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    client = SupabaseClient(url, key)

    print("Full catalog → Supabase sync\n")
    print(f"  Catalog rows: {len(catalog)}")
    print(f"  Dry run:      {'yes' if args.dry_run else 'no'}\n")

    report = consolidate(client, catalog, args.dry_run)

    print("DRY RUN — no writes" if args.dry_run else "Sync complete")
    print(f"  Merged groups:   {len(report['mergedGroups'])}")
    print(f"  Deleted dupes:   {len(report['deleted'])}")
    print(f"  Slug renames:    {len(report['slugRenamed'])}")
    print(f"  Enriched:        {report['enriched']}")
    print(f"  Activated:       {report['activated']}")
    print(f"  Inserted:        {len(report['inserted'])}")
    print(f"  Images synced:   {report['imagesSynced']}")
    print(f"  DB total:        {report['finalTotal']} ({report['finalActive']} active)")
    print(f"  Still missing:   {len(report['missingCatalogIds'])}")
    print(f"  Report:          {REPORT_PATH}")
    if report["errors"]:
        print(f"  Errors:          {len(report['errors'])}")
        for err in report["errors"][:10]:
            print(f"    - {err}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

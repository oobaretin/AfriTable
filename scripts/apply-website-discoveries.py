#!/usr/bin/env python3
"""Apply manually verified website discoveries from data/catalog-website-discoveries.json."""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
DISCOVERIES_PATH = ROOT / "data" / "catalog-website-discoveries.json"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
SESSION_ID = "3435b4"
USER_AGENT = "Mozilla/5.0 (compatible; AfriTable/1.0)"


def audit_log(message: str, data: dict, hypothesis_id: str = "website-apply") -> None:
    line = json.dumps({
        "sessionId": SESSION_ID,
        "runId": "website-apply",
        "hypothesisId": hypothesis_id,
        "location": "apply-website-discoveries.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    })
    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a") as f:
            f.write(line + "\n")
    except OSError:
        pass


def check_website(url: str) -> bool:
    bases = [url if url.startswith("http") else f"https://{url}"]
    try:
        u = urllib.parse.urlparse(bases[0])
        if u.hostname and not u.hostname.startswith("www."):
            bases.append(f"{u.scheme}://www.{u.hostname}{u.path or ''}")
    except Exception:
        pass
    for target in bases:
        try:
            req = urllib.request.Request(target, headers={"User-Agent": USER_AGENT}, method="GET")
            with urllib.request.urlopen(req, timeout=12) as resp:
                if 200 <= resp.status < 400:
                    return True
        except Exception:
            continue
    return False


def google_search_url(name: str, address_line: str) -> str:
    query = ", ".join(x for x in [name, address_line] if x)
    return f"https://www.google.com/search?q={urllib.parse.quote(query)}"


def main() -> None:
    discoveries = json.loads(DISCOVERIES_PATH.read_text())
    catalog = json.loads(CATALOG_PATH.read_text())
    by_id = {r["id"]: r for r in catalog}

    applied = 0
    skipped = 0
    failed = 0

    for slug, website in discoveries.items():
        entry = by_id.get(slug)
        if not entry:
            skipped += 1
            audit_log("missing slug", {"slug": slug})
            continue
        if str(entry.get("website") or "").strip():
            skipped += 1
            continue
        if not check_website(website):
            failed += 1
            audit_log("unreachable", {"slug": slug, "website": website}, "failed")
            continue
        entry["website"] = website
        entry["google_search_url"] = google_search_url(entry["name"], str(entry.get("address") or ""))
        applied += 1
        audit_log("applied", {"slug": slug, "website": website}, "success")

    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n")

    missing_after = sum(1 for r in catalog if not str(r.get("website") or "").strip())
    stats = {"applied": applied, "skipped": skipped, "failed": failed, "missingAfter": missing_after}
    audit_log("apply complete", stats, "summary")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()

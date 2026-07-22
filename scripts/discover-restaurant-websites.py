#!/usr/bin/env python3
"""
Discover missing restaurant websites via SerpAPI Google search (with DDG/Bing fallback).

Usage:
  python3 scripts/discover-restaurant-websites.py [--dry-run] [--only-missing] [--limit=30]
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "discover-websites-report.json"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
SESSION_ID = "3435b4"

BLOCKED_HOST_PATTERNS = [
    "google.", "goo.gl", "googleusercontent", "maps.", "yelp.", "tripadvisor.",
    "facebook.", "instagram.", "doordash.", "ubereats.", "grubhub.", "opentable.",
    "resy.com", "res-menu.net", "allmenus.", "menupix.", "zmenu.", "menuworld.",
    "yellowpages.", "bbb.org", "wikipedia.", "linkedin.", "youtube.", "tiktok.",
    "twitter.", "x.com", "duckduckgo.", "bing.", "postmates.", "seamless.",
    "foursquare.", "mapquest.", "wheree.", "restaurantguru.", "restaurantji.",
    "zomato.", "singleplatform.", "loc8nearme.", "niche.com", "andbeaches.com",
    "visit", "destinations.", "explore", "dynamicafrican.", "alltrails.",
    "eventbrite.", "wherevi.com", "wheree.com", "agncy.dev", "ubuntu.com",
    "communityliving.", "visitwindsor", "visitwindsoressex",
]

GENERIC_WORDS = {
    "the", "and", "bar", "grill", "cafe", "kitchen", "restaurant", "house", "place", "food",
    "african", "caribbean", "ethiopian", "nigerian", "jamaican", "international", "cuisine",
    "rice", "soul", "taste", "halal", "store", "shop", "master", "traditional", "unique",
    "golden", "little", "east", "west", "north", "south",
}

ETHNICITY_ONLY = {
    "somali", "ethiopian", "nigerian", "ghanaian", "jamaican", "liberian", "kenyan", "ivorian",
    "senegalese", "congolese", "ugandan", "tanzanian", "moroccan", "egyptian", "haitian",
    "caribbean", "african",
}

USER_AGENT = "Mozilla/5.0 (compatible; AfriTable/1.0)"


def audit_log(message: str, data: dict, hypothesis_id: str = "discover") -> None:
    line = json.dumps({
        "sessionId": SESSION_ID,
        "runId": "website-discovery",
        "hypothesisId": hypothesis_id,
        "location": "discover-restaurant-websites.py",
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


def load_env_local() -> dict[str, str]:
    env: dict[str, str] = {}
    path = ROOT / ".env.local"
    if not path.exists():
        return env
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        env[key.strip()] = val.strip().strip('"').strip("'")
    return env


def short_brand_name(name: str) -> str:
    return re.sub(
        r"\s+(restaurant|kitchen|cafe|grill|bar|lounge|eatery|bistro|and\s+bar|no\s+dine.+)$",
        "",
        name,
        flags=re.I,
    ).strip()


def build_queries(name: str, address_line: str = "") -> list[str]:
    parts = [p.strip() for p in address_line.split(",") if p.strip()]
    city_state = " ".join(parts[-2:]) if len(parts) >= 2 else address_line
    city = parts[-2] if len(parts) >= 2 else (parts[0] if parts else "")
    short = short_brand_name(name)
    queries = [
        f"{name} restaurant {city_state}",
        f"{short} {city} restaurant website",
        f"{short} restaurant {city_state}",
        f"{name} {city} official website",
        f"{name} {city_state}",
    ]
    if re.search(r"\bTX\b|Texas", address_line, re.I):
        queries.extend([f"{short} {city} restauranttx", f"{short} restaurant texas website"])
    seen: set[str] = set()
    out: list[str] = []
    for q in queries:
        q = re.sub(r"\s+", " ", q).strip()
        if q and q not in seen:
            seen.add(q)
            out.append(q)
    return out


def host_blocked(host: str, pattern: str) -> bool:
    key = pattern.rstrip(".")
    if key == "x.com":
        return host in ("x.com", "www.x.com")
    if key == "visit":
        return host.startswith("visit.") or ".visit." in host
    return key in host


def is_blocked_url(url: str) -> bool:
    try:
        u = urllib.parse.urlparse(url if url.startswith("http") else f"https://{url}")
        host = u.hostname.lower() if u.hostname else ""
        if any(host_blocked(host, p) for p in BLOCKED_HOST_PATTERNS):
            return True
        if re.search(r"/(menu|order|delivery|reviews?|listing)", u.path, re.I) and re.search(
            r"menu|order", u.path, re.I
        ):
            return True
        return False
    except Exception:
        return True


def name_tokens(name: str) -> list[str]:
    tokens = re.sub(r"['']", "", name.lower())
    tokens = re.sub(r"[^a-z0-9]+", " ", tokens).split()
    return [t for t in tokens if len(t) > 2 and t not in GENERIC_WORDS]


def token_matches_host(token: str, host_compact: str) -> bool:
    if len(token) >= 4 and token in host_compact:
        return True
    if re.match(r"^ababa$", token, re.I) and re.search(r"abeba|ababa", host_compact):
        return True
    if re.match(r"^abeba$", token, re.I) and re.search(r"abeba|ababa", host_compact):
        return True
    return False


def host_matches_name(host: str, restaurant_name: str) -> bool:
    host_compact = re.sub(r"^www\.", "", host.lower())
    host_compact = re.sub(r"[^a-z0-9]", "", host_compact)
    tokens = name_tokens(restaurant_name)
    weak_single = {"rice", "soul", "food", "taste", "halal", "store", "shop", "gold", "east", "west"}
    if tokens:
        matched = [t for t in tokens if len(t) >= 4 and token_matches_host(t, host_compact)]
        if len(matched) >= 2:
            return True
        if len(matched) == 1:
            t = matched[0]
            if t in weak_single or t in ETHNICITY_ONLY:
                return False
            return True
    if "store" in host_compact and not re.search(r"store|shop", restaurant_name, re.I):
        return False
    compact = re.sub(r"[^a-z0-9]", "", restaurant_name.lower())
    return len(compact) >= 6 and compact[:8] in host_compact


def score_candidate(url: str, restaurant_name: str) -> int:
    if is_blocked_url(url):
        return -1000
    try:
        u = urllib.parse.urlparse(url if url.startswith("http") else f"https://{url}")
        host = re.sub(r"^www\.", "", (u.hostname or "").lower())
        if not host_matches_name(host, restaurant_name):
            return -500
        score = 10
        for t in name_tokens(restaurant_name):
            if t in host:
                score += 30
            elif len(t) >= 5 and t[:5] in host:
                score += 15
        if re.search(r"\.(com|net|org|co|us|shop)$", host, re.I):
            score += 8
        if re.search(r"menu|res-menu|allmenus|order-online", url, re.I):
            score -= 35
        if u.path in ("", "/") or len(u.path) < 20:
            score += 5
        return score
    except Exception:
        return -1000


def pick_best(candidates: list[str], restaurant_name: str) -> str | None:
    best: tuple[str, int] | None = None
    seen: set[str] = set()
    for raw in candidates:
        url = raw.strip()
        if not url or url in seen:
            continue
        seen.add(url)
        score = score_candidate(url, restaurant_name)
        if score < 5:
            continue
        if not best or score > best[1]:
            best = (url, score)
    if not best:
        return None
    u = urllib.parse.urlparse(best[0] if best[0].startswith("http") else f"https://{best[0]}")
    return f"{u.scheme}://{u.hostname}"


def fetch_url(url: str, timeout: int = 25) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def discover_serpapi(query: str, api_key: str) -> tuple[list[str], str | None]:
    params = urllib.parse.urlencode({"engine": "google", "q": query, "api_key": api_key, "num": 8})
    url = f"https://serpapi.com/search.json?{params}"
    try:
        with urllib.request.urlopen(
            urllib.request.Request(url, headers={"User-Agent": USER_AGENT}),
            timeout=30,
        ) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if "run out of searches" in body.lower():
            return [], "serpapi_quota"
        return [], str(e)
    except Exception as e:
        return [], str(e)

    if data.get("error"):
        err = str(data["error"])
        if "run out of searches" in err.lower():
            return [], "serpapi_quota"
        return [], err

    urls: list[str] = []
    kg = data.get("knowledge_graph") or {}
    if kg.get("website"):
        urls.append(kg["website"])
    for row in data.get("organic_results") or []:
        if row.get("link"):
            urls.append(row["link"])
    return urls, None


def discover_ddg(query: str) -> list[str]:
    q = urllib.parse.quote(query)
    html = fetch_url(f"https://html.duckduckgo.com/html/?q={q}", timeout=20)
    urls: list[str] = []
    for m in re.finditer(r"uddg=([^&\"'<>]+)", html):
        try:
            urls.append(urllib.parse.unquote(m.group(1)))
        except Exception:
            pass
    for m in re.finditer(r'class="result__a"[^>]*href="([^"]+)"', html):
        href = m.group(1)
        if href.startswith("http"):
            urls.append(href)
    return urls


def discover_bing(query: str) -> list[str]:
    q = urllib.parse.quote(query)
    html = fetch_url(f"https://www.bing.com/search?q={q}", timeout=20)
    return [m.group(1) for m in re.finditer(r'<li class="b_algo"[\s\S]*?<a href="(https?://[^"]+)"', html, re.I)]


def discover_website(name: str, address_line: str, serp_key: str | None) -> dict:
    queries = build_queries(name, address_line)
    candidates: list[str] = []
    source = "none"
    used_query = queries[0]
    quota_hit = False

    for query in queries:
        batch: list[str] = []
        if serp_key and not quota_hit:
            urls, err = discover_serpapi(query, serp_key)
            if err == "serpapi_quota":
                quota_hit = True
            elif urls:
                batch = urls
                source = "serpapi_google"

        if not batch:
            try:
                batch = discover_ddg(query)
                if batch:
                    source = "duckduckgo"
            except Exception:
                batch = []

        if not batch:
            try:
                batch = discover_bing(query)
                if batch:
                    source = "bing"
            except Exception:
                batch = []

        if batch:
            candidates.extend(batch)
            used_query = query
            website = pick_best(candidates, name)
            if website:
                return {
                    "website": website,
                    "source": source,
                    "candidates": len(candidates),
                    "query": used_query,
                    "quota_hit": quota_hit,
                }
        time.sleep(0.8)

    return {
        "website": pick_best(candidates, name),
        "source": source,
        "candidates": len(candidates),
        "query": used_query,
        "quota_hit": quota_hit,
    }


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


def needs_discovery(entry: dict) -> bool:
    website = str(entry.get("website") or "").strip()
    if not website or website == "N/A":
        return True
    try:
        host = urllib.parse.urlparse(website if website.startswith("http") else f"https://{website}").hostname or ""
        return not host_matches_name(host, entry["name"])
    except Exception:
        return True


def save_progress(catalog: list, report: dict, dry_run: bool) -> None:
    if not dry_run:
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n")
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n")


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    only_missing = "--only-missing" in sys.argv or "--needs-website" in sys.argv
    no_serp = "--no-serpapi" in sys.argv
    limit = float("inf")
    for arg in sys.argv:
        if arg.startswith("--limit="):
            limit = int(arg.split("=", 1)[1])

    env = load_env_local()
    serp_key = None if no_serp else env.get("SERPAPI_KEY")

    catalog = json.loads(CATALOG_PATH.read_text())
    targets = [r for r in catalog if (needs_discovery(r) if only_missing else True)]

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dryRun": dry_run,
        "serpApiUsed": bool(serp_key),
        "processed": 0,
        "discovered": 0,
        "validated": 0,
        "failed": 0,
        "results": [],
    }

    audit_log("discovery start", {
        "targets": len(targets),
        "limit": limit if limit != float("inf") else None,
        "serpApiUsed": bool(serp_key),
        "dryRun": dry_run,
    })

    print(f"Discovering websites for {min(int(limit), len(targets))} / {len(targets)} restaurants…")
    print(f"SerpAPI: {'yes' if serp_key else 'no'}\n")

    quota_exhausted = False

    for entry in targets:
        if report["processed"] >= limit:
            break
        if quota_exhausted and not serp_key:
            break

        name = entry["name"]
        address_line = str(entry.get("address") or "").strip()
        previous_website = entry.get("website")

        print(f"[{report['processed'] + 1}] {name}")
        report["processed"] += 1
        row: dict = {"slug": entry["id"], "name": name, "source": "pending", "candidates": 0}

        try:
            result = discover_website(name, address_line, serp_key if not quota_exhausted else None)
            if result.get("quota_hit"):
                quota_exhausted = True
                audit_log("serpapi quota hit", {"slug": entry["id"]}, "quota")

            row["source"] = result["source"]
            row["candidates"] = result["candidates"]
            row["search_query"] = result.get("query")

            website = result.get("website")
            if not website:
                report["failed"] += 1
                row["status"] = "not_found"
                print("  ⚠️  No website candidate\n")
                report["results"].append(row)
                audit_log("not found", {"slug": entry["id"], "name": name, "source": result["source"]})
                if not entry.get("website") and previous_website:
                    entry["website"] = previous_website
                time.sleep(2.2)
                save_progress(catalog, report, dry_run)
                continue

            ok = check_website(website)
            row["discovered_url"] = website
            row["http_ok"] = ok

            if ok:
                report["discovered"] += 1
                report["validated"] += 1
                row["status"] = "ok"
                entry["website"] = website
                entry["google_search_url"] = google_search_url(name, address_line)
                print(f"  ✅ {website} ({result['source']})\n")
                audit_log("discovered", {"slug": entry["id"], "website": website, "source": result["source"]}, "success")
            else:
                report["failed"] += 1
                row["status"] = "unreachable"
                print(f"  ❌ Found but unreachable: {website}\n")
                audit_log("unreachable", {"slug": entry["id"], "website": website})

            report["results"].append(row)
        except Exception as e:
            report["failed"] += 1
            row["status"] = "error"
            row["error"] = str(e)
            print(f"  ❌ Search error: {e}\n")
            report["results"].append(row)
            audit_log("error", {"slug": entry["id"], "error": str(e)}, "error")

        if not entry.get("website") and previous_website:
            entry["website"] = previous_website

        time.sleep(2.2)
        save_progress(catalog, report, dry_run)

    save_progress(catalog, report, dry_run)
    audit_log("discovery complete", {
        "processed": report["processed"],
        "discovered": report["validated"],
        "failed": report["failed"],
    }, "summary")

    print("Website discovery complete")
    print(f"  Processed:   {report['processed']}")
    print(f"  Discovered:  {report['validated']}")
    print(f"  Not found:   {report['failed']}")
    print(f"  Report:      {REPORT_PATH}")
    if dry_run:
        print("\nDRY RUN — catalog not saved")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

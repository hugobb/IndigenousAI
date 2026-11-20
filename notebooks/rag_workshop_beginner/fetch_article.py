"""Fetch the notebook document: a shortened, pinned revision of a Wikipedia article.

Re-runnable: `python fetch_article.py` rewrites documents/2026_world_cup_final.txt
from the pinned revision below. Pass --latest to pin the current revision instead.
Text is available under CC BY-SA 4.0.
"""
import argparse
import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

TITLE = "2026 FIFA World Cup final"
PINNED_REVID = 1385698804  # revision of 2026-11-14T20:15:15Z
API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "rag-workshop-notebook/1.0"
OUT = Path(__file__).resolve().parent / "documents" / "2026_world_cup_final.txt"

# Sections kept, in article order: heading -> max paragraphs (None = all).
# Everything else (venue, pre-match, entertainment, tables, lists, references) is dropped.
KEEP = {
    "Background": None,
    "Route to the final": None,
    "Spain": 1,
    "Argentina": 1,
    "Match": None,
    "First half": None,
    "Second half": None,
    "Extra time": None,
    "Post-match": None,
}


def api(**params: str | int) -> dict:
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def latest_revid() -> int:
    d = api(action="query", titles=TITLE, prop="revisions", rvprop="ids|timestamp")
    return d["query"]["pages"][0]["revisions"][0]["revid"]


def fetch_extract(revid: int) -> str:
    d = api(action="query", revids=revid, prop="extracts", explaintext=1, exsectionformat="wiki")
    return d["query"]["pages"][0]["extract"]


# An image placed between two sentences in the wikitext is dropped from the extract and glues
# the sentences together ("saved with a dive.In the 80th minute"). Put the space back.
GLUED = re.compile(r"(?<=[a-z][.!?])(?=[A-Z][a-z])")


def paragraphs(block: str) -> list[str]:
    return [GLUED.sub(" ", re.sub(r"\s+", " ", p).strip()) for p in block.split("\n") if p.strip()]


def shorten(extract: str) -> tuple[str, list[str]]:
    parts = re.split(r"^(==+) (.+?) \1$", extract, flags=re.M)
    out = [*paragraphs(parts[0])]
    log = ["Lead: kept"]
    seen = set()
    for i in range(1, len(parts), 3):
        level, name, body = parts[i], parts[i + 1], paragraphs(parts[i + 2])
        if name in KEEP:
            limit = KEEP[name]
            kept = body if limit is None else body[:limit]
            out.append(f"{level} {name} {level}")
            out.extend(kept)
            seen.add(name)
            log.append(f"{level} {name}: kept {len(kept)}/{len(body)} paragraphs")
        else:
            log.append(f"{level} {name}: dropped")
    missing = set(KEEP) - seen
    if missing:
        raise SystemExit(f"Sections not found in revision: {sorted(missing)}")
    return "\n\n".join(out), log


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--latest", action="store_true", help="pin the current revision")
    revid = latest_revid() if ap.parse_args().latest else PINNED_REVID
    text, log = shorten(fetch_extract(revid))
    header = "\n".join([
        f"Title: {TITLE} (Wikipedia)",
        f"Source: https://en.wikipedia.org/w/index.php?title={TITLE.replace(' ', '_')}&oldid={revid}",
        f"Retrieved: {datetime.date.today().isoformat()}",
        "License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/",
        "Shortened: some sections removed.",
    ])
    OUT.write_text(header + "\n\n" + text + "\n", encoding="utf-8")
    print(f"Revision {revid}\n" + "\n".join(log))
    print(f"Wrote {OUT} ({len(text.split())} words of article text)")


if __name__ == "__main__":
    main()

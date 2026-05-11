#!/usr/bin/env python3
"""Run JobSpy searches from scan-config.json and print JSON records to stdout."""

from __future__ import annotations

import contextlib
import json
import sys
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def load_jobspy():
    try:
        from jobspy import scrape_jobs
    except ImportError as exc:
        raise SystemExit(
            "Missing Python package 'python-jobspy'. "
            "Install it with: python -m pip install -r requirements.txt"
        ) from exc

    return scrape_jobs


def pick(search: dict[str, Any], config: dict[str, Any], key: str, default: Any = None) -> Any:
    return search.get(key, config.get(key, default))


def clean_params(params: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in params.items() if value not in (None, "", [])}


def dataframe_to_records(dataframe: Any) -> list[dict[str, Any]]:
    if dataframe is None:
        return []

    if hasattr(dataframe, "where") and hasattr(dataframe, "notna"):
        dataframe = dataframe.where(dataframe.notna(), None)

    records = dataframe.to_dict(orient="records")
    return json.loads(dataframe_to_json(records))


def dataframe_to_json(value: Any) -> str:
    return json.dumps(value, default=str, ensure_ascii=False, allow_nan=False)


def run_search(scrape_jobs: Any, config: dict[str, Any], search: dict[str, Any]) -> list[dict[str, Any]]:
    sites = pick(search, config, "sites", ["linkedin", "indeed", "google"])

    params = clean_params(
        {
            "site_name": sites,
            "search_term": search.get("searchTerm") or search.get("search_term"),
            "google_search_term": search.get("googleSearchTerm") or search.get("google_search_term"),
            "location": search.get("location"),
            "results_wanted": pick(search, config, "resultsWanted", config.get("results_wanted", 25)),
            "hours_old": pick(search, config, "hoursOld", config.get("hours_old")),
            "country_indeed": pick(search, config, "countryIndeed", config.get("country_indeed")),
            "description_format": pick(search, config, "descriptionFormat", config.get("description_format", "markdown")),
            "linkedin_fetch_description": pick(search, config, "linkedinFetchDescription", True),
            "is_remote": pick(search, config, "isRemote"),
            "job_type": pick(search, config, "jobType"),
            "user_agent": pick(search, config, "userAgent"),
            "proxies": pick(search, config, "proxies"),
            "verbose": pick(search, config, "verbose", 1),
        }
    )

    with contextlib.redirect_stdout(sys.stderr):
        dataframe = scrape_jobs(**params)

    records = dataframe_to_records(dataframe)
    for record in records:
        record.setdefault("_searchTerm", params.get("search_term", ""))
        record.setdefault("_googleSearchTerm", params.get("google_search_term", ""))
        record.setdefault("_searchLocation", params.get("location", ""))

    return records


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: jobspy-scan.py <scan-config.json>", file=sys.stderr)
        return 2

    config_path = Path(sys.argv[1])
    config = json.loads(config_path.read_text(encoding="utf-8"))
    searches = config.get("searches") or []

    if not searches:
        print('scan-config.json must include at least one item in "searches".', file=sys.stderr)
        return 2

    scrape_jobs = load_jobspy()
    all_records: list[dict[str, Any]] = []

    for index, search in enumerate(searches, start=1):
        print(f"JobSpy search {index}/{len(searches)}...", file=sys.stderr)
        all_records.extend(run_search(scrape_jobs, config, search))

    sys.stdout.write(dataframe_to_json(all_records))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

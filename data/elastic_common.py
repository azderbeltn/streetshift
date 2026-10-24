"""Shared Elastic config + clients for StreetShift.

Mirrors the official Cal Hacks starter (docs/elastic-starter/paper-scout/common.py):
same env vars, same Kibana headers, same reranker discovery. Reads settings from the repo-root .env.
"""

import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
# On Elastic Cloud the Kibana URL is the Elasticsearch URL with ".es." swapped for ".kb.".
KIBANA_URL = (os.environ.get("KIBANA_URL") or ES_URL.replace(".es.", ".kb.", 1)).rstrip("/")
if KIBANA_URL == ES_URL.rstrip("/"):
    KIBANA_URL = ""
API_KEY = os.environ.get("ELASTIC_API_KEY", "")
EMBEDDING_ID = os.environ.get("EMBEDDING_INFERENCE_ID", ".jina-embeddings-v5-text-small")
AGENT_ID = os.environ.get("ELASTIC_AGENT_ID", "streetshift-analyst")
BUSINESSES = "businesses"
REVIEWS = "reviews"
BRIEFS = "briefs"


def es() -> Elasticsearch:
    if API_KEY:
        return Elasticsearch(ES_URL, api_key=API_KEY, request_timeout=180)
    return Elasticsearch(ES_URL, request_timeout=180)


def kibana(method: str, path: str, **kwargs) -> requests.Response:
    """Call a Kibana API (Agent Builder, Workflows) with the same API key."""
    if not KIBANA_URL:
        raise RuntimeError("KIBANA_URL is not set in .env")
    headers = {
        "Authorization": f"ApiKey {API_KEY}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json",
        "x-elastic-internal-origin": "Kibana",
    }
    timeout = kwargs.pop("timeout", 300)
    return requests.request(method, f"{KIBANA_URL}{path}", headers=headers, timeout=timeout, **kwargs)


def find_reranker(client: Elasticsearch) -> str | None:
    """Pick a rerank endpoint if the project has one (prefers Jina). Same logic as the starter."""
    if os.environ.get("RERANK_INFERENCE_ID"):
        return os.environ["RERANK_INFERENCE_ID"]
    try:
        endpoints = client.inference.get(task_type="rerank").get("endpoints", [])
    except Exception:
        return None
    ids = [e["inference_id"] for e in endpoints]
    jina = sorted((i for i in ids if "jina" in i and "m0" not in i), reverse=True)
    return (jina or ids or [None])[0]

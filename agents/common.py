"""Shared helpers for StreetShift agents: env, the /sim API, and a cached Claude client.

Model names come from .env (ANTHROPIC_MODEL for reasoning, ANTHROPIC_MODEL_FAST for voice).
Every Claude response is cached to agents/.cache/claude so reruns cost nothing.
"""
import hashlib
import json
import os
from pathlib import Path

import anthropic
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
CACHE = Path(__file__).resolve().parent / ".cache" / "claude"
SIM = f"http://localhost:{os.environ.get('SIM_PORT', '8787')}"
APP_URL = os.environ.get("APP_PUBLIC_URL", "http://localhost:5173")

_client = None


def claude(system: str, user: str, *, fast=False, max_tokens=1500, effort="low", schema: dict | None = None) -> str:
    """Text (or JSON string when `schema` is given) from Claude. Raises on refusal or API error."""
    model = os.environ["ANTHROPIC_MODEL_FAST" if fast else "ANTHROPIC_MODEL"]
    key = hashlib.sha256(json.dumps([model, system, user, effort, schema], sort_keys=True).encode()).hexdigest()[:32]
    f = CACHE / f"{key}.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))["text"]
    global _client
    _client = _client or anthropic.Anthropic()
    output_config = {"effort": effort}
    if schema:
        output_config["format"] = {"type": "json_schema", "schema": schema}
    params = dict(model=model, max_tokens=max_tokens, system=system,
                  messages=[{"role": "user", "content": user}], output_config=output_config)
    if "haiku" in model:  # no server-side fallback for Haiku
        resp = _client.messages.create(**params)
    else:  # opt into server-side refusal fallback (routes by refusal category)
        resp = _client.beta.messages.create(**params, betas=["server-side-fallback-2026-07-01"], fallbacks="default")
    if resp.stop_reason == "refusal":
        raise RuntimeError(f"Claude declined ({getattr(resp.stop_details, 'category', None)})")
    text = "\n".join(b.text for b in resp.content if b.type == "text").strip()
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps({"model": resp.model, "text": text}), encoding="utf-8")
    return text


def sim_get(path: str):
    r = requests.get(SIM + path, timeout=30)
    r.raise_for_status()
    return r.json()


def sim_post(path: str, body: dict):
    r = requests.post(SIM + path, json=body, timeout=60)
    r.raise_for_status()
    return r.json()

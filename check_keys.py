"""Checks that StreetShift's API keys work. Read-only: it never changes anything.
Run from the streetshift folder:  python check_keys.py
It reads .env from the same folder and never prints your keys."""
import json, pathlib, urllib.request, urllib.error

env = {}
for line in pathlib.Path(__file__).with_name(".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

def call(url, headers=None, data=None, method=None):
    req = urllib.request.Request(url, headers=headers or {}, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode("utf-8", "replace")
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return None, str(e)

results = []
def report(name, ok, note):
    results.append((name, "OK" if ok else "PROBLEM", note))

# Apify: account plus monthly usage vs. limit
tok = env.get("APIFY_TOKEN", "")
s, b = call(f"https://api.apify.com/v2/users/me/limits?token={tok}")
if s == 200:
    d = json.loads(b).get("data", {})
    used = d.get("current", {}).get("monthlyUsageUsd")
    cap = d.get("limits", {}).get("maxMonthlyUsageUsd")
    report("Apify", True, f"used ${used} of ${cap} this month" if used is not None else "token works")
else:
    s2, _ = call(f"https://api.apify.com/v2/users/me?token={tok}")
    report("Apify", s2 == 200, "token works (usage not available)" if s2 == 200 else f"HTTP {s} - check APIFY_TOKEN")

# Elastic
auth = {"Authorization": f"ApiKey {env.get('ELASTIC_API_KEY','')}"}
s, b = call(env.get("ELASTICSEARCH_URL", "").rstrip("/") + "/", auth)
report("Elasticsearch", s == 200, "connected" if s == 200 else f"HTTP {s} - check ELASTICSEARCH_URL / ELASTIC_API_KEY")
s, b = call(env.get("KIBANA_URL", "").rstrip("/") + "/api/status", auth)
report("Kibana", s == 200, "connected" if s == 200 else f"HTTP {s} - check KIBANA_URL")

# Census
s, b = call(f"https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=state:06&key={env.get('CENSUS_API_KEY','')}")
report("US Census", s == 200 and "California" in b, "works" if s == 200 else f"HTTP {s} - key may not be activated yet (check the email Census sent you)")

# Socrata (one token works for both NYC and SF)
hdr = {"X-App-Token": env.get("NYC_OPEN_DATA_APP_TOKEN", "")}
s, b = call("https://data.cityofnewyork.us/resource/7ym2-wayt.json?$limit=1", hdr)
report("NYC/SF Open Data token", s == 200, "works" if s == 200 else f"HTTP {s} - check the app token")

# ASI:One
h = {"Authorization": f"Bearer {env.get('ASI1_API_KEY','')}", "Content-Type": "application/json"}
s, b = call("https://api.asi1.ai/v1/models", h)
if s != 200:
    body = json.dumps({"model": "asi1-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}).encode()
    s, b = call("https://api.asi1.ai/v1/chat/completions", h, body, "POST")
report("ASI:One", s == 200, "works" if s == 200 else f"HTTP {s} - check ASI1_API_KEY (or model name changed)")

# Agentverse
s, b = call("https://agentverse.ai/v1/hosting/agents", {"Authorization": f"Bearer {env.get('AGENTVERSE_API_KEY','')}"})
report("Agentverse", s == 200, "works" if s == 200 else f"HTTP {s} - check AGENTVERSE_API_KEY")

print(f"\n{'Service':<26}{'Status':<10}Details")
print("-" * 72)
for n, st, note in results:
    print(f"{n:<26}{st:<10}{note}")
print("\nNot checked here: Factory (Droid) and Moss need their own SDKs; Claude Code tests them when it builds those parts.")

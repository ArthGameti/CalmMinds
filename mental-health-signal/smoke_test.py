"""Run with the server up:  python smoke_test.py [base_url]"""
import json, sys, urllib.request

base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")

def get(p):
    with urllib.request.urlopen(base + p) as r:
        return r.status, r.headers.get("content-type", ""), r.read()

sample = dict(age=21, gender="Female", country="India", academic_level="Undergraduate",
              most_used_platform="Instagram", purpose_of_use="Entertainment",
              avg_daily_usage_hours=4.5, daily_unlocks=110, study_hours=4,
              physical_activity_hours=1, sleep_hours_per_night=6.8, stress_level="Medium")
checks = []
for path, kind in [("/", "text/html"), ("/style.css", "text/css"), ("/script.js", "javascript"),
                   ("/static/style.css", "text/css"), ("/api/health", "json"), ("/api/stats", "json")]:
    s, ct, _ = get(path); checks.append((path, s == 200 and kind in ct))
req = urllib.request.Request(base + "/api/predict", json.dumps(sample).encode(), {"Content-Type": "application/json"})
score = json.load(urllib.request.urlopen(req))["predicted_mental_health_score"]
checks.append((f"POST /api/predict -> {score}", 0 <= score <= 10))
for n, ok in checks: print("PASS" if ok else "FAIL", n)
sys.exit(0 if all(ok for _, ok in checks) else 1)

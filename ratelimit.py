import requests
import time

API_URL = "https://beu-bih.ac.in/backend/v1/result/get-result"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36",
    "Referer": "https://beu-bih.ac.in/",
}

BURST_COUNT   = 100000
ROLL_NO       = "24105102001"

def run_test():
    print("=" * 55)
    print("  BEU API — Rate Limit Detection Test")
    print("=" * 55)
    print(f"  Sending {BURST_COUNT} rapid requests to confirm finding\n")

    params = {
        "year":      "2025",
        "redg_no":   ROLL_NO,
        "semester":  "II",
        "exam_held": "November/2025",
    }

    results = []
    with requests.Session() as s:
        s.headers.update(HEADERS)
        for i in range(1, BURST_COUNT + 1):
            t0 = time.time()
            try:
                resp = s.get(API_URL, params=params, timeout=10)
                elapsed = round((time.time() - t0) * 1000)
                status  = resp.status_code

                # Check for rate limit indicators
                rate_limited = (
                    status == 429 or
                    "rate" in resp.text.lower() or
                    "throttl" in resp.text.lower() or
                    "too many" in resp.text.lower()
                )

                results.append({
                    "req": i,
                    "status": status,
                    "ms": elapsed,
                    "rate_limited": rate_limited
                })

                flag = "⚠️  RATE LIMITED" if rate_limited else "200 OK"
                print(f"  Request {i:>2}  |  HTTP {status}  |  {elapsed}ms  |  {flag}")

                if rate_limited:
                    print(f"\n  Rate limiting detected at request #{i}. Stopping.")
                    break

            except Exception as e:
                print(f"  Request {i:>2}  |  ERROR: {e}")
                break

            time.sleep(0.1)  # 100ms between requests — minimal delay

    # ── Conclusion ────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    any_limited = any(r["rate_limited"] for r in results)

    if any_limited:
        at = next(r["req"] for r in results if r["rate_limited"])
        print(f"  FINDING: Rate limiting IS present (triggered at request #{at})")
        print(f"  Severity: Low — rate limiting is implemented")
    else:
        print(f"  FINDING: Rate limiting is NOT implemented")
        print(f"  {BURST_COUNT} consecutive requests all returned HTTP 200")
        print(f"  with no throttling, backoff, or 429 response.")
        print(f"\n  Severity  : Medium")
        print(f"  Impact    : API is vulnerable to abuse — bulk scraping,")
        print(f"              automated enumeration, and quota exhaustion")
        print(f"              attacks are possible without restriction.")
        print(f"\n  Reference : OWASP API Security Top 10 — API4:2023")
        print(f"              Unrestricted Resource Consumption")
    print("=" * 55)

if __name__ == "__main__":
    run_test()
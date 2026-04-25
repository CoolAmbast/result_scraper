import requests

API_URL    = "https://beu-bih.ac.in/backend/v1/result/get-result"
ROLL_START = 24105102001
ROLL_END   = 24105102060

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
    "Referer": "https://beu-bih.ac.in/result-two/B.Tech.%202nd%20Semester%20Examination,%202025?semester=2&session=2025&exam_held=November%2F2025",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36",
}

def get_result(session, roll_no):
    params = {
        "year":      "2025",
        "redg_no":   str(roll_no),
        "semester":  "II",
        "exam_held": "November/2025",
    }
    try:
        resp = session.get(API_URL, params=params, headers=HEADERS, timeout=10)
        if resp.status_code in (200, 304):
            outer   = resp.json()
            data    = outer.get("data", {})  

            if not data:
                return "NOT_FOUND", "", "", ""

            fail_any = str(data.get("fail_any", "")).strip().upper()
            name     = data.get("name", "N/A")
            cgpa     = data.get("cgpa", ["?"])[0] if data.get("cgpa") else "?"

           
            if fail_any.startswith("FAIL"):
                subjects = fail_any.split(":", 1)[1] if ":" in fail_any else ""
                return "FAIL", name, cgpa, subjects
            else:
                return "PASS", name, cgpa, ""

        elif resp.status_code == 404:
            return "NOT_FOUND", "", "", ""
        else:
            return f"HTTP_{resp.status_code}", "", "", ""
    except Exception as e:
        return f"ERROR: {e}", "", "", ""


def main():
    total     = ROLL_END - ROLL_START + 1
    failed    = []
    not_found = []
    errors    = []

    print(f"Checking {ROLL_START} -> {ROLL_END}  ({total} students)\n")
    print(f"{'Roll No':<16} {'Status':<8} {'CGPA':<8} {'Name':<25} {'Failed Subjects'}")
    print("-" * 75)

    with requests.Session() as session:
        for roll in range(ROLL_START, ROLL_END + 1):
            status, name, cgpa, subjects = get_result(session, roll)
            print(f"{roll:<16} {status:<8} {cgpa:<8} {name:<25} {subjects}")

            if "NOT_FOUND" in status:
                not_found.append(roll)
            elif "ERROR" in status or "HTTP_" in status:
                errors.append((roll, status))
            elif status == "FAIL":
                failed.append((roll, name, subjects))

    print("\n" + "=" * 75)
    print(f"Total checked : {total}")
    print(f"FAIL          : {len(failed)}")
    print(f"PASS          : {total - len(failed) - len(not_found) - len(errors)}")
    print(f"Not found     : {len(not_found)}")
    print(f"Errors        : {len(errors)}")
    print("=" * 75)

    if failed:
        print(f"\nFailed students ({len(failed)}):")
        print(f"  {'Roll No':<16} {'Name':<25} {'Failed Subject Codes'}")
        print(f"  {'-'*60}")
        for roll, name, subjects in failed:
            print(f"  {roll:<16} {name:<25} {subjects}")

    if errors:
        print("\nErrors:")
        for r, msg in errors:
            print(f"  {r}  ->  {msg}")


if __name__ == "__main__":
    main()
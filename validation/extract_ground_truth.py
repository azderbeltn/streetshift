"""Extract per-corridor ground truth from the NYC DOT "Streets for Recovery" data appendix.

Parses the PDF directly (no hand-typed numbers), records the page for every value,
cross-checks the printed percentages against the dollar figures, and runs the
press sanity check from CLAUDE.md Section 5. Writes validation/ground_truth.json.

Run from /data:  uv run python ../validation/extract_ground_truth.py
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

HERE = Path(__file__).resolve().parent
APPENDIX = HERE / "sources" / "streets-for-recovery-report-data.pdf"
REPORT = HERE / "sources" / "streets-for-recovery.pdf"
OUT = HERE / "ground_truth.json"

# Corridor definitions are quoted from the main report, PDF page 7 ("Neighborhoods for Analysis").
# `appendixTitle` is how the appendix names the neighborhood.
CORRIDORS = [
    {"corridorId": "ditmars", "corridorName": "Ditmars Blvd (Astoria, Queens)", "appendixTitle": "Astoria",
     "split": "calibration",
     "treated": "Ditmars Boulevard between 33rd Street and 36th Street",
     "control": "Ditmars Avenue between 28th Street and 33rd Street"},
    {"corridorId": "park_slope_5th", "corridorName": "5th Ave (Park Slope, Brooklyn)", "appendixTitle": "Park Slope",
     "split": "calibration",
     "treated": "5th Avenue between Union Street and 4th Street",
     "control": "7th Avenue between Union Street and 4th Street"},
    {"corridorId": "pell_doyers", "corridorName": "Pell & Doyers Sts (Chinatown, Manhattan)", "appendixTitle": "Chinatown",
     "split": "holdout",
     "treated": "Pell Street between Bowery and Mott Street, Doyers Street between Pell Street and Bowery",
     "control": "Bowery between Grand Street and Chatham Square"},
    {"corridorId": "e32nd", "corridorName": "E 32nd St (Koreatown, Manhattan)", "appendixTitle": "Koreatown/Midtown",
     "split": "holdout",
     "treated": "E 32nd Street from Broadway to Madison Avenue",
     "control": "West 36th Street between 6th Avenue and Madison Avenue"},
    {"corridorId": "vanderbilt", "corridorName": "Vanderbilt Ave (Prospect Heights, Brooklyn)", "appendixTitle": "Prospect Heights",
     "split": "holdout",
     "treated": "Vanderbilt Avenue between Atlantic Avenue and Park Place",
     "control": "Flatbush Avenue between Dean Street and 8th Avenue"},
]

# Press-confirmed values (CLAUDE.md Section 5). Extraction must agree or we stop.
SANITY = {"ditmars": (44, -7), "pell_doyers": (-8, -31)}
SANITY_AVG = (19, -29)

QUARTERS = ["Baseline", "2020 Q4", "2021 Q1", "2021 Q2", "2021 Q3", "2021 Q4", "2022 Q1", "2022 Q2"]
# The report's headline comparison ("summer 2021 (June to August 2021)", main report p.8;
# study period Mar 1 2020 - Aug 31 2021, p.6) is the last appendix column.
TARGET_QUARTER = "2022 Q2"


def nums(line: str, money: bool) -> list[float]:
    pat = r"-?\$[\d,]+" if money else r"-?\d+%"
    return [float(x.replace("$", "").replace(",", "").replace("%", "")) for x in re.findall(pat, line)]


def parse_sales_page(text: str) -> dict:
    """Return {group: {sales: [...], pct: [...]}} for Borough/Control/Open Streets/Open Restaurants."""
    lines = text.splitlines()
    groups, current = {}, None
    for line in lines:
        s = line.strip()
        if s in ("Brooklyn", "Queens", "Manhattan"):
            current = "Borough"
        elif s in ("Control", "Open Streets", "Open Street", "Open Restaurants"):
            current = "Open Streets" if s.startswith("Open Street") else s
        elif current and s.startswith("Taxable Sales"):
            groups.setdefault(current, {})["sales"] = nums(s, money=True)
        elif current and s.startswith("Percent change from baseline"):
            groups.setdefault(current, {})["pct"] = nums(s, money=False)
    return groups


def main() -> int:
    pages = {}
    with pdfplumber.open(APPENDIX) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            m = re.match(r".*?\n?(.+?): Summary of gross taxable sales", text, re.S)
            if m:
                title = m.group(1).strip().splitlines()[-1].strip()
                pages[title] = (i, parse_sales_page(text))

    # Confirm the corridor definitions really appear in the main report on page 7.
    with pdfplumber.open(REPORT) as pdf:
        report_p7 = re.sub(r"\s+", " ", pdf.pages[6].extract_text() or "")

    out, problems = [], []
    for c in CORRIDORS:
        if c["appendixTitle"] not in pages:
            problems.append(f"{c['corridorId']}: appendix page not found")
            continue
        page_no, g = pages[c["appendixTitle"]]
        row = {k: c[k] for k in ("corridorId", "corridorName", "split")}
        row["definitions"] = {"treated": c["treated"], "control": c["control"],
                              "source": "streets-for-recovery.pdf, PDF page 7",
                              "verifiedInPdf": c["control"].split(" between ")[0].split(" from ")[0] in report_p7}
        for role, key in (("treated", "Open Streets"), ("control", "Control"), ("borough", "Borough")):
            sales, pct = g[key]["sales"], g[key]["pct"]
            assert len(sales) == len(QUARTERS) == len(pct), (c["corridorId"], role)
            recomputed = [round((s / sales[0] - 1) * 100) for s in sales]
            mismatch = [q for q, a, b in zip(QUARTERS, pct, recomputed) if abs(a - b) > 1]
            if mismatch:
                problems.append(f"{c['corridorId']} {role}: printed % disagrees with $ in {mismatch}")
            row[role] = {"taxableSalesUsd": dict(zip(QUARTERS, sales)),
                         "pctChangeFromBaseline": dict(zip(QUARTERS, pct)),
                         "source": f"streets-for-recovery-report-data.pdf, page {page_no}"}
        t = row["treated"]["pctChangeFromBaseline"][TARGET_QUARTER]
        k = row["control"]["pctChangeFromBaseline"][TARGET_QUARTER]
        row["actualTreatedPct"], row["actualControlPct"] = t, k
        row["actualGapPct"] = t - k
        out.append(row)

    for cid, (t, k) in SANITY.items():
        r = next(r for r in out if r["corridorId"] == cid)
        if (r["actualTreatedPct"], r["actualControlPct"]) != (t, k):
            problems.append(f"SANITY FAIL {cid}: got {r['actualTreatedPct']}/{r['actualControlPct']}, press says {t}/{k}")
    avg_t = sum(r["actualTreatedPct"] for r in out) / len(out)
    avg_k = sum(r["actualControlPct"] for r in out) / len(out)
    if abs(avg_t - SANITY_AVG[0]) > 1 or abs(avg_k - SANITY_AVG[1]) > 1:
        problems.append(f"SANITY FAIL averages: {avg_t:.1f}/{avg_k:.1f} vs {SANITY_AVG}")

    doc = {
        "source": "NYC DOT, Streets for Recovery: The Economic Benefits of the NYC Open Streets Program (2022)",
        "urls": ["https://www.nyc.gov/html/dot/downloads/pdf/streets-for-recovery.pdf",
                 "https://www.nyc.gov/html/dot/downloads/pdf/streets-for-recovery-report-data.pdf"],
        "metric": "Gross taxable sales of restaurants and bars, percent change from pre-pandemic baseline",
        "targetQuarter": TARGET_QUARTER,
        "targetQuarterNote": ("Last appendix column. Matches the report's headline 'summer 2021 (June to August 2021)' "
                              "comparison (report p.8) and the press-confirmed values; study period Mar 1 2020 - "
                              "Aug 31 2021 (report p.6)."),
        "gapDefinition": "actualGapPct = treated pct change - control pct change (percentage points)",
        "averages": {"treatedPct": round(avg_t, 1), "controlPct": round(avg_k, 1)},
        "corridors": out,
    }
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")

    print(f"{'corridor':<16}{'split':<13}{'treated':>8}{'control':>9}{'gap':>6}  page  defs-in-pdf")
    for r in out:
        print(f"{r['corridorId']:<16}{r['split']:<13}{r['actualTreatedPct']:>7.0f}%{r['actualControlPct']:>8.0f}%"
              f"{r['actualGapPct']:>6.0f}  {r['treated']['source'].split()[-1]:>4}  {r['definitions']['verifiedInPdf']}")
    print(f"averages: treated {avg_t:+.1f}%  control {avg_k:+.1f}%  (press: +19 / -29)")
    if problems:
        print("PROBLEMS:", *problems, sep="\n  ")
        return 1
    print("sanity check PASSED; wrote", OUT.relative_to(HERE.parent))
    return 0


if __name__ == "__main__":
    sys.exit(main())

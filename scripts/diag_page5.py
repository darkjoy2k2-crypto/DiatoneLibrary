import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from pdf_to_txt import _merge_intervals
import pdfplumber
from pathlib import Path

pdf_path = Path(__file__).parent.parent / "data" / "import" / "tabheft.pdf"
with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[24]  # Seite 25 = Index 24
    words = page.extract_words()
    x0, y0, x1, y1 = map(float, page.bbox)
    page_center = (x0 + x1) / 2.0
    center_lo, center_hi = page_center - page.width * 0.20, page_center + page.width * 0.20

    intervals = [(max(x0, float(w["x0"])), min(x1, float(w["x1"]))) for w in words if float(w["x1"]) > float(w["x0"])]
    merged = _merge_intervals(intervals)
    print(f"Seite 25: center={page_center:.1f}, center_window=[{center_lo:.1f}, {center_hi:.1f}]")
    print(f"Merged intervals ({len(merged)}):")
    for s, e in merged:
        print(f"  [{s:.1f} – {e:.1f}]  width={e-s:.1f}")
    print()

    # Gaps
    cursor = x0
    print("Gaps:")
    for s, e in merged:
        if s > cursor:
            gc = (cursor + s) / 2
            print(f"  gap [{cursor:.1f} – {s:.1f}]  width={s-cursor:.1f}  center={gc:.1f}  in_window={center_lo<=gc<=center_hi}")
        cursor = max(cursor, e)
    print()

    # Welche Wörter liegen im Gutter-Bereich 240-340?
    print("Wörter mit x0 oder x1 im Bereich 200-350:")
    for w in sorted(words, key=lambda w: w["top"]):
        if 200 <= float(w["x0"]) <= 350 or 200 <= float(w["x1"]) <= 350:
            print(f"  top={w['top']:6.1f}  x0={w['x0']:6.1f}  x1={w['x1']:6.1f}  text={w['text']!r}")


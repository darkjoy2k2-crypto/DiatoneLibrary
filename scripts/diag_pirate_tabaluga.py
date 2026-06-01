"""Diagnose column extraction for He's a Pirate (p13) and Tabaluga (p17)."""
import pdfplumber
from statistics import median

pdf = pdfplumber.open('F:/Projekte/DiatoneLibrary/data/import/tabheft.pdf')

for page_idx, label in [(12, "Hes_a_Pirate_p13"), (16, "Tabaluga_p17")]:
    page = pdf.pages[page_idx]
    x0, y0, x1, y1 = map(float, page.bbox)
    words = page.extract_words() or []

    footer_cutoff = y0 + (y1 - y0) * 0.90
    page_center = (x0 + x1) / 2.0
    center_band = (x1 - x0) * 0.25

    line_buckets: dict[float, list] = {}
    for word in words:
        if float(word['top']) >= footer_cutoff:
            continue
        key = round(float(word['top']) / 3.0) * 3.0
        line_buckets.setdefault(key, []).append(word)

    candidate_centers = []
    non_empty = 0

    for _, lwords in line_buckets.items():
        if not lwords:
            continue
        non_empty += 1
        ordered = sorted(lwords, key=lambda w: float(w['x0']))
        if len(ordered) < 2:
            continue
        for lw, rw in zip(ordered, ordered[1:]):
            gap = float(rw['x0']) - float(lw['x1'])
            if gap < 10:
                continue
            gc = (float(lw['x1']) + float(rw['x0'])) / 2.0
            if abs(gc - page_center) <= center_band:
                candidate_centers.append(gc)
                break

    gutter = float(median(candidate_centers)) if candidate_centers else None

    print(f"\n{'='*60}")
    print(f"{label}")
    print(f"  page bbox: x0={x0:.1f} x1={x1:.1f}  center={page_center:.1f}")
    print(f"  non_empty_lines={non_empty}  candidates={len(candidate_centers)}")
    print(f"  gutter_x={gutter}")
    print()
    print("  All lines (raw, sorted by Y):")
    for top in sorted(line_buckets):
        lwords = sorted(line_buckets[top], key=lambda w: float(w['x0']))
        # show word positions
        parts = [f"{w['text']}({w['x0']:.0f}-{w['x1']:.0f})" for w in lwords]
        print(f"  y={top:.0f}: {' | '.join(parts)}")

pdf.close()

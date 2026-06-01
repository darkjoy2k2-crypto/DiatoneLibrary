"""Dump raw column extraction for page 13 and 17 (before postprocessing)."""
import sys
sys.path.insert(0, 'F:/Projekte/DiatoneLibrary/scripts')

import re
import pdfplumber
from statistics import median
from typing import Iterable


_CLEANUP_PATTERNS = [
    re.compile(r'^\s*Zum Seitenanfang\s*$', re.IGNORECASE),
    re.compile(r'Erstellt\s+\d{4}-\d{2}-\d{2}\s+von\s+.+?\s+Seite\s+\d+\s+von\s+\d+', re.IGNORECASE),
    re.compile(r'^\s*Erstellt\s+\d{4}-\d{2}-\d{2}\s+von\s+.+?\s*$', re.IGNORECASE),
    re.compile(r'^\s*Seite\s+\d+\s+von\s+\d+\s*$', re.IGNORECASE),
]

def _clean_text(text):
    cleaned = [l for l in text.splitlines() if not any(p.search(l) for p in _CLEANUP_PATTERNS)]
    return '\n'.join(cleaned).strip()

def _extract_two_column_page(page, gutter_x):
    words = page.extract_words() or []
    if not words:
        return "", ""
    buckets = {}
    for word in words:
        key = round(float(word["top"]) / 3.0) * 3.0
        buckets.setdefault(key, []).append(word)

    left_lines = []
    right_lines = []
    for top in sorted(buckets):
        line_words = sorted(buckets[top], key=lambda w: float(w["x0"]))
        left_words = [w for w in line_words if (float(w["x0"]) + float(w["x1"])) / 2.0 < gutter_x]
        right_words = [w for w in line_words if (float(w["x0"]) + float(w["x1"])) / 2.0 >= gutter_x]
        has_left = bool(left_words)
        has_right = bool(right_words)
        if has_left and has_right:
            rightmost_left_x = max(float(w["x1"]) for w in left_words)
            leftmost_right_x = min(float(w["x0"]) for w in right_words)
            central_gap = leftmost_right_x - rightmost_left_x
            if central_gap >= 15.0:
                left_lines.append(" ".join(w["text"] for w in left_words))
                right_lines.append(" ".join(w["text"] for w in right_words))
            else:
                left_lines.append(" ".join(w["text"] for w in line_words))
        else:
            if left_words:
                left_lines.append(" ".join(w["text"] for w in left_words))
            if right_words:
                right_lines.append(" ".join(w["text"] for w in right_words))
    return "\n".join(left_lines), "\n".join(right_lines)

def _merge_intervals(intervals):
    s = sorted(intervals, key=lambda x: x[0])
    if not s: return []
    merged = [s[0]]
    for a, b in s[1:]:
        la, lb = merged[-1]
        if a <= lb:
            merged[-1] = (la, max(lb, b))
        else:
            merged.append((a, b))
    return merged

def _detect_gutter(page):
    x0, y0, x1, y1 = map(float, page.bbox)
    pw = x1 - x0
    words = page.extract_words() or []
    footer_cutoff = y0 + (y1 - y0) * 0.90
    line_buckets = {}
    for word in words:
        if float(word['top']) >= footer_cutoff:
            continue
        key = round(float(word['top']) / 3.0) * 3.0
        line_buckets.setdefault(key, []).append(word)
    page_center = (x0 + x1) / 2.0
    center_band = pw * 0.25
    candidate_centers = []
    non_empty = 0
    for _, lwords in line_buckets.items():
        if not lwords: continue
        non_empty += 1
        ordered = sorted(lwords, key=lambda w: float(w['x0']))
        if len(ordered) < 2: continue
        for lw, rw in zip(ordered, ordered[1:]):
            gap = float(rw['x0']) - float(lw['x1'])
            if gap < 10: continue
            gc = (float(lw['x1']) + float(rw['x0'])) / 2.0
            if abs(gc - page_center) <= center_band:
                candidate_centers.append(gc)
                break
    if len(candidate_centers) >= 4:
        return float(median(candidate_centers))
    return None

pdf = pdfplumber.open('F:/Projekte/DiatoneLibrary/data/import/tabheft.pdf')

for page_idx, label in [(12, "Hes_a_Pirate_p13"), (16, "Tabaluga_p17")]:
    page = pdf.pages[page_idx]
    gutter = _detect_gutter(page)
    print(f"\n{'='*60}")
    print(f"{label}  gutter_x={gutter}")
    print()
    if gutter:
        left, right = _extract_two_column_page(page, gutter)
        left = _clean_text(left)
        right = _clean_text(right)
        print("--- LEFT COLUMN ---")
        for i, l in enumerate(left.splitlines()): print(f"  {i:02d}: {l!r}")
        print("--- RIGHT COLUMN ---")
        for i, l in enumerate(right.splitlines()): print(f"  {i:02d}: {l!r}")
    else:
        print("  --> SINGLE COLUMN (no gutter detected)")
        x0, y0, x1, y1 = map(float, page.bbox)
        full = _clean_text(page.within_bbox((x0, y0, x1, y1)).extract_text() or "")
        for i, l in enumerate(full.splitlines()): print(f"  {i:02d}: {l!r}")

pdf.close()

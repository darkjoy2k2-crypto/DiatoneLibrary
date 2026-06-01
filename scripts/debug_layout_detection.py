from pathlib import Path

import pdfplumber


def merge_intervals(intervals):
    intervals = sorted(intervals, key=lambda x: x[0])
    if not intervals:
        return []
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def diagnose_page(page):
    x0, y0, x1, y1 = map(float, page.bbox)
    page_width = x1 - x0
    center_x = (x0 + x1) / 2.0

    words = page.extract_words() or []
    intervals = []
    for word in words:
        wx0 = float(word["x0"])
        wx1 = float(word["x1"])
        if wx1 > wx0:
            intervals.append((max(x0, wx0), min(x1, wx1)))

    merged = merge_intervals(intervals)

    gaps = []
    cursor = x0
    for start, end in merged:
        if start > cursor:
            gaps.append((cursor, start))
        cursor = max(cursor, end)
    if cursor < x1:
        gaps.append((cursor, x1))

    center_window = page_width * 0.2
    window_min = center_x - center_window
    window_max = center_x + center_window

    candidates = []
    for gap_start, gap_end in gaps:
        overlap_start = max(gap_start, window_min)
        overlap_end = min(gap_end, window_max)
        overlap_width = overlap_end - overlap_start
        if overlap_width >= 8.0:
            gap_center = (gap_start + gap_end) / 2.0
            candidates.append(
                {
                    "gap_start": gap_start,
                    "gap_end": gap_end,
                    "gap_width": gap_end - gap_start,
                    "gap_center": gap_center,
                    "distance_to_center": abs(gap_center - center_x),
                    "overlap_width": overlap_width,
                }
            )

    candidates.sort(key=lambda c: c["distance_to_center"])

    center_chars = sum(
        1
        for c in page.chars
        if float(c["x0"]) <= center_x + 12.0 and float(c["x1"]) >= center_x - 12.0
    )

    crossing_words = sum(
        1
        for w in words
        if float(w["x0"]) < center_x and float(w["x1"]) > center_x
    )

    return {
        "bbox": (x0, y0, x1, y1),
        "width": page_width,
        "center_x": center_x,
        "words": len(words),
        "merged_intervals": len(merged),
        "gaps": gaps,
        "center_window": (window_min, window_max),
        "candidate_count": len(candidates),
        "best_candidate": candidates[0] if candidates else None,
        "center_chars_24pt": center_chars,
        "crossing_words": crossing_words,
    }


def main():
    project_root = Path(__file__).resolve().parents[1]
    pdf_path = project_root / "data" / "import" / "tabheft.pdf"

    pages = [161, 162, 163, 164]

    with pdfplumber.open(pdf_path) as pdf:
        for pno in pages:
            page = pdf.pages[pno - 1]
            d = diagnose_page(page)
            print(f"\\n=== Seite {pno} ===")
            print(f"width={d['width']:.2f}, center_x={d['center_x']:.2f}")
            print(
                f"words={d['words']}, merged_intervals={d['merged_intervals']}, "
                f"center_chars_24pt={d['center_chars_24pt']}, crossing_words={d['crossing_words']}"
            )
            print(
                f"center_window=({d['center_window'][0]:.2f}, {d['center_window'][1]:.2f}), "
                f"candidate_gaps={d['candidate_count']}"
            )
            if d["best_candidate"] is None:
                print("best_gap=None")
            else:
                g = d["best_candidate"]
                print(
                    f"best_gap=({g['gap_start']:.2f}, {g['gap_end']:.2f}), "
                    f"width={g['gap_width']:.2f}, overlap={g['overlap_width']:.2f}, "
                    f"distance_to_center={g['distance_to_center']:.2f}"
                )


if __name__ == "__main__":
    main()

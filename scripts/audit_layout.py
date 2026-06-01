from pathlib import Path

import pdfplumber

from pdf_to_txt import _detect_vertical_gutter_x, _detect_vertical_gutter_x_by_lines


def parse_output_modes(output_path: Path) -> dict[int, str]:
    lines = output_path.read_text(encoding="utf-8", errors="replace").splitlines()
    mode_by_page: dict[int, str] = {}
    page: int | None = None

    for line in lines:
        if line.startswith("=== Seite "):
            try:
                page = int(line.split()[2])
            except Exception:
                page = None
            continue

        if page is None or page in mode_by_page:
            continue

        marker = line.strip()
        if marker == "--- Spalte 1 (links) ---":
            mode_by_page[page] = "two"
        elif marker.startswith("--- Einspaltig"):
            mode_by_page[page] = "one"

    return mode_by_page


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    pdf_path = root / "data" / "import" / "tabheft.pdf"
    txt_path = root / "data" / "import" / "tabheft.txt"
    report_path = root / "data" / "import" / "layout_audit_report.txt"

    mode_by_page = parse_output_modes(txt_path)

    stats = {"one": 0, "two": 0, "mismatch": 0}
    issues: list[tuple[int, str, str]] = []

    with pdfplumber.open(pdf_path) as pdf:
        max_pages = min(164, len(pdf.pages))
        print(f"Starte Audit fuer {max_pages} Seiten...")

        for page_num in range(1, max_pages + 1):
            page = pdf.pages[page_num - 1]
            x0, y0, x1, y1 = map(float, page.bbox)
            center_x = (x0 + x1) / 2.0

            words = page.extract_words() or []
            left_words = sum(1 for w in words if float(w["x1"]) <= center_x)
            right_words = sum(1 for w in words if float(w["x0"]) >= center_x)
            crossing_words = sum(
                1 for w in words if float(w["x0"]) < center_x and float(w["x1"]) > center_x
            )
            center_chars = sum(
                1
                for c in page.chars
                if float(c["x0"]) <= center_x + 12.0 and float(c["x1"]) >= center_x - 12.0
            )

            gutter_x = _detect_vertical_gutter_x_by_lines(page)
            method = "line"
            if gutter_x is None:
                gutter_x = _detect_vertical_gutter_x(page)
                method = "global" if gutter_x is not None else "none"

            detected_mode = "two" if gutter_x is not None else "one"
            stats[detected_mode] += 1

            output_mode = mode_by_page.get(page_num, "missing")
            if output_mode not in ("one", "two"):
                issues.append(
                    (page_num, "output-missing", f"output marker fehlt, detected={detected_mode}")
                )
                continue

            if output_mode != detected_mode:
                stats["mismatch"] += 1
                issues.append(
                    (
                        page_num,
                        "mismatch",
                        f"output={output_mode}, detected={detected_mode}, method={method}",
                    )
                )

            # Likely false-negative: text seems split left/right with low center occupancy.
            if detected_mode == "one" and left_words >= 35 and right_words >= 35 and crossing_words <= 2 and center_chars <= 10:
                issues.append(
                    (
                        page_num,
                        "possible-missed-two-column",
                        (
                            f"left={left_words}, right={right_words}, "
                            f"crossing={crossing_words}, center_chars={center_chars}"
                        ),
                    )
                )

            # Potentially unstable split despite two-column decision.
            if detected_mode == "two" and center_chars >= 40:
                issues.append(
                    (
                        page_num,
                        "possible-unstable-two-column",
                        f"center_chars={center_chars}, method={method}",
                    )
                )

            if page_num % 20 == 0 or page_num == max_pages:
                print(f"... verarbeitet bis Seite {page_num}")

    report_lines: list[str] = []
    report_lines.append(f"pages_checked={max_pages}")
    report_lines.append(
        f"detected_one={stats['one']} detected_two={stats['two']} marker_mismatches={stats['mismatch']}"
    )
    report_lines.append(f"issues_count={len(issues)}")
    for page_num, kind, message in issues:
        report_lines.append(f"P{page_num:03d} | {kind} | {message}")

    report_path.write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(f"Report geschrieben: {report_path}")


if __name__ == "__main__":
    main()

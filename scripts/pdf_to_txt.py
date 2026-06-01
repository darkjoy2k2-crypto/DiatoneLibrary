"""Convert a PDF to plain text using pypdf layout mode.

Per-page algorithm:
  1. Extract text in "layout" mode - spaces encode horizontal position.
  2. For each line: find the largest interior space gap (>=5 spaces) in the
     central zone of the line.  If such a gap exists AND content is present on
     both sides, the line belongs to two columns; split there.
  3. If at least 3 lines on a page have two-column splits, the page is treated
     as two-column.  All left-side content is written first, then right-side.
  4. Lines with content only on one side are assigned by indentation:
     first non-space character before the gutter -> left; at/after -> right.
  5. Footer & navigation artifacts are removed before writing.

No cross-page merging, no global coordinate analysis.
"""

import re
from pathlib import Path
from statistics import median

from pypdf import PdfReader


_CLEANUP_PATTERNS: list[re.Pattern] = [
    re.compile(r'^\s*Zum Seitenanfang\s*$', re.IGNORECASE),
    re.compile(
        r'Erstellt\s+\d{4}-\d{2}-\d{2}\s+von\s+.+?\s+Seite\s+\d+\s+von\s+\d+',
        re.IGNORECASE,
    ),
    re.compile(r'^\s*Erstellt\s+\d{4}-\d{2}-\d{2}\s+von\s+.+?\s*$', re.IGNORECASE),
    re.compile(r'^\s*Seite\s+\d+\s+von\s+\d+\s*$', re.IGNORECASE),
]


def _is_footer(line: str) -> bool:
    return any(pat.search(line) for pat in _CLEANUP_PATTERNS)


def _best_interior_gap(line: str, min_gap: int = 5) -> tuple[int, int] | None:
    """Return (gap_start, gap_length) of the largest interior space run.

    'Interior' means the gap centre must be between 20 % and 87 % of the
    stripped line length.  Returns None if no qualifying gap is found.
    """
    rline = line.rstrip()
    length = len(rline)
    if length == 0:
        return None

    best: tuple[int, int] | None = None
    i = 0
    while i < length:
        if rline[i] == ' ':
            j = i
            while j < length and rline[j] == ' ':
                j += 1
            gap_len = j - i
            gap_centre = (i + j) / 2.0
            if gap_len >= min_gap and 0.20 * length < gap_centre < 0.87 * length:
                if best is None or gap_len > best[1]:
                    best = (i, gap_len)
            i = j
        else:
            i += 1
    return best


def _split_line(line: str) -> tuple[str, str]:
    """Split a layout line at its largest interior gap.

    Returns (left, right).  right is '' when no qualifying gap found or when
    one side would be empty after splitting.
    """
    rline = line.rstrip()
    gap = _best_interior_gap(rline)
    if gap is None:
        return rline.strip(), ''
    gs, gl = gap
    left = rline[:gs].rstrip()
    right = rline[gs + gl:].strip()
    if not left or not right:
        return rline.strip(), ''
    return left, right


def _process_page(page_text: str) -> tuple[str, str]:
    """Split a pypdf layout page into (left_column, right_column).

    right_column is '' when the page is single-column.
    """
    raw_lines = [ln.rstrip() for ln in page_text.splitlines()]
    lines = [ln for ln in raw_lines if not _is_footer(ln)]

    # Count lines that clearly have content in both columns.
    right_starts: list[int] = []
    for line in lines:
        if not line.strip():
            continue
        gap = _best_interior_gap(line)
        if gap is None:
            continue
        gs, gl = gap
        if line[:gs].strip() and line[gs + gl:].strip():
            right_starts.append(gs + gl)

    if len(right_starts) < 3:
        # Single-column page.
        return '\n'.join(ln.strip() for ln in lines if ln.strip()), ''

    gutter = int(median(right_starts))

    left_lines: list[str] = []
    right_lines: list[str] = []

    for line in lines:
        if not line.strip():
            continue
        left, right = _split_line(line)
        if left and right:
            left_lines.append(left)
            right_lines.append(right)
        else:
            # Single-content line: assign by indentation relative to gutter.
            first_char = len(line) - len(line.lstrip())
            if first_char >= gutter * 0.4:
                right_lines.append(line.strip())
            else:
                left_lines.append(line.strip())

    return '\n'.join(left_lines), '\n'.join(right_lines)


def _is_structural_marker(line: str) -> bool:
    """True for colon-lines that indicate playing structure, not lyrics."""
    s = line.strip()
    if re.match(r'^\d+[\.\)]\s', s):
        return True
    if re.search(r'\b(?:Version|Position|Lage|Capo)\b', s, re.IGNORECASE):
        return True
    return False


_MULTI_SPACE = re.compile(r'  +')


def _normalize_notation(line: str) -> str:
    """Collapse multiple spaces to one in a pure-notation line."""
    return _MULTI_SPACE.sub(' ', line).strip()


def _postprocess_songs(full_text: str) -> str:
    """Post-process extracted text for pages 5+.

    Pages 1-4 (table of contents) are kept untouched.
    From page 5 onwards:
      - All page/column markers are removed.
      - Exactly ONE blank line precedes each song title; no other blank lines.
      - Song title is formatted as:  #TITLE "songtitel"
      - Lines with no alphabetic characters are kept (notation); multiple
        spaces between tokens are collapsed to one.
      - Structural colon-lines (Version/Position/Lage/Capo, numbered sections)
        are buffered; only written out when at least one notation line follows
        before the next song title or end-of-input.
      - All other alpha lines are dropped.
    """
    lines = full_text.splitlines()
    result: list[str] = []
    in_songs = False
    song_name_pending = False

    # Buffer for structural markers waiting to be confirmed by a notation line.
    pending_markers: list[str] = []

    def flush_markers() -> None:
        """Write buffered markers if any."""
        result.extend(pending_markers)
        pending_markers.clear()

    def discard_markers() -> None:
        pending_markers.clear()

    for line in lines:
        page_match = re.match(r'^=== Seite (\d+) ===$', line)
        if page_match:
            page_num = int(page_match.group(1))
            if page_num <= 4:
                discard_markers()
                in_songs = False
                result.append(line)
            else:
                in_songs = True
            continue

        if not in_songs:
            result.append(line)
            continue

        if line in ('--- Spalte 1 (links) ---', '--- Einspaltig ---'):
            discard_markers()
            song_name_pending = True
            continue

        if line == '--- Spalte 2 (rechts) ---':
            continue

        if not line.strip():
            continue

        if song_name_pending:
            discard_markers()
            result.append('')
            result.append(f'#TITLE "{line.strip()}"')
            song_name_pending = False
            continue

        has_alpha = any(c.isalpha() for c in line)
        if not has_alpha:
            # Pure notation line — confirm any pending markers first.
            flush_markers()
            result.append(_normalize_notation(line))
        elif ':' in line and _is_structural_marker(line):
            # Buffer the marker; only emit it once a notation line follows.
            pending_markers.append(line.strip())
        # else: lyric / Text: / Refrain: / URL → drop

    # Discard any trailing markers with no following notation.
    discard_markers()

    return '\n'.join(result)


def convert_pdf_to_txt(pdf_path: Path, txt_path: Path) -> None:
    txt_path.parent.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(pdf_path))

    with txt_path.open('w', encoding='utf-8') as out:
        for page_index, page in enumerate(reader.pages, start=1):
            out.write(f'=== Seite {page_index} ===\n')
            layout_text = page.extract_text(extraction_mode='layout') or ''
            left, right = _process_page(layout_text)

            if right:
                out.write('--- Spalte 1 (links) ---\n')
                out.write(left)
                out.write('\n\n')
                out.write('--- Spalte 2 (rechts) ---\n')
                out.write(right)
                out.write('\n\n')
            else:
                out.write('--- Einspaltig ---\n')
                out.write(left)
                out.write('\n\n')


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    pdf_path = project_root / 'data' / 'import' / 'tabheft.pdf'
    txt_path = project_root / 'data' / 'import' / 'tabheft.txt'

    convert_pdf_to_txt(pdf_path, txt_path)

    raw = txt_path.read_text(encoding='utf-8')
    processed = _postprocess_songs(raw)
    txt_path.write_text(processed, encoding='utf-8')

    print(f'Konvertierung abgeschlossen: {pdf_path} -> {txt_path}')


if __name__ == '__main__':
    main()

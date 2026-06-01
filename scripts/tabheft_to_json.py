"""Convert tabheft.txt to individual song JSON files + manifest.json.

Token rules (from book notation):
  positive number         -> blow  (blasen)
  negative number         -> draw  (ziehen)
  any ' or " appended     -> bend  (pypdf renders '' as ")

Index mapping 0-28 per copilot-instructions.
Structural markers (Version:/Position:/etc.) become [] separator rows.
"""

import json
import re
import unicodedata
from pathlib import Path

# ── Index tables (channel 1-10, 0-based offset ch = channel - 1) ─────────────

#                    ch:  1   2   3   4   5     6   7    8   9   10
BLOW_IDX  = [  0,  3,  6,  9, 12, 14, 17, 19, 22, 25]
DRAW_IDX  = [  2,  5,  8, 11, 13, 16, 18, 21, 24, 28]
BEND_IDX  = [  1,  4,  7, 10, None, 15, None, 20, 23, 26]  # None = impossible
BEND2_IDX = [None]*9 + [27]   # channel 10 second half-tone only


def token_to_index(token: str) -> int | None:
    """Convert a single notation token to an index 0-28.

    Returns None for unrecognised tokens or impossible bendings.
    """
    # Normalise: pypdf often renders '' (two apostrophes) as a double-quote
    t = token.strip().replace('"', "''")
    apos = t.count("'")
    base = t.replace("'", "")

    try:
        num = int(base)
    except ValueError:
        return None

    channel = abs(num)
    if channel < 1 or channel > 10:
        return None

    ch = channel - 1  # 0-based

    if apos > 0:
        # Bending token
        if apos >= 2 and BEND2_IDX[ch] is not None:
            return BEND2_IDX[ch]
        idx = BEND_IDX[ch]
        return idx  # None if impossible (ch 5 or ch 7)
    elif num > 0:
        return BLOW_IDX[ch]
    else:
        return DRAW_IDX[ch]


# ── TOC parsing ───────────────────────────────────────────────────────────────

# Matches TOC lines like  "He's a pirate ..... 13"
_TOC_SONG_RE = re.compile(r'^(.+?)\s*[.…]{3,}\s*(\d+)\s*$')
# Matches category headers like  "1. Film- und Musicalmusik"  or  "2. Volksmusik"
_CAT_RE = re.compile(r'^\d+\.\s+(.+)$')


def parse_toc(toc_lines: list[str]) -> dict[int, tuple[str, str]]:
    """Return {page_number: (song_title, category)} from TOC lines."""
    page_map: dict[int, tuple[str, str]] = {}
    current_category = "Sonstige"

    for line in toc_lines:
        line = line.strip()
        cat_m = _CAT_RE.match(line)
        if cat_m:
            current_category = cat_m.group(1).strip()
            continue
        song_m = _TOC_SONG_RE.match(line)
        if song_m:
            title = song_m.group(1).strip()
            page = int(song_m.group(2))
            page_map[page] = (title, current_category)

    return page_map


# ── Song block parsing ────────────────────────────────────────────────────────

def parse_note_line(line: str) -> list[int]:
    """Convert a whitespace-separated notation line to a list of indices."""
    result = []
    for token in line.split():
        idx = token_to_index(token)
        if idx is not None:
            result.append(idx)
    return result


def is_structural_marker(line: str) -> bool:
    """True for lines like '1. Teil:', 'Korrekte Version:', etc."""
    if re.match(r'^\d+[\.\)]\s', line):
        return True
    if re.search(r'\b(?:Version|Position|Lage|Capo|Teil)\b', line, re.IGNORECASE):
        return True
    return False


def build_tablature(body_lines: list[str]) -> list[list[int]]:
    """Convert body lines (notes + structural markers) to 2-D index array.

    Structural markers become [] separator rows, but only when notes actually
    follow (already guaranteed by _postprocess_songs in pdf_to_txt.py).
    """
    tablature: list[list[int]] = []
    pending_sep = False  # defer [] until we know notes follow

    for line in body_lines:
        has_alpha = any(c.isalpha() for c in line)
        if has_alpha:
            if is_structural_marker(line):
                pending_sep = True
        else:
            row = parse_note_line(line)
            if row:
                if pending_sep and tablature:  # only insert [] between groups
                    tablature.append([])
                pending_sep = False
                tablature.append(row)

    return tablature


# ── Filename slug ─────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """Convert song name to safe filename slug."""
    # Normalise unicode (ä → ae, ö → oe, ü → ue, ß → ss handled manually)
    name = name.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    name = name.replace('Ä', 'ae').replace('Ö', 'oe').replace('Ü', 'ue')
    name = name.replace('ß', 'ss')
    # Strip remaining accents
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    # Lower, replace non-alphanumeric with hyphen
    name = re.sub(r'[^a-z0-9]+', '-', name.lower())
    return name.strip('-')


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    txt_path = project_root / 'data' / 'import' / 'tabheft.txt'
    library_dir = project_root / 'src' / 'library'
    manifest_path = library_dir / 'manifest.json'

    text = txt_path.read_text(encoding='utf-8')
    all_lines = text.splitlines()

    # Split into TOC section and song section
    toc_lines: list[str] = []
    song_section_lines: list[str] = []
    in_toc = True

    for line in all_lines:
        if line.startswith('#TITLE '):
            in_toc = False
        if in_toc:
            toc_lines.append(line)
        else:
            song_section_lines.append(line)

    page_map = parse_toc(toc_lines)

    # Group song_section_lines into blocks by #TITLE
    blocks: list[tuple[str, list[str]]] = []  # (title, body_lines)
    current_title: str | None = None
    current_body: list[str] = []

    for line in song_section_lines:
        m = re.match(r'^#TITLE "(.+)"$', line)
        if m:
            if current_title is not None:
                blocks.append((current_title, current_body))
            current_title = m.group(1)
            current_body = []
        else:
            if current_title is not None:
                current_body.append(line)

    if current_title is not None:
        blocks.append((current_title, current_body))

    print(f"Songs found in txt: {len(blocks)}")

    # Load existing manifest to find next free ID and avoid overwriting
    existing_manifest: list[dict] = []
    if manifest_path.exists():
        data = json.loads(manifest_path.read_text(encoding='utf-8'))
        existing_manifest = data.get('songs', [])

    existing_files = {e['file'] for e in existing_manifest}
    next_id = max((e['id'] for e in existing_manifest), default=0) + 1

    new_entries: list[dict] = []
    skipped = 0
    written = 0

    for title, body in blocks:
        tablature = build_tablature(body)
        if not tablature:
            skipped += 1
            continue  # no notes at all → skip

        # Look up category and page from TOC
        category = "Sonstige"
        page = 0
        # Try to find by matching title (fuzzy: lowercase, strip punctuation)
        def norm(s: str) -> str:
            return re.sub(r'[^a-z0-9]', '', s.lower())
        title_norm = norm(title)
        for pg, (toc_title, cat) in page_map.items():
            if norm(toc_title) in title_norm or title_norm in norm(toc_title):
                category = cat
                page = pg
                break

        filename = slugify(title) + '.json'

        if filename in existing_files:
            print(f"  SKIP (exists): {filename}")
            skipped += 1
            continue

        song_id = next_id
        next_id += 1

        song_obj = {
            "id": song_id,
            "name": title,
            "artist": "",
            "category": category,
            "page": page,
            "tablature": tablature,
        }

        out_path = library_dir / filename
        out_path.write_text(json.dumps(song_obj, ensure_ascii=False, indent=2), encoding='utf-8')
        new_entries.append({"file": filename, "id": song_id})
        written += 1
        print(f"  WRITE: {filename}  ({len(tablature)} rows, page {page}, {category})")

    # Append new entries to manifest
    if new_entries:
        updated_songs = existing_manifest + new_entries
        manifest_path.write_text(
            json.dumps({"songs": updated_songs}, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        print(f"\nManifest updated: {len(updated_songs)} total songs.")

    print(f"\nDone. Written: {written}, Skipped: {skipped}")


if __name__ == '__main__':
    main()

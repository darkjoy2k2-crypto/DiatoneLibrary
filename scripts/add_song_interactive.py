#!/usr/bin/env python3
"""Interactive tool to add or replace songs in src/library.

Input notation format expected by this tool:
    1,-1,_1;2,-2,_2;

Rules:
- Positive number (1..10)  -> blow
- Negative number (-1..-10)-> draw
- _n (for example _1)      -> bend on hole n
- _10_2                    -> second bend on hole 10
- Comma separates notes in a row
- Semicolon separates rows
- Empty row between semicolons becomes []
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

# Index mapping used by this project.
BLOW_IDX = [0, 3, 6, 9, 12, 14, 17, 19, 22, 25]
DRAW_IDX = [2, 5, 8, 11, 13, 16, 18, 21, 24, 28]
BEND_IDX = [1, 4, 7, 10, None, 15, None, 20, 23, 26]
BEND2_IDX = [None] * 9 + [27]


def slugify(name: str) -> str:
    """Create a safe, ASCII-like filename slug."""
    name = name.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    name = name.replace("Ä", "ae").replace("Ö", "oe").replace("Ü", "ue")
    name = name.replace("ß", "ss")
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    name = re.sub(r"[^a-z0-9]+", "-", name.lower())
    slug = name.strip("-")
    return slug or "song"


def ask(prompt: str, default: str | None = None, allow_empty: bool = False) -> str:
    while True:
        suffix = f" [{default}]" if default is not None else ""
        value = input(f"{prompt}{suffix}: ").strip()
        if not value and default is not None:
            return default
        if value or allow_empty:
            return value
        print("Bitte einen Wert eingeben.")


def ask_int(prompt: str, default: int | None = None, min_value: int | None = None) -> int:
    while True:
        raw = ask(prompt, default=str(default) if default is not None else None)
        try:
            value = int(raw)
        except ValueError:
            print("Bitte eine ganze Zahl eingeben.")
            continue
        if min_value is not None and value < min_value:
            print(f"Wert muss >= {min_value} sein.")
            continue
        return value


def ask_choice(prompt: str, options: dict[str, str], default: str) -> str:
    labels = " | ".join([f"{k}={v}" for k, v in options.items()])
    while True:
        choice = ask(f"{prompt} ({labels})", default=default).lower()
        if choice in options:
            return choice
        print("Ungueltige Auswahl.")


def token_to_index(token: str) -> tuple[int | None, str | None]:
    t = token.strip()
    if not t:
        return None, "Leerer Token"

    # Bend format: _1, _2, ..., _10, optional second bend on hole 10 as _10_2.
    bend_match = re.fullmatch(r"_(\d{1,2})(?:_(2))?", t)
    if bend_match:
        hole = int(bend_match.group(1))
        is_second = bend_match.group(2) == "2"
        if hole < 1 or hole > 10:
            return None, f"Ungueltiges Bend-Loch: {hole}"
        ch = hole - 1
        if is_second:
            idx = BEND2_IDX[ch]
            if idx is None:
                return None, f"2. Bend nur fuer Loch 10 erlaubt: {t}"
            return idx, None
        idx = BEND_IDX[ch]
        if idx is None:
            return None, f"Bend auf Loch {hole} ist nicht spielbar"
        return idx, None

    # Blow/Draw format: 1..10 or -1..-10
    try:
        num = int(t)
    except ValueError:
        return None, f"Unbekannter Token: {t}"

    hole = abs(num)
    if hole < 1 or hole > 10:
        return None, f"Loch ausserhalb 1..10: {t}"

    ch = hole - 1
    if num > 0:
        return BLOW_IDX[ch], None
    return DRAW_IDX[ch], None


def parse_notation(raw: str) -> tuple[list[list[int]] | None, list[str]]:
    """Parse compact notation string to tablature indices.

    Example input:
        1,-1,_1;2,-2,_2;
    """
    lines: list[list[int]] = []
    errors: list[str] = []

    segments = raw.split(";")
    for row_no, segment in enumerate(segments, start=1):
        text = segment.strip()

        # Ignore trailing separator.
        if not text and row_no == len(segments):
            continue

        # Empty segment means explicit blank row separator.
        if not text:
            lines.append([])
            continue

        tokens = [tok.strip() for tok in text.split(",") if tok.strip()]
        if not tokens:
            lines.append([])
            continue

        row: list[int] = []
        for token in tokens:
            idx, err = token_to_index(token)
            if err:
                errors.append(f"Zeile {row_no}, Token '{token}': {err}")
                continue
            row.append(idx)  # type: ignore[arg-type]

        if row:
            lines.append(row)

    if errors:
        return None, errors
    if not lines:
        return None, ["Keine gueltigen Noten erkannt."]
    return lines, []


def read_manifest(manifest_path: Path) -> list[dict]:
    if not manifest_path.exists():
        return []
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    songs = data.get("songs", [])
    if not isinstance(songs, list):
        raise ValueError("manifest.json hat kein gueltiges songs-Array")
    return songs


def write_manifest(manifest_path: Path, songs: list[dict]) -> None:
    songs_sorted = sorted(songs, key=lambda e: e.get("id", 0))
    manifest_path.write_text(
        json.dumps({"songs": songs_sorted}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def unique_filename(library_dir: Path, base_slug: str) -> str:
    candidate = f"{base_slug}.json"
    if not (library_dir / candidate).exists():
        return candidate

    i = 2
    while True:
        candidate = f"{base_slug}-{i}.json"
        if not (library_dir / candidate).exists():
            return candidate
        i += 1


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    library_dir = project_root / "src" / "library"
    manifest_path = library_dir / "manifest.json"

    library_dir.mkdir(parents=True, exist_ok=True)

    manifest = read_manifest(manifest_path)
    id_to_entry = {int(e["id"]): e for e in manifest if "id" in e}

    print("=== Diatone Song Tool ===")
    mode = ask_choice(
        "Modus waehlen",
        {"n": "Neue ID automatisch", "r": "Vorhandene ID ersetzen"},
        default="n",
    )

    if mode == "n":
        next_id = max(id_to_entry.keys(), default=0) + 1
        song_id = next_id
        print(f"Neue ID: {song_id}")
        existing_entry = None
    else:
        song_id = ask_int("Welche ID soll ersetzt werden", min_value=1)
        existing_entry = id_to_entry.get(song_id)
        if existing_entry is None:
            print(f"Fehler: ID {song_id} nicht im Manifest gefunden.")
            return
        print(f"Ersetze ID {song_id} (Datei: {existing_entry.get('file')})")

    name = ask("Songname")
    artist = ask("Artist", default="", allow_empty=True)
    category = ask("Kategorie", default="Sonstige")
    page = ask_int("Seite/Nummer", default=song_id, min_value=0)

    print("\nNotenformat: 1,-1,_1;2,-2,_2;")
    print("_n = Bend, ; = neue Zeile, leeres Segment (z. B. ;;) = Leerzeile")
    notation = ask("Noten eingeben")

    tablature, errors = parse_notation(notation)
    if errors:
        print("\nEingabefehler:")
        for err in errors:
            print(f"- {err}")
        return

    assert tablature is not None

    keep_filename = "j"
    if existing_entry is not None:
        keep_filename = ask_choice(
            "Vorhandenen Dateinamen beibehalten?",
            {"j": "Ja", "n": "Nein, neuen Slug verwenden"},
            default="j",
        )

    if existing_entry is not None and keep_filename == "j":
        filename = str(existing_entry.get("file"))
    else:
        filename = unique_filename(library_dir, slugify(name))

    song_data = {
        "id": song_id,
        "name": name,
        "artist": artist,
        "category": category,
        "page": page,
        "tablature": tablature,
    }

    song_path = library_dir / filename
    song_path.write_text(
        json.dumps(song_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if existing_entry is not None:
        for entry in manifest:
            if int(entry.get("id", -1)) == song_id:
                entry["file"] = filename
                break
    else:
        manifest.append({"file": filename, "id": song_id})

    write_manifest(manifest_path, manifest)

    note_count = sum(len(row) for row in tablature)
    print("\nFertig.")
    print(f"ID: {song_id}")
    print(f"Datei: src/library/{filename}")
    print(f"Zeilen: {len(tablature)} | Noten: {note_count}")


if __name__ == "__main__":
    main()

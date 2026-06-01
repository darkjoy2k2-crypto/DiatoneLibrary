#!/usr/bin/env python3
"""
Harmonica Tab PDF Converter
Konvertiert Mundharmonika-Tabulaturen aus PDF zu JSON
"""

import json
import re
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional

# Tone-Index Mapping (0-28): Nach Kanal + Typ sortiert
TONE_INDEX_MAP = {
    # Blasen (blow)
    '1': 0, '2': 3, '3': 6, '4': 9, '5': 12, '6': 14, '7': 17, '8': 19, '9': 22, '10': 25,
    # Ziehen (draw) - negativ
    '-1': 2, '-2': 5, '-3': 8, '-4': 11, '-5': 13, '-6': 16, '-7': 18, '-8': 21, '-9': 24, '-10': 28,
    # Bendings
    '1b': 1, '2b': 4, '3b': 7, '4b': 10, '6b': 15, '8b': 20, '9b': 23, '10b': 26, '10b2': 27,
    '-1b': 1, '-2b': 4, '-3b': 7, '-4b': 10, '-6b': 15, '-8b': 20, '-9b': 23,
}

class HarmonicaConverter:
    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF nicht gefunden: {pdf_path}")

    def extract_text(self, page: Optional[int] = None) -> str:
        """Extrahiert Text aus PDF mit pdftotext"""
        try:
            cmd = ['pdftotext', str(self.pdf_path), '-']
            if page:
                cmd.extend(['-f', str(page), '-l', str(page)])
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout
        except FileNotFoundError:
            print("ERROR: pdftotext nicht gefunden. Bitte installieren:")
            print("  Windows: choco install xpdf")
            print("  Linux: apt-get install poppler-utils")
            print("  Mac: brew install poppler")
            sys.exit(1)

    def parse_notes_from_text(self, text: str) -> List[List[int]]:
        """
        Parsed Note-Sequenzen aus Text
        Erkennt: 1-10 (Blasen), -1 bis -10 (Ziehen), Bendings wie -1b, 8b, 10b2
        """
        lines = text.split('\n')
        tablature = []
        current_line = []

        for raw_line in lines:
            line = raw_line.strip()

            # Ignoriere Leerzeilen und Text-Zeilen
            if not line or self._is_text_line(line):
                if current_line:
                    tablature.append(current_line)
                    current_line = []
                continue

            # Extrahiere Note-Strings aus der Zeile
            notes = self._extract_notes_from_line(line)

            if notes:
                # Konvertiere zu Indizes
                indices = []
                for note in notes:
                    idx = self._note_to_index(note)
                    if idx is not None:
                        indices.append(idx)

                if indices:
                    current_line.extend(indices)

        # Letzte Zeile speichern
        if current_line:
            tablature.append(current_line)

        return tablature

    def _is_text_line(self, line: str) -> bool:
        """Erkennt ob eine Zeile hauptsächlich Text (Lyrics) ist"""
        # Text-Zeilen haben meist längere Wörter und wenig Zahlen
        words = line.split()
        if not words:
            return True

        # Zähle Zahlen vs Text
        number_count = len(re.findall(r'-?\d+b?\d?', line))
        text_count = len(re.findall(r'[a-zäöüß]{2,}', line, re.IGNORECASE))

        # Wenn mehr Text als Noten → Text-Zeile
        return text_count > number_count

    def _extract_notes_from_line(self, line: str) -> List[str]:
        """Extrahiert Note-Strings aus einer Zeile"""
        # Pattern: -?\d+b?\d? (z.B.: 1, -1, 8b, 10b2, -6b)
        pattern = r'-?\d+b?\d?'
        matches = re.findall(pattern, line)

        # Validiere: nur 1-10, -1 bis -10, mit optionalen Bendings
        valid_notes = []
        for match in matches:
            if self._is_valid_note(match):
                valid_notes.append(match)

        return valid_notes

    def _is_valid_note(self, note: str) -> bool:
        """Prüft ob ein Note-String valide ist"""
        # Extrahiere Kanal (ohne Minus-Zeichen und Bending)
        match = re.match(r'(-?)(\d+)b?(\d?)', note)
        if not match:
            return False

        sign, hole, bend = match.groups()
        hole_num = int(hole)

        # Kanal muss 1-10 sein
        if hole_num < 1 or hole_num > 10:
            return False

        # Bekannte unmögliche Bendings
        if note in ['-5b', '-7b']:
            return False

        return True

    def _note_to_index(self, note: str) -> Optional[int]:
        """Konvertiert Note-String zu Index (0-28)"""
        if note in TONE_INDEX_MAP:
            return TONE_INDEX_MAP[note]

        # Versuche mit Bending-Varianten
        # z.B. "-2b1" → "-2b"
        normalized = re.sub(r'b\d+', 'b', note)
        if normalized in TONE_INDEX_MAP:
            return TONE_INDEX_MAP[normalized]

        # Fallback: Versuche ohne Bending
        note_without_bending = re.sub(r'b\d?', '', note)
        if note_without_bending in TONE_INDEX_MAP:
            return TONE_INDEX_MAP[note_without_bending]

        return None

    def detect_columns(self, text: str) -> int:
        """Erkennt mehrspaltige Layouts (sehr einfaches Heuristik)"""
        # Schau nach horizontaler Verteilung von Noten
        # Vereinfachte Heuristik: wenn Zeile zu lang, wahrscheinlich 2 Spalten
        max_line_length = max(len(line) for line in text.split('\n'))
        return 2 if max_line_length > 120 else 1

    def convert_page(
        self,
        page: int,
        song_name: str,
        artist: str = "",
        category: str = "",
        song_id: int = 0
    ) -> Dict:
        """
        Konvertiert eine PDF-Seite zu JSON-Struktur
        """
        print(f"Konvertiere Seite {page}: {song_name}")

        # Extrahiere Text
        text = self.extract_text(page)

        # Parse Noten
        tablature = self.parse_notes_from_text(text)

        if not tablature:
            print(f"  ⚠️  Keine Noten gefunden auf Seite {page}")
            return None

        print(f"  ✓ {len(tablature)} Reihen gefunden")

        return {
            "id": song_id,
            "name": song_name,
            "artist": artist,
            "category": category,
            "page": page,
            "tablature": tablature
        }

    def save_json(self, data: Dict, output_path: str):
        """Speichert Song-Daten als JSON"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  ✓ Gespeichert: {output_file}")


def main():
    """CLI-Interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Konvertiert Mundharmonika-Tabulaturen aus PDF zu JSON'
    )
    parser.add_argument('pdf', help='PDF-Datei')
    parser.add_argument('--page', type=int, required=True, help='PDF-Seite')
    parser.add_argument('--name', required=True, help='Liedtitel')
    parser.add_argument('--artist', default='', help='Interpret')
    parser.add_argument('--category', default='', help='Kategorie')
    parser.add_argument('--id', type=int, default=0, help='Song-ID')
    parser.add_argument('--output', required=True, help='Output JSON-Datei')

    args = parser.parse_args()

    try:
        converter = HarmonicaConverter(args.pdf)
        song_data = converter.convert_page(
            page=args.page,
            song_name=args.name,
            artist=args.artist,
            category=args.category,
            song_id=args.id
        )

        if song_data:
            converter.save_json(song_data, args.output)
            print("\n✅ Konvertierung erfolgreich!")
        else:
            print("\n❌ Keine Daten konvertiert")
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ Fehler: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

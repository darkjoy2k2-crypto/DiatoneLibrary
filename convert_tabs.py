#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Tab notation to 0-28 index converter
# Based on Hohner diatonic harmonica (C major, 10 holes)

# 0-28 Index mapping (from toneIndexMap in loader.js):
# 0-2: Channel 1 (hole 1): blow, bend, draw
# 3-5: Channel 2 (hole 2): blow, bend, draw
# 6-8: Channel 3 (hole 3): blow, bend, draw
# 9-11: Channel 4 (hole 4): blow, bend, draw
# 12-13: Channel 5 (hole 5): blow, draw (no bend)
# 14-16: Channel 6 (hole 6): blow, bend, draw
# 17-18: Channel 7 (hole 7): blow, draw (no bend)
# 19-21: Channel 8 (hole 8): blow, bend, draw
# 22-24: Channel 9 (hole 9): blow, bend, draw
# 25-28: Channel 10 (hole 10): blow, bend 1HT, bend 2HT, draw

index_map = {
    # Channel 1-4: blow, bend, draw
    '1': 0, '1b': 1, '-1': 2,
    '2': 3, '2b': 4, '-2': 5,
    '3': 6, '3b': 7, '-3': 8,
    '4': 9, '4b': 10, '-4': 11,
    # Channel 5: blow, draw (no bend)
    '5': 12, '-5': 13,
    # Channel 6: blow, bend, draw
    '6': 14, '6b': 15, '-6': 16,
    # Channel 7: blow, draw (no bend)
    '7': 17, '-7': 18,
    # Channel 8: blow, bend, draw
    '8': 19, '8b': 20, '-8': 21,
    # Channel 9: blow, bend, draw
    '9': 22, '9b': 23, '-9': 24,
    # Channel 10: blow, bend 1HT, bend 2HT, draw
    '10': 25, '10b1': 26, '10b2': 27, '-10': 28,
}

def parse_tab_notation(notation_str):
    """Parse tab notation string and convert to indices"""
    # Split by spaces and filter empty strings
    notes = [n.strip() for n in notation_str.split() if n.strip()]

    indices = []
    for note in notes:
        if note in index_map:
            indices.append(index_map[note])
        else:
            print(f"WARNING: Unknown notation '{note}'")

    return indices

def display_indices(indices):
    """Display indices for verification"""
    toneIndexMap = [
        # Kanal 1
        (0, 1, 'blow', 'C'), (1, 1, 'bend', 'Db'), (2, 1, 'draw', 'D'),
        # Kanal 2
        (3, 2, 'blow', 'E'), (4, 2, 'bend', 'F#'), (5, 2, 'draw', 'G'),
        # Kanal 3
        (6, 3, 'blow', 'G'), (7, 3, 'bend', 'Bb'), (8, 3, 'draw', 'B'),
        # Kanal 4
        (9, 4, 'blow', 'C'), (10, 4, 'bend', 'Db'), (11, 4, 'draw', 'D'),
        # Kanal 5
        (12, 5, 'blow', 'E'), (13, 5, 'draw', 'F'),
        # Kanal 6
        (14, 6, 'blow', 'G'), (15, 6, 'bend', 'Ab'), (16, 6, 'draw', 'A'),
        # Kanal 7
        (17, 7, 'blow', 'C'), (18, 7, 'draw', 'B'),
        # Kanal 8
        (19, 8, 'blow', 'E'), (20, 8, 'bend', 'Eb'), (21, 8, 'draw', 'D'),
        # Kanal 9
        (22, 9, 'blow', 'G'), (23, 9, 'bend', 'Ab'), (24, 9, 'draw', 'F'),
        # Kanal 10
        (25, 10, 'blow', 'C'), (26, 10, 'bend', 'B'), (27, 10, 'bend', 'Bb'), (28, 10, 'draw', 'A'),
    ]

    # Create lookup
    tone_info = {info[0]: info for info in toneIndexMap}

    display = []
    for idx in indices:
        if idx in tone_info:
            info = tone_info[idx]
            idx_num, hole, typ, tone = info
            if typ == 'blow':
                display.append(f"{hole}")
            elif typ == 'draw':
                display.append(f"({hole})")
            elif typ == 'bend':
                display.append(f"{hole}̲")  # with underline

    return display

def convert_song(song_name, rows_list):
    """Convert a song with multiple rows"""
    print(f"\n=== {song_name} ===")
    indices_list = []
    for i, row in enumerate(rows_list, 1):
        print(f"Reihe {i}:")
        print(f"  Tab notation: {row}")
        indices = parse_tab_notation(row)
        print(f"  Indices: {indices}")
        print(f"  Display: {' '.join(display_indices(indices))}")
        indices_list.append(indices)

    print(f"\nJSON Output:")
    print(f'"tablature": [')
    for i, indices in enumerate(indices_list):
        comma = "," if i < len(indices_list) - 1 else ""
        print(f"  {indices}{comma}")
    print(f"]")
    return indices_list

# Song 4: Die rechte und die linke Hand des Teufels
rows_song4 = [
    "-5 6 -6 6 -5 6 -6 6 5",
    "-5 6 -6 -8 7",
    "-5 6 -6 6 -5 6 -6 6 -4",
    "-4 4 -4 -5 -4 4 -4 -5",
    "-4 4 -4 -5 -4 4 -4"
]
convert_song("DIE RECHTE UND DIE LINKE HAND DES TEUFELS", rows_song4)

# Song 5: Don Camillo
rows_song5 = [
    "4 5 -4 5 -4 4 5 -4",
    "-4 5 -5 -5 5 -4 4 -4 5",
    "5 6 -5 5 -4 5 -5 5",
    "4 5 -4 4 -3 4 -4",
    "5 6 -5 5 -4 5 -5 5",
    "4 5 -4 4 -3 4 -4 4"
]
convert_song("DON CAMILLO", rows_song5)

# Song 6: Ein Herz und eine Seele
rows_song6 = [
    "6 5 4 -6",
    "6 5 4 6",
    "-5 -4 -3 6",
    "-5 -4 -3 -6",
    "6 5 4 -6",
    "6 5 4 6",
    "-5 -4 -3 6",
    "-5 -4 -3 4"
]
convert_song("EIN HERZ UND EINE SEELE", rows_song6)

# Song 11: Großstadtrevier
rows_song11 = [
    "6 6 6 7 7 7 -5",
    "-6 -6 -6 6 6 -6",
    "-6 -6 -6 -6 -6 6 5 -4 5",
    "6 6 6 7 7 7 -5",
    "-6 -6 -6 6 6 6 -6",
    "-6 -6 -6 6 5 -4 5",
    "6 6 6 7 7 7 7 -5",
    "-6 -6 6 6 -6",
    "-6 -6 6 5 -4 5",
    "6 6 6 7 7 7 7 -5",
    "-6 -6 6 6 -6",
    "-6 -6 -6 -6 6 5 -4 4",
    "6 -6 7 -6 6",
    "5 -4 4 -4 5",
    "6 6 -6 7 -6 -6 6",
    "6 6 -6 -7 7 -8"
]
convert_song("GROßSTADTREVIER", rows_song11)

# Song 13: He's a pirate (Fluch der Karibik)
rows_song13 = [
    "4 -4 -4 -4 5 -5 -5 -5 6 5 5 -4 4 4 -4",
    "4 -4 -4 -4 5 -5 -5 -5 6 5 5 -4 4 -4",
    "4 -4 -4 -4 5 -5 -5 -5 6 -6 -6 6 -5 6 4",
    "4 -5 -5 6 -6 -4",
    "-4 -5 5 5 -4 4 -4",
    "4 -4 -4 -4 5 -5 -5 -5 6 5 5 -4 4 4 -4",
    "4 -4 -4 -4 5 -5 -5 -5 6 5 5 -4 4 -4",
    "4 -4 -4 -4 5 -5 -5 -5 6 -6 -6 6 -5 6 4",
    "4 -5 -5 6 -6 -4",
    "-4 -5 5 5 -4 4 -4",
    "-4 5 -5 -5 6",
    "-6 -5 -4 -3",
    "-7 -5 -4 -3",
    "-4 5 -5 6 -6 6 -5 5 -5 6 -6 6",
    "-5 6 -6 6 -5 5 -5 5 -4 5 4 -4",
    "-4 5 -5 5 -5 6 -5 6 -6 6 -5 -4",
    "-4 5 -5 6 -6 -8 -4 -5 5 -5 5 -4",
    "-4 -3 -4 5 -3 5 -5 5 -4 5",
    "-4 5 -5 5 -4 -4 -5",
    "-3 3 -2 3 -3 -3 -4",
    "-4 4 -4 5 -5 -4 -5 5 4 -4",
    "-4 4 -4 5 -5 6 -6 5 4",
    "-4 4 -4 5 -5 -4 -5 5 4 -4",
    "-4 4 -4 5 -5 6 -6 -7 -8",
    "-4 5 -5 6 -6 6 -5 5 -5 6 -6 6",
    "-5 6 -6 6 -4 -4",
    "-4 -4 -4 5 -4 -4 5 -4"
]
convert_song("HE'S A PIRATE (FLUCH DER KARIBIK)", rows_song13)

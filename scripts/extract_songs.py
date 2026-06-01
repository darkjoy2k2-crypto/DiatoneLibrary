#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract and convert harmonica tabs from PDF
"""
import re
import subprocess
import json
from pathlib import Path

# Kanal (1-10) + Type -> Index (0-28)
CHANNEL_TO_INDEX = {
    "1_blow": 0, "1_bend": 1, "1_draw": 2,
    "2_blow": 3, "2_bend": 4, "2_draw": 5,
    "3_blow": 6, "3_bend": 7, "3_draw": 8,
    "4_blow": 9, "4_bend": 10, "4_draw": 11,
    "5_blow": 12, "5_bend": 13, "5_draw": 14,
    "6_blow": 15, "6_bend": 16, "6_draw": 17,
    "7_blow": 18, "7_bend": 19, "7_draw": 20,
    "8_blow": 21, "8_bend": 22, "8_draw": 23,
    "9_blow": 24, "9_bend": 25, "9_draw": 26,
    "10_blow": 27, "10_bend": 28,
}

def parse_tabs(tab_str):
    """Convert raw tab string to index array, handling spaces/newlines as line breaks"""
    # Split by newlines first - each line becomes a separate reihe (row)
    lines = tab_str.strip().split('\n')
    result_reihen = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Parse tokens in this line
        tokens = line.split()
        reihe = []

        for token in tokens:
            token = token.strip()
            if not token:
                continue

            # Check for bend notation (o or ')
            is_bend = token.endswith('o') or token.endswith("'")
            if is_bend:
                token = token[:-1]

            # Handle special case like "6546" (multiple digits without spaces)
            if len(token) > 1 and token[0] != '-':
                # Split into individual digits
                for digit in token:
                    try:
                        val = int(digit)
                        channel = val
                        key = f"{channel}_blow"
                        if key in CHANNEL_TO_INDEX:
                            reihe.append(CHANNEL_TO_INDEX[key])
                    except ValueError:
                        pass
                continue

            try:
                value = int(token)

                if value > 0:
                    # Positive = blow
                    channel = value
                    type_ = "bend" if is_bend else "blow"
                    key = f"{channel}_{type_}"
                    if key in CHANNEL_TO_INDEX:
                        reihe.append(CHANNEL_TO_INDEX[key])
                elif value < 0:
                    # Negative = draw
                    channel = -value
                    type_ = "bend" if is_bend else "draw"
                    key = f"{channel}_{type_}"
                    if key in CHANNEL_TO_INDEX:
                        reihe.append(CHANNEL_TO_INDEX[key])
                # 0 would be pause, handled separately
            except ValueError:
                pass

        if reihe:
            result_reihen.append(reihe)

    return result_reihen

# Manual data from PDF pages 8-10
MANUAL_TABS = {
    "Die rechte und die linke Hand des Teufels": "-5 6 -6 6 -5 6 -6 6 5 -5 6 -6 -8 7 -5 6 -6 6 -5 6 -6 6 -4 -4 4 -4 -5 -4 4 -4 -5 -4 4 -4 -5 -4 4 -4",
    "Don Camillo": "4 5 -4 5 -4 4 5 -4 -4 5 -5 -5 5 -4 4 -4 5 5 6 -5 5 -4 5 -5 5 4 5 -4 4 -3 4 -4 5 6 -5 5 -4 5 -5 5 4 5 -4 4 -3 4 -4 4",
    "Ein Herz und eine Seele": "6 5 4 -6 6546 -5 -4 -3 6 -5 -4 -3 -6\n6 5 4 -6 6546 -5 -4 -3 6 -5 -4 -3 4",
}

def main():
    print("=== Harmonica Tab Converter ===\n")

    results = {}

    for song_name, raw_tabs in MANUAL_TABS.items():
        print(f"{song_name}:")
        print(f"  Raw tabs: {raw_tabs[:60]}...")

        reihen = parse_tabs(raw_tabs)
        print(f"  Converted: {len(reihen)} reihen")
        for i, r in enumerate(reihen):
            print(f"    Reihe {i+1}: {r}")

        results[song_name] = {
            "raw_tabs": raw_tabs,
            "reihen": reihen
        }
        print()

    # Save results
    output_file = Path("f:/Projekte/DiatoneLibrary/scripts/songs_4_5_6.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"[OK] Saved to {output_file}")

if __name__ == "__main__":
    main()

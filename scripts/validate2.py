from pathlib import Path

L = Path('F:/Projekte/DiatoneLibrary/data/import/tabheft.txt').read_text(encoding='utf-8').splitlines()
print(f'Zeilen gesamt: {len(L)}')

# He's a pirate
hits = [(j,l) for j,l in enumerate(L) if 'pirate' in l.lower() and len(l) < 60]
i = hits[-1][0]
print('\n--- Hes a Pirate ---')
for line in L[i-1:i+32]: print(repr(line))

# Tabaluga
hits2 = [(j,l) for j,l in enumerate(L) if 'erwachsen' in l.lower() and len(l) < 70]
i2 = hits2[-1][0]
print('\n--- Tabaluga ---')
for line in L[i2-1:i2+15]: print(repr(line))

# Alle Voegel - check space normalisation
hits3 = [(j,l) for j,l in enumerate(L) if 'Alle V' in l and 'TITLE' in l]
i3 = hits3[0][0]
print('\n--- Alle Voegel ---')
for line in L[i3-1:i3+12]: print(repr(line))

# Version markers
print('\n--- Version/Position markers ---')
for j,l in enumerate(L):
    if ('Version' in l or 'Position' in l) and any(c.isalpha() for c in l):
        print(f'{j}: {l!r}')

# Check no multi-spaces in notation lines
print('\n--- Multi-space check (should be empty) ---')
for j,l in enumerate(L):
    if not any(c.isalpha() for c in l) and '  ' in l:
        print(f'{j}: {l!r}')

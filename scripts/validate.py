from pathlib import Path
L = Path('F:/Projekte/DiatoneLibrary/data/import/tabheft.txt').read_text(encoding='utf-8').splitlines()
print(f'Zeilen gesamt: {len(L)}')

# He's a pirate
hits = [(j,l) for j,l in enumerate(L) if 'pirate' in l.lower() and len(l) < 50]
for j,l in hits: print(f'{j}: {l!r}')
if hits:
    i = hits[-1][0]  # last = song content, not TOC
    print()
    print('--- Hes a Pirate ---')
    for line in L[i-1:i+30]: print(repr(line))
print()

# Tabaluga
hits2 = [(j,l) for j,l in enumerate(L) if 'erwachsen' in l.lower() and len(l) < 60]
for j,l in hits2: print(f'{j}: {l!r}')
if hits2:
    i2 = hits2[-1][0]
    print()
    print('--- Tabaluga ---')
    for line in L[i2-1:i2+30]: print(repr(line))

# Version markers
print()
print('--- Version/Position markers ---')
for j,l in enumerate(L):
    if ('Version' in l or 'Position' in l) and any(c.isalpha() for c in l):
        print(f'{j}: {l!r}')

# Projekt-Spezifikation: Diatone-Library (Phase 1-3)

## System-Architektur & Vorgaben
* **Technologie:** Single-Page-Application (SPA) mit HTML5, CSS3, nativem JavaScript (ES6+). Keine Frameworks.
* **Zielplattform:** Tablet (Touch-optimiert, Quer-/Hochformat)
* **Code:** Modular aufgeteilt in separate HTML/CSS/JS-Dateien für bessere Wartbarkeit

---

## Dateistruktur (modular)

```
src/
├── index.html (vereinfacht, nur HTML-Struktur)
├── css/
│   └── style.css (gesamte CSS-Styling)
└── js/
    ├── core/
    │   ├── data.js (songDatabase, noteNames, harmonicaMapping)
    │   ├── state.js (appState - Zustandsverwaltung)
    │   └── audio.js (Web Audio API Funktionen)
    ├── ui/
    │   ├── ui.js (renderTablature, highlightNote, clearHighlight, updateButtonStates)
    │   ├── controls.js (toggleTheme, toggleNotes, zoomIn/Out, setZoomLevel, applyTheme)
    │   └── navigation.js (selectSong, populateSongDropdown)
    ├── playback.js (playTablature, playAudio, pauseAudio, stopPlayback, stopAudio)
    └── events.js (attachEventListeners, initApp)
```

**Script-Lade-Reihenfolge (kritisch):**
1. `core/data.js` - Datenquellen
2. `core/audio.js` - Audio-Funktionen
3. `core/state.js` - State (hängt von data ab)
4. `ui/ui.js` - UI Rendering
5. `ui/controls.js` - Control-Handler
6. `playback.js` - Playback-Logik
7. `ui/navigation.js` - Navigation
8. `events.js` - Event-Binding (letzte Datei!)

---

## Phase 1: Grundphase – UI-Framework & Lokalisierung

### 1. HTML5 Oberflächen-Struktur
* **Menüband (Header):** Fixiert oben, horizontal, Touch-Buttons mindestens 44x44px
* **Hauptfenster (Main):** Flex-Container für Willkommensansicht oder Tabulatur

### 2. Menüband-Komponenten (links → rechts)
* **Songs-Dropdown:** Lieder nach Kategorien
* **Transposition:** Tonarten (C/G/D/A/F-Dur) - geplant
* **Mediaplayer:** Play/Pause/Stop Buttons
* **Spacer:** Flexibler Abstand
* **Zoom:** +/− Buttons (50%-200%)
* **Theme:** Dark/Light Toggle
* **Language:** DE/EN (geplant)

### 3. Tabulatur-Display
* Zentrisch angeordnet
* Responsive Font-Size (clamp)
* Notations-Darstellung:
  - Blasen: `1 2 3...`
  - Ziehen: `(1) (2) (3)...`
  - Bendings: `(4)_` oder `4_` mit Unterstrich (nur auf der Zahl!)
  - Unmögliche Bendings: `✗` (nicht spielbar)

---

## Phase 2: Tabulatur-Rendering & Zoom

### 1. Tabulatur-Datenstruktur
```javascript
{
  id: number,
  name: string,
  category: string,
  page: number,
  tablature: Array<Array<string>>  // 2D-Array (Zeilen × Noten)
}
```

### 2. Noten-Format
* `1-10` = Blasen (Kanzellen 1-10)
* `-1` bis `-10` = Ziehen
* `-1b`, `-2b1`, `-3b` = Zieh-Bendings
* `8b`, `9b`, `10b1`, `10b2` = Blas-Bendings

### 3. Zoom-Funktionalität
* Buttons: +/− in 10%-Schritten (50%-200%)
* localStorage-Persistierung
* Font-Size-Anpassung

---

## Phase 3: Audio-Playback & Interaktivität

### 1. Diatonische Mundharmonika C-Dur (Richter, 10-Kanal)
**Physikalisch korrekte Frequenzen bei A4 = 440 Hz**

#### Blasen (Kern-Töne)
| Kanzelle | Ton | ISO-Oktave | Frequenz |
|----------|-----|-----------|----------|
| 1 | C | C4 | 261.63 Hz |
| 2 | E | E4 | 329.63 Hz |
| 3 | G | G4 | 392.00 Hz |
| 4 | C | C5 | 523.25 Hz |
| 5 | E | E5 | 659.25 Hz |
| 6 | G | G5 | 783.99 Hz |
| 7 | C | C6 | 1046.50 Hz |
| 8 | E | E6 | 1318.51 Hz |
| 9 | G | G6 | 1567.98 Hz |
| 10 | C | C7 | 2093.00 Hz |

#### Ziehen (Kern-Töne)
| Kanzelle | Ton | ISO-Oktave | Frequenz |
|----------|-----|-----------|----------|
| 1 | D | D4 | 293.66 Hz |
| 2 | G | G4 | 392.00 Hz |
| 3 | B (H) | B4 | 493.88 Hz |
| 4 | D | D5 | 587.33 Hz |
| 5 | F | F5 | 698.46 Hz |
| 6 | A | A5 | 880.00 Hz |
| 7 | B (H) | B5 | 987.77 Hz |
| 8 | D | D6 | 1174.66 Hz |
| 9 | F | F6 | 1396.91 Hz |
| 10 | A | A6 | 1760.00 Hz |

#### Zieh-Bendings (erste Stufe)
- **Kanzelle 1:** Db4 = 277.18 Hz
- **Kanzelle 2:** F#4 = 369.99 Hz
- **Kanzelle 3:** Bb4 = 466.16 Hz
- **Kanzelle 4:** Db5 = 554.37 Hz
- **Kanzelle 6:** Ab5 = 830.61 Hz

#### Blas-Bendings (erste Stufe)
- **Kanzelle 8:** Eb6 = 1244.51 Hz
- **Kanzelle 9:** Ab6 = 1479.98 Hz
- **Kanzelle 10 (1HT):** B6 = 1975.53 Hz
- **Kanzelle 10 (2HT):** Bb6 = 1864.69 Hz

#### Unmögliche Bendings
- **Kanzelle 5:** Kein Zieh-Bending (E-F = 1 Halbton)
- **Kanzelle 7:** Kein Zieh-Bending (B-C = 1 Halbton)

### 2. Play/Pause/Stop State Management
* **Play:** Startet oder setzt fort (AbortController für Pausierbarkeit)
* **Pause:** Pausiert (ohne Audio zu stoppen, nur Loop unterbrechen)
* **Stop:** Stoppt + Reset (Zeile 0, Note 0)
* **Button-UI:** Play/Pause/Stop wechseln je nach State

### 3. Audio-Rendering
* Web Audio API: OscillatorNode (Sine-Wave für melleres Harmonica-Sound)
* Note-Dauer: 200ms
* Pausen: 100ms zwischen Noten, 400ms nach Zeile
* Envelope: Attack (50ms) → Sustain → Release (linear, kein exponentieller Fade)
* Volumen: 0.4 Peak mit linearer Rampe

### 4. Interaktivität
* **Highlighting:** Aktuelle Note während Playback (blue glow, active Klasse)
* **Click-to-Play:** Einzelne Noten anklickbar (nur wenn nicht spielend)
* **Unmögliche Bendings:** `✗` Darstellung, nicht anklickbar

### 5. Impossible Bendings-Logik
```javascript
const impossibleBendings = ['-5b', '-7b'];
// Markierung: '✗' statt Note, nicht anklickbar
```

---

## Implementation Details

### renderTablature()
1. Prüfe auf unmögliche Bendings (includes '-5b' oder '-7b')
2. Prüfe auf Bendings (includes 'b')
3. Render mit richtigem HTML (Spans für Unterstrich auf Ziffer)
4. Add Event-Listener für Click-to-Play
5. Skalierung basierend auf zoomLevel

### harmonicaMapping
* Key = Noten-String (`1`, `-1`, `-1b`, `8b`, `10b2`, etc.)
* Value = Frequenz in Hz (physikalisch korrekt)
* Alle 10 Kanäle mit Blasen, Ziehen und Bendings

### CSS für Bendings
* `.note.bend` Klasse für visuelle Markierung
* Inneres `<span>` mit `text-decoration: underline` nur auf der Ziffer
* Kein Unterstrich im Abstand/Padding

### localStorage Keys
* `app-theme` = 'light' | 'dark'
* `app-zoom-level` = '50' | '60' | ... | '200'
* `app-show-notes` = 'true' | 'false'

---

## Lieder (songDatabase)

### Kategorien
- **Test:** Test-Lied mit allen Noten & Bendings
- **Film- und Musicalmusik:**
  - Das Krokodil und sein Nilpferd (Seite 5)
  - Denk an mich (Phantom der Oper, Seite 6)
  - Der Pate (Godfather Theme, Seite 7)

---

## Audio-Synthese Details

### Waveform & Envelope
```javascript
// Sine-Wave (statt Square) für melleren Harmonica-Sound
oscillator.type = 'sine';

// Attack: 50ms (0 → 0.4)
// Sustain: bei 0.35 (bulk der duration)
// Release: zum Ende linear runter auf 0
gainNode.gain.setValueAtTime(0, ctx.currentTime);
gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + dur - 0.1);
gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
```

### Playback-Timing
- Note-Dauer: 200ms
- Inter-Note Pause: 100ms
- Inter-Line Pause: 400ms
- State: `currentLineIndex`, `currentNoteIndex` für Resume nach Pause

---

## Song-Import aus PDF

### Wichtige Hinweise beim Extrahieren von Tabulaturen aus PDF:

1. **Mehrspaltige Layouts:** Manche Lieder sind zweispaltig (oder mehr). Beide Spalten müssen extrahiert werden, nicht nur die erste.
2. **Texte ignorieren:** Songtexte, Liedzeilen und andere Textelemente müssen ignoriert werden - nur die Noten-Zeilen behalten.
3. **Reihen-Struktur:** Jede Reihe von Noten wird als Array gespeichert. Pausen/Leerzeilen zwischen Abschnitten werden als leeres Array `[]` dargestellt.
4. **Noten-Format im PDF:** Noten sind als Strings wie `1`, `-1`, `-6b`, `8b`, etc. notiert.
5. **Konvertierung:** Noten-Strings werden zu Indizes 0-28 konvertiert nach Kanal+Typ Sortierung:
   - `1` → 0, `2` → 3, `3` → 6, ..., `10` → 25 (Blasen)
   - `-1` → 2, `-2` → 5, `-3` → 8, ..., `-10` → 28 (Ziehen)
   - `-1b` → 1, `-2b1` → 4, `-3b1` → 7, etc. (Bendings)

---

## Ton-Index-Mapping (0-28)

**Alle Töne nach aufsteigender Frequenz indiziert für Song-Dateien:**

| Index | Kanzelle | Typ | Ton | Frequenz |
|-------|----------|-----|-----|----------|
| 0 | 1 | Blasen | C4 | 261.63 Hz |
| 1 | 1 | Bending | Db4 | 277.18 Hz |
| 2 | 1 | Ziehen | D4 | 293.66 Hz |
| 3 | 2 | Blasen | E4 | 329.63 Hz |
| 4 | 2 | Bending | F#4 | 369.99 Hz |
| 5 | 2 | Ziehen | G4 | 392.00 Hz |
| 6 | 3 | Blasen | G4 | 392.00 Hz |
| 7 | 3 | Bending | Bb4 | 466.16 Hz |
| 8 | 3 | Ziehen | B4 | 493.88 Hz |
| 9 | 4 | Blasen | C5 | 523.25 Hz |
| 10 | 4 | Bending | Db5 | 554.37 Hz |
| 11 | 4 | Ziehen | D5 | 587.33 Hz |
| 12 | 5 | Blasen | E5 | 659.25 Hz |
| 13 | 5 | Ziehen | F5 | 698.46 Hz |
| 14 | 6 | Blasen | G5 | 783.99 Hz |
| 15 | 6 | Bending | Ab5 | 830.61 Hz |
| 16 | 6 | Ziehen | A5 | 880.00 Hz |
| 17 | 7 | Blasen | C6 | 1046.50 Hz |
| 18 | 7 | Ziehen | B5 | 987.77 Hz |
| 19 | 8 | Blasen | E6 | 1318.51 Hz |
| 20 | 8 | Bending | Eb6 | 1244.51 Hz |
| 21 | 8 | Ziehen | D6 | 1174.66 Hz |
| 22 | 9 | Blasen | G6 | 1567.98 Hz |
| 23 | 9 | Bending | Ab6 | 1479.98 Hz |
| 24 | 9 | Ziehen | F6 | 1396.91 Hz |
| 25 | 10 | Blasen | C7 | 2093.00 Hz |
| 26 | 10 | Bending 1HT | B6 | 1975.53 Hz |
| 27 | 10 | Bending 2HT | Bb6 | 1864.69 Hz |
| 28 | 10 | Ziehen | A6 | 1760.00 Hz |

**Song-Dateien verwenden nur die Index-Nummern (0-28):**
- Reverse-Mapping (Index → Frequenz/Ton-Name) erfolgt im JavaScript
- Tabulaturen sind 2D-Arrays mit Index-Nummern
- Beispiel: `[0, 1, 2, 3, 4, 5]` statt `[1, -1b, -1, 2, -2b1, -2]`
* PDF-Parsing für automatische Tabulatur-Extraktion
* Mehrsprachige UI (Deutsch/Englisch vollständig)
* Transpose-Funktionalität (Tonarten wechseln)
* Tempo-Regler für Playback
* Recording/Playback-Speicherung
* Overblow-Techniken für erweiterte Noten
* Sequenzer für eigene Lied-Erstellung

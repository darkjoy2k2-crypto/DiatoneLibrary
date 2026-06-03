# Diatone Library

Live website: https://darkjoy2k2-crypto.github.io/DiatoneLibrary/

<img src="src/img/qr.png" alt="Diatone Library QR Code" width="220">

# Purpose

A Interactive playbook for Harmonica-Players with playback-features, library-tracking (views/stars)
and song-geberator.

## Help (Updated)

### How to read tablature
A plain number means blow, for example 4.
A number in parentheses means draw, for example (4).
A number in parentheses with an underline means bend, for example (4) with underline.

### UI layout
The header contains the primary controls:
- Song category and song selection
- Playback controls (play, pause, stop)
- Zoom controls
- Fullscreen
- Hamburger menu

The hamburger menu contains:
- Language toggle (German and English)
- Theme toggle (light and dark)
- Note-name toggle
- Hard reset with confirmation
- Help
- Song export button for tooling workflows
- YouTube shortcut
- Inventory shortcut
- Song generator shortcut

### Rating system
Each selected song can be rated with 1 to 5 stars from the menu.

### Views counter
The menu shows a rating header with the current views count for the active song.

### Inventory
The inventory view lists songs and supports filters:
- All
- Rated
- Popular

### Song generator
The generator creates local songs in the browser:
- Automatic sequential ID and page assignment
- Validation on submit
- Immediate feedback on errors or success
- Direct open of the newly created song

### Playback controls
- Play starts playback
- Pause pauses playback
- Stop resets playback to the start
- Zoom buttons increase or decrease note size

### Reset and browser data
Hard reset clears app settings and local songs, then reloads the app.

## Summary Of Achieved Repository Goals

- Built a modular SPA architecture with plain HTML, CSS, and JavaScript.
- Implemented responsive, orientation-aware behavior for phone, tablet, and desktop.
- Stabilized header auto-hide and re-show behavior across view switches and rotations.
- Implemented robust main-content centering behavior while header visibility changes.
- Added a practical song workflow:
  - Local in-app song generation
  - Song export from the UI
  - Import-friendly Python tooling for repository updates
- Added inventory, rating, and usage metrics workflows.
- Added a help page and bilingual UI support.
- Added fullscreen handling and touch-friendly interaction patterns.

## Reusability For Other Projects

This repository can be reused as a blueprint for non-music websites that need a stable, device-aware control header with dynamic content views.

### Recommended files to reuse

- [src/css/style.css](src/css/style.css)
Use as a reference for:
- Responsive header structure
- Device and orientation-specific layout behavior
- Main-window centering with sticky/hidden header patterns
- Mobile touch sizing and visual consistency

- [src/js/events.js](src/js/events.js)
Use as a reference for:
- Runtime device classification
- Orientation-aware class management
- Header hide/show logic
- Scroll-source handling and view-switch resets

- [src/js/ui/navigation.js](src/js/ui/navigation.js)
Use as a reference for:
- Multi-view switching
- Stable state transitions between views

- [src/js/ui/menus.js](src/js/ui/menus.js)
Use as a reference for:
- Compact action menus
- Contextual tool actions
- Confirmation-dialog integration

- [src/js/ui/generator.js](src/js/ui/generator.js)
Use as a reference for:
- Local creation workflows
- Input validation and inline user feedback
- Local browser persistence patterns

- [scripts/add_song_interactive.py](scripts/add_song_interactive.py)
Use as a reference for:
- Command-line content import/update tooling
- File-based workflow integration with frontend exports

### AI experience and instruction files

- [.github/layout-experience-playbook.md](.github/layout-experience-playbook.md)
This is the key reusable experience file for future websites. It captures the proven layout and header/scroll concept in a technology-agnostic way.

- [.github/copilot-instructions.md](.github/copilot-instructions.md)
Project-level AI instructions and conventions used during implementation.

### How to apply the concept to a new domain

1. Keep the structural layout and behavior patterns.
2. Replace domain data models and labels.
3. Keep the device/orientation and header-scroll architecture unchanged first.
4. Add domain-specific views only after core responsiveness is verified.
5. Re-run the same cross-device test matrix:
- Phone portrait
- Phone landscape
- Tablet portrait
- Tablet landscape
- Desktop browser

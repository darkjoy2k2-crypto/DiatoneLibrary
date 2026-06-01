// Ton-Index-Mapping: Nach Kanal + Typ sortiert (nicht nach Frequenz!)
// 0-2: Kanal 1, 3-5: Kanal 2, 6-8: Kanal 3, ..., 25-28: Kanal 10
const toneIndexMap = [
  // Kanal 1: Blasen, Bending, Ziehen
  { index: 0, hole: 1, type: 'blow', tone: 'C', freq: 261.63 },
  { index: 1, hole: 1, type: 'bend', tone: 'Db', freq: 277.18 },
  { index: 2, hole: 1, type: 'draw', tone: 'D', freq: 293.66 },
  // Kanal 2: Blasen, Bending, Ziehen
  { index: 3, hole: 2, type: 'blow', tone: 'E', freq: 329.63 },
  { index: 4, hole: 2, type: 'bend', tone: 'F#', freq: 369.99 },
  { index: 5, hole: 2, type: 'draw', tone: 'G', freq: 392.00 },
  // Kanal 3: Blasen, Bending, Ziehen
  { index: 6, hole: 3, type: 'blow', tone: 'G', freq: 392.00 },
  { index: 7, hole: 3, type: 'bend', tone: 'Bb', freq: 466.16 },
  { index: 8, hole: 3, type: 'draw', tone: 'B', freq: 493.88 },
  // Kanal 4: Blasen, Bending, Ziehen
  { index: 9, hole: 4, type: 'blow', tone: 'C', freq: 523.25 },
  { index: 10, hole: 4, type: 'bend', tone: 'Db', freq: 554.37 },
  { index: 11, hole: 4, type: 'draw', tone: 'D', freq: 587.33 },
  // Kanal 5: Blasen, Ziehen (kein Bending)
  { index: 12, hole: 5, type: 'blow', tone: 'E', freq: 659.25 },
  { index: 13, hole: 5, type: 'draw', tone: 'F', freq: 698.46 },
  // Kanal 6: Blasen, Bending, Ziehen
  { index: 14, hole: 6, type: 'blow', tone: 'G', freq: 783.99 },
  { index: 15, hole: 6, type: 'bend', tone: 'Ab', freq: 830.61 },
  { index: 16, hole: 6, type: 'draw', tone: 'A', freq: 880.00 },
  // Kanal 7: Blasen, Ziehen (kein Bending)
  { index: 17, hole: 7, type: 'blow', tone: 'C', freq: 1046.50 },
  { index: 18, hole: 7, type: 'draw', tone: 'B', freq: 987.77 },
  // Kanal 8: Blasen, Bending, Ziehen
  { index: 19, hole: 8, type: 'blow', tone: 'E', freq: 1318.51 },
  { index: 20, hole: 8, type: 'bend', tone: 'Eb', freq: 1244.51 },
  { index: 21, hole: 8, type: 'draw', tone: 'D', freq: 1174.66 },
  // Kanal 9: Blasen, Bending, Ziehen
  { index: 22, hole: 9, type: 'blow', tone: 'G', freq: 1567.98 },
  { index: 23, hole: 9, type: 'bend', tone: 'Ab', freq: 1479.98 },
  { index: 24, hole: 9, type: 'draw', tone: 'F', freq: 1396.91 },
  // Kanal 10: Blasen, Bending 1HT, Bending 2HT, Ziehen
  { index: 25, hole: 10, type: 'blow', tone: 'C', freq: 2093.00 },
  { index: 26, hole: 10, type: 'bend', tone: 'B', freq: 1975.53 },
  { index: 27, hole: 10, type: 'bend', tone: 'Bb', freq: 1864.69 },
  { index: 28, hole: 10, type: 'draw', tone: 'A', freq: 1760.00 }
];

// Frequenzen für Audio-Playback (Index → Frequenz)
const toneFrequencies = toneIndexMap.map(t => t.freq);

// Ton-Namen für Anzeige (Index → Ton-Name)
const toneNames = toneIndexMap.map(t => t.tone);

async function loadSongsFromLibrary() {
  try {
    const response = await fetch('library/manifest.json');
    if (!response.ok) {
      console.warn('manifest.json nicht gefunden, verwende nur Test-Lied');
      return [];
    }

    const manifest = await response.json();
    const loadedSongs = [];

    for (const song of manifest.songs) {
      try {
        const songResponse = await fetch(`library/${song.file}`);
        if (songResponse.ok) {
          const songData = await songResponse.json();
          loadedSongs.push(songData);
          console.log(`Song geladen: ${songData.name}`);
        }
      } catch (error) {
        console.error(`Fehler beim Laden von ${song.file}:`, error);
      }
    }

    return loadedSongs;
  } catch (error) {
    console.warn('Fehler beim Laden der Song-Bibliothek:', error);
    return [];
  }
}

function buildSongDatabase(externalSongs, testSong) {
  const database = { 'Test': [testSong] };

  for (const song of externalSongs) {
    if (!database[song.category]) {
      database[song.category] = [];
    }
    database[song.category].push(song);
  }

  return database;
}

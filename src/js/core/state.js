const appState = {
    language: localStorage.getItem('app-language') || 'de',
    theme: localStorage.getItem('app-theme') || 'light',
    selectedSong: null,
    zoomLevel: parseInt(localStorage.getItem('app-zoom-level') || '100'),
    showNotes: localStorage.getItem('app-show-notes') !== 'false',
    isPlaying: false,
    isPaused: false,
    playbackController: null,
    currentLineIndex: 0,
    currentNoteIndex: 0,
    lastCenteredLineIndex: -1,
    playCounts: {},
    ratings: {},
    lastPlayed: {},
    currentView: 'welcome',
    inventoryFilter: 'all',
    inventoryPlayingSongs: {}
};

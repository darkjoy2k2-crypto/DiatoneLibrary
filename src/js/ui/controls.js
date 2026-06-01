function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    appState.theme = theme;
    localStorage.setItem('app-theme', theme);
}

function toggleTheme() {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function toggleLanguage() {
    console.log('Language toggle clicked');
}

function openYouTube() {
    if (!appState.selectedSong) {
        alert(t('selectSongFirst'));
        return;
    }

    const song = appState.selectedSong;
    const searchTerms = [
        'harmonica',
        'mundharmonika',
        song.name,
        song.artist || ''
    ].filter(term => term.trim()).join(' ');

    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`;
    window.open(youtubeUrl, '_blank');
}


function toggleNotes() {
    appState.showNotes = !appState.showNotes;
    localStorage.setItem('app-show-notes', appState.showNotes);
    if (appState.selectedSong) {
        renderTablature(appState.selectedSong);
    }
}

function zoomIn() {
    const newZoom = Math.min(appState.zoomLevel + 10, 200);
    setZoomLevel(newZoom);
}

function zoomOut() {
    const newZoom = Math.max(appState.zoomLevel - 10, 50);
    setZoomLevel(newZoom);
}

function setZoomLevel(level) {
    appState.zoomLevel = Math.max(50, Math.min(200, level));
    localStorage.setItem('app-zoom-level', appState.zoomLevel);

    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        note.style.fontSize = ((appState.zoomLevel / 100) * 40) + 'px';
    });
}

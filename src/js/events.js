function attachEventListeners() {
    document.getElementById('category-dropdown').addEventListener('change', (e) => {
        onCategorySelected(e.target.value);
    });
    document.getElementById('songs-dropdown').addEventListener('change', (e) => {
        if (e.target.value) selectSong(parseInt(e.target.value));
    });

    document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
    document.getElementById('filter-all').addEventListener('click', () => {
        applyInventoryFilter('all');
    });
    document.getElementById('filter-rated').addEventListener('click', () => {
        applyInventoryFilter('rated');
    });
    document.getElementById('filter-mostplayed').addEventListener('click', () => {
        applyInventoryFilter('mostplayed');
    });
    document.getElementById('play-btn').addEventListener('click', playAudio);
    document.getElementById('pause-btn').addEventListener('click', pauseAudio);
    document.getElementById('stop-btn').addEventListener('click', stopAudio);
    document.getElementById('help-btn').addEventListener('click', openHelpView);

    attachMenuListeners();
}

async function initApp() {
    const externalSongs = await loadSongsFromLibrary();
    const testSong = songDatabase['Test'][0];
    Object.assign(songDatabase, buildSongDatabase(externalSongs, testSong));

    initMetrics();

    appState.selectedTonart = localStorage.getItem('app-tonart') || 'C';
    appState.language = localStorage.getItem('app-language') || 'de';

    populateSongDropdown();
    applyTheme(appState.theme);
    document.getElementById('welcome-view').querySelector('h1').textContent = t('welcome');
    document.getElementById('welcome-view').querySelector('p').textContent = t('welcomeDE');

    initInventoryFilterButtons();

    attachEventListeners();
}

document.addEventListener('DOMContentLoaded', initApp);

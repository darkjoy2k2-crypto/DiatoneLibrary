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

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    window.addEventListener('resize', updateAdaptiveUiContext);
    window.addEventListener('orientationchange', updateAdaptiveUiContext);
    document.addEventListener('fullscreenchange', syncFullscreenButtonState);
    attachHeaderAutoHideListeners();

    attachMenuListeners();
}

function getCurrentScrollTop() {
    const mainContent = document.getElementById('main-content');
    const scrollCandidates = [
        window.scrollY || 0,
        mainContent ? mainContent.scrollTop : 0
    ];

    ['welcome-view', 'tablature-view', 'inventory-view', 'help-view'].forEach((id) => {
        const view = document.getElementById(id);
        if (view) {
            scrollCandidates.push(view.scrollTop || 0);
        }
    });

    return Math.max(...scrollCandidates);
}

function updateHeaderVisibility() {
    const header = document.getElementById('header');
    if (!header) return;

    const isAtTop = getCurrentScrollTop() <= 2;
    header.classList.toggle('is-hidden', !isAtTop);
}

function attachHeaderAutoHideListeners() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    }

    ['welcome-view', 'tablature-view', 'inventory-view', 'help-view'].forEach((id) => {
        const view = document.getElementById(id);
        if (view) {
            view.addEventListener('scroll', updateHeaderVisibility, { passive: true });
        }
    });

    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    window.addEventListener('touchmove', updateHeaderVisibility, { passive: true });
}

function getOrientationMode() {
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
}

function getDeviceMode() {
    const width = window.innerWidth;

    if (width < 786) {
        return 'phone';
    }
    if (width < 1024) {
        return 'tablet';
    }
    return 'desktop';
}

function updateAdaptiveUiContext() {
    const device = getDeviceMode();
    const orientation = getOrientationMode();
    const body = document.body;

    body.dataset.device = device;
    body.dataset.orientation = orientation;

    body.classList.remove('device-phone', 'device-tablet', 'device-desktop');
    body.classList.remove('orientation-portrait', 'orientation-landscape');
    body.classList.add(`device-${device}`);
    body.classList.add(`orientation-${orientation}`);
}

function syncFullscreenButtonState() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (!fullscreenBtn) return;

    const supportsFullscreen = document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function';
    if (!supportsFullscreen) {
        fullscreenBtn.style.display = 'none';
        return;
    }

    fullscreenBtn.style.display = 'inline-flex';

    const isFullscreen = !!document.fullscreenElement;
    fullscreenBtn.classList.toggle('is-active', isFullscreen);
    fullscreenBtn.title = isFullscreen ? t('fullscreenExit') : t('fullscreenEnter');
    fullscreenBtn.setAttribute('aria-label', fullscreenBtn.title);
}

function toggleFullscreen() {
    const supportsFullscreen = document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function';
    if (!supportsFullscreen) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
    }

    document.documentElement.requestFullscreen().catch(() => {
        // Some environments (certain mobile browsers) block fullscreen without user gesture support.
    });
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
    updateAdaptiveUiContext();
    syncFullscreenButtonState();
    updateHeaderVisibility();
}

document.addEventListener('DOMContentLoaded', initApp);

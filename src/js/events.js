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

// --- Header auto-hide state ---
const _headerScroll = { prevY: 0, hideLocked: false, lockTimer: null };

function getCurrentScrollTop() {
    const mainContent = document.getElementById('main-content');
    const scrollCandidates = [
        window.scrollY || 0,
        mainContent ? mainContent.scrollTop : 0
    ];

    ['welcome-view', 'tablature-view', 'inventory-view', 'generator-view', 'help-view'].forEach((id) => {
        const view = document.getElementById(id);
        if (view && view.style.display !== 'none') {
            scrollCandidates.push(view.scrollTop || 0);
        }
    });

    return Math.max(...scrollCandidates);
}

function updateHeaderVisibility() {
    const header = document.getElementById('header');
    if (!header) return;

    const currentY = getCurrentScrollTop();
    const isHidden = header.classList.contains('is-hidden');

    if (!isHidden) {
        // Hide when user scrolls DOWN past threshold
        if (currentY > _headerScroll.prevY && currentY > 40) {
            header.classList.add('is-hidden');
            // Lock for 400 ms to absorb layout-reflow scroll events
            _headerScroll.hideLocked = true;
            clearTimeout(_headerScroll.lockTimer);
            _headerScroll.lockTimer = setTimeout(() => {
                _headerScroll.hideLocked = false;
            }, 400);
        }
    } else {
        // Ignore position changes caused by layout reflow during lock period
        if (_headerScroll.hideLocked) {
            _headerScroll.prevY = currentY;
            return;
        }
        // Re-show only when user scrolls UP back to near top
        if (currentY < _headerScroll.prevY && currentY <= 8) {
            header.classList.remove('is-hidden');
        }
    }

    _headerScroll.prevY = currentY;
}

function attachHeaderAutoHideListeners() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    }

    ['welcome-view', 'tablature-view', 'inventory-view', 'generator-view', 'help-view'].forEach((id) => {
        const view = document.getElementById(id);
        if (view) {
            view.addEventListener('scroll', updateHeaderVisibility, { passive: true });
        }
    });

    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
}

function getOrientationMode() {
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
}

function getDeviceMode() {
    const width = window.innerWidth;
    const shortestSide = Math.min(window.innerWidth, window.innerHeight);

    // Use shortest side so phones stay "phone" after rotating to landscape.
    if (shortestSide < 786) {
        return 'phone';
    }
    if (width < 1024) {
        return 'tablet';
    }
    return 'desktop';
}

function syncHeaderActionLayout() {
    const header = document.getElementById('header');
    if (!header) return;

    // Two-scenario logic is only needed on phone portrait.
    const isPhonePortrait = document.body.classList.contains('device-phone')
        && document.body.classList.contains('orientation-portrait');
    header.classList.remove('header-actions-split');
    if (!isPhonePortrait) return;

    const logo = document.getElementById('logo');
    const playbackControls = document.getElementById('playback-controls');
    const zoomControls = document.getElementById('zoom-controls');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const menuBtn = document.getElementById('menu-btn');

    const controls = [logo, playbackControls, zoomControls, fullscreenBtn, menuBtn];
    if (controls.some((el) => !el || getComputedStyle(el).display === 'none')) return;

    const headerStyle = getComputedStyle(header);
    const gap = parseFloat(headerStyle.columnGap || headerStyle.gap || '0') || 0;
    const paddingLeft = parseFloat(headerStyle.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(headerStyle.paddingRight || '0') || 0;
    const availableWidth = header.clientWidth - paddingLeft - paddingRight;

    const requiredWidth =
        logo.offsetWidth +
        playbackControls.offsetWidth +
        zoomControls.offsetWidth +
        fullscreenBtn.offsetWidth +
        menuBtn.offsetWidth +
        (gap * 5);

    // Split only when it really does not fit in a single row.
    if (requiredWidth > availableWidth) {
        header.classList.add('header-actions-split');
    }
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

    syncHeaderActionLayout();
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

    syncHeaderActionLayout();
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

    if (typeof loadLocalSongsIntoDatabase === 'function') {
        loadLocalSongsIntoDatabase();
    }

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

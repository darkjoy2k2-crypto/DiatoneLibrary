function renderMenuTexts() {
    renderHamburgerButtonStates();
    document.getElementById('hamburger-help-btn').innerHTML = '?';
    document.getElementById('hamburger-help-btn').title = t('helpTitle');
    document.getElementById('hamburger-help-btn').setAttribute('aria-label', t('helpTitle'));
    document.getElementById('hamburger-youtube-btn').innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.8z" fill="#ff0000"/>
            <path d="M9.6 15.5V8.5L15.7 12l-6.1 3.5z" fill="#ffffff"/>
        </svg>`;
    document.getElementById('hamburger-youtube-btn').title = t('youtubeBtn');
    document.getElementById('hamburger-youtube-btn').setAttribute('aria-label', t('youtubeBtn'));
    document.getElementById('hamburger-export-song-btn').innerHTML = '↓';
    document.getElementById('hamburger-export-song-btn').title = t('exportSongBtn');
    document.getElementById('hamburger-export-song-btn').setAttribute('aria-label', t('exportSongBtn'));
    document.getElementById('hamburger-inventory-btn').innerHTML = '📚';
    document.getElementById('hamburger-inventory-btn').title = t('inventoryBtn');
    document.getElementById('hamburger-inventory-btn').setAttribute('aria-label', t('inventoryBtn'));
    document.getElementById('hamburger-generator-btn').innerHTML = '✎';
    document.getElementById('hamburger-generator-btn').title = t('songGeneratorTitle');
    document.getElementById('hamburger-generator-btn').setAttribute('aria-label', t('songGeneratorTitle'));
    document.getElementById('hamburger-hard-reload-btn').innerHTML = '↻';
    document.getElementById('hamburger-hard-reload-btn').title = t('hardReloadBtn');
    document.getElementById('hamburger-hard-reload-btn').setAttribute('aria-label', t('hardReloadBtn'));
    document.getElementById('hardreset-dialog-text').textContent = t('hardResetConfirmText');
    document.getElementById('hardreset-cancel-btn').textContent = t('cancelBtn');
    document.getElementById('hardreset-confirm-btn').textContent = t('understoodBtn');
    document.getElementById('help-back-btn').textContent = t('backBtn');
}

function downloadCurrentSongForTool() {
    if (!appState.selectedSong) {
        alert(t('selectSongFirst'));
        return;
    }

    const song = appState.selectedSong;
    const payload = {
        id: song.id,
        name: song.name,
        artist: song.artist || '',
        category: song.category || '',
        page: Number.isInteger(song.page) ? song.page : song.id,
        tablature: song.tablature
    };

    const baseName = typeof slugifySongName === 'function'
        ? slugifySongName(song.name)
        : (song.name || 'song').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const fileName = `${baseName || 'song'}-import.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], {
        type: 'application/json;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

function openHardResetDialog() {
    const dialog = document.getElementById('hardreset-dialog');
    if (dialog) {
        dialog.style.display = 'flex';
    }
}

function closeHardResetDialog() {
    const dialog = document.getElementById('hardreset-dialog');
    if (dialog) {
        dialog.style.display = 'none';
    }
}

function renderHamburgerButtonStates() {
    const languageBtn = document.getElementById('hamburger-language-btn');
    const themeBtn = document.getElementById('hamburger-theme-btn');
    const notesBtn = document.getElementById('hamburger-notes-btn');

    if (languageBtn) {
        languageBtn.innerHTML = appState.language === 'de'
            ? `<svg viewBox="0 0 60 36" aria-hidden="true" focusable="false">
                    <rect width="60" height="12" y="0" fill="#000000"></rect>
                    <rect width="60" height="12" y="12" fill="#DD0000"></rect>
                    <rect width="60" height="12" y="24" fill="#FFCE00"></rect>
               </svg>`
            : `<svg viewBox="0 0 60 36" aria-hidden="true" focusable="false">
                    <rect width="60" height="36" fill="#012169"></rect>
                    <path d="M0 0 L60 36 M60 0 L0 36" stroke="#FFFFFF" stroke-width="8"></path>
                    <path d="M0 0 L60 36 M60 0 L0 36" stroke="#C8102E" stroke-width="4"></path>
                    <path d="M30 0 V36 M0 18 H60" stroke="#FFFFFF" stroke-width="12"></path>
                    <path d="M30 0 V36 M0 18 H60" stroke="#C8102E" stroke-width="6"></path>
               </svg>`;
        languageBtn.title = appState.language === 'de' ? t('switchToLanguageEn') : t('switchToLanguageDe');
        languageBtn.setAttribute('aria-label', appState.language === 'de' ? t('switchToLanguageEn') : t('switchToLanguageDe'));
    }

    if (themeBtn) {
        themeBtn.innerHTML = appState.theme === 'light' ? '☀' : '☾';
        themeBtn.title = appState.theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode');
        themeBtn.setAttribute('aria-label', appState.theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode'));
        themeBtn.classList.toggle('is-active', appState.theme === 'dark');
    }

    if (notesBtn) {
        notesBtn.innerHTML = appState.showNotes ? '♪' : '♩';
        notesBtn.title = appState.showNotes ? t('notesOff') : t('notesOn');
        notesBtn.setAttribute('aria-label', appState.showNotes ? t('notesOff') : t('notesOn'));
        notesBtn.classList.toggle('is-active', appState.showNotes);
    }
}

function triggerHardReload() {
    ['app-theme', 'app-language', 'app-show-notes', 'app-tonart', 'app-zoom-level'].forEach((key) => {
        localStorage.removeItem(key);
    });

    Object.keys(localStorage)
        .filter((key) => key === 'app-local-songs' || key.startsWith('local-song-'))
        .forEach((key) => localStorage.removeItem(key));

    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set('_reload', Date.now().toString());

    if ('caches' in window) {
        caches.keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .finally(() => {
                window.location.replace(targetUrl.toString());
            });
        return;
    }

    window.location.replace(targetUrl.toString());
}

function openHamburgerMenu() {
    const menu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('menu-overlay');

    if (menu.style.display === 'none') {
        menu.style.display = 'block';
        overlay.style.display = 'block';
        renderHamburgerMenu();
        renderSettingsMenu();
    } else {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function closeAllMenus() {
    document.getElementById('hamburger-menu').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'none';
}

function renderHamburgerMenu() {
    renderHamburgerButtonStates();

    const ratingHeading = document.getElementById('hamburger-rating-heading');
    const ratingDiv = document.getElementById('hamburger-rating-stars');
    const playCountEl = document.getElementById('hamburger-play-count');

    if (!appState.selectedSong) {
        if (ratingHeading) ratingHeading.textContent = '';
        if (ratingDiv) ratingDiv.innerHTML = '';
        if (playCountEl) playCountEl.textContent = '';
        return;
    }

    const rating = getRating(appState.selectedSong.id);
    const playCount = getPlayCount(appState.selectedSong.id);

    if (ratingHeading) {
        ratingHeading.textContent = `${t('ratingHeading')}, ${playCount} ${t('viewsLabel')}`;
    }

    ratingDiv.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i <= rating ? 'filled' : ''}`;
        star.textContent = '★';
        star.addEventListener('click', () => {
            setRating(appState.selectedSong.id, i);
            renderHamburgerMenu();
        });
        ratingDiv.appendChild(star);
    }

    if (playCountEl) {
        playCountEl.textContent = '';
    }
}

function renderSettingsMenu() {
    renderHamburgerButtonStates();
}

function handleLanguageChange(newLang) {
    appState.language = newLang;
    localStorage.setItem('app-language', newLang);

    renderMenuTexts();
    renderHamburgerMenu();
    renderSettingsMenu();
    renderInventory();

    if (appState.selectedSong) {
        renderTablature(appState.selectedSong);
    }

    populateSongDropdown();

    const welcomeEl = document.getElementById('welcome-view');
    if (welcomeEl && welcomeEl.style.display !== 'none') {
        welcomeEl.querySelector('h1').textContent = t('welcome');
        welcomeEl.querySelector('p').textContent = t('welcomeDE');
    }

    if (appState.currentView === 'help') {
        renderHelpView();
    }

    if (typeof updateAdaptiveUiContext === 'function') {
        updateAdaptiveUiContext();
    }

    if (typeof syncFullscreenButtonState === 'function') {
        syncFullscreenButtonState();
    }
}

function attachMenuListeners() {
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('menu-overlay');
    const languageBtn = document.getElementById('hamburger-language-btn');
    const themeBtn = document.getElementById('hamburger-theme-btn');
    const notesBtn = document.getElementById('hamburger-notes-btn');
    const hamburgerHelpBtn = document.getElementById('hamburger-help-btn');
    const hamburgerYoutubeBtn = document.getElementById('hamburger-youtube-btn');
    const hamburgerExportSongBtn = document.getElementById('hamburger-export-song-btn');
    const hamburgerInventoryBtn = document.getElementById('hamburger-inventory-btn');
    const hamburgerGeneratorBtn = document.getElementById('hamburger-generator-btn');
    const hardReloadBtn = document.getElementById('hamburger-hard-reload-btn');
    const hardResetCancelBtn = document.getElementById('hardreset-cancel-btn');
    const hardResetConfirmBtn = document.getElementById('hardreset-confirm-btn');
    const hardResetDialog = document.getElementById('hardreset-dialog');
    const helpBackBtn = document.getElementById('help-back-btn');

    menuBtn.addEventListener('click', openHamburgerMenu);
    overlay.addEventListener('click', closeAllMenus);

    notesBtn.addEventListener('click', () => {
        toggleNotes();
        renderHamburgerButtonStates();
    });

    themeBtn.addEventListener('click', () => {
        applyTheme(appState.theme === 'light' ? 'dark' : 'light');
        renderSettingsMenu();
    });

    languageBtn.addEventListener('click', () => {
        handleLanguageChange(appState.language === 'de' ? 'en' : 'de');
    });

    hamburgerHelpBtn.addEventListener('click', () => {
        openHelpView();
        closeAllMenus();
    });

    hamburgerYoutubeBtn.addEventListener('click', () => {
        openYouTube();
        closeAllMenus();
    });

    hamburgerExportSongBtn.addEventListener('click', () => {
        downloadCurrentSongForTool();
        closeAllMenus();
    });

    hamburgerInventoryBtn.addEventListener('click', () => {
        switchView('inventory');
        closeAllMenus();
    });

    hamburgerGeneratorBtn.addEventListener('click', () => {
        if (typeof openSongGeneratorView === 'function') {
            openSongGeneratorView();
        }
        closeAllMenus();
    });

    hardReloadBtn.addEventListener('click', () => {
        closeAllMenus();
        openHardResetDialog();
    });

    hardResetCancelBtn.addEventListener('click', () => {
        closeHardResetDialog();
    });

    hardResetConfirmBtn.addEventListener('click', () => {
        closeHardResetDialog();
        triggerHardReload();
    });

    hardResetDialog.addEventListener('click', (event) => {
        if (event.target === hardResetDialog) {
            closeHardResetDialog();
        }
    });

    helpBackBtn.addEventListener('click', () => {
        switchView('welcome');
    });

    renderMenuTexts();
    renderHamburgerButtonStates();
}

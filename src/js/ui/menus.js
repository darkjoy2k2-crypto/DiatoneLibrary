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
    document.getElementById('hamburger-inventory-btn').innerHTML = '📚';
    document.getElementById('hamburger-inventory-btn').title = t('inventoryBtn');
    document.getElementById('hamburger-inventory-btn').setAttribute('aria-label', t('inventoryBtn'));
    document.getElementById('hamburger-hard-reload-btn').innerHTML = '↻';
    document.getElementById('hamburger-hard-reload-btn').title = t('hardReloadBtn');
    document.getElementById('hamburger-hard-reload-btn').setAttribute('aria-label', t('hardReloadBtn'));
    document.getElementById('help-back-btn').textContent = t('backBtn');
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
    const hamburgerInventoryBtn = document.getElementById('hamburger-inventory-btn');
    const hardReloadBtn = document.getElementById('hamburger-hard-reload-btn');
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

    hamburgerInventoryBtn.addEventListener('click', () => {
        switchView('inventory');
        closeAllMenus();
    });

    hardReloadBtn.addEventListener('click', () => {
        closeAllMenus();
        triggerHardReload();
    });

    helpBackBtn.addEventListener('click', () => {
        switchView('welcome');
    });

    renderMenuTexts();
    renderHamburgerButtonStates();
}

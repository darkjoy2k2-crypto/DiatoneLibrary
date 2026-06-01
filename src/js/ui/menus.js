function renderMenuTexts() {
    document.querySelector('#settings-menu h3').textContent = t('settings');
    document.querySelector('#hamburger-menu h3').textContent = t('songActions');
    document.getElementById('theme-label').textContent = t('darkmodeLabel');
    document.getElementById('language-label').textContent = t('languageLabel');
    document.getElementById('notes-label').textContent = t('notesLabel');
    document.getElementById('tonart-label').textContent = t('tonartLabel');
    document.getElementById('tonart-c').textContent = t('cMajor');
    document.getElementById('tonart-g').textContent = t('gMajor');
    document.getElementById('tonart-d').textContent = t('dMajor');
    document.getElementById('tonart-a').textContent = t('aMajor');
    document.getElementById('tonart-f').textContent = t('fMajor');
    document.getElementById('hamburger-youtube-btn').textContent = t('youtubeBtn');
    document.getElementById('hamburger-inventory-btn').textContent = t('inventoryBtn');
    document.getElementById('help-back-btn').textContent = t('backBtn');
}

function openHamburgerMenu() {
    const menu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('menu-overlay');
    const settingsMenu = document.getElementById('settings-menu');

    if (menu.style.display === 'none') {
        settingsMenu.style.display = 'none';
        menu.style.display = 'block';
        overlay.style.display = 'block';
        renderHamburgerMenu();
    } else {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function openSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    const overlay = document.getElementById('menu-overlay');
    const hamburgerMenu = document.getElementById('hamburger-menu');

    if (menu.style.display === 'none') {
        hamburgerMenu.style.display = 'none';
        menu.style.display = 'block';
        overlay.style.display = 'block';
        renderSettingsMenu();
    } else {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function closeAllMenus() {
    document.getElementById('hamburger-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'none';
}

function renderHamburgerMenu() {
    if (!appState.selectedSong) return;

    const ratingDiv = document.getElementById('hamburger-rating-stars');
    const rating = getRating(appState.selectedSong.id);
    const playCount = getPlayCount(appState.selectedSong.id);

    document.querySelector('#hamburger-menu .rating-section label').textContent = t('ratingLabel');

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

    document.getElementById('hamburger-play-count').textContent = `${t('playedLabel')} ${playCount}x`;
}

function renderSettingsMenu() {
    const tonartRadios = document.querySelectorAll('input[name="tonart"]');
    const flagBtns = document.querySelectorAll('.flag-btn');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const notesToggle = document.getElementById('notes-toggle');

    flagBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === appState.language) {
            btn.classList.add('active');
        }
    });

    themeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === appState.theme) {
            btn.classList.add('active');
        }
    });

    notesToggle.checked = appState.showNotes;

    tonartRadios.forEach(radio => {
        radio.checked = radio.value === (appState.selectedTonart || 'C');
    });
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
}

function attachMenuListeners() {
    const menuBtn = document.getElementById('menu-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const overlay = document.getElementById('menu-overlay');
    const notesToggle = document.getElementById('notes-toggle');
    const flagBtns = document.querySelectorAll('.flag-btn');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const tonartRadios = document.querySelectorAll('input[name="tonart"]');
    const hamburgerYoutubeBtn = document.getElementById('hamburger-youtube-btn');
    const hamburgerInventoryBtn = document.getElementById('hamburger-inventory-btn');
    const helpBackBtn = document.getElementById('help-back-btn');

    menuBtn.addEventListener('click', openHamburgerMenu);
    settingsBtn.addEventListener('click', openSettingsMenu);
    overlay.addEventListener('click', closeAllMenus);

    notesToggle.addEventListener('change', () => {
        toggleNotes();
    });

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
            renderSettingsMenu();
        });
    });

    flagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            handleLanguageChange(btn.dataset.lang);
        });
    });

    tonartRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            appState.selectedTonart = radio.value;
            localStorage.setItem('app-tonart', radio.value);
        });
    });

    hamburgerYoutubeBtn.addEventListener('click', () => {
        openYouTube();
        closeAllMenus();
    });

    hamburgerInventoryBtn.addEventListener('click', () => {
        switchView('inventory');
        closeAllMenus();
    });

    helpBackBtn.addEventListener('click', () => {
        switchView('welcome');
    });

    renderMenuTexts();
}

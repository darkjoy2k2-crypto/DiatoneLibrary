function populateSongDropdown() {
    const catDd = document.getElementById('category-dropdown');
    catDd.innerHTML = `<option value="" disabled selected>${t('categorySelect')}</option>`;
    for (const category of Object.keys(songDatabase)) {
        if (category === 'Test') continue;
        const songs = songDatabase[category];
        if (!songs || songs.length === 0) continue;
        const opt = document.createElement('option');
        opt.value = category;
        opt.textContent = category;
        catDd.appendChild(opt);
    }
    const songDd = document.getElementById('songs-dropdown');
    songDd.innerHTML = `<option value="" disabled selected>${t('songSelect')}</option>`;
    songDd.disabled = true;
}

function onCategorySelected(category) {
    const songDd = document.getElementById('songs-dropdown');
    songDd.innerHTML = `<option value="" disabled selected>${t('songSelect')}</option>`;
    const songs = songDatabase[category] || [];
    songs.forEach(song => {
        const opt = document.createElement('option');
        opt.value = song.id;
        opt.textContent = song.name;
        songDd.appendChild(opt);
    });
    songDd.disabled = false;
    songDd.value = '';
}

function selectSong(songId) {
    let selectedSong = null;
    for (const [category, songs] of Object.entries(songDatabase)) {
        const song = songs.find(s => s.id === songId);
        if (song) {
            selectedSong = Object.assign({}, song, { category });
            break;
        }
    }

    if (selectedSong) {
        stopPlayback();
        appState.selectedSong = selectedSong;
        appState.currentLineIndex = 0;
        appState.currentNoteIndex = 0;

        incrementPlayCount(selectedSong.id);

        switchView('tablature');
        renderTablature(selectedSong);
        renderHamburgerMenu();
    }
}

function switchView(viewName) {
    appState.currentView = viewName;
    document.getElementById('welcome-view').style.display = 'none';
    document.getElementById('tablature-view').style.display = 'none';
    document.getElementById('inventory-view').style.display = 'none';
    document.getElementById('generator-view').style.display = 'none';
    document.getElementById('help-view').style.display = 'none';

    const viewMap = {
        'welcome': 'welcome-view',
        'tablature': 'tablature-view',
        'inventory': 'inventory-view',
        'generator': 'generator-view',
        'help': 'help-view'
    };

    const targetId = viewMap[viewName];
    if (targetId) {
        document.getElementById(targetId).style.display = 'flex';
    }

    if (viewName === 'inventory') {
        renderInventory();
    }

    if (viewName === 'generator' && typeof renderSongGeneratorView === 'function') {
        renderSongGeneratorView();
    }

    if (viewName === 'help') {
        renderHelpView();
    }

    // Reset scroll state when switching views so the header always shows initially
    if (typeof _headerScroll !== 'undefined') {
        _headerScroll.prevY = 0;
        _headerScroll.hideLocked = false;
        clearTimeout(_headerScroll.lockTimer);
    }
    if (typeof updateHeaderVisibility === 'function') {
        updateHeaderVisibility();
    }
}

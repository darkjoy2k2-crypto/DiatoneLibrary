function renderInventory() {
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';

    let songsToDisplay = [];

    for (const [category, songs] of Object.entries(songDatabase)) {
        for (const song of songs) {
            songsToDisplay.push(song);
        }
    }

    if (appState.inventoryFilter === 'rated') {
        songsToDisplay = songsToDisplay.filter(song => getRating(song.id) > 0);
    } else if (appState.inventoryFilter === 'mostplayed') {
        songsToDisplay.sort((a, b) => getPlayCount(b.id) - getPlayCount(a.id));
    } else {
        songsToDisplay.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (songsToDisplay.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-color); margin-top: 40px;">${t('noSongsFound')}</p>`;
        return;
    }

    songsToDisplay.forEach(song => {
        const playCount = getPlayCount(song.id);
        const rating = getRating(song.id);
        const isPlaying = appState.inventoryPlayingSongs[song.id] !== undefined;
        const songItem = document.createElement('div');
        songItem.className = 'inventory-song-item';

        songItem.innerHTML = `
            <button class="inventory-play-btn" data-song-id="${song.id}" style="padding: 8px 12px; cursor: pointer; background-color: ${isPlaying ? 'var(--accent-color)' : 'var(--button-bg)'}; color: ${isPlaying ? 'var(--bg-color)' : 'var(--text-color)'}; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; font-weight: 600; min-width: 40px; text-align: center;">
                ${isPlaying ? '⏸' : '▶'}
            </button>
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                ${song.artist ? `<div class="song-artist">${song.artist}</div>` : ''}
            </div>
            <div class="song-stats">
                <span class="play-count">▶ ${playCount}</span>
                <div class="rating-display">
                    ${renderReadOnlyStars(rating)}
                </div>
            </div>
        `;

        songItem.addEventListener('click', (e) => {
            if (e.target.closest('.inventory-play-btn')) return;
            selectSong(song.id);
            switchView('tablature');
        });

        const playBtn = songItem.querySelector('.inventory-play-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            inventoryToggleSong(song.id);
        });

        container.appendChild(songItem);
    });
}

function renderReadOnlyStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return html;
}

function inventoryToggleSong(songId) {
    if (appState.inventoryPlayingSongs[songId]) {
        stopInventorySong(songId);
    } else {
        const playingSongIds = Object.keys(appState.inventoryPlayingSongs);
        playingSongIds.forEach(id => stopInventorySong(id));
        startInventorySong(songId);
    }
}

function startInventorySong(songId) {
    let songToPlay = null;
    for (const [category, songs] of Object.entries(songDatabase)) {
        const song = songs.find(s => s.id === songId);
        if (song) {
            songToPlay = Object.assign({}, song, { category });
            break;
        }
    }

    if (!songToPlay) return;

    const playbackState = {
        song: songToPlay,
        controller: new AbortController(),
        lineIndex: 0,
        noteIndex: 0
    };

    appState.inventoryPlayingSongs[songId] = playbackState;
    playInventorySong(songId);
    renderInventory();
}

function stopInventorySong(songId) {
    if (appState.inventoryPlayingSongs[songId]) {
        appState.inventoryPlayingSongs[songId].controller.abort();
        delete appState.inventoryPlayingSongs[songId];
        renderInventory();
    }
}

async function playInventorySong(songId) {
    const playbackState = appState.inventoryPlayingSongs[songId];
    if (!playbackState) return;

    const signal = playbackState.controller.signal;
    const tablature = playbackState.song.tablature;

    for (let lineIndex = playbackState.lineIndex; lineIndex < tablature.length; lineIndex++) {
        if (signal.aborted) break;

        const line = tablature[lineIndex];

        if (line.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 400));
            playbackState.lineIndex = lineIndex + 1;
            continue;
        }

        for (let noteIndex = playbackState.noteIndex; noteIndex < line.length; noteIndex++) {
            if (signal.aborted) break;

            const toneIndex = line[noteIndex];
            const frequency = toneFrequencies[toneIndex];

            if (frequency) {
                await playNote(frequency, 200);
            }

            if (!signal.aborted && noteIndex < line.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            playbackState.noteIndex = noteIndex + 1;

            if (signal.aborted) break;
        }

        if (!signal.aborted && lineIndex < tablature.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        playbackState.lineIndex = lineIndex + 1;
        playbackState.noteIndex = 0;
    }

    // Song zu Ende - entferne aus playing Songs
    if (appState.inventoryPlayingSongs[songId]) {
        delete appState.inventoryPlayingSongs[songId];
        renderInventory();
    }
}

function applyInventoryFilter(filterType) {
    appState.inventoryFilter = filterType;
    updateFilterButtons(filterType);
    renderInventory();
}

function updateFilterButtons(activeFilter) {
    const buttons = document.querySelectorAll('.inventory-controls button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    const filterMap = {
        'all': '#filter-all',
        'rated': '#filter-rated',
        'mostplayed': '#filter-mostplayed'
    };

    const activeBtn = document.querySelector(filterMap[activeFilter]);
    if (activeBtn) activeBtn.classList.add('active');
}

function initInventoryFilterButtons() {
    document.getElementById('filter-all').textContent = t('all');
    document.getElementById('filter-rated').textContent = t('rated');
    document.getElementById('filter-mostplayed').textContent = t('popular');
}

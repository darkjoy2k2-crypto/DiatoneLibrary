function slugifySongName(name) {
    return (name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'song';
}

const SONG_GEN_LOCAL_KEY = 'app-local-songs';
const SONG_GEN_BLOW_IDX = [0, 3, 6, 9, 12, 14, 17, 19, 22, 25];
const SONG_GEN_DRAW_IDX = [2, 5, 8, 11, 13, 16, 18, 21, 24, 28];
const SONG_GEN_BEND_IDX = [1, 4, 7, 10, null, 15, null, 20, 23, 26];
const SONG_GEN_BEND2_IDX = [null, null, null, null, null, null, null, null, null, 27];

function tokenToSongIndex(token) {
    const text = token.trim();
    if (!text) return { error: 'Empty token' };

    const bendMatch = text.match(/^_(\d{1,2})(?:_(2))?$/);
    if (bendMatch) {
        const hole = parseInt(bendMatch[1], 10);
        const isSecond = bendMatch[2] === '2';
        if (hole < 1 || hole > 10) {
            return { error: `Invalid bend hole: ${hole}` };
        }

        const holeIndex = hole - 1;
        if (isSecond) {
            const idx = SONG_GEN_BEND2_IDX[holeIndex];
            if (idx === null || idx === undefined) {
                return { error: `Second bend only available on hole 10: ${text}` };
            }
            return { index: idx };
        }

        const idx = SONG_GEN_BEND_IDX[holeIndex];
        if (idx === null || idx === undefined) {
            return { error: `Bend not playable on hole ${hole}` };
        }
        return { index: idx };
    }

    const num = parseInt(text, 10);
    if (Number.isNaN(num)) {
        return { error: `Unknown token: ${text}` };
    }

    const hole = Math.abs(num);
    if (hole < 1 || hole > 10) {
        return { error: `Hole outside 1..10: ${text}` };
    }

    const holeIndex = hole - 1;
    return { index: num > 0 ? SONG_GEN_BLOW_IDX[holeIndex] : SONG_GEN_DRAW_IDX[holeIndex] };
}

function parseSongGeneratorNotation(rawNotation) {
    const rows = [];
    const errors = [];

    const segments = rawNotation.split(';');
    segments.forEach((segment, rowIndex) => {
        const text = segment.trim();
        const isTrailingEmpty = !text && rowIndex === segments.length - 1;
        if (isTrailingEmpty) return;

        if (!text) {
            rows.push([]);
            return;
        }

        const row = [];
        const tokens = text.split(',').map((entry) => entry.trim()).filter(Boolean);
        tokens.forEach((token) => {
            const result = tokenToSongIndex(token);
            if (result.error) {
                errors.push(`Row ${rowIndex + 1}, token '${token}': ${result.error}`);
                return;
            }
            row.push(result.index);
        });

        if (row.length > 0) {
            rows.push(row);
        }
    });

    if (errors.length) {
        return { tablature: null, errors };
    }

    if (!rows.length) {
        return { tablature: null, errors: ['No valid notes found.'] };
    }

    return { tablature: rows, errors: [] };
}

function readLocalSongs() {
    try {
        const raw = localStorage.getItem(SONG_GEN_LOCAL_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeLocalSongs(songs) {
    localStorage.setItem(SONG_GEN_LOCAL_KEY, JSON.stringify(songs));
}

function forEachSongInDatabase(callback) {
    Object.values(songDatabase).forEach((songs) => {
        songs.forEach((song) => callback(song));
    });
}

function getNextSongId() {
    let maxId = 0;
    forEachSongInDatabase((song) => {
        if (Number.isInteger(song.id) && song.id > maxId) {
            maxId = song.id;
        }
    });
    return maxId + 1;
}

function getNextSongPage() {
    let maxPage = 0;
    forEachSongInDatabase((song) => {
        const page = Number.isInteger(song.page) ? song.page : 0;
        if (page > maxPage) {
            maxPage = page;
        }
    });
    return maxPage + 1;
}

function addSongToDatabase(song) {
    if (!songDatabase[song.category]) {
        songDatabase[song.category] = [];
    }
    songDatabase[song.category].push(song);
}

function persistLocalSong(song) {
    const songs = readLocalSongs();
    songs.push(song);
    writeLocalSongs(songs);
}

function loadLocalSongsIntoDatabase() {
    const songs = readLocalSongs();
    songs.forEach((song) => {
        addSongToDatabase(song);
    });
}

function getSongGeneratorFormData() {
    return {
        name: document.getElementById('songgen-name').value.trim(),
        artist: document.getElementById('songgen-artist').value.trim(),
        category: document.getElementById('songgen-category').value.trim() || 'Sonstige',
        notation: document.getElementById('songgen-notation').value
    };
}

function selectSongInDropdown(song) {
    const catDd = document.getElementById('category-dropdown');
    const songDd = document.getElementById('songs-dropdown');
    if (!catDd || !songDd) return;

    catDd.value = song.category;
    onCategorySelected(song.category);
    songDd.value = String(song.id);
}

function handleSongGeneratorSubmit() {
    const statusEl = document.getElementById('songgen-status');
    if (!statusEl) return;

    const formData = getSongGeneratorFormData();

    if (!formData.name) {
        statusEl.textContent = t('songGeneratorErrorName');
        return;
    }

    const parsed = parseSongGeneratorNotation(formData.notation);
    if (parsed.errors.length) {
        statusEl.textContent = parsed.errors.join('\n');
        return;
    }

    const song = {
        id: getNextSongId(),
        name: formData.name,
        artist: formData.artist,
        category: formData.category,
        page: getNextSongPage(),
        tablature: parsed.tablature,
        local: true,
        slug: slugifySongName(formData.name)
    };

    addSongToDatabase(song);
    persistLocalSong(song);
    populateSongDropdown();
    selectSongInDropdown(song);
    selectSong(song.id);

    statusEl.textContent = `${t('songGeneratorAdded')} (#${song.id})`;
}

function renderSongGeneratorView() {
    const container = document.getElementById('generator-container');
    if (!container) return;

    container.innerHTML = `
        <div class="generator-panel">
            <div class="generator-header">
                <h1>${t('songGeneratorTitle')}</h1>
                <p>${t('songGeneratorIntro')}</p>
            </div>

            <div class="generator-grid">
                <label class="generator-field">
                    <span>${t('songGeneratorName')}</span>
                    <input id="songgen-name" type="text" placeholder="Die rote Sonne von Barbados">
                </label>

                <label class="generator-field">
                    <span>${t('songGeneratorArtist')}</span>
                    <input id="songgen-artist" type="text" placeholder="Optional">
                </label>

                <label class="generator-field generator-field-full">
                    <span>${t('songGeneratorCategory')}</span>
                    <input id="songgen-category" type="text" placeholder="Western">
                </label>
            </div>

            <label class="generator-field generator-field-full">
                <span>${t('songGeneratorNotation')}</span>
                <textarea id="songgen-notation" rows="7" placeholder="1,-1,_1;2,-2,_2;"></textarea>
            </label>

            <div class="generator-actions">
                <button id="songgen-save-btn" type="button">${t('songGeneratorOk')}</button>
            </div>

            <div id="songgen-status" class="generator-status"></div>
        </div>
    `;

    document.getElementById('songgen-save-btn').addEventListener('click', handleSongGeneratorSubmit);
}

function openSongGeneratorView() {
    switchView('generator');
    renderSongGeneratorView();
}

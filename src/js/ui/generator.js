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

function buildSongGeneratorJson(formData) {
    const song = {
        id: formData.id,
        name: formData.name,
        artist: formData.artist,
        category: formData.category,
        page: formData.page,
        tablature: formData.tablature
    };

    return JSON.stringify(song, null, 2);
}

function buildSongGeneratorManifestEntry(formData, fileName) {
    return JSON.stringify({ id: formData.id, file: fileName }, null, 2);
}

function getSongGeneratorFormData() {
    const name = document.getElementById('songgen-name').value.trim();
    const artist = document.getElementById('songgen-artist').value.trim();
    const category = document.getElementById('songgen-category').value.trim() || 'Sonstige';
    const pageRaw = document.getElementById('songgen-page').value.trim();
    const idRaw = document.getElementById('songgen-id').value.trim();
    const notation = document.getElementById('songgen-notation').value;

    const page = pageRaw ? parseInt(pageRaw, 10) : 0;
    const id = idRaw ? parseInt(idRaw, 10) : 0;

    return { name, artist, category, page, id, notation };
}

function renderSongGeneratorPreview() {
    const previewEl = document.getElementById('songgen-preview');
    const manifestEl = document.getElementById('songgen-manifest-preview');
    const statusEl = document.getElementById('songgen-status');
    if (!previewEl || !manifestEl || !statusEl) return;

    const formData = getSongGeneratorFormData();
    if (!formData.name) {
        previewEl.value = '';
        manifestEl.value = '';
        statusEl.textContent = '';
        return;
    }

    const parsed = parseSongGeneratorNotation(formData.notation);
    if (parsed.errors.length) {
        previewEl.value = '';
        manifestEl.value = '';
        statusEl.textContent = parsed.errors.join('\n');
        return;
    }

    const normalized = {
        ...formData,
        tablature: parsed.tablature
    };
    const fileName = `${slugifySongName(formData.name)}.json`;

    previewEl.value = buildSongGeneratorJson(normalized);
    manifestEl.value = buildSongGeneratorManifestEntry(normalized, fileName);
    statusEl.textContent = `${parsed.tablature.length} rows, ${parsed.tablature.reduce((sum, row) => sum + row.length, 0)} notes`;
}

function downloadSongGeneratorJson() {
    const formData = getSongGeneratorFormData();
    const parsed = parseSongGeneratorNotation(formData.notation);
    const statusEl = document.getElementById('songgen-status');

    if (!formData.name) {
        if (statusEl) statusEl.textContent = 'Song name is required.';
        return;
    }

    if (parsed.errors.length) {
        if (statusEl) statusEl.textContent = parsed.errors.join('\n');
        return;
    }

    const fileName = `${slugifySongName(formData.name)}.json`;
    const blob = new Blob([
        buildSongGeneratorJson({ ...formData, tablature: parsed.tablature }) + '\n'
    ], { type: 'application/json;charset=utf-8' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);

    if (statusEl) statusEl.textContent = `Downloaded ${fileName}`;
}

async function copySongGeneratorPreview(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    try {
        await navigator.clipboard.writeText(target.value);
    } catch (error) {
        target.select();
        document.execCommand('copy');
    }
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

                <label class="generator-field">
                    <span>${t('songGeneratorCategory')}</span>
                    <input id="songgen-category" type="text" placeholder="Western">
                </label>

                <label class="generator-field">
                    <span>${t('songGeneratorPage')}</span>
                    <input id="songgen-page" type="number" min="0" step="1" value="0">
                </label>

                <label class="generator-field">
                    <span>${t('songGeneratorId')}</span>
                    <input id="songgen-id" type="number" min="0" step="1" value="0">
                </label>
            </div>

            <label class="generator-field generator-field-full">
                <span>${t('songGeneratorNotation')}</span>
                <textarea id="songgen-notation" rows="6" placeholder="1,-1,_1;2,-2,_2;"></textarea>
            </label>

            <div class="generator-actions">
                <button id="songgen-preview-btn" type="button">${t('songGeneratorPreview')}</button>
                <button id="songgen-download-btn" type="button">${t('songGeneratorDownload')}</button>
                <button id="songgen-copy-json-btn" type="button">${t('songGeneratorCopyJson')}</button>
                <button id="songgen-copy-manifest-btn" type="button">${t('songGeneratorCopyManifest')}</button>
            </div>

            <div id="songgen-status" class="generator-status"></div>

            <div class="generator-output-grid">
                <label class="generator-field generator-field-full">
                    <span>${t('songGeneratorJson')}</span>
                    <textarea id="songgen-preview" rows="14" readonly></textarea>
                </label>

                <label class="generator-field generator-field-full">
                    <span>${t('songGeneratorManifest')}</span>
                    <textarea id="songgen-manifest-preview" rows="4" readonly></textarea>
                </label>
            </div>
        </div>
    `;

    const fields = [
        'songgen-name',
        'songgen-artist',
        'songgen-category',
        'songgen-page',
        'songgen-id',
        'songgen-notation'
    ];

    fields.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', renderSongGeneratorPreview);
        }
    });

    document.getElementById('songgen-preview-btn').addEventListener('click', renderSongGeneratorPreview);
    document.getElementById('songgen-download-btn').addEventListener('click', downloadSongGeneratorJson);
    document.getElementById('songgen-copy-json-btn').addEventListener('click', () => copySongGeneratorPreview('songgen-preview'));
    document.getElementById('songgen-copy-manifest-btn').addEventListener('click', () => copySongGeneratorPreview('songgen-manifest-preview'));

    renderSongGeneratorPreview();
}

function openSongGeneratorView() {
    switchView('generator');
    renderSongGeneratorView();
}
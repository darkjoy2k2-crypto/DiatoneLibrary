function renderTablature(song) {
    const container = document.getElementById('tablature-container');
    container.innerHTML = '';

    const scaleFactor = appState.zoomLevel / 100;

    song.tablature.forEach((line, lineIndex) => {
        if (line.length === 0) {
            const spacer = document.createElement('div');
            spacer.style.width = '100%';
            spacer.style.height = '16px';
            container.appendChild(spacer);
            return;
        }

        line.forEach((toneIndex, notePos) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.id = 'note-' + lineIndex + '-' + notePos;

            const toneInfo = toneIndexMap[toneIndex];
            let displayText = String(toneInfo.hole);
            let isBend = false;

            // Bestimme Darstellung basierend auf Typ
            if (toneInfo.type === 'blow') {
                displayText = String(toneInfo.hole);
            } else if (toneInfo.type === 'draw') {
                displayText = '(' + toneInfo.hole + ')';
            } else if (toneInfo.type === 'bend') {
                isBend = true;
                displayText = String(toneInfo.hole);
            }

            noteElement.innerHTML = displayText;

            // Unterstrich nur für Bendings (auf der Ziffer)
            if (isBend) {
                noteElement.classList.add('bend');
                const nums = noteElement.innerHTML.match(/\d+/);
                if (nums) {
                    const num = nums[0];
                    const html = noteElement.innerHTML.replace(
                        num,
                        '<span style="text-decoration: underline;">' + num + '</span>'
                    );
                    noteElement.innerHTML = html;
                }
            }

            // Add note name if enabled
            if (appState.showNotes && toneInfo) {
                noteElement.innerHTML += '<div style="font-size: 0.6em; margin-top: 2px; opacity: 0.7;">' + toneInfo.tone + '</div>';
            }

            noteElement.style.fontSize = (scaleFactor * 40) + 'px';

            noteElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!appState.isPlaying && toneInfo) {
                    const frequency = toneFrequencies[toneIndex];
                    if (frequency) {
                        playSingleNote(frequency);
                    }
                }
            });

            container.appendChild(noteElement);
        });

        const lineBreak = document.createElement('div');
        lineBreak.style.width = '100%';
        lineBreak.style.height = '0';
        container.appendChild(lineBreak);
    });
}


function highlightNote(lineIndex, noteIndex) {
    document.querySelectorAll('.note.active').forEach(n => n.classList.remove('active'));
    const noteId = 'note-' + lineIndex + '-' + noteIndex;
    const noteEl = document.getElementById(noteId);
    if (noteEl) {
        noteEl.classList.add('active');
    }
}

function clearHighlight() {
    document.querySelectorAll('.note.active').forEach(n => n.classList.remove('active'));
}

function updateButtonStates() {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (appState.isPlaying) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        stopBtn.style.display = 'block';
    } else {
        playBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
        stopBtn.style.display = 'none';
    }
}

async function playTablature() {
    if (!appState.selectedSong) return;

    appState.isPlaying = true;
    appState.playbackController = new AbortController();
    const signal = appState.playbackController.signal;

    const tablature = appState.selectedSong.tablature;

    for (let lineIndex = appState.currentLineIndex; lineIndex < tablature.length; lineIndex++) {
        if (signal.aborted) break;

        const line = tablature[lineIndex];

        if (line.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 400));
            appState.currentLineIndex = lineIndex + 1;
            continue;
        }

        for (let noteIndex = appState.currentNoteIndex; noteIndex < line.length; noteIndex++) {
            if (signal.aborted) break;

            const toneIndex = line[noteIndex];
            const frequency = toneFrequencies[toneIndex];

            if (frequency) {
                highlightNote(lineIndex, noteIndex);
                await playNote(frequency, 200);
            }

            if (!signal.aborted && noteIndex < line.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            appState.currentNoteIndex = noteIndex + 1;

            if (signal.aborted) break;
        }

        if (!signal.aborted && lineIndex < tablature.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        appState.currentLineIndex = lineIndex + 1;
        appState.currentNoteIndex = 0;
    }

    clearHighlight();
    appState.isPlaying = false;
    appState.isPaused = false;
    updateButtonStates();

    if (appState.currentView === 'inventory' && appState.inventoryPlayingSongId) {
        appState.inventoryPlayingSongId = null;
        renderInventory();
    }
}

function playAudio() {
    if (!appState.selectedSong) {
        alert(t('selectSongFirst'));
        return;
    }

    if (appState.isPlaying && appState.isPaused) {
        appState.isPaused = false;
        playTablature();
    } else if (!appState.isPlaying) {
        appState.currentLineIndex = 0;
        appState.currentNoteIndex = 0;
        playTablature();
    }

    updateButtonStates();
}

function pauseAudio() {
    if (appState.isPlaying) {
        appState.isPaused = true;
        if (appState.playbackController) {
            appState.playbackController.abort();
        }
    }
    updateButtonStates();
}

function stopPlayback() {
    appState.isPlaying = false;
    appState.isPaused = false;
    appState.currentLineIndex = 0;
    appState.currentNoteIndex = 0;

    if (appState.playbackController) {
        appState.playbackController.abort();
    }

    clearHighlight();
    updateButtonStates();

    if (appState.currentView === 'inventory' && appState.inventoryPlayingSongId) {
        appState.inventoryPlayingSongId = null;
        renderInventory();
    }
}

function stopAudio() {
    stopPlayback();
}

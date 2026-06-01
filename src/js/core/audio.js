let audioContext = null;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playSingleNote(frequency) {
    try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.4);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error('Audio Error:', e);
    }
}

function playNote(frequency, duration) {
    return new Promise((resolve) => {
        try {
            const ctx = initAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            const dur = Math.max(duration / 1000, 0.3);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + dur - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + dur);

            setTimeout(resolve, duration);
        } catch (e) {
            console.error('Audio Error:', e);
            resolve();
        }
    });
}

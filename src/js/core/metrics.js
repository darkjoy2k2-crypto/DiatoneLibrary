function initMetrics() {
    const playCounts = JSON.parse(localStorage.getItem('app-play-counts') || '{}');
    const ratings = JSON.parse(localStorage.getItem('app-song-ratings') || '{}');
    const lastPlayed = JSON.parse(localStorage.getItem('app-song-lastplayed') || '{}');

    appState.playCounts = playCounts;
    appState.ratings = ratings;
    appState.lastPlayed = lastPlayed;
}

function incrementPlayCount(songId) {
    appState.playCounts[songId] = (appState.playCounts[songId] || 0) + 1;
    appState.lastPlayed[songId] = new Date().toISOString();
    localStorage.setItem('app-play-counts', JSON.stringify(appState.playCounts));
    localStorage.setItem('app-song-lastplayed', JSON.stringify(appState.lastPlayed));
}

function setRating(songId, rating) {
    if (rating < 0 || rating > 5) return;
    appState.ratings[songId] = rating;
    localStorage.setItem('app-song-ratings', JSON.stringify(appState.ratings));
}

function getPlayCount(songId) {
    return appState.playCounts[songId] || 0;
}

function getRating(songId) {
    return appState.ratings[songId] || 0;
}

function getAllMetrics() {
    const metrics = {};
    for (const [songId, playCount] of Object.entries(appState.playCounts)) {
        metrics[songId] = {
            playCount: playCount,
            rating: appState.ratings[songId] || 0,
            lastPlayed: appState.lastPlayed[songId] || null
        };
    }
    return metrics;
}

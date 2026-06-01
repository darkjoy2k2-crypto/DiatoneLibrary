function renderHelpView() {
    const container = document.getElementById('help-container');
    container.innerHTML = '';

    const sections = getHelpSections();

    sections.forEach(section => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'help-section';
        sectionEl.innerHTML = `
            <h2>${section.title}</h2>
            <p>${section.content}</p>
        `;
        container.appendChild(sectionEl);
    });
}

function getHelpSections() {
    return [
        {
            title: t('uiLayout'),
            content: t('uiLayoutDesc')
        },
        {
            title: t('ratingSystem'),
            content: t('ratingSystemDesc')
        },
        {
            title: t('playCount'),
            content: t('playCountDesc')
        },
        {
            title: t('inventoryFeature'),
            content: t('inventoryFeatureDesc')
        },
        {
            title: t('settingsFeature'),
            content: t('settingsFeatureDesc')
        },
        {
            title: t('playbackControls'),
            content: t('playbackControlsDesc')
        },
        {
            title: t('keyboardShortcuts'),
            content: t('keyboardShortcutsDesc')
        }
    ];
}

function openHelpView() {
    switchView('help');
    renderHelpView();
}

function closeHelpView() {
    switchView('welcome');
}

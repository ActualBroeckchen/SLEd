/**
 * SLEd - Simple Lorebook Editor
 * State Management Module
 */

export const state = {
    lorebookData: null,
    fileName: '',
    openTabs: [],
    currentEntryUid: null,
    hasUnsavedChanges: false,
    filterText: '',
    settings: {
        theme: 'light',
        dyslexiaFont: false,
        sidebarZoom: 'normal',
        exportTitles: true,
        exportKeywords: true,
        exportComments: false
    }
};

export function loadSettings() {
    const saved = localStorage.getItem('sled-settings');
    if (saved) {
        try {
            Object.assign(state.settings, JSON.parse(saved));
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    const legacyTheme = localStorage.getItem('sled-theme');
    if (legacyTheme) {
        state.settings.theme = legacyTheme;
    }
}

export function saveSettings() {
    localStorage.setItem('sled-settings', JSON.stringify(state.settings));
}

export function resetState() {
    state.lorebookData = null;
    state.fileName = '';
    state.openTabs = [];
    state.currentEntryUid = null;
    state.hasUnsavedChanges = false;
    state.filterText = '';
}

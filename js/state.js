/**
 * SLEd - Simple Lorebook Editor
 * State Management Module
 */

export const state = {
    lorebook: null,
    fileName: 'Untitled.json',
    entries: {},
    openTabs: [],
    activeTabId: null,
    unsavedChanges: new Set(),
    searchResults: [],
    currentSearchIndex: 0,
    settings: {
        theme: 'light',
        dyslexiaFont: false,
        sidebarZoom: 'normal',
        exportTitles: true,
        exportKeywords: true,
        exportComments: false
    }
};

/**
 * Load settings from localStorage
 */
export function loadSettings() {
    const saved = localStorage.getItem('sled-settings');
    if (saved) {
        try {
            Object.assign(state.settings, JSON.parse(saved));
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }
    
    // Check for legacy theme setting
    const legacyTheme = localStorage.getItem('sled-theme');
    if (legacyTheme) {
        state.settings.theme = legacyTheme;
    }
}

/**
 * Save settings to localStorage
 */
export function saveSettings() {
    localStorage.setItem('sled-settings', JSON.stringify(state.settings));
}

/**
 * Reset state for new lorebook
 */
export function resetState() {
    state.lorebook = null;
    state.fileName = 'Untitled.json';
    state.entries = {};
    state.openTabs = [];
    state.activeTabId = null;
    state.unsavedChanges.clear();
    state.searchResults = [];
    state.currentSearchIndex = 0;
}

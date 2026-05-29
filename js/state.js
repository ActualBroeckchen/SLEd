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
    unsavedEntries: new Set(),
    selectedEntries: new Set(),
    filterText: '',
    mergeStaging: null,
    mergeSelected: new Set(),
    scriptImportStaging: null,
    settings: {
        theme: 'light',
        dyslexiaFont: false,
        editorFont: 'mono',
        sidebarZoom: 'normal',
        sideBySide: false,
        // Granular text-export prefs
        txtIncludeTitles: true,
        txtIncludeContent: true,
        txtIncludePrimaryKeys: true,
        txtIncludeSecondaryKeys: false,
        txtIncludeStatus: false,
        txtIncludeComments: false,
        txtIncludeOrder: false
    }
};

const SETTINGS_KEY = 'sled-settings';
const SESSION_KEY = 'sled-session';

export function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

export function loadSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed.lorebookData) return false;
        state.lorebookData = parsed.lorebookData;
        state.fileName = parsed.fileName || '';
        state.openTabs = Array.isArray(parsed.openTabs) ? parsed.openTabs : [];
        state.currentEntryUid = parsed.currentEntryUid ?? null;
        state.unsavedEntries = new Set(parsed.unsavedEntries || []);
        state.hasUnsavedChanges = !!parsed.hasUnsavedChanges;
        return true;
    } catch (e) {
        console.warn('Failed to restore session:', e);
        return false;
    }
}

export function saveSession() {
    if (!state.lorebookData) {
        localStorage.removeItem(SESSION_KEY);
        return;
    }
    try {
        const payload = {
            lorebookData: state.lorebookData,
            fileName: state.fileName,
            openTabs: state.openTabs,
            currentEntryUid: state.currentEntryUid,
            unsavedEntries: Array.from(state.unsavedEntries),
            hasUnsavedChanges: state.hasUnsavedChanges
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Failed to persist session:', e);
    }
}

let _saveTimer = null;
export function scheduleSave(delay = 400) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        _saveTimer = null;
        saveSession();
    }, delay);
}

export function markEntryUnsaved(uid) {
    if (uid === null || uid === undefined) return;
    state.unsavedEntries.add(uid);
    state.hasUnsavedChanges = true;
    scheduleSave();
}

export function clearUnsaved() {
    state.unsavedEntries.clear();
    state.hasUnsavedChanges = false;
}

export function resetState() {
    state.lorebookData = null;
    state.fileName = '';
    state.openTabs = [];
    state.currentEntryUid = null;
    state.hasUnsavedChanges = false;
    state.unsavedEntries = new Set();
    state.selectedEntries = new Set();
    state.filterText = '';
    state.mergeStaging = null;
    state.mergeSelected = new Set();
    state.scriptImportStaging = null;
}

/**
 * SLEd - Simple Lorebook Editor
 * Main Entry Point Module
 */

import { state, loadSettings, saveSettings } from './state.js';
import { elements, initElements } from './elements.js';
import { debounce } from './utils.js';
import {
    applyAllSettings,
    applyTheme,
    applyDyslexiaFont,
    applySidebarZoom,
    toggleSidebar,
    closeSidebar,
    openModal,
    closeModal,
    closeAllModals,
    showToast,
    updateSidebarHeader,
    updatePositionRowVisibility,
    populateForm,
    getFormData
} from './ui.js';
import {
    createEntry,
    saveCurrentEntry,
    deleteEntry,
    duplicateEntry
} from './entries.js';
import { closeAllTabs } from './tabs.js';
import { renderSidebar, setFilter } from './sidebar.js';
import {
    openSearchModal,
    performSearch,
    replaceCurrent,
    replaceAll
} from './search.js';
import {
    createNewLorebook,
    importLorebook,
    exportLorebook,
    exportLorebookAsText,
    openMergeModal,
    closeMergeModal,
    mergeLorebook,
    setupFileDropHandlers
} from './file-io.js';

function init() {
    initElements();
    loadSettings();
    applyAllSettings();
    setupEventListeners();
    setupFileDropHandlers();
    registerServiceWorker();
    updateSidebarHeader();
    renderSidebar();

    console.log('SLEd initialized');
}

function setupEventListeners() {
    setupHeaderHandlers();
    setupSidebarHandlers();
    setupWelcomeHandlers();
    setupActionBarHandlers();
    setupModalCloseHandlers();
    setupSettingsHandlers();
    setupSearchHandlers();
    setupExportHandlers();
    setupMergeHandlers();
    setupFormHandlers();
    setupKeyboardShortcuts();
    setupUnsavedWarning();
}

/* ---------- Header ---------- */

function setupHeaderHandlers() {
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleSidebar);
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
    }
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', openSearchModal);
    }
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    }
}

/* ---------- Sidebar ---------- */

function setupSidebarHandlers() {
    if (elements.sidebarSearch) {
        elements.sidebarSearch.addEventListener('input', debounce((e) => {
            setFilter(e.target.value);
        }, 200));
    }
    if (elements.sidebarZoom) {
        elements.sidebarZoom.addEventListener('change', (e) => {
            state.settings.sidebarZoom = e.target.value;
            saveSettings();
            applySidebarZoom();
        });
    }
    if (elements.addEntryBtn) {
        elements.addEntryBtn.addEventListener('click', () => {
            createEntry();
            // On mobile, leave the sidebar open so the user sees the new entry
        });
    }
    if (elements.sidebarClose) {
        elements.sidebarClose.addEventListener('click', closeSidebar);
    }
}

/* ---------- Welcome screen ---------- */

function setupWelcomeHandlers() {
    // Welcome buttons trigger the file picker / create flow
    if (elements.importBtn && elements.fileInput) {
        elements.importBtn.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.newLorebookBtn) {
        elements.newLorebookBtn.addEventListener('click', createNewLorebook);
    }
    // The "empty state" import button is re-wired inside renderSidebar(),
    // since the empty state's HTML gets reset on each render.

    // Main file input → import
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                importLorebook(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
}

/* ---------- Action bar ---------- */

function setupActionBarHandlers() {
    if (elements.actionImport && elements.fileInput) {
        elements.actionImport.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.actionExport) {
        elements.actionExport.addEventListener('click', () => {
            if (!state.lorebookData) {
                showToast('No lorebook to export', 'error');
                return;
            }
            openModal('exportModal');
        });
    }
    if (elements.actionMerge) {
        elements.actionMerge.addEventListener('click', openMergeModal);
    }
    if (elements.actionSave) {
        elements.actionSave.addEventListener('click', saveCurrentEntry);
    }
}

/* ---------- Modal close buttons ---------- */

function setupModalCloseHandlers() {
    const closeMap = [
        ['closeSearchModal', 'searchModal'],
        ['closeSettingsModal', 'settingsModal'],
        ['closeSettingsBtn', 'settingsModal'],
        ['closeExportModal', 'exportModal'],
        ['closeMergeModal', 'mergeModal']
    ];
    closeMap.forEach(([btnId, modalId]) => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => closeModal(modalId));
    });

    // Backdrop click on each <dialog> closes it
    document.querySelectorAll('dialog.modal').forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            // <dialog> reports clicks on the backdrop as having e.target === dialog
            if (e.target === dialog) closeModal(dialog.id);
        });
    });
}

/* ---------- Settings modal handlers ---------- */

function setupSettingsHandlers() {
    if (elements.themeLightBtn) {
        elements.themeLightBtn.addEventListener('click', () => {
            state.settings.theme = 'light';
            saveSettings();
            applyTheme();
        });
    }
    if (elements.themeDarkBtn) {
        elements.themeDarkBtn.addEventListener('click', () => {
            state.settings.theme = 'dark';
            saveSettings();
            applyTheme();
        });
    }
    if (elements.dyslexiaFont) {
        elements.dyslexiaFont.addEventListener('change', (e) => {
            state.settings.dyslexiaFont = e.target.checked;
            saveSettings();
            applyDyslexiaFont();
        });
    }
    if (elements.exportTitles) {
        elements.exportTitles.addEventListener('change', (e) => {
            state.settings.exportTitles = e.target.checked;
            saveSettings();
        });
    }
    if (elements.exportKeywords) {
        elements.exportKeywords.addEventListener('change', (e) => {
            state.settings.exportKeywords = e.target.checked;
            saveSettings();
        });
    }
    if (elements.exportComments) {
        elements.exportComments.addEventListener('change', (e) => {
            state.settings.exportComments = e.target.checked;
            saveSettings();
        });
    }
}

/* ---------- Search modal handlers ---------- */

function setupSearchHandlers() {
    const searchInput = document.getElementById('searchInput');
    const findAllBtn = document.getElementById('findAllBtn');
    const replaceNextBtn = document.getElementById('replaceNextBtn');
    const replaceAllBtn = document.getElementById('replaceAllBtn');

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (findAllBtn) findAllBtn.addEventListener('click', performSearch);
    if (replaceNextBtn) replaceNextBtn.addEventListener('click', replaceCurrent);
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAll);
}

/* ---------- Export modal handlers ---------- */

function setupExportHandlers() {
    if (elements.exportJsonBtn) {
        elements.exportJsonBtn.addEventListener('click', () => {
            exportLorebook(true);
            closeModal('exportModal');
        });
    }
    if (elements.exportTxtBtn) {
        elements.exportTxtBtn.addEventListener('click', () => {
            exportLorebookAsText();
            closeModal('exportModal');
        });
    }
}

/* ---------- Merge handlers ---------- */

function setupMergeHandlers() {
    if (elements.mergeFileInput) {
        elements.mergeFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            mergeLorebook(file, {
                overwriteDuplicates: false,
                mergeByComment: true,
                preserveOrder: true
            });
            e.target.value = '';
        });
    }
    if (elements.mergeConfirm) {
        elements.mergeConfirm.addEventListener('click', () => {
            const input = elements.mergeFileInput;
            if (input && input.files && input.files[0]) {
                mergeLorebook(input.files[0], {
                    overwriteDuplicates: false,
                    mergeByComment: true,
                    preserveOrder: true
                });
                input.value = '';
            } else {
                showToast('Pick a file to merge first', 'error');
            }
        });
    }
}

/* ---------- Form auto-save & position toggles ---------- */

function setupFormHandlers() {
    if (elements.entryPosition) {
        elements.entryPosition.addEventListener('change', updatePositionRowVisibility);
    }

    if (!elements.entryForm) return;

    const autoSave = debounce(() => {
        if (state.currentEntryUid !== null && state.lorebookData?.entries) {
            const entry = state.lorebookData.entries[state.currentEntryUid];
            if (entry) {
                const formData = getFormData();
                Object.assign(entry, formData);
                state.hasUnsavedChanges = true;
            }
        }
    }, 600);

    elements.entryForm.addEventListener('input', autoSave);
    elements.entryForm.addEventListener('change', autoSave);
}

/* ---------- Unsaved warning ---------- */

function setupUnsavedWarning() {
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/* ---------- Keyboard shortcuts ---------- */

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const meta = e.ctrlKey || e.metaKey;

        // Don't intercept typing-in-input single-key Escape outside of modals
        if (e.key === 'Escape') {
            closeAllModals();
            closeSidebar();
            return;
        }

        if (!meta) return;

        switch (e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                saveCurrentEntry();
                break;
            case 'i':
                e.preventDefault();
                if (elements.fileInput) elements.fileInput.click();
                break;
            case 'e':
                e.preventDefault();
                if (state.lorebookData) openModal('exportModal');
                break;
            case 'm':
                e.preventDefault();
                openMergeModal();
                break;
            case 'n':
                e.preventDefault();
                createEntry();
                break;
            case 'h':
                e.preventDefault();
                openSearchModal();
                break;
            case 'd':
                e.preventDefault();
                state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
                saveSettings();
                applyTheme();
                break;
            case 'w':
                e.preventDefault();
                if (state.currentEntryUid !== null) {
                    import('./tabs.js').then(({ closeTab }) => {
                        closeTab(state.currentEntryUid);
                    });
                }
                break;
        }
    });
}

/* ---------- Service Worker ---------- */

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Only register when served over http(s), not over file://
    if (!['http:', 'https:'].includes(location.protocol)) return;
    try {
        await navigator.serviceWorker.register('./service-worker.js');
    } catch (error) {
        console.warn('Service Worker registration failed:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.SLEd = {
    state,
    createEntry,
    exportLorebook,
    importLorebook
};

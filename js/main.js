/**
 * SLEd - Simple Lorebook Editor
 * Main Entry Point Module
 */

import {
    state,
    loadSettings,
    saveSettings,
    loadSession,
    saveSession
} from './state.js';
import { elements, initElements } from './elements.js';
import { debounce } from './utils.js';
import {
    applyAllSettings,
    applyTheme,
    applyDyslexiaFont,
    applyEditorFont,
    applySidebarZoom,
    applyEditorView,
    toggleEditorView,
    toggleSidebar,
    closeSidebar,
    openModal,
    closeModal,
    closeAllModals,
    showToast,
    updateSidebarHeader,
    showEditor,
    renderEditorForms
} from './ui.js';
import { createEntry, saveCurrentEntry } from './entries.js';
import { closeTab, renderTabs } from './tabs.js';
import { renderSidebar, setFilter, clearSelectedEntries } from './sidebar.js';
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
    stageMergeFile,
    mergeSelectAll,
    mergeSelectNone,
    confirmMerge,
    setupFileDropHandlers,
    applyScriptImportReplace,
    applyScriptImportMerge,
    cancelScriptImport
} from './file-io.js';

const persistSession = debounce(saveSession, 400);

function init() {
    initElements();
    loadSettings();
    applyAllSettings();
    setupEventListeners();
    setupFileDropHandlers();
    registerServiceWorker();

    // Try to restore the previous session
    const restored = loadSession();
    updateSidebarHeader();
    renderSidebar();
    if (restored) {
        if (state.openTabs.length > 0) {
            renderTabs();
            renderEditorForms();
            if (state.currentEntryUid !== null) showEditor();
        }
        showToast('Previous session restored', 'info', 2000);
    }

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
    setupEditorViewHandlers();
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
    if (elements.helpBtn) {
        elements.helpBtn.addEventListener('click', () => openModal('helpModal'));
    }
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', () => {
            state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
            saveSettings();
            applyTheme();
        });
    }
    if (elements.editorFontToggle) {
        elements.editorFontToggle.addEventListener('click', () => {
            const order = ['mono', 'sans', 'serif'];
            const cur = order.indexOf(state.settings.editorFont || 'mono');
            state.settings.editorFont = order[(cur + 1) % order.length];
            saveSettings();
            applyEditorFont();
            showToast(`Editor font: ${state.settings.editorFont}`, 'info', 1200);
        });
    }
    if (elements.lorebookName) {
        elements.lorebookName.addEventListener('input', (e) => {
            if (!state.lorebookData) return;
            state.lorebookData.name = e.target.value;
            state.fileName = `${e.target.value || 'lorebook'}.json`;
            state.hasUnsavedChanges = true;
            persistSession();
        });
        elements.lorebookName.addEventListener('blur', updateSidebarHeader);
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
            renderSidebar();
        });
    }
    if (elements.addEntryBtn) {
        elements.addEntryBtn.addEventListener('click', () => createEntry());
    }
    if (elements.sidebarClose) {
        elements.sidebarClose.addEventListener('click', closeSidebar);
    }
    if (elements.clearSelectionBtn) {
        elements.clearSelectionBtn.addEventListener('click', clearSelectedEntries);
    }
}

/* ---------- Welcome screen ---------- */

function setupWelcomeHandlers() {
    if (elements.importBtn && elements.fileInput) {
        elements.importBtn.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.newLorebookBtn) {
        elements.newLorebookBtn.addEventListener('click', createNewLorebook);
    }
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
        ['closeExportTextModal', 'exportTextModal'],
        ['closeExportTextBtn', 'exportTextModal'],
        ['closeMergeModal', 'mergeModal'],
        ['closeScriptImportModal', 'scriptImportModal'],
        ['closeHelpModal', 'helpModal']
    ];
    closeMap.forEach(([btnId, modalId]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (modalId === 'mergeModal') {
            btn.addEventListener('click', closeMergeModal);
        } else if (modalId === 'scriptImportModal') {
            btn.addEventListener('click', cancelScriptImport);
        } else {
            btn.addEventListener('click', () => closeModal(modalId));
        }
    });

    const scriptCancel = document.getElementById('scriptImportCancelBtn');
    if (scriptCancel) scriptCancel.addEventListener('click', cancelScriptImport);
    const scriptReplace = document.getElementById('scriptImportReplaceBtn');
    if (scriptReplace) scriptReplace.addEventListener('click', applyScriptImportReplace);
    const scriptMerge = document.getElementById('scriptImportMergeBtn');
    if (scriptMerge) scriptMerge.addEventListener('click', applyScriptImportMerge);

    document.querySelectorAll('dialog.modal').forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                if (dialog.id === 'mergeModal') closeMergeModal();
                else closeModal(dialog.id);
            }
        });
    });
}

/* ---------- Settings modal handlers ---------- */

function setupSettingsHandlers() {
    if (elements.dyslexiaFont) {
        elements.dyslexiaFont.addEventListener('change', (e) => {
            state.settings.dyslexiaFont = e.target.checked;
            saveSettings();
            applyDyslexiaFont();
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
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                replaceAll();
            } else if (e.shiftKey) {
                replaceCurrent();
            } else {
                performSearch();
            }
        });
    }
    const replaceInput = document.getElementById('replaceInput');
    if (replaceInput) {
        replaceInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) replaceAll();
            else replaceCurrent();
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
            // Hop into the granular text-export modal
            closeModal('exportModal');
            // Pre-fill the filename from the current lorebook
            if (elements.txtExportFilename && !elements.txtExportFilename.value) {
                elements.txtExportFilename.value =
                    state.lorebookData?.name
                    || (state.fileName || 'lorebook').replace(/\.json$/i, '');
            }
            // Reflect saved prefs in the checkboxes
            const map = [
                ['txtIncludeTitles', 'txtIncludeTitles'],
                ['txtIncludeContent', 'txtIncludeContent'],
                ['txtIncludePrimaryKeys', 'txtIncludePrimaryKeys'],
                ['txtIncludeSecondaryKeys', 'txtIncludeSecondaryKeys'],
                ['txtIncludeStatus', 'txtIncludeStatus'],
                ['txtIncludeComments', 'txtIncludeComments'],
                ['txtIncludeOrder', 'txtIncludeOrder']
            ];
            map.forEach(([elKey, settingKey]) => {
                const el = elements[elKey];
                if (el) el.checked = !!state.settings[settingKey];
            });
            openModal('exportTextModal');
        });
    }
    if (elements.performExportTextBtn) {
        elements.performExportTextBtn.addEventListener('click', () => {
            // Persist prefs from the modal
            const map = [
                ['txtIncludeTitles', 'txtIncludeTitles'],
                ['txtIncludeContent', 'txtIncludeContent'],
                ['txtIncludePrimaryKeys', 'txtIncludePrimaryKeys'],
                ['txtIncludeSecondaryKeys', 'txtIncludeSecondaryKeys'],
                ['txtIncludeStatus', 'txtIncludeStatus'],
                ['txtIncludeComments', 'txtIncludeComments'],
                ['txtIncludeOrder', 'txtIncludeOrder']
            ];
            map.forEach(([elKey, settingKey]) => {
                const el = elements[elKey];
                if (el) state.settings[settingKey] = el.checked;
            });
            saveSettings();
            const filename = elements.txtExportFilename?.value || undefined;
            exportLorebookAsText({ filename });
            closeModal('exportTextModal');
        });
    }
}

/* ---------- Merge handlers ---------- */

function setupMergeHandlers() {
    if (elements.mergeFileInput) {
        elements.mergeFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            stageMergeFile(file);
            e.target.value = '';
        });
    }
    if (elements.mergeConfirm) {
        elements.mergeConfirm.addEventListener('click', confirmMerge);
    }
    if (elements.mergeSelectAll) {
        elements.mergeSelectAll.addEventListener('click', mergeSelectAll);
    }
    if (elements.mergeSelectNone) {
        elements.mergeSelectNone.addEventListener('click', mergeSelectNone);
    }
}

/* ---------- Editor view (side-by-side) ---------- */

function setupEditorViewHandlers() {
    if (elements.sideBySideToggle) {
        elements.sideBySideToggle.addEventListener('click', () => {
            toggleEditorView();
            saveSettings();
        });
    }
    // Persist sideBySide preference
    applyEditorView();
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
        const targetTag = e.target?.tagName;
        const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable;

        if (e.key === 'Escape') {
            closeAllModals();
            closeSidebar();
            return;
        }

        // F1 / Shift+? → help
        if (!meta && !isTyping && (e.key === 'F1' || (e.shiftKey && e.key === '?'))) {
            e.preventDefault();
            openModal('helpModal');
            return;
        }

        // Tab cycling within open tabs
        if (meta && e.key === 'Tab') {
            if (state.openTabs.length === 0) return;
            e.preventDefault();
            const order = state.openTabs.map(t => t.uid);
            const cur = order.indexOf(state.currentEntryUid);
            const delta = e.shiftKey ? -1 : 1;
            const nextUid = order[(cur + delta + order.length) % order.length];
            import('./tabs.js').then(({ switchToTab }) => switchToTab(nextUid));
            return;
        }

        // Ctrl+Shift+A → toggle dyslexia font
        if (meta && e.shiftKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            state.settings.dyslexiaFont = !state.settings.dyslexiaFont;
            saveSettings();
            applyDyslexiaFont();
            showToast(state.settings.dyslexiaFont ? 'Dyslexia font on' : 'Dyslexia font off', 'info', 1200);
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
                    closeTab(state.currentEntryUid);
                }
                break;
        }
    });
}

/* ---------- Service Worker ---------- */

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
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

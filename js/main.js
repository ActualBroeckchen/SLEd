/**
 * SLEd - Simple Lorebook Editor
 * Main Entry Point Module
 */

import { state, loadSettings, saveSettings } from './state.js';
import { elements, initElements } from './elements.js';
import { debounce } from './utils.js';
import { 
    applyAllSettings, 
    toggleSidebar, 
    closeSidebar, 
    openModal, 
    closeModal, 
    closeAllModals,
    showToast,
    toggleAdvancedSettings,
    populateForm,
    getFormData
} from './ui.js';
import { 
    createEntry, 
    openEntry, 
    saveCurrentEntry, 
    deleteEntry, 
    duplicateEntry 
} from './entries.js';
import { renderTabs, closeTab, closeAllTabs } from './tabs.js';
import { renderSidebar, setFilter } from './sidebar.js';
import { 
    openSearchModal, 
    closeSearchModal, 
    performSearch, 
    nextResult, 
    prevResult,
    replaceCurrent,
    replaceAll
} from './search.js';
import { 
    createNewLorebook, 
    importLorebook, 
    exportLorebook, 
    openMergeModal,
    closeMergeModal,
    mergeLorebook,
    setupFileDropHandlers
} from './file-io.js';

/**
 * Initialize the application
 */
function init() {
    // Initialize DOM elements
    initElements();
    
    // Load saved settings
    loadSettings();
    applyAllSettings();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup file drop handlers
    setupFileDropHandlers();
    
    // Register service worker
    registerServiceWorker();
    
    console.log('SLEd initialized');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleSidebar);
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
    }
    if (elements.sidebarClose) {
        elements.sidebarClose.addEventListener('click', closeSidebar);
    }
    
    // Sidebar filter
    if (elements.sidebarSearch) {
        elements.sidebarSearch.addEventListener('input', debounce((e) => {
            setFilter(e.target.value);
        }, 200));
    }
    
    // New entry button
    if (elements.newEntryBtn) {
        elements.newEntryBtn.addEventListener('click', createEntry);
    }
    
    // File actions - New Lorebook
    if (elements.newLorebookBtn) {
        elements.newLorebookBtn.addEventListener('click', createNewLorebook);
    }
    
    // Import button and file input
    if (elements.importBtn && elements.fileInput) {
        elements.importBtn.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.emptyImportBtn && elements.fileInput) {
        elements.emptyImportBtn.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                importLorebook(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    
    // Action bar buttons
    if (elements.actionImport && elements.fileInput) {
        elements.actionImport.addEventListener('click', () => elements.fileInput.click());
    }
    if (elements.actionExport) {
        elements.actionExport.addEventListener('click', () => exportLorebook(true));
    }
    if (elements.actionMerge) {
        elements.actionMerge.addEventListener('click', openMergeModal);
    }
    
    // Search
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', openSearchModal);
    }
    
    // Settings
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    }
    
    // Save button
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', saveCurrentEntry);
    }
    
    // Delete button
    if (elements.deleteBtn) {
        elements.deleteBtn.addEventListener('click', () => {
            if (state.currentEntryUid !== null) {
                deleteEntry(state.currentEntryUid);
            }
        });
    }
    
    // Duplicate button
    if (elements.duplicateBtn) {
        elements.duplicateBtn.addEventListener('click', () => {
            if (state.currentEntryUid !== null) {
                duplicateEntry(state.currentEntryUid);
            }
        });
    }
    
    // Advanced settings toggle
    const advancedToggle = document.querySelector('.section-header.advanced');
    if (advancedToggle) {
        advancedToggle.addEventListener('click', toggleAdvancedSettings);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Settings modal handlers
    setupSettingsHandlers();
    
    // Search modal handlers
    setupSearchHandlers();
    
    // Merge modal handlers
    setupMergeHandlers();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Form auto-save (debounced)
    if (elements.entryForm) {
        const autoSave = debounce(() => {
            if (state.currentEntryUid !== null && state.lorebookData) {
                const entry = state.lorebookData.entries[state.currentEntryUid];
                if (entry) {
                    const formData = getFormData();
                    Object.assign(entry, formData);
                    state.hasUnsavedChanges = true;
                }
            }
        }, 1000);
        
        elements.entryForm.addEventListener('input', autoSave);
        elements.entryForm.addEventListener('change', autoSave);
    }
    
    // Warn on unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/**
 * Setup settings modal handlers
 */
function setupSettingsHandlers() {
    // Theme select
    if (elements.themeSelect) {
        elements.themeSelect.addEventListener('change', (e) => {
            state.settings.theme = e.target.value;
            saveSettings();
            applyAllSettings();
        });
    }
    
    // Font select
    if (elements.fontSelect) {
        elements.fontSelect.addEventListener('change', (e) => {
            state.settings.font = e.target.value;
            saveSettings();
            applyAllSettings();
        });
    }
    
    // Font size
    if (elements.fontSizeInput) {
        elements.fontSizeInput.addEventListener('change', (e) => {
            state.settings.fontSize = parseInt(e.target.value) || 16;
            saveSettings();
            applyAllSettings();
        });
    }
}

/**
 * Setup search modal handlers
 */
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

/**
 * Setup merge modal handlers
 */
function setupMergeHandlers() {
    const mergeFileInput = document.getElementById('merge-file-input');
    const mergeConfirmBtn = document.getElementById('mergeConfirm');
    
    if (mergeConfirmBtn && mergeFileInput) {
        mergeConfirmBtn.addEventListener('click', () => {
            if (mergeFileInput.files[0]) {
                const options = {
                    overwriteDuplicates: false,
                    mergeByComment: false,
                    preserveOrder: true
                };
                mergeLorebook(mergeFileInput.files[0], options);
            } else {
                showToast('Please select a file to merge', 'error');
            }
        });
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S = Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentEntry();
        }
        
        // Ctrl/Cmd + F = Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            openSearchModal();
        }
        
        // Ctrl/Cmd + N = New Entry
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createEntry();
        }
        
        // Ctrl/Cmd + O = Import
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('file-input')?.click();
        }
        
        // Ctrl/Cmd + Shift + S = Export
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            exportLorebook(true);
        }
        
        // Escape = Close modals
        if (e.key === 'Escape') {
            closeAllModals();
            closeSidebar();
        }
        
        // Ctrl/Cmd + D = Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (state.currentEntryUid !== null) {
                duplicateEntry(state.currentEntryUid);
            }
        }
    });
}

/**
 * Register service worker for PWA
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
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

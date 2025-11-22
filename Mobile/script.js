// Lorebook Manager - Main Script

let currentZoomLevel = 1; // 0: zoomed out, 1: normal, 2: zoomed in
let lorebook = { entries: {} };
let openTabs = [];
let activeTabId = null;
let nextUid = 0;
let sideBySideView = false;
let selectedEntries = [];
let draggedEntries = [];
let unsavedChanges = new Set(); // Track which entries have unsaved changes
let formState = {}; // Store form data for entries with unsaved changes
let mergeStaging = null; // Lorebook staged for merging
let mergeSelectedEntries = []; // Entries selected for merge

// Helper function to get activation state emoji
function getActivationEmoji(entry) {
    if (entry.disable) {
        return '⚫'; // Inactive
    } else if (entry.constant) {
        return '🔵'; // Constant
    } else if (entry.vectorized) {
        return '🔗'; // Vector-Activated
    } else {
        return '🟢'; // Keyword-Activated
    }
}

// LocalStorage persistence
function saveToLocalStorage() {
    try {
        localStorage.setItem('lorebook_data', JSON.stringify(lorebook));
        localStorage.setItem('lorebook_openTabs', JSON.stringify(openTabs));
        localStorage.setItem('lorebook_activeTab', activeTabId);
        localStorage.setItem('lorebook_nextUid', nextUid);
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedLorebook = localStorage.getItem('lorebook_data');
        if (savedLorebook) {
            lorebook = JSON.parse(savedLorebook);
            document.getElementById('lorebookName').value = lorebook.name || '';
        }
        
        const savedTabs = localStorage.getItem('lorebook_openTabs');
        if (savedTabs) {
            openTabs = JSON.parse(savedTabs);
        }
        
        const savedActiveTab = localStorage.getItem('lorebook_activeTab');
        if (savedActiveTab && savedActiveTab !== 'null') {
            activeTabId = parseInt(savedActiveTab);
        }
        
        const savedNextUid = localStorage.getItem('lorebook_nextUid');
        if (savedNextUid) {
            nextUid = parseInt(savedNextUid);
        }
        
        if (Object.keys(lorebook.entries).length > 0) {
            renderEntryList();
            renderTabs();
            if (activeTabId !== null) {
                renderEditor();
            }
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Manual reload button for service worker/app update
    const reloadAppBtn = document.getElementById('reloadAppBtn');
    if (reloadAppBtn) {
        reloadAppBtn.addEventListener('click', () => {
            window.location.reload(true);
        });
    }
    try {
        console.time('[SLEd] init');
        loadFromLocalStorage();
        initializeEventListeners();
        setupKeyboardHandling();
        
        // Initialize control bars visibility
        const sidebarHeader = document.getElementById('mobileSidebarHeader');
        const tabsContainer = document.getElementById('mobileTabsContainer');
        
        // Show sidebar header by default, hide tabs container
        if (sidebarHeader) {
            sidebarHeader.style.opacity = '1';
            sidebarHeader.style.visibility = 'visible';
        }
        if (tabsContainer) {
            tabsContainer.style.opacity = '0';
            tabsContainer.style.visibility = 'hidden';
        }
        console.timeEnd('[SLEd] init');
        console.log('[SLEd] Initialization complete');
        verifyMobileBindings();
    } catch (err) {
        console.error('[SLEd] Initialization error:', err);
        // Retry once after a short delay in case of transient race/shadow issues
        setTimeout(() => {
            try {
                console.warn('[SLEd] Retrying initialization...');
                initializeEventListeners();
                console.log('[SLEd] Retry initialization finished');
                verifyMobileBindings();
            } catch (retryErr) {
                console.error('[SLEd] Retry failed:', retryErr);
            }
        }, 250);
    }
});

function verifyMobileBindings() {
    const ids = [
        'entriesNavBtn','editorNavBtn','mobileImportBtn','mobileExportBtn',
        'importBtn','importMergeBtn','exportBtn','exportTextBtn','newEntryBtn'
    ];
    const missing = [];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
            missing.push(id + ':element');
            return;
        }
        switch(id) {
            case 'entriesNavBtn': el.onclick || el.addEventListener('click', () => switchToMobilePanel('entries')); break;
            case 'editorNavBtn': el.onclick || el.addEventListener('click', () => switchToMobilePanel('editor')); break;
            case 'mobileImportBtn': el.onclick || el.addEventListener('click', (e)=>{e.stopPropagation(); const m=document.getElementById('mobileImportMenu'); if(m){m.classList.toggle('show'); const ex=document.getElementById('mobileExportMenu'); if(ex) ex.classList.remove('show');}}); break;
            case 'mobileExportBtn': el.onclick || el.addEventListener('click', (e)=>{e.stopPropagation(); const m=document.getElementById('mobileExportMenu'); if(m){m.classList.toggle('show'); const im=document.getElementById('mobileImportMenu'); if(im) im.classList.remove('show');}}); break;
            case 'importBtn': el.onclick || el.addEventListener('click', importLorebook); break;
            case 'importMergeBtn': el.onclick || el.addEventListener('click', importLorebookForMerge); break;
            case 'exportBtn': el.onclick || el.addEventListener('click', exportLorebook); break;
            case 'exportTextBtn': el.onclick || el.addEventListener('click', showExportTextModal); break;
            case 'newEntryBtn': el.onclick || el.addEventListener('click', createNewEntry); break;
        }
    });
    if (missing.length) {
        console.warn('[SLEd] Missing elements during binding verification:', missing.join(', '));
    } else {
        console.log('[SLEd] Mobile bindings verified.');
    }
}

// Keyboard Handling for Mobile
function setupKeyboardHandling() {
    // Handle visual viewport resize when keyboard opens
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
    }
    
    // Fallback for browsers without visualViewport API
    window.addEventListener('resize', handleWindowResize);
}

let lastViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

function handleViewportResize() {
    if (!window.visualViewport) return;
    
    const currentHeight = window.visualViewport.height;
    const viewportHeightDiff = lastViewportHeight - currentHeight;
    
    // Keyboard likely opened if viewport shrunk significantly
    if (viewportHeightDiff > 150) {
        adjustTextareaForKeyboard(true);
    } else if (viewportHeightDiff < -150) {
        // Keyboard likely closed if viewport expanded significantly
        adjustTextareaForKeyboard(false);
    }
    
    lastViewportHeight = currentHeight;
}

function handleWindowResize() {
    // Fallback for browsers without visualViewport
    if (!window.visualViewport) {
        const currentHeight = window.innerHeight;
        const heightDiff = lastViewportHeight - currentHeight;
        
        if (heightDiff > 150) {
            adjustTextareaForKeyboard(true);
        } else if (heightDiff < -150) {
            adjustTextareaForKeyboard(false);
        }
        
        lastViewportHeight = currentHeight;
    }
}

function adjustTextareaForKeyboard(keyboardOpen) {
    // Find the active content textarea
    const contentTextarea = document.querySelector(`#entryContent-${activeTabId}`);
    if (!contentTextarea) return;
    
    const editor = document.querySelector(`.entry-editor[data-uid="${activeTabId}"]`);
    const isExpandedMode = editor && editor.classList.contains('content-expanded');
    
    if (keyboardOpen) {
        // Store current cursor position and focus state
        const cursorPosition = contentTextarea.selectionStart;
        const scrollTop = contentTextarea.scrollTop;
        
        // Calculate available height
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const tabsContainer = document.querySelector('.mobile-tabs-container');
        const tabsHeight = tabsContainer ? tabsContainer.offsetHeight : 0;
        
        if (isExpandedMode) {
            // In expanded mode, use almost full viewport minus tabs
            const availableHeight = viewportHeight - tabsHeight - 40; // 40px padding buffer
            
            if (availableHeight > 100) {
                contentTextarea.style.height = `${availableHeight}px`;
                contentTextarea.style.minHeight = `${availableHeight}px`;
                contentTextarea.style.maxHeight = `${availableHeight}px`;
            }
        } else {
            // In normal mode, calculate based on textarea position
            const editorContent = document.querySelector('.mobile-editor-content');
            
            if (editorContent) {
                // Get position of textarea relative to editor content
                const textareaTop = contentTextarea.getBoundingClientRect().top;
                const editorContentTop = editorContent.getBoundingClientRect().top;
                const offsetFromContentTop = textareaTop - editorContentTop;
                
                // Calculate available space for textarea
                const availableHeight = viewportHeight - tabsHeight - offsetFromContentTop - 40; // 40px padding buffer
                
                // Adjust textarea height
                if (availableHeight > 100) {
                    contentTextarea.style.height = `${availableHeight}px`;
                    contentTextarea.style.minHeight = `${availableHeight}px`;
                }
            }
        }
        
        // Restore cursor position and scroll
        setTimeout(() => {
            contentTextarea.focus();
            contentTextarea.setSelectionRange(cursorPosition, cursorPosition);
            contentTextarea.scrollTop = scrollTop;
            
            // Scroll textarea into view if needed
            if (!isExpandedMode) {
                contentTextarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    } else {
        // Reset textarea to default size when keyboard closes
        contentTextarea.style.height = '';
        contentTextarea.style.minHeight = '';
        contentTextarea.style.maxHeight = '';
    }
}

// Event Listeners
function initializeEventListeners() {
    // Mobile event listeners
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        mobileMenu.classList.add('show');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        mobileMenu.classList.remove('show');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('show');
        document.body.style.overflow = '';
    });
    
    // Close menu when clicking on overlay
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobileMenu');
            mobileMenu.classList.remove('show');
            mobileMenuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
    
    const importBtn = document.getElementById('importBtn');
    console.log('[Init] importBtn element:', importBtn);
    if (importBtn) {
        console.log('[Init] Binding click to importLorebook');
        importBtn.addEventListener('click', importLorebook);
    }
    
    const importMergeBtn = document.getElementById('importMergeBtn');
    if (importMergeBtn) importMergeBtn.addEventListener('click', importLorebookForMerge);
    
    const exportBtn = document.getElementById('exportBtn');
    console.log('[Init] exportBtn element:', exportBtn);
    if (exportBtn) {
        console.log('[Init] Binding click to exportLorebook');
        exportBtn.addEventListener('click', exportLorebook);
    }
    
    const exportTextBtn = document.getElementById('exportTextBtn');
    if (exportTextBtn) exportTextBtn.addEventListener('click', showExportTextModal);
    
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) newEntryBtn.addEventListener('click', createNewEntry);
    
    const newEntryBtnAlt = document.getElementById('newEntryBtnAlt');
    if (newEntryBtnAlt) newEntryBtnAlt.addEventListener('click', createNewEntry);
    
    const searchEntries = document.getElementById('searchEntries');
    if (searchEntries) searchEntries.addEventListener('input', handleSearch);
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    
    const fileMergeInput = document.getElementById('fileMergeInput');
    if (fileMergeInput) fileMergeInput.addEventListener('change', handleMergeFileSelect);
    
    // Side-by-side view toggle is hidden for now (mobile-first). Do not attach its listener.
    
    const saveEntryBtn = document.getElementById('saveEntryBtn');
    if (saveEntryBtn) saveEntryBtn.addEventListener('click', () => {
        if (activeTabId !== null && activeTabId !== 'readme-tab') {
            saveEntryByUid(activeTabId);
        }
    });
    
    const expandContentBtn = document.getElementById('expandContentBtn');
    if (expandContentBtn) expandContentBtn.addEventListener('click', toggleExpandContent);
    
    const clearSelectionBtn = document.getElementById('clearSelection');
    if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', clearEntrySelection);
    
    const lorebookName = document.getElementById('lorebookName');
    if (lorebookName) lorebookName.addEventListener('input', handleLorebookNameChange);
    
    const readmeBtn = document.getElementById('readmeBtn');
    if (readmeBtn) readmeBtn.addEventListener('click', showReadme);
    
    const closeHelp = document.getElementById('closeHelp');
    if (closeHelp) closeHelp.addEventListener('click', hideHelp);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    const fontToggle = document.getElementById('fontToggle');
    if (fontToggle) fontToggle.addEventListener('click', toggleDyslexiaFont);
    
    const editorFontToggle = document.getElementById('editorFontToggle');
    if (editorFontToggle) editorFontToggle.addEventListener('click', toggleEditorFont);
    
    const zoomOut = document.getElementById('zoomOut');
    if (zoomOut) zoomOut.addEventListener('click', () => changeZoomLevel(-1));
    
    const zoomIn = document.getElementById('zoomIn');
    if (zoomIn) zoomIn.addEventListener('click', () => changeZoomLevel(1));
    
    // This is a duplicate and can be removed
    
    // Dropdown menu functionality
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = toggle.closest('.dropdown');
            const menu = dropdown.querySelector('.dropdown-menu');
            const isOpen = menu.style.display === 'block';
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                m.style.display = 'none';
            });
            
            // Toggle this dropdown
            menu.style.display = isOpen ? 'none' : 'block';
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    });

    
    // Search & Replace modal controls
    const searchReplaceBtn = document.getElementById('searchReplaceBtn');
    if (searchReplaceBtn) searchReplaceBtn.addEventListener('click', showSearchReplaceModal);
    
    const closeSearchReplace = document.getElementById('closeSearchReplace');
    if (closeSearchReplace) closeSearchReplace.addEventListener('click', closeSearchReplaceModal);
    
    const closeSearchReplaceBtn = document.getElementById('closeSearchReplaceBtn');
    if (closeSearchReplaceBtn) closeSearchReplaceBtn.addEventListener('click', closeSearchReplaceModal);
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    
    const replaceBtn = document.getElementById('replaceBtn');
    if (replaceBtn) replaceBtn.addEventListener('click', replaceNext);
    
    const replaceAllBtn = document.getElementById('replaceAllBtn');
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAll);
    
    // Search field keyboard shortcuts
    document.getElementById('searchText').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                replaceNext();
            } else {
                performSearch();
            }
        }
    });
    
    document.getElementById('replaceText').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            replaceAll();
        }
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only trigger shortcuts if not in input/textarea (except for search modal)
        const target = e.target;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isSearchModal = document.getElementById('searchReplaceModal').style.display === 'flex';
        
        // Allow shortcuts in search modal inputs
        if (isInput && !isSearchModal) {
            return;
        }
        
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 'h':
                    // Ctrl+H - Search & Replace
                    e.preventDefault();
                    showSearchReplaceModal();
                    break;
                case 'n':
                    // Ctrl+N - New Entry
                    e.preventDefault();
                    createNewEntry();
                    break;
                case 'i':
                    // Ctrl+I - Import Lorebook
                    e.preventDefault();
                    importLorebook();
                    break;
                case 'e':
                    // Ctrl+E - Export Lorebook
                    e.preventDefault();
                    exportLorebook();
                    break;
                case 'm':
                    // Ctrl+M - Import for Merge
                    e.preventDefault();
                    importLorebookForMerge();
                    break;
                case 's':
                    // Ctrl+S - Save Current Entry
                    e.preventDefault();
                    if (activeTabId !== null) {
                        saveEntryByUid(activeTabId);
                    }
                    break;
                case 'd':
                    // Ctrl+D - Toggle Dark Mode
                    e.preventDefault();
                    toggleTheme();
                    break;
                case 'w':
                    // Ctrl+W - Close Current Tab
                    e.preventDefault();
                    if (activeTabId !== null) {
                        closeTab(activeTabId);
                    }
                    break;
                case 'tab':
                    // Ctrl+Tab - Next Tab
                    e.preventDefault();
                    if (openTabs.length > 0) {
                        const currentIndex = openTabs.indexOf(activeTabId);
                        const nextIndex = (currentIndex + 1) % openTabs.length;
                        activeTabId = openTabs[nextIndex];
                        renderTabs();
                        renderEditor();
                    }
                    break;
            }
        } else if (e.ctrlKey && e.shiftKey) {
            switch(e.key.toLowerCase()) {
                case 'tab':
                    // Ctrl+Shift+Tab - Previous Tab
                    e.preventDefault();
                    if (openTabs.length > 0) {
                        const currentIndex = openTabs.indexOf(activeTabId);
                        const prevIndex = (currentIndex - 1 + openTabs.length) % openTabs.length;
                        activeTabId = openTabs[prevIndex];
                        renderTabs();
                        renderEditor();
                    }
                    break;
                case 'a':
                    // Ctrl+Shift+A - Toggle Dyslexia Font
                    e.preventDefault();
                    toggleDyslexiaFont();
                    break;
            }
        } else if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
            // F1 or Shift+? - Show README
            e.preventDefault();
            showReadme();
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target.id === 'helpModal') hideHelp();
    });
    
    document.getElementById('mergeModal').addEventListener('click', (e) => {
        if (e.target.id === 'mergeModal') closeMergeModal();
    });
    
    document.getElementById('searchReplaceModal').addEventListener('click', (e) => {
        if (e.target.id === 'searchReplaceModal') closeSearchReplaceModal();
    });

    // Import & Merge modal close handlers
    const closeImportModal = document.getElementById('closeImportModal');
    if (closeImportModal) closeImportModal.addEventListener('click', () => {
        const importModal = document.getElementById('importModal');
        if (importModal) importModal.style.display = 'none';
    });
    const closeMergeImportModal = document.getElementById('closeMergeImportModal');
    if (closeMergeImportModal) closeMergeImportModal.addEventListener('click', () => {
        const mergeModal = document.getElementById('mergeImportModal');
        if (mergeModal) mergeModal.style.display = 'none';
    });
    // Click outside to close import/merge modals
    const importModal = document.getElementById('importModal');
    if (importModal) importModal.addEventListener('click', (e)=>{ if(e.target.id==='importModal') importModal.style.display='none'; });
    const mergeImportModal = document.getElementById('mergeImportModal');
    if (mergeImportModal) mergeImportModal.addEventListener('click', (e)=>{ if(e.target.id==='mergeImportModal') mergeImportModal.style.display='none'; });

    // Visible file inputs wiring
    const fileInputVisible = document.getElementById('fileInputVisible');
    if (fileInputVisible) fileInputVisible.addEventListener('change', handleFileSelect);
    const fileMergeInputVisible = document.getElementById('fileMergeInputVisible');
    if (fileMergeInputVisible) fileMergeInputVisible.addEventListener('change', handleMergeFileSelect);
    
    // Load saved preferences
    loadPreferences();
    
    // Initialize mobile interface
    initializeMobileInterface();
}

// Handle lorebook name changes
function handleLorebookNameChange(event) {
    lorebook.name = event.target.value.trim();
}

// Import Lorebook
function importLorebook() {
    console.log('[importLorebook] Function called');
    const hidden = document.getElementById('fileInput');
    console.log('[importLorebook] fileInput element:', hidden);
    if (hidden) {
        try { 
            console.log('[importLorebook] Clicking file input');
            hidden.click(); 
        } catch(e) { 
            console.error('[importLorebook] Click error:', e);
        }
    }
    // Close dropdown
    const menu = document.getElementById('mobileImportMenu');
    if (menu) menu.classList.remove('show');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            lorebook = data;
            
            // Set lorebook name from filename (remove .json extension)
            const fileName = file.name.replace(/\.json$/i, '');
            if (!lorebook.name) {
                lorebook.name = fileName;
            }
            document.getElementById('lorebookName').value = lorebook.name || fileName;
            
            // Find highest UID to set nextUid
            nextUid = 0;
            Object.values(lorebook.entries).forEach(entry => {
                if (entry.uid >= nextUid) {
                    nextUid = entry.uid + 1;
                }
                
                // Add missing fields for backward compatibility
                if (!entry.characterFilter) {
                    entry.characterFilter = { isExclude: false, names: [], tags: [] };
                }
                if (!entry.triggers) {
                    entry.triggers = [];
                }
                if (entry.matchPersonaDescription === undefined) entry.matchPersonaDescription = false;
                if (entry.matchCharacterDescription === undefined) entry.matchCharacterDescription = false;
                if (entry.matchCharacterPersonality === undefined) entry.matchCharacterPersonality = false;
                if (entry.matchCharacterDepthPrompt === undefined) entry.matchCharacterDepthPrompt = false;
                if (entry.matchScenario === undefined) entry.matchScenario = false;
                if (entry.matchCreatorNotes === undefined) entry.matchCreatorNotes = false;
            });
            
            renderEntryList();
        } catch (error) {
            showNotification('Error importing lorebook: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file inputs and close modal
    event.target.value = '';
    const visible = document.getElementById('fileInputVisible');
    if (visible && visible !== event.target) visible.value = '';
    const importModal = document.getElementById('importModal');
    if (importModal) importModal.style.display = 'none';
}

// Export Lorebook
function exportLorebook() {
    console.log('[exportLorebook] Function called');
    // Save the lorebook name from input
    const nameInput = document.getElementById('lorebookName').value.trim();
    lorebook.name = nameInput || 'lorebook';
    console.log('[exportLorebook] Exporting:', lorebook.name);
    
    // Create filename (sanitize and ensure .json extension)
    let filename = lorebook.name.replace(/[^a-z0-9_-]/gi, '_');
    if (!filename.endsWith('.json')) {
        filename += '.json';
    }
    
    const dataStr = JSON.stringify(lorebook, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close dropdown
    const menu = document.getElementById('mobileExportMenu');
    if (menu) menu.classList.remove('show');
}

// Import Lorebook for Merging
function importLorebookForMerge() {
    const hidden = document.getElementById('fileMergeInput');
    if (hidden) {
        try { hidden.click(); } catch(e) { /* ignore */ }
    }
    // Close dropdown
    const menu = document.getElementById('mobileImportMenu');
    if (menu) menu.classList.remove('show');
}

function handleMergeFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            mergeStaging = data;
            mergeSelectedEntries = [];
            
            // Add missing fields for backward compatibility
            Object.values(mergeStaging.entries).forEach(entry => {
                if (!entry.characterFilter) {
                    entry.characterFilter = { isExclude: false, names: [], tags: [] };
                }
                if (!entry.triggers) {
                    entry.triggers = [];
                }
                if (entry.matchPersonaDescription === undefined) entry.matchPersonaDescription = false;
                if (entry.matchCharacterDescription === undefined) entry.matchCharacterDescription = false;
                if (entry.matchCharacterPersonality === undefined) entry.matchCharacterPersonality = false;
                if (entry.matchCharacterDepthPrompt === undefined) entry.matchCharacterDepthPrompt = false;
                if (entry.matchScenario === undefined) entry.matchScenario = false;
                if (entry.matchCreatorNotes === undefined) entry.matchCreatorNotes = false;
            });
            
            showMergeModal();
        } catch (error) {
            showNotification('Error importing lorebook for merge: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file inputs and close modal
    event.target.value = '';
    const visible = document.getElementById('fileMergeInputVisible');
    if (visible && visible !== event.target) visible.value = '';
    const mergeModal = document.getElementById('mergeImportModal');
    if (mergeModal) mergeModal.style.display = 'none';
}

function showMergeModal() {
    // Open merge as a tab in the editor instead of modal
    const mergeTabId = 'merge-staging-tab';
    
    // Add merge tab if not already open
    if (!openTabs.includes(mergeTabId)) {
        openTabs.push(mergeTabId);
    }
    
    activeTabId = mergeTabId;
    renderTabs();
    renderEditor();
    
    // Switch to editor panel on mobile
    switchToMobilePanel('editor');
}

function closeMergeModal() {
    const mergeTabId = 'merge-staging-tab';
    closeTab(mergeTabId);
    mergeStaging = null;
    mergeSelectedEntries = [];
}

function showExportTextModal() {
    // Open export as a tab in the editor instead of modal
    const exportTabId = 'export-text-tab';
    
    // Add export tab if not already open
    if (!openTabs.includes(exportTabId)) {
        openTabs.push(exportTabId);
    }
    
    activeTabId = exportTabId;
    renderTabs();
    renderEditor();
    
    // Switch to editor panel on mobile
    switchToMobilePanel('editor');
    const toolbar = document.getElementById('mobileEditorToolbar');
    if (toolbar) toolbar.style.display = 'flex';
    
    // Close dropdown
    const menu = document.getElementById('mobileExportMenu');
    if (menu) menu.classList.remove('show');
}

// Global resilient click delegation for critical mobile actions
document.addEventListener('click', function(e){
    const target = e.target.closest('[id]');
    if (!target) return;
    switch(target.id){
        case 'entriesNavBtn':
            switchToMobilePanel('entries');
            const toolbar = document.getElementById('mobileEditorToolbar');
            if (toolbar) toolbar.style.display = 'none';
            break;
        case 'editorNavBtn':
            switchToMobilePanel('editor');
            const toolbar2 = document.getElementById('mobileEditorToolbar');
            if (toolbar2) toolbar2.style.display = 'flex';
            break;
        case 'backToListBtn':
            switchToMobilePanel('entries');
            const toolbar3 = document.getElementById('mobileEditorToolbar');
            if (toolbar3) toolbar3.style.display = 'none';
            break;
    }
});

function renderMergeEntryList() {
    const mergeList = document.getElementById('mergeEntryList');
    const entries = Object.values(mergeStaging.entries).sort((a, b) => a.uid - b.uid);
    
    mergeList.innerHTML = '';
    
    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'merge-entry-item';
        if (mergeSelectedEntries.includes(entry.uid)) {
            div.classList.add('selected');
        }
        
        // Make the whole item clickable to toggle selection
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.merge-entry-checkbox')) {
                e.preventDefault();
                toggleMergeSelection(entry.uid);
            }
        });
        div.style.cursor = 'pointer';
        
        const header = document.createElement('div');
        header.className = 'merge-entry-header';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'merge-entry-checkbox';
        checkbox.checked = mergeSelectedEntries.includes(entry.uid);
        checkbox.addEventListener('change', () => toggleMergeSelection(entry.uid));
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        
        const uid = document.createElement('div');
        uid.className = 'merge-entry-uid';
        uid.textContent = `#${entry.uid}`;
        
        const title = document.createElement('div');
        title.className = 'merge-entry-title';
        title.textContent = entry.comment || 'Untitled Entry';
        
        header.appendChild(checkbox);
        header.appendChild(uid);
        header.appendChild(title);
        
        // Keywords
        const keywords = document.createElement('div');
        keywords.className = 'merge-entry-keywords';
        if (entry.key && entry.key.length > 0) {
            entry.key.slice(0, 5).forEach(keyword => {
                const tag = document.createElement('span');
                tag.className = 'keyword-tag';
                tag.textContent = keyword;
                keywords.appendChild(tag);
            });
            if (entry.key.length > 5) {
                const more = document.createElement('span');
                more.className = 'keyword-tag';
                more.textContent = `+${entry.key.length - 5} more`;
                keywords.appendChild(more);
            }
        }
        
        // Status badges
        const status = document.createElement('div');
        status.className = 'merge-entry-status';
        if (entry.constant) {
            const badge = document.createElement('span');
            badge.className = 'status-badge status-constant';
            badge.textContent = 'Constant';
            status.appendChild(badge);
        }
        if (entry.disable) {
            const badge = document.createElement('span');
            badge.className = 'status-badge status-disabled';
            badge.textContent = 'Disabled';
            status.appendChild(badge);
        }
        
        div.appendChild(header);
        if (keywords.children.length > 0) {
            div.appendChild(keywords);
        }
        if (status.children.length > 0) {
            div.appendChild(status);
        }
        
        mergeList.appendChild(div);
    });
    
    updateMergeCount();
}

function toggleMergeSelection(uid) {
    const index = mergeSelectedEntries.indexOf(uid);
    if (index > -1) {
        mergeSelectedEntries.splice(index, 1);
    } else {
        mergeSelectedEntries.push(uid);
    }
    renderMergeEntryList();
}

function selectAllMergeEntries() {
    mergeSelectedEntries = Object.values(mergeStaging.entries).map(e => e.uid);
    renderMergeEntryList();
}

function deselectAllMergeEntries() {
    mergeSelectedEntries = [];
    renderMergeEntryList();
}

function updateMergeCount() {
    // Update count in merge staging tab UI
    const countEl = document.querySelector('.merge-count-display');
    if (countEl) {
        countEl.textContent = mergeSelectedEntries.length;
    }
    
    // Also update selected state for each item
    document.querySelectorAll('.merge-entry-item').forEach(item => {
        const uid = parseInt(item.dataset.mergeUid);
        const isSelected = mergeSelectedEntries.includes(uid);
        
        if (isSelected) {
            item.classList.add('selected');
            const checkbox = item.querySelector('.merge-entry-checkbox');
            if (checkbox) checkbox.checked = true;
        } else {
            item.classList.remove('selected');
            const checkbox = item.querySelector('.merge-entry-checkbox');
            if (checkbox) checkbox.checked = false;
        }
    });
}

function executeMerge() {
    if (mergeSelectedEntries.length === 0) {
        alert('Please select at least one entry to merge.');
        return;
    }
    
    // Find the highest UID in current lorebook
    let maxUid = -1;
    Object.values(lorebook.entries).forEach(entry => {
        if (entry.uid > maxUid) {
            maxUid = entry.uid;
        }
    });
    
    let newUidStart = maxUid + 1;
    let addedCount = 0;
    
    // Copy selected entries and renumber them
    mergeSelectedEntries.forEach(oldUid => {
        const sourceEntry = mergeStaging.entries[oldUid];
        if (!sourceEntry) return;
        
        // Create a deep copy
        const newEntry = JSON.parse(JSON.stringify(sourceEntry));
        
        // Assign new UID
        const newUid = newUidStart + addedCount;
        newEntry.uid = newUid;
        newEntry.order = newUid;
        newEntry.displayIndex = newUid;
        
        // Add to current lorebook
        lorebook.entries[newUid] = newEntry;
        addedCount++;
    });
    
    // Update nextUid
    nextUid = newUidStart + addedCount;
    
    // Refresh UI
    renderEntryList();
    closeMergeModal();
    
    console.log(`Merged ${addedCount} entries from ${mergeStaging.name || 'lorebook'}`);
}


// Create New Entry
function createNewEntry() {
    const uid = nextUid++;
    const newEntry = {
        uid: uid,
        key: [],
        keysecondary: [],
        comment: "New Entry",
        content: "",
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: uid,
        position: 0,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: true,
        preventRecursion: true,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        outletName: "",
        group: "",
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: "",
        role: null,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        triggers: [],
        displayIndex: uid,
        characterFilter: {
            isExclude: false,
            names: [],
            tags: []
        }
    };
    
    lorebook.entries[uid] = newEntry;
    renderEntryList();
    openEntryInTab(uid);
}

// Insert Entry Above - creates new entry before specified UID
function insertEntryAbove(targetUid) {
    const entries = Object.values(lorebook.entries);
    
    // Shift all entries at or after targetUid
    entries.forEach(entry => {
        if (entry.uid >= targetUid) {
            entry.uid++;
            entry.order = entry.uid;
            entry.displayIndex = entry.uid;
        }
    });
    
    // Create new entry at targetUid position
    const newEntry = {
        uid: targetUid,
        key: [],
        keysecondary: [],
        comment: "New Entry",
        content: "",
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: targetUid,
        position: 0,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: true,
        preventRecursion: true,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        outletName: "",
        group: "",
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: "",
        role: null,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        triggers: [],
        displayIndex: targetUid,
        characterFilter: {
            isExclude: false,
            names: [],
            tags: []
        }
    };
    
    // Rebuild entries object with new keys
    const newEntries = {};
    entries.forEach(entry => {
        newEntries[entry.uid] = entry;
    });
    newEntries[targetUid] = newEntry;
    lorebook.entries = newEntries;
    
    // Update nextUid if necessary
    const maxUid = Math.max(...Object.keys(newEntries).map(k => parseInt(k)));
    nextUid = maxUid + 1;
    
    renderEntryList();
    openEntryInTab(targetUid);
}

// Insert Entry Below - creates new entry after specified UID
function insertEntryBelow(targetUid) {
    const entries = Object.values(lorebook.entries);
    const newUid = targetUid + 1;
    
    // Shift all entries after targetUid
    entries.forEach(entry => {
        if (entry.uid > targetUid) {
            entry.uid++;
            entry.order = entry.uid;
            entry.displayIndex = entry.uid;
        }
    });
    
    // Create new entry at position after targetUid
    const newEntry = {
        uid: newUid,
        key: [],
        keysecondary: [],
        comment: "New Entry",
        content: "",
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: newUid,
        position: 0,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: true,
        preventRecursion: true,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        outletName: "",
        group: "",
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: "",
        role: null,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        triggers: [],
        displayIndex: newUid,
        characterFilter: {
            isExclude: false,
            names: [],
            tags: []
        }
    };
    
    // Rebuild entries object with new keys
    const newEntries = {};
    entries.forEach(entry => {
        newEntries[entry.uid] = entry;
    });
    newEntries[newUid] = newEntry;
    lorebook.entries = newEntries;
    
    // Update nextUid if necessary
    const maxUid = Math.max(...Object.keys(newEntries).map(k => parseInt(k)));
    nextUid = maxUid + 1;
    
    renderEntryList();
    openEntryInTab(newUid);
}

// Copy Entry - duplicates an entry and places it right after the original
function copyEntry(sourceUid) {
    const sourceEntry = lorebook.entries[sourceUid];
    if (!sourceEntry) return;
    
    const entries = Object.values(lorebook.entries);
    const newUid = sourceUid + 1;
    
    // Shift all entries after sourceUid
    entries.forEach(entry => {
        if (entry.uid > sourceUid) {
            entry.uid++;
            entry.order = entry.uid;
            entry.displayIndex = entry.uid;
        }
    });
    
    // Create copy of the entry
    const copiedEntry = JSON.parse(JSON.stringify(sourceEntry));
    copiedEntry.uid = newUid;
    copiedEntry.order = newUid;
    copiedEntry.displayIndex = newUid;
    copiedEntry.comment = (copiedEntry.comment || 'Untitled Entry') + ' (Copy)';
    
    // Rebuild entries object with new keys
    const newEntries = {};
    entries.forEach(entry => {
        newEntries[entry.uid] = entry;
    });
    newEntries[newUid] = copiedEntry;
    lorebook.entries = newEntries;
    
    // Update nextUid if necessary
    const maxUid = Math.max(...Object.keys(newEntries).map(k => parseInt(k)));
    nextUid = maxUid + 1;
    
    renderEntryList();
    openEntryInTab(newUid);
}

// Delete Entry from Sidebar - delete without opening
function deleteEntryFromSidebar(uid) {
    if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
        delete lorebook.entries[uid];
        closeTab(uid);
        renderEntryList();
    }
}

// Render Entry List
function renderEntryList() {
    // Mobile entry list
    const entryList = document.getElementById('entryList');
    const entryCount = document.getElementById('entryCount');
    const clearSelectionBtn = document.getElementById('clearSelection');
    
    // Show/hide clear selection button
    if (selectedEntries.length > 0) {
        if (clearSelectionBtn) {
            clearSelectionBtn.style.display = 'block';
            const clearText = clearSelectionBtn.querySelector('span');
            if (clearText) clearText.innerHTML = `<span class="material-symbols-outlined">check_box</span> Clear (${selectedEntries.length})`;
        }
    } else {
        if (clearSelectionBtn) clearSelectionBtn.style.display = 'none';
    }
    
    // Sort entries by UID
    const entries = Object.values(lorebook.entries).sort((a, b) => a.uid - b.uid);
    
    // Update entry count
    if (entryCount) entryCount.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
    
    // Clear list
    if (entryList) entryList.innerHTML = '';
    
    // Create entry items
    entries.forEach(entry => {
        const li = createEntryListItem(entry);
        if (entryList) entryList.appendChild(li);
    });
}

// Helper function to create entry list items
function createEntryListItem(entry) {
    const li = document.createElement('li');
    li.className = 'mobile-entry-item';
    li.classList.add('entry-item'); // Keep base class for styling
    li.dataset.uid = entry.uid;
    li.draggable = true;
    
    if (openTabs.includes(entry.uid)) {
        li.classList.add('active');
    }
    
    if (selectedEntries.includes(entry.uid)) {
        li.classList.add('selected');
    }
    
    // Drag and drop handlers
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);
    
    // Drag handle (only shows when entries are selected)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'entry-drag-handle';
    dragHandle.innerHTML = '<span class="material-symbols-outlined">drag_handle</span>';
    dragHandle.title = 'Drag to reorder selected entries';
    dragHandle.addEventListener('mousedown', (e) => {
        // Ensure drag starts from handle
        li.draggable = true;
    });
    li.appendChild(dragHandle);
    
    // Content wrapper
    const content = document.createElement('div');
    content.className = 'entry-item-content';
    
    // Header with checkbox, number input and title
    const header = document.createElement('div');
    header.className = 'entry-item-header';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'entry-checkbox';
    checkbox.checked = selectedEntries.includes(entry.uid);
    checkbox.addEventListener('click', (e) => e.stopPropagation());
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleEntrySelection(entry.uid);
        renderEntryList();
    });
    
    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.className = 'entry-number-input';
    numberInput.value = entry.uid;
    numberInput.min = 0;
    numberInput.addEventListener('click', (e) => e.stopPropagation());
    numberInput.addEventListener('change', (e) => {
        e.stopPropagation();
        reorderEntry(entry.uid, parseInt(e.target.value));
    });
    
    const emojiIndicator = document.createElement('span');
    emojiIndicator.className = 'entry-activation-emoji';
    emojiIndicator.textContent = getActivationEmoji(entry);
    emojiIndicator.style.marginLeft = '4px';
    emojiIndicator.style.marginRight = '4px';
    
    const title = document.createElement('div');
    title.className = 'entry-item-title';
    title.textContent = entry.comment || 'Untitled Entry';
    
    header.appendChild(checkbox);
    header.appendChild(numberInput);
    header.appendChild(emojiIndicator);
    header.appendChild(title);
    
    content.appendChild(header);
    
    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'entry-item-actions';
    
    // Insert Above button
    const insertAboveBtn = document.createElement('button');
    insertAboveBtn.className = 'entry-action-btn';
    insertAboveBtn.innerHTML = '<span class="material-symbols-outlined">add_row_above</span>';
    insertAboveBtn.title = 'Insert new entry above';
    insertAboveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        insertEntryAbove(entry.uid);
    });
    
    //Insert Below button
    const insertBelowBtn = document.createElement('button');
    insertBelowBtn.className = 'entry-action-btn';
    insertBelowBtn.innerHTML = '<span class="material-symbols-outlined">add_row_below</span>';
    insertBelowBtn.title = 'Insert new entry below';
    insertBelowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        insertEntryBelow(entry.uid);
    });
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'entry-action-btn';
    copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
    copyBtn.title = 'Copy entry';
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyEntry(entry.uid);
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'entry-action-btn entry-action-delete';
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    deleteBtn.title = 'Delete entry';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEntryFromSidebar(entry.uid);
    });
    
    actions.appendChild(insertAboveBtn);
    actions.appendChild(insertBelowBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    
    content.appendChild(actions);
    
    // Add toggle button ONLY for compact mode (zoomed-out)
    if (currentZoomLevel === 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'entry-actions-toggle';
        toggleBtn.innerHTML = '<span class="material-symbols-outlined">expand_more</span>';
        toggleBtn.title = 'Show/hide actions';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            li.classList.toggle('actions-expanded');
        });
        li.appendChild(toggleBtn);
    }
    
    // Add keywords and status for mobile
    if (currentZoomLevel >= 1) {
        const keywords = document.createElement('div');
        keywords.className = 'entry-item-keywords';
        if (entry.key && entry.key.length > 0) {
            const displayCount = currentZoomLevel === 2 ? 5 : 3; // Show more keywords when zoomed in
            entry.key.slice(0, displayCount).forEach(keyword => {
                const tag = document.createElement('span');
                tag.className = 'keyword-tag';
                tag.textContent = keyword;
                keywords.appendChild(tag);
            });
            if (entry.key.length > displayCount) {
                const more = document.createElement('span');
                more.className = 'keyword-tag';
                more.textContent = `+${entry.key.length - displayCount} more`;
                keywords.appendChild(more);
            }
        }
        content.appendChild(keywords);
        
        const status = document.createElement('div');
        status.className = 'entry-item-status';
        if (entry.constant) {
            const badge = document.createElement('span');
            badge.className = 'status-badge status-constant';
            badge.textContent = 'Constant';
            status.appendChild(badge);
        }
        if (entry.disable) {
            const badge = document.createElement('span');
            badge.className = 'status-badge status-disabled';
            badge.textContent = 'Disabled';
            status.appendChild(badge);
        }
        content.appendChild(status);
    }
    
    // Add content preview when zoomed in
    if (currentZoomLevel === 2 && entry.content) {
        const preview = document.createElement('div');
        preview.className = 'entry-item-content-preview';
        preview.textContent = entry.content;
        content.appendChild(preview);
    }
    
    li.appendChild(content);
            
    li.addEventListener('click', (e) => {
        // Don't switch panels if clicking on checkbox, number input, action buttons, toggle button, or drag handle
        if (!e.target.closest('.entry-checkbox') &&
            !e.target.closest('.entry-number-input') &&
            !e.target.closest('.entry-item-actions') &&
            !e.target.closest('.entry-actions-toggle') &&
            !e.target.closest('.entry-drag-handle')) {
            
            // In compact mode (zoomed-out), first tap expands actions, second tap opens entry
            if (currentZoomLevel === 0 && !li.classList.contains('actions-expanded')) {
                li.classList.add('actions-expanded');
                return;
            }
            
            openEntryInTab(entry.uid);
            // Switch to editor panel on mobile
            switchToMobilePanel('editor');
        }
    });
    
    return li;
}
// Zoom Function
function changeZoomLevel(delta) {
    const newLevel = Math.max(0, Math.min(2, currentZoomLevel + delta));
    if (newLevel === currentZoomLevel) return;
    
    currentZoomLevel = newLevel;
    updateZoomUI();
    renderEntryList();
    
    // Save preference
    localStorage.setItem('sidebarZoom', currentZoomLevel.toString());
}
function updateZoomUI() {
    const zoomLevelText = document.getElementById('zoomLevel');
    const sidebar = document.querySelector('.mobile-sidebar');
    
    // Update text
    switch (currentZoomLevel) {
        case 0:
            zoomLevelText.textContent = 'Compact';
            sidebar.classList.add('zoomed-out');
            sidebar.classList.remove('zoomed-in');
            break;
        case 1:
            zoomLevelText.textContent = 'Normal';
            sidebar.classList.remove('zoomed-out');
            sidebar.classList.remove('zoomed-in');
            break;
        case 2:
            zoomLevelText.textContent = 'Detailed';
            sidebar.classList.add('zoomed-in');
            sidebar.classList.remove('zoomed-out');
            break;
    }
}
// Toggle View Mode
function toggleView() {
    sideBySideView = !sideBySideView;
    const viewIcon = document.getElementById('viewIcon');
    if (viewIcon) {
        viewIcon.textContent = sideBySideView ? '▦' : '▥';
    }
    renderEditor();
}

// Helper to mark multiple entries as unsaved
function markUnsaved(uids) {
    if (!Array.isArray(uids)) {
        uids = [uids];
    }
    uids.forEach(uid => unsavedChanges.add(uid));
    renderEntryList();
}

// Multi-select functions
function toggleEntrySelection(uid) {
    const index = selectedEntries.indexOf(uid);
    if (index > -1) {
        selectedEntries.splice(index, 1);
    } else {
        selectedEntries.push(uid);
    }
    renderEntryList();
}

function clearEntrySelection() {
    selectedEntries = [];
    renderEntryList();
}

// Drag and drop handlers
function handleDragStart(e) {
    const uid = parseInt(e.currentTarget.dataset.uid);
    
    // If dragging a selected item, drag all selected items
    if (selectedEntries.includes(uid)) {
        draggedEntries = [...selectedEntries].sort((a, b) => a - b);
    } else {
        draggedEntries = [uid];
        // Auto-select the dragged entry if not already selected
        if (!selectedEntries.includes(uid)) {
            selectedEntries = [uid];
            renderEntryList();
        }
    }
    
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image showing the count of dragged entries
    if (draggedEntries.length > 1) {
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
            position: absolute;
            top: -9999px;
            padding: 0.5rem 0.75rem;
            background: var(--primary-color);
            color: white;
            border-radius: 0.375rem;
            font-weight: bold;
            font-size: 0.9rem;
            white-space: nowrap;
            box-shadow: var(--shadow-lg);
        `;
        dragImage.innerHTML = `<span class="material-symbols-outlined" style="font-size: 1.2rem; vertical-align: middle;">local_shipping</span> Moving ${draggedEntries.length} entries`;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => dragImage.remove(), 0);
    } else {
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    }
    
    // Visual feedback
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const item = e.currentTarget;
    if (item.classList.contains('entry-item') && !draggedEntries.includes(parseInt(item.dataset.uid))) {
        item.style.borderTop = '2px solid var(--primary-color)';
        item.style.paddingTop = 'calc(1rem - 2px)';
        item.classList.add('drop-target');
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const dropTargetUid = parseInt(e.currentTarget.dataset.uid);
    
    if (draggedEntries.length > 0 && !draggedEntries.includes(dropTargetUid)) {
        moveMultipleEntries(draggedEntries, dropTargetUid);
        markUnsaved(draggedEntries);
    }
    
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.classList.remove('dragging');
    
    // Remove all visual feedback
    document.querySelectorAll('.entry-item').forEach(item => {
        item.style.borderTop = '';
        item.style.paddingTop = '';
        item.classList.remove('drop-target');
    });
    
    draggedEntries = [];
}

// Move multiple entries to a new position
function moveMultipleEntries(uidsToMove, targetUid) {
    // Get all entries sorted by UID
    const entriesArray = Object.values(lorebook.entries).sort((a, b) => a.uid - b.uid);
    
    // Separate entries to move from others
    const movingEntries = entriesArray.filter(e => uidsToMove.includes(e.uid));
    const remainingEntries = entriesArray.filter(e => !uidsToMove.includes(e.uid));
    
    // Find the target position in the remaining entries
    const targetIndex = remainingEntries.findIndex(e => e.uid === targetUid);
    
    if (targetIndex === -1) return;
    
    // Insert moving entries at target position
    remainingEntries.splice(targetIndex, 0, ...movingEntries);
    
    // Clear old entries and rebuild with sequential UIDs
    lorebook.entries = {};
    const uidMapping = new Map(); // Track old UID to new UID
    
    remainingEntries.forEach((entry, index) => {
        const oldUid = entry.uid;
        entry.uid = index;
        entry.displayIndex = index; // Keep displayIndex synced with uid
        lorebook.entries[index] = entry;
        uidMapping.set(oldUid, index);
    });
    
    // Update open tabs
    openTabs = openTabs.map(uid => uidMapping.get(uid) ?? uid);
    if (activeTabId !== null && uidMapping.has(activeTabId)) {
        activeTabId = uidMapping.get(activeTabId);
    }
    
    // Update selected entries
    selectedEntries = selectedEntries.map(uid => uidMapping.get(uid) ?? uid);
    
    // Update nextUid
    nextUid = Math.max(...Object.keys(lorebook.entries).map(k => parseInt(k))) + 1;
    
    renderEntryList();
    renderTabs();
    renderEditor();
}

// Reorder Entry by changing UID
function reorderEntry(oldUid, newUid) {
    if (oldUid === newUid) return;
    if (newUid < 0) {
        showNotification('UID cannot be negative', 'error');
        renderEntryList();
        return;
    }
    
    // Get the entry we're moving
    const movingEntry = lorebook.entries[oldUid];
    if (!movingEntry) return;
    
    // Build array of all entries sorted by current UID
    const entriesArray = Object.values(lorebook.entries).sort((a, b) => a.uid - b.uid);
    
    // Remove the moving entry from the array
    const filteredEntries = entriesArray.filter(e => e.uid !== oldUid);
    
    // If target position is beyond the end, just append
    if (newUid >= filteredEntries.length) {
        movingEntry.uid = newUid;
        movingEntry.displayIndex = newUid; // Keep displayIndex synced with uid
        delete lorebook.entries[oldUid];
        lorebook.entries[newUid] = movingEntry;
        
        // Update open tabs
        updateOpenTabsAfterReorder(oldUid, newUid);
        
        renderEntryList();
        renderTabs();
        renderEditor();
        return;
    }
    
    // Insert at new position and rebuild UIDs sequentially
    filteredEntries.splice(newUid, 0, movingEntry);
    
    // Clear old entries object
    lorebook.entries = {};
    
    // Rebuild with new UIDs
    filteredEntries.forEach((entry, index) => {
        const oldEntryUid = entry.uid;
        entry.uid = index;
        entry.displayIndex = index; // Keep displayIndex synced with uid
        lorebook.entries[index] = entry;
        
        // Update open tabs if this entry was open
        if (oldEntryUid !== index) {
            updateOpenTabsAfterReorder(oldEntryUid, index);
        }
    });
    
    // Update nextUid to be one more than the highest UID
    nextUid = Math.max(...Object.keys(lorebook.entries).map(k => parseInt(k))) + 1;
    
    renderEntryList();
    renderTabs();
    renderEditor();
}

// Update open tabs after UID changes
function updateOpenTabsAfterReorder(oldUid, newUid) {
    const tabIndex = openTabs.indexOf(oldUid);
    if (tabIndex > -1) {
        openTabs[tabIndex] = newUid;
    }
    if (activeTabId === oldUid) {
        activeTabId = newUid;
    }
}

// Search Entries
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const entries = document.querySelectorAll('.entry-item');
    
    entries.forEach(entry => {
        const title = entry.querySelector('.entry-item-title').textContent.toLowerCase();
        const keywords = Array.from(entry.querySelectorAll('.keyword-tag'))
            .map(tag => tag.textContent.toLowerCase());
        
        const matches = title.includes(query) || keywords.some(k => k.includes(query));
        entry.style.display = matches ? 'block' : 'none';
    });
}

// Tab Management
function openEntryInTab(uid) {
    if (!openTabs.includes(uid)) {
        openTabs.push(uid);
    }
    activeTabId = uid;
    renderTabs();
    renderEditor();
}

function closeTab(uid) {
    const index = openTabs.indexOf(uid);
    if (index > -1) {
        openTabs.splice(index, 1);
    }
    
    if (activeTabId === uid) {
        activeTabId = openTabs.length > 0 ? openTabs[openTabs.length - 1] : null;
    }
    
    // Clear unsaved state when closing tab
    unsavedChanges.delete(uid);
    delete formState[uid];
    
    renderTabs();
    renderEditor();
}

function renderTabs() {
    const tabBar = document.getElementById('tabBar');
    if (!tabBar) return;
    
    tabBar.innerHTML = '';
    
    openTabs.forEach(uid => {
        let entry, tabName, showUnsavedIndicator = false;
        
        // Handle README tab
        if (uid === 'readme-tab') {
            tabName = '📄 README';
            showUnsavedIndicator = false;
        } else if (uid === 'merge-staging-tab') {
            tabName = '🔀 Merge';
            showUnsavedIndicator = false;
        } else if (uid === 'export-text-tab') {
            tabName = '📄 Export Text';
            showUnsavedIndicator = false;
        } else {
            entry = lorebook.entries[uid];
            if (!entry) return;
            const emoji = getActivationEmoji(entry);
            tabName = emoji + ' ' + (entry.comment || 'Untitled');
            showUnsavedIndicator = unsavedChanges.has(uid);
        }
        
        const tab = document.createElement('button');
        tab.className = 'mobile-tab';
        if (uid === activeTabId) {
            tab.classList.add('active');
        }
        
        const tabText = document.createElement('span');
        const unsavedIndicator = showUnsavedIndicator ? '● ' : '';
        tabText.textContent = unsavedIndicator + tabName;
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'mobile-tab-close';
        closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(uid);
        });
        
        tab.appendChild(tabText);
        tab.appendChild(closeBtn);
        tab.addEventListener('click', () => {
            activeTabId = uid;
            renderTabs();
            renderEditor();
            updateSaveButton();
        });
        
        tabBar.appendChild(tab);
    });
    
    // Update save button state
    updateSaveButton();
}

// Update save button appearance based on save state
function updateSaveButton() {
    const saveBtn = document.getElementById('saveEntryBtn');
    const expandBtn = document.getElementById('expandContentBtn');
    
    if (!saveBtn) return;
    
    // Only show save and expand buttons for regular entry tabs (not README, merge, etc.)
    const isRegularEntry = activeTabId !== null && 
                           activeTabId !== 'readme-tab' && 
                           activeTabId !== 'merge-staging-tab' && 
                           activeTabId !== 'export-text-tab';
    
    if (!isRegularEntry) {
        saveBtn.style.display = 'none';
        if (expandBtn) expandBtn.style.display = 'none';
        return;
    }
    
    saveBtn.style.display = 'flex';
    if (expandBtn) expandBtn.style.display = 'flex';
    
    // Toggle class for unsaved state; CSS handles colors
    if (unsavedChanges.has(activeTabId)) {
        saveBtn.classList.add('unsaved');
    } else {
        saveBtn.classList.remove('unsaved');
    }
}

// Render Editor
function renderEditor() {
    const editorContent = document.getElementById('editorContent');
    
    if (openTabs.length === 0) {
        editorContent.className = 'mobile-editor-content';
        editorContent.innerHTML = `
            <div class="mobile-empty-state">
                <p><span class="material-symbols-outlined">chevron_right</span> Swipe right or select an entry to start editing</p>
                <p>or</p>
                <button id="newEntryBtnAlt2" class="btn btn-success">+ Create New Entry</button>
            </div>
        `;
        const newEntryBtn = document.getElementById('newEntryBtnAlt2');
        if (newEntryBtn) newEntryBtn.addEventListener('click', createNewEntry);
        return;
    }
    
    // Side-by-side view: show all open tabs
    if (sideBySideView && openTabs.length > 1) {
        editorContent.className = 'mobile-editor-content editor-grid';
        editorContent.innerHTML = '';
        
        openTabs.forEach(uid => {
            const panel = document.createElement('div');
            panel.className = 'mobile-editor-panel';
            
            // Handle README tab in side-by-side view
            if (uid === 'readme-tab') {
                panel.innerHTML = `
                    <div class="readme-content">
                        <div class="readme-header">
                            <h3><span class="material-symbols-outlined">description</span> README</h3>
                        </div>
                        <div class="readme-body">
                            ${window.readmeContent || '<p>Loading...</p>'}
                        </div>
                    </div>
                `;
            } else {
                const entry = lorebook.entries[uid];
                if (!entry) return;
                panel.innerHTML = generateEditorHTML(entry, uid);
                // Attach event listeners for this panel
                attachEditorListeners(panel, uid);
            }
            
            editorContent.appendChild(panel);
        });
    } else {
        // Single view: show only active tab
        editorContent.className = 'mobile-editor-content';
        
        // Handle README tab
        if (activeTabId === 'readme-tab') {
            editorContent.innerHTML = `
                <div class="readme-content">
                    <div class="readme-header">
                        <h2><span class="material-symbols-outlined">description</span> README</h2>
                        <p>Welcome to the Simple Lorebook Editor! This guide will help you get started.</p>
                    </div>
                    <div class="readme-body">
                        ${window.readmeContent || '<p>Loading...</p>'}
                    </div>
                </div>
            `;
            return;
        }
        
        // Handle Merge Staging tab
        if (activeTabId === 'merge-staging-tab') {
            if (!mergeStaging) {
                editorContent.innerHTML = '<p>No merge staging data available.</p>';
                return;
            }
            editorContent.innerHTML = generateMergeStagingHTML();
            attachMergeStagingListeners(editorContent);
            return;
        }
        
        // Handle Export Text tab
        if (activeTabId === 'export-text-tab') {
            editorContent.innerHTML = generateExportTextTabHTML();
            attachExportTextTabListeners(editorContent);
            return;
        }
        
        if (activeTabId === null || activeTabId === undefined || !lorebook.entries[activeTabId]) {
            editorContent.innerHTML = `
                <div class="mobile-empty-state">
                    <p><span class="material-symbols-outlined">chevron_right</span> Swipe right or select an entry to start editing</p>
                    <p>or</p>
                    <button id="newEntryBtnAlt2" class="btn btn-success">+ Create New Entry</button>
                </div>
            `;
            const newEntryBtn = document.getElementById('newEntryBtnAlt2');
            if (newEntryBtn) newEntryBtn.addEventListener('click', createNewEntry);
            return;
        }
        
        const entry = lorebook.entries[activeTabId];
        editorContent.innerHTML = generateEditorHTML(entry, activeTabId);
        attachEditorListeners(editorContent, activeTabId);
    }
}

// Generate HTML for an entry editor
function generateEditorHTML(entry, uid) {
    // Ensure new fields exist with defaults for backward compatibility
    if (!entry.characterFilter) {
        entry.characterFilter = { isExclude: false, names: [], tags: [] };
    }
    if (!entry.triggers) {
        entry.triggers = [];
    }
    if (entry.matchPersonaDescription === undefined) entry.matchPersonaDescription = false;
    if (entry.matchCharacterDescription === undefined) entry.matchCharacterDescription = false;
    if (entry.matchCharacterPersonality === undefined) entry.matchCharacterPersonality = false;
    if (entry.matchCharacterDepthPrompt === undefined) entry.matchCharacterDepthPrompt = false;
    if (entry.matchScenario === undefined) entry.matchScenario = false;
    if (entry.matchCreatorNotes === undefined) entry.matchCreatorNotes = false;
    
    // Use formState if it exists (unsaved changes), otherwise use entry data
    const state = formState[uid];
    const comment = state?.comment !== undefined ? state.comment : (entry.comment || '');
    const content = state?.content !== undefined ? state.content : (entry.content || '');
    const keywords = state?.keywords !== undefined ? state.keywords : entry.key.join(', ');
    const keywordsSecondary = state?.keywordsSecondary !== undefined ? state.keywordsSecondary : entry.keysecondary.join(', ');
    const selectiveLogic = state?.selectiveLogic !== undefined ? parseInt(state.selectiveLogic) : entry.selectiveLogic;
    const disable = state?.disable !== undefined ? state.disable : entry.disable;
    const constant = state?.constant !== undefined ? state.constant : entry.constant;
    const vectorized = state?.vectorized !== undefined ? state.vectorized : entry.vectorized;
    const order = state?.order !== undefined ? state.order : entry.order;
    const position = state?.position !== undefined ? parseInt(state.position) : entry.position;
    const depth = state?.depth !== undefined ? state.depth : entry.depth;
    const scanDepth = state?.scanDepth !== undefined ? state.scanDepth : (entry.scanDepth !== null ? entry.scanDepth : '');
    const probability = state?.probability !== undefined ? state.probability : entry.probability;
    const useProbability = state?.useProbability !== undefined ? state.useProbability : entry.useProbability;
    const sticky = state?.sticky !== undefined ? state.sticky : entry.sticky;
    const cooldown = state?.cooldown !== undefined ? state.cooldown : entry.cooldown;
    const delay = state?.delay !== undefined ? state.delay : entry.delay;
    const group = state?.group !== undefined ? state.group : entry.group;
    const groupWeight = state?.groupWeight !== undefined ? state.groupWeight : entry.groupWeight;
    const automationId = state?.automationId !== undefined ? state.automationId : entry.automationId;
    const outletName = state?.outletName !== undefined ? state.outletName : entry.outletName;
    const role = state?.role !== undefined ? state.role : entry.role;
    const excludeRecursion = state?.excludeRecursion !== undefined ? state.excludeRecursion : entry.excludeRecursion;
    const preventRecursion = state?.preventRecursion !== undefined ? state.preventRecursion : entry.preventRecursion;
    const delayUntilRecursion = state?.delayUntilRecursion !== undefined ? state.delayUntilRecursion : entry.delayUntilRecursion;
    const ignoreBudget = state?.ignoreBudget !== undefined ? state.ignoreBudget : entry.ignoreBudget;
    const charFilterIsExclude = state?.charFilterIsExclude !== undefined ? state.charFilterIsExclude : entry.characterFilter.isExclude;
    const charFilterNames = state?.charFilterNames !== undefined ? state.charFilterNames : entry.characterFilter.names.join(', ');
    const charFilterTags = state?.charFilterTags !== undefined ? state.charFilterTags : entry.characterFilter.tags.join(', ');
    const triggers = state?.triggers !== undefined ? state.triggers : entry.triggers;
    const matchPersonaDescription = state?.matchPersonaDescription !== undefined ? state.matchPersonaDescription : entry.matchPersonaDescription;
    const matchCharacterDescription = state?.matchCharacterDescription !== undefined ? state.matchCharacterDescription : entry.matchCharacterDescription;
    const matchCharacterPersonality = state?.matchCharacterPersonality !== undefined ? state.matchCharacterPersonality : entry.matchCharacterPersonality;
    const matchCharacterDepthPrompt = state?.matchCharacterDepthPrompt !== undefined ? state.matchCharacterDepthPrompt : entry.matchCharacterDepthPrompt;
    const matchScenario = state?.matchScenario !== undefined ? state.matchScenario : entry.matchScenario;
    const matchCreatorNotes = state?.matchCreatorNotes !== undefined ? state.matchCreatorNotes : entry.matchCreatorNotes;
    
    // Determine activation state
    let activationState = 'keyword'; // default
    if (disable) {
        activationState = 'inactive';
    } else if (constant) {
        activationState = 'constant';
    } else if (vectorized) {
        activationState = 'vector';
    }
    
    return `
        <div class="entry-editor" data-uid="${uid}">
            <!-- Basic Fields -->
            <div class="form-group" id="basicFields-${uid}">
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div>
                        <label class="form-label" for="entryActivation-${uid}">Activation</label>
                        <select id="entryActivation-${uid}" class="form-input entry-activation" style="width: 100%;">
                            <option value="constant" ${activationState === 'constant' ? 'selected' : ''}>🔵 Constant</option>
                            <option value="keyword" ${activationState === 'keyword' ? 'selected' : ''}>🟢 Keyword-Activated</option>
                            <option value="vector" ${activationState === 'vector' ? 'selected' : ''}>🔗 Vector-Activated</option>
                            <option value="inactive" ${activationState === 'inactive' ? 'selected' : ''}>⚫ Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label" for="entryName-${uid}">Name / Title</label>
                        <input type="text" id="entryName-${uid}" class="form-input entry-name" value="${escapeHtml(comment)}" placeholder="Enter entry name...">
                    </div>
                </div>
            </div>
            
            <div class="form-group" id="keywordsSection-${uid}">
                <label class="form-label" for="entryKeywords-${uid}">Keywords</label>
                <div class="keywords-row">
                    <div class="keyword-field">
                        <label class="form-label-small">Primary</label>
                        <input type="text" id="entryKeywords-${uid}" class="form-input entry-keywords" value="${escapeHtml(keywords)}" placeholder="sword, magic, fire">
                    </div>
                    <div class="keyword-logic">
                        <label class="form-label-small">Logic</label>
                        <select id="entrySelectiveLogic-${uid}" class="form-input entry-selective-logic">
                            <option value="0" ${selectiveLogic === 0 ? 'selected' : ''}>AND ANY</option>
                            <option value="1" ${selectiveLogic === 1 ? 'selected' : ''}>NOT ANY</option>
                            <option value="2" ${selectiveLogic === 2 ? 'selected' : ''}>NOT ALL</option>
                            <option value="3" ${selectiveLogic === 3 ? 'selected' : ''}>AND ALL</option>
                        </select>
                    </div>
                    <div class="keyword-field">
                        <label class="form-label-small">Secondary</label>
                        <input type="text" id="entryKeywordsSecondary-${uid}" class="form-input entry-keywords-secondary" value="${escapeHtml(keywordsSecondary)}" placeholder="holy, blessed">
                    </div>
                </div>
                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">Comma-separated keywords. Secondary keywords are optional filters.</small>
            </div>
            
            <div class="form-group" id="contentSection-${uid}">
                <label class="form-label" for="entryContent-${uid}">Content</label>
                <textarea id="entryContent-${uid}" class="form-textarea entry-content" placeholder="Enter entry content...">${escapeHtml(content)}</textarea>
            </div>
            
            <!-- Advanced Settings -->
            <div class="advanced-settings" id="advancedSection-${uid}">
                <div class="advanced-settings-header" data-uid="${uid}">
                    <span class="advanced-settings-title"><span class="material-symbols-outlined">settings</span> Advanced Settings</span>
                    <span class="advanced-settings-toggle" id="advancedToggle-${uid}">▼</span>
                </div>
                <div class="advanced-settings-content" id="advancedContent-${uid}">
                    <div class="advanced-grid">
                        <!-- Order & Position -->
                        <div class="form-group">
                            <label class="form-label-small" for="entryOrder-${uid}">Order</label>
                            <input type="number" id="entryOrder-${uid}" class="form-input-number entry-order" value="${order}" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryPosition-${uid}">Insertion Position</label>
                            <select id="entryPosition-${uid}" class="form-input entry-position">
                                <option value="0" ${position === 0 ? 'selected' : ''}>↑Char (Before Char)</option>
                                <option value="1" ${position === 1 ? 'selected' : ''}>↓Char (After Char)</option>
                                <option value="2" ${position === 2 ? 'selected' : ''}>↑AN (Before AN)</option>
                                <option value="3" ${position === 3 ? 'selected' : ''}>↓AN (After AN)</option>
                                <option value="4" ${position === 4 ? 'selected' : ''}>@D (At Depth)</option>
                                <option value="5" ${position === 5 ? 'selected' : ''}>↑EM (Before Examples)</option>
                                <option value="6" ${position === 6 ? 'selected' : ''}>↓EM (After Examples)</option>
                                <option value="7" ${position === 7 ? 'selected' : ''}>Outlet</option>
                            </select>
                        </div>
                        
                        ${position === 4 ? `
                        <div class="form-group">
                            <label class="form-label-small" for="entryDepth-${uid}">Insertion Depth (0 = bottom of prompt)</label>
                            <input type="number" id="entryDepth-${uid}" class="form-input-number entry-depth" value="${depth}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label-small" for="entryRole-${uid}">Role</label>
                            <select id="entryRole-${uid}" class="form-input entry-role">
                                <option value="null" ${role === null || role === 'null' ? 'selected' : ''}>None</option>
                                    <option value="0" ${role === 0 || role === '0' ? 'selected' : ''}><span class="material-symbols-outlined">settings</span> System</option>
                                    <option value="1" ${role === 1 || role === '1' ? 'selected' : ''}><span class="material-symbols-outlined">person</span> User</option>
                                    <option value="2" ${role === 2 || role === '2' ? 'selected' : ''}><span class="material-symbols-outlined">smart_toy</span> Assistant</option>
                            </select>
                        </div>
                        ` : `
                        <div class="form-group">
                            <label class="form-label-small" for="entryDepth-${uid}">Depth</label>
                            <input type="number" id="entryDepth-${uid}" class="form-input-number entry-depth" value="${depth}" min="0">
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">Used for position-specific behavior</small>
                        </div>
                        `}
                        
                        <!-- Scan Depth (optional override) -->
                        <div class="form-group">
                            <label class="form-label-small" for="entryScanDepth-${uid}">Scan Depth Override (leave empty for global)</label>
                            <input type="number" id="entryScanDepth-${uid}" class="form-input-number entry-scan-depth" value="${scanDepth}" min="0" placeholder="Use global">
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">How many messages back to scan for keywords</small>
                        </div>
                        
                        <!-- Per-Entry Overrides -->
                        <div class="form-group">
                            <label class="form-label-small" for="entryCaseSensitive-${uid}">Case Sensitive</label>
                            <select id="entryCaseSensitive-${uid}" class="form-input entry-case-sensitive">
                                <option value="null" ${(state?.caseSensitive ?? entry.caseSensitive) === null ? 'selected' : ''}>Use Global</option>
                                <option value="true" ${(state?.caseSensitive ?? entry.caseSensitive) === true ? 'selected' : ''}>Yes (Override)</option>
                                <option value="false" ${(state?.caseSensitive ?? entry.caseSensitive) === false ? 'selected' : ''}>No (Override)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryMatchWholeWords-${uid}">Match Whole Words</label>
                            <select id="entryMatchWholeWords-${uid}" class="form-input entry-match-whole-words">
                                <option value="null" ${(state?.matchWholeWords ?? entry.matchWholeWords) === null ? 'selected' : ''}>Use Global</option>
                                <option value="true" ${(state?.matchWholeWords ?? entry.matchWholeWords) === true ? 'selected' : ''}>Yes (Override)</option>
                                <option value="false" ${(state?.matchWholeWords ?? entry.matchWholeWords) === false ? 'selected' : ''}>No (Override)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryUseGroupScoring-${uid}">Use Group Scoring</label>
                            <select id="entryUseGroupScoring-${uid}" class="form-input entry-use-group-scoring">
                                <option value="null" ${(state?.useGroupScoring ?? entry.useGroupScoring) === null ? 'selected' : ''}>Use Global</option>
                                <option value="true" ${(state?.useGroupScoring ?? entry.useGroupScoring) === true ? 'selected' : ''}>Yes (Override)</option>
                                <option value="false" ${(state?.useGroupScoring ?? entry.useGroupScoring) === false ? 'selected' : ''}>No (Override)</option>
                            </select>
                        </div>
                        
                        ${position === 7 ? `
                        <div class="form-group">
                            <label class="form-label-small" for="entryOutletName-${uid}">Outlet Name</label>
                            <input type="text" id="entryOutletName-${uid}" class="form-input entry-outlet-name" value="${escapeHtml(outletName || '')}" placeholder="Outlet name...">
                        </div>
                        ` : ''}
                        
                        <!-- Probability -->
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="entryUseProbability-${uid}" class="entry-use-probability" ${useProbability ? 'checked' : ''}>
                                <label class="form-label-small" for="entryUseProbability-${uid}">Use Probability</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryProbability-${uid}">Probability %</label>
                            <input type="number" id="entryProbability-${uid}" class="form-input-number entry-probability" value="${probability}" min="0" max="100">
                        </div>
                        
                        <!-- Recursion Settings -->
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="entryExcludeRecursion-${uid}" class="entry-exclude-recursion" ${excludeRecursion ? 'checked' : ''}>
                                <label class="form-label-small" for="entryExcludeRecursion-${uid}">Exclude Recursion</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="entryPreventRecursion-${uid}" class="entry-prevent-recursion" ${preventRecursion ? 'checked' : ''}>
                                <label class="form-label-small" for="entryPreventRecursion-${uid}">Prevent Recursion</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="entryDelayUntilRecursion-${uid}" class="entry-delay-recursion" ${delayUntilRecursion ? 'checked' : ''}>
                                <label class="form-label-small" for="entryDelayUntilRecursion-${uid}">Delay Until Recursion</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="entryIgnoreBudget-${uid}" class="entry-ignore-budget" ${ignoreBudget ? 'checked' : ''}>
                                <label class="form-label-small" for="entryIgnoreBudget-${uid}">Ignore Budget</label>
                            </div>
                        </div>
                        
                        <!-- Sticky & Cooldown -->
                        <div class="form-group">
                            <label class="form-label-small" for="entrySticky-${uid}">Sticky</label>
                            <input type="number" id="entrySticky-${uid}" class="form-input-number entry-sticky" value="${sticky}" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryCooldown-${uid}">Cooldown</label>
                            <input type="number" id="entryCooldown-${uid}" class="form-input-number entry-cooldown" value="${cooldown}" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryDelay-${uid}">Delay</label>
                            <input type="number" id="entryDelay-${uid}" class="form-input-number entry-delay" value="${delay}" min="0">
                        </div>
                        
                        <!-- Group Settings -->
                        <div class="form-group">
                            <label class="form-label-small" for="entryGroup-${uid}">Group</label>
                            <input type="text" id="entryGroup-${uid}" class="form-input entry-group" value="${escapeHtml(group || '')}" placeholder="Group name...">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label-small" for="entryGroupWeight-${uid}">Group Weight</label>
                            <input type="number" id="entryGroupWeight-${uid}" class="form-input-number entry-group-weight" value="${groupWeight}" min="0">
                        </div>
                        
                        <!-- Automation ID -->
                        <div class="form-group">
                            <label class="form-label-small" for="entryAutomationId-${uid}">Automation ID</label>
                            <input type="text" id="entryAutomationId-${uid}" class="form-input entry-automation-id" value="${escapeHtml(automationId || '')}" placeholder="Automation ID...">
                        </div>
                        
                        <!-- Character Filter -->
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label class="form-label-small">Character Filter</label>
                            <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="radio" name="charFilterMode-${uid}" value="include" ${!charFilterIsExclude ? 'checked' : ''}>
                                    <span>Include (only these characters)</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="radio" name="charFilterMode-${uid}" value="exclude" ${charFilterIsExclude ? 'checked' : ''}>
                                    <span>Exclude (all except these)</span>
                                </label>
                            </div>
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <div style="flex: 1;">
                                    <label class="form-label-small">Character Names</label>
                                    <input type="text" id="entryCharFilterNames-${uid}" class="form-input" value="${escapeHtml(charFilterNames)}" placeholder="Alice, Bob, Charlie">
                                </div>
                                <div style="flex: 1;">
                                    <label class="form-label-small">Character Tags</label>
                                    <input type="text" id="entryCharFilterTags-${uid}" class="form-input" value="${escapeHtml(charFilterTags)}" placeholder="tag1, tag2, tag3">
                                </div>
                            </div>
                            <small style="color: var(--text-secondary); display: block;">Comma-separated names/tags. Empty = no filter (works for all characters)</small>
                        </div>
                        
                        <!-- Generation Triggers -->
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label class="form-label-small">Generation Triggers</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Normal" ${triggers.includes('Normal') ? 'checked' : ''}>
                                    <span class="form-label-small">Normal</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Continue" ${triggers.includes('Continue') ? 'checked' : ''}>
                                    <span class="form-label-small">Continue</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Impersonate" ${triggers.includes('Impersonate') ? 'checked' : ''}>
                                    <span class="form-label-small">Impersonate</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Swipe" ${triggers.includes('Swipe') ? 'checked' : ''}>
                                    <span class="form-label-small">Swipe</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Regenerate" ${triggers.includes('Regenerate') ? 'checked' : ''}>
                                    <span class="form-label-small">Regenerate</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" class="trigger-checkbox" data-trigger="Quiet" ${triggers.includes('Quiet') ? 'checked' : ''}>
                                    <span class="form-label-small">Quiet</span>
                                </label>
                            </div>
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">Empty = all generation types. Select specific types to limit when this entry activates.</small>
                        </div>
                        
                        <!-- Additional Matching Sources -->
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label class="form-label-small">Additional Matching Sources</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchPersona-${uid}" ${matchPersonaDescription ? 'checked' : ''}>
                                    <span class="form-label-small">Persona Description</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchCharDesc-${uid}" ${matchCharacterDescription ? 'checked' : ''}>
                                    <span class="form-label-small">Character Description</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchCharPers-${uid}" ${matchCharacterPersonality ? 'checked' : ''}>
                                    <span class="form-label-small">Character Personality</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchCharDepth-${uid}" ${matchCharacterDepthPrompt ? 'checked' : ''}>
                                    <span class="form-label-small">Character Depth Prompt</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchScenario-${uid}" ${matchScenario ? 'checked' : ''}>
                                    <span class="form-label-small">Scenario</span>
                                </label>
                                <label class="checkbox-group">
                                    <input type="checkbox" id="entryMatchCreatorNotes-${uid}" ${matchCreatorNotes ? 'checked' : ''}>
                                    <span class="form-label-small">Creator's Notes</span>
                                </label>
                            </div>
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">Match keywords against character/persona data instead of just chat messages</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="editor-actions">
                <button class="btn btn-primary save-btn" data-uid="${uid}">Save Changes</button>
                <button class="btn btn-danger delete-btn" data-uid="${uid}">Delete Entry</button>
            </div>
        </div>
    `;
}

// Attach event listeners to editor elements
function attachEditorListeners(container, uid) {
    // Save and Delete buttons
    const saveBtn = container.querySelector(`.save-btn[data-uid="${uid}"]`);
    const deleteBtn = container.querySelector(`.delete-btn[data-uid="${uid}"]`);
    
    if (saveBtn) saveBtn.addEventListener('click', () => saveEntryByUid(uid));
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteEntryByUid(uid));
    
    // Position change listener - re-render to show/hide conditional fields
    const positionSelect = container.querySelector(`#entryPosition-${uid}`);
    if (positionSelect) {
        positionSelect.addEventListener('change', () => {
            // Save current values first
            saveEntryByUid(uid);
            // Re-render to show/hide role and outlet fields
            renderEditor();
        });
    }
    
    // Advanced settings toggle
    const advancedHeader = container.querySelector(`.advanced-settings-header[data-uid="${uid}"]`);
    if (advancedHeader) {
        advancedHeader.addEventListener('click', () => toggleAdvancedSettingsByUid(uid));
    }
    
    // Expand content toggle is handled globally in the header
    
    // Track changes on all form inputs to mark as unsaved
    const markAsUnsaved = () => {
        unsavedChanges.add(uid);
        captureFormState(uid);
        renderTabs();
    };
    
    // Add change listeners to all inputs
    container.querySelectorAll('input, textarea, select').forEach(element => {
        element.addEventListener('input', markAsUnsaved);
        element.addEventListener('change', markAsUnsaved);
    });
}

// Capture current form state for an entry
function captureFormState(uid) {
    const state = {};
    
    // Basic fields
    const nameEl = document.getElementById(`entryName-${uid}`);
    if (nameEl) state.comment = nameEl.value;
    
    const contentEl = document.getElementById(`entryContent-${uid}`);
    if (contentEl) state.content = contentEl.value;
    
    const keywordsEl = document.getElementById(`entryKeywords-${uid}`);
    if (keywordsEl) state.keywords = keywordsEl.value;
    
    const keywordsSecondaryEl = document.getElementById(`entryKeywordsSecondary-${uid}`);
    if (keywordsSecondaryEl) state.keywordsSecondary = keywordsSecondaryEl.value;
    
    const selectiveLogicEl = document.getElementById(`entrySelectiveLogic-${uid}`);
    if (selectiveLogicEl) state.selectiveLogic = selectiveLogicEl.value;
    
    // Activation state
    const activationEl = document.getElementById(`entryActivation-${uid}`);
    if (activationEl) {
        const activationValue = activationEl.value;
        state.disable = (activationValue === 'inactive');
        state.constant = (activationValue === 'constant');
        state.vectorized = (activationValue === 'vector');
    }
    
    const orderEl = document.getElementById(`entryOrder-${uid}`);
    if (orderEl) state.order = orderEl.value;
    
    const positionEl = document.getElementById(`entryPosition-${uid}`);
    if (positionEl) state.position = positionEl.value;
    
    const depthEl = document.getElementById(`entryDepth-${uid}`);
    if (depthEl) state.depth = depthEl.value;
    
    const scanDepthEl = document.getElementById(`entryScanDepth-${uid}`);
    if (scanDepthEl) state.scanDepth = scanDepthEl.value;
    
    const caseSensitiveEl = document.getElementById(`entryCaseSensitive-${uid}`);
    if (caseSensitiveEl) state.caseSensitive = caseSensitiveEl.value;
    
    const matchWholeWordsEl = document.getElementById(`entryMatchWholeWords-${uid}`);
    if (matchWholeWordsEl) state.matchWholeWords = matchWholeWordsEl.value;
    
    const useGroupScoringEl = document.getElementById(`entryUseGroupScoring-${uid}`);
    if (useGroupScoringEl) state.useGroupScoring = useGroupScoringEl.value;
    
    // Store the state
    formState[uid] = state;
    
    return state;
}

// Save Entry by UID
function saveEntryByUid(uid) {
    const entry = lorebook.entries[uid];
    if (!entry) {
        console.error(`Entry ${uid} not found`);
        return;
    }
    
    // Save all form values to the entry
    const nameEl = document.getElementById(`entryName-${uid}`);
    if (nameEl) entry.comment = nameEl.value;
    
    const contentEl = document.getElementById(`entryContent-${uid}`);
    if (contentEl) entry.content = contentEl.value;
    
    const keywordsEl = document.getElementById(`entryKeywords-${uid}`);
    if (keywordsEl) {
        const keywordsRaw = keywordsEl.value;
        entry.key = keywordsRaw
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }
    
    const keywordsSecondaryEl = document.getElementById(`entryKeywordsSecondary-${uid}`);
    if (keywordsSecondaryEl) {
        const keywordsSecondaryRaw = keywordsSecondaryEl.value;
        entry.keysecondary = keywordsSecondaryRaw
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }
    
    const selectiveLogicEl = document.getElementById(`entrySelectiveLogic-${uid}`);
    if (selectiveLogicEl) {
        entry.selectiveLogic = parseInt(selectiveLogicEl.value);
    }
    
    // Handle activation state from dropdown
    const activationEl = document.getElementById(`entryActivation-${uid}`);
    if (activationEl) {
        const activationValue = activationEl.value;
        entry.disable = (activationValue === 'inactive');
        entry.constant = (activationValue === 'constant');
        entry.vectorized = (activationValue === 'vector');
    }
    
    const orderEl = document.getElementById(`entryOrder-${uid}`);
    if (orderEl) entry.order = parseInt(orderEl.value);
    
    const positionEl = document.getElementById(`entryPosition-${uid}`);
    if (positionEl) entry.position = parseInt(positionEl.value);
    
    const depthEl = document.getElementById(`entryDepth-${uid}`);
    if (depthEl) entry.depth = parseInt(depthEl.value);
    
    const scanDepthEl = document.getElementById(`entryScanDepth-${uid}`);
    if (scanDepthEl) {
        const value = scanDepthEl.value;
        entry.scanDepth = value === '' ? null : parseInt(value);
    }
    
    const caseSensitiveEl = document.getElementById(`entryCaseSensitive-${uid}`);
    if (caseSensitiveEl) {
        const value = caseSensitiveEl.value;
        entry.caseSensitive = value === 'null' ? null : (value === 'true');
    }
    
    const matchWholeWordsEl = document.getElementById(`entryMatchWholeWords-${uid}`);
    if (matchWholeWordsEl) {
        const value = matchWholeWordsEl.value;
        entry.matchWholeWords = value === 'null' ? null : (value === 'true');
    }
    
    const useGroupScoringEl = document.getElementById(`entryUseGroupScoring-${uid}`);
    if (useGroupScoringEl) {
        const value = useGroupScoringEl.value;
        entry.useGroupScoring = value === 'null' ? null : (value === 'true');
    }
    
    const useProbabilityEl = document.getElementById(`entryUseProbability-${uid}`);
    if (useProbabilityEl) entry.useProbability = useProbabilityEl.checked;
    
    const probabilityEl = document.getElementById(`entryProbability-${uid}`);
    if (probabilityEl) entry.probability = parseInt(probabilityEl.value);
    
    const excludeRecursionEl = document.getElementById(`entryExcludeRecursion-${uid}`);
    if (excludeRecursionEl) entry.excludeRecursion = excludeRecursionEl.checked;
    
    const preventRecursionEl = document.getElementById(`entryPreventRecursion-${uid}`);
    if (preventRecursionEl) entry.preventRecursion = preventRecursionEl.checked;
    
    const delayUntilRecursionEl = document.getElementById(`entryDelayUntilRecursion-${uid}`);
    if (delayUntilRecursionEl) entry.delayUntilRecursion = delayUntilRecursionEl.checked;
    
    const ignoreBudgetEl = document.getElementById(`entryIgnoreBudget-${uid}`);
    if (ignoreBudgetEl) entry.ignoreBudget = ignoreBudgetEl.checked;
    
    const stickyEl = document.getElementById(`entrySticky-${uid}`);
    if (stickyEl) entry.sticky = parseInt(stickyEl.value);
    
    const cooldownEl = document.getElementById(`entryCooldown-${uid}`);
    if (cooldownEl) entry.cooldown = parseInt(cooldownEl.value);
    
    const delayEl = document.getElementById(`entryDelay-${uid}`);
    if (delayEl) entry.delay = parseInt(delayEl.value);
    
    const groupEl = document.getElementById(`entryGroup-${uid}`);
    if (groupEl) entry.group = groupEl.value;
    
    const groupWeightEl = document.getElementById(`entryGroupWeight-${uid}`);
    if (groupWeightEl) entry.groupWeight = parseInt(groupWeightEl.value);
    
    const automationIdEl = document.getElementById(`entryAutomationId-${uid}`);
    if (automationIdEl) entry.automationId = automationIdEl.value;
    
    // Handle Character Filter
    const charFilterModeIncludeEl = document.querySelector(`input[name="charFilterMode-${uid}"][value="include"]`);
    if (charFilterModeIncludeEl) {
        entry.characterFilter.isExclude = !charFilterModeIncludeEl.checked;
    }
    
    const charFilterNamesEl = document.getElementById(`entryCharFilterNames-${uid}`);
    if (charFilterNamesEl) {
        const charFilterNamesRaw = charFilterNamesEl.value;
        entry.characterFilter.names = charFilterNamesRaw
            .split(',')
            .map(n => n.trim())
            .filter(n => n.length > 0);
    }
    
    const charFilterTagsEl = document.getElementById(`entryCharFilterTags-${uid}`);
    if (charFilterTagsEl) {
        const charFilterTagsRaw = charFilterTagsEl.value;
        entry.characterFilter.tags = charFilterTagsRaw
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }
    
    // Handle Generation Triggers
    const triggerCheckboxes = document.querySelectorAll(`#advancedContent-${uid} .trigger-checkbox`);
    if (triggerCheckboxes.length > 0) {
        entry.triggers = Array.from(triggerCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.trigger);
    }
    
    // Handle Additional Matching Sources
    const matchPersonaEl = document.getElementById(`entryMatchPersona-${uid}`);
    if (matchPersonaEl) entry.matchPersonaDescription = matchPersonaEl.checked;
    
    const matchCharDescEl = document.getElementById(`entryMatchCharDesc-${uid}`);
    if (matchCharDescEl) entry.matchCharacterDescription = matchCharDescEl.checked;
    
    const matchCharPersEl = document.getElementById(`entryMatchCharPers-${uid}`);
    if (matchCharPersEl) entry.matchCharacterPersonality = matchCharPersEl.checked;
    
    const matchCharDepthEl = document.getElementById(`entryMatchCharDepth-${uid}`);
    if (matchCharDepthEl) entry.matchCharacterDepthPrompt = matchCharDepthEl.checked;
    
    const matchScenarioEl = document.getElementById(`entryMatchScenario-${uid}`);
    if (matchScenarioEl) entry.matchScenario = matchScenarioEl.checked;
    
    const matchCreatorNotesEl = document.getElementById(`entryMatchCreatorNotes-${uid}`);
    if (matchCreatorNotesEl) entry.matchCreatorNotes = matchCreatorNotesEl.checked;
    
    // Handle role (only exists when position is @D/4)
    const roleElement = document.getElementById(`entryRole-${uid}`);
    if (roleElement) {
        const roleValue = roleElement.value;
        entry.role = roleValue === 'null' ? null : parseInt(roleValue);
    } else {
        // Reset role to null if position changed away from @D
        if (entry.position !== 4) {
            entry.role = null;
        }
    }
    
    // Handle outlet name (only exists when position is Outlet/7)
    const outletElement = document.getElementById(`entryOutletName-${uid}`);
    if (outletElement) {
        entry.outletName = outletElement.value;
    } else {
        // Reset outlet name if position changed away from Outlet
        if (entry.position !== 7) {
            entry.outletName = "";
        }
    }
    
    // Clear unsaved changes flag and form state
    unsavedChanges.delete(uid);
    delete formState[uid];
    
    renderEntryList();
    renderTabs();
    updateSaveButton();
    saveToLocalStorage();
}

// Delete Entry by UID
function deleteEntryByUid(uid) {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return;
    delete lorebook.entries[uid];
    closeTab(uid);
    renderEntryList();
    saveToLocalStorage();
}

// Keyword Management by UID
function addKeywordByUid(uid, keyword) {
    const entry = lorebook.entries[uid];
    if (!entry.key.includes(keyword)) {
        entry.key.push(keyword);
        renderEditor();
    }
}

function removeKeywordByUid(uid, keyword) {
    const entry = lorebook.entries[uid];
    entry.key = entry.key.filter(k => k !== keyword);
    renderEditor();
}

function addKeywordSecondaryByUid(uid, keyword) {
    const entry = lorebook.entries[uid];
    if (!entry.keysecondary.includes(keyword)) {
        entry.keysecondary.push(keyword);
        renderEditor();
    }
}

function removeKeywordSecondaryByUid(uid, keyword) {
    const entry = lorebook.entries[uid];
    entry.keysecondary = entry.keysecondary.filter(k => k !== keyword);
    renderEditor();
}

// Toggle Advanced Settings by UID
function toggleAdvancedSettingsByUid(uid) {
    const content = document.getElementById(`advancedContent-${uid}`);
    const toggle = document.getElementById(`advancedToggle-${uid}`);
    
    if (content && toggle) {
        content.classList.toggle('open');
        toggle.classList.toggle('open');
    }
}

// Toggle Expand Content View
function toggleExpandContent() {
    if (activeTabId === null || activeTabId === 'readme-tab' || activeTabId === 'merge-staging-tab' || activeTabId === 'export-text-tab') return;
    
    const uid = activeTabId;
    const editor = document.querySelector(`.entry-editor[data-uid="${uid}"]`);
    const expandBtn = document.getElementById('expandContentBtn');
    const basicFields = document.getElementById(`basicFields-${uid}`);
    const keywordsSection = document.getElementById(`keywordsSection-${uid}`);
    const contentSection = document.getElementById(`contentSection-${uid}`);
    const advancedSection = document.getElementById(`advancedSection-${uid}`);
    const editorActions = editor?.querySelector('.editor-actions');
    
    if (!editor || !expandBtn) return;
    
    const isExpanded = editor.classList.contains('content-expanded');
    
    if (isExpanded) {
        // Collapse - show all sections
        editor.classList.remove('content-expanded');
        if (contentSection) contentSection.classList.remove('expanded-content-field');
        if (basicFields) basicFields.style.display = '';
        if (keywordsSection) keywordsSection.style.display = '';
        if (advancedSection) advancedSection.style.display = '';
        if (editorActions) editorActions.style.display = '';
        expandBtn.innerHTML = '<span class="material-symbols-outlined">open_in_full</span>';
        expandBtn.title = 'Expand Content Field';
    } else {
        // Expand - hide other sections and maximize content
        editor.classList.add('content-expanded');
        if (contentSection) contentSection.classList.add('expanded-content-field');
        if (basicFields) basicFields.style.display = 'none';
        if (keywordsSection) keywordsSection.style.display = 'none';
        if (advancedSection) advancedSection.style.display = 'none';
        if (editorActions) editorActions.style.display = 'none';
        expandBtn.innerHTML = '<span class="material-symbols-outlined">close_fullscreen</span>';
        expandBtn.title = 'Show All Fields';
    }
}

// Legacy functions for backward compatibility
function saveEntry() {
    if (activeTabId !== null) saveEntryByUid(activeTabId);
}

function deleteEntry() {
    if (activeTabId !== null) deleteEntryByUid(activeTabId);
}

function addKeyword(keyword) {
    if (activeTabId !== null) addKeywordByUid(activeTabId, keyword);
}

function removeKeyword(keyword) {
    if (activeTabId !== null) removeKeywordByUid(activeTabId, keyword);
}

function addKeywordSecondary(keyword) {
    if (activeTabId !== null) addKeywordSecondaryByUid(activeTabId, keyword);
}

function removeKeywordSecondary(keyword) {
    if (activeTabId !== null) removeKeywordSecondaryByUid(activeTabId, keyword);
}

function toggleAdvancedSettings() {
    if (activeTabId !== null) toggleAdvancedSettingsByUid(activeTabId);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

// Help Modal Functions
function showHelp() {
    const helpContent = document.getElementById('helpContent');
    helpContent.innerHTML = `
        <h2>✨ Clean Interface</h2>
        <ul>
            <li>Simple, uncluttered design with good spacing</li>
            <li>Main fields visible: Name, Primary Keywords, Secondary Keywords with Logic, Content</li>
            <li>Advanced settings collapsed away until you need them</li>
        </ul>

        <h2>📄 Multi-Entry Editing</h2>
        <ul>
            <li>Open multiple entries in tabs</li>
            <li>Easily switch between entries</li>
            <li><strong>Side-by-side view</strong>: Toggle (▥/▦ button) to see all open entries at once!</li>
            <li>Compare and copy between entries</li>
            <li><strong>● Unsaved indicator</strong>: Orange dot shows which tabs have unsaved changes</li>
        </ul>

        <h2><span class="material-symbols-outlined">target</span> Quick Sidebar Actions</h2>
        <ul>
            <li><strong>Hover to reveal action buttons</strong> on each entry</li>
            <li><strong>Insert Above/Below</strong> (↑̶+ / ↓̶+): Add new entry right where you need it, UIDs auto-adjust</li>
            <li><strong>Copy</strong> (<span class="material-symbols-outlined">content_copy</span>): Duplicate an entry instantly</li>
            <li><strong>Delete</strong> (<span class="material-symbols-outlined">delete</span>): Remove entries without opening them</li>
            <li>All actions work directly from the entry list!</li>
        </ul>

        <h2><span class="material-symbols-outlined">merge</span> Import & Merge</h2>
        <ul>
            <li><strong>Import Lorebook</strong>: Replace your current lorebook with a new one</li>
            <li><strong>Import for Merging</strong>: Bring entries from another lorebook into your current one</li>
            <li>Select which entries to merge with checkboxes</li>
            <li>UIDs automatically renumber to avoid conflicts</li>
            <li>Perfect for combining multiple lorebooks or cherry-picking entries</li>
        </ul>

        <h2>📊 Smart Reordering</h2>
        <ul>
            <li>Each entry has a number (its UID)</li>
            <li>Change any entry's number to move it in the list</li>
            <li>Other entries automatically shift to make room</li>
            <li>Keeps everything organized and sequential</li>
        </ul>

        <h2>🎯 Multi-Select & Drag-Drop</h2>
        <ul>
            <li>Select multiple entries with checkboxes</li>
            <li>Drag and drop to reorder</li>
            <li>Drag multiple selected entries at once!</li>
            <li>Visual feedback when dragging</li>
        </ul>

        <h2>📕 Full Lorebook Support</h2>
        <ul>
            <li>Import/export SillyTavern JSON lorebooks</li>
            <li><strong>Main editing area</strong>: Name, Primary Keywords, Secondary Keywords with Logic dropdown, Content</li>
            <li><strong>Advanced settings (collapsed)</strong>: All SillyTavern fields including:
                <ul>
                    <li>Character Filter (include/exclude by names or tags)</li>
                    <li>Generation Triggers (Normal, Continue, Impersonate, Swipe, Regenerate, Quiet)</li>
                    <li>Additional Matching Sources (match against persona, character data, scenario, etc.)</li>
                    <li>All recursion, probability, timing, and positioning options</li>
                </ul>
            </li>
            <li><strong>Insertion Position</strong> dropdown with human-readable options (↑Char, ↓Char, @D, Outlet, etc.)</li>
            <li>Conditional fields that show/hide based on position:
                <ul>
                    <li><strong>@D position</strong>: Insertion Depth + Role selector</li>
                    <li><strong>Outlet position</strong>: Outlet Name text field</li>
                    <li><strong>All positions</strong>: Optional Scan Depth override (leave empty for global)</li>
                </ul>
            </li>
        </ul>

        <h2>💡 Tips</h2>
        <ul>
            <li><strong>Keywords are comma-separated</strong> - just type "sword, magic, fire" in the keyword fields</li>
            <li><strong>Secondary Keywords Logic</strong> determines how primary and secondary keywords work together (AND ANY, NOT ANY, NOT ALL, AND ALL)</li>
            <li><strong>Selective mode is automatic</strong> - it turns on automatically when you add secondary keywords, and off when they're empty</li>
            <li><strong>Hover over entries in the list</strong> to reveal quick action buttons for copying, deleting, and inserting entries</li>
            <li><strong>No more popups!</strong> - The orange dot (●) on tabs tells you when changes are saved</li>
            <li><strong>Merging lorebooks</strong> - Use "Import for Merging" to combine entries from multiple lorebooks without losing your current work</li>
            <li>Advanced settings are collapsed by default - click to expand</li>
            <li><strong>Character Filter</strong> - Control which characters this entry activates for (Include or Exclude mode)</li>
            <li><strong>Generation Triggers</strong> - Limit entry to specific generation types (Normal, Continue, Impersonate, Swipe, Regenerate, Quiet). Empty = all types</li>
            <li><strong>Additional Matching Sources</strong> - Match keywords against character/persona data instead of just chat messages:
                <ul>
                    <li>Persona Description, Character Description, Character Personality</li>
                    <li>Character Depth Prompt, Scenario, Creator's Notes</li>
                </ul>
            </li>
            <li><strong>Understanding the two depth fields</strong>:
                <ul>
                    <li><strong>Depth</strong>: For @D position, this is where to inject the entry (Insertion Depth). For other positions, used for position-specific behavior</li>
                    <li><strong>Scan Depth Override</strong>: Optional field to override how many messages back to scan for keywords (leave empty to use global setting)</li>
                </ul>
            </li>
            <li><strong>Toggle side-by-side view</strong> (▥/▦ button) to see multiple entries at once</li>
            <li><strong>Check multiple entries</strong> and drag them together to reorder in bulk</li>
            <li>Click "Clear" to deselect all entries</li>
            <li>You can drag entries onto each other to reorder</li>
            <li>Search works on both entry names and keywords</li>
        </ul>

        <h2>♿ Accessibility Features</h2>
        <ul>
            <li><strong><span class="material-symbols-outlined">dark_mode</span> Dark Mode</strong>: Toggle between creamy light mode and soothing dark chocolate mode</li>
            <li><strong>Aa Dyslexia Font</strong>: Switch to OpenDyslexic font for easier reading</li>
            <li>Your preferences are saved automatically and persist between sessions</li>
            <li>All colors meet WCAG contrast requirements in both modes</li>
        </ul>

        <h2><span class="material-symbols-outlined">rocket_launch</span> How to Use</h2>
        <ol>
            <li><strong>Open the app</strong>: Just open index.html in your web browser</li>
            <li><strong>Name your lorebook</strong> (optional): Enter a name in the header - this becomes your export filename!</li>
            <li><strong>Import</strong>: Click "Import Lorebook" and select your SillyTavern JSON file</li>
            <li><strong>Edit</strong>: Click any entry in the list to open it</li>
            <li><strong>Quick actions</strong>: Hover over entries in the list to see action buttons (insert, copy, delete)</li>
            <li><strong>Multiple tabs</strong>: Click more entries to open them side-by-side</li>
            <li><strong>Merge lorebooks</strong>: Click "Import for Merging" to bring entries from another lorebook</li>
            <li><strong>Save</strong>: Click "Save Changes" after editing (orange ● shows unsaved changes)</li>
            <li><strong>Export</strong>: Click "Export Lorebook" to download your edited file</li>
        </ol>

        <p style="text-align: center; margin-top: 2rem; color: var(--text-secondary);">
            Built with vanilla HTML/CSS/JavaScript - no dependencies needed! 🎉
        </p>
    `;
    document.getElementById('helpModal').style.display = 'flex';
}

function hideHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// README content embedded directly
const EMBEDDED_README = `
    <h1>📱 Simple Lorebook Editor (SLEd) - Mobile Version</h1>
    
    <h2>🎯 Quick Start</h2>
    <ol>
        <li><strong>Open the app</strong>: Open <code>index.html</code> in your mobile browser</li>
        <li><strong>Name your lorebook</strong> (optional): Tap the header to enter a name - this becomes your export filename!</li>
        <li><strong>Import</strong>: Tap the <span class="material-symbols-outlined">menu</span> hamburger menu, then "<span class="material-symbols-outlined">download</span> Import" and select "Import Lorebook"</li>
        <li><strong>Edit</strong>: Tap any entry in the sidebar to open it</li>
        <li><strong>Swipe navigation</strong>: Swipe right to open the sidebar, swipe left to close it</li>
        <li><strong>Save</strong>: Tap "<span class="material-symbols-outlined">save</span>" in the editor header (orange ● shows unsaved changes)</li>
        <li><strong>Export</strong>: Open menu → "<span class="material-symbols-outlined">upload</span> Export" → choose "Export JSON" or "Export as Text"</li>
    </ol>

    <h2>✨ Mobile-Specific Features</h2>
    <ul>
        <li><span class="material-symbols-outlined">swipe</span> <strong>Swipe Navigation</strong> - Swipe right/left to open/close the sidebar</li>
        <li><span class="material-symbols-outlined">menu</span> <strong>Hamburger Menu</strong> - Access all functions through the top-left menu</li>
        <li><span class="material-symbols-outlined">touch_app</span> <strong>Touch-Friendly UI</strong> - Large tap targets optimized for fingers</li>
        <li><span class="material-symbols-outlined">tab</span> <strong>Tap-to-Open Tabs</strong> - Tap entries to open them (no hover needed)</li>
        <li><span class="material-symbols-outlined">keyboard</span> <strong>Smart Keyboard Handling</strong> - Content adjusts when keyboard opens, cursor position preserved</li>
        <li><span class="material-symbols-outlined">push_pin</span> <strong>Sticky Headers</strong> - Tab bar and save button stay visible while scrolling</li>
        <li><span class="material-symbols-outlined">fullscreen</span> <strong>Fullscreen Mode</strong> - Expand content for distraction-free editing</li>
        <li><span class="material-symbols-outlined">zoom_in</span> <strong>Sidebar Zoom</strong> - Three view levels: Compact, Normal, Detailed</li>
    </ul>

    <h2>📱 Touch Gestures</h2>
    <ul>
        <li><strong>Swipe Right</strong> - Open sidebar (from anywhere in editor view)</li>
        <li><strong>Swipe Left</strong> - Close sidebar (when sidebar is open)</li>
        <li><strong>Tap Entry</strong> - Open entry in editor</li>
        <li><strong>Tap Tab</strong> - Switch between open entries</li>
        <li><strong>Long Press</strong> - Access entry actions (insert, copy, delete)</li>
    </ul>

    <h2>✨ Core Features</h2>
    <ul>
        <li><span class="material-symbols-outlined">tab</span> <strong>Multi-tab Entry Management</strong> - Work on multiple entries with tabs</li>
        <li><span class="material-symbols-outlined">save</span> <strong>Auto-save Tracking</strong> - Visual indicators for unsaved changes (orange ●)</li>
        <li><span class="material-symbols-outlined">dark_mode</span> <strong>Dark Mode</strong> - Toggle between light and dark themes</li>
        <li><span class="material-symbols-outlined">accessibility</span> <strong>Dyslexia Font</strong> - Switch to OpenDyslexic font for better readability</li>
        <li><span class="material-symbols-outlined">find_replace</span> <strong>Search & Replace</strong> - Find and replace text across all entries</li>
        <li><span class="material-symbols-outlined">merge</span> <strong>Merge Functionality</strong> - Import and combine lorebooks</li>
        <li><span class="material-symbols-outlined">description</span> <strong>Export as Text</strong> - Export as readable .txt file with customizable options</li>
        <li><span class="material-symbols-outlined">drag_indicator</span> <strong>Reorder Entries</strong> - Long press and drag to reorder</li>
    </ul>

    <h2><span class="material-symbols-outlined">keyboard</span> Mobile Keyboard Handling</h2>
    <p>When you tap in the <strong>Content</strong> text area:</p>
    <ul>
        <li>The viewport automatically adjusts to show the keyboard</li>
        <li>The cursor appears exactly where you tapped</li>
        <li>Text area resizes to fit available space</li>
        <li>Scroll position is maintained</li>
        <li>Works in both normal and fullscreen modes</li>
    </ul>

    <h2><span class="material-symbols-outlined">push_pin</span> Sticky Headers</h2>
    <h3>In Editor View:</h3>
    <ul>
        <li><strong>Tab Bar</strong> (entry title + buttons) stays at the top while you scroll</li>
        <li><strong>Save Button</strong> always visible for quick saving</li>
        <li>Smooth scrolling through all entry fields</li>
    </ul>
    <h3>In Sidebar View:</h3>
    <ul>
        <li><strong>Zoom/Search Controls</strong> stay at top while scrolling through entries</li>
        <li>Entry list scrolls naturally underneath</li>
    </ul>

    <h2><span class="material-symbols-outlined">find_replace</span> Search & Replace</h2>
    <p>Open from menu → <strong>Search & Replace</strong>:</p>
    <ul>
        <li><strong>Scope Options</strong>: Content, Keywords, Names, or All Fields</li>
        <li><strong>Find All</strong>: See all matches before replacing</li>
        <li><strong>Replace Next</strong>: Replace one match at a time</li>
        <li><strong>Replace All</strong>: Replace all matches instantly</li>
        <li><strong>Options</strong>: Case Sensitive, Whole Words, Regular Expressions</li>
        <li><strong>Tap Results</strong>: Tap any result to jump to that entry</li>
    </ul>

    <h2><span class="material-symbols-outlined">description</span> Export as Text</h2>
    <p>Create readable backups with customization:</p>
    <ul>
        <li><strong>Group by Keywords</strong>: Organizes entries by keyword tags</li>
        <li><strong>Include Comments</strong>: Add your personal notes to export</li>
        <li><strong>Include Stats</strong>: Add word counts and entry statistics</li>
        <li><strong>Custom Separator</strong>: Choose divider style between entries</li>
    </ul>

    <h2><span class="material-symbols-outlined">lightbulb</span> Mobile Tips & Tricks</h2>
    <ul>
        <li><strong>Swipe is fastest</strong>: Swipe right/left to toggle sidebar instead of using the menu button</li>
        <li><strong>Activation dropdown moved</strong>: Now above Name/Title field for better mobile workflow</li>
        <li><strong>Fullscreen editing</strong>: Tap <span class="material-symbols-outlined">fullscreen</span> to hide tabs and maximize content space</li>
        <li><strong>Keywords are comma-separated</strong>: Type "sword, magic, fire" in keyword fields</li>
        <li><strong>Orange dot (●)</strong>: Shows unsaved changes on tabs</li>
        <li><strong>Zoom levels</strong>: Try different sidebar zoom levels to find what works best on your screen</li>
        <li><strong>Long press for actions</strong>: Long press entries for insert, copy, delete options</li>
        <li><strong>Multi-select drag</strong>: Check multiple entries and drag together to reorder in bulk</li>
    </ul>

    <h2>🛠️ Troubleshooting</h2>

    <h3>Swipe navigation not working?</h3>
    <ul>
        <li>Make sure you're swiping from the edge of the screen</li>
        <li>Try a more deliberate, longer swipe</li>
        <li>Check that you're not accidentally selecting text</li>
    </ul>

    <h3>Keyboard not adjusting properly?</h3>
    <ul>
        <li>This feature requires modern mobile browsers (iOS Safari 13+, Chrome 84+)</li>
        <li>Try closing and reopening the app</li>
        <li>Ensure JavaScript is enabled</li>
    </ul>

    <h3>Content not scrolling?</h3>
    <ul>
        <li>Sticky headers should stay in place while content scrolls</li>
        <li>If content is stuck, try switching between tabs</li>
        <li>Refresh the page if scrolling remains unresponsive</li>
    </ul>

    <h3>README not loading?</h3>
    <p>If you get an error viewing the README, try these solutions:</p>
    <ol>
        <li><strong>Use a local server</strong>: Run <code>start-server.bat</code> or <code>start-server.ps1</code></li>
        <li><strong>Try Chrome/Firefox</strong>: Different browsers have different security policies</li>
        <li><strong>Use a mobile server app</strong>: Install a local server app from your app store</li>
    </ol>

    <h2>🔄 Differences from Desktop Version</h2>
    <h3>Mobile Has:</h3>
    <ul>
        <li>✅ Swipe navigation (left/right gestures)</li>
        <li>✅ Hamburger menu for all functions</li>
        <li>✅ Touch-optimized interface with larger tap targets</li>
        <li>✅ Smart keyboard handling with viewport adjustment</li>
        <li>✅ Tap-to-open entries (no hover required)</li>
        <li>✅ Fullscreen content mode</li>
    </ul>
    <h3>Mobile Doesn't Have:</h3>
    <ul>
        <li>❌ Keyboard shortcuts (touch-focused instead)</li>
        <li>❌ Hover actions (uses tap/long-press instead)</li>
        <li>❌ Side-by-side multi-tab view (vertical tabs only)</li>
        <li>❌ Context menus (uses long-press menus instead)</li>
    </ul>
    <p><strong>Both versions support the same lorebook format and can edit the same files!</strong></p>

    <h2>📚 Full Documentation</h2>
    <p>For complete documentation with all features and technical details, see <code>DOCUMENTATION.md</code> in the Desktop version.</p>
`;

// Generate HTML for merge staging UI
function generateMergeStagingHTML() {
    const entries = Object.values(mergeStaging.entries).sort((a, b) => a.uid - b.uid);
    
    let entriesHTML = '';
    entries.forEach(entry => {
        const isSelected = mergeSelectedEntries.includes(entry.uid);
        entriesHTML += `
            <div class="merge-entry-item ${isSelected ? 'selected' : ''}" data-merge-uid="${entry.uid}">
                <div class="merge-entry-header">
                    <input type="checkbox" class="merge-entry-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="merge-entry-uid">#${entry.uid}</div>
                    <div class="merge-entry-title">${entry.comment || 'Untitled Entry'}</div>
                </div>
                ${entry.key && entry.key.length > 0 ? `
                    <div class="merge-entry-keywords">
                        ${entry.key.slice(0, 5).map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                        ${entry.key.length > 5 ? `<span class="keyword-tag">+${entry.key.length - 5} more</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    return `
        <div style="padding: 1rem; max-width: 900px; margin: 0 auto;">
            <h2><span class="material-symbols-outlined">merge</span> Merge Entries</h2>
            <p><strong>Current Lorebook:</strong> ${lorebook.name || 'Untitled'}</p>
            <p><strong>Merging From:</strong> ${mergeStaging.name || 'Untitled'}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Select entries to merge into your current lorebook. UIDs will be automatically renumbered to avoid conflicts.</p>
            
            <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
                <button id="selectAllMergeBtn" class="btn btn-secondary">Select All</button>
                <button id="deselectAllMergeBtn" class="btn btn-secondary">Deselect All</button>
                <span style="flex: 1; text-align: right; padding-top: 0.5rem; color: var(--text-secondary);"><span class="merge-count-display">0</span> entries selected</span>
            </div>
            
            <div id="mergeEntriesContainer" style="border: 1px solid var(--border-color); border-radius: 0.5rem; max-height: 500px; overflow-y: auto; margin-bottom: 1rem;">
                ${entriesHTML}
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button id="cancelMergeBtn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                <button id="confirmMergeBtn" class="btn btn-success" style="flex: 1;">Merge Selected Entries</button>
            </div>
        </div>
    `;
}

// Attach event listeners to merge staging UI
function attachMergeStagingListeners(container) {
    // Entry item click to toggle selection
    container.querySelectorAll('.merge-entry-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.merge-entry-checkbox')) {
                e.preventDefault();
                const uid = parseInt(item.dataset.mergeUid);
                toggleMergeSelection(uid);
                renderTabs();
                renderEditor();
            }
        });
    });
    
    // Checkbox change
    container.querySelectorAll('.merge-entry-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const item = checkbox.closest('.merge-entry-item');
            const uid = parseInt(item.dataset.mergeUid);
            toggleMergeSelection(uid);
            renderTabs();
            renderEditor();
        });
    });
    
    // Select All button
    const selectAllBtn = container.querySelector('#selectAllMergeBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            selectAllMergeEntries();
            renderTabs();
            renderEditor();
        });
    }
    
    // Deselect All button
    const deselectAllBtn = container.querySelector('#deselectAllMergeBtn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            deselectAllMergeEntries();
            renderTabs();
            renderEditor();
        });
    }
    
    // Cancel button
    const cancelBtn = container.querySelector('#cancelMergeBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeMergeModal);
    }
    
    // Confirm button
    const confirmBtn = container.querySelector('#confirmMergeBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', executeMerge);
    }
    
    updateMergeCount();
}

// Generate HTML for Export Text Tab
function generateExportTextTabHTML() {
    const lorebookName = document.getElementById('lorebookName').value || 'lorebook';
    
    return `
        <div style="padding: 1rem; max-width: 900px; margin: 0 auto;">
            <h2><span class="material-symbols-outlined">description</span> Export as Plaintext (.txt)</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Choose options to customize your plaintext export.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Content Options</h3>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportTitles" checked>
                        <label for="exportTitles">Entry Titles</label>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportContent" checked>
                        <label for="exportContent">Entry Content</label>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportPrimaryKeys" checked>
                        <label for="exportPrimaryKeys">Primary Keywords</label>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportSecondaryKeys" checked>
                        <label for="exportSecondaryKeys">Secondary Keywords & Logic</label>
                    </div>
                </div>
                
                <div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Additional Options</h3>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportConstants" checked>
                        <label for="exportConstants">Constant/Extension Indicators</label>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportComments">
                        <label for="exportComments">Comments/Notes</label>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="exportOrder">
                        <label for="exportOrder">Order Numbers</label>
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="exportFilename" class="form-label">Filename (without .txt extension):</label>
                <input type="text" id="exportFilename" class="form-input" placeholder="lorebook-backup" value="${lorebookName}-backup">
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button id="cancelExportTextBtn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                <button id="performExportTextBtn" class="btn btn-success" style="flex: 1;"><span class="material-symbols-outlined">download</span> Export Text</button>
            </div>
        </div>
    `;
}

// Attach event listeners to Export Text Tab
function attachExportTextTabListeners(container) {
    // Cancel button
    const cancelBtn = container.querySelector('#cancelExportTextBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeTab('export-text-tab');
        });
    }
    
    // Export button
    const exportBtn = container.querySelector('#performExportTextBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAsText);
    }
}

// README Display Function
function showReadme() {
    window.readmeContent = EMBEDDED_README;
    
    // Add README tab if not already open
    if (!openTabs.includes('readme-tab')) {
        openTabs.push('readme-tab');
    }
    
    activeTabId = 'readme-tab';
    renderTabs();
    renderEditor();
}

// Simple Markdown to HTML converter
function markdownToHTML(markdown) {
    return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraphs
        .replace(/^(.+)$/gm, '<p>$1</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><ol>/g, '<ol>')
        .replace(/<\/ol><\/p>/g, '</ol>')
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>');
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('themeToggle');
    const isDark = body.classList.toggle('dark-mode');
    
    if (isDark) {
        themeBtn.innerHTML = '<span class="material-symbols-outlined">light_mode</span> Light';
        themeBtn.title = 'Toggle Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        themeBtn.innerHTML = '<span class="material-symbols-outlined">dark_mode</span> Dark';
        themeBtn.title = 'Toggle Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

// Font Toggle
function toggleDyslexiaFont() {
    const body = document.body;
    const fontBtn = document.getElementById('fontToggle');
    const isDyslexic = body.classList.toggle('dyslexia-font');
    
    if (isDyslexic) {
        fontBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Aa';
        fontBtn.title = 'Disable Dyslexia-Friendly Font';
        fontBtn.style.background = 'var(--primary-color)';
        fontBtn.style.color = 'white';
        localStorage.setItem('dyslexiaFont', 'true');
    } else {
        fontBtn.innerHTML = 'Aa';
        fontBtn.title = 'Enable Dyslexia-Friendly Font';
        fontBtn.style.background = '';
        fontBtn.style.color = '';
        localStorage.setItem('dyslexiaFont', 'false');
    }
}

// Editor Font Toggle
function toggleEditorFont() {
    const body = document.body;
    const fontBtn = document.getElementById('editorFontToggle');
    const fontLabel = document.getElementById('editorFontLabel');
    
    // Remove all editor font classes
    body.classList.remove('editor-font-mono', 'editor-font-sans', 'editor-font-serif');
    
    // Get current font mode from localStorage
    let currentMode = localStorage.getItem('editorFont') || 'mono';
    
    // Cycle through modes: mono -> sans -> serif -> mono
    let newMode, newLabel, newIcon;
    if (currentMode === 'mono') {
        newMode = 'sans';
        newLabel = 'Sans-serif';
        newIcon = 'font_download';
        body.classList.add('editor-font-sans');
    } else if (currentMode === 'sans') {
        newMode = 'serif';
        newLabel = 'Serif';
        newIcon = 'serif';
        body.classList.add('editor-font-serif');
    } else {
        newMode = 'mono';
        newLabel = 'Monospace';
        newIcon = 'slab_serif';
        body.classList.add('editor-font-mono');
    }
    
    if (fontLabel) fontLabel.textContent = newLabel;
    if (fontBtn) {
        const iconSpan = fontBtn.querySelector('.material-symbols-outlined');
        if (iconSpan) iconSpan.textContent = newIcon;
    }
    localStorage.setItem('editorFont', newMode);
}

// Load Preferences
function loadPreferences() {
    const savedTheme = localStorage.getItem('theme');
    const savedFont = localStorage.getItem('dyslexiaFont');
    const savedEditorFont = localStorage.getItem('editorFont');
    const savedZoom = localStorage.getItem('sidebarZoom');
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.innerHTML = '<span class="material-symbols-outlined">light_mode</span> Light';
        themeBtn.title = 'Toggle Light Mode';
    }
    
    // Apply saved font preference
    if (savedFont === 'true') {
        document.body.classList.add('dyslexia-font');
        const fontBtn = document.getElementById('fontToggle');
        fontBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Aa';
        fontBtn.title = 'Disable Dyslexia-Friendly Font';
        fontBtn.style.background = 'var(--primary-color)';
        fontBtn.style.color = 'white';
    }
    
    // Apply saved editor font
    if (savedEditorFont) {
        const fontLabel = document.getElementById('editorFontLabel');
        const fontBtn = document.getElementById('editorFontToggle');
        const iconSpan = fontBtn ? fontBtn.querySelector('.material-symbols-outlined') : null;
        
        if (savedEditorFont === 'sans') {
            document.body.classList.add('editor-font-sans');
            if (fontLabel) fontLabel.textContent = 'Sans-serif';
            if (iconSpan) iconSpan.textContent = 'font_download';
        } else if (savedEditorFont === 'serif') {
            document.body.classList.add('editor-font-serif');
            if (fontLabel) fontLabel.textContent = 'Serif';
            if (iconSpan) iconSpan.textContent = 'serif';
        } else {
            document.body.classList.add('editor-font-mono');
            if (fontLabel) fontLabel.textContent = 'Monospace';
            if (iconSpan) iconSpan.textContent = 'slab_serif';
        }
    } else {
        // Default to monospace
        document.body.classList.add('editor-font-mono');
        const fontBtn = document.getElementById('editorFontToggle');
        const iconSpan = fontBtn ? fontBtn.querySelector('.material-symbols-outlined') : null;
        if (iconSpan) iconSpan.textContent = 'slab_serif';
    }
    
    // Apply saved zoom level
    if (savedZoom !== null) {
        currentZoomLevel = parseInt(savedZoom);
        updateZoomUI();
    }
}

// ===== SEARCH & REPLACE FUNCTIONS =====

let searchResults = [];
let currentSearchIndex = 0;

function showSearchReplaceModal() {
    document.getElementById('searchReplaceModal').style.display = 'flex';
    document.getElementById('searchText').focus();
}

function closeSearchReplaceModal() {
    document.getElementById('searchReplaceModal').style.display = 'none';
    searchResults = [];
    currentSearchIndex = 0;
    document.getElementById('searchResults').style.display = 'none';
}

// ===== EXPORT TEXT FUNCTIONS =====

function generateMarkdownExport(options) {
    const lorebookName = document.getElementById('lorebookName').value || 'Lorebook';
    let markdown = `# ${lorebookName}\n\n`;
    
    // Sort entries by order
    const sortedEntries = Object.values(lorebook.entries)
        .sort((a, b) => ((a.order !== undefined ? a.order : a.uid) - (b.order !== undefined ? b.order : b.uid)));
    
    // Helper function to convert selectiveLogic number to text
    const getLogicText = (logicNum) => {
        const logicMap = {
            0: 'AND ANY',
            1: 'NOT ANY',
            2: 'NOT ALL',
            3: 'AND ALL'
        };
        return logicMap[logicNum] || 'AND ANY';
    };
    
    sortedEntries.forEach((entry, index) => {
        const entryNumber = index + 1;
        const entryTitle = entry.comment || 'Untitled Entry';
        
        // Entry header with indicators
        let headerLine = `## ${entryNumber}. ${entryTitle}`;
        
        if (options.constants) {
            // Use simple textual indicators for plaintext export
            const indicators = [];
            if (entry.constant) indicators.push('[CONST]');
            if (entry.extension) indicators.push('[EXT]');
            if (entry.selective && entry.keysecondary && entry.keysecondary.length > 0) indicators.push('[SELECTIVE]');
            if (indicators.length > 0) {
                headerLine += ` ${indicators.join(' ')}`;
            }
        }
        
        if (options.order && entry.order !== undefined) {
            headerLine += ` (Order: ${entry.order})`;
        }
        
        markdown += `${headerLine}\n\n`;
        
        // Primary keywords
        if (options.primaryKeys && entry.key && entry.key.length > 0) {
            markdown += `**Primary Keys:** ${entry.key.join(', ')}\n\n`;
        }
        
        // Secondary keywords and logic
        if (options.secondaryKeys && entry.keysecondary && entry.keysecondary.length > 0) {
            const logic = getLogicText(entry.selectiveLogic);
            markdown += `**Logic:** ${logic}\n`;
            markdown += `**Secondary Keys:** ${entry.keysecondary.join(', ')}\n\n`;
        }
        
        // Content
        if (options.content && entry.content) {
            markdown += `${entry.content}\n\n`;
        }
        
        // Comments/Notes (only show if different from title and option is enabled)
        if (options.comments && entry.comment && entry.comment !== 'Untitled Entry') {
            markdown += `**Notes:** ${entry.comment}\n\n`;
        }
        
        // Add separator between entries
        markdown += '---\n\n';
    });
    
    // Add footer
    markdown += `*Generated by Simple Lorebook Editor (SLEd) on ${new Date().toLocaleDateString()}*\n`;
    
    return markdown;
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

function performSearch() {
    const searchText = document.getElementById('searchText').value;
    const scope = document.getElementById('searchScope').value;
    const caseSensitive = document.getElementById('caseSensitiveSearch').checked;
    const wholeWords = document.getElementById('wholeWordsSearch').checked;
    const useRegex = document.getElementById('regexSearch').checked;
    
    if (!searchText) {
        return;
    }
    
    searchResults = [];
    let pattern;
    
    try {
        if (useRegex) {
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(searchText, flags);
        } else {
            let escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (wholeWords) {
                escapedText = `\\b${escapedText}\\b`;
            }
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(escapedText, flags);
        }
    } catch (e) {
        showNotification('Invalid regular expression: ' + e.message, 'error');
        return;
    }
    
    // Search through all entries
    Object.entries(lorebook.entries).forEach(([uid, entry]) => {
        // Determine which fields to search based on scope
        let fieldsToSearch = {};
        
        if (scope === 'content' || scope === 'all') {
            fieldsToSearch.content = entry.content || '';
        }
        if (scope === 'keywords' || scope === 'all') {
            fieldsToSearch.primaryKeywords = (entry.key || []).join(', ');
            fieldsToSearch.secondaryKeywords = (entry.keysecondary || []).join(', ');
        }
        if (scope === 'names' || scope === 'all') {
            fieldsToSearch.name = entry.comment || '';
        }
        
        // Search in each field
        Object.entries(fieldsToSearch).forEach(([fieldName, fieldValue]) => {
            const matches = fieldValue.matchAll ? [...fieldValue.matchAll(pattern)] : [];
            matches.forEach(match => {
                searchResults.push({
                    uid: uid,
                    entryName: entry.comment || '(Untitled)',
                    field: fieldName,
                    matchText: match[0],
                    startIndex: match.index,
                    fullText: fieldValue
                });
            });
        });
    });
    
    currentSearchIndex = 0;
    displaySearchResults();
}

function displaySearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    const resultsList = document.getElementById('resultsList');
    const resultsHeader = document.getElementById('resultsHeader');
    
    if (searchResults.length === 0) {
        resultsContainer.style.display = 'block';
        resultsHeader.textContent = 'No matches found';
        resultsList.innerHTML = '';
        return;
    }
    
    resultsContainer.style.display = 'block';
    resultsHeader.textContent = `Found ${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`;
    
    resultsList.innerHTML = '';
    searchResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Highlight the match in context
        const contextStart = Math.max(0, result.startIndex - 20);
        const contextEnd = Math.min(result.fullText.length, result.startIndex + result.matchText.length + 20);
        const contextText = result.fullText.substring(contextStart, contextEnd);
        const beforeDots = contextStart > 0 ? '...' : '';
        const afterDots = contextEnd < result.fullText.length ? '...' : '';
        
        resultItem.innerHTML = `
            <div class="result-item-text">
                <strong>${escapeHtml(result.entryName)}</strong> (${result.field})<br>
                <code>${beforeDots}${escapeHtml(contextText)}${afterDots}</code>
            </div>
            <div class="result-item-location">#${result.uid}</div>
        `;
        
        resultItem.addEventListener('click', () => {
            openEntryInTab(parseInt(result.uid));
            currentSearchIndex = index;
        });
        
        resultsList.appendChild(resultItem);
    });
}

function replaceNext() {
    const searchText = document.getElementById('searchText').value;
    const replaceText = document.getElementById('replaceText').value;
    const caseSensitive = document.getElementById('caseSensitiveSearch').checked;
    const wholeWords = document.getElementById('wholeWordsSearch').checked;
    const useRegex = document.getElementById('regexSearch').checked;
    
    if (searchResults.length === 0) {
        return;
    }
    
    const result = searchResults[currentSearchIndex];
    const entry = lorebook.entries[result.uid];
    
    if (!entry) return;
    
    // Perform the replacement
    let pattern;
    try {
        if (useRegex) {
            const flags = caseSensitive ? '' : 'i';
            pattern = new RegExp(searchText, flags);
        } else {
            let escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (wholeWords) {
                escapedText = `\\b${escapedText}\\b`;
            }
            const flags = caseSensitive ? '' : 'i';
            pattern = new RegExp(escapedText, flags);
        }
    } catch (e) {
        showNotification('Invalid regular expression', 'error');
        return;
    }
    
    // Update the appropriate field
    if (result.field === 'content') {
        entry.content = entry.content.replace(pattern, replaceText);
    } else if (result.field === 'name') {
        entry.comment = entry.comment.replace(pattern, replaceText);
    } else if (result.field === 'primaryKeywords') {
        entry.key = entry.key.map(k => k.replace(pattern, replaceText));
    } else if (result.field === 'secondaryKeywords') {
        entry.keysecondary = entry.keysecondary.map(k => k.replace(pattern, replaceText));
    }
    
    // Mark as unsaved
    unsavedChanges.add(result.uid);
    
    // Remove this result and move to next
    searchResults.splice(currentSearchIndex, 1);
    if (currentSearchIndex >= searchResults.length && currentSearchIndex > 0) {
        currentSearchIndex--;
    }
    
    // Refresh UI
    renderEntryList();
    renderTabs();
    if (activeTabId === parseInt(result.uid)) {
        renderEditor();
    }
    
    displaySearchResults();
    showNotification('Replaced 1 occurrence', 'success');
}

function replaceAll() {
    const searchText = document.getElementById('searchText').value;
    const replaceText = document.getElementById('replaceText').value;
    const caseSensitive = document.getElementById('caseSensitiveSearch').checked;
    const wholeWords = document.getElementById('wholeWordsSearch').checked;
    const useRegex = document.getElementById('regexSearch').checked;
    
    if (searchResults.length === 0) {
        return;
    }
    
    if (!confirm(`Replace all ${searchResults.length} occurrences? This cannot be undone.`)) {
        return;
    }
    
    let pattern;
    try {
        if (useRegex) {
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(searchText, flags);
        } else {
            let escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (wholeWords) {
                escapedText = `\\b${escapedText}\\b`;
            }
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(escapedText, flags);
        }
    } catch (e) {
        showNotification('Invalid regular expression', 'error');
        return;
    }
    
    let replacementCount = 0;
    
    // Process each result
    const processedUids = new Set();
    searchResults.forEach(result => {
        const entry = lorebook.entries[result.uid];
        if (!entry) return;
        
        // Update the appropriate field
        if (result.field === 'content') {
            const newContent = entry.content.replace(pattern, replaceText);
            if (newContent !== entry.content) {
                entry.content = newContent;
                replacementCount++;
                processedUids.add(result.uid);
            }
        } else if (result.field === 'name') {
            const newName = entry.comment.replace(pattern, replaceText);
            if (newName !== entry.comment) {
                entry.comment = newName;
                replacementCount++;
                processedUids.add(result.uid);
            }
        } else if (result.field === 'primaryKeywords') {
            entry.key = entry.key.map(k => k.replace(pattern, replaceText));
            replacementCount++;
            processedUids.add(result.uid);
        } else if (result.field === 'secondaryKeywords') {
            entry.keysecondary = entry.keysecondary.map(k => k.replace(pattern, replaceText));
            replacementCount++;
            processedUids.add(result.uid);
        }
    });
    
    // Mark all modified entries as unsaved
    processedUids.forEach(uid => unsavedChanges.add(uid));
    
    // Clear search results
    searchResults = [];
    currentSearchIndex = 0;
    document.getElementById('searchResults').style.display = 'none';
    
    // Refresh UI
    renderEntryList();
    renderTabs();
    renderEditor();
}

// ===== MOBILE INTERFACE FUNCTIONALITY =====

// Mobile state management
let mobileCurrentPanel = 'entries'; // 'entries' or 'editor'
let touchStartX = 0;
let touchEndX = 0;
let isSwiping = false;

// Initialize mobile functionality
function initializeMobileInterface() {
    // Initialize mobile event listeners (CSS handles visibility based on screen width)
    setupMobileEventListeners();
    setupSwipeGestures();
    syncMobileAndDesktopElements();
    
    // Set entries panel as active by default on mobile
    if (window.innerWidth <= 768) {
        const entriesNavBtn = document.getElementById('entriesNavBtn');
        if (entriesNavBtn) {
            entriesNavBtn.classList.add('active');
        }
    }
}

// Setup mobile event listeners
function setupMobileEventListeners() {
    // Mobile dropdowns
    setupMobileDropdowns();
    
    // Mobile menu
    setupMobileMenu();
    
    // Mobile navigation buttons
    setupMobileNavigation();
    
    // Mobile search toggle
    setupMobileSearch();
    
    // Navigation indicators
    setupNavigationIndicators();
    
    // Handle window resize
    window.addEventListener('resize', handleMobileResize);
}

// Setup mobile dropdown menus
function setupMobileDropdowns() {
    console.log('[setupMobileDropdowns] Starting dropdown setup');
    const mobileImportBtn = document.getElementById('mobileImportBtn');
    const mobileExportBtn = document.getElementById('mobileExportBtn');
    const mobileImportMenu = document.getElementById('mobileImportMenu');
    const mobileExportMenu = document.getElementById('mobileExportMenu');
    console.log('[setupMobileDropdowns] Buttons found:', {import: !!mobileImportBtn, export: !!mobileExportBtn});
    console.log('[setupMobileDropdowns] Menus found:', {import: !!mobileImportMenu, export: !!mobileExportMenu});
    
    if (mobileImportBtn && mobileImportMenu) {
        mobileImportBtn.addEventListener('click', (e) => {
            console.log('[mobileImportBtn] Clicked');
            e.stopPropagation();
            const wasShown = mobileImportMenu.classList.contains('show');
            mobileImportMenu.classList.toggle('show');
            if (mobileExportMenu) mobileExportMenu.classList.remove('show');
            console.log('[mobileImportBtn] Menu is now:', mobileImportMenu.classList.contains('show') ? 'visible' : 'hidden');
            console.log('[mobileImportBtn] Menu computed style:', window.getComputedStyle(mobileImportMenu).display, window.getComputedStyle(mobileImportMenu).visibility, window.getComputedStyle(mobileImportMenu).opacity);
            console.log('[mobileImportBtn] Menu position:', mobileImportMenu.getBoundingClientRect());
        });
    }
    
    if (mobileExportBtn && mobileExportMenu) {
        mobileExportBtn.addEventListener('click', (e) => {
            console.log('[mobileExportBtn] Clicked');
            e.stopPropagation();
            const wasShown = mobileExportMenu.classList.contains('show');
            mobileExportMenu.classList.toggle('show');
            if (mobileImportMenu) mobileImportMenu.classList.remove('show');
            console.log('[mobileExportBtn] Menu is now:', mobileExportMenu.classList.contains('show') ? 'visible' : 'hidden');
        });
    }
    
    // Close dropdowns when clicking outside (NOT on menu items)
    document.addEventListener('click', (e) => {
        // Don't close if clicking inside a dropdown menu
        if (e.target.closest('.mobile-dropdown-menu')) {
            console.log('[Document click] Inside dropdown menu, not closing');
            return;
        }
        console.log('[Document click] Outside menus, closing all');
        if (mobileImportMenu) mobileImportMenu.classList.remove('show');
        if (mobileExportMenu) mobileExportMenu.classList.remove('show');
    });
}

// Setup navigation indicators
function setupNavigationIndicators() {
    // Navigation indicators are handled by setupMobileNavigation function
    // This function is kept for compatibility but no longer needed
}

// Switch between mobile panels
function switchToMobilePanel(panel) {
    const entriesPanel = document.getElementById('entriesPanel');
    const editorPanel = document.getElementById('editorPanel');
    const entriesNavBtn = document.getElementById('entriesNavBtn');
    const editorNavBtn = document.getElementById('editorNavBtn');
    const sidebarHeader = document.getElementById('mobileSidebarHeader');
    const tabsContainer = document.getElementById('mobileTabsContainer');
    
    if (!entriesPanel || !editorPanel) return;
    
    // Update panels
    if (panel === 'editor') {
        entriesPanel.classList.add('show-editor');
        editorPanel.classList.add('show-editor');
        mobileCurrentPanel = 'editor';
        
        // Show tabs container, hide sidebar header
        if (sidebarHeader) {
            sidebarHeader.style.opacity = '0';
            sidebarHeader.style.visibility = 'hidden';
        }
        if (tabsContainer) {
            tabsContainer.style.opacity = '1';
            tabsContainer.style.visibility = 'visible';
        }
        
        // Update navigation buttons
        if (entriesNavBtn && editorNavBtn) {
            entriesNavBtn.classList.remove('active');
            editorNavBtn.classList.add('active');
        }
    } else {
        entriesPanel.classList.remove('show-editor');
        editorPanel.classList.remove('show-editor');
        mobileCurrentPanel = 'entries';
        
        // Show sidebar header, hide tabs container
        if (sidebarHeader) {
            sidebarHeader.style.opacity = '1';
            sidebarHeader.style.visibility = 'visible';
        }
        if (tabsContainer) {
            tabsContainer.style.opacity = '0';
            tabsContainer.style.visibility = 'hidden';
        }
        
        // Update navigation buttons
        if (entriesNavBtn && editorNavBtn) {
            entriesNavBtn.classList.add('active');
            editorNavBtn.classList.remove('active');
        }
    }
}

// Setup swipe gestures
function setupSwipeGestures() {
    const swipeContainer = document.querySelector('.mobile-swipe-container');
    
    if (!swipeContainer) return;
    
    swipeContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    swipeContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    swipeContainer.addEventListener('touchend', handleTouchEnd);
    
    // Prevent accidental taps on the very edges of the swipe container from switching panels.
    // Only swipes and the navigation buttons should change panels.
    swipeContainer.addEventListener('click', (e) => {
        try {
            const rect = swipeContainer.getBoundingClientRect();
            const edgeThreshold = 30; // px
            const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
            if (x - rect.left < edgeThreshold || rect.right - x < edgeThreshold) {
                // ignore clicks/taps near edges
                e.stopPropagation();
                e.preventDefault();
            }
        } catch (err) {
            // ignore
        }
    }, { passive: false });
}

// Touch event handlers
function handleTouchStart(e) {
    // Don't trigger swipes on form elements
    const target = e.target;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('.editor-form') ||
        target.closest('.mobile-search-input') ||
        target.closest('.mobile-tab-bar') ||
        target.closest('.mobile-entry-list') ||
        target.closest('.mobile-editor-content')) {
        isSwiping = false;
        return;
    }
    
    // Only allow swiping on the main swipe container, not on edges
    const swipeContainer = document.querySelector('.mobile-swipe-container');
    if (!swipeContainer.contains(target)) {
        isSwiping = false;
        return;
    }
    
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
}

function handleTouchMove(e) {
    if (!isSwiping) return;
    touchEndX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
    if (!isSwiping) return;
    
    isSwiping = false;
    const swipeThreshold = 50; // Reduced threshold for easier swiping
    const swipeDistance = touchEndX - touchStartX;
    
    // Only trigger on significant swipes
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0 && mobileCurrentPanel === 'editor') {
            // Swipe right - go to entries
            switchToMobilePanel('entries');
        } else if (swipeDistance < 0 && mobileCurrentPanel === 'entries') {
            // Swipe left - go to editor
            switchToMobilePanel('editor');
        }
    }
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('show');
            if (mobileMenuOverlay) mobileMenuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking on overlay
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });
}

// Close mobile menu
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenu) {
        mobileMenu.classList.remove('show');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Setup mobile navigation buttons
function setupMobileNavigation() {
    const entriesNavBtn = document.getElementById('entriesNavBtn');
    const editorNavBtn = document.getElementById('editorNavBtn');
    
    if (entriesNavBtn) {
        entriesNavBtn.addEventListener('click', () => {
            switchToMobilePanel('entries');
        });
    }
    
    if (editorNavBtn) {
        editorNavBtn.addEventListener('click', () => {
            switchToMobilePanel('editor');
        });
    }
}

// Setup mobile search toggle
function setupMobileSearch() {
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchContainer = document.getElementById('mobileSearchContainer');
    const mobileSearchInput = document.getElementById('searchEntries');
    
    if (mobileSearchToggle && mobileSearchContainer) {
        mobileSearchToggle.addEventListener('click', () => {
            const isVisible = mobileSearchContainer.style.display !== 'none';
            mobileSearchContainer.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible && mobileSearchInput) {
                mobileSearchInput.focus();
            }
        });
    }
}

// Sync mobile and desktop elements
function syncMobileAndDesktopElements() {
    // Any syncing logic between mobile and desktop versions can go here
    // Currently just ensures proper initial state
}

// Handle mobile resize
function handleMobileResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Re-initialize mobile interface if needed
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            closeMobileMenu();
        }
        
        // Ensure proper panel state on resize
        if (mobileCurrentPanel === 'editor') {
            switchToMobilePanel('editor');
        } else {
            switchToMobilePanel('entries');
        }
    }
}

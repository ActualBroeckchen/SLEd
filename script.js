/**
 * SLEd - Simple Lorebook Editor
 * Main Application Script
 */

// ========================================
// State Management
// ========================================

const state = {
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

// ========================================
// DOM Elements
// ========================================

const elements = {
    // Header
    menuToggle: document.getElementById('menuToggle'),
    fileName: document.getElementById('fileName'),
    searchBtn: document.getElementById('searchBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    headerLogo: document.getElementById('headerLogo'),
    
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    sidebarSearch: document.getElementById('sidebarSearch'),
    sidebarZoom: document.getElementById('sidebarZoom'),
    entryList: document.getElementById('entryList'),
    emptyState: document.getElementById('emptyState'),
    addEntryBtn: document.getElementById('addEntryBtn'),
    emptyImportBtn: document.getElementById('emptyImportBtn'),
    
    // Editor
    tabsContainer: document.getElementById('tabsContainer'),
    tabs: document.getElementById('tabs'),
    editorContent: document.getElementById('editorContent'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    welcomeLogo: document.getElementById('welcomeLogo'),
    entryEditor: document.getElementById('entryEditor'),
    entryForm: document.getElementById('entryForm'),
    
    // Welcome buttons
    importBtn: document.getElementById('importBtn'),
    newLorebookBtn: document.getElementById('newLorebookBtn'),
    
    // Action bar
    actionImport: document.getElementById('actionImport'),
    actionExport: document.getElementById('actionExport'),
    actionMerge: document.getElementById('actionMerge'),
    actionSave: document.getElementById('actionSave'),
    
    // Modals
    searchModal: document.getElementById('searchModal'),
    settingsModal: document.getElementById('settingsModal'),
    exportModal: document.getElementById('exportModal'),
    mergeModal: document.getElementById('mergeModal'),
    
    // File inputs
    fileInput: document.getElementById('fileInput'),
    mergeFileInput: document.getElementById('mergeFileInput'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer'),
    
    // Form fields
    entryName: document.getElementById('entryName'),
    primaryKeywords: document.getElementById('primaryKeywords'),
    secondaryKeywords: document.getElementById('secondaryKeywords'),
    selectiveLogic: document.getElementById('selectiveLogic'),
    entryContent: document.getElementById('entryContent'),
    insertionPosition: document.getElementById('insertionPosition'),
    insertionDepth: document.getElementById('insertionDepth'),
    insertionRole: document.getElementById('insertionRole'),
    outletName: document.getElementById('outletName'),
    orderNumber: document.getElementById('orderNumber'),
    probability: document.getElementById('probability'),
    sticky: document.getElementById('sticky'),
    cooldown: document.getElementById('cooldown'),
    delay: document.getElementById('delay'),
    depthRow: document.getElementById('depthRow'),
    outletRow: document.getElementById('outletRow'),
    keywordsSection: document.getElementById('keywordsSection'),
    secondaryKeywordsSection: document.getElementById('secondaryKeywordsSection')
};

// ========================================
// Initialization
// ========================================

function init() {
    loadSettings();
    setupEventListeners();
    applyTheme();
    updateUI();
}

function loadSettings() {
    const saved = localStorage.getItem('sled-settings');
    if (saved) {
        try {
            Object.assign(state.settings, JSON.parse(saved));
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }
    
    // Also check for legacy theme setting
    const legacyTheme = localStorage.getItem('sled-theme');
    if (legacyTheme) {
        state.settings.theme = legacyTheme;
    }
}

function saveSettings() {
    localStorage.setItem('sled-settings', JSON.stringify(state.settings));
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Sidebar
    elements.sidebarSearch.addEventListener('input', filterEntries);
    elements.sidebarZoom.addEventListener('change', handleZoomChange);
    elements.addEntryBtn.addEventListener('click', createNewEntry);
    elements.emptyImportBtn.addEventListener('click', () => elements.fileInput.click());
    
    // Welcome screen
    elements.importBtn.addEventListener('click', () => elements.fileInput.click());
    elements.newLorebookBtn.addEventListener('click', createNewLorebook);
    
    // Action bar
    elements.actionImport.addEventListener('click', () => elements.fileInput.click());
    elements.actionExport.addEventListener('click', openExportModal);
    elements.actionMerge.addEventListener('click', () => elements.mergeFileInput.click());
    elements.actionSave.addEventListener('click', saveCurrentEntry);
    
    // Header buttons
    elements.searchBtn.addEventListener('click', openSearchModal);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // File inputs
    elements.fileInput.addEventListener('change', handleFileImport);
    elements.mergeFileInput.addEventListener('change', handleMergeImport);
    
    // Modal close buttons
    document.getElementById('closeSearchModal').addEventListener('click', closeSearchModal);
    document.getElementById('closeSettingsModal').addEventListener('click', closeSettingsModal);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
    document.getElementById('closeExportModal').addEventListener('click', closeExportModal);
    document.getElementById('closeMergeModal').addEventListener('click', closeMergeModal);
    
    // Search modal
    document.getElementById('findAllBtn').addEventListener('click', findAll);
    document.getElementById('replaceNextBtn').addEventListener('click', replaceNext);
    document.getElementById('replaceAllBtn').addEventListener('click', replaceAll);
    
    // Export modal
    document.getElementById('exportJson').addEventListener('click', exportAsJson);
    document.getElementById('exportTxt').addEventListener('click', exportAsTxt);
    
    // Merge modal
    document.getElementById('mergeSelectAll').addEventListener('click', mergeSelectAll);
    document.getElementById('mergeSelectNone').addEventListener('click', mergeSelectNone);
    document.getElementById('mergeConfirm').addEventListener('click', mergeConfirm);
    
    // Settings
    document.getElementById('themeLightBtn').addEventListener('click', () => setTheme('light'));
    document.getElementById('themeDarkBtn').addEventListener('click', () => setTheme('dark'));
    document.getElementById('dyslexiaFont').addEventListener('change', toggleDyslexiaFont);
    
    // Form fields - track changes
    elements.entryForm.addEventListener('input', markCurrentAsUnsaved);
    
    // Position change handler
    elements.insertionPosition.addEventListener('change', handlePositionChange);
    
    // Activation type change
    document.querySelectorAll('input[name="activationType"]').forEach(radio => {
        radio.addEventListener('change', handleActivationTypeChange);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Prevent form submission
    elements.entryForm.addEventListener('submit', (e) => e.preventDefault());
    
    // Close modals on backdrop click
    [elements.searchModal, elements.settingsModal, elements.exportModal, elements.mergeModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.close();
            }
        });
    });
}

// ========================================
// Sidebar Functions
// ========================================

function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
    elements.sidebarOverlay.classList.toggle('visible');
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('visible');
}

function handleZoomChange(e) {
    state.settings.sidebarZoom = e.target.value;
    elements.sidebar.setAttribute('data-zoom', e.target.value);
    saveSettings();
}

function filterEntries() {
    const query = elements.sidebarSearch.value.toLowerCase();
    const items = elements.entryList.querySelectorAll('.entry-item');
    
    items.forEach(item => {
        const name = item.querySelector('.entry-name')?.textContent.toLowerCase() || '';
        const keywords = item.querySelector('.entry-keywords')?.textContent.toLowerCase() || '';
        const visible = name.includes(query) || keywords.includes(query);
        item.style.display = visible ? '' : 'none';
    });
}

function renderEntryList() {
    if (!state.lorebook || !state.entries || Object.keys(state.entries).length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.entryList.innerHTML = '';
        elements.entryList.appendChild(elements.emptyState);
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    // Sort entries by order
    const sortedEntries = Object.values(state.entries).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    elements.entryList.innerHTML = sortedEntries.map(entry => {
        const isActive = state.activeTabId === entry.uid;
        const isUnsaved = state.unsavedChanges.has(entry.uid);
        const statusIcon = getStatusIcon(entry);
        const keywords = entry.key?.join(', ') || '';
        
        return `
            <div class="entry-item ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}" 
                 data-uid="${entry.uid}" 
                 onclick="openEntry(${entry.uid})"
                 draggable="true">
                <span class="entry-status">${statusIcon}</span>
                <div class="entry-info">
                    <div class="entry-name">${escapeHtml(entry.comment || `Entry ${entry.uid}`)}</div>
                    <div class="entry-keywords">${escapeHtml(keywords)}</div>
                </div>
                <span class="entry-order">#${entry.order || 0}</span>
            </div>
        `;
    }).join('');
    
    // Re-add empty state element
    elements.entryList.appendChild(elements.emptyState);
    
    // Setup drag and drop
    setupDragAndDrop();
}

function getStatusIcon(entry) {
    if (entry.disable) return '⚫';
    if (entry.constant) return '🔵';
    if (entry.vectorized) return '🔗';
    return '🟢';
}

function setupDragAndDrop() {
    const items = elements.entryList.querySelectorAll('.entry-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.target.closest('.entry-item');
    if (target && target !== draggedItem) {
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
            target.style.borderTop = '2px solid var(--accent)';
            target.style.borderBottom = '';
        } else {
            target.style.borderBottom = '2px solid var(--accent)';
            target.style.borderTop = '';
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const target = e.target.closest('.entry-item');
    if (target && target !== draggedItem) {
        const draggedUid = parseInt(draggedItem.dataset.uid);
        const targetUid = parseInt(target.dataset.uid);
        
        reorderEntries(draggedUid, targetUid);
    }
    
    clearDragStyles();
}

function handleDragEnd() {
    if (draggedItem) {
        draggedItem.style.opacity = '';
    }
    clearDragStyles();
    draggedItem = null;
}

function clearDragStyles() {
    elements.entryList.querySelectorAll('.entry-item').forEach(item => {
        item.style.borderTop = '';
        item.style.borderBottom = '';
    });
}

function reorderEntries(draggedUid, targetUid) {
    const draggedEntry = state.entries[draggedUid];
    const targetEntry = state.entries[targetUid];
    
    if (!draggedEntry || !targetEntry) return;
    
    // Swap order numbers
    const tempOrder = draggedEntry.order;
    draggedEntry.order = targetEntry.order;
    targetEntry.order = tempOrder;
    
    state.unsavedChanges.add(draggedUid);
    state.unsavedChanges.add(targetUid);
    
    renderEntryList();
    showToast('Entry order updated', 'success');
}

// ========================================
// Entry Management
// ========================================

function openEntry(uid) {
    const entry = state.entries[uid];
    if (!entry) return;
    
    // Add to open tabs if not already open
    if (!state.openTabs.includes(uid)) {
        state.openTabs.push(uid);
    }
    
    state.activeTabId = uid;
    
    // Load entry data into form
    loadEntryToForm(entry);
    
    // Update UI
    elements.welcomeScreen.style.display = 'none';
    elements.entryEditor.style.display = 'block';
    
    renderTabs();
    renderEntryList();
    closeSidebar();
}

function loadEntryToForm(entry) {
    // Basic fields
    elements.entryName.value = entry.comment || '';
    elements.primaryKeywords.value = entry.key?.join(', ') || '';
    elements.secondaryKeywords.value = entry.keysecondary?.join(', ') || '';
    elements.selectiveLogic.value = entry.selectiveLogic || 0;
    elements.entryContent.value = entry.content || '';
    
    // Activation type
    if (entry.disable) {
        document.querySelector('input[name="activationType"][value="disabled"]').checked = true;
    } else if (entry.constant) {
        document.querySelector('input[name="activationType"][value="constant"]').checked = true;
    } else {
        document.querySelector('input[name="activationType"][value="keyword"]').checked = true;
    }
    
    handleActivationTypeChange();
    
    // Position
    elements.insertionPosition.value = entry.position || 0;
    elements.insertionDepth.value = entry.depth || 4;
    elements.insertionRole.value = entry.role ?? 0;
    elements.outletName.value = entry.outletName || '';
    elements.orderNumber.value = entry.order || 0;
    
    handlePositionChange();
    
    // Timing
    elements.probability.value = entry.probability ?? 100;
    document.getElementById('sticky').value = entry.sticky || 0;
    document.getElementById('cooldown').value = entry.cooldown || 0;
    document.getElementById('delay').value = entry.delay || 0;
    
    // Recursion
    document.getElementById('excludeRecursion').checked = entry.excludeRecursion || false;
    document.getElementById('preventRecursion').checked = entry.preventRecursion || false;
    document.getElementById('delayUntilRecursion').checked = !!entry.delayUntilRecursion;
    document.getElementById('ignoreBudget').checked = entry.ignoreBudget || false;
    
    // Group
    document.getElementById('inclusionGroup').value = entry.group || '';
    document.getElementById('groupWeight').value = entry.groupWeight ?? 100;
    document.getElementById('groupOverride').checked = entry.groupOverride || false;
    
    // Overrides
    document.getElementById('scanDepthOverride').value = entry.scanDepth ?? '';
    document.getElementById('caseSensitiveOverride').value = entry.caseSensitive === null ? '' : String(entry.caseSensitive);
    document.getElementById('wholeWordOverride').value = entry.matchWholeWords === null ? '' : String(entry.matchWholeWords);
    document.getElementById('groupScoringOverride').value = entry.useGroupScoring === null ? '' : String(entry.useGroupScoring);
    document.getElementById('automationId').value = entry.automationId || '';
    
    // Character filter
    document.getElementById('characterFilterExclude').checked = entry.characterFilter?.isExclude || false;
    document.getElementById('characterFilterNames').value = entry.characterFilter?.names?.join(', ') || '';
    document.getElementById('characterFilterTags').value = entry.characterFilter?.tags?.join(', ') || '';
    
    // Triggers
    const triggers = entry.triggers || [];
    document.getElementById('triggerNormal').checked = triggers.includes('normal');
    document.getElementById('triggerContinue').checked = triggers.includes('continue');
    document.getElementById('triggerImpersonate').checked = triggers.includes('impersonate');
    document.getElementById('triggerSwipe').checked = triggers.includes('swipe');
    document.getElementById('triggerRegenerate').checked = triggers.includes('regenerate');
    document.getElementById('triggerQuiet').checked = triggers.includes('quiet');
    
    // Matching sources
    document.getElementById('matchPersonaDescription').checked = entry.matchPersonaDescription || false;
    document.getElementById('matchCharacterDescription').checked = entry.matchCharacterDescription || false;
    document.getElementById('matchCharacterPersonality').checked = entry.matchCharacterPersonality || false;
    document.getElementById('matchScenario').checked = entry.matchScenario || false;
    document.getElementById('matchCharacterDepthPrompt').checked = entry.matchCharacterDepthPrompt || false;
    document.getElementById('matchCreatorNotes').checked = entry.matchCreatorNotes || false;
}

function saveCurrentEntry() {
    if (state.activeTabId === null) {
        showToast('No entry selected', 'warning');
        return;
    }
    
    const entry = state.entries[state.activeTabId];
    if (!entry) return;
    
    // Get activation type
    const activationType = document.querySelector('input[name="activationType"]:checked').value;
    
    // Update entry from form
    entry.comment = elements.entryName.value;
    entry.key = elements.primaryKeywords.value.split(',').map(k => k.trim()).filter(k => k);
    entry.keysecondary = elements.secondaryKeywords.value.split(',').map(k => k.trim()).filter(k => k);
    entry.selectiveLogic = parseInt(elements.selectiveLogic.value);
    entry.selective = entry.keysecondary.length > 0;
    entry.content = elements.entryContent.value;
    
    // Activation
    entry.disable = activationType === 'disabled';
    entry.constant = activationType === 'constant';
    
    // Position
    entry.position = parseInt(elements.insertionPosition.value);
    entry.depth = parseInt(elements.insertionDepth.value);
    entry.role = entry.position === 4 ? parseInt(elements.insertionRole.value) : null;
    entry.outletName = elements.outletName.value;
    entry.order = parseInt(elements.orderNumber.value);
    
    // Timing
    entry.probability = parseInt(elements.probability.value);
    entry.useProbability = entry.probability !== 100;
    entry.sticky = parseInt(document.getElementById('sticky').value);
    entry.cooldown = parseInt(document.getElementById('cooldown').value);
    entry.delay = parseInt(document.getElementById('delay').value);
    
    // Recursion
    entry.excludeRecursion = document.getElementById('excludeRecursion').checked;
    entry.preventRecursion = document.getElementById('preventRecursion').checked;
    entry.delayUntilRecursion = document.getElementById('delayUntilRecursion').checked;
    entry.ignoreBudget = document.getElementById('ignoreBudget').checked;
    
    // Group
    entry.group = document.getElementById('inclusionGroup').value;
    entry.groupWeight = parseInt(document.getElementById('groupWeight').value);
    entry.groupOverride = document.getElementById('groupOverride').checked;
    
    // Overrides
    const scanDepth = document.getElementById('scanDepthOverride').value;
    entry.scanDepth = scanDepth === '' ? null : parseInt(scanDepth);
    
    const caseSensitive = document.getElementById('caseSensitiveOverride').value;
    entry.caseSensitive = caseSensitive === '' ? null : caseSensitive === 'true';
    
    const wholeWord = document.getElementById('wholeWordOverride').value;
    entry.matchWholeWords = wholeWord === '' ? null : wholeWord === 'true';
    
    const groupScoring = document.getElementById('groupScoringOverride').value;
    entry.useGroupScoring = groupScoring === '' ? null : groupScoring === 'true';
    
    entry.automationId = document.getElementById('automationId').value;
    
    // Character filter
    entry.characterFilter = {
        isExclude: document.getElementById('characterFilterExclude').checked,
        names: document.getElementById('characterFilterNames').value.split(',').map(n => n.trim()).filter(n => n),
        tags: document.getElementById('characterFilterTags').value.split(',').map(t => t.trim()).filter(t => t)
    };
    
    // Triggers
    entry.triggers = [];
    if (document.getElementById('triggerNormal').checked) entry.triggers.push('normal');
    if (document.getElementById('triggerContinue').checked) entry.triggers.push('continue');
    if (document.getElementById('triggerImpersonate').checked) entry.triggers.push('impersonate');
    if (document.getElementById('triggerSwipe').checked) entry.triggers.push('swipe');
    if (document.getElementById('triggerRegenerate').checked) entry.triggers.push('regenerate');
    if (document.getElementById('triggerQuiet').checked) entry.triggers.push('quiet');
    
    // Matching sources
    entry.matchPersonaDescription = document.getElementById('matchPersonaDescription').checked;
    entry.matchCharacterDescription = document.getElementById('matchCharacterDescription').checked;
    entry.matchCharacterPersonality = document.getElementById('matchCharacterPersonality').checked;
    entry.matchScenario = document.getElementById('matchScenario').checked;
    entry.matchCharacterDepthPrompt = document.getElementById('matchCharacterDepthPrompt').checked;
    entry.matchCreatorNotes = document.getElementById('matchCreatorNotes').checked;
    
    // Clear unsaved status
    state.unsavedChanges.delete(state.activeTabId);
    
    renderTabs();
    renderEntryList();
    showToast('Entry saved', 'success');
}

function createNewEntry() {
    if (!state.lorebook) {
        createNewLorebook();
    }
    
    // Find next available UID
    const existingUids = Object.keys(state.entries).map(Number);
    const maxUid = existingUids.length > 0 ? Math.max(...existingUids) : -1;
    const newUid = maxUid + 1;
    
    // Find next order number
    const orders = Object.values(state.entries).map(e => e.order || 0);
    const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
    
    // Create new entry with defaults
    const newEntry = createDefaultEntry(newUid, maxOrder + 1);
    
    state.entries[newUid] = newEntry;
    state.unsavedChanges.add(newUid);
    
    openEntry(newUid);
    showToast('New entry created', 'success');
}

function createDefaultEntry(uid, order) {
    return {
        uid: uid,
        key: [],
        keysecondary: [],
        comment: `New Entry ${uid}`,
        content: '',
        constant: false,
        vectorized: false,
        selective: false,
        selectiveLogic: 0,
        addMemo: true,
        order: order,
        position: 0,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: false,
        preventRecursion: false,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: false,
        depth: 4,
        outletName: '',
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: '',
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
}

function deleteEntry(uid) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    delete state.entries[uid];
    state.unsavedChanges.delete(uid);
    
    // Close tab if open
    const tabIndex = state.openTabs.indexOf(uid);
    if (tabIndex > -1) {
        state.openTabs.splice(tabIndex, 1);
    }
    
    if (state.activeTabId === uid) {
        state.activeTabId = state.openTabs[0] || null;
        if (state.activeTabId) {
            openEntry(state.activeTabId);
        } else {
            elements.welcomeScreen.style.display = 'flex';
            elements.entryEditor.style.display = 'none';
        }
    }
    
    renderTabs();
    renderEntryList();
    showToast('Entry deleted', 'success');
}

// ========================================
// Tab Management
// ========================================

function renderTabs() {
    if (state.openTabs.length === 0) {
        elements.tabsContainer.classList.remove('has-tabs');
        elements.tabs.innerHTML = '';
        return;
    }
    
    elements.tabsContainer.classList.add('has-tabs');
    
    elements.tabs.innerHTML = state.openTabs.map(uid => {
        const entry = state.entries[uid];
        if (!entry) return '';
        
        const isActive = uid === state.activeTabId;
        const isUnsaved = state.unsavedChanges.has(uid);
        const name = entry.comment || `Entry ${uid}`;
        
        return `
            <button class="tab ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}" 
                    data-uid="${uid}"
                    onclick="openEntry(${uid})">
                <span class="tab-name">${escapeHtml(name)}</span>
                <span class="tab-close" onclick="event.stopPropagation(); closeTab(${uid})">×</span>
            </button>
        `;
    }).join('');
}

function closeTab(uid) {
    if (state.unsavedChanges.has(uid)) {
        if (!confirm('This entry has unsaved changes. Close anyway?')) {
            return;
        }
    }
    
    const tabIndex = state.openTabs.indexOf(uid);
    if (tabIndex > -1) {
        state.openTabs.splice(tabIndex, 1);
    }
    
    state.unsavedChanges.delete(uid);
    
    if (state.activeTabId === uid) {
        // Switch to another tab or show welcome
        if (state.openTabs.length > 0) {
            const newActiveIndex = Math.min(tabIndex, state.openTabs.length - 1);
            openEntry(state.openTabs[newActiveIndex]);
        } else {
            state.activeTabId = null;
            elements.welcomeScreen.style.display = 'flex';
            elements.entryEditor.style.display = 'none';
        }
    }
    
    renderTabs();
    renderEntryList();
}

function markCurrentAsUnsaved() {
    if (state.activeTabId !== null) {
        state.unsavedChanges.add(state.activeTabId);
        renderTabs();
        renderEntryList();
    }
}

// ========================================
// Form Handlers
// ========================================

function handlePositionChange() {
    const position = parseInt(elements.insertionPosition.value);
    
    // Show/hide depth row (for @Depth position)
    elements.depthRow.style.display = position === 4 ? 'flex' : 'none';
    
    // Show/hide outlet row (for Outlet position)
    elements.outletRow.style.display = position === 7 ? 'block' : 'none';
}

function handleActivationTypeChange() {
    const activationType = document.querySelector('input[name="activationType"]:checked').value;
    
    // Show/hide keyword sections based on activation type
    const showKeywords = activationType === 'keyword';
    elements.keywordsSection.style.display = showKeywords ? 'block' : 'none';
    elements.secondaryKeywordsSection.style.display = showKeywords ? 'block' : 'none';
}

// ========================================
// File Import/Export
// ========================================

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            loadLorebook(data, file.name);
            showToast('Lorebook imported successfully', 'success');
        } catch (error) {
            console.error('Import error:', error);
            showToast('Failed to import file: Invalid JSON', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset input for re-import
    e.target.value = '';
}

function loadLorebook(data, fileName) {
    state.lorebook = data;
    state.fileName = fileName;
    state.entries = data.entries || {};
    state.openTabs = [];
    state.activeTabId = null;
    state.unsavedChanges.clear();
    
    elements.fileName.textContent = fileName;
    elements.welcomeScreen.style.display = 'flex';
    elements.entryEditor.style.display = 'none';
    
    renderEntryList();
    renderTabs();
}

function createNewLorebook() {
    state.lorebook = { entries: {} };
    state.fileName = 'New Lorebook.json';
    state.entries = {};
    state.openTabs = [];
    state.activeTabId = null;
    state.unsavedChanges.clear();
    
    elements.fileName.textContent = state.fileName;
    
    renderEntryList();
    renderTabs();
    
    showToast('New lorebook created', 'success');
}

function openExportModal() {
    if (!state.lorebook) {
        showToast('No lorebook to export', 'warning');
        return;
    }
    elements.exportModal.showModal();
}

function closeExportModal() {
    elements.exportModal.close();
}

function exportAsJson() {
    // Rebuild lorebook from state
    const exportData = {
        ...state.lorebook,
        entries: state.entries
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadFile(blob, state.fileName);
    
    closeExportModal();
    showToast('Exported as JSON', 'success');
}

function exportAsTxt() {
    const settings = state.settings;
    let text = '';
    
    const sortedEntries = Object.values(state.entries).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedEntries.forEach(entry => {
        if (settings.exportTitles && entry.comment) {
            text += `=== ${entry.comment} ===\n`;
        }
        if (settings.exportKeywords && entry.key?.length) {
            text += `Keywords: ${entry.key.join(', ')}\n`;
        }
        if (settings.exportComments) {
            text += `Order: ${entry.order || 0}\n`;
        }
        text += `\n${entry.content || ''}\n\n---\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const txtFileName = state.fileName.replace('.json', '.txt');
    downloadFile(blob, txtFileName);
    
    closeExportModal();
    showToast('Exported as TXT', 'success');
}

function downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// Merge Functions
// ========================================

let mergeData = null;

function handleMergeImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!state.lorebook) {
        showToast('Please load or create a lorebook first', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            mergeData = JSON.parse(event.target.result);
            showMergeModal(mergeData);
        } catch (error) {
            console.error('Merge import error:', error);
            showToast('Failed to import file: Invalid JSON', 'error');
        }
    };
    reader.readAsText(file);
    
    e.target.value = '';
}

function showMergeModal(data) {
    const mergeList = document.getElementById('mergeList');
    const entries = data.entries || {};
    
    mergeList.innerHTML = Object.values(entries).map(entry => `
        <div class="merge-item">
            <label>
                <input type="checkbox" value="${entry.uid}" checked>
                <span>${escapeHtml(entry.comment || `Entry ${entry.uid}`)}</span>
            </label>
        </div>
    `).join('');
    
    elements.mergeModal.showModal();
}

function closeMergeModal() {
    elements.mergeModal.close();
    mergeData = null;
}

function mergeSelectAll() {
    document.querySelectorAll('#mergeList input[type="checkbox"]').forEach(cb => cb.checked = true);
}

function mergeSelectNone() {
    document.querySelectorAll('#mergeList input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function mergeConfirm() {
    if (!mergeData) return;
    
    const selectedUids = Array.from(document.querySelectorAll('#mergeList input[type="checkbox"]:checked'))
        .map(cb => parseInt(cb.value));
    
    if (selectedUids.length === 0) {
        showToast('No entries selected', 'warning');
        return;
    }
    
    // Find the next available UID in current lorebook
    const existingUids = Object.keys(state.entries).map(Number);
    let nextUid = existingUids.length > 0 ? Math.max(...existingUids) + 1 : 0;
    
    // Find the next order number
    const orders = Object.values(state.entries).map(e => e.order || 0);
    let nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 1;
    
    // Merge selected entries
    selectedUids.forEach(uid => {
        const sourceEntry = mergeData.entries[uid];
        if (sourceEntry) {
            const newEntry = { ...sourceEntry, uid: nextUid, order: nextOrder };
            state.entries[nextUid] = newEntry;
            state.unsavedChanges.add(nextUid);
            nextUid++;
            nextOrder++;
        }
    });
    
    closeMergeModal();
    renderEntryList();
    showToast(`Merged ${selectedUids.length} entries`, 'success');
}

// ========================================
// Search & Replace
// ========================================

function openSearchModal() {
    elements.searchModal.showModal();
    document.getElementById('searchInput').focus();
}

function closeSearchModal() {
    elements.searchModal.close();
    state.searchResults = [];
    state.currentSearchIndex = 0;
    document.getElementById('searchResults').innerHTML = '';
}

function findAll() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;
    
    const scope = document.getElementById('searchScope').value;
    const caseSensitive = document.getElementById('searchCaseSensitive').checked;
    const wholeWord = document.getElementById('searchWholeWord').checked;
    const useRegex = document.getElementById('searchRegex').checked;
    
    state.searchResults = [];
    
    let searchPattern;
    if (useRegex) {
        try {
            searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
        } catch (e) {
            showToast('Invalid regex pattern', 'error');
            return;
        }
    } else {
        let pattern = escapeRegExp(query);
        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }
        searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    }
    
    Object.values(state.entries).forEach(entry => {
        const fieldsToSearch = getFieldsToSearch(entry, scope);
        
        fieldsToSearch.forEach(({ field, value }) => {
            if (!value) return;
            
            let match;
            searchPattern.lastIndex = 0;
            while ((match = searchPattern.exec(value)) !== null) {
                state.searchResults.push({
                    uid: entry.uid,
                    field: field,
                    index: match.index,
                    match: match[0],
                    entryName: entry.comment || `Entry ${entry.uid}`
                });
            }
        });
    });
    
    renderSearchResults();
}

function getFieldsToSearch(entry, scope) {
    switch (scope) {
        case 'content':
            return [{ field: 'content', value: entry.content }];
        case 'keywords':
            return [
                { field: 'key', value: entry.key?.join(', ') },
                { field: 'keysecondary', value: entry.keysecondary?.join(', ') }
            ];
        case 'names':
            return [{ field: 'comment', value: entry.comment }];
        default:
            return [
                { field: 'content', value: entry.content },
                { field: 'comment', value: entry.comment },
                { field: 'key', value: entry.key?.join(', ') },
                { field: 'keysecondary', value: entry.keysecondary?.join(', ') }
            ];
    }
}

function renderSearchResults() {
    const resultsDiv = document.getElementById('searchResults');
    
    if (state.searchResults.length === 0) {
        resultsDiv.innerHTML = '<p style="color: var(--text-muted)">No results found</p>';
        return;
    }
    
    resultsDiv.innerHTML = `
        <p style="margin-bottom: var(--space-sm)">${state.searchResults.length} results found:</p>
        ${state.searchResults.slice(0, 50).map((result, i) => `
            <div class="search-result" onclick="goToSearchResult(${i})">
                <strong>${escapeHtml(result.entryName)}</strong> - ${result.field}: "...${escapeHtml(result.match)}..."
            </div>
        `).join('')}
        ${state.searchResults.length > 50 ? `<p style="color: var(--text-muted)">...and ${state.searchResults.length - 50} more</p>` : ''}
    `;
}

function goToSearchResult(index) {
    const result = state.searchResults[index];
    if (!result) return;
    
    state.currentSearchIndex = index;
    openEntry(result.uid);
    
    closeSearchModal();
}

function replaceNext() {
    if (state.searchResults.length === 0) {
        findAll();
        if (state.searchResults.length === 0) return;
    }
    
    const replacement = document.getElementById('replaceInput').value;
    const result = state.searchResults[state.currentSearchIndex];
    
    if (!result) return;
    
    const entry = state.entries[result.uid];
    if (!entry) return;
    
    // Perform replacement based on field
    if (result.field === 'content') {
        entry.content = replaceAt(entry.content, result.index, result.match.length, replacement);
    } else if (result.field === 'comment') {
        entry.comment = replaceAt(entry.comment, result.index, result.match.length, replacement);
    } else if (result.field === 'key') {
        const keyStr = entry.key.join(', ');
        entry.key = replaceAt(keyStr, result.index, result.match.length, replacement).split(',').map(k => k.trim());
    } else if (result.field === 'keysecondary') {
        const keyStr = entry.keysecondary.join(', ');
        entry.keysecondary = replaceAt(keyStr, result.index, result.match.length, replacement).split(',').map(k => k.trim());
    }
    
    state.unsavedChanges.add(result.uid);
    
    // Remove this result and move to next
    state.searchResults.splice(state.currentSearchIndex, 1);
    
    if (state.currentSearchIndex >= state.searchResults.length) {
        state.currentSearchIndex = 0;
    }
    
    renderSearchResults();
    
    // Reload entry if it's currently open
    if (state.activeTabId === result.uid) {
        loadEntryToForm(entry);
    }
    
    renderEntryList();
    showToast('Replaced 1 occurrence', 'success');
}

function replaceAll() {
    if (state.searchResults.length === 0) {
        findAll();
        if (state.searchResults.length === 0) return;
    }
    
    const replacement = document.getElementById('replaceInput').value;
    const query = document.getElementById('searchInput').value;
    const caseSensitive = document.getElementById('searchCaseSensitive').checked;
    const wholeWord = document.getElementById('searchWholeWord').checked;
    const useRegex = document.getElementById('searchRegex').checked;
    const scope = document.getElementById('searchScope').value;
    
    let searchPattern;
    if (useRegex) {
        searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } else {
        let pattern = escapeRegExp(query);
        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }
        searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    }
    
    let replaceCount = 0;
    
    Object.values(state.entries).forEach(entry => {
        const fieldsToSearch = getFieldsToSearch(entry, scope);
        
        fieldsToSearch.forEach(({ field }) => {
            if (field === 'content' && entry.content) {
                const newContent = entry.content.replace(searchPattern, replacement);
                if (newContent !== entry.content) {
                    replaceCount += (entry.content.match(searchPattern) || []).length;
                    entry.content = newContent;
                    state.unsavedChanges.add(entry.uid);
                }
            } else if (field === 'comment' && entry.comment) {
                const newComment = entry.comment.replace(searchPattern, replacement);
                if (newComment !== entry.comment) {
                    replaceCount += (entry.comment.match(searchPattern) || []).length;
                    entry.comment = newComment;
                    state.unsavedChanges.add(entry.uid);
                }
            } else if (field === 'key' && entry.key) {
                const keyStr = entry.key.join(', ');
                const newKeyStr = keyStr.replace(searchPattern, replacement);
                if (newKeyStr !== keyStr) {
                    replaceCount += (keyStr.match(searchPattern) || []).length;
                    entry.key = newKeyStr.split(',').map(k => k.trim());
                    state.unsavedChanges.add(entry.uid);
                }
            } else if (field === 'keysecondary' && entry.keysecondary) {
                const keyStr = entry.keysecondary.join(', ');
                const newKeyStr = keyStr.replace(searchPattern, replacement);
                if (newKeyStr !== keyStr) {
                    replaceCount += (keyStr.match(searchPattern) || []).length;
                    entry.keysecondary = newKeyStr.split(',').map(k => k.trim());
                    state.unsavedChanges.add(entry.uid);
                }
            }
        });
    });
    
    state.searchResults = [];
    renderSearchResults();
    
    // Reload current entry if affected
    if (state.activeTabId !== null && state.unsavedChanges.has(state.activeTabId)) {
        loadEntryToForm(state.entries[state.activeTabId]);
    }
    
    renderEntryList();
    showToast(`Replaced ${replaceCount} occurrences`, 'success');
}

function replaceAt(str, index, length, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + length);
}

// ========================================
// Settings
// ========================================

function openSettingsModal() {
    // Update UI to reflect current settings
    document.getElementById('themeLightBtn').classList.toggle('active', state.settings.theme === 'light');
    document.getElementById('themeDarkBtn').classList.toggle('active', state.settings.theme === 'dark');
    document.getElementById('dyslexiaFont').checked = state.settings.dyslexiaFont;
    document.getElementById('exportTitles').checked = state.settings.exportTitles;
    document.getElementById('exportKeywords').checked = state.settings.exportKeywords;
    document.getElementById('exportComments').checked = state.settings.exportComments;
    
    elements.settingsModal.showModal();
}

function closeSettingsModal() {
    // Save export settings
    state.settings.exportTitles = document.getElementById('exportTitles').checked;
    state.settings.exportKeywords = document.getElementById('exportKeywords').checked;
    state.settings.exportComments = document.getElementById('exportComments').checked;
    saveSettings();
    
    elements.settingsModal.close();
}

function setTheme(theme) {
    state.settings.theme = theme;
    applyTheme();
    saveSettings();
    
    document.getElementById('themeLightBtn').classList.toggle('active', theme === 'light');
    document.getElementById('themeDarkBtn').classList.toggle('active', theme === 'dark');
}

function applyTheme() {
    const isDark = state.settings.theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Update logos
    const logoSrc = isDark ? 'SledlogoLight.png' : 'Sledlogo.png';
    elements.headerLogo.src = logoSrc;
    elements.welcomeLogo.src = logoSrc;
    
    // Update theme-color meta
    const themeColor = isDark ? '#1a1815' : '#faf7f2';
    document.querySelector('meta[name="theme-color"]').content = themeColor;
}

function toggleDyslexiaFont(e) {
    state.settings.dyslexiaFont = e.target.checked;
    document.documentElement.setAttribute('data-dyslexia', e.target.checked);
    saveSettings();
}

// ========================================
// Keyboard Shortcuts
// ========================================

function handleKeyboardShortcuts(e) {
    // Ignore if in input field (except for specific shortcuts)
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'i':
                e.preventDefault();
                elements.fileInput.click();
                break;
            case 'e':
                e.preventDefault();
                openExportModal();
                break;
            case 'm':
                e.preventDefault();
                elements.mergeFileInput.click();
                break;
            case 'n':
                e.preventDefault();
                createNewEntry();
                break;
            case 's':
                e.preventDefault();
                saveCurrentEntry();
                break;
            case 'w':
                e.preventDefault();
                if (state.activeTabId !== null) {
                    closeTab(state.activeTabId);
                }
                break;
            case 'h':
                e.preventDefault();
                openSearchModal();
                break;
            case 'd':
                e.preventDefault();
                setTheme(state.settings.theme === 'dark' ? 'light' : 'dark');
                break;
        }
    }
    
    // Tab navigation
    if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (state.openTabs.length > 1) {
            const currentIndex = state.openTabs.indexOf(state.activeTabId);
            const nextIndex = e.shiftKey 
                ? (currentIndex - 1 + state.openTabs.length) % state.openTabs.length
                : (currentIndex + 1) % state.openTabs.length;
            openEntry(state.openTabs[nextIndex]);
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        if (elements.searchModal.open) closeSearchModal();
        if (elements.settingsModal.open) closeSettingsModal();
        if (elements.exportModal.open) closeExportModal();
        if (elements.mergeModal.open) closeMergeModal();
        closeSidebar();
    }
}

// ========================================
// Toast Notifications
// ========================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-symbols-rounded">${getToastIcon(type)}</span>
        <span>${escapeHtml(message)}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check_circle';
        case 'error': return 'error';
        case 'warning': return 'warning';
        default: return 'info';
    }
}

// ========================================
// Utility Functions
// ========================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateUI() {
    elements.sidebar.setAttribute('data-zoom', state.settings.sidebarZoom);
    elements.sidebarZoom.value = state.settings.sidebarZoom;
    
    if (state.settings.dyslexiaFont) {
        document.documentElement.setAttribute('data-dyslexia', 'true');
    }
}

// ========================================
// Service Worker Registration
// ========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('Update available! Refresh to update.', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// ========================================
// Make functions globally accessible
// ========================================

window.openEntry = openEntry;
window.closeTab = closeTab;
window.goToSearchResult = goToSearchResult;
window.deleteEntry = deleteEntry;

// ========================================
// Initialize App
// ========================================

document.addEventListener('DOMContentLoaded', init);

/**
 * SLEd - Simple Lorebook Editor
 * DOM Elements Module
 * 
 * Centralized storage for DOM element references.
 * Elements are initialized once on app load via initElements().
 */

export const elements = {
    // Header
    menuToggle: null,
    fileName: null,
    searchBtn: null,
    settingsBtn: null,
    headerLogo: null,
    
    // Sidebar
    sidebar: null,
    sidebarOverlay: null,
    sidebarSearch: null,
    sidebarZoom: null,
    entryList: null,
    emptyState: null,
    addEntryBtn: null,
    emptyImportBtn: null,
    sidebarClose: null,
    
    // Editor
    tabsContainer: null,
    tabs: null,
    editorContent: null,
    welcomeScreen: null,
    welcomeLogo: null,
    entryEditor: null,
    entryForm: null,
    editorPanel: null,
    
    // Welcome buttons
    importBtn: null,
    newLorebookBtn: null,
    newEntryBtn: null,
    
    // Action bar
    actionImport: null,
    actionExport: null,
    actionMerge: null,
    actionSave: null,
    saveBtn: null,
    deleteBtn: null,
    duplicateBtn: null,
    
    // Modals
    searchModal: null,
    settingsModal: null,
    exportModal: null,
    mergeModal: null,
    
    // File inputs
    fileInput: null,
    mergeFileInput: null,
    
    // Toast
    toastContainer: null,
    
    // Settings
    themeSelect: null,
    fontSelect: null,
    fontSizeInput: null,
    dyslexiaFont: null,
    
    // Form fields - Basic
    entryComment: null,
    entryKeys: null,
    entrySecondaryKeys: null,
    selectiveLogic: null,
    entryContent: null,
    entryEnabled: null,
    entryConstant: null,
    entrySelective: null,
    
    // Form fields - Position
    entryPosition: null,
    entryDepth: null,
    entryRole: null,
    entryOutlet: null,
    entryOrder: null,
    depthRow: null,
    outletRow: null,
    
    // Form fields - Probability & Timing
    entryUseProbability: null,
    entryProbability: null,
    entrySticky: null,
    entryCooldown: null,
    entryDelay: null,
    
    // Form fields - Group
    entryGroup: null,
    entryGroupWeight: null,
    entryGroupOverride: null,
    
    // Form fields - Advanced
    entryScanDepth: null,
    entryCaseSensitive: null,
    entryMatchWholeWords: null,
    entryIgnoreBudget: null,
    entryExcludeRecursion: null,
    entryPreventRecursion: null,
    entryDelayUntilRecursion: null,
    entryAutomationId: null,
    advancedSection: null,
    
    // Sections
    keywordsSection: null,
    secondaryKeywordsSection: null
};

/**
 * Initialize all DOM element references
 * Call this once when the app loads
 */
export function initElements() {
    // Header
    elements.menuToggle = document.getElementById('menuToggle');
    elements.fileName = document.getElementById('fileName');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.headerLogo = document.getElementById('headerLogo');
    
    // Sidebar
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarOverlay = document.getElementById('sidebarOverlay');
    elements.sidebarSearch = document.getElementById('sidebarSearch');
    elements.sidebarZoom = document.getElementById('sidebarZoom');
    elements.entryList = document.getElementById('entryList');
    elements.emptyState = document.getElementById('emptyState');
    elements.addEntryBtn = document.getElementById('addEntryBtn');
    elements.emptyImportBtn = document.getElementById('emptyImportBtn');
    elements.sidebarClose = document.querySelector('.sidebar-close');
    
    // Editor
    elements.tabsContainer = document.getElementById('tabsContainer');
    elements.tabs = document.getElementById('tabs');
    elements.editorContent = document.getElementById('editorContent');
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.welcomeLogo = document.getElementById('welcomeLogo');
    elements.entryEditor = document.getElementById('entryEditor');
    elements.entryForm = document.getElementById('entryForm');
    elements.editorPanel = document.getElementById('entryEditor');
    
    // Welcome buttons
    elements.importBtn = document.getElementById('importBtn');
    elements.newLorebookBtn = document.getElementById('newLorebookBtn');
    elements.newEntryBtn = document.getElementById('addEntryBtn');
    
    // Action bar
    elements.actionImport = document.getElementById('actionImport');
    elements.actionExport = document.getElementById('actionExport');
    elements.actionMerge = document.getElementById('actionMerge');
    elements.actionSave = document.getElementById('actionSave');
    elements.saveBtn = document.getElementById('actionSave');
    
    // Modals
    elements.searchModal = document.getElementById('searchModal');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.exportModal = document.getElementById('exportModal');
    elements.mergeModal = document.getElementById('mergeModal');
    
    // File inputs
    elements.fileInput = document.getElementById('file-input');
    elements.mergeFileInput = document.getElementById('merge-file-input');
    
    // Toast
    elements.toastContainer = document.getElementById('toastContainer');
    
    // Settings
    elements.dyslexiaFont = document.getElementById('dyslexiaFont');
    
    // Form fields - Basic
    elements.entryComment = document.getElementById('entryName');
    elements.entryKeys = document.getElementById('primaryKeywords');
    elements.entrySecondaryKeys = document.getElementById('secondaryKeywords');
    elements.selectiveLogic = document.getElementById('selectiveLogic');
    elements.entryContent = document.getElementById('entryContent');
    
    // Form fields - Position
    elements.entryPosition = document.getElementById('insertionPosition');
    elements.entryDepth = document.getElementById('insertionDepth');
    elements.entryRole = document.getElementById('insertionRole');
    elements.entryOutlet = document.getElementById('outletName');
    elements.entryOrder = document.getElementById('orderNumber');
    elements.depthRow = document.getElementById('depthRow');
    elements.outletRow = document.getElementById('outletRow');
    
    // Form fields - Probability & Timing
    elements.entryProbability = document.getElementById('probability');
    elements.entrySticky = document.getElementById('sticky');
    elements.entryCooldown = document.getElementById('cooldown');
    elements.entryDelay = document.getElementById('delay');
    
    // Form fields - Group
    elements.entryGroup = document.getElementById('inclusionGroup');
    elements.entryGroupWeight = document.getElementById('groupWeight');
    elements.entryGroupOverride = document.getElementById('groupOverride');
    
    // Form fields - Advanced
    elements.entryScanDepth = document.getElementById('scanDepthOverride');
    elements.entryCaseSensitive = document.getElementById('caseSensitiveOverride');
    elements.entryMatchWholeWords = document.getElementById('wholeWordOverride');
    elements.entryIgnoreBudget = document.getElementById('ignoreBudget');
    elements.entryExcludeRecursion = document.getElementById('excludeRecursion');
    elements.entryPreventRecursion = document.getElementById('preventRecursion');
    elements.entryDelayUntilRecursion = document.getElementById('delayUntilRecursion');
    elements.entryAutomationId = document.getElementById('automationId');
    elements.advancedSection = document.getElementById('advancedSection');
    
    // Sections
    elements.keywordsSection = document.getElementById('keywordsSection');
    elements.secondaryKeywordsSection = document.getElementById('secondaryKeywordsSection');
}

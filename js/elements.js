/**
 * SLEd - Simple Lorebook Editor
 * DOM Elements Module
 */

export const elements = {
    // Header
    menuToggle: null,
    fileName: null,
    lorebookName: null,
    entryCount: null,
    searchBtn: null,
    settingsBtn: null,
    helpBtn: null,
    themeToggle: null,
    editorFontToggle: null,
    headerLogo: null,

    // Sidebar
    sidebar: null,
    sidebarOverlay: null,
    sidebarSearch: null,
    sidebarZoom: null,
    sidebarTitle: null,
    entryList: null,
    emptyState: null,
    addEntryBtn: null,
    emptyImportBtn: null,
    sidebarClose: null,
    clearSelectionBtn: null,

    // Editor
    tabsContainer: null,
    tabs: null,
    editorContent: null,
    welcomeScreen: null,
    welcomeLogo: null,
    entryEditor: null,
    entryForm: null,

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

    // Modals
    searchModal: null,
    settingsModal: null,
    exportModal: null,
    exportTextModal: null,
    mergeModal: null,
    helpModal: null,

    // Modal close buttons
    closeSearchModal: null,
    closeSettingsModal: null,
    closeSettingsBtn: null,
    closeExportModal: null,
    closeExportTextModal: null,
    closeExportTextBtn: null,
    closeMergeModal: null,
    closeHelpModal: null,
    performExportTextBtn: null,

    // Text-export options
    txtIncludeTitles: null,
    txtIncludeContent: null,
    txtIncludePrimaryKeys: null,
    txtIncludeSecondaryKeys: null,
    txtIncludeStatus: null,
    txtIncludeComments: null,
    txtIncludeOrder: null,
    txtExportFilename: null,

    // File inputs
    fileInput: null,
    mergeFileInput: null,

    // Toast
    toastContainer: null,

    // Settings - theme toggle buttons
    themeLightBtn: null,
    themeDarkBtn: null,
    dyslexiaFont: null,
    exportTitles: null,
    exportKeywords: null,
    exportComments: null,

    // Export modal buttons
    exportJsonBtn: null,
    exportTxtBtn: null,

    // Merge modal
    mergeSelectAll: null,
    mergeSelectNone: null,
    mergeConfirm: null,
    mergeList: null,

    // Form fields - Basic
    entryComment: null,
    entryKeys: null,
    entrySecondaryKeys: null,
    selectiveLogic: null,
    entryContent: null,

    // Activation radio group
    activationRadios: null,

    // Form fields - Position
    entryPosition: null,
    entryDepth: null,
    entryRole: null,
    entryOutlet: null,
    entryOrder: null,
    depthRow: null,
    outletRow: null,

    // Form fields - Probability & Timing
    entryProbability: null,
    entrySticky: null,
    entryCooldown: null,
    entryDelay: null,

    // Form fields - Group
    entryGroup: null,
    entryGroupWeight: null,
    entryGroupOverride: null,
    entryGroupScoring: null,

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

    // Character filter
    characterFilterExclude: null,
    characterFilterNames: null,
    characterFilterTags: null,

    // Triggers
    triggerCheckboxes: null,

    // Matching sources
    matchPersonaDescription: null,
    matchCharacterDescription: null,
    matchCharacterPersonality: null,
    matchScenario: null,
    matchCharacterDepthPrompt: null,
    matchCreatorNotes: null,

    // Sections
    keywordsSection: null,
    secondaryKeywordsSection: null
};

export function initElements() {
    // Header
    elements.menuToggle = document.getElementById('menuToggle');
    elements.fileName = document.getElementById('fileName');
    elements.lorebookName = document.getElementById('lorebookName');
    elements.entryCount = document.getElementById('entryCount');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.editorFontToggle = document.getElementById('editorFontToggle');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.headerLogo = document.getElementById('headerLogo');

    // Sidebar
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarOverlay = document.getElementById('sidebarOverlay');
    elements.sidebarSearch = document.getElementById('sidebarSearch');
    elements.sidebarZoom = document.getElementById('sidebarZoom');
    elements.sidebarTitle = document.querySelector('.sidebar-title');
    elements.entryList = document.getElementById('entryList');
    elements.emptyState = document.getElementById('emptyState');
    elements.addEntryBtn = document.getElementById('addEntryBtn');
    elements.emptyImportBtn = document.getElementById('emptyImportBtn');
    elements.sidebarClose = document.querySelector('.sidebar-close');
    elements.clearSelectionBtn = document.getElementById('clearSelectionBtn');

    // Editor
    elements.tabsContainer = document.getElementById('tabsContainer');
    elements.tabs = document.getElementById('tabs');
    elements.editorContent = document.getElementById('editorContent');
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.welcomeLogo = document.getElementById('welcomeLogo');
    elements.entryEditor = document.getElementById('entryEditor');
    elements.entryForm = document.getElementById('entryForm');

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
    elements.exportTextModal = document.getElementById('exportTextModal');
    elements.mergeModal = document.getElementById('mergeModal');
    elements.helpModal = document.getElementById('helpModal');

    // Modal close buttons
    elements.closeSearchModal = document.getElementById('closeSearchModal');
    elements.closeSettingsModal = document.getElementById('closeSettingsModal');
    elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    elements.closeExportModal = document.getElementById('closeExportModal');
    elements.closeExportTextModal = document.getElementById('closeExportTextModal');
    elements.closeExportTextBtn = document.getElementById('closeExportTextBtn');
    elements.performExportTextBtn = document.getElementById('performExportTextBtn');
    elements.closeMergeModal = document.getElementById('closeMergeModal');
    elements.closeHelpModal = document.getElementById('closeHelpModal');

    // Text-export options
    elements.txtIncludeTitles = document.getElementById('txtIncludeTitles');
    elements.txtIncludeContent = document.getElementById('txtIncludeContent');
    elements.txtIncludePrimaryKeys = document.getElementById('txtIncludePrimaryKeys');
    elements.txtIncludeSecondaryKeys = document.getElementById('txtIncludeSecondaryKeys');
    elements.txtIncludeStatus = document.getElementById('txtIncludeStatus');
    elements.txtIncludeComments = document.getElementById('txtIncludeComments');
    elements.txtIncludeOrder = document.getElementById('txtIncludeOrder');
    elements.txtExportFilename = document.getElementById('txtExportFilename');

    // File inputs
    elements.fileInput = document.getElementById('file-input');
    elements.mergeFileInput = document.getElementById('merge-file-input');

    // Toast
    elements.toastContainer = document.getElementById('toastContainer');

    // Settings
    elements.themeLightBtn = document.getElementById('themeLightBtn');
    elements.themeDarkBtn = document.getElementById('themeDarkBtn');
    elements.dyslexiaFont = document.getElementById('dyslexiaFont');
    elements.exportTitles = document.getElementById('exportTitles');
    elements.exportKeywords = document.getElementById('exportKeywords');
    elements.exportComments = document.getElementById('exportComments');

    // Export modal buttons
    elements.exportJsonBtn = document.getElementById('exportJson');
    elements.exportTxtBtn = document.getElementById('exportTxt');

    // Merge modal
    elements.mergeSelectAll = document.getElementById('mergeSelectAll');
    elements.mergeSelectNone = document.getElementById('mergeSelectNone');
    elements.mergeConfirm = document.getElementById('mergeConfirm');
    elements.mergeList = document.getElementById('mergeList');

    // Form fields - Basic
    elements.entryComment = document.getElementById('entryName');
    elements.entryKeys = document.getElementById('primaryKeywords');
    elements.entrySecondaryKeys = document.getElementById('secondaryKeywords');
    elements.selectiveLogic = document.getElementById('selectiveLogic');
    elements.entryContent = document.getElementById('entryContent');

    // Activation radio group
    elements.activationRadios = document.querySelectorAll('input[name="activationType"]');

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
    elements.entryGroupScoring = document.getElementById('groupScoringOverride');

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

    // Character filter
    elements.characterFilterExclude = document.getElementById('characterFilterExclude');
    elements.characterFilterNames = document.getElementById('characterFilterNames');
    elements.characterFilterTags = document.getElementById('characterFilterTags');

    // Triggers
    elements.triggerCheckboxes = document.querySelectorAll('input[data-trigger]');

    // Matching sources
    elements.matchPersonaDescription = document.getElementById('matchPersonaDescription');
    elements.matchCharacterDescription = document.getElementById('matchCharacterDescription');
    elements.matchCharacterPersonality = document.getElementById('matchCharacterPersonality');
    elements.matchScenario = document.getElementById('matchScenario');
    elements.matchCharacterDepthPrompt = document.getElementById('matchCharacterDepthPrompt');
    elements.matchCreatorNotes = document.getElementById('matchCreatorNotes');

    // Sections
    elements.keywordsSection = document.getElementById('keywordsSection');
    elements.secondaryKeywordsSection = document.getElementById('secondaryKeywordsSection');
}

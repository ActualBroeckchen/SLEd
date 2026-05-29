/**
 * SLEd - Simple Lorebook Editor
 * DOM Elements Module
 *
 * The entry form was moved out of index.html into js/form-template.js so
 * we can render multiple forms side-by-side. This module only caches
 * elements that exist statically in index.html.
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
    sideBySideToggle: null,
    editorContent: null,
    welcomeScreen: null,
    welcomeLogo: null,
    entryEditor: null, // container for per-uid entry forms

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

    // Settings
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
    mergeList: null
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
    elements.sideBySideToggle = document.getElementById('sideBySideToggle');
    elements.editorContent = document.getElementById('editorContent');
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.welcomeLogo = document.getElementById('welcomeLogo');
    elements.entryEditor = document.getElementById('entryEditor');

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
    elements.dyslexiaFont = document.getElementById('dyslexiaFont');
    elements.exportTitles = document.getElementById('exportTitles');
    elements.exportKeywords = document.getElementById('exportKeywords');
    elements.exportComments = document.getElementById('exportComments');
    elements.themeLightBtn = document.getElementById('themeLightBtn');
    elements.themeDarkBtn = document.getElementById('themeDarkBtn');

    // Export modal buttons
    elements.exportJsonBtn = document.getElementById('exportJson');
    elements.exportTxtBtn = document.getElementById('exportTxt');

    // Merge modal
    elements.mergeSelectAll = document.getElementById('mergeSelectAll');
    elements.mergeSelectNone = document.getElementById('mergeSelectNone');
    elements.mergeConfirm = document.getElementById('mergeConfirm');
    elements.mergeList = document.getElementById('mergeList');
}

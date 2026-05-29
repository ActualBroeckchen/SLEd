/**
 * SLEd - Simple Lorebook Editor
 * DOM Elements Module
 *
 * The entry form was moved out of index.html into js/form-template.js so
 * we can render multiple forms side-by-side. This module only caches
 * statically-present elements that JS actually reads as `elements.foo`.
 * Elements that are only addressed by string id (e.g. document.getElementById
 * in openModal / showToast / renderMergeList) intentionally don't appear
 * here.
 */

export const elements = {
    // Header
    menuToggle: null,
    lorebookName: null,
    entryCount: null,
    searchBtn: null,
    settingsBtn: null,
    helpBtn: null,
    themeToggle: null,
    editorFontToggle: null,

    // Sidebar
    sidebar: null,
    sidebarOverlay: null,
    sidebarSearch: null,
    sidebarZoom: null,
    entryList: null,
    addEntryBtn: null,
    sidebarClose: null,
    clearSelectionBtn: null,

    // Editor
    tabsContainer: null,
    tabs: null,
    sideBySideToggle: null,
    welcomeScreen: null,
    entryEditor: null,

    // Welcome buttons
    importBtn: null,
    newLorebookBtn: null,

    // Action bar
    actionImport: null,
    actionExport: null,
    actionMerge: null,
    actionSave: null,

    performExportTextBtn: null,

    // Text-export options (read by computed-key lookup `elements[name]`)
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
    mergeConfirm: null
};

export function initElements() {
    // Header
    elements.menuToggle = document.getElementById('menuToggle');
    elements.lorebookName = document.getElementById('lorebookName');
    elements.entryCount = document.getElementById('entryCount');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.editorFontToggle = document.getElementById('editorFontToggle');
    elements.settingsBtn = document.getElementById('settingsBtn');

    // Sidebar
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarOverlay = document.getElementById('sidebarOverlay');
    elements.sidebarSearch = document.getElementById('sidebarSearch');
    elements.sidebarZoom = document.getElementById('sidebarZoom');
    elements.entryList = document.getElementById('entryList');
    elements.addEntryBtn = document.getElementById('addEntryBtn');
    elements.sidebarClose = document.querySelector('.sidebar-close');
    elements.clearSelectionBtn = document.getElementById('clearSelectionBtn');

    // Editor
    elements.tabsContainer = document.getElementById('tabsContainer');
    elements.tabs = document.getElementById('tabs');
    elements.sideBySideToggle = document.getElementById('sideBySideToggle');
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.entryEditor = document.getElementById('entryEditor');

    // Welcome buttons
    elements.importBtn = document.getElementById('importBtn');
    elements.newLorebookBtn = document.getElementById('newLorebookBtn');

    // Action bar
    elements.actionImport = document.getElementById('actionImport');
    elements.actionExport = document.getElementById('actionExport');
    elements.actionMerge = document.getElementById('actionMerge');
    elements.actionSave = document.getElementById('actionSave');

    elements.performExportTextBtn = document.getElementById('performExportTextBtn');

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
}

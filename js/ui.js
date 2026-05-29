/**
 * SLEd - Simple Lorebook Editor
 * UI Functions Module (Theme, Modals, Toasts, Form helpers)
 */

import { state, markEntryUnsaved } from './state.js';
import { elements } from './elements.js';
import { debounce } from './utils.js';
import {
    buildEntryFormHtml,
    field,
    activationRadios,
    triggerCheckboxes,
    setKeywordPills,
    getKeywordValues,
    wireKeywordPillInput
} from './form-template.js';

/* ---------- Theme & Font ---------- */

export function applyTheme() {
    const theme = state.settings.theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('.material-symbols-rounded');
        if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        elements.themeToggle.title = theme === 'dark'
            ? 'Switch to light mode (Ctrl+D)'
            : 'Switch to dark mode (Ctrl+D)';
    }
    // Keep the mobile address bar / PWA chrome in sync with the theme
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#1a1815' : '#faf7f2');
    }
}

export function applyEditorFont() {
    const font = state.settings.editorFont || 'mono';
    document.documentElement.setAttribute('data-editor-font', font);
    if (elements.editorFontToggle) {
        const labels = { mono: 'Monospace', sans: 'Sans-serif', serif: 'Serif' };
        const next = { mono: 'sans', sans: 'serif', serif: 'mono' };
        elements.editorFontToggle.title = `Editor font: ${labels[font]} (click for ${labels[next[font]]})`;
    }
}

export function applyDyslexiaFont() {
    if (state.settings.dyslexiaFont) {
        document.documentElement.setAttribute('data-dyslexia', 'true');
    } else {
        document.documentElement.removeAttribute('data-dyslexia');
    }
    if (elements.dyslexiaFont) {
        elements.dyslexiaFont.checked = !!state.settings.dyslexiaFont;
    }
}

export function applySidebarZoom() {
    if (elements.sidebar) {
        elements.sidebar.setAttribute('data-zoom', state.settings.sidebarZoom || 'normal');
    }
    if (elements.sidebarZoom) {
        elements.sidebarZoom.value = state.settings.sidebarZoom || 'normal';
    }
}

export function applyAllSettings() {
    applyTheme();
    applyDyslexiaFont();
    applyEditorFont();
    applySidebarZoom();
}

/* ---------- Sidebar (mobile drawer) ---------- */

export function toggleSidebar() {
    if (!elements.sidebar) return;
    const isOpen = elements.sidebar.classList.toggle('open');
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.toggle('visible', isOpen);
    }
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

export function closeSidebar() {
    if (!elements.sidebar) return;
    elements.sidebar.classList.remove('open');
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('visible');
    document.body.style.overflow = '';
}

/* ---------- Modals (native <dialog>) ---------- */

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.showModal === 'function' && !modal.open) {
        modal.showModal();
    } else {
        modal.setAttribute('open', '');
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) {
        modal.close();
    } else {
        modal.removeAttribute('open');
    }
}

export function closeAllModals() {
    document.querySelectorAll('dialog.modal[open]').forEach(modal => {
        if (typeof modal.close === 'function') {
            modal.close();
        } else {
            modal.removeAttribute('open');
        }
    });
}

/* ---------- Toast ---------- */

export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';

    toast.innerHTML = `
        <span class="material-symbols-rounded">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger reflow for animation
    void toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ---------- Header / Sidebar header ---------- */

export function updateSidebarHeader() {
    const hasData = !!state.lorebookData;
    const name = hasData
        ? (state.lorebookData.name || state.fileName.replace(/\.json$/i, '') || 'Untitled')
        : '';
    const count = hasData && state.lorebookData.entries
        ? Object.keys(state.lorebookData.entries).length
        : 0;

    if (elements.lorebookName) {
        // Don't overwrite the user's in-progress typing
        if (document.activeElement !== elements.lorebookName) {
            elements.lorebookName.value = name;
        }
        elements.lorebookName.disabled = !hasData;
        elements.lorebookName.placeholder = hasData ? 'Lorebook name' : 'No file loaded';
    }
    if (elements.entryCount) {
        elements.entryCount.textContent = hasData
            ? `· ${count} ${count === 1 ? 'entry' : 'entries'}`
            : '';
    }
}

/* ---------- Editor / Welcome ---------- */

export function showWelcome() {
    if (elements.welcomeScreen) elements.welcomeScreen.style.display = '';
    if (elements.entryEditor) elements.entryEditor.style.display = 'none';
}

export function showEditor() {
    if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'none';
    if (elements.entryEditor) elements.entryEditor.style.display = '';
}

/* ---------- Activation type ---------- */

function getActivationType(entry) {
    if (entry.disable) return 'disabled';
    if (entry.constant) return 'constant';
    return 'keyword';
}

function applyActivationType(data, activationType) {
    switch (activationType) {
        case 'keyword':
            data.disable = false;
            data.constant = false;
            break;
        case 'constant':
            data.disable = false;
            data.constant = true;
            break;
        case 'disabled':
            data.disable = true;
            data.constant = false;
            break;
    }
}

/* ---------- Position row toggles ---------- */

export function updatePositionRowVisibility(uid) {
    if (uid === undefined || uid === null) return;
    const position = field('insertionPosition', uid);
    const depth = field('depthRow', uid);
    const outlet = field('outletRow', uid);
    const v = position ? parseInt(position.value, 10) : 0;
    if (depth) depth.style.display = v === 4 ? '' : 'none';
    if (outlet) outlet.style.display = v === 7 ? '' : 'none';
}

/* ---------- Form populate/read (uid-scoped) ---------- */

function setRadioGroup(radios, value) {
    if (!radios) return;
    radios.forEach(r => { r.checked = r.value === value; });
}

function readRadioGroup(radios, fallback) {
    if (!radios) return fallback;
    for (const r of radios) {
        if (r.checked) return r.value;
    }
    return fallback;
}

/**
 * Fill the per-uid form with values from `entry`.
 */
export function populateForm(uid, entry) {
    if (uid === undefined || uid === null || !entry) return;
    const form = document.getElementById(`entryForm_${uid}`);
    if (!form) return;
    const set = (base, value) => {
        const el = field(base, uid);
        if (el) el.value = value;
    };
    const check = (base, value) => {
        const el = field(base, uid);
        if (el) el.checked = !!value;
    };

    // Basic
    set('entryName', entry.comment || '');
    setKeywordPills(uid, 'primaryKeywords', entry.key || []);
    setKeywordPills(uid, 'secondaryKeywords', entry.keysecondary || []);
    set('selectiveLogic', entry.selectiveLogic ?? 0);
    set('entryContent', entry.content || '');

    // Activation
    setRadioGroup(activationRadios(uid), getActivationType(entry));

    // Position
    set('insertionPosition', entry.position ?? 0);
    set('insertionDepth', entry.depth ?? 4);
    set('insertionRole', entry.role ?? 0);
    set('outletName', entry.outletName || '');
    set('orderNumber', entry.order ?? 100);
    updatePositionRowVisibility(uid);

    // Timing
    set('probability', entry.probability ?? 100);
    set('sticky', entry.sticky ?? 0);
    set('cooldown', entry.cooldown ?? 0);
    set('delay', entry.delay ?? 0);

    // Recursion
    check('excludeRecursion', entry.excludeRecursion);
    check('preventRecursion', entry.preventRecursion);
    check('delayUntilRecursion', entry.delayUntilRecursion);
    check('ignoreBudget', entry.ignoreBudget);

    // Group
    set('inclusionGroup', entry.group || '');
    set('groupWeight', entry.groupWeight ?? 100);
    check('groupOverride', entry.groupOverride);

    // Overrides
    set('scanDepthOverride', entry.scanDepth ?? '');
    set('caseSensitiveOverride',
        entry.caseSensitive === null || entry.caseSensitive === undefined
            ? '' : String(entry.caseSensitive));
    set('wholeWordOverride',
        entry.matchWholeWords === null || entry.matchWholeWords === undefined
            ? '' : String(entry.matchWholeWords));
    set('groupScoringOverride',
        entry.useGroupScoring === null || entry.useGroupScoring === undefined
            ? '' : String(entry.useGroupScoring));
    set('automationId', entry.automationId || '');

    // Character filter
    const cf = entry.characterFilter || { isExclude: false, names: [], tags: [] };
    check('characterFilterExclude', cf.isExclude);
    set('characterFilterNames', (cf.names || []).join(', '));
    set('characterFilterTags', (cf.tags || []).join(', '));

    // Triggers
    const triggers = entry.triggers || [];
    triggerCheckboxes(uid).forEach(cb => {
        cb.checked = triggers.includes(cb.dataset.trigger);
    });

    // Matching sources
    check('matchPersonaDescription', entry.matchPersonaDescription);
    check('matchCharacterDescription', entry.matchCharacterDescription);
    check('matchCharacterPersonality', entry.matchCharacterPersonality);
    check('matchScenario', entry.matchScenario);
    check('matchCharacterDepthPrompt', entry.matchCharacterDepthPrompt);
    check('matchCreatorNotes', entry.matchCreatorNotes);
}

function parseNullableBool(value) {
    if (value === '' || value === null || value === undefined) return null;
    return value === 'true' || value === true;
}

function parseNullableInt(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
}

function splitCsv(value) {
    return (value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Read values from the per-uid form into a partial entry object.
 */
export function getFormData(uid) {
    if (uid === undefined || uid === null) return {};
    const form = document.getElementById(`entryForm_${uid}`);
    if (!form) return {};
    const v = base => {
        const el = field(base, uid);
        return el ? el.value : undefined;
    };
    const c = base => {
        const el = field(base, uid);
        return el ? !!el.checked : false;
    };

    const data = {};

    // Basic
    if (v('entryName') !== undefined) data.comment = v('entryName');
    data.key = getKeywordValues(uid, 'primaryKeywords');
    data.keysecondary = getKeywordValues(uid, 'secondaryKeywords');
    if (v('selectiveLogic') !== undefined) data.selectiveLogic = parseInt(v('selectiveLogic'), 10) || 0;
    if (v('entryContent') !== undefined) data.content = v('entryContent');

    // Activation
    applyActivationType(data, readRadioGroup(activationRadios(uid), 'keyword'));

    // Position
    if (v('insertionPosition') !== undefined) data.position = parseInt(v('insertionPosition'), 10) || 0;
    if (v('insertionDepth') !== undefined) data.depth = parseInt(v('insertionDepth'), 10) || 0;
    if (v('insertionRole') !== undefined) data.role = parseInt(v('insertionRole'), 10) || 0;
    if (v('outletName') !== undefined) data.outletName = v('outletName');
    if (v('orderNumber') !== undefined) data.order = parseInt(v('orderNumber'), 10) || 0;

    // Timing
    if (v('probability') !== undefined) data.probability = parseInt(v('probability'), 10) || 0;
    if (v('sticky') !== undefined) data.sticky = parseInt(v('sticky'), 10) || 0;
    if (v('cooldown') !== undefined) data.cooldown = parseInt(v('cooldown'), 10) || 0;
    if (v('delay') !== undefined) data.delay = parseInt(v('delay'), 10) || 0;

    // Recursion
    data.excludeRecursion = c('excludeRecursion');
    data.preventRecursion = c('preventRecursion');
    data.delayUntilRecursion = c('delayUntilRecursion');
    data.ignoreBudget = c('ignoreBudget');

    // Group
    if (v('inclusionGroup') !== undefined) data.group = v('inclusionGroup');
    if (v('groupWeight') !== undefined) data.groupWeight = parseInt(v('groupWeight'), 10) || 0;
    data.groupOverride = c('groupOverride');

    // Overrides
    if (v('scanDepthOverride') !== undefined) data.scanDepth = parseNullableInt(v('scanDepthOverride'));
    if (v('caseSensitiveOverride') !== undefined) data.caseSensitive = parseNullableBool(v('caseSensitiveOverride'));
    if (v('wholeWordOverride') !== undefined) data.matchWholeWords = parseNullableBool(v('wholeWordOverride'));
    if (v('groupScoringOverride') !== undefined) data.useGroupScoring = parseNullableBool(v('groupScoringOverride'));
    if (v('automationId') !== undefined) data.automationId = v('automationId');

    // Character filter
    data.characterFilter = {
        isExclude: c('characterFilterExclude'),
        names: splitCsv(v('characterFilterNames') || ''),
        tags: splitCsv(v('characterFilterTags') || '')
    };

    // Triggers
    data.triggers = [];
    triggerCheckboxes(uid).forEach(cb => {
        if (cb.checked) data.triggers.push(cb.dataset.trigger);
    });

    // Matching sources
    data.matchPersonaDescription = c('matchPersonaDescription');
    data.matchCharacterDescription = c('matchCharacterDescription');
    data.matchCharacterPersonality = c('matchCharacterPersonality');
    data.matchScenario = c('matchScenario');
    data.matchCharacterDepthPrompt = c('matchCharacterDepthPrompt');
    data.matchCreatorNotes = c('matchCreatorNotes');

    return data;
}

export function clearForm() {
    if (elements.entryEditor) elements.entryEditor.innerHTML = '';
}

/* ---------- Editor: multiple-form rendering ---------- */

/**
 * Sync the editor container's forms with state.openTabs:
 *   - Add a form for any new tab.
 *   - Remove forms for any tab that's been closed.
 *   - Mark the current entry's form as active.
 */
export function renderEditorForms() {
    const container = elements.entryEditor;
    if (!container) return;

    const tabUids = new Set(state.openTabs.map(t => t.uid));

    // Drop forms whose tab is gone
    container.querySelectorAll('.entry-form').forEach(formEl => {
        const uid = parseInt(formEl.dataset.uid, 10);
        if (!tabUids.has(uid)) formEl.remove();
    });

    // Add forms for any new tabs (preserve open-tabs order)
    state.openTabs.forEach(tab => {
        if (!document.getElementById(`entryForm_${tab.uid}`)) {
            container.insertAdjacentHTML('beforeend', buildEntryFormHtml(tab.uid));
            const entry = state.lorebookData?.entries[tab.uid];
            if (entry) populateForm(tab.uid, entry);
            attachFormListeners(tab.uid);
        }
    });

    // Active class
    container.querySelectorAll('.entry-form').forEach(formEl => {
        const uid = parseInt(formEl.dataset.uid, 10);
        formEl.classList.toggle('active', uid === state.currentEntryUid);
    });

    applyEditorView();
}

/**
 * Wire form events (auto-save, position-row toggle) for one entry form.
 */
function attachFormListeners(uid) {
    const form = document.getElementById(`entryForm_${uid}`);
    if (!form) return;

    const positionSelect = field('insertionPosition', uid);
    if (positionSelect) {
        positionSelect.addEventListener('change', () => updatePositionRowVisibility(uid));
    }

    // Wire keyword pill containers (Enter, comma, Backspace, paste, ×, blur)
    form.querySelectorAll('.keyword-pill-input').forEach(wireKeywordPillInput);

    const autoSave = debounce(() => {
        if (!state.lorebookData?.entries) return;
        const entry = state.lorebookData.entries[uid];
        if (!entry) return;
        Object.assign(entry, getFormData(uid));
        markEntryUnsaved(uid);
        // Re-render sidebar so the new name / status / pills update
        import('./sidebar.js').then(({ renderSidebar }) => renderSidebar());
        // Refresh the tab title
        import('./tabs.js').then(({ updateTabTitle, renderTabs }) => {
            updateTabTitle(uid, entry.comment || `Entry ${uid}`);
            renderTabs();
        });
    }, 500);

    form.addEventListener('input', autoSave);
    form.addEventListener('change', autoSave);
}

/**
 * Apply data-view to the editor based on settings.sideBySide.
 * On single view, only the active form is shown.
 */
export function applyEditorView() {
    const container = elements.entryEditor;
    if (!container) return;
    const view = state.settings.sideBySide ? 'side-by-side' : 'single';
    container.setAttribute('data-view', view);
    if (elements.sideBySideToggle) {
        elements.sideBySideToggle.classList.toggle('active', state.settings.sideBySide);
        elements.sideBySideToggle.title = state.settings.sideBySide
            ? 'Switch to single view'
            : 'Switch to side-by-side view';
    }
}

export function toggleEditorView() {
    state.settings.sideBySide = !state.settings.sideBySide;
    applyEditorView();
}

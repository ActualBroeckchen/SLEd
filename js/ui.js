/**
 * SLEd - Simple Lorebook Editor
 * UI Functions Module (Theme, Modals, Toasts, Form helpers)
 */

import { state } from './state.js';
import { elements } from './elements.js';

/* ---------- Theme & Font ---------- */

export function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    if (elements.themeLightBtn) {
        elements.themeLightBtn.classList.toggle('active', state.settings.theme === 'light');
    }
    if (elements.themeDarkBtn) {
        elements.themeDarkBtn.classList.toggle('active', state.settings.theme === 'dark');
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

export function applyExportPrefs() {
    if (elements.exportTitles) elements.exportTitles.checked = !!state.settings.exportTitles;
    if (elements.exportKeywords) elements.exportKeywords.checked = !!state.settings.exportKeywords;
    if (elements.exportComments) elements.exportComments.checked = !!state.settings.exportComments;
}

export function applyAllSettings() {
    applyTheme();
    applyDyslexiaFont();
    applySidebarZoom();
    applyExportPrefs();
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

export function openSidebar() {
    if (!elements.sidebar) return;
    elements.sidebar.classList.add('open');
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add('visible');
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
    // Legacy fileName span (kept as a fallback if present)
    if (elements.fileName) {
        elements.fileName.textContent = hasData
            ? `${name} · ${count} ${count === 1 ? 'entry' : 'entries'}`
            : 'No file loaded';
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

/* ---------- Advanced section (uses native <details>) ---------- */

export function toggleAdvancedSettings() {
    if (elements.advancedSection) {
        elements.advancedSection.open = !elements.advancedSection.open;
    }
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

export function updatePositionRowVisibility() {
    const positionValue = elements.entryPosition ? parseInt(elements.entryPosition.value, 10) : 0;
    if (elements.depthRow) {
        elements.depthRow.style.display = positionValue === 4 ? '' : 'none';
    }
    if (elements.outletRow) {
        elements.outletRow.style.display = positionValue === 7 ? '' : 'none';
    }
}

/* ---------- Form populate/read ---------- */

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

export function populateForm(entry) {
    if (!entry || !elements.entryForm) return;

    // Basic
    if (elements.entryComment) elements.entryComment.value = entry.comment || '';
    if (elements.entryKeys) elements.entryKeys.value = (entry.key || []).join(', ');
    if (elements.entrySecondaryKeys) elements.entrySecondaryKeys.value = (entry.keysecondary || []).join(', ');
    if (elements.selectiveLogic) elements.selectiveLogic.value = entry.selectiveLogic ?? 0;
    if (elements.entryContent) elements.entryContent.value = entry.content || '';

    // Activation
    setRadioGroup(elements.activationRadios, getActivationType(entry));

    // Position
    if (elements.entryPosition) elements.entryPosition.value = entry.position ?? 0;
    if (elements.entryDepth) elements.entryDepth.value = entry.depth ?? 4;
    if (elements.entryRole) elements.entryRole.value = entry.role ?? 0;
    if (elements.entryOutlet) elements.entryOutlet.value = entry.outletName || '';
    if (elements.entryOrder) elements.entryOrder.value = entry.order ?? 100;
    updatePositionRowVisibility();

    // Probability & timing
    if (elements.entryProbability) elements.entryProbability.value = entry.probability ?? 100;
    if (elements.entrySticky) elements.entrySticky.value = entry.sticky ?? 0;
    if (elements.entryCooldown) elements.entryCooldown.value = entry.cooldown ?? 0;
    if (elements.entryDelay) elements.entryDelay.value = entry.delay ?? 0;

    // Recursion
    if (elements.entryExcludeRecursion) elements.entryExcludeRecursion.checked = !!entry.excludeRecursion;
    if (elements.entryPreventRecursion) elements.entryPreventRecursion.checked = !!entry.preventRecursion;
    if (elements.entryDelayUntilRecursion) elements.entryDelayUntilRecursion.checked = !!entry.delayUntilRecursion;
    if (elements.entryIgnoreBudget) elements.entryIgnoreBudget.checked = !!entry.ignoreBudget;

    // Group
    if (elements.entryGroup) elements.entryGroup.value = entry.group || '';
    if (elements.entryGroupWeight) elements.entryGroupWeight.value = entry.groupWeight ?? 100;
    if (elements.entryGroupOverride) elements.entryGroupOverride.checked = !!entry.groupOverride;

    // Overrides
    if (elements.entryScanDepth) elements.entryScanDepth.value = entry.scanDepth ?? '';
    if (elements.entryCaseSensitive) {
        elements.entryCaseSensitive.value = entry.caseSensitive === null || entry.caseSensitive === undefined
            ? '' : String(entry.caseSensitive);
    }
    if (elements.entryMatchWholeWords) {
        elements.entryMatchWholeWords.value = entry.matchWholeWords === null || entry.matchWholeWords === undefined
            ? '' : String(entry.matchWholeWords);
    }
    if (elements.entryGroupScoring) {
        elements.entryGroupScoring.value = entry.useGroupScoring === null || entry.useGroupScoring === undefined
            ? '' : String(entry.useGroupScoring);
    }
    if (elements.entryAutomationId) elements.entryAutomationId.value = entry.automationId || '';

    // Character filter
    const cf = entry.characterFilter || { isExclude: false, names: [], tags: [] };
    if (elements.characterFilterExclude) elements.characterFilterExclude.checked = !!cf.isExclude;
    if (elements.characterFilterNames) elements.characterFilterNames.value = (cf.names || []).join(', ');
    if (elements.characterFilterTags) elements.characterFilterTags.value = (cf.tags || []).join(', ');

    // Triggers
    if (elements.triggerCheckboxes) {
        const triggers = entry.triggers || [];
        elements.triggerCheckboxes.forEach(cb => {
            cb.checked = triggers.includes(cb.dataset.trigger);
        });
    }

    // Matching sources
    if (elements.matchPersonaDescription) elements.matchPersonaDescription.checked = !!entry.matchPersonaDescription;
    if (elements.matchCharacterDescription) elements.matchCharacterDescription.checked = !!entry.matchCharacterDescription;
    if (elements.matchCharacterPersonality) elements.matchCharacterPersonality.checked = !!entry.matchCharacterPersonality;
    if (elements.matchScenario) elements.matchScenario.checked = !!entry.matchScenario;
    if (elements.matchCharacterDepthPrompt) elements.matchCharacterDepthPrompt.checked = !!entry.matchCharacterDepthPrompt;
    if (elements.matchCreatorNotes) elements.matchCreatorNotes.checked = !!entry.matchCreatorNotes;
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

export function getFormData() {
    const data = {};

    // Basic
    if (elements.entryComment) data.comment = elements.entryComment.value;
    if (elements.entryKeys) data.key = splitCsv(elements.entryKeys.value);
    if (elements.entrySecondaryKeys) data.keysecondary = splitCsv(elements.entrySecondaryKeys.value);
    if (elements.selectiveLogic) data.selectiveLogic = parseInt(elements.selectiveLogic.value, 10) || 0;
    if (elements.entryContent) data.content = elements.entryContent.value;

    // Activation
    const activation = readRadioGroup(elements.activationRadios, 'keyword');
    applyActivationType(data, activation);

    // Position
    if (elements.entryPosition) data.position = parseInt(elements.entryPosition.value, 10) || 0;
    if (elements.entryDepth) data.depth = parseInt(elements.entryDepth.value, 10) || 0;
    if (elements.entryRole) data.role = parseInt(elements.entryRole.value, 10) || 0;
    if (elements.entryOutlet) data.outletName = elements.entryOutlet.value;
    if (elements.entryOrder) data.order = parseInt(elements.entryOrder.value, 10) || 0;

    // Probability & timing
    if (elements.entryProbability) data.probability = parseInt(elements.entryProbability.value, 10) || 0;
    if (elements.entrySticky) data.sticky = parseInt(elements.entrySticky.value, 10) || 0;
    if (elements.entryCooldown) data.cooldown = parseInt(elements.entryCooldown.value, 10) || 0;
    if (elements.entryDelay) data.delay = parseInt(elements.entryDelay.value, 10) || 0;

    // Recursion
    if (elements.entryExcludeRecursion) data.excludeRecursion = elements.entryExcludeRecursion.checked;
    if (elements.entryPreventRecursion) data.preventRecursion = elements.entryPreventRecursion.checked;
    if (elements.entryDelayUntilRecursion) data.delayUntilRecursion = elements.entryDelayUntilRecursion.checked;
    if (elements.entryIgnoreBudget) data.ignoreBudget = elements.entryIgnoreBudget.checked;

    // Group
    if (elements.entryGroup) data.group = elements.entryGroup.value;
    if (elements.entryGroupWeight) data.groupWeight = parseInt(elements.entryGroupWeight.value, 10) || 0;
    if (elements.entryGroupOverride) data.groupOverride = elements.entryGroupOverride.checked;

    // Overrides
    if (elements.entryScanDepth) data.scanDepth = parseNullableInt(elements.entryScanDepth.value);
    if (elements.entryCaseSensitive) data.caseSensitive = parseNullableBool(elements.entryCaseSensitive.value);
    if (elements.entryMatchWholeWords) data.matchWholeWords = parseNullableBool(elements.entryMatchWholeWords.value);
    if (elements.entryGroupScoring) data.useGroupScoring = parseNullableBool(elements.entryGroupScoring.value);
    if (elements.entryAutomationId) data.automationId = elements.entryAutomationId.value;

    // Character filter
    data.characterFilter = {
        isExclude: elements.characterFilterExclude ? elements.characterFilterExclude.checked : false,
        names: elements.characterFilterNames ? splitCsv(elements.characterFilterNames.value) : [],
        tags: elements.characterFilterTags ? splitCsv(elements.characterFilterTags.value) : []
    };

    // Triggers
    if (elements.triggerCheckboxes) {
        data.triggers = [];
        elements.triggerCheckboxes.forEach(cb => {
            if (cb.checked) data.triggers.push(cb.dataset.trigger);
        });
    }

    // Matching sources
    if (elements.matchPersonaDescription) data.matchPersonaDescription = elements.matchPersonaDescription.checked;
    if (elements.matchCharacterDescription) data.matchCharacterDescription = elements.matchCharacterDescription.checked;
    if (elements.matchCharacterPersonality) data.matchCharacterPersonality = elements.matchCharacterPersonality.checked;
    if (elements.matchScenario) data.matchScenario = elements.matchScenario.checked;
    if (elements.matchCharacterDepthPrompt) data.matchCharacterDepthPrompt = elements.matchCharacterDepthPrompt.checked;
    if (elements.matchCreatorNotes) data.matchCreatorNotes = elements.matchCreatorNotes.checked;

    return data;
}

export function clearForm() {
    if (elements.entryForm) {
        elements.entryForm.reset();
    }
    updatePositionRowVisibility();
}

/**
 * SLEd - Simple Lorebook Editor
 * UI Functions Module (Theme, Modals, Toasts, Settings)
 */

import { state, saveSettings } from './state.js';
import { elements } from './elements.js';

/**
 * Apply the current theme
 */
export function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    if (elements.themeSelect) {
        elements.themeSelect.value = state.settings.theme;
    }
}

/**
 * Apply the current font
 */
export function applyFont() {
    document.documentElement.setAttribute('data-font', state.settings.font);
    if (elements.fontSelect) {
        elements.fontSelect.value = state.settings.font;
    }
}

/**
 * Apply the current font size
 */
export function applyFontSize() {
    document.documentElement.style.fontSize = state.settings.fontSize + 'px';
    if (elements.fontSizeInput) {
        elements.fontSizeInput.value = state.settings.fontSize;
    }
}

/**
 * Apply all settings
 */
export function applyAllSettings() {
    applyTheme();
    applyFont();
    applyFontSize();
}

/**
 * Toggle the sidebar
 */
export function toggleSidebar() {
    if (!elements.sidebar || !elements.sidebarOverlay) return;
    
    const isOpen = elements.sidebar.classList.toggle('open');
    elements.sidebarOverlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

/**
 * Close the sidebar
 */
export function closeSidebar() {
    if (!elements.sidebar || !elements.sidebarOverlay) return;
    
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Open a modal by ID
 * @param {string} modalId - ID of the modal to open
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close a modal by ID
 * @param {string} modalId - ID of the modal to close
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Close all open modals
 */
export function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (info, success, error)
 * @param {number} duration - Duration in milliseconds
 */
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
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Update the sidebar header with lorebook info
 */
export function updateSidebarHeader() {
    if (!state.lorebookData) return;
    
    const nameElement = document.querySelector('.lorebook-name');
    const countElement = document.querySelector('.entry-count');
    
    if (nameElement) {
        nameElement.textContent = state.lorebookData.name || 'Untitled Lorebook';
    }
    if (countElement) {
        const count = state.lorebookData.entries ? Object.keys(state.lorebookData.entries).length : 0;
        countElement.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
    }
}

/**
 * Toggle the advanced settings section
 */
export function toggleAdvancedSettings() {
    const section = elements.advancedSection;
    if (!section) return;
    
    const isCollapsed = section.classList.toggle('collapsed');
    const toggle = section.querySelector('.section-toggle');
    if (toggle) {
        toggle.textContent = isCollapsed ? 'expand_more' : 'expand_less';
    }
}

/**
 * Update form field values based on entry data
 * @param {Object} entry - Entry data to populate form with
 */
export function populateForm(entry) {
    if (!entry) return;
    
    // Basic fields
    if (elements.entryComment) elements.entryComment.value = entry.comment || '';
    if (elements.entryKeys) elements.entryKeys.value = (entry.key || []).join(', ');
    if (elements.entryContent) elements.entryContent.value = entry.content || '';
    if (elements.entrySecondaryKeys) elements.entrySecondaryKeys.value = (entry.keysecondary || []).join(', ');
    
    // Settings
    if (elements.entryEnabled) elements.entryEnabled.checked = !entry.disable;
    if (elements.entryConstant) elements.entryConstant.checked = entry.constant || false;
    if (elements.entrySelective) elements.entrySelective.checked = entry.selective || false;
    if (elements.selectiveLogic) elements.selectiveLogic.value = entry.selectiveLogic || 0;
    if (elements.entryPosition) elements.entryPosition.value = entry.position || 0;
    if (elements.entryOrder) elements.entryOrder.value = entry.order || 0;
    if (elements.entryDepth) elements.entryDepth.value = entry.depth || 4;
    
    // Probability
    if (elements.entryUseProbability) elements.entryUseProbability.checked = entry.useProbability || false;
    if (elements.entryProbability) elements.entryProbability.value = entry.probability || 100;
    
    // Group settings
    if (elements.entryGroup) elements.entryGroup.value = entry.group || '';
    if (elements.entryGroupWeight) elements.entryGroupWeight.value = entry.groupWeight || 100;
    if (elements.entryGroupOverride) elements.entryGroupOverride.checked = entry.groupOverride || false;
    
    // Advanced settings
    if (elements.entryScanDepth) elements.entryScanDepth.value = entry.scanDepth ?? '';
    if (elements.entryCaseSensitive) elements.entryCaseSensitive.checked = entry.caseSensitive || false;
    if (elements.entryMatchWholeWords) elements.entryMatchWholeWords.checked = entry.matchWholeWords || false;
    if (elements.entryIgnoreBudget) elements.entryIgnoreBudget.checked = entry.ignoreBudget || false;
    if (elements.entryExcludeRecursion) elements.entryExcludeRecursion.checked = entry.excludeRecursion || false;
    if (elements.entryPreventRecursion) elements.entryPreventRecursion.checked = entry.preventRecursion || false;
    if (elements.entryDelayUntilRecursion) elements.entryDelayUntilRecursion.checked = entry.delayUntilRecursion || false;
    
    // Role
    if (elements.entryRole) elements.entryRole.value = entry.role ?? '';
    
    // Sticky/Cooldown/Delay
    if (elements.entrySticky) elements.entrySticky.value = entry.sticky || 0;
    if (elements.entryCooldown) elements.entryCooldown.value = entry.cooldown || 0;
    if (elements.entryDelay) elements.entryDelay.value = entry.delay || 0;
    
    // Automation
    if (elements.entryAutomationId) elements.entryAutomationId.value = entry.automationId || '';
    
    // Outlet
    if (elements.entryOutlet) elements.entryOutlet.value = entry.outletName || '';
}

/**
 * Get form field values as an entry object
 * @returns {Object} Entry data from form
 */
export function getFormData() {
    const data = {};
    
    // Basic fields
    if (elements.entryComment) data.comment = elements.entryComment.value;
    if (elements.entryKeys) {
        data.key = elements.entryKeys.value.split(',').map(k => k.trim()).filter(k => k);
    }
    if (elements.entryContent) data.content = elements.entryContent.value;
    if (elements.entrySecondaryKeys) {
        data.keysecondary = elements.entrySecondaryKeys.value.split(',').map(k => k.trim()).filter(k => k);
    }
    
    // Settings
    if (elements.entryEnabled) data.disable = !elements.entryEnabled.checked;
    if (elements.entryConstant) data.constant = elements.entryConstant.checked;
    if (elements.entrySelective) data.selective = elements.entrySelective.checked;
    if (elements.selectiveLogic) data.selectiveLogic = parseInt(elements.selectiveLogic.value) || 0;
    if (elements.entryPosition) data.position = parseInt(elements.entryPosition.value) || 0;
    if (elements.entryOrder) data.order = parseInt(elements.entryOrder.value) || 0;
    if (elements.entryDepth) data.depth = parseInt(elements.entryDepth.value) || 4;
    
    // Probability
    if (elements.entryUseProbability) data.useProbability = elements.entryUseProbability.checked;
    if (elements.entryProbability) data.probability = parseInt(elements.entryProbability.value) || 100;
    
    // Group settings
    if (elements.entryGroup) data.group = elements.entryGroup.value;
    if (elements.entryGroupWeight) data.groupWeight = parseInt(elements.entryGroupWeight.value) || 100;
    if (elements.entryGroupOverride) data.groupOverride = elements.entryGroupOverride.checked;
    
    // Advanced settings
    if (elements.entryScanDepth) {
        const val = elements.entryScanDepth.value;
        data.scanDepth = val === '' ? null : parseInt(val);
    }
    if (elements.entryCaseSensitive) data.caseSensitive = elements.entryCaseSensitive.checked;
    if (elements.entryMatchWholeWords) data.matchWholeWords = elements.entryMatchWholeWords.checked;
    if (elements.entryIgnoreBudget) data.ignoreBudget = elements.entryIgnoreBudget.checked;
    if (elements.entryExcludeRecursion) data.excludeRecursion = elements.entryExcludeRecursion.checked;
    if (elements.entryPreventRecursion) data.preventRecursion = elements.entryPreventRecursion.checked;
    if (elements.entryDelayUntilRecursion) data.delayUntilRecursion = elements.entryDelayUntilRecursion.checked;
    
    // Role
    if (elements.entryRole) {
        const val = elements.entryRole.value;
        data.role = val === '' ? null : parseInt(val);
    }
    
    // Sticky/Cooldown/Delay
    if (elements.entrySticky) data.sticky = parseInt(elements.entrySticky.value) || 0;
    if (elements.entryCooldown) data.cooldown = parseInt(elements.entryCooldown.value) || 0;
    if (elements.entryDelay) data.delay = parseInt(elements.entryDelay.value) || 0;
    
    // Automation
    if (elements.entryAutomationId) data.automationId = elements.entryAutomationId.value;
    
    // Outlet
    if (elements.entryOutlet) data.outletName = elements.entryOutlet.value;
    
    return data;
}

/**
 * Clear the entry form
 */
export function clearForm() {
    if (elements.entryForm) {
        elements.entryForm.reset();
    }
}

/**
 * Show the welcome screen
 */
export function showWelcome() {
    if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'flex';
    if (elements.editorPanel) elements.editorPanel.style.display = 'none';
}

/**
 * Show the editor panel
 */
export function showEditor() {
    if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'none';
    if (elements.editorPanel) elements.editorPanel.style.display = 'flex';
}

/**
 * SLEd - Simple Lorebook Editor
 * Tab Management Module
 */

import { state } from './state.js';
import { elements } from './elements.js';
import { escapeHtml } from './utils.js';
import { populateForm, clearForm, showWelcome, showEditor } from './ui.js';

/**
 * Render all tabs
 */
export function renderTabs() {
    if (!elements.tabsContainer) return;
    
    elements.tabsContainer.innerHTML = state.openTabs.map(tab => `
        <div class="tab ${tab.uid === state.currentEntryUid ? 'active' : ''}" data-uid="${tab.uid}">
            <span class="tab-title">${escapeHtml(tab.title)}</span>
            <button class="tab-close" aria-label="Close tab">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    `).join('');
    
    // Add event listeners
    elements.tabsContainer.querySelectorAll('.tab').forEach(tabEl => {
        const uid = parseInt(tabEl.dataset.uid);
        
        tabEl.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                switchToTab(uid);
            }
        });
        
        tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(uid);
        });
    });
}

/**
 * Add a new tab
 * @param {number} uid - Entry UID
 * @param {string} title - Tab title
 */
export function addTab(uid, title) {
    // Check if tab already exists
    if (state.openTabs.some(t => t.uid === uid)) {
        switchToTab(uid);
        return;
    }
    
    state.openTabs.push({ uid, title });
    state.currentEntryUid = uid;
    
    renderTabs();
    showEditor();
}

/**
 * Switch to a tab
 * @param {number} uid - Entry UID to switch to
 */
export function switchToTab(uid) {
    const tab = state.openTabs.find(t => t.uid === uid);
    if (!tab) return;
    
    // Save current entry before switching
    // This is handled by the main module to avoid circular deps
    
    state.currentEntryUid = uid;
    
    // Load entry data
    const entry = state.lorebookData?.entries[uid];
    if (entry) {
        populateForm(entry);
    }
    
    renderTabs();
    
    // Update sidebar selection
    document.querySelectorAll('.entry-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    const item = document.querySelector(`.entry-item[data-uid="${uid}"]`);
    if (item) {
        item.classList.add('selected');
    }
}

/**
 * Close a tab
 * @param {number} uid - Entry UID of tab to close
 */
export function closeTab(uid) {
    const index = state.openTabs.findIndex(t => t.uid === uid);
    if (index === -1) return;
    
    state.openTabs.splice(index, 1);
    
    // If closing current tab, switch to another
    if (state.currentEntryUid === uid) {
        if (state.openTabs.length > 0) {
            // Switch to previous tab, or next if closing first
            const newIndex = Math.max(0, index - 1);
            switchToTab(state.openTabs[newIndex].uid);
        } else {
            // No tabs left
            state.currentEntryUid = null;
            clearForm();
            showWelcome();
        }
    }
    
    renderTabs();
}

/**
 * Close all tabs
 */
export function closeAllTabs() {
    state.openTabs = [];
    state.currentEntryUid = null;
    clearForm();
    showWelcome();
    renderTabs();
}

/**
 * Update a tab's title
 * @param {number} uid - Entry UID
 * @param {string} title - New title
 */
export function updateTabTitle(uid, title) {
    const tab = state.openTabs.find(t => t.uid === uid);
    if (tab) {
        tab.title = title;
        renderTabs();
    }
}

/**
 * Get the currently active tab
 * @returns {Object|null} Active tab or null
 */
export function getActiveTab() {
    return state.openTabs.find(t => t.uid === state.currentEntryUid) || null;
}

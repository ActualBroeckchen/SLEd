/**
 * SLEd - Simple Lorebook Editor
 * Tab Management Module
 */

import { state, scheduleSave } from './state.js';
import { elements } from './elements.js';
import { escapeHtml } from './utils.js';
import { clearForm, showWelcome, showEditor, renderEditorForms } from './ui.js';

/**
 * Render all tabs
 */
export function renderTabs() {
    if (!elements.tabs) return;

    elements.tabs.innerHTML = state.openTabs.map(tab => {
        const isActive = tab.uid === state.currentEntryUid;
        const isUnsaved = state.unsavedEntries.has(tab.uid);
        return `
        <div class="tab ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}" data-uid="${tab.uid}">
            <span class="tab-name">${escapeHtml(tab.title)}</span>
            <button class="tab-close" aria-label="Close tab">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        `;
    }).join('');

    if (elements.tabsContainer) {
        elements.tabsContainer.classList.toggle('has-tabs', state.openTabs.length > 0);
    }

    // Add event listeners
    elements.tabs.querySelectorAll('.tab').forEach(tabEl => {
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
    scheduleSave();

    renderTabs();
    renderEditorForms();
    showEditor();
}

/**
 * Switch to a tab
 * @param {number} uid - Entry UID to switch to
 */
export function switchToTab(uid) {
    const tab = state.openTabs.find(t => t.uid === uid);
    if (!tab) return;

    state.currentEntryUid = uid;
    scheduleSave();

    renderTabs();
    renderEditorForms();

    // In side-by-side mode, scroll the active form into view
    const form = document.getElementById(`entryForm_${uid}`);
    if (form) form.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });

    // Update sidebar selection to match the active entry
    document.querySelectorAll('.entry-item.active').forEach(el => {
        el.classList.remove('active');
    });
    const item = document.querySelector(`.entry-item[data-uid="${uid}"]`);
    if (item) {
        item.classList.add('active');
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
    scheduleSave();

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
    renderEditorForms();
}

/**
 * Close all tabs
 */
export function closeAllTabs() {
    state.openTabs = [];
    state.currentEntryUid = null;
    scheduleSave();
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


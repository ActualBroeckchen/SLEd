/**
 * SLEd - Simple Lorebook Editor
 * Entry Management Module
 */

import { state, markEntryUnsaved, scheduleSave } from './state.js';
import { createDefaultEntry } from './utils.js';
import {
    populateForm,
    getFormData,
    showToast,
    updateSidebarHeader,
    showEditor,
    renderEditorForms
} from './ui.js';
import { addTab, switchToTab, closeTab, updateTabTitle } from './tabs.js';
import { renderSidebar } from './sidebar.js';

/**
 * Get the next available UID
 * @returns {number} Next available UID
 */
export function getNextUid() {
    if (!state.lorebookData?.entries) return 0;
    
    const uids = Object.keys(state.lorebookData.entries).map(k => parseInt(k));
    if (uids.length === 0) return 0;
    
    return Math.max(...uids) + 1;
}

/**
 * Get the next order number
 * @returns {number} Next order number
 */
export function getNextOrder() {
    if (!state.lorebookData?.entries) return 0;
    
    const orders = Object.values(state.lorebookData.entries).map(e => e.order || 0);
    if (orders.length === 0) return 0;
    
    return Math.max(...orders) + 1;
}

/**
 * Create a new entry
 * @returns {Object} The newly created entry
 */
export function createEntry() {
    if (!state.lorebookData) {
        showToast('No lorebook loaded', 'error');
        return null;
    }
    
    const uid = getNextUid();
    const order = getNextOrder();
    const entry = createDefaultEntry(uid, order);

    state.lorebookData.entries[uid] = entry;
    markEntryUnsaved(uid);

    renderSidebar();
    updateSidebarHeader();
    openEntry(uid);

    showToast('Entry created', 'success');
    return entry;
}

/**
 * Open an entry for editing
 * @param {number} uid - Entry UID to open
 */
export function openEntry(uid) {
    const entry = state.lorebookData?.entries[uid];
    if (!entry) {
        showToast('Entry not found', 'error');
        return;
    }
    
    // Check if already open in a tab
    const existingTab = state.openTabs.find(t => t.uid === uid);
    if (existingTab) {
        switchToTab(uid);
        return;
    }
    
    // Add new tab (also sets currentEntryUid and calls showEditor)
    addTab(uid, entry.comment || `Entry ${uid}`);

    // Build/refresh the per-uid form and reveal the editor
    renderEditorForms();
    showEditor();

    // Update sidebar selection / sidebar (to mark .active)
    renderSidebar();
}

/**
 * Save the current entry — commits the form to memory and clears the
 * "unsaved" indicator for this entry.
 */
export function saveCurrentEntry() {
    if (state.currentEntryUid === null) return;

    const uid = state.currentEntryUid;
    const entry = state.lorebookData?.entries[uid];
    if (!entry) return;

    const formData = getFormData(uid);
    Object.assign(entry, formData);

    state.unsavedEntries.delete(uid);
    state.hasUnsavedChanges = state.unsavedEntries.size > 0;
    scheduleSave();

    updateTabTitle(state.currentEntryUid, entry.comment || `Entry ${state.currentEntryUid}`);
    renderSidebar();

    showToast('Entry saved', 'success');
}

/**
 * Insert a new entry just above the target (in order).
 */
export function insertEntryAbove(targetUid) {
    if (!state.lorebookData?.entries) return;
    const target = state.lorebookData.entries[targetUid];
    if (!target) return;

    const insertOrder = target.order ?? 0;
    Object.values(state.lorebookData.entries).forEach(e => {
        if ((e.order ?? 0) >= insertOrder) e.order = (e.order ?? 0) + 1;
    });

    const uid = getNextUid();
    const entry = createDefaultEntry(uid, insertOrder);
    state.lorebookData.entries[uid] = entry;
    markEntryUnsaved(uid);

    renderSidebar();
    updateSidebarHeader();
    openEntry(uid);
}

/**
 * Insert a new entry just below the target (in order).
 */
export function insertEntryBelow(targetUid) {
    if (!state.lorebookData?.entries) return;
    const target = state.lorebookData.entries[targetUid];
    if (!target) return;

    const targetOrder = target.order ?? 0;
    Object.values(state.lorebookData.entries).forEach(e => {
        if ((e.order ?? 0) > targetOrder) e.order = (e.order ?? 0) + 1;
    });

    const uid = getNextUid();
    const entry = createDefaultEntry(uid, targetOrder + 1);
    state.lorebookData.entries[uid] = entry;
    markEntryUnsaved(uid);

    renderSidebar();
    updateSidebarHeader();
    openEntry(uid);
}

/**
 * Move an entry one slot up (delta = -1) or down (delta = +1) in the
 * order-sorted list, swapping with its neighbour. No-op at the ends.
 */
export function moveEntry(uid, delta) {
    if (!state.lorebookData?.entries) return;
    const entries = Object.values(state.lorebookData.entries)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = entries.findIndex(e => e.uid === uid);
    if (idx === -1) return;
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= entries.length) return;

    const a = entries[idx];
    const b = entries[swapIdx];
    [a.order, b.order] = [b.order, a.order];

    markEntryUnsaved(a.uid);
    markEntryUnsaved(b.uid);
    renderSidebar();
}

/**
 * Change an entry's order (move it within the list) without renaming UIDs.
 * Pulls the entry out and re-inserts at the target order, shifting others.
 */
export function setEntryOrder(uid, newOrder) {
    if (!state.lorebookData?.entries) return;
    const entry = state.lorebookData.entries[uid];
    if (!entry) return;
    const oldOrder = entry.order ?? 0;
    if (newOrder === oldOrder) return;

    Object.values(state.lorebookData.entries).forEach(e => {
        if (e.uid === uid) return;
        const o = e.order ?? 0;
        if (oldOrder < newOrder && o > oldOrder && o <= newOrder) {
            e.order = o - 1;
        } else if (oldOrder > newOrder && o >= newOrder && o < oldOrder) {
            e.order = o + 1;
        }
    });
    entry.order = newOrder;
    markEntryUnsaved(uid);
    renderSidebar();
}

/**
 * Delete an entry
 * @param {number} uid - Entry UID to delete
 */
export function deleteEntry(uid) {
    if (!state.lorebookData?.entries[uid]) {
        showToast('Entry not found', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    // Remove entry
    delete state.lorebookData.entries[uid];
    state.unsavedEntries.delete(uid);
    state.selectedEntries.delete(uid);
    state.hasUnsavedChanges = true;
    scheduleSave();

    // Close tab if open
    closeTab(uid);
    
    // Update UI
    renderSidebar();
    updateSidebarHeader();
    
    showToast('Entry deleted', 'success');
}

/**
 * Duplicate an entry
 * @param {number} uid - Entry UID to duplicate
 * @returns {Object|null} The duplicated entry or null
 */
export function duplicateEntry(uid) {
    const originalEntry = state.lorebookData?.entries[uid];
    if (!originalEntry) {
        showToast('Entry not found', 'error');
        return null;
    }
    
    const newUid = getNextUid();
    const newEntry = JSON.parse(JSON.stringify(originalEntry));

    newEntry.uid = newUid;
    newEntry.displayIndex = newUid;
    newEntry.comment = (newEntry.comment || '') + ' (copy)';

    // Place the copy right after the source in order
    const srcOrder = originalEntry.order ?? 0;
    Object.values(state.lorebookData.entries).forEach(e => {
        if ((e.order ?? 0) > srcOrder) e.order = (e.order ?? 0) + 1;
    });
    newEntry.order = srcOrder + 1;

    state.lorebookData.entries[newUid] = newEntry;
    markEntryUnsaved(newUid);
    
    renderSidebar();
    updateSidebarHeader();
    openEntry(newUid);
    
    showToast('Entry duplicated', 'success');
    return newEntry;
}

/**
 * Toggle entry enabled/disabled state
 * @param {number} uid - Entry UID
 */
export function toggleEntryEnabled(uid) {
    const entry = state.lorebookData?.entries[uid];
    if (!entry) return;
    
    entry.disable = !entry.disable;
    markEntryUnsaved(uid);

    // Update form if this is the current entry
    populateForm(uid, entry);

    renderSidebar();
}


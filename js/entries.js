/**
 * SLEd - Simple Lorebook Editor
 * Entry Management Module
 */

import { state, markEntryUnsaved, scheduleSave, getLorebookConfig } from './state.js';
import { createDefaultEntry } from './utils.js';
import {
    populateForm,
    getFormData,
    showToast,
    updateSidebarHeader,
    showEditor,
    renderEditorForms
} from './ui.js';

/**
 * Sidebar reorder operations (drag, arrow, inline-edit) change entry.order
 * (and sometimes entry.uid) without going through the entry form. So we
 * persist with scheduleSave directly instead of markEntryUnsaved — the
 * orange dot is for "the form has typed-in changes not yet committed to
 * state", which doesn't apply here. Setting the dot would also tempt the
 * user to click Save, which would clobber the new order with whatever the
 * (now stale) Order Number field in the form still shows.
 *
 * After the state change, refresh the Order Number field on any open form
 * whose uid was affected, so the form stays in sync without clobbering
 * whatever input the user happens to have focused.
 */
export function persistReorder() {
    if (!state.lorebookData?.entries) return;
    for (const tab of state.openTabs) {
        const entry = state.lorebookData.entries[tab.uid];
        if (!entry) continue;
        const field = document.getElementById('orderNumber_' + tab.uid);
        if (field && document.activeElement !== field) {
            field.value = entry.order ?? 0;
        }
    }
    state.hasUnsavedChanges = state.unsavedEntries.size > 0;
    scheduleSave();
}
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
 * If auto-sync is on, renumber every entry's UID and Order to match
 * its sort position. UID = sortIdx (0-based, matches ST convention).
 * Order = baseline + sortIdx * step. Updates open-tab UIDs and other
 * state references via a rename map so the editor stays in sync.
 *
 * No-op when auto-sync is off. Always returns a rename map (possibly empty).
 */
export function reseqAll() {
    if (!state.lorebookData?.entries) return new Map();
    const cfg = getLorebookConfig();
    const renames = new Map();
    if (!cfg.autoSyncOrder) return renames;

    const sorted = Object.values(state.lorebookData.entries)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const next = {};
    sorted.forEach((entry, idx) => {
        const newUid = idx;
        const newOrder = (cfg.orderBaseline ?? 1) + idx * (cfg.orderStep ?? 1);
        if (entry.uid !== newUid) renames.set(entry.uid, newUid);
        entry.uid = newUid;
        entry.displayIndex = newUid;
        entry.order = newOrder;
        next[newUid] = entry;
    });
    state.lorebookData.entries = next;

    if (renames.size === 0) return renames;

    // Remap state references that point at the renamed UIDs.
    const remap = uid => (renames.has(uid) ? renames.get(uid) : uid);
    state.openTabs = state.openTabs.map(t => ({ ...t, uid: remap(t.uid) }));
    if (state.currentEntryUid !== null) {
        state.currentEntryUid = remap(state.currentEntryUid);
    }
    state.unsavedEntries = new Set([...state.unsavedEntries].map(remap));
    state.selectedEntries = new Set([...state.selectedEntries].map(remap));

    // Per-uid form IDs are now stale; rebuild the open forms.
    renderEditorForms();
    return renames;
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

    const renames = reseqAll();
    const finalUid = renames.get(uid) ?? uid;
    renderSidebar();
    updateSidebarHeader();
    openEntry(finalUid);
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

    const renames = reseqAll();
    const finalUid = renames.get(uid) ?? uid;
    renderSidebar();
    updateSidebarHeader();
    openEntry(finalUid);
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

    reseqAll();
    persistReorder();
    renderSidebar();
}

/**
 * Rename an entry's UID. If the target UID is already taken, swap with the
 * occupant. With auto-sync on, reseqAll() runs afterwards and re-normalises
 * everything by position anyway, so the only durable effect of this in
 * auto-sync mode is moving the entry to that sort slot (since UID drives
 * sort idx via the reseq). In manual mode (auto-sync off) the renamed UID
 * sticks.
 */
export function setEntryUid(uid, newUid) {
    if (!state.lorebookData?.entries) return;
    if (uid === newUid) return;
    const entry = state.lorebookData.entries[uid];
    if (!entry) return;

    const dict = state.lorebookData.entries;
    const occupant = dict[newUid];
    if (occupant) {
        // Swap: move occupant aside to the source uid.
        occupant.uid = uid;
        occupant.displayIndex = uid;
        dict[uid] = occupant;
    } else {
        delete dict[uid];
    }
    entry.uid = newUid;
    entry.displayIndex = newUid;
    dict[newUid] = entry;

    // Remap open-tab references.
    const remap = id => (id === uid ? newUid : (occupant && id === newUid ? uid : id));
    state.openTabs = state.openTabs.map(t => ({ ...t, uid: remap(t.uid) }));
    if (state.currentEntryUid !== null) state.currentEntryUid = remap(state.currentEntryUid);
    state.unsavedEntries = new Set([...state.unsavedEntries].map(remap));
    state.selectedEntries = new Set([...state.selectedEntries].map(remap));

    reseqAll();
    renderEditorForms();
    persistReorder();
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
    reseqAll();
    persistReorder();
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
    
    // Remove entry — capture its order first so we can close the gap.
    const gapOrder = state.lorebookData.entries[uid].order ?? 0;
    delete state.lorebookData.entries[uid];
    state.unsavedEntries.delete(uid);
    state.selectedEntries.delete(uid);
    state.hasUnsavedChanges = state.unsavedEntries.size > 0;
    scheduleSave();

    // Close tab if open
    closeTab(uid);

    // Compress orders so neighbouring entries fill the gap. This always
    // runs (independent of auto-sync) so the sidebar list stays
    // contiguous after a delete. reseqAll() below will then re-normalise
    // to baseline + step if auto-sync is on.
    Object.values(state.lorebookData.entries).forEach(e => {
        if ((e.order ?? 0) > gapOrder) e.order = (e.order ?? 0) - 1;
    });

    reseqAll();
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

    const renames = reseqAll();
    const finalUid = renames.get(newUid) ?? newUid;
    renderSidebar();
    updateSidebarHeader();
    openEntry(finalUid);

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


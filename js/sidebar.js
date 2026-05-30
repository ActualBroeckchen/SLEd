/**
 * SLEd - Simple Lorebook Editor
 * Sidebar Module
 */

import { state } from './state.js';
import { elements } from './elements.js';
import { escapeHtml, getStatusIcon } from './utils.js';

/**
 * Get filtered and sorted entries
 */
export function getFilteredEntries() {
    if (!state.lorebookData?.entries) return [];

    let entries = Object.values(state.lorebookData.entries);

    if (state.filterText) {
        const filterLower = state.filterText.toLowerCase();
        entries = entries.filter(entry => {
            const comment = (entry.comment || '').toLowerCase();
            const keys = (entry.key || []).join(' ').toLowerCase();
            const content = (entry.content || '').toLowerCase();
            const group = (entry.group || '').toLowerCase();
            return comment.includes(filterLower)
                || keys.includes(filterLower)
                || content.includes(filterLower)
                || group.includes(filterLower);
        });
    }

    entries.sort((a, b) => (a.order || 0) - (b.order || 0));
    return entries;
}

/**
 * Render the sidebar entry list
 */
export function renderSidebar() {
    if (!elements.entryList) return;

    const entries = getFilteredEntries();
    updateClearSelectionBtn();

    if (entries.length === 0) {
        if (!state.lorebookData) {
            elements.entryList.innerHTML = `
                <div class="empty-state" id="emptyState">
                    <span class="material-symbols-rounded">folder_open</span>
                    <p>No lorebook loaded</p>
                    <button class="btn primary" id="emptyImportBtn">Import Lorebook</button>
                </div>
            `;
            const btn = document.getElementById('emptyImportBtn');
            if (btn) {
                btn.addEventListener('click', () => {
                    const input = document.getElementById('file-input');
                    if (input) input.click();
                });
            }
        } else {
            elements.entryList.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">search_off</span>
                    <p>${state.filterText ? 'No entries match your filter' : 'No entries yet'}</p>
                </div>
            `;
        }
        return;
    }

    const zoom = state.settings.sidebarZoom || 'normal';
    const maxPillKeys = zoom === 'detailed' ? 8 : 3;

    elements.entryList.innerHTML = entries.map(entry => {
        const isActive = entry.uid === state.currentEntryUid;
        const isSelected = state.selectedEntries.has(entry.uid);
        const isUnsaved = state.unsavedEntries.has(entry.uid);
        const statusIcon = getStatusIcon(entry);
        const keys = entry.key || [];
        const order = entry.order ?? 0;

        const visibleKeys = keys.slice(0, maxPillKeys);
        const moreCount = Math.max(0, keys.length - maxPillKeys);
        const pillsHtml = visibleKeys
            .map(k => `<span class="entry-keyword-pill">${escapeHtml(k)}</span>`)
            .join('') + (moreCount ? `<span class="entry-keyword-pill more">+${moreCount}</span>` : '');

        const badges = [];
        if (entry.constant) badges.push('<span class="status-badge status-constant">Constant</span>');
        if (entry.disable) badges.push('<span class="status-badge status-disabled">Disabled</span>');

        const contentPreview = (entry.content || '').slice(0, 240);

        return `
            <div class="entry-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isUnsaved ? 'unsaved' : ''}"
                 data-uid="${entry.uid}"
                 draggable="true">
                <input type="checkbox" class="entry-checkbox" ${isSelected ? 'checked' : ''} aria-label="Select entry">
                <input type="number" class="entry-order-input" value="${order}" min="0" aria-label="Entry order" title="Order">
                <div class="entry-status">${statusIcon}</div>
                <div class="entry-info">
                    <div class="entry-name">${escapeHtml(entry.comment || `Entry ${entry.uid}`)}</div>
                    ${pillsHtml ? `<div class="entry-keywords">${pillsHtml}</div>` : ''}
                    ${badges.length ? `<div class="entry-item-status">${badges.join('')}</div>` : ''}
                    ${contentPreview ? `<div class="entry-content-preview">${escapeHtml(contentPreview)}</div>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="icon-btn small entry-action-move-up" title="Move up" aria-label="Move up">
                        <span class="material-symbols-rounded">arrow_upward</span>
                    </button>
                    <button class="icon-btn small entry-action-move-down" title="Move down" aria-label="Move down">
                        <span class="material-symbols-rounded">arrow_downward</span>
                    </button>
                    <button class="icon-btn small entry-action-insert-above" title="Insert entry above" aria-label="Insert above">
                        <span class="material-symbols-rounded">add_row_above</span>
                    </button>
                    <button class="icon-btn small entry-action-insert-below" title="Insert entry below" aria-label="Insert below">
                        <span class="material-symbols-rounded">add_row_below</span>
                    </button>
                    <button class="icon-btn small entry-action-copy" title="Duplicate entry" aria-label="Duplicate">
                        <span class="material-symbols-rounded">content_copy</span>
                    </button>
                    <button class="icon-btn small entry-action-toggle" title="${entry.disable ? 'Enable' : 'Disable'}" aria-label="${entry.disable ? 'Enable' : 'Disable'}">
                        <span class="material-symbols-rounded">${entry.disable ? 'toggle_off' : 'toggle_on'}</span>
                    </button>
                    <button class="icon-btn small entry-action-delete" title="Delete entry" aria-label="Delete">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    setupSidebarEventListeners();
}

function updateClearSelectionBtn() {
    if (!elements.clearSelectionBtn) return;
    const count = state.selectedEntries.size;
    elements.clearSelectionBtn.style.display = count > 0 ? '' : 'none';
    const label = elements.clearSelectionBtn.querySelector('.count');
    if (label) label.textContent = count > 0 ? `(${count})` : '';
}

function setupSidebarEventListeners() {
    if (!elements.entryList) return;

    elements.entryList.querySelectorAll('.entry-item').forEach(item => {
        const uid = parseInt(item.dataset.uid);

        // Click to open (ignore clicks on buttons / inputs inside)
        item.addEventListener('click', (e) => {
            if (e.target.closest('.entry-actions') ||
                e.target.closest('.entry-checkbox') ||
                e.target.closest('.entry-order-input')) {
                return;
            }
            import('./entries.js').then(({ openEntry }) => openEntry(uid));
            // On mobile, the sidebar is a drawer over the editor — picking
            // an entry should reveal the form, so close the drawer.
            if (window.matchMedia('(max-width: 767px)').matches) {
                import('./ui.js').then(({ closeSidebar }) => closeSidebar());
            }
        });

        // Multi-select checkbox
        const checkbox = item.querySelector('.entry-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', e => e.stopPropagation());
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    state.selectedEntries.add(uid);
                } else {
                    state.selectedEntries.delete(uid);
                }
                item.classList.toggle('selected', checkbox.checked);
                updateClearSelectionBtn();
            });
        }

        // Inline order edit
        const orderInput = item.querySelector('.entry-order-input');
        if (orderInput) {
            orderInput.addEventListener('click', e => e.stopPropagation());
            orderInput.addEventListener('change', (e) => {
                e.stopPropagation();
                const value = parseInt(e.target.value, 10);
                if (Number.isNaN(value)) return;
                import('./entries.js').then(({ setEntryOrder }) => setEntryOrder(uid, value));
            });
        }

        // Action buttons
        const wire = (selector, mod) => {
            const btn = item.querySelector(selector);
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                import('./entries.js').then(mod);
            });
        };
        wire('.entry-action-move-up', ({ moveEntry }) => moveEntry(uid, -1));
        wire('.entry-action-move-down', ({ moveEntry }) => moveEntry(uid, 1));
        wire('.entry-action-insert-above', ({ insertEntryAbove }) => insertEntryAbove(uid));
        wire('.entry-action-insert-below', ({ insertEntryBelow }) => insertEntryBelow(uid));
        wire('.entry-action-copy', ({ duplicateEntry }) => duplicateEntry(uid));
        wire('.entry-action-toggle', ({ toggleEntryEnabled }) => toggleEntryEnabled(uid));
        wire('.entry-action-delete', ({ deleteEntry }) => deleteEntry(uid));

        // Drag and drop
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    });
}

// Drag and drop state
let draggedUids = [];

function handleDragStart(e) {
    const uid = parseInt(this.dataset.uid);
    // If the dragged item is part of a multi-selection, drag all selected
    if (state.selectedEntries.has(uid) && state.selectedEntries.size > 1) {
        draggedUids = [...state.selectedEntries];
    } else {
        draggedUids = [uid];
    }
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(uid));
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedUids = [];
    document.querySelectorAll('.entry-item.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetUid = parseInt(this.dataset.uid);
    if (!draggedUids.includes(targetUid)) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const targetUid = parseInt(this.dataset.uid);
    if (!draggedUids.length || draggedUids.includes(targetUid)) return;
    moveEntriesBefore(draggedUids, targetUid);
}

/**
 * Move a set of entries so they land just before the target entry (in order),
 * keeping their relative order.
 */
function moveEntriesBefore(uids, targetUid) {
    if (!state.lorebookData?.entries) return;
    const target = state.lorebookData.entries[targetUid];
    if (!target) return;

    const all = Object.values(state.lorebookData.entries)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Preserve relative order of the moved set
    const movingSet = new Set(uids);
    const moving = all.filter(e => movingSet.has(e.uid));
    const remaining = all.filter(e => !movingSet.has(e.uid));

    const targetIdx = remaining.findIndex(e => e.uid === targetUid);
    if (targetIdx === -1) return;

    remaining.splice(targetIdx, 0, ...moving);

    // 1-based reseq to match inline-edit convention and the typical
    // SillyTavern source file (orders start at 1, contiguous).
    remaining.forEach((entry, index) => {
        entry.order = index + 1;
    });

    moving.forEach(e => state.unsavedEntries.add(e.uid));
    state.hasUnsavedChanges = true;
    renderSidebar();
}

export function setFilter(text) {
    state.filterText = text;
    renderSidebar();
}

export function clearSelectedEntries() {
    state.selectedEntries.clear();
    renderSidebar();
}

/**
 * SLEd - Simple Lorebook Editor
 * Sidebar Module
 */

import { state } from './state.js';
import { elements } from './elements.js';
import { escapeHtml, getStatusIcon } from './utils.js';

/**
 * Get filtered and sorted entries
 * @returns {Array} Filtered entries
 */
export function getFilteredEntries() {
    if (!state.lorebookData?.entries) return [];
    
    let entries = Object.values(state.lorebookData.entries);
    
    // Apply filter
    if (state.filterText) {
        const filterLower = state.filterText.toLowerCase();
        entries = entries.filter(entry => {
            const comment = (entry.comment || '').toLowerCase();
            const keys = (entry.key || []).join(' ').toLowerCase();
            const content = (entry.content || '').toLowerCase();
            const group = (entry.group || '').toLowerCase();
            
            return comment.includes(filterLower) ||
                   keys.includes(filterLower) ||
                   content.includes(filterLower) ||
                   group.includes(filterLower);
        });
    }
    
    // Sort by order
    entries.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return entries;
}

/**
 * Render the sidebar entry list
 */
export function renderSidebar() {
    if (!elements.entryList) return;
    
    const entries = getFilteredEntries();
    
    if (entries.length === 0) {
        elements.entryList.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded">search_off</span>
                <p>${state.filterText ? 'No entries match your filter' : 'No entries yet'}</p>
            </div>
        `;
        return;
    }
    
    elements.entryList.innerHTML = entries.map(entry => {
        const isSelected = entry.uid === state.currentEntryUid;
        const statusIcon = getStatusIcon(entry);
        const keys = (entry.key || []).slice(0, 3).join(', ');
        const hasMoreKeys = (entry.key || []).length > 3;
        
        return `
            <div class="entry-item ${isSelected ? 'selected' : ''}" 
                 data-uid="${entry.uid}"
                 draggable="true">
                <div class="entry-status">${statusIcon}</div>
                <div class="entry-info">
                    <div class="entry-title">${escapeHtml(entry.comment || `Entry ${entry.uid}`)}</div>
                    <div class="entry-keys">${escapeHtml(keys)}${hasMoreKeys ? '...' : ''}</div>
                </div>
                <div class="entry-actions">
                    <button class="icon-btn entry-action-toggle" 
                            aria-label="${entry.disable ? 'Enable' : 'Disable'} entry"
                            title="${entry.disable ? 'Enable' : 'Disable'}">
                        <span class="material-symbols-rounded">
                            ${entry.disable ? 'toggle_off' : 'toggle_on'}
                        </span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    setupSidebarEventListeners();
}

/**
 * Setup event listeners for sidebar items
 */
function setupSidebarEventListeners() {
    if (!elements.entryList) return;
    
    elements.entryList.querySelectorAll('.entry-item').forEach(item => {
        const uid = parseInt(item.dataset.uid);
        
        // Click to open
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-actions')) {
                // Import dynamically to avoid circular dependency
                import('./entries.js').then(({ openEntry }) => {
                    openEntry(uid);
                });
            }
        });
        
        // Toggle button
        const toggleBtn = item.querySelector('.entry-action-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                import('./entries.js').then(({ toggleEntryEnabled }) => {
                    toggleEntryEnabled(uid);
                });
            });
        }
        
        // Drag and drop
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    });
}

// Drag and drop state
let draggedItem = null;

/**
 * Handle drag start
 * @param {DragEvent} e - Drag event
 */
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.uid);
}

/**
 * Handle drag end
 */
function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    
    // Remove all drag-over states
    document.querySelectorAll('.entry-item.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

/**
 * Handle drag over
 * @param {DragEvent} e - Drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

/**
 * Handle drop
 * @param {DragEvent} e - Drag event
 */
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (!draggedItem || this === draggedItem) return;
    
    const draggedUid = parseInt(draggedItem.dataset.uid);
    const targetUid = parseInt(this.dataset.uid);
    
    reorderEntries(draggedUid, targetUid);
}

/**
 * Reorder entries after drag and drop
 * @param {number} draggedUid - UID of dragged entry
 * @param {number} targetUid - UID of target entry
 */
function reorderEntries(draggedUid, targetUid) {
    if (!state.lorebookData?.entries) return;
    
    const draggedEntry = state.lorebookData.entries[draggedUid];
    const targetEntry = state.lorebookData.entries[targetUid];
    
    if (!draggedEntry || !targetEntry) return;
    
    // Swap orders
    const tempOrder = draggedEntry.order;
    draggedEntry.order = targetEntry.order;
    targetEntry.order = tempOrder;
    
    state.hasUnsavedChanges = true;
    renderSidebar();
}

/**
 * Update filter text and re-render
 * @param {string} text - Filter text
 */
export function setFilter(text) {
    state.filterText = text;
    renderSidebar();
}

/**
 * Clear the filter
 */
export function clearFilter() {
    state.filterText = '';
    if (elements.sidebarSearch) {
        elements.sidebarSearch.value = '';
    }
    renderSidebar();
}

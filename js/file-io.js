/**
 * SLEd - Simple Lorebook Editor
 * File I/O Module (Import, Export, Merge)
 */

import { state, resetState } from './state.js';
import { elements } from './elements.js';
import { downloadFile } from './utils.js';
import { showToast, openModal, closeModal, updateSidebarHeader, showEditor, showWelcome } from './ui.js';
import { renderSidebar } from './sidebar.js';
import { closeAllTabs } from './tabs.js';

/**
 * Create a new lorebook
 */
export function createNewLorebook() {
    if (state.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Create new lorebook anyway?')) {
            return;
        }
    }
    
    const name = prompt('Enter lorebook name:', 'New Lorebook');
    if (name === null) return;

    const settings = state.settings;
    resetState();
    state.settings = settings;

    state.lorebookData = {
        name: name || 'New Lorebook',
        description: '',
        scan_depth: 2,
        token_budget: 2048,
        recursive_scanning: false,
        extensions: {},
        entries: {}
    };
    
    state.fileName = `${name || 'lorebook'}.json`;
    
    updateSidebarHeader();
    renderSidebar();
    closeAllTabs();
    showWelcome();
    
    showToast('New lorebook created', 'success');
}

/**
 * Import a lorebook from file
 * @param {File} file - File to import
 */
export function importLorebook(file) {
    if (!file) return;
    
    if (state.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Import new lorebook anyway?')) {
            return;
        }
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate it looks like a lorebook
            if (!data.entries || typeof data.entries !== 'object') {
                throw new Error('Invalid lorebook format: missing entries');
            }
            
            // Preserve settings (resetState clears state but settings live on `state.settings`)
            const settings = state.settings;
            resetState();
            state.settings = settings;
            state.lorebookData = data;
            state.fileName = file.name;

            closeAllTabs();
            updateSidebarHeader();
            renderSidebar();
            showWelcome();

            const count = data.entries ? Object.keys(data.entries).length : 0;
            showToast(`Loaded ${file.name} (${count} ${count === 1 ? 'entry' : 'entries'})`, 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            showToast(`Failed to import: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = () => {
        showToast('Failed to read file', 'error');
    };
    
    reader.readAsText(file);
}

/**
 * Export the current lorebook
 * @param {boolean} pretty - Whether to format the JSON nicely
 */
export function exportLorebook(pretty = true) {
    if (!state.lorebookData) {
        showToast('No lorebook to export', 'error');
        return;
    }
    
    try {
        const json = pretty 
            ? JSON.stringify(state.lorebookData, null, 2)
            : JSON.stringify(state.lorebookData);
        
        const blob = new Blob([json], { type: 'application/json' });
        downloadFile(blob, state.fileName || 'lorebook.json');
        
        state.hasUnsavedChanges = false;
        showToast('Lorebook exported', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export lorebook', 'error');
    }
}

/**
 * Export the current lorebook as plain text
 */
export function exportLorebookAsText() {
    if (!state.lorebookData) {
        showToast('No lorebook to export', 'error');
        return;
    }

    try {
        const { exportTitles, exportKeywords, exportComments } = state.settings;
        const entries = Object.values(state.lorebookData.entries || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const lines = [];
        lines.push(`# ${state.lorebookData.name || 'Lorebook'}`);
        lines.push('');

        entries.forEach(entry => {
            if (exportTitles && entry.comment) {
                lines.push(`## ${entry.comment}`);
            }
            if (exportKeywords && (entry.key || []).length > 0) {
                lines.push(`Keywords: ${(entry.key || []).join(', ')}`);
            }
            if (exportComments && entry.comment) {
                lines.push(`Comment: ${entry.comment}`);
            }
            lines.push(entry.content || '');
            lines.push('');
            lines.push('---');
            lines.push('');
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const baseName = (state.fileName || 'lorebook').replace(/\.json$/i, '');
        downloadFile(blob, `${baseName}.txt`);

        showToast('Lorebook exported as text', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export as text', 'error');
    }
}

/**
 * Export selected entries only
 * @param {Array<number>} uids - Array of entry UIDs to export
 */
export function exportSelectedEntries(uids) {
    if (!state.lorebookData || !uids || uids.length === 0) {
        showToast('No entries selected', 'error');
        return;
    }
    
    try {
        const exportData = {
            ...state.lorebookData,
            entries: {}
        };
        
        uids.forEach(uid => {
            if (state.lorebookData.entries[uid]) {
                exportData.entries[uid] = state.lorebookData.entries[uid];
            }
        });
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        const baseName = state.fileName?.replace('.json', '') || 'lorebook';
        downloadFile(blob, `${baseName}_partial.json`);
        
        showToast(`Exported ${uids.length} entries`, 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export entries', 'error');
    }
}

/**
 * Open the merge modal
 */
/**
 * Start the merge flow: prompt for a file, then merge it in.
 * (The modal-based entry-by-entry picker isn't wired yet; this does a
 * direct merge with sensible defaults.)
 */
export function openMergeModal() {
    if (!state.lorebookData) {
        showToast('Load or create a lorebook before merging', 'error');
        return;
    }
    const input = document.getElementById('merge-file-input');
    if (input) input.click();
}

export function closeMergeModal() {
    closeModal('mergeModal');
    const input = document.getElementById('merge-file-input');
    if (input) input.value = '';
}

/**
 * Merge another lorebook into the current one
 * @param {File} file - File to merge
 * @param {Object} options - Merge options
 */
export function mergeLorebook(file, options = {}) {
    if (!file) return;
    
    if (!state.lorebookData) {
        showToast('No lorebook loaded to merge into', 'error');
        return;
    }
    
    const {
        overwriteDuplicates = false,
        mergeByComment = false,
        preserveOrder = true
    } = options;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const mergeData = JSON.parse(e.target.result);
            
            if (!mergeData.entries || typeof mergeData.entries !== 'object') {
                throw new Error('Invalid lorebook format');
            }
            
            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            
            // Get current max UID and order
            const existingUids = Object.keys(state.lorebookData.entries).map(k => parseInt(k));
            let nextUid = existingUids.length > 0 ? Math.max(...existingUids) + 1 : 0;
            
            const existingOrders = Object.values(state.lorebookData.entries).map(e => e.order || 0);
            let nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
            
            // Build comment index if merging by comment
            const commentIndex = {};
            if (mergeByComment) {
                Object.entries(state.lorebookData.entries).forEach(([uid, entry]) => {
                    const comment = (entry.comment || '').toLowerCase().trim();
                    if (comment) {
                        commentIndex[comment] = uid;
                    }
                });
            }
            
            // Process merge entries
            Object.values(mergeData.entries).forEach(entry => {
                const comment = (entry.comment || '').toLowerCase().trim();
                let existingUid = null;
                
                // Check for duplicates
                if (mergeByComment && comment && commentIndex[comment]) {
                    existingUid = commentIndex[comment];
                }
                
                if (existingUid !== null) {
                    // Duplicate found
                    if (overwriteDuplicates) {
                        // Update existing entry but keep UID
                        const newEntry = { ...entry, uid: parseInt(existingUid) };
                        if (preserveOrder) {
                            newEntry.order = state.lorebookData.entries[existingUid].order;
                        }
                        state.lorebookData.entries[existingUid] = newEntry;
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    // New entry
                    const newEntry = { ...entry };
                    newEntry.uid = nextUid;
                    newEntry.displayIndex = nextUid;
                    
                    if (!preserveOrder) {
                        newEntry.order = nextOrder++;
                    }
                    
                    state.lorebookData.entries[nextUid] = newEntry;
                    
                    if (mergeByComment && comment) {
                        commentIndex[comment] = nextUid.toString();
                    }
                    
                    nextUid++;
                    addedCount++;
                }
            });
            
            state.hasUnsavedChanges = true;
            
            updateSidebarHeader();
            renderSidebar();
            closeMergeModal();
            
            let message = `Merge complete: ${addedCount} added`;
            if (updatedCount > 0) message += `, ${updatedCount} updated`;
            if (skippedCount > 0) message += `, ${skippedCount} skipped`;
            
            showToast(message, 'success');
            
        } catch (error) {
            console.error('Merge error:', error);
            showToast(`Failed to merge: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = () => {
        showToast('Failed to read file', 'error');
    };
    
    reader.readAsText(file);
}

/**
 * Handle file drop
 * @param {DragEvent} e - Drop event
 */
export function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    document.body.classList.remove('drag-over');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.json')) {
            importLorebook(file);
        } else {
            showToast('Please drop a JSON file', 'error');
        }
    }
}

/**
 * Handle drag over for file drop
 * @param {DragEvent} e - Drag event
 */
export function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.add('drag-over');
}

/**
 * Handle drag leave for file drop
 * @param {DragEvent} e - Drag event
 */
export function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.remove('drag-over');
}

/**
 * Setup file drop handlers
 */
export function setupFileDropHandlers() {
    document.body.addEventListener('dragover', handleDragOver);
    document.body.addEventListener('dragleave', handleDragLeave);
    document.body.addEventListener('drop', handleFileDrop);
}

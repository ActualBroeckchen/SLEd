/**
 * SLEd - Simple Lorebook Editor
 * File I/O Module (Import, Export, Merge)
 */

import { state, resetState, clearUnsaved, saveSession } from './state.js';
import { downloadFile, escapeHtml, getStatusIcon } from './utils.js';
import { showToast, openModal, closeModal, updateSidebarHeader, showWelcome } from './ui.js';
import { renderSidebar } from './sidebar.js';
import { closeAllTabs } from './tabs.js';
import { parseLorebookScript, convertParsedToLorebook, summariseParsed } from './script-import.js';

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
    clearUnsaved();

    updateSidebarHeader();
    renderSidebar();
    closeAllTabs();
    showWelcome();
    saveSession();

    showToast('New lorebook created', 'success');
}

/**
 * Import a lorebook from file
 * @param {File} file - File to import
 */
export function importLorebook(file) {
    if (!file) return;

    // Route .js / .txt files (or anything that doesn't sniff as JSON) through
    // the orchestrator-script importer.
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.js') || name.endsWith('.txt')) {
        importLorebookFromScript(file);
        return;
    }

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
            clearUnsaved();

            closeAllTabs();
            updateSidebarHeader();
            renderSidebar();
            showWelcome();
            saveSession();

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
        const exportName = state.fileName && state.fileName.endsWith('.json')
            ? state.fileName
            : `${(state.lorebookData.name || state.fileName || 'lorebook').replace(/\.json$/i, '')}.json`;
        downloadFile(blob, exportName);

        clearUnsaved();
        renderSidebar();
        saveSession();
        showToast('Lorebook exported', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export lorebook', 'error');
    }
}

/**
 * Export the current lorebook as plain text, honouring the granular
 * txtInclude* prefs in state.settings.
 * @param {Object} [opts] - Optional overrides for include flags + filename
 */
export function exportLorebookAsText(opts = {}) {
    if (!state.lorebookData) {
        showToast('No lorebook to export', 'error');
        return;
    }

    const s = state.settings;
    const cfg = {
        titles: opts.titles ?? s.txtIncludeTitles ?? true,
        content: opts.content ?? s.txtIncludeContent ?? true,
        primaryKeys: opts.primaryKeys ?? s.txtIncludePrimaryKeys ?? true,
        secondaryKeys: opts.secondaryKeys ?? s.txtIncludeSecondaryKeys ?? false,
        status: opts.status ?? s.txtIncludeStatus ?? false,
        comments: opts.comments ?? s.txtIncludeComments ?? false,
        order: opts.order ?? s.txtIncludeOrder ?? false
    };

    const baseName = (opts.filename
        || state.lorebookData.name
        || (state.fileName || 'lorebook').replace(/\.json$/i, '')
        || 'lorebook'
    ).trim();

    try {
        const entries = Object.values(state.lorebookData.entries || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const SELECTIVE_LOGIC = ['AND ANY', 'NOT ALL', 'NOT ANY', 'AND ALL'];
        const lines = [];
        lines.push(`# ${state.lorebookData.name || 'Lorebook'}`);
        lines.push('');

        entries.forEach((entry, idx) => {
            if (cfg.titles && entry.comment) {
                const orderTag = cfg.order ? ` [#${entry.order ?? idx}]` : '';
                lines.push(`## ${entry.comment}${orderTag}`);
            } else if (cfg.order) {
                lines.push(`## #${entry.order ?? idx}`);
            }

            if (cfg.status) {
                const status = [];
                if (entry.constant) status.push('Constant');
                if (entry.disable) status.push('Disabled');
                if (status.length) lines.push(`Status: ${status.join(', ')}`);
            }

            if (cfg.primaryKeys && (entry.key || []).length > 0) {
                lines.push(`Keywords: ${(entry.key || []).join(', ')}`);
            }

            if (cfg.secondaryKeys && (entry.keysecondary || []).length > 0) {
                const logic = SELECTIVE_LOGIC[entry.selectiveLogic] || `Logic ${entry.selectiveLogic}`;
                lines.push(`Secondary (${logic}): ${(entry.keysecondary || []).join(', ')}`);
            }

            if (cfg.comments && entry.comment) {
                lines.push(`Comment: ${entry.comment}`);
            }

            if (cfg.content) {
                lines.push(entry.content || '');
            }

            lines.push('');
            lines.push('---');
            lines.push('');
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const cleanName = baseName.replace(/\.txt$/i, '').replace(/[\\/:*?"<>|]/g, '_');
        downloadFile(blob, `${cleanName || 'lorebook'}.txt`);

        showToast('Lorebook exported as text', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export as text', 'error');
    }
}

/**
 * Start the merge flow: prompt for a file.
 * The file picker change handler stages the source and opens the modal.
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
    state.mergeStaging = null;
    state.mergeSelected = new Set();
    const input = document.getElementById('merge-file-input');
    if (input) input.value = '';
}

/**
 * Called after the user picks a merge source file. Parses it, builds the
 * selection UI in the merge modal, and opens the modal.
 */
export function stageMergeFile(file) {
    if (!file) return;
    if (!state.lorebookData) {
        showToast('Load or create a lorebook first', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.entries || typeof data.entries !== 'object') {
                throw new Error('Invalid lorebook format');
            }
            data.name = data.name || file.name.replace(/\.json$/i, '');
            state.mergeStaging = data;
            // Pre-select all entries by default
            state.mergeSelected = new Set(Object.keys(data.entries).map(k => parseInt(k, 10)));
            renderMergeList();
            openModal('mergeModal');
        } catch (error) {
            console.error('Merge stage error:', error);
            showToast(`Failed to read merge file: ${error.message}`, 'error');
        }
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsText(file);
}

/**
 * Render the merge entry list in the merge modal.
 */
export function renderMergeList() {
    const list = document.getElementById('mergeList');
    if (!list) return;
    const staging = state.mergeStaging;
    if (!staging || !staging.entries) {
        list.innerHTML = '<p class="empty-state">Nothing to merge.</p>';
        return;
    }

    const entries = Object.values(staging.entries).sort((a, b) => (a.order || 0) - (b.order || 0));
    const sourceName = staging.name || 'source lorebook';
    const currentName = state.lorebookData?.name || state.fileName?.replace(/\.json$/i, '') || 'current lorebook';

    list.innerHTML = `
        <p class="merge-instructions">
            Merging <strong>${escapeHtml(sourceName)}</strong> into
            <strong>${escapeHtml(currentName)}</strong>.
            <span class="merge-count">${state.mergeSelected.size} of ${entries.length} selected</span>
        </p>
        <div class="merge-entry-list">
            ${entries.map(entry => {
                const isSelected = state.mergeSelected.has(entry.uid);
                const icon = getStatusIcon(entry);
                const keys = (entry.key || []).slice(0, 5).join(', ');
                const moreKeys = (entry.key || []).length > 5 ? '…' : '';
                const badges = [];
                if (entry.constant) badges.push('<span class="status-badge status-constant">Constant</span>');
                if (entry.disable) badges.push('<span class="status-badge status-disabled">Disabled</span>');
                return `
                    <label class="merge-entry-item ${isSelected ? 'selected' : ''}">
                        <input type="checkbox" data-uid="${entry.uid}" ${isSelected ? 'checked' : ''}>
                        <div class="merge-entry-body">
                            <div class="merge-entry-title">${icon} ${escapeHtml(entry.comment || `Entry ${entry.uid}`)}</div>
                            ${keys ? `<div class="merge-entry-keys">${escapeHtml(keys)}${moreKeys}</div>` : ''}
                            ${badges.length ? `<div class="merge-entry-status">${badges.join('')}</div>` : ''}
                        </div>
                    </label>
                `;
            }).join('')}
        </div>
    `;

    list.querySelectorAll('input[type="checkbox"][data-uid]').forEach(cb => {
        cb.addEventListener('change', () => {
            const uid = parseInt(cb.dataset.uid, 10);
            if (cb.checked) state.mergeSelected.add(uid);
            else state.mergeSelected.delete(uid);
            const label = cb.closest('.merge-entry-item');
            if (label) label.classList.toggle('selected', cb.checked);
            const counter = list.querySelector('.merge-count');
            if (counter) counter.textContent = `${state.mergeSelected.size} of ${entries.length} selected`;
        });
    });
}

export function mergeSelectAll() {
    if (!state.mergeStaging) return;
    state.mergeSelected = new Set(
        Object.keys(state.mergeStaging.entries).map(k => parseInt(k, 10))
    );
    renderMergeList();
}

export function mergeSelectNone() {
    state.mergeSelected = new Set();
    renderMergeList();
}

/**
 * Execute the merge: bring the selected entries from mergeStaging into
 * the current lorebook with fresh UIDs and orders.
 */
export function confirmMerge() {
    if (!state.mergeStaging || !state.lorebookData) return;
    if (state.mergeSelected.size === 0) {
        showToast('No entries selected', 'error');
        return;
    }

    const existingUids = Object.keys(state.lorebookData.entries).map(k => parseInt(k, 10));
    let nextUid = existingUids.length ? Math.max(...existingUids) + 1 : 0;
    const existingOrders = Object.values(state.lorebookData.entries).map(e => e.order || 0);
    let nextOrder = existingOrders.length ? Math.max(...existingOrders) + 1 : 0;

    let added = 0;
    Object.values(state.mergeStaging.entries).forEach(entry => {
        if (!state.mergeSelected.has(entry.uid)) return;
        const clone = JSON.parse(JSON.stringify(entry));
        clone.uid = nextUid;
        clone.displayIndex = nextUid;
        clone.order = nextOrder;
        state.lorebookData.entries[nextUid] = clone;
        state.unsavedEntries.add(nextUid);
        nextUid++;
        nextOrder++;
        added++;
    });

    state.hasUnsavedChanges = true;
    closeMergeModal();
    updateSidebarHeader();
    renderSidebar();
    saveSession();
    showToast(`Merged ${added} ${added === 1 ? 'entry' : 'entries'}`, 'success');
}

// (mergeLorebook was replaced by the stageMergeFile + confirmMerge flow above.)

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

/* ---------- Orchestrator-script importer ---------- */

/**
 * Read a .js / .txt file, parse it as an orchestrator script, and open
 * the script-import modal so the user can pick replace vs merge.
 */
export function importLorebookFromScript(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const parsed = parseLorebookScript(e.target.result);
        if (parsed.error) {
            console.error('Script parse error:', parsed.error);
            showToast(`Failed to parse script: ${parsed.error}`, 'error');
            return;
        }
        const summary = summariseParsed(parsed);
        if (summary.total === 0) {
            showToast(
                'No recognised lorebook structures found in script ' +
                '(expected PACK_*, coreRules, LOCATIONS, or ENCOUNTER_CHOICES).',
                'error'
            );
            return;
        }

        const lorebook = convertParsedToLorebook(parsed, file.name);
        state.scriptImportStaging = { lorebook, summary, fileName: file.name };
        renderScriptImportSummary();
        openModal('scriptImportModal');
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsText(file);
}

function renderScriptImportSummary() {
    const stage = state.scriptImportStaging;
    const sourceEl = document.getElementById('scriptImportSource');
    const summaryEl = document.getElementById('scriptImportSummary');
    if (!stage || !sourceEl || !summaryEl) return;

    sourceEl.textContent = stage.fileName;

    const s = stage.summary;
    const items = [];
    if (s.coreRules) items.push('<li>1 core ruleset (Constant entry)</li>');
    if (s.packCount) items.push(`<li>${s.packCount} pack${s.packCount === 1 ? '' : 's'} (${s.packRuleCount} rule${s.packRuleCount === 1 ? '' : 's'})</li>`);
    if (s.locationCount) items.push(`<li>${s.locationCount} location${s.locationCount === 1 ? '' : 's'} (sticky scene entries)</li>`);
    if (s.encounterCount) items.push(`<li>${s.encounterCount} encounter${s.encounterCount === 1 ? '' : 's'} (probabilistic, gated by location)</li>`);
    if (s.janitorEntryCount) items.push(`<li>${s.janitorEntryCount} JanitorAI lorebook entr${s.janitorEntryCount === 1 ? 'y' : 'ies'}</li>`);

    summaryEl.innerHTML = `
        <p class="script-import-total">Detected <strong>${s.total}</strong> entries to import:</p>
        <ul class="script-import-list">${items.join('')}</ul>
    `;
}

/**
 * Apply the staged script-import as a full replacement of the current
 * lorebook. Mirrors what importLorebook does for JSON.
 */
export function applyScriptImportReplace() {
    const stage = state.scriptImportStaging;
    if (!stage) return;

    if (state.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Replace the current lorebook anyway?')) {
            return;
        }
    }

    const settings = state.settings;
    resetState();
    state.settings = settings;
    state.lorebookData = stage.lorebook;
    state.fileName = stage.fileName;
    clearUnsaved();

    closeAllTabs();
    updateSidebarHeader();
    renderSidebar();
    showWelcome();
    saveSession();

    closeModal('scriptImportModal');
    state.scriptImportStaging = null;
    showToast(`Imported ${stage.summary.total} entries from ${stage.fileName}`, 'success');
}

/**
 * Apply the staged script-import via the existing merge flow — hands
 * the parsed lorebook off to the merge modal so the user can pick which
 * entries to bring in.
 */
export function applyScriptImportMerge() {
    const stage = state.scriptImportStaging;
    if (!stage) return;

    if (!state.lorebookData) {
        showToast('Load or create a lorebook first', 'error');
        return;
    }

    state.mergeStaging = stage.lorebook;
    state.mergeSelected = new Set(
        Object.keys(stage.lorebook.entries).map(k => parseInt(k, 10))
    );

    closeModal('scriptImportModal');
    state.scriptImportStaging = null;
    renderMergeList();
    openModal('mergeModal');
}

export function cancelScriptImport() {
    state.scriptImportStaging = null;
    closeModal('scriptImportModal');
    const input = document.getElementById('file-input');
    if (input) input.value = '';
}

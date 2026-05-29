/**
 * SLEd - Simple Lorebook Editor
 * Search & Replace Module
 */

import { state } from './state.js';
import { elements } from './elements.js';
import { escapeHtml, escapeRegExp, replaceAt } from './utils.js';
import { showToast, openModal, closeModal } from './ui.js';
import { renderSidebar } from './sidebar.js';

/**
 * Search state
 */
const searchState = {
    results: [],
    currentIndex: -1,
    searchText: '',
    replaceText: '',
    options: {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        searchIn: 'all' // 'all', 'keys', 'content', 'comments'
    }
};

/**
 * Open the search modal
 */
export function openSearchModal() {
    openModal('searchModal');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Close the search modal
 */
export function closeSearchModal() {
    closeModal('searchModal');
    clearSearchResults();
}

/**
 * Perform search across all entries
 */
export function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const caseSensitiveCheck = document.getElementById('searchCaseSensitive');
    const wholeWordCheck = document.getElementById('searchWholeWord');
    const regexCheck = document.getElementById('searchRegex');
    const searchInSelect = document.getElementById('searchScope');
    
    if (!searchInput) return;
    
    searchState.searchText = searchInput.value;
    searchState.options.caseSensitive = caseSensitiveCheck?.checked || false;
    searchState.options.wholeWord = wholeWordCheck?.checked || false;
    searchState.options.regex = regexCheck?.checked || false;
    searchState.options.searchIn = searchInSelect?.value || 'all';
    
    if (!searchState.searchText) {
        clearSearchResults();
        return;
    }
    
    searchState.results = [];
    searchState.currentIndex = -1;
    
    if (!state.lorebookData?.entries) {
        showSearchResults();
        return;
    }
    
    // Build regex
    let pattern;
    try {
        let searchPattern = searchState.options.regex 
            ? searchState.searchText 
            : escapeRegExp(searchState.searchText);
        
        if (searchState.options.wholeWord) {
            searchPattern = `\\b${searchPattern}\\b`;
        }
        
        const flags = searchState.options.caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(searchPattern, flags);
    } catch (e) {
        showToast('Invalid regex pattern', 'error');
        return;
    }
    
    const scope = searchState.options.searchIn;
    const searchKeys = scope === 'all' || scope === 'keywords';
    const searchContent = scope === 'all' || scope === 'content';
    const searchComments = scope === 'all' || scope === 'names';

    // Search through entries
    Object.entries(state.lorebookData.entries).forEach(([uid, entry]) => {
        const uidNum = parseInt(uid);

        // Search in keys
        if (searchKeys) {
            (entry.key || []).forEach((key, keyIndex) => {
                let match;
                while ((match = pattern.exec(key)) !== null) {
                    searchState.results.push({
                        uid: uidNum,
                        field: 'key',
                        fieldIndex: keyIndex,
                        index: match.index,
                        length: match[0].length,
                        context: key,
                        entryComment: entry.comment || `Entry ${uid}`
                    });
                }
            });
            
            // Secondary keys
            (entry.keysecondary || []).forEach((key, keyIndex) => {
                let match;
                while ((match = pattern.exec(key)) !== null) {
                    searchState.results.push({
                        uid: uidNum,
                        field: 'keysecondary',
                        fieldIndex: keyIndex,
                        index: match.index,
                        length: match[0].length,
                        context: key,
                        entryComment: entry.comment || `Entry ${uid}`
                    });
                }
            });
        }
        
        // Search in content
        if (searchContent) {
            const content = entry.content || '';
            let match;
            while ((match = pattern.exec(content)) !== null) {
                // Get context around match
                const start = Math.max(0, match.index - 30);
                const end = Math.min(content.length, match.index + match[0].length + 30);
                const context = (start > 0 ? '...' : '') + 
                              content.substring(start, end) + 
                              (end < content.length ? '...' : '');
                
                searchState.results.push({
                    uid: uidNum,
                    field: 'content',
                    index: match.index,
                    length: match[0].length,
                    context: context,
                    entryComment: entry.comment || `Entry ${uid}`
                });
            }
        }
        
        // Search in comments (entry name)
        if (searchComments) {
            const comment = entry.comment || '';
            let match;
            while ((match = pattern.exec(comment)) !== null) {
                searchState.results.push({
                    uid: uidNum,
                    field: 'comment',
                    index: match.index,
                    length: match[0].length,
                    context: comment,
                    entryComment: comment
                });
            }
        }
    });
    
    showSearchResults();
}

/**
 * Display search results
 */
function showSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    const countSpan = document.querySelector('.search-result-count');
    
    if (countSpan) {
        countSpan.textContent = `${searchState.results.length} result${searchState.results.length !== 1 ? 's' : ''}`;
    }
    
    if (!resultsContainer) return;
    
    if (searchState.results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded">search_off</span>
                <p>No results found</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = searchState.results.map((result, index) => `
        <div class="search-result-item" data-index="${index}">
            <div class="result-header">
                <span class="result-entry">${escapeHtml(result.entryComment)}</span>
                <span class="result-field">${result.field}</span>
            </div>
            <div class="result-context">${highlightMatch(result.context, result.index, result.length)}</div>
        </div>
    `).join('');
    
    // Add click handlers
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            goToResult(index);
        });
    });
}

/**
 * Highlight match in context
 * @param {string} context - Context string
 * @param {number} index - Match start index (may be offset due to context truncation)
 * @param {number} length - Match length
 * @returns {string} HTML with highlighted match
 */
function highlightMatch(context, index, length) {
    // For simplified display, just escape and return
    // The actual highlighting would need to track offsets properly
    return escapeHtml(context);
}

/**
 * Navigate to a specific result
 * @param {number} index - Result index
 */
function goToResult(index) {
    if (index < 0 || index >= searchState.results.length) return;
    
    searchState.currentIndex = index;
    const result = searchState.results[index];
    
    // Open the entry
    import('./entries.js').then(({ openEntry }) => {
        openEntry(result.uid);
        
        // Focus the appropriate field
        setTimeout(() => {
            let field;
            switch (result.field) {
                case 'key':
                    field = document.getElementById('primaryKeywords');
                    break;
                case 'keysecondary':
                    field = document.getElementById('secondaryKeywords');
                    break;
                case 'content':
                    field = document.getElementById('entryContent');
                    break;
                case 'comment':
                    field = document.getElementById('entryName');
                    break;
            }
            if (field) {
                field.focus();
            }
        }, 100);
    });
    
    // Highlight current result in list
    document.querySelectorAll('.search-result-item.active').forEach(el => {
        el.classList.remove('active');
    });
    const item = document.querySelector(`.search-result-item[data-index="${index}"]`);
    if (item) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
    }
}

/**
 * Go to next search result
 */
export function nextResult() {
    if (searchState.results.length === 0) return;
    const nextIndex = (searchState.currentIndex + 1) % searchState.results.length;
    goToResult(nextIndex);
}

/**
 * Go to previous search result
 */
export function prevResult() {
    if (searchState.results.length === 0) return;
    const prevIndex = searchState.currentIndex <= 0 
        ? searchState.results.length - 1 
        : searchState.currentIndex - 1;
    goToResult(prevIndex);
}

/**
 * Replace current match
 */
export function replaceCurrent() {
    const replaceInput = document.getElementById('replaceInput');
    if (!replaceInput) return;
    
    searchState.replaceText = replaceInput.value;
    
    if (searchState.currentIndex < 0 || searchState.currentIndex >= searchState.results.length) {
        showToast('No result selected', 'error');
        return;
    }
    
    const result = searchState.results[searchState.currentIndex];
    const entry = state.lorebookData?.entries[result.uid];
    if (!entry) return;
    
    // Perform replacement
    switch (result.field) {
        case 'key':
            if (entry.key && entry.key[result.fieldIndex] !== undefined) {
                entry.key[result.fieldIndex] = replaceAt(
                    entry.key[result.fieldIndex],
                    result.index,
                    result.length,
                    searchState.replaceText
                );
            }
            break;
        case 'keysecondary':
            if (entry.keysecondary && entry.keysecondary[result.fieldIndex] !== undefined) {
                entry.keysecondary[result.fieldIndex] = replaceAt(
                    entry.keysecondary[result.fieldIndex],
                    result.index,
                    result.length,
                    searchState.replaceText
                );
            }
            break;
        case 'content':
            entry.content = replaceAt(entry.content || '', result.index, result.length, searchState.replaceText);
            break;
        case 'comment':
            entry.comment = replaceAt(entry.comment || '', result.index, result.length, searchState.replaceText);
            break;
    }
    
    state.hasUnsavedChanges = true;
    
    // Re-run search
    performSearch();
    renderSidebar();
    
    showToast('Replaced', 'success');
}

/**
 * Replace all matches
 */
export function replaceAll() {
    const replaceInput = document.getElementById('replaceInput');
    if (!replaceInput) return;
    
    searchState.replaceText = replaceInput.value;
    
    if (searchState.results.length === 0) {
        showToast('No results to replace', 'error');
        return;
    }
    
    const count = searchState.results.length;
    
    // Group results by entry and field, process in reverse order to maintain indices
    const grouped = {};
    searchState.results.forEach(result => {
        const key = `${result.uid}-${result.field}-${result.fieldIndex || 0}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(result);
    });
    
    // Sort results within each group by index (descending) and replace
    Object.values(grouped).forEach(results => {
        results.sort((a, b) => b.index - a.index);
        
        results.forEach(result => {
            const entry = state.lorebookData?.entries[result.uid];
            if (!entry) return;
            
            switch (result.field) {
                case 'key':
                    if (entry.key && entry.key[result.fieldIndex] !== undefined) {
                        entry.key[result.fieldIndex] = replaceAt(
                            entry.key[result.fieldIndex],
                            result.index,
                            result.length,
                            searchState.replaceText
                        );
                    }
                    break;
                case 'keysecondary':
                    if (entry.keysecondary && entry.keysecondary[result.fieldIndex] !== undefined) {
                        entry.keysecondary[result.fieldIndex] = replaceAt(
                            entry.keysecondary[result.fieldIndex],
                            result.index,
                            result.length,
                            searchState.replaceText
                        );
                    }
                    break;
                case 'content':
                    entry.content = replaceAt(entry.content || '', result.index, result.length, searchState.replaceText);
                    break;
                case 'comment':
                    entry.comment = replaceAt(entry.comment || '', result.index, result.length, searchState.replaceText);
                    break;
            }
        });
    });
    
    state.hasUnsavedChanges = true;
    
    // Clear and re-run search
    performSearch();
    renderSidebar();
    
    showToast(`Replaced ${count} occurrences`, 'success');
}

/**
 * Clear search results
 */
export function clearSearchResults() {
    searchState.results = [];
    searchState.currentIndex = -1;
    
    const resultsContainer = document.getElementById('searchResults');
    const countSpan = document.querySelector('.search-result-count');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    if (countSpan) {
        countSpan.textContent = '';
    }
}

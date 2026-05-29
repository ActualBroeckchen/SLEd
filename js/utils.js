/**
 * SLEd - Simple Lorebook Editor
 * Utility Functions Module
 */

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for use in regex
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace text at a specific position in a string
 * @param {string} str - Original string
 * @param {number} index - Start index
 * @param {number} length - Length of text to replace
 * @param {string} replacement - Replacement text
 * @returns {string} Modified string
 */
export function replaceAt(str, index, length, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + length);
}

/**
 * Download a file to the user's device
 * @param {Blob} blob - File content as Blob
 * @param {string} fileName - Name for the downloaded file
 */
export function downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Get status icon for an entry based on its state
 * @param {Object} entry - Lorebook entry
 * @returns {string} Emoji icon
 */
export function getStatusIcon(entry) {
    if (entry.disable) return '⚫';
    if (entry.constant) return '🔵';
    if (entry.vectorized) return '🔗';
    return '🟢';
}

/**
 * Create a default lorebook entry
 * @param {number} uid - Unique ID for the entry
 * @param {number} order - Order number for the entry
 * @returns {Object} Default entry object
 */
export function createDefaultEntry(uid, order) {
    return {
        uid: uid,
        key: [],
        keysecondary: [],
        comment: `New Entry ${uid}`,
        content: '',
        constant: false,
        vectorized: false,
        selective: false,
        selectiveLogic: 0,
        addMemo: true,
        order: order,
        position: 0,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: false,
        preventRecursion: false,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: false,
        depth: 4,
        outletName: '',
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: '',
        role: null,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        triggers: [],
        displayIndex: uid,
        characterFilter: {
            isExclude: false,
            names: [],
            tags: []
        }
    };
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


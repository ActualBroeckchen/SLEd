/**
 * SLEd - Simple Lorebook Editor
 * Form template — builds one entry-editor form per open entry, with all
 * field IDs/names scoped to the entry's uid so side-by-side mode can have
 * multiple forms on the page without ID collisions.
 */

/**
 * @param {string} base  Base field id (matches the original index.html ids)
 * @param {number} uid   Entry uid
 */
export function fid(base, uid) {
    return `${base}_${uid}`;
}

/**
 * Build the entry form HTML for one entry.
 * @param {number} uid
 */
export function buildEntryFormHtml(uid) {
    const _ = base => fid(base, uid);
    const radioName = `activationType_${uid}`;

    return `
<div class="entry-form" id="entryForm_${uid}" data-uid="${uid}">
    <form>
        <section class="form-section">
            <div class="form-row">
                <label class="form-label" for="${_('entryName')}">Name / Title</label>
                <input type="text" id="${_('entryName')}" class="form-input" placeholder="Entry name…">
            </div>

            <div class="form-row">
                <label class="form-label">Activation Type</label>
                <div class="activation-type-group">
                    <label class="radio-pill">
                        <input type="radio" name="${radioName}" value="keyword" checked>
                        <span>🟢 Keyword</span>
                    </label>
                    <label class="radio-pill">
                        <input type="radio" name="${radioName}" value="constant">
                        <span>🔵 Constant</span>
                    </label>
                    <label class="radio-pill">
                        <input type="radio" name="${radioName}" value="disabled">
                        <span>⚫ Disabled</span>
                    </label>
                </div>
            </div>

            <div class="form-row" id="${_('keywordsSection')}">
                <label class="form-label" for="${_('primaryKeywords')}">Primary Keywords</label>
                <div class="keyword-pill-input" id="${_('primaryKeywords')}" data-uid="${uid}" data-field="key">
                    <input type="text" class="keyword-pill-entry" placeholder="Type and press Enter or comma…" aria-label="Add a keyword">
                </div>
                <small class="form-hint">Enter or comma adds a keyword. Backspace removes the last. Regex like <code>/foo|bar/i</code> works.</small>
            </div>

            <div class="form-row" id="${_('secondaryKeywordsSection')}">
                <div class="form-label-row">
                    <label class="form-label" for="${_('secondaryKeywords')}">Secondary Keywords</label>
                    <select id="${_('selectiveLogic')}" class="logic-select">
                        <option value="0">AND ANY</option>
                        <option value="3">AND ALL</option>
                        <option value="1">NOT ALL</option>
                        <option value="2">NOT ANY</option>
                    </select>
                </div>
                <div class="keyword-pill-input" id="${_('secondaryKeywords')}" data-uid="${uid}" data-field="keysecondary">
                    <input type="text" class="keyword-pill-entry" placeholder="Optional filter keywords…" aria-label="Add a secondary keyword">
                </div>
            </div>

            <div class="form-row">
                <label class="form-label" for="${_('entryContent')}">Content</label>
                <textarea id="${_('entryContent')}" class="form-textarea" rows="8" placeholder="Entry content…"></textarea>
            </div>
        </section>

        <details class="advanced-section" id="${_('advancedSection')}">
            <summary class="advanced-toggle">
                <span class="material-symbols-rounded">tune</span>
                Advanced Settings
            </summary>
            <div class="advanced-content">
                <fieldset class="form-fieldset">
                    <legend>Positioning</legend>
                    <div class="form-row">
                        <label class="form-label" for="${_('insertionPosition')}">Insertion Position</label>
                        <select id="${_('insertionPosition')}" class="form-select">
                            <option value="0">↑ Before Char Defs</option>
                            <option value="1">↓ After Char Defs</option>
                            <option value="2">↑ Before Author's Note</option>
                            <option value="3">↓ After Author's Note</option>
                            <option value="4">@ Depth</option>
                            <option value="5">↑ Before Example Messages</option>
                            <option value="6">↓ After Example Messages</option>
                            <option value="7">🔌 Outlet</option>
                        </select>
                    </div>
                    <div class="form-row depth-row" id="${_('depthRow')}" style="display:none;">
                        <div class="form-col">
                            <label class="form-label" for="${_('insertionDepth')}">Depth</label>
                            <input type="number" id="${_('insertionDepth')}" class="form-input" value="4" min="0">
                        </div>
                        <div class="form-col">
                            <label class="form-label" for="${_('insertionRole')}">Role</label>
                            <select id="${_('insertionRole')}" class="form-select">
                                <option value="0">System</option>
                                <option value="1">User</option>
                                <option value="2">Assistant</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row" id="${_('outletRow')}" style="display:none;">
                        <label class="form-label" for="${_('outletName')}">Outlet Name</label>
                        <input type="text" id="${_('outletName')}" class="form-input" placeholder="outlet_name">
                    </div>
                    <div class="form-row">
                        <label class="form-label" for="${_('orderNumber')}">Order Number</label>
                        <input type="number" id="${_('orderNumber')}" class="form-input" value="100" min="0">
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Timing &amp; Probability</legend>
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label" for="${_('probability')}">Trigger %</label>
                            <input type="number" id="${_('probability')}" class="form-input" value="100" min="0" max="100">
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('sticky')}">Sticky</label>
                            <input type="number" id="${_('sticky')}" class="form-input" value="0" min="0">
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('cooldown')}">Cooldown</label>
                            <input type="number" id="${_('cooldown')}" class="form-input" value="0" min="0">
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('delay')}">Delay</label>
                            <input type="number" id="${_('delay')}" class="form-input" value="0" min="0">
                        </div>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Recursion</legend>
                    <div class="checkbox-group">
                        <label class="checkbox-label"><input type="checkbox" id="${_('excludeRecursion')}"> <span>Non-recursable (exclude from recursion)</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('preventRecursion')}"> <span>Prevent further recursion</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('delayUntilRecursion')}"> <span>Delay until recursion</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('ignoreBudget')}"> <span>Ignore token budget</span></label>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Group Settings</legend>
                    <div class="form-row">
                        <label class="form-label" for="${_('inclusionGroup')}">Inclusion Group</label>
                        <input type="text" id="${_('inclusionGroup')}" class="form-input" placeholder="Group name…">
                    </div>
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label" for="${_('groupWeight')}">Group Weight</label>
                            <input type="number" id="${_('groupWeight')}" class="form-input" value="100" min="0">
                        </div>
                        <div class="form-row">
                            <label class="checkbox-label inline">
                                <input type="checkbox" id="${_('groupOverride')}">
                                <span>Prioritize in group</span>
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Per-Entry Overrides</legend>
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label" for="${_('scanDepthOverride')}">Scan Depth</label>
                            <input type="number" id="${_('scanDepthOverride')}" class="form-input" placeholder="Use global">
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('caseSensitiveOverride')}">Case Sensitive</label>
                            <select id="${_('caseSensitiveOverride')}" class="form-select">
                                <option value="">Use global</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('wholeWordOverride')}">Match Whole Words</label>
                            <select id="${_('wholeWordOverride')}" class="form-select">
                                <option value="">Use global</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="${_('groupScoringOverride')}">Group Scoring</label>
                            <select id="${_('groupScoringOverride')}" class="form-select">
                                <option value="">Use global</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label" for="${_('automationId')}">Automation ID</label>
                        <input type="text" id="${_('automationId')}" class="form-input" placeholder="For STscript automation…">
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Character Filter</legend>
                    <div class="form-row">
                        <label class="checkbox-label">
                            <input type="checkbox" id="${_('characterFilterExclude')}">
                            <span>Exclude (instead of include)</span>
                        </label>
                    </div>
                    <div class="form-row">
                        <label class="form-label" for="${_('characterFilterNames')}">Character Names</label>
                        <input type="text" id="${_('characterFilterNames')}" class="form-input" placeholder="Name1, Name2, …">
                    </div>
                    <div class="form-row">
                        <label class="form-label" for="${_('characterFilterTags')}">Character Tags</label>
                        <input type="text" id="${_('characterFilterTags')}" class="form-input" placeholder="Tag1, Tag2, …">
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Generation Triggers</legend>
                    <div class="checkbox-group horizontal">
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerNormal')}" data-trigger="normal"> <span>Normal</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerContinue')}" data-trigger="continue"> <span>Continue</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerImpersonate')}" data-trigger="impersonate"> <span>Impersonate</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerSwipe')}" data-trigger="swipe"> <span>Swipe</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerRegenerate')}" data-trigger="regenerate"> <span>Regenerate</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('triggerQuiet')}" data-trigger="quiet"> <span>Quiet</span></label>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend>Additional Matching Sources</legend>
                    <div class="checkbox-group">
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchPersonaDescription')}"> <span>Persona Description</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchCharacterDescription')}"> <span>Character Description</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchCharacterPersonality')}"> <span>Character Personality</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchScenario')}"> <span>Scenario</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchCharacterDepthPrompt')}"> <span>Character's Note (Depth Prompt)</span></label>
                        <label class="checkbox-label"><input type="checkbox" id="${_('matchCreatorNotes')}"> <span>Creator's Notes</span></label>
                    </div>
                </fieldset>
            </div>
        </details>
    </form>
</div>
    `.trim();
}

/**
 * Convenience: return the field element for an entry and base id.
 */
export function field(base, uid) {
    return document.getElementById(fid(base, uid));
}

/**
 * Activation-type radios live by NAME, not ID.
 */
export function activationRadios(uid) {
    return document.querySelectorAll(`input[name="activationType_${uid}"]`);
}

/**
 * Trigger checkboxes — query within the form to keep them scoped.
 */
export function triggerCheckboxes(uid) {
    const form = document.getElementById(`entryForm_${uid}`);
    if (!form) return [];
    return form.querySelectorAll('input[data-trigger]');
}

/* ---------- Keyword pill input ---------- */

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function buildPill(value) {
    const span = document.createElement('span');
    span.className = 'keyword-pill';
    span.dataset.value = value;
    span.innerHTML = `<span class="text">${escapeHtml(value)}</span><button type="button" class="keyword-pill-remove" aria-label="Remove ${escapeHtml(value)}" tabindex="-1">×</button>`;
    return span;
}

/**
 * Render the pills inside a keyword container from an array of values.
 * Preserves any text the user has typed but not committed.
 */
export function setKeywordPills(uid, base, values) {
    const container = document.getElementById(fid(base, uid));
    if (!container) return;
    container.querySelectorAll('.keyword-pill').forEach(p => p.remove());
    const input = container.querySelector('.keyword-pill-entry');
    (values || []).forEach(v => {
        const value = (v ?? '').toString();
        if (!value) return;
        container.insertBefore(buildPill(value), input);
    });
}

/**
 * Extract keyword values from the pill container, including any text the
 * user has typed but not yet committed.
 */
export function getKeywordValues(uid, base) {
    const container = document.getElementById(fid(base, uid));
    if (!container) return [];
    const pills = Array.from(container.querySelectorAll('.keyword-pill'))
        .map(p => p.dataset.value || p.querySelector('.text')?.textContent || '');
    const input = container.querySelector('.keyword-pill-entry');
    const pending = input ? input.value.trim() : '';
    if (pending) pills.push(pending);
    return pills.map(v => v.trim()).filter(Boolean);
}

/**
 * Wire keyboard / paste / click handlers on a pill container.
 * Dispatches 'change' on the container so the form's autosave catches it.
 */
export function wireKeywordPillInput(container) {
    if (!container || container.dataset.wired === '1') return;
    container.dataset.wired = '1';

    const input = container.querySelector('.keyword-pill-entry');
    if (!input) return;

    const notify = () => container.dispatchEvent(new Event('change', { bubbles: true }));

    const commit = (text) => {
        const value = (text ?? '').trim();
        if (!value) return false;
        const existing = Array.from(container.querySelectorAll('.keyword-pill'))
            .map(p => p.dataset.value);
        if (existing.includes(value)) return false;
        container.insertBefore(buildPill(value), input);
        return true;
    };

    // Click anywhere in the empty space → focus the entry
    container.addEventListener('click', (e) => {
        if (e.target === container) input.focus();
        const removeBtn = e.target.closest('.keyword-pill-remove');
        if (removeBtn) {
            removeBtn.closest('.keyword-pill').remove();
            notify();
            input.focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        // Comma inside an unclosed regex literal is part of the regex
        // (e.g. .{0,15} quantifier, (a|b,c) group) — let it through.
        if (e.key === ',' && isInsideUnclosedRegex(input.value)) return;
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (commit(input.value)) notify();
            input.value = '';
        } else if (e.key === 'Backspace' && input.value === '') {
            const pills = container.querySelectorAll('.keyword-pill');
            const last = pills[pills.length - 1];
            if (last) {
                last.remove();
                notify();
            }
        }
    });

    // Pasting a comma-separated list adds them as separate pills.
    // Uses splitKeywords so commas inside regex bodies (.{0,15}, (a|b,c))
    // don't fragment a single regex into broken pieces.
    input.addEventListener('paste', (e) => {
        const text = e.clipboardData?.getData('text');
        if (!text) return;
        const pieces = splitKeywords(text);
        if (pieces.length <= 1) return;  // single value, let default paste fill the input
        e.preventDefault();
        let added = false;
        for (const piece of pieces) {
            if (commit(piece)) added = true;
        }
        input.value = '';
        if (added) notify();
    });

    // Committing on blur catches partially-typed keywords on form submit / tab away
    input.addEventListener('blur', () => {
        if (commit(input.value)) notify();
        input.value = '';
    });
}

/**
 * Split a string of comma-separated keywords into individual values while
 * preserving commas that live inside regex literals (e.g. `.{0,15}` or
 * `(a|b,c)`). A regex literal starts with `/` and ends with the matching
 * unescaped `/[flags]`. Anything else is treated as plain text.
 */
export function splitKeywords(text) {
    if (!text) return [];
    const out = [];
    let cur = '';
    let inRegex = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (escaped) { cur += c; escaped = false; continue; }
        if (c === '\\') { cur += c; escaped = true; continue; }
        // Enter regex mode only when the slash starts a fresh piece — so
        // `foo/bar` (no leading slash) stays a single literal keyword.
        if (!inRegex && c === '/' && cur.trim() === '') {
            inRegex = true;
            cur += c;
            continue;
        }
        if (inRegex && c === '/') {
            cur += c;
            // Consume trailing flag letters so `/foo/i` ends on the i.
            while (i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
                cur += text[++i];
            }
            inRegex = false;
            continue;
        }
        if (!inRegex && c === ',') {
            if (cur.trim()) out.push(cur.trim());
            cur = '';
            continue;
        }
        cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

/**
 * Return true if the input text starts a regex literal that hasn't been
 * closed yet — used by the keydown handler so a `,` keypress in the
 * middle of typing a regex falls through as a literal character.
 */
export function isInsideUnclosedRegex(text) {
    if (!text || text[0] !== '/') return false;
    let escaped = false;
    for (let i = 1; i < text.length; i++) {
        const c = text[i];
        if (escaped) { escaped = false; continue; }
        if (c === '\\') { escaped = true; continue; }
        if (c === '/') return false;  // closed
    }
    return true;
}

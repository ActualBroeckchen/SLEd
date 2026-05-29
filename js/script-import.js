/**
 * SLEd - Import lorebooks from SillyTavern orchestrator and JanitorAI scripts.
 *
 * Parses JavaScript files in two community-popular shapes:
 *
 * 1. SillyTavern "orchestrator" scripts:
 *      var coreRules = "..." + "..." + ...;
 *      var PACK_NAME = { limit: N, rules: [{ keywords, scenario, personality }] };
 *      (function () { ... var LOCATIONS = [...]; var ENCOUNTER_CHOICES = [...]; })();
 *
 * 2. JanitorAI "Nine API v1" scripts (community / Tydorius convention,
 *    documented at help.janitorai.com — "What Are Scripts" + Tydorius's
 *    Complex_Lorebook_Template.js):
 *      const loreEntries = [{
 *          keywords: [...],       // or `keys`
 *          priority, minMessages, // or min_messages
 *          probability,           // 0..1 (sometimes 0..100)
 *          filters: { requiresAny, requiresAll, notWith },
 *          category,
 *          scenario, personality, // appended to context.character.*
 *          triggers               // cascade keys — no clean ST analog
 *      }];
 *
 * The script is executed inside a `new Function()` with a stubbed `context`
 * so we can read the computed values of those declarations directly — that's
 * the only reliable way to handle string-concatenation, comments, FEATURES
 * toggles wrapping entry blocks, etc. Side effects on the stubbed context
 * are discarded.
 */

import { createDefaultEntry } from './utils.js';

/**
 * Parse an orchestrator or JanitorAI script and return its captured globals.
 * @param {string} text  Raw script source.
 * @returns {{ coreRules: string|null, packs: Object, locations: Array|null, encounters: Array|null, janitorEntries: Array|null, error: string|null }}
 */
export function parseLorebookScript(text) {
    const stripped = stripIIFEs(text);
    const packNames = findDeclaredNames(stripped, /^PACK_[A-Z0-9_]+$/);
    // Anything that smells like a pack but lives only inside the IIFE we
    // already hoisted, plus the known top-levels.
    const wantedVars = [...new Set([
        ...packNames,
        'coreRules', 'LOCATIONS', 'ENCOUNTER_CHOICES',
        'loreEntries'
    ])];

    // const/let are block-scoped — when the script lives inside our wrapper's
    // try { ... }, those bindings can't be read by the capture sentinel
    // outside the try. Rewrite the wanted names to `var` so they leak to the
    // function scope. Only matches the exact identifier so inner helpers
    // (e.g. `const FEATURES = ...`) stay untouched.
    const lifted = liftBindingsToVar(stripped, wantedVars);

    const captures = wantedVars.map(n =>
        `try { if (typeof ${n} !== 'undefined') __out[${JSON.stringify(n)}] = ${n}; } catch(e){}`
    ).join('\n');

    const body = `
        var context = {
            character: { personality: '', scenario: '' },
            chat: { last_message: '', history: [] }
        };
        // Force any "if (Math.random() > 0.x) return;" gate to fall through
        // so ENCOUNTER_CHOICES gets assigned before the IIFE returns.
        var __origRandom = Math.random;
        Math.random = function () { return 0; };
        try {
            ${lifted}
        } catch (e) { /* orchestration may throw on stubbed context — captures are still read below */ }
        finally { Math.random = __origRandom; }
        var __out = {};
        ${captures}
        return __out;
    `;

    let raw;
    try {
        raw = (new Function(body))();
    } catch (e) {
        return {
            coreRules: null, packs: {}, locations: null, encounters: null,
            janitorEntries: null, error: e.message
        };
    }

    const out = {
        coreRules: typeof raw.coreRules === 'string' ? raw.coreRules : null,
        packs: {},
        locations: Array.isArray(raw.LOCATIONS) ? raw.LOCATIONS : null,
        encounters: Array.isArray(raw.ENCOUNTER_CHOICES) ? raw.ENCOUNTER_CHOICES : null,
        janitorEntries: Array.isArray(raw.loreEntries) ? raw.loreEntries : null,
        error: null
    };
    for (const name of packNames) {
        const v = raw[name];
        if (v && Array.isArray(v.rules)) out.packs[name] = v;
    }
    return out;
}

/**
 * Convert a parse result into a SillyTavern-format lorebook object
 * (the same shape the JSON importer expects: { entries: { uid: entry } }).
 *
 * @param {ReturnType<typeof parseLorebookScript>} parsed
 * @param {string} sourceName  File name (without extension) used as fallback lorebook name.
 * @returns {{ name: string, entries: Object<number, Object> }}
 */
export function convertParsedToLorebook(parsed, sourceName = 'imported') {
    const entries = {};
    let uid = 0;
    let order = 1;

    // Sidebar sorts ASC by order, so low order = top of list. We hand out
    // ascending positive integers and keep order stable with import order.
    const make = (overrides) => {
        const entry = createDefaultEntry(uid, order++);
        Object.assign(entry, overrides);
        // Caller never specifies order — keep auto-assignment in charge.
        entries[uid] = entry;
        uid++;
    };

    // 1. coreRules → one always-on entry. First in the list so it's the
    //    first thing the user sees when they open the imported lorebook.
    if (parsed.coreRules) {
        make({
            comment: 'Core Setup',
            content: parsed.coreRules,
            constant: true,
            selective: false,
            position: 0,
            group: 'Setup'
        });
    }

    // 2. Each PACK_* rule → keyword entry grouped by the pack.
    for (const [packName, pack] of Object.entries(parsed.packs || {})) {
        const groupLabel = packLabel(packName);
        const useScoring = typeof pack.limit === 'number' && pack.limit < pack.rules.length;
        pack.rules.forEach((rule, idx) => {
            const content = joinContent(rule.scenario, rule.personality);
            const first = (rule.keywords || [])[0] || `rule ${idx + 1}`;
            make({
                comment: `${groupLabel} — ${first}`,
                key: (rule.keywords || []).map(String),
                content,
                position: 0,
                group: groupLabel,
                useGroupScoring: useScoring || null,
                groupWeight: 100
            });
        });
    }

    // 3. LOCATIONS → sticky scene entries.
    if (Array.isArray(parsed.locations)) {
        for (const loc of parsed.locations) {
            const words = (loc.words || []).map(String);
            make({
                comment: `Scene: ${loc.id || words[0] || 'location'}`,
                key: words,
                content: loc.text || '',
                position: 0,
                group: 'Locations',
                useGroupScoring: true,
                sticky: 5
            });
        }
    }

    // 4. ENCOUNTER_CHOICES → probabilistic entries, gated to their location's
    //    keywords so they only fire when that scene is active.
    if (Array.isArray(parsed.encounters)) {
        const locWords = new Map();
        if (Array.isArray(parsed.locations)) {
            for (const l of parsed.locations) {
                locWords.set(l.id, (l.words || []).map(String));
            }
        }
        const perLocCount = new Map();
        for (const enc of parsed.encounters) {
            const locId = enc.location || 'GLOBAL';
            const n = (perLocCount.get(locId) || 0) + 1;
            perLocCount.set(locId, n);
            const keys = locWords.get(locId) || [];
            make({
                comment: `Encounter @ ${locId} #${n}`,
                key: keys,
                content: joinContent(enc.scenario, enc.personality),
                position: 0,
                group: `Encounters: ${locId}`,
                useGroupScoring: true,
                groupWeight: enc.weight || 1,
                probability: 15,
                useProbability: true,
                cooldown: 1
            });
        }
    }

    // 5. JanitorAI loreEntries → keyword entries. Field aliases per the
    //    community convention (keys/keywords, min_messages/minMessages).
    //    Filters become keysecondary + selectiveLogic; probability is
    //    scaled to ST's 0–100 range. Cascading `triggers` have no native
    //    ST equivalent — we leave a note on the entry's comment so the
    //    user knows the cascade was dropped.
    if (Array.isArray(parsed.janitorEntries)) {
        for (const j of parsed.janitorEntries) {
            const keys = normaliseKeyList(j.keywords ?? j.keys);
            if (!keys.length) continue;

            const filters = j.filters || {};
            const { keysecondary, selectiveLogic, selective } = janitorFilters(filters);

            const prob = scaleJanitorProbability(j.probability);
            const category = (j.category || '').toString().trim();
            const overrides = {
                comment: `${category ? category + ' — ' : ''}${keys[0]}`,
                key: keys,
                keysecondary,
                selective,
                selectiveLogic,
                content: joinContent(j.scenario, j.personality),
                position: 0,
                group: category || 'JanitorAI'
            };
            if (prob != null) {
                overrides.probability = prob;
                overrides.useProbability = true;
            }
            if (Array.isArray(j.triggers) && j.triggers.length) {
                overrides.comment += ' (cascade dropped)';
            }
            make(overrides);
        }
    }

    return {
        name: sourceName.replace(/\.(js|txt)$/i, ''),
        entries
    };
}

/**
 * Tally what was captured for the import-summary modal.
 */
export function summariseParsed(parsed) {
    const packs = Object.entries(parsed.packs || {});
    const packRules = packs.reduce((n, [, p]) => n + (p.rules?.length || 0), 0);
    const janitorCount = parsed.janitorEntries?.length || 0;
    return {
        coreRules: parsed.coreRules ? 1 : 0,
        packCount: packs.length,
        packRuleCount: packRules,
        locationCount: parsed.locations?.length || 0,
        encounterCount: parsed.encounters?.length || 0,
        janitorEntryCount: janitorCount,
        total: (parsed.coreRules ? 1 : 0) +
               packRules +
               (parsed.locations?.length || 0) +
               (parsed.encounters?.length || 0) +
               janitorCount
    };
}

/* ---------- internals ---------- */

/**
 * Hoist the contents of any `(function () { ... })();` IIFE up into the
 * outer scope so its `var` declarations become readable to our captures,
 * then neutralise bare `return;` statements that were inside those IIFEs —
 * once hoisted they would otherwise short-circuit our wrapper Function and
 * skip the capture sentinel. We deliberately only match `return;` (no
 * value), so `return list[i];` inside helper functions stays intact.
 */
function stripIIFEs(text) {
    const re = /\(\s*function\s*\(\s*\)\s*\{([\s\S]*?)\}\s*\)\s*\(\s*\)\s*;?/g;
    let prev;
    let cur = text;
    do {
        prev = cur;
        cur = cur.replace(re, '$1');
    } while (cur !== prev);
    cur = cur.replace(/\breturn\s*;/g, '/*sled-return*/;');
    return cur;
}

/**
 * Rewrite `const NAME` / `let NAME` to `var NAME` for the specific names
 * we want to capture, so their bindings hoist out of any enclosing block
 * (including our wrapper's try/catch). Other const/let declarations in
 * the script — helpers, IIFE locals — are left untouched.
 */
function liftBindingsToVar(text, names) {
    if (!names.length) return text;
    const pattern = new RegExp(
        '\\b(?:const|let)(\\s+(?:' + names.map(escapeRegex).join('|') + ')\\b)',
        'g'
    );
    return text.replace(pattern, 'var$1');
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find all `var|let|const NAME = ` declarations whose NAME matches the
 * supplied test regex. Returns the unique names.
 */
function findDeclaredNames(text, nameTest) {
    const re = /\b(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
    const out = new Set();
    let m;
    while ((m = re.exec(text)) !== null) {
        if (nameTest.test(m[1])) out.add(m[1]);
    }
    return Array.from(out);
}

function packLabel(packName) {
    return packName
        .replace(/^PACK_/, '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

function joinContent(scenario, personality) {
    return [scenario, personality].filter(Boolean).join('\n\n');
}

/**
 * Normalise a primary-key field: accepts an array, a single string, or
 * undefined; trims and drops empties. Preserves regex syntax verbatim.
 */
function normaliseKeyList(v) {
    if (!v) return [];
    const arr = Array.isArray(v) ? v : [v];
    return arr
        .map(k => (k == null ? '' : String(k).trim()))
        .filter(Boolean);
}

/**
 * Map JanitorAI `filters` to SillyTavern secondary keys + selectiveLogic.
 *   requiresAny → AND ANY  (0)
 *   requiresAll → AND ALL  (3)
 *   notWith     → NOT ANY  (1)
 * ST entries only support one selectiveLogic per entry, so if multiple
 * filter buckets are present we prefer requiresAll > requiresAny > notWith
 * (the more restrictive wins) and concatenate the rest into the secondary
 * key list — best-effort, but matches how most authors use these filters.
 */
function janitorFilters(filters) {
    const all = normaliseKeyList(filters.requiresAll);
    const any = normaliseKeyList(filters.requiresAny);
    const not = normaliseKeyList(filters.notWith);
    if (!all.length && !any.length && !not.length) {
        return { keysecondary: [], selectiveLogic: 0, selective: false };
    }
    let selectiveLogic = 0;
    let keysecondary = [];
    if (all.length) {
        selectiveLogic = 3;
        keysecondary = all.concat(any, not);
    } else if (any.length) {
        selectiveLogic = 0;
        keysecondary = any.concat(not);
    } else {
        selectiveLogic = 1;
        keysecondary = not;
    }
    return { keysecondary, selectiveLogic, selective: true };
}

/**
 * JanitorAI's `probability` is typically 0..1 in community templates but
 * some authors write 0..100. Heuristic: any value strictly above 1 is
 * treated as a percent, otherwise multiplied by 100. Clamped to 1..100;
 * returns null if the input is missing / unusable.
 */
function scaleJanitorProbability(p) {
    if (p == null) return null;
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0) return null;
    const pct = n > 1 ? n : n * 100;
    return Math.max(1, Math.min(100, Math.round(pct)));
}

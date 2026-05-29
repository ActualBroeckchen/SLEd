/**
 * SLEd - Import lorebooks from SillyTavern orchestrator scripts.
 *
 * Parses JavaScript files that follow the common orchestrator pattern:
 *   - var coreRules = "..." + "..." + ...;
 *   - var PACK_NAME = { limit: N, rules: [{ keywords, scenario, personality }] };
 *   - (function () { ... var LOCATIONS = [...]; var ENCOUNTER_CHOICES = [...]; })();
 *
 * The script is executed inside a `new Function()` with a stubbed `context`
 * so we can read the computed values of those declarations directly — that's
 * the only reliable way to handle string-concatenation, comments, multi-line
 * arrays, etc. Side effects on the stubbed context are discarded.
 */

import { createDefaultEntry } from './utils.js';

/**
 * Parse a SillyTavern orchestrator script and return its captured globals.
 * @param {string} text  Raw script source.
 * @returns {{ coreRules: string|null, packs: Object, locations: Array|null, encounters: Array|null, error: string|null }}
 */
export function parseLorebookScript(text) {
    const stripped = stripIIFEs(text);
    const packNames = findDeclaredNames(stripped, /^PACK_[A-Z0-9_]+$/);
    // Anything that smells like a pack but lives only inside the IIFE we
    // already hoisted, plus the known top-levels.
    const wantedVars = [...new Set([
        ...packNames,
        'coreRules', 'LOCATIONS', 'ENCOUNTER_CHOICES'
    ])];

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
            ${stripped}
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
        return { coreRules: null, packs: {}, locations: null, encounters: null, error: e.message };
    }

    const out = {
        coreRules: typeof raw.coreRules === 'string' ? raw.coreRules : null,
        packs: {},
        locations: Array.isArray(raw.LOCATIONS) ? raw.LOCATIONS : null,
        encounters: Array.isArray(raw.ENCOUNTER_CHOICES) ? raw.ENCOUNTER_CHOICES : null,
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
    return {
        coreRules: parsed.coreRules ? 1 : 0,
        packCount: packs.length,
        packRuleCount: packRules,
        locationCount: parsed.locations?.length || 0,
        encounterCount: parsed.encounters?.length || 0,
        total: (parsed.coreRules ? 1 : 0) +
               packRules +
               (parsed.locations?.length || 0) +
               (parsed.encounters?.length || 0)
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

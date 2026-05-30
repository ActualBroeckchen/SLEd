# SLEd — User Documentation

The README covers what SLEd is. This file covers how to use it. If you just want to try the app, it's live at [actualbroeckchen.github.io/SLEd](https://actualbroeckchen.github.io/SLEd/) — no install required.

## Table of contents

- [Quickstart](#quickstart)
- [The interface](#the-interface)
- [Importing](#importing)
  - [SillyTavern JSON](#sillytavern-json)
  - [SillyTavern orchestrator scripts](#sillytavern-orchestrator-scripts)
  - [JanitorAI scripts](#janitorai-scripts)
  - [Replace vs Merge](#replace-vs-merge)
- [Editing entries](#editing-entries)
  - [The sidebar](#the-sidebar)
  - [Tabs and side-by-side](#tabs-and-side-by-side)
  - [Auto-save and the unsaved dot](#auto-save-and-the-unsaved-dot)
  - [Keyword pills (with regex)](#keyword-pills-with-regex)
- [Entry field reference](#entry-field-reference)
  - [Activation type](#activation-type)
  - [Primary and secondary keywords](#primary-and-secondary-keywords)
  - [Content](#content)
  - [Advanced — positioning](#advanced--positioning)
  - [Advanced — timing and probability](#advanced--timing-and-probability)
  - [Advanced — recursion](#advanced--recursion)
  - [Advanced — per-entry overrides](#advanced--per-entry-overrides)
- [Search and replace](#search-and-replace)
- [Merging another lorebook](#merging-another-lorebook)
- [Exporting](#exporting)
  - [JSON](#json)
  - [Text export](#text-export)
- [Settings](#settings)
- [Install as a PWA](#install-as-a-pwa)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Privacy and data](#privacy-and-data)
- [Project layout (for contributors)](#project-layout-for-contributors)

---

## Quickstart

1. Open `index.html` in a browser, or visit the live URL.
2. Click **Import Lorebook** and pick a `.json` SillyTavern lorebook (or a `.js` orchestrator / JanitorAI script).
3. Tap an entry in the sidebar to open it in a tab. Edit. The form auto-saves to your browser.
4. When you want a file back, click **Export** and pick JSON or text.

Nothing is uploaded. Everything lives in your browser's `localStorage`.

## The interface

```
+-----------------------------------------------------+
| Header: name • count            tools (☀ ? ⌕ ⚙)    |
+----------+------------------------------------------+
| Sidebar  | Tab strip                                |
|          +------------------------------------------+
|  zoom v  |                                          |
|  filter  |  Entry form (or welcome / multi-pane)    |
|  entries |                                          |
|          |                                          |
|          |                                          |
|          +------------------------------------------+
|          | Action bar: Import • Export • Merge • Save|
+----------+------------------------------------------+
```

On phones the sidebar becomes a drawer that opens with the menu icon at the top-left and auto-closes when you tap an entry.

## Importing

The **Import** button (and `Ctrl+I`) accepts three formats. SLEd dispatches by file extension and a quick content sniff:

| Extension | Treated as | Path |
|---|---|---|
| `.json` | SillyTavern lorebook | Direct load |
| `.js`, `.txt` | JS script (orchestrator or JanitorAI) | Parses, shows summary modal, then Replace or Merge |

### SillyTavern JSON

The canonical format. SLEd reads / writes the standard shape:

```json
{
  "name": "My Lorebook",
  "description": "",
  "scan_depth": 2,
  "token_budget": 2048,
  "recursive_scanning": false,
  "extensions": {},
  "entries": {
    "0": { "uid": 0, "key": [...], "content": "...", "..." }
  }
}
```

Every entry field from the SillyTavern schema is preserved on round-trip, including ones SLEd doesn't expose in its UI (e.g. `vectorized`, `matchPersonaDescription`, `characterFilter`).

### SillyTavern orchestrator scripts

A community pattern for SillyTavern that ships lorebook content as a JavaScript file. SLEd recognises four shapes that often appear together:

```js
// 1. A always-on world primer.
var coreRules = "World= ... " + "Era= ... " + ...;
context.character.scenario += coreRules;

// 2. Themed packs of keyword-triggered rules.
var PACK_RELIGION = { limit: 2, rules: [
  { keywords: ["god", "smith"],
    scenario:    "Religion: ...",
    personality: "Tone= zealous, ..."
  }
]};

// 3. Mutually-exclusive scene markers.
var LOCATIONS = [
  { id: "LOC_Tarnhold",
    words: ["tarnhold", "ringfort", "camp"],
    text:  "Active Scene: Tarnhold Ringfort. ..."
  }
];

// 4. Probabilistic events filtered by location.
var ENCOUNTER_CHOICES = [
  { weight: 1, location: "LOC_Tarnhold",
    scenario:    "Event= ...",
    personality: "Tone= ..."
  }
];
```

How each piece maps to lorebook fields:

| Script structure | Lorebook entries SLEd produces |
|---|---|
| `coreRules` (string) | One **Constant** entry, group `Setup`, Before Char Defs |
| Each rule in `PACK_*` | One **Keyword** entry; `keywords` → primary keys, `scenario` + `personality` joined into Content, group = pack name. Pack `limit` enables Group Scoring when smaller than the rule count |
| `LOCATIONS[]` | One **Keyword** entry per scene with **Sticky: 5**, group `Locations`, Group Scoring on |
| `ENCOUNTER_CHOICES[]` | One **Keyword** entry per encounter, primary keys copied from the parent location's `words`, **Trigger %: 15**, **Cooldown: 1**, group `Encounters: <LOC>`, Group Scoring on, `groupWeight` from the script |

The parser executes the script in a `new Function()` sandbox with a stubbed `context` and `Math.random → 0`. Side effects on the stubbed context are discarded. The wrapper hoists IIFE bodies so `var LOCATIONS = [...]` declared inside `(function(){ ... })()` is still readable, and neutralises bare `return;` statements that would otherwise short-circuit the wrapper.

### JanitorAI scripts

JanitorAI's "Scripts" feature (Nine API v1 beta — see [help.janitorai.com](https://help.janitorai.com/en/article/what-are-scripts-a-beginner-friendly-overview-1s89w2x/)) is the same JS-with-`context.character`-mutation shape. The community-standard entry layout, popularised by [Tydorius's templates](https://github.com/Tydorius/JanitorAI_Scripts), is a `loreEntries` array:

```js
const loreEntries = [
  {
    keywords: ['kingdom of example', 'the kingdom'],  // alias: keys
    priority: 10,
    minMessages: 0,                                    // alias: min_messages
    category: 'nation_example',
    probability: 0.7,                                  // 0..1 or 0..100
    filters: {
      requiresAny: ['trade', 'merchant'],
      requiresAll: ['mountain'],
      notWith:     ['enemy']
    },
    personality: ', familiar with the politics of …',  // appended to context.character.personality
    scenario:    ' The Example Kingdom is …',          // appended to context.character.scenario
    triggers:    ['magic', 'politics']                 // cascade keys (no ST analog)
  }
];
```

Mapping:

| JanitorAI field | Lorebook field |
|---|---|
| `keywords` / `keys` | Primary keywords |
| `filters.requiresAny` | Secondary keywords + Logic = **AND ANY** |
| `filters.requiresAll` | Secondary keywords + Logic = **AND ALL** |
| `filters.notWith` | Secondary keywords + Logic = **NOT ANY** |
| `scenario` + `personality` | Content (joined with a blank line) |
| `probability` | Trigger % (`0..1` is scaled ×100; anything > 1 is treated as already a percent) |
| `category` | Group label + comment prefix; missing → group `JanitorAI` |
| `triggers` | No native equivalent — entry's name gets `(cascade dropped)` so you know |

If multiple filter buckets are present, the most restrictive logic wins (`requiresAll` > `requiresAny` > `notWith`) and the extra keys are folded into the secondary list. Empty `keywords` entries are skipped.

### Replace vs Merge

After parsing a `.js` / `.txt` import, the summary modal shows how many entries the parser found and offers three buttons:

- **Cancel** — discard the import, no changes
- **Merge** — hand the parsed entries to the merge modal so you can tick which to bring in. UIDs are renumbered to avoid collisions with the current lorebook
- **Replace** — clear the current lorebook and load the parsed entries as a new one

JSON imports always replace (with an unsaved-changes confirm); they don't go through the script-import modal.

## Editing entries

### The sidebar

Each entry shows its order number, a status dot (🟢 Keyword, 🔵 Constant, ⚫ Disabled), its name, and a strip of primary-keyword pills. The zoom select toggles between **Compact** (one row per entry), **Normal** (default), and **Detailed** views.

Hover an entry — or tap on touch — to reveal per-entry quick actions: insert above, insert below, duplicate, enable / disable, delete. The number on the left is editable — type a different number and the rest of the list re-sequences. The checkbox enables multi-select: tick several entries, then drag any of them to move the whole group at once.

The filter box at the top of the sidebar searches names, primary keys, and content as you type.

### Tabs and side-by-side

Clicking an entry opens it in a tab. Multiple tabs can be open at once. Use `Ctrl+Tab` / `Ctrl+Shift+Tab` to cycle, `Ctrl+W` to close the current tab.

The side-by-side toggle in the tab strip splits the editor area into two panes — useful for comparing two entries' content or copy-pasting between them.

### Auto-save and the unsaved dot

The form saves to the in-browser state as you type (debounced by half a second). The orange dot (●) on the tab title and on the sidebar entry marks entries whose form differs from the last imported / exported state. Press the floppy-disk Save action — or `Ctrl+S` — to commit and clear the dot for the current entry.

Auto-save protects you against losing in-progress work between sessions. It does **not** export to disk — for that you still need the Export action.

### Keyword pills (with regex)

Primary and Secondary keyword inputs are pill chips:

- **Enter** or **,** adds whatever you typed as a new pill
- **Backspace** in an empty input removes the last pill
- **×** on a pill removes that specific one
- Pasting a comma-separated list creates one pill per value
- Blurring the input commits any pending text, so half-typed keywords aren't lost on save

Regex keys like `/foo|bar/i` are preserved verbatim — the pill stores the string as-is and ST treats it as a regex at runtime.

## Entry field reference

### Activation type

- **🟢 Keyword** — entry fires when one of its primary keys matches the recent chat history (subject to secondary keys, probability, etc.)
- **🔵 Constant** — always-on, no keys needed; useful for world primers
- **⚫ Disabled** — never fires; useful for entries you want to keep around without injecting

### Primary and secondary keywords

Primary keys gate the entry on / off. Secondary keys further filter when at least one primary has matched, using the **Logic** selector:

- **AND ANY** (default) — any secondary key matches → fire
- **AND ALL** — every secondary key must match → fire
- **NOT ALL** — fire unless every secondary key matches
- **NOT ANY** — fire unless any secondary key matches

### Content

The text that gets injected into the prompt when the entry activates.

### Advanced — positioning

`Insertion Position` controls where in the prompt the content lands:

| Option | Meaning |
|---|---|
| ↑ Before Char Defs | Above the character description |
| ↓ After Char Defs | Below the character description |
| ↑ Before Author's Note | Above the AN block |
| ↓ After Author's Note | Below the AN block |
| @ Depth | At a chat-message offset (reveals **Depth** and **Role**) |
| ↑ Before Example Messages | Above example dialogue |
| ↓ After Example Messages | Below example dialogue |
| 🔌 Outlet | Inserted into a named outlet (reveals **Outlet Name**) |

`Order Number` breaks ties when multiple entries land at the same position — higher order is processed first.

### Advanced — timing and probability

- **Trigger %** — chance the entry fires on any given activation (1–100)
- **Sticky** — once activated, the entry stays active for N more turns even without a re-match. Used for scenes that should persist
- **Cooldown** — minimum number of turns between firings
- **Delay** — number of turns to wait before the entry can fire at all

### Advanced — recursion

ST's "recursion" is the second-pass scan that lets one entry's content trigger another entry's keys.

- **Non-recursable** — this entry's content is not scanned for further triggers
- **Prevent further recursion** — this entry fires but no recursion happens after it
- **Delay until recursion** — entry only fires on the recursion pass, not the first pass
- **Ignore budget** — entry is included even if the token budget is exhausted

### Advanced — per-entry overrides

These three fields are tri-state (use global / yes / no), letting an entry deviate from the lorebook-wide defaults:

- **Case-sensitive** — keyword match is case-sensitive
- **Whole words** — `cat` does not match `category`
- **Group scoring** — when this entry is part of a group, score determines which entry from the group wins

## Search and replace

`Ctrl+H` (or the magnifying-glass icon) opens Search & Replace:

- **Find** / **Replace with** — text inputs
- **Case sensitive**, **Whole word**, **Regex** — toggle modifiers
- **Search in** — All fields / Content / Keywords / Names

Inside the Find input:

- **Enter** runs Find All
- **Shift+Enter** replaces the current match
- **Ctrl+Enter** replaces every match

Results show inline. Replacing modifies the in-memory state and marks the affected entries unsaved.

## Merging another lorebook

The Merge action picks a second `.json` lorebook, opens the merge modal listing every entry in the source, all pre-selected. Untick the ones you don't want, then **Merge Selected**. UIDs are renumbered so they don't collide with the current lorebook, and orders are shifted to the bottom of the list.

The Merge path also handles JS scripts: pick the **Merge** button in the script-import summary modal and the parsed entries flow into this same merge modal for tick-pick selection.

## Exporting

### JSON

Round-trip-safe SillyTavern lorebook JSON, pretty-printed by default. Use this when you're sending back to SillyTavern.

### Text export

A configurable plain-text view, useful for review, sharing, or import into other tools. The export modal offers seven include flags:

- Titles (the entry's name)
- Order numbers
- Content
- Primary keywords
- Secondary keywords + logic
- Status (Constant / Disabled badges)
- Comments

Tick what you want, pick a filename, and the file downloads. Each entry is separated by a horizontal rule.

## Settings

The gear icon opens Settings. Currently:

- **Appearance** — OpenDyslexic font toggle. Theme and editor font are in the header toolbar (sun / moon and `T` icons)
- **Keyboard Shortcuts** — reference list, no rebinding

Settings persist in `localStorage`.

## Install as a PWA

SLEd ships a manifest and a service worker, so it can be installed as a standalone app:

- **Chrome / Edge desktop** — click the install icon in the address bar or use the browser menu → Install
- **Android Chrome** — menu → Add to Home Screen
- **iOS Safari** — share menu → Add to Home Screen
- **Firefox** — supports manifest but install UI varies by platform

Installed, SLEd works fully offline once the service worker has cached the assets.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+I` | Import |
| `Ctrl+E` | Export |
| `Ctrl+M` | Merge |
| `Ctrl+N` | New entry |
| `Ctrl+S` | Save current entry |
| `Ctrl+W` | Close current tab |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Next / previous tab |
| `Ctrl+H` | Search & Replace |
| `Ctrl+D` | Toggle dark mode |
| `Ctrl+Shift+A` | Toggle dyslexia font |
| `F1` or `?` | Help |
| `Esc` | Close modal / sidebar drawer |

## Privacy and data

SLEd is a single static page. The only thing that touches the network is Google Fonts (Lexend Deca, Fredericka the Great, Noto Sans, Material Symbols) — and even those are cached by the service worker after first load. Your lorebooks never leave your browser. State lives in `localStorage` under keys prefixed `sled-`.

To wipe local state, clear site data for the SLEd origin in your browser, or open devtools and run `localStorage.clear()` in the console.

## Project layout (for contributors)

```
index.html               UI markup
styles.css               Mobile-first responsive styles + theme tokens
manifest.json            PWA manifest
service-worker.js        Offline cache + update lifecycle
js/
  main.js                Boot: wires elements, modals, shortcuts
  state.js               Central state object + session persistence
  elements.js            DOM element lookup table
  ui.js                  Form populate/read, sidebar/modal helpers
  utils.js               Defaults factory, debounce, escape, status icons
  sidebar.js             Entry list rendering, filter, drag-and-drop
  tabs.js                Tab strip + per-uid form lifecycle
  entries.js             Create / open / save / duplicate / delete
  form-template.js       Per-uid form HTML + keyword-pill helpers
  file-io.js             Import / export / merge flow
  script-import.js       Orchestrator and JanitorAI .js parser
  search.js              Search & Replace modal logic
SampleLB12122025.json    Sample lorebook for testing
Sledlogo*.png            Logo variants
LICENSE                  CC0 1.0
```

There's no build step. Modules use native ES `import` / `export`. To work on it, serve the root and edit — changes are live on reload. Run a quick syntax check with `for f in js/*.js; do node --check "$f"; done`.

Tests are manual today; the most useful integration check is to import `SampleLB12122025.json`, edit something, export, and diff against the original to confirm round-trip stability.

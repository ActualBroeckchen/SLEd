<h1 align="center">
  <img src="SledlogoLight.png#gh-light-mode-only" alt="SLEd" width="160"><img src="SledlogoDark.png#gh-dark-mode-only" alt="SLEd" width="160"><br>
  Simple Lorebook Editor
</h1>

<p align="center">
  A browser-based editor for SillyTavern lorebooks. No install, no account, no data leaves your device. Imports JSON, SillyTavern orchestrator scripts, and JanitorAI scripts.
</p>

---

## What it does

- Edit SillyTavern lorebook JSON in a tab-per-entry editor with side-by-side compare
- Import JanitorAI `loreEntries`-style scripts and SillyTavern orchestrator `.js` files alongside native JSON
- Search & replace across content, keywords, or names (case / whole-word / regex)
- Merge another lorebook into the current one, picking which entries to bring in
- Export back to JSON, or to a configurable text format for review
- Works offline as an installable PWA on phone and desktop

## Try it

- **Live demo** — open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
- **Install as a PWA** — visit the live URL on mobile or desktop, then add to home screen / install
- **Run locally** — clone the repo and serve the root with anything that hands out static files:

```bash
git clone https://github.com/actualbroeckchen/sled.git
cd sled
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step. No npm install. The whole app is vanilla HTML / CSS / ES modules.

## Highlights

- **Keyword pills.** Primary and secondary keywords are interactive chips. Type, comma, or Enter to add; Backspace or × to remove. Regex keys like `/foo|bar/i` are preserved verbatim.
- **Three import paths.** SillyTavern lorebook JSON, SillyTavern orchestrator JS (with `PACK_*`, `coreRules`, `LOCATIONS`, `ENCOUNTER_CHOICES`), and JanitorAI scripts (`loreEntries` arrays). See [DOCUMENTATION.md](DOCUMENTATION.md#importing) for the field mapping.
- **Auto-save to the browser.** Your work persists between visits. The orange dot on a tab marks unsaved changes; the save icon clears it.
- **Multi-entry workflow.** Open several entries at once, switch with tabs, or split the editor side-by-side to compare and copy between two entries.
- **Mobile-first.** Drawer auto-closes on entry tap, three-column activation pills on one row, toast lives above the form. Tested on Galaxy Note 9.
- **Accessibility.** Light and dark themes, OpenDyslexic font option, three sidebar zoom levels, keyboard shortcuts for every primary action.

## Documentation

See [**DOCUMENTATION.md**](DOCUMENTATION.md) for:

- The full import format reference (orchestrator scripts, JanitorAI scripts, JSON)
- Per-field reference for the entry editor (activation, positioning, timing, recursion)
- Search-and-replace, merging, text export options
- PWA install steps
- Keyboard shortcuts
- Project layout for contributors

## Privacy

SLEd is a single static page. It never sends your lorebooks anywhere — everything happens in your browser, persisted in `localStorage` for the next visit. The only network calls are for Google Fonts and Material Symbols (and only if your browser hasn't cached them yet).

## Browser support

Anything that supports ES modules, `<dialog>`, and CSS custom properties — that's every modern Chrome, Firefox, Safari, and Edge release. The PWA install path works on Chrome / Edge on desktop and on Chromium-based mobile browsers.

## License

CC0 1.0 (public domain dedication). See [LICENSE](LICENSE). Logos are hand-drawn by the author; if you fork, keep them or use your own.

## Project notes

SLEd was vibecoded with AI assistance. Free to fork and iterate. Not for sale. Issues and PRs welcome.

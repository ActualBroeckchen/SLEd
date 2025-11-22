# 📚 Simple Lorebook Editor (SLEd) v3.4 - Desktop Version

A lightweight, browser-based editor for SillyTavern lorebook files with an ADHD-friendly interface!

Perfect for creating detailed roleplay lorebooks with a clean, accessible design that keeps you focused on your creative work.

## Features

✨ **Clean Interface**
- Simple, uncluttered design with good spacing
- Main fields visible: Activation, Name/Title, Primary Keywords, Secondary Keywords with Logic, Content
- Advanced settings collapsed away until you need them
- Responsive layout optimized for desktop screens

📄 **Multi-Entry Editing**
- Open multiple entries in tabs
- Easily switch between entries
- **Side-by-side view**: Toggle (▥/▦ button) to see all open entries at once!
- Compare and copy between entries
- **● Unsaved indicator**: Orange dot on tabs shows which entries have unsaved changes
- Close tabs individually or all at once

🎯 **Quick Sidebar Actions**
- **Hover to reveal action buttons** on each entry
- **Insert Above/Below** (↑̶+ / ↓̶+): Add new entry right where you need it, UIDs auto-adjust
- **Copy** (📋): Duplicate an entry instantly
- **Delete** (🗑️): Remove entries without opening them
- All actions work directly from the sidebar!

🔀 **Import & Merge**
- **Import Lorebook**: Replace current lorebook with a new one
- **Import for Merging**: Bring entries from another lorebook into your current one
- Select which entries to merge with checkboxes
- UIDs automatically renumber to avoid conflicts
- Perfect for combining multiple lorebooks or cherry-picking entries

📊 **Smart Reordering**
- Each entry has a number (its UID)
- Change any entry's number to move it in the list
- Other entries automatically shift to make room
- Keeps everything organized and sequential
- Drag and drop support for visual reordering

🎯 **Multi-Select & Drag-Drop**
- Select multiple entries with checkboxes
- Drag and drop to reorder
- Drag multiple selected entries at once!
- Visual feedback when dragging
- Clear selection button to deselect all entries

📕 **Full Lorebook Support**
- Import/export SillyTavern JSON lorebooks
- **Export as Text**: Export your lorebook as a readable .txt file with customizable options
- **Main editing area**: Activation dropdown, Name/Title, Primary Keywords, Secondary Keywords with Logic dropdown, Content
- **Advanced settings (collapsed)**: All SillyTavern fields including:
  - Character Filter (include/exclude by names or tags)
  - Generation Triggers (Normal, Continue, Impersonate, Swipe, Regenerate, Quiet)
  - Additional Matching Sources (match against persona, character data, scenario, etc.)
  - All recursion, probability, timing, and positioning options
- **Insertion Position** dropdown with human-readable options (↑Char, ↓Char, @D, Outlet, etc.)
- Conditional fields that show/hide based on position:
  - **@D position**: Insertion Depth + Role selector (System/User/Assistant)
  - **Outlet position**: Outlet Name text field
  - **All positions**: Optional Scan Depth override (leave empty for global)

📖 **Easy Navigation**
- Searchable entry list
- See keywords and status at a glance
- Quick filtering
- Zoom controls for sidebar (Compact/Normal/Detailed view)
- Entry count display

🔍 **Search & Replace**
- **Find text** across all entries with multiple search scopes (Content, Keywords, Names, or All)
- **Advanced options**: Case-sensitive search, whole words only, regular expressions
- **Replace modes**: Find All to preview, Replace Next for sequential replacement, or Replace All for batch replacement
- **Keyboard shortcut**: Press Ctrl+H to open Search & Replace
- **Results preview**: See match context and click to jump to entries

♿ **Accessibility Features**
- **🌙 Dark Mode**: Toggle between creamy light mode and soothing dark chocolate mode
- **Aa Dyslexia Font**: Switch to OpenDyslexic font for easier reading
- Your preferences are saved automatically and persist between sessions
- All colors meet WCAG contrast requirements in both modes
- Three zoom levels for the sidebar: Compact, Normal, and Detailed

## How to Use

1. **Open the app**: Just open `index.html` in your web browser
2. **Name your lorebook** (optional): Enter a name in the header - this becomes your export filename!
3. **Import**: Click "📥 Import" dropdown and select "Import Lorebook"
4. **Edit**: Click any entry in the sidebar to open it
5. **Multiple tabs**: Click more entries to open them side-by-side
6. **Quick actions**: Hover over entries in the sidebar to see action buttons (insert, copy, delete)
7. **Merge lorebooks**: Click "Import for Merging" to cherry-pick entries from another lorebook
8. **Search & Replace**: Press Ctrl+H to find and replace text across entries (or click "🔍 Find & Replace")
9. **Save**: Click "💾 Save Changes" after editing (orange ● shows unsaved changes)
10. **Export**: Click "📤 Export" dropdown and choose "Export JSON" or "Export as Text"

## Tips

- **Activation dropdown** is now above the Name/Title field for better organization
- **Keywords are comma-separated** - just type "sword, magic, fire" in the keyword fields
- **Secondary Keywords Logic** determines how primary and secondary keywords work together (AND ANY, NOT ANY, NOT ALL, AND ALL)
- **Selective mode is automatic** - it turns on automatically when you add secondary keywords, and off when they're empty
- **Hover over sidebar entries** to reveal quick action buttons for copying, deleting, and inserting entries
- **The orange dot (●)** on tabs tells you when changes are yet unsaved
- **Merging lorebooks** - Use "Import for Merging" to combine entries from multiple lorebooks without losing your current work
- Advanced settings are collapsed by default - click to expand
- **Character Filter** - Control which characters this entry activates for (Include or Exclude mode)
- **Generation Triggers** - Limit entry to specific generation types (Normal, Continue, Impersonate, Swipe, Regenerate, Quiet). Empty = all types
- **Additional Matching Sources** - Match keywords against character/persona data instead of just chat messages:
  - Persona Description, Character Description, Character Personality
  - Character Depth Prompt, Scenario, Creator's Notes
- **Understanding the two depth fields**:
  - **Depth**: For @D position, this is where to inject the entry (Insertion Depth). For other positions, used for position-specific behavior
  - **Scan Depth Override**: Optional field to override how many messages back to scan for keywords (leave empty to use global setting)
- **Toggle side-by-side view** (▥/▦ button) to see multiple entries at once
- **Check multiple entries** and drag them together to reorder in bulk
- Click "Clear" to deselect all entries
- You can drag entries onto each other to reorder
- Search works on both entry names and keywords
- **Zoom controls** in the sidebar let you switch between Compact, Normal, and Detailed views

## ⌨️ Keyboard Shortcuts

Speed up your workflow with these handy shortcuts:

### File Operations
| Shortcut | Action |
|----------|--------|
| **Ctrl+I** | Import Lorebook |
| **Ctrl+E** | Export Lorebook |
| **Ctrl+M** | Import for Merging |

### Entry Management
| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | Create New Entry |
| **Ctrl+S** | Save Current Entry |
| **Ctrl+W** | Close Current Tab |

### Navigation
| Shortcut | Action |
|----------|--------|
| **Ctrl+Tab** | Next Tab |
| **Ctrl+Shift+Tab** | Previous Tab |

### Search & Replace
| Shortcut | Action |
|----------|--------|
| **Ctrl+H** | Open Search & Replace |
| **Enter** | Find All (in search field) |
| **Shift+Enter** | Replace Next (in search field) |
| **Ctrl+Enter** | Replace All (in replace field) |

### Display & Theme
| Shortcut | Action |
|----------|--------|
| **Ctrl+D** | Toggle Dark Mode |
| **Ctrl+Shift+A** | Toggle Dyslexia Font |
| **Ctrl+-** | Zoom Out Sidebar |
| **Ctrl++** | Zoom In Sidebar |

### Help
| Shortcut | Action |
|----------|--------|
| **F1** | Show README |
| **Shift+?** | Show README (Alternative) |

## Search & Replace Tips

- **Press Ctrl+H** to quickly open Search & Replace from anywhere
- **Find All first** - Always preview matches before using Replace All
- **Multiple scopes** - Choose what to search: Content, Keywords, Names, or All Fields
- **Match Case** - Enable for case-sensitive searches (finds "Dragon" but not "dragon")
- **Whole Words Only** - Prevents "dragon" from matching "dragonfly"
- **Regular Expressions** - Use patterns like `\b(sword|axe|mace)\b` for advanced searches
- **Replace modes**:
  - **Find All** - Shows all matches with context
  - **Replace Next** - Replace one occurrence at a time
  - **Replace All** - Batch replace everything (with confirmation)
- **Click results** - Click any search result to jump to that entry
- **Keyboard shortcuts**:
  - Enter = Find All (in search field)
  - Shift+Enter = Replace Next (in search field)
  - Ctrl+Enter = Replace All (in replace field)

## Advanced Settings Explained

### Activation Settings
- **Activation Dropdown**: Choose between:
  - 🔵 **Constant** (Always Active): Entry always activates regardless of keywords
  - 🟢 **Keyword-Activated**: Entry activates when keywords match (default)
  - 🔗 **Vector-Activated**: Entry uses vector/embedding matching
  - ⚫ **Inactive**: Entry is disabled and won't activate

### Position Settings
- **Order**: Numerical order of the entry in the lorebook
- **Insertion Position**: Where in the prompt the entry content is inserted
  - ↑Char (Before Character): Before character definition
  - ↓Char (After Character): After character definition
  - ↑AN (Before Author's Note): Before author's notes
  - ↓AN (After Author's Note): After author's notes
  - @D (At Depth): At a specific depth in the chatlog (number determines how many messages back, lower number = more recent = more important)
  - ↑EM (Before Examples): Before example messages
  - ↓EM (After Examples): After example messages
  - Outlet: Special outlet for custom content (outlet name can be used elsewhere as a macro to insert these entries)
- **Insertion Depth**: For @D position, specifies where in the prompt to insert
- **Role**: For @D position, specify the role (System, User, Assistant)

### Timing and Probability
- **Use Probability**: If checked, entry only activates based on probability percentage
- **Probability %**: Chance of activation (0-100%)
- **Sticky**: How many turns the entry remains active
- **Cooldown**: How many turns before the entry can activate again
- **Delay**: How many turns to wait before first activation

### Recursion Settings
- **Exclude Recursion**: Prevents entry from being activated by its own content
- **Prevent Recursion**: Prevents recursive activation
- **Delay Until Recursion**: Delays activation until recursion conditions are met
- **Ignore Budget**: Ignores token budget limits

### Character Filter
- **Include/Exclude Mode**: Choose whether to include only specified characters or exclude them
- **Character Names**: Comma-separated list of character names
- **Character Tags**: Comma-separated list of character tags

### Generation Triggers
- Select which generation types can trigger this entry:
  - Normal: Regular message generation
  - Continue: Continue message generation
  - Impersonate: Impersonation generation
  - Swipe: Swipe generation
  - Regenerate: Regeneration
  - Quiet: Quiet generation

### Additional Matching Sources
- Match keywords against additional sources:
  - Persona Description
  - Character Description
  - Character Personality
  - Character Depth Prompt
  - Scenario
  - Creator's Notes

### Per-Entry Overrides
- **Case Sensitive**: Override global case sensitivity setting
- **Match Whole Words**: Override global whole words setting
- **Use Group Scoring**: Override global group scoring setting

## Export as Text

Export your lorebook as a human-readable text file:
1. Click "📤 Export" → "Export as Text"
2. Choose what to include:
   - Entry Titles
   - Entry Content
   - Primary Keywords
   - Secondary Keywords & Logic
   - Constant/Extension Indicators
   - Comments/Notes
   - Order Numbers
3. Enter a filename (without .txt extension)
4. Click "📥 Export Text" to download

## Files

- `index.html` - Main app file
- `styles.css` - Styling
- `script.js` - All the functionality
- `README.md` - This file
- `DOCUMENTATION.md` - Detailed documentation

## Deploying to GitHub Pages

1. Create a new GitHub repository
2. Upload these files
3. Go to Settings > Pages
4. Select "main" branch and save
5. Your app will be live at `https://yourusername.github.io/repository-name`

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge)

---

Built with vanilla HTML/CSS/JavaScript - no dependencies needed! 🎉

## Local Development

Locally hosting a version for development uses vite (https://vite.dev/), primitively. You're gonna need `npm` for this but not much more. 

### Set up

1) Open the base directory in a terminal (or powershell or console). You should be on the same level as `package.json`.
2) Execute `npm i` to install the vite dependency.

### Start local 

1) Open the base directory in a terminal (or powershell or console). You should be on the same level as `package.json`.
2) Execute `npm run dev` to start a local development server. 

The terminal output next to **Local:** will tell you the URL where you can access your local app (most likely it's http://localhost:5173/). Just open that in a browser on the machine where you started the server. 

You can also directly access 
- the Desktop version: http://localhost:5173/Desktop/index.html
- the Mobile version: http://localhost:5173/Mobile/index.html

### Start local with hosting for mobile

This option starts a development server which can be accessed by all devices in the same network/WiFi as the host machine. It is useful for e.g. immediately checking changes you've made to the code on your mobile phone. 

1) Open the base directory in a terminal (or powershell or console). You should be on the same level as `package.json`.
2) Execute `npm run dev-host` to start a local development server. 

The terminal output next to **Network:** will tell you the URL where devices in the same network can access the app (for example, the URL might look like this: http://192.168.178.23:5173/). Just open that URL in your device's browser to access the development app from your host machine. On the host machine, the **Local:** URL will still work.

## A Word from the "Author": Broeckchen!

Hey! Thank you for checking out and possibly downloading SLEd!

If you had a look at any of the script files and promptly started dryheaving because you know literally anything about about coding, I apologize. This was all vibecoded with Claude Sonnet 4.5 and GLM 4.6. I also don't take any credit for any of the coding and if anyone ever sells you this thing for actual money, they're being an asshole. Sorry!

Please feel free to iterate on this, remake it entirely but better, fork it, whatever you want! I'd like it if you kept a variation of the logo, because I hand drew it. uvu It's like the one thing I actually made myself hahaha.

You can use SLEd at http://sled-7vz.pages.dev or download it as a PWA for mobile devices at https://install.page/sled337 !

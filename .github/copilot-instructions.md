# Hunt Showdown Death Tracker - Project Context

## Project Overview
**Name**: New Rules of Battle  
**Type**: Electron Desktop Application  
**Purpose**: Death tracking tool for Hunt: Showdown with Western Gothic aesthetic  
**Platform**: Windows portable .exe

## Tech Stack

### Core Technologies
- **Frontend**: Pure Vanilla JavaScript (ES6 classes) - NO frameworks allowed
- **Storage**: LocalStorage for all data persistence
- **Charts**: Manual HTML5 Canvas API rendering (no chart libraries)
- **Desktop**: Electron ^28.1.0 for Windows packaging
- **Build**: electron-builder ^24.9.1 (portable target)

### Styling
- **Fonts**: Google Fonts - Cinzel (headings), Almendra (body)
- **Icons**: Inline SVG (crosshair target, lock/unlock, book)
- **Layout**: CSS Grid and Flexbox
- **Animations**: CSS transitions and transforms

### Development Tools
- Node.js & npm
- PowerShell terminal (Windows)
- Git version control

## Code Architecture

### Main Class: DeathTracker (script.js)
~2200 lines, handles all application logic

**Key Properties:**
- `myProfileName`: Default 'ME' profile
- `defaultCauses`: 29 death causes including 'day time', 'night time'
- `defaultCompounds`: 30 Hunt Showdown map locations
- `defaultGuns`: 23 weapon types
- `isLocked`: Global lock state for death causes
- `draggedElement`: Drag-and-drop state management

**Critical Methods:**
- `init()`: Initializes app, migrates data, renders all sections
- `recordDeath()`: Captures death with causes, guns, compound, notes, K/D
- `renderDeathCauses()`: Dynamic checkbox list with drag-drop
- `renderGuns()`: Gun tracking with lock/unlock/drag-drop
- `renderCompounds()`: Location tracking with radio buttons (single selection)
- `renderChart()`: Canvas-based death timeline (last 30 days)
- `renderDeathCausePieChart()`: Pie chart showing top death causes
- `renderGunDeathChart()`: Horizontal bar chart for gun deaths
- `renderPlaybook()`: Displays 10 commandments list

### Data Model (LocalStorage)

**Primary Keys:**
- `huntProfiles` - Array of all profile objects
- `currentProfile` - Active profile name (string)
- `encountersLocked` - Boolean for death cause lock state
- `gunsLocked` - Boolean for gun lock state
- `compoundsLocked` - Boolean for compound lock state
- `huntPlaybook` - Array of 10 commandment strings

**Profile Object Structure:**
```javascript
{
  name: string,
  deaths: [{
    timestamp: number,
    causes: string[],
    guns: string[],
    compound: string,
    notes: string,
    kd: number
  }],
  customCauses: string[],
  causeOrder: string[],
  removedCauses: string[],
  gunDeaths: [{
    timestamp: number,
    guns: string[]
  }],
  customGuns: string[],
  gunOrder: string[],
  removedGuns: string[],
  kdHistory: [{
    timestamp: number,
    kd: number
  }],
  customCompounds: string[],
  compoundOrder: string[],
  removedCompounds: string[]
}
```

## UI Components

### Main Sections (index.html)
1. **Header**: Title with playbook icon (top-right)
2. **Profile Bar**: Profile tabs with rename/delete actions
3. **Playbook Display**: Numbered list of 10 commandments
4. **Stats Dashboard**: Total deaths, most common cause, current streak
5. **Record Death Section**: 
   - Death causes (multi-select checkboxes)
   - Gun deaths (multi-select checkboxes)
   - Compound location (single-select radio buttons, collapsible)
   - K/D input, death notes
6. **Analytics Section**: 
   - Death Causes Breakdown (pie chart)
   - Gun Deaths Heatmap (horizontal bars)
7. **Death Timeline Chart**: Canvas line graph (last 30 days)
8. **Death Cause Comparison**: Multi-select with canvas chart
9. **K/D Timeline**: Canvas line graph with profile comparison
10. **Death Ledger**: Scrollable list of all deaths
11. **Quick Profile Switcher**: Fixed bottom-left profile icons

### Modal Dialogs
- **Playbook Modal**: 10 input fields for commandments
- **Rename Profile Modal**: Single input with confirm/cancel
- **Delete Profile Modal**: Confirmation with profile name display

## Styling Theme

### Color Palette (CSS Variables)
```css
--bg-dark: #0f0e0d        /* Primary background */
--bg-medium: #1a1612      /* Secondary background */
--bg-light: #2a2419       /* Tertiary background */
--accent-primary: #c4a572 /* Tan/beige */
--accent-blood: #8b2e1f   /* Dark red */
--accent-gold: #d4af37    /* Gold */
--text-primary: #e8dcc4   /* Light parchment */
--text-secondary: #a8967a /* Muted tan */
--border-color: #4a3f2e   /* Brown */
--shadow-dark: rgba(0, 0, 0, 0.8)
```

### Design Principles
- Dark, gritty, Western Gothic aesthetic
- Parchment/leather texture feel
- Gold accents for important elements
- Blood red for delete/destructive actions
- Subtle grain/noise background
- Cinzel for all headings (serif, medieval)
- Almendra for body text (serif, old-style)

## Feature Implementations

### Lock/Unlock System
- **States**: Locked (default) | Unlocked (editing mode)
- **Visual**: Lock icon changes, button highlights in red/gold when unlocked
- **Applies to**: Death causes, guns, compounds (separate locks)
- **When Unlocked**: Drag handles (⋮⋮) and delete buttons (×) appear

### Drag-and-Drop Reordering
- **Trigger**: Click and hold drag handle (⋮⋮)
- **Visual Feedback**: Dragged item rotates 2deg, drop target gets gold border
- **Persistence**: Order saved to causeOrder/gunOrder/compoundOrder per profile
- **Implementation**: Native HTML5 Drag and Drop API

### Collapsible Sections
- **Header**: Click to toggle, stopPropagation on lock button
- **Icon**: ▼ (expanded) / ► (collapsed) with rotation transition
- **Content**: max-height transition with opacity fade

### Canvas Charts
- **No Libraries**: All charts manually drawn with Canvas 2D context
- **Gradients**: Use createLinearGradient for bars and fills
- **Responsive**: Canvas width = container offsetWidth
- **Empty State**: Gray text message when no data

## Important Conventions

### Code Style
1. **No Frameworks**: Pure vanilla JavaScript only
2. **ES6 Classes**: Use class syntax for organization
3. **Arrow Functions**: Prefer for event handlers
4. **Template Literals**: Use for HTML string construction
5. **LocalStorage**: All state persists, no backend
6. **Defensive Coding**: Check element existence before addEventListener

### File Editing
1. **Never delete features**: Only add or modify
2. **Preserve theme**: Always use CSS variables for colors
3. **Modal dialogs**: Use custom modals, not prompt()/confirm()
4. **Text inputs**: Use inputmode="decimal" for K/D, not type="number"
5. **Accessibility**: Make entire divs clickable with pointer-events: none on children

### Data Safety
1. **Migrations**: Check and upgrade data structure in init()
2. **Backward compatibility**: Always support old profile formats
3. **Non-destructive deletes**: Default items are "hidden" not deleted
4. **Preserve death records**: Never delete historical death data

## Build Process

### Development
```bash
# Open in browser
Open index.html in any browser

# Watch for changes
Manual refresh (no build step for dev)
```

### Production Build
```bash
# Install dependencies
npm install

# Build Windows .exe
npm run build

# Output location
dist/win-unpacked/New Rules of Battle.exe
```

### Build Configuration (package.json)
- Main: main.js (Electron entry point)
- Target: win/portable (no installer)
- No code signing required
- nodeIntegration: false, contextIsolation: true

### Common Build Issues
1. **PowerShell Execution Policy**: Use `Set-ExecutionPolicy Bypass -Scope Process`
2. **Signing Warnings**: Ignorable, builds succeed anyway
3. **Text Input Issues**: Fixed with setMenu(null) and spellcheck: false

## Recent Features (v2.0)

1. **Playbook/Commandments**: 10 editable rules with numbered display
2. **Day/Night Time Tracking**: Added to death causes list
3. **Compound Locations**: 30 Hunt Showdown maps with radio selection
4. **Death Cause Pie Chart**: Canvas-based with top 5 legend
5. **Gun Death Heatmap**: Horizontal bars, top 10 sorted by frequency
6. **Collapsible Compound Section**: Minimize "Where did this happen?"

## File Organization

```
New Rules of Battle/
├── .git/                    # Git repository
├── .github/
│   └── copilot-instructions.md  # This file
├── node_modules/            # Electron dependencies (gitignored)
├── dist/                    # Build output (gitignored)
├── index.html               # Main UI structure (~300 lines)
├── script.js                # DeathTracker class (~2200 lines)
├── styles.css               # Hunt theme styling (~1100 lines)
├── main.js                  # Electron main process (~40 lines)
├── package.json             # Electron build config
├── package-lock.json        # Dependency lock file
├── .gitignore               # Git ignore rules
├── BUILD.bat                # Windows build script
├── BUILD.md                 # Build instructions
├── FEATURES.md              # Feature documentation
├── README.md                # Project readme
└── ROADMAP.md               # Future features
```

## Testing Workflow

1. Make changes to HTML/CSS/JS
2. Refresh browser (Ctrl+R) for quick testing
3. Build .exe for production testing
4. Test in .exe to verify:
   - Text inputs work (menu disabled)
   - LocalStorage persists
   - All features functional
   - No console errors

## Future Enhancements (Roadmap)

- Restore hidden default encounters
- Search/filter for encounters
- Export data to JSON/CSV
- Import data from backup
- Dark mode toggle (darker variant)
- Stats graphs (kills over time)
- Achievement system
- Death heatmap by time of day
- Multi-language support

## Critical Notes

⚠️ **Never Use:**
- React, Vue, Angular, or any framework
- jQuery or DOM manipulation libraries
- Chart.js, D3, or chart libraries
- axios, fetch wrappers
- date-fns, moment.js (use native Date)

✅ **Always Use:**
- Vanilla JavaScript
- Native Canvas API
- CSS Variables for theming
- LocalStorage for persistence
- Custom modals instead of alert/confirm
- Hunt Showdown aesthetic

🎨 **Design Philosophy:**
This is a Hunt: Showdown fan tool. The aesthetic MUST match the game:
- Dark, moody, Western/Gothic
- Parchment textures and aged paper feel
- Gold accents sparingly (important elements only)
- Blood red for danger/delete actions
- Old-style serif fonts
- Gritty, weathered appearance

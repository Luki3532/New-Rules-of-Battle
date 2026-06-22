# New Rules of Battle - Hunt Showdown Death Tracker

A dark, gritty web application for tracking player deaths in Hunt: Showdown with authentic Western Gothic styling.

## Features

- **Multiple Hunter Profiles**: Track deaths for different players or characters
- **Death Recording**: Log deaths with multiple causes and optional notes
- **Custom Death Causes**: Add your own custom death scenarios
- **Statistics Dashboard**: View total deaths, most common causes, and death streaks
- **Death Timeline Chart**: Visual representation of deaths over the last 30 days
- **Death Ledger**: Complete history of all recorded deaths
- **Local Storage**: All data persists in your browser

## Default Death Causes

- Maynard Sniper
- Rushing in
- Double peeked
- Bad aim
- Someone snuck up
- Bad internet
- Headshot
- Burned alive
- AI killed me
- Explosive
- Melee fight
- Team wipe

## How to Use

1. **Open the Application**: Simply open `index.html` in any modern web browser

2. **Create Profiles**: 
   - Click "+ NEW HUNTER" to create additional profiles
   - Switch between profiles by clicking on the profile tabs

3. **Record Deaths**:
   - Select one or more death causes
   - Optionally add notes describing the circumstances
   - Click "RECORD DEATH" to save to the ledger

4. **Add Custom Causes**:
   - Enter a custom death cause in the input field
   - Click "Add to List" to make it available for future deaths

5. **View Statistics**:
   - Check the dashboard for total deaths and trends
   - View the timeline chart to see death patterns
   - Browse the complete death ledger at the bottom

## Design Theme

The application features Hunt Showdown's signature aesthetic:
- Dark, weathered color palette
- Western Gothic typography
- Blood-red accents
- Aged, distressed textures
- Atmospheric shadows and lighting

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- Responsive design for desktop and mobile
- Data stored in browser localStorage
- Canvas-based chart rendering

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Data Storage

All data is stored locally in your browser. Your death records will persist between sessions, but clearing browser data will erase them. To backup your data, you can export the localStorage data from your browser's developer tools.

---

**May your aim be true and your deaths be few, hunter.**

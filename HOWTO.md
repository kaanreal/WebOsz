# WebOsz - Osu!mania Web Player

## Overview
WebOsz is a web-based osu!mania player that allows you to play 4-key mania maps directly in your browser. The application features image-based notes (arrows), customizable settings, and support for loading .osz files.

## Features
- Load and play .osz beatmap files with 4-key mania maps
- Image-based arrow notes for authentic osu!mania experience
- Adjustable scroll speed and map rate
- Customizable keybindings
- Performance metrics and scoring
- Online beatmap search and loading

## How to Use
1. Start the server:
   ```
   node server.js
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
3. Load a beatmap by clicking on the circle on the start screen
4. Select a difficulty from the list
5. Press "Play" and hit the corresponding keys as notes reach the judgment line
   - Default keys: D, F, J, K (can be customized)

## Controls
- Customize keybindings in the "Keybinds" menu
- Adjust scroll speed and map rate using the sliders in the menu
- Toggle "Change Pitch" to enable/disable pitch preservation when changing map rate

## Notes
- The player only supports 4-key mania maps
- The arrow notes represent different lanes and should be hit when they reach the judgment line
- The application saves your settings and preferences locally

Enjoy playing!
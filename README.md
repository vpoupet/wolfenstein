# Wolfenstein 3D

A *JavaScript* rewriting of the original Wolfenstein 3D (1992) engine.

[Link to result](https://vpoupet.github.io/wolfenstein/index.html)

## Prerequisites

This is a simple *HTML/CSS/JavaScript* project, so no real installation is required.


Important files and directories are
- `index.html`: main page
- `style.css`: basic styling of the index
- `data/`: original game data (level maps and wall/sprite textures)
- `fonts/`: "pixel" fonts used on the main page
- `images/`: image assets used on the main page (buttons, background, episode selection, etc.)
- `js/`: javascript code (the core of the project)
    - `engine.js`: main code of graphics engine (render walls, sprites, doors, etc.)
    - `files.js`: functions for opening, decompressing and extracting data from original game files 
    - `game.js`: game logic (character, level, collectibles, enemies, etc.)
    - `interface.js`: player interface (HUD, key events, etc.)
    - `map.js`: code for overlayed level map

Simply copy all these files and directories and open `index.html` to use.

## Authors

- Victor Poupet - Initial work [vpoupet](https://github.com/vpoupet)

## Acknowledgments

- [Lode's Computer Graphics Tutorial](https://lodev.org/cgtutor/index.html): Good explanations for the raycasting techniques used in the Wolfenstein 3D engine (section on Raycasting)
- [Wolf3D Specs by Gaarabis](http://gaarabis.free.fr/_sites/specs/wlspec_index.html): File format specifications for the original game files (`MAPHEAD.WL6`, `GAMEMAPS.WL6` and `VSWAP.WL6`)
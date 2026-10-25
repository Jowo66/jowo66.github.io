# jowo66.github.io

[![tests](https://github.com/Jowo66/jowo66.github.io/actions/workflows/tests.yml/badge.svg)](https://github.com/Jowo66/jowo66.github.io/actions/workflows/tests.yml)

## Tests

Automated browser tests (Playwright) run on every push via GitHub Actions.
Run them locally with `npm install`, `npx playwright install chromium`, then `npm test`.

## Assets

The alley, its people, the nightclub and the music are generated in code. The monster event and the district map's buildings use free 3D models by [Quaternius](https://quaternius.com) (CC0, public domain): **Ultimate Monsters**, **Cute Animated Monsters** and the **Ultimate Textured Building Pack**. They are pre-rendered offline with three.js into the sprite sheets in `assets/`, which are listed in `sprites.js`.

### Pixel street (`?pixel`)

Add `?pixel` to the URL (for example `index.html?pixel`) to replace the 3D alley with a hand-drawn pixel-art street, built on [Cyberpunk Street](https://ansimuz.itch.io/cyberpunk-street-environment) by **Ansimuz** (CC0, public domain). The scene's people are drawn pixel by pixel in `street.js`. `tools/pixel/build-street.js` rebuilds the images in `assets/pixel/` (night palette, props, cars) from the original pack, and `compare.html` shows the 3D alley and the pixel street side by side.

The drawn townspeople, street animals and drones on the pixel street come from [CraftPix](https://craftpix.net)'s free **Cyberpunk Townspeople**, **Street Animals** and **Drones Pack** (free licence, no attribution required, credited anyway). The pixel fonts are **Not Jam Mono Clean** and **Not Jam UI Condensed** from the Not Jam Font Pack (CC0). `tools/pixel/build-sprites.js` packs them into `assets/pixel/town.png`, `animals.png`, `drones.png` and `assets/fonts/`.

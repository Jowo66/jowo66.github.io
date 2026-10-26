# jowo66.github.io

[![tests](https://github.com/Jowo66/jowo66.github.io/actions/workflows/tests.yml/badge.svg)](https://github.com/Jowo66/jowo66.github.io/actions/workflows/tests.yml)

## Tests

Automated browser tests (Playwright) run on every push via GitHub Actions.
Run them locally with `npm install`, `npx playwright install chromium`, then `npm test`.

## Assets

The alley, its people, the nightclub and the music are generated in code. The monster event and the district map's buildings use free 3D models by [Quaternius](https://quaternius.com) (CC0, public domain): **Ultimate Monsters**, **Cute Animated Monsters** and the **Ultimate Textured Building Pack**. They are pre-rendered offline with three.js into the sprite sheets in `assets/`, which are listed in `sprites.js`.

### Pixel street (`?pixel`)

Add `?pixel` to the URL (for example `index.html?pixel`) to replace the 3D alley with a hand-drawn pixel-art street, built on [Cyberpunk Street](https://ansimuz.itch.io/cyberpunk-street-environment) by **Ansimuz** (CC0, public domain). The scene's people are drawn pixel by pixel in `street.js`. `tools/pixel/build-street.js` rebuilds the images in `assets/pixel/` (night palette, props, cars) from the original pack, and `compare.html` shows the 3D alley and the pixel street side by side.

The drawn townspeople, street animals and drones on the pixel street come from [CraftPix](https://craftpix.net)'s free **Cyberpunk Townspeople**, **Street Animals** and **Drones Pack** (free licence, no attribution required, credited anyway). The pixel fonts are **Not Jam Mono Clean** and **Not Jam UI Condensed** from the Not Jam Font Pack (CC0). `tools/pixel/build-sprites.js` packs them into `assets/pixel/town.png`, `animals.png`, `drones.png` and `assets/fonts/`, and copies the monster, explosion and back street sheets alongside them.

The pixel street turns into a new alley every few minutes (or when you click the ALLEY sign), going round five kinds: the crossing with its neon recoloured; a back street put together from Ansimuz's **Streets of Fight** tiles; Restaurant Row (version 1 of **Cyberpunk Street**); the rooftops (its **city skyline** layers, with Ansimuz's **Warped Vehicles** flying past); and the sewers (Ansimuz's **Sewers** pack), where the monster comes up out of the water. All of these are CC0. The MONSTER button sends **Cthulhu** (Pixel Monsters pack, CC0) after the tower in the distance, with explosions from Ansimuz's **Explosion Pack 1** (CC0).

With `?pixel` the nightclub window opens the pixel club (`club.js`, drawn on `nightclub.html?pixel`): four venues to cycle through with the Venue button (the main room, a cross-section with a rooftop bar, main floor and basement, a sewer rave and an arcade), with the page's own music, Battle, Style and Hype controls. Its moshpit is Ansimuz's **Brawler Girl** and **Enemy Punk** from Streets of Fight (CC0); the speakers, arcade cabinets and signs come from the **CyberPunk Asset Pack**, the **RCC Streets** and **Apartment** tile demos. The district map gains a SKYLINE view next to the isometric one, and with `?pixel` its buildings are drawn as pixel art in code.

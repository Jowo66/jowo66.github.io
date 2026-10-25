# Neo-Jowo OS: design process, tools, techniques and next projects

Author: Ejovwo Obahor (GitHub: Jowo66) · Site: https://jowo66.github.io · Written 2026-10-10, updated 2026-10-24

This report combines two sources:

1. **`README.md`** from the repository. It is short: a test-status badge and instructions for the Playwright test suite that runs on GitHub Actions.
2. **The build conversation** between Ejovwo and Claude (Claude Code), from 5 to 7 October 2026. It covered about 65 commits and roughly 5,500 lines of hand-written JavaScript, HTML and CSS.
3. **Later sessions** on 18 October (links to Jowo's other projects) and 24 October (3D models for the monster event and the district map). See Phase 7.

The README only covers testing, so the report treats testing as one section among several.

---

## 1. What was built

A static personal site on GitHub Pages with no framework and no build step. The alley, its people, the nightclub and the music are generated in code. Since 24 October the monster event and the district map's buildings use free CC0 3D models by Quaternius, pre-rendered offline into sprite images (see section 4.9).

| Page | Purpose |
|---|---|
| `index.html` + `os.js` + `os.css` | **Neo-Jowo OS**: a cyberpunk "operating system" over a 3D neon alley. Apps (About, Skills, Map, Nightclub, Contact) open as manga-style windows. |
| `serious.html` | Plain, professional version of the portfolio, switched with the **ANTI-FUN / FUN** buttons. |
| `nightclub.html` | **Casa Sofia** (night) / **Playa Sofia** (day beach): a 3D club with a hologram DJ, up to 40 dancers, battles and a synthesised house-music engine. |
| `classic.html` | The original green-on-black "Matrix" homepage. |

Supporting modules:

| File | Role |
|---|---|
| `lp3d.js` | Low-poly 3D engine on Canvas 2D: boxes, jointed limbs, painter's-algorithm sorting, fog, lighting. |
| `alley-cultures.js`, `alley-lore.js` | 130 culture packs for a name, myth and profile generator for alley inhabitants. |
| `house.js` | Procedural music: 9 genres synthesised with Web Audio, plus a scheduler. |
| `spotify.js` | Spotify login (PKCE) and Web Playback SDK integration. |
| `lang.js` | English / French / Spanish hover translator. |
| `sprites.js`, `assets/` | Sprite sheets pre-rendered from the Quaternius 3D packs (about 4.1 MB, loaded on demand) and the list of their frame sizes and anchor points. |
| `tests/site.spec.js`, `.github/workflows/tests.yml` | Playwright tests and CI (the README's subject). |

---

## 2. Design iteration process

The work followed a loop of **request → build → headless check → ship → feedback**. Each user message was a small design brief. Claude implemented it, ran it in a headless browser, pushed it to `main`, and the user reviewed it live and sent the next brief. The history falls into seven phases.

### Phase 1: Concept and 3D alley (5–6 Oct)
- Started as "Neo-Edo": a cabaret bar, a sumo dojo and a homepage. The homepage was redesigned into a **3D neon alley** with manga windows, an isometric district map, a holo-glass overlay, rain and a system monitor.
- A shared **low-poly character engine** replaced one-off drawings. Characters gained jointed arms and held props (umbrellas, staffs, bags, signs).
- Decision: keep everything procedural, so there are no assets to host and every character can vary. (Revisited on 24 October for the monsters and map buildings; see Phase 7.)

### Phase 2: Living-world behaviour (7 Oct)
- Inhabitants got behaviours: shopping, arguing (three exchanges, then an angry hop), couples, a detective who questions people, and a sage who speaks parables.
- Shopfronts with doors, awnings and shopkeepers. Customers walk in and out.
- **Side-alley turns** let the world change. A new alley generates after each turn.
- **Lore layer**: names and myths drawn from 130 cultures (orisha, Norse, Aztec, Igbo and more), with realistic ages, heights and weights.
- Hover to peek at a person's "file" terminal; click to pin it. Flags were drawn as images.

### Phase 3: Sky, weather, monsters and the map
- Day/night toggle, skyline, lightning and a hologram logo that changes per alley.
- **Monster attacks** (originally four hand-drawn monsters: kaiju, mecha, kraken and winged): everyone runs into the nearest shop and re-emerges afterward. A summon button has a 30-second cooldown.
- The same monsters were added to the district map, with crumbling, chunk-ripped and burning buildings. Both were later replaced by 3D models (Phase 7).

### Phase 4: The nightclub and the music engine
- Replaced the cabaret and dojo with **Casa Sofia**: a hologram DJ, a mosh pit and laser floor, and a synthesised house track.
- Iterated on the crowd: women's outfits, a hype button, a capacity limit with bouncers who escort people out, dance styles (mosh, disco, rave, wave, sway), a battle mode with jointed dancers, then breakdance moves and a "Minister of Enjoyment" circle mode.
- A **playlist** of favourite generated tracks, saved by seed in localStorage and a year-long cookie.
- Genres grew from house to 9: Soul house, Latin house, Afro house, City pop, Grime, Amapiano, Gqom and Brazilian phonk. The user's feedback, "they all sound like variations of one another", led to distinct drums, horns and sound design per genre and a genre label on screen.
- Dancers' costumes follow the culture of the current song. Churn is periodic, with a target average of about 32 and a maximum of 40.
- **Beach mode**: the day toggle turns the club into Playa Sofia.
- Later additions: a Repeat toggle (off means the DJ shuffles every 30 seconds), side hologram dancers that never share a colour, and a genre chip.

### Phase 5: Bugs reported by the user, and how they were resolved

| Report | Root cause | Fix |
|---|---|---|
| Alley froze after a monster attack | An exception while people emerged from shelter killed the animation loop | Stored full data when people shelter; wrapped the frame loop in try/catch |
| Auto-shuffle didn't fire every 30 s | It counted frame time, which runs slow on slow machines | Use a real clock (`performance.now()`) plus a 1 s interval |
| Audio choppy after 30 s in another tab | Browsers throttle timers in background tabs | Drive the scheduler from a **Web Worker** timer and schedule further ahead |
| Music stopped when the club window closed | The player lived inside the club's iframe | Moved the player into the parent page |
| Half-width browser wouldn't scroll | Fixed-position layout | Stack windows and hero in normal flow at narrow widths |
| Skip/rewind buttons didn't work | The SDK's `nextTrack` / `previousTrack` silently do nothing in some contexts | Use Spotify's Web API endpoints with the SDK as fallback, and show error messages |
| "Alley painfully slow" | See Phase 6 | Profiling-led optimisations |

### Phase 6: Features, then performance (7 Oct)
- **Spotify**: connect an account, play playlists and liked songs, shuffle and repeat-song toggles, persistence across windows, and a tap-tempo button because Spotify no longer provides tempo data.
- **Parody mascots**: nine original parody mascots (burger knight, clown, fry king, drumstick admiral, taco, pizza chef, donut, shake, chicken). They were designed as archetypes with punny names, not copies of real brand characters. They sprint through the alley every 30–60 seconds for 10–15 seconds. A burger-drop rush was built and then **removed at the user's request**.
- **Gen Z calm-down**: in about 70% of monster attacks, one inhabitant stays and tells the monster to calm down in slang.
- **Language filter**: English / French / Spanish, translating hovered words in place.
- **Performance pass**: measured first, then optimised (see section 4.6).
- **Developer experience**: VS Code auto-indent settings (Prettier, EditorConfig, Black for Python).

### Phase 7: Links out and 3D models (18 and 24 Oct)
- **18 Oct:** a **Jowo's Worlds** dropdown and Contact links to Ejovwo's other projects: Mini Gym, Reverb and Weather Report.
- **24 Oct:** the monster event and the district map moved from hand-drawn shapes to Quaternius's free CC0 3D packs:
  - **Alley skyline:** one of 16 large *Ultimate Monsters* walks in, stops beside the main tower and punches it down (Walk and Punch animations), then walks off through the rubble.
  - **District map:** a pack of *Cute Animated Monsters* (17 walkers, 4 flyers) overruns the streets, biting or headbutting buildings, which burn and later rebuild. The leader is the small version of the giant on the skyline, taken from the Cute pack when it has one or a close cousin (for example MushroomKing leads a Mushroom), and from the *Ultimate Monsters* blob and flying sets otherwise. A banner names the pack, for example "YETI PACK ATTACK".
  - **Map buildings:** 15 buildings became models from the *Ultimate Textured Building Pack*, each with a day sprite and a night sprite whose windows glow in the building's neon colour. The under-construction lots stay hand-drawn.
- Design issues found in screenshots and fixed: the textured buildings were taller than the old boxes and hid the middle road, so front-row buildings were swapped for low-rise models. The small monsters got lost in the busy streets, so they were enlarged and given a pulsing red ring and a faint see-through pass behind buildings. The Cute models use an unlit material and rendered dull, so they were re-rendered with a lit material.

### Process observations
- Small, specific briefs worked well. Each could be shipped in one commit and judged on the live site.
- User feedback caught what automated checks could not: sound quality, "feels slow", and "all genres sound alike".
- A recurring step was **cache-busting** (`?v=<tag>` on every script and stylesheet). Without it, users saw stale code after a push.

---

## 3. Programs and services involved

| Category | Tool | Use |
|---|---|---|
| Hosting | **GitHub Pages**, **Git/GitHub** | Static hosting from `main`; every change shipped as a commit |
| AI pair-programmer | **Claude Code** (Claude Sonnet 5.5; Claude Opus 5.5 for the 24 Oct 3D work) | Implementation, debugging, profiling, writing tests, rendering the sprites |
| Editor | **VS Code** + Prettier, EditorConfig, Black | Auto-indent and formatting (`.vscode/`, `.prettierrc`, `.editorconfig`) |
| Languages | HTML, CSS, JavaScript (no frameworks), a little Python tooling | The whole site |
| Browser APIs | **Canvas 2D**, **Web Audio API**, **Web Workers**, `localStorage`, cookies, `fetch`, `caretRangeFromPoint` | Rendering, music, scheduling, persistence, hover translation |
| Testing | **Playwright** (Chromium) + **GitHub Actions** | CI tests on every push (the README's subject); headless scripts for development checks |
| Profiling | Chrome DevTools Protocol profiler through Playwright | Finding the slowest features |
| Music | **Spotify Web Playback SDK** + Web API (PKCE auth) | Optional Premium playback in the club |
| Translation | Built-in dictionary + **MyMemory** free API fallback | Hover translation |
| Fonts | Google Fonts (VT323, Share Tech Mono, Zen Kaku Gothic New) | Cyberpunk and manga typography |
| 3D models | **Quaternius** packs (CC0): Ultimate Monsters, Cute Animated Monsters, Ultimate Textured Building Pack | Monsters for the skyline and the map, and the map's buildings |
| Asset pipeline | **three.js** (GLTFLoader, OBJLoader) in headless **Chromium** driven by **Playwright** | Rendering the models into sprite sheets offline; three.js is not loaded by the site |

Constraint kept throughout: no paid services.

---

## 4. Techniques used

### 4.1 Procedural low-poly 3D on Canvas 2D (`lp3d.js`)
- Characters are lists of boxes with limb-swing parameters, compiled once, then projected and shaded each frame.
- Faces are depth-sorted with the **painter's algorithm**; fog and coloured lights are blended per face.
- Jointed limbs use per-limb angles (elbow, knee) set by animation keys. Body tilt was added for breakdance moves.
- A mirrored second pass draws floor reflections.

### 4.2 Agent-style world simulation (alley)
- Each character is a small **state machine**: walking, shopping, arguing, fleeing, eating, chasing.
- Rules limit "unique" characters, and two unique characters meet and argue.
- Monster attacks switch the whole population into a flee state and back.
- Speech bubbles are drawn on the canvas.

### 4.3 Generative content
- **Names and lore**: 130 culture packs with mix-and-match surnames, myth names, ages and body measurements (shown in feet/inches and pounds).
- **Music**: house, Latin, Afro, City pop, Grime, Amapiano, Gqom and Brazilian phonk are synthesised from oscillators, filtered noise and a convolution reverb. Tracks are deterministic from a **seed**, so a playlist stores only a number.
- **Costumes** are chosen from the current song's culture.

### 4.4 Audio scheduling
- A Web Worker ticker keeps the beat steady when the tab is hidden.
- Notes are scheduled slightly ahead on the Web Audio clock.
- Measured load: about 26–83 audio nodes created per second, which is light.

### 4.5 Persistence and integration
- Playlist seeds are stored in localStorage and a long-lived cookie.
- Spotify login uses **OAuth PKCE** in a popup. The player lives in the parent page so it survives the club window closing.
- The language choice is shared across pages and iframes through `localStorage` and `storage` events.
- The hover translator tokenises text nodes, keeps the original text for restore, finds the word under the pointer with `caretRangeFromPoint`, and checks the pointer is really inside the word's rectangle.

### 4.6 Measure first, then optimise
The user reported slowness. Claude profiled rather than guessed:
1. A CPU profile showed most time was native rendering, not JavaScript.
2. Instrumented copies of the code timed each stage of a frame, forcing a canvas flush so rasterisation was counted.
3. Comparing a pre-feature commit with the current one showed no regression from the latest features.
4. The big finding: **the nightclub window and the alley share one thread**, so running both roughly halved the alley's frame count.
5. Changes: replaced the blurry glow on the tower logo with a cheap double stroke, skipped reflections for far-away characters, redrew the club's hologram figures every other frame, capped the embedded club at 30 fps, and skipped hairline outlines on tiny faces. Alley frame time fell about 15–20% in the test environment.

Caveat: the numbers come from software rendering in a headless browser. The ranking of what is heavy should hold on a real GPU, but the absolute values will not.

### 4.7 Testing and CI (from the README)
- `npm install`, `npx playwright install chromium`, then `npm test` runs the browser tests locally.
- The same suite runs on every push through GitHub Actions, with a status badge in the README.
- The repo has one starter test file (`tests/site.spec.js`). Ejovwo planned to write the next tests himself.
- Development also used throwaway Playwright scripts. Examples: spawn a monster and check nothing throws, hover words and check translations, and take screenshots of mascot variants.

### 4.8 Working agreements
- A commit trailer is added to every commit.
- No Hebrew text on the site.
- No invented personal details: the About page keeps visible TODO markers for school, program and contacts.
- Avoid paid services.
- Hard refresh (Ctrl+Shift+R) after each push, because of caching.

### 4.9 Pre-rendering 3D models into sprites (24 Oct)
The site draws on a 2D canvas, so the 3D models are rendered ahead of time instead of loading a 3D engine in the browser:
- A small local page loads each model with **three.js** and renders it in headless Chromium, which a Node script drives with Playwright.
- **Animated monsters** (rigged glTF): each frame of the chosen clips (Walk/Punch, Walk/Bite or Fly/Headbutt) is rendered with an orthographic camera. The script finds the smallest box that holds every frame, crops to it, and packs the frames into one WebP sheet. It records the foot position in a cell so the canvas can stand the sprite on the ground.
- **Views:** the skyline giants are rendered side-on in a three-quarter pose and mirrored when walking left. The map monsters are rendered in two isometric directions (+x and −y) that match the map's 2:1 projection; mirroring gives the other two.
- **Buildings** (textured OBJ): the camera uses the map's own projection (30° pitch, 45° yaw, 39 px per tile), rendered at 4× and scaled down. Each model is fitted to its footprint on the map. The night version swaps in a darkened copy of the 4×4 palette texture and makes the glass cell emissive in the building's glow colour. The renderer records the anchor point and height, and the site uses that height for hover hit areas, signs and damage.
- **On the page:** sheets load the first time they are needed (the next giant is preloaded). A damaged building sinks into a clip of its shortened box. Day and night sprites are cross-faded with the day/night toggle.

---

## 5. Known limits and open items
- Audio and live Spotify behaviour could not be heard or tested from the build sandbox; the Spotify integration was verified against mocks only.
- Spotify needs Premium, and it provides no tempo data, hence tap-tempo.
- Translation covers HTML text only, not canvas text (speech bubbles, the 3D club). Words outside the offline dictionary rely on the free MyMemory service, which was untested from the sandbox.
- Some generated culture facts have not been reviewed by a person.
- Still waiting on the user for school, program and year, extra projects, email and LinkedIn, and a photo.
- The planned Cloudflare Workers + KV "playlist code" feature has not been built.
- The CI test suite is small.
- The sprite-rendering scripts were run from a scratch folder and are not in the repository yet, so changing a model means recreating them.
- The sprites add about 4.1 MB; each sheet loads only when a monster or the map needs it.

---

## 6. Three projects that could grow from this work

### Project A: "Alley Engine", a reusable procedural-city toolkit
**Idea:** extract `lp3d.js`, the character state machines and the culture/lore generator into a small open-source library with a documented API, plus a live demo gallery.
- **Why now:** these pieces already work together and have no dependencies.
- **Build:** split into modules, define `Character`, `Behaviour` and `Culture` interfaces, add a performance budget (adaptive quality like the alley's), publish to npm and GitHub Pages.
- **Skills shown:** API design, rendering optimisation, documentation, packaging.
- **Extend with:** a level editor for shopfronts and a "population inspector" panel.
- **Reuses from the README:** Playwright and GitHub Actions run as the library's tests, with screenshot comparisons for the characters.

### Project B: "Seed Sound", a shareable generative-music playground
**Idea:** turn `house.js` into a standalone web app where a track is just a seed that anyone can share as a short link or code.
- **Build:** a playlist-code service on Cloudflare Workers + KV (already agreed in principle), with hard-to-guess codes, size and rate limits, and merge-on-import so lists combine rather than overwrite. Add a visual sequencer, per-genre sound editing, a record-to-WAV export, and "play this seed" links.
- **Why it fits:** the music is already deterministic from seeds, so it needs almost no storage. The scheduler already handles background tabs.
- **Skills shown:** Web Audio, serverless backend, rate limiting, security basics.
- **Testing:** automated checks that the same seed gives the same notes, and API tests for limits.

### Project C: "Hover Translate", an accessible language layer for any static site
**Idea:** grow `lang.js` into a drop-in script and browser extension that translates words on hover, with a visible original/translation tooltip and an optional vocabulary-learning mode.
- **Build:** a larger offline dictionary per language, handling for phrases and conjugations, a "words I looked up" list saved locally and exportable for flashcards, keyboard and screen-reader support, and more languages.
- **Why it fits:** the text-node tokenising, restore logic and cache are already written. It is also useful on its own as a language-learning aid.
- **Skills shown:** DOM manipulation, accessibility (WCAG), browser-extension packaging, privacy-respecting design (no tracking, local storage only).
- **Open question:** how to cover canvas-drawn text, for example by exposing speech-bubble text in a hidden live region.

**Suggested order:** B first, since the backend work is already agreed and teaches the most new skills. Then A, which is mostly refactoring. Then C, which can be done in small steps alongside the others.

---

## 7. Reproducing and running

```bash
git clone https://github.com/Jowo66/jowo66.github.io.git
cd jowo66.github.io
python3 -m http.server 8765      # then open http://localhost:8765/index.html
npm install && npx playwright install chromium && npm test   # from the README
```

Add `?debug` to the URL to expose the alley's debug hooks (`__alley.monster()`, `__alley.mascots()` and others) for manual testing.

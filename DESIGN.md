# Design

Written from the built landing page (`index.html`, `404.html`). Neo-Jowo OS (`neo.html`), Casa Sofia (`nightclub.html`) and the 2025 archive (`classic.html`) are separate worlds and keep their own styles.

## World

A set of stills from the work, shown like cinema lobby cards: a picture, then a caption strip under a red rule. The work leads; the interface stays plain. No cards, no rounded corners, no glow, no gradients except the scrim that keeps navigation readable on the hero still.

## Colour

| Token | Light | Dark | Job |
|---|---|---|---|
| `--ground` | `#ebe8f1` | `#150f24` | page ground, the alley's haze |
| `--ink` | `#1c1330` | `#ebe8f1` | text |
| `--soft` | `#52486b` | `#b3abc9` | secondary text |
| `--rule` | `#c9c3d8` | `#3a3052` | hairlines |
| `--red` | `#c5301a` | same | lantern vermilion: caption rules, primary action, the whole contact band, the 404 page |
| `--red-ink` | `#b32a16` | `#ff7256` | underlines, hover and focus on the ground |
| `--on-red` | `#fff6f2` | same | text on red |
| `--night` | `#150f24` | same | footer, image backing |

Red owns regions. It is never a small accent sprinkled on neutral blocks.

## Type

- **Bricolage Grotesque** (variable, self-hosted, OFL): name and headings at weight 800 with tracking -0.03em; text at 400 to 600.
- **Barlow Condensed 600** (self-hosted, OFL): caption strips, fact labels and buttons, uppercase with 0.07em tracking.
- Body 17px / 1.6, measure capped near 62ch. Display tops out at 6rem.

## Components

- **Still + caption strip**: an image, then a strip with a 3px red top rule. The project name is in ink, the note in soft.
- **Fact list**: label and sentence rows divided by hairlines.
- **Buttons**: square, condensed caps. Solid red is primary; the outlined dark one sits on the hero still only.
- **Links**: ink with a 2px red underline.
- **Contact band**: full-width red with one very large link.

## Garden (`garden.html`)

Same fonts and red as the landing page, on a fixed night ground (`#150f24`) because the trees glow. Each plot is a still (a canvas on `#1e1633`) with a caption strip, a name, one line and a link. Each tree is a real QR code (qrcode.js, MIT) whose squares rise into an ASCII tree; coloured baubles stay dark enough to scan. Four seasons share one engine (`src/trees.js`): Christmas tree with snow, Halloween pumpkin with bats and ghosts, Thanksgiving turkey with maple leaves, New Year fireworks with small bursts. The chosen season is remembered in the browser. Only the picture under the pointer, or one just tapped, rotates, and trees off screen are not drawn.

## Motion

One moment: the hero still opens from a letterbox slit on load (1.1s, exponential ease-out), skipped under `prefers-reduced-motion`. "Run it here" swaps the still for the live alley in place.

## Layout

Edge padding `clamp(20px, 5vw, 72px)`. Two-column grids at 5/7 and 7/4 collapse to one column at 820px. Sections are separated by `clamp(72px, 10vw, 140px)`.

## Imagery

Every image is a capture of the running project, taken headless at build time and stored in `assets/work/`. `assets/og.jpg` is the hero still with the name set beneath it. Nothing is generated or stock.

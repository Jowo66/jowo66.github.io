// Packs the pixel street's animated sprites from the Craftpix free packs into atlases in assets/pixel/.
// usage: node tools/pixel/build-sprites.js "<...>/Design Assets"
//   town.png     Cyberpunk Townspeople 1-12: one 48px band per character, rows walk / idle / special (missing rows left empty)
//   animals.png  Street Animals at half size (the pack draws them as big as the people): rows walk / idle per animal
//   drones.png   Drones Pack: one row per drone, its flying loop
//   fonts        Not Jam Mono Clean 13 and UI Condensed 16 (CC0) copied to assets/fonts/
//   copied as they are: cthulhu.png (Pixel Monsters, CC0), expl-a/expl-b.png (Ansimuz Explosion Pack 1, CC0),
//   sof-*.png (Ansimuz Streets of Fight stage tiles and props, CC0) for the back street scene,
//   v1-*.png (Cyberpunk Street version 1) for Restaurant Row, roof-front.png (its city skyline) for the rooftops,
//   sew-*.png (Ansimuz Sewers pack, CC0) for the sewers; fly-1..3.png are Warped Vehicles (CC0) made smaller
// Frames are square and laid out left to right as in the source strips; street.js holds the frame counts.
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '../../node_modules/playwright'));
const src = process.argv[2], out = path.join(__dirname, '../../assets/pixel');
const CP = f => path.join(src, 'Craftpix Packs', f);
const TOWN = Array.from({ length: 12 }, (_, i) => ['Walk', 'Idle', 'Special'].map(a => CP(`Cyberpunk Townspeople/${i + 1}/${a}.png`)));
const ANIMALS = ['1 Dog', '2 Dog 2', '3 Cat', '4 Cat 2', '5 Rat', '6 Rat 2', '7 Bird', '8 Bird 2'].map(a => ['Walk', 'Idle'].map(r => CP(`Street Animals/${a}/${r}.png`)));
const DRONES = ['1/Walk_scan', '3/Forward', '5_2/Walk', '6/Walk'].map(d => CP(`Drones Pack/1 Drones/${d}.png`));
/* Ansimuz Warped Vehicles (CC0) flying over the rooftops, halved (the third one twice) to sit in the distance */
const FLYERS = ['vehicle 1/vehicle-1.png', 'vehicle 2/vehicle-2.png', 'vehicle 3/vehicle-3-static.png'].map(f => path.join(src, 'Vehicles/Warped Vehicles/Assets', f));
/* Ansimuz Sewers pack (CC0): the four frames of the front water side by side */
const WATER = [1, 2, 3, 4].map(i => path.join(src, `Sewers Pack/Assets/Environment Layers/Front-water/front-water${i}.png`));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const rd = f => fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : null;
  const res = await p.evaluate(async ({ town, animals, drones, flyers, water }) => {
    const load = async u => { if (!u) return null; const im = new Image(); im.src = u; await im.decode(); return im };
    const png = cv => cv.toDataURL();
    /* rows of strips into one sheet, each row band as tall as its frames */
    async function sheet(rows, band, half) {
      const ims = await Promise.all(rows.map(load));
      const w = Math.max(...ims.map(im => im ? im.width : 0)), cv = document.createElement('canvas');
      cv.width = half ? w / 2 : w; cv.height = rows.length * (half ? band / 2 : band);
      const c = cv.getContext('2d');
      ims.forEach((im, i) => { if (!im) return; if (half) c.putImageData(halve(im), 0, i * band / 2); else c.drawImage(im, 0, i * band) });
      return cv;
    }
    /* one image halved n times */
    async function one(u, n) { let im = await load(u); for (let i = 0; i < n; i++) { const d = halve(im), cv = document.createElement('canvas'); cv.width = d.width; cv.height = d.height; cv.getContext('2d').putImageData(d, 0, 0); im = cv } return im }
    /* frames side by side */
    async function strip(us) { const ims = await Promise.all(us.map(load)), cv = document.createElement('canvas'); cv.width = ims.reduce((s, im) => s + im.width, 0); cv.height = ims[0].height; let x = 0; for (const im of ims) { cv.getContext('2d').drawImage(im, x, 0); x += im.width } return cv }
    /* half size without blur: each 2x2 block becomes its most common opaque colour, or clear if mostly clear */
    function halve(im) {
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
      const s = c.getImageData(0, 0, im.width, im.height).data, W = Math.floor(im.width / 2), H = Math.floor(im.height / 2), o = new ImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const cnt = new Map(); let n = 0;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y * 2 + dy) * im.width + x * 2 + dx) * 4; if (s[i + 3] < 128) continue; n++; const k = (s[i] << 16) | (s[i + 1] << 8) | s[i + 2]; cnt.set(k, (cnt.get(k) || 0) + 1) }
        if (n < 2) continue;
        /* the outline colour wins ties so the shape keeps its edge */
        let best = -1, bn = 0; for (const [k, v] of cnt) { const dark = ((k >> 16) + ((k >> 8) & 255) + (k & 255)) < 90; if (v > bn || (v === bn && dark)) { best = k; bn = v } }
        const j = (y * W + x) * 4; o.data[j] = best >> 16; o.data[j + 1] = (best >> 8) & 255; o.data[j + 2] = best & 255; o.data[j + 3] = 255;
      }
      return o;
    }
    return {
      town: png(await sheet(town.flat(), 48)),
      animals: png(await sheet(animals.flat(), 48, true)),
      drones: png(await sheet(drones, 48)),
      'fly-1': png(await one(flyers[0], 1)), 'fly-2': png(await one(flyers[1], 1)), 'fly-3': png(await one(flyers[2], 2)),
      'sew-water': png(await strip(water))
    };
  }, { town: TOWN.map(r => r.map(rd)), animals: ANIMALS.map(r => r.map(rd)), drones: DRONES.map(rd), flyers: FLYERS.map(rd), water: WATER.map(rd) });
  for (const [n, d] of Object.entries(res)) fs.writeFileSync(path.join(out, n + '.png'), Buffer.from(d.split(',')[1], 'base64'));
  await b.close();
  const fd = path.join(__dirname, '../../assets/fonts'), NJ = path.join(src, 'Fonts/Not Jam Font Pack');
  fs.mkdirSync(fd, { recursive: true });
  fs.copyFileSync(path.join(NJ, 'NotJamMonoClean13/Not Jam Mono Clean 13.ttf'), path.join(fd, 'notjam-mono-clean-13.ttf'));
  fs.copyFileSync(path.join(NJ, 'NotJamUICondensed16/Not Jam UI Condensed 16.ttf'), path.join(fd, 'notjam-ui-condensed-16.ttf'));
  const COPY = {
    'cthulhu.png': 'Pixel Monsters/Cthulhu/animations/cthulu_192x112_SpriteSheet.png',
    'expl-a.png': 'Effects & FX/Explosion Pack 1/Explosions pack/explosion-1-a/spritesheet.png',
    'expl-b.png': 'Effects & FX/Explosion Pack 1/Explosions pack/explosion-1-b/spritesheet.png',
    'sof-tiles.png': 'Streets of Fight/Assets/Stage Layers/tileset.png',
    'sof-back.png': 'Streets of Fight/Assets/Stage Layers/back.png',
    'sof-fore.png': 'Streets of Fight/Assets/Stage Layers/fore.png',
    'sof-car.png': 'Streets of Fight/Assets/Stage Layers/props/car.png',
    'sof-hydrant.png': 'Streets of Fight/Assets/Stage Layers/props/hydrant.png',
    'sof-barrel.png': 'Streets of Fight/Assets/Stage Layers/props/barrel.png',
    'v1-far.png': 'Parallax Backgrounds/Cyberpunk Street/Assets/Version 1/PNG/layers/far-buildings.png',
    'v1-back.png': 'Parallax Backgrounds/Cyberpunk Street/Assets/Version 1/PNG/layers/back-buildings.png',
    'v1-fore.png': 'Parallax Backgrounds/Cyberpunk Street/Assets/Version 1/PNG/layers/foreground.png',
    'roof-front.png': 'Parallax Backgrounds/Cyberpunk Street/Assets/city skyline/Layers/front.png',
    'sew-back.png': 'Sewers Pack/Assets/Environment Layers/back.png',
    'sew-mid.png': 'Sewers Pack/Assets/Environment Layers/middle.png',
    'sew-front.png': 'Sewers Pack/Assets/Environment Layers/front.png'
  };
  for (const [n, f] of Object.entries(COPY)) fs.copyFileSync(path.join(src, f), path.join(out, n));
  console.log('wrote town.png, animals.png, drones.png, two fonts and ' + Object.keys(COPY).length + ' copied sheets');
})();

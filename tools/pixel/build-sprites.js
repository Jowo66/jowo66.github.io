// Packs the pixel street's animated sprites from the Craftpix free packs into atlases in assets/pixel/.
// usage: node tools/pixel/build-sprites.js "<...>/Design Assets"
//   town.png     Cyberpunk Townspeople 1-12: one 48px band per character, rows walk / idle / special (missing rows left empty)
//   animals.png  Street Animals at half size (the pack draws them as big as the people): rows walk / idle per animal
//   drones.png   Drones Pack: one row per drone, its flying loop
//   fonts        Not Jam Mono Clean 13 and UI Condensed 16 (CC0) copied to assets/fonts/
//   copied as they are: cthulhu.png (Pixel Monsters, CC0), expl-a/expl-b.png (Ansimuz Explosion Pack 1, CC0),
//   sof-*.png (Ansimuz Streets of Fight stage tiles and props, CC0) for the back street scene,
//   v1-*.png (Cyberpunk Street version 1) for Restaurant Row, roof-front.png (its city skyline) for the rooftops,
//   sew-*.png (Ansimuz Sewers pack, CC0) for the sewers; fly-1..3.png are Warped Vehicles (CC0) made smaller;
//   brawl.png (Streets of Fight fighters, halved), rcc.png, apt.png, cpap1/2.png (RCC Streets and Apartment demo tiles,
//   CyberPunk Asset Pack, CC0 per the user) for the pixel nightclub;
//   mon-*.png (Pixel Monsters and Mechs & Robots atlases) and fx-*.png (Free Pixel Effects strips) for the monster event
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
/* Streets of Fight's Brawler Girl and Enemy Punk (Ansimuz, CC0) for the club's moshpit, full size (they fight at the front of the pit): one row per animation */
const BRAWL = ['Brawler Girl/idle', 'Brawler Girl/walk', 'Brawler Girl/punch', 'Brawler Girl/kick', 'Brawler Girl/jab', 'Brawler Girl/hurt', 'Brawler Girl/jump_kick',
  'Enemy Punk/idle', 'Enemy Punk/walk', 'Enemy Punk/punch', 'Enemy Punk/hurt'].map(f => path.join(src, 'Streets of Fight/Assets/Spritesheets', f + '.png'));
/* the monster event's other giants: Pixel Monsters and Mechs & Robots, one atlas each with a row per animation
   [file, layout (H = frames side by side, V = stacked), frames]; fw/fh is the frame size, half halves the art */
const PM = f => path.join(src, 'Pixel Monsters', f), MR = f => path.join(src, 'Mechs & Robots', f);
const MONS = {
  obelisk: { fw: 200, fh: 400, half: true, rows: [[PM('Flying Obelisk/FlyingObelisk_no_lightnings_no_letter.png'), 'H', 13]] },
  reaper: { fw: 48, fh: 48, rows: [[PM('Reaper/Animation Sprite Sheets (PNG)/HostileIdleReaper-Sheet.png'), 'H', 5], [PM('Reaper/Animation Sprite Sheets (PNG)/HostileRunningReaper-Sheet.png'), 'H', 8], [PM('Reaper/Animation Sprite Sheets (PNG)/HostileAttackReaper-Sheet.png'), 'H', 10]] },
  boxer: { fw: 137, fh: 44, rows: [[PM('Spirit Boxer/Idle.png'), 'V', 4], [PM('Spirit Boxer/Run.png'), 'V', 6], [PM('Spirit Boxer/attack 2.png'), 'V', 13], [PM('Spirit Boxer/attack 3.png'), 'V', 10]] },
  small: { fw: 82, fh: 39, rows: [[PM('Small Monster/small moidle.png'), 'V', 6], [PM('Small Monster/small morun.png'), 'V', 6], [PM('Small Monster/attack.png'), 'V', 13]] },
  ball: { fw: 126, fh: 39, rows: [[MR('Ball and Chain Bot/idle.png'), 'V', 5], [MR('Ball and Chain Bot/run.png'), 'V', 8], [MR('Ball and Chain Bot/attack.png'), 'V', 8]] },
  zap: { fw: 58, fh: 41, rows: [[MR('Droid Zapper/run.png'), 'V', 6], [MR('Droid Zapper/run.png'), 'V', 6], [MR('Droid Zapper/attack.png'), 'V', 10]] },
  storm: { fw: 119, fh: 124, rows: [[MR('Stormhead/idle.png'), 'V', 9], [MR('Stormhead/run.png'), 'V', 10], [MR('Stormhead/attack.png'), 'V', 21]] },
  shield: { fw: 90, fh: 31, rows: [[MR('Shield Droid/walk.png'), 'V', 6], [MR('Shield Droid/walk.png'), 'V', 6], [MR('Shield Droid/shock attack.png'), 'V', 14]] },
  wheel: { fw: 117, fh: 26, rows: [[MR('Bot Wheel/move with FX.png'), 'V', 8], [MR('Bot Wheel/move with FX.png'), 'V', 8], [MR('Bot Wheel/shoot with FX.png'), 'V', 4]] }
};
/* Free Pixel Effects Pack (public domain): impacts for the tower attacks, every other frame of the 100px grid, halved */
const FXP = ['17_felspell', '18_midnight', '12_nebula', '13_vortex', '14_phantom', '16_sunburn', '19_freezing', '11_fire', '2_magic8'].map(n => [n.split('_')[1], path.join(src, 'Effects & FX/Free Pixel Effects Pack', n + '_spritesheet.png')]);
/* Ansimuz Sewers pack (CC0): the four frames of the front water side by side */
const WATER = [1, 2, 3, 4].map(i => path.join(src, `Sewers Pack/Assets/Environment Layers/Front-water/front-water${i}.png`));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const rd = f => fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : null;
  const res = await p.evaluate(async ({ town, animals, drones, flyers, water, brawl, mons, fxp }) => {
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
    /* a monster atlas: every animation laid out left to right on its own row, halved if asked */
    async function monSheet(m) {
      const ims = await Promise.all(m.rows.map(r => load(r[0]))), n = Math.max(...m.rows.map(r => r[2]));
      const cv = document.createElement('canvas'); cv.width = n * m.fw; cv.height = m.rows.length * m.fh; const c = cv.getContext('2d');
      m.rows.forEach(([, o, k], r) => { for (let i = 0; i < k; i++) c.drawImage(ims[r], o === 'H' ? i * m.fw : 0, o === 'H' ? 0 : i * m.fh, m.fw, m.fh, i * m.fw, r * m.fh, m.fw, m.fh) });
      if (!m.half) return cv;
      const d = halve(cv), o2 = document.createElement('canvas'); o2.width = d.width; o2.height = d.height; o2.getContext('2d').putImageData(d, 0, 0); return o2;
    }
    /* an effect sheet (a grid of 100px frames) as a strip of every other non-empty frame at 50px */
    async function fxStrip(u) {
      const im = await load(u), cols = im.width / 100, all = document.createElement('canvas'); all.width = im.width; all.height = im.height; const a = all.getContext('2d'); a.drawImage(im, 0, 0);
      const keep = []; for (let i = 0; i < cols * cols; i++) { const d = a.getImageData((i % cols) * 100, Math.floor(i / cols) * 100, 100, 100).data; let any = false; for (let j = 3; j < d.length; j += 4) if (d[j]) { any = true; break } if (any && i % 2 === 0) keep.push(i) }
      const cv = document.createElement('canvas'); cv.width = keep.length * 100; cv.height = 100; const c = cv.getContext('2d');
      keep.forEach((i, k) => c.drawImage(im, (i % cols) * 100, Math.floor(i / cols) * 100, 100, 100, k * 100, 0, 100, 100));
      const d = halve(cv), o2 = document.createElement('canvas'); o2.width = d.width; o2.height = d.height; o2.getContext('2d').putImageData(d, 0, 0); return o2;
    }
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
      'sew-water': png(await strip(water)),
      brawl: png(await sheet(brawl, 64)),
      ...Object.fromEntries(await Promise.all(Object.entries(mons).map(async ([k, m]) => ['mon-' + k, png(await monSheet(m))]))),
      ...Object.fromEntries(await Promise.all(fxp.map(async ([k, u]) => ['fx-' + k, png(await fxStrip(u))])))
    };
  }, { town: TOWN.map(r => r.map(rd)), animals: ANIMALS.map(r => r.map(rd)), drones: DRONES.map(rd), flyers: FLYERS.map(rd), water: WATER.map(rd), brawl: BRAWL.map(rd),
    mons: Object.fromEntries(Object.entries(MONS).map(([k, m]) => [k, { ...m, rows: m.rows.map(([f, o, n]) => [rd(f), o, n]) }])), fxp: FXP.map(([k, f]) => [k, rd(f)]) });
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
    'sew-front.png': 'Sewers Pack/Assets/Environment Layers/front.png',
    'rcc.png': 'Tilesets/RCC Streets Tiles Demo/16x16/streetstilesetDEMO.png',
    'apt.png': 'Apartment Tiles Demo/png/apartmentA5demo.png',
    'cpap1.png': 'CyberPunk Asset Pack/asset page 1.png',
    'cpap2.png': 'CyberPunk Asset Pack/page 2.png'
  };
  for (const [n, f] of Object.entries(COPY)) fs.copyFileSync(path.join(src, f), path.join(out, n));
  console.log('wrote town.png, animals.png, drones.png, two fonts and ' + Object.keys(COPY).length + ' copied sheets');
})();

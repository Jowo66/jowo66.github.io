// Builds the pixel street's images from Ansimuz's Cyberpunk Street (CC0) into assets/pixel/.
// usage: node tools/pixel/build-street.js "<...>/Cyberpunk Street/Assets"
//   street.png      the empty street (no cars, lamps or lanterns)
//   props.png       lamps, lantern strings and sign, full size, drawn over the people
//   car-*.png       the three cars, cut out of the full street
//   *-n.png         night versions: a palette swap that darkens and cools every colour except neon and lit windows
//   street-off.png  every colour darkened: neon signs are copied from it for a frame or two to flicker
//   sky-dusk.png, city-dusk.png  the day sky and far city (the night ones are sky-back.png and sky-city.png)
// tools/pixel/diff.js lists the pieces the two foregrounds differ by; the car boxes below come from it.
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '../../node_modules/playwright'));
const src = process.argv[2], out = path.join(__dirname, '../../assets/pixel');
const L = f => path.join(src, f);
const CARS = { far: [238, 165, 29, 25], red: [267, 183, 76, 56], taxi: [175, 173, 37, 37] };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const rd = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  const res = await p.evaluate(async ({ full, empty, cars }) => {
    const load = async u => { const im = new Image(); im.src = u; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, cv.width, cv.height) };
    const A = await load(full), E = await load(empty), W = A.width, H = A.height;
    const png = d => { const cv = document.createElement('canvas'); cv.width = d.width; cv.height = d.height; cv.getContext('2d').putImageData(d, 0, 0); return cv.toDataURL() };
    /* one colour in, one colour out, so the result stays pixel art */
    const night = (r, g, b) => {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510, s = mx === mn ? 0 : (mx - mn) / (l > .5 ? 510 - mx - mn : mx + mn);
      if ((s > .5 && l > .45) || l > .8) return [r, g, b];
      const k = .42; return [r * k * .8 + 12 * .2 | 0, g * k * .8 + 8 * .2 | 0, Math.min(255, b * k * .95 + 37 * .25) | 0];
    };
    const off = (r, g, b) => [r * .3 + 6 | 0, g * .3 + 4 | 0, b * .3 + 14 | 0];
    const map = (d, fn) => { const o = new ImageData(new Uint8ClampedArray(d.data), d.width, d.height); for (let i = 0; i < o.data.length; i += 4) { if (!o.data[i + 3]) continue; const c = fn(o.data[i], o.data[i + 1], o.data[i + 2]); o.data[i] = c[0]; o.data[i + 1] = c[1]; o.data[i + 2] = c[2] } return o };
    const diff = i => A.data[i + 3] && (A.data[i] !== E.data[i] || A.data[i + 1] !== E.data[i + 1] || A.data[i + 2] !== E.data[i + 2] || A.data[i + 3] !== E.data[i + 3]);
    const inCar = (x, y) => Object.values(cars).some(([cx, cy, w, h]) => x >= cx && y >= cy && x < cx + w && y < cy + h);
    const props = new ImageData(W, H), files = {};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (diff(i) && !inCar(x, y)) for (let k = 0; k < 4; k++) props.data[i + k] = A.data[i + k] }
    for (const [n, [cx, cy, w, h]] of Object.entries(cars)) {
      const d = new ImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((cy + y) * W + cx + x) * 4, o = (y * w + x) * 4; if (diff(i)) for (let k = 0; k < 4; k++) d.data[o + k] = A.data[i + k] }
      files['car-' + n + '.png'] = png(d); files['car-' + n + '-n.png'] = png(map(d, night));
    }
    files['street.png'] = png(E); files['street-n.png'] = png(map(E, night)); files['street-off.png'] = png(map(E, off));
    files['props.png'] = png(props); files['props-n.png'] = png(map(props, night));
    return files;
  }, { full: rd(L('Version 2/Layers/foreground.png')), empty: rd(L('Version 2/Layers/foreground-empty.png')), cars: CARS });
  for (const [n, u] of Object.entries(res)) fs.writeFileSync(path.join(out, n), Buffer.from(u.split(',')[1], 'base64'));
  fs.copyFileSync(L('Version 2/Layers/back.png'), path.join(out, 'sky-dusk.png'));
  fs.copyFileSync(L('Version 2/Layers/middle.png'), path.join(out, 'city-dusk.png'));
  console.log(Object.keys(res).join(' '));
  await b.close();
})();

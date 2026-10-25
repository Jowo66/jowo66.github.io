// Lists the pieces that Cyberpunk Street's full foreground has and its "empty" foreground lacks (cars, lanterns, the street lamp).
// usage: node tools/pixel/diff.js <foreground.png> <foreground-empty.png>
// Prints each connected piece's bounding box so build-street.js can be told which boxes are cars.
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '../../node_modules/playwright'));
const [full, empty] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const urls = [full, empty].map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
  const boxes = await p.evaluate(async (urls) => {
    const px = [];
    for (const u of urls) {
      const im = new Image(); im.src = u; await im.decode();
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      px.push(g.getImageData(0, 0, cv.width, cv.height));
    }
    const W = px[0].width, H = px[0].height, a = px[0].data, e = px[1].data, m = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const j = i * 4; if (a[j + 3] && (a[j] !== e[j] || a[j + 1] !== e[j + 1] || a[j + 2] !== e[j + 2] || a[j + 3] !== e[j + 3])) m[i] = 1 }
    const seen = new Uint8Array(W * H), out = [];
    for (let i = 0; i < W * H; i++) {
      if (!m[i] || seen[i]) continue;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const st = [i]; seen[i] = 1;
      while (st.length) {
        const k = st.pop(), x = k % W, y = (k / W) | 0; n++;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const q = yy * W + xx; if (m[q] && !seen[q]) { seen[q] = 1; st.push(q) }
        }
      }
      if (n > 6) out.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n });
    }
    return out.sort((p, q) => q.n - p.n);
  }, urls);
  console.log(JSON.stringify(boxes));
  await b.close();
})();

// Packs a chosen set of Duelyst units into atlases for the pixel street, the monster event and the club.
// usage: node tools/pixel/build-duelyst.js "<...>/Design Assets/Duelyst/Duelyst-Unit-Animations.unitypackage"
// The .unitypackage is a gzipped tar: every asset sits in a folder named by its GUID, with a `pathname` file saying
// where it lived in Unity and an `asset` file holding the data. Each unit has a sprite sheet and a TexturePacker plist.
//   assets/pixel/du-<unit>.png  rows: idle, run, attack (long animations keep every other frame), all frames one size
// then run python tools/pixel/palettize.py assets/pixel/du-*.png to store them as palette PNGs (about a third of the size)
//   duelyst.js                  window.DUELYST: per unit the frame size, rows, body box from the idle frames and a main colour
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require(path.join(__dirname, '../../node_modules/playwright'));
const pkg = process.argv[2], out = path.join(__dirname, '../../assets/pixel');

/* giants for the monster event, people for the street, and the club's DJs and dancers */
const UNITS = {
  giant: ['boss_chaosknight', 'boss_borealjuggernaut', 'boss_cindera', 'boss_skyfalltyrant', 'f5_flumposaur', 'neutral_moltengolem', 'f4_nightfiend',
    'neutral_dagona', 'neutral_razorcraggolem', 'f6_greatwhitenorth', 'neutral_sapphireseer', 'f5_kolossus'],
  street: ['neutral_ladylocke', 'neutral_tethermancer', 'neutral_moonlitsorcerer', 'neutral_quartermastergauj', 'neutral_dex', 'neutral_sai', 'neutral_koi',
    'neutral_mercpirate', 'neutral_voidhunter', 'neutral_rook', 'f2_mage4winds', 'f2_kibeholder', 'f6_sister', 'f3_dreamshaper', 'f1_sunbreaker', 'neutral_mogwai',
    'neutral_dilotas', 'neutral_exun', 'neutral_hsuku', 'neutral_kin', 'neutral_darknemesis', 'neutral_daywatcher', 'neutral_sunsteeldefender', 'neutral_tribalmelee1',
    'neutral_tribalmelee2', 'neutral_tribalranged2', 'neutral_wartalon', 'neutral_windrunner', 'neutral_zyx', 'neutral_spiritscribe', 'f1_silverguardsquire', 'f2_ranged',
    'f2_melee', 'f3_dunecaster', 'f4_shadowdancer', 'neutral_shadowcaster', 'neutral_gauntletmaster', 'neutral_inquisitorkron'],
  club: ['boss_harmony', 'boss_dissonance', 'boss_candypanda', 'neutral_celebrant', 'neutral_partyelf', 'neutral_gambler', 'f2_panddo', 'f1_sunstonemaiden']
};
const ROWS = [['idle', 8], ['run', 8], ['attack', 12]];   /* animation and the most frames kept */

/* ---- read the tar ---- */
const tar = zlib.gunzipSync(fs.readFileSync(pkg)), entries = {};
for (let o = 0; o + 512 <= tar.length;) {
  const name = tar.toString('utf8', o, o + 100).replace(/\0.*$/s, ''); if (!name) break;
  const size = parseInt(tar.toString('ascii', o + 124, o + 136).replace(/\0.*$/s, '').trim() || '0', 8);
  entries[name.replace(/^\.\//, '')] = tar.subarray(o + 512, o + 512 + size);
  o += 512 + Math.ceil(size / 512) * 512;
}
const byPath = {};
for (const [n, b] of Object.entries(entries)) if (n.endsWith('/pathname')) { const g = n.slice(0, -9), a = entries[g + '/asset']; if (a) byPath[b.toString('utf8').split('\n')[0].trim()] = a }
const find = (u, ext) => { const k = Object.keys(byPath).find(p => p.endsWith('/' + u + ext)); if (!k) throw new Error('missing ' + u + ext); return byPath[k] };

/* ---- the frames of one animation, in order, from the plist ---- */
function frames(plist, u, anim) {
  const re = new RegExp('<key>' + u + '_' + anim + '_(\\d+)\\.png</key>\\s*<dict>([\\s\\S]*?)</dict>', 'g'), list = [];
  let m; while ((m = re.exec(plist))) {
    const d = m[2], num = s => s.match(/-?\d+/g).map(Number);
    const fr = num(d.match(/<key>frame<\/key>\s*<string>([^<]+)/)[1]), src = num(d.match(/<key>sourceColorRect<\/key>\s*<string>([^<]+)/)[1]), ss = num(d.match(/<key>sourceSize<\/key>\s*<string>([^<]+)/)[1]);
    list.push({ i: +m[1], x: fr[0], y: fr[1], w: fr[2], h: fr[3], ox: src[0], oy: src[1], sw: ss[0], sh: ss[1] });
  }
  return list.sort((a, b) => a.i - b.i);
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const meta = {};
  for (const [cat, list] of Object.entries(UNITS)) for (const u of list) {
    const plist = find(u, '.plist').toString('utf8'), png = 'data:image/png;base64,' + find(u, '.png').toString('base64');
    const rows = ROWS.map(([a, max]) => { let f = frames(plist, u, a); if (!f.length && a === 'run') f = frames(plist, u, 'idle'); if (f.length > max) { const k = f.length / max; f = Array.from({ length: max }, (_, i) => f[Math.floor(i * k)]) } return [a, f] });
    const res = await p.evaluate(async ({ png, rows }) => {
      const im = new Image(); im.src = png; await im.decode();
      const fw = Math.max(...rows.flatMap(([, f]) => f.map(q => q.sw))), fh = Math.max(...rows.flatMap(([, f]) => f.map(q => q.sh))), n = Math.max(...rows.map(([, f]) => f.length));
      const cv = document.createElement('canvas'); cv.width = n * fw; cv.height = rows.length * fh; const c = cv.getContext('2d');
      rows.forEach(([, f], r) => f.forEach((q, k) => c.drawImage(im, q.x, q.y, q.w, q.h, k * fw + q.ox, r * fh + q.oy, q.w, q.h)));
      /* trim every cell to the area any frame draws in, so the atlas holds no empty margins */
      { const all = c.getImageData(0, 0, cv.width, cv.height).data; let a0 = fw, a1 = 0, b0 = fh, b1 = 0;
        for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (all[(y * cv.width + x) * 4 + 3] > 20) { const lx = x % fw, ly = y % fh; if (lx < a0) a0 = lx; if (lx > a1) a1 = lx; if (ly < b0) b0 = ly; if (ly > b1) b1 = ly }
        const tw = a1 - a0 + 1, th = b1 - b0 + 1, t2 = document.createElement('canvas'); t2.width = n * tw; t2.height = rows.length * th; const c2 = t2.getContext('2d');
        for (let r = 0; r < rows.length; r++) for (let k = 0; k < n; k++) c2.drawImage(cv, k * fw + a0, r * fh + b0, tw, th, k * tw, r * th, tw, th);
        return finish(t2, tw, th);
      }
      function finish(cv, fw, fh) { const c = cv.getContext('2d');
      /* body box: everything drawn in the idle row; main colour: the commonest bright, saturated hue in the attack row */
      let x0 = fw, x1 = 0, y0 = fh, y1 = 0;const d = c.getImageData(0, 0, cv.width, fh).data;
      for (let y = 0; y < fh; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 40) { const lx = x % fw; if (lx < x0) x0 = lx; if (lx > x1) x1 = lx; if (y < y0) y0 = y; if (y > y1) y1 = y }
      const a = c.getImageData(0, 2 * fh, cv.width, fh).data, hist = new Array(12).fill(0), sum = Array.from({ length: 12 }, () => [0, 0, 0]);
      for (let i = 0; i < a.length; i += 4) { if (a[i + 3] < 200) continue; const r = a[i], g = a[i + 1], bl = a[i + 2], mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); if (mx < 150 || mx - mn < 90) continue;
        const h = mx === r ? ((g - bl) / (mx - mn) + 6) % 6 : mx === g ? (bl - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4, k = Math.floor(h * 2) % 12; hist[k]++; sum[k][0] += r; sum[k][1] += g; sum[k][2] += bl }
      const best = hist.indexOf(Math.max(...hist)), col = hist[best] ? '#' + sum[best].map(v => Math.round(v / hist[best]).toString(16).padStart(2, '0')).join('') : '#ffd27a';
      return { url: cv.toDataURL(), fw, fh, n: rows.map(([, f]) => f.length), box: [x0, y0, x1, y1], col, hue: best * 30 };
      }
    }, { png, rows });
    fs.writeFileSync(path.join(out, 'du-' + u + '.png'), Buffer.from(res.url.split(',')[1], 'base64'));
    meta[u] = { cat, fw: res.fw, fh: res.fh, idle: [0, res.n[0]], run: [1, res.n[1]], atk: [2, res.n[2]], box: res.box, col: res.col, hue: res.hue };
    console.log(u, res.fw + 'x' + res.fh, res.n.join('/'), res.col);
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, '../../duelyst.js'),
    '/* Duelyst units (CC0) packed by tools/pixel/build-duelyst.js: frame size, rows [row, frames], idle body box [x0,y0,x1,y1] and main colour */\n' +
    'window.DUELYST=' + JSON.stringify(meta) + ';\n');
})();

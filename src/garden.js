/* Garden: one QR code per link. Tap a code and its squares rise into an ASCII tree; tap again and they fold back.
   Each code is a real QR code and still scans. Uses qrcode.js (MIT) from assets/. */
(function () {
'use strict';
var PALETTES = {
  evergreen: { lo: '#1c6a39', hi: '#8ae69b', ink: '#123d24', fin: '#9e2a22', bau: ['#ff5a47', '#ffd166', '#5b9bff'], star: '#ffd166', trunk: '#7a4a2a' },
  frost:     { lo: '#5f84ab', hi: '#eef6ff', ink: '#1f3550', fin: '#2d5f9a', bau: ['#bfe3ff', '#ffffff', '#a9c4ea'], star: '#ffffff', trunk: '#6d7f95' },
  rose:      { lo: '#a8476b', hi: '#ffc8da', ink: '#5a1830', fin: '#b2244f', bau: ['#fff0f4', '#ff8fb1', '#ffd166'], star: '#ffe1a8', trunk: '#7a3a4c' },
  midnight:  { lo: '#3047a8', hi: '#a9bbff', ink: '#141d4a', fin: '#3b4fbf', bau: ['#ffd166', '#e3e8ff', '#ff7a90'], star: '#ffd166', trunk: '#4a4f78' },
  ember:     { lo: '#a5401a', hi: '#ffbd6b', ink: '#4a1606', fin: '#b23a0e', bau: ['#fff1c2', '#ff6b35', '#ffe066'], star: '#fff1c2', trunk: '#6e3518' },
  neon:      { lo: '#13a86a', hi: '#a2ffd6', ink: '#0c3a26', fin: '#b0127a', bau: ['#ff4fd8', '#4ff0ff', '#fff04f'], star: '#fff04f', trunk: '#3a5c4c' }
};
var PAPER = '#f4f1ea', RAMP = '.:-=+*#%@';
var FONT = '"Fragment Mono",ui-monospace,monospace';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
var baublesOn = true;
var trees = [];

function rnd(a, b) { return a + Math.random() * (b - a); }
function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function mix(a, b, t) {
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  var r = (x >> 16) + (((y >> 16) - (x >> 16)) * t), g = ((x >> 8) & 255) + ((((y >> 8) & 255) - ((x >> 8) & 255)) * t), bl = (x & 255) + (((y & 255) - (x & 255)) * t);
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (bl | 0) + ')';
}
function hexMix(a, b, t) {
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), o = 0;
  [16, 8, 0].forEach(function (sh) { var u = (x >> sh) & 255, w = (y >> sh) & 255; o |= Math.round(u + (w - u) * t) << sh; });
  return '#' + o.toString(16).padStart(6, '0');
}
function lum(h) {
  var v = parseInt(h.slice(1), 16);
  var c = [v >> 16, (v >> 8) & 255, v & 255].map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function Tree(cv) {
  var url = cv.getAttribute('data-url'), pal = PALETTES[cv.getAttribute('data-pal')] || PALETTES.evergreen;
  var label = cv.getAttribute('data-name');
  var ctx = cv.getContext('2d');
  var qr, n, parts = [], dpr = 1, W = 0, H = 0, L = {};
  var prog = 0, target = 0, rot = Math.random() * 6.28, spinUntil = 0, hover = false, dirty = true;
  var self = { cv: cv, visible: false };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  qr = qrcode(0, 'M'); qr.addData(url); qr.make(); n = qr.getModuleCount();

  function isFinder(r, c) { return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7); }
  function qrShade(h) {
    if (lum(h) > 0.4) h = pal.fin;
    var pl = lum(PAPER), c = h;
    for (var i = 0; i < 20 && (pl + 0.05) / (lum(c) + 0.05) < 3.4; i++) c = hexMix(c, '#000000', 0.1);
    return c;
  }
  function needle() {
    var y = 0.1 + 0.8 * Math.sqrt(Math.random());
    var tier = ((y - 0.1) / 0.8) * 4, local = tier - Math.floor(tier);
    var r = 0.40 * ((y - 0.06) / 0.84) * (0.45 + 0.55 * local);
    return { kind: 'needle', y: y, a: Math.random() * Math.PI * 2, r: r * (0.8 + 0.2 * Math.random()) };
  }
  function starPts(k) {
    var out = [];
    for (var i = 0; i < k; i++) {
      var t = i / k, ang = t * Math.PI * 2 - Math.PI / 2, spike = Math.floor(t * 10), f = t * 10 - spike;
      var rr = (spike % 2 === 0 ? 0.085 - 0.05 * f : 0.035 + 0.05 * f) * rnd(0.55, 1);
      out.push({ kind: 'star', sx: Math.cos(ang) * rr, sy: Math.sin(ang) * rr, y: 0.06 });
    }
    return out;
  }
  function mkPart(cell, pt) {
    var p = { r: cell.r, c: cell.c, dark: cell.dark, fin: cell.dark && isFinder(cell.r, cell.c), pt: pt, tw: Math.random() * 6.28 };
    p.d = (pt.kind === 'star' ? 0.42 : (1 - pt.y) * 0.36) + Math.random() * 0.06;
    return p;
  }
  function paintBaubles() {
    parts.forEach(function (p) {
      p.bau = p.pt.kind === 'needle' && !p.dark && Math.random() < 0.045 && p.pt.r > 0.04 ? pal.bau[(Math.random() * pal.bau.length) | 0] : null;
      p.qb = null;
      if (p.dark && !p.fin && p.pt.kind === 'needle' && Math.random() < 0.13) {
        p.bau = pal.bau[(Math.random() * pal.bau.length) | 0]; p.qb = qrShade(p.bau);
        if (lum(p.bau) > 0.4) p.bau = hexMix(pal.fin, '#ffffff', 0.25);
      }
    });
  }
  function build() {
    var cells = [], finders = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var d = qr.isDark(r, c), cell = { r: r, c: c, dark: d };
      if (d && isFinder(r, c)) finders.push(cell); else cells.push(cell);
    }
    var total = Math.max(n * n, 1200) - finders.length, pts = [], trunkN = Math.round(total * 0.03), i;
    for (i = 0; i < trunkN; i++) pts.push({ kind: 'trunk', y: rnd(0.9, 1), a: Math.random() * Math.PI * 2, r: 0.045 * Math.random() + 0.015 });
    while (pts.length < total) pts.push(needle());
    var dark = cells.filter(function (x) { return x.dark; });
    while (cells.length < total) { var s = dark[(Math.random() * dark.length) | 0]; cells.push({ r: s.r, c: s.c, dark: false, extra: true }); }
    cells.forEach(function (x) { x.k = x.r + Math.random() * 1.6; });
    cells.sort(function (a, b) { return a.k - b.k; });
    pts.sort(function (a, b) { return a.y - b.y; });
    var band = Math.max(n, 40);
    for (var s0 = 0; s0 < total; s0 += band) {
      var cs = cells.slice(s0, s0 + band).sort(function (a, b) { return a.c - b.c; });
      var ps = pts.slice(s0, s0 + band).sort(function (a, b) { return Math.cos(a.a) * a.r - Math.cos(b.a) * b.r; });
      for (var j = 0; j < cs.length; j++) parts.push(mkPart(cs[j], ps[j]));
    }
    var st = starPts(finders.length);
    finders.forEach(function (f, k) { parts.push(mkPart(f, st[k])); });
    paintBaubles();
  }

  function resize() {
    var rc = cv.getBoundingClientRect();
    if (!rc.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = rc.width; H = rc.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var size = Math.min(W * 0.84, H * 0.84);
    L.cell = Math.max(2, Math.floor(size / (n + 4)));
    var qs = L.cell * n;
    L.cx = Math.round(W / 2); L.cy = Math.round(H / 2);
    L.ox = Math.round(L.cx - qs / 2); L.oy = Math.round(L.cy - qs / 2);
    L.th = Math.min(H * 0.94, W * 1.12); L.ty = L.cy - L.th / 2;
    L.font = Math.max(6, Math.round(L.th / 50));
    dirty = true;
  }

  var tp = { x: 0, y: 0, z: 0, s: 1 };
  function treePos(pt) {
    var D = 2.8, x, y, z;
    if (pt.kind === 'star') { x = pt.sx; y = pt.y + pt.sy; z = -0.05; }
    else { var a = pt.a + rot; x = Math.cos(a) * pt.r; z = Math.sin(a) * pt.r; y = pt.y; }
    var s = D / (D + z);
    tp.x = L.cx + x * L.th * s; tp.y = L.ty + y * L.th + z * L.th * 0.06; tp.z = z; tp.s = s;
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var qs = L.cell * n, pad = L.cell * 2;
    var paperA = 1 - smooth(0.0, 0.3, prog);
    if (paperA > 0) { ctx.globalAlpha = paperA; ctx.fillStyle = PAPER; ctx.fillRect(L.ox - pad, L.oy - pad, qs + pad * 2, qs + pad * 2); ctx.globalAlpha = 1; }
    ctx.font = L.font + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var span = 1 - 0.48, list = parts, i;
    if (prog > 0.2) { list = parts.slice(); for (i = 0; i < list.length; i++) { treePos(list[i].pt); list[i].zz = tp.z; } list.sort(function (a, b) { return b.zz - a.zz; }); }
    for (var k = 0; k < list.length; k++) {
      var p = list[k], e = ease(Math.min(1, Math.max(0, (prog - p.d) / span)));
      var x0 = L.ox + p.c * L.cell, y0 = L.oy + p.r * L.cell;
      var useQb = baublesOn && p.qb;
      if (e === 0) { if (p.dark) { ctx.fillStyle = p.fin ? pal.fin : (useQb ? p.qb : pal.ink); ctx.fillRect(x0, y0, L.cell + 0.6, L.cell + 0.6); } continue; }
      treePos(p.pt);
      var lift = Math.sin(e * Math.PI) * L.th * 0.05;
      var x = x0 + L.cell / 2 + (tp.x - x0 - L.cell / 2) * e, y = y0 + L.cell / 2 + (tp.y - y0 - L.cell / 2) * e - lift;
      var sqA = p.dark ? 1 - smooth(0.25, 0.65, e) : 0, glA = smooth(0.3, 0.8, e) * (p.extra ? 0.9 : 1);
      if (sqA > 0) {
        var sz = L.cell * (1 - e * 0.6), base = p.fin ? pal.fin : (useQb ? p.qb : pal.ink), to = useQb ? p.bau : pal.hi;
        ctx.globalAlpha = sqA; ctx.fillStyle = e > 0.05 ? mix(base, to, e) : base; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      if (glA > 0) {
        var front = Math.max(0, Math.min(1, 0.5 - tp.z / 0.8)), ch, col, fnt = L.font + 'px ' + FONT;
        if (p.pt.kind === 'star') { ch = Math.sin(t * 3 + p.tw) > 0.6 ? '+' : '*'; col = pal.star; }
        else if (p.pt.kind === 'trunk') { ch = '#'; col = mix('#000000', pal.trunk, 0.5 + 0.5 * front); }
        else if (baublesOn && p.bau) {
          ch = front > 0.55 ? '@' : 'o'; col = mix('#000000', p.bau, 0.5 + 0.5 * front); glA *= 0.8 + 0.2 * Math.sin(t * 2.4 + p.tw);
          fnt = 'bold ' + Math.round(L.font * 1.3 * tp.s) + 'px ' + FONT;
        } else {
          var b = Math.min(0.999, 0.12 + 0.88 * front * (0.82 + 0.18 * p.pt.r / 0.4)); ch = RAMP.charAt((b * RAMP.length) | 0); col = mix(pal.lo, pal.hi, b);
          if (tp.s !== 1) fnt = Math.round(L.font * tp.s) + 'px ' + FONT;
        }
        ctx.globalAlpha = glA; ctx.fillStyle = col; ctx.font = fnt; ctx.fillText(ch, x, y);
      }
      ctx.globalAlpha = 1;
    }
  }

  self.step = function (dt, t) {
    if (!W) { resize(); if (!W) return; }
    var speed = reduce.matches ? 100 : 1 / 1.9;
    if (prog < target) prog = Math.min(target, prog + dt * speed); else if (prog > target) prog = Math.max(target, prog - dt * speed);
    var moving = prog !== target, spin = !reduce.matches && prog > 0.9 && (hover || t < spinUntil);
    if (spin) rot += dt * 0.42;
    if (moving || spin || dirty) { draw(t); dirty = false; }
  };
  self.resize = resize;
  self.setBaubles = function () { dirty = true; };
  self.isTree = function () { return target > 0.5; };
  self.set = function (on) {
    target = on ? 1 : 0;
    if (on) spinUntil = performance.now() / 1000 + 5;
    cv.setAttribute('aria-label', label + ': ' + (on ? 'ASCII tree. Press Enter to turn it back into the QR code.' : 'QR code. Press Enter to turn it into a tree.'));
    cv.setAttribute('aria-pressed', on ? 'true' : 'false');
    syncAll();
  };
  self.toggle = function () { self.set(target < 0.5); };

  build();
  cv.setAttribute('aria-pressed', 'false');
  cv.addEventListener('click', self.toggle);
  cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.toggle(); } });
  cv.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
  cv.addEventListener('pointerleave', function () { hover = false; });
  cv.addEventListener('focus', function () { hover = true; });
  cv.addEventListener('blur', function () { hover = false; });
  return self;
}

var allBtn;
function syncAll() {
  if (!allBtn) return;
  var every = trees.length && trees.every(function (t) { return t.isTree(); });
  allBtn.textContent = every ? 'Show all codes' : 'Grow the garden';
}

function start() {
  var cvs = document.querySelectorAll('canvas[data-url]');
  for (var i = 0; i < cvs.length; i++) trees.push(Tree(cvs[i]));
  allBtn = document.getElementById('all');
  allBtn.addEventListener('click', function () {
    var every = trees.every(function (t) { return t.isTree(); });
    trees.forEach(function (t) { t.set(!every); });
  });
  var bx = document.getElementById('baub');
  bx.addEventListener('change', function () { baublesOn = bx.checked; trees.forEach(function (t) { t.setBaubles(); }); });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { trees.forEach(function (t) { if (t.cv === e.target) t.visible = e.isIntersecting; }); });
  }) : null;
  trees.forEach(function (t) { t.resize(); if (io) io.observe(t.cv); else t.visible = true; });
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { trees.forEach(function (t) { t.resize(); }); }); trees.forEach(function (t) { ro.observe(t.cv); }); }
  else window.addEventListener('resize', function () { trees.forEach(function (t) { t.resize(); }); });
  var last = 0;
  requestAnimationFrame(function f(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    trees.forEach(function (t) { if (t.visible) t.step(dt, now / 1000); });
    requestAnimationFrame(f);
  });
  window.gardenReady = true;
}
var ready = document.fonts && document.fonts.load ? document.fonts.load('12px "Fragment Mono"').catch(function () {}) : Promise.resolve();
ready.then(start, start);
})();

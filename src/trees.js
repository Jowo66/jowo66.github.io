/* QRTrees: turns a QR code into a rotating ASCII scene. Four seasons: a Christmas tree, a pumpkin, a turkey and fireworks.
   Each is a point cloud paired with the squares of a real QR code, so the code scans until you tap it.
   Needs qrcode.js (MIT) loaded first. */
(function (g) {
'use strict';
var PAPER = '#f4f1ea', RAMP = '.:-=+*#%@';
var FONT = '"Fragment Mono",ui-monospace,monospace';
var reduce = g.matchMedia('(prefers-reduced-motion: reduce)');
var NAMES = ['evergreen', 'frost', 'rose', 'midnight', 'ember', 'neon'];

function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[(Math.random() * a.length) | 0]; }
function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function mix(a, b, t) {
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  var r = (x >> 16) + (((y >> 16) - (x >> 16)) * t), gg = ((x >> 8) & 255) + ((((y >> 8) & 255) - ((x >> 8) & 255)) * t), bl = (x & 255) + (((y & 255) - (x & 255)) * t);
  return 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (bl | 0) + ')';
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

/* ---------- palettes: lo/hi shade the body, ink and fin colour the code, bau are accents, star the glow, trunk the stem/legs, fan extra colours ---------- */
function P(lo, hi, ink, fin, bau, star, trunk, fan) { return { lo: lo, hi: hi, ink: ink, fin: fin, bau: bau, star: star, trunk: trunk, fan: fan || [] }; }
var XMAS = {
  evergreen: P('#1c6a39', '#8ae69b', '#123d24', '#9e2a22', ['#ff5a47', '#ffd166', '#5b9bff'], '#ffd166', '#7a4a2a'),
  frost: P('#5f84ab', '#eef6ff', '#1f3550', '#2d5f9a', ['#bfe3ff', '#ffffff', '#a9c4ea'], '#ffffff', '#6d7f95'),
  rose: P('#a8476b', '#ffc8da', '#5a1830', '#b2244f', ['#fff0f4', '#ff8fb1', '#ffd166'], '#ffe1a8', '#7a3a4c'),
  midnight: P('#3047a8', '#a9bbff', '#141d4a', '#3b4fbf', ['#ffd166', '#e3e8ff', '#ff7a90'], '#ffd166', '#4a4f78'),
  ember: P('#a5401a', '#ffbd6b', '#4a1606', '#b23a0e', ['#fff1c2', '#ff6b35', '#ffe066'], '#fff1c2', '#6e3518'),
  neon: P('#13a86a', '#a2ffd6', '#0c3a26', '#b0127a', ['#ff4fd8', '#4ff0ff', '#fff04f'], '#fff04f', '#3a5c4c')
};
var SEAS = {
  christmas: { label: 'Christmas', noun: 'tree', min: 1400, pal: XMAS },
  halloween: { label: 'Halloween', noun: 'pumpkin', min: 2400, pal: {
    evergreen: P('#a34a00', '#ffb347', '#3d1d05', '#9b2d00', ['#7bd957', '#fff1c2', '#b56bff'], '#ffe14d', '#4a7a2a'),
    frost: P('#7d8aa0', '#f4f6ff', '#232a3d', '#3b4a73', ['#ff9d3c', '#b56bff', '#7bd957'], '#ffe9a0', '#5a7a4a'),
    rose: P('#6d3b9e', '#d8a8ff', '#2a1445', '#5b2a9a', ['#ff9d3c', '#7bd957', '#ffffff'], '#ffd166', '#3f7a3a'),
    midnight: P('#3a3f66', '#9aa5ff', '#14183a', '#313a9a', ['#ff9d3c', '#fff1c2', '#7bd957'], '#ff9d3c', '#5a6a3a'),
    ember: P('#8a2a10', '#ff7a45', '#3a0f05', '#a32208', ['#ffe066', '#7bd957', '#fff1c2'], '#ffe066', '#4a6a2a'),
    neon: P('#2f8a2a', '#b6ff6b', '#11330f', '#6a1aa8', ['#ff4fd8', '#ffd166', '#b56bff'], '#fff04f', '#7a4a9a')
  } },
  thanksgiving: { label: 'Thanksgiving', noun: 'turkey', min: 2000, pal: {
    evergreen: P('#6b3a1e', '#d9965b', '#3a1d0c', '#b3261e', ['#f0a22d', '#d94f1a', '#e8c13a'], '#f0a22d', '#c9772b', ['#8a3b12', '#d94f1a', '#f0a22d', '#c0392b']),
    frost: P('#8a8f9c', '#f4f1ea', '#2c2f3a', '#b3261e', ['#f0a22d', '#5b9bff', '#d94f1a'], '#f0a22d', '#d9965b', ['#3a3f4f', '#aab2c2', '#f4f1ea', '#d9a066']),
    rose: P('#8a3a52', '#f2a7b8', '#4a1a2a', '#c0261e', ['#ffe066', '#f0a22d', '#ffffff'], '#ffe066', '#d96a3a', ['#7a2a45', '#d9577a', '#f2a7b8', '#f0a22d']),
    midnight: P('#2f5a7a', '#8fc4e8', '#11283d', '#c0261e', ['#f0a22d', '#e8c13a', '#ffffff'], '#f0a22d', '#d9965b', ['#1f3f5a', '#2d7aa8', '#8fc4e8', '#e8c13a']),
    ember: P('#8a3a12', '#ffb06b', '#401a06', '#a8200f', ['#fff1c2', '#ffe066', '#7bd957'], '#ffe066', '#c9772b', ['#a8200f', '#e8541a', '#ffb06b', '#ffe066']),
    neon: P('#2a7a5a', '#7bffbf', '#0f3326', '#d4146a', ['#ff4fd8', '#4ff0ff', '#fff04f'], '#fff04f', '#3aa88a', ['#d4146a', '#ff7a3a', '#fff04f', '#4ff0ff'])
  } },
  newyear: { label: 'New Year', noun: 'fireworks', min: 1700, pal: {
    evergreen: P('#13a86a', '#a2ffd6', '#123d24', '#9e2a22', ['#ffffff', '#ffd166', '#5bff8a'], '#fff3b0', '#ffd166', ['#5bff8a', '#ffd166', '#ffffff']),
    frost: P('#5f84ab', '#eef6ff', '#1f3550', '#2d5f9a', ['#ffffff', '#bfe3ff', '#b9a8ff'], '#ffffff', '#bfe3ff', ['#8fd0ff', '#ffffff', '#b9a8ff']),
    rose: P('#a8476b', '#ffc8da', '#5a1830', '#b2244f', ['#ffffff', '#ffd166', '#ff8fb1'], '#ffe1a8', '#ffc2d6', ['#ff7aa8', '#ffc2d6', '#ffd166']),
    midnight: P('#3047a8', '#a9bbff', '#141d4a', '#3b4fbf', ['#ffffff', '#ffd166', '#ff7a90'], '#ffd166', '#c4ceff', ['#7a8dff', '#c4ceff', '#ff7a90']),
    ember: P('#a5401a', '#ffbd6b', '#4a1606', '#b23a0e', ['#ffffff', '#ffe066', '#ff6b35'], '#fff1c2', '#ffd166', ['#ff8a3a', '#ffd166', '#ff4a3a']),
    neon: P('#13a86a', '#a2ffd6', '#0c3a26', '#b0127a', ['#ffffff', '#fff04f', '#4ff0ff'], '#fff04f', '#4ff0ff', ['#ff4fd8', '#4ff0ff', '#fff04f'])
  } }
};
SEAS.christmas.names = ['Evergreen', 'Frost', 'Rose', 'Midnight', 'Ember', 'Neon'];
SEAS.halloween.names = ['Classic', 'Ghost', 'Purple', 'Midnight', 'Ember', 'Toxic'];
SEAS.thanksgiving.names = ['Harvest', 'Heritage', 'Rose', 'Midnight', 'Ember', 'Neon'];
SEAS.newyear.names = ['Emerald', 'Silver', 'Rose', 'Sapphire', 'Ember', 'Neon'];
var ORDER = ['christmas', 'halloween', 'thanksgiving', 'newyear'];

/* ---------- shapes. Every point has x, z (around the vertical axis), y (0 top, 1 bottom) in units of the picture height ---------- */
function polar(a, r) { return { x: Math.cos(a) * r, z: Math.sin(a) * r }; }

function genTree(pal, total, K) {
  var pts = [], i, trunkN = Math.round(total * 0.03);
  for (i = 0; i < trunkN; i++) { var q = polar(Math.random() * 6.283, 0.045 * Math.random() + 0.015); pts.push({ kind: 'trunk', x: q.x, z: q.z, y: rnd(0.9, 1), ch: '#', col: pal.trunk }); }
  while (pts.length < total) {
    var y = 0.1 + 0.8 * Math.sqrt(Math.random()), tier = ((y - 0.1) / 0.8) * 4, local = tier - Math.floor(tier);
    var r = 0.40 * ((y - 0.06) / 0.84) * (0.45 + 0.55 * local) * (0.8 + 0.2 * Math.random()), p = polar(Math.random() * 6.283, r);
    pts.push({ kind: 'body', x: p.x, z: p.z, y: y, shade: 0.82 + 0.18 * r / 0.4, acc: r > 0.04 });
  }
  var sp = [];
  for (i = 0; i < K; i++) {
    var t = i / K, ang = t * 6.283 - 1.5708, spike = Math.floor(t * 10), f = t * 10 - spike;
    var rr = (spike % 2 === 0 ? 0.085 - 0.05 * f : 0.035 + 0.05 * f) * rnd(0.55, 1);
    sp.push({ kind: 'star', fixed: true, x: Math.cos(ang) * rr, z: -0.05, y: 0.06 + Math.sin(ang) * rr, ch: '*', col: pal.star, late: true });
  }
  return { pts: pts, special: sp };
}

function genPumpkin(pal, total, K) {
  var pts = [], i, cy = 0.64, R = 0.40, RY = 0.31;
  var faceN = Math.round(total * 0.13);
  function onFront(x, y) {
    var u = (y - cy) / RY, w = 1 - u * u - (x / R) * (x / R);
    return w > 0.02 ? -R * Math.sqrt(w) : null;
  }
  for (i = 0; i < faceN; i++) {
    var zone = Math.random(), x, y;
    if (zone < 0.4) { y = rnd(0.47, 0.57); var hw = (y - 0.47) / 0.1 * 0.085; x = (Math.random() < 0.5 ? -1 : 1) * 0.19 + rnd(-hw, hw); }
    else if (zone < 0.5) { y = rnd(0.585, 0.635); x = rnd(-1, 1) * (y - 0.585) / 0.05 * 0.04; }
    else { y = rnd(0.685, 0.79); x = rnd(-0.27, 0.27); if (y > 0.725 && Math.floor((x + 0.27) / 0.054) % 2) { y = rnd(0.685, 0.725); } }
    var z = onFront(x, y);
    if (z === null) continue;
    pts.push({ kind: 'face', x: x, z: z, y: y, ch: '@', col: pal.star, glow: true });
  }
  while (pts.length < total) {
    var u = rnd(-1, 1), s = Math.sqrt(1 - u * u), a = Math.random() * 6.283, rib = Math.cos(a * 8);
    var depth = Math.random() < 0.82 ? 1 : rnd(0.55, 0.95);
    var rr = R * s * (1 + 0.09 * rib) * depth, q = polar(a, rr);
    pts.push({ kind: 'body', x: q.x, z: q.z, y: cy + RY * u * (1 - 0.06 * Math.abs(rib)) * (depth > 0.98 ? 1 : depth), shade: (0.78 + 0.22 * (rib * 0.5 + 0.5)) * (depth > 0.98 ? 1 : 0.7), acc: depth > 0.98 });
  }
  var sp = [], n1 = Math.round(K * 0.7);
  for (i = 0; i < K; i++) {
    if (i < n1) { var t = i / n1, q2 = polar(Math.random() * 6.283, 0.03 + 0.012 * Math.random()); sp.push({ kind: 'stem', x: q2.x + 0.045 * t * t, z: q2.z, y: 0.31 - 0.14 * t, ch: '#', col: pal.trunk, late: true }); }
    else { var t2 = (i - n1) / (K - n1), aa = t2 * 9; sp.push({ kind: 'vine', x: 0.05 + Math.cos(aa) * 0.05 * (1 - t2 * 0.6), z: Math.sin(aa) * 0.05 * (1 - t2 * 0.6), y: 0.19 - 0.06 * t2, ch: ':', col: mix('#000000', pal.trunk, 1), late: true }); }
  }
  for (i = 0; i < sp.length; i++) if (sp[i].kind === 'vine') sp[i].col = hexMix(pal.trunk, '#8ae69b', 0.35);
  return { pts: pts, special: sp };
}

function genTurkey(pal, total, K) {
  var pts = [], i, fan = pal.fan;
  var nFan = Math.round(total * 0.46), nBody = Math.round(total * 0.34), nWing = Math.round(total * 0.08), nNeck = Math.round(total * 0.05);
  for (i = 0; i < nFan; i++) {
    var feather = (Math.random() * 13) | 0, t = -1.45 + feather * (2.9 / 12) + rnd(-0.035, 0.035), rho = rnd(0.13, 0.43);
    var band = Math.min(3, Math.floor((rho - 0.13) / 0.075));
    pts.push({ kind: 'fan', x: Math.sin(t) * rho + rnd(-0.01, 0.01), y: 0.6 - Math.cos(t) * rho, z: 0.16 + rho * 0.1 + rnd(-0.012, 0.012), ch: ['#', '%', '@', '*'][band], col: fan[band], shade: 1, acc: Math.random() < 0.5 });
  }
  for (i = 0; i < nBody; i++) {
    var u = rnd(-1, 1), s = Math.sqrt(1 - u * u), a = Math.random() * 6.283;
    pts.push({ kind: 'body', x: 0.19 * s * Math.cos(a), z: 0.23 * s * Math.sin(a), y: 0.64 + 0.16 * u, shade: 0.7 + 0.3 * Math.random(), acc: true });
  }
  for (i = 0; i < nWing; i++) {
    var ang = Math.random() * 6.283, rr = 0.11 * Math.sqrt(Math.random()), side = Math.random() < 0.5 ? -1 : 1;
    pts.push({ kind: 'wing', x: side * 0.185, y: 0.64 + Math.sin(ang) * rr * 0.9, z: 0.02 + Math.cos(ang) * rr, ch: '%', col: fan[2], shade: 1 });
  }
  for (i = 0; i < nNeck; i++) { var tt = Math.random(); pts.push({ kind: 'body', x: rnd(-0.03, 0.03), z: -0.17 - 0.05 * tt + rnd(-0.03, 0.03), y: 0.52 - 0.12 * tt, shade: 1, acc: false }); }
  while (pts.length < total) { var side2 = Math.random() < 0.5 ? -1 : 1, ty = Math.random(); pts.push({ kind: 'leg', x: side2 * 0.06 + rnd(-0.008, 0.008), z: -0.02 - 0.04 * (ty > 0.9 ? 1 : 0), y: 0.78 + 0.16 * ty, ch: ty > 0.9 ? 'v' : '|', col: pal.trunk, shade: 1 }); }
  var sp = [];
  for (i = 0; i < K; i++) {
    var f = i / K, d;
    if (f < 0.62) { var u2 = rnd(-1, 1), s2 = Math.sqrt(1 - u2 * u2), a2 = Math.random() * 6.283; d = { kind: 'head', x: 0.055 * s2 * Math.cos(a2), z: -0.215 + 0.055 * s2 * Math.sin(a2), y: 0.4 + 0.055 * u2, ch: null, shade: 1 }; }
    else if (f < 0.74) d = { kind: 'beak', x: rnd(-0.012, 0.012), z: -0.27 - 0.025 * Math.random(), y: 0.4 + rnd(-0.01, 0.015), ch: '>', col: pal.star, shade: 1 };
    else d = { kind: 'wattle', x: rnd(-0.012, 0.012), z: -0.25 + rnd(-0.01, 0.01), y: 0.425 + 0.05 * Math.random(), ch: '%', col: pal.fin, shade: 1 };
    d.late = true; sp.push(d);
  }
  return { pts: pts, special: sp };
}

function genFireworks(pal, total, K) {
  var pts = [], i, fan = pal.fan;
  var bursts = [{ x: 0, y: 0.34, z: 0, R: 0.3, rays: 30, w: 0.55 }, { x: -0.3, y: 0.58, z: 0.06, R: 0.13, rays: 12, w: 0.14 }, { x: 0.3, y: 0.52, z: -0.06, R: 0.14, rays: 12, w: 0.14 }, { x: 0, y: 0.7, z: 0.3, R: 0.12, rays: 10, w: 0.1 }];
  bursts.forEach(function (b, bi) {
    var dirs = [], k;
    for (k = 0; k < b.rays; k++) { var yy = 1 - 2 * (k + 0.5) / b.rays, rr = Math.sqrt(1 - yy * yy), aa = k * 2.39996; dirs.push([Math.cos(aa) * rr, yy, Math.sin(aa) * rr]); }
    var n = Math.round(total * b.w);
    for (k = 0; k < n; k++) {
      var di = (Math.random() * b.rays) | 0, d = dirs[di], f = Math.pow(Math.random(), 0.6), rho = b.R * (0.12 + 0.88 * f);
      pts.push({ kind: 'ray', x: b.x + d[0] * rho, y: b.y + d[1] * rho + 0.15 * f * f * b.R / 0.3, z: b.z + d[2] * rho, ch: f > 0.8 ? '*' : f > 0.5 ? '+' : '.', col: fan[(di + bi) % fan.length], shade: 1, acc: true, flick: true });
    }
  });
  while (pts.length < total) pts.push({ kind: 'trail', x: rnd(-0.008, 0.008), z: rnd(-0.008, 0.008), y: rnd(0.62, 0.99), ch: Math.random() < 0.5 ? '|' : ':', col: pal.trunk, shade: 1 });
  var sp = [];
  for (i = 0; i < K; i++) { var a3 = Math.random() * 6.283, r3 = 0.05 * Math.sqrt(Math.random()); sp.push({ kind: 'core', fixed: true, x: Math.cos(a3) * r3, z: -0.05, y: 0.34 + Math.sin(a3) * r3, ch: '*', col: pal.star, late: true }); }
  return { pts: pts, special: sp };
}
var GEN = { christmas: genTree, halloween: genPumpkin, thanksgiving: genTurkey, newyear: genFireworks };

/* ---------- falling particles ---------- */
var MAPLE = (function () { var o = [], R = [1.15, 1, 0.8, 0.8, 1]; for (var k = 0; k < 5; k++) { var a = (-90 + 72 * k) * Math.PI / 180, b = a + Math.PI / 5; o.push([Math.cos(a) * R[k], Math.sin(a) * R[k]], [Math.cos(b) * 0.42, Math.sin(b) * 0.42]); } return o; })();
var LEAF = ['#d94f1a', '#f0a22d', '#a3361b', '#e8c13a', '#c0392b'];
var SPARK = ['#ffd166', '#ff7aa8', '#8fd0ff', '#5bff8a', '#ffffff', '#b9a8ff'];

function drawBat(c, s, flap) {
  var W = [[0, -0.2], [-0.6, -0.8 - 0.5 * flap], [-1.6, -0.7 - 0.7 * flap], [-2, -0.1 - 0.6 * flap], [-1.5, 0.1 - 0.3 * flap], [-1.1, 0.5], [-0.7, 0.15], [-0.35, 0.45], [0, 0.3]];
  c.beginPath(); W.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0] * s, p[1] * s); });
  for (var i = W.length - 1; i >= 0; i--) c.lineTo(-W[i][0] * s, W[i][1] * s);
  c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-0.3 * s, -0.3 * s); c.lineTo(-0.2 * s, -0.8 * s); c.lineTo(-0.02 * s, -0.4 * s); c.lineTo(0.02 * s, -0.4 * s); c.lineTo(0.2 * s, -0.8 * s); c.lineTo(0.3 * s, -0.3 * s); c.closePath(); c.fill(); c.stroke();
}
function drawGhost(c, s) {
  c.beginPath(); c.arc(0, 0, s, Math.PI, 0); c.lineTo(s, s * 1.1);
  for (var k = 0; k < 3; k++) { var x0 = s - k * (2 * s / 3); c.quadraticCurveTo(x0 - s / 6, s * 1.55, x0 - s / 3, s * 1.1); c.quadraticCurveTo(x0 - s / 2, s * 0.75, x0 - 2 * s / 3, s * 1.1); }
  c.closePath(); c.fill();
  c.fillStyle = '#1a1226'; c.beginPath(); c.arc(-s * 0.35, -s * 0.1, s * 0.16, 0, 6.283); c.arc(s * 0.35, -s * 0.1, s * 0.16, 0, 6.283); c.fill();
  c.beginPath(); c.ellipse(0, s * 0.35, s * 0.12, s * 0.17, 0, 0, 6.283); c.fill();
}

function Fx(season) {
  var P = [], bursts = [], timer = 0, W = 1, H = 1, u = 1, t = 0, i;
  function fresh(p, init) {
    p.x = Math.random() * W; p.y = init ? Math.random() * H : -rnd(8, 40) * u; p.ph = Math.random() * 6.283; p.rot = Math.random() * 6.283; p.vr = rnd(-2, 2);
    if (season === 'christmas') { p.vy = rnd(18, 42) * u; p.s = rnd(7, 14) * u; p.ch = pick(['*', '.', '+', '*']); p.a = rnd(0.5, 0.95); p.sw = rnd(8, 20) * u; }
    else if (season === 'thanksgiving') { p.vy = rnd(24, 52) * u; p.s = rnd(7, 12) * u; p.col = pick(LEAF); p.sw = rnd(18, 40) * u; }
    else if (season === 'halloween') { p.bat = Math.random() < 0.55; p.vy = (p.bat ? rnd(22, 38) : rnd(10, 22)) * u; p.s = (p.bat ? rnd(6, 9) : rnd(9, 13)) * u; p.sw = (p.bat ? rnd(26, 46) : rnd(10, 22)) * u; p.a = rnd(0.6, 0.85); }
  }
  var count = { christmas: 38, thanksgiving: 16, halloween: 9 }[season] || 0;
  for (i = 0; i < count; i++) P.push({});
  var ready = false;
  function burst() {
    var c = pick(SPARK), n = 14, sp = [];
    for (var k = 0; k < n; k++) { var a = k / n * 6.283 + Math.random() * 0.3; sp.push({ vx: Math.cos(a) * rnd(40, 80) * u, vy: Math.sin(a) * rnd(40, 80) * u }); }
    bursts.push({ x: rnd(0.15, 0.85) * W, y: rnd(0.12, 0.65) * H, t: 0, rise: 0.35, from: H, c: c, sp: sp });
  }
  return {
    size: function (w, h) { W = w; H = h; u = Math.max(0.6, w / 300); ready = false; },
    step: function (dt) {
      t += dt;
      if (!ready) { P.forEach(function (p) { fresh(p, true); }); ready = true; }
      P.forEach(function (p) {
        p.y += p.vy * dt; p.rot += p.vr * dt;
        p.x += Math.sin(t * (season === 'halloween' && p.bat ? 2.4 : 1.3) + p.ph) * p.sw * dt;
        if (p.y > H + 30 * u || p.x < -40 * u || p.x > W + 40 * u) fresh(p, false);
      });
      if (season === 'newyear') {
        timer -= dt; if (timer <= 0) { burst(); timer = rnd(0.5, 1.2); }
        bursts.forEach(function (b) { b.t += dt; });
        bursts = bursts.filter(function (b) { return b.t < b.rise + 1.2; });
      }
    },
    draw: function (c, alpha) {
      if (alpha <= 0.01) return;
      c.save(); c.globalAlpha = alpha; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (season === 'christmas') {
        c.fillStyle = '#eaf2ff';
        P.forEach(function (p) { c.globalAlpha = alpha * p.a; c.font = Math.round(p.s) + 'px ' + FONT; c.fillText(p.ch, p.x, p.y); });
      } else if (season === 'thanksgiving') {
        P.forEach(function (p) {
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(p.s, p.s * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.4 + p.ph))));
          c.fillStyle = p.col; c.beginPath(); MAPLE.forEach(function (q, k) { c[k ? 'lineTo' : 'moveTo'](q[0], q[1]); }); c.closePath(); c.fill();
          c.strokeStyle = p.col; c.lineWidth = 0.16; c.beginPath(); c.moveTo(0, 0.4); c.lineTo(0, 1.4); c.stroke(); c.restore();
        });
      } else if (season === 'halloween') {
        P.forEach(function (p) {
          c.save(); c.translate(p.x, p.y); c.globalAlpha = alpha * p.a;
          if (p.bat) { c.fillStyle = '#0b0714'; c.strokeStyle = 'rgba(200,170,255,.85)'; c.lineWidth = 1; c.rotate(Math.sin(t * 2 + p.ph) * 0.25); drawBat(c, p.s, Math.sin(t * 13 + p.ph)); }
          else { c.fillStyle = '#f4f1ff'; drawGhost(c, p.s); }
          c.restore();
        });
      } else if (season === 'newyear') {
        bursts.forEach(function (b) {
          c.fillStyle = b.c;
          if (b.t < b.rise) { var f = b.t / b.rise, y = b.from + (b.y - b.from) * f; c.globalAlpha = alpha * 0.8; c.font = Math.round(9 * u) + 'px ' + FONT; c.fillText('|', b.x, y); return; }
          var tt = b.t - b.rise, fade = Math.max(0, 1 - tt / 1.2);
          b.sp.forEach(function (s, k) { c.globalAlpha = alpha * fade; c.font = Math.round((7 + 4 * fade) * u) + 'px ' + FONT; c.fillText(k % 3 ? '*' : '+', b.x + s.vx * tt, b.y + s.vy * tt + 60 * u * tt * tt); });
        });
      }
      c.restore();
    }
  };
}

/* ---------- one canvas ---------- */
var shared = { baubles: true, fx: true };

function Tree(cv, season) {
  var url = cv.getAttribute('data-url'), palName = cv.getAttribute('data-pal') || 'evergreen', label = cv.getAttribute('data-name') || url;
  var ctx = cv.getContext('2d');
  var qr, n, parts = [], W = 0, H = 0, L = {}, S, pal, fx;
  var prog = 0, target = 0, rot = Math.random() * 6.28, spinUntil = 0, hover = false, dirty = true, tp = { x: 0, y: 0, z: 0, s: 1 };
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
  function mkPart(cell, pt) {
    var p = { r: cell.r, c: cell.c, dark: cell.dark, fin: cell.dark && isFinder(cell.r, cell.c), pt: pt, tw: Math.random() * 6.28 };
    p.d = (pt.late ? 0.42 : (1 - pt.y) * 0.36) + Math.random() * 0.06;
    return p;
  }
  function paintAccents() {
    parts.forEach(function (p) {
      p.bau = p.pt.acc && !p.dark && Math.random() < 0.045 ? pick(pal.bau) : null;
      p.qb = null;
      if (p.dark && !p.fin && p.pt.acc && Math.random() < 0.13) {
        p.bau = pick(pal.bau); p.qb = qrShade(p.bau);
        if (lum(p.bau) > 0.4) p.bau = hexMix(pal.fin, '#ffffff', 0.25);
      }
    });
  }
  function build() {
    parts = [];
    var cells = [], finders = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var d = qr.isDark(r, c), cell = { r: r, c: c, dark: d };
      if (d && isFinder(r, c)) finders.push(cell); else cells.push(cell);
    }
    var total = Math.max(n * n, S.min) - finders.length;
    var shape = GEN[season](pal, total, finders.length), pts = shape.pts.slice(0, total);
    var dark = cells.filter(function (x) { return x.dark; });
    while (cells.length < total) { var s = dark[(Math.random() * dark.length) | 0]; cells.push({ r: s.r, c: s.c, dark: false, extra: true }); }
    cells.forEach(function (x) { x.k = x.r + Math.random() * 1.6; });
    cells.sort(function (a, b) { return a.k - b.k; });
    pts.sort(function (a, b) { return a.y - b.y; });
    var band = Math.max(n, 40);
    for (var s0 = 0; s0 < total; s0 += band) {
      var cs = cells.slice(s0, s0 + band).sort(function (a, b) { return a.c - b.c; });
      var ps = pts.slice(s0, s0 + band).sort(function (a, b) { return a.x - b.x; });
      for (var j = 0; j < cs.length; j++) parts.push(mkPart(cs[j], ps[j]));
    }
    finders.forEach(function (f, k) { parts.push(mkPart(f, shape.special[k])); });
    paintAccents(); dirty = true;
  }

  function resize() {
    var rc = cv.getBoundingClientRect();
    if (!rc.width) return;
    var dpr = Math.min(g.devicePixelRatio || 1, 2); W = rc.width; H = rc.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var size = Math.min(W * 0.84, H * 0.84);
    L.cell = Math.max(2, Math.floor(size / (n + 4)));
    var qs = L.cell * n;
    L.cx = Math.round(W / 2); L.cy = Math.round(H / 2);
    L.ox = Math.round(L.cx - qs / 2); L.oy = Math.round(L.cy - qs / 2);
    L.th = Math.min(H * 0.94, W * 1.12); L.ty = L.cy - L.th / 2;
    L.font = Math.max(6, Math.round(L.th / 50));
    fx.size(W, H); dirty = true;
  }

  var cr = 1, sr = 0;
  function pos(pt) {
    var D = 2.8, x, z;
    if (pt.fixed) { x = pt.x; z = pt.z; } else { x = pt.x * cr - pt.z * sr; z = pt.x * sr + pt.z * cr; }
    var s = D / (D + z);
    tp.x = L.cx + x * L.th * s; tp.y = L.ty + pt.y * L.th + z * L.th * 0.06; tp.z = z; tp.s = s;
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    if (shared.fx) fx.draw(ctx, smooth(0.3, 0.9, prog));
    var qs = L.cell * n, pad = L.cell * 2, bOn = shared.baubles;
    var paperA = 1 - smooth(0.0, 0.3, prog);
    if (paperA > 0) { ctx.globalAlpha = paperA; ctx.fillStyle = PAPER; ctx.fillRect(L.ox - pad, L.oy - pad, qs + pad * 2, qs + pad * 2); ctx.globalAlpha = 1; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    cr = Math.cos(rot); sr = Math.sin(rot);
    var span = 0.52, list = parts, i;
    if (prog > 0.2) { list = parts.slice(); for (i = 0; i < list.length; i++) { pos(list[i].pt); list[i].zz = tp.z; } list.sort(function (a, b) { return b.zz - a.zz; }); }
    for (var k = 0; k < list.length; k++) {
      var p = list[k], pt = p.pt, e = ease(Math.min(1, Math.max(0, (prog - p.d) / span)));
      var x0 = L.ox + p.c * L.cell, y0 = L.oy + p.r * L.cell, useQb = bOn && p.qb;
      if (e === 0) { if (p.dark) { ctx.fillStyle = p.fin ? pal.fin : (useQb ? p.qb : pal.ink); ctx.fillRect(x0, y0, L.cell + 0.6, L.cell + 0.6); } continue; }
      pos(pt);
      var lift = Math.sin(e * Math.PI) * L.th * 0.05;
      var x = x0 + L.cell / 2 + (tp.x - x0 - L.cell / 2) * e, y = y0 + L.cell / 2 + (tp.y - y0 - L.cell / 2) * e - lift;
      var sqA = p.dark ? 1 - smooth(0.25, 0.65, e) : 0, glA = smooth(0.3, 0.8, e) * (p.extra ? 0.9 : 1);
      if (sqA > 0) {
        var sz = L.cell * (1 - e * 0.6), base = p.fin ? pal.fin : (useQb ? p.qb : pal.ink), to = useQb ? p.bau : pal.hi;
        ctx.globalAlpha = sqA; ctx.fillStyle = e > 0.05 ? mix(base, to, e) : base; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      if (glA > 0) {
        var front = Math.max(0, Math.min(1, 0.5 - tp.z / 0.8)), ch, col, fnt = L.font + 'px ' + FONT;
        if (bOn && p.bau) {
          ch = front > 0.55 ? '@' : 'o'; col = mix('#000000', p.bau, 0.5 + 0.5 * front); glA *= 0.8 + 0.2 * Math.sin(t * 2.4 + p.tw);
          fnt = 'bold ' + Math.round(L.font * 1.3 * tp.s) + 'px ' + FONT;
        } else if (pt.fixed) {
          ch = Math.sin(t * 3 + p.tw) > 0.6 ? '+' : '*'; col = pt.col;
        } else if (pt.ch) {
          ch = pt.ch; col = pt.glow ? pt.col : mix('#000000', pt.col, 0.4 + 0.6 * front);
          if (pt.glow) glA *= (0.55 + 0.45 * front) * (0.85 + 0.15 * Math.sin(t * 5 + p.tw));
          else if (pt.flick && Math.sin(t * 4 + p.tw) > 0.88) ch = '*';
          if (tp.s !== 1) fnt = Math.round(L.font * tp.s) + 'px ' + FONT;
        } else {
          var b = Math.min(0.999, 0.12 + 0.88 * front * (pt.shade || 1)); ch = RAMP.charAt((b * RAMP.length) | 0); col = mix(pal.lo, pal.hi, b);
          if (tp.s !== 1) fnt = Math.round(L.font * tp.s) + 'px ' + FONT;
        }
        ctx.globalAlpha = glA; ctx.fillStyle = col; ctx.font = fnt; ctx.fillText(ch, x, y);
      }
      ctx.globalAlpha = 1;
    }
  }

  function aria() {
    cv.setAttribute('aria-label', label + ': ' + (target > 0.5 ? 'ASCII ' + S.noun + '. Press Enter to turn it back into the QR code.' : 'QR code. Press Enter to turn it into a ' + S.noun + '.'));
    cv.setAttribute('aria-pressed', target > 0.5 ? 'true' : 'false');
  }
  self.setSeason = function (name) {
    season = SEAS[name] ? name : 'christmas'; S = SEAS[season]; rot = season === 'christmas' ? Math.random() * 6.28 : 0; pal = S.pal[palName] || S.pal.evergreen; fx = Fx(season);
    if (W) fx.size(W, H);
    build(); aria();
  };
  self.step = function (dt, t) {
    if (!W) { resize(); if (!W) return; }
    var speed = reduce.matches ? 100 : 1 / 1.9;
    if (prog < target) prog = Math.min(target, prog + dt * speed); else if (prog > target) prog = Math.max(target, prog - dt * speed);
    var moving = prog !== target, spin = !reduce.matches && prog > 0.9 && (hover || self.alwaysSpin || t < spinUntil), falling = !reduce.matches && shared.fx && prog > 0.3;
    if (spin) rot += dt * 0.42;
    if (falling) fx.step(dt);
    if (moving || spin || falling || dirty) { draw(t); dirty = false; }
  };
  self.resize = resize;
  self.setPal = function (name) { palName = name; self.setSeason(season); };
  self.setUrl = function (u) {
    var q = qrcode(0, 'M'); q.addData(u); q.make();
    qr = q; n = q.getModuleCount(); url = u; label = u; self.setSeason(season); if (W) resize();
  };
  self.png = function (cb) {
    var cell = 12, pad = cell * 4, size = n * cell + pad * 2, oc = document.createElement('canvas'); oc.width = oc.height = size;
    var o = oc.getContext('2d'); o.fillStyle = PAPER; o.fillRect(0, 0, size, size);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) { o.fillStyle = isFinder(r, c) ? pal.fin : pal.ink; o.fillRect(pad + c * cell, pad + r * cell, cell, cell); }
    if (shared.baubles) parts.forEach(function (p) { if (p.qb) { o.fillStyle = p.qb; o.fillRect(pad + p.c * cell, pad + p.r * cell, cell, cell); } });
    oc.toBlob(cb, 'image/png');
  };
  self.redraw = function () { dirty = true; };
  self.isTree = function () { return target > 0.5; };
  self.set = function (on) {
    target = on ? 1 : 0;
    if (on) spinUntil = performance.now() / 1000 + 5;
    aria(); if (self.onchange) self.onchange();
  };
  self.toggle = function () { self.set(target < 0.5); };
  self.setSeason(season);
  cv.addEventListener('click', self.toggle);
  cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.toggle(); } });
  cv.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
  cv.addEventListener('pointerleave', function () { hover = false; });
  cv.addEventListener('focus', function () { hover = true; });
  cv.addEventListener('blur', function () { hover = false; });
  return self;
}

/* ---------- a whole garden: every canvas[data-url] on the page, with season buttons ---------- */
function garden(opts) {
  opts = opts || {};
  var trees = [], season = opts.season || 'christmas';
  try { var saved = g.localStorage.getItem('garden-season'); if (SEAS[saved]) season = saved; } catch (e) {}
  var q = /[?&]season=(\w+)/.exec(g.location.search); if (q && SEAS[q[1]]) season = q[1];
  Array.prototype.forEach.call(document.querySelectorAll('canvas[data-url]'), function (cv) { trees.push(Tree(cv, season)); });
  var all = document.getElementById('all'), bx = document.getElementById('baub'), seasons = document.getElementById('seasons');
  function sync() { if (all) all.textContent = trees.length && trees.every(function (t) { return t.isTree(); }) ? 'Show all codes' : 'Grow the garden'; }
  trees.forEach(function (t) { t.onchange = sync; });
  if (all) all.addEventListener('click', function () { var every = trees.every(function (t) { return t.isTree(); }); trees.forEach(function (t) { t.set(!every); }); });
  if (bx) bx.addEventListener('change', function () { shared.baubles = bx.checked; trees.forEach(function (t) { t.redraw(); }); });
  function pickSeason(name) {
    season = name; trees.forEach(function (t) { t.setSeason(name); });
    try { g.localStorage.setItem('garden-season', name); } catch (e) {}
    if (seasons) Array.prototype.forEach.call(seasons.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-season') === name ? 'true' : 'false'); });
    if (opts.onSeason) opts.onSeason(name, SEAS[name]);
  }
  if (seasons) {
    seasons.innerHTML = '';
    ORDER.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('data-season', k); b.textContent = SEAS[k].label;
      b.addEventListener('click', function () { pickSeason(k); }); seasons.appendChild(b);
    });
  }
  pickSeason(season);
  var io = 'IntersectionObserver' in g ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { trees.forEach(function (t) { if (t.cv === e.target) t.visible = e.isIntersecting; }); });
  }) : null;
  trees.forEach(function (t) { t.resize(); if (io) io.observe(t.cv); else t.visible = true; });
  if ('ResizeObserver' in g) { var ro = new ResizeObserver(function () { trees.forEach(function (t) { t.resize(); }); }); trees.forEach(function (t) { ro.observe(t.cv); }); }
  else g.addEventListener('resize', function () { trees.forEach(function (t) { t.resize(); }); });
  var last = 0;
  requestAnimationFrame(function f(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    trees.forEach(function (t) { if (t.visible) t.step(dt, now / 1000); });
    requestAnimationFrame(f);
  });
  g.gardenReady = true;
  return { trees: trees, setSeason: pickSeason };
}

g.QRTrees = { SEAS: SEAS, ORDER: ORDER, Tree: Tree, garden: garden, shared: shared, NAMES: NAMES };
})(window);

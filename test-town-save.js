// Town/RTS save-restore smoke test (no browser).
// Run: node test-town-save.js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const gameSrc = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8') + `
;globalThis.__trProbe = {
  newGame, saveGame, loadGame, snapshot, applyTownSave,
  get() {
    return {
      structures, laborers, militia, barricades, brickWalls,
      wood, gold, waveTrainLeft, goldMines, wave, waveActive,
    };
  },
  seedTownProgress() {
    structures.push({
      kind: 'muster', x: 1000, y: 1000, r: 46, hp: 300, maxHp: 300, lvl: 2,
      trainCd: 0, seepT: 0, kiT: 0,
    });
    militia.push({
      id: 99, kind: 'spear', x: 1100, y: 1100, vx: 0, vy: 0, r: 12,
      hp: 200, maxHp: 230, downed: false, hurtT: 0, atkCd: 0, walk: 0, facing: 1, aim: 0,
      sk: { dmg: 2, armor: 1, spd: 0 },
    });
    laborers[0].order = 'mine';
    laborers[0].x = 900;
    laborers[0].y = 900;
    barricades.push({ x: 800, y: 800, r: 34, hp: 160, maxHp: 160, baseHp: 160, neighbors: 0 });
    brickWalls.push({
      x: 700, y: 700, r: 18, hp: 280, maxHp: 280, baseHp: 280, neighbors: 0,
      links: { n: null, e: null, s: null, w: null },
    });
    brickWalls.push({
      x: 796, y: 700, r: 18, hp: 280, maxHp: 280, baseHp: 280, neighbors: 0,
      links: { n: null, e: null, s: null, w: null },
    });
    if (typeof refreshBrickWallLinks === 'function') refreshBrickWallLinks();
    wood = 77; gold = 55; wave = 3; waveActive = false; waveTrainLeft = 1;
    if (goldMines[0]) goldMines[0].goldLeft = 12;
  },
};
`;

function makeCtx() {
  const o = {};
  return new Proxy(o, {
    get(t, p) {
      if (p in t) return t[p];
      return typeof p === 'string' && p.startsWith('get') ? () => null : () => makeCtx();
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}
function makeEl(id) {
  const classes = new Set(id === 'updateBanner' ? ['hidden'] : []);
  const style = {
    setProperty(k, v) { this[k] = v; },
    removeProperty(k) { delete this[k]; },
  };
  return {
    id, style, width: 800, height: 600, className: '',
    textContent: '', innerHTML: '', value: '', children: [], dataset: {}, disabled: false,
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      toggle: (c, force) => {
        if (force === true) classes.add(c);
        else if (force === false) classes.delete(c);
        else if (classes.has(c)) classes.delete(c);
        else classes.add(c);
      },
      contains: c => classes.has(c),
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
    getContext: () => makeCtx(),
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {},
    querySelectorAll: () => [], querySelector: () => null,
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, focus() {}, blur() {},
  };
}

const store = {};
const els = new Map();
const el = id => { if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); };

function AudioCtx() {
  this.createGain = () => ({ connect() { return this; }, gain: { value: 1 } });
  this.createOscillator = () => ({
    connect() { return this; }, start() {}, stop() {}, frequency: { value: 0 }, type: '',
  });
  this.createBuffer = () => ({ getChannelData: () => new Float32Array(8) });
  this.createBufferSource = () => ({ connect() { return this; }, start() {}, buffer: null });
  this.destination = {};
  this.resume = async () => {};
  this.state = 'running';
}

const sandbox = {
  console, Math, JSON, Date, Promise, setTimeout, clearTimeout, setInterval, clearInterval,
  parseInt, parseFloat, isNaN, String, Number, Array, Object, RegExp, Error, Map, Set, Float32Array,
  innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
  navigator: { maxTouchPoints: 0, userAgent: 'test' },
  location: { href: 'http://localhost/' },
  performance: { now: () => Date.now() },
  addEventListener() {}, removeEventListener() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  open: () => null,
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
  document: {
    getElementById: el,
    createElement: tag => makeEl('<' + tag + '>'),
    body: makeEl('body'),
    documentElement: makeEl('html'),
    addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], querySelector: () => null,
  },
  Image: function () {
    this.onload = null; this.onerror = null; this.width = 64; this.height = 64;
    Object.defineProperty(this, 'src', {
      set() { if (this.onload) setTimeout(() => this.onload(), 0); },
      get() { return ''; },
    });
  },
  AudioContext: AudioCtx,
  webkitAudioContext: AudioCtx,
  WebSocket: function () { this.send = () => {}; this.close = () => {}; },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

try {
  vm.runInNewContext(gameSrc, sandbox, { filename: 'game.js' });
} catch (e) {
  console.log('(init note)', e.message);
  process.exit(2);
}

const P = sandbox.__trProbe;
let failed = 0;
function check(name, ok, detail) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
}

check('probe wired', !!P && typeof P.saveGame === 'function');
P.newGame();
let st = P.get();
check('starter town seeded', st.structures.some(s => s.kind === 'keep') && st.laborers.length >= 2);

P.seedTownProgress();
P.saveGame(false);
const raw = JSON.parse(store.tr_save1);
check('town payload in save', !!raw.town && Array.isArray(raw.town.structures));
check('save has muster L2', raw.town.structures.some(s => s.kind === 'muster' && s.lvl === 2));
check('save has militia skills', raw.town.militia.length === 1 && raw.town.militia[0].sk.dmg === 2);
check('save has laborer order', raw.town.laborers[0].order === 'mine');
check('save has barricade', raw.town.barricades.length === 1);
check('save has brickWalls', Array.isArray(raw.town.brickWalls) && raw.town.brickWalls.length === 2);
check('wood/gold saved', raw.wood === 77 && raw.gold === 55);

check('loadGame ok', P.loadGame() === true);
st = P.get();
check('structures restored', st.structures.some(s => s.kind === 'muster' && s.lvl === 2));
check('militia restored', st.militia.length === 1 && st.militia[0].sk.dmg === 2 && st.militia[0].x === 1100);
check('laborer restored', st.laborers[0].order === 'mine' && st.laborers[0].x === 900);
check('barricades restored', st.barricades.length === 1 && st.barricades[0].x === 800);
check('brickWalls restored', st.brickWalls.length === 2 && st.brickWalls[0].x === 700);
check('brickWalls linked', st.brickWalls.some(w => (w.neighbors || 0) >= 1));
check('resources restored', st.wood === 77 && st.gold === 55);
check('waveTrainLeft restored', st.waveTrainLeft === 1);
check('gold mine stock restored', !st.goldMines[0] || st.goldMines[0].goldLeft === 12);

const old = JSON.parse(store.tr_save1);
delete old.town;
store.tr_save1 = JSON.stringify(old);
check('old save still loads', P.loadGame() === true);
st = P.get();
check('old save keeps starter keep', st.structures.some(s => s.kind === 'keep'));
check('companion squad keys untouched', !!P.snapshot().squad);

console.log(failed ? `\n${failed} FAIL` : '\nALL PASS');
process.exit(failed ? 1 : 0);

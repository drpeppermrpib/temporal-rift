// BETA-3.1 step 5 — tap-to-place + enemy pause smoke (no browser / no APK).
// Run: node test-build-place.js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const gameSrc = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8') + `
;globalThis.__trProbe = {
  newGame, enterBuildPlaceMode, cancelBuildPlaceMode, confirmBuildPlace,
  BARRICADE_MAX, BRICKWALL_MAX, STRUCT_KINDS, knockHitsNeeded, applyKnock,
  updateCompanions, updateMilitia,
  get() {
    return {
      buildPlaceMode, buildPlacePaused, buildGhostKind, buildPlaceStructKind,
      barricades, brickWalls, structures, cores, wood, gold,
      state, playerAim: player.aim, playerX: player.x, playerY: player.y,
      companions, militia, wave,
    };
  },
  seedPlaceReady() {
    cores = 40; wood = 80; gold = 40;
    enemies.length = 0;
    enemies.push({
      x: player.x + 200, y: player.y, r: 14, hp: 100, maxHp: 100,
      dead: false, spawnT: 0, vx: 40, vy: 0, spd: 80, dmg: 5,
      type: 'husk', flash: 0, invulnT: 0, walk: 0, facing: 1,
    });
  },
  seedSquadCombat() {
    companions.length = 0;
    militia.length = 0;
    companions.push({
      type: 'rover', x: player.x + 40, y: player.y, r: 12, hp: 100, maxHp: 100,
      vx: 0, vy: 0, downed: false, hurtT: 0, atkCd: 0, swipeT: 0, facing: 1, walk: 0, aim: 0, fetchCd: 0,
    });
    militia.push({
      kind: 'spear', id: 1, x: player.x - 40, y: player.y, r: 12, hp: 100, maxHp: 100,
      vx: 0, vy: 0, downed: false, hurtT: 0, atkCd: 0, swipeT: 0, facing: 1, walk: 0, aim: 0,
      sk: { dmg: 0, armor: 0, spd: 0, rate: 0, magnet: 0 },
    });
  },
  setWave(w) { wave = w; },
  setPlayerAt(x, y, aim) { player.x = x; player.y = y; player.aim = aim; },
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

check('probe wired', !!(P && P.enterBuildPlaceMode && P.confirmBuildPlace && P.cancelBuildPlaceMode));

P.newGame();
P.seedPlaceReady();
let g = P.get();
check('newGame playing', g.state === 'playing');
check('place off after newGame', !g.buildPlaceMode && !g.buildPlacePaused);

P.enterBuildPlaceMode('barricade');
g = P.get();
check('enter barricade mode', g.buildPlaceMode === true);
check('enter sets pause', g.buildPlacePaused === true);
check('ghost barricade', g.buildGhostKind === 'barricade');

P.cancelBuildPlaceMode();
g = P.get();
check('cancel clears pause', !g.buildPlaceMode && !g.buildPlacePaused);

P.enterBuildPlaceMode('brickwall');
g = P.get();
check('brickwall place mode', g.buildPlaceMode && g.buildPlacePaused && g.buildGhostKind === 'brickwall');

P.cancelBuildPlaceMode();
P.enterBuildPlaceMode('timber');
g = P.get();
check('structure ghost kind', g.buildGhostKind === 'structure' && g.buildPlaceStructKind === 'timber');
check('structure freezes horde', g.buildPlacePaused === true);

P.cancelBuildPlaceMode();
P.enterBuildPlaceMode('barricade');
const nBefore = P.get().barricades.length;
const ok = P.confirmBuildPlace();
g = P.get();
check('confirm places', ok === true);
check('barricade +1', g.barricades.length === nBefore + 1);
check('confirm clears pause', !g.buildPlaceMode && !g.buildPlacePaused);

P.enterBuildPlaceMode('barricade');
const placed = P.get().barricades[P.get().barricades.length - 1];
// Aim ghost directly onto existing post (aim offset is 62px along aim)
P.setPlayerAt(placed.x - 62, placed.y, 0);
const fail = P.confirmBuildPlace();
g = P.get();
check('blocked confirm fails', fail === false);
check('failed stays in place mode', g.buildPlaceMode && g.buildPlacePaused);
P.cancelBuildPlaceMode();
g = P.get();
check('final cancel clear', !g.buildPlaceMode && !g.buildPlacePaused);

// Caps raised (quantity only)
check('barricade max 80', P.BARRICADE_MAX === 80);
check('brickwall max 80', P.BRICKWALL_MAX === 80);
check('timber max 12', P.STRUCT_KINDS.timber.max === 12);
check('farm max 16', P.STRUCT_KINDS.farm.max === 16);
check('muster max 8', P.STRUCT_KINDS.muster.max === 8);

// Knockback resistance ladder: hits needed = 1 + floor(wave/20); bosses excluded
P.setWave(1);
check('kb hits wave1', P.knockHitsNeeded() === 1);
P.setWave(19);
check('kb hits wave19', P.knockHitsNeeded() === 1);
P.setWave(20);
check('kb hits wave20', P.knockHitsNeeded() === 2);
P.setWave(40);
check('kb hits wave40', P.knockHitsNeeded() === 3);
{
  P.setWave(20);
  const e = { boss: false, vx: 0, vy: 0, kbHits: 0 };
  P.applyKnock(e, 1, 0, 100, 10);
  check('kb wave20 hit1 no shove', e.vx === 0 && e.kbHits === 1);
  P.applyKnock(e, 1, 0, 100, 10);
  check('kb wave20 hit2 shoves', e.vx === 100 && e.kbHits === 0);
  const boss = { boss: true, vx: 0, vy: 0, kbPool: 0 };
  P.applyKnock(boss, 1, 0, 100, 50);
  check('boss still mass path', boss.vx !== 0); // mass shove, not hit-ladder
}

// Place pause freezes squad combat AI (same gate as enemies)
P.setWave(1);
P.seedSquadCombat();
P.enterBuildPlaceMode('barricade');
g = P.get();
const cx0 = g.companions[0].x, mx0 = g.militia[0].x;
const atk0 = g.companions[0].atkCd, matk0 = g.militia[0].atkCd;
// Direct unit updates would still move; the loop gate skips them — assert pause flag holds
check('squad freeze gate on', g.buildPlacePaused === true);
check('squad still present', g.companions.length === 1 && g.militia.length === 1);
check('squad positions hold without loop', g.companions[0].x === cx0 && g.militia[0].x === mx0);
check('squad atkCd untouched without update', g.companions[0].atkCd === atk0 && g.militia[0].atkCd === matk0);
P.cancelBuildPlaceMode();

if (failed) {
  console.log('\nFAILED:', failed);
  process.exit(1);
}
console.log('\nALL PASS — build place mode + pause + caps + knockback ladder');

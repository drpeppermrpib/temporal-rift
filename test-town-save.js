// Town/RTS save-restore smoke test (no browser).
// Run: node test-town-save.js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const gameSrc = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8') + `
;globalThis.__trProbe = {
  newGame, saveGame, loadGame, snapshot, applyTownSave, applyFogSave, applyHoldSave,
  revealFogAt, isFogChunkDiscovered, isHoldVisible, npcHolds, HOLD_TEMPLATES,
  getFogDiscoveryMode, applyFogDiscoveryMode, resolveFogDiscoveryModeFromSave,
  FOG_DISCOVERY_DEFAULT, FOG_DISCOVERY_MODES,
  setFogSettingsMode(mode) {
    settings.fogDiscoveryMode = FOG_DISCOVERY_MODES.includes(mode) ? mode : FOG_DISCOVERY_DEFAULT;
    applyFogDiscoveryMode(settings.fogDiscoveryMode);
  },
  holdLaborers, holdUnits, HOLD_AUTONOMY_ENABLED, HOLD_LABORER_PER_HOLD,
  HOLD_STRUCTURE_KINDS, HOLD_VILLAGE_BUILD_ORDER, seedHoldVillageQueue,
  completeHoldStructure, tryStartHoldVillageBuild, pickHoldStructureSlot,
  HOLD_CAPTAIN_ENABLED, HOLD_CAPTAIN_BUILD_ORDER, spawnHoldCaptain,
  seedHoldCaptainQueue, holdCoreVillageDone, recomputeHoldCaptainLevel,
  HOLD_JOIN_WAVE_NEAR, HOLD_JOIN_WAVE_FAR, holdCanJoin, holdJoinWave,
  fogChunksX, fogChunksY, fogDiscovered,
  FOG_DISCOVERY_ENABLED, FOG_CHUNK_SIZE, LEGACY_WORLD, inLegacyWorld, player,
  get() {
    return {
      structures, laborers, squadLaborers, militia, barricades, brickWalls,
      wood, gold, waveTrainLeft, goldMines, wave, waveActive,
      squadSp, squadCores, squadWood, squadGold, squad,
      colossus, colossusOwned, colossusDockHp, cores,
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
    if (typeof spawnSquadLaborer === 'function') {
      spawnSquadLaborer(920, 940);
      squadLaborers[0].order = 'chop';
    }
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
    squadSp = 12; squadCores = 4; squadWood = 9; squadGold = 3;
    if (goldMines[0]) goldMines[0].goldLeft = 12;
    colossusOwned = true;
    colossusDockHp = 900;
    colossus = makeColossusEntity(1200, 1100, 900, false, 1);
    cores = 140;
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
check('squad wallets in save', raw.squad && raw.squad.sp === 12 && raw.squad.cores === 4);
check('squad wood/gold in save', raw.squad.wood === 9 && raw.squad.gold === 3);
check('squad laborers in town', Array.isArray(raw.town.squadLaborers) && raw.town.squadLaborers.length === 1 && raw.town.squadLaborers[0].order === 'chop');

check('loadGame ok', P.loadGame() === true);
st = P.get();
check('structures restored', st.structures.some(s => s.kind === 'muster' && s.lvl === 2));
check('militia restored', st.militia.length === 1 && st.militia[0].sk.dmg === 2 && st.militia[0].x === 1100);
check('laborer restored', st.laborers[0].order === 'mine' && st.laborers[0].x === 900);
check('squad laborer restored', st.squadLaborers.length === 1 && st.squadLaborers[0].squadSide && st.squadLaborers[0].order === 'chop');
check('barricades restored', st.barricades.length === 1 && st.barricades[0].x === 800);
check('brickWalls restored', st.brickWalls.length === 2 && st.brickWalls[0].x === 700);
check('brickWalls linked', st.brickWalls.some(w => (w.neighbors || 0) >= 1));
check('resources restored', st.wood === 77 && st.gold === 55);
check('squad wallets restored', st.squadSp === 12 && st.squadCores === 4);
check('squad wood/gold restored', st.squadWood === 9 && st.squadGold === 3);
check('waveTrainLeft restored', st.waveTrainLeft === 1);
check('gold mine stock restored', !st.goldMines[0] || st.goldMines[0].goldLeft === 12);
check('colossus owned in save', raw.town.colossus && raw.town.colossus.owned === true && raw.town.colossus.docked === false);
check('colossus hp in save', raw.town.colossus.hp === 900);
check('colossus restored out', st.colossusOwned && st.colossus && !st.colossus.downed && st.colossus.x === 1200 && st.colossus.hp === 900);

const old = JSON.parse(store.tr_save1);
delete old.town;
if (old.squad) { delete old.squad.sp; delete old.squad.cores; delete old.squad.wood; delete old.squad.gold; }
store.tr_save1 = JSON.stringify(old);
check('old save still loads', P.loadGame() === true);
st = P.get();
check('old save keeps starter keep', st.structures.some(s => s.kind === 'keep'));
check('old save squad wallets default 0', st.squadSp === 0 && st.squadCores === 0 && st.squadWood === 0 && st.squadGold === 0);
check('old save colossus unowned', st.colossusOwned === false && !st.colossus);
check('companion squad keys untouched', !!P.snapshot().squad);

// Step 6.3/6.7 — exterior fog save/restore + Version A/B modes
if (P.FOG_DISCOVERY_ENABLED) {
  P.applyFogDiscoveryMode('legacy-core-visible');
  P.newGame();
  const extX = P.LEGACY_WORLD.w + 400, extY = P.LEGACY_WORLD.h + 400;
  const cx = Math.floor(extX / P.FOG_CHUNK_SIZE), cy = Math.floor(extY / P.FOG_CHUNK_SIZE);
  const legacyCx = Math.floor((P.LEGACY_WORLD.w * 0.5) / P.FOG_CHUNK_SIZE);
  const legacyCy = Math.floor((P.LEGACY_WORLD.h * 0.5) / P.FOG_CHUNK_SIZE);
  check('default fog mode is Version B', P.getFogDiscoveryMode() === 'legacy-core-visible');
  check('exterior chunk starts fogged', !P.isFogChunkDiscovered(cx, cy));
  check('legacy chunk never fogged in B', P.isFogChunkDiscovered(legacyCx, legacyCy));
  P.revealFogAt(extX, extY, 260);
  check('revealFogAt marks chunk', P.isFogChunkDiscovered(cx, cy));
  P.saveGame(false);
  const fogRaw = JSON.parse(store.tr_save1);
  check('world.discovered in save', Array.isArray(fogRaw.world.discovered) && fogRaw.world.discovered.length > 0);
  check('world.fogMode saved', fogRaw.world.fogMode === 'legacy-core-visible');
  P.newGame();
  check('newGame resets exterior fog', !P.isFogChunkDiscovered(cx, cy));
  check('loadGame restores fog', P.loadGame() === true && P.isFogChunkDiscovered(cx, cy));
  check('loadGame restores fog mode from save', P.getFogDiscoveryMode() === 'legacy-core-visible');

  // Version A — full-black: legacy also fogged until visited
  P.setFogSettingsMode('full-black');
  P.newGame();
  const farLegacyCx = Math.floor((P.LEGACY_WORLD.x + 200) / P.FOG_CHUNK_SIZE);
  const farLegacyCy = Math.floor((P.LEGACY_WORLD.y + 200) / P.FOG_CHUNK_SIZE);
  check('full-black fogged far legacy chunk', !P.isFogChunkDiscovered(farLegacyCx, farLegacyCy));
  P.revealFogAt(P.LEGACY_WORLD.x + 200, P.LEGACY_WORLD.y + 200, 260);
  check('full-black reveal marks legacy chunk', P.isFogChunkDiscovered(farLegacyCx, farLegacyCy));
  P.saveGame(false);
  const fogRawA = JSON.parse(store.tr_save1);
  check('full-black fogMode saved', fogRawA.world.fogMode === 'full-black');
  P.setFogSettingsMode('legacy-core-visible');
  P.newGame();
  check('load prefers save fogMode over settings', P.loadGame() === true && P.getFogDiscoveryMode() === 'full-black');
  check('discovered mask survives mode reload', P.isFogChunkDiscovered(farLegacyCx, farLegacyCy));

  // Toggle mid-session must not corrupt discovered mask
  P.setFogSettingsMode('legacy-core-visible');
  P.newGame();
  P.revealFogAt(extX, extY, 260);
  check('pre-toggle exterior revealed', P.isFogChunkDiscovered(cx, cy));
  P.applyFogDiscoveryMode('full-black');
  check('toggle to A keeps discovered mask', P.isFogChunkDiscovered(cx, cy));
  P.applyFogDiscoveryMode('legacy-core-visible');
  check('toggle back to B keeps discovered mask', P.isFogChunkDiscovered(cx, cy));
}

// Step 6.4 — exterior NPC holds save + fog visibility
if (P.FOG_DISCOVERY_ENABLED && P.HOLD_TEMPLATES && P.HOLD_TEMPLATES.length) {
  P.newGame();
  check('npc holds seeded', P.npcHolds.length === P.HOLD_TEMPLATES.length);
  const hold = P.npcHolds[0];
  const hcx = Math.floor(hold.x / P.FOG_CHUNK_SIZE);
  const hcy = Math.floor(hold.y / P.FOG_CHUNK_SIZE);
  check('hold hidden before fog reveal', !P.isHoldVisible(hold));
  P.revealFogAt(hold.x, hold.y, 260);
  check('hold visible after fog reveal', P.isHoldVisible(hold));
  hold.visited = true;
  P.saveGame(false);
  const holdRaw = JSON.parse(store.tr_save1);
  check('world.holds in save', Array.isArray(holdRaw.world.holds) && holdRaw.world.holds.length === P.HOLD_TEMPLATES.length);
  check('hold visited saved', holdRaw.world.holds.some(h => h.id === hold.id && h.visited === true));
  P.newGame();
  check('newGame resets hold visited', !P.npcHolds[0].visited);
  check('loadGame restores hold visited', P.loadGame() === true && P.npcHolds.find(h => h.id === hold.id).visited === true);
}

// Step 6.5 — hold builders + orange autonomy save
if (P.HOLD_AUTONOMY_ENABLED && P.HOLD_TEMPLATES && P.HOLD_TEMPLATES.length) {
  P.newGame();
  check('hold builder per hold', P.holdLaborers.length === P.HOLD_TEMPLATES.length * P.HOLD_LABORER_PER_HOLD);
  check('hold units seeded', P.holdUnits.length >= P.HOLD_TEMPLATES.length);
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 260);
  hold.orangeSp = 7;
  hold.recruited = true;
  const bl = P.holdLaborers.find(L => L.holdId === hold.id);
  if (bl) { bl.x = 1234; bl.y = 5678; }
  P.saveGame(false);
  const raw65 = JSON.parse(store.tr_save1);
  const hs = raw65.world.holds.find(h => h.id === hold.id);
  check('hold orangeSp saved', hs && hs.orangeSp === 7);
  check('hold recruited saved', hs && hs.recruited === true);
  check('hold laborers in save', hs && Array.isArray(hs.laborers) && hs.laborers.length === 1);
  check('hold laborer pos saved', hs.laborers[0].x === 1234);
  P.newGame();
  check('loadGame restores hold autonomy', P.loadGame() === true);
  const h2 = P.npcHolds.find(h => h.id === hold.id);
  check('hold orangeSp restored', h2.orangeSp === 7);
  check('hold builder restored', P.holdLaborers.some(L => L.holdId === hold.id && L.x === 1234));
}

// Step 6.6 — hold village build queue + structures save
if (P.HOLD_AUTONOMY_ENABLED && P.HOLD_TEMPLATES && P.HOLD_TEMPLATES.length) {
  P.newGame();
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 260);
  hold.gauntletDone = true;
  hold.orangeSp = 20;
  P.seedHoldVillageQueue(hold);
  check('village queue seeded after gauntlet', hold.buildQueue.length === P.HOLD_VILLAGE_BUILD_ORDER.length);
  check('queue order hut→timber→brickpad',
    hold.buildQueue[0].kind === 'hut' &&
    hold.buildQueue[1].kind === 'timber' &&
    hold.buildQueue[2].kind === 'brickpad');
  const hutSlot = P.pickHoldStructureSlot(hold, 'hut');
  check('hut slot found', !!hutSlot);
  const bl = P.holdLaborers.find(L => L.holdId === hold.id);
  check('builder exists', !!bl);
  const started = bl ? P.tryStartHoldVillageBuild(hold, bl) : false;
  check('builder starts hut build', started === true,
    `q=${hold.buildQueue.length} sp=${hold.orangeSp} ab=${!!hold.activeBuild}`);
  check('orangeSp deducted for hut', hold.orangeSp === 20 - P.HOLD_STRUCTURE_KINDS.hut.orangeSp);
  check('activeBuild is hut', hold.activeBuild && hold.activeBuild.kind === 'hut');
  hold.activeBuild.progress = hold.activeBuild.buildSec;
  P.completeHoldStructure(hold);
  check('hut completes into structures', hold.structures.length === 1 && hold.structures[0].kind === 'hut');
  check('activeBuild cleared', !hold.activeBuild);
  hold.structures.push({ id: 't1', kind: 'timber', x: hold.x + 40, y: hold.y, r: 24, hp: 120, maxHp: 120 });
  hold.structures.push({ id: 'b1', kind: 'brickpad', x: hold.x - 40, y: hold.y, r: 32, hp: 200, maxHp: 200 });
  P.saveGame(false);
  const raw66 = JSON.parse(store.tr_save1);
  const hs66 = raw66.world.holds.find(h => h.id === hold.id);
  check('buildQueue in save', hs66 && Array.isArray(hs66.buildQueue));
  check('structures in save', hs66 && hs66.structures.length === 3);
  check('villageSeeded in save', hs66 && hs66.villageSeeded === true);
  P.newGame();
  check('loadGame restores village state', P.loadGame() === true);
  const h3 = P.npcHolds.find(h => h.id === hold.id);
  check('structures restored', h3.structures.length === 3);
  check('villageSeeded restored', h3.villageSeeded === true);
}

// Step 7.3 — hold captain spawn / growth queue / save
if (P.HOLD_CAPTAIN_ENABLED && P.HOLD_TEMPLATES && P.HOLD_TEMPLATES.length) {
  P.newGame();
  check('HOLD_CAPTAIN_ENABLED on', P.HOLD_CAPTAIN_ENABLED === true);
  check('join wave near 8', P.HOLD_JOIN_WAVE_NEAR === 8);
  check('join wave far 10', P.HOLD_JOIN_WAVE_FAR === 10);
  // 4.3.2 — was "4 stages": stale since Step 8.4 (4.1.8) inserted 'bikeshed' at index 1
  // (test-continuous-map.js asserts the full 5-stage order). Failed on stock 4.3.1 too —
  // verified against the pre-10.1 www/game.js. Intent: watchpost first, stakewall last.
  check('captain build order 5 stages', P.HOLD_CAPTAIN_BUILD_ORDER.length === 5 &&
    P.HOLD_CAPTAIN_BUILD_ORDER[0] === 'watchpost' &&
    P.HOLD_CAPTAIN_BUILD_ORDER[4] === 'stakewall');
  check('core village order still 3', P.HOLD_VILLAGE_BUILD_ORDER.length === 3);
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 260);
  hold.gauntletDone = true;
  P.spawnHoldCaptain(hold);
  check('captain seeds after gauntlet', !!hold.captain && hold.captainLevel >= 1);
  check('join gate still wave-gated', P.holdCanJoin(hold) === false || P.holdJoinWave(hold) >= 8);
  // Force core village complete → captain growth queue
  for (const kind of P.HOLD_VILLAGE_BUILD_ORDER) {
    const def = P.HOLD_STRUCTURE_KINDS[kind];
    hold.structures.push({
      id: 'c_' + kind, kind, x: hold.x, y: hold.y, r: def.r, hp: def.hp, maxHp: def.hp,
    });
  }
  check('core village done', P.holdCoreVillageDone(hold) === true);
  P.seedHoldCaptainQueue(hold);
  check('captain queue seeded', hold.buildQueue.some(q => q.kind === 'watchpost'));
  hold.orangeSp = 40;
  hold.captainLevel = 3;
  hold.growthStage = 1;
  hold.learnGauntletDone = true;
  hold.captain.x = 2222; hold.captain.y = 3333; hold.captain.xp = 4;
  P.recomputeHoldCaptainLevel(hold);
  P.saveGame(false);
  const raw73 = JSON.parse(store.tr_save1);
  const hs73 = raw73.world.holds.find(h => h.id === hold.id);
  check('captain in save', hs73 && hs73.captain && hs73.captain.x === 2222);
  check('captainLevel in save', hs73 && hs73.captainLevel >= 1);
  check('growthStage in save', hs73 && typeof hs73.growthStage === 'number');
  P.newGame();
  check('load restores captain', P.loadGame() === true);
  const h4 = P.npcHolds.find(h => h.id === hold.id);
  check('captain restored', !!(h4.captain && h4.captain.x === 2222));
  check('captainLevel restored', (h4.captainLevel | 0) >= 1);
  check('learnGauntletDone restored', h4.learnGauntletDone === true);
}

console.log(failed ? `\n${failed} FAIL` : '\nALL PASS');
process.exit(failed ? 1 : 0);

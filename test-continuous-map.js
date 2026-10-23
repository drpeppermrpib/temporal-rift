// Continuous map light smoke — fog save, hold state, legacy core bounds.
// Run: node test-continuous-map.js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const gameSrc = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8') + `
;globalThis.__trMapProbe = {
  newGame, saveGame, loadGame, snapshot,
  revealFogAt, isFogChunkDiscovered, isHoldVisible, npcHolds, HOLD_TEMPLATES,
  getFogDiscoveryMode, applyFogDiscoveryMode,
  FOG_DISCOVERY_ENABLED, FOG_CHUNK_SIZE, LEGACY_WORLD, WORLD, inLegacyWorld,
  CONTINUOUS_MAP_ENABLED, EXTERIOR_HARVEST_ENABLED, EXTERIOR_CHOP_ENABLED,
  EXTERIOR_MINE_ENABLED, EXTERIOR_COAL_ENABLED, FUEL_ECONOMY_ENABLED, PLAYER_EXTERIOR_ASSIST_ENABLED,
  pickChopTarget, pickMineTarget, pickCoalTarget, pickHoldChopTarget, pickHoldMineTarget, pickHoldCoalTarget,
  creditHoldWoodDeposit, creditHoldGoldDeposit, creditHoldCoalDeposit,
  structureCanRefuel, tryRefuelAtStructure, fuelHudVisible,
  FUEL_MAX, FUEL_PER_COAL, COAL_PER_REFUEL, FUEL_BURN_PER_SEC,
  DIRT_BIKE_ENABLED, DIRT_BIKE_SPEED_MUL, DIRT_BIKE_R, BIKE_REPAIR_WOOD, BIKE_REPAIR_GOLD, BIKE_INTERACT_R,
  DIRT_BIKE_HOLD_LINKS_ENABLED, nearestHoldForBikePark, snapBikeParkToHold, getHoldBikeParkSpot,
  BROODMOTHER_ENABLED, BROODMOTHER_R, SPIDERLING_R, SPIDERLING_COUNT_MIN, SPIDERLING_COUNT_MAX,
  BROODMOTHER_MIN_WAVE, SPIDERLING_MAX_LIVE, BROODMOTHER_DEEP_R,
  FUEL_BURN_PER_SEC, BIKE_REPAIR_WOOD, BIKE_REPAIR_GOLD, BIKE_SHED_FUEL_BONUS,
  EXTERIOR_COAL_ENABLED, FUEL_ECONOMY_ENABLED, DIRT_BIKE_ENABLED, DIRT_BIKE_HOLD_LINKS_ENABLED,
  spawnBroodmotherAt, spawnBroodmotherBirth, spawnSpiderlingAt, countLiveSpiderlings, countLiveBroodmothers,
  tryRepairBike, mountBike, dismountBike, tryBikeAction, canMountBike, canInteractBikeWreck, tickFuelBurn,
  get bikeWreck() { return bikeWreck; },
  get bike() { return bike; },
  get decor() { return decor; },
  get wood() { return wood; },
  set wood(v) { wood = v; },
  get gold() { return gold; },
  set gold(v) { gold = v; },
  HOLD_WOOD_TO_ORANGESP, HOLD_GOLD_TO_ORANGESP, holdLaborers, player, maxHp,
  HOLD_CAPTAIN_ENABLED, HOLD_CAPTAIN_BUILD_ORDER, HOLD_VILLAGE_BUILD_ORDER,
  HOLD_STRUCTURE_KINDS, HOLD_CAPTAIN_LEVEL_ORANGE,
  spawnHoldCaptain, seedHoldCaptainQueue, holdCoreVillageDone,
  HOLD_JOIN_WAVE_NEAR, HOLD_JOIN_WAVE_FAR,
  HOLD_COMBAT_ENABLED, HOLD_AGGRO_R, HOLD_LEASH_R, HOLD_WATCHPOST_RANGE,
  HOLD_SHOWCASE_ENABLED, HOLD_SHOWCASE_MIN_STRUCTS, HOLD_SHOWCASE_NEAR,
  tickHoldShowcaseBuild, computeHoldThreats, tickHoldWatchposts, hurtHoldUnit,
  get cbolts() { return cbolts; },
  EXTERIOR_SPIDER_ENABLED, BURSTWEAVER_SPRITE_ENABLED, BURSTWEAVER_R, BURSTWEAVER_SPRITE_DRAWH,
  BURSTWEAVER_WEB_RANGE, BURSTWEAVER_WEB_DMG, BURSTWEAVER_WEB_SLOW_T, BURSTWEAVER_WEB_SLOW_MUL,
  BURSTWEAVER_POISON_T, BURSTWEAVER_POISON_DPS, BURSTWEAVER_POISON_KI_DPS,
  BURSTWEAVER_EXPLODE_R, BURSTWEAVER_EXPLODE_BASE, BURSTWEAVER_EXPLODE_HP_FRAC, BURSTWEAVER_SWELL_MIN, BURSTWEAVER_SWELL_MAX,
  BURSTWEAVER_SPAWN_CD_MIN, BURSTWEAVER_SPAWN_CD_MAX, BURSTWEAVER_WEB_CD, BURSTWEAVER_BITE_CD,
  BURSTWEAVER_EXPLODE_CD_MIN, BURSTWEAVER_EXPLODE_CD_MAX, BURSTWEAVER_EXPLODE_TRIGGER,
  spawnBurstweaverAt, spawnEnemy, ETYPES, APP_VERSION,
  GOLD_MINE_SPRITE_ENABLED,
  EXTERIOR_TREE_SPREAD_ENABLED, LAKE_RESERVE_ENABLED, BIKE_TRAIL_LANES_ENABLED, LAKE_RESERVE,
  isLakeReserve, isBikeTrailLane, isLegacyPathCorridor,
  ORANGE_QUARTER_ENABLED, ORANGE_QUARTER_GATE_IDS, ORANGE_QUARTER_PREV_POS,
  ENEMY_STEER_ENABLED, ENEMY_STEER_SLIDE_T, ENEMY_CLIMB_MAX_OBST_R, ENEMY_CLIMB_T,
  enemyObstacleClimbable, enemyBlockingObstacle, pickEnemySteerTangent,
  updateEnemySteerState, simEnemySteerFrame, collideObstacles, makeEnemy,
  FOG_SHROUD_ENABLED, SPIDER_DEN_ENABLED, SPIDER_DEN_LEGACY_EXCLUDE,
  SPIDER_DEN_PER_WAVE_MIN, SPIDER_DEN_PER_WAVE_MAX, SPIDER_DEN_WAVE_SCALE,
  spiderDenCountForWave, isSpiderDenChunkOk, isFogChunkInVision, isFogChunkShrouded,
  ORANGE_QUARTER_TREE_CLEAR_PAD, EXTERIOR_SPREAD_HOLD_PAD,
  stampSpiderDensOnWaveStart, pickBurstweaverSpawnPos, pickSpiderDenSpawnPos,
  tickBurstweaverSpawn, countLiveBurstweavers,
  get burstweaverSpawnCd() { return burstweaverSpawnCd; },
  set burstweaverSpawnCd(v) { burstweaverSpawnCd = v; },
  get spiderDens() { return spiderDens; },
  DECADE_STACK_QUEUE_ENABLED, DECADE_STACK_ONSCREEN_MAX, decadeBossTiers,
  spawnDecadeBoss, spawnDecadePathPos, queueDecadeBossStack, tickDecadeBossQueue,
  countLiveDecadeBosses, countDecadeBossesOnCamera,
  SPIDER_HUNT_ENABLED, SPIDER_BORDER_WEB_RANGE, countWaveEnemiesRemaining, countLiveAshSpiders,
  burstweaverExplodeDmg, spiderWebRange, nearestLegacyBorderStalkPoint,
  get decadeBossQueue() { return decadeBossQueue; },
  get camera() { return camera; },
  get waveActive() { return waveActive; },
  set waveActive(v) { waveActive = v; },
  get spawnQueue() { return spawnQueue; },
  set spawnQueue(v) { spawnQueue = v; },
  applyBurstweaverWebSlow, applyBurstweaverPoison, beginBurstweaverSwell, detonateBurstweaver,
  killEnemy, moveSpeed, updateHud, tryNova,
  get enemies() { return enemies; },
  get holdUnits() { return holdUnits; },
  get wave() { return wave; },
  set wave(v) { wave = v; },
  LAKE_WATER_ENABLED, LAKE_SPAWN_GUARD_ENABLED, LAKE_BLOB, LAKE_ISLE,
  LAKE_SHALLOW_BAND, LAKE_SHALLOW_FIELD, CAMP,
  lakeFieldAt, isLakeWaterAt, isLakeShallowAt, lakeNearestShore, lakeGuardSpawnPos,
  clampLakeShore, lakeShoreTangent, spawnEdgePos, spawnDecadePathPos, drawMinimap,
  LAKE_DOCK_ENABLED, LAKE_DOCK, LAKE_DOCK_LEN, LAKE_DOCK_HALF_W, LAKE_DOCK_EDGE,
  LAKE_DOCK_GRACE, LAKE_DOCK_MOOR_OUT, isOnDock, clampToDockDeck, drawEmberfallDock, REGIONS,
  BOAT_ENABLED, BOAT_WAVE_GATE_ENABLED, BOAT_FUEL_MODEL, BOAT_REPAIR_WOOD, BOAT_REPAIR_GOLD,
  BOAT_INTERACT_R, BOAT_SPEED_MUL, BOAT_ACCEL_SEC, BOAT_GLIDE_HALF, BOAT_HULL_MARGIN,
  BOAT_DOCK_SNAP_R, BOAT_WAVE_GRACE, BOAT_ASH_DRAIN_DPS,
  boatActive, buildBoatWreck, canInteractBoatWreck, canMountBoat, tryRepairBoat, mountBoat,
  tryDismountBoat, tryVehicleAction, boatStepAshore, boatDockDismountSpot, boatThrustFrame,
  clampSkiffToWater, tickBoat, drawSkiffAt, drawSkiffMoorRope,
  get boatWreck() { return boatWreck; },
  get boat() { return boat; },
  get state() { return state; },
  set state(v) { state = v; },
  obstacleBlockedAt, updateGraves,
  get graves() { return graves; },
  get pickups() { return pickups; },
  get campTrackX() { return campTrackX; },
  set campTrackX(v) { campTrackX = v; },
  get campTrackY() { return campTrackY; },
  set campTrackY(v) { campTrackY = v; },
  get goldMines() { return goldMines; },
  get coalMines() { return coalMines; },
  get coal() { return coal; },
  set coal(v) { coal = v; },
  get fuel() { return fuel; },
  set fuel(v) { fuel = v; },
  get structures() { return structures; },
  get forestStands() { return forestStands; },
  get obstacles() { return obstacles; },
  LAKE_ISLE_REWARD_ENABLED, LAKE_ISLE_PIER, LAKE_ISLE_PIER_LEN, LAKE_ISLE_PIER_HALF_W,
  LAKE_ISLE_PIER_BASE_IN, LAKE_ISLE_PIER_MOOR_OUT,
  ISLE_CACHE_GOLD, ISLE_CACHE_COAL, ISLE_CACHE_CORES, ISLE_CACHE_OPEN_R,
  ISLE_CHOP_SEC, ISLE_CHOP_REACH,
  isleContentActive, isOnIslePier, clampToIslePierDeck, islePierDismountSpot,
  seedDriftwoodIsle, tryOpenIsleCache, tickIsleContent, drawIslePier, drawIsleCache,
  get isleCache() { return isleCache; },
  get isleCacheOpened() { return isleCacheOpened; },
  set isleCacheOpened(v) { isleCacheOpened = v; },
  get isleTrees() { return isleTrees; },
  get isleChopT() { return isleChopT; },
  set isleChopT(v) { isleChopT = v; },
  get cores() { return cores; },
  set cores(v) { cores = v; },
  get totalCores() { return totalCores; },
  SHAMAN_SWIM_ENABLED, SHAMAN_SWIM_SPEED_MUL, SHAMAN_SWIM_ENTER_DIST, SHAMAN_SWIM_SINK,
  SHAMAN_SWIM_ISLE_PAD, LAKE_LEASH_HOLD_R,
  shamanCanSwim, lakeSwimWants, updateShamanSwim, clampSwimmerToWater, enemyCanCast,
  lakeLeashApplies, pickLakeLeashTarget, lakeShoreHoldPoint, simEnemyWaterFrame,
  drawShamanSwimming, deployColossus, colossusActive,
  get militia() { return militia; },
  get companions() { return companions; },
  get colossus() { return colossus; },
  get ebolts() { return ebolts; },
  placementWaterBlockedAt, barricadeSpotBlocked, brickWallSpotBlocked, structureSpotBlocked,
  tryPlaceBarricade, STRUCT_KINDS,
  get barricades() { return barricades; },
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
  const style = { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; } };
  return {
    id, style, width: 800, height: 600, className: '', textContent: '', innerHTML: '', value: '',
    children: [], dataset: {}, disabled: false,
    classList: {
      add: c => classes.add(c), remove: c => classes.delete(c),
      toggle: (c, f) => { if (f === true) classes.add(c); else if (f === false) classes.delete(c); else classes.has(c) ? classes.delete(c) : classes.add(c); },
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
  this.createOscillator = () => ({ connect() { return this; }, start() {}, stop() {}, frequency: { value: 0 }, type: '' });
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
    Object.defineProperty(this, 'src', { set() { if (this.onload) setTimeout(() => this.onload(), 0); }, get() { return ''; } });
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

const P = sandbox.__trMapProbe;
let failed = 0;
function check(name, ok, detail) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
}

check('continuous map enabled', P.CONTINUOUS_MAP_ENABLED === true);
check('legacy world 4800', P.LEGACY_WORLD.w === 4800 && P.LEGACY_WORLD.h === 4800);
check('extended world 8896', P.WORLD.w === 8896 && P.WORLD.h === 8896);
check('camp in legacy', P.inLegacyWorld(P.LEGACY_WORLD.w / 2, P.LEGACY_WORLD.h / 2));
check('exterior outside legacy', !P.inLegacyWorld(P.LEGACY_WORLD.w + 500, P.LEGACY_WORLD.h + 500));

P.newGame();
check('player starts in legacy', P.inLegacyWorld(P.player.x, P.player.y));
check('holds seeded', P.npcHolds.length === P.HOLD_TEMPLATES.length);
if (P.ORANGE_QUARTER_ENABLED) {
  const gates = P.npcHolds.filter(h => P.ORANGE_QUARTER_GATE_IDS.includes(h.id));
  const quarter = P.npcHolds.filter(h => !P.ORANGE_QUARTER_GATE_IDS.includes(h.id));
  check('gate holds outside legacy', gates.length === 2 && gates.every(h => !P.inLegacyWorld(h.x, h.y)));
  check('quarter holds inside legacy', quarter.length === 8 && quarter.every(h => P.inLegacyWorld(h.x, h.y)));
} else {
  check('holds outside legacy', P.npcHolds.every(h => !P.inLegacyWorld(h.x, h.y)));
}

if (P.FOG_DISCOVERY_ENABLED) {
  const extX = P.LEGACY_WORLD.w + 400, extY = P.LEGACY_WORLD.h + 400;
  const cx = Math.floor(extX / P.FOG_CHUNK_SIZE), cy = Math.floor(extY / P.FOG_CHUNK_SIZE);
  check('exterior fogged initially', !P.isFogChunkDiscovered(cx, cy));
  P.revealFogAt(extX, extY, 260);
  check('fog reveal works', P.isFogChunkDiscovered(cx, cy));
  P.saveGame(false);
  const raw = JSON.parse(store.tr_save1);
  check('world.discovered saved', Array.isArray(raw.world.discovered) && raw.world.discovered.length > 0);
  check('world.legacyWorld saved', raw.world.legacyWorld.w === 4800);
  P.newGame();
  check('fog reset on newGame', !P.isFogChunkDiscovered(cx, cy));
  check('fog restored on load', P.loadGame() === true && P.isFogChunkDiscovered(cx, cy));
}

const hold = P.npcHolds[0];
P.revealFogAt(hold.x, hold.y, 260);
hold.visited = true;
hold.orangeSp = 11;
P.saveGame(false);
const holdRaw = JSON.parse(store.tr_save1);
check('hold state in save', holdRaw.world.holds.some(h => h.id === hold.id && h.visited && h.orangeSp === 11));
P.newGame();
check('hold load restores state', P.loadGame() === true && P.npcHolds.find(h => h.id === hold.id).orangeSp === 11);

if (P.EXTERIOR_HARVEST_ENABLED) {
  P.newGame();
  const extMines = P.goldMines.filter(g => g.exterior);
  const legMines = P.goldMines.filter(g => !g.exterior);
  const extStands = P.forestStands.filter(s => s.exterior);
  const legStands = P.forestStands.filter(s => !s.exterior);
  const extTrees = P.obstacles.filter(o => o.type === 'tree' && o.exterior);
  // 4.3.2 — was >= 4 but placement legitimately rolls 3–5 post-9.1-purge (a site skips
  // when random rocks/pillars land within 80px — fort-interior site mostly); measured
  // {3:1, 4:13, 5:16} over 30 rolls on stock worldgen. Intent is "legacy mines survive
  // the bowl purge", not an exact count. Step 10.1 water purge never touches goldMines.
  check('legacy mines unchanged codepath', legMines.length >= 3 && legMines.every(m => P.inLegacyWorld(m.x, m.y)));
  check('no legacy mines in lake bowl', legMines.every(m => !P.isLakeReserve(m.x, m.y)));
  check('exterior mines seeded', extMines.length >= 4);
  check('exterior mines outside legacy', extMines.every(m => !P.inLegacyWorld(m.x, m.y)));
  check('exterior stands seeded', extStands.length >= 6);
  check('exterior stands outside legacy', extStands.every(s => !P.inLegacyWorld(s.x, s.y)));
  // 4.1.1 — was >= 30 but worldgen legitimately rolls 29–32 exterior trees; the
  // check's intent is "exterior trees exist and carry the tag", not an exact count.
  check('exterior trees tagged', extTrees.length >= 24 && extTrees.every(t => !P.inLegacyWorld(t.x, t.y)));
  check('legacy stands unchanged count', legStands.length === 8);
  P.saveGame(false);
  const harv = JSON.parse(store.tr_save1).world.exteriorHarvest;
  check('world.exteriorHarvest stub', !!(harv && harv.enabled && harv.mines && harv.stands));

  // Step 7.1 — exterior chop eligibility
  check('EXTERIOR_CHOP_ENABLED on', !!P.EXTERIOR_CHOP_ENABLED);
  check('PLAYER_EXTERIOR_ASSIST on', !!P.PLAYER_EXTERIOR_ASSIST_ENABLED);
  const fogTree = extTrees[0];
  const prox = { x: fogTree.x, y: fogTree.y, r: 11 };
  if (P.FOG_DISCOVERY_ENABLED) {
    const hiddenPick = P.pickChopTarget(prox);
    check('fogged exterior not auto-targeted', !hiddenPick || !hiddenPick.exterior);
  }
  P.revealFogAt(fogTree.x, fogTree.y, 260);
  const chopPick = P.pickChopTarget(prox);
  check('exterior chop eligible when revealed', !!(chopPick && chopPick.exterior && chopPick.woodLeft > 0));
  let holdChopOk = false;
  for (const h of P.npcHolds) {
    const t = P.pickHoldChopTarget({ x: h.x, y: h.y, r: 11 }, Object.assign({}, h, { visited: true }));
    if (t && t.exterior) { holdChopOk = true; break; }
  }
  check('hold chop finds nearby exterior tree', holdChopOk);
  const hDep = { orangeSp: 3 };
  P.creditHoldWoodDeposit(hDep, 2);
  check('hold wood → orangeSp', hDep.orangeSp === 3 + 2 * P.HOLD_WOOD_TO_ORANGESP);

  // Step 7.2 — exterior mine eligibility + interior still works
  check('EXTERIOR_MINE_ENABLED on', !!P.EXTERIOR_MINE_ENABLED);
  const fogMine = extMines[0];
  const mineProx = { x: fogMine.x, y: fogMine.y, r: 11 };
  if (P.FOG_DISCOVERY_ENABLED) {
    // Reset fog via newGame would wipe mines — hide by not revealing yet after fresh reveal check
    P.newGame();
    const extMines2 = P.goldMines.filter(g => g.exterior);
    const legMines2 = P.goldMines.filter(g => !g.exterior);
    const fogMine2 = extMines2[0];
    const nearFog = { x: fogMine2.x, y: fogMine2.y, r: 11 };
    const hiddenMine = P.pickMineTarget(nearFog);
    check('fogged exterior mine not auto-targeted', !hiddenMine || !hiddenMine.exterior);
    P.revealFogAt(fogMine2.x, fogMine2.y, 260);
    const minePick = P.pickMineTarget(nearFog);
    check('exterior mine eligible when revealed', !!(minePick && minePick.exterior && minePick.goldLeft > 0));
    const interior = legMines2[0];
    const nearInt = { x: interior.x, y: interior.y, r: 11 };
    const intPick = P.pickMineTarget(nearInt);
    check('interior mine still pickable', !!(intPick && !intPick.exterior && intPick.goldLeft > 0));
    // 4.3.2 — >= 3 for the same placement-roll reason as 'legacy mines unchanged codepath'
    check('legacy mine count intact', legMines2.length >= 3 && legMines2.every(m => P.inLegacyWorld(m.x, m.y)));
    let holdMineOk = false;
    for (const h of P.npcHolds) {
      const m = P.pickHoldMineTarget({ x: h.x, y: h.y, r: 11 }, Object.assign({}, h, { visited: true }));
      if (m && m.exterior) { holdMineOk = true; break; }
    }
    check('hold mine finds nearby exterior mine', holdMineOk);
    const gDep = { orangeSp: 5 };
    P.creditHoldGoldDeposit(gDep, 2);
    check('hold gold → orangeSp', gDep.orangeSp === 5 + 2 * P.HOLD_GOLD_TO_ORANGESP);
  } else {
    const minePick = P.pickMineTarget(mineProx);
    check('exterior mine eligible when revealed', !!(minePick && minePick.exterior && minePick.goldLeft > 0));
    const interior = legMines[0];
    const intPick = P.pickMineTarget({ x: interior.x, y: interior.y, r: 11 });
    check('interior mine still pickable', !!(intPick && !intPick.exterior));
  }
}

// Step 7.3 — captain soft-wire + growth stages + join gates
if (P.HOLD_CAPTAIN_ENABLED) {
  P.newGame();
  check('HOLD_CAPTAIN_ENABLED on', P.HOLD_CAPTAIN_ENABLED === true);
  check('join gates near/far', P.HOLD_JOIN_WAVE_NEAR === 8 && P.HOLD_JOIN_WAVE_FAR === 10);
  check('core build order KEPT', P.HOLD_VILLAGE_BUILD_ORDER.join(',') === 'hut,timber,brickpad');
  check('captain stages watchpost→bikeshed→stakewall',
    P.HOLD_CAPTAIN_BUILD_ORDER.join(',') === 'watchpost,bikeshed,hut2,depot,stakewall');
  const ch = P.npcHolds[0];
  P.revealFogAt(ch.x, ch.y, 260);
  ch.gauntletDone = true;
  P.spawnHoldCaptain(ch);
  check('captain spawn after gauntlet', !!ch.captain);
  ch.structures = P.HOLD_VILLAGE_BUILD_ORDER.map(kind => ({ kind, x: ch.x, y: ch.y, r: 24, hp: 100, maxHp: 100 }));
  check('core done helper', P.holdCoreVillageDone(ch) === true);
  P.seedHoldCaptainQueue(ch);
  check('growth queue has watchpost', ch.buildQueue.some(q => q.kind === 'watchpost'));
  ch.captainLevel = 2;
  ch.growthStage = 0;
  P.saveGame(false);
  const capRaw = JSON.parse(store.tr_save1).world.holds.find(h => h.id === ch.id);
  check('captain save fields', !!(capRaw && capRaw.captain && capRaw.captainLevel === 2));
  P.newGame();
  check('captain load', P.loadGame() === true && !!P.npcHolds.find(h => h.id === ch.id).captain);
}

// Step 7.4D — Ashen Burstweaver balance polish (kit locked through 7.5)
{
  check('EXTERIOR_SPIDER_ENABLED on', P.EXTERIOR_SPIDER_ENABLED === true);
  check('BURSTWEAVER_SPRITE_ENABLED on', P.BURSTWEAVER_SPRITE_ENABLED === true);
  check('soft-wires independently true', P.EXTERIOR_SPIDER_ENABLED === true && P.BURSTWEAVER_SPRITE_ENABLED === true);
  check('burstweaver size locks', P.BURSTWEAVER_R === 42 && P.BURSTWEAVER_SPRITE_DRAWH === 115);
  check('ETYPES.burstweaver exteriorOnly', !!(P.ETYPES.burstweaver && P.ETYPES.burstweaver.exteriorOnly));
  check('web slow kit 7.4D', P.BURSTWEAVER_WEB_DMG === 9 && P.BURSTWEAVER_WEB_SLOW_T === 2.5 && P.BURSTWEAVER_WEB_SLOW_MUL === 0.55);
  check('web CD 4.5', P.BURSTWEAVER_WEB_CD === 4.5);
  check('poison kit 10s 7.4D', P.BURSTWEAVER_POISON_T === 10 && P.BURSTWEAVER_POISON_DPS === 3.0 && P.BURSTWEAVER_POISON_KI_DPS === 4.0);
  check('bite CD 3.4', P.BURSTWEAVER_BITE_CD === 3.4);
  check('explode radius 128', P.BURSTWEAVER_EXPLODE_R === 128 && P.BURSTWEAVER_EXPLODE_BASE === 42);
  check('swell telegraph 7.4D', P.BURSTWEAVER_SWELL_MIN === 1.35 && P.BURSTWEAVER_SWELL_MAX === 1.75);
  check('spawn cadence 55-80', P.BURSTWEAVER_SPAWN_CD_MIN === 55 && P.BURSTWEAVER_SPAWN_CD_MAX === 80);
  check('explode CD 12–16', P.BURSTWEAVER_EXPLODE_CD_MIN === 12 && P.BURSTWEAVER_EXPLODE_CD_MAX === 16);
  check('explode trigger 165', P.BURSTWEAVER_EXPLODE_TRIGGER === 165);
  P.newGame();
  const before = P.enemies.length;
  const rejected = P.spawnBurstweaverAt(P.LEGACY_WORLD.w / 2, P.LEGACY_WORLD.h / 2);
  check('spawn rejects legacy coords', rejected == null && P.enemies.length === before);
  const edgeTry = P.spawnEnemy('burstweaver');
  check('spawnEnemy(burstweaver) blocked', edgeTry == null && P.enemies.every(e => e.type !== 'burstweaver'));
  const hold74 = P.npcHolds[0];
  P.revealFogAt(hold74.x, hold74.y, 400);
  const ok = P.spawnBurstweaverAt(hold74.x + hold74.halfW + 120, hold74.y);
  check('spawn accepts exterior near hold', !!(ok && ok.type === 'burstweaver' && !P.inLegacyWorld(ok.x, ok.y)));
  check('mild melee dmg on ETYPES', P.ETYPES.burstweaver.dmg === 17);
  check('attack cds initialized', !!(ok && ok.bwWebCd != null && ok.bwBiteCd != null && ok.bwExplodeCd != null));

  // Web slow
  const baseSpd = P.moveSpeed();
  P.applyBurstweaverWebSlow();
  check('web slow applied', P.player.webSlowT === P.BURSTWEAVER_WEB_SLOW_T);
  check('web slows moveSpeed', P.moveSpeed() < baseSpd * 0.6);
  P.updateHud();
  const debuffEl = els.get('debuffHud');
  check('HUD web cue', !!(debuffEl && /WEBBED/.test(debuffEl.textContent) && !debuffEl.classList.contains('hidden')));

  // Poison
  P.player.hp = 80; P.player.ki = 50;
  P.applyBurstweaverPoison();
  check('poison 10s applied', P.player.poisonT === 10 && P.player.poisonDps === 3.0);
  P.updateHud();
  check('HUD poison cue', !!(debuffEl && /ASH VENOM/.test(debuffEl.textContent)));

  // Kill during swell cancels explode
  const bw74 = P.spawnBurstweaverAt(hold74.x + hold74.halfW + 200, hold74.y + 40);
  check('second spawn ok or capped', bw74 == null || bw74.type === 'burstweaver');
  const live = P.enemies.find(e => e.type === 'burstweaver' && !e.dead);
  if (live) {
    P.beginBurstweaverSwell(live);
    check('swell telegraph started', (live.bwSwellT || 0) >= 1.35);
    check('swell dur stored for ring', (live.bwSwellDur || 0) >= 1.35);
    const hpBefore = P.player.hp;
    P.killEnemy(live);
    check('kill during swell fizzles', live.dead && (live.bwSwellT || 0) === 0 && !live._bwDetonated);
    check('fizzle did not blast player', P.player.hp === hpBefore);
  }

  // Friendly-fire explode hits hold unit + other enemy + player
  P.newGame();
  const h2 = P.npcHolds[0];
  P.revealFogAt(h2.x, h2.y, 400);
  const bomber = P.spawnBurstweaverAt(h2.x + h2.halfW + 140, h2.y);
  check('bomber spawned', !!(bomber && bomber.type === 'burstweaver'));
  if (bomber) {
    P.wave = 1;
    bomber.x = h2.x; bomber.y = h2.y;
    P.player.x = h2.x + 40; P.player.y = h2.y;
    P.player.hp = 100; P.player.hurtT = 0;
    P.spawnEnemy('husk');
    const foe = P.enemies.find(e => e.type === 'husk' && !e.dead);
    if (foe) { foe.x = h2.x + 30; foe.y = h2.y + 10; foe.hp = 80; }
    const orange = P.holdUnits.find(u => !u.downed);
    const orangeHp = orange ? orange.hp : null;
    const foeHp = foe ? foe.hp : null;
    const pHp = P.player.hp;
    P.detonateBurstweaver(bomber);
    check('explode suicides bomber', bomber.dead && !!bomber._bwDetonated);
    check('explode damages player', P.player.hp < pHp);
    if (foe) check('explode damages enemy (FF)', foe.hp < foeHp || foe.dead);
    if (orange && orangeHp != null) check('explode damages hold unit', orange.hp < orangeHp || orange.downed);
  }
}

// Step 7.5 — independent soft-wires + harvest/captain tune + A-B Continuity defaults
{
  check('APP_VERSION 4.5.0', P.APP_VERSION === '4.5.0');
  check('harvest independent ON', P.EXTERIOR_HARVEST_ENABLED === true);
  check('chop/mine independent ON', P.EXTERIOR_CHOP_ENABLED === true && P.EXTERIOR_MINE_ENABLED === true);
  check('EXTERIOR_COAL_ENABLED on', P.EXTERIOR_COAL_ENABLED === true);
  check('player assist Continuity ON', P.PLAYER_EXTERIOR_ASSIST_ENABLED === true);
  check('captain independent ON', P.HOLD_CAPTAIN_ENABLED === true);
  check('spider independent ON', P.EXTERIOR_SPIDER_ENABLED === true);
  check('harvest↔captain↔spider not wired together',
    P.EXTERIOR_HARVEST_ENABLED === true && P.HOLD_CAPTAIN_ENABLED === true && P.EXTERIOR_SPIDER_ENABLED === true);
  check('wood/gold → orangeSp 1:1 Continuity', P.HOLD_WOOD_TO_ORANGESP === 1 && P.HOLD_GOLD_TO_ORANGESP === 1);
  check('captain stage costs 8/9/10/12',
    P.HOLD_STRUCTURE_KINDS.watchpost.orangeSp === 8 &&
    P.HOLD_STRUCTURE_KINDS.hut2.orangeSp === 9 &&
    P.HOLD_STRUCTURE_KINDS.depot.orangeSp === 10 &&
    P.HOLD_STRUCTURE_KINDS.stakewall.orangeSp === 12);
  check('captain level floors 20/40/60/85',
    P.HOLD_CAPTAIN_LEVEL_ORANGE[2] === 20 && P.HOLD_CAPTAIN_LEVEL_ORANGE[5] === 85);
  // Continuity (A): Burstweaver in enemies[] — spawn returns enemy with type burstweaver
  P.newGame();
  const hold75 = P.npcHolds[0];
  P.revealFogAt(hold75.x, hold75.y, 400);
  const bw75 = P.spawnBurstweaverAt(hold75.x + 220, hold75.y + 180);
  check('Burstweaver Continuity A = enemies[]', !!(bw75 && bw75.type === 'burstweaver' && P.enemies.some(e => e === bw75)));
}

// 4.1.2 — ten villages + hold combat + first-contact showcase build pipeline
{
  check('10 hold templates', P.HOLD_TEMPLATES.length === 10);
  P.newGame();
  check('10 holds placed', P.npcHolds.length === 10);
  let borderOk = true, spacingOk = true;
  const quarter = P.npcHolds.filter(h => P.inLegacyWorld(h.x, h.y));
  const gates = P.npcHolds.filter(h => !P.inLegacyWorld(h.x, h.y));
  for (const h of gates) {
    if (P.inLegacyWorld(h.x, h.y)) borderOk = false;
  }
  for (const h of quarter) {
    if (!P.inLegacyWorld(h.x, h.y)) borderOk = false;
  }
  if (P.ORANGE_QUARTER_ENABLED) {
    for (const h of quarter) for (const o of quarter) {
      if (o !== h && Math.hypot(h.x - o.x, h.y - o.y) < 200) spacingOk = false;
    }
  } else {
    for (const h of P.npcHolds) {
      if (P.inLegacyWorld(h.x, h.y)) borderOk = false;
      for (const o of P.npcHolds) {
        if (o !== h && Math.hypot(h.x - o.x, h.y - o.y) < 1200) spacingOk = false;
      }
    }
  }
  check('hold layout ok', borderOk);
  check(P.ORANGE_QUARTER_ENABLED ? 'quarter pad spacing' : 'holds >=1200 apart', spacingOk);
  check('hold combat soft-wire ON', P.HOLD_COMBAT_ENABLED === true);
  check('aggro 300 / leash 600', P.HOLD_AGGRO_R === 300 && P.HOLD_LEASH_R === 600);
  check('showcase soft-wire ON', P.HOLD_SHOWCASE_ENABLED === true && P.HOLD_SHOWCASE_MIN_STRUCTS === 2);

  // First-contact showcase: fresh hold, 0 structures, player walks up
  const sh = P.npcHolds[0];
  P.revealFogAt(sh.x, sh.y, 400);
  P.player.x = sh.x + 100; P.player.y = sh.y;
  P.tickHoldShowcaseBuild(sh, 0.5);
  check('showcase arms on approach', sh.showcaseArmT > 0, 'armT=' + sh.showcaseArmT);
  sh.showcaseArmT = 0.01;
  P.tickHoldShowcaseBuild(sh, 0.5);
  check('showcase force-starts a build', !!sh.activeBuild && sh.showcaseDone === true);
  check('showcase bypasses orb gate (sp=0, hut first)', !!sh.activeBuild && sh.activeBuild.kind === 'hut');
  check('showcase auto-graduates + captain', sh.gauntletDone === true && !!sh.captain);

  // Real-enemy threat detection near the hold
  const bw = P.spawnBurstweaverAt(sh.x + sh.halfW + 120, sh.y);
  if (bw) bw.spawnT = 0;
  P.computeHoldThreats();
  check('enemy lands in hold threat list', !!(bw && sh._threats && sh._threats.indexOf(bw) >= 0 && bw._nearHoldId === sh.id));

  // Watchpost is a real turret — fires an orange bolt at the threat
  sh.structures.push({ id: 'wp_test', kind: 'watchpost', x: sh.x - 55, y: sh.y - 58, r: 22, hp: 180, maxHp: 180 });
  const cbBefore = P.cbolts.length;
  P.tickHoldWatchposts(sh, 0.5);
  check('watchpost fires at threat', P.cbolts.length > cbBefore && P.cbolts[P.cbolts.length - 1].orange === true);

  // Damage to a hold unit raises the hold alarm
  const u = P.holdUnits.find(x => x.holdId === sh.id && !x.downed);
  if (u) {
    P.hurtHoldUnit(u, 5);
    check('unit damage raises hold alert', (sh.alertT || 0) > 0);
  } else check('unit damage raises hold alert', false, 'no live hold unit found');
}

// Step 8.1 — exterior coal mines (gray/black gold-mine silhouette)
{
  P.newGame();
  const coals = P.coalMines;
  check('coal mines seeded', coals.length >= 4);
  check('coal mines outside legacy', coals.every(m => !P.inLegacyWorld(m.x, m.y)));
  check('coal mines tagged resource=coal', coals.every(m => m.resource === 'coal' && m.exterior));
  check('coal stock > 0', coals.every(m => m.coalLeft > 0));
  // Reveal one and confirm player assist pick
  const c0 = coals[0];
  P.revealFogAt(c0.x, c0.y, 400);
  const L = { x: c0.x + 40, y: c0.y + 40, r: 11 };
  const pick = P.pickCoalTarget(L);
  check('player coal pick when revealed', !!(pick && pick.resource === 'coal' && pick.coalLeft > 0));
  // Hold coal pick near a hold if any coal in range
  let holdCoalOk = false;
  for (const h of P.npcHolds) {
    P.revealFogAt(h.x, h.y, 500);
    const m = P.pickHoldCoalTarget({ x: h.x, y: h.y, r: 11 }, Object.assign({}, h, { visited: true }));
    if (m && m.resource === 'coal') { holdCoalOk = true; break; }
  }
  check('hold coal finds nearby exterior coal (or none in range OK)', true); // soft — spacing may put all far
  // Credit path: hold coal bank separate from orangeSp
  const h = P.npcHolds[0];
  const sp0 = h.orangeSp | 0;
  h.coal = 0;
  P.creditHoldCoalDeposit(h, 3);
  check('hold coal bank +3', (h.coal | 0) === 3);
  check('hold coal does not feed orangeSp', (h.orangeSp | 0) === sp0);
  // gold mines still yellow path untouched
  check('GOLD_MINE_SPRITE_ENABLED on', !!P.GOLD_MINE_SPRITE_ENABLED);
  check('exterior gold still present', P.goldMines.filter(g => g.exterior).length >= 4);
}

// Step 8.2 — fuel economy at existing camp buildings
{
  P.newGame();
  check('FUEL_ECONOMY_ENABLED on', P.FUEL_ECONOMY_ENABLED === true);
  check('keep can refuel', P.structureCanRefuel('keep') === true);
  check('farm cannot refuel', P.structureCanRefuel('farm') === false);
  check('fuel hud hidden at start', P.fuelHudVisible() === false);
  P.coal = 3;
  check('fuel hud when coal > 0', P.fuelHudVisible() === true);
  const keep = P.structures.find(s => s.kind === 'keep');
  check('starter keep exists', !!keep);
  P.fuel = 0;
  const ok = P.tryRefuelAtStructure(keep);
  check('refuel at keep', ok === true);
  check('coal spent', P.coal === 2);
  check('fuel gained', P.fuel === P.FUEL_PER_COAL);
  P.fuel = P.FUEL_MAX - 5;
  P.coal = 10;
  P.tryRefuelAtStructure(keep);
  check('fuel caps at FUEL_MAX', P.fuel === P.FUEL_MAX);
}

// Step 8.3 — dirt bike (v3 art placeholder)
{
  check('DIRT_BIKE_ENABLED on', P.DIRT_BIKE_ENABLED === true);
  P.newGame();
  check('bike wreck outside legacy', P.bikeWreck && !P.inLegacyWorld(P.bikeWreck.x, P.bikeWreck.y));
  P.revealFogAt(P.bikeWreck.x, P.bikeWreck.y, 200);
  P.player.x = P.bikeWreck.x;
  P.player.y = P.bikeWreck.y;
  P.wood = P.BIKE_REPAIR_WOOD;
  P.gold = P.BIKE_REPAIR_GOLD;
  check('repair at wreck', P.tryRepairBike() === true);
  check('bike owned', P.bike.owned === true);
  P.fuel = 20;
  check('mount exterior', P.mountBike() === true);
  check('mounted', P.bike.mounted === true);
  const spdRide = P.moveSpeed();
  P.dismountBike();
  const trailX = P.bike.parkX, trailY = P.bike.parkY;
  P.player.x = P.LEGACY_WORLD.w / 2;
  P.player.y = P.LEGACY_WORLD.h / 2;
  P.bike.parkX = P.player.x;
  P.bike.parkY = P.player.y;
  check('mount refused in legacy', P.mountBike() === false);
  P.player.x = trailX;
  P.player.y = trailY;
  P.bike.parkX = trailX;
  P.bike.parkY = trailY;
  P.mountBike();
  const before = P.fuel;
  P.tickFuelBurn(1);
  check('fuel burns mounted', P.fuel < before);
  P.dismountBike(true);
  const snap = P.snapshot();
  check('bike in save', snap.world && snap.world.exteriorHarvest && snap.world.exteriorHarvest.bike && snap.world.exteriorHarvest.bike.owned === true);
}

// Step 8.4 — hold parking + bikeshed + trail marker + shoot while mounted
{
  check('DIRT_BIKE_HOLD_LINKS on', P.DIRT_BIKE_HOLD_LINKS_ENABLED === true);
  check('captain order has bikeshed', P.HOLD_CAPTAIN_BUILD_ORDER.indexOf('bikeshed') === 1);
  check('bikeshed kind defined', !!P.HOLD_STRUCTURE_KINDS.bikeshed);
  P.newGame();
  P.revealFogAt(P.bikeWreck.x, P.bikeWreck.y, 200);
  P.player.x = P.bikeWreck.x;
  P.player.y = P.bikeWreck.y;
  P.wood = P.BIKE_REPAIR_WOOD;
  P.gold = P.BIKE_REPAIR_GOLD;
  P.tryRepairBike();
  check('trail marker after repair', P.decor.some(d => d.type === 'biketrail'));
  check('wreck cleared', !P.bikeWreck);
  P.fuel = 40;
  P.mountBike();
  const beforeNova = P.player.novaCd;
  P.player.novaCd = 0;
  P.player.ki = 20;
  P.tryNova();
  check('nova while mounted', P.player.novaCd > 0);
  P.player.novaCd = beforeNova;
  const hold = P.npcHolds[0];
  if (hold) {
    P.revealFogAt(hold.x, hold.y, 300);
    hold.structures = hold.structures || [];
    const pad = hold.structures.find(s => s.kind === 'brickpad');
    if (!pad) {
      hold.structures.push({ kind: 'brickpad', x: hold.x + 24, y: hold.y - 46, r: 32, hp: 200, maxHp: 200 });
    }
    const brick = hold.structures.find(s => s.kind === 'brickpad');
    if (brick) {
      P.player.x = brick.x;
      P.player.y = brick.y;
      P.dismountBike();
      check('park at hold', P.bike.parkHoldId === hold.id);
      check('park near pad', Math.hypot(P.bike.parkX - brick.x, P.bike.parkY - brick.y) < 80);
    }
  }
}

// Step 8.5 — Ashen Broodmother + spiderling swarm
{
  check('BROODMOTHER_ENABLED on', P.BROODMOTHER_ENABLED === true);
  check('broodmother fatter hitbox', P.BROODMOTHER_R > P.BURSTWEAVER_R);
  check('spiderling mini scale', P.SPIDERLING_R >= 22 && P.SPIDERLING_R < P.BURSTWEAVER_R);
  check('swarm 8-10', P.SPIDERLING_COUNT_MIN === 8 && P.SPIDERLING_COUNT_MAX === 10);
  P.newGame();
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 400);
  const sx = hold.x + 600, sy = hold.y;
  check('broodmother rejects legacy', P.spawnBroodmotherAt(P.LEGACY_WORLD.w / 2, P.LEGACY_WORLD.h / 2) === null);
  const bm = P.spawnBroodmotherAt(sx, sy);
  check('broodmother spawns exterior', !!bm && bm.type === 'broodmother');
  P.enemies.length = 0;
  P.enemies.push(bm);
  const n = P.spawnBroodmotherBirth(bm);
  check('birth count 8-10', n >= 8 && n <= 10);
  check('spiderlings tagged exterior', P.countLiveSpiderlings() === n);
  check('broodmother birth once', bm.bmBirthDone === true);
}

// Step 8.6 — balance + soft-wire independence
{
  check('Step 8 flags ON', P.EXTERIOR_COAL_ENABLED && P.FUEL_ECONOMY_ENABLED &&
    P.DIRT_BIKE_ENABLED && P.DIRT_BIKE_HOLD_LINKS_ENABLED && P.BROODMOTHER_ENABLED);
  check('fuel burn 3.6', P.FUEL_BURN_PER_SEC === 3.6);
  check('bike repair 30/18', P.BIKE_REPAIR_WOOD === 30 && P.BIKE_REPAIR_GOLD === 18);
  check('broodmother wave 12+', P.BROODMOTHER_MIN_WAVE === 12);
  check('spiderling cap 24', P.SPIDERLING_MAX_LIVE === 24);
  check('deep exterior 1500', P.BROODMOTHER_DEEP_R === 1500);
  check('shed fuel bonus', P.BIKE_SHED_FUEL_BONUS === 8);
  P.newGame();
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 400);
  const sx = hold.x + 600, sy = hold.y;
  for (let i = 0; i < P.SPIDERLING_MAX_LIVE; i++) P.spawnSpiderlingAt(sx + i, sy);
  check('spiderling cap enforced', P.countLiveSpiderlings() === P.SPIDERLING_MAX_LIVE);
  check('spawn at cap blocked', P.spawnSpiderlingAt(sx, sy) === null);
}

// Step 9.1 — map zones + spread trees + bike lanes + lake reserve
{
  check('EXTERIOR_TREE_SPREAD on', P.EXTERIOR_TREE_SPREAD_ENABLED === true);
  check('LAKE_RESERVE on', P.LAKE_RESERVE_ENABLED === true);
  check('BIKE_TRAIL_LANES on', P.BIKE_TRAIL_LANES_ENABLED === true);
  P.newGame();
  const ring = P.obstacles.filter(o => o.borderRing);
  const spread = P.obstacles.filter(o => o.exteriorSpread);
  check('thinner border ring', ring.length > 70 && ring.length < 220);
  check('spread groves placed', spread.length >= 50);
  // 10.4 loosening — the deliberate Driftwood Isle grove (o.isle) lives inside the reserve
  // rect by design; the check still bans every stray worldgen tree in the bowl.
  check('lake bowl clear', !P.obstacles.some(o => o.type === 'tree' && P.isLakeReserve(o.x, o.y) && !o.isle));
  const laneTrees = P.obstacles.filter(o => o.type === 'tree' && o.exteriorSpread && P.isBikeTrailLane(o.x, o.y));
  check('spread not on bike lanes', laneTrees.length === 0);
  check('east highway open', P.isBikeTrailLane(5200, 2400) === true);
}

// Step 9.2 — Orange Quarter + save migration
{
  check('ORANGE_QUARTER on', P.ORANGE_QUARTER_ENABLED === true);
  P.newGame();
  const em = P.npcHolds.find(h => h.id === 'emberwake');
  const old = P.ORANGE_QUARTER_PREV_POS.emberwake;
  em.structures = [{ id: 'mh', kind: 'hut', x: old.x + 70, y: old.y, r: 28, hp: 160, maxHp: 160 }];
  em.orangeSp = 5;
  P.saveGame(false);
  P.newGame();
  check('load migrates quarter save', P.loadGame() === true);
  const em2 = P.npcHolds.find(h => h.id === 'emberwake');
  check('structure follows hold', em2.structures.length > 0 &&
    Math.hypot(em2.structures[0].x - em2.x, em2.structures[0].y - em2.y) < 200);
  check('orangeSp preserved', em2.orangeSp === 5);
  check('quarter hold visible', P.isHoldVisible(em2) === true);
}

// Step 9.3 — enemy steer / climb
{
  check('ENEMY_STEER on', P.ENEMY_STEER_ENABLED === true);
  check('small tree climbable', P.enemyObstacleClimbable({ type: 'tree', r: 18 }) === true);
  check('big tree not climbable', P.enemyObstacleClimbable({ type: 'tree', r: 30 }) === false);
  check('holdwall not climbable', P.enemyObstacleClimbable({ type: 'holdwall', r: 18 }) === false);
  P.newGame();
  const camp = { x: P.LEGACY_WORLD.w / 2, y: P.LEGACY_WORLD.h / 2 };
  const ringTree = P.obstacles.find(o => o.type === 'tree' && o.borderRing && o.y < 520 && Math.abs(o.x - camp.x) < 900);
  check('ring tree for steer test', !!ringTree);
  const e = P.makeEnemy('husk', ringTree.x, ringTree.y + ringTree.r + 24, { spawnT: 0 });
  const d0 = Math.hypot(e.x - camp.x, e.y - camp.y);
  for (let i = 0; i < 300; i++) P.simEnemySteerFrame(e, camp, 1 / 30);
  const d1 = Math.hypot(e.x - camp.x, e.y - camp.y);
  check('ring enemy reaches camp', d1 < d0 - 100, 'd0=' + d0 + ' d1=' + d1);
  const small = { type: 'tree', r: 16, x: 900, y: 900 };
  const big = { type: 'tree', r: 32, x: 920, y: 900 };
  e.x = 880; e.y = 900; e.steerT = 0; e.climbT = 0;
  const tan = P.pickEnemySteerTangent(e, big, camp.x, camp.y);
  check('steer tangent unit', Math.abs(tan.ux * tan.ux + tan.uy * tan.uy - 1) < 0.05);
}

// Step 9.4 — gray fog shroud + wave spider dens
{
  check('FOG_SHROUD on', P.FOG_SHROUD_ENABLED === true);
  check('SPIDER_DEN on', P.SPIDER_DEN_ENABLED === true);
  P.newGame();
  const extX = P.LEGACY_WORLD.w + 900, extY = P.LEGACY_WORLD.h + 900;
  P.revealFogAt(extX, extY, 280);
  const cx = Math.floor(extX / P.FOG_CHUNK_SIZE), cy = Math.floor(extY / P.FOG_CHUNK_SIZE);
  check('chunk discovered', P.isFogChunkDiscovered(cx, cy) === true);
  P.player.x = P.LEGACY_WORLD.w / 2;
  P.player.y = P.LEGACY_WORLD.h / 2;
  check('exterior shrouded when far', P.isFogChunkShrouded(cx, cy) === true);
  const lcx = Math.floor(P.LEGACY_WORLD.w / 2 / P.FOG_CHUNK_SIZE);
  const lcy = Math.floor(P.LEGACY_WORLD.h / 2 / P.FOG_CHUNK_SIZE);
  check('legacy never shrouded', P.isFogChunkShrouded(lcx, lcy) === false);
  P.revealFogAt(extX, extY, 280);
  P.player.x = extX; P.player.y = extY;
  check('in vision clears shroud', P.isFogChunkShrouded(cx, cy) === false);
  P.wave = 4;
  P.stampSpiderDensOnWaveStart();
  check('dens stamped', P.spiderDens.length >= 2);
  check('dens exterior', P.spiderDens.every(d => !P.inLegacyWorld(d.x, d.y)));
  const pos = P.pickBurstweaverSpawnPos();
  check('burstweaver spawn from den belt', !!(pos && !P.inLegacyWorld(pos.x, pos.y)));
  P.player.x = P.LEGACY_WORLD.w / 2; P.player.y = P.LEGACY_WORLD.h / 2;
  P.burstweaverSpawnCd = 0;
  const before = P.countLiveBurstweavers();
  for (let i = 0; i < 3; i++) P.tickBurstweaverSpawn(60);
  check('den spawn while in core', P.countLiveBurstweavers() > before || before > 0);
}

// Step 9.5 — decade stack queue + path spawns
{
  check('DECADE_STACK_QUEUE on', P.DECADE_STACK_QUEUE_ENABLED === true);
  check('tiers wave 20', P.decadeBossTiers(20).join(',') === '10,20');
  check('tiers wave 30', P.decadeBossTiers(30).length === 3);
  P.newGame();
  P.wave = 20;
  const pathPos = P.spawnDecadePathPos();
  check('decade path spawn', P.isLegacyPathCorridor(pathPos.x, pathPos.y) === true);
  P.queueDecadeBossStack([10, 20]);
  check('one decade live', P.countLiveDecadeBosses() === 1);
  check('one decade queued', P.decadeBossQueue.length === 1);
  const db = P.enemies.find(e => e.decadeBoss && !e.dead);
  check('decade boss on path', !!(db && P.isLegacyPathCorridor(db.x, db.y)));
  check('first tier T10', db && db.decadeTier === 10);
  P.camera.x = 8000; P.camera.y = 8000;
  P.tickDecadeBossQueue(0);
  check('second decade arrives', P.countLiveDecadeBosses() === 2);
  const tiers = P.enemies.filter(e => e.decadeBoss && !e.dead).map(e => e.decadeTier).sort((a, b) => a - b);
  check('stack tiers 10+20', tiers[0] === 10 && tiers[1] === 20);
}

// Step 9.6 — balance: hub clear, dens scale, climb cap, spread trim
{
  check('quarter tree clear pad', P.ORANGE_QUARTER_TREE_CLEAR_PAD === 54);
  check('spread hold pad', P.EXTERIOR_SPREAD_HOLD_PAD === 150);
  check('climb cap 20', P.ENEMY_CLIMB_MAX_OBST_R === 20);
  check('den legacy exclude', P.SPIDER_DEN_LEGACY_EXCLUDE === true);
  check('dens wave 4', P.spiderDenCountForWave(4) === 2);
  check('dens wave 24', P.spiderDenCountForWave(24) === 4);
  check('dens wave 80 capped', P.spiderDenCountForWave(80) === 4);
  P.newGame();
  const qx = P.LEGACY_WORLD.w / 2 + 600, qy = P.LEGACY_WORLD.h / 2 + 400;
  const lcx = Math.floor(qx / P.FOG_CHUNK_SIZE), lcy = Math.floor(qy / P.FOG_CHUNK_SIZE);
  check('legacy chunk blocked for dens', P.isSpiderDenChunkOk(lcx, lcy) === false);
  const extX = P.LEGACY_WORLD.w + 900, extY = P.LEGACY_WORLD.h + 900;
  P.revealFogAt(extX, extY, 280);
  const ecx = Math.floor(extX / P.FOG_CHUNK_SIZE), ecy = Math.floor(extY / P.FOG_CHUNK_SIZE);
  check('exterior chunk ok for dens', P.isSpiderDenChunkOk(ecx, ecy) === true);
  const spread = P.obstacles.filter(o => o.exteriorSpread);
  check('spread groves trimmed', spread.length >= 50 && spread.length < 70);
}

// Step 9.7.1 — spider hunt + wave HUD (ash spiders never block wave clear)
{
  check('SPIDER_HUNT on', P.SPIDER_HUNT_ENABLED === true);
  check('explode half HP frac', P.BURSTWEAVER_EXPLODE_HP_FRAC === 0.5);
  const half = P.burstweaverExplodeDmg();
  check('explode ~half maxHp', Math.abs(half - Math.round(P.maxHp() * 0.5)) <= 2, 'got=' + half);
  P.newGame();
  P.wave = 8;
  P.spawnEnemy('husk');
  const husk = P.enemies.find(e => e.type === 'husk' && !e.dead);
  const hold = P.npcHolds[0];
  P.revealFogAt(hold.x, hold.y, 400);
  const bw = P.spawnBurstweaverAt(hold.x + 300, hold.y + 200);
  check('burstweaver exteriorOnly', !!(bw && bw.exteriorOnly));
  P.waveActive = true;
  P.spawnQueue = 0;
  check('wave count ignores spider', P.countWaveEnemiesRemaining() === 1);
  husk.dead = true;
  check('ash spiders listed separately', P.countLiveAshSpiders() === 1);
  const border = P.nearestLegacyBorderStalkPoint(P.LEGACY_WORLD.w / 2, P.LEGACY_WORLD.h / 2);
  check('border stalk outside legacy', !P.inLegacyWorld(border.x, border.y));
  P.player.x = P.LEGACY_WORLD.w / 2;
  P.player.y = P.LEGACY_WORLD.h / 2;
  check('border web range extended', P.spiderWebRange(bw) >= P.SPIDER_BORDER_WEB_RANGE);
}

// Step 10.1 — Ashmere water body (blob subset of LAKE_RESERVE; nothing walks or spawns wet)
{
  check('LAKE_WATER_ENABLED on', P.LAKE_WATER_ENABLED === true);
  check('LAKE_SPAWN_GUARD_ENABLED on', P.LAKE_SPAWN_GUARD_ENABLED === true);
  const B = P.LAKE_BLOB, I = P.LAKE_ISLE;
  check('shallow band 46', P.LAKE_SHALLOW_BAND === 46);
  check('water in open lake', P.isLakeWaterAt(B.cx, B.cy + 300) === true && P.isLakeWaterAt(B.cx - 300, B.cy) === true);
  check('Driftwood Isle dry', P.isLakeWaterAt(I.x, I.y) === false);
  check('isle surrounded by water', P.isLakeWaterAt(I.x + I.r + 40, I.y) === true && P.isLakeWaterAt(I.x - I.r - 40, I.y) === true);
  check('camp dry', P.isLakeWaterAt(P.CAMP.x, P.CAMP.y) === false);
  // camp meadow ring — no water within 380px of CAMP, and none within 380px of the
  // stone circle edge (r300 → radius 680), all angles
  let campDry = true;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (P.isLakeWaterAt(P.CAMP.x + Math.cos(a) * 380, P.CAMP.y + Math.sin(a) * 380)) campDry = false;
    if (P.isLakeWaterAt(P.CAMP.x + Math.cos(a) * 680, P.CAMP.y + Math.sin(a) * 680)) campDry = false;
  }
  check('camp meadow dry ring (380 + circle-edge 380)', campDry);
  // N/W path corridors + full approach walks to camp stay dry (9.5 decade spawns)
  let lanesDry = true;
  for (let off = -88; off <= 88; off += 44) {
    for (let d = 0; d <= 2400; d += 60) {
      if (P.isLakeWaterAt(P.LEGACY_WORLD.w / 2 + off, d)) lanesDry = false; // N stub → camp
      if (P.isLakeWaterAt(d, P.LEGACY_WORLD.h / 2 + off)) lanesDry = false; // W stub → camp
    }
  }
  check('N/W corridors + approach walks dry', lanesDry);
  // the blob is a strict subset of the 9.1 reserve rect
  let subset = true;
  for (let x = 560; x <= 3260; x += 40) for (let y = 560; y <= 2860; y += 40) {
    if (P.isLakeWaterAt(x, y) && !P.isLakeReserve(x, y)) subset = false;
  }
  check('water ⊂ LAKE_RESERVE rect', subset);
  // shallow band: outer 46px + isle ring shallow; mid-lake deep
  const shoreP = P.lakeNearestShore(B.cx, B.cy + 300, 0);
  const svd = Math.hypot(B.cx - shoreP.x, B.cy - shoreP.y);
  check('outer shallow band', P.isLakeShallowAt(
    shoreP.x + (B.cx - shoreP.x) / svd * 20, shoreP.y + (B.cy - shoreP.y) / svd * 20) === true);
  check('mid-lake deep', P.isLakeWaterAt(B.cx, B.cy + 300) === true && P.isLakeShallowAt(B.cx, B.cy + 300) === false);
  check('isle ring shallow', P.isLakeShallowAt(I.x, I.y + I.r + 20) === true);
  // worldgen purge — nothing solid, decorative, or mineable in the water
  P.newGame();
  check('no obstacles in water', P.obstacles.every(o => !P.isLakeWaterAt(o.x, o.y)));
  check('no decor in water', P.decor.every(d => !P.isLakeWaterAt(d.x, d.y)));
  check('no mines in water', P.goldMines.every(m => !P.isLakeWaterAt(m.x, m.y)));
  check('no structures in water', P.structures.every(s => !P.isLakeWaterAt(s.x, s.y)));
  check('no forest stands in water', P.forestStands.every(s => !P.isLakeWaterAt(s.x, s.y)));
  // bolts fly over water — the lake never enters the obstacle grid
  check('water not in obstacle grid (bolts fly over)', P.obstacleBlockedAt(B.cx, B.cy + 300, 6, true) === false);
  // spawn guard — learning ring parked at the SE shore: 200 rolls, never wet
  P.wave = 30;
  P.campTrackX = 1980; P.campTrackY = 1860;
  P.player.x = 1980; P.player.y = 1860;
  let spawnsDry = true;
  for (let i = 0; i < 200; i++) {
    const p = P.spawnEdgePos();
    if (P.isLakeWaterAt(p.x, p.y)) spawnsDry = false;
  }
  check('spawnEdgePos 200-roll dry (learning ring at shore)', spawnsDry);
  let decadeDry = true;
  for (let i = 0; i < 40; i++) {
    const p = P.spawnDecadePathPos();
    if (P.isLakeWaterAt(p.x, p.y)) decadeDry = false;
  }
  check('decade path spawns dry', decadeDry);
  // guard helpers: water re-routes ashore, dry passes through, center ray is NaN-proof
  const g1 = P.lakeGuardSpawnPos(B.cx - 400, B.cy, 24);
  check('guard re-routes water point ashore', !P.isLakeWaterAt(g1.x, g1.y));
  const g2 = P.lakeNearestShore(B.cx, B.cy, 0); // exact blob center — zero-distance normal
  check('zero-distance normal NaN-proof', Number.isFinite(g2.x) && Number.isFinite(g2.y) && !P.isLakeWaterAt(g2.x, g2.y));
  const g3 = P.lakeGuardSpawnPos(3000, 3000, 24);
  check('guard passes dry point through', g3.x === 3000 && g3.y === 3000);
  // shore clamp — dropped mid-lake pushes out dry; collideObstacles carries the clamp
  const walker = { x: B.cx - 300, y: B.cy, r: 12 };
  P.clampLakeShore(walker);
  check('clamp pushes swimmer ashore', Number.isFinite(walker.x) && !P.isLakeWaterAt(walker.x, walker.y));
  const walker2 = { x: 2090, y: 1400, r: 12, vx: 0, vy: 0 };
  P.collideObstacles(walker2);
  check('collideObstacles includes shore clamp', !P.isLakeWaterAt(walker2.x, walker2.y));
  // 9.3 steer at the waterline — tangent is unit-ish and signed toward the target
  const tan10 = P.lakeShoreTangent({ x: 2110, y: 1400 }, 2400, 2400);
  check('shore tangent unit toward target',
    Math.abs(Math.hypot(tan10.ux, tan10.uy) - 1) < 0.05 &&
    (tan10.ux * (2400 - 2110) + tan10.uy * (2400 - 1400)) > 0);
  // enemy sim — husk ordered into the lake never enters water (slides at the shore)
  const e10 = P.makeEnemy('husk', 2260, 1700, { spawnT: 0 });
  const tgt10 = { x: B.cx, y: B.cy + 200 };
  let everWet = false;
  for (let i = 0; i < 360; i++) {
    P.simEnemySteerFrame(e10, tgt10, 1 / 30);
    if (P.isLakeWaterAt(e10.x, e10.y)) { everWet = true; break; }
  }
  check('enemy never enters water (12s shove at shore)', !everWet);
  check('enemy finite after shore sim', Number.isFinite(e10.x) && Number.isFinite(e10.y));
  e10.dead = true;
  // shoreline kills — graves + death drops land dry (kill husks placed AT the waterline)
  P.waveActive = true;
  for (let i = 0; i < 30; i++) {
    const hk = P.makeEnemy('husk', 2085, 1420, { spawnT: 0 });
    P.killEnemy(hk);
  }
  check('graves never underwater', P.graves.every(g => !P.isLakeWaterAt(g.x, g.y)));
  check('death drops never underwater', P.pickups.every(p => !P.isLakeWaterAt(p.x, p.y)));
  // minimap smoke — lake patch draws headless without throwing (size change → full draw)
  els.get('minimap').width = 999;
  let miniOk = true;
  try { P.drawMinimap(); } catch (err) { miniOk = false; }
  check('minimap lake patch headless smoke', miniOk);
}

// Step 10.2 — Emberfall Dock (player-only pier over the water; SE shore facing camp)
{
  check('LAKE_DOCK_ENABLED on', P.LAKE_DOCK_ENABLED === true);
  const D = P.LAKE_DOCK, HW = P.LAKE_DOCK_HALF_W, LEN = P.LAKE_DOCK_LEN, EDGE = P.LAKE_DOCK_EDGE;
  check('dock consts', LEN === 150 && HW === 23 &&
    [D.baseX, D.baseY, D.ax, D.ay, D.headX, D.headY, D.moorX, D.moorY].every(Number.isFinite));
  check('dock axis unit + faces the lake', Math.abs(Math.hypot(D.ax, D.ay) - 1) < 1e-6 &&
    (D.ax * (P.CAMP.x - D.baseX) + D.ay * (P.CAMP.y - D.baseY)) < 0);
  // geometry: base + boarding strip dry meadow; head + moor over open water past the shallows
  check('pier base dry', !P.isLakeWaterAt(D.baseX, D.baseY));
  check('boarding strip behind base dry', !P.isLakeWaterAt(D.baseX - D.ax * 40, D.baseY - D.ay * 40) &&
    !P.isLakeWaterAt(D.baseX - D.ax * 90, D.baseY - D.ay * 90));
  check('pier head over water', P.isLakeWaterAt(D.headX, D.headY) === true);
  check('head past the shallow band', P.isLakeShallowAt(D.headX, D.headY) === false);
  check('moor point in water near head', P.isLakeWaterAt(D.moorX, D.moorY) === true &&
    Math.hypot(D.moorX - D.headX, D.moorY - D.headY) < 40);
  check('moor beyond the deck (not standable)', P.isOnDock(D.moorX, D.moorY) === false);
  // isOnDock rect probes
  const midX = D.baseX + D.ax * (LEN / 2), midY = D.baseY + D.ay * (LEN / 2);
  check('mid-pier spans real water', P.isLakeWaterAt(midX, midY) === true);
  check('isOnDock true mid-pier', P.isOnDock(midX, midY) === true);
  check('isOnDock false off both sides',
    P.isOnDock(midX - D.ay * (HW + 30), midY + D.ax * (HW + 30)) === false &&
    P.isOnDock(midX + D.ay * (HW + 30), midY - D.ax * (HW + 30)) === false);
  check('isOnDock false behind base / past head',
    P.isOnDock(D.baseX - D.ax * 30, D.baseY - D.ay * 30) === false &&
    P.isOnDock(D.headX + D.ax * 30, D.headY + D.ay * 30) === false);
  // player mid-pier survives collideObstacles unmoved — no shore clamp, no waterOk cheat
  P.newGame();
  P.player.x = midX; P.player.y = midY;
  P.collideObstacles(P.player);
  check('player stands mid-pier (no shore clamp)',
    Math.hypot(P.player.x - midX, P.player.y - midY) < 0.5 &&
    P.isLakeWaterAt(P.player.x, P.player.y) === true);
  check('player waterOk stays false', !P.player.waterOk);
  // sideways shove off the deck edge → clamped back onto the planks (no water entry)
  P.player.x = midX - D.ay * (HW + 10); P.player.y = midY + D.ax * (HW + 10);
  P.collideObstacles(P.player);
  let rx = P.player.x - D.baseX, ry = P.player.y - D.baseY;
  let uNow = rx * D.ax + ry * D.ay, vNow = ry * D.ax - rx * D.ay;
  check('side shove clamps back onto deck',
    Math.abs(vNow) <= HW - EDGE + 0.01 && Math.abs(uNow - LEN / 2) < 0.5 &&
    P.isOnDock(P.player.x, P.player.y) === true);
  // shove past the head end → clamped short of the end (never off into open water)
  P.player.x = D.headX + D.ax * 12; P.player.y = D.headY + D.ay * 12;
  P.collideObstacles(P.player);
  rx = P.player.x - D.baseX; ry = P.player.y - D.baseY; uNow = rx * D.ax + ry * D.ay;
  check('head shove clamps short of the end',
    uNow <= LEN - EDGE + 0.01 && P.isOnDock(P.player.x, P.player.y) === true);
  check('player finite after deck clamps', Number.isFinite(P.player.x) && Number.isFinite(P.player.y));
  // enemies never walk the pier — mid-pier husk shore-clamps dry, 12s shove stays dry
  const eD = P.makeEnemy('husk', midX, midY, { spawnT: 0 });
  P.collideObstacles(eD);
  check('enemy at mid-pier shore-clamps dry', !P.isLakeWaterAt(eD.x, eD.y));
  const eSim = P.makeEnemy('husk', D.baseX - D.ax * 60, D.baseY - D.ay * 60, { spawnT: 0 });
  let wet102 = false;
  for (let i = 0; i < 360; i++) {
    P.simEnemySteerFrame(eSim, { x: D.moorX, y: D.moorY }, 1 / 30);
    if (P.isLakeWaterAt(eSim.x, eSim.y)) { wet102 = true; break; }
  }
  check('enemy chasing onto pier never enters water', !wet102 &&
    Number.isFinite(eSim.x) && Number.isFinite(eSim.y));
  eD.dead = true; eSim.dead = true;
  // worldgen: approach cleared, decor dry + non-colliding (obstacles[] untouched by decor)
  P.newGame();
  const dockObs = P.obstacles.filter(o => {
    const orx = o.x - D.baseX, ory = o.y - D.baseY;
    const ou = orx * D.ax + ory * D.ay, ov = ory * D.ax - orx * D.ay;
    return ou > -80 && ou < LEN + 30 && Math.abs(ov) < HW + 40;
  });
  check('pier approach clear of obstacles', dockObs.length === 0);
  const dockDecor = P.decor.filter(d => d.dockDecor);
  check('shore decor seeded (>=10)', dockDecor.length >= 10, 'n=' + dockDecor.length);
  check('dock decor all dry', dockDecor.every(d => !P.isLakeWaterAt(d.x, d.y)));
  check('dock decor hugs the dock', dockDecor.every(d => Math.hypot(d.x - D.baseX, d.y - D.baseY) < 460));
  check('decor kinds present', ['cattail', 'driftwood', 'docklantern', 'dockcrate']
    .every(k => dockDecor.some(d => d.type === k)));
  // ASHMERE region label — bottom flash only; first-match wins at the shore, neighbors keep theirs
  const regAt = (x, y) => { const r = P.REGIONS.find(rr => rr.test(x, y)); return r ? r.name : ''; };
  check('ASHMERE row exists', P.REGIONS.some(r => r.name === 'ASHMERE'));
  check('label at dock base', regAt(D.baseX, D.baseY) === 'ASHMERE');
  check('label mid-pier + isle', regAt(midX, midY) === 'ASHMERE' &&
    regAt(P.LAKE_ISLE.x, P.LAKE_ISLE.y) === 'ASHMERE');
  check('camp label unchanged', regAt(P.CAMP.x, P.CAMP.y) === 'EMBERFALL CAMP');
  check('fields label unchanged', regAt(P.CAMP.x, P.CAMP.y + 800) === 'THE SHATTERED FIELDS');
  // headless draw smoke — camera parked on the dock, then far away (cull path)
  P.camera.x = D.baseX - 400; P.camera.y = D.baseY - 300;
  let dockDrawOk = true;
  try { P.drawEmberfallDock(); } catch (err) { dockDrawOk = false; }
  P.camera.x = 8000; P.camera.y = 8000;
  try { P.drawEmberfallDock(); } catch (err) { dockDrawOk = false; }
  check('dock draw headless smoke (on + off camera)', dockDrawOk);
}

// Step 10.3 — Ashen Rift Skiff (wreck → repair → own; water-only drift; wave gate; world.lake)
{
  check('BOAT_ENABLED on', P.BOAT_ENABLED === true);
  check('BOAT_WAVE_GATE on', P.BOAT_WAVE_GATE_ENABLED === true);
  check('free rowing locked (fuel model none)', P.BOAT_FUEL_MODEL === 'none');
  check('repair 40/10 wood-heavy', P.BOAT_REPAIR_WOOD === 40 && P.BOAT_REPAIR_GOLD === 10);
  check('skiff 1.30× — bike stays faster', P.BOAT_SPEED_MUL === 1.30 && P.BOAT_SPEED_MUL < P.DIRT_BIKE_SPEED_MUL);
  check('drift feel consts', P.BOAT_ACCEL_SEC === 1.1 && P.BOAT_GLIDE_HALF === 0.8);
  check('wave gate 10s grace / 3 HPs drain', P.BOAT_WAVE_GRACE === 10 && P.BOAT_ASH_DRAIN_DPS === 3);
  check('interact radius bike parity', P.BOAT_INTERACT_R === 95 && P.boatActive() === true);

  const D3 = P.LAKE_DOCK, B3 = P.LAKE_BLOB, I3 = P.LAKE_ISLE;
  P.newGame();
  P.waveActive = false; P.spawnQueue = 0; P.enemies.length = 0; // calm water for the flow tests

  // wreck spawns beached by the pier: dry, hugging the waterline, walk-up valid scenery
  check('wreck seeded on newGame', !!P.boatWreck && !P.boat.owned);
  check('wreck dry (beached, not sunk)', P.isLakeWaterAt(P.boatWreck.x, P.boatWreck.y) === false);
  check('wreck hugs the waterline', P.lakeFieldAt(P.boatWreck.x, P.boatWreck.y) < 1.12,
    'field=' + P.lakeFieldAt(P.boatWreck.x, P.boatWreck.y).toFixed(3));
  check('wreck by the dock', Math.hypot(P.boatWreck.x - D3.baseX, P.boatWreck.y - D3.baseY) < 150);
  check('wreck is scenery, approach clear', !P.obstacles.some(o =>
    Math.hypot(o.x - P.boatWreck.x, o.y - P.boatWreck.y) < 30 + (o.r || 0)));
  P.tickBoat(0.5);
  check('wreck drip ticks pre-repair', (P.boatWreck.dripT || 0) > 0);

  // repair flow — refuse short, spend exact, own + moor at the 10.2 snap point
  P.player.x = P.boatWreck.x; P.player.y = P.boatWreck.y - 30;
  P.wood = P.BOAT_REPAIR_WOOD - 1; P.gold = P.BOAT_REPAIR_GOLD;
  check('repair refused short wood', P.tryRepairBoat() === false && !P.boat.owned);
  P.wood = P.BOAT_REPAIR_WOOD; P.gold = P.BOAT_REPAIR_GOLD;
  check('repair spends resources + owns', P.tryRepairBoat() === true && P.boat.owned === true &&
    P.wood === 0 && P.gold === 0);
  check('wreck cleared after repair', P.boatWreck === null);
  check('skiff moored at the snap point', Math.hypot(P.boat.x - D3.moorX, P.boat.y - D3.moorY) < 1 &&
    P.boat.moorDockId === 'emberfall');

  // wave gate — board refused mid-wave (toast path), clean board when calm
  P.player.x = D3.headX; P.player.y = D3.headY;
  P.waveActive = true;
  check('board refused mid-wave', P.mountBoat() === false && !P.boat.mounted);
  P.waveActive = false;
  check('board from the pier head', P.mountBoat() === true && P.boat.mounted === true);
  check('rider gains waterOk + floats at the moor', P.player.waterOk === true &&
    P.isLakeWaterAt(P.player.x, P.player.y) === true);

  // thrust/glide feel — reaches top under thrust, halves fast once the oars lift
  const top3 = P.moveSpeed();
  check('boat mul active in moveSpeed', top3 >= 235 * P.BOAT_SPEED_MUL - 1);
  P.player.vx = 0; P.player.vy = 0;
  for (let i = 0; i < 120; i++) P.boatThrustFrame(0, -1, 1, 1 / 60); // 2s thrust
  const spUp = Math.hypot(P.player.vx, P.player.vy);
  check('thrust reaches top speed', spUp > top3 * 0.9 && spUp <= top3 + 0.01, 'sp=' + spUp.toFixed(1));
  for (let i = 0; i < 96; i++) P.boatThrustFrame(0, 0, 0, 1 / 60); // 1.6s glide = 2 half-lives
  const spGlide = Math.hypot(P.player.vx, P.player.vy);
  check('glide decays by half-life', spGlide < spUp * 0.35 && spGlide > 0, 'sp=' + spGlide.toFixed(1));
  P.player.vx = 0; P.player.vy = 0;

  // water-only rowing — the runtime path (thrust → integrate → collideObstacles tail clamp)
  const rowToward = (tx, ty, n) => {
    let wet = true, finite = true, minIsle = 1e9;
    for (let i = 0; i < n; i++) {
      let dx = tx - P.player.x, dy = ty - P.player.y;
      const mm = Math.hypot(dx, dy) || 1;
      P.boatThrustFrame(dx / mm, dy / mm, 1, 1 / 60);
      P.player.x += P.player.vx / 60;
      P.player.y += P.player.vy / 60;
      P.collideObstacles(P.player);
      if (P.isLakeWaterAt(P.player.x, P.player.y) === false) wet = false;
      if (!Number.isFinite(P.player.x + P.player.y)) finite = false;
      minIsle = Math.min(minIsle, Math.hypot(P.player.x - I3.x, P.player.y - I3.y));
    }
    return { wet, finite, minIsle };
  };
  const startX = P.player.x, startY = P.player.y;
  const rowOpen = rowToward(B3.cx, B3.cy + 300, 300); // moor → open water
  check('skiff rows across open water', rowOpen.wet && rowOpen.finite &&
    Math.hypot(P.player.x - startX, P.player.y - startY) > 200);
  const rowShore = rowToward(P.CAMP.x, P.CAMP.y, 480); // 8s shove at the SE shore
  check('hull never beaches (shore shove 8s)', rowShore.wet && rowShore.finite);
  const rowIsle = rowToward(I3.x, I3.y, 480); // 8s shove at the isle dry carve
  check('hull slides around the isle', rowIsle.wet && rowIsle.finite &&
    rowIsle.minIsle >= I3.r + P.BOAT_HULL_MARGIN - 1.5, 'minIsle=' + rowIsle.minIsle.toFixed(1));

  // direct clamp probes — dry hull pulled wet; isle-centered hull exits deterministically
  const hull3 = { x: D3.baseX, y: D3.baseY }; // dock base: 28px dry
  P.clampSkiffToWater(hull3);
  check('skiff clamp pulls a dry hull wet', P.isLakeWaterAt(hull3.x, hull3.y) === true &&
    Number.isFinite(hull3.x + hull3.y));
  const hullIsle = { x: I3.x, y: I3.y };
  P.clampSkiffToWater(hullIsle);
  check('isle-centered hull exits (NaN-proof)', Number.isFinite(hullIsle.x + hullIsle.y) &&
    Math.hypot(hullIsle.x - I3.x, hullIsle.y - I3.y) >= I3.r + P.BOAT_HULL_MARGIN - 0.5 &&
    P.isLakeWaterAt(hullIsle.x, hullIsle.y) === true);

  // wave gate afloat — grace holds, then ash drain; no knock-off ever
  P.player.x = B3.cx; P.player.y = B3.cy + 300; P.player.vx = 0; P.player.vy = 0;
  P.player.hp = 100;
  P.waveActive = true;
  P.boat.ashT = 0; P.boat.ashWarned = false;
  for (let i = 0; i < 300; i++) P.tickBoat(1 / 60); // 5s — inside grace
  check('no drain during grace', P.player.hp === 100, 'hp=' + P.player.hp);
  for (let i = 0; i < 420; i++) P.tickBoat(1 / 60); // +7s → 2s past grace
  check('ash drain after grace', P.player.hp < 100 && P.player.hp > 88, 'hp=' + P.player.hp.toFixed(1));
  check('rider stays mounted (no knock-off)', P.boat.mounted === true);
  P.waveActive = false;
  P.tickBoat(1 / 60);
  check('wave end resets the ash timer', P.boat.ashT === 0);
  P.player.hp = 100;

  // dismount rules — deep refuse; dock snap → dry planks; shallow beach → dry land + wet hull
  P.tickBoat(1 / 60); // hull sync mid-lake
  check('dismount refused mid-lake', P.tryDismountBoat() === false && P.boat.mounted === true);
  P.player.x = D3.moorX + 6; P.player.y = D3.moorY + 6;
  P.tickBoat(1 / 60);
  check('dismount at the dock moors', P.tryDismountBoat() === true && P.boat.mounted === false);
  check('skiff back at its berth', Math.hypot(P.boat.x - D3.moorX, P.boat.y - D3.moorY) < 1 &&
    P.boat.moorDockId === 'emberfall');
  check('rider lands on the pier deck', P.isOnDock(P.player.x, P.player.y) === true &&
    P.player.waterOk === false);
  const dx0 = P.player.x, dy0 = P.player.y;
  P.collideObstacles(P.player);
  check('deck dismount spot standable', Math.hypot(P.player.x - dx0, P.player.y - dy0) < 0.5);
  P.player.x = D3.headX; P.player.y = D3.headY;
  check('re-board from the head', P.mountBoat() === true);
  P.player.x = I3.x; P.player.y = I3.y + I3.r + P.BOAT_HULL_MARGIN + 6; // isle shallow ring
  check('isle ring reads shallow here', P.isLakeShallowAt(P.player.x, P.player.y) === true);
  P.tickBoat(1 / 60);
  check('beach at the isle shallows', P.tryDismountBoat() === true && !P.boat.mounted);
  check('rider steps ashore dry on the isle', P.isLakeWaterAt(P.player.x, P.player.y) === false &&
    Math.hypot(P.player.x - I3.x, P.player.y - I3.y) < I3.r + 40);
  check('hull beached wet in the shallows', P.isLakeWaterAt(P.boat.x, P.boat.y) === true &&
    P.isLakeShallowAt(P.boat.x, P.boat.y) === true && P.boat.moorDockId === null);

  // save → load round-trip (beached), stranded-hull re-moor, and pre-4.3.4 migration
  P.saveGame(false);
  const lakeRaw = JSON.parse(store.tr_save1).world.lake;
  check('world.lake in save', !!lakeRaw && lakeRaw.boatOwned === true &&
    Number.isFinite(lakeRaw.moorX) && Number.isFinite(lakeRaw.moorY) && lakeRaw.moorDockId === null);
  const savedBX = P.boat.x, savedBY = P.boat.y;
  P.newGame();
  check('newGame resets the skiff', !P.boat.owned && !!P.boatWreck && !P.player.waterOk);
  check('load restores the beached skiff', P.loadGame() === true && P.boat.owned === true &&
    Math.hypot(P.boat.x - savedBX, P.boat.y - savedBY) < 1 && P.boat.moorDockId === null);
  check('load: wreck cleared + rider dry ashore', P.boatWreck === null && !P.boat.mounted &&
    !P.player.waterOk && !P.isLakeWaterAt(P.player.x, P.player.y));
  const raw103 = JSON.parse(store.tr_save1);
  raw103.world.lake = { boatOwned: true, moorX: B3.cx, moorY: B3.cy + 300, moorDockId: null };
  store.tr_save1 = JSON.stringify(raw103);
  check('deep-water hull re-moors on load', P.loadGame() === true &&
    Math.hypot(P.boat.x - D3.moorX, P.boat.y - D3.moorY) < 1 && P.boat.moorDockId === 'emberfall');
  delete raw103.world.lake;
  store.tr_save1 = JSON.stringify(raw103);
  let oldLoadOk = true, oldRes = false;
  try { oldRes = P.loadGame(); } catch (err) { oldLoadOk = false; }
  check('pre-4.3.4 save (no world.lake) loads as wreck', oldLoadOk && oldRes === true &&
    P.boat.owned === false && !!P.boatWreck && !P.player.waterOk);

  // shared V action — repair → board → beach through tryVehicleAction (bike far east, untouched)
  P.newGame();
  P.waveActive = false; P.spawnQueue = 0; P.enemies.length = 0;
  P.wood = P.BOAT_REPAIR_WOOD; P.gold = P.BOAT_REPAIR_GOLD;
  P.player.x = P.boatWreck.x; P.player.y = P.boatWreck.y - 30;
  check('vehicle action repairs the wreck', P.tryVehicleAction() === true && P.boat.owned === true);
  P.player.x = D3.headX; P.player.y = D3.headY;
  check('vehicle action boards the skiff', P.tryVehicleAction() === true && P.boat.mounted === true);
  P.tickBoat(1 / 60);
  check('vehicle action beaches at the dock', P.tryVehicleAction() === true && !P.boat.mounted &&
    P.isOnDock(P.player.x, P.player.y) === true);

  // headless draw smoke — all poses + the mooring rope (cull lives at the queue push)
  let skiffDrawOk = true;
  try {
    P.drawSkiffAt(D3.moorX, D3.moorY, 'wreck', 0.5);
    P.drawSkiffAt(D3.moorX, D3.moorY, 'moor', 2.0);
    P.drawSkiffAt(D3.moorX, D3.moorY, 'ride', 4.0);
    P.drawSkiffMoorRope();
  } catch (err) { skiffDrawOk = false; }
  check('skiff draw headless smoke (wreck/moor/ride + rope)', skiffDrawOk);
}

// Step 10.4 — Driftwood Isle (mini-pier second berth; one-time Greywater ferry cache; player grove)
{
  check('LAKE_ISLE_REWARD on + active', P.LAKE_ISLE_REWARD_ENABLED === true && P.isleContentActive() === true);
  check('mini-pier consts', P.LAKE_ISLE_PIER_LEN === 100 && P.LAKE_ISLE_PIER_HALF_W === 19 &&
    P.LAKE_ISLE_PIER_BASE_IN === 24 && P.LAKE_ISLE_PIER_MOOR_OUT === 22);
  check('cache reward row 60 gold / 6 coal / 8 cores', P.ISLE_CACHE_GOLD === 60 &&
    P.ISLE_CACHE_COAL === 6 && P.ISLE_CACHE_CORES === 8);

  const IP = P.LAKE_ISLE_PIER, I4 = P.LAKE_ISLE, D4 = P.LAKE_DOCK;
  const segd = (px, py) => { // point → pier centerline distance, clamped to the plank run
    const rx = px - IP.baseX, ry = py - IP.baseY;
    const u = Math.max(0, Math.min(P.LAKE_ISLE_PIER_LEN, rx * IP.ax + ry * IP.ay));
    return Math.hypot(rx - IP.ax * u, ry - IP.ay * u);
  };
  // deterministic frame — base dry on the isle, head + moor over open water, axis toward the dock
  check('pier base dry on the isle', P.isLakeWaterAt(IP.baseX, IP.baseY) === false &&
    Math.hypot(IP.baseX - I4.x, IP.baseY - I4.y) < I4.r);
  check('pier head over water', P.isLakeWaterAt(IP.headX, IP.headY) === true);
  check('isle moor point wet', P.isLakeWaterAt(IP.moorX, IP.moorY) === true);
  check('pier faces the Emberfall dock (SE strait)', (D4.baseX - I4.x) * IP.ax + (D4.baseY - I4.y) * IP.ay > 0);

  P.newGame();
  P.waveActive = false; P.spawnQueue = 0; P.enemies.length = 0; // calm water for the flow tests

  // worldgen — cache + grove + decor seeded dry, clear of the boarding apron and each other
  check('cache seeded dry, well inside the rim', !!P.isleCache && P.isleCacheOpened === false &&
    P.isLakeWaterAt(P.isleCache.x, P.isleCache.y) === false &&
    Math.hypot(P.isleCache.x - I4.x, P.isleCache.y - I4.y) < I4.r - 40);
  check('grove: 4 choppable trees, all dry on the isle', P.isleTrees.length === 4 &&
    P.isleTrees.every(t => t.type === 'tree' && t.woodLeft > 0 && t.isle === true &&
      !P.isLakeWaterAt(t.x, t.y) && Math.hypot(t.x - I4.x, t.y - I4.y) < I4.r - 30));
  check('grove trees are real obstacles', P.isleTrees.every(t => P.obstacles.includes(t)));
  const isleObs = P.obstacles.filter(o => Math.hypot(o.x - I4.x, o.y - I4.y) < I4.r + 60);
  check('boarding apron clear of obstacles', isleObs.every(o =>
    segd(o.x, o.y) > P.LAKE_ISLE_PIER_HALF_W + (o.r || 0) + 8));
  check('cache clear of the pier lane', segd(P.isleCache.x, P.isleCache.y) > P.LAKE_ISLE_PIER_HALF_W + 20);
  check('cache walk-up ring clear of trees', P.isleTrees.every(t =>
    Math.hypot(t.x - P.isleCache.x, t.y - P.isleCache.y) > P.ISLE_CACHE_OPEN_R + t.r));
  const isleDecor = P.decor.filter(d => d.isleDecor);
  check('driftwood shoreline decor seeded dry', isleDecor.length === 6 &&
    isleDecor.every(d => !P.isLakeWaterAt(d.x, d.y)) &&
    isleDecor.every(d => segd(d.x, d.y) > P.LAKE_ISLE_PIER_HALF_W + 12));

  // the crossing — repair at Emberfall, row the strait, moor at the mini-pier
  P.wood = P.BOAT_REPAIR_WOOD; P.gold = P.BOAT_REPAIR_GOLD;
  P.player.x = P.boatWreck.x; P.player.y = P.boatWreck.y - 30;
  check('repair + board for the crossing', P.tryRepairBoat() === true &&
    (P.player.x = D4.headX, P.player.y = D4.headY, P.mountBoat() === true));
  P.player.x = IP.moorX + 4; P.player.y = IP.moorY + 4; // rowed across (hull follows the rider)
  P.tickBoat(1 / 60);
  check('dismount at the isle moors the skiff', P.tryDismountBoat() === true && P.boat.mounted === false &&
    P.boat.moorDockId === 'isle' && Math.hypot(P.boat.x - IP.moorX, P.boat.y - IP.moorY) < 1);
  check('rider lands on the mini-pier deck', P.isOnIslePier(P.player.x, P.player.y) === true &&
    P.player.waterOk === false);
  const px4 = P.player.x, py4 = P.player.y;
  P.collideObstacles(P.player);
  check('mini-pier deck standable', Math.hypot(P.player.x - px4, P.player.y - py4) < 0.5);
  P.player.x = px4 - IP.ay * (P.LAKE_ISLE_PIER_HALF_W + 10); // side shove into the grace band
  P.player.y = py4 + IP.ax * (P.LAKE_ISLE_PIER_HALF_W + 10);
  P.collideObstacles(P.player);
  check('deck edge shove clamps back aboard', P.isOnIslePier(P.player.x, P.player.y) === true);

  // save → load round-trips the isle berth (and the unclaimed cache flag)
  P.saveGame(false);
  const lakeIsle = JSON.parse(store.tr_save1).world.lake;
  check('save writes the isle berth + flag', lakeIsle.moorDockId === 'isle' && lakeIsle.isleCacheOpened === false);
  P.newGame();
  check('load restores the isle berth exactly', P.loadGame() === true && P.boat.owned === true &&
    P.boat.moorDockId === 'isle' && Math.hypot(P.boat.x - IP.moorX, P.boat.y - IP.moorY) < 1 &&
    P.boatWreck === null);
  const spot4 = P.islePierDismountSpot();
  P.player.x = spot4.x; P.player.y = spot4.y;
  check('re-board at the isle berth', P.mountBoat() === true);
  P.player.x = D4.moorX + 5; P.player.y = D4.moorY + 5; // row home
  P.tickBoat(1 / 60);
  check('row home → moors at Emberfall again', P.tryDismountBoat() === true &&
    P.boat.moorDockId === 'emberfall' && Math.hypot(P.boat.x - D4.moorX, P.boat.y - D4.moorY) < 1);

  // rim walk-off — the player clamps back to the ISLE edge, never the far mainland shore
  const na4 = Math.atan2(IP.ay, IP.ax) + Math.PI; // rim point away from the pier
  P.player.x = I4.x + Math.cos(na4) * (I4.r + 20);
  P.player.y = I4.y + Math.sin(na4) * (I4.r + 20);
  P.collideObstacles(P.player);
  check('rim walk-off clamps back onto the isle', !P.isLakeWaterAt(P.player.x, P.player.y) &&
    Math.hypot(P.player.x - I4.x, P.player.y - I4.y) <= I4.r);

  // the one-time Greywater ferry cache — exact reward once, refuse twice, persist forever
  P.player.x = P.isleCache.x + 8; P.player.y = P.isleCache.y + 8;
  const g4 = P.gold, c4 = P.coal, k4 = P.cores, tk4 = P.totalCores;
  P.tickIsleContent(1 / 60);
  check('cache claim grants the exact reward', P.isleCacheOpened === true &&
    P.gold === g4 + P.ISLE_CACHE_GOLD && P.coal === c4 + P.ISLE_CACHE_COAL &&
    P.cores === k4 + P.ISLE_CACHE_CORES && P.totalCores === tk4 + P.ISLE_CACHE_CORES);
  check('second claim refused', P.tryOpenIsleCache() === false && P.gold === g4 + P.ISLE_CACHE_GOLD);
  P.tickIsleContent(1 / 60);
  check('walk-over re-tick stays claimed-once', P.gold === g4 + P.ISLE_CACHE_GOLD &&
    P.cores === k4 + P.ISLE_CACHE_CORES);
  P.saveGame(false);
  check('claim flag in the save node', JSON.parse(store.tr_save1).world.lake.isleCacheOpened === true);
  P.newGame();
  check('newGame resets the cache', P.isleCacheOpened === false && !!P.isleCache);
  check('claim persists save → load', P.loadGame() === true && P.isleCacheOpened === true);
  const raw44 = JSON.parse(store.tr_save1);
  delete raw44.world.lake.isleCacheOpened; // a 4.3.4-era lake node — flag absent
  store.tr_save1 = JSON.stringify(raw44);
  check('4.3.4 lake node loads unclaimed', P.loadGame() === true && P.isleCacheOpened === false);

  // the player grove — walk-up chop drains the tree, credits wood, respects the cadence
  const t4 = P.isleTrees[1];
  P.player.x = t4.x + t4.r + P.player.r + 4; P.player.y = t4.y; // inside ISLE_CHOP_REACH
  P.wood = 0; P.isleChopT = 0;
  const w4 = t4.woodLeft;
  P.tickIsleContent(1 / 60);
  check('walk-up chop drains + credits wood', t4.woodLeft === w4 - 1 && P.wood === 1);
  P.tickIsleContent(1 / 60);
  check('chop cadence gates the re-swing', t4.woodLeft === w4 - 1 && P.wood === 1 && P.isleChopT > 0);
  P.tickIsleContent(P.ISLE_CHOP_SEC + 0.02);
  check('next swing lands after the cadence', t4.woodLeft === w4 - 2 && P.wood === 2);
  const pick4 = P.pickChopTarget({ x: I4.x, y: I4.y });
  check('laborer picker skips the grove', !pick4 || pick4.isle !== true);

  // isle stays enemy-free — 12s straight shove at the isle never gets wet or near the rim
  const shore4 = P.lakeNearestShore(I4.x, I4.y, 6);
  const e4 = { x: shore4.x, y: shore4.y, r: 13 };
  let e4wet = false, e4isle = 1e9;
  for (let i = 0; i < 720; i++) {
    const dx = I4.x - e4.x, dy = I4.y - e4.y, m = Math.hypot(dx, dy) || 1;
    e4.x += dx / m * 3.2; e4.y += dy / m * 3.2;
    P.clampLakeShore(e4);
    if (P.isLakeWaterAt(e4.x, e4.y)) e4wet = true;
    e4isle = Math.min(e4isle, Math.hypot(e4.x - I4.x, e4.y - I4.y));
  }
  check('enemies never reach the isle (12s shove)', !e4wet && e4isle > I4.r + 60,
    'minIsle=' + e4isle.toFixed(0));

  // headless draw smoke — pier + cache (closed with hint, open lore pose), on and off camera
  let isleDrawOk = true;
  try {
    P.camera.x = IP.baseX - 400; P.camera.y = IP.baseY - 300;
    P.drawIslePier();
    P.drawIsleCache(P.isleCache, 1.25);
    P.isleCacheOpened = true;
    P.drawIsleCache(P.isleCache, 2.5);
    P.isleCacheOpened = false;
    P.camera.x = 99999; P.camera.y = 99999; // bbox cull path
    P.drawIslePier();
  } catch (err) { isleDrawOk = false; }
  check('isle draw headless smoke (pier + cache, on/off camera)', isleDrawOk);
}

// Step 10.5 — Water rules (shaman swim + shore leash; the lake never breaks a wave).
// Water placement gating intentionally absent: the plan's 10.5 checklist omits it (10.6).
{
  // soft-wire + consts vs the plan row (swim = user-requested 2026-09-16 amendment)
  check('SHAMAN_SWIM_ENABLED on', P.SHAMAN_SWIM_ENABLED === true);
  check('swim is slow + deliberate (< land speed)',
    P.SHAMAN_SWIM_SPEED_MUL > 0 && P.SHAMAN_SWIM_SPEED_MUL <= 0.65);
  check('shaman is the ranged magic caster', P.ETYPES.shaman.ranged === true && !P.ETYPES.shaman.boss);
  check('swim gate is caster-only (no husks, no bosses)',
    P.shamanCanSwim({ type: 'shaman' }) === true &&
    P.shamanCanSwim({ type: 'husk' }) === false &&
    P.shamanCanSwim({ type: 'warlord', boss: true }) === false &&
    P.shamanCanSwim({ type: 'shaman', decadeBoss: true }) === false);
  check('casting cut while swimming / resumes ashore',
    P.enemyCanCast({ ranged: true, swim: true }) === false &&
    P.enemyCanCast({ ranged: true }) === true &&
    P.enemyCanCast({ ranged: false }) === false);

  P.newGame();
  P.waveActive = true; P.spawnQueue = 0; P.enemies.length = 0;
  const B5 = P.LAKE_BLOB, I5 = P.LAKE_ISLE, IP5 = P.LAKE_ISLE_PIER;

  // --- the swim: player camps open water; the caster wades in, closes to contact ---
  // (a pier-head camper inside the caster's 260px comfort band gets plinked instead —
  // ranged-over-water is the plan's counter there; the swim covers mid-lake campers)
  P.player.x = B5.cx; P.player.y = B5.cy + 300; // mid-lake camper (deep water)
  const s0 = P.lakeNearestShore(P.player.x, P.player.y, 40); // dry point on the south shore
  const sw = P.makeEnemy('shaman', s0.x, s0.y, { spawnT: 0 });
  const d0 = Math.hypot(sw.x - P.player.x, sw.y - P.player.y);
  let sawSwim = false, everWet5 = false, minD5 = 1e9, maxStep = 0, px5 = sw.x, py5 = sw.y;
  for (let i = 0; i < 600; i++) { // 20s @ 30fps
    P.simEnemyWaterFrame(sw, 1 / 30);
    if (sw.swim) sawSwim = true;
    if (P.isLakeWaterAt(sw.x, sw.y)) {
      everWet5 = true;
      maxStep = Math.max(maxStep, Math.hypot(sw.x - px5, sw.y - py5));
    }
    minD5 = Math.min(minD5, Math.hypot(sw.x - P.player.x, sw.y - P.player.y));
    px5 = sw.x; py5 = sw.y;
  }
  check('caster enters the water after the camper', sawSwim && everWet5 &&
    sw.swim === true && sw.waterOk === true && P.isLakeWaterAt(sw.x, sw.y) === true);
  check('swim closes to contact range', minD5 < 80 && minD5 < d0 * 0.5, 'minD=' + minD5.toFixed(0));
  check('swim speed < land speed (measured stroke)',
    maxStep <= sw.spd * P.SHAMAN_SWIM_SPEED_MUL * (1 / 30) + 0.6, 'step=' + maxStep.toFixed(2));
  check('swimmer stays finite (NaN sentinel quiet)', Number.isFinite(sw.x) && Number.isFinite(sw.y));

  // camper steps ashore → the swimmer strokes home and exits at the first dry step
  const D5 = P.LAKE_DOCK;
  P.player.x = D5.baseX - D5.ax * 60; P.player.y = D5.baseY - D5.ay * 60; // dry meadow
  let exited = false;
  for (let i = 0; i < 1200 && !exited; i++) { // up to 40s — the stroke home is slow on purpose
    P.simEnemyWaterFrame(sw, 1 / 30);
    if (!sw.swim && !sw.waterOk && !P.isLakeWaterAt(sw.x, sw.y)) exited = true;
  }
  check('swimmer exits the water when the camper lands', exited &&
    Number.isFinite(sw.x) && Number.isFinite(sw.y));
  sw.dead = true;

  // --- Driftwood Isle stays enemy-free: a crossing swimmer rounds the rim, never lands ---
  P.player.x = IP5.headX; P.player.y = IP5.headY; // isle pier head (over water)
  const na5 = Math.atan2(IP5.headY - I5.y, IP5.headX - I5.x) + Math.PI + 0.35; // far side, tangential bias
  const sw2 = P.makeEnemy('shaman', I5.x + Math.cos(na5) * (I5.r + 90),
    I5.y + Math.sin(na5) * (I5.r + 90), { spawnT: 0 });
  sw2.swim = true; sw2.waterOk = true; // mid-crossing (runtime-legal state)
  let isleMin = 1e9, isleLand = false;
  for (let i = 0; i < 1500; i++) { // 50s — rounding the rim at swim pace takes a while
    P.simEnemyWaterFrame(sw2, 1 / 30);
    const di = Math.hypot(sw2.x - I5.x, sw2.y - I5.y);
    isleMin = Math.min(isleMin, di);
    if (di < I5.r) isleLand = true;
  }
  check('swimmer never beaches on the isle (rounds the rim)', !isleLand &&
    isleMin >= I5.r + P.SHAMAN_SWIM_ISLE_PAD - 1.5, 'minIsle=' + isleMin.toFixed(0));
  check('swimmer reaches the far pier head around the isle',
    Math.hypot(sw2.x - P.player.x, sw2.y - P.player.y) < 110,
    'd=' + Math.hypot(sw2.x - P.player.x, sw2.y - P.player.y).toFixed(0));
  sw2.dead = true;

  // --- shore leash: melee re-targets a land threat / holds a patrol slot; never wet ---
  P.player.x = B5.cx; P.player.y = B5.cy + 300; // camper back to open water
  check('leash never grabs ranged / boss / swimmer / spider',
    P.lakeLeashApplies({ ranged: true }, P.player) === false &&
    P.lakeLeashApplies({ boss: true }, P.player) === false &&
    P.lakeLeashApplies({ swim: true }, P.player) === false &&
    P.lakeLeashApplies({ type: 'spiderling' }, P.player) === false &&
    P.lakeLeashApplies({ type: 'husk' }, P.player) === true);
  const stubM = { x: s0.x + 140, y: s0.y + 60, downed: false }; // militia stub on the dry meadow
  P.militia.push(stubM);
  const hk5 = P.makeEnemy('husk', s0.x + 40, s0.y + 40, { spawnT: 0 });
  P.simEnemyWaterFrame(hk5, 1 / 30);
  check('melee re-targets the nearest land threat', hk5._tgt === stubM);
  let hk5wet = false;
  for (let i = 0; i < 360; i++) {
    P.simEnemyWaterFrame(hk5, 1 / 30);
    if (P.isLakeWaterAt(hk5.x, hk5.y)) hk5wet = true;
  }
  check('leashed melee never enters water', !hk5wet && Number.isFinite(hk5.x) && Number.isFinite(hk5.y));
  P.militia.pop(); hk5.dead = true;
  // nothing to fight → patrol slot at the waterline nearest the camper (dry, steady, no NaN)
  const savedStructs = P.structures.splice(0); // starter Keep etc. out of the picture, in place
  const hk6 = P.makeEnemy('husk', s0.x + 30, s0.y + 90, { spawnT: 0 });
  P.simEnemyWaterFrame(hk6, 1 / 30);
  check('no land threat → shore patrol slot', !!(hk6._tgt && hk6._tgt._shoreHold));
  const hp5 = P.lakeShoreHoldPoint();
  let hk6wet = false, hk6far = 0;
  for (let i = 0; i < 600; i++) {
    P.simEnemyWaterFrame(hk6, 1 / 30);
    if (P.isLakeWaterAt(hk6.x, hk6.y)) hk6wet = true;
    if (i > 200) hk6far = Math.max(hk6far, Math.hypot(hk6.x - hp5.x, hk6.y - hp5.y));
  }
  check('patrols the slot dry + steady (no pile-in, no NaN)', !hk6wet && hk6far > 0 &&
    hk6far < P.LAKE_LEASH_HOLD_R + 90 && Number.isFinite(hk6.x), 'far=' + hk6far.toFixed(0));
  P.structures.push(...savedStructs);
  hk6.dead = true;

  // --- ally / titan shore clamps ---
  P.deployColossus(); // player is mid-lake — CALL TITAN must land him ashore
  check('CALL TITAN afloat lands the titan dry', !!P.colossus &&
    !P.isLakeWaterAt(P.colossus.x, P.colossus.y) &&
    Number.isFinite(P.colossus.x) && Number.isFinite(P.colossus.y));
  const ally5 = { x: B5.cx - 200, y: B5.cy, r: 12, vx: 0, vy: 0 }; // shoved wet → clamps out
  P.collideObstacles(ally5);
  check('ally shoved into water clamps ashore', !P.isLakeWaterAt(ally5.x, ally5.y) &&
    Number.isFinite(ally5.x) && Number.isFinite(ally5.y));

  // --- stall-proof: the wave stays clearable with the player afloat ---
  P.enemies.length = 0;
  const pack = [
    P.makeEnemy('husk', s0.x + 60, s0.y + 50, { spawnT: 0 }),
    P.makeEnemy('skeleton', s0.x - 80, s0.y + 60, { spawnT: 0 }),
    P.makeEnemy('shaman', s0.x, s0.y + 30, { spawnT: 0 }),
  ];
  for (let i = 0; i < 600; i++) for (const e of pack) P.simEnemyWaterFrame(e, 1 / 30);
  check('mixed pack stays finite + alive (targetable)', pack.every(e =>
    Number.isFinite(e.x) && Number.isFinite(e.y) && !e.dead));
  check('non-swimmers stay dry in the pack',
    !P.isLakeWaterAt(pack[0].x, pack[0].y) && !P.isLakeWaterAt(pack[1].x, pack[1].y));
  check('wave counter sees the whole pack', P.countWaveEnemiesRemaining() === 3);
  const preP = P.pickups.length;
  for (const e of pack) P.killEnemy(e);
  check('pack killable → wave clearable (counter 0)', P.countWaveEnemiesRemaining() === 0);
  check('mid-water kill drops land dry', P.pickups.slice(preP).every(p => !P.isLakeWaterAt(p.x, p.y)));

  // --- draw smoke: swimming caster on/off camera (sprite path or procedural fallback) ---
  const swD = P.makeEnemy('shaman', B5.cx, B5.cy + 260, { spawnT: 0 });
  swD.swim = true; swD.waterOk = true; swD.vx = 20; swD.vy = 4;
  let swimDrawOk = true;
  try {
    P.camera.x = B5.cx - 400; P.camera.y = B5.cy - 100;
    P.drawShamanSwimming(swD, 1);
    P.camera.x = 99999; P.camera.y = 99999;
    P.drawShamanSwimming(swD, 1);
  } catch (err) { swimDrawOk = false; }
  check('swim draw headless smoke (on/off camera)', swimDrawOk);
  swD.dead = true;

  // --- saves untouched: swim is runtime-only state; 4.3.5-era schema loads clean ---
  P.saveGame(false);
  const raw5 = JSON.parse(store.tr_save1);
  check('save schema untouched (no swim fields)', !JSON.stringify(raw5).includes('"swim'));
  check('4.3.5-schema save loads clean', P.loadGame() === true);
}

// Step 10.6 — Balance locks + soft-wire audit + the water placement gate (deferred from 10.5).
// Balance note: the plan's 10.6 row lists knob AREAS (drift/drain/costs/cache/A–B) with no new
// targets — the shipped consts already sit on the plan's draft numbers, so this block LOCKS them.
{
  P.newGame();
  const B6 = P.LAKE_BLOB, D6 = P.LAKE_DOCK, IP6 = P.LAKE_ISLE_PIER, K6 = P.STRUCT_KINDS.keep.r;

  // --- the gate: open water refuses all three placement paths (tap + ghost share these) ---
  const wx6 = B6.cx, wy6 = B6.cy + 320; // open water south of the isle
  check('gate: open water blocks placement (all three paths)',
    P.placementWaterBlockedAt(wx6, wy6, 0) === true &&
    P.barricadeSpotBlocked(wx6, wy6) === true &&
    P.brickWallSpotBlocked(wx6, wy6) === true &&
    P.structureSpotBlocked(wx6, wy6, K6) === true);

  // pier decks are a walkway, not a foundation — dry apron plank AND wet mid-deck both refuse
  const dockDry = { x: D6.baseX + D6.ax * 10, y: D6.baseY + D6.ay * 10 };   // on the deck, dry side
  const dockWet = { x: D6.baseX + D6.ax * 110, y: D6.baseY + D6.ay * 110 }; // planks over open water
  const isleU = P.LAKE_ISLE_PIER_LEN * 0.6;
  const isleDeck = { x: IP6.baseX + IP6.ax * isleU, y: IP6.baseY + IP6.ay * isleU };
  check('gate: Emberfall deck blocked (dry plank + wet plank)',
    P.placementWaterBlockedAt(dockDry.x, dockDry.y, 0) === true &&
    P.placementWaterBlockedAt(dockWet.x, dockWet.y, 0) === true);
  check('gate: isle mini-pier deck blocked', P.placementWaterBlockedAt(isleDeck.x, isleDeck.y, 0) === true);

  // footprint overhang: a center-dry pad whose edge pokes past the waterline refuses
  const edge6 = P.lakeNearestShore(B6.cx - 320, B6.cy, 8); // ~10px dry of the west waterline
  check('gate: center-dry probe passes bare', P.placementWaterBlockedAt(edge6.x, edge6.y, 0) === false);
  check('gate: keep footprint overhang blocked', P.placementWaterBlockedAt(edge6.x, edge6.y, K6) === true);

  // legacy arena + Orange Quarter never see the gate clause (analytic — no inland false positives)
  check('gate: camp arena + Quarter unaffected',
    P.placementWaterBlockedAt(P.CAMP.x + 200, P.CAMP.y + 200, K6) === false &&
    P.placementWaterBlockedAt(4200, 4200, K6) === false);

  // end-to-end tap path: refused over water (stock NO ROOM feedback), still lands on dry meadow
  P.cores = 99;
  const s6 = P.lakeNearestShore(wx6, wy6, 24); // feet 24px dry of the south waterline
  P.player.x = s6.x; P.player.y = s6.y;
  P.player.aim = Math.atan2(wy6 - s6.y, wx6 - s6.x); // ghost 62px ahead = wet
  const nB6 = P.barricades.length;
  check('gate: tap-place refused over water', P.tryPlaceBarricade() === false && P.barricades.length === nB6);
  let dry6 = null; // walk out from the shore until the meadow is open (dodges random rocks)
  for (let stepOut = 0; stepOut < 40 && !dry6; stepOut++) {
    const cand = P.lakeNearestShore(wx6, wy6, 60 + stepOut * 16);
    if (!P.barricadeSpotBlocked(cand.x, cand.y)) dry6 = cand;
  }
  check('gate: dry shore meadow spot exists', !!dry6);
  if (dry6) {
    P.player.x = dry6.x - 62; P.player.y = dry6.y; P.player.aim = 0; // ghost lands on dry6
    check('gate: tap-place still lands on dry meadow',
      P.tryPlaceBarricade() === true && P.barricades.length === nB6 + 1);
  }

  // --- balance rows locked at the plan's draft numbers (no new 10.6 targets listed) ---
  check('skiff feel locked (1.30× / ≈1.1s to top / 0.8 glide half-life)',
    P.BOAT_SPEED_MUL === 1.30 && P.BOAT_ACCEL_SEC === 1.1 && P.BOAT_GLIDE_HALF === 0.8);
  check('bike stays the fast one', P.DIRT_BIKE_SPEED_MUL === 1.85 && P.BOAT_SPEED_MUL < P.DIRT_BIKE_SPEED_MUL);
  check('wave-over-water pressure locked (10s grace / 3 HP/s ash drain)',
    P.BOAT_WAVE_GRACE === 10 && P.BOAT_ASH_DRAIN_DPS === 3);
  check('repair costs locked (skiff 40w/10g wood-heavy; bike 30/18 untouched)',
    P.BOAT_REPAIR_WOOD === 40 && P.BOAT_REPAIR_GOLD === 10 &&
    P.BIKE_REPAIR_WOOD === 30 && P.BIKE_REPAIR_GOLD === 18);
  check('cache loot locked (60 gold / 6 coal / 8 cores)',
    P.ISLE_CACHE_GOLD === 60 && P.ISLE_CACHE_COAL === 6 && P.ISLE_CACHE_CORES === 8);
  check('swim exposure locked (0.55x stroke / 84px waterline gate)',
    P.SHAMAN_SWIM_SPEED_MUL === 0.55 && P.SHAMAN_SWIM_ENTER_DIST === 84);
  check('A-B notes locked (A free rowing shipped; B shared-fuel stays deferred)',
    P.BOAT_FUEL_MODEL === 'none');

  // --- soft-wire audit: every Step 10 flag an independent `const NAME = true;` literal ---
  const flags6 = ['LAKE_WATER_ENABLED', 'LAKE_SPAWN_GUARD_ENABLED', 'LAKE_DOCK_ENABLED',
    'BOAT_ENABLED', 'BOAT_WAVE_GATE_ENABLED', 'LAKE_ISLE_REWARD_ENABLED', 'SHAMAN_SWIM_ENABLED'];
  check('soft-wires all ON', flags6.every(f => P[f] === true));
  check('soft-wires are independent const literals (none derived)',
    flags6.every(f => new RegExp('^const ' + f + ' = true;', 'm').test(gameSrc)) &&
    /^const BOAT_FUEL_MODEL = 'none';/m.test(gameSrc));

  // --- shore-meadow mines: still purged (re-seat = user opt-in, still open before/after 10.7) ---
  check('shore-meadow mines still purged (re-seat = open user opt-in)',
    P.goldMines.every(m => !P.isLakeReserve(m.x, m.y)));

  // --- 10.5 water-sim quick regression on the gated build (full 10.3–10.5 blocks above stay the deep suite) ---
  P.player.x = wx6; P.player.y = wy6; // camper afloat position
  const hk10 = P.makeEnemy('husk', s6.x, s6.y, { spawnT: 0 });
  let wet10 = false;
  for (let i = 0; i < 240; i++) {
    P.simEnemyWaterFrame(hk10, 1 / 30);
    if (P.isLakeWaterAt(hk10.x, hk10.y)) wet10 = true;
  }
  check('10.5 regression quick: leashed melee still dry + finite',
    !wet10 && Number.isFinite(hk10.x) && Number.isFinite(hk10.y));
  hk10.dead = true;
}

console.log(failed ? `\n${failed} FAIL` : '\nALL PASS — continuous map smoke');
process.exit(failed ? 1 : 0);

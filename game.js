/* ==================================================================
   TEMPORAL RIFT: ASHEN VANGUARD  —  v2 "mobile / APK" build
   ------------------------------------------------------------------
   Original-IP action RPG prototype fusing:
     · martial ki-style combat + transformations   (action-RPG arcs)
     · sci-fi gunplay, grenades, hard cover        (tactical shooters)
     · night-wave undead/ork horde survival        (wave shooters)
     · open zones, NPC quests, skill tree, story   (open-world RPGs)
   Signature system: a horde "learning engine" that builds
   resistance to over-used player tactics and hunts camping spots.
   All names/designs are original — no copyrighted IP.
   ------------------------------------------------------------------
   Fully touch-capable (virtual joystick + ability buttons + auto-aim)
   so it can be wrapped as an Android APK via Capacitor (see README).
   ================================================================== */
'use strict';

// ============================ CANVAS ==============================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = innerWidth; VH = innerHeight;
  canvas.width = VW * DPR; canvas.height = VH * DPR;
  canvas.style.width = VW + 'px'; canvas.style.height = VH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener('resize', resize); resize();

// ============================ HELPERS =============================
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const lerp = (a, b, t) => a + (b - a) * t;
const $ = id => document.getElementById(id);
// deterministic hash noise for world decoration
function hash2(x, y) { let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }

// ============================ WORLD ===============================
const WORLD = { w: 3600, h: 3600 };
const CAMP = { x: WORLD.w / 2, y: WORLD.h / 2 };
const FORT  = { x: WORLD.w - 1000, y: 120, w: 880, h: 820 };            // Northreach Fort (stone)
const ASH   = { x: 120, y: WORLD.h - 1050, w: 950, h: 930 };            // The Ashen Reach
const MARSH = { x: WORLD.w - 1150, y: WORLD.h - 1150, w: 1030, h: 1030 }; // Duskmere Marsh

const inRect = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
const REGIONS = [
  { name: 'NORTHREACH FORT', test: (x, y) => inRect(x, y, FORT) },
  { name: 'THE ASHEN REACH', test: (x, y) => inRect(x, y, ASH) },
  { name: 'DUSKMERE MARSH',  test: (x, y) => inRect(x, y, MARSH) },
  { name: 'EMBERFALL CAMP',  test: (x, y) => dist2(x, y, CAMP.x, CAMP.y) < 300 * 300 },
  { name: 'THE SHATTERED FIELDS', test: () => true },
];
let currentRegion = '';

function zoneAt(x, y) {
  if (dist2(x, y, CAMP.x, CAMP.y) < 300 * 300) return 'stone';
  if (inRect(x, y, FORT)) return 'stone';
  if (inRect(x, y, ASH)) return 'ash';
  if (inRect(x, y, MARSH)) return 'marsh';
  return 'grass';
}

// ---------- procedural ground textures (the "real textures") ----------
const TILE = 96;
const tileTex = {};
function makeTileTex(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d');
  if (kind === 'grass') {
    g.fillStyle = '#17251a'; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 260; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .5 ? '#1b2c1e' : v < .8 ? '#142016' : '#20331f';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(1, 3), rand(1, 3));
    }
    g.strokeStyle = 'rgba(60,110,60,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const x = rand(0, TILE), y = rand(0, TILE);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-2, 2), y - rand(3, 7)); g.stroke();
    }
  } else if (kind === 'ash') {
    g.fillStyle = '#211d1c'; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 240; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .5 ? '#282322' : v < .8 ? '#1b1817' : '#332c28';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(1, 4), rand(1, 4));
    }
    g.strokeStyle = 'rgba(90,60,40,0.35)';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      let x = rand(0, TILE), y = rand(0, TILE);
      g.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += rand(-14, 14); y += rand(-14, 14); g.lineTo(x, y); }
      g.stroke();
    }
    // faint ember glints
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,110,40,0.25)'; g.fillRect(rand(0, TILE), rand(0, TILE), 2, 2); }
  } else if (kind === 'marsh') {
    g.fillStyle = '#132220'; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 240; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .45 ? '#16292665' : v < .75 ? '#0e1a18' : '#1b332f';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(1, 4), rand(1, 3));
    }
    // still-water pools with ripple rings
    for (let i = 0; i < 3; i++) {
      const x = rand(10, TILE - 10), y = rand(10, TILE - 10), r = rand(6, 14);
      g.fillStyle = 'rgba(30,60,66,0.55)';
      g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(110,160,150,0.22)'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(x, y, r * 0.6, r * 0.35, 0, 0, TAU); g.stroke();
    }
  } else { // stone
    g.fillStyle = '#232733'; g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(10,12,18,0.8)'; g.lineWidth = 2;
    const s = TILE / 3;
    for (let i = 0; i <= 3; i++) {
      g.beginPath(); g.moveTo(0, i * s + (i % 2 ? 4 : 0)); g.lineTo(TILE, i * s); g.stroke();
      g.beginPath(); g.moveTo(i * s + (i % 2 ? 6 : 0), 0); g.lineTo(i * s, TILE); g.stroke();
    }
    for (let i = 0; i < 180; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .5 ? '#272b39' : v < .8 ? '#1e2230' : '#2d3242';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(1, 3), rand(1, 3));
    }
  }
  return c;
}

// ---------- obstacles, decor, camp props ----------
let obstacles = [];   // {x,y,r,type,seed}  type: rock|crate|tree|pillar
let decor = [];       // {x,y,type,seed}
let decals = [];      // splats: {x,y,r,color,life,maxLife}

function buildWorld() {
  obstacles = []; decor = []; decals = [];
  const tryPlace = (x, y, r, type) => {
    if (dist2(x, y, CAMP.x, CAMP.y) < 360 * 360) return false;
    if (obstacles.some(o => dist2(x, y, o.x, o.y) < (o.r + r + 70) ** 2)) return false;
    obstacles.push({ x, y, r, type, seed: Math.random() * 9 });
    return true;
  };
  // scattered rocks & supply crates
  for (let i = 0; i < 28; i++)
    tryPlace(rand(160, WORLD.w - 160), rand(160, WORLD.h - 160), rand(36, 62), i % 2 ? 'rock' : 'crate');
  // forest patches in the grass fields + dead trees in the marsh
  for (let i = 0; i < 52; i++) {
    const cx = rand(300, WORLD.w - 300), cy = rand(300, WORLD.h - 300);
    const z = zoneAt(cx, cy);
    if (z === 'grass') tryPlace(cx, cy, 14, 'tree');
    else if (z === 'marsh') tryPlace(cx, cy, 12, 'deadtree');
  }
  // ruined pillars around the fort + ash reach (fallen kingdom vibe)
  for (let i = 0; i < 9; i++)
    tryPlace(FORT.x + rand(60, FORT.w - 60), FORT.y + rand(60, FORT.h - 60), 20, 'pillar');
  for (let i = 0; i < 6; i++)
    tryPlace(ASH.x + rand(60, ASH.w - 60), ASH.y + rand(60, ASH.h - 60), 20, 'pillar');
  // ground decor
  for (let i = 0; i < 1400; i++) {
    const x = rand(40, WORLD.w - 40), y = rand(40, WORLD.h - 40);
    const z = zoneAt(x, y);
    const roll = hash2(x, y);
    let type;
    if (z === 'grass') type = roll < .5 ? 'tuft' : roll < .75 ? 'pebble' : roll < .9 ? 'flower' : 'mushroom';
    else if (z === 'ash') type = roll < .45 ? 'bone' : roll < .8 ? 'pebble' : 'skull';
    else if (z === 'marsh') type = roll < .55 ? 'reed' : roll < .8 ? 'lily' : 'mushroom';
    else type = roll < .6 ? 'crack' : 'pebble';
    decor.push({ x, y, type, seed: roll * 9 });
  }
}

// =========================== INPUT ================================
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.body.classList.add('touch');
$('touchNote').textContent = IS_TOUCH
  ? '📱 Touch mode: left thumb = move · right buttons = fight · auto-aim assists you'
  : 'Tip: this build also runs with full touch controls on phones / as an APK.';

const keys = {};
let mouse = { x: 0, y: 0, down: false, rdown: false };
const touch = { fire: false, beamHeld: false, joy: { x: 0, y: 0, active: false } };

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (dialogOpen) { advanceDialog(); return; }
  if (layoutEditing) { if (e.code === 'KeyP' || e.code === 'Escape') finishLayoutEdit(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') toggleSettings();
  if (e.code === 'KeyF') tryTransform();
  if (e.code === 'KeyQ') tryNova();
  if (e.code === 'KeyE') tryGrenade();
  if (e.code === 'KeyK') toggleTree();
  if (e.code === 'KeyT') tryTalk();
  if (e.code === 'KeyB') tryBuild();
});
addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (dialogOpen) { advanceDialog(); return; }
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) mouse.rdown = true;
});
addEventListener('mouseup', e => {
  if (e.button === 0) mouse.down = false;
  if (e.button === 2) { mouse.rdown = false; releaseBeam(); }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ---------- virtual joystick ----------
const joyZone = $('joyZone'), joyBase = $('joyBase'), joyKnob = $('joyKnob');
let joyId = null, joyOrigin = null;
joyZone.addEventListener('pointerdown', e => {
  if (layoutEditing) return;
  const zr = joyZone.getBoundingClientRect(); // base/knob are absolute inside the (movable) zone
  joyId = e.pointerId; joyOrigin = { x: e.clientX, y: e.clientY };
  joyBase.style.display = joyKnob.style.display = 'block';
  joyBase.style.left = (e.clientX - zr.left - 55) + 'px'; joyBase.style.top = (e.clientY - zr.top - 55) + 'px';
  joyKnob.style.left = (e.clientX - zr.left - 24) + 'px'; joyKnob.style.top = (e.clientY - zr.top - 24) + 'px';
  touch.joy.active = true;
  joyZone.setPointerCapture(e.pointerId);
});
joyZone.addEventListener('pointermove', e => {
  if (e.pointerId !== joyId || !joyOrigin) return;
  const zr = joyZone.getBoundingClientRect();
  let dx = e.clientX - joyOrigin.x, dy = e.clientY - joyOrigin.y;
  const d = Math.hypot(dx, dy);
  if (d > 46) { dx = dx / d * 46; dy = dy / d * 46; }
  joyKnob.style.left = (joyOrigin.x - zr.left + dx - 24) + 'px';
  joyKnob.style.top = (joyOrigin.y - zr.top + dy - 24) + 'px';
  touch.joy.x = dx / 46; touch.joy.y = dy / 46;
});
function joyEnd(e) {
  if (e.pointerId !== joyId) return;
  joyId = null; joyOrigin = null;
  touch.joy.x = touch.joy.y = 0; touch.joy.active = false;
  joyBase.style.display = joyKnob.style.display = 'none';
}
joyZone.addEventListener('pointerup', joyEnd);
joyZone.addEventListener('pointercancel', joyEnd);

// ---------- ability buttons ----------
function bindHold(id, onDown, onUp) {
  const el = $(id);
  el.addEventListener('pointerdown', e => { if (layoutEditing) return; e.preventDefault(); el.classList.add('held'); onDown && onDown(); });
  const up = e => { el.classList.remove('held'); onUp && onUp(); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
bindHold('btnFire', () => touch.fire = true,  () => touch.fire = false);
bindHold('btnBeam', () => touch.beamHeld = true, () => { touch.beamHeld = false; releaseBeam(); });
bindHold('btnNova', () => tryNova());
bindHold('btnGren', () => tryGrenade());
bindHold('btnDash', () => tryDash(true));
bindHold('btnForm', () => tryTransform());
bindHold('btnBuild', () => tryBuild());
$('btnTalk').addEventListener('pointerdown', e => { e.preventDefault(); tryTalk(); });
$('btnMenu').addEventListener('pointerdown', e => { e.preventDefault(); toggleTree(); });

// ==================== VERSION & UPDATE CHECK ======================
const APP_VERSION = '2.4';
$('appVer').textContent = 'v' + APP_VERSION;

// Sideloaded APKs can't auto-update, so ping GitHub for a newer release
// and offer a download link on the title screen. Fire-and-forget: any
// failure (offline, rate limit, bad JSON) is silently ignored.
function cmpVersions(a, b) { // numeric compare: "2.10" > "2.9"
  const pa = String(a).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
function checkForUpdate() {
  try {
    fetch('https://api.github.com/repos/drpeppermrpib/temporal-rift/releases/latest')
      .then(r => r.ok ? r.json() : null)
      .then(rel => {
        if (!rel || !rel.tag_name) return;
        const remote = String(rel.tag_name).replace(/^v/i, '');
        if (cmpVersions(remote, APP_VERSION) <= 0) return;
        const banner = $('updateBanner');
        $('updateText').textContent = '⬆ UPDATE v' + remote + ' AVAILABLE — TAP TO DOWNLOAD';
        banner.classList.remove('hidden');
        banner.onclick = () => { if (rel.html_url) window.open(rel.html_url, '_blank'); };
        $('updateDismiss').onclick = e => { e.stopPropagation(); banner.classList.add('hidden'); };
      })
      .catch(() => {});
  } catch (e) { /* never block the game */ }
}
checkForUpdate();

// ==================== SETTINGS & SAVE SYSTEM ======================
const SAVE_KEY = 'tr_save1', SETTINGS_KEY = 'tr_settings';
let settingsOpen = false;
const settings = { shake: true, dmgText: true, uiScale: 'normal', layout: null };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
function persistSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }

const UI_SCALES = ['small', 'normal', 'large'];
function applyUiScale() {
  document.body.classList.remove('ui-small', 'ui-large');
  if (settings.uiScale === 'small') document.body.classList.add('ui-small');
  if (settings.uiScale === 'large') document.body.classList.add('ui-large');
}
applyUiScale();

// ---------- controls placement (custom layout) ----------
function applyLayout() {
  const tb = $('tbtns'), jz = $('joyZone');
  const L = settings.layout || {};
  if (L.tbtns) { tb.style.right = L.tbtns.right + 'px'; tb.style.bottom = L.tbtns.bottom + 'px'; }
  else { tb.style.right = ''; tb.style.bottom = ''; }
  if (L.joy) {
    jz.style.left = L.joy.left + 'px'; jz.style.bottom = L.joy.bottom + 'px';
    jz.style.width = L.joy.w + 'px'; jz.style.height = L.joy.h + 'px';
  } else { jz.style.left = ''; jz.style.bottom = ''; jz.style.width = ''; jz.style.height = ''; }
}
applyLayout();

let layoutEditing = false;
function ensureLayout() {
  if (!settings.layout) settings.layout = { tbtns: null, joy: null };
  return settings.layout;
}
function positionJoyPlaceholder() {
  // joystick base is normally invisible until touched — during editing show it
  // centered in the zone so the user can see what they're dragging
  const zr = $('joyZone').getBoundingClientRect();
  const jb = $('joyBase');
  jb.style.display = 'block';
  jb.style.left = (zr.width / 2 - 55) + 'px';
  jb.style.top = (zr.height / 2 - 55) + 'px';
}
function setLayoutEditing(on) {
  layoutEditing = on;
  document.body.classList.toggle('layout-editing', on);
  $('layoutBar').classList.toggle('hidden', !on);
  const jb = $('joyBase'), jk = $('joyKnob');
  if (on) positionJoyPlaceholder();
  else { jb.style.display = 'none'; jk.style.display = 'none'; jb.style.left = ''; jb.style.top = ''; }
}
function finishLayoutEdit() {
  persistSettings();
  setLayoutEditing(false);
  $('settings').classList.remove('hidden'); // back to the pause menu (settingsOpen stayed true)
}
function makeDraggable(el, apply) {
  el.addEventListener('pointerdown', e => {
    if (!layoutEditing) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const offX = e.clientX - r.left, offY = e.clientY - r.top;
    const move = ev => {
      const left = clamp(ev.clientX - offX, 0, VW - r.width);
      const top = clamp(ev.clientY - offY, 0, VH - r.height);
      apply(left, top, r.width, r.height);
    };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });
}
makeDraggable($('tbtns'), (left, top, w, h) => {
  ensureLayout().tbtns = { right: Math.round(VW - left - w), bottom: Math.round(VH - top - h) };
  applyLayout();
});
makeDraggable($('joyZone'), (left, top, w, h) => {
  ensureLayout().joy = { left: Math.round(left), bottom: Math.round(VH - top - h), w: Math.round(w), h: Math.round(h) };
  applyLayout();
});

function snapshot() {
  return {
    v: 2,
    wavesCompleted: waveActive ? wave - 1 : wave,
    cores, kills, totalCores, runTime,
    player: { hp: player.hp, ki: player.ki, level: player.level, xp: player.xp, xpNext: player.xpNext, sp: player.sp },
    gear: gear.map(u => u.lvl),
    skills: { ...skillRanks },
    quest: { idx: questIdx, stage: questStage, progress: questProgress },
    mira: { idx: miraIdx, rewarded: miraRewarded },
    tally: { ...tally },
  };
}
function saveGame(announce) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot()));
    if (announce) addFloater(player.x, player.y - 46, '💾 GAME SAVED', '#7CFC00', true);
  } catch (e) {}
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  let s;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!s || s.v !== 2) return false;
  newGame();                       // clean world + fresh entities first
  wave = s.wavesCompleted;
  waveActive = false; spawnQueue = 0; enemies = []; graceT = 0; chest = null;
  cores = s.cores; kills = s.kills; totalCores = s.totalCores; runTime = s.runTime;
  gear.forEach((u, i) => u.lvl = s.gear[i] || 0);
  Object.assign(skillRanks, s.skills);
  Object.assign(tally, s.tally);
  questIdx = s.quest.idx; questStage = s.quest.stage; questProgress = s.quest.progress;
  miraIdx = s.mira.idx; miraRewarded = s.mira.rewarded;
  player.level = s.player.level; player.xp = s.player.xp; player.xpNext = s.player.xpNext;
  player.sp = s.player.sp;
  player.hp = clamp(s.player.hp, 1, maxHp());
  player.ki = clamp(s.player.ki, 0, maxKi());
  player.grenades = maxGrenades();
  updateQuestHud();
  $('hud').classList.remove('hidden');
  $('btnMenu').classList.remove('hidden');
  $('btnSettings').classList.remove('hidden');
  if (wave <= 0) { startWave(); }   // saved mid-wave-1: just replay it
  else { openShop(); banner('WELCOME BACK', `resuming after wave ${wave}`); }
  return true;
}

function toggleSettings() {
  if (state !== 'playing' && state !== 'shop' && !settingsOpen) return;
  settingsOpen = !settingsOpen;
  $('settings').classList.toggle('hidden', !settingsOpen);
  if (settingsOpen) refreshToggles();
}
function refreshToggles() {
  $('togShake').classList.toggle('on', settings.shake);
  $('togDmg').classList.toggle('on', settings.dmgText);
  $('uiSizeVal').textContent = settings.uiScale.toUpperCase();
}

// ========================= GAME STATE =============================
let state = 'menu'; // menu | playing | shop | over
let paused = false, treeOpen = false;
let wave = 0, cores = 0, kills = 0, totalCores = 0, runTime = 0;
let camera = { x: 0, y: 0, shake: 0 };
let enemies = [], bolts = [], ebolts = [], grenades = [], pickups = [], particles = [], floaters = [], zaps = [];
let beam = null, beamCharge = 0, charging = false;
let spawnQueue = 0, spawnTimer = 0, waveActive = false;
let shopTimer = 0, victoryShown = false;
let waveCatsUsed = new Set(); // for the "Adaptive Doctrine" quest
let chest = null;             // end-of-wave supply cache {x,y,t}
let graceT = 0;               // looting window between wave end and shop
let barricades = [];          // player-built energy fences {x,y,r,hp,maxHp}
let pulseCd = 0;              // cooldown for the barricade exit-blast
const BARRICADE_MAX = 8, BARRICADE_COST = 3, BARRICADE_HP = 160;

// =========================== PLAYER ===============================
const player = {};
function resetPlayer() {
  Object.assign(player, {
    x: CAMP.x, y: CAMP.y + 120, r: 15, vx: 0, vy: 0,
    hp: 100, ki: 30,
    aim: 0, facing: 1, walk: 0, moving: false,
    fireCd: 0, novaCd: 0, grenCd: 0, dashCd: 0, dashT: 0,
    grenades: 3,
    form: 0,             // 0 base · 1 Ascended · 2 Storm Ascendant
    xp: 0, level: 1, xpNext: 60, sp: 0,
    hurtT: 0,
  });
}

// ================= GEAR SHOP (cores) + SKILLS (SP) ================
const gear = [
  { id: 'rdmg',  name: 'Pulse Coils Mk.II',  desc: '+22% rifle damage',            base: 8,  lvl: 0, max: 6 },
  { id: 'rrate', name: 'Overclock Trigger',  desc: '+15% rifle fire rate',         base: 8,  lvl: 0, max: 5 },
  { id: 'hp',    name: 'Composite Plating',  desc: '+30 max health, full heal',    base: 10, lvl: 0, max: 6 },
  { id: 'ki',    name: 'Aether Cell',        desc: '+25 max aether, +regen',       base: 10, lvl: 0, max: 5 },
  { id: 'beam',  name: 'Nova Focus Lens',    desc: '+28% beam damage & width',     base: 12, lvl: 0, max: 5 },
  { id: 'gren',  name: 'Grenade Bandolier',  desc: '+1 grenade capacity, +blast',  base: 9,  lvl: 0, max: 4 },
  { id: 'boots', name: 'Anti-Grav Boots',    desc: '+8% move speed, faster dash',  base: 7,  lvl: 0, max: 4 },
  { id: 'armor', name: 'Riftsteel Armor',    desc: '−7% damage taken per plate',   base: 11, lvl: 0, max: 5 },
];
const gearLvl = id => gear.find(u => u.id === id).lvl;
const gearCost = u => Math.round(u.base * Math.pow(1.6, u.lvl));

const SKILLS = {
  warrior:  { label: 'WARRIOR', cls: 'warrior', nodes: [
    { id: 'w1', name: 'Steady Coils',   desc: '+20% rifle damage / rank',                     max: 3 },
    { id: 'w2', name: 'Rapid Cycler',   desc: '+15% rifle fire rate / rank',                  max: 3 },
    { id: 'w3', name: 'Heavy Payload',  desc: '+30% grenade damage, +18 blast radius / rank', max: 2 },
    { id: 'w4', name: 'Crushing Nova',  desc: '+40% nova damage, −0.25s cooldown / rank',     max: 2 },
  ]},
  aether:   { label: 'AETHER ARTS', cls: 'aether', nodes: [
    { id: 'a1', name: 'Deep Reserves',  desc: '+25 max aether / rank',                        max: 3 },
    { id: 'a2', name: 'Flow State',     desc: '+40% aether regeneration / rank',              max: 3 },
    { id: 'a3', name: 'Focused Beam',   desc: '+25% Nova Beam damage & width / rank',         max: 3 },
    { id: 'a4', name: 'STORM ASCENDANT', desc: 'Your Ascended form evolves: more power and a lightning aura that arcs to nearby foes', max: 1 },
  ]},
  survivor: { label: 'SURVIVOR', cls: 'survivor', nodes: [
    { id: 's1', name: 'Toughened',      desc: '+30 max health / rank',                        max: 3 },
    { id: 's2', name: 'Fleetfoot',      desc: '+8% move speed, faster dash / rank',           max: 3 },
    { id: 's3', name: 'Scavenger',      desc: 'More core drops, wider pickup magnet / rank',  max: 2 },
    { id: 's4', name: 'Bloodthirst',    desc: 'Every kill restores 3 health',                 max: 1 },
  ]},
};
const skillRanks = {};
const sk = id => skillRanks[id] || 0;

// ---------- combined stat model (gear × skills × form) ----------
function maxHp()         { return 100 + 30 * gearLvl('hp') + 30 * sk('s1') + 6 * (player.level - 1); }
function maxKi()         { return 100 + 25 * gearLvl('ki') + 25 * sk('a1'); }
function formMul()       { return player.form === 2 ? 2.1 : player.form === 1 ? 1.5 : 1; }
function rifleDamage()   { return 11 * (1 + .22 * gearLvl('rdmg')) * (1 + .2 * sk('w1')) * formMul(); }
function rifleInterval() { return 0.19 / ((1 + .15 * gearLvl('rrate')) * (1 + .15 * sk('w2'))); }
function beamDamage()    { return 30 * (1 + .28 * gearLvl('beam')) * (1 + .25 * sk('a3')) * formMul(); }
function beamWidthMul()  { return (1 + .1 * gearLvl('beam')) * (1 + .1 * sk('a3')); }
function novaDamage()    { return 45 * (1 + .4 * sk('w4')) * formMul(); }
function novaCooldown()  { return Math.max(0.5, 1.4 - .25 * sk('w4')); }
function grenadeDamage() { return 80 * (1 + .18 * gearLvl('gren')) * (1 + .3 * sk('w3')); }
function grenadeRadius() { return 120 + 13 * gearLvl('gren') + 18 * sk('w3'); }
function maxGrenades()   { return 3 + gearLvl('gren'); }
function moveSpeed()     { return 235 * (1 + .08 * gearLvl('boots') + .08 * sk('s2')) * (player.form ? 1.25 : 1); }
function kiRegen()       { return (3.5 + 1.1 * gearLvl('ki')) * (1 + .4 * sk('a2')); }
function magnetRange()   { return 150 + 55 * sk('s3'); }
function armorReduce()   { return 0.07 * gearLvl('armor'); } // up to 35% damage taken reduction

// =================== HORDE LEARNING ENGINE ========================
// Damage tallies per category feed a resistance model: lean on one
// tactic past a 25% share and the horde hardens against it (cap 60%).
// It also tracks WHERE you linger and opens spawn rifts nearby.
const CATS = ['rifle', 'beam', 'melee', 'grenade'];
let tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
function resistance(cat) {
  const total = CATS.reduce((s, c) => s + tally[c], 0);
  if (total < 200) return 0;
  return clamp((tally[cat] / total - 0.25) * 1.1, 0, 0.6);
}
let campTrackX = CAMP.x, campTrackY = CAMP.y;

function dealDamage(e, dmg, cat, kbx, kby, kb) {
  const res = resistance(cat);
  const final = dmg * (1 - res);
  tally[cat] += dmg;
  waveCatsUsed.add(cat);
  e.hp -= final;
  e.flash = 0.12;
  if (kb) { e.vx += kbx * kb; e.vy += kby * kb; }
  if (settings.dmgText)
    addFloater(e.x, e.y - e.r * 2.4, Math.round(final), res > 0.3 ? '#ff8a93' : '#fff', res > 0.3);
  player.ki = clamp(player.ki + final * 0.045, 0, maxKi());
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}

// =========================== ENEMIES ==============================
// husk (shambler) · sprinter (fast ghoul) · shaman (ranged caster)
// ravager (ork brute) · warlord (ork boss, every 5 waves)
const ETYPES = {
  husk:     { r: 14, hp: 36,  spd: 60,  dmg: 9,  core: 1,  xp: 6,   ranged: false },
  sprinter: { r: 11, hp: 20,  spd: 135, dmg: 7,  core: 1,  xp: 7,   ranged: false },
  shaman:   { r: 13, hp: 44,  spd: 55,  dmg: 8,  core: 2,  xp: 12,  ranged: true  },
  ravager:  { r: 24, hp: 160, spd: 46,  dmg: 22, core: 3,  xp: 18,  ranged: false },
  warlord:  { r: 40, hp: 950, spd: 40,  dmg: 34, core: 25, xp: 120, ranged: true, boss: true },
};
function hpScale() { return 1 + (wave - 1) * 0.16; }

function spawnEnemy(type) {
  const t = ETYPES[type];
  let x, y;
  if (Math.random() < 0.55) { // learning engine: rift opens near your camping spot
    const a = rand(0, TAU), d = rand(560, 800);
    x = clamp(campTrackX + Math.cos(a) * d, 60, WORLD.w - 60);
    y = clamp(campTrackY + Math.sin(a) * d, 60, WORLD.h - 60);
  } else {
    const side = (Math.random() * 4) | 0;
    x = side < 2 ? (side === 0 ? 60 : WORLD.w - 60) : rand(60, WORLD.w - 60);
    y = side < 2 ? rand(60, WORLD.h - 60) : (side === 2 ? 60 : WORLD.h - 60);
  }
  if (dist2(x, y, player.x, player.y) < 450 * 450) {
    const a = Math.atan2(y - player.y, x - player.x);
    x = clamp(player.x + Math.cos(a) * 480, 60, WORLD.w - 60);
    y = clamp(player.y + Math.sin(a) * 480, 60, WORLD.h - 60);
  }
  const hp = t.hp * hpScale() * (t.boss ? 1 + wave * 0.05 : 1);
  enemies.push({
    type, x, y, r: t.r, vx: 0, vy: 0, hp, maxHp: hp,
    spd: t.spd * (1 + wave * 0.012), dmg: t.dmg,
    core: t.core, xp: t.xp, ranged: t.ranged, boss: !!t.boss,
    atkCd: rand(0.5, 1.5), flash: 0, dead: false,
    walk: rand(0, 9), facing: 1, spawnT: 0.8,
  });
  spawnParticles(x, y, 14, '#b04dff', 3);
}

function killEnemy(e) {
  e.dead = true;
  kills++;
  spawnParticles(e.x, e.y, e.boss ? 60 : 16, e.type === 'ravager' || e.type === 'warlord' ? '#5f8f3a' : '#7a8f5a', e.boss ? 5 : 3);
  decals.push({ x: e.x, y: e.y, r: e.r * 1.6, color: '46,66,36', life: 14, maxLife: 14 });
  camera.shake = Math.min(camera.shake + (e.boss ? 14 : 2), 18);
  const bonus = Math.random() < 0.25 * sk('s3') ? 1 : 0;
  for (let i = 0; i < e.core + bonus; i++)
    pickups.push({ x: e.x + rand(-14, 14), y: e.y + rand(-14, 14), type: 'core', t: 0 });
  if (Math.random() < (e.boss ? 1 : 0.06))
    pickups.push({ x: e.x, y: e.y, type: 'health', t: 0 });
  if (sk('s4')) player.hp = Math.min(maxHp(), player.hp + 3);
  gainXp(e.xp);
  questEvent('kill', e);
}

function gainXp(n) {
  player.xp += n;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.sp++;
    player.xpNext = Math.round(player.xpNext * 1.35);
    player.hp = Math.min(maxHp(), player.hp + 25);
    addFloater(player.x, player.y - 40, 'LEVEL UP! +1 SKILL POINT ✦', '#ffd54a', true);
    spawnParticles(player.x, player.y, 26, '#ffd54a', 4);
  }
}

// ====================== NPCS, QUESTS & STORY ======================
const NPC  = { x: CAMP.x + 80, y: CAMP.y - 30, r: 14, name: 'Quartermaster Bramm', role: 'quest' };
const VEX  = { x: FORT.x + FORT.w / 2, y: FORT.y + FORT.h / 2, r: 14, name: 'Merchant Vex', role: 'vendor' };
const MIRA = { x: ASH.x + ASH.w / 2, y: ASH.y + ASH.h / 2, r: 14, name: 'Scout Mira', role: 'lore' };
const NPCS = [NPC, VEX, MIRA];
function nearestNpc() {
  let best = null, bd = 110 * 110;
  for (const n of NPCS) {
    const d2 = dist2(player.x, player.y, n.x, n.y);
    if (d2 < bd) { bd = d2; best = n; }
  }
  return best;
}

const QUESTS = [
  {
    title: 'Hold the Line', type: 'wave', goal: 2, reward: { cores: 12 },
    chapter: 'CHAPTER I', chapterName: 'THE LAST CAMP',
    hud: 'Survive through wave 2',
    intro: [
      "You're the Riftborn they whisper about? Good. We're all that's left of Emberfall.",
      "The dead walk when the rift-light dims — and worse things march with them. Orks, twisted by the tear.",
      "Hold the camp through the next assaults. Prove the stories true, Vanguard.",
    ],
    done: [
      "Ha! You fight like a legend out of the old kingdoms. The camp breathes easier tonight.",
      "Take these cores — spend them at my field lab between assaults.",
    ],
  },
  {
    title: 'Ash Samples', type: 'cores', goal: 15, reward: { sp: 1 },
    chapter: 'CHAPTER II', chapterName: 'WHAT THE RIFT WANTS',
    hud: 'Collect 15 energy cores',
    intro: [
      "Those cores the dead drop — they're crystallized rift energy. The horde harvests them from corpses.",
      "Bring me fifteen. I want to know why the rift is feeding its army.",
    ],
    done: [
      "…Just as I feared. The cores are memory. The horde's learning engine stores what it knows of YOU in them.",
      "That's why it adapts, Vanguard. Vary your attacks or it will build a perfect counter. Here — a technique I recovered.",
    ],
  },
  {
    title: 'Tusk and Iron', type: 'ravager', goal: 3, reward: { cores: 30 },
    chapter: 'CHAPTER III', chapterName: 'THE ORK VANGUARD',
    hud: 'Slay 3 Ork Ravagers',
    intro: [
      "The big greenskins — Ravagers — are shock troops for something worse. They test our walls every night.",
      "Cut down three of them. Send their warlord a message written in tusk and iron.",
    ],
    done: [
      "Three Ravagers down! The greenskins will think twice… or they'll send HIM. Steel yourself.",
    ],
  },
  {
    title: 'The Warlord', type: 'boss', goal: 1, reward: { sp: 2 },
    chapter: 'CHAPTER IV', chapterName: 'GHAROK THE RIFTBOUND',
    hud: 'Slay an Ork Warlord (appears every 5th wave)',
    intro: [
      "Gharok. Warlord of the riftbound orks. He's bound to the tear itself — kill him and the rift bleeds.",
      "He'll come with the fifth assault. Survive until then, and end him.",
    ],
    done: [
      "GHAROK HAS FALLEN! The rift-light flickers — you've wounded the thing on the other side.",
      "Two skill points, Vanguard. You've earned a legend's due.",
    ],
  },
  {
    title: 'Adaptive Doctrine', type: 'diverse', goal: 4, reward: { cores: 50 },
    chapter: 'CHAPTER V', chapterName: 'OUTLEARN THE ENGINE',
    hud: 'Use rifle, beam, nova AND grenade damage within one wave',
    intro: [
      "The learning engine is countering you faster now. Time to fight like water, not stone.",
      "In a single assault, strike with all four arts: rifle, beam, nova, and grenade. Confuse the engine.",
    ],
    done: [
      "Its predictions are scrambled! The resistance readings dropped across the board.",
      "One final task remains: survive to the fifteenth assault, and the rift will be weak enough to seal.",
    ],
  },
  {
    title: 'Seal the Rift', type: 'wave', goal: 15, reward: {},
    chapter: 'FINAL CHAPTER', chapterName: 'SEAL THE RIFT',
    hud: 'Survive through wave 15',
    intro: [
      "This is it. Fifteen assaults and the tear runs dry. Everything we have left rides with you.",
      "Go, Riftborn Vanguard. Finish this.",
    ],
    done: ["…"],
  },
];
let questIdx = 0, questStage = 'offer', questProgress = 0;

function questEvent(kind, data) {
  if (questStage !== 'active' || questIdx >= QUESTS.length) return;
  const q = QUESTS[questIdx];
  if (kind === 'kill' && q.type === 'ravager' && data.type === 'ravager') questProgress++;
  if (kind === 'kill' && q.type === 'boss' && data.boss) questProgress++;
  if (kind === 'core' && q.type === 'cores') questProgress++;
  if (kind === 'waveEnd') {
    if (q.type === 'wave') questProgress = wave;
    if (q.type === 'diverse') questProgress = Math.max(questProgress, waveCatsUsed.size === 4 ? 4 : 0);
  }
  if (questProgress >= q.goal) {
    questStage = 'turnin';
    addFloater(player.x, player.y - 40, 'OBJECTIVE COMPLETE — return to Bramm', '#7CFC00', true);
  }
  updateQuestHud();
}

function tryTalk() {
  if (state !== 'playing' || dialogOpen || vendorOpen || settingsOpen) return;
  const npc = nearestNpc();
  if (!npc) return;
  if (npc.role === 'vendor') { openVendor(); return; }
  if (npc.role === 'lore') { talkMira(); return; }
  if (questIdx >= QUESTS.length) {
    openDialog(NPC.name, ['The rift is sealed and still you patrol… Rest, legend. Emberfall owes you everything.']);
    return;
  }
  const q = QUESTS[questIdx];
  if (questStage === 'offer') {
    openDialog(NPC.name, q.intro, () => {
      questStage = 'active'; questProgress = 0;
      if (q.type === 'wave') questProgress = wave; // waves already survived count
      showChapter(q.chapter, q.chapterName);
      updateQuestHud();
    });
  } else if (questStage === 'turnin') {
    openDialog(NPC.name, q.done, () => {
      if (q.reward.cores) { cores += q.reward.cores; totalCores += q.reward.cores; addFloater(player.x, player.y - 40, `+${q.reward.cores} ⬡`, '#4de1ff', true); }
      if (q.reward.sp) { player.sp += q.reward.sp; addFloater(player.x, player.y - 40, `+${q.reward.sp} SKILL POINT ✦`, '#ff6bd8', true); }
      questIdx++; questStage = 'offer'; questProgress = 0;
      updateQuestHud();
    });
  } else {
    openDialog(NPC.name, [randFrom([
      "Still breathing? Keep it that way. " + q.hud + '.',
      "The engine is watching you, Vanguard. " + q.hud + '.',
      "Emberfall holds — barely. " + q.hud + '.',
    ])]);
  }
}
function randFrom(a) { return a[(Math.random() * a.length) | 0]; }

// ---------- Scout Mira: frontier lore, one chapter per visit ----------
const MIRA_LORE = [
  ["You made it through the ash? Impressive. I'm Mira — I scout what's left of the southern holds.",
   "Here, ten cores. Found them on a dead ork. He won't miss them.",
   "Watch the marsh to the east. Things float in Duskmere that don't leave footprints."],
  ["The orks weren't always monsters. The rift twisted a whole war-clan mid-march. Now they fight for the tear itself.",
   "Their warlord Gharok remembers being a soldier once. That's the saddest part."],
  ["I mapped the fort before the fall. Vex got there first and set up shop in the ruins. Trader's instinct — profit follows catastrophe.",
   "Buy armor plates if you can. The horde hits harder every night."],
  ["The learning engine isn't in any one creature. It's IN the rift-light. Every core you grab is a page torn from its memory.",
   "Keep tearing pages, Vanguard."],
  ["Still alive? Good. The frontier suits you.",
   "When the rift is sealed, I'm walking to Duskmere just to hear silence again."],
];
let miraIdx = 0, miraRewarded = false;
function talkMira() {
  const set = MIRA_LORE[Math.min(miraIdx, MIRA_LORE.length - 1)];
  openDialog(MIRA.name, set, () => {
    if (!miraRewarded) {
      miraRewarded = true;
      cores += 10; totalCores += 10;
      addFloater(player.x, player.y - 40, '+10 ⬡ from Mira', '#4de1ff', true);
    }
    miraIdx++;
  });
}

// ---------- Merchant Vex: mid-run consumables & armor plates ----------
let vendorOpen = false;
const VEX_QUIPS = [
  '"Everything is for sale at the end of the world."',
  '"Cores up front. No refunds after the horde eats you."',
  '"Riftsteel! Barely used. Previous owner has no further need of it."',
  '"You break it, you bought it. The zombies broke everything."',
];
function vendorItems() {
  const armor = gear.find(u => u.id === 'armor');
  return [
    { id: 'heal',  name: 'Field Stim',       desc: 'Restore full health',              cost: 10, can: () => player.hp < maxHp(),          buy: () => { player.hp = maxHp(); } },
    { id: 'gren',  name: 'Grenade Restock',  desc: 'Refill all grenades',              cost: 6,  can: () => player.grenades < maxGrenades(), buy: () => { player.grenades = maxGrenades(); } },
    { id: 'flask', name: 'Aether Flask',     desc: 'Fill aether to maximum',           cost: 6,  can: () => player.ki < maxKi() * 0.95,    buy: () => { player.ki = maxKi(); } },
    { id: 'plate', name: 'Riftsteel Plate',  desc: `Armor upgrade (−7% damage taken) — Lv ${armor.lvl}/${armor.max}`, cost: gearCost(armor), can: () => armor.lvl < armor.max, buy: () => { armor.lvl++; } },
  ];
}
function openVendor() {
  vendorOpen = true;
  $('vexQuip').textContent = randFrom(VEX_QUIPS);
  $('vendor').classList.remove('hidden');
  renderVendor();
}
function renderVendor() {
  $('vendorCores').textContent = cores;
  const grid = $('vendorGrid');
  grid.innerHTML = '';
  for (const it of vendorItems()) {
    const usable = it.can();
    const div = document.createElement('div');
    div.className = 'shopitem' + (usable ? '' : ' maxed');
    div.innerHTML = `<h4>${it.name}</h4><small>${it.desc}</small><div class="price">⬡ ${it.cost}</div>`;
    if (usable) div.onclick = () => {
      if (cores < it.cost) { $('vendorCores').style.color = '#ff4d5e'; setTimeout(() => $('vendorCores').style.color = '', 300); return; }
      cores -= it.cost;
      it.buy();
      spawnParticles(player.x, player.y, 14, '#ffd54a', 3);
      renderVendor();
    };
    grid.appendChild(div);
  }
}
$('closeVendorBtn').onclick = () => { vendorOpen = false; $('vendor').classList.add('hidden'); };

function updateQuestHud() {
  const box = $('questbox');
  if (questIdx >= QUESTS.length) { box.classList.add('hidden'); return; }
  const q = QUESTS[questIdx];
  box.classList.remove('hidden');
  if (questStage === 'offer') {
    $('questTitle').textContent = '✦ NEW QUEST AVAILABLE';
    $('questDesc').textContent = `Talk to ${NPC.name} at the camp (T)`;
  } else if (questStage === 'turnin') {
    $('questTitle').textContent = q.title;
    $('questDesc').innerHTML = '<span class="qdone">✓ Complete — return to Bramm (T)</span>';
  } else {
    $('questTitle').textContent = q.title;
    const prog = q.type === 'wave' ? `${Math.min(wave, q.goal)}/${q.goal}` : `${Math.min(questProgress, q.goal)}/${q.goal}`;
    $('questDesc').textContent = `${q.hud} — ${prog}`;
  }
}

// ---------- dialogue ----------
let dialogOpen = false, dlgLines = [], dlgIdx = 0, dlgCallback = null;
function openDialog(name, lines, cb) {
  dialogOpen = true; dlgLines = lines; dlgIdx = 0; dlgCallback = cb || null;
  $('dlgName').textContent = name;
  $('dlgText').textContent = lines[0];
  $('dialog').classList.remove('hidden');
}
function advanceDialog() {
  dlgIdx++;
  if (dlgIdx >= dlgLines.length) {
    dialogOpen = false;
    $('dialog').classList.add('hidden');
    const cb = dlgCallback; dlgCallback = null;
    if (cb) cb();
  } else $('dlgText').textContent = dlgLines[dlgIdx];
}
$('dialog').addEventListener('pointerdown', e => { e.preventDefault(); advanceDialog(); });

let chapterT = 0;
function showChapter(num, name) {
  $('chapNum').textContent = num;
  $('chapName').textContent = name;
  $('chapterbanner').style.opacity = 1;
  chapterT = 3.4;
}

// =========================== WAVES ================================
function startWave() {
  wave++;
  waveActive = true;
  state = 'playing';
  waveCatsUsed = new Set();
  $('shop').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('btnMenu').classList.remove('hidden');
  $('btnSettings').classList.remove('hidden');
  CATS.forEach(c => tally[c] *= 0.82); // the engine forgets, slowly
  spawnQueue = 6 + Math.round(wave * 3.2);
  spawnTimer = 0.5;
  if (wave % 5 === 0) { spawnEnemy('warlord'); spawnQueue += 4; }
  banner(`WAVE ${wave}`, wave % 5 === 0 ? '⚠ ORK WARLORD APPROACHES ⚠' : 'the horde emerges…');
}
function pickEnemyType() {
  const r = Math.random();
  if (wave >= 6 && r < 0.12) return 'ravager';
  if (wave >= 3 && r < 0.28) return 'shaman';
  if (wave >= 2 && r < 0.55) return 'sprinter';
  return 'husk';
}
function endWave() {
  waveActive = false;
  cores += 4 + wave; totalCores += 4 + wave;
  questEvent('waveEnd');
  saveGame(false); // auto-save after every wave
  addFloater(player.x, player.y - 64, '💾 auto-saved', '#8fa3bd', false);
  if (wave === 15 && !victoryShown) { victoryShown = true; showVictory(); return; }
  // a supply cache drops from the rift near the player — loot it before the lab opens
  const a = rand(0, TAU);
  chest = {
    x: clamp(player.x + Math.cos(a) * 130, 80, WORLD.w - 80),
    y: clamp(player.y + Math.sin(a) * 130, 80, WORLD.h - 80),
    t: 0,
  };
  spawnParticles(chest.x, chest.y, 30, '#ffd54a', 4);
  graceT = 10;
  banner('WAVE CLEARED', '🎁 loot the supply cache — field lab opens soon');
}

function openChest() {
  const c = chest; chest = null;
  camera.shake = 6;
  spawnParticles(c.x, c.y, 46, '#ffd54a', 5);
  // guaranteed goodies
  const n = 3 + Math.ceil(wave / 2);
  for (let i = 0; i < n; i++)
    pickups.push({ x: c.x + rand(-26, 26), y: c.y + rand(-26, 26), type: 'core', t: 0 });
  pickups.push({ x: c.x + rand(-20, 20), y: c.y + rand(-20, 20), type: 'health', t: 0 });
  if (Math.random() < 0.5) pickups.push({ x: c.x + rand(-20, 20), y: c.y + rand(-20, 20), type: 'health', t: 0 });
  player.grenades = maxGrenades();
  addFloater(c.x, c.y - 30, 'GRENADES RESTOCKED', '#4de1ff', false);
  // rare jackpots
  const roll = Math.random();
  if (roll < 0.15) { player.sp++; addFloater(c.x, c.y - 52, '✦ RARE: +1 SKILL POINT!', '#ff6bd8', true); }
  else if (roll < 0.3) { player.ki = maxKi(); addFloater(c.x, c.y - 52, 'AETHER SURGE — FULL CHARGE', '#4de1ff', true); }
}

// ====================== COMBAT SYSTEMS ============================
function autoAim() {
  // touch mode aims for you: nearest living enemy in range
  let best = null, bd = 820 * 820;
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.3) continue;
    const d2 = dist2(e.x, e.y, player.x, player.y);
    if (d2 < bd) { bd = d2; best = e; }
  }
  if (best) player.aim = Math.atan2(best.y - player.y, best.x - player.x);
  else if (touch.joy.active) player.aim = Math.atan2(touch.joy.y, touch.joy.x);
}

function fireRifle(dt) {
  player.fireCd -= dt;
  const wantFire = mouse.down || touch.fire;
  if (!wantFire || player.fireCd > 0 || charging) return;
  player.fireCd = rifleInterval();
  const a = player.aim + rand(-0.03, 0.03);
  bolts.push({ x: player.x + Math.cos(a) * 24, y: player.y + Math.sin(a) * 24 - 14,
    vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 1.1, r: 4 });
  camera.shake = Math.min(camera.shake + 0.6, 4);
}

function releaseBeam() {
  if (!charging) return;
  charging = false;
  if (beamCharge < 0.18) { beamCharge = 0; return; }
  const cost = 22 + beamCharge * 26;
  if (player.ki < cost * 0.6) { addFloater(player.x, player.y - 40, 'NOT ENOUGH AETHER', '#4de1ff', false); beamCharge = 0; return; }
  player.ki = Math.max(0, player.ki - cost);
  beam = { a: player.aim, t: 0, dur: 0.65 + beamCharge * 0.4,
    w: (16 + beamCharge * 34) * beamWidthMul(), power: beamCharge };
  camera.shake = 12 + beamCharge * 8;
  beamCharge = 0;
}

function tryNova() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen) return;
  if (player.novaCd > 0) return;
  if (player.ki < 12) { addFloater(player.x, player.y - 40, 'NOT ENOUGH AETHER', '#4de1ff', false); return; }
  player.ki -= 12; player.novaCd = novaCooldown();
  const R = 130 + (player.form ? 30 : 0);
  spawnRing(player.x, player.y, R);
  camera.shake = 8;
  for (const e of enemies) {
    if (e.dead) continue;
    const d2 = dist2(e.x, e.y, player.x, player.y);
    if (d2 < (R + e.r) ** 2) {
      const d = Math.sqrt(d2) || 1;
      dealDamage(e, novaDamage(), 'melee', (e.x - player.x) / d, (e.y - player.y) / d, 420);
    }
  }
}

function tryGrenade() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen) return;
  if (player.grenCd > 0 || player.grenades <= 0) return;
  if (IS_TOUCH) autoAim();
  player.grenades--; player.grenCd = 0.8;
  const a = player.aim;
  grenades.push({ x: player.x, y: player.y, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, t: 0.9 });
}
function explodeGrenade(g) {
  const R = grenadeRadius();
  spawnParticles(g.x, g.y, 40, '#4de1ff', 5);
  spawnRing(g.x, g.y, R);
  decals.push({ x: g.x, y: g.y, r: R * 0.5, color: '20,26,40', life: 10, maxLife: 10 });
  camera.shake = 11;
  for (const e of enemies) {
    if (e.dead) continue;
    const d2 = dist2(e.x, e.y, g.x, g.y);
    if (d2 < (R + e.r) ** 2) {
      const d = Math.sqrt(d2) || 1;
      dealDamage(e, grenadeDamage(), 'grenade', (e.x - g.x) / d, (e.y - g.y) / d, 380);
    }
  }
}

function tryBuild() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen) return;
  if (barricades.length >= BARRICADE_MAX) { addFloater(player.x, player.y - 40, `MAX ${BARRICADE_MAX} BARRICADES`, '#ff8a93', false); return; }
  if (cores < BARRICADE_COST) { addFloater(player.x, player.y - 40, `NEED ${BARRICADE_COST} ⬡`, '#4de1ff', false); return; }
  const bx = clamp(player.x + Math.cos(player.aim) * 62, 40, WORLD.w - 40);
  const by = clamp(player.y + Math.sin(player.aim) * 62, 40, WORLD.h - 40);
  if (obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + 40) ** 2) ||
      barricades.some(b => dist2(bx, by, b.x, b.y) < 70 * 70)) {
    addFloater(player.x, player.y - 40, 'NO ROOM HERE', '#ff8a93', false); return;
  }
  cores -= BARRICADE_COST;
  barricades.push({ x: bx, y: by, r: 34, hp: BARRICADE_HP + wave * 8, maxHp: BARRICADE_HP + wave * 8 });
  spawnParticles(bx, by, 18, '#7CFC00', 4);
  spawnRing(bx, by, 40);
}

// enemies can't pass barricades — they smash them down instead
function collideBarricades(e, dt) {
  for (const b of barricades) {
    const d2 = dist2(e.x, e.y, b.x, b.y), minD = b.r + e.r;
    if (d2 < minD * minD && d2 > 0.01) {
      const d = Math.sqrt(d2);
      e.x = b.x + (e.x - b.x) / d * minD;
      e.y = b.y + (e.y - b.y) / d * minD;
      b.hp -= e.dmg * dt * (e.boss ? 6 : 2.2);
      if (Math.random() < dt * 8) spawnParticles(b.x + (e.x - b.x) / d * b.r, b.y + (e.y - b.y) / d * b.r, 3, '#7CFC00', 2);
      if (b.hp <= 0) {
        spawnParticles(b.x, b.y, 26, '#7CFC00', 5);
        addFloater(b.x, b.y - 30, 'BARRICADE DOWN!', '#ff8a93', true);
        camera.shake = Math.max(camera.shake, 5);
      }
    }
  }
  barricades = barricades.filter(b => b.hp > 0);
}

function tryTransform() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen) return;
  if (player.form) { player.form = 0; return; }
  if (player.ki < maxKi() * 0.92) { addFloater(player.x, player.y - 40, 'AETHER NOT FULL', '#4de1ff', false); return; }
  player.form = sk('a4') ? 2 : 1;
  banner(player.form === 2 ? 'STORM ASCENDANT' : 'ASCENDED FORM', 'aether unleashed');
  spawnParticles(player.x, player.y, 60, '#ffd54a', 6);
  camera.shake = 16;
}

function tryDash(fromButton) {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen) return;
  if (player.dashCd > 0) return;
  let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touch.joy.x;
  let dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + touch.joy.y;
  if (!dx && !dy) { dx = Math.cos(player.aim); dy = Math.sin(player.aim); }
  const m = Math.hypot(dx, dy) || 1;
  player.vx = dx / m * 900; player.vy = dy / m * 900;
  player.dashT = 0.14;
  player.dashCd = 1.6 - 0.15 * gearLvl('boots') - 0.15 * sk('s2');
  spawnParticles(player.x, player.y, 10, player.form ? '#ffd54a' : '#4de1ff', 3);
}

// ============================ FX ==================================
function spawnParticles(x, y, n, color, spd) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(30, 90) * spd / 3;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.8), maxLife: 0.8, color, r: rand(1.5, 4) });
  }
}
function spawnRing(x, y, R) { particles.push({ x, y, ring: true, r: 10, targetR: R, life: 0.35, maxLife: 0.35, color: '#4de1ff' }); }
function addFloater(x, y, text, color, big) { floaters.push({ x, y, text, color, life: 1.1, big }); }
function zap(x1, y1, x2, y2) { zaps.push({ x1, y1, x2, y2, life: 0.12 }); }
let bannerT = 0;
function banner(main, sub) {
  const el = $('wavebanner');
  el.innerHTML = `${main}<small>${sub}</small>`;
  el.style.opacity = 1; bannerT = 2.2;
}

// =========================== UPDATE ===============================
let regionCheckT = 0, regionFlashT = 0;
function update(dt) {
  runTime += dt;
  // ---- movement ----
  let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touch.joy.x;
  let dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + touch.joy.y;
  const m = Math.hypot(dx, dy);
  if (keys.ShiftLeft || keys.ShiftRight) tryDash();
  if (player.dashT > 0) {
    player.dashT -= dt;
  } else if (m > 0.08) {
    const cap = Math.min(1, m);
    player.vx = dx / m * moveSpeed() * cap;
    player.vy = dy / m * moveSpeed() * cap;
  } else { player.vx *= 0.8; player.vy *= 0.8; }
  player.moving = Math.hypot(player.vx, player.vy) > 30;
  if (player.moving) player.walk += dt * 11;
  player.x = clamp(player.x + player.vx * dt, player.r, WORLD.w - player.r);
  player.y = clamp(player.y + player.vy * dt, player.r, WORLD.h - player.r);
  collideObstacles(player);

  // ---- aim ----
  if (IS_TOUCH) autoAim();
  else player.aim = Math.atan2(mouse.y + camera.y - player.y, mouse.x + camera.x - player.x);
  player.facing = Math.cos(player.aim) >= 0 ? 1 : -1;

  // learning engine: track lingering position
  campTrackX = lerp(campTrackX, player.x, dt * 0.25);
  campTrackY = lerp(campTrackY, player.y, dt * 0.25);

  // ---- regen / cooldowns ----
  player.novaCd = Math.max(0, player.novaCd - dt);
  player.grenCd = Math.max(0, player.grenCd - dt);
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.hurtT = Math.max(0, player.hurtT - dt);
  player.ki = clamp(player.ki + kiRegen() * dt, 0, maxKi());
  // campfire rest: slow heal near the fire (only between spawned enemies nearby)
  if (dist2(player.x, player.y, CAMP.x, CAMP.y) < 150 * 150)
    player.hp = Math.min(maxHp(), player.hp + 2.5 * dt);

  // ---- supply cache looting window ----
  if (graceT > 0) {
    graceT -= dt;
    if (graceT <= 0) openShop();
  }
  if (chest) {
    chest.t += dt;
    if (dist2(player.x, player.y, chest.x, chest.y) < 36 * 36) openChest();
  }

  // ---- barricade exit-blast: leaving your fence repels the mob ----
  pulseCd = Math.max(0, pulseCd - dt);
  if (pulseCd <= 0) {
    for (const b of barricades) {
      if (dist2(player.x, player.y, b.x, b.y) > (b.r + 24) ** 2) continue;
      let hit = false;
      for (const e of enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const d2 = dist2(e.x, e.y, player.x, player.y);
        if (d2 < 230 * 230) {
          const d = Math.sqrt(d2) || 1;
          e.vx += (e.x - player.x) / d * 620;
          e.vy += (e.y - player.y) / d * 620;
          e.hp -= 8; e.flash = 0.12;
          if (e.hp <= 0 && !e.dead) killEnemy(e);
          hit = true;
        }
      }
      if (hit) {
        pulseCd = 5;
        spawnRing(player.x, player.y, 230);
        spawnParticles(player.x, player.y, 24, '#7CFC00', 4);
        addFloater(player.x, player.y - 46, 'REPEL BLAST', '#7CFC00', true);
        camera.shake = 10;
      }
      break;
    }
  }

  if (player.form) {
    player.ki -= (player.form === 2 ? 9 : 6) * dt;
    if (player.ki <= 2) { player.form = 0; addFloater(player.x, player.y - 40, 'AETHER EXHAUSTED', '#9fb2c9', false); }
    if (player.form === 2 && Math.random() < dt * 7) {
      let best = null, bd = 180 * 180;
      for (const e of enemies) if (!e.dead) { const d2 = dist2(e.x, e.y, player.x, player.y); if (d2 < bd) { bd = d2; best = e; } }
      if (best) { dealDamage(best, 10, 'melee', 0, 0, 0); zap(player.x, player.y - 20, best.x, best.y - 12); }
    }
  }

  // ---- weapons ----
  fireRifle(dt);
  const wantCharge = mouse.rdown || touch.beamHeld;
  if (wantCharge && !beam) {
    charging = true;
    beamCharge = clamp(beamCharge + dt * 0.9, 0, 1);
    player.vx *= 0.4; player.vy *= 0.4;
  }

  if (beam) {
    beam.t += dt;
    beam.a = player.aim;
    beam.tick = (beam.tick || 0) - dt;
    if (beam.tick <= 0) {
      beam.tick = 0.1;
      const ca = Math.cos(beam.a), sa = Math.sin(beam.a);
      for (const e of enemies) {
        if (e.dead) continue;
        const px = e.x - player.x, py = e.y - player.y;
        const along = px * ca + py * sa;
        if (along < 0) continue;
        const perp = Math.abs(-px * sa + py * ca);
        if (perp < beam.w / 2 + e.r)
          dealDamage(e, beamDamage() * (0.7 + beam.power * 0.6), 'beam', ca, sa, 120);
      }
      camera.shake = Math.max(camera.shake, 5);
    }
    if (beam.t >= beam.dur) beam = null;
  }

  // ---- spawning ----
  if (waveActive && spawnQueue > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(0.25, 1.1 - wave * 0.05);
      const burst = Math.min(spawnQueue, 1 + (Math.random() < 0.3 ? 1 : 0));
      for (let i = 0; i < burst; i++) { spawnEnemy(pickEnemyType()); spawnQueue--; }
    }
  }
  if (waveActive && spawnQueue === 0 && enemies.every(e => e.dead)) endWave();

  // ---- enemies ----
  for (const e of enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    const ex = player.x - e.x, ey = player.y - e.y;
    const d = Math.hypot(ex, ey) || 1;
    const wantD = e.ranged && !e.boss ? 260 : 0;
    const dir = d > wantD ? 1 : -0.6;
    e.vx = lerp(e.vx, ex / d * e.spd * dir, dt * 4);
    e.vy = lerp(e.vy, ey / d * e.spd * dir, dt * 4);
    for (const o of enemies) {
      if (o === e || o.dead) continue;
      const d2 = dist2(e.x, e.y, o.x, o.y), minD = e.r + o.r;
      if (d2 < minD * minD && d2 > 0.01) {
        const dd = Math.sqrt(d2);
        e.vx += (e.x - o.x) / dd * 40; e.vy += (e.y - o.y) / dd * 40;
      }
    }
    e.x = clamp(e.x + e.vx * dt, e.r, WORLD.w - e.r);
    e.y = clamp(e.y + e.vy * dt, e.r, WORLD.h - e.r);
    collideObstacles(e);
    collideBarricades(e, dt);
    e.walk += dt * (Math.hypot(e.vx, e.vy) * 0.075);
    e.facing = e.vx >= 0 ? 1 : -1;
    if (d < e.r + player.r + 6 && player.hurtT <= 0) hurtPlayer(e.dmg);
    if (e.ranged) {
      e.atkCd -= dt;
      if (e.atkCd <= 0 && d < 540) {
        e.atkCd = e.boss ? 1.1 : rand(1.6, 2.6);
        const a = Math.atan2(ey, ex) + rand(-0.05, 0.05);
        const n = e.boss ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const aa = a + (i - (n - 1) / 2) * 0.22;
          ebolts.push({ x: e.x, y: e.y - e.r, vx: Math.cos(aa) * 300, vy: Math.sin(aa) * 300, life: 2.4, r: 6, dmg: e.dmg * 0.8 });
        }
      }
      if (e.boss && Math.random() < dt * 0.25) spawnEnemy('sprinter');
    }
  }
  enemies = enemies.filter(e => !e.dead);

  // ---- projectiles ----
  for (const b of bolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(b.x, b.y, o.x, o.y) < o.r * o.r)) {
      b.life = 0; spawnParticles(b.x, b.y, 4, '#4de1ff', 2); continue;
    }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4) continue;
      if (dist2(b.x, b.y + 14, e.x, e.y) < (e.r + b.r + 6) ** 2) {
        dealDamage(e, rifleDamage(), 'rifle', b.vx / 900, b.vy / 900, 90);
        b.life = 0; spawnParticles(b.x, b.y, 5, '#4de1ff', 2);
        break;
      }
    }
  }
  bolts = bolts.filter(b => b.life > 0);

  for (const b of ebolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(b.x, b.y, o.x, o.y) < o.r * o.r)) { b.life = 0; continue; }
    const wall = barricades.find(w => dist2(b.x, b.y, w.x, w.y) < w.r * w.r);
    if (wall) { wall.hp -= b.dmg * 0.6; b.life = 0; spawnParticles(b.x, b.y, 4, '#7CFC00', 2); continue; }
    if (dist2(b.x, b.y, player.x, player.y - 12) < (player.r + b.r + 4) ** 2) {
      b.life = 0;
      if (player.hurtT <= 0) hurtPlayer(b.dmg);
    }
  }
  ebolts = ebolts.filter(b => b.life > 0);

  for (const g of grenades) {
    g.x += g.vx * dt; g.y += g.vy * dt;
    g.vx *= 0.96; g.vy *= 0.96; g.t -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(g.x, g.y, o.x, o.y) < (o.r + 6) ** 2)) g.t = 0;
    if (g.t <= 0) explodeGrenade(g);
  }
  grenades = grenades.filter(g => g.t > 0);

  // ---- pickups ----
  for (const p of pickups) {
    p.t += dt;
    const d2 = dist2(p.x, p.y, player.x, player.y);
    const mag = magnetRange();
    if (d2 < mag * mag) {
      const d = Math.sqrt(d2) || 1;
      p.x += (player.x - p.x) / d * 380 * dt;
      p.y += (player.y - p.y) / d * 380 * dt;
    }
    if (d2 < (player.r + 14) ** 2) {
      p.got = true;
      if (p.type === 'core') { cores++; totalCores++; addFloater(p.x, p.y, '+1 ⬡', '#4de1ff', false); questEvent('core'); }
      else { player.hp = Math.min(maxHp(), player.hp + 25); addFloater(p.x, p.y, '+25 HP', '#7CFC00', false); }
    }
  }
  pickups = pickups.filter(p => !p.got && p.t < 30);

  // ---- fx ----
  for (const p of particles) {
    p.life -= dt;
    if (p.ring) p.r = lerp(p.r, p.targetR, dt * 14);
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
  }
  particles = particles.filter(p => p.life > 0);
  for (const f of floaters) { f.y -= 40 * dt; f.life -= dt; }
  floaters = floaters.filter(f => f.life > 0);
  for (const d of decals) d.life -= dt;
  decals = decals.filter(d => d.life > 0);
  for (const z of zaps) z.life -= dt;
  zaps = zaps.filter(z => z.life > 0);
  // ambient campfire embers
  if (Math.random() < dt * 14)
    particles.push({ x: CAMP.x + rand(-8, 8), y: CAMP.y + rand(-4, 4), vx: rand(-8, 8), vy: rand(-40, -80), life: rand(.4, .9), maxLife: .9, color: Math.random() < .6 ? '#ff9d2e' : '#ffd54a', r: rand(1.5, 3.5) });

  // ---- camera ----
  camera.shake = Math.max(0, camera.shake - dt * 30);
  camera.x = clamp(player.x - VW / 2, 0, Math.max(0, WORLD.w - VW));
  camera.y = clamp(player.y - VH / 2, 0, Math.max(0, WORLD.h - VH));

  // ---- region banner ----
  regionCheckT -= dt;
  if (regionCheckT <= 0) {
    regionCheckT = 0.5;
    const reg = REGIONS.find(r => r.test(player.x, player.y)).name;
    if (reg !== currentRegion) {
      currentRegion = reg;
      regionFlashT = 3;
    }
  }
  if (regionFlashT > 0) regionFlashT -= dt;
  if (chapterT > 0) { chapterT -= dt; if (chapterT <= 0) $('chapterbanner').style.opacity = 0; }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('wavebanner').style.opacity = 0; }

  // talk button visibility (any NPC in range)
  const npcNear = nearestNpc();
  const talkBtn = $('btnTalk');
  talkBtn.classList.toggle('hidden', !(npcNear && state === 'playing' && !dialogOpen && !vendorOpen));
  if (npcNear) talkBtn.textContent = npcNear.role === 'vendor' ? '🜚 TRADE' : '💬 TALK';

  updateHud();
}

function collideObstacles(ent) {
  for (const o of obstacles) {
    const d2 = dist2(ent.x, ent.y, o.x, o.y), minD = o.r + ent.r;
    if (d2 < minD * minD && d2 > 0.01) {
      const d = Math.sqrt(d2);
      ent.x = o.x + (ent.x - o.x) / d * minD;
      ent.y = o.y + (ent.y - o.y) / d * minD;
    }
  }
}

function hurtPlayer(dmg) {
  player.hp -= dmg * (1 - armorReduce());
  player.hurtT = 0.45;
  camera.shake = 9;
  spawnParticles(player.x, player.y - 14, 10, '#ff4d5e', 3);
  if (player.hp <= 0) gameOver();
}

// ========================= SKILL TREE =============================
function toggleTree() {
  treeOpen = !treeOpen;
  $('skilltree').classList.toggle('hidden', !treeOpen);
  if (treeOpen) renderTree();
}
function renderTree() {
  $('stPoints').textContent = player.sp;
  const cols = $('treeCols');
  cols.innerHTML = '';
  for (const key of Object.keys(SKILLS)) {
    const col = SKILLS[key];
    const div = document.createElement('div');
    div.className = 'treecol ' + col.cls;
    div.innerHTML = `<h3>${col.label}</h3>`;
    col.nodes.forEach((n, i) => {
      const rank = sk(n.id);
      const prevOk = i === 0 || sk(col.nodes[i - 1].id) >= 1;
      const maxed = rank >= n.max;
      const canBuy = prevOk && !maxed && player.sp > 0;
      const node = document.createElement('div');
      node.className = 'skillnode' + (canBuy ? ' avail' : '') + (maxed ? ' maxed' : '') + (!prevOk ? ' locked' : '');
      node.innerHTML = `<h5>${n.name}<span>${maxed ? 'MAX' : rank + '/' + n.max}</span></h5><small>${n.desc}${!prevOk ? ' — requires previous skill' : ''}</small>`;
      if (canBuy) node.onclick = () => {
        player.sp--;
        skillRanks[n.id] = rank + 1;
        if (n.id === 's1') player.hp = Math.min(maxHp(), player.hp + 30);
        spawnParticles(player.x, player.y, 20, '#ff6bd8', 4);
        renderTree();
      };
      div.appendChild(node);
    });
    cols.appendChild(div);
  }
}
$('closeTreeBtn').onclick = () => toggleTree();

// =========================== SHOP =================================
function openShop() {
  state = 'shop';
  shopTimer = 30;
  player.grenades = maxGrenades();
  player.hp = Math.min(maxHp(), player.hp + 15);
  $('shop').classList.remove('hidden');
  $('shopWave').textContent = wave;
  renderShop();
}
function renderShop() {
  $('shopCores').textContent = cores;
  const grid = $('shopGrid');
  grid.innerHTML = '';
  for (const u of gear) {
    const maxed = u.lvl >= u.max;
    const div = document.createElement('div');
    div.className = 'shopitem' + (maxed ? ' maxed' : '');
    div.innerHTML = `<h4>${u.name}<span class="lvl">${maxed ? 'MAX' : 'Lv ' + u.lvl + '/' + u.max}</span></h4>
      <small>${u.desc}</small>
      <div class="price">${maxed ? '—' : '⬡ ' + gearCost(u)}</div>`;
    if (!maxed) div.onclick = () => buyGear(u);
    grid.appendChild(div);
  }
}
function buyGear(u) {
  const cost = gearCost(u);
  if (cores < cost) { $('shopCores').style.color = '#ff4d5e'; setTimeout(() => $('shopCores').style.color = '', 300); return; }
  cores -= cost; u.lvl++;
  if (u.id === 'hp') player.hp = maxHp();
  if (u.id === 'gren') player.grenades = maxGrenades();
  renderShop();
}
$('openTreeLink').onclick = e => { e.preventDefault(); toggleTree(); };

// ===================== GAME OVER / VICTORY ========================
function statsHtml() {
  const mins = Math.floor(runTime / 60), secs = Math.round(runTime % 60);
  return `Waves survived: <b>${wave}</b> · Kills: <b>${kills}</b> · Cores gathered: <b>${totalCores}</b><br>
    Level <b>${player.level}</b> · Quests completed: <b>${questIdx}</b>/${QUESTS.length} · Time in the rift: <b>${mins}m ${secs}s</b>`;
}
function gameOver() {
  state = 'over';
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('btnTalk').classList.add('hidden');
  $('goTitle').textContent = 'YOU HAVE FALLEN';
  $('goSub').textContent = 'Emberfall burns behind you…';
  $('goStats').innerHTML = statsHtml();
  $('retryBtn').textContent = 'RE-ENTER THE RIFT';
  $('retryBtn').onclick = () => { $('gameover').classList.add('hidden'); newGame(); };
  $('gameover').classList.remove('hidden');
}
function showVictory() {
  state = 'over';
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('goTitle').textContent = 'THE RIFT IS SEALED';
  $('goSub').textContent = 'Emberfall stands. The three worlds begin to heal.';
  $('goStats').innerHTML = statsHtml() + '<br><br>You held the line for 15 waves. The rift stirs again — dare you continue?';
  $('retryBtn').textContent = 'CONTINUE — ENDLESS RIFT ➤';
  $('retryBtn').onclick = () => { $('gameover').classList.add('hidden'); openShop(); };
  $('gameover').classList.remove('hidden');
}

// ============================ HUD =================================
function updateHud() {
  $('hpfill').style.width = (100 * player.hp / maxHp()) + '%';
  $('kifill').style.width = (100 * player.ki / maxKi()) + '%';
  $('xpfill').style.width = (100 * player.xp / player.xpNext) + '%';
  $('hptext').textContent = `${Math.max(0, Math.ceil(player.hp))} / ${maxHp()}`;
  $('kitext').textContent = `${Math.floor(player.ki)} / ${maxKi()}`;
  $('ssjHint').textContent = player.form ? (player.form === 2 ? '⚡ STORM' : '★ ASCENDED') :
    player.ki >= maxKi() * 0.92 ? '— ASCEND READY (F)!' : '';
  $('waveNum').textContent = wave;
  $('coreNum').textContent = cores;
  $('killNum').textContent = kills;
  $('spNum').textContent = player.sp;
  $('phaseLabel').textContent = paused ? '⏸ PAUSED' :
    graceT > 0 ? `🎁 lab opens in ${Math.ceil(graceT)}s` :
    waveActive ? (spawnQueue > 0 ? '🌑 horde incoming' : `${enemies.length} remaining`) : '';
  const cds = [];
  if (player.dashCd > 0.05) cds.push(`dash ${player.dashCd.toFixed(1)}`);
  if (player.novaCd > 0.05) cds.push(`nova ${player.novaCd.toFixed(1)}`);
  $('grenadeHud').textContent = '✦ ' + '●'.repeat(player.grenades) + '○'.repeat(Math.max(0, maxGrenades() - player.grenades)) +
    `  ·  ⛨ ${barricades.length}/${BARRICADE_MAX}` +
    (cds.length ? '  ·  ' + cds.join(' · ') : '');
  for (const c of CATS) {
    const r = resistance(c);
    $('ad_' + c).style.width = (r / 0.6 * 100) + '%';
    $('adv_' + c).textContent = Math.round(r * 100) + '%';
  }
}

// ================== HUMANOID SPRITE RENDERER ======================
// Draws a standing figure at (x, y = feet). All characters (hero,
// zombies, orks, shamans, NPC) share this rig with different configs.
function drawFigure(x, y, o) {
  const s = o.s || 1;
  const H = 36 * s;                      // total height
  const t = o.walk || 0;
  const swing = o.moving === false ? 0 : Math.sin(t) * 0.55;
  const bob = o.moving === false ? 0 : Math.abs(Math.sin(t)) * 2.2 * s;
  const hunch = o.hunch || 0;
  const lean = hunch * 7 * s;            // forward lean offset
  ctx.save();
  ctx.translate(x, y);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * s, 4.5 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(o.facing || 1, 1);
  ctx.translate(0, -bob);

  const hipY = -H * 0.42;
  const shY = -H * 0.72 + hunch * 5 * s; // shoulder line
  const headY = -H * 0.88 + hunch * 8 * s;
  const headR = 5.6 * s * (o.headScale || 1);

  const flash = o.flash > 0;
  const skin = flash ? '#fff' : o.skin;
  const cloth = flash ? '#fff' : o.cloth;
  const legC = flash ? '#fff' : (o.legs || '#20242e');

  // aura (behind the body)
  if (o.aura) {
    const ar = H * 0.62 + Math.sin(performance.now() / 70) * 3 * s;
    const ag = ctx.createRadialGradient(lean, hipY, 3, lean, hipY, ar);
    ag.addColorStop(0, o.aura + '99'); ag.addColorStop(1, o.aura + '00');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.ellipse(lean, hipY, ar * 0.8, ar, 0, 0, TAU); ctx.fill();
  }

  ctx.lineCap = 'round';

  // ---- legs ----
  ctx.strokeStyle = legC; ctx.lineWidth = 3.4 * s;
  ctx.beginPath();
  ctx.moveTo(-1.5 * s, hipY); ctx.lineTo(-1.5 * s + Math.sin(t) * 5 * s, -1);
  ctx.moveTo(1.5 * s, hipY); ctx.lineTo(1.5 * s - Math.sin(t) * 5 * s, -1);
  ctx.stroke();

  // ---- torso ----
  ctx.strokeStyle = cloth; ctx.lineWidth = 7.5 * s * (o.bulk || 1);
  ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(lean, shY); ctx.stroke();
  // pauldron / armor plate
  if (o.pauldron) {
    ctx.fillStyle = flash ? '#fff' : o.pauldron;
    ctx.beginPath(); ctx.arc(lean, shY + 1 * s, 4.6 * s * (o.bulk || 1), 0, TAU); ctx.fill();
  }
  // rags (torn cloth flaps for undead)
  if (o.rags) {
    ctx.strokeStyle = flash ? '#fff' : o.rags; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-3 * s, hipY + 1); ctx.lineTo(-4 * s + Math.sin(t * 1.3) * 2, hipY + 7 * s);
    ctx.moveTo(3 * s, hipY + 1); ctx.lineTo(4 * s - Math.sin(t * 1.1) * 2, hipY + 6 * s);
    ctx.stroke();
  }

  // ---- arms & weapon ----
  const armY = shY + 2 * s;
  ctx.strokeStyle = skin; ctx.lineWidth = 3 * s;
  if (o.weapon === 'rifle') {
    // both hands forward holding a rifle aimed at o.gunAngle (mirrored space)
    const ga = o.gunAngle || 0;
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga);
    ctx.beginPath(); // supporting arms
    ctx.moveTo(0, 0); ctx.lineTo(8 * s, 2.5 * s);
    ctx.moveTo(0, 0); ctx.lineTo(13 * s, 1.5 * s);
    ctx.stroke();
    // the gun
    ctx.fillStyle = flash ? '#fff' : '#c8d6ea';
    ctx.fillRect(4 * s, -2 * s, 16 * s, 4 * s);
    ctx.fillStyle = flash ? '#fff' : '#4de1ff';
    ctx.fillRect(18 * s, -1.4 * s, 4 * s, 2.8 * s);
    ctx.fillStyle = flash ? '#fff' : '#7a89a6';
    ctx.fillRect(7 * s, 2 * s, 3 * s, 4 * s); // grip
    ctx.restore();
  } else if (o.weapon === 'club') {
    // one arm hangs, one arm raised with a spiked club
    const raise = Math.sin(t * 0.7) * 0.15 - 0.9;
    ctx.beginPath(); ctx.moveTo(lean, armY); ctx.lineTo(lean - 6 * s, armY + 9 * s + swing * 2); ctx.stroke();
    ctx.save();
    ctx.translate(lean, armY); ctx.rotate(raise);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10 * s, 0); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#5a4634';
    ctx.fillRect(9 * s, -2 * s, 12 * s, 4 * s);
    ctx.fillStyle = flash ? '#fff' : '#8d99ae';
    for (let i = 0; i < 3; i++) { // spikes
      ctx.beginPath();
      ctx.moveTo((11 + i * 4) * s, -2 * s); ctx.lineTo((12.5 + i * 4) * s, -5 * s); ctx.lineTo((14 + i * 4) * s, -2 * s);
      ctx.fill();
    }
    ctx.restore();
  } else if (o.weapon === 'staff') {
    ctx.beginPath(); ctx.moveTo(lean, armY); ctx.lineTo(lean + 8 * s, armY + 4 * s); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#5a4634'; ctx.lineWidth = 2.4 * s;
    ctx.beginPath(); ctx.moveTo(lean + 8 * s, armY + 12 * s); ctx.lineTo(lean + 8 * s, armY - 14 * s); ctx.stroke();
    const pulse = 0.6 + Math.sin(performance.now() / 200) * 0.4;
    ctx.fillStyle = `rgba(210,77,255,${pulse})`;
    ctx.shadowColor = '#d24dff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(lean + 8 * s, armY - 16 * s, 3.4 * s, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // bare arms — zombies reach forward, others hang
    const reach = o.armsForward ? 1 : 0;
    ctx.beginPath();
    ctx.moveTo(lean, armY);
    ctx.lineTo(lean + (reach ? 12 * s : -4 * s), armY + (reach ? 2 * s + Math.sin(t * 1.4) * 2 : 10 * s) + swing);
    ctx.moveTo(lean, armY);
    ctx.lineTo(lean + (reach ? 11 * s : 4 * s), armY + (reach ? 5 * s - Math.sin(t * 1.2) * 2 : 10 * s) - swing);
    ctx.stroke();
  }

  // ---- head ----
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(lean + hunch * 3 * s, headY, headR, 0, TAU); ctx.fill();
  const hx = lean + hunch * 3 * s;
  // helmet
  if (o.helmet) {
    ctx.fillStyle = flash ? '#fff' : o.helmet;
    ctx.beginPath(); ctx.arc(hx, headY - 1 * s, headR + 1 * s, Math.PI, 0); ctx.fill();
    ctx.fillRect(hx - headR - 1 * s, headY - 1.5 * s, (headR + 1 * s) * 2, 2.5 * s);
  }
  // horns (warlord)
  if (o.horns) {
    ctx.strokeStyle = flash ? '#fff' : '#d9cfa8'; ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(hx - headR, headY - 2 * s); ctx.quadraticCurveTo(hx - headR - 6 * s, headY - 6 * s, hx - headR - 4 * s, headY - 11 * s);
    ctx.moveTo(hx + headR, headY - 2 * s); ctx.quadraticCurveTo(hx + headR + 6 * s, headY - 6 * s, hx + headR + 4 * s, headY - 11 * s);
    ctx.stroke();
  }
  // spiky hero hair
  if (o.hairSpikes) {
    ctx.fillStyle = flash ? '#fff' : o.hairColor;
    ctx.beginPath();
    ctx.moveTo(hx - headR, headY);
    ctx.lineTo(hx - headR - 2 * s, headY - 7 * s);
    ctx.lineTo(hx - headR * 0.4, headY - headR - 1 * s);
    ctx.lineTo(hx - 1 * s, headY - headR - 6 * s);
    ctx.lineTo(hx + headR * 0.35, headY - headR - 1.5 * s);
    ctx.lineTo(hx + headR * 0.9, headY - headR - 5 * s);
    ctx.lineTo(hx + headR + 1 * s, headY - 2 * s);
    ctx.closePath(); ctx.fill();
  }
  // hood (shaman)
  if (o.hood) {
    ctx.fillStyle = flash ? '#fff' : o.hood;
    ctx.beginPath();
    ctx.arc(hx, headY - 0.5 * s, headR + 1.6 * s, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(hx + headR, headY + headR);
    ctx.lineTo(hx - headR, headY + headR);
    ctx.closePath(); ctx.fill();
  }
  // pointy ork ears
  if (o.ears) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(hx - headR + 1, headY); ctx.lineTo(hx - headR - 4 * s, headY - 2 * s); ctx.lineTo(hx - headR + 1, headY + 2 * s);
    ctx.moveTo(hx + headR - 1, headY); ctx.lineTo(hx + headR + 4 * s, headY - 2 * s); ctx.lineTo(hx + headR - 1, headY + 2 * s);
    ctx.fill();
  }
  // eyes
  ctx.fillStyle = o.glowEyes || '#101018';
  if (o.glowEyes) { ctx.shadowColor = o.glowEyes; ctx.shadowBlur = 6; }
  ctx.beginPath();
  ctx.arc(hx + headR * 0.45, headY - 0.5 * s, 1.2 * s, 0, TAU);
  ctx.arc(hx + headR * 0.05, headY - 0.5 * s, 1.2 * s, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  // tusks
  if (o.tusks) {
    ctx.fillStyle = flash ? '#fff' : '#e8e0c4';
    ctx.beginPath();
    ctx.moveTo(hx + headR * 0.1, headY + headR * 0.55);
    ctx.lineTo(hx + headR * 0.25, headY + headR * 0.05);
    ctx.lineTo(hx + headR * 0.45, headY + headR * 0.55);
    ctx.moveTo(hx + headR * 0.55, headY + headR * 0.55);
    ctx.lineTo(hx + headR * 0.75, headY + headR * 0.05);
    ctx.lineTo(hx + headR * 0.9, headY + headR * 0.55);
    ctx.fill();
  }
  ctx.restore();
}

// per-type figure configs
function enemyFigure(e) {
  const base = { walk: e.walk, facing: e.facing, flash: e.flash, moving: true };
  switch (e.type) {
    case 'husk': return { ...base, s: 1, skin: '#8aa06a', cloth: '#55503f', rags: '#3f3a2c',
      legs: '#33302a', hunch: 0.7, armsForward: true, glowEyes: '#ff4d5e' };
    case 'sprinter': return { ...base, s: 0.85, skin: '#9db07a', cloth: '#4a4438', rags: '#37321f',
      legs: '#2c2a20', hunch: 0.9, armsForward: true, glowEyes: '#ffb02e' };
    case 'shaman': return { ...base, s: 1, skin: '#7a8f5a', cloth: '#4a2f63', hood: '#3a2350',
      legs: '#31264a', hunch: 0.3, weapon: 'staff', glowEyes: '#d24dff' };
    case 'ravager': return { ...base, s: 1.7, bulk: 1.35, headScale: 1.1, skin: '#5f8f3a', cloth: '#4c3a26',
      pauldron: '#6b7686', legs: '#3a3026', tusks: true, ears: true, weapon: 'club', glowEyes: '#ffd54a' };
    case 'warlord': return { ...base, s: 2.7, bulk: 1.5, headScale: 1.15, skin: '#4f7a30', cloth: '#3c2f22',
      pauldron: '#59636f', legs: '#332a20', tusks: true, ears: true, horns: true, helmet: '#3a3f4c',
      weapon: 'club', glowEyes: '#ff2d55', aura: '#b04dff' };
  }
}
function playerFigure() {
  const gold = player.form > 0;
  return {
    s: 1.06, walk: player.walk, facing: player.facing, moving: player.moving,
    skin: '#e8b98a',
    hairSpikes: true,
    hairColor: gold ? '#ffe27a' : '#252533',
    cloth: gold ? '#e89b2e' : '#2e6fff',
    pauldron: gold ? '#ffd54a' : (gearLvl('armor') >= 3 ? '#c3ccd9' : '#8fb7ff'),
    legs: '#20242e',
    weapon: 'rifle',
    gunAngle: player.facing === 1 ? player.aim : Math.PI - player.aim,
    aura: player.form === 2 ? '#fff2a8' : player.form === 1 ? '#ffd54a' : null,
    flash: 0,
    alpha: player.hurtT > 0 && Math.sin(performance.now() / 40) > 0 ? 0.4 : 1,
  };
}
function npcFigure(n) {
  const base = { s: 1, walk: performance.now() / 700, moving: false, facing: player.x < n.x ? -1 : 1 };
  switch (n.role) {
    case 'vendor': return { ...base, skin: '#c99b6a', cloth: '#6a4a7a', pauldron: '#b98a3e',
      legs: '#3a3040', hood: '#523a60' }; // robed trader with a gilded clasp
    case 'lore': return { ...base, skin: '#e0b088', cloth: '#3e5a48', pauldron: '#5f7a68',
      legs: '#2e4038', hairSpikes: true, hairColor: '#7a4a2e', weapon: 'rifle',
      gunAngle: base.facing === 1 ? 0.6 : Math.PI - 0.6 }; // ranger with a slung rifle
    default: return { ...base, skin: '#d9a878', cloth: '#7a5a34', pauldron: '#9b7648',
      legs: '#3a3226', weapon: 'staff' };
  }
}

// =========================== RENDER ===============================
function render() {
  ctx.fillStyle = '#070a12';
  ctx.fillRect(0, 0, VW, VH);
  ctx.save();
  const shakeAmt = settings.shake ? camera.shake : 0;
  const sx = shakeAmt ? rand(-shakeAmt, shakeAmt) * 0.5 : 0;
  const sy = shakeAmt ? rand(-shakeAmt, shakeAmt) * 0.5 : 0;
  ctx.translate(-camera.x + sx, -camera.y + sy);

  // ---- textured ground tiles ----
  const tx0 = Math.max(0, Math.floor(camera.x / TILE)), ty0 = Math.max(0, Math.floor(camera.y / TILE));
  const tx1 = Math.min(Math.ceil(WORLD.w / TILE), Math.ceil((camera.x + VW) / TILE));
  const ty1 = Math.min(Math.ceil(WORLD.h / TILE), Math.ceil((camera.y + VH) / TILE));
  for (let tx = tx0; tx < tx1; tx++) for (let ty = ty0; ty < ty1; ty++) {
    const z = zoneAt(tx * TILE + TILE / 2, ty * TILE + TILE / 2);
    ctx.drawImage(tileTex[z], tx * TILE, ty * TILE);
  }

  // ---- decals (scorch, gore) ----
  for (const d of decals) {
    ctx.fillStyle = `rgba(${d.color},${0.5 * d.life / d.maxLife})`;
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.6, 0, 0, TAU); ctx.fill();
  }

  // ---- ground decor ----
  for (const d of decor) {
    if (d.x < camera.x - 30 || d.x > camera.x + VW + 30 || d.y < camera.y - 30 || d.y > camera.y + VH + 30) continue;
    drawDecor(d);
  }

  // ---- world border (rift wall) ----
  ctx.strokeStyle = 'rgba(176,77,255,0.55)'; ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
  ctx.strokeStyle = 'rgba(176,77,255,0.18)'; ctx.lineWidth = 22;
  ctx.strokeRect(0, 0, WORLD.w, WORLD.h);

  // ---- pickups (on the ground, under actors) ----
  const bob = Math.sin(performance.now() / 250) * 3;
  for (const p of pickups) {
    ctx.save(); ctx.translate(p.x, p.y + bob);
    if (p.type === 'core') {
      ctx.rotate(performance.now() / 500);
      ctx.fillStyle = '#4de1ff'; ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8) : ctx.moveTo(8, 0); }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#7CFC00'; ctx.shadowColor = '#7CFC00'; ctx.shadowBlur = 12;
      ctx.fillRect(-8, -3, 16, 6); ctx.fillRect(-3, -8, 6, 16);
    }
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // ---- grenades ----
  for (const g of grenades) {
    ctx.fillStyle = g.t < 0.3 && Math.sin(performance.now() / 40) > 0 ? '#fff' : '#4de1ff';
    ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, TAU); ctx.fill();
  }

  // ================= Y-SORTED ACTORS & PROPS =================
  const draws = [];
  for (const o of obstacles) draws.push({ y: o.y + o.r, f: () => drawObstacle(o) });
  drawCampProps(draws);
  for (const n of NPCS) {
    draws.push({ y: n.y, f: () => {
      drawFigure(n.x, n.y, npcFigure(n));
      // overhead marker
      let mark = null, mcolor = '#ffd54a';
      if (n.role === 'quest' && questIdx < QUESTS.length && (questStage === 'offer' || questStage === 'turnin')) {
        mark = questStage === 'turnin' ? '?' : '!';
        mcolor = questStage === 'turnin' ? '#7CFC00' : '#ffd54a';
      } else if (n.role === 'vendor') { mark = '⬡'; mcolor = '#ffd54a'; }
      else if (n.role === 'lore' && miraIdx < MIRA_LORE.length) { mark = '◆'; mcolor = '#4de1ff'; }
      if (mark) {
        const by = n.y - 58 + Math.sin(performance.now() / 300) * 4;
        ctx.fillStyle = mcolor;
        ctx.font = 'bold 20px Segoe UI'; ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
        ctx.strokeText(mark, n.x, by); ctx.fillText(mark, n.x, by);
      }
      ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2.5;
      const short = n.name.split(' ').pop();
      ctx.strokeText(short, n.x, n.y + 12);
      ctx.fillStyle = 'rgba(223,233,245,0.9)';
      ctx.fillText(short, n.x, n.y + 12);
    }});
  }
  // player-built barricades (energy fences)
  for (const b of barricades) {
    draws.push({ y: b.y, f: () => {
      const pulse = 0.75 + Math.sin(performance.now() / 220 + b.x) * 0.25;
      // energy dome wall
      ctx.strokeStyle = `rgba(124,252,0,${0.5 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(124,252,0,${0.08 * pulse})`;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      // emitter pylon
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 8, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2c3a2c'; ctx.strokeStyle = '#4a6a4a'; ctx.lineWidth = 2;
      ctx.fillRect(b.x - 4, b.y - 20, 8, 20); ctx.strokeRect(b.x - 4, b.y - 20, 8, 20);
      ctx.fillStyle = `rgba(124,252,0,${pulse})`;
      ctx.shadowColor = '#7CFC00'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x, b.y - 24, 4, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // hp bar when damaged
      if (b.hp < b.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(b.x - 18, b.y - 36, 36, 4);
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(b.x - 18, b.y - 36, 36 * clamp(b.hp / b.maxHp, 0, 1), 4);
      }
    }});
  }
  // end-of-wave supply cache
  if (chest) {
    draws.push({ y: chest.y, f: () => {
      const c = chest;
      // light beacon
      const g = ctx.createLinearGradient(c.x, c.y - 90, c.x, c.y);
      g.addColorStop(0, 'rgba(255,213,74,0)');
      g.addColorStop(1, `rgba(255,213,74,${0.25 + Math.sin(performance.now() / 300) * 0.1})`);
      ctx.fillStyle = g;
      ctx.fillRect(c.x - 12, c.y - 90, 24, 90);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 18, 7, 0, 0, TAU); ctx.fill();
      // chest body
      ctx.fillStyle = '#5a4028'; ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2;
      ctx.fillRect(c.x - 15, c.y - 14, 30, 15); ctx.strokeRect(c.x - 15, c.y - 14, 30, 15);
      // domed lid
      ctx.fillStyle = '#6b4c30';
      ctx.beginPath(); ctx.moveTo(c.x - 15, c.y - 14);
      ctx.quadraticCurveTo(c.x, c.y - 26, c.x + 15, c.y - 14); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // gold trim + latch
      ctx.fillStyle = '#ffd54a';
      ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 8;
      ctx.fillRect(c.x - 15, c.y - 15, 30, 3);
      ctx.fillRect(c.x - 2.5, c.y - 14, 5, 8);
      ctx.shadowBlur = 0;
    }});
  }
  for (const e of enemies) {
    if (e.dead) continue;
    draws.push({ y: e.y, f: () => {
      const emerge = e.spawnT > 0 ? 1 - e.spawnT / 0.8 : 1;
      if (emerge < 1) {
        // rift emergence swirl
        ctx.strokeStyle = `rgba(176,77,255,${1 - emerge})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, 18 * (1 - emerge) + 6, 0, TAU); ctx.stroke();
      }
      const fig = enemyFigure(e);
      fig.alpha = emerge;
      drawFigure(e.x, e.y, fig);
      if (e.hp < e.maxHp && !e.boss) {
        const w = e.r * 2.4;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w, 4);
        ctx.fillStyle = '#7fbf4d';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w * clamp(e.hp / e.maxHp, 0, 1), 4);
      }
    }});
  }
  draws.push({ y: player.y, f: () => drawFigure(player.x, player.y, playerFigure()) });
  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.f();

  // ---- projectiles over actors ----
  ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 10;
  for (const b of bolts) {
    ctx.strokeStyle = '#9ef0ff'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
  }
  ctx.shadowColor = '#d24dff';
  for (const b of ebolts) {
    ctx.fillStyle = '#d24dff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ---- nova beam ----
  if (beam) {
    const L = 1500;
    const oy = -14; // fired from chest height
    const g = ctx.createLinearGradient(player.x, player.y + oy, player.x + Math.cos(beam.a) * L, player.y + oy + Math.sin(beam.a) * L);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.15, 'rgba(120,220,255,0.9)');
    g.addColorStop(1, 'rgba(60,140,255,0)');
    ctx.save();
    ctx.translate(player.x, player.y + oy); ctx.rotate(beam.a);
    const pulse = 1 + Math.sin(performance.now() / 30) * 0.12;
    ctx.fillStyle = g;
    ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 40;
    ctx.fillRect(0, -beam.w / 2 * pulse, L, beam.w * pulse);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, -beam.w / 6, L * 0.9, beam.w / 3);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
  if (charging && beamCharge > 0.05) {
    const r = 8 + beamCharge * 26;
    ctx.save();
    ctx.translate(player.x + Math.cos(player.aim) * 32, player.y - 14 + Math.sin(player.aim) * 32);
    ctx.fillStyle = `rgba(120,220,255,${0.5 + beamCharge * 0.5})`;
    ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, 0, r * (1 + Math.sin(performance.now() / 60) * 0.1), 0, TAU); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;
  }

  // ---- lightning ----
  for (const z of zaps) {
    ctx.strokeStyle = 'rgba(180,220,255,0.9)'; ctx.lineWidth = 2;
    ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(z.x1, z.y1);
    const mx = (z.x1 + z.x2) / 2 + rand(-18, 18), my = (z.y1 + z.y2) / 2 + rand(-18, 18);
    ctx.lineTo(mx, my); ctx.lineTo(z.x2, z.y2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ---- particles ----
  for (const p of particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    if (p.ring) {
      ctx.strokeStyle = p.color; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
    } else {
      ctx.fillStyle = p.color; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // ---- tree canopies over everything ----
  for (const o of obstacles) {
    if (o.type !== 'tree') continue;
    ctx.globalAlpha = 0.88;
    const cr = 46 + Math.sin(o.seed * 5) * 8;
    const sway = Math.sin(performance.now() / 900 + o.seed) * 3;
    ctx.fillStyle = '#1d3a22';
    ctx.beginPath(); ctx.arc(o.x + sway, o.y - 34, cr, 0, TAU); ctx.fill();
    ctx.fillStyle = '#25482a';
    ctx.beginPath(); ctx.arc(o.x + sway - cr * 0.3, o.y - 34 - cr * 0.25, cr * 0.55, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---- floaters (outlined for readability over any terrain) ----
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const f of floaters) {
    ctx.font = f.big ? 'bold 17px Segoe UI' : 'bold 13px Segoe UI';
    ctx.globalAlpha = clamp(f.life / 0.9, 0, 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // ---- boss health bar ----
  const boss = enemies.find(e => e.boss && !e.dead);
  if (boss) {
    const w = Math.min(420, VW * 0.5);
    const by = VH - 40; // bottom of screen, clear of the top HUD
    ctx.fillStyle = 'rgba(8,14,26,0.85)';
    ctx.fillRect(VW / 2 - w / 2 - 3, by, w + 6, 18);
    ctx.fillStyle = '#3a1020';
    ctx.fillRect(VW / 2 - w / 2, by + 3, w, 12);
    ctx.fillStyle = '#ff2d55';
    ctx.fillRect(VW / 2 - w / 2, by + 3, w * clamp(boss.hp / boss.maxHp, 0, 1), 12);
    ctx.fillStyle = '#ffb0b7'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('GHAROK — ORK WARLORD OF THE RIFT', VW / 2, by - 5);
  }

  // ---- current region name, above the boss bar when one is showing ----
  if ((state === 'playing' || state === 'shop') && currentRegion) {
    const ry = boss ? (VH - 40) - 22 : VH - 20;
    const f = clamp(regionFlashT, 0, 1);
    ctx.font = `bold ${(12 + 4 * f).toFixed(1)}px Segoe UI`;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
    const txt = `⟨ ${currentRegion} ⟩`;
    ctx.strokeText(txt, VW / 2, ry);
    ctx.fillStyle = f > 0 ? '#ffd54a' : 'rgba(255,213,74,.75)';
    ctx.fillText(txt, VW / 2, ry);
  }

  // ---- night vignette during waves ----
  if (waveActive) {
    const v = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
    v.addColorStop(0, 'rgba(5,5,20,0)');
    v.addColorStop(1, 'rgba(8,2,26,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (paused) {
    ctx.fillStyle = 'rgba(3,5,10,0.6)'; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#ffd54a'; ctx.font = 'bold 42px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VW / 2, VH / 2);
  }
}

function drawDecor(d) {
  ctx.save(); ctx.translate(d.x, d.y);
  switch (d.type) {
    case 'tuft':
      ctx.strokeStyle = 'rgba(70,120,60,0.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) { ctx.moveTo(i * 2, 0); ctx.lineTo(i * 3 + Math.sin(d.seed + i) * 1.5, -5 - (i === 0 ? 3 : 0)); }
      ctx.stroke(); break;
    case 'flower':
      ctx.fillStyle = d.seed > 4.5 ? '#c77fd6' : '#e0d06a';
      ctx.beginPath(); ctx.arc(0, -3, 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(70,120,60,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -3); ctx.stroke(); break;
    case 'mushroom':
      ctx.fillStyle = '#b5651d'; ctx.beginPath(); ctx.arc(0, -3, 3, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#d9c9a8'; ctx.fillRect(-1, -3, 2, 3); break;
    case 'pebble':
      ctx.fillStyle = 'rgba(120,130,150,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 2, d.seed, 0, TAU); ctx.fill(); break;
    case 'bone':
      ctx.strokeStyle = 'rgba(210,200,170,0.65)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(4, -1); ctx.stroke();
      ctx.fillStyle = 'rgba(210,200,170,0.65)';
      ctx.beginPath(); ctx.arc(-4, 1, 1.6, 0, TAU); ctx.arc(4, -1, 1.6, 0, TAU); ctx.fill(); break;
    case 'skull':
      ctx.fillStyle = 'rgba(215,205,175,0.8)';
      ctx.beginPath(); ctx.arc(0, -1, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1512';
      ctx.fillRect(-2, -2, 1.4, 1.6); ctx.fillRect(0.8, -2, 1.4, 1.6); break;
    case 'crack':
      ctx.strokeStyle = 'rgba(8,10,16,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-5, 0);
      ctx.lineTo(-2, -1 + d.seed % 2); ctx.lineTo(1, 1); ctx.lineTo(5, -1);
      ctx.stroke(); break;
    case 'reed': {
      const sway = Math.sin(performance.now() / 800 + d.seed) * 1.5;
      ctx.strokeStyle = 'rgba(90,130,90,0.75)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) { ctx.moveTo(i * 2.5, 0); ctx.lineTo(i * 2.5 + sway, -9 - (i === 0 ? 4 : 0)); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,100,60,0.8)';
      ctx.fillRect(sway - 1, -14, 2, 4); break; }
    case 'lily':
      ctx.fillStyle = 'rgba(60,110,80,0.7)';
      ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.8, d.seed, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(20,40,36,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, -1); ctx.stroke(); break;
  }
  ctx.restore();
}

function drawObstacle(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.type === 'crate') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, o.r * 0.5, o.r * 1.1, o.r * 0.4, 0, 0, TAU); ctx.fill();
    const s = o.r * 1.5;
    ctx.fillStyle = '#20304a'; ctx.strokeStyle = '#3d5a86'; ctx.lineWidth = 3;
    ctx.fillRect(-s / 2, -s, s, s); ctx.strokeRect(-s / 2, -s, s, s);
    ctx.strokeStyle = 'rgba(77,225,255,.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-s / 4, -s * 0.75, s / 2, s / 2);
  } else if (o.type === 'rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, o.r * 0.35, o.r * 1.15, o.r * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a3040'; ctx.strokeStyle = '#454f66'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + o.seed, rr = o.r * (0.8 + Math.sin(o.seed * 7 + i * 3) * 0.2);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.75 - o.r * 0.35;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.arc(-o.r * 0.25, -o.r * 0.6, o.r * 0.4, 0, TAU); ctx.fill();
  } else if (o.type === 'tree') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 3, 16, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a3826'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(o.seed) * 3, -30); ctx.stroke();
    ctx.strokeStyle = '#3a2c1e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2, -22); ctx.stroke();
  } else if (o.type === 'deadtree') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 3, 13, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3230'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(o.seed) * 4, -34); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1, -20); ctx.lineTo(12, -30);
    ctx.moveTo(-1, -26); ctx.lineTo(-10, -36);
    ctx.moveTo(0, -34); ctx.lineTo(4, -44);
    ctx.stroke();
  } else if (o.type === 'pillar') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 4, o.r * 1.2, o.r * 0.45, 0, 0, TAU); ctx.fill();
    const h = 54 + (o.seed * 7 % 20);
    ctx.fillStyle = '#39404f';
    ctx.fillRect(-o.r * 0.7, -h, o.r * 1.4, h);
    ctx.fillStyle = '#2c313d';
    ctx.fillRect(-o.r * 0.7, -h, o.r * 0.35, h);
    // broken top
    ctx.fillStyle = '#39404f';
    ctx.beginPath();
    ctx.moveTo(-o.r * 0.7, -h); ctx.lineTo(-o.r * 0.2, -h - 8); ctx.lineTo(o.r * 0.3, -h - 3); ctx.lineTo(o.r * 0.7, -h - 10); ctx.lineTo(o.r * 0.7, -h);
    ctx.fill();
    // base
    ctx.fillStyle = '#434b5c';
    ctx.fillRect(-o.r * 0.85, -8, o.r * 1.7, 8);
  }
  ctx.restore();
}

function drawCampProps(draws) {
  // campfire
  draws.push({ y: CAMP.y, f: () => {
    ctx.save(); ctx.translate(CAMP.x, CAMP.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 8, 0, 0, TAU); ctx.fill();
    // stones
    ctx.fillStyle = '#4a5060';
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 15, Math.sin(a) * 7, 3.4, 0, TAU); ctx.fill();
    }
    // logs
    ctx.strokeStyle = '#4a3826'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(8, -5); ctx.moveTo(-7, -5); ctx.lineTo(9, -1); ctx.stroke();
    // flame
    const fl = 1 + Math.sin(performance.now() / 90) * 0.2;
    const fg = ctx.createRadialGradient(0, -10, 2, 0, -10, 26 * fl);
    fg.addColorStop(0, 'rgba(255,230,150,0.9)');
    fg.addColorStop(0.4, 'rgba(255,140,40,0.55)');
    fg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.ellipse(0, -12, 12 * fl, 18 * fl, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }});
  // two tents
  for (const [txo, tyo, flip] of [[-95, -40, 1], [70, 55, -1]]) {
    draws.push({ y: CAMP.y + tyo, f: () => {
      ctx.save(); ctx.translate(CAMP.x + txo, CAMP.y + tyo); ctx.scale(flip, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(0, 2, 34, 10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a4a30';
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(0, -34); ctx.lineTo(32, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#493b25';
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(32, 0); ctx.lineTo(12, 0); ctx.lineTo(0, -26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#241c10';
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -14); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }});
  }
}

// ========================= MAIN LOOP ==============================
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state === 'playing' && !paused && !dialogOpen && !treeOpen && !vendorOpen && !settingsOpen) update(dt);
  if (state === 'shop' && !treeOpen && !settingsOpen) {
    shopTimer -= dt;
    $('shopTimer').textContent = Math.max(0, Math.ceil(shopTimer));
    if (shopTimer <= 0) startWave();
  }
  if (state !== 'menu') render();
  else renderMenuBg(now);
  requestAnimationFrame(loop);
}

let menuStars = null;
function renderMenuBg(now) {
  if (!menuStars) {
    menuStars = [];
    for (let i = 0; i < 90; i++) menuStars.push({ x: Math.random(), y: Math.random(), s: rand(0.5, 2.2), p: rand(0, TAU) });
  }
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, VW, VH);
  for (const s of menuStars) {
    ctx.globalAlpha = 0.4 + Math.sin(now / 600 + s.p) * 0.35;
    ctx.fillStyle = s.s > 1.6 ? '#b04dff' : '#4de1ff';
    ctx.beginPath(); ctx.arc(s.x * VW, s.y * VH, s.s, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ========================== NEW GAME ==============================
function newGame() {
  wave = 0; cores = 0; kills = 0; totalCores = 0; runTime = 0; victoryShown = false;
  enemies = []; bolts = []; ebolts = []; grenades = []; pickups = []; particles = []; floaters = []; zaps = [];
  beam = null; beamCharge = 0; charging = false; paused = false; treeOpen = false;
  dialogOpen = false; vendorOpen = false;
  $('dialog').classList.add('hidden'); $('skilltree').classList.add('hidden'); $('vendor').classList.add('hidden');
  tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
  gear.forEach(u => u.lvl = 0);
  Object.keys(skillRanks).forEach(k => delete skillRanks[k]);
  questIdx = 0; questStage = 'offer'; questProgress = 0;
  miraIdx = 0; miraRewarded = false;
  chest = null; graceT = 0; barricades = []; pulseCd = 0;
  currentRegion = '';
  buildWorld();
  resetPlayer();
  campTrackX = player.x; campTrackY = player.y;
  updateQuestHud();
  startWave();
}

// build textures once
tileTex.grass = makeTileTex('grass');
tileTex.ash = makeTileTex('ash');
tileTex.stone = makeTileTex('stone');
tileTex.marsh = makeTileTex('marsh');

// ---------- menu / settings wiring ----------
$('startBtn').onclick = () => { $('menu').classList.add('hidden'); newGame(); };
$('continueBtn').onclick = () => {
  $('menu').classList.add('hidden');
  if (!loadGame()) newGame(); // corrupt/missing save → fresh run
};
$('continueBtn').classList.toggle('hidden', !hasSave());
$('nextWaveBtn').onclick = () => startWave();

bindHold('btnSettings', () => toggleSettings());
$('resumeBtn').onclick = () => toggleSettings();
$('saveGameBtn').onclick = () => {
  saveGame(true);
  $('saveGameBtn').textContent = '💾 SAVED ✓';
  setTimeout(() => $('saveGameBtn').textContent = '💾 SAVE GAME', 1200);
};
$('togShake').onclick = () => { settings.shake = !settings.shake; persistSettings(); refreshToggles(); };
$('togDmg').onclick = () => { settings.dmgText = !settings.dmgText; persistSettings(); refreshToggles(); };
$('rowUiSize').onclick = () => {
  settings.uiScale = UI_SCALES[(UI_SCALES.indexOf(settings.uiScale) + 1) % UI_SCALES.length];
  applyUiScale(); persistSettings(); refreshToggles();
};
$('layoutBtn').onclick = () => {
  // hide the overlay but keep settingsOpen=true so the game stays paused while editing
  $('settings').classList.add('hidden');
  setLayoutEditing(true);
};
$('layoutDone').onclick = () => finishLayoutEdit();
$('layoutReset').onclick = () => {
  settings.layout = null;
  persistSettings(); applyLayout(); positionJoyPlaceholder();
};
$('restartBtn').onclick = () => {
  settingsOpen = false; $('settings').classList.add('hidden');
  $('shop').classList.add('hidden'); $('gameover').classList.add('hidden');
  newGame();
};
$('quitBtn').onclick = () => {
  saveGame(false);
  settingsOpen = false;
  $('settings').classList.add('hidden');
  $('shop').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('btnTalk').classList.add('hidden');
  state = 'menu';
  $('continueBtn').classList.toggle('hidden', !hasSave());
  $('menu').classList.remove('hidden');
};

requestAnimationFrame(loop);

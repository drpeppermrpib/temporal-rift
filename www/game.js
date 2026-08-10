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
// v2.11 — expanded playfield for forests, gold mines, and town footprint
const WORLD = { w: 4800, h: 4800 };
const CAMP = { x: WORLD.w / 2, y: WORLD.h / 2 };
const FORT  = { x: WORLD.w - 1280, y: 160, w: 1100, h: 1000 };            // Northreach Fort (stone)
const ASH   = { x: 160, y: WORLD.h - 1280, w: 1150, h: 1120 };            // The Ashen Reach
const MARSH = { x: WORLD.w - 1400, y: WORLD.h - 1400, w: 1240, h: 1240 }; // Duskmere Marsh

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
  // scattered rocks & supply crates (variants: 0 boulder, 1 cluster, 2 slab, 3 mossy)
  for (let i = 0; i < 40; i++) {
    if (i % 2) {
      const variant = i % 8 === 1 ? 0 : i % 8 === 3 ? 1 : i % 8 === 5 ? 2 : 3;
      tryPlace(rand(160, WORLD.w - 160), rand(160, WORLD.h - 160), rand(34, 58), 'rock')
        && (obstacles[obstacles.length - 1].variant = variant);
    } else {
      tryPlace(rand(160, WORLD.w - 160), rand(160, WORLD.h - 160), rand(36, 62), 'crate');
    }
  }
  // dedicated choppable forest stands (v2.11) + scattered trees + marsh deadwood
  forestStands = [];
  const standSites = [
    { x: CAMP.x - 520, y: CAMP.y - 380 },
    { x: CAMP.x + 560, y: CAMP.y - 420 },
    { x: CAMP.x - 480, y: CAMP.y + 520 },
    { x: CAMP.x + 620, y: CAMP.y + 480 },
    { x: CAMP.x - 900, y: CAMP.y + 40 },
    { x: CAMP.x + 940, y: CAMP.y - 60 },
    { x: FORT.x - 220, y: FORT.y + FORT.h + 180 },
    { x: ASH.x + ASH.w + 200, y: ASH.y - 160 },
  ];
  standSites.forEach((site, si) => {
    const sx = clamp(site.x, 260, WORLD.w - 260);
    const sy = clamp(site.y, 260, WORLD.h - 260);
    if (dist2(sx, sy, CAMP.x, CAMP.y) < 220 * 220) return;
    forestStands.push({ x: sx, y: sy, r: 110, id: si });
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * TAU + si * 0.4, d = 28 + (j % 3) * 22;
      const tx = sx + Math.cos(a) * d, ty = sy + Math.sin(a) * d;
      const size = j % 4 === 0 ? 2 : j % 2 === 0 ? 1 : 0;
      if (tryPlace(tx, ty, 12 + size * 3, 'tree')) {
        const t = obstacles[obstacles.length - 1];
        t.size = size;
        t.standId = si;
        t.woodLeft = 22 + size * 16;
        t.maxWood = t.woodLeft;
      }
    }
  });
  // extra scattered trees across grass
  for (let i = 0; i < 48; i++) {
    const cx = rand(300, WORLD.w - 300), cy = rand(300, WORLD.h - 300);
    const z = zoneAt(cx, cy);
    if (z === 'grass') {
      const size = i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
      if (tryPlace(cx, cy, 12 + size * 3, 'tree')) {
        const t = obstacles[obstacles.length - 1];
        t.size = size;
        t.woodLeft = 18 + size * 14;
        t.maxWood = t.woodLeft;
      }
    } else if (z === 'marsh') tryPlace(cx, cy, 12, 'deadtree');
  }
  // WC2-style gold mine buildings (v2.11) — laborers enter / carry gold out
  goldVeins = []; // kept for save compat / minimap alias
  goldMines = [];
  const mineSites = [
    { x: CAMP.x - 380, y: CAMP.y + 280 },
    { x: CAMP.x + 420, y: CAMP.y + 260 },
    { x: CAMP.x - 700, y: CAMP.y - 200 },
    { x: CAMP.x + 740, y: CAMP.y - 240 },
    { x: ASH.x + ASH.w * 0.55, y: ASH.y + 140 },
    { x: FORT.x + 120, y: FORT.y + FORT.h - 100 },
    { x: ASH.x + 180, y: ASH.y + ASH.h * 0.4 },
    { x: FORT.x + FORT.w * 0.4, y: FORT.y + FORT.h + 220 },
    { x: MARSH.x - 180, y: MARSH.y + 200 },
  ];
  mineSites.forEach((m, i) => {
    const bx = clamp(m.x, 200, WORLD.w - 200);
    const by = clamp(m.y, 200, WORLD.h - 200);
    if (Math.hypot(bx - CAMP.x, by - CAMP.y) < 200) return;
    if (obstacles.some(o => dist2(bx, by, o.x, o.y) < 80 * 80)) return;
    if (goldMines.some(g => dist2(bx, by, g.x, g.y) < 140 * 140)) return;
    const stock = 70 + (i % 3) * 20;
    goldMines.push({
      x: bx, y: by, r: 28, goldLeft: stock, maxGold: stock,
      occupied: 0, name: 'Gold Mine',
    });
  });
  goldVeins = goldMines; // laborers / draw / minimap still iterate goldVeins
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
let talkHeld = false;

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (dialogOpen) { advanceDialog(); return; }
  if (layoutEditing) { if (e.code === 'KeyP' || e.code === 'Escape') finishLayoutEdit(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (buildPickOpen) { closeBuildPick(); return; }
    if (structPanelOpen) { closeStructPanel(); return; }
    if (unitPanelOpen) { closeUnitPanel(); return; }
    if (soundMenuOpen) { closeSoundMenu(); return; }
    toggleSettings();
  }
  if (e.code === 'KeyF') tryTransform();
  if (e.code === 'KeyQ') tryNova();
  if (e.code === 'KeyE') tryGrenade();
  if (e.code === 'KeyK') toggleTree();
  if (e.code === 'KeyT') {
    talkHeld = true;
    // tap Talk for NPCs; hold Talk near a downed squadmate / co-op ally to channel revive
    if (!nearestDownedCompanion() && !nearestDownedMilitia() && !nearestDownedLaborer() && !nearestDownedAlly()) tryTalk();
  }
  if (e.code === 'KeyB') openBuildPick();
  if (e.code === 'KeyH') tryAetherMend();
  if (e.code === 'KeyC') trySummonColossus();
});
addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'KeyT') talkHeld = false;
});
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (dialogOpen) { advanceDialog(); return; }
  if (e.button === 0) {
    if (trySelectStructureAt(e.clientX, e.clientY)) return;
    mouse.down = true;
  }
  if (e.button === 2) mouse.rdown = true;
});
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    if (trySelectStructureAt(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); }
  }
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
bindHold('btnBuild', () => openBuildPick());
bindHold('btnMend', () => tryAetherMend());
bindHold('btnColossus', () => trySummonColossus());
bindHold('btnTalk', () => {
  talkHeld = true;
  if (!nearestDownedCompanion() && !nearestDownedMilitia() && !nearestDownedLaborer() && !nearestDownedAlly()) tryTalk();
}, () => { talkHeld = false; });
$('btnMenu').addEventListener('pointerdown', e => { if (layoutEditing) return; e.preventDefault(); toggleTree(); });

// ==================== VERSION & UPDATE CHECK ======================
// Store/Play versionName stays 2.13.2 until next batch (save fix + stronghold + art).
// Town/RTS persist is coded on master but UNRELEASED — do not bump versionCode yet.
const APP_VERSION = '2.13.2';
$('appVer').textContent = 'v' + APP_VERSION;

// Distribution channel gate. 'github' = sideloaded APK / web demo, where the
// GitHub-release update banner is wanted. 'play' = Google Play build, which
// must NEVER offer out-of-store updates (Play policy) — Play updates itself.
// The Play build injects window.TR_CHANNEL='play' via index.html at build time
// (see build-all.ps1); everything else defaults to 'github'.
const UPDATE_CHANNEL = window.TR_CHANNEL || 'github';

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
if (UPDATE_CHANNEL === 'github') checkForUpdate();

// ==================== SETTINGS & SAVE SYSTEM ======================
const SAVE_KEY = 'tr_save1', SETTINGS_KEY = 'tr_settings';
let settingsOpen = false, soundMenuOpen = false;
const settings = {
  shake: true, dmgText: true, vibro: IS_TOUCH, uiScale: 'normal', btnStyle: 'classic',
  hudOffset: 0, mapSize: 'medium', adaptCollapsed: false, adaptHidden: false,
  camView: 'normal', layout: null,
  masterVol: 0.8, sfxVol: 0.9, musicVol: 0.5,
  muteMaster: false, muteSfx: false, muteMusic: false,
};
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
function persistSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }

const UI_SCALES = ['small', 'normal', 'large'];
function applyUiScale() {
  document.body.classList.remove('ui-small', 'ui-large');
  if (settings.uiScale === 'small') document.body.classList.add('ui-small');
  if (settings.uiScale === 'large') document.body.classList.add('ui-large');
  // NOTE: runs before the layout consts below exist — callers that change the
  // scale at runtime must call applyLayout() afterwards to re-clamp positions
}
applyUiScale();

const BTN_STYLES = ['classic', 'neon', 'minimal'];
function applyBtnStyle() {
  document.body.classList.remove('btn-neon', 'btn-minimal');
  if (settings.btnStyle === 'neon') document.body.classList.add('btn-neon');
  if (settings.btnStyle === 'minimal') document.body.classList.add('btn-minimal');
}
applyBtnStyle();

// extra top padding for the HUD — many Android webviews report a 0 safe-area
// inset even when a status bar overlays the game, so let the player dial it in
const HUD_OFFSETS = [0, 16, 32, 48];
function applyHudOffset() {
  document.documentElement.style.setProperty('--hudTop', (settings.hudOffset || 0) + 'px');
}
applyHudOffset();

// mini-map size (v2.9.1) — Small / Medium / Large, persisted in tr_settings
const MAP_SIZES = ['small', 'medium', 'large'];
const MAP_SIZE_PX = { small: 96, medium: 128, large: 168 };
function mapSizePx() {
  return MAP_SIZE_PX[settings.mapSize] || MAP_SIZE_PX.medium;
}
function applyMapSize() {
  if (!MAP_SIZES.includes(settings.mapSize)) settings.mapSize = 'medium';
  document.body.classList.remove('map-small', 'map-medium', 'map-large');
  document.body.classList.add('map-' + settings.mapSize);
  const c = $('minimap');
  if (c) {
    const s = mapSizePx();
    // match backing store to CSS size (1x is fine — map is symbolic, not photo)
    if (c.width !== s) { c.width = s; c.height = s; }
  }
}
applyMapSize();

function applyAdaptCollapse() {
  const box = $('adaptbox');
  if (!box) return;
  // Settings "Hide learning panel" fully removes it from combat HUD (persisted).
  // Chevron collapse still works when the panel is shown.
  box.classList.toggle('force-hidden', !!settings.adaptHidden);
  box.classList.toggle('collapsed', !settings.adaptHidden && !!settings.adaptCollapsed);
  const chev = $('adaptChev');
  if (chev) chev.textContent = settings.adaptCollapsed ? '▸' : '▾';
}
applyAdaptCollapse();

// camera peek (v2.8): shifts the camera center down by a FIXED % of the
// viewport height (not aim-following), so the hero sits a little higher on
// screen and more of the field ahead is visible. Persisted in tr_settings.
const CAM_VIEWS = [
  { id: 'normal', label: 'NORMAL',      pct: 0 },
  { id: 'low',    label: 'LOW (5%)',    pct: 0.05 },
  { id: 'lower',  label: 'LOWER (10%)', pct: 0.10 },
];
function camViewPct() {
  const v = CAM_VIEWS.find(v => v.id === settings.camView);
  return v ? v.pct : 0;
}

// haptic feedback — navigator.vibrate works in the Android webview, silently
// no-ops elsewhere. Deliberately NOT hooked to rifle fire (way too spammy);
// only melee/nova, damage taken, explosions, and big events buzz.
function buzz(pattern) {
  if (!settings.vibro || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (e) { /* some webviews throw on odd patterns */ }
}

// ---------- SOUND ENGINE (v2.8.7) — shared WebAudio graph, synthesized SFX ----------
// Categories: sfx / music / ui. Lazy AudioContext (autoplay-safe). Vibration stays
// on settings.vibro via buzz() — never gated by muteMaster/muteSfx.
const GHAROK_STOMP_JUICE = true;
const sfx = (() => {
  let ac = null, noiseBuf = null, graph = null, musicNodes = null;
  const last = Object.create(null);

  function noise(ctx) {
    if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
      noiseBuf = ctx.createBuffer(1, (ctx.sampleRate * 0.5) | 0, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : +v || 0; }
  function ensure() {
    if (ac === false) return null;
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ac = false; return null; }
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    if (!graph) {
      const master = ac.createGain();
      const sfxBus = ac.createGain();
      const musicBus = ac.createGain();
      const uiBus = ac.createGain();
      sfxBus.connect(master); musicBus.connect(master); uiBus.connect(master);
      master.connect(ac.destination);
      graph = { master, sfx: sfxBus, music: musicBus, ui: uiBus };
      applyVolumes();
    }
    return ac;
  }
  function bus(cat) {
    if (!graph) return null;
    return graph[cat] || graph.sfx;
  }
  function applyVolumes() {
    if (!graph) return;
    const m = settings.muteMaster ? 0 : clamp01(settings.masterVol);
    graph.master.gain.value = m;
    graph.sfx.gain.value = settings.muteSfx ? 0 : clamp01(settings.sfxVol);
    graph.music.gain.value = settings.muteMusic ? 0 : clamp01(settings.musicVol);
    graph.ui.gain.value = settings.muteSfx ? 0 : clamp01(settings.sfxVol);
    syncMusic();
  }
  function syncMusic() {
    const want = !settings.muteMaster && !settings.muteMusic && clamp01(settings.musicVol) > 0.01
      && (typeof state !== 'undefined' ? (state === 'playing' || state === 'shop') : false);
    if (!want) { stopMusic(); return; }
    const ctx = ensure();
    if (!ctx || ctx.state !== 'running' || !graph) return;
    if (musicNodes) return;
    try {
      const now = ctx.currentTime;
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 82.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.035, now + 1.2);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280;
      o1.connect(g); o2.connect(g); g.connect(lp).connect(graph.music);
      o1.start(now); o2.start(now);
      musicNodes = { o1, o2, g };
    } catch (e) { musicNodes = null; }
  }
  function stopMusic() {
    if (!musicNodes) return;
    try {
      const g = musicNodes.g, ctx = ac;
      if (ctx) {
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      }
      musicNodes.o1.stop((ac ? ac.currentTime : 0) + 0.5);
      musicNodes.o2.stop((ac ? ac.currentTime : 0) + 0.5);
    } catch (e) {}
    musicNodes = null;
  }

  // Registered synth voices — connect into `dest` (category bus), never ac.destination.
  const voices = {
    whoosh(ctx, dest, now) {
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(1900, now);
      bp.frequency.exponentialRampToValueAtTime(240, now + 0.32);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      src.connect(bp).connect(ng).connect(dest);
      osc.connect(og).connect(dest);
      src.start(now); src.stop(now + 0.4);
      osc.start(now); osc.stop(now + 0.35);
    },
    zap(ctx, dest, now) {
      const osc = ctx.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      const th = ctx.createOscillator(); th.type = 'sine';
      th.frequency.setValueAtTime(90, now + 0.02);
      th.frequency.exponentialRampToValueAtTime(38, now + 0.22);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, now + 0.02);
      tg.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(og).connect(dest);
      th.connect(tg).connect(dest);
      src.connect(lp).connect(ng).connect(dest);
      osc.start(now); osc.stop(now + 0.18);
      th.start(now); th.stop(now + 0.3);
      src.start(now); src.stop(now + 0.16);
    },
    crackle(ctx, dest, now) {
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 8;
      bp.frequency.setValueAtTime(3200, now);
      bp.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      for (let i = 0; i < 4; i++) {
        ng.gain.exponentialRampToValueAtTime(0.13, now + 0.01 + i * 0.03);
        ng.gain.exponentialRampToValueAtTime(0.012, now + 0.025 + i * 0.03);
      }
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now + 0.1);
      og.gain.exponentialRampToValueAtTime(0.17, now + 0.12);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      src.connect(bp).connect(ng).connect(dest);
      osc.connect(og).connect(dest);
      src.start(now); src.stop(now + 0.18);
      osc.start(now + 0.1); osc.stop(now + 0.24);
    },
    stomp(ctx, dest, now) {
      const th = ctx.createOscillator(); th.type = 'sine';
      th.frequency.setValueAtTime(72, now);
      th.frequency.exponentialRampToValueAtTime(28, now + 0.18);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, now);
      tg.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      th.connect(tg).connect(dest);
      src.connect(lp).connect(ng).connect(dest);
      th.start(now); th.stop(now + 0.24);
      src.start(now); src.stop(now + 0.14);
    },
    melee(ctx, dest, now) {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
      bp.frequency.value = 600;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(og).connect(dest);
      src.connect(bp).connect(ng).connect(dest);
      osc.start(now); osc.stop(now + 0.16);
      src.start(now); src.stop(now + 0.12);
    },
    hurt(ctx, dest, now) {
      const osc = ctx.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(og).connect(dest);
      osc.start(now); osc.stop(now + 0.22);
    },
    levelup(ctx, dest, now) {
      const notes = [523, 659, 784, 1046];
      for (let i = 0; i < notes.length; i++) {
        const o = ctx.createOscillator(); o.type = 'triangle';
        o.frequency.value = notes[i];
        const g = ctx.createGain();
        const t = now + i * 0.08;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.1, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g).connect(dest);
        o.start(t); o.stop(t + 0.3);
      }
    },
    waveclear(ctx, dest, now) {
      const notes = [392, 494, 587, 784];
      for (let i = 0; i < notes.length; i++) {
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.value = notes[i];
        const g = ctx.createGain();
        const t = now + i * 0.1;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(dest);
        o.start(t); o.stop(t + 0.38);
      }
    },
    click(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 880;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      o.connect(g).connect(dest);
      o.start(now); o.stop(now + 0.07);
    },
    fire(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(920, now);
      o.frequency.exponentialRampToValueAtTime(420, now + 0.05);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.05, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.04, now + 0.005);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      o.connect(g).connect(dest);
      src.connect(hp).connect(ng).connect(dest);
      o.start(now); o.stop(now + 0.08);
      src.start(now); src.stop(now + 0.06);
    },
    cleaver(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.28);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      o.connect(g).connect(dest);
      src.connect(lp).connect(ng).connect(dest);
      o.start(now); o.stop(now + 0.34);
      src.start(now); src.stop(now + 0.24);
    },
    // Enemy combat barks — pitch/timbre via opts.voice
    bark(ctx, dest, now, opts) {
      const v = (opts && opts.voice) || 'husk';
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const og = ctx.createGain();
      const ng = ctx.createGain();
      const osc = ctx.createOscillator();
      if (v === 'skeleton') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6;
        bp.frequency.setValueAtTime(2800, now);
        bp.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.13);
        src.start(now); src.stop(now + 0.15);
      } else if (v === 'bulwark' || v === 'warlord') {
        const base = v === 'warlord' ? 72 : 95;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 0.45, now + 0.28);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(v === 'warlord' ? 0.16 : 0.13, now + 0.04);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.34);
        src.start(now); src.stop(now + 0.28);
      } else if (v === 'shaman') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(og).connect(dest);
        src.connect(hp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.24);
        src.start(now); src.stop(now + 0.22);
      } else if (v === 'sprinter') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
        bp.frequency.value = 900;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.16);
        src.start(now); src.stop(now + 0.12);
      } else if (v === 'ravager') {
        // Deep cyclops-orc roar — lower + longer than bulwark (95→), above warlord (72→)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(82, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.36);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.15, now + 0.045);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.11, now + 0.035);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.42);
        src.start(now); src.stop(now + 0.32);
      } else {
        // husk — wet moan / uuhh
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(118, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.32);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.38);
        src.start(now); src.stop(now + 0.32);
      }
    },
  };
  const meta = {
    whoosh: { cat: 'sfx', throttle: 0.09 },
    zap: { cat: 'sfx', throttle: 0.12 },
    crackle: { cat: 'sfx', throttle: 0.1 },
    stomp: { cat: 'sfx', throttle: 0.14 },
    melee: { cat: 'sfx', throttle: 0.08 },
    hurt: { cat: 'sfx', throttle: 0.1 },
    levelup: { cat: 'sfx', throttle: 0.3 },
    waveclear: { cat: 'sfx', throttle: 0.5 },
    click: { cat: 'ui', throttle: 0.04 },
    fire: { cat: 'sfx', throttle: 0.055 },
    cleaver: { cat: 'sfx', throttle: 0.2 },
    bark: { cat: 'sfx', throttle: 0.12 },
  };

  const api = {
    play(name, opts) {
      try {
        const voice = voices[name];
        if (!voice) return;
        if (name === 'stomp' && !GHAROK_STOMP_JUICE) return;
        const m = meta[name] || { cat: 'sfx', throttle: 0 };
        if (settings.muteMaster) return;
        if ((m.cat === 'sfx' || m.cat === 'ui') && settings.muteSfx) return;
        if (m.cat === 'music' && settings.muteMusic) return;
        const ctx = ensure();
        if (!ctx || ctx.state !== 'running') return;
        const dest = bus(m.cat);
        if (!dest) return;
        const now = ctx.currentTime;
        const th = (opts && opts.throttle != null) ? opts.throttle : m.throttle;
        if (th > 0 && now - (last[name] || -9) < th) return;
        last[name] = now;
        voice(ctx, dest, now, opts || {});
      } catch (e) { /* audio must never break gameplay */ }
    },
    setMaster(v) { settings.masterVol = clamp01(v); applyVolumes(); persistSettings(); },
    setSfx(v) { settings.sfxVol = clamp01(v); applyVolumes(); persistSettings(); },
    setMusic(v) { settings.musicVol = clamp01(v); applyVolumes(); persistSettings(); },
    setMuteMaster(b) { settings.muteMaster = !!b; applyVolumes(); persistSettings(); },
    setMuteSfx(b) { settings.muteSfx = !!b; applyVolumes(); persistSettings(); },
    setMuteMusic(b) { settings.muteMusic = !!b; applyVolumes(); persistSettings(); },
    applyFromSettings() { applyVolumes(); },
    unlock() { ensure(); syncMusic(); },
    syncMusic() { syncMusic(); },
  };
  return api;
})();

// Thin wrappers — existing call sites keep working; all route through the engine.
function playWhoosh() { sfx.play('whoosh'); }
function playZapThump() { sfx.play('zap'); }
function playCracklePop() { sfx.play('crackle'); }
function playStomp() { sfx.play('stomp'); }

// ============ ENEMY BARKS (v2.13.0) — synth grunts + original orc lines ============
// Respects muteMaster / muteSfx via sfx.play. Rate-limited per-enemy + global.
const ENEMY_BARK_LINES = {
  husk:     ['uuhh…', 'grr', 'hunger…', 'flesh…', 'moorr'],
  sprinter: ['rar!', 'get them!', 'yargh!', 'fast kill!'],
  skeleton: ['click…', 'hss', 'bones…', 'rattle!', 'clack'],
  bulwark:  ['GRR', 'RAAR', 'crush!', 'hold the line!', 'smash'],
  shaman:   ['hex…', 'hss', 'rift take you', 'curse!', 'ash bind'],
  // Deep cyclops-orc — original lines; distinct from bulwark tank shouts
  ravager:  ['grrrahh', 'smash!', 'rarrr', 'one eye...', 'crush bone!', 'break them!', 'GRRAHH'],
  warlord:  ['kneel!', 'ash claims you', 'GRRRAH', 'no mercy'],
};
const ENEMY_BARK_COLORS = {
  husk: '#9aaa88', sprinter: '#c8a070', skeleton: '#a8d8e8',
  bulwark: '#ff6a4d', shaman: '#b08cff', ravager: '#e07040', warlord: '#ff4d5e',
};
let _barkGlobalT = 0;
function tryEnemyBark(e, reason) {
  if (!e || e.dead || e.boss && reason === 'idle') return;
  const now = performance.now() / 1000;
  const minGap = reason === 'aggro' ? 0.2 : reason === 'attack' ? 1.4 : 4.5;
  if ((e._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.35) return; // global anti-spam
  // combat idle barks only when reasonably near the fight
  if (reason === 'combat') {
    const d2p = dist2(e.x, e.y, player.x, player.y);
    if (d2p > 520 * 520) return;
    if (Math.random() > 0.35) return;
  }
  if (reason === 'attack' && Math.random() > 0.45) return;
  const lines = ENEMY_BARK_LINES[e.type] || ENEMY_BARK_LINES.husk;
  const line = lines[(Math.random() * lines.length) | 0];
  e._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: e.type, throttle: 0.08 });
  const col = ENEMY_BARK_COLORS[e.type] || '#c8d0b8';
  addFloater(e.x, e.y - (e.r * 2.2 + 8), line, col, !!e.boss || e.type === 'bulwark' || e.type === 'ravager');
}

// Unlock AudioContext on first user gesture (desktop autoplay policies).
['pointerdown', 'keydown', 'touchstart'].forEach(ev => {
  addEventListener(ev, () => sfx.unlock(), { once: false, passive: true });
});

// ---------- controls placement (custom layout) ----------
// v2 (app 2.6) layout format: per-button positions.
//   { v:2, tbtns:{right,bottom}|null, joy:{left,bottom,w,h}|null,
//     btns:{ btnFire:{right,bottom}, ... } }
// `tbtns` is the LEGACY v1 whole-clump offset — still applied to the #tbtns grid
// before measuring, so pre-2.6 saves keep their moved cluster with zero migration;
// per-button entries in `btns` then override individual buttons on top of it.
const GRID_BTN_IDS = ['btnBuild', 'btnForm', 'btnGren', 'btnDash', 'btnNova', 'btnBeam', 'btnFire'];
const FLOAT_BTN_IDS = ['btnTalk', 'btnMend', 'btnMenu', 'btnSettings']; // fixed-position controls outside the grid

function applyLayout() {
  const tb = $('tbtns'), jz = $('joyZone');
  const L = settings.layout || {};
  const btns = L.btns || {};
  // 1) restore stock flow: legacy clump offset on the container, buttons back in the grid
  if (L.tbtns) { tb.style.right = L.tbtns.right + 'px'; tb.style.bottom = L.tbtns.bottom + 'px'; }
  else { tb.style.right = ''; tb.style.bottom = ''; }
  for (const id of GRID_BTN_IDS) {
    const s = $(id).style;
    s.position = s.left = s.top = s.right = s.bottom = '';
  }
  for (const id of FLOAT_BTN_IDS) {
    const s = $(id).style;
    s.left = s.top = s.right = s.bottom = s.transform = '';
  }
  // 2) measure the grid defaults for the current ui scale / clump offset…
  const defs = {};
  for (const id of GRID_BTN_IDS) defs[id] = $(id).getBoundingClientRect();
  // 3) …then take every grid button out of flow at (custom ?? default), clamped
  // on-screen. All of them leave the grid together, so nothing reflows underneath.
  // If the controls are hidden right now (desktop, editor closed) the rects are
  // all zero — no real defaults to measure — so leave untouched buttons in grid
  // flow and only pin the explicitly-customized ones (re-clamped when visible).
  const gridHidden = defs.btnFire.width === 0;
  for (const id of GRID_BTN_IDS) {
    if (gridHidden && !btns[id]) continue;
    const el = $(id), r = defs[id];
    const pos = btns[id] || { right: Math.round(VW - r.right), bottom: Math.round(VH - r.bottom) };
    el.style.position = 'fixed';
    el.style.right = clamp(pos.right, 0, Math.max(0, VW - r.width)) + 'px';
    el.style.bottom = clamp(pos.bottom, 0, Math.max(0, VH - r.height)) + 'px';
  }
  // floating controls only get inline styles when the player moved them
  for (const id of FLOAT_BTN_IDS) {
    if (!btns[id]) continue;
    const el = $(id), r = el.getBoundingClientRect();
    el.style.left = el.style.top = 'auto';
    el.style.transform = 'none'; // btnTalk is centered via translateX by default
    el.style.right = clamp(btns[id].right, 0, Math.max(0, VW - r.width)) + 'px';
    el.style.bottom = clamp(btns[id].bottom, 0, Math.max(0, VH - r.height)) + 'px';
  }
  if (L.joy) {
    jz.style.left = clamp(L.joy.left, 0, Math.max(0, VW - L.joy.w)) + 'px';
    jz.style.bottom = clamp(L.joy.bottom, 0, Math.max(0, VH - L.joy.h)) + 'px';
    jz.style.width = L.joy.w + 'px'; jz.style.height = L.joy.h + 'px';
  } else { jz.style.left = ''; jz.style.bottom = ''; jz.style.width = ''; jz.style.height = ''; }
}
applyLayout();
addEventListener('resize', applyLayout);

let layoutEditing = false;
function ensureLayout() {
  if (!settings.layout) settings.layout = { tbtns: null, joy: null };
  if (!settings.layout.btns) settings.layout.btns = {}; // migrate v1 saves in place
  settings.layout.v = 2;
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
let talkWasHidden = false, mendWasHidden = false;
function setLayoutEditing(on) {
  layoutEditing = on;
  document.body.classList.toggle('layout-editing', on);
  $('layoutBar').classList.toggle('hidden', !on);
  const jb = $('joyBase'), jk = $('joyKnob');
  if (on) {
    // TALK / MEND only appear when relevant — show them while editing so they can be placed
    talkWasHidden = $('btnTalk').classList.contains('hidden');
    mendWasHidden = $('btnMend').classList.contains('hidden');
    $('btnTalk').classList.remove('hidden');
    $('btnMend').classList.remove('hidden');
    applyLayout(); // touch controls just became visible → measure real positions
    positionJoyPlaceholder();
  } else {
    if (talkWasHidden) $('btnTalk').classList.add('hidden');
    if (mendWasHidden) $('btnMend').classList.add('hidden');
    jb.style.display = 'none'; jk.style.display = 'none'; jb.style.left = ''; jb.style.top = '';
  }
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
    e.stopPropagation(); // a button drag must not also start a joystick-zone drag
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
// every action button drags independently; positions are stored edge-relative
// (right/bottom) so they survive rotation / resolution changes, clamped on apply
for (const id of GRID_BTN_IDS.concat(FLOAT_BTN_IDS)) {
  makeDraggable($(id), (left, top, w, h) => {
    ensureLayout().btns[id] = { right: Math.round(VW - left - w), bottom: Math.round(VH - top - h) };
    applyLayout();
  });
}
makeDraggable($('joyZone'), (left, top, w, h) => {
  ensureLayout().joy = { left: Math.round(left), bottom: Math.round(VH - top - h), w: Math.round(w), h: Math.round(h) };
  applyLayout();
});

function snapshotTown() {
  // Additive RTS/town payload (v2.13.2+ unreleased). Older saves omit `town`.
  return {
    structures: structures.map(s => ({
      kind: s.kind, x: s.x, y: s.y, r: s.r,
      hp: s.hp, maxHp: s.maxHp, lvl: s.lvl || 1,
    })),
    laborers: laborers.map(L => ({
      id: L.id, x: L.x, y: L.y, r: L.r,
      hp: L.hp, maxHp: L.maxHp, downed: !!L.downed,
      order: L.order || 'auto',
      carry: L.carry && (L.carry.type === 'wood' || L.carry.type === 'gold')
        ? { type: L.carry.type, amt: Math.max(1, L.carry.amt | 0) } : null,
    })),
    militia: militia.map(m => ({
      id: m.id, kind: m.kind, x: m.x, y: m.y, r: m.r,
      hp: m.hp, maxHp: m.maxHp, downed: !!m.downed,
      sk: {
        dmg: (m.sk && m.sk.dmg) || 0,
        armor: (m.sk && m.sk.armor) || 0,
        spd: (m.sk && m.sk.spd) || 0,
      },
    })),
    barricades: barricades.map(b => ({
      x: b.x, y: b.y, r: b.r, hp: b.hp, maxHp: b.maxHp, baseHp: b.baseHp,
    })),
    brickWalls: brickWalls.map(w => ({
      x: w.x, y: w.y, r: w.r, hp: w.hp, maxHp: w.maxHp, baseHp: w.baseHp,
    })),
    waveTrainLeft,
    goldMines: goldMines.map(g => ({
      x: g.x, y: g.y, r: g.r,
      goldLeft: g.goldLeft, maxGold: g.maxGold,
      name: g.name || 'Gold Mine',
    })),
  };
}
function applyTownSave(town) {
  if (!town || typeof town !== 'object') return;
  if (Array.isArray(town.structures)) {
    structures = town.structures.filter(s => s && STRUCT_KINDS[s.kind]).map(s => {
      const def = STRUCT_KINDS[s.kind];
      const lvl = clamp(s.lvl || 1, 1, 3);
      return {
        kind: s.kind, x: +s.x, y: +s.y,
        r: s.r || (def.r + (lvl - 1) * 4),
        hp: Math.max(1, +s.hp || def.hp),
        maxHp: Math.max(1, +s.maxHp || def.hp),
        lvl, trainCd: 0, seepT: 0, kiT: 0,
      };
    });
  }
  if (Array.isArray(town.laborers)) {
    laborers = town.laborers.filter(L => L).map(L => ({
      id: L.id > 0 ? L.id : laborerIdSeq++,
      x: +L.x, y: +L.y, vx: 0, vy: 0, r: L.r || 11,
      hp: Math.max(0, +L.hp || 90),
      maxHp: Math.max(1, +L.maxHp || 90),
      carry: L.carry && (L.carry.type === 'wood' || L.carry.type === 'gold')
        ? { type: L.carry.type, amt: Math.max(1, +L.carry.amt || 1) } : null,
      target: null,
      task: L.order === 'follow' ? 'follow' : 'idle',
      order: L.order || 'auto',
      gatherT: 0, walk: rand(0, 8), facing: 1, hurtT: 0,
      insideMine: false, mineT: 0,
      downed: !!L.downed,
      atkCd: rand(0.2, 0.6), swipeT: 0, retaliateT: 0,
    }));
    laborerIdSeq = laborers.reduce((m, L) => Math.max(m, L.id || 0), 0) + 1;
  }
  if (Array.isArray(town.militia)) {
    militia = town.militia.filter(m => m && MILITIA_TYPES[m.kind]).map(m => {
      const t = MILITIA_TYPES[m.kind];
      const sk = m.sk || {};
      return {
        id: m.id > 0 ? m.id : militiaIdSeq++,
        kind: m.kind, x: +m.x, y: +m.y, vx: 0, vy: 0, r: m.r || t.r,
        hp: Math.max(0, +m.hp || t.hp),
        maxHp: Math.max(1, +m.maxHp || t.hp),
        downed: !!m.downed, hurtT: 0,
        atkCd: rand(0.2, 0.8), walk: rand(0, 8), facing: 1, aim: 0,
        sk: {
          dmg: clamp(sk.dmg || 0, 0, 3),
          armor: clamp(sk.armor || 0, 0, 3),
          spd: clamp(sk.spd || 0, 0, 3),
        },
      };
    });
    militiaIdSeq = militia.reduce((m, u) => Math.max(m, u.id || 0), 0) + 1;
  }
  if (Array.isArray(town.barricades)) {
    barricades = town.barricades.filter(b => b).map(b => ({
      x: +b.x, y: +b.y, r: b.r || BARRICADE_BASE_R,
      hp: Math.max(1, +b.hp || 1),
      maxHp: Math.max(1, +b.maxHp || +b.hp || 1),
      baseHp: Math.max(1, +b.baseHp || +b.maxHp || 1),
      neighbors: 0,
    }));
    refreshBarricadeLinks();
  }
  if (Array.isArray(town.brickWalls)) {
    brickWalls = town.brickWalls.filter(w => w).map(w => ({
      x: +w.x, y: +w.y, r: w.r || BRICKWALL_PILLAR_R,
      hp: Math.max(1, +w.hp || 1),
      maxHp: Math.max(1, +w.maxHp || +w.hp || 1),
      baseHp: Math.max(1, +w.baseHp || +w.maxHp || 1),
      neighbors: 0,
      links: { n: null, e: null, s: null, w: null },
    }));
    refreshBrickWallLinks();
  }
  if (typeof town.waveTrainLeft === 'number')
    waveTrainLeft = clamp(town.waveTrainLeft | 0, 0, 3);
  if (Array.isArray(town.goldMines) && town.goldMines.length) {
    goldMines = town.goldMines.filter(g => g).map(g => ({
      x: +g.x, y: +g.y, r: g.r || 28,
      goldLeft: Math.max(0, +g.goldLeft || 0),
      maxGold: Math.max(1, +g.maxGold || +g.goldLeft || 1),
      occupied: 0, name: g.name || 'Gold Mine',
    }));
    goldVeins = goldMines;
  }
}
function snapshot() {
  return {
    v: 2,
    wavesCompleted: waveActive ? wave - 1 : wave,
    cores, kills, totalCores, runTime, wood, gold,
    player: { hp: player.hp, ki: player.ki, level: player.level, xp: player.xp, xpNext: player.xpNext, sp: player.sp },
    gear: gear.map(u => u.lvl),
    skills: { ...skillRanks },
    quest: { idx: questIdx, stage: questStage, progress: questProgress },
    mira: { idx: miraIdx, rewarded: miraRewarded },
    tally: { ...tally },
    fenceTier,
    sentryTier,
    loadout: { primary: loadout.primary, secondary: loadout.secondary },
    squad: { owned: { ...squad.owned }, active: { ...squad.active } },
    town: snapshotTown(),
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
  wood = s.wood || 0; gold = s.gold || 0;
  gear.forEach((u, i) => u.lvl = s.gear[i] || 0);
  fenceTier = clamp(s.fenceTier || 1, 1, FENCE_MAX_TIER); // pre-2.7 saves default to tier 1
  sentryTier = clamp(s.sentryTier || 0, 0, SENTRY_MAX_TIER); // pre-2.8: no sentries
  Object.assign(skillRanks, s.skills);
  // v2.8 squad + weapon loadout (older saves simply have neither)
  const sq = s.squad || {};
  squad = { owned: { ...(sq.owned || {}) }, active: { ...(sq.active || {}) } };
  loadout = { primary: 'rifle', secondary: null };
  if (s.loadout) {
    const ow = ownedWeapons();
    if (ow.indexOf(s.loadout.primary) >= 0) loadout.primary = s.loadout.primary;
    if (ow.indexOf(s.loadout.secondary) >= 0 && s.loadout.secondary !== loadout.primary)
      loadout.secondary = s.loadout.secondary;
  }
  syncCompanions();
  Object.assign(tally, s.tally);
  questIdx = s.quest.idx; questStage = s.quest.stage; questProgress = s.quest.progress;
  miraIdx = s.mira.idx; miraRewarded = s.mira.rewarded;
  player.level = s.player.level; player.xp = s.player.xp; player.xpNext = s.player.xpNext;
  player.sp = s.player.sp;
  player.hp = clamp(s.player.hp, 1, maxHp());
  player.ki = clamp(s.player.ki, 0, maxKi());
  player.grenades = maxGrenades();
  // Additive town/RTS restore (structures, laborers, militia, barricades, mines).
  // Old saves without `town` keep newGame()'s starter Keep + laborers.
  applyTownSave(s.town);
  updateQuestHud();
  $('hud').classList.remove('hidden');
  $('btnMenu').classList.remove('hidden');
  $('btnSettings').classList.remove('hidden');
  if (wave <= 0) { startWave(); }   // saved mid-wave-1: just replay it
  else { openShop(); banner('WELCOME BACK', `resuming after wave ${wave}`); }
  return true;
}

function openSoundMenu() {
  soundMenuOpen = true;
  $('settingsMain').classList.add('hidden');
  $('soundMenu').classList.remove('hidden');
  refreshSoundMenu();
  sfx.play('click');
}
function closeSoundMenu() {
  if (!soundMenuOpen) return;
  soundMenuOpen = false;
  $('soundMenu').classList.add('hidden');
  $('settingsMain').classList.remove('hidden');
  sfx.play('click');
}
function refreshSoundMenu() {
  const pct = v => Math.round(clamp(v, 0, 1) * 100);
  $('volMaster').value = pct(settings.masterVol);
  $('volSfx').value = pct(settings.sfxVol);
  $('volMusic').value = pct(settings.musicVol);
  $('volMasterVal').textContent = pct(settings.masterVol) + '%';
  $('volSfxVal').textContent = pct(settings.sfxVol) + '%';
  $('volMusicVal').textContent = pct(settings.musicVol) + '%';
  $('togMuteMaster').classList.toggle('on', !!settings.muteMaster);
  $('togMuteSfx').classList.toggle('on', !!settings.muteSfx);
  $('togMuteMusic').classList.toggle('on', !!settings.muteMusic);
}
function toggleSettings() {
  if (state !== 'playing' && state !== 'shop' && !settingsOpen) return;
  settingsOpen = !settingsOpen;
  $('settings').classList.toggle('hidden', !settingsOpen);
  if (!settingsOpen) {
    soundMenuOpen = false;
    $('soundMenu').classList.add('hidden');
    $('settingsMain').classList.remove('hidden');
  } else {
    refreshToggles();
    if (soundMenuOpen) refreshSoundMenu();
  }
}
function refreshToggles() {
  $('togShake').classList.toggle('on', settings.shake);
  $('togDmg').classList.toggle('on', settings.dmgText);
  $('togVibro').classList.toggle('on', settings.vibro);
  if ($('togAdaptHide')) $('togAdaptHide').classList.toggle('on', !!settings.adaptHidden);
  $('uiSizeVal').textContent = settings.uiScale.toUpperCase();
  $('btnStyleVal').textContent = settings.btnStyle.toUpperCase();
  $('hudOffVal').textContent = '+' + (settings.hudOffset || 0) + ' PX';
  $('mapSizeVal').textContent = (settings.mapSize || 'medium').toUpperCase();
  $('camViewVal').textContent = (CAM_VIEWS.find(v => v.id === settings.camView) || CAM_VIEWS[0]).label;
  applyAdaptCollapse();
}

// ========================= GAME STATE =============================
let state = 'menu'; // menu | playing | shop | over
let paused = false, treeOpen = false;
let wave = 0, cores = 0, kills = 0, totalCores = 0, runTime = 0;
let wood = 0, gold = 0; // RTS resources (v2.10+) — separate from aether cores
let goldVeins = [];      // alias → goldMines
let goldMines = [];      // WC2-style mine buildings (v2.11)
let forestStands = [];   // dedicated choppable stands (v2.11)
let structures = [];     // Rift Keep / camps / halls
let laborers = [];       // Ashen Laborers — workers ONLY (never squad slots)
let militia = [];        // Muster combat squad (grows +3/wave)
let waveTrainLeft = 3;
let laborerIdSeq = 1;
let militiaIdSeq = 1;
let colossus = null;     // temporary Aether Colossus ally
let buildPickOpen = false, structPanelOpen = false, selectedStructure = null;
let unitPanelOpen = false, selectedUnit = null;
let rtsTipShown = false;
let camera = { x: 0, y: 0, shake: 0 };
let enemies = [], bolts = [], ebolts = [], grenades = [], pickups = [], particles = [], floaters = [], zaps = [];
let beam = null, beamCharge = 0, charging = false;
let spawnQueue = 0, spawnTimer = 0, waveActive = false;
let shopTimer = 0, victoryShown = false;
let waveCatsUsed = new Set(); // for the "Adaptive Doctrine" quest
let chest = null;             // end-of-wave supply cache {x,y,t}
let graceT = 0;               // looting window between wave end and shop
let barricades = [];          // player-built energy fences {x,y,r,hp,maxHp,baseHp,neighbors}
let pulseCd = 0;              // cooldown for the barricade exit-blast
const BARRICADE_MAX = 8, BARRICADE_COST = 3, BARRICADE_HP = 160;
const BARRICADE_BASE_R = 34;
const BARRICADE_LINK_DIST = 86; // centers within this count as adjacent (linked)
const BARRICADE_MIN_GAP = 52;   // allow closer placement so posts can touch/link
// Cloister / brick stronghold walls — systems ON for master Continuity testing;
// store ship deferred with town-save + art batch (no APK / no version bump).
const BRICKWALL_ENABLED = true;
const BRICKWALL_SPRITE_ENABLED = true; // soft art; procedural fallback if sheets fail
let brickWalls = []; // pillars {x,y,r,hp,maxHp,baseHp,neighbors,links:{n,e,s,w}}
let buildGhostKind = 'barricade'; // 'barricade' | 'brickwall' — aim ghost mode
const BRICKWALL_MAX = 16;
const BRICKWALL_COST = { wood: 10, gold: 4, cores: 2 };
const BRICKWALL_HP = 280; // tougher than energy barricade (160)
const BRICKWALL_PILLAR_R = 18;
const BRICKWALL_LINK_DIST = 96;
const BRICKWALL_MIN_GAP = 58;
const BRICKWALL_SEG_THICK = 14;
const BRICKWALL_CARDINAL_TOL = 30;
const BRICKWALL_SPRITE_DRAWH = 44; // pillar draw height (feet at y)
const BRICKWALL_SEG_DRAWH = 36;
// fence grid tier (upgrades every barricade): 1 = stock · 2 = slow · 3 = zap ·
// 4 = shield membrane (less smash damage) · 5 = fortress pulse (stronger zap)
let fenceTier = 1;
const FENCE_MAX_TIER = 5, FENCE_COSTS = [120, 280, 450, 700]; // cores → tiers 2..5
const FENCE_SLOW = 0.55;                            // speed mult while touching (tier 2+)
const fenceZapDps = () => (6 + wave * 0.5) * (fenceTier >= 5 ? 1.65 : 1);

// ---------- sentry turrets (v2.8 / expanded v2.9) ----------
// The Sentry Uplink mounts an auto-targeting gun on EVERY barricade you build
// (fence-post mounting was chosen over free placement: barricades already give
// the player positioning control, enemy aggro and rendering — no new UI).
// Tier 1: single barrel · Tier 2: +fire rate +range +antenna · Tier 3: dual barrels
// · Tier 4: overcharged bolts (+dmg, light armor chip).
let sentryTier = 0, sbolts = [];
const SENTRY_MAX_TIER = 4, SENTRY_COSTS = [180, 320, 500, 750];
const sentryRange    = () => sentryTier >= 2 ? 340 : 260;
const sentryInterval = () => sentryTier >= 4 ? 0.42 : sentryTier >= 2 ? 0.55 : 0.85;
const sentryDamage   = () => (7 + wave * 0.5) * (sentryTier >= 4 ? 1.45 : 1);

// =========================== PLAYER ===============================
const player = {};
function resetPlayer() {
  Object.assign(player, {
    x: CAMP.x, y: CAMP.y + 120, r: 15, vx: 0, vy: 0,
    hp: 100, ki: 30,
    aim: 0, facing: 1, walk: 0, moving: false,
    fireCd: 0, fire2Cd: 0, novaCd: 0, grenCd: 0, dashCd: 0, dashT: 0,
    grenades: 3,
    form: 0,             // 0 base · 1 Ascended · 2 Storm Ascendant
    xp: 0, level: 1, xpNext: 60, sp: 0,
    hurtT: 0,
    downed: false,       // co-op bleedout (v2.9.2) — solo still game-overs
    downedT: 0,
  });
}

// ================= GEAR SHOP (cores) + SKILLS (SP) ================
const gear = [
  { id: 'rdmg',  name: 'Pulse Coils Mk.II',  desc: '+22% rifle damage',            base: 8,  lvl: 0, max: 6 },
  { id: 'rrate', name: 'Overclock Trigger',  desc: '+15% rifle fire rate',         base: 8,  lvl: 0, max: 5 },
  { id: 'hp',    name: 'Composite Plating',  desc: '+30 max health, full heal',    base: 10, lvl: 0, max: 6 },
  { id: 'ki',    name: 'Aether Cell',        desc: '+25 max aether, +regen',       base: 10, lvl: 0, max: 5 },
  { id: 'beam',  name: 'Nova Focus Lens',    desc: '+30% beam damage & +14% width / lens (10 ranks)', base: 9, lvl: 0, max: 10 },
  { id: 'gren',  name: 'Grenade Bandolier',  desc: '+1 grenade capacity, +blast',  base: 9,  lvl: 0, max: 4 },
  { id: 'boots', name: 'Anti-Grav Boots',    desc: '+8% move speed, faster dash',  base: 7,  lvl: 0, max: 4 },
  { id: 'armor', name: 'Riftsteel Armor',    desc: '−7% damage taken per plate',   base: 11, lvl: 0, max: 5 },
  // v2.8 arsenal — new entries APPEND here (the save stores gear by index)
  { id: 'gusher',  name: 'Gusher',  desc: 'Energy blaster: slow teal bolts that blast whole packs backwards', base: 120, lvl: 0, max: 1, weapon: true },
  { id: 'sticker', name: 'Sticker', desc: 'Needle launcher: rapid embedding needles that burst after 0.8s',   base: 180, lvl: 0, max: 1, weapon: true },
];
const gearLvl = id => gear.find(u => u.id === id).lvl;
const gearCost = u => Math.round(u.base * Math.pow(1.6, u.lvl));

const SKILLS = {
  warrior:  { label: 'WARRIOR', cls: 'warrior', nodes: [
    { id: 'w1', name: 'Steady Coils',   desc: '+20% rifle damage / rank',                     max: 3 },
    { id: 'w2', name: 'Rapid Cycler',   desc: '+15% rifle fire rate / rank',                  max: 3 },
    { id: 'w3', name: 'Heavy Payload',  desc: '+30% grenade damage, +18 blast radius / rank', max: 2 },
    { id: 'w4', name: 'Crushing Nova',  desc: '+40% nova damage, −0.25s cooldown / rank',     max: 2 },
    { id: 'w5', name: 'Twin Channeling', desc: 'Dual-wield mastery while Ascended: rank 1 = off-hand weapon fires at full rate, rank 2 = halves dual-wield spread', max: 2 },
  ]},
  aether:   { label: 'AETHER ARTS', cls: 'aether', nodes: [
    { id: 'a1', name: 'Deep Reserves',  desc: '+25 max aether / rank',                        max: 3 },
    { id: 'a2', name: 'Flow State',     desc: '+40% aether regeneration / rank',              max: 3 },
    { id: 'a3', name: 'Focused Beam',   desc: '+24% Nova Beam damage & +12% width / rank (5 ranks)', max: 5 },
    { id: 'a4', name: 'Storm Ascendant', desc: 'Your Ascended form evolves: more power and a lightning aura that arcs to nearby foes', max: 1 },
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
// Beam (v2.9.1): starts skinny/weak; 10 lens ranks + 5 Focused Beam ranks stretch
// progression so early beam is a needle and fully upgraded still hits hard (~old max).
function beamDamage()    { return 14 * (1 + .30 * gearLvl('beam')) * (1 + .24 * sk('a3')) * formMul(); }
function beamWidthMul()  { return (1 + .14 * gearLvl('beam')) * (1 + .12 * sk('a3')); }
function novaDamage()    { return 45 * (1 + .4 * sk('w4')) * formMul(); }
function novaCooldown()  { return Math.max(0.5, 1.4 - .25 * sk('w4')); }
function grenadeDamage() { return 80 * (1 + .18 * gearLvl('gren')) * (1 + .3 * sk('w3')); }
function grenadeRadius() { return 120 + 13 * gearLvl('gren') + 18 * sk('w3'); }
function maxGrenades()   { return 3 + gearLvl('gren'); }
function moveSpeed()     { return 235 * (1 + .08 * gearLvl('boots') + .08 * sk('s2')) * (player.form ? 1.25 : 1); }
function kiRegen()       { return (3.5 + 1.1 * gearLvl('ki')) * (1 + .4 * sk('a2')); }
function magnetRange()   { return 150 + 55 * sk('s3'); }
function armorReduce()   { return 0.07 * gearLvl('armor'); } // up to 35% damage taken reduction

// =============== WEAPON ARSENAL & DUAL-WIELD (v2.8) ===============
// Three guns share the rifle damage / fire-rate upgrade tracks and the
// 'rifle' learning-engine category (the engine reads all gunfire as one
// tactic). While ASCENDED the equipped secondary fires alongside the
// primary — stock at 60% rate, full rate with Twin Channeling rank 1.
const WEAPON_IDS = ['rifle', 'gusher', 'sticker'];
const WEAPON_NAMES = { rifle: 'Pulse Rifle', gusher: 'Gusher', sticker: 'Sticker' };
let loadout = { primary: 'rifle', secondary: null };
function ownedWeapons() { return WEAPON_IDS.filter(id => id === 'rifle' || gearLvl(id) > 0); }
function weaponStats(id) {
  const dmgMul  = (1 + .22 * gearLvl('rdmg')) * (1 + .2 * sk('w1')) * formMul();
  const rateMul = (1 + .15 * gearLvl('rrate')) * (1 + .15 * sk('w2'));
  switch (id) {
    case 'gusher':  return { dmg: 26 * dmgMul, interval: 0.55  / rateMul, speed: 640, kb: 520, r: 7, spread: 0.05 };
    case 'sticker': return { dmg: 3  * dmgMul, interval: 0.09  / rateMul, speed: 980, kb: 30,  r: 3, spread: 0.09 };
    default:        return { dmg: 11 * dmgMul, interval: 0.19  / rateMul, speed: 900, kb: 90,  r: 4, spread: 0.03 };
  }
}
function cycleLoadout(slot) {
  const owned = ownedWeapons();
  if (slot === 'primary') {
    const opts = owned.filter(w => w !== loadout.secondary);
    loadout.primary = opts[(opts.indexOf(loadout.primary) + 1) % opts.length];
  } else {
    const opts = owned.filter(w => w !== loadout.primary).concat([null]);
    loadout.secondary = opts[(opts.indexOf(loadout.secondary) + 1) % opts.length];
  }
}

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

// armor plate chip (boss plate + v2.8 plated enemies): the plate soaks the
// hit and returns the hp-damage multiplier (halved while the plate holds)
function chipArmor(e, hit) {
  if (!(e.armor > 0)) return 1;
  e.armor -= hit;
  const q = Math.ceil(Math.max(0, e.armor) / e.maxArmor * 4);
  if (q < e.armorCrack) { // crack fleck burst at 75/50/25%
    e.armorCrack = q;
    spawnParticles(e.x, e.y - e.r, 10, '#aab4c4', 4);
  }
  if (e.armor <= 0) { // shattered: full damage from now on + enrage hint
    e.armor = 0;
    e.spd *= 1.18;
    spawnParticles(e.x, e.y - e.r, 26, '#c8d2e0', 5);
    addFloater(e.x, e.y - e.r * 2.8, 'ARMOR SHATTERED!', '#c8d2e0', true);
    camera.shake = Math.max(camera.shake, 8);
    buzz(40);
  }
  return 0.5;
}

// knockback with boss mass resistance (v2.9): light rifle ticks barely skate
// Gharok; heavy hits / accumulated damage still shove. Non-bosses unchanged.
function applyKnock(e, kbx, kby, kb, hitDmg) {
  if (!kb || (!kbx && !kby)) return;
  if (!e.boss) { e.vx += kbx * kb; e.vy += kby * kb; return; }
  e.kbPool = (e.kbPool || 0) + hitDmg;
  const mass = 16;
  let force = kb / mass;
  if (hitDmg < 18) force *= 0.12;       // pulse-rifle ticks
  else if (hitDmg < 35) force *= 0.32;  // medium hits
  else force *= 0.55;                   // nova / grenade / gusher
  if (e.kbPool < 90 && hitDmg < 40) force *= 0.22; // need a shove threshold
  if (e.kbPool >= 90) e.kbPool = 0;
  e.vx += kbx * force;
  e.vy += kby * force;
}

function dealDamage(e, dmg, cat, kbx, kby, kb) {
  if (e.invulnT > 0) return; // emerging skeletons can't be hit yet
  const res = resistance(cat);
  let final = dmg * (1 - res);
  tally[cat] += dmg;
  waveCatsUsed.add(cat);
  final *= chipArmor(e, final);
  e.hp -= final;
  e.flash = 0.12;
  applyKnock(e, kbx, kby, kb, final);
  if (settings.dmgText)
    addFloater(e.x, e.y - e.r * 2.4, Math.round(final), res > 0.3 ? '#ff8a93' : '#fff', res > 0.3);
  player.ki = clamp(player.ki + final * 0.045, 0, maxKi());
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}

// ally damage (sentries + companions): respects armor plates but does NOT
// feed the learning engine (it studies the player, not the squad), grants
// no aether, and shows no damage floater — keeps ally fire low-noise.
function directDamage(e, dmg, kbx, kby, kb) {
  if (e.invulnT > 0 || e.dead) return;
  let final = dmg * chipArmor(e, dmg);
  e.hp -= final;
  e.flash = 0.12;
  applyKnock(e, kbx, kby, kb, final);
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}

// ======================= COMPANIONS (v2.8) ========================
// A squad of up to 3 original allies bought in the field lab with cores:
//   Rover  — robot dog, plasma-bite melee, fetches loose cores back to you
//   Warden — salvaged combat android, arm pulse-cannon, tanky, taunts foes
//   Scout  — human ranger, piercing tech-crossbow, drops med/energy packs
// They follow with simple flocking (never body-block you), auto-engage,
// can be downed and revive automatically at wave end. Combined DPS is
// tuned to ~40-45% of the player's at equal progression.
const COMP_TYPES = {
  // v2.13.2: smidge HP/dmg buff — still not OP
  rover:  { name: 'Rover',  desc: 'Robot dog: plasma-bite melee, fetches loose cores back to you',            cost: 300, hp: 210, spd: 305, range: 480, dmg: 11, atk: 0.9 },
  warden: { name: 'Warden', desc: 'Combat android: arm pulse-cannon, tanky, nearby enemies attack it first',  cost: 500, hp: 340, spd: 205, range: 430, dmg: 10, atk: 1.15 },
  scout:  { name: 'Scout',  desc: 'Ranger: piercing tech-crossbow bolts, periodically drops med/energy packs', cost: 800, hp: 185, spd: 255, range: 540, dmg: 9,  atk: 1.35 },
  // v2.10 — Muster Hall squad addition (copyright-safe original name)
  sentinel: { name: 'Ashen Sentinel', desc: 'Rift militia spear: mid-range bolts, sturdy line-holder from the Muster Hall', cost: 650, hp: 270, spd: 230, range: 460, dmg: 12, atk: 1.05 },
};
// mini skill trees — ranks live in skillRanks, so they ride the existing
// skill-point economy AND the existing save snapshot for free
const COMP_NODES = {
  rover: [
    { id: 'cr1', name: 'Overvolt Fangs',   desc: '+35% bite damage / rank', max: 2 },
    { id: 'cr2', name: 'Fetch Protocol',   desc: '+80% core-fetch radius',  max: 1 },
  ],
  warden: [
    { id: 'cw1', name: 'Rapid Capacitors', desc: '+25% cannon fire rate / rank', max: 2 },
    { id: 'cw2', name: 'Menace Beacon',    desc: '+45% taunt radius — more enemies attack Warden', max: 1 },
  ],
  scout: [
    { id: 'cs1', name: 'Field Medkits',    desc: '+50% pack healing, faster drops / rank', max: 2 },
    { id: 'cs2', name: 'Lancer Bolts',     desc: 'Crossbow bolts pierce one extra enemy',  max: 1 },
  ],
  sentinel: [
    { id: 'cn1', name: 'Spear Drill',      desc: '+30% bolt damage / rank', max: 2 },
    { id: 'cn2', name: 'Hold the Line',    desc: '+40 max HP · slight taunt aura', max: 1 },
  ],
};
let squad = { owned: {}, active: {} };
let companions = [], cbolts = [];
const tauntRadius    = () => 240 * (1 + 0.45 * sk('cw2'));
const fetchRadius    = () => 260 * (1 + 0.8 * sk('cr2'));
const scoutPackDelay = () => Math.max(8, 16 - 3 * sk('cs1'));
const scoutPierce    = () => 2 + sk('cs2');
function compDamage(c) {
  let d = COMP_TYPES[c.type].dmg;
  if (c.type === 'rover') d *= 1 + 0.35 * sk('cr1');
  if (c.type === 'sentinel') d *= 1 + 0.30 * sk('cn1');
  return d;
}
function compInterval(c) {
  const t = COMP_TYPES[c.type];
  return c.type === 'warden' ? t.atk / (1 + 0.25 * sk('cw1')) : t.atk;
}
// keep runtime entities in lockstep with the owned+active flags
function syncCompanions() {
  companions = companions.filter(c => squad.owned[c.type] && squad.active[c.type]);
  for (const k of Object.keys(COMP_TYPES)) {
    if (!squad.owned[k] || !squad.active[k]) continue;
    if (companions.some(c => c.type === k)) continue;
    const t = COMP_TYPES[k];
    companions.push({
      type: k, x: player.x + rand(-70, 70), y: player.y + rand(30, 80),
      vx: 0, vy: 0, r: k === 'rover' ? 11 : 13,
      hp: t.hp + (k === 'sentinel' ? 40 * sk('cn2') : 0),
      maxHp: t.hp + (k === 'sentinel' ? 40 * sk('cn2') : 0), downed: false, hurtT: 0,
      atkCd: rand(0.3, 1), walk: rand(0, 9), facing: 1, aim: 0,
      packT: scoutPackDelay(), fetchCd: 0,
    });
  }
}
function buyCompanion(k) {
  if (squad.owned[k]) return false;
  const t = COMP_TYPES[k];
  if (cores < t.cost) return false;
  cores -= t.cost;
  squad.owned[k] = true;
  squad.active[k] = true;
  syncCompanions();
  spawnParticles(player.x, player.y, 22, '#4de1ff', 4);
  addFloater(player.x, player.y - 46, t.name.toUpperCase() + ' JOINS THE SQUAD!', '#7CFC00', true);
  return true;
}
function hurtCompanion(c, dmg) {
  if (c.downed || c.hurtT > 0) return;
  // near-player DR (v2.9): stick close to the Vanguard for a shield aura
  if (dist2(c.x, c.y, player.x, player.y) < 115 * 115) dmg *= 0.58;
  if (c.type === 'rover') dmg *= 0.82; // dog plating buff
  c.hp -= dmg;
  c.hurtT = 0.72;
  spawnParticles(c.x, c.y - 10, 6, '#ff8a93', 3);
  if (c.hp <= 0) {
    c.hp = 0;
    c.downed = true;
    addFloater(c.x, c.y - 32, COMP_TYPES[c.type].name.toUpperCase() + ' DOWN', '#ff8a93', true);
    spawnParticles(c.x, c.y, 20, '#8d99ae', 4);
    buzz(40);
  }
}
function updateCompanions(dt) {
  companions.forEach((c, idx) => {
    if (c.downed) return;
    c.hurtT = Math.max(0, c.hurtT - dt);
    if (c.swipeT > 0) c.swipeT = Math.max(0, c.swipeT - dt);
    c.atkCd -= dt;
    const t = COMP_TYPES[c.type];
    // nearest living enemy in engagement range
    let foe = null, fd2 = t.range * t.range;
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.3 || e.emergeT > 0) continue;
      const d2 = dist2(e.x, e.y, c.x, c.y);
      if (d2 < fd2) { fd2 = d2; foe = e; }
    }
    // ---- move goal: formation slot / melee dive / core-fetch run ----
    const slotA = idx * 2.4 + 2.2; // fanned out behind the player
    let gx = player.x + Math.cos(slotA) * 64, gy = player.y + Math.sin(slotA) * 64;
    if (c.type === 'rover') {
      if (foe) { gx = foe.x; gy = foe.y; }
      else { // fetch: run loose cores back toward the player's magnet
        c.fetchCd = Math.max(0, c.fetchCd - dt);
        if (c.fetchCd <= 0) {
          let pk = null, pd2 = fetchRadius() ** 2;
          for (const p of pickups) {
            if (p.type !== 'core' || p.fetched) continue;
            const d2 = dist2(p.x, p.y, c.x, c.y);
            if (d2 < pd2) { pd2 = d2; pk = p; }
          }
          if (pk) {
            gx = pk.x; gy = pk.y;
            if (pd2 < (c.r + 16) ** 2) {
              pk.fetched = true; // flies to the player from here (pickup update)
              c.fetchCd = 1.2;
              addFloater(c.x, c.y - 24, '⬡ fetch!', '#4de1ff', false);
            }
          }
        }
      }
    } else if (foe) {
      // ranged units hold ~55% of their range from the target
      const fd = Math.sqrt(fd2) || 1;
      const hold = t.range * 0.55;
      if (fd < hold * 0.7) { gx = c.x - (foe.x - c.x) / fd * 60; gy = c.y - (foe.y - c.y) / fd * 60; }
      else if (fd > hold) { gx = foe.x; gy = foe.y; }
      else { gx = c.x; gy = c.y; }
    }
    // ---- steering: seek goal + separation (never body-blocks the player) ----
    const dx = gx - c.x, dy = gy - c.y, gd = Math.hypot(dx, dy);
    if (gd > 26) { c.vx = lerp(c.vx, dx / gd * t.spd, dt * 5); c.vy = lerp(c.vy, dy / gd * t.spd, dt * 5); }
    else { c.vx *= 0.82; c.vy *= 0.82; }
    for (const o of companions) {
      if (o === c || o.downed) continue;
      const d2 = dist2(c.x, c.y, o.x, o.y);
      if (d2 < 30 * 30 && d2 > 0.01) { const d = Math.sqrt(d2); c.vx += (c.x - o.x) / d * 60; c.vy += (c.y - o.y) / d * 60; }
    }
    const pd2 = dist2(c.x, c.y, player.x, player.y);
    if (pd2 < 34 * 34 && pd2 > 0.01) { const d = Math.sqrt(pd2); c.vx += (c.x - player.x) / d * 90; c.vy += (c.y - player.y) / d * 90; }
    c.x = clamp(c.x + c.vx * dt, c.r, WORLD.w - c.r);
    c.y = clamp(c.y + c.vy * dt, c.r, WORLD.h - c.r);
    collideObstacles(c);
    c.walk += dt * Math.hypot(c.vx, c.vy) * 0.045;
    if (Math.abs(c.vx) > 4) c.facing = c.vx >= 0 ? 1 : -1;
    // leash: teleport back if hopelessly far behind (dashes, respawns)
    if (pd2 > 1300 * 1300) { c.x = player.x + rand(-70, 70); c.y = player.y + rand(-70, 70); }
    // ---- attacks ----
    if (foe) {
      c.aim = Math.atan2(foe.y - c.y, foe.x - c.x);
      c.facing = Math.cos(c.aim) >= 0 ? 1 : -1;
      if (c.type === 'rover') {
        if (c.atkCd <= 0 && fd2 < (c.r + foe.r + 12) ** 2) {
          c.atkCd = compInterval(c);
          c.swipeT = UNIT_SWIPE;
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, compDamage(c), (foe.x - c.x) / d, (foe.y - c.y) / d, 140);
          zap(c.x, c.y - 8, foe.x, foe.y - 10); // plasma-bite arc
          spawnParticles(foe.x, foe.y - 8, 5, '#4de1ff', 3);
        }
      } else if (c.atkCd <= 0) {
        c.atkCd = compInterval(c);
        c.swipeT = UNIT_SWIPE * 0.7;
        const a = c.aim + rand(-0.04, 0.04);
        const spd = c.type === 'scout' ? 820 : 620;
        cbolts.push({
          x: c.x + Math.cos(a) * 16, y: c.y - 12 + Math.sin(a) * 16,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          life: 1.0, r: c.type === 'scout' ? 3 : 4,
          dmg: compDamage(c), pierce: c.type === 'scout' ? scoutPierce() : 1,
          hit: [], scout: c.type === 'scout',
        });
      }
    }
    // ---- scout support packs ----
    if (c.type === 'scout') {
      c.packT -= dt;
      if (c.packT <= 0) {
        c.packT = scoutPackDelay();
        pickups.push({ x: player.x + rand(-50, 50), y: player.y + rand(-50, 50), type: 'pack', t: 0 });
        addFloater(c.x, c.y - 26, '⊕ supply pack', '#7CFC00', false);
      }
    }
  });
  // ---- companion bolts (teal cannon shots / piercing crossbow bolts) ----
  for (const b of cbolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(b.x, b.y, o.x, o.y) < o.r * o.r)) { b.life = 0; continue; }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4 || b.hit.indexOf(e) >= 0) continue;
      if (dist2(b.x, b.y + 12, e.x, e.y) < (e.r + b.r + 5) ** 2) {
        directDamage(e, b.dmg, b.vx / 800, b.vy / 800, 70);
        b.hit.push(e);
        spawnParticles(b.x, b.y, 4, b.scout ? '#ffd7a8' : '#3ef0c8', 2);
        if (b.hit.length >= b.pierce) { b.life = 0; break; }
      }
    }
  }
  cbolts = cbolts.filter(b => b.life > 0);
}

// =========================== ENEMIES ==============================
// husk (shambler) · sprinter (fast ghoul) · shaman (ranged caster)
// ravager (ork brute) · warlord (twin-skulled war-brute boss, every 5 waves)
// bulwark (two husks fused mid-wave) · skeleton (claws out of husk graves)

// boss claw slash (v2.8): wind-up is the dodge window; strike linger reads the follow-through
const CLAW_WINDUP = 0.7, CLAW_STRIKE = 0.28, CLAW_RANGE = 165, CLAW_CD = 5, CLAW_DMG_MUL = 1.5, CLAW_KB = 820;
// Contact-melee swipe telegraph for non-boss figures (visual only — hitbox unchanged)
const UNIT_SWIPE = 0.32;
// Ashen Ravager sprite gate — keep false until stronghold/art update-batch apply (no APK/store ship).
// Flip to true → soft-load sheets + r=36 / drawH=100 / s≈2.78 (between bulwark and Gharok).
const RAVAGER_SPRITE_ENABLED = false;
const RAVAGER_SPRITE_DRAWH = 100; // SIZE LOCK — between bulwark 62 and Gharok 228
const RAVAGER_R = RAVAGER_SPRITE_ENABLED ? 36 : 24;
const RAVAGER_FIGURE_S = RAVAGER_SPRITE_ENABLED ? 2.78 : 1.7;
const ETYPES = {
  // v2.13.2 size pass: husk/sprinter/bulwark/shaman toward live ravager r=24; skeleton UNCHANGED from 2.13.1
  husk:     { r: 21, hp: 36,  spd: 60,  dmg: 9,  core: 1,  xp: 6,   ranged: false },
  sprinter: { r: 18, hp: 20,  spd: 135, dmg: 7,  core: 1,  xp: 7,   ranged: false },
  shaman:   { r: 20, hp: 44,  spd: 55,  dmg: 8,  core: 2,  xp: 12,  ranged: true  },
  ravager:  { r: RAVAGER_R, hp: 160, spd: 46,  dmg: 22, core: 3,  xp: 18,  ranged: false },
  warlord:  { r: 54, hp: 950, spd: 38,  dmg: 34, core: 25, xp: 120, ranged: true, boss: true, armor: 300 },
  bulwark:  { r: 23, hp: 90,  spd: 45,  dmg: 16, core: 3,  xp: 16,  ranged: false, kbPlayer: 260 }, // near ravager, still << Gharok
  skeleton: { r: 12, hp: 14,  spd: 170, dmg: 6,  core: 1,  xp: 5,   ranged: false }, // SIZE LOCK 2.13.1 — do not bump
};
function hpScale() { return 1 + (wave - 1) * 0.16; }

// shared enemy factory — fusion/graves spawn at exact spots, waves at the edges
function makeEnemy(type, x, y, opts = {}) {
  const t = ETYPES[type];
  const hp = t.hp * hpScale() * (t.boss ? 1 + wave * 0.05 : 1);
  const e = {
    type, x, y, r: t.r, vx: 0, vy: 0, hp, maxHp: hp,
    spd: t.spd * (1 + wave * 0.012), dmg: t.dmg,
    core: t.core, xp: t.xp, ranged: t.ranged, boss: !!t.boss,
    kbPlayer: t.kbPlayer || 0,
    atkCd: rand(0.5, 1.5), flash: 0, dead: false,
    walk: rand(0, 9), facing: 1, spawnT: 0.8,
    ...opts,
  };
  if (t.armor) { // boss armor plate: soaks hits until it shatters
    e.maxArmor = t.armor * (1 + wave * 0.05);
    e.armor = e.maxArmor;
    e.armorCrack = 4; // next quarter-threshold that sprays crack flecks
  }
  enemies.push(e);
  return e;
}

// ---------- wave-7+ escalation: ascended & plated enemies ----------
// Chances ramp gently with the wave and are hard-capped by concurrent
// counts so difficulty climbs instead of spiking.
const ESC_WAVE = 7, ASC_CAP = 3, PLATE_CAP = 4;
const ascChance   = () => wave < ESC_WAVE ? 0 : Math.min(0.20, 0.06 + (wave - ESC_WAVE) * 0.015);
const plateChance = () => wave < ESC_WAVE ? 0 : Math.min(0.25, 0.08 + (wave - ESC_WAVE) * 0.02);
function makeAscended(e) { // rift-blessed: golden aura, faster, harder-hitting
  e.ascended = true;
  e.spd *= 1.3;
  e.dmg = Math.round(e.dmg * 1.4);
  e.xp = Math.round(e.xp * 1.5);
}
function makePlated(e) { // mini armor plate — same chip mechanics as the boss
  e.maxArmor = 16 + wave * 2.5;
  e.armor = e.maxArmor;
  e.armorCrack = 4;
}

function spawnEnemy(type) {
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
  const e = makeEnemy(type, x, y);
  if (!e.boss && wave >= ESC_WAVE) {
    const asc = enemies.filter(o => o.ascended && !o.dead).length;
    const pl  = enemies.filter(o => !o.boss && o.maxArmor && !o.dead).length;
    if (asc < ASC_CAP && Math.random() < ascChance()) makeAscended(e);
    else if (pl < PLATE_CAP && Math.random() < plateChance()) makePlated(e);
  }
  spawnParticles(x, y, 14, e.ascended ? '#ffd54a' : '#b04dff', 3);
}

// ---------- zombie fusion: two lingering husks merge into a Bulwark ----------
// radius leaves room for the flock-separation shove (touching husks sit ~28px apart)
const FUSE_RADIUS = 60, FUSE_TIME = 1.5, FUSE_MIN_WAVE = 4, FUSE_MAX_ALIVE = 2;
function updateFusion(dt) {
  if (wave < FUSE_MIN_WAVE) return;
  let bulwarks = 0;
  for (const e of enemies) if (e.type === 'bulwark' && !e.dead) bulwarks++;
  if (bulwarks >= FUSE_MAX_ALIVE) return;
  const husks = enemies.filter(e => e.type === 'husk' && !e.dead && e.spawnT <= 0);
  for (let i = 0; i < husks.length; i++) {
    const a = husks[i];
    if (a.fused) continue;
    let partner = null;
    for (let j = i + 1; j < husks.length; j++) {
      const b = husks[j];
      if (!b.fused && dist2(a.x, a.y, b.x, b.y) < FUSE_RADIUS * FUSE_RADIUS) { partner = b; break; }
    }
    if (!partner) { a.fuseT = Math.max(0, (a.fuseT || 0) - dt * 2); continue; } // decay, don't reset — husks jostle
    a.fuseT = (a.fuseT || 0) + dt;
    if (Math.random() < dt * 10) // pre-fusion rift shimmer between the pair
      spawnParticles((a.x + partner.x) / 2, (a.y + partner.y) / 2 - 14, 1, '#b04dff', 2);
    if (a.fuseT >= FUSE_TIME) {
      a.fused = partner.fused = true;
      a.dead = partner.dead = true; // merged, not killed — no drops/xp
      const mx = (a.x + partner.x) / 2, my = (a.y + partner.y) / 2;
      makeEnemy('bulwark', mx, my, { spawnT: 0.4 });
      spawnParticles(mx, my, 28, '#8fbf5a', 5);
      spawnParticles(mx, my, 12, '#b04dff', 4);
      spawnRing(mx, my, 60);
      addFloater(mx, my - 44, 'BULWARK FUSION!', '#b04dff', true);
      buzz(30);
      return; // at most one fusion per frame
    }
  }
}

// ---------- skeletons: zombie graves reopen later in the same wave ----------
let graves = [], graveCount = 0;
const SKELETON_CHANCE = 0.35, SKELETON_CAP = 3, SKELETON_EMERGE = 0.5;
function updateGraves(dt) {
  if (!graves.length) return;
  for (const g of graves) {
    g.t -= dt;
    if (g.t <= 0 && waveActive && g.wave === wave) {
      makeEnemy('skeleton', g.x, g.y, { spawnT: 0, emergeT: SKELETON_EMERGE, invulnT: SKELETON_EMERGE });
      spawnParticles(g.x, g.y, 16, '#6b5636', 4); // grave-dirt burst
      spawnParticles(g.x, g.y, 6, '#4a3c28', 3);
      addFloater(g.x, g.y - 30, 'THE GRAVE OPENS…', '#d8d4c2', false);
    }
  }
  graves = graves.filter(g => g.t > 0 && g.wave === wave);
}

function killEnemy(e) {
  e.dead = true;
  kills++;
  if (e.ascended) { // rift-blessed foes burst into raw aether when slain
    player.ki = clamp(player.ki + 8, 0, maxKi());
    spawnRing(e.x, e.y, 60);
    spawnParticles(e.x, e.y, 14, '#ffd54a', 4);
    addFloater(e.x, e.y - 30, '+8 AETHER', '#4de1ff', false);
  }
  spawnParticles(e.x, e.y, e.boss ? 60 : 16, e.type === 'ravager' || e.type === 'warlord' ? '#5f8f3a' : '#7a8f5a', e.boss ? 5 : 3);
  decals.push({ x: e.x, y: e.y, r: e.r * 1.6, color: '46,66,36', life: 14, maxLife: 14 });
  camera.shake = Math.min(camera.shake + (e.boss ? 14 : 2), 18);
  // fallen zombies may claw back out of the ground as skeletons (same wave only)
  if ((e.type === 'husk' || e.type === 'sprinter') && waveActive &&
      graveCount < SKELETON_CAP && Math.random() < SKELETON_CHANCE) {
    graveCount++;
    graves.push({ x: e.x, y: e.y, t: rand(8, 15), wave });
  }
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
    sfx.play('levelup');
    buzz([30, 50, 30, 50, 30]);
  }
}

// ====================== NPCS, QUESTS & STORY ======================
const NPC  = { x: CAMP.x + 80, y: CAMP.y - 30, r: 14, name: 'Quartermaster Bramm', role: 'quest' };
const VEX  = { x: FORT.x + FORT.w / 2, y: FORT.y + FORT.h / 2, r: 14, name: 'Merchant Vex', role: 'vendor' };
const MIRA = { x: ASH.x + ASH.w / 2, y: ASH.y + ASH.h / 2, r: 14, name: 'Scout Mira', role: 'lore' };
// Riftwarden Kael — original camp NPC who opens co-op rift rooms (v2.9)
const RIFTWARDEN = { x: CAMP.x - 95, y: CAMP.y + 45, r: 14, name: 'Riftwarden Kael', role: 'riftnet' };
const NPCS = [NPC, VEX, MIRA, RIFTWARDEN];
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
  if (state !== 'playing' || dialogOpen || vendorOpen || settingsOpen || riftNetOpen || player.downed) return;
  // Prefer field revive prompt if standing on a downed squadmate (tap still opens nothing — hold channels)
  if (nearestDownedCompanion() || nearestDownedMilitia() || nearestDownedLaborer() || nearestDownedAlly()) return;
  const npc = nearestNpc();
  if (!npc) return;
  if (npc.role === 'vendor') { openVendor(); return; }
  if (npc.role === 'lore') { talkMira(); return; }
  if (npc.role === 'riftnet') { openRiftNet(); return; }
  // Bramm: if wounded / squad downed, offer aether infirmary first (mid-run recovery)
  if (npc.role === 'quest' && (player.hp < maxHp() * 0.92 || companions.some(c => c.downed) || militia.some(m => m.downed) || laborers.some(L => L.downed))) {
    openInfirmary();
    return;
  }
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
      "Need a mend? Spend aether at my infirmary anytime you're hurt or a squadmate is down.",
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

// ---------- Aether Infirmary (v2.9): spend CURRENT aether for heal / revive ----------
// Mid-run recovery is possible but not free — cost scales with missing HP / per ally.
function aetherHealAmount() {
  const miss = Math.max(0, Math.ceil(maxHp() - player.hp));
  if (miss <= 0) return 0;
  return Math.min(miss, Math.max(28, Math.ceil(maxHp() * 0.38)));
}
function aetherHealCost() {
  const miss = Math.max(0, Math.ceil(maxHp() - player.hp));
  if (miss <= 0) return 10;
  return Math.max(10, Math.ceil(miss * 0.30));
}
function aetherReviveCost(type) {
  if (type === 'rover') return 20;
  if (type === 'warden') return 28;
  return 24; // scout
}
function buyAetherHeal() {
  if (player.hp >= maxHp()) return false;
  const cost = aetherHealCost(), amt = aetherHealAmount();
  if (player.ki < cost) return false;
  player.ki -= cost;
  player.hp = Math.min(maxHp(), player.hp + amt);
  spawnParticles(player.x, player.y, 16, '#7CFC00', 3);
  addFloater(player.x, player.y - 42, `+${amt} HP (−${cost} aether)`, '#7CFC00', true);
  sfx.play('click');
  return true;
}
// One-tap field mend (v2.9.3) — same costs/heal as infirmary tile; no menu hop.
function tryAetherMend() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen ||
      infirmaryOpen || riftNetOpen || player.downed) return;
  if (player.hp >= maxHp()) {
    addFloater(player.x, player.y - 40, 'FULL HEALTH', '#7CFC00', false);
    return;
  }
  const cost = aetherHealCost();
  if (player.ki < cost) {
    addFloater(player.x, player.y - 40, `NEED ${cost} AETHER`, '#ff8a93', false);
    return;
  }
  buyAetherHeal();
  buzz(18);
}
function buyAetherRevive(type) {
  const c = companions.find(x => x.type === type && x.downed);
  if (!c) return false;
  const cost = aetherReviveCost(type);
  if (player.ki < cost) return false;
  player.ki -= cost;
  finishCompanionRevive(c);
  return true;
}
function finishCompanionRevive(c) {
  c.downed = false;
  c.hp = Math.ceil(c.maxHp * 0.65);
  c.hurtT = 0.8;
  spawnParticles(c.x, c.y, 18, '#4de1ff', 4);
  addFloater(c.x, c.y - 34, COMP_TYPES[c.type].name.toUpperCase() + ' REVIVED', '#4de1ff', true);
  sfx.play('click');
}

// ---------- Field revive channel (v2.9.2): hold Talk near downed squad / co-op ally ----------
// Menu infirmary/shop revive still works; mid-wave you can also channel on the body.
const REVIVE_HOLD_SEC = 1.55;
const REVIVE_RANGE = 74;
const ALLY_REVIVE_COST = 22; // aether — matches mid-tier companion revive
const ALLY_BLEEDOUT_SEC = 42;
let reviveChan = { kind: null, id: null, t: 0, cost: 0 };

function riftNetLinked() {
  return !!(riftNet.conn && riftNet.status === 'connected');
}
function nearestDownedCompanion() {
  let best = null, bd = REVIVE_RANGE * REVIVE_RANGE;
  for (const c of companions) {
    if (!c.downed) continue;
    const d2 = dist2(c.x, c.y, player.x, player.y);
    if (d2 < bd) { bd = d2; best = c; }
  }
  return best;
}
function nearestDownedMilitia() {
  let best = null, bd = REVIVE_RANGE * REVIVE_RANGE;
  for (const m of militia) {
    if (!m.downed) continue;
    const d2 = dist2(m.x, m.y, player.x, player.y);
    if (d2 < bd) { bd = d2; best = m; }
  }
  return best;
}
function nearestDownedLaborer() {
  let best = null, bd = REVIVE_RANGE * REVIVE_RANGE;
  for (const L of laborers) {
    if (!L.downed) continue;
    const d2 = dist2(L.x, L.y, player.x, player.y);
    if (d2 < bd) { bd = d2; best = L; }
  }
  return best;
}
function nearestDownedAlly() {
  if (!riftNetLinked()) return null;
  let best = null, bestId = null, bd = REVIVE_RANGE * REVIVE_RANGE;
  for (const id of Object.keys(riftNet.remotes)) {
    const r = riftNet.remotes[id];
    if (!r || !r.downed) continue;
    const d2 = dist2(r.x || 0, r.y || 0, player.x, player.y);
    if (d2 < bd) { bd = d2; best = r; bestId = id; }
  }
  return best ? { remote: best, id: bestId } : null;
}
function applyAllyReviveLocal(frac) {
  const f = frac == null ? 0.65 : frac;
  player.downed = false;
  player.downedT = 0;
  player.hp = Math.max(1, Math.ceil(maxHp() * f));
  player.hurtT = 1.1;
  spawnParticles(player.x, player.y, 22, '#7CFC00', 4);
  addFloater(player.x, player.y - 44, 'REVIVED BY ALLY', '#7CFC00', true);
  banner('BACK UP', 'ally aether pulse');
  buzz([30, 40, 50]);
  sfx.play('click');
}
function completeFieldRevive(kind, target, cost) {
  if (player.ki < cost) return false;
  player.ki -= cost;
  if (kind === 'comp') {
    finishCompanionRevive(target);
    addFloater(player.x, player.y - 52, `−${cost} aether`, '#4de1ff', false);
    return true;
  }
  if (kind === 'militia') {
    finishMilitiaRevive(target);
    addFloater(player.x, player.y - 52, `−${cost} aether`, '#4de1ff', false);
    return true;
  }
  if (kind === 'laborer') {
    finishLaborerRevive(target);
    addFloater(player.x, player.y - 52, `−${cost} aether`, '#4de1ff', false);
    return true;
  }
  if (kind === 'ally') {
    try {
      riftNet.conn.send({ t: 'reviveDone', hpFrac: 0.65, from: riftNet.role, cost });
    } catch (e) {}
    spawnParticles(target.remote.x, target.remote.y, 20, '#7CFC00', 4);
    addFloater(target.remote.x, target.remote.y - 40, 'ALLY REVIVED', '#7CFC00', true);
    addFloater(player.x, player.y - 52, `−${cost} aether`, '#4de1ff', false);
    // optimistic local clear so both clients agree until next state packet
    target.remote.downed = false;
    target.remote.hp = Math.max(1, Math.ceil((target.remote.maxHp || 100) * 0.65));
    sfx.play('click');
    return true;
  }
  return false;
}
function updateReviveChannel(dt) {
  if (player.downed) {
    reviveChan = { kind: null, id: null, t: 0, cost: 0 };
    player.downedT = (player.downedT || 0) + dt;
    if (player.downedT >= ALLY_BLEEDOUT_SEC) {
      player.downed = false;
      gameOver();
    }
    return;
  }
  const ally = nearestDownedAlly();
  const mil = nearestDownedMilitia();
  const lab = nearestDownedLaborer();
  const comp = nearestDownedCompanion();
  let kind = null, target = null, cost = 0, id = null;
  if (ally) { kind = 'ally'; target = ally; cost = ALLY_REVIVE_COST; id = ally.id; }
  else if (mil) { kind = 'militia'; target = mil; cost = Math.max(12, 10 + Math.floor(mil.maxHp / 40)); id = mil.id; }
  else if (lab) { kind = 'laborer'; target = lab; cost = Math.max(10, 8 + Math.floor(lab.maxHp / 45)); id = lab.id; }
  else if (comp) { kind = 'comp'; target = comp; cost = aetherReviveCost(comp.type); id = comp.type; }

  const holding = talkHeld || !!keys.KeyT;
  if (!holding || !kind) {
    reviveChan = { kind: null, id: null, t: 0, cost: 0 };
    return;
  }
  if (player.ki < cost) {
    if (reviveChan.t < 0.05) addFloater(player.x, player.y - 40, `NEED ${cost} AETHER`, '#ff8a93', false);
    reviveChan = { kind: null, id: null, t: 0, cost: 0 };
    return;
  }
  if (reviveChan.kind !== kind || reviveChan.id !== id) {
    reviveChan = { kind, id, t: 0, cost };
  }
  reviveChan.t += dt;
  if (reviveChan.t >= REVIVE_HOLD_SEC) {
    completeFieldRevive(kind, target, cost);
    reviveChan = { kind: null, id: null, t: 0, cost: 0 };
    talkHeld = false;
  }
}
function drawReviveProgress(x, y, prog) {
  const r = 18;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y - 48, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#4de1ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y - 48, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(prog, 0, 1));
  ctx.stroke();
  ctx.restore();
}

function appendAetherShopItems(grid, coresEl) {
  // Heal chunk — spend aether (ki), not cores
  const miss = maxHp() - player.hp;
  const hCost = aetherHealCost(), hAmt = aetherHealAmount();
  const hOk = miss >= 1 && player.ki >= hCost;
  const hDiv = document.createElement('div');
  hDiv.className = 'shopitem' + (hOk ? '' : ' maxed');
  hDiv.innerHTML = `<h4>✧ Aether Mend<span class="lvl" style="color:var(--cyan)">AETHER</span></h4>
    <small>Restore ${Math.round(hAmt)} HP (scales with wounds). Mid-run recovery — not free.</small>
    <div class="price" style="color:var(--cyan)">◈ ${hCost} aether${miss < 1 ? ' · full' : player.ki < hCost ? ' · need more' : ''}</div>`;
  if (hOk) hDiv.onclick = () => { if (!buyAetherHeal()) flashNeed(coresEl); else { if (typeof renderShop === 'function' && state === 'shop') renderShop(); if (vendorOpen) renderVendor(); if (infirmaryOpen) renderInfirmary(); } };
  grid.appendChild(hDiv);
  // Per-companion revive
  for (const c of companions.filter(x => x.downed)) {
    const cost = aetherReviveCost(c.type);
    const ok = player.ki >= cost;
    const div = document.createElement('div');
    div.className = 'shopitem' + (ok ? '' : ' maxed');
    div.innerHTML = `<h4>✧ Revive ${COMP_TYPES[c.type].name}<span class="lvl" style="color:var(--cyan)">AETHER</span></h4>
      <small>Pull ${COMP_TYPES[c.type].name} back up at 65% HP. Or hold Talk near them in the field. Auto-revive free at wave end.</small>
      <div class="price" style="color:var(--cyan)">◈ ${cost} aether${ok ? '' : ' · need more'}</div>`;
    if (ok) div.onclick = () => {
      if (!buyAetherRevive(c.type)) flashNeed(coresEl);
      else { if (state === 'shop') renderShop(); if (vendorOpen) renderVendor(); if (infirmaryOpen) renderInfirmary(); }
    };
    grid.appendChild(div);
  }
}
function flashNeed(el) {
  if (!el) return;
  el.style.color = '#ff4d5e';
  setTimeout(() => { el.style.color = ''; }, 300);
}

let infirmaryOpen = false;
function openInfirmary() {
  infirmaryOpen = true;
  $('infirmary').classList.remove('hidden');
  renderInfirmary();
}
function renderInfirmary() {
  $('infAether').textContent = Math.floor(player.ki);
  const grid = $('infirmaryGrid');
  grid.innerHTML = '';
  appendAetherShopItems(grid, $('infAether'));
  const talk = document.createElement('div');
  talk.className = 'shopitem';
  talk.innerHTML = `<h4>Speak with Bramm</h4><small>Quest briefings and turn-ins.</small><div class="price">tap</div>`;
  talk.onclick = () => {
    closeInfirmary();
    const q = QUESTS[questIdx];
    if (questIdx >= QUESTS.length) {
      openDialog(NPC.name, ['The rift is sealed and still you patrol… Rest, legend. Emberfall owes you everything.']);
    } else if (questStage === 'offer') {
      openDialog(NPC.name, q.intro, () => {
        questStage = 'active'; questProgress = 0;
        if (q.type === 'wave') questProgress = wave;
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
  };
  grid.appendChild(talk);
}
function closeInfirmary() { infirmaryOpen = false; $('infirmary').classList.add('hidden'); }

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
  if ($('vendorAether')) $('vendorAether').textContent = Math.floor(player.ki);
  const grid = $('vendorGrid');
  grid.innerHTML = '';
  appendAetherShopItems(grid, $('vendorAether') || $('vendorCores'));
  for (const it of vendorItems()) {
    const usable = it.can();
    const div = document.createElement('div');
    div.className = 'shopitem' + (usable ? '' : ' maxed');
    div.innerHTML = `<h4>${it.name}</h4><small>${it.desc}</small><div class="price">⬡ ${it.cost}</div>`;
    if (usable) div.onclick = () => {
      if (cores < it.cost) { flashNeed($('vendorCores')); return; }
      cores -= it.cost;
      it.buy();
      spawnParticles(player.x, player.y, 14, '#ffd54a', 3);
      renderVendor();
    };
    grid.appendChild(div);
  }
}
$('closeVendorBtn').onclick = () => { vendorOpen = false; $('vendor').classList.add('hidden'); };
if ($('closeInfirmaryBtn')) $('closeInfirmaryBtn').onclick = () => closeInfirmary();

// =================== RIFTNET CO-OP (v2.9 PeerJS foundation) ===================
// Working lobby: Create/Join with short passkey, sync peer avatars (pos/HP) +
// shared wave number, revive requests. Host-authoritative enemies deferred.
// Offline / missing PeerJS: graceful message, no crash (Capacitor-safe).
let riftNetOpen = false;
const riftNet = {
  role: null,       // 'host' | 'guest' | null
  passkey: '',
  peer: null,
  conn: null,
  status: 'idle',
  remotes: {},      // peerId -> {x,y,hp,maxHp,name,wave,t}
  lastSend: 0,
};
function makePasskey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[(Math.random() * alphabet.length) | 0];
  return s;
}
function peerIdFromKey(key) { return 'tr29-' + String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }
function riftNetOnline() {
  try { return typeof navigator === 'undefined' || navigator.onLine !== false; } catch (e) { return true; }
}
function riftNetPeerOk() { return typeof Peer !== 'undefined'; }
function setRiftNetStatus(msg, ok) {
  const el = $('riftNetStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok === false ? '#ff8a93' : ok === true ? '#7CFC00' : '#9fb2c9';
}
function openRiftNet() {
  riftNetOpen = true;
  $('riftNet').classList.remove('hidden');
  $('riftNetKey').value = riftNet.passkey || '';
  if (!riftNetOnline()) setRiftNetStatus('No network — co-op needs an internet connection.', false);
  else if (!riftNetPeerOk()) setRiftNetStatus('PeerJS failed to load. Check network / CDN, then reopen.', false);
  else if (riftNet.status === 'connected') setRiftNetStatus(`Connected as ${riftNet.role} · room ${riftNet.passkey}`, true);
  else setRiftNetStatus('Create a room (host) or join with a passkey. Syncs positions, HP, wave & hold-to-revive. Combat sync still deferred.', null);
}
function closeRiftNet() { riftNetOpen = false; $('riftNet').classList.add('hidden'); }
function destroyRiftNet() {
  try { if (riftNet.conn) riftNet.conn.close(); } catch (e) {}
  try { if (riftNet.peer) riftNet.peer.destroy(); } catch (e) {}
  riftNet.peer = null; riftNet.conn = null; riftNet.role = null;
  riftNet.status = 'idle'; riftNet.remotes = {};
  // solo death rules return if a co-op downed state was active
  if (player.downed) { player.downed = false; if (player.hp <= 0) gameOver(); }
}
function wireRiftConn(conn) {
  riftNet.conn = conn;
  conn.on('open', () => {
    riftNet.status = 'connected';
    setRiftNetStatus(`Linked! Room ${riftNet.passkey} · you are ${riftNet.role}`, true);
    addFloater(player.x, player.y - 50, 'RIFT LINK ONLINE', '#4de1ff', true);
  });
  conn.on('data', (data) => {
    if (!data || typeof data !== 'object') return;
    if (data.t === 'state') {
      riftNet.remotes[data.id || conn.peer] = {
        x: data.x, y: data.y, hp: data.hp, maxHp: data.maxHp,
        name: data.name || 'Vanguard', wave: data.wave, downed: !!data.downed,
        t: performance.now(),
      };
    } else if (data.t === 'reviveReq') {
      // ping only — stand near the downed ally and hold Talk to channel revive
      addFloater(player.x, player.y - 48, 'ALLY NEEDS REVIVE!', '#ffd54a', true);
      banner('RIFT PING', 'Hold Talk near your downed ally · ✈ ' + ALLY_REVIVE_COST + ' aether');
    } else if (data.t === 'reviveDone') {
      // peer finished channeling on you — apply revived state
      if (player.downed || player.hp <= 0) applyAllyReviveLocal(data.hpFrac);
      else {
        player.hp = Math.min(maxHp(), Math.max(player.hp, Math.ceil(maxHp() * (data.hpFrac || 0.65))));
        spawnParticles(player.x, player.y, 16, '#7CFC00', 3);
        addFloater(player.x, player.y - 44, 'ALLY AETHER PULSE', '#7CFC00', true);
      }
    } else if (data.t === 'wave') {
      // presence only — do not force wave changes on guest
    }
  });
  conn.on('close', () => {
    riftNet.status = 'idle';
    setRiftNetStatus('Link closed.', false);
    riftNet.conn = null;
    if (player.downed) { player.downed = false; if (player.hp <= 0) gameOver(); }
  });
  conn.on('error', (err) => setRiftNetStatus('Link error: ' + (err && err.type || 'unknown'), false));
}
function riftNetCreate() {
  if (!riftNetOnline()) { setRiftNetStatus('Need network to host a rift room.', false); return; }
  if (!riftNetPeerOk()) { setRiftNetStatus('PeerJS unavailable offline / CDN blocked.', false); return; }
  destroyRiftNet();
  const key = makePasskey();
  riftNet.passkey = key;
  riftNet.role = 'host';
  $('riftNetKey').value = key;
  setRiftNetStatus('Opening host peer…', null);
  try {
    const peer = new Peer(peerIdFromKey(key), { debug: 0 });
    riftNet.peer = peer;
    peer.on('open', () => setRiftNetStatus(`Room ${key} live — share this passkey. Waiting for ally…`, true));
    peer.on('connection', (conn) => wireRiftConn(conn));
    peer.on('error', (err) => {
      setRiftNetStatus('Host error: ' + (err && err.type || 'failed') + (err.type === 'unavailable-id' ? ' — try Create again' : ''), false);
    });
  } catch (e) {
    setRiftNetStatus('Could not create room (network?).', false);
  }
}
function riftNetJoin() {
  if (!riftNetOnline()) { setRiftNetStatus('Need network to join a rift room.', false); return; }
  if (!riftNetPeerOk()) { setRiftNetStatus('PeerJS unavailable offline / CDN blocked.', false); return; }
  const key = ($('riftNetKey').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (key.length < 4) { setRiftNetStatus('Enter the 4-character passkey.', false); return; }
  destroyRiftNet();
  riftNet.passkey = key;
  riftNet.role = 'guest';
  setRiftNetStatus('Connecting to host…', null);
  try {
    const peer = new Peer({ debug: 0 });
    riftNet.peer = peer;
    peer.on('open', () => {
      const conn = peer.connect(peerIdFromKey(key), { reliable: true });
      wireRiftConn(conn);
    });
    peer.on('error', (err) => setRiftNetStatus('Join error: ' + (err && err.type || 'failed'), false));
  } catch (e) {
    setRiftNetStatus('Could not join (network?).', false);
  }
}
function riftNetRequestRevive() {
  if (!riftNetLinked()) {
    addFloater(player.x, player.y - 40, 'NO RIFT LINK', '#ff8a93', false);
    return;
  }
  if (!player.downed && player.hp > maxHp() * 0.35) {
    addFloater(player.x, player.y - 40, 'NOT DOWNED', '#9fb2c9', false);
    return;
  }
  try { riftNet.conn.send({ t: 'reviveReq' }); } catch (e) {}
  addFloater(player.x, player.y - 40, 'REVIVE REQUEST SENT', '#ffd54a', false);
  banner('PING SENT', 'Ally: hold Talk near you to revive');
}
function updateRiftNet(dt) {
  // prune stale remotes
  const now = performance.now();
  for (const id of Object.keys(riftNet.remotes)) {
    if (now - (riftNet.remotes[id].t || 0) > 4000) delete riftNet.remotes[id];
  }
  if (!riftNet.conn || riftNet.status !== 'connected') return;
  riftNet.lastSend -= dt;
  if (riftNet.lastSend > 0) return;
  riftNet.lastSend = 0.12;
  try {
    riftNet.conn.send({
      t: 'state', id: riftNet.peer && riftNet.peer.id,
      x: player.x, y: player.y, hp: player.hp, maxHp: maxHp(),
      name: 'Vanguard', wave, ki: player.ki, downed: !!player.downed,
    });
  } catch (e) {}
}
if ($('riftNetCreateBtn')) $('riftNetCreateBtn').onclick = () => riftNetCreate();
if ($('riftNetJoinBtn')) $('riftNetJoinBtn').onclick = () => riftNetJoin();
if ($('riftNetCloseBtn')) $('riftNetCloseBtn').onclick = () => closeRiftNet();
if ($('riftNetDisconnectBtn')) $('riftNetDisconnectBtn').onclick = () => { destroyRiftNet(); setRiftNetStatus('Disconnected.', null); };
if ($('riftNetReviveBtn')) $('riftNetReviveBtn').onclick = () => riftNetRequestRevive();

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
  graves = []; graveCount = 0;         // grave markers never cross waves
  spawnQueue = 6 + Math.round(wave * 3.2);
  spawnQueue += companions.length + militia.filter(m => !m.downed).length; // squad draws bigger horde
  spawnTimer = 0.5;
  waveTrainLeft = 3; // Muster Hall can train up to +3 combat each wave (v2.11)
  if (wave % 5 === 0) { spawnEnemy('warlord'); spawnQueue += 4; }
  banner(`WAVE ${wave}`, wave % 5 === 0 ? '⚠ ORK WARLORD APPROACHES ⚠' :
    (waveTrainLeft ? `Muster: train up to ${waveTrainLeft} fighters` : 'the horde emerges…'));
  if (wave === 1 && !rtsTipShown) {
    rtsTipShown = true;
    setTimeout(() => {
      if (state === 'playing')
        banner('TOWN TIP', 'B = BUILD · tap Laborers for Chop/Mine · tap Muster to train');
    }, 4200);
  }
  sfx.syncMusic();
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
  graves = []; // pending skeletons die with the wave
  // downed companions + militia patch themselves up between assaults — no permanent loss
  for (const c of companions) {
    if (!c.downed) continue;
    c.downed = false;
    c.hp = c.maxHp;
    spawnParticles(c.x, c.y, 16, '#7CFC00', 3);
    addFloater(c.x, c.y - 28, COMP_TYPES[c.type].name.toUpperCase() + ' BACK UP!', '#7CFC00', false);
  }
  for (const m of militia) {
    if (!m.downed) continue;
    m.downed = false;
    m.hp = m.maxHp;
    spawnParticles(m.x, m.y, 14, '#7CFC00', 3);
    addFloater(m.x, m.y - 28, militiaName(m).toUpperCase() + ' BACK UP!', '#7CFC00', false);
  }
  for (const L of laborers) {
    if (!L.downed) continue;
    L.downed = false;
    L.hp = L.maxHp;
    spawnParticles(L.x, L.y, 12, '#7CFC00', 3);
    addFloater(L.x, L.y - 28, 'LABORER BACK UP!', '#7CFC00', false);
  }
  // co-op: free wave-break stand-up if you were bleeding out
  if (player.downed) {
    player.downed = false;
    player.downedT = 0;
    player.hp = Math.max(1, Math.ceil(maxHp() * 0.65));
    addFloater(player.x, player.y - 40, 'WAVE BREAK — REVIVED', '#7CFC00', true);
  }
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
  sfx.play('waveclear');
  buzz([40, 60, 40, 60, 80]);
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

function fireWeapons(dt) {
  player.fireCd -= dt;
  player.fire2Cd -= dt;
  const wantFire = mouse.down || touch.fire;
  if (!wantFire || charging) return;
  if (player.fireCd <= 0) {
    player.fireCd = weaponStats(loadout.primary).interval;
    shootBolt(loadout.primary, false);
  }
  // dual-wield ascension: while transformed the off-hand weapon fires too —
  // 60% rate stock, full rate once Twin Channeling rank 1 is learned
  if (player.form > 0 && loadout.secondary && player.fire2Cd <= 0) {
    player.fire2Cd = weaponStats(loadout.secondary).interval * (sk('w5') >= 1 ? 1 : 1.65);
    shootBolt(loadout.secondary, true);
  }
}
function shootBolt(id, offHand) {
  const st = weaponStats(id);
  // Twin Channeling rank 2 halves the dual-wield spread penalty
  const spread = st.spread * (offHand ? 1.8 : 1) / (player.form > 0 && sk('w5') >= 2 ? 2 : 1);
  const a = player.aim + rand(-spread, spread);
  const side = offHand ? -1 : 1; // each hand shoots from its own muzzle
  bolts.push({
    x: player.x + Math.cos(a) * 24 - Math.sin(a) * side * 6,
    y: player.y + Math.sin(a) * 24 + Math.cos(a) * side * 6 - 14,
    vx: Math.cos(a) * st.speed, vy: Math.sin(a) * st.speed,
    life: 1.1, r: st.r, wpn: id, dmg: st.dmg, kb: st.kb,
  });
  camera.shake = Math.min(camera.shake + (id === 'gusher' ? 1.4 : 0.6), 4);
  sfx.play('fire');
}

// Gusher impact: teal energy splash that blasts the whole pack backwards
const GUSHER_SPLASH_R = 90;
function gusherSplash(b, hitEnemy) {
  spawnRing(b.x, b.y, GUSHER_SPLASH_R);
  spawnParticles(b.x, b.y, 26, '#3ef0c8', 4);
  spawnParticles(b.x, b.y, 8, '#bff7ec', 3);
  playZapThump();
  buzz(40);
  camera.shake = Math.max(camera.shake, 6);
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.4) continue;
    const d2 = dist2(e.x, e.y, b.x, b.y);
    if (d2 > (GUSHER_SPLASH_R + e.r) ** 2) continue;
    const d = Math.sqrt(d2) || 1;
    dealDamage(e, b.dmg * (e === hitEnemy ? 1 : 0.6), 'rifle', (e.x - b.x) / d, (e.y - b.y) / d, b.kb);
  }
}

// Sticker needles: stick visibly into the target; ~0.8s after the FIRST
// needle lands the whole cluster bursts — damage scales with the count.
const NEEDLE_FUSE = 0.8, NEEDLE_MAX = 12;
function embedNeedle(e, ang) {
  e.needleN = Math.min(NEEDLE_MAX, (e.needleN || 0) + 1);
  if (!(e.needleT > 0)) e.needleT = NEEDLE_FUSE;
  e.needleA = ang; // approach angle, used to draw the cluster fan
}
function needleBurst(e) {
  const n = e.needleN || 0;
  e.needleN = 0; e.needleT = 0;
  if (!n) return;
  const R = 55 + n * 3;
  const dmgMul = (1 + .22 * gearLvl('rdmg')) * (1 + .2 * sk('w1')) * formMul();
  const dmg = (5 + 2.5 * n) * dmgMul; // strong with a full cluster, never auto-kill
  playCracklePop();
  buzz(30);
  spawnRing(e.x, e.y - e.r, R);
  spawnParticles(e.x, e.y - e.r, 10 + n * 2, '#ff6bd8', 4);
  spawnParticles(e.x, e.y - e.r, 8, '#b04dff', 3);
  camera.shake = Math.max(camera.shake, 4);
  for (const o of enemies) {
    if (o.dead || o.spawnT > 0.4) continue;
    const d2 = dist2(o.x, o.y, e.x, e.y);
    if (d2 > (R + o.r) ** 2) continue;
    const d = Math.sqrt(d2) || 1;
    dealDamage(o, o === e ? dmg : dmg * 0.5, 'rifle', (o.x - e.x) / d, (o.y - e.y) / d, 160);
  }
}

function releaseBeam() {
  if (!charging) return;
  charging = false;
  if (beamCharge < 0.18) { beamCharge = 0; return; }
  const cost = 22 + beamCharge * 26;
  if (player.ki < cost * 0.6) { addFloater(player.x, player.y - 40, 'NOT ENOUGH AETHER', '#4de1ff', false); beamCharge = 0; return; }
  player.ki = Math.max(0, player.ki - cost);
  beam = { a: player.aim, t: 0, dur: 0.65 + beamCharge * 0.4,
    w: (4.5 + beamCharge * 16) * beamWidthMul(), power: beamCharge };
  camera.shake = 12 + beamCharge * 8;
  buzz(45);
  beamCharge = 0;
}

function tryNova() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
  if (player.novaCd > 0) return;
  if (player.ki < 12) { addFloater(player.x, player.y - 40, 'NOT ENOUGH AETHER', '#4de1ff', false); return; }
  player.ki -= 12; player.novaCd = novaCooldown();
  const R = 130 + (player.form ? 30 : 0);
  spawnRing(player.x, player.y, R);
  camera.shake = 8;
  sfx.play('melee');
  buzz(20); // light tap on the melee burst
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
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
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
  buzz(50);
  for (const e of enemies) {
    if (e.dead) continue;
    const d2 = dist2(e.x, e.y, g.x, g.y);
    if (d2 < (R + e.r) ** 2) {
      const d = Math.sqrt(d2) || 1;
      dealDamage(e, grenadeDamage(), 'grenade', (e.x - g.x) / d, (e.y - g.y) / d, 380);
    }
  }
}

function barricadeAimPos() {
  return {
    x: clamp(player.x + Math.cos(player.aim) * 62, 40, WORLD.w - 40),
    y: clamp(player.y + Math.sin(player.aim) * 62, 40, WORLD.h - 40),
  };
}
function barricadeSpotBlocked(bx, by) {
  return obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + 40) ** 2) ||
    barricades.some(b => dist2(bx, by, b.x, b.y) < BARRICADE_MIN_GAP * BARRICADE_MIN_GAP) ||
    brickWalls.some(w => dist2(bx, by, w.x, w.y) < (BRICKWALL_PILLAR_R + 28) ** 2) ||
    structures.some(s => dist2(bx, by, s.x, s.y) < (s.r + 36) ** 2) ||
    goldVeins.some(g => dist2(bx, by, g.x, g.y) < (g.r + 36) ** 2);
}
function barricadeLinkTargets(bx, by) {
  return barricades.filter(b => dist2(bx, by, b.x, b.y) <= BARRICADE_LINK_DIST * BARRICADE_LINK_DIST);
}

function brickWallCardinalDir(dx, dy) {
  if (Math.hypot(dx, dy) > BRICKWALL_LINK_DIST * 1.12) return null;
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dy) <= BRICKWALL_CARDINAL_TOL)
    return dx > 0 ? 'e' : 'w';
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) <= BRICKWALL_CARDINAL_TOL)
    return dy > 0 ? 's' : 'n';
  return null;
}
function brickWallSnapPos(x, y) {
  let best = null, bestScore = 1e9;
  for (const w of brickWalls) {
    const dx = x - w.x, dy = y - w.y;
    const d = Math.hypot(dx, dy);
    if (d < BRICKWALL_MIN_GAP * 0.85) return { x: w.x, y: w.y, overlap: true };
    const dir = brickWallCardinalDir(dx, dy);
    if (!dir) continue;
    let sx = w.x, sy = w.y;
    if (dir === 'e') sx = w.x + BRICKWALL_LINK_DIST;
    if (dir === 'w') sx = w.x - BRICKWALL_LINK_DIST;
    if (dir === 's') sy = w.y + BRICKWALL_LINK_DIST;
    if (dir === 'n') sy = w.y - BRICKWALL_LINK_DIST;
    const score = Math.hypot(x - sx, y - sy);
    if (score < bestScore && score < 42) {
      bestScore = score;
      best = { x: sx, y: sy, overlap: false };
    }
  }
  return best || { x, y, overlap: false };
}
function brickWallSpotBlocked(bx, by) {
  if (!BRICKWALL_ENABLED) return true;
  return obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + 36) ** 2) ||
    barricades.some(b => dist2(bx, by, b.x, b.y) < (b.r + BRICKWALL_PILLAR_R - 4) ** 2) ||
    brickWalls.some(w => dist2(bx, by, w.x, w.y) < BRICKWALL_MIN_GAP * BRICKWALL_MIN_GAP) ||
    structures.some(s => dist2(bx, by, s.x, s.y) < (s.r + 34) ** 2) ||
    goldVeins.some(g => dist2(bx, by, g.x, g.y) < (g.r + 34) ** 2);
}
function brickWallLinkTargets(bx, by) {
  return brickWalls.filter(w => {
    const dx = bx - w.x, dy = by - w.y;
    return !!brickWallCardinalDir(dx, dy);
  });
}

// ===================== RTS LAYER (v2.11) ==========================
// Warcraft-2–inspired town slice (original names only): Rift Keep hub,
// Timber Camp, Muster Hall, farms, gold mines, worker/squad split,
// click orders + light fighter skill trees. Wave survival intact.
const STRUCT_KINDS = {
  keep: {
    name: 'Rift Keep', icon: '🏛',
    desc: 'Town hub · deposit wood & gold · trains laborers',
    cores: 10, wood: 20, gold: 10, max: 1, r: 54, hp: 420,
    upWood: [0, 30, 55], upGold: [0, 16, 30], upCores: [0, 6, 12],
  },
  timber: {
    name: 'Timber Camp', icon: '🪓',
    desc: 'Wood deposit hub · trains Ashen Laborers',
    cores: 4, wood: 0, gold: 0, max: 3, r: 40, hp: 220,
    upWood: [0, 20, 35], upGold: [0, 8, 18], upCores: [0, 4, 6],
  },
  farm: {
    name: 'Supply Camp', icon: '🌾',
    desc: 'Raises worker cap · light wood trickle',
    cores: 5, wood: 10, gold: 2, max: 4, r: 36, hp: 180,
    upWood: [0, 14, 26], upGold: [0, 6, 12], upCores: [0, 3, 5],
  },
  golddepot: {
    name: 'Gold Vault', icon: '◈',
    desc: 'Preferred gold deposit · slight mine speed',
    cores: 6, wood: 10, gold: 0, max: 2, r: 40, hp: 240,
    upWood: [0, 18, 32], upGold: [0, 0, 8], upCores: [0, 4, 7],
  },
  muster: {
    name: 'Muster Hall', icon: '⚔',
    desc: 'Trains combat squad (+3/wave) · Spearmen & Bowmen',
    cores: 8, wood: 12, gold: 6, max: 2, r: 46, hp: 300,
    upWood: [0, 28, 50], upGold: [0, 14, 28], upCores: [0, 6, 10],
  },
  aetherpit: {
    name: 'Aether Pit', icon: '✧',
    desc: 'Seeps gold slowly · tiny aether trickle',
    cores: 6, wood: 8, gold: 4, max: 2, r: 38, hp: 200,
    upWood: [0, 16, 30], upGold: [0, 10, 20], upCores: [0, 5, 8],
  },
};
const LABORER_BASE_MAX = 6;
const LABORER_TRAIN = { wood: 8, gold: 2, cores: 1 };
const SPEAR_TRAIN = { wood: 14, gold: 8, cores: 3 };
const BOW_TRAIN = { wood: 12, gold: 10, cores: 3 };
const SENTINEL_TRAIN = { wood: 18, gold: 12, cores: 4 }; // unique named companion
const COLOSSUS_COST = { wood: 40, gold: 25, cores: 15 };
const COLOSSUS_DURATION = 48;
const MILITIA_TYPES = {
  // v2.13.2: smidge HP/dmg buff
  spear: { name: 'Ashen Spearman', melee: true, hp: 230, spd: 215, range: 70, dmg: 14, atk: 0.95, r: 12 },
  bow: { name: 'Ashen Bowman', melee: false, hp: 180, spd: 240, range: 480, dmg: 10, atk: 1.15, r: 12 },
};
const UNIT_SKILL_COST = [
  { wood: 10, gold: 6, cores: 2 },
  { wood: 18, gold: 12, cores: 4 },
  { wood: 28, gold: 20, cores: 6 },
];

function laborerCap() {
  let cap = LABORER_BASE_MAX;
  for (const s of structures) {
    if (s.kind === 'farm') cap += 2 + (s.lvl - 1);
    if (s.kind === 'keep') cap += 2 + s.lvl;
  }
  return cap;
}
function militiaName(m) { return (MILITIA_TYPES[m.kind] || { name: 'Fighter' }).name; }
function countStruct(kind) { return structures.filter(s => s.kind === kind).length; }
function structureSpotBlocked(bx, by, r) {
  return obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + r) ** 2) ||
    barricades.some(b => dist2(bx, by, b.x, b.y) < (b.r + r - 6) ** 2) ||
    brickWalls.some(w => dist2(bx, by, w.x, w.y) < (BRICKWALL_PILLAR_R + r - 4) ** 2) ||
    structures.some(s => dist2(bx, by, s.x, s.y) < (s.r + r) ** 2) ||
    goldMines.some(g => dist2(bx, by, g.x, g.y) < (g.r + r) ** 2) ||
    Math.hypot(bx - CAMP.x, by - CAMP.y) < 90;
}
function canAffordCosts(c) {
  return cores >= (c.cores || 0) && wood >= (c.wood || 0) && gold >= (c.gold || 0);
}
function spendCosts(c) {
  cores -= c.cores || 0; wood -= c.wood || 0; gold -= c.gold || 0;
}
function costLabel(c) {
  const bits = [];
  if (c.cores) bits.push('⬡' + c.cores);
  if (c.wood) bits.push('🪵' + c.wood);
  if (c.gold) bits.push('◈' + c.gold);
  return bits.join(' · ') || 'free';
}
function openBuildPick() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen ||
      riftNetOpen || infirmaryOpen || structPanelOpen || unitPanelOpen || player.downed) return;
  if (buildPickOpen) { closeBuildPick(); return; }
  buildPickOpen = true;
  renderBuildPick();
  $('buildPick').classList.remove('hidden');
}
function closeBuildPick() {
  buildPickOpen = false;
  if ($('buildPick')) $('buildPick').classList.add('hidden');
}
function renderBuildPick() {
  const grid = $('buildPickGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const bOpt = document.createElement('button');
  bOpt.className = 'buildopt' + (barricades.length >= BARRICADE_MAX || cores < BARRICADE_COST ? ' locked' : '');
  bOpt.innerHTML = `<h4>⛨ Energy Barricade</h4>
    <small>Linked fence post · sentry mount · exit pulse</small>
    <div class="price">⬡ ${BARRICADE_COST} · ${barricades.length}/${BARRICADE_MAX}</div>`;
  bOpt.onclick = () => {
    buildGhostKind = 'barricade';
    if (tryPlaceBarricade()) closeBuildPick();
  };
  grid.appendChild(bOpt);
  if (BRICKWALL_ENABLED) {
    const cost = BRICKWALL_COST;
    const locked = brickWalls.length >= BRICKWALL_MAX || !canAffordCosts(cost);
    const wOpt = document.createElement('button');
    wOpt.className = 'buildopt' + (locked ? ' locked' : '');
    wOpt.innerHTML = `<h4>🧱 Cloister Wall</h4>
      <small>Brick stronghold · auto-link straights · corners & T-junctions</small>
      <div class="price">${costLabel(cost)} · ${brickWalls.length}/${BRICKWALL_MAX}</div>`;
    wOpt.onclick = () => {
      buildGhostKind = 'brickwall';
      if (tryPlaceBrickWall()) closeBuildPick();
    };
    grid.appendChild(wOpt);
  }
  const order = ['keep', 'timber', 'farm', 'golddepot', 'muster', 'aetherpit'];
  for (const kind of order) {
    const def = STRUCT_KINDS[kind];
    if (!def) continue;
    const n = countStruct(kind);
    const cost = { cores: def.cores, wood: def.wood, gold: def.gold };
    const locked = n >= def.max || !canAffordCosts(cost);
    const opt = document.createElement('button');
    opt.className = 'buildopt' + (locked ? ' locked' : '');
    opt.innerHTML = `<h4>${def.icon} ${def.name}</h4>
      <small>${def.desc}</small>
      <div class="price">${costLabel(cost)} · ${n}/${def.max}</div>`;
    opt.onclick = () => { if (tryPlaceStructure(kind)) closeBuildPick(); };
    grid.appendChild(opt);
  }
}
if ($('buildPickCancel')) $('buildPickCancel').onclick = () => closeBuildPick();

function tryPlaceBarricade() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || riftNetOpen || player.downed) return false;
  if (barricades.length >= BARRICADE_MAX) { addFloater(player.x, player.y - 40, `MAX ${BARRICADE_MAX} BARRICADES`, '#ff8a93', false); return false; }
  if (cores < BARRICADE_COST) { addFloater(player.x, player.y - 40, `NEED ${BARRICADE_COST} ⬡`, '#4de1ff', false); return false; }
  const { x: bx, y: by } = barricadeAimPos();
  if (barricadeSpotBlocked(bx, by)) {
    addFloater(player.x, player.y - 40, 'NO ROOM HERE', '#ff8a93', false); return false;
  }
  cores -= BARRICADE_COST;
  const baseHp = BARRICADE_HP + wave * 8;
  barricades.push({ x: bx, y: by, r: BARRICADE_BASE_R, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0 });
  refreshBarricadeLinks();
  const linked = barricades.find(b => Math.hypot(b.x - bx, b.y - by) < 1);
  if (linked && linked.neighbors > 0) {
    addFloater(bx, by - 36, 'LINKED FORTIFY ×' + (1 + linked.neighbors), '#9ef0ff', true);
    spawnParticles(bx, by, 22, '#9ef0ff', 4);
  } else {
    spawnParticles(bx, by, 18, '#7CFC00', 4);
  }
  spawnRing(bx, by, 40);
  return true;
}
function tryPlaceBrickWall() {
  if (!BRICKWALL_ENABLED) return false;
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || riftNetOpen || player.downed) return false;
  if (brickWalls.length >= BRICKWALL_MAX) {
    addFloater(player.x, player.y - 40, `MAX ${BRICKWALL_MAX} CLOISTER`, '#ff8a93', false); return false;
  }
  if (!canAffordCosts(BRICKWALL_COST)) {
    addFloater(player.x, player.y - 40, 'NEED ' + costLabel(BRICKWALL_COST), '#ffd54a', false); return false;
  }
  const aim = barricadeAimPos();
  const snap = brickWallSnapPos(aim.x, aim.y);
  if (snap.overlap) {
    addFloater(player.x, player.y - 40, 'NO ROOM HERE', '#ff8a93', false); return false;
  }
  const bx = clamp(snap.x, 40, WORLD.w - 40);
  const by = clamp(snap.y, 40, WORLD.h - 40);
  if (brickWallSpotBlocked(bx, by)) {
    addFloater(player.x, player.y - 40, 'NO ROOM HERE', '#ff8a93', false); return false;
  }
  spendCosts(BRICKWALL_COST);
  const baseHp = BRICKWALL_HP + wave * 10;
  brickWalls.push({
    x: bx, y: by, r: BRICKWALL_PILLAR_R,
    hp: baseHp, maxHp: baseHp, baseHp,
    neighbors: 0, links: { n: null, e: null, s: null, w: null },
  });
  refreshBrickWallLinks();
  const placed = brickWalls.find(w => Math.hypot(w.x - bx, w.y - by) < 1);
  const n = placed ? placed.neighbors : 0;
  const jType = placed ? brickWallJunctionType(placed) : 'post';
  if (n > 0) {
    const label = jType === 'tee' ? 'T-JUNCTION'
      : jType === 'corner' ? 'CORNER LINK'
      : jType === 'cross' ? 'CROSS LINK'
      : 'LINK ×' + n;
    addFloater(bx, by - 36, label, '#c8a06a', true);
    spawnParticles(bx, by, 20, '#c8a06a', 4);
  } else {
    spawnParticles(bx, by, 16, '#d4a574', 3);
    addFloater(bx, by - 36, 'CLOISTER POST', '#d4a574', false);
  }
  spawnRing(bx, by, 36);
  return true;
}
function tryPlaceStructure(kind) {
  const def = STRUCT_KINDS[kind];
  if (!def) return false;
  if (countStruct(kind) >= def.max) {
    addFloater(player.x, player.y - 40, 'MAX ' + def.name.toUpperCase(), '#ff8a93', false); return false;
  }
  const cost = { cores: def.cores, wood: def.wood, gold: def.gold };
  if (!canAffordCosts(cost)) {
    addFloater(player.x, player.y - 40, 'NEED ' + costLabel(cost), '#ffd54a', false); return false;
  }
  const { x: bx, y: by } = barricadeAimPos();
  if (structureSpotBlocked(bx, by, def.r)) {
    addFloater(player.x, player.y - 40, 'NO ROOM HERE', '#ff8a93', false); return false;
  }
  spendCosts(cost);
  const hp = def.hp + wave * 6;
  structures.push({
    kind, x: bx, y: by, r: def.r, hp, maxHp: hp, lvl: 1,
    trainCd: 0, seepT: 0, kiT: 0,
  });
  spawnParticles(bx, by, 24, '#c8a06a', 4);
  spawnRing(bx, by, def.r);
  addFloater(bx, by - 40, def.name.toUpperCase() + ' RAISED', '#7CFC00', true);
  return true;
}
function tryBuild() { openBuildPick(); }

function seedStarterTown() {
  // Default Rift Keep + 2 Ashen Laborers so the overhaul is discoverable
  if (!structures.some(s => s.kind === 'keep')) {
    const kx = CAMP.x - 70, ky = CAMP.y + 95;
    structures.push({
      kind: 'keep', x: kx, y: ky, r: STRUCT_KINDS.keep.r,
      hp: STRUCT_KINDS.keep.hp, maxHp: STRUCT_KINDS.keep.hp, lvl: 1,
      trainCd: 0, seepT: 0, kiT: 0,
    });
  }
  if (laborers.length < 2) {
    spawnLaborer(CAMP.x + 40, CAMP.y + 110);
    spawnLaborer(CAMP.x - 30, CAMP.y + 125);
  }
}

function trySelectStructureAt(clientX, clientY) {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen ||
      riftNetOpen || infirmaryOpen || buildPickOpen || unitPanelOpen || player.downed) return false;
  const wx = clientX + camera.x, wy = clientY + camera.y;
  // units first (laborers / militia / companions)
  if (trySelectUnitAt(wx, wy)) return true;
  let best = null, bestD = 52 * 52;
  for (const s of structures) {
    const d2 = dist2(wx, wy, s.x, s.y - 10);
    if (d2 < bestD) { bestD = d2; best = s; }
  }
  // also allow tapping gold mines for a tip (not a full panel)
  for (const m of goldMines) {
    if (m.goldLeft <= 0) continue;
    if (dist2(wx, wy, m.x, m.y) < 40 * 40) {
      addFloater(m.x, m.y - 36, 'GOLD MINE — order Laborers to Mine', '#ffd54a', false);
      return true;
    }
  }
  if (!best) return false;
  if (dist2(best.x, best.y, player.x, player.y) > 180 * 180) {
    addFloater(player.x, player.y - 36, 'MOVE CLOSER TO BUILDING', '#ffd54a', false);
    return true;
  }
  openStructPanel(best);
  return true;
}
function trySelectUnitAt(wx, wy) {
  let best = null, bestD = 36 * 36, kind = null;
  for (const L of laborers) {
    if (L.insideMine) continue;
    const d2 = dist2(wx, wy, L.x, L.y - 8);
    if (d2 < bestD) { bestD = d2; best = L; kind = 'laborer'; }
  }
  for (const m of militia) {
    if (m.downed) continue;
    const d2 = dist2(wx, wy, m.x, m.y - 8);
    if (d2 < bestD) { bestD = d2; best = m; kind = 'militia'; }
  }
  for (const c of companions) {
    if (c.downed) continue;
    const d2 = dist2(wx, wy, c.x, c.y - 8);
    if (d2 < bestD) { bestD = d2; best = c; kind = 'companion'; }
  }
  if (!best) return false;
  openUnitPanel(best, kind);
  return true;
}
function openStructPanel(s) {
  closeUnitPanel();
  selectedStructure = s;
  structPanelOpen = true;
  renderStructPanel();
  $('structPanel').classList.remove('hidden');
}
function closeStructPanel() {
  structPanelOpen = false;
  selectedStructure = null;
  if ($('structPanel')) $('structPanel').classList.add('hidden');
}
function openUnitPanel(u, kind) {
  closeStructPanel();
  selectedUnit = { ref: u, kind };
  unitPanelOpen = true;
  renderUnitPanel();
  if ($('unitPanel')) $('unitPanel').classList.remove('hidden');
}
function closeUnitPanel() {
  unitPanelOpen = false;
  selectedUnit = null;
  if ($('unitPanel')) $('unitPanel').classList.add('hidden');
}
function renderStructPanel() {
  const s = selectedStructure;
  if (!s || !STRUCT_KINDS[s.kind]) { closeStructPanel(); return; }
  const def = STRUCT_KINDS[s.kind];
  $('structTitle').textContent = def.icon + ' ' + def.name + ' · L' + s.lvl;
  const metaBits = [
    `HP ${Math.ceil(s.hp)}/${s.maxHp}`,
    `Workers ${laborers.length}/${laborerCap()} (not squad)`,
    `Squad ${companions.length + militia.length} · train left ${waveTrainLeft}`,
  ];
  if (s.kind === 'timber') metaBits.push('Chop / deposit hub');
  if (s.kind === 'keep') metaBits.push('Town hub · wood+gold deposit');
  if (s.kind === 'muster') metaBits.push('Combat train only');
  if (s.kind === 'farm') metaBits.push('Raises worker cap');
  if (s.kind === 'golddepot') metaBits.push('Gold deposit priority');
  $('structMeta').textContent = metaBits.join(' · ');
  const acts = $('structActions');
  acts.innerHTML = '';
  const addBtn = (label, cls, fn, disabled) => {
    const b = document.createElement('button');
    b.className = cls || '';
    b.textContent = label;
    b.disabled = !!disabled;
    if (!disabled) b.onclick = fn;
    acts.appendChild(b);
  };
  if (s.lvl < 3) {
    const up = { wood: def.upWood[s.lvl], gold: def.upGold[s.lvl], cores: def.upCores[s.lvl] };
    addBtn(`⬆ UPGRADE L${s.lvl + 1} (${costLabel(up)})`, 'gold', () => {
      if (!canAffordCosts(up)) { addFloater(s.x, s.y - 40, 'NEED ' + costLabel(up), '#ffd54a', false); return; }
      spendCosts(up);
      s.lvl++;
      s.maxHp = Math.round(s.maxHp * 1.35);
      s.hp = s.maxHp;
      s.r = def.r + (s.lvl - 1) * 4;
      spawnParticles(s.x, s.y, 28, '#ffd54a', 4);
      addFloater(s.x, s.y - 42, def.name.toUpperCase() + ' L' + s.lvl, '#7CFC00', true);
      renderStructPanel();
    }, !canAffordCosts(up));
  } else {
    addBtn('MAX LEVEL', '', null, true);
  }
  // Workers train at Keep / Timber / Farm — NEVER consume squad slots
  if (s.kind === 'timber' || s.kind === 'keep' || s.kind === 'farm') {
    addBtn(`🪓 TRAIN LABORER (${costLabel(LABORER_TRAIN)})`, 'green', () => {
      if (laborers.length >= laborerCap()) { addFloater(s.x, s.y - 40, 'MAX WORKERS', '#ff8a93', false); return; }
      if (!canAffordCosts(LABORER_TRAIN)) { addFloater(s.x, s.y - 40, 'NEED ' + costLabel(LABORER_TRAIN), '#ffd54a', false); return; }
      spendCosts(LABORER_TRAIN);
      spawnLaborer(s.x + rand(-30, 30), s.y + 36);
      addFloater(s.x, s.y - 40, 'ASHEN LABORER READY', '#c8a06a', true);
      renderStructPanel();
    }, laborers.length >= laborerCap() || !canAffordCosts(LABORER_TRAIN));
  }
  if (s.kind === 'muster') {
    addBtn(`⚔ TRAIN SPEARMAN (${costLabel(SPEAR_TRAIN)}) · ${waveTrainLeft} left`, 'green', () => {
      if (!tryTrainMilitia('spear', s)) return;
      renderStructPanel();
    }, waveTrainLeft <= 0 || !canAffordCosts(SPEAR_TRAIN));
    addBtn(`🏹 TRAIN BOWMAN (${costLabel(BOW_TRAIN)}) · ${waveTrainLeft} left`, 'green', () => {
      if (!tryTrainMilitia('bow', s)) return;
      renderStructPanel();
    }, waveTrainLeft <= 0 || !canAffordCosts(BOW_TRAIN));
    addBtn(`🛡 TRAIN SENTINEL (${costLabel(SENTINEL_TRAIN)})`, '', () => {
      if (squad.owned.sentinel) { addFloater(s.x, s.y - 40, 'SENTINEL ALREADY RECRUITED', '#9ef0ff', false); return; }
      if (!canAffordCosts(SENTINEL_TRAIN)) { addFloater(s.x, s.y - 40, 'NEED ' + costLabel(SENTINEL_TRAIN), '#ffd54a', false); return; }
      spendCosts(SENTINEL_TRAIN);
      squad.owned.sentinel = true;
      squad.active.sentinel = true;
      syncCompanions();
      spawnParticles(s.x, s.y, 26, '#b04dff', 4);
      addFloater(s.x, s.y - 44, 'ASHEN SENTINEL JOINS!', '#7CFC00', true);
      renderStructPanel();
    }, !!squad.owned.sentinel || !canAffordCosts(SENTINEL_TRAIN));
  }
  addBtn('⚔ RIFT TITAN (C)', '', () => { closeStructPanel(); trySummonColossus(); });
}
if ($('structClose')) $('structClose').onclick = () => closeStructPanel();
if ($('unitClose')) $('unitClose').onclick = () => closeUnitPanel();

function renderUnitPanel() {
  if (!selectedUnit || !selectedUnit.ref) { closeUnitPanel(); return; }
  const { ref: u, kind } = selectedUnit;
  const title = $('unitTitle'), meta = $('unitMeta'), acts = $('unitActions');
  if (!title || !meta || !acts) return;
  acts.innerHTML = '';
  const addBtn = (label, cls, fn, disabled) => {
    const b = document.createElement('button');
    b.className = cls || '';
    b.textContent = label;
    b.disabled = !!disabled;
    if (!disabled) b.onclick = fn;
    acts.appendChild(b);
  };
  if (kind === 'laborer') {
    title.textContent = '🪓 Ashen Laborer (worker)';
    meta.textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · Order: ${(u.order || 'auto').toUpperCase()} · Does NOT use squad slots · Revivable · Retaliates only when attacked`;
    addBtn('Chop Lumber', u.order === 'chop' ? 'green' : '', () => {
      u.order = 'chop'; u.task = 'idle'; u.target = null; u.carry = null; u.insideMine = false;
      addFloater(u.x, u.y - 24, 'ORDER: CHOP', '#7a9a5a', false);
      renderUnitPanel();
    });
    addBtn('Mine Gold', u.order === 'mine' ? 'gold' : 'gold', () => {
      u.order = 'mine'; u.task = 'idle'; u.target = null; u.carry = null;
      addFloater(u.x, u.y - 24, 'ORDER: MINE', '#ffd54a', false);
      renderUnitPanel();
    });
    addBtn('Auto Gather', u.order === 'auto' || !u.order ? 'green' : '', () => {
      u.order = 'auto'; u.task = 'idle'; u.target = null;
      addFloater(u.x, u.y - 24, 'ORDER: AUTO', '#c8a06a', false);
      renderUnitPanel();
    });
    addBtn('Follow (build assist)', u.order === 'follow' ? 'green' : '', () => {
      u.order = 'follow'; u.task = 'follow'; u.target = null; u.carry = null; u.insideMine = false;
      addFloater(u.x, u.y - 24, 'ORDER: FOLLOW', '#9ef0ff', false);
      renderUnitPanel();
    });
  } else if (kind === 'militia') {
    const t = MILITIA_TYPES[u.kind];
    title.textContent = '⚔ ' + t.name + ' (squad)';
    meta.textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · Skills D${u.sk.dmg}/A${u.sk.armor}/S${u.sk.spd} · Revivable`;
    addUnitSkillButtons(u, addBtn);
  } else if (kind === 'companion') {
    title.textContent = '★ ' + COMP_TYPES[u.type].name + ' (named companion)';
    meta.textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · Field skills below · Full tree also in K menu`;
    if (!u.sk) u.sk = { dmg: 0, armor: 0, spd: 0 };
    addUnitSkillButtons(u, addBtn);
  }
}
function addUnitSkillButtons(u, addBtn) {
  const nodes = [
    { key: 'dmg', label: '⚔ Edge (+dmg)' },
    { key: 'armor', label: '🛡 Plate (+armor)' },
    { key: 'spd', label: '» Stride (+speed)' },
  ];
  for (const n of nodes) {
    const rank = u.sk[n.key] || 0;
    if (rank >= 3) { addBtn(n.label + ' MAX', '', null, true); continue; }
    const cost = UNIT_SKILL_COST[rank];
    addBtn(`${n.label} L${rank + 1} (${costLabel(cost)})`, 'gold', () => {
      if (!canAffordCosts(cost)) { addFloater(u.x, u.y - 30, 'NEED ' + costLabel(cost), '#ffd54a', false); return; }
      spendCosts(cost);
      u.sk[n.key] = rank + 1;
      if (n.key === 'armor') {
        u.maxHp = Math.round(u.maxHp * 1.12);
        u.hp = Math.min(u.maxHp, u.hp + 20);
      }
      spawnParticles(u.x, u.y, 16, '#ffd54a', 3);
      addFloater(u.x, u.y - 28, n.label.toUpperCase(), '#7CFC00', true);
      renderUnitPanel();
    }, !canAffordCosts(cost));
  }
}

function tryTrainMilitia(kind, atStruct) {
  if (waveTrainLeft <= 0) {
    addFloater(atStruct.x, atStruct.y - 40, 'WAVE TRAIN CAP (+3)', '#ff8a93', false); return false;
  }
  const cost = kind === 'bow' ? BOW_TRAIN : SPEAR_TRAIN;
  if (!canAffordCosts(cost)) {
    addFloater(atStruct.x, atStruct.y - 40, 'NEED ' + costLabel(cost), '#ffd54a', false); return false;
  }
  spendCosts(cost);
  waveTrainLeft--;
  const t = MILITIA_TYPES[kind];
  militia.push({
    id: militiaIdSeq++, kind,
    x: atStruct.x + rand(-36, 36), y: atStruct.y + 40,
    vx: 0, vy: 0, r: t.r,
    hp: t.hp, maxHp: t.hp, downed: false, hurtT: 0,
    atkCd: rand(0.2, 0.8), walk: rand(0, 8), facing: 1, aim: 0,
    sk: { dmg: 0, armor: 0, spd: 0 },
  });
  spawnParticles(atStruct.x, atStruct.y, 22, '#7CFC00', 4);
  addFloater(atStruct.x, atStruct.y - 44, t.name.toUpperCase() + ' TRAINED!', '#7CFC00', true);
  return true;
}

function spawnLaborer(x, y) {
  laborers.push({
    id: laborerIdSeq++,
    x, y, vx: 0, vy: 0, r: 11, hp: 90, maxHp: 90,
    carry: null, // {type:'wood'|'gold', amt}
    target: null, task: 'idle', order: 'auto',
    gatherT: 0, walk: rand(0, 8), facing: 1, hurtT: 0,
    insideMine: false, mineT: 0,
    downed: false, atkCd: rand(0.2, 0.6), swipeT: 0, retaliateT: 0, // v2.13.2: revivable; retaliate-on-hit only
  });
}
function nearestDeposit(from, resType) {
  let best = null, bd = 1e12;
  const prefer = resType === 'gold'
    ? ['golddepot', 'keep', 'timber', 'muster']
    : ['timber', 'keep', 'golddepot', 'muster'];
  for (const kind of prefer) {
    for (const s of structures) {
      if (s.kind !== kind) continue;
      const d = dist2(from.x, from.y, s.x, s.y);
      // slight bias toward preferred kinds
      const bias = prefer.indexOf(kind) * 80 * 80;
      if (d + bias < bd) { bd = d + bias; best = s; }
    }
    if (best && (kind === prefer[0] || kind === prefer[1])) break;
  }
  return best;
}
function gatherRateMul() {
  let mul = 1;
  for (const s of structures) {
    if (s.kind === 'timber') mul = Math.max(mul, 1 + 0.35 * (s.lvl - 1));
    if (s.kind === 'golddepot') mul = Math.max(mul, 1 + 0.2 * (s.lvl - 1));
    if (s.kind === 'keep') mul = Math.max(mul, 1 + 0.15 * s.lvl);
  }
  return mul;
}
function pickChopTarget(L) {
  let tree = null, td = 640 * 640;
  for (const o of obstacles) {
    if (o.type !== 'tree' || !(o.woodLeft > 0)) continue;
    let d2 = dist2(L.x, L.y, o.x, o.y);
    if (o.standId != null) d2 *= 0.72; // prefer forest stands
    if (d2 < td) { td = d2; tree = o; }
  }
  return tree;
}
function pickMineTarget(L) {
  let mine = null, vd = 720 * 720;
  for (const g of goldMines) {
    if (!(g.goldLeft > 0)) continue;
    const d2 = dist2(L.x, L.y, g.x, g.y);
    if (d2 < vd) { vd = d2; mine = g; }
  }
  return mine;
}
function updateLaborers(dt) {
  const rate = gatherRateMul();
  const LABORER_RETALIATE_RANGE = 160;
  const LABORER_DMG = 7;
  for (const L of laborers) {
    if (L.downed) { L.vx = 0; L.vy = 0; continue; }
    L.hurtT = Math.max(0, L.hurtT - dt);
    L.retaliateT = Math.max(0, (L.retaliateT || 0) - dt);
    L.gatherT = Math.max(0, L.gatherT - dt);
    if (L.swipeT > 0) L.swipeT = Math.max(0, L.swipeT - dt);
    L.atkCd = (L.atkCd || 0) - dt;
    // v2.13.2: retaliate ONLY after being hit (no proactive threaten-engage / flee-to-fight)
    if (!L.insideMine && (L.retaliateT || 0) > 0) {
      let foe = null, fd2 = LABORER_RETALIATE_RANGE * LABORER_RETALIATE_RANGE;
      for (const e of enemies) {
        if (e.dead || e.spawnT > 0.3 || (e.emergeT || 0) > 0) continue;
        const d2 = dist2(e.x, e.y, L.x, L.y);
        if (d2 < fd2) { fd2 = d2; foe = e; }
      }
      if (foe) {
        L.task = 'defend';
        const dx = foe.x - L.x, dy = foe.y - L.y, gd = Math.hypot(dx, dy) || 1;
        const spd = 175;
        L.vx = lerp(L.vx, dx / gd * spd, dt * 5);
        L.vy = lerp(L.vy, dy / gd * spd, dt * 5);
        L.x = clamp(L.x + L.vx * dt, L.r, WORLD.w - L.r);
        L.y = clamp(L.y + L.vy * dt, L.r, WORLD.h - L.r);
        collideObstacles(L);
        L.walk += dt * Math.hypot(L.vx, L.vy) * 0.05;
        if (Math.abs(L.vx) > 4) L.facing = L.vx >= 0 ? 1 : -1;
        const reach = L.r + foe.r + 12;
        if (L.atkCd <= 0 && fd2 < reach * reach) {
          L.atkCd = 1.05;
          L.swipeT = UNIT_SWIPE;
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, LABORER_DMG, (foe.x - L.x) / d, (foe.y - L.y) / d, 90);
          zap(L.x, L.y - 6, foe.x, foe.y - 8);
          spawnParticles(foe.x, foe.y - 6, 3, '#c8a06a', 2);
        }
        continue;
      }
      // no foe in range while retaliating — resume work (timer still ticks down)
    }
    // inside mine: work then exit with gold
    if (L.insideMine && L.target) {
      L.mineT = (L.mineT || 0) - dt;
      L.vx = 0; L.vy = 0;
      if (L.mineT <= 0) {
        if (L.target.goldLeft > 0) {
          L.target.goldLeft--;
          L.carry = { type: 'gold', amt: 1 + (Math.random() < 0.2 * rate ? 1 : 0) };
          L.target.occupied = Math.max(0, (L.target.occupied || 1) - 1);
          spawnParticles(L.target.x, L.target.y - 8, 5, '#ffd54a', 2);
        }
        L.insideMine = false;
        L.task = 'deposit';
        L.target = nearestDeposit(L, 'gold');
      }
      continue;
    }
    if (L.order === 'follow') {
      L.task = 'follow'; L.target = null;
    } else if (!L.carry && L.task !== 'gather' && L.task !== 'enterMine') {
      const want = L.order || 'auto';
      const tree = pickChopTarget(L);
      const mine = pickMineTarget(L);
      if (want === 'chop' && tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
      else if (want === 'mine' && mine) { L.task = 'enterMine'; L.target = mine; L.res = 'gold'; }
      else if (want === 'auto') {
        if (wood < 90 && tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
        else if (mine) { L.task = 'enterMine'; L.target = mine; L.res = 'gold'; }
        else if (tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
        else { L.task = 'idle'; L.target = null; }
      } else { L.task = 'idle'; L.target = null; }
    } else if (L.carry) {
      L.task = 'deposit';
      L.target = nearestDeposit(L, L.carry.type);
    }
    let gx = player.x + rand(-40, 40), gy = player.y + 70;
    if (L.task === 'follow') {
      gx = player.x + rand(-50, 50); gy = player.y + 80;
    } else if ((L.task === 'gather' || L.task === 'enterMine') && L.target) {
      gx = L.target.x; gy = L.target.y;
      const reach = (L.target.r || 14) + L.r + 6;
      if (dist2(L.x, L.y, gx, gy) < reach * reach) {
        L.vx *= 0.5; L.vy *= 0.5;
        if (L.task === 'enterMine') {
          L.insideMine = true;
          L.mineT = Math.max(1.1, 2.4 / rate);
          L.target.occupied = (L.target.occupied || 0) + 1;
          L.task = 'mining';
        } else if (L.gatherT <= 0) {
          L.gatherT = 1.15 / rate;
          if (L.res === 'wood' && L.target.woodLeft > 0) {
            L.target.woodLeft--;
            L.carry = { type: 'wood', amt: 1 + (Math.random() < 0.25 * rate ? 1 : 0) };
            spawnParticles(L.target.x, L.target.y - 10, 3, '#7a9a5a', 2);
          } else {
            L.task = 'idle'; L.target = null;
          }
        }
      }
    } else if (L.task === 'deposit') {
      if (!L.target) {
        if (L.carry.type === 'wood') wood += L.carry.amt; else gold += L.carry.amt;
        addFloater(L.x, L.y - 22, L.carry.type === 'wood' ? '+🪵' : '+◈', '#ffd54a', false);
        L.carry = null; L.task = 'idle';
      } else {
        gx = L.target.x; gy = L.target.y;
        if (dist2(L.x, L.y, gx, gy) < (L.target.r + 10) ** 2) {
          if (L.carry.type === 'wood') wood += L.carry.amt; else gold += L.carry.amt;
          addFloater(L.target.x, L.target.y - 36, L.carry.type === 'wood' ? '+WOOD' : '+GOLD', '#ffd54a', false);
          L.carry = null; L.task = 'idle'; L.target = null;
        }
      }
    }
    const dx = gx - L.x, dy = gy - L.y, gd = Math.hypot(dx, dy);
    const spd = 165;
    if (gd > 14) { L.vx = lerp(L.vx, dx / gd * spd, dt * 4); L.vy = lerp(L.vy, dy / gd * spd, dt * 4); }
    else { L.vx *= 0.8; L.vy *= 0.8; }
    L.x = clamp(L.x + L.vx * dt, L.r, WORLD.w - L.r);
    L.y = clamp(L.y + L.vy * dt, L.r, WORLD.h - L.r);
    collideObstacles(L);
    L.walk += dt * Math.hypot(L.vx, L.vy) * 0.05;
    if (Math.abs(L.vx) > 4) L.facing = L.vx >= 0 ? 1 : -1;
  }
  // keep downed bodies for field revive (never consume squad slots)
  if (selectedUnit && selectedUnit.kind === 'laborer' && !laborers.includes(selectedUnit.ref)) closeUnitPanel();
}
function hurtLaborer(L, dmg) {
  if (L.insideMine || L.downed) return; // safe while in mine shaft
  L.hp -= dmg;
  L.hurtT = 0.5;
  L.retaliateT = 6; // v2.13.2: only fight back after taking a hit
  if (L.hp <= 0) {
    L.hp = 0;
    L.downed = true;
    L.vx = 0; L.vy = 0;
    L.insideMine = false;
    L.carry = null;
    L.task = 'idle';
    L.retaliateT = 0;
    spawnParticles(L.x, L.y, 12, '#c8a06a', 3);
    addFloater(L.x, L.y - 28, 'LABORER DOWN', '#ff8a93', false);
  }
}
function finishLaborerRevive(L) {
  L.downed = false;
  L.hp = Math.ceil(L.maxHp * 0.65);
  L.hurtT = 0.8;
  L.task = 'idle';
  spawnParticles(L.x, L.y, 14, '#4de1ff', 4);
  addFloater(L.x, L.y - 32, 'LABORER REVIVED', '#4de1ff', true);
  sfx.play('click');
}
function updateStructures(dt) {
  for (const s of structures) {
    if (s.kind === 'aetherpit') {
      const goldEvery = Math.max(2.2, 5.5 - s.lvl * 0.9);
      s.seepT = (s.seepT || 0) - dt;
      if (s.seepT <= 0) {
        s.seepT = goldEvery;
        gold += s.lvl;
        addFloater(s.x, s.y - 34, '+◈' + s.lvl, '#ffd54a', false);
      }
      s.kiT = (s.kiT || 0) - dt;
      if (s.kiT <= 0) {
        s.kiT = 4.5;
        player.ki = Math.min(maxKi(), player.ki + 1 + s.lvl);
      }
    }
    if (s.kind === 'farm') {
      s.seepT = (s.seepT || 0) - dt;
      if (s.seepT <= 0) {
        s.seepT = 7.5 - s.lvl * 0.8;
        wood += 1;
        addFloater(s.x, s.y - 30, '+🪵', '#7a9a5a', false);
      }
    }
  }
}
function collideStructures(e, dt) {
  for (const s of structures) {
    const d2 = dist2(e.x, e.y, s.x, s.y), minD = s.r + e.r;
    if (d2 < minD * minD && d2 > 0.01) {
      const d = Math.sqrt(d2);
      e.x = s.x + (e.x - s.x) / d * minD;
      e.y = s.y + (e.y - s.y) / d * minD;
      let smash = (e.boss ? 7 : 2.4);
      s.hp -= smash * dt * 8;
      if (s.hp <= 0) {
        addFloater(s.x, s.y - 30, STRUCT_KINDS[s.kind].name.toUpperCase() + ' RAZED!', '#ff8a93', true);
        spawnParticles(s.x, s.y, 30, '#c8a06a', 5);
      }
    }
  }
  for (const L of laborers) {
    if (L.insideMine || L.downed) continue;
    if (dist2(e.x, e.y, L.x, L.y) < (e.r + L.r) ** 2) {
      if ((L.hurtT || 0) <= 0) hurtLaborer(L, e.dmg * 0.35);
    }
  }
  for (const m of militia) {
    if (m.downed) continue;
    if (dist2(e.x, e.y, m.x, m.y) < (e.r + m.r + 4) ** 2) {
      if ((m.hurtT || 0) <= 0) hurtMilitia(m, e.dmg * 0.4);
    }
  }
  if (colossus && !colossus.dead && dist2(e.x, e.y, colossus.x, colossus.y) < (e.r + colossus.r) ** 2) {
    const d = Math.hypot(e.x - colossus.x, e.y - colossus.y) || 1;
    e.x = colossus.x + (e.x - colossus.x) / d * (e.r + colossus.r);
    e.y = colossus.y + (e.y - colossus.y) / d * (e.r + colossus.r);
  }
  structures = structures.filter(s => s.hp > 0);
  if (selectedStructure && !structures.includes(selectedStructure)) closeStructPanel();
}

function militiaDamage(m) {
  const t = MILITIA_TYPES[m.kind];
  return t.dmg * (1 + 0.28 * (m.sk.dmg || 0));
}
function militiaSpd(m) {
  const t = MILITIA_TYPES[m.kind];
  return t.spd * (1 + 0.12 * (m.sk.spd || 0));
}
function hurtMilitia(m, dmg) {
  if (m.downed || m.hurtT > 0) return;
  dmg *= 1 / (1 + 0.18 * (m.sk.armor || 0));
  if (dist2(m.x, m.y, player.x, player.y) < 115 * 115) dmg *= 0.58;
  m.hp -= dmg;
  m.hurtT = 0.65;
  spawnParticles(m.x, m.y - 10, 5, '#ff8a93', 2);
  if (m.hp <= 0) {
    m.hp = 0; m.downed = true;
    addFloater(m.x, m.y - 30, militiaName(m).toUpperCase() + ' DOWN', '#ff8a93', true);
  }
}
function finishMilitiaRevive(m) {
  m.downed = false;
  m.hp = Math.ceil(m.maxHp * 0.65);
  m.hurtT = 0.8;
  spawnParticles(m.x, m.y, 16, '#4de1ff', 4);
  addFloater(m.x, m.y - 32, militiaName(m).toUpperCase() + ' REVIVED', '#4de1ff', true);
  sfx.play('click');
}
function updateMilitia(dt) {
  militia.forEach((m, idx) => {
    if (m.downed) return;
    m.hurtT = Math.max(0, m.hurtT - dt);
    if (m.swipeT > 0) m.swipeT = Math.max(0, m.swipeT - dt);
    m.atkCd -= dt;
    const t = MILITIA_TYPES[m.kind];
    // v2.13.1 WC2-style engage: acquire foes near self OR near player (old melee aggro=90 never left follow)
    const aggro = t.melee ? 380 : t.range;
    const protectR2 = 440 * 440;
    let foe = null, fd2 = Infinity;
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.3 || (e.emergeT || 0) > 0) continue;
      const d2 = dist2(e.x, e.y, m.x, m.y);
      const nearPlayer = dist2(e.x, e.y, player.x, player.y) < protectR2;
      if (d2 > aggro * aggro && !nearPlayer) continue;
      if (d2 < fd2) { fd2 = d2; foe = e; }
    }
    const slotA = (companions.length + idx) * 2.2 + 1.8;
    let gx = player.x + Math.cos(slotA) * 70, gy = player.y + Math.sin(slotA) * 70;
    if (foe) {
      if (t.melee) { gx = foe.x; gy = foe.y; }
      else {
        const fd = Math.sqrt(fd2) || 1;
        const hold = t.range * 0.55;
        if (fd < hold * 0.7) { gx = m.x - (foe.x - m.x) / fd * 55; gy = m.y - (foe.y - m.y) / fd * 55; }
        else if (fd > hold) { gx = foe.x; gy = foe.y; }
        else { gx = m.x; gy = m.y; }
      }
    }
    const dx = gx - m.x, dy = gy - m.y, gd = Math.hypot(dx, dy);
    const spd = militiaSpd(m);
    if (gd > 22) { m.vx = lerp(m.vx, dx / gd * spd, dt * 5); m.vy = lerp(m.vy, dy / gd * spd, dt * 5); }
    else { m.vx *= 0.82; m.vy *= 0.82; }
    for (const o of militia) {
      if (o === m || o.downed) continue;
      const d2 = dist2(m.x, m.y, o.x, o.y);
      if (d2 < 28 * 28 && d2 > 0.01) {
        const d = Math.sqrt(d2); m.vx += (m.x - o.x) / d * 50; m.vy += (m.y - o.y) / d * 50;
      }
    }
    const pd2 = dist2(m.x, m.y, player.x, player.y);
    if (pd2 < 34 * 34 && pd2 > 0.01) {
      const d = Math.sqrt(pd2); m.vx += (m.x - player.x) / d * 85; m.vy += (m.y - player.y) / d * 85;
    }
    m.x = clamp(m.x + m.vx * dt, m.r, WORLD.w - m.r);
    m.y = clamp(m.y + m.vy * dt, m.r, WORLD.h - m.r);
    collideObstacles(m);
    m.walk += dt * Math.hypot(m.vx, m.vy) * 0.045;
    if (Math.abs(m.vx) > 4) m.facing = m.vx >= 0 ? 1 : -1;
    if (pd2 > 1300 * 1300) { m.x = player.x + rand(-70, 70); m.y = player.y + rand(-70, 70); }
    if (foe) {
      m.aim = Math.atan2(foe.y - m.y, foe.x - m.x);
      m.facing = Math.cos(m.aim) >= 0 ? 1 : -1;
      if (t.melee) {
        // spear reach uses type.range (70) so they poke instead of needing body contact
        const reach = Math.max(m.r + foe.r + 14, t.range);
        if (m.atkCd <= 0 && fd2 < reach * reach) {
          m.atkCd = t.atk;
          m.swipeT = UNIT_SWIPE;
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, militiaDamage(m), (foe.x - m.x) / d, (foe.y - m.y) / d, 130);
          zap(m.x, m.y - 8, foe.x, foe.y - 10);
          spawnParticles(foe.x, foe.y - 8, 4, '#c8a06a', 2);
        }
      } else if (m.atkCd <= 0 && fd2 < t.range * t.range) {
        m.atkCd = t.atk;
        m.swipeT = UNIT_SWIPE * 0.65;
        const a = m.aim + rand(-0.05, 0.05);
        cbolts.push({
          x: m.x + Math.cos(a) * 16, y: m.y - 12 + Math.sin(a) * 16,
          vx: Math.cos(a) * 700, vy: Math.sin(a) * 700,
          life: 1.0, r: 3, dmg: militiaDamage(m), pierce: 1, hit: [], scout: false,
        });
      }
    }
  });
  if (selectedUnit && selectedUnit.kind === 'militia' && !militia.includes(selectedUnit.ref)) closeUnitPanel();
}

// adjacent barricades merge in effective size + HP (v2.9) — see below
function trySummonColossus() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen ||
      riftNetOpen || infirmaryOpen || buildPickOpen || player.downed) return;
  if (colossus && !colossus.dead) {
    addFloater(player.x, player.y - 40, 'COLOSSUS ALREADY ACTIVE', '#b04dff', false); return;
  }
  if (!canAffordCosts(COLOSSUS_COST)) {
    addFloater(player.x, player.y - 40, 'NEED ' + costLabel(COLOSSUS_COST), '#ffd54a', false); return;
  }
  // fodder: nearby living laborers + living companions within 200 (downed workers stay for revive)
  const fodderL = laborers.filter(L => !L.downed && dist2(L.x, L.y, player.x, player.y) < 200 * 200);
  const fodderC = companions.filter(c => !c.downed && dist2(c.x, c.y, player.x, player.y) < 200 * 200);
  if (fodderL.length + fodderC.length < 2) {
    addFloater(player.x, player.y - 40, 'NEED 2 NEARBY ALLIES TO MERGE', '#ff8a93', false); return;
  }
  spendCosts(COLOSSUS_COST);
  // consume laborers first, then merge one companion if still short
  let need = 2;
  for (const L of fodderL) {
    if (need <= 0) break;
    spawnParticles(L.x, L.y, 16, '#b04dff', 3);
    const ix = laborers.indexOf(L);
    if (ix >= 0) laborers.splice(ix, 1);
    need--;
  }
  if (need > 0 && fodderC.length) {
    const c = fodderC[0];
    c.downed = true; c.hp = 0;
    addFloater(c.x, c.y - 30, COMP_TYPES[c.type].name.toUpperCase() + ' MERGED', '#b04dff', false);
  }
  colossus = {
    x: player.x + Math.cos(player.aim) * 50,
    y: player.y + Math.sin(player.aim) * 50,
    r: 54, // ~Gharok collision scale
    hp: 820, maxHp: 820, vx: 0, vy: 0,
    atkCd: 0.6, life: COLOSSUS_DURATION, walk: 0, facing: 1, dead: false,
  };
  banner('AETHER COLOSSUS', 'rift titan assembled');
  spawnParticles(colossus.x, colossus.y, 50, '#b04dff', 6);
  spawnRing(colossus.x, colossus.y, 70);
  camera.shake = Math.max(camera.shake, 10);
  buzz([40, 30, 50]);
}
function updateColossus(dt) {
  if (!colossus || colossus.dead) { colossus = null; return; }
  colossus.life -= dt;
  colossus.atkCd -= dt;
  if (colossus.swipeT > 0) colossus.swipeT = Math.max(0, colossus.swipeT - dt);
  if (colossus.life <= 0 || colossus.hp <= 0) {
    addFloater(colossus.x, colossus.y - 50, 'COLOSSUS FADES', '#b04dff', true);
    spawnParticles(colossus.x, colossus.y, 40, '#b04dff', 5);
    colossus = null;
    return;
  }
  let foe = null, fd2 = 420 * 420;
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.3) continue;
    const d2 = dist2(e.x, e.y, colossus.x, colossus.y);
    if (d2 < fd2) { fd2 = d2; foe = e; }
  }
  let gx = player.x + 40, gy = player.y + 40;
  if (foe) { gx = foe.x; gy = foe.y; }
  const dx = gx - colossus.x, dy = gy - colossus.y, gd = Math.hypot(dx, dy) || 1;
  const spd = 95;
  if (gd > 40) { colossus.vx = lerp(colossus.vx, dx / gd * spd, dt * 3); colossus.vy = lerp(colossus.vy, dy / gd * spd, dt * 3); }
  else { colossus.vx *= 0.85; colossus.vy *= 0.85; }
  colossus.x = clamp(colossus.x + colossus.vx * dt, colossus.r, WORLD.w - colossus.r);
  colossus.y = clamp(colossus.y + colossus.vy * dt, colossus.r, WORLD.h - colossus.r);
  collideObstacles(colossus);
  colossus.walk += dt * 2;
  if (Math.abs(colossus.vx) > 3) colossus.facing = colossus.vx >= 0 ? 1 : -1;
  if (foe && colossus.atkCd <= 0 && fd2 < (colossus.r + foe.r + 18) ** 2) {
    colossus.atkCd = 1.05;
    colossus.swipeT = UNIT_SWIPE * 1.2;
    const d = Math.sqrt(fd2) || 1;
    directDamage(foe, 28 + wave * 1.2, (foe.x - colossus.x) / d, (foe.y - colossus.y) / d, 220);
    spawnParticles(foe.x, foe.y, 10, '#b04dff', 3);
    for (const e of enemies) {
      if (e === foe || e.dead) continue;
      if (dist2(e.x, e.y, colossus.x, colossus.y) < 110 * 110)
        directDamage(e, 10, 0, 0, 80);
    }
  }
}
function hurtColossus(dmg) {
  if (!colossus || colossus.dead) return;
  colossus.hp -= dmg;
}

// adjacent barricades merge in effective size + HP (v2.9)
function refreshBarricadeLinks() {
  for (const b of barricades) {
    let n = 0;
    for (const o of barricades) {
      if (o === b) continue;
      if (dist2(b.x, b.y, o.x, o.y) <= BARRICADE_LINK_DIST * BARRICADE_LINK_DIST) n++;
    }
    b.neighbors = n;
    if (!b.baseHp) b.baseHp = b.maxHp || (BARRICADE_HP + wave * 8);
    const sizeMul = n >= 1 ? 2 : 1;                 // double radius when touching a neighbor
    const hpMul = n >= 2 ? 2.2 : n === 1 ? 1.8 : 1; // stronger when braced
    const newMax = Math.round(b.baseHp * hpMul);
    const ratio = b.maxHp > 0 ? clamp(b.hp / b.maxHp, 0, 1) : 1;
    b.r = BARRICADE_BASE_R * sizeMul;
    b.maxHp = newMax;
    b.hp = Math.max(1, Math.round(newMax * ratio));
  }
}

function brickWallJunctionType(w) {
  const L = w.links || {};
  const dirs = [L.n, L.e, L.s, L.w].filter(Boolean);
  const n = dirs.length;
  if (n >= 4) return 'cross';
  if (n === 3) return 'tee';
  if (n === 2) {
    const hasNS = !!(L.n && L.s);
    const hasEW = !!(L.e && L.w);
    if (hasNS || hasEW) return 'straight';
    return 'corner';
  }
  if (n === 1) return 'end';
  return 'post';
}
function refreshBrickWallLinks() {
  if (!BRICKWALL_ENABLED) return;
  for (const w of brickWalls) {
    w.links = { n: null, e: null, s: null, w: null };
    let n = 0;
    for (const o of brickWalls) {
      if (o === w) continue;
      const dir = brickWallCardinalDir(o.x - w.x, o.y - w.y);
      if (!dir) continue;
      // keep nearest along each cardinal
      const cur = w.links[dir];
      const d2o = dist2(w.x, w.y, o.x, o.y);
      if (!cur || dist2(w.x, w.y, cur.x, cur.y) > d2o) w.links[dir] = o;
    }
    for (const d of ['n', 'e', 's', 'w']) if (w.links[d]) n++;
    w.neighbors = n;
    if (!w.baseHp) w.baseHp = w.maxHp || (BRICKWALL_HP + wave * 10);
    // braced junctions tougher (T / corner / cross)
    const jt = brickWallJunctionType(w);
    const hpMul = jt === 'cross' ? 2.0 : jt === 'tee' ? 1.85 : jt === 'corner' ? 1.7
      : jt === 'straight' ? 1.55 : jt === 'end' ? 1.25 : 1;
    const newMax = Math.round(w.baseHp * hpMul);
    const ratio = w.maxHp > 0 ? clamp(w.hp / w.maxHp, 0, 1) : 1;
    w.r = BRICKWALL_PILLAR_R;
    w.maxHp = newMax;
    w.hp = Math.max(1, Math.round(newMax * ratio));
  }
}

// sentry turrets mounted on barricades: auto-target the nearest enemy in
// range and pepper it with tracers (ally damage — see directDamage)
function updateSentries(dt) {
  if (sentryTier > 0) {
    for (const b of barricades) {
      b.gunCd = (b.gunCd || 0) - dt;
      b.gunFlash = Math.max(0, (b.gunFlash || 0) - dt);
      let foe = null, fd2 = sentryRange() ** 2;
      for (const e of enemies) {
        if (e.dead || e.spawnT > 0.3 || e.emergeT > 0) continue;
        const d2 = dist2(e.x, e.y, b.x, b.y);
        if (d2 < fd2) { fd2 = d2; foe = e; }
      }
      if (!foe) continue;
      b.gunA = Math.atan2(foe.y - b.y, foe.x - b.x); // scrappy servo: snaps to target
      if (b.gunCd > 0) continue;
      b.gunCd = sentryInterval();
      b.gunFlash = 0.07;
      const barrels = sentryTier >= 3 ? 2 : 1;
      for (let i = 0; i < barrels; i++) {
        const a = b.gunA + (barrels === 1 ? 0 : (i - 0.5) * 0.12) + rand(-0.03, 0.03);
        sbolts.push({ x: b.x + Math.cos(a) * 14, y: b.y - 28 + Math.sin(a) * 14,
          vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, life: 0.8 });
      }
    }
  }
  for (const s of sbolts) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(s.x, s.y, o.x, o.y) < o.r * o.r)) { s.life = 0; continue; }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4) continue;
      if (dist2(s.x, s.y + 22, e.x, e.y) < (e.r + 6) ** 2) {
        let dmg = sentryDamage();
        if (sentryTier >= 4 && e.armor > 0) chipArmor(e, dmg * 0.35); // overcharge chips plates
        directDamage(e, dmg, s.vx / 760, s.vy / 760, 40);
        s.life = 0;
        spawnParticles(s.x, s.y, 3, sentryTier >= 4 ? '#9ef0ff' : '#ffb02e', 2);
        break;
      }
    }
  }
  sbolts = sbolts.filter(s => s.life > 0);
}

// enemies can't pass barricades — they smash them down instead
function collideBarricades(e, dt) {
  for (const b of barricades) {
    const d2 = dist2(e.x, e.y, b.x, b.y), minD = b.r + e.r;
    if (d2 < minD * minD && d2 > 0.01) {
      const d = Math.sqrt(d2);
      e.x = b.x + (e.x - b.x) / d * minD;
      e.y = b.y + (e.y - b.y) / d * minD;
      // linked posts + shield membrane soak smash damage
      let smash = (e.boss ? 6 : 2.2);
      if ((b.neighbors || 0) >= 1) smash *= 0.62;
      if (fenceTier >= 4) smash *= 0.55;
      b.hp -= e.dmg * dt * smash;
      if (Math.random() < dt * 8) spawnParticles(b.x + (e.x - b.x) / d * b.r, b.y + (e.y - b.y) / d * b.r, 3, (b.neighbors || 0) ? '#9ef0ff' : '#7CFC00', 2);
      // fence grid upgrades: tier 2+ drag, tier 3+ electrocute
      if (fenceTier >= 2) e.slowT = fenceTier >= 5 ? 0.45 : 0.3;
      if (fenceTier >= 3) {
        e.hp -= fenceZapDps() * dt;
        e.flash = Math.max(e.flash, 0.05);
        if (Math.random() < dt * 6) {
          zap(b.x, b.y - 24, e.x, e.y - e.r);
          spawnParticles(e.x, e.y - e.r, 2, '#9ef0ff', 3);
        }
        if (e.hp <= 0 && !e.dead) killEnemy(e);
      }
      if (b.hp <= 0) {
        spawnParticles(b.x, b.y, 26, '#7CFC00', 5);
        addFloater(b.x, b.y - 30, 'BARRICADE DOWN!', '#ff8a93', true);
        camera.shake = Math.max(camera.shake, 5);
      }
    }
  }
  const before = barricades.length;
  barricades = barricades.filter(b => b.hp > 0);
  if (barricades.length !== before) refreshBarricadeLinks();
}

function pointNearSegment(px, py, ax, ay, bx, by, thick) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 < 1) return dist2(px, py, ax, ay) < thick * thick;
  let t = ((px - ax) * abx + (py - ay) * aby) / len2;
  t = clamp(t, 0, 1);
  const qx = ax + abx * t, qy = ay + aby * t;
  return dist2(px, py, qx, qy) < thick * thick;
}
function collideBrickWalls(e, dt) {
  if (!BRICKWALL_ENABLED || !brickWalls.length) return;
  for (const w of brickWalls) {
    const d2 = dist2(e.x, e.y, w.x, w.y), minD = w.r + e.r;
    if (d2 < minD * minD && d2 > 0.01) {
      const d = Math.sqrt(d2);
      e.x = w.x + (e.x - w.x) / d * minD;
      e.y = w.y + (e.y - w.y) / d * minD;
      let smash = (e.boss ? 4.5 : 1.6); // tougher brick soak
      const jt = brickWallJunctionType(w);
      if (jt === 'tee' || jt === 'cross') smash *= 0.55;
      else if (jt === 'corner' || jt === 'straight') smash *= 0.65;
      w.hp -= e.dmg * dt * smash;
      if (Math.random() < dt * 7) spawnParticles(w.x + (e.x - w.x) / d * w.r, w.y + (e.y - w.y) / d * w.r, 2, '#c8a06a', 2);
      if (w.hp <= 0) {
        spawnParticles(w.x, w.y, 22, '#a87850', 5);
        addFloater(w.x, w.y - 30, 'CLOISTER DOWN!', '#ff8a93', true);
        camera.shake = Math.max(camera.shake, 4);
      }
    }
    // segment collision along cardinal links (draw once per undirected edge via x/y order)
    const L = w.links || {};
    for (const [dir, o] of [['e', L.e], ['s', L.s]]) {
      if (!o) continue;
      if (!pointNearSegment(e.x, e.y, w.x, w.y, o.x, o.y, BRICKWALL_SEG_THICK + e.r)) continue;
      // push off the segment midline
      const abx = o.x - w.x, aby = o.y - w.y;
      const len = Math.hypot(abx, aby) || 1;
      const nx = -aby / len, ny = abx / len;
      const side = ((e.x - w.x) * nx + (e.y - w.y) * ny) >= 0 ? 1 : -1;
      e.x += nx * side * 2.5;
      e.y += ny * side * 2.5;
      let smash = (e.boss ? 4.2 : 1.5);
      w.hp -= e.dmg * dt * smash * 0.5;
      o.hp -= e.dmg * dt * smash * 0.5;
      if (Math.random() < dt * 5) spawnParticles(e.x, e.y, 2, '#b89068', 2);
    }
  }
  const before = brickWalls.length;
  brickWalls = brickWalls.filter(w => w.hp > 0);
  if (brickWalls.length !== before) refreshBrickWallLinks();
}

function tryTransform() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
  if (player.form) { player.form = 0; return; }
  if (player.ki < maxKi() * 0.92) { addFloater(player.x, player.y - 40, 'AETHER NOT FULL', '#4de1ff', false); return; }
  player.form = sk('a4') ? 2 : 1;
  banner(player.form === 2 ? 'STORM ASCENDANT' : 'ASCENSION', 'aether unleashed');
  spawnParticles(player.x, player.y, 60, '#ffd54a', 6);
  camera.shake = 16;
}

function tryDash(fromButton) {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
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
function emberBurst(x, y) { spawnParticles(x, y, 8, '#ff9d2e', 3); spawnParticles(x, y, 4, '#ffd54a', 2); }
function addFloater(x, y, text, color, big) { floaters.push({ x, y, text, color, life: 1.1, big }); }
function zap(x1, y1, x2, y2) { zaps.push({ x1, y1, x2, y2, life: 0.12 }); }
// Gharok stomp juice — gated by GHAROK_STOMP_JUICE; buzz respects settings.vibro.
function warlordStomp(e, heavy) {
  if (!GHAROK_STOMP_JUICE) return;
  playStomp();
  buzz(heavy ? [35, 40, 45] : 28);
  if (settings.shake) camera.shake = Math.max(camera.shake, heavy ? 5.5 : 2.4);
  const side = (e._stompSide = -(e._stompSide || 1));
  spawnParticles(e.x + side * (e.r * 0.35), e.y + 4, heavy ? 8 : 4, '#8a7a58', heavy ? 2.4 : 1.6);
  spawnParticles(e.x + side * (e.r * 0.28), e.y + 2, heavy ? 4 : 2, '#6b5a40', heavy ? 1.8 : 1.2);
}
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
  updateReviveChannel(dt);

  // ---- movement ----
  let dx = 0, dy = 0;
  if (!player.downed) {
    dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touch.joy.x;
    dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + touch.joy.y;
    if (keys.ShiftLeft || keys.ShiftRight) tryDash();
  }
  const m = Math.hypot(dx, dy);
  if (player.downed) {
    player.vx *= 0.7; player.vy *= 0.7;
    player.moving = false;
    player.form = 0;
  } else if (player.dashT > 0) {
    player.dashT -= dt;
  } else if (m > 0.08) {
    const cap = Math.min(1, m);
    player.vx = dx / m * moveSpeed() * cap;
    player.vy = dy / m * moveSpeed() * cap;
  } else { player.vx *= 0.8; player.vy *= 0.8; }
  player.moving = !player.downed && Math.hypot(player.vx, player.vy) > 30;
  if (player.moving) player.walk += dt * 11;
  player.x = clamp(player.x + player.vx * dt, player.r, WORLD.w - player.r);
  player.y = clamp(player.y + player.vy * dt, player.r, WORLD.h - player.r);
  collideObstacles(player);
  updateRiftNet(dt);

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
  if (!player.downed && dist2(player.x, player.y, CAMP.x, CAMP.y) < 150 * 150)
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
  if (!player.downed) fireWeapons(dt);
  const wantCharge = !player.downed && (mouse.rdown || touch.beamHeld);
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
  updateFusion(dt);
  updateGraves(dt);
  const warden = companions.find(c => c.type === 'warden' && !c.downed);
  for (const e of enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    if (e.invulnT > 0) e.invulnT -= dt;
    // sticker needle cluster fuse
    if (e.needleT > 0) {
      e.needleT -= dt;
      if (e.needleT <= 0) needleBurst(e);
      if (e.dead) continue;
    }
    if (e.emergeT > 0) { // skeleton clawing out of the ground
      e.emergeT -= dt;
      if (Math.random() < dt * 24) spawnParticles(e.x + rand(-8, 8), e.y, 1, '#6b5636', 2);
      continue;
    }
    if (e.spawnT > 0) {
      e.spawnT -= dt;
      if (e.spawnT <= 0 && !e._barkedAggro) {
        e._barkedAggro = true;
        tryEnemyBark(e, 'aggro');
      }
      continue;
    }
    if (!e._barkedAggro) { // graves / fusion may skip spawnT path
      e._barkedAggro = true;
      tryEnemyBark(e, 'aggro');
    }
    // occasional combat bark while engaged
    e._barkCombatCd = (e._barkCombatCd || rand(3.5, 6.5)) - dt;
    if (e._barkCombatCd <= 0) {
      e._barkCombatCd = rand(4.5, 7.5);
      tryEnemyBark(e, 'combat');
    }
    // taunt: a standing Warden pulls nearby non-boss enemies onto itself
    let tgt = player;
    if (warden && !e.boss && dist2(e.x, e.y, warden.x, warden.y) < tauntRadius() ** 2) tgt = warden;
    e._tgt = tgt; // exposed for the test harness
    const ex = tgt.x - e.x, ey = tgt.y - e.y;
    const d = Math.hypot(ex, ey) || 1;
    const wantD = e.ranged && !e.boss ? 260 : 0;
    const dir = d > wantD ? 1 : -0.6;
    let spdMul = 1;
    if (e.slowT > 0) { e.slowT -= dt; spdMul = FENCE_SLOW; } // fence tier 2+ drag
    // boss claw slash (v2.8): telegraphed wind-up, then a slash that sends
    // the player flying with bonus damage — dodgeable during the wind-up
    if (e.boss) {
      e.clawCd = (e.clawCd === undefined ? 2.5 : e.clawCd) - dt;
      if (e.clawStrike > 0) e.clawStrike = Math.max(0, e.clawStrike - dt);
      if (e.clawWind > 0) {
        e.clawWind -= dt;
        e.vx *= 0.8; e.vy *= 0.8; // plants its feet for the swing
        if (Math.random() < dt * 26) spawnParticles(e.x + e.facing * 44, e.y - 96, 1, '#ff6a4d', 3);
        if (e.clawWind <= 0) {
          e.clawStrike = CLAW_STRIKE; // follow-through pose after the hit
          camera.shake = Math.max(camera.shake, 10);
          spawnRing(e.x, e.y - 20, CLAW_RANGE);
          spawnParticles(e.x, e.y - 40, 18, '#ff6a4d', 5);
          warlordStomp(e, true);
          sfx.play('cleaver');
          buzz(60);
          const pdx = player.x - e.x, pdy = player.y - e.y;
          const pd = Math.hypot(pdx, pdy) || 1;
          if (pd < CLAW_RANGE + player.r) {
            hurtPlayer(e.dmg * CLAW_DMG_MUL);
            player.vx = pdx / pd * CLAW_KB;
            player.vy = pdy / pd * CLAW_KB;
            player.dashT = Math.max(player.dashT, 0.26); // sent flying
            addFloater(player.x, player.y - 44, 'CLEAVER SLAM!', '#ff4d5e', true);
          }
          e.clawCd = CLAW_CD;
        }
      } else if (e.clawCd <= 0 && dist2(e.x, e.y, player.x, player.y) < (CLAW_RANGE * 0.9) ** 2) {
        e.clawWind = CLAW_WINDUP;
        addFloater(e.x, e.y - e.r * 2.4, '⚠ CLEAVER WIND-UP', '#ff8a93', true);
        tryEnemyBark(e, 'attack');
        buzz(20);
      }
    }
    if (e.swipeT > 0) e.swipeT = Math.max(0, e.swipeT - dt);
    e.vx = lerp(e.vx, ex / d * e.spd * spdMul * dir, dt * 4);
    e.vy = lerp(e.vy, ey / d * e.spd * spdMul * dir, dt * 4);
    // warlord mass drag — knockback bleeds off fast so rifle ticks don't skate him
    if (e.boss) { e.vx *= Math.pow(0.08, dt); e.vy *= Math.pow(0.08, dt); }
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
    collideBrickWalls(e, dt);
    collideStructures(e, dt);
    e.walk += dt * (Math.hypot(e.vx, e.vy) * 0.085); // clearer gait cadence (visual only)
    e.facing = e.vx >= 0 ? 1 : -1;
    // Gharok footfalls — stomp on each plant while lumbering
    if (e.boss) {
      const foot = Math.sin(e.walk);
      if (e._lastFoot === undefined) e._lastFoot = foot;
      const moving = Math.hypot(e.vx, e.vy) > 14;
      if (moving && ((e._lastFoot > 0.2 && foot <= 0.2) || (e._lastFoot < -0.2 && foot >= -0.2))) {
        warlordStomp(e, false);
      }
      e._lastFoot = foot;
    }
    // melee swipes hit whatever is in reach: the player or a companion
    const pd2c = dist2(e.x, e.y, player.x, player.y);
    if (pd2c < (e.r + player.r + 6) ** 2 && player.hurtT <= 0) {
      if (!e.boss) {
        const wasSwipe = (e.swipeT || 0) <= 0;
        e.swipeT = UNIT_SWIPE;
        if (wasSwipe) tryEnemyBark(e, 'attack');
      }
      hurtPlayer(e.dmg);
      if (e.kbPlayer) { // bulwark slam shoves the player back
        const pd = Math.sqrt(pd2c) || 1;
        player.vx += (player.x - e.x) / pd * e.kbPlayer;
        player.vy += (player.y - e.y) / pd * e.kbPlayer;
        player.dashT = Math.max(player.dashT, 0.12); // let the shove play out
      }
    }
    for (const c of companions) {
      if (c.downed) continue;
      // non-Warden companions take less melee splash; Warden still tanks
      const mul = c.type === 'warden' ? 0.55 : 0.38;
      if (dist2(e.x, e.y, c.x, c.y) < (e.r + c.r + 4) ** 2) {
        if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.85);
        hurtCompanion(c, e.dmg * mul);
      }
    }
    for (const m of militia) {
      if (m.downed) continue;
      if (dist2(e.x, e.y, m.x, m.y) < (e.r + m.r + 4) ** 2) {
        if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.85);
        hurtMilitia(m, e.dmg * 0.4);
      }
    }
    if (colossus && !colossus.dead && dist2(e.x, e.y, colossus.x, colossus.y) < (e.r + colossus.r + 6) ** 2) {
      if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.7);
      hurtColossus(e.dmg * 0.45);
    }
    if (e.ranged) {
      e.atkCd -= dt;
      if (e.atkCd <= 0 && d < 540) {
        // wave-7+ escalation: casters swap between slow fireballs and rapid
        // low-damage rift bolts mid-wave
        if (!e.boss && wave >= ESC_WAVE && Math.random() < 0.35) e.boltMode = !e.boltMode;
        const rapid = !!e.boltMode && !e.boss;
        e.atkCd = e.boss ? 1.1 : rapid ? rand(1.0, 1.6) : rand(1.6, 2.6);
        if (!e.boss) e.swipeT = UNIT_SWIPE; // staff cast pose
        tryEnemyBark(e, 'attack');
        const a = Math.atan2(ey, ex) + rand(-0.05, 0.05);
        const n = e.boss ? 3 : 1;
        if (!rapid) playWhoosh();
        for (let i = 0; i < n; i++) {
          const aa = a + (i - (n - 1) / 2) * 0.22;
          const spd = rapid ? 520 : 300;
          ebolts.push({ x: e.x, y: e.y - e.r, vx: Math.cos(aa) * spd, vy: Math.sin(aa) * spd,
            life: rapid ? 1.5 : 2.4, r: rapid ? 4 : 6, dmg: e.dmg * (rapid ? 0.4 : 0.8), fire: !rapid });
        }
      }
      if (e.boss && Math.random() < dt * 0.25) spawnEnemy('sprinter');
    }
  }
  enemies = enemies.filter(e => !e.dead);
  updateCompanions(dt);
  updateMilitia(dt);
  updateSentries(dt);
  updateLaborers(dt);
  updateStructures(dt);
  updateColossus(dt);

  // ---- projectiles ----
  for (const b of bolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacles.some(o => o.type !== 'tree' && dist2(b.x, b.y, o.x, o.y) < o.r * o.r)) {
      b.life = 0; spawnParticles(b.x, b.y, 4, '#4de1ff', 2); continue;
    }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4) continue;
      if (dist2(b.x, b.y + 14, e.x, e.y) < (e.r + b.r + 6) ** 2) {
        const dmg = b.dmg !== undefined ? b.dmg : rifleDamage();
        if (b.wpn === 'gusher') {
          gusherSplash(b, e); // splash handles damage + pack knockback
        } else if (b.wpn === 'sticker') {
          dealDamage(e, dmg, 'rifle', b.vx / 980, b.vy / 980, b.kb);
          if (!e.dead) embedNeedle(e, Math.atan2(b.vy, b.vx));
        } else {
          dealDamage(e, dmg, 'rifle', b.vx / 900, b.vy / 900, b.kb || 90);
        }
        b.life = 0;
        spawnParticles(b.x, b.y, 5, b.wpn === 'gusher' ? '#3ef0c8' : b.wpn === 'sticker' ? '#ff6bd8' : '#4de1ff', 2);
        break;
      }
    }
  }
  bolts = bolts.filter(b => b.life > 0);

  for (const b of ebolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.fire && Math.random() < dt * 46) { // flickering flame trail
      particles.push({ x: b.x + rand(-3, 3), y: b.y + rand(-3, 3), vx: rand(-16, 16), vy: rand(-34, -6),
        life: rand(0.12, 0.32), maxLife: 0.32, color: Math.random() < 0.5 ? '#ff9d2e' : '#ff5a1f', r: rand(1.5, 3) });
    }
    if (obstacles.some(o => o.type !== 'tree' && dist2(b.x, b.y, o.x, o.y) < o.r * o.r)) {
      b.life = 0; if (b.fire) emberBurst(b.x, b.y); continue;
    }
    const wall = barricades.find(w => dist2(b.x, b.y, w.x, w.y) < w.r * w.r);
    if (wall) { wall.hp -= b.dmg * 0.6; b.life = 0; spawnParticles(b.x, b.y, 4, '#7CFC00', 2); if (b.fire) emberBurst(b.x, b.y); continue; }
    // only the Warden body-blocks enemy fire (Rover/Scout no longer eat every bolt)
    const ch = companions.find(c => !c.downed && c.type === 'warden' && dist2(b.x, b.y, c.x, c.y - 10) < (c.r + b.r + 4) ** 2);
    if (ch) {
      b.life = 0;
      if (b.fire) emberBurst(b.x, b.y);
      hurtCompanion(ch, b.dmg);
      continue;
    }
    if (dist2(b.x, b.y, player.x, player.y - 12) < (player.r + b.r + 4) ** 2) {
      b.life = 0;
      if (b.fire) emberBurst(b.x, b.y);
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
    if (p.fetched || d2 < mag * mag) { // Rover-fetched cores fly home from anywhere
      const d = Math.sqrt(d2) || 1;
      const spd = p.fetched ? 640 : 380;
      p.x += (player.x - p.x) / d * spd * dt;
      p.y += (player.y - p.y) / d * spd * dt;
    }
    if (d2 < (player.r + 14) ** 2) {
      p.got = true;
      if (p.type === 'core') { cores++; totalCores++; addFloater(p.x, p.y, '+1 ⬡', '#4de1ff', false); questEvent('core'); }
      else if (p.type === 'pack') { // Scout's med/energy supply pack
        const heal = 20 * (1 + 0.5 * sk('cs1'));
        player.hp = Math.min(maxHp(), player.hp + heal);
        player.ki = clamp(player.ki + heal, 0, maxKi());
        addFloater(p.x, p.y, `+${Math.round(heal)} HP & AETHER`, '#7CFC00', false);
      }
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
  // camera peek: fixed downward shift of the camera center (0/5/10% of VH)
  camera.y = clamp(player.y - VH / 2 + VH * camViewPct(), 0, Math.max(0, WORLD.h - VH));

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

  // talk / revive button visibility
  const npcNear = nearestNpc();
  const downComp = nearestDownedCompanion();
  const downMil = nearestDownedMilitia();
  const downLab = nearestDownedLaborer();
  const downAlly = nearestDownedAlly();
  const talkBtn = $('btnTalk');
  const showTalk = state === 'playing' && !dialogOpen && !vendorOpen && !infirmaryOpen && !riftNetOpen &&
    (npcNear || downComp || downMil || downLab || downAlly || player.downed);
  talkBtn.classList.toggle('hidden', !showTalk);
  if (player.downed) talkBtn.textContent = '✚ PING';
  else if (downAlly || downComp || downMil || downLab) talkBtn.textContent = '✚ HOLD REVIVE';
  else if (npcNear) talkBtn.textContent = npcNear.role === 'vendor' ? '🜚 TRADE' : '💬 TALK';
  // when downed, tap Talk = revive ping
  if (player.downed && talkHeld && !reviveChan.kind) {
    talkHeld = false;
    riftNetRequestRevive();
  }

  // one-tap Aether Mend button (v2.9.3) — shows when wounded
  const mendBtn = $('btnMend');
  if (mendBtn) {
    const showMend = state === 'playing' && !dialogOpen && !vendorOpen && !infirmaryOpen && !riftNetOpen &&
      !player.downed && player.hp < maxHp() && !buildPickOpen && !structPanelOpen;
    mendBtn.classList.toggle('hidden', !showMend);
    if (showMend) {
      const cost = aetherHealCost();
      const ok = player.ki >= cost;
      mendBtn.textContent = ok ? `✧ MEND ${cost}◈` : `✧ NEED ${cost}◈`;
      mendBtn.classList.toggle('need', !ok);
    }
  }
  // Aether Colossus combiner (v2.10)
  const coloBtn = $('btnColossus');
  if (coloBtn) {
    const showColo = state === 'playing' && !dialogOpen && !vendorOpen && !infirmaryOpen && !riftNetOpen &&
      !player.downed && !buildPickOpen && !structPanelOpen;
    coloBtn.classList.toggle('hidden', !showColo);
    if (showColo) {
      const active = colossus && !colossus.dead;
      coloBtn.textContent = active ? `⚔ TITAN ${Math.ceil(colossus.life)}s` : '⚔ COLOSSUS (C)';
    }
  }

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
  if (player.downed) return;
  player.hp -= dmg * (1 - armorReduce());
  player.hurtT = 0.45;
  camera.shake = 9;
  sfx.play('hurt');
  buzz(dmg >= 25 ? 60 : 30); // heavy hits (boss slams) rumble harder
  spawnParticles(player.x, player.y - 14, 10, '#ff4d5e', 3);
  if (player.hp <= 0) {
    player.hp = 0;
    if (riftNetLinked()) {
      player.downed = true;
      player.downedT = 0;
      player.form = 0;
      player.vx = player.vy = 0;
      beam = null; charging = false; beamCharge = 0;
      banner('DOWNED', 'Ally: hold Talk near you · or PING REVIVE');
      addFloater(player.x, player.y - 40, '✚ DOWN — AWAIT REVIVE', '#ff8a93', true);
      try { if (riftNet.conn) riftNet.conn.send({ t: 'reviveReq' }); } catch (e) {}
      buzz([50, 40, 80]);
    } else {
      gameOver();
    }
  }
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
  // ---- SQUAD column (v2.8): companion mini-trees, unlocked by ownership ----
  const sq = document.createElement('div');
  sq.className = 'treecol squad';
  sq.innerHTML = '<h3>SQUAD</h3>';
  for (const k of Object.keys(COMP_NODES)) {
    const ownedC = !!squad.owned[k];
    COMP_NODES[k].forEach((n, i) => {
      const rank = sk(n.id);
      const prevOk = ownedC && (i === 0 || sk(COMP_NODES[k][i - 1].id) >= 1);
      const maxed = rank >= n.max;
      const canBuy = prevOk && !maxed && player.sp > 0;
      const node = document.createElement('div');
      node.className = 'skillnode' + (canBuy ? ' avail' : '') + (maxed ? ' maxed' : '') + (!prevOk ? ' locked' : '');
      node.innerHTML = `<h5>${COMP_TYPES[k].name}: ${n.name}<span>${maxed ? 'MAX' : rank + '/' + n.max}</span></h5>
        <small>${n.desc}${!ownedC ? ' — recruit ' + COMP_TYPES[k].name + ' at the field lab first' : (!prevOk ? ' — requires previous skill' : '')}</small>`;
      if (canBuy) node.onclick = () => {
        player.sp--;
        skillRanks[n.id] = rank + 1;
        spawnParticles(player.x, player.y, 20, '#4de1ff', 4);
        renderTree();
      };
      sq.appendChild(node);
    });
  }
  cols.appendChild(sq);
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
  if ($('shopAether')) $('shopAether').textContent = Math.floor(player.ki);
  const grid = $('shopGrid');
  grid.innerHTML = '';
  // v2.9 aether recovery first — spend current aether, nothing persisted weirdly
  appendAetherShopItems(grid, $('shopAether') || $('shopCores'));
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
  // perimeter fence grid — 5 tiers toward shield/fortress (v2.9)
  const fMax = fenceTier >= FENCE_MAX_TIER;
  const fDesc = fenceTier === 1 ? 'Tier 2: reinforced posts — enemies grinding on a fence are slowed 45%'
    : fenceTier === 2 ? 'Tier 3: electrified — fences also zap enemies in contact'
    : fenceTier === 3 ? 'Tier 4: shield membrane — fences take far less smash damage'
    : fenceTier === 4 ? 'Tier 5: fortress pulse — stronger zap + longer slow'
    : 'Fortress grid: slow, zap, and shield membrane on every post';
  const fDiv = document.createElement('div');
  fDiv.className = 'shopitem' + (fMax ? ' maxed' : '');
  fDiv.innerHTML = `<h4>Fence Grid Uplink<span class="lvl">${fMax ? 'MAX' : 'Tier ' + fenceTier + '/' + FENCE_MAX_TIER}</span></h4>
    <small>${fDesc}</small>
    <div class="price">${fMax ? '—' : '⬡ ' + FENCE_COSTS[fenceTier - 1]}</div>`;
  if (!fMax) fDiv.onclick = () => buyFence();
  grid.appendChild(fDiv);
  // sentry uplink — 4 tiers
  const sMax = sentryTier >= SENTRY_MAX_TIER;
  const sDesc = sentryTier === 0 ? 'Tier 1: mount an auto-targeting sentry gun on every barricade you build'
    : sentryTier === 1 ? 'Tier 2: +fire rate, +range, targeting antenna'
    : sentryTier === 2 ? 'Tier 3: dual barrels — every volley fires two bolts'
    : sentryTier === 3 ? 'Tier 4: overcharged bolts — +damage and chips armor plates'
    : 'Overcharged dual-barrel long-range sentries on every fence post';
  const sDiv = document.createElement('div');
  sDiv.className = 'shopitem' + (sMax ? ' maxed' : '');
  sDiv.innerHTML = `<h4>Sentry Uplink<span class="lvl">${sMax ? 'MAX' : 'Tier ' + sentryTier + '/' + SENTRY_MAX_TIER}</span></h4>
    <small>${sDesc}</small>
    <div class="price">${sMax ? '—' : '⬡ ' + SENTRY_COSTS[sentryTier]}</div>`;
  if (!sMax) sDiv.onclick = () => buySentry();
  grid.appendChild(sDiv);
  // ---- weapon loadout (v2.8): tap to cycle owned weapons per hand ----
  for (const slot of ['primary', 'secondary']) {
    const cur = loadout[slot];
    const div = document.createElement('div');
    div.className = 'shopitem';
    div.innerHTML = `<h4>${slot === 'primary' ? '⌖ Primary Weapon' : '⌖ Twin Weapon'}<span class="lvl">tap to cycle</span></h4>
      <small>${slot === 'primary' ? 'Your main trigger weapon' : 'Fires alongside the primary while Ascended (dual-wield)'}</small>
      <div class="price">${cur ? WEAPON_NAMES[cur] : '— none —'}</div>`;
    div.onclick = () => { cycleLoadout(slot); renderShop(); };
    grid.appendChild(div);
  }
  // ---- squad (v2.8): buy companions, tap owned ones to bench/deploy ----
  for (const k of Object.keys(COMP_TYPES)) {
    const t = COMP_TYPES[k];
    const owned = !!squad.owned[k];
    const div = document.createElement('div');
    div.className = 'shopitem';
    if (!owned) {
      div.innerHTML = `<h4>☍ ${t.name}<span class="lvl">SQUAD</span></h4>
        <small>${t.desc}</small><div class="price">⬡ ${t.cost}</div>`;
      div.onclick = () => {
        if (!buyCompanion(k)) { flashNeed($('shopCores')); return; }
        renderShop();
      };
    } else {
      const on = !!squad.active[k];
      div.innerHTML = `<h4>☍ ${t.name}<span class="lvl" style="color:${on ? 'var(--green)' : '#8fa3bd'}">${on ? 'DEPLOYED' : 'BENCHED'}</span></h4>
        <small>${t.desc}</small><div class="price">tap to ${on ? 'bench' : 'deploy'}</div>`;
      div.onclick = () => { squad.active[k] = !squad.active[k]; syncCompanions(); renderShop(); };
    }
    grid.appendChild(div);
  }
}
function buySentry() {
  if (sentryTier >= SENTRY_MAX_TIER) return;
  const cost = SENTRY_COSTS[sentryTier];
  if (cores < cost) { $('shopCores').style.color = '#ff4d5e'; setTimeout(() => $('shopCores').style.color = '', 300); return; }
  cores -= cost;
  sentryTier++;
  renderShop();
}
function buyFence() {
  if (fenceTier >= FENCE_MAX_TIER) return;
  const cost = FENCE_COSTS[fenceTier - 1];
  if (cores < cost) { $('shopCores').style.color = '#ff4d5e'; setTimeout(() => $('shopCores').style.color = '', 300); return; }
  cores -= cost;
  fenceTier++;
  renderShop();
}
function buyGear(u) {
  if (u.lvl >= u.max) return;
  const cost = gearCost(u);
  if (cores < cost) { $('shopCores').style.color = '#ff4d5e'; setTimeout(() => $('shopCores').style.color = '', 300); return; }
  cores -= cost; u.lvl++;
  if (u.id === 'hp') player.hp = maxHp();
  if (u.id === 'gren') player.grenades = maxGrenades();
  // a freshly bought gun slots straight into the empty off-hand
  if (u.weapon && !loadout.secondary && u.id !== loadout.primary) loadout.secondary = u.id;
  renderShop();
}
$('openTreeLink').onclick = e => { e.preventDefault(); toggleTree(); };

// ===================== GAME OVER / VICTORY ========================
function statsHtml() {
  const mins = Math.floor(runTime / 60), secs = Math.round(runTime % 60);
  return `Waves survived: <b>${wave}</b> · Kills: <b>${kills}</b> · Cores gathered: <b>${totalCores}</b><br>
    Level <b>${player.level}</b> · Quests completed: <b>${questIdx}</b>/${QUESTS.length} · Time in the rift: <b>${mins}m ${secs}s</b>`;
}
// ---------- death checkpoints (v2.8) ----------
// Dying no longer wipes the run. The last end-of-wave auto-save doubles as a
// checkpoint: RESPAWN reloads it through the exact same loadGame() path the
// CONTINUE button uses (same snapshot format — cannot corrupt saves), then
// docks a slice of carried cores so death still stings. GIVE UP deletes the
// save for a true fresh start.
const DEATH_CORE_PENALTY = 0.15; // fraction of carried cores lost on respawn
function gameOver() {
  state = 'over';
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('btnTalk').classList.add('hidden');
  if ($('btnMend')) $('btnMend').classList.add('hidden');
  $('goTitle').textContent = 'YOU HAVE FALLEN';
  $('goSub').textContent = 'Emberfall burns behind you…';
  $('goStats').innerHTML = statsHtml();
  const canCp = hasSave();
  const rb = $('respawnBtn');
  rb.classList.toggle('hidden', !canCp);
  if (canCp) {
    rb.textContent = `⟲ RESPAWN AT CHECKPOINT (−${Math.round(DEATH_CORE_PENALTY * 100)}% ⬡)`;
    rb.onclick = () => {
      $('gameover').classList.add('hidden');
      if (!loadGame()) { newGame(); return; } // corrupt/missing save → fresh run
      const lost = Math.floor(cores * DEATH_CORE_PENALTY);
      cores -= lost;
      if (lost) addFloater(player.x, player.y - 60, `−${lost} ⬡ death toll`, '#ff8a93', true);
      saveGame(false); // persist the toll so re-dying can't refund it
    };
  }
  $('retryBtn').textContent = canCp ? '☠ GIVE UP — RESTART RUN' : 'RE-ENTER THE RIFT';
  $('retryBtn').onclick = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    $('gameover').classList.add('hidden');
    newGame();
  };
  $('gameover').classList.remove('hidden');
}
function showVictory() {
  state = 'over';
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('respawnBtn').classList.add('hidden');
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
  $('ascendHint').textContent = player.form ? (player.form === 2 ? '⚡ STORM' : '★ ASCENDED') :
    player.ki >= maxKi() * 0.92 ? '— ASCEND READY (F)!' : '';
  $('waveNum').textContent = wave;
  $('coreNum').textContent = cores;
  if ($('woodNum')) $('woodNum').textContent = wood;
  if ($('goldNum')) $('goldNum').textContent = gold;
  if ($('workerNum')) $('workerNum').textContent = laborers.length + '/' + laborerCap();
  if ($('squadNum')) $('squadNum').textContent = (companions.length + militia.length) + (waveTrainLeft ? ` (+${waveTrainLeft})` : '');
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
    (structures.length ? `  ·  🏛 ${structures.length}` : '') +
    (laborers.length ? `  ·  🪓 ${laborers.length}/${laborerCap()}` : '') +
    (militia.length ? `  ·  ⚔ ${militia.length}` : '') +
    (waveTrainLeft > 0 && waveActive ? `  ·  train ${waveTrainLeft}` : '') +
    (colossus && !colossus.dead ? `  ·  ⚔ TITAN ${Math.ceil(colossus.life)}s` : '') +
    (loadout.secondary ? `  ·  ⌖ ${WEAPON_NAMES[loadout.primary]} + ${WEAPON_NAMES[loadout.secondary]}` : '') +
    (cds.length ? '  ·  ' + cds.join(' · ') : '');
  for (const c of CATS) {
    const r = resistance(c);
    $('ad_' + c).style.width = (r / 0.6 * 100) + '%';
    $('adv_' + c).textContent = Math.round(r * 100) + '%';
  }
  drawMinimap();
}

// Compact world radar — sits in the HUD cluster with HP/aether (v2.9.1)
const MINIMAP_ZONE = { grass: '#1a2a1c', stone: '#2a3038', ash: '#2a221c', marsh: '#152826' };
function drawMinimap() {
  const c = $('minimap');
  if (!c || (state !== 'playing' && state !== 'shop')) return;
  const s = mapSizePx();
  if (c.width !== s) { c.width = s; c.height = s; }
  const g = c.getContext('2d');
  const pad = 2;
  const inner = s - pad * 2;
  const sx = inner / WORLD.w, sy = inner / WORLD.h;
  const toX = x => pad + x * sx;
  const toY = y => pad + y * sy;
  g.clearRect(0, 0, s, s);
  g.fillStyle = '#0a1018';
  g.fillRect(0, 0, s, s);
  // zone blocks (coarse — cheap)
  g.fillStyle = MINIMAP_ZONE.grass;
  g.fillRect(pad, pad, inner, inner);
  g.fillStyle = MINIMAP_ZONE.stone;
  g.fillRect(toX(FORT.x), toY(FORT.y), FORT.w * sx, FORT.h * sy);
  g.fillStyle = MINIMAP_ZONE.ash;
  g.fillRect(toX(ASH.x), toY(ASH.y), ASH.w * sx, ASH.h * sy);
  g.fillStyle = MINIMAP_ZONE.marsh;
  g.fillRect(toX(MARSH.x), toY(MARSH.y), MARSH.w * sx, MARSH.h * sy);
  // camp disc
  g.fillStyle = 'rgba(77,225,255,0.18)';
  g.beginPath(); g.arc(toX(CAMP.x), toY(CAMP.y), 300 * sx, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(77,225,255,0.45)'; g.lineWidth = 1;
  g.beginPath(); g.arc(toX(CAMP.x), toY(CAMP.y), 300 * sx, 0, TAU); g.stroke();
  // barricades
  g.fillStyle = '#7CFC00';
  for (const b of barricades) {
    g.fillRect(toX(b.x) - 1, toY(b.y) - 1, 2, 2);
  }
  // cloister / brick walls
  g.fillStyle = '#c07040';
  for (const w of brickWalls) {
    g.fillRect(toX(w.x) - 1, toY(w.y) - 1, 2, 2);
  }
  g.fillStyle = '#c8a06a';
  for (const s of structures) {
    g.fillRect(toX(s.x) - 1.5, toY(s.y) - 1.5, 3, 3);
  }
  g.fillStyle = 'rgba(90,140,70,0.55)';
  for (const fs of forestStands) {
    g.beginPath(); g.arc(toX(fs.x), toY(fs.y), Math.max(2, fs.r * sx * 0.35), 0, TAU); g.fill();
  }
  g.fillStyle = '#ffd54a';
  for (const v of (goldMines.length ? goldMines : goldVeins)) {
    if (v.goldLeft > 0) g.fillRect(toX(v.x) - 1.5, toY(v.y) - 1.5, 3, 3);
  }
  g.fillStyle = '#9ef0ff';
  for (const m of militia) {
    if (!m.downed) g.fillRect(toX(m.x) - 1, toY(m.y) - 1, 2, 2);
  }
  if (colossus && !colossus.dead) {
    g.fillStyle = '#b04dff';
    g.beginPath(); g.arc(toX(colossus.x), toY(colossus.y), 3, 0, TAU); g.fill();
  }
  // NPCs
  g.fillStyle = '#ffd54a';
  for (const n of NPCS) {
    g.beginPath(); g.arc(toX(n.x), toY(n.y), 1.6, 0, TAU); g.fill();
  }
  // enemies
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.5) continue;
    g.fillStyle = e.boss ? '#ff2d55' : '#ff8a93';
    const r = e.boss ? 2.4 : 1.3;
    g.beginPath(); g.arc(toX(e.x), toY(e.y), r, 0, TAU); g.fill();
  }
  // camera viewport
  g.strokeStyle = 'rgba(223,233,245,0.35)'; g.lineWidth = 1;
  g.strokeRect(toX(camera.x), toY(camera.y), VW * sx, VH * sy);
  // player (facing wedge)
  const px = toX(player.x), py = toY(player.y);
  g.save();
  g.translate(px, py);
  g.rotate(player.aim);
  g.fillStyle = '#4de1ff';
  g.beginPath();
  g.moveTo(4.5, 0); g.lineTo(-2.5, 2.8); g.lineTo(-2.5, -2.8);
  g.closePath(); g.fill();
  g.restore();
  // border
  g.strokeStyle = 'rgba(77,225,255,0.4)'; g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, s - 1, s - 1);
}

// ================== HUMANOID SPRITE RENDERER ======================
// Draws a standing figure at (x, y = feet). All characters (hero,
// zombies, orks, shamans, NPC) share this rig with different configs.
function drawFigure(x, y, o) {
  const s = o.s || 1;
  const H = 36 * s;                      // total height — SIZE LOCK (do not change)
  const t = o.walk || 0;
  const isMoving = o.moving === false ? false : !!o.moving;
  // Walk: opposite-phase limbs + plant squash. Idle: soft breath bob.
  const swing = isMoving ? Math.sin(t) * 0.62 : Math.sin(t * 0.55) * 0.08;
  const bob = isMoving ? Math.abs(Math.sin(t)) * 2.2 * s : Math.abs(Math.sin(t * 0.55)) * 0.55 * s;
  const plant = isMoving ? Math.max(0, Math.cos(t * 2)) : 0; // peaks on footfalls
  const hunch = o.hunch || 0;
  const lean = hunch * 7 * s;            // forward lean offset
  // Attack phases from swipe countdown (UNIT_SWIPE): first half windup, second strike
  const swipe = o.swipe || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurtLean = (o.flash > 0 || o.hurtRecoil) ? -0.12 : 0;
  const atkLean = windPose * -0.08 + strikePose * 0.14;
  ctx.save();
  ctx.translate(x, y);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;

  // shadow — SIZE LOCK ellipse
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * s * (1 + plant * 0.04), 4.5 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(o.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(hurtLean + atkLean);
  // micro plant squash (visual only — collision r unchanged)
  if (plant > 0) ctx.scale(1 + plant * 0.025, 1 - plant * 0.03);

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

  // ---- legs (flowing stride: hip → mid → foot, opposite phase) ----
  const legAmp = isMoving ? 5.4 * s : 0.8 * s;
  const footL = -1.5 * s + Math.sin(t) * legAmp;
  const footR = 1.5 * s - Math.sin(t) * legAmp;
  const midLY = hipY * 0.45 - 1 * 0.55;
  const midRY = hipY * 0.45 - 1 * 0.55;
  ctx.strokeStyle = legC; ctx.lineWidth = 3.4 * s;
  ctx.beginPath();
  ctx.moveTo(-1.5 * s, hipY); ctx.lineTo(-1.5 * s + Math.sin(t) * legAmp * 0.55, midLY); ctx.lineTo(footL, -1);
  ctx.moveTo(1.5 * s, hipY); ctx.lineTo(1.5 * s - Math.sin(t) * legAmp * 0.55, midRY); ctx.lineTo(footR, -1);
  ctx.stroke();

  // ---- torso ----
  ctx.strokeStyle = cloth; ctx.lineWidth = 7.5 * s * (o.bulk || 1);
  ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(lean, shY); ctx.stroke();
  // v2.9 harness / vest trim stitch (player + some NPCs)
  if (o.vestTrim) {
    ctx.strokeStyle = flash ? '#fff' : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-2.2 * s, hipY + 2 * s); ctx.lineTo(lean - 1.5 * s, shY + 4 * s);
    ctx.moveTo(2.2 * s, hipY + 2 * s); ctx.lineTo(lean + 1.5 * s, shY + 4 * s);
    ctx.stroke();
  }
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
  // opposite-arm swing vs legs (counter-rotation) when idle/walk; attack overrides
  const armSwing = isMoving ? -swing * 4 * s : Math.sin(t * 0.55) * 0.6 * s;
  const reachMul = 1 + windPose * -0.25 + strikePose * 0.55;
  ctx.strokeStyle = skin; ctx.lineWidth = 3 * s;
  if (o.weapon === 'rifle') {
    // both hands forward holding a rifle aimed at o.gunAngle (mirrored space)
    const ga = o.gunAngle || 0;
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga + windPose * -0.12 + strikePose * 0.06);
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
    // dual-wield ascension: a compact off-hand blaster below the rifle
    if (o.dualGun) {
      ctx.save();
      ctx.translate(lean, armY + 3 * s);
      ctx.rotate((o.gunAngle || 0) + 0.18);
      ctx.strokeStyle = skin; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9 * s, 2 * s); ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : '#a8b6cc';
      ctx.fillRect(5 * s, -1.6 * s, 10 * s, 3.2 * s);
      ctx.fillStyle = flash ? '#fff' : (o.dualColor || '#3ef0c8');
      ctx.fillRect(13 * s, -1.2 * s, 2.6 * s, 2.4 * s);
      ctx.restore();
    }
  } else if (o.weapon === 'cannon') {
    // arm-mounted pulse cannon: chunky tube in place of a hand (Warden)
    const ga = o.gunAngle || 0;
    ctx.beginPath(); ctx.moveTo(lean, armY); ctx.lineTo(lean - 5 * s, armY + 10 * s + armSwing * 0.3); ctx.stroke(); // off arm hangs
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga + windPose * -0.1 + strikePose * 0.08);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9 * s, 1.5 * s); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#5a6478';
    ctx.fillRect(3 * s, -3 * s, 13 * s, 6 * s);
    ctx.fillStyle = flash ? '#fff' : '#3ef0c8';
    ctx.shadowColor = '#3ef0c8'; ctx.shadowBlur = 6;
    ctx.fillRect(15 * s, -2 * s, 3.5 * s, 4 * s); // emitter
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (o.weapon === 'crossbow') {
    // tech crossbow: wooden stock, steel bow arms, taut string (Scout)
    const ga = o.gunAngle || 0;
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga + windPose * -0.15 + strikePose * 0.05);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8 * s, 2 * s); ctx.moveTo(0, 0); ctx.lineTo(12 * s, 0.5 * s); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#6b4c30'; ctx.lineWidth = 2.4 * s;
    ctx.beginPath(); ctx.moveTo(2 * s, 0); ctx.lineTo(15 * s, 0); ctx.stroke(); // stock
    ctx.strokeStyle = flash ? '#fff' : '#8d99ae'; ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(15 * s, 0); ctx.quadraticCurveTo(11 * s, -6 * s, 7 * s, -7 * s);
    ctx.moveTo(15 * s, 0); ctx.quadraticCurveTo(11 * s, 6 * s, 7 * s, 7 * s);
    ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#d8e6f5'; ctx.lineWidth = 0.8 * s;
    ctx.beginPath(); ctx.moveTo(7 * s, -7 * s); ctx.lineTo(7 * s, 7 * s); ctx.stroke(); // string
    ctx.restore();
  } else if (o.weapon === 'spear') {
    // militia spear — shaft tracks walk + thrust on strike
    const thrust = strikePose * 10 * s - windPose * 4 * s;
    ctx.beginPath();
    ctx.moveTo(lean, armY); ctx.lineTo(lean + 4 * s + thrust * 0.2, armY + 6 * s + armSwing * 0.4); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#c8a06a'; ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(lean + 6 * s + thrust, armY - 18 * s); ctx.lineTo(lean + 6 * s + thrust, armY + 10 * s); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#d8d0c0';
    ctx.beginPath();
    ctx.moveTo(lean + 6 * s + thrust, armY - 20 * s);
    ctx.lineTo(lean + 9 * s + thrust, armY - 14 * s);
    ctx.lineTo(lean + 3 * s + thrust, armY - 14 * s);
    ctx.fill();
  } else if (o.weapon === 'bow') {
    const drawAmt = windPose * 4 * s;
    ctx.beginPath();
    ctx.moveTo(lean, armY); ctx.lineTo(lean + 10 * s, armY - 2 * s + armSwing * 0.2); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#8a7050'; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(lean + 4 * s, armY - 10 * s); ctx.quadraticCurveTo(lean + 14 * s - drawAmt, armY, lean + 4 * s, armY + 10 * s); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#d8c8a0'; ctx.lineWidth = 1 * s;
    ctx.beginPath(); ctx.moveTo(lean + 4 * s, armY - 10 * s); ctx.lineTo(lean + 4 * s + drawAmt * 0.5, armY + 10 * s); ctx.stroke();
  } else if (o.weapon === 'club') {
    // one arm hangs, one arm raised with a spiked club — windup lifts, strike chops
    const raise = Math.sin(t * 0.7) * 0.12 - 0.85 - windPose * 0.55 + strikePose * 1.35;
    ctx.beginPath(); ctx.moveTo(lean, armY); ctx.lineTo(lean - 6 * s, armY + 9 * s + armSwing); ctx.stroke();
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
    const lift = windPose * -8 * s + strikePose * 4 * s;
    ctx.beginPath(); ctx.moveTo(lean, armY); ctx.lineTo(lean + 8 * s, armY + 4 * s + armSwing * 0.3); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#5a4634'; ctx.lineWidth = 2.4 * s;
    ctx.beginPath(); ctx.moveTo(lean + 8 * s, armY + 12 * s + lift * 0.2); ctx.lineTo(lean + 8 * s, armY - 14 * s + lift); ctx.stroke();
    const pulse = 0.6 + Math.sin(performance.now() / 200) * 0.4 + strikePose * 0.35;
    ctx.fillStyle = `rgba(210,77,255,${pulse})`;
    ctx.shadowColor = '#d24dff'; ctx.shadowBlur = 10 + strikePose * 8;
    ctx.beginPath(); ctx.arc(lean + 8 * s, armY - 16 * s + lift, 3.4 * s, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // bare arms — zombies reach forward, others hang; swipe adds lunge
    const reach = o.armsForward ? 1 : 0;
    const lunge = strikePose * 6 * s * reachMul - windPose * 3 * s;
    ctx.beginPath();
    ctx.moveTo(lean, armY);
    ctx.lineTo(lean + (reach ? 12 * s : -4 * s) + lunge, armY + (reach ? 2 * s + Math.sin(t * 1.4) * 2 : 10 * s) + armSwing);
    ctx.moveTo(lean, armY);
    ctx.lineTo(lean + (reach ? 11 * s : 4 * s) + lunge * 0.85, armY + (reach ? 5 * s - Math.sin(t * 1.2) * 2 : 10 * s) - armSwing);
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
  // v2.9 husk scar flecks
  if (o.scarDots) {
    ctx.fillStyle = flash ? '#fff' : 'rgba(40,50,30,0.55)';
    ctx.beginPath();
    ctx.arc(hx + headR * 0.2, headY + headR * 0.35, 0.7 * s, 0, TAU);
    ctx.arc(hx + headR * 0.55, headY + headR * 0.15, 0.55 * s, 0, TAU);
    ctx.fill();
  }
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
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const base = {
    walk: e.walk, facing: e.facing, flash: e.flash, moving,
    swipe: e.swipeT || 0,
    hurtRecoil: e.flash > 0.04,
  };
  switch (e.type) {
    // v2.13.2 — figure s ≈ sprite drawH/36; toward ravager s=1.7; skeleton UNCHANGED
    case 'husk': return { ...base, s: 1.56, skin: '#8aa06a', cloth: '#55503f', rags: '#3f3a2c',
      legs: '#33302a', hunch: 0.7, armsForward: true, glowEyes: '#ff4d5e', scarDots: true };
    case 'sprinter': return { ...base, s: 1.35, skin: '#9db07a', cloth: '#4a4438', rags: '#37321f',
      legs: '#2c2a20', hunch: 0.9, armsForward: true, glowEyes: '#ffb02e' };
    case 'shaman': return { ...base, s: 1.56, skin: '#7a8f5a', cloth: '#4a2f63', hood: '#3a2350',
      legs: '#31264a', hunch: 0.3, weapon: 'staff', glowEyes: '#d24dff' };
    case 'ravager': return { ...base, s: RAVAGER_FIGURE_S, bulk: 1.35, headScale: 1.1, skin: '#5f8f3a', cloth: '#4c3a26',
      pauldron: '#6b7686', legs: '#3a3026', tusks: true, ears: true, weapon: 'club', glowEyes: '#ffd54a' };
    case 'warlord': return { ...base, s: 3.2, bulk: 1.55, headScale: 1.15, skin: '#4ecf3a', cloth: '#5a2f78',
      pauldron: '#9aa8bc', legs: '#2f9a28', tusks: true, ears: true, horns: true, helmet: '#3a3f4c',
      weapon: 'club', glowEyes: '#ff2d55', aura: '#b04dff' };
    // tank — near ravager, still far below Gharok
    case 'bulwark': return { ...base, s: 1.72, bulk: 1.6, headScale: 1.05, skin: '#5f7a44', cloth: '#3f4a33',
      rags: '#2e3626', legs: '#2a3022', hunch: 0.8, armsForward: true, glowEyes: '#ff2d55' };
    // bony pale runner — SIZE LOCK 2.13.1 (unchanged in 2.13.2)
    case 'skeleton': return { ...base, s: 1.055, bulk: 0.62, skin: '#ddd6c0', cloth: '#b8b09a',
      rags: '#8a8272', legs: '#c9c2ac', hunch: 0.55, armsForward: true, glowEyes: '#9ef0ff' };
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
    dualGun: player.form > 0 && !!loadout.secondary,
    dualColor: loadout.secondary === 'sticker' ? '#ff6bd8' : '#3ef0c8',
    aura: player.form === 2 ? '#fff2a8' : player.form === 1 ? '#ffd54a' : null,
    flash: 0,
    alpha: player.hurtT > 0 && Math.sin(performance.now() / 40) > 0 ? 0.4 : 1,
    vestTrim: true, // v2.9: harness stitch detail
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
    case 'riftnet': return { ...base, skin: '#c8d0e0', cloth: '#2a4a6a', pauldron: '#4de1ff',
      legs: '#1a2838', hood: '#1e3348', aura: '#4de1ff',
      weapon: 'staff' }; // Riftwarden Kael — frost-steel cloak, cyan clasp
    default: return { ...base, skin: '#d9a878', cloth: '#7a5a34', pauldron: '#9b7648',
      legs: '#3a3226', weapon: 'staff' };
  }
}

// ============ GHAROK — v2.8.2 CLEAN GEOMETRIC TEMPLATE ============
// PRESERVED for restore/reuse. Active boss draw is drawWarlord() below (v2.8.4).
// Procedural canvas only (no Meiker/Hero Forge PNGs). Top-down readable silhouette:
// chunky shapes, dark outlines, HIGH contrast, LARGE separated twin heads,
// one club arm + one claw arm (red telegraph). Armor plates chip via armorCrack.
function drawWarlord_v282_template(e, alpha) {
  const s = 2.55;
  const t = e.walk, swing = Math.sin(t) * 0.45, bob = Math.abs(Math.sin(t)) * 2.2;
  const flash = e.flash > 0;
  const skin = flash ? '#fff' : '#3dcf4a';
  const skinDark = flash ? '#fff' : '#249a32';
  const outline = flash ? '#fff' : '#0d1a10';
  const steel = flash ? '#fff' : '#9aa8bc';
  const steelEdge = flash ? '#fff' : '#3a4456';
  const club = flash ? '#fff' : '#6b3e1a';
  const clubEdge = flash ? '#fff' : '#2a1608';
  const shorts = flash ? '#fff' : '#3a2414';
  const clawIdle = flash ? '#fff' : '#e8e0c8';
  const OL = 2.4; // shared outline weight (matches husk/companion readability)

  const strokeFill = (drawPath) => {
    drawPath();
    ctx.fill();
    ctx.stroke();
  };

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 13, 0, 0, TAU); ctx.fill();
  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);

  const hipY = -14 * s, shY = -28 * s, headY = -43 * s;
  // soft rift aura (behind, low opacity — does not muddy silhouette)
  const ar = 36 * s * 0.55 + Math.sin(performance.now() / 70) * 2;
  const ag = ctx.createRadialGradient(0, hipY, 4, 0, hipY, ar);
  ag.addColorStop(0, '#b04dff44'); ag.addColorStop(1, '#b04dff00');
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.ellipse(0, hipY, ar * 0.75, ar, 0, 0, TAU); ctx.fill();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ---- LEGS (thick, spaced, clearly visible below shorts) ----
  const legL = -5.5 * s + Math.sin(t) * 4 * s;
  const legR = 5.5 * s - Math.sin(t) * 4 * s;
  ctx.strokeStyle = outline; ctx.lineWidth = 7.6 * s;
  ctx.beginPath();
  ctx.moveTo(-4 * s, hipY); ctx.lineTo(legL, 1);
  ctx.moveTo(4 * s, hipY); ctx.lineTo(legR, 1);
  ctx.stroke();
  ctx.strokeStyle = skinDark; ctx.lineWidth = 5.4 * s;
  ctx.beginPath();
  ctx.moveTo(-4 * s, hipY); ctx.lineTo(legL, 1);
  ctx.moveTo(4 * s, hipY); ctx.lineTo(legR, 1);
  ctx.stroke();
  // chunky greaves — one plate each, no toe jewelry
  for (const gx of [legL, legR]) {
    ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
    ctx.fillRect(gx - 2.8 * s, -4, 5.6 * s, 7.5 * s);
    ctx.strokeRect(gx - 2.8 * s, -4, 5.6 * s, 7.5 * s);
  }

  // ---- SHORTS (one bold trapezoid) ----
  ctx.fillStyle = shorts; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.moveTo(-7 * s, hipY - 1.5 * s);
    ctx.lineTo(7 * s, hipY - 1.5 * s);
    ctx.lineTo(5.5 * s, hipY + 5.5 * s);
    ctx.lineTo(-5.5 * s, hipY + 5.5 * s);
    ctx.closePath();
  });

  // ---- CLUB ARM (back / left) — sticks OUT from torso ----
  ctx.save();
  ctx.translate(-12 * s, shY + 5 * s);
  ctx.rotate(2.35 - swing * 0.1);
  // arm outline then fill
  ctx.strokeStyle = outline; ctx.lineWidth = 7.4 * s;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11 * s, 0); ctx.stroke();
  ctx.strokeStyle = skin; ctx.lineWidth = 5.2 * s;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11 * s, 0); ctx.stroke();
  // bold club head
  ctx.fillStyle = club; ctx.strokeStyle = clubEdge; ctx.lineWidth = OL;
  ctx.fillRect(9 * s, -3.6 * s, 12 * s, 7.2 * s);
  ctx.strokeRect(9 * s, -3.6 * s, 12 * s, 7.2 * s);
  // 2 big spikes only
  ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
  for (const sx of [12.5, 17.5]) {
    strokeFill(() => {
      ctx.beginPath();
      ctx.moveTo(sx * s, -3.6 * s);
      ctx.lineTo((sx + 1.6) * s, -7.2 * s);
      ctx.lineTo((sx + 3.2) * s, -3.6 * s);
      ctx.closePath();
    });
  }
  ctx.restore();

  // ---- TORSO (one chunky oval — no muscle-line clutter) ----
  ctx.fillStyle = skin; ctx.strokeStyle = outline; ctx.lineWidth = OL + 0.4;
  strokeFill(() => {
    ctx.beginPath();
    ctx.ellipse(0, (shY + hipY) * 0.5 + 1 * s, 9.5 * s, 11.5 * s, 0, 0, TAU);
  });
  // shoulder mass bumps (left / right, clearly wider than torso core)
  ctx.fillStyle = skinDark; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath(); ctx.ellipse(-10 * s, shY + 4 * s, 4.5 * s, 3.8 * s, 0, 0, TAU);
  });
  strokeFill(() => {
    ctx.beginPath(); ctx.ellipse(10 * s, shY + 4 * s, 4.5 * s, 3.8 * s, 0, 0, TAU);
  });

  // ---- ARMOR PLATES — 4 distinct spaced slabs, chip with armorCrack ----
  if (e.maxArmor) {
    const plates = e.armor > 0 ? e.armorCrack : 0;
    // larger, spaced plates — gap between each so they don't read as a brick wall
    const spots = [
      [-8, -24, 6.5, 5],
      [1.5, -24, 6.5, 5],
      [-6.5, -17.5, 13, 4.5],
      [-5, -11.5, 10, 4],
    ];
    for (let i = 0; i < 4; i++) {
      const [px, py, pw, ph] = spots[i];
      const x = px * s, y = py * s, w = pw * s, h = ph * s;
      if (i < plates) {
        ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        // single highlight bar (not bolt clutter)
        ctx.fillStyle = flash ? '#fff' : '#c8d2e0';
        ctx.fillRect(x + 2, y + 2, w - 4, 1.8);
        if (i === plates - 1 && e.armor < e.maxArmor) {
          ctx.strokeStyle = outline; ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 2);
          ctx.lineTo(x + w * 0.55, y + h * 0.6);
          ctx.lineTo(x + w * 0.35, y + h - 2);
          ctx.stroke();
        }
      } else {
        // cracked scar — one X, bold
        ctx.strokeStyle = skinDark; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + w - 2, y + h - 2);
        ctx.moveTo(x + w - 2, y + 2); ctx.lineTo(x + 2, y + h - 2);
        ctx.stroke();
      }
    }
  }

  // ---- CLAW ARM (front / right) — red telegraph on wind-up ----
  const wind = e.clawWind > 0 ? clamp(e.clawWind / CLAW_WINDUP, 0, 1) : 0;
  ctx.save();
  ctx.translate(12 * s, shY + 5 * s);
  ctx.rotate(wind > 0 ? -1.55 + (1 - wind) * 0.4 : -0.2 + Math.sin(t * 0.7) * 0.1);
  ctx.strokeStyle = outline; ctx.lineWidth = 7.4 * s;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12 * s, 0); ctx.stroke();
  ctx.strokeStyle = skin; ctx.lineWidth = 5.2 * s;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12 * s, 0); ctx.stroke();
  // steel gauntlet block
  ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
  ctx.fillRect(9.5 * s, -3.4 * s, 6.5 * s, 6.8 * s);
  ctx.strokeRect(9.5 * s, -3.4 * s, 6.5 * s, 6.8 * s);
  // 3 bold claws (not 4 thin arcs)
  ctx.strokeStyle = wind > 0 ? '#ff3a28' : clawIdle;
  if (wind > 0) { ctx.shadowColor = '#ff3a28'; ctx.shadowBlur = 14; }
  ctx.lineWidth = 2.6 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const cy = (-2.2 + i * 2.2) * s;
    ctx.beginPath();
    ctx.moveTo(15.5 * s, cy);
    ctx.quadraticCurveTo(20 * s, cy - 0.6 * s, 22.5 * s, cy + 2.4 * s);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // ---- SHARED NECK + TWO LARGE SEPARATED HEADS ----
  // neck stump (wide enough for twin necks, gap visible above)
  ctx.fillStyle = skinDark; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.ellipse(-4.5 * s, headY + 8.5 * s, 4 * s, 3.2 * s, 0, 0, TAU);
  });
  strokeFill(() => {
    ctx.beginPath();
    ctx.ellipse(4.5 * s, headY + 8.5 * s, 4 * s, 3.2 * s, 0, 0, TAU);
  });

  const pulse = 0.85 + Math.sin(performance.now() / 160) * 0.15;
  // head centers FAR apart — intentional gap so they never read as one blob
  for (const off of [-8.0, 8.0]) {
    const ox = off * s;
    const earDir = off < 0 ? -1 : 1;
    const hr = 5.5 * s; // large but with clear inter-head gap (~5px at s=2.55)

    // ear first (behind head edge) — green, pointed, outer only
    ctx.fillStyle = skin; ctx.strokeStyle = outline; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath();
      ctx.moveTo(ox + earDir * hr * 0.45, headY - 1.2 * s);
      ctx.lineTo(ox + earDir * (hr + 6 * s), headY - 4 * s);
      ctx.lineTo(ox + earDir * (hr + 0.8 * s), headY + 3.2 * s);
      ctx.closePath();
    });

    // head dome
    ctx.fillStyle = skin; ctx.strokeStyle = outline; ctx.lineWidth = OL + 0.4;
    strokeFill(() => {
      ctx.beginPath(); ctx.ellipse(ox, headY, hr, hr * 1.08, 0, 0, TAU);
    });

    // ONE solid glowing RED eye orb per head
    const ex = ox + earDir * 0.8 * s, ey = headY - 0.4 * s;
    const er = 2.6 * s * pulse;
    ctx.fillStyle = '#ff1e14';
    ctx.shadowColor = '#ff2a1f'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffc9c4';
    ctx.beginPath(); ctx.arc(ex - 0.55 * s, ey - 0.55 * s, er * 0.32, 0, TAU); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.stroke();

    // simple frown mouth (one stroke)
    ctx.strokeStyle = outline; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ox - 2 * s, headY + 3.4 * s);
    ctx.quadraticCurveTo(ox, headY + 2.2 * s, ox + 2 * s, headY + 3.4 * s);
    ctx.stroke();
  }

  ctx.restore();
}

// ============ GHAROK SPRITES (v2.8.6) — real art from approved concept ============
// Loaded from assets/gharok/*.png (synced into www/). NOT skeletal articulation —
// frame-swap idle↔walk by gait phase + bob/lean/squash so steps read clearly.
// Procedural VFX stay in drawWarlord(); body falls back to drawWarlordProcedural.
const gharokSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadGharokSprites() {
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) gharokSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) gharokSpr.ok = good > 0; };
    img.src = 'assets/gharok/' + k + '.png';
    gharokSpr[k] = img;
  }
})();

function gharokSpriteReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

// ============ ASHEN HUSK SPRITES (v2.12.1 / size pass 2.13.2) ============
// assets/zombie/{idle,walk,windup}.png — Gharok-quality detail, NOT Gharok size.
// Toward ravager (~r=24 / s=1.7): husk r=21 drawH=56; sprinter r=18 ×0.87. NOT boss 228.
const HUSK_SPRITE_DRAWH = 56; // == drawFigure H at s=1.56 — SIZE LOCK (2.13.2)
const zombieSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadZombieSprites() {
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) zombieSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) zombieSpr.ok = good > 0; };
    img.src = 'assets/zombie/' + k + '.png';
    zombieSpr[k] = img;
  }
})();

function zombieSpriteReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

function zombieSpriteFrame(e) {
  // Attack: windup sheet while swipe telegraphs / strikes (husks use swipeT, not clawWind)
  if ((e.swipeT || 0) > 0 && zombieSpriteReady(zombieSpr.windup)) return zombieSpr.windup;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  if (moving && zombieSpriteReady(zombieSpr.walk) && zombieSpriteReady(zombieSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? zombieSpr.walk : zombieSpr.idle;
  }
  if (zombieSpriteReady(zombieSpr.idle)) return zombieSpr.idle;
  if (zombieSpriteReady(zombieSpr.walk)) return zombieSpr.walk;
  if (zombieSpriteReady(zombieSpr.windup)) return zombieSpr.windup;
  return null;
}

// Returns true if sprite drew; false → caller falls back to procedural drawFigure.
function drawHuskSprite(e, alpha) {
  const img = zombieSpriteFrame(e);
  if (!img) return false;
  const s = e.type === 'sprinter' ? 0.87 : 1.0; // UNIT_SIZES draw scales (2.13.2)
  const drawH = HUSK_SPRITE_DRAWH * s; // husk ~56, sprinter ~48.7 — toward ravager, NOT 228
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const swipe = e.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurt = e.flash > 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 2.0 * s
    : (swipe > 0) ? 0.9 * s
    : Math.abs(Math.sin(t * 0.55)) * 0.45 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.05
    : windPose > 0 ? -0.07 - windPose * 0.03
    : strikePose > 0 ? 0.12 * (1 - strikePose * 0.3)
    : hurt ? -0.09
    : Math.sin(t * 0.55) * 0.01;
  const squashY = 1 - plant * 0.05 - (strikePose > 0 ? 0.025 : 0) + (hurt ? 0.015 : 0);
  const squashX = 1 + plant * 0.04 + (strikePose > 0 ? 0.03 : 0) - (hurt ? 0.015 : 0);

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  // shadow — match procedural husk footprint (not boss ellipse)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * s * (1 + plant * 0.04), 4.5 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (windPose > 0 || strikePose > 0) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#ff4d5e';
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = `rgba(255,77,94,${0.15 + glow * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.18, -drawH * 0.55, 8 * s + glow * 4, 10 * s + glow * 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN SKELETON SPRITES (v2.13.0 APPLIED / size 2.13.1) ============
// assets/skeleton/{idle,walk,windup}.png — husk/Gharok quality, slightly > player visual.
// Collision r=12. drawH = 38. NOT boss 228.
const SKELETON_SPRITE_ENABLED = true;
const SKELETON_SPRITE_DRAWH = 38; // SIZE LOCK (2.13.1; was 32.4)
const skeletonSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadSkeletonSprites() {
  if (!SKELETON_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) skeletonSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) skeletonSpr.ok = good > 0; };
    img.src = 'assets/skeleton/' + k + '.png';
    skeletonSpr[k] = img;
  }
})();

function skeletonSpriteReady(img) {
  return !!(SKELETON_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function skeletonSpriteFrame(e) {
  if ((e.swipeT || 0) > 0 && skeletonSpriteReady(skeletonSpr.windup)) return skeletonSpr.windup;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  if (moving && skeletonSpriteReady(skeletonSpr.walk) && skeletonSpriteReady(skeletonSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? skeletonSpr.walk : skeletonSpr.idle;
  }
  if (skeletonSpriteReady(skeletonSpr.idle)) return skeletonSpr.idle;
  if (skeletonSpriteReady(skeletonSpr.walk)) return skeletonSpr.walk;
  if (skeletonSpriteReady(skeletonSpr.windup)) return skeletonSpr.windup;
  return null;
}

function drawSkeletonSprite(e, alpha) {
  if (!SKELETON_SPRITE_ENABLED) return false;
  const img = skeletonSpriteFrame(e);
  if (!img) return false;
  const s = 0.9; // UNIT_SIZES skeleton figure s
  const drawH = SKELETON_SPRITE_DRAWH; // 38 — slight > player, not boss 228
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const swipe = e.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurt = e.flash > 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 1.8 * s
    : (swipe > 0) ? 0.8 * s
    : Math.abs(Math.sin(t * 0.55)) * 0.4 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.055
    : windPose > 0 ? -0.08 - windPose * 0.03
    : strikePose > 0 ? 0.13 * (1 - strikePose * 0.3)
    : hurt ? -0.09
    : Math.sin(t * 0.55) * 0.012;
  const squashY = 1 - plant * 0.05 - (strikePose > 0 ? 0.025 : 0) + (hurt ? 0.015 : 0);
  const squashX = 1 + plant * 0.04 + (strikePose > 0 ? 0.03 : 0) - (hurt ? 0.015 : 0);

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(0, 0, 8 * s * (1 + plant * 0.04), 3.6 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (windPose > 0 || strikePose > 0) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#4de1ff';
    ctx.shadowBlur = 9 * s;
    ctx.fillStyle = `rgba(77,225,255,${0.12 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.16, -drawH * 0.58, 7 * s + glow * 3.5, 9 * s + glow * 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN BULWARK SPRITES (v2.13.0 APPLIED / size 2.13.2) ============
// assets/bulwark/{idle,walk,windup}.png — husk/Gharok quality, near ravager (NOT boss).
// Collision r=23. drawH = 62 (near ravager ~61). NOT Gharok 228.
const BULWARK_SPRITE_ENABLED = true;
const BULWARK_SPRITE_DRAWH = 62; // SIZE LOCK (2.13.2; was 58) — near ravager ~61, not Gharok 228
const bulwarkSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadBulwarkSprites() {
  if (!BULWARK_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) bulwarkSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) bulwarkSpr.ok = good > 0; };
    img.src = 'assets/bulwark/' + k + '.png';
    bulwarkSpr[k] = img;
  }
})();

function bulwarkSpriteReady(img) {
  return !!(BULWARK_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function bulwarkSpriteFrame(e) {
  if ((e.swipeT || 0) > 0 && bulwarkSpriteReady(bulwarkSpr.windup)) return bulwarkSpr.windup;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  if (moving && bulwarkSpriteReady(bulwarkSpr.walk) && bulwarkSpriteReady(bulwarkSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? bulwarkSpr.walk : bulwarkSpr.idle;
  }
  if (bulwarkSpriteReady(bulwarkSpr.idle)) return bulwarkSpr.idle;
  if (bulwarkSpriteReady(bulwarkSpr.walk)) return bulwarkSpr.walk;
  if (bulwarkSpriteReady(bulwarkSpr.windup)) return bulwarkSpr.windup;
  return null;
}

function drawBulwarkSprite(e, alpha) {
  if (!BULWARK_SPRITE_ENABLED) return false;
  const img = bulwarkSpriteFrame(e);
  if (!img) return false;
  const s = 1.45; // UNIT_SIZES bulwark figure s
  const drawH = BULWARK_SPRITE_DRAWH; // 62 — near ravager, not boss 228
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const swipe = e.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurt = e.flash > 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 2.0 * s
    : (swipe > 0) ? 0.9 * s
    : Math.abs(Math.sin(t * 0.55)) * 0.45 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.05
    : windPose > 0 ? -0.09 - windPose * 0.035
    : strikePose > 0 ? 0.14 * (1 - strikePose * 0.3)
    : hurt ? -0.1
    : Math.sin(t * 0.55) * 0.01;
  const squashY = 1 - plant * 0.055 - (strikePose > 0 ? 0.03 : 0) + (hurt ? 0.015 : 0);
  const squashX = 1 + plant * 0.045 + (strikePose > 0 ? 0.035 : 0) - (hurt ? 0.015 : 0);

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * s * (1 + plant * 0.04), 4.2 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (windPose > 0 || strikePose > 0) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#ff2d55';
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = `rgba(255,45,85,${0.1 + glow * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.12, -drawH * 0.55, 8 * s + glow * 4, 10 * s + glow * 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN SHAMAN SPRITES (v2.13.0 APPLIED / size 2.13.2) ============
// assets/shaman/{idle,walk,windup}.png — husk/Gharok quality, toward ravager (NOT boss).
// Collision r=20. drawH = 56 (matches husk). NOT boss 228.
const SHAMAN_SPRITE_ENABLED = true;
const SHAMAN_SPRITE_DRAWH = 56; // SIZE LOCK (2.13.2; was 42) — matches husk toward ravager
const shamanSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadShamanSprites() {
  if (!SHAMAN_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) shamanSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) shamanSpr.ok = good > 0; };
    img.src = 'assets/shaman/' + k + '.png';
    shamanSpr[k] = img;
  }
})();

function shamanSpriteReady(img) {
  return !!(SHAMAN_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function shamanSpriteFrame(e) {
  if ((e.swipeT || 0) > 0 && shamanSpriteReady(shamanSpr.windup)) return shamanSpr.windup;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  if (moving && shamanSpriteReady(shamanSpr.walk) && shamanSpriteReady(shamanSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? shamanSpr.walk : shamanSpr.idle;
  }
  if (shamanSpriteReady(shamanSpr.idle)) return shamanSpr.idle;
  if (shamanSpriteReady(shamanSpr.walk)) return shamanSpr.walk;
  if (shamanSpriteReady(shamanSpr.windup)) return shamanSpr.windup;
  return null;
}

function drawShamanSprite(e, alpha) {
  if (!SHAMAN_SPRITE_ENABLED) return false;
  const img = shamanSpriteFrame(e);
  if (!img) return false;
  const s = 1.0; // UNIT_SIZES shaman figure s (same as husk)
  const drawH = SHAMAN_SPRITE_DRAWH; // 56 — toward ravager with husk, not boss 228
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const swipe = e.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurt = e.flash > 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 1.6 * s
    : (swipe > 0) ? 0.7 * s
    : Math.abs(Math.sin(t * 0.55)) * 0.4 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.045
    : windPose > 0 ? -0.08 - windPose * 0.04
    : strikePose > 0 ? 0.1 * (1 - strikePose * 0.3)
    : hurt ? -0.09
    : Math.sin(t * 0.55) * 0.01;
  const squashY = 1 - plant * 0.05 - (strikePose > 0 ? 0.025 : 0) + (hurt ? 0.012 : 0);
  const squashX = 1 + plant * 0.04 + (strikePose > 0 ? 0.03 : 0) - (hurt ? 0.012 : 0);

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(0, 0, 8 * s * (1 + plant * 0.04), 3.4 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (windPose > 0 || strikePose > 0) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#5ce1ff';
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = `rgba(92,225,255,${0.1 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.14, -drawH * 0.62, 7 * s + glow * 4, 9 * s + glow * 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN RAVAGER SPRITES (articulation+barks coded; flag OFF until ship batch) ============
// assets/ravager/{idle,walk,windup}.png — husk/bulwark quality, between others and boss.
// Flag OFF: live procedural r=24 / s=1.7. Flag ON: sheets + r=36 / drawH=100 / s≈2.78.
// Gate + size constants: RAVAGER_SPRITE_* near ETYPES. NOT boss (Gharok 54/228).
const ravagerSpr = { idle: null, walk: null, windup: null, ok: false };
(function loadRavagerSprites() {
  if (!RAVAGER_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) ravagerSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) ravagerSpr.ok = good > 0; };
    img.src = 'assets/ravager/' + k + '.png';
    ravagerSpr[k] = img;
  }
})();

function ravagerSpriteReady(img) {
  return !!(RAVAGER_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function ravagerSpriteFrame(e) {
  // Same idle↔walk↔windup swap as husk/bulwark/shaman (gait half-cycle + swipeT windup)
  if ((e.swipeT || 0) > 0 && ravagerSpriteReady(ravagerSpr.windup)) return ravagerSpr.windup;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  if (moving && ravagerSpriteReady(ravagerSpr.walk) && ravagerSpriteReady(ravagerSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? ravagerSpr.walk : ravagerSpr.idle;
  }
  if (ravagerSpriteReady(ravagerSpr.idle)) return ravagerSpr.idle;
  if (ravagerSpriteReady(ravagerSpr.walk)) return ravagerSpr.walk;
  if (ravagerSpriteReady(ravagerSpr.windup)) return ravagerSpr.windup;
  return null;
}

function drawRavagerSprite(e, alpha) {
  if (!RAVAGER_SPRITE_ENABLED) return false;
  const img = ravagerSpriteFrame(e);
  if (!img) return false;
  const s = RAVAGER_FIGURE_S; // 2.78 when enabled (drawH/36)
  const drawH = RAVAGER_SPRITE_DRAWH; // 100 — between bulwark 62 and boss 228
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12;
  const swipe = e.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurt = e.flash > 0;
  // Heavy lumber gait — clearer plant squash/bob than bulwark (bigger footprint)
  const bob = moving ? Math.abs(Math.sin(t)) * 2.4 * s
    : (swipe > 0) ? 1.1 * s
    : Math.abs(Math.sin(t * 0.5)) * 0.55 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.055
    : windPose > 0 ? -0.11 - windPose * 0.045
    : strikePose > 0 ? 0.16 * (1 - strikePose * 0.3)
    : hurt ? -0.12
    : Math.sin(t * 0.5) * 0.012;
  const squashY = 1 - plant * 0.065 - (strikePose > 0 ? 0.035 : 0) + (hurt ? 0.018 : 0);
  const squashX = 1 + plant * 0.055 + (strikePose > 0 ? 0.04 : 0) - (hurt ? 0.018 : 0);

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 0, 14 * s * (1 + plant * 0.05), 5.2 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (windPose > 0 || strikePose > 0) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#e07040';
    ctx.shadowBlur = 12 * s;
    ctx.fillStyle = `rgba(224,112,64,${0.1 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.14, -drawH * 0.55, 9 * s + glow * 4.5, 11 * s + glow * 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ WORLD SPRITES (v2.8.7) — pine trees + rocks ============
// assets/world/trees|rocks/*.png — drawImage when ready, procedural fallback otherwise.
const worldSpr = {
  trees: { small: null, med: null, tall: null },
  rocks: { boulder: null, cluster: null, slab: null, mossy: null },
  ok: false,
};
(function loadWorldSprites() {
  const list = [
    ['trees', 'small', 'assets/world/trees/pine_small.png'],
    ['trees', 'med', 'assets/world/trees/pine_med.png'],
    ['trees', 'tall', 'assets/world/trees/pine_tall.png'],
    ['rocks', 'boulder', 'assets/world/rocks/rock_boulder.png'],
    ['rocks', 'cluster', 'assets/world/rocks/rock_cluster.png'],
    ['rocks', 'slab', 'assets/world/rocks/rock_slab.png'],
    ['rocks', 'mossy', 'assets/world/rocks/rock_mossy.png'],
  ];
  let left = list.length, good = 0;
  for (const [group, key, src] of list) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) worldSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) worldSpr.ok = good > 0; };
    img.src = src;
    worldSpr[group][key] = img;
  }
})();
function worldSprReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}
function pineSpriteFor(o) {
  const size = o.size == null ? 1 : o.size;
  const key = size === 0 ? 'small' : size === 2 ? 'tall' : 'med';
  const img = worldSpr.trees[key];
  return worldSprReady(img) ? img : null;
}
function rockSpriteFor(o) {
  const v = o.variant == null ? (Math.floor(o.seed) % 4) : o.variant;
  const keys = ['boulder', 'cluster', 'slab', 'mossy'];
  const img = worldSpr.rocks[keys[v] || 'boulder'];
  return worldSprReady(img) ? img : null;
}

function gharokSpriteFrame(e) {
  // Attack: windup sheet during telegraph; keep windup through strike follow-through
  if ((e.clawWind > 0 || e.clawStrike > 0) && gharokSpriteReady(gharokSpr.windup)) return gharokSpr.windup;
  // Moving: hard alternate idle (plant) ↔ walk (stride) each half-cycle so feet
  // feel like stepping — not a soft sin threshold that barely swaps.
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 14;
  if (moving && gharokSpriteReady(gharokSpr.walk) && gharokSpriteReady(gharokSpr.idle)) {
    return (Math.floor((e.walk || 0) / Math.PI) & 1) ? gharokSpr.walk : gharokSpr.idle;
  }
  if (gharokSpriteReady(gharokSpr.idle)) return gharokSpr.idle;
  if (gharokSpriteReady(gharokSpr.walk)) return gharokSpr.walk;
  if (gharokSpriteReady(gharokSpr.windup)) return gharokSpr.windup;
  return null;
}

function drawWarlordSprite(e, alpha) {
  const img = gharokSpriteFrame(e);
  if (!img) return false;
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 14;
  const wind = e.clawWind > 0 ? clamp(e.clawWind / CLAW_WINDUP, 0, 1) : 0;
  const strike = e.clawStrike > 0 ? clamp(e.clawStrike / CLAW_STRIKE, 0, 1) : 0;
  const hurt = e.flash > 0;
  // Heavy lumber: vertical bob + plant squash + slight lean toward planted side
  // Idle: soft breath. Strike: forward lunge. Hurt: recoil lean.
  const bob = moving ? Math.abs(Math.sin(t)) * 5.2
    : (wind > 0 || strike > 0) ? 2.4
    : Math.abs(Math.sin(t * 0.55)) * 1.6;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0; // peaks on footfalls
  const lean = moving ? Math.sin(t) * 0.045
    : wind > 0 ? -0.08 - (1 - wind) * 0.04
    : strike > 0 ? 0.16 * (1 - strike * 0.35)
    : hurt ? -0.1
    : Math.sin(t * 0.55) * 0.012;
  const squashY = 1 - plant * 0.04 - (strike > 0 ? 0.03 : 0) + (hurt ? 0.02 : 0);
  const squashX = 1 + plant * 0.03 + (strike > 0 ? 0.04 : 0) - (hurt ? 0.02 : 0);
  const drawH = 228; // larger readable boss; collision r stays ~54 — SIZE LOCK
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const flash = hurt;
  const plates = e.maxArmor ? (e.armor > 0 ? e.armorCrack : 0) : 4;

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  ctx.beginPath(); ctx.ellipse(0, 2, 52 + plant * 4 + strike * 6, 18, 0, 0, TAU); ctx.fill();

  // purple rift aura (procedural)
  const ar = 50 + Math.sin(performance.now() / 70) * 2.5;
  const ag = ctx.createRadialGradient(0, -drawH * 0.32, 4, 0, -drawH * 0.32, ar);
  ag.addColorStop(0, '#b04dff48'); ag.addColorStop(1, '#b04dff00');
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.ellipse(0, -drawH * 0.32, ar * 0.78, ar, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  // red cleaver telegraph glow (windup) + strike slash arc
  if (wind > 0 || strike > 0) {
    ctx.save();
    ctx.globalAlpha *= 0.5 + (wind || strike) * 0.5;
    ctx.shadowColor = '#ff3a28';
    ctx.shadowBlur = 24;
    ctx.fillStyle = `rgba(255,58,40,${0.22 + (wind || strike) * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.16, -drawH * 0.74, 30 + (wind || strike) * 12, 38 + (wind || strike) * 14, 0, 0, TAU);
    ctx.fill();
    if (strike > 0) {
      ctx.strokeStyle = `rgba(255,100,70,${0.55 * strike})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(drawW * 0.05, -drawH * 0.55, 70 + (1 - strike) * 30, -1.2, 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 6, drawW, drawH);
  ctx.filter = 'none';

  // armorCrack chip overlays (pauldrons + chest straps)
  ctx.lineCap = 'round';
  if (plates < 2) {
    ctx.strokeStyle = flash ? '#fff' : '#1a3a16';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-drawW * 0.22, -drawH * 0.62); ctx.lineTo(-drawW * 0.08, -drawH * 0.48);
    ctx.moveTo(-drawW * 0.08, -drawH * 0.62); ctx.lineTo(-drawW * 0.22, -drawH * 0.48);
    ctx.stroke();
  } else if (plates === 2 && e.armor < e.maxArmor) {
    ctx.strokeStyle = '#0c180e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-drawW * 0.2, -drawH * 0.58); ctx.lineTo(-drawW * 0.1, -drawH * 0.5);
    ctx.stroke();
  }
  if (plates < 1) {
    ctx.strokeStyle = flash ? '#fff' : '#1a3a16';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(drawW * 0.08, -drawH * 0.6); ctx.lineTo(drawW * 0.24, -drawH * 0.48);
    ctx.moveTo(drawW * 0.24, -drawH * 0.6); ctx.lineTo(drawW * 0.08, -drawH * 0.48);
    ctx.stroke();
  } else if (plates === 1 && e.armor < e.maxArmor) {
    ctx.strokeStyle = '#0c180e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawW * 0.1, -drawH * 0.56); ctx.lineTo(drawW * 0.22, -drawH * 0.48);
    ctx.stroke();
  }
  if (e.maxArmor) {
    for (let i = 0; i < 2; i++) {
      const need = i + 3;
      const cx = (i === 0 ? -1 : 1) * drawW * 0.08;
      const cy = -drawH * 0.42;
      if (plates < need) {
        ctx.strokeStyle = flash ? '#fff' : '#1a3a16';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 6); ctx.lineTo(cx + 10, cy + 6);
        ctx.moveTo(cx + 10, cy - 6); ctx.lineTo(cx - 10, cy + 6);
        ctx.stroke();
      } else if (plates === need && e.armor < e.maxArmor) {
        ctx.strokeStyle = '#0c180e'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 4); ctx.lineTo(cx + 6, cy + 5);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
  return true;
}

function drawWarlord(e, alpha) {
  if (gharokSpr.ok && drawWarlordSprite(e, alpha)) return;
  // also try once images have loaded but ok flag races first paint
  if (drawWarlordSprite(e, alpha)) { gharokSpr.ok = true; return; }
  drawWarlordProcedural(e, alpha);
}

// ============ GHAROK — FLOWING TWIN WAR-BRUTE (v2.8.4 procedural fallback) ============
// Soft connected limbs from T-pose concept. Used when sprite PNGs fail to load.
// Template drawWarlord_v282_template preserved above.
function drawWarlordProcedural(e, alpha) {
  const s = 3.2;
  const t = e.walk, swing = Math.sin(t) * 0.4, bob = Math.abs(Math.sin(t)) * 2.6;
  const flash = e.flash > 0;
  const skin = flash ? '#fff' : '#5aaf3a';
  const skinMid = flash ? '#fff' : '#458c2e';
  const skinDark = flash ? '#fff' : '#2f6e22';
  const skinDeep = flash ? '#fff' : '#1f4e18';
  const outline = flash ? '#fff' : '#0c180e';
  const steel = flash ? '#fff' : '#9aa8bc';
  const steelBlue = flash ? '#fff' : '#7a8fa8';
  const steelEdge = flash ? '#fff' : '#3a4456';
  const wood = flash ? '#fff' : '#6b3e1a';
  const woodEdge = flash ? '#fff' : '#2a1608';
  const tunic = flash ? '#fff' : '#5a2f78';
  const tunicDark = flash ? '#fff' : '#3a1c52';
  const belt = flash ? '#fff' : '#1a1210';
  const bone = flash ? '#fff' : '#e8e0c8';
  const blade = flash ? '#fff' : '#6a727c';
  const bladeEdge = flash ? '#fff' : '#d8dee8';
  const OL = 2.4;

  const strokeFill = (drawPath) => { drawPath(); ctx.fill(); ctx.stroke(); };
  // Soft connected limb blob (ellipse with outline) — joins by overlap.
  const blob = (cx, cy, rx, ry, rot, fill) => {
    ctx.fillStyle = fill; ctx.strokeStyle = outline; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU);
    });
  };
  // Tapered capsule along an axis: wide near (x0,y0), narrower toward (x1,y1).
  const limbSeg = (x0, y0, x1, y1, r0, r1, fill) => {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5;
    // overlapping ellipses: shoulder/hip end, mid, distal — reads as one soft limb
    blob(x0, y0, r0 * 1.05, r0 * 0.92, ang, fill);
    blob(mx, my, (r0 + r1) * 0.52, Math.max(r0, r1) * 0.78, ang, fill);
    blob(x1, y1, r1 * 1.05, r1 * 0.9, ang, fill);
    // thin highlight ridge for muscle volume
    if (!flash) {
      ctx.save();
      ctx.globalAlpha *= 0.35;
      ctx.strokeStyle = skinMid;
      ctx.lineWidth = Math.max(1.2, (r0 + r1) * 0.18);
      ctx.beginPath();
      ctx.moveTo(x0 + Math.cos(ang - 1.2) * r0 * 0.35, y0 + Math.sin(ang - 1.2) * r0 * 0.35);
      ctx.lineTo(x1 + Math.cos(ang - 1.2) * r1 * 0.3, y1 + Math.sin(ang - 1.2) * r1 * 0.3);
      ctx.stroke();
      ctx.restore();
    }
  };

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  ctx.beginPath(); ctx.ellipse(0, 2, 48, 17, 0, 0, TAU); ctx.fill();
  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);

  const hipY = -13 * s, shY = -29 * s, headY = -45 * s;
  const ar = 40 * s * 0.52 + Math.sin(performance.now() / 70) * 2.5;
  const ag = ctx.createRadialGradient(0, hipY, 4, 0, hipY, ar);
  ag.addColorStop(0, '#b04dff48'); ag.addColorStop(1, '#b04dff00');
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.ellipse(0, hipY, ar * 0.78, ar, 0, 0, TAU); ctx.fill();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ---- LEGS: thigh → knee → calf → foot (overlapping soft shapes) ----
  const footYL = 3.4, footYR = 3.4;
  const legSwing = Math.sin(t) * 4.2 * s;
  const legs = [
    { hipX: -5.2 * s, footX: -6.4 * s + legSwing, dir: -1 },
    { hipX: 5.2 * s, footX: 6.4 * s - legSwing, dir: 1 },
  ];
  for (const L of legs) {
    const kneeX = L.hipX * 0.35 + L.footX * 0.65;
    const kneeY = hipY + (footYL - hipY) * 0.48;
    const calfX = L.hipX * 0.12 + L.footX * 0.88;
    const calfY = hipY + (footYL - hipY) * 0.78;
    // thigh (wide → mid)
    limbSeg(L.hipX, hipY + 1 * s, kneeX, kneeY, 4.6 * s, 3.4 * s, skinDark);
    // knee joint blob
    blob(kneeX, kneeY, 2.8 * s, 2.5 * s, 0, skin);
    // calf (mid → ankle)
    limbSeg(kneeX, kneeY + 0.4 * s, calfX, calfY, 3.5 * s, 2.4 * s, skin);
    // ankle → foot pad
    blob(L.footX, footYL, 4.4 * s, 2.3 * s, 0.08 * L.dir, skin);
    blob(L.footX + L.dir * 1.6 * s, footYL + 0.6, 3.2 * s, 1.7 * s, 0.12 * L.dir, skinMid);
    // toes
    for (let i = 0; i < 3; i++) {
      blob(
        L.footX + L.dir * (0.4 + i * 1.35) * s,
        footYL + 1.8,
        0.9 * s, 1.15 * s, 0, skinDeep
      );
    }
  }

  // ---- SPIKED MACE ARM (back / left) — soft deltoid→bicep→forearm ----
  ctx.save();
  ctx.translate(-12.5 * s, shY + 4.5 * s);
  ctx.rotate(2.28 - swing * 0.12);
  limbSeg(0, 0, 6.5 * s, 0, 4.2 * s, 3.4 * s, skin); // upper arm
  blob(6.5 * s, 0, 2.6 * s, 2.4 * s, 0, skinMid); // elbow
  limbSeg(6.5 * s, 0, 13 * s, 0, 3.3 * s, 2.6 * s, skin); // forearm
  blob(13.2 * s, 0, 2.4 * s, 2.2 * s, 0, skinDark); // fist
  // leather wrap on haft
  ctx.fillStyle = woodEdge; ctx.fillRect(5 * s, -1.5 * s, 4.5 * s, 3 * s);
  ctx.fillStyle = wood; ctx.strokeStyle = woodEdge; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.roundRect(9 * s, -1.5 * s, 5.2 * s, 3 * s, 1.2);
  });
  // rounded spiked mace head (softer than pure rect)
  ctx.fillStyle = steelEdge; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.roundRect(13.5 * s, -4.2 * s, 11.2 * s, 8.4 * s, 2.2 * s);
  });
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.roundRect(14.2 * s, -3.4 * s, 9.8 * s, 6.8 * s, 1.6 * s);
  ctx.fill();
  ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
  const maceSpikes = [
    [15.0, -4.2, 0, -1], [19.5, -4.2, 0, -1], [24.2, 0, 1, 0],
    [15.0, 4.2, 0, 1], [19.5, 4.2, 0, 1],
  ];
  for (const [mx, my, dx, dy] of maceSpikes) {
    strokeFill(() => {
      ctx.beginPath();
      if (dx === 0) {
        ctx.moveTo(mx * s, my * s);
        ctx.lineTo((mx + 1.8) * s, my * s + dy * 4.0 * s);
        ctx.lineTo((mx + 3.6) * s, my * s);
      } else {
        ctx.moveTo(mx * s, my * s - 2.0 * s);
        ctx.lineTo(mx * s + dx * 4.2 * s, my * s);
        ctx.lineTo(mx * s, my * s + 2.0 * s);
      }
      ctx.closePath();
    });
  }
  ctx.restore();

  // ---- TORSO + SHARED TRAPEZIUS / SHOULDER YOKE ----
  // barrel torso
  blob(0, (shY + hipY) * 0.48 + 1.2 * s, 11.6 * s, 13.2 * s, 0, skin);
  // pec / ab hint
  ctx.strokeStyle = skinDeep; ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-5.2 * s, shY + 7.5 * s); ctx.quadraticCurveTo(0, shY + 9.8 * s, 5.2 * s, shY + 7.5 * s);
  ctx.moveTo(0, shY + 9.5 * s); ctx.lineTo(0, hipY - 1.5 * s);
  ctx.moveTo(-4 * s, shY + 14 * s); ctx.lineTo(4 * s, shY + 14 * s);
  ctx.moveTo(-3.6 * s, shY + 17.5 * s); ctx.lineTo(3.6 * s, shY + 17.5 * s);
  ctx.stroke();
  // one connected trapezius / collar mass (both necks grow from this)
  blob(0, shY + 1.5 * s, 13.5 * s, 5.2 * s, 0, skinMid);
  blob(-10.5 * s, shY + 4 * s, 5.6 * s, 4.6 * s, -0.15, skinDark); // L deltoid
  blob(10.5 * s, shY + 4 * s, 5.6 * s, 4.6 * s, 0.15, skinDark); // R deltoid
  // twin neck columns merging into trapezius
  limbSeg(-5.2 * s, headY + 7.5 * s, -4.2 * s, shY + 2 * s, 3.6 * s, 4.4 * s, skinDark);
  limbSeg(5.2 * s, headY + 7.5 * s, 4.2 * s, shY + 2 * s, 3.6 * s, 4.4 * s, skinDark);
  blob(0, shY - 0.5 * s, 7.5 * s, 3.8 * s, 0, skinDark); // neck join saddle

  // ---- PURPLE TUNIC + BELT / SKULL BUCKLE ----
  ctx.fillStyle = tunic; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.moveTo(-10.2 * s, shY + 9 * s);
    ctx.quadraticCurveTo(0, shY + 11 * s, 10.2 * s, shY + 9 * s);
    ctx.lineTo(9.4 * s, hipY + 7.8 * s);
    ctx.lineTo(4.4 * s, hipY + 5.6 * s);
    ctx.lineTo(1.2 * s, hipY + 8.4 * s);
    ctx.lineTo(-2.6 * s, hipY + 5.8 * s);
    ctx.lineTo(-5.6 * s, hipY + 8.2 * s);
    ctx.lineTo(-9.4 * s, hipY + 7.4 * s);
    ctx.closePath();
  });
  ctx.fillStyle = tunicDark;
  ctx.beginPath();
  ctx.moveTo(-7 * s, hipY + 4 * s); ctx.lineTo(-5.5 * s, hipY + 9.8 * s); ctx.lineTo(-3.5 * s, hipY + 5 * s);
  ctx.moveTo(3 * s, hipY + 4.5 * s); ctx.lineTo(5.2 * s, hipY + 9.4 * s); ctx.lineTo(6.5 * s, hipY + 5 * s);
  ctx.fill();
  ctx.fillStyle = belt; ctx.strokeStyle = outline; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.roundRect(-9 * s, hipY + 0.1 * s, 18 * s, 2.9 * s, 1.2);
  });
  ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
  strokeFill(() => { ctx.beginPath(); ctx.arc(0, hipY + 1.55 * s, 2.65 * s, 0, TAU); });
  ctx.fillStyle = bone;
  ctx.beginPath(); ctx.ellipse(0, hipY + 1.3 * s, 1.45 * s, 1.55 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2218';
  ctx.beginPath();
  ctx.ellipse(-0.55 * s, hipY + 1.1 * s, 0.35 * s, 0.45 * s, 0, 0, TAU);
  ctx.ellipse(0.55 * s, hipY + 1.1 * s, 0.35 * s, 0.45 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = bone;
  ctx.fillRect(-0.9 * s, hipY + 2.3 * s, 0.55 * s, 0.85 * s);
  ctx.fillRect(0.35 * s, hipY + 2.3 * s, 0.55 * s, 0.85 * s);

  // ---- PAULDRONS (armorCrack) ----
  const plates = e.maxArmor ? (e.armor > 0 ? e.armorCrack : 0) : 4;
  if (plates >= 2) {
    ctx.fillStyle = bone; ctx.strokeStyle = outline; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath(); ctx.ellipse(-12.8 * s, shY + 1.2 * s, 6.0 * s, 4.8 * s, -0.28, 0, TAU);
    });
    ctx.fillStyle = '#2a2218';
    ctx.beginPath();
    ctx.ellipse(-14.5 * s, shY + 0.5 * s, 1.35 * s, 1.55 * s, 0, 0, TAU);
    ctx.ellipse(-11.1 * s, shY + 0.35 * s, 1.25 * s, 1.45 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = bone; ctx.lineWidth = 3.2 * s;
    ctx.beginPath();
    ctx.moveTo(-15.8 * s, shY - 1.2 * s);
    ctx.quadraticCurveTo(-20.5 * s, shY - 5.5 * s, -18.8 * s, shY - 11.5 * s);
    ctx.stroke();
    ctx.strokeStyle = outline; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-15.8 * s, shY - 1.2 * s);
    ctx.quadraticCurveTo(-20.5 * s, shY - 5.5 * s, -18.8 * s, shY - 11.5 * s);
    ctx.stroke();
    if (plates === 2 && e.armor < e.maxArmor) {
      ctx.strokeStyle = outline; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-15 * s, shY - 1 * s); ctx.lineTo(-10 * s, shY + 4 * s);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = skinDeep; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-15 * s, shY); ctx.lineTo(-10 * s, shY + 5 * s);
    ctx.moveTo(-10 * s, shY); ctx.lineTo(-15 * s, shY + 5 * s);
    ctx.stroke();
  }
  if (plates >= 1) {
    ctx.fillStyle = steelBlue; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath();
      ctx.moveTo(7.2 * s, shY - 1.2 * s);
      ctx.quadraticCurveTo(13 * s, shY - 3.5 * s, 17.2 * s, shY - 2.2 * s);
      ctx.lineTo(18.8 * s, shY + 5.2 * s);
      ctx.quadraticCurveTo(12 * s, shY + 7.5 * s, 8.6 * s, shY + 6.8 * s);
      ctx.closePath();
    });
    ctx.fillStyle = flash ? '#fff' : '#c8d4e4';
    ctx.fillRect(10 * s, shY + 0.4 * s, 6 * s, 1.5);
    ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
    for (const [px, py] of [[11.5, -2.4], [14.5, -3.4], [17.2, -1.6]]) {
      strokeFill(() => {
        ctx.beginPath();
        ctx.moveTo(px * s, shY + py * s);
        ctx.lineTo((px + 1.1) * s, shY + (py - 4.2) * s);
        ctx.lineTo((px + 2.2) * s, shY + py * s);
        ctx.closePath();
      });
    }
    if (plates === 1 && e.armor < e.maxArmor) {
      ctx.strokeStyle = outline; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(9 * s, shY); ctx.lineTo(16 * s, shY + 5 * s);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = skinDeep; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(9 * s, shY); ctx.lineTo(16 * s, shY + 5 * s);
    ctx.moveTo(16 * s, shY); ctx.lineTo(9 * s, shY + 5 * s);
    ctx.stroke();
  }

  // ---- CHEST STRAPS (armorCrack plates 3–4) ----
  if (e.maxArmor) {
    const spots = [
      [-7.5, -22, 6.5, 3.6],
      [1.2, -22, 6.5, 3.6],
    ];
    for (let i = 0; i < 2; i++) {
      const need = i + 3;
      const [px, py, pw, ph] = spots[i];
      const x = px * s, y = py * s, w = pw * s, h = ph * s;
      if (plates >= need) {
        ctx.fillStyle = steel; ctx.strokeStyle = steelEdge; ctx.lineWidth = OL;
        strokeFill(() => {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 1.4);
        });
        ctx.fillStyle = flash ? '#fff' : '#c8d2e0';
        ctx.fillRect(x + 2, y + 1.5, w - 4, 1.5);
        if (plates === need && e.armor < e.maxArmor) {
          ctx.strokeStyle = outline; ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 1); ctx.lineTo(x + w * 0.6, y + h - 1);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = skinDeep; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + w - 1, y + h - 1);
        ctx.moveTo(x + w - 1, y + 1); ctx.lineTo(x + 1, y + h - 1);
        ctx.stroke();
      }
    }
  }

  // ---- CLEAVER ARM (front / right) — soft limb + red telegraph ----
  const wind = e.clawWind > 0 ? clamp(e.clawWind / CLAW_WINDUP, 0, 1) : 0;
  const strike = e.clawStrike > 0 ? clamp(e.clawStrike / CLAW_STRIKE, 0, 1) : 0;
  ctx.save();
  ctx.translate(12.5 * s, shY + 4.5 * s);
  ctx.rotate(wind > 0 ? -1.48 + (1 - wind) * 0.35
    : strike > 0 ? 0.55 + (1 - strike) * 0.9
    : -0.32 + Math.sin(t * 0.7) * 0.08);
  limbSeg(0, 0, 6.2 * s, 0, 4.2 * s, 3.3 * s, skin);
  blob(6.2 * s, 0, 2.5 * s, 2.3 * s, 0, skinMid);
  limbSeg(6.2 * s, 0, 12.2 * s, 0, 3.2 * s, 2.5 * s, skin);
  blob(12.4 * s, 0, 2.3 * s, 2.1 * s, 0, skinDark);
  ctx.fillStyle = wood; ctx.strokeStyle = woodEdge; ctx.lineWidth = OL;
  strokeFill(() => {
    ctx.beginPath();
    ctx.roundRect(8.2 * s, -1.7 * s, 5 * s, 3.4 * s, 1.1);
  });
  if (wind > 0 || strike > 0) { ctx.shadowColor = '#ff3a28'; ctx.shadowBlur = 16; }
  ctx.fillStyle = (wind > 0 || strike > 0) ? '#ff4a38' : blade;
  ctx.strokeStyle = (wind > 0 || strike > 0) ? '#ff1e14' : outline;
  ctx.lineWidth = OL + ((wind > 0 || strike > 0) ? 0.6 : 0);
  strokeFill(() => {
    ctx.beginPath();
    ctx.moveTo(12.2 * s, -5.4 * s);
    ctx.lineTo(28 * s, -4.0 * s);
    ctx.lineTo(30.2 * s, -1.0 * s);
    ctx.lineTo(28.6 * s, 5.6 * s);
    ctx.lineTo(12.2 * s, 4.0 * s);
    ctx.closePath();
  });
  ctx.strokeStyle = (wind > 0 || strike > 0) ? '#ffc9c4' : bladeEdge;
  ctx.lineWidth = 2.2 * s;
  ctx.beginPath();
  ctx.moveTo(13.2 * s, 3.4 * s);
  ctx.lineTo(28 * s, 5.0 * s);
  ctx.stroke();
  ctx.strokeStyle = outline; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(13.2 * s, -4.6 * s);
  ctx.lineTo(16.2 * s, -6.0 * s);
  ctx.lineTo(19.2 * s, -4.3 * s);
  ctx.lineTo(23.2 * s, -5.6 * s);
  ctx.lineTo(27.2 * s, -3.6 * s);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // ---- TWIN HEADS (sit on neck columns already drawn) ----
  const pulse = 0.85 + Math.sin(performance.now() / 160) * 0.15;
  for (const off of [-8.6, 8.6]) {
    const ox = off * s;
    const earDir = off < 0 ? -1 : 1;
    const hr = 5.9 * s;

    ctx.fillStyle = skin; ctx.strokeStyle = outline; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath();
      ctx.moveTo(ox + earDir * hr * 0.4, headY - 1 * s);
      ctx.lineTo(ox + earDir * (hr + 6.5 * s), headY - 4.5 * s);
      ctx.lineTo(ox + earDir * (hr + 0.6 * s), headY + 3.5 * s);
      ctx.closePath();
    });

    blob(ox, headY, hr, hr * 1.1, 0, skin);

    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.ellipse(ox + earDir * 0.6 * s, headY - 2.2 * s, hr * 0.7, hr * 0.28, earDir * 0.15, 0, TAU);
    ctx.fill();

    if (off < 0) {
      ctx.strokeStyle = skinDeep; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ox - 1.2 * s, headY - 4.5 * s);
      ctx.lineTo(ox + 0.8 * s, headY + 1.2 * s);
      ctx.stroke();
    }

    const ex = ox + earDir * 0.9 * s, ey = headY - 0.3 * s;
    const er = 2.5 * s * pulse;
    ctx.fillStyle = '#ffd428';
    ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath(); ctx.arc(ex - 0.5 * s, ey - 0.5 * s, er * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1808';
    ctx.beginPath(); ctx.arc(ex + 0.15 * s, ey + 0.15 * s, er * 0.28, 0, TAU); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.stroke();

    ctx.fillStyle = '#1a0e0c'; ctx.strokeStyle = outline; ctx.lineWidth = OL;
    strokeFill(() => {
      ctx.beginPath();
      ctx.moveTo(ox - 3.2 * s, headY + 2.8 * s);
      ctx.lineTo(ox + 3.2 * s, headY + 2.8 * s);
      ctx.lineTo(ox + 2.4 * s, headY + 5.8 * s);
      ctx.lineTo(ox - 2.4 * s, headY + 5.8 * s);
      ctx.closePath();
    });
    ctx.fillStyle = '#f0ead8';
    for (let i = 0; i < 4; i++) {
      const tx = ox - 2.2 * s + i * 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(tx, headY + 2.9 * s);
      ctx.lineTo(tx + 0.55 * s, headY + 4.4 * s);
      ctx.lineTo(tx + 1.1 * s, headY + 2.9 * s);
      ctx.fill();
    }
    ctx.fillStyle = bone; ctx.strokeStyle = outline; ctx.lineWidth = 1.5;
    for (const tdx of [-1.6, 1.0]) {
      strokeFill(() => {
        ctx.beginPath();
        ctx.moveTo(ox + tdx * s, headY + 5.2 * s);
        ctx.lineTo(ox + (tdx + 0.55) * s, headY + 8.2 * s);
        ctx.lineTo(ox + (tdx + 1.1) * s, headY + 5.2 * s);
        ctx.closePath();
      });
    }
  }

  ctx.restore();
}

// ================== COMPANION SPRITES (v2.8) ======================
// Rover: quadruped robot dog with a cyan visor. Warden/Scout reuse the
// shared humanoid rig with cannon/crossbow arms.
//
// ============ ASHEN ROVER / RIFT HOUND SPRITES (drafted; flag OFF) ============
// assets/allies/rover/{idle,walk,attack,death}.png — companion footprint, NOT boss.
// Flag OFF: live procedural drawRover. Flag ON: sheets at drawH=26, collision r=11 unchanged.
const ROVER_SPRITE_ENABLED = false;
const ROVER_SPRITE_DRAWH = 26; // SIZE LOCK — matches procedural ~21 chassis + pad; << husk 56 / Gharok 228
const roverSpr = { idle: null, walk: null, attack: null, death: null, ok: false };
(function loadRoverSprites() {
  if (!ROVER_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) roverSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) roverSpr.ok = good > 0; };
    img.src = 'assets/allies/rover/' + k + '.png';
    roverSpr[k] = img;
  }
})();

function roverSpriteReady(img) {
  return !!(ROVER_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function roverSpriteFrame(c) {
  if (c.downed && roverSpriteReady(roverSpr.death)) return roverSpr.death;
  if ((c.swipeT || 0) > 0 && roverSpriteReady(roverSpr.attack)) return roverSpr.attack;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  if (moving && roverSpriteReady(roverSpr.walk) && roverSpriteReady(roverSpr.idle)) {
    return (Math.floor((c.walk || 0) / Math.PI) & 1) ? roverSpr.walk : roverSpr.idle;
  }
  if (roverSpriteReady(roverSpr.idle)) return roverSpr.idle;
  if (roverSpriteReady(roverSpr.walk)) return roverSpr.walk;
  if (roverSpriteReady(roverSpr.attack)) return roverSpr.attack;
  return null;
}

function drawRoverSprite(c) {
  if (!ROVER_SPRITE_ENABLED) return false;
  const img = roverSpriteFrame(c);
  if (!img) return false;
  const drawH = ROVER_SPRITE_DRAWH; // 26 — companion dog, not boss
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const bite = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  const flash = c.hurtT > 0.35;
  const bob = moving ? Math.abs(Math.sin(t)) * 1.2
    : (swipe > 0) ? 0.5
    : Math.abs(Math.sin(t * 0.5)) * 0.35;
  const lean = moving ? Math.sin(t) * 0.04
    : bite > 0.4 ? 0.08
    : flash ? -0.06
    : 0;

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 + bite * 2, 4.5, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.15);
  else ctx.rotate(lean);

  if (bite > 0.25 && !c.downed) {
    ctx.save();
    ctx.globalAlpha *= 0.35 + bite * 0.35;
    ctx.shadowColor = '#4de1ff';
    ctx.shadowBlur = 8 + bite * 6;
    ctx.fillStyle = `rgba(158,240,255,${0.12 + bite * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.22, -drawH * 0.45, 5 + bite * 3, 4 + bite * 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

function drawRover(c) {
  if (drawRoverSprite(c)) return;
  const flash = c.hurtT > 0.35;
  const body = flash ? '#fff' : '#8d99ae';
  const dark = flash ? '#fff' : '#5a6478';
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const bite = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 + bite, 4.5, 0, 0, TAU); ctx.fill();
  ctx.scale(c.facing, 1);
  if (c.downed) { ctx.globalAlpha = 0.45; ctx.rotate(0.5); }
  else if (flash) ctx.rotate(-0.08);
  else if (bite > 0.4) ctx.rotate(0.1);
  const t = c.walk;
  const amp = moving ? 5.2 : 1.2;
  const bob = moving ? Math.abs(Math.sin(t)) * 1.4 : Math.abs(Math.sin(t * 0.5)) * 0.4;
  ctx.translate(0, -bob);
  ctx.lineCap = 'round';
  // 4 trotting legs (diagonal pairs in phase) — SIZE LOCK chassis
  ctx.strokeStyle = dark; ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-8, -10); ctx.lineTo(-8 + Math.sin(t) * amp, 0);
  ctx.moveTo(-3, -10); ctx.lineTo(-3 - Math.sin(t) * amp, 0);
  ctx.moveTo(4, -10);  ctx.lineTo(4 - Math.sin(t) * amp, 0);
  ctx.moveTo(9, -10);  ctx.lineTo(9 + Math.sin(t) * amp, 0);
  ctx.stroke();
  // body chassis
  ctx.fillStyle = body; ctx.strokeStyle = dark; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, -10); ctx.lineTo(10, -11.5); ctx.lineTo(11, -16.5) ; ctx.lineTo(-10, -16);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // head block + snout (lunge on bite)
  const hx = bite * 3;
  ctx.fillStyle = body;
  ctx.fillRect(8 + hx, -21, 9, 7);
  ctx.fillRect(15 + hx, -19, 4.5 + bite * 2, 4);
  // cyan visor strip
  ctx.fillStyle = flash ? '#fff' : '#4de1ff';
  ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 7;
  ctx.fillRect(11 + hx, -19.5, 5, 2.6);
  ctx.shadowBlur = 0;
  // plasma jaw glow on bite / recent atk
  if ((bite > 0 || c.atkCd > compInterval(c) - 0.18) && !c.downed) {
    ctx.fillStyle = '#9ef0ff';
    ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 8 + bite * 6;
    ctx.beginPath(); ctx.arc(18 + hx, -15.5, 2.4 + bite * 1.5, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // antenna tail
  ctx.strokeStyle = dark; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-11, -15); ctx.lineTo(-16, -22 + Math.sin(t * 1.3) * 1.5); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#ff9d2e';
  ctx.beginPath(); ctx.arc(-16, -22 + Math.sin(t * 1.3) * 1.5, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}
function companionFigure(c) {
  const base = {
    walk: c.walk, facing: c.facing, moving: Math.hypot(c.vx, c.vy) > 20,
    flash: c.hurtT > 0.35 ? 0.1 : 0,
    alpha: c.downed ? 0.45 : 1,
    gunAngle: c.facing === 1 ? c.aim : Math.PI - c.aim,
    swipe: c.swipeT || 0,
    hurtRecoil: c.hurtT > 0.35,
  };
  if (c.type === 'warden') return { ...base, s: 1.25, bulk: 1.5, skin: '#9aa7b8', cloth: '#5a6478',
    pauldron: '#7e8ba0', legs: '#3c4454', helmet: '#6b7686', glowEyes: '#3ef0c8', weapon: 'cannon' };
  if (c.type === 'sentinel') return { ...base, s: 1.15, bulk: 1.25, skin: '#c4a078', cloth: '#5a4030',
    pauldron: '#8a6a48', legs: '#3a3028', helmet: '#6a5040', glowEyes: '#ffb02e', weapon: 'crossbow' };
  return { ...base, s: 1.0, skin: '#d8a87e', cloth: '#3e5a48', hood: '#2e4438',
    legs: '#2e4038', weapon: 'crossbow' };
}
function drawCompanion(c) {
  if (c.type === 'rover') drawRover(c);
  else drawFigure(c.x, c.y, companionFigure(c));
  // downed marker
  if (c.downed) {
    ctx.fillStyle = '#ff8a93';
    ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.strokeText('✚ DOWN', c.x, c.y - 34);
    ctx.fillText('✚ DOWN', c.x, c.y - 34);
    if (reviveChan.kind === 'comp' && reviveChan.id === c.type)
      drawReviveProgress(c.x, c.y, reviveChan.t / REVIVE_HOLD_SEC);
  } else if (c.hp < c.maxHp) {
    const w = 26;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(c.x - w / 2, c.y - 34, w, 3.5);
    ctx.fillStyle = '#4de1ff';
    ctx.fillRect(c.x - w / 2, c.y - 34, w * clamp(c.hp / c.maxHp, 0, 1), 3.5);
  }
  // tiny name tag
  ctx.font = '9px Segoe UI'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2.5;
  ctx.strokeText(COMP_TYPES[c.type].name, c.x, c.y + 11);
  ctx.fillStyle = 'rgba(158,240,255,0.85)';
  ctx.fillText(COMP_TYPES[c.type].name, c.x, c.y + 11);
}

function drawLaborer(L) {
  if (L.insideMine) return; // working underground
  const t = L.walk || 0;
  const moving = Math.hypot(L.vx || 0, L.vy || 0) > 8;
  const bob = moving ? Math.abs(Math.sin(t)) * 1.8 : Math.sin(t * 0.5) * 0.6;
  const swing = moving ? Math.sin(t) * 3.2 : 0;
  const chop = !L.downed && (L.order === 'chop' || L.order === 'mine') && L.gatherT > 0
    ? Math.sin(performance.now() / 90) * 0.5 + 0.5 : 0;
  const defendSwing = !L.downed && (L.swipeT || 0) > 0 ? (1 - L.swipeT / UNIT_SWIPE) : 0;
  ctx.save();
  ctx.translate(L.x, L.y);
  ctx.scale(L.facing, 1);
  ctx.globalAlpha = L.downed ? 0.45 : 1;
  // shadow — SIZE LOCK (r≈11 footprint)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 2, 8, 3, 0, 0, TAU); ctx.fill();
  // swinging legs
  ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -6 + bob); ctx.lineTo(-2 + swing, 2);
  ctx.moveTo(2, -6 + bob); ctx.lineTo(2 - swing, 2);
  ctx.stroke();
  // torso + head (same bounding box as before)
  ctx.fillStyle = L.hurtT > 0.2 ? '#fff' : '#b8895a';
  ctx.fillRect(-5, -16 + bob, 10, 12);
  ctx.fillStyle = '#d2a878';
  ctx.beginPath(); ctx.arc(0, -20 + bob, 5, 0, TAU); ctx.fill();
  // arms — axe/pick swing when gathering / defend swipe
  ctx.strokeStyle = L.hurtT > 0.2 ? '#fff' : '#c4a078'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-4, -14 + bob); ctx.lineTo(-6 - swing * 0.4, -6 + bob);
  ctx.moveTo(4, -14 + bob);
  if (chop > 0 || defendSwing > 0) {
    const ang = -1.1 + (chop || defendSwing) * 1.8;
    ctx.lineTo(4 + Math.cos(ang) * 9, -14 + bob + Math.sin(ang) * 9);
  } else {
    ctx.lineTo(6 + swing * 0.4, -6 + bob);
  }
  ctx.stroke();
  if (chop > 0 || defendSwing > 0) {
    ctx.strokeStyle = '#8a7050'; ctx.lineWidth = 2;
    const ang = -1.1 + (chop || defendSwing) * 1.8;
    ctx.beginPath();
    ctx.moveTo(4 + Math.cos(ang) * 9, -14 + bob + Math.sin(ang) * 9);
    ctx.lineTo(4 + Math.cos(ang) * 14, -14 + bob + Math.sin(ang) * 14);
    ctx.stroke();
  }
  if (L.carry) {
    ctx.fillStyle = L.carry.type === 'wood' ? '#7a9a5a' : '#ffd54a';
    ctx.fillRect(6, -14 + bob, 7, 6);
  }
  ctx.restore();
  if (L.downed) {
    ctx.fillStyle = '#ff8a93';
    ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.strokeText('✚ DOWN', L.x, L.y - 34);
    ctx.fillText('✚ DOWN', L.x, L.y - 34);
    if (reviveChan.kind === 'laborer' && reviveChan.id === L.id)
      drawReviveProgress(L.x, L.y, reviveChan.t / REVIVE_HOLD_SEC);
  } else if (L.hp < L.maxHp) {
    const w = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(L.x - w / 2, L.y - 32, w, 3);
    ctx.fillStyle = '#c8a06a';
    ctx.fillRect(L.x - w / 2, L.y - 32, w * clamp(L.hp / L.maxHp, 0, 1), 3);
  }
  if (selectedUnit && selectedUnit.kind === 'laborer' && selectedUnit.ref === L) {
    ctx.strokeStyle = 'rgba(124,252,0,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(L.x, L.y, 16, 0, TAU); ctx.stroke();
  }
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200,160,106,0.9)';
  ctx.fillText(L.downed ? 'Laborer' : L.order === 'mine' ? 'Mine' : L.order === 'chop' ? 'Chop' : 'Laborer', L.x, L.y + 12);
}
function drawMilitia(m) {
  const tMeta = MILITIA_TYPES[m.kind];
  const fig = {
    walk: m.walk, facing: m.facing,
    moving: Math.hypot(m.vx || 0, m.vy || 0) > 16,
    flash: m.hurtT > 0.2 ? 0.1 : 0,
    swipe: m.swipeT || 0,
    hurtRecoil: m.hurtT > 0.2,
    // SIZE LOCK — keep near prior box silhouette (head ~-22 / total ~28px)
    s: 0.78, skin: '#c8b090',
    cloth: m.kind === 'bow' ? '#6a7a58' : '#5a6878',
    legs: '#3a4038',
    weapon: m.kind === 'bow' ? 'bow' : 'spear',
    gunAngle: m.facing === 1 ? (m.aim || 0) : Math.PI - (m.aim || 0),
    alpha: m.downed ? 0.45 : 1,
  };
  drawFigure(m.x, m.y, fig);
  if (m.downed) {
    ctx.fillStyle = '#ff8a93';
    ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.strokeText('✚ DOWN', m.x, m.y - 34);
    ctx.fillText('✚ DOWN', m.x, m.y - 34);
    if (reviveChan.kind === 'militia' && reviveChan.id === m.id)
      drawReviveProgress(m.x, m.y, reviveChan.t / REVIVE_HOLD_SEC);
  } else if (m.hp < m.maxHp) {
    const w = 26;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(m.x - w / 2, m.y - 34, w, 3.5);
    ctx.fillStyle = '#9ef0ff';
    ctx.fillRect(m.x - w / 2, m.y - 34, w * clamp(m.hp / m.maxHp, 0, 1), 3.5);
  }
  if (selectedUnit && selectedUnit.kind === 'militia' && selectedUnit.ref === m) {
    ctx.strokeStyle = 'rgba(158,240,255,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(m.x, m.y, 17, 0, TAU); ctx.stroke();
  }
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(158,240,255,0.9)';
  ctx.fillText(tMeta.name.replace('Ashen ', ''), m.x, m.y + 12);
}
// Rift Keep building sheets — soft-wire OFF until building-art ship batch.
// Collision r stays STRUCT_KINDS.keep.r (54). Flag ON → drawH=72 (near procedural ~56 tall, << Gharok).
const KEEP_SPRITE_ENABLED = false;
const KEEP_SPRITE_DRAWH = 72; // SIZE LOCK — keep footprint, not Gharok-huge
const keepSpr = { idle: null, damaged: null, ok: false };
(function loadKeepSprites() {
  if (!KEEP_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'damaged'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) keepSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) keepSpr.ok = good > 0; };
    img.src = 'assets/buildings/keep/' + k + '.png';
    keepSpr[k] = img;
  }
})();
function keepSpriteReady(img) {
  return !!(KEEP_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawKeepSprite(s) {
  if (!KEEP_SPRITE_ENABLED || s.kind !== 'keep') return false;
  const hurt = s.hp < s.maxHp * 0.45;
  const img = (hurt && keepSpriteReady(keepSpr.damaged)) ? keepSpr.damaged
    : keepSpriteReady(keepSpr.idle) ? keepSpr.idle
    : keepSpriteReady(keepSpr.damaged) ? keepSpr.damaged
    : null;
  if (!img) return false;
  const drawH = KEEP_SPRITE_DRAWH;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, s.x - drawW / 2, s.y - drawH + 2, drawW, drawH);
  return true;
}
// Timber Camp / Supply Camp sheets — soft-wire OFF until building-art ship batch.
// Collision r stays STRUCT_KINDS (timber 40 / farm=Supply 36). Flag ON → camp-tall drawH (<< Keep 72 / Gharok).
const CAMP_SPRITE_ENABLED = false; // master gate
const TIMBER_SPRITE_ENABLED = false; // per-type (also requires CAMP_SPRITE_ENABLED)
const SUPPLY_SPRITE_ENABLED = false;
const TIMBER_SPRITE_DRAWH = 50; // SIZE LOCK — timber footprint (procedural ~32×40)
const SUPPLY_SPRITE_DRAWH = 46; // SIZE LOCK — supply/farm footprint (procedural ~32×28)
const campSpr = {
  idle: null, damaged: null,
  timberIdle: null, timberDamaged: null,
  supplyIdle: null, supplyDamaged: null,
  ok: false,
};
(function loadCampSprites() {
  if (!CAMP_SPRITE_ENABLED) return; // soft-load only when master enabled
  const keys = [
    ['idle', 'idle'], ['damaged', 'damaged'],
    ['timberIdle', 'timber-idle'], ['timberDamaged', 'timber-damaged'],
    ['supplyIdle', 'supply-idle'], ['supplyDamaged', 'supply-damaged'],
  ];
  let left = keys.length, good = 0;
  for (const [prop, file] of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) campSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) campSpr.ok = good > 0; };
    img.src = 'assets/buildings/camp/' + file + '.png';
    campSpr[prop] = img;
  }
})();
function campSpriteReady(img) {
  return !!(CAMP_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawCampSprite(s) {
  if (!CAMP_SPRITE_ENABLED) return false;
  let drawH = 0, idle = null, damaged = null;
  if (s.kind === 'timber' && TIMBER_SPRITE_ENABLED) {
    drawH = TIMBER_SPRITE_DRAWH;
    idle = campSpr.timberIdle || campSpr.idle;
    damaged = campSpr.timberDamaged || campSpr.damaged;
  } else if (s.kind === 'farm' && SUPPLY_SPRITE_ENABLED) {
    drawH = SUPPLY_SPRITE_DRAWH;
    idle = campSpr.supplyIdle || campSpr.idle;
    damaged = campSpr.supplyDamaged || campSpr.damaged;
  } else {
    return false;
  }
  const hurt = s.hp < s.maxHp * 0.45;
  const img = (hurt && campSpriteReady(damaged)) ? damaged
    : campSpriteReady(idle) ? idle
    : campSpriteReady(damaged) ? damaged
    : null;
  if (!img) return false;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, s.x - drawW / 2, s.y - drawH + 2, drawW, drawH);
  return drawH;
}
// Muster Hall sheets — soft-wire OFF until building-art ship batch.
// Collision r stays STRUCT_KINDS.muster.r (46). Flag ON → drawH=60 (between camp ~50 and Keep 72).
const HALL_SPRITE_ENABLED = false;
const HALL_SPRITE_DRAWH = 60; // SIZE LOCK — training hall, not cathedral / Keep
const hallSpr = { idle: null, damaged: null, ok: false };
(function loadHallSprites() {
  if (!HALL_SPRITE_ENABLED) return;
  const keys = ['idle', 'damaged'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) hallSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) hallSpr.ok = good > 0; };
    img.src = 'assets/buildings/hall/' + k + '.png';
    hallSpr[k] = img;
  }
})();
function hallSpriteReady(img) {
  return !!(HALL_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawHallSprite(s) {
  if (!HALL_SPRITE_ENABLED || s.kind !== 'muster') return false;
  const hurt = s.hp < s.maxHp * 0.45;
  const img = (hurt && hallSpriteReady(hallSpr.damaged)) ? hallSpr.damaged
    : hallSpriteReady(hallSpr.idle) ? hallSpr.idle
    : hallSpriteReady(hallSpr.damaged) ? hallSpr.damaged
    : null;
  if (!img) return false;
  const drawH = HALL_SPRITE_DRAWH;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, s.x - drawW / 2, s.y - drawH + 2, drawW, drawH);
  return true;
}
// Gold Vault sheets — soft-wire OFF until building-art ship batch.
// Collision r stays STRUCT_KINDS.golddepot.r (40). Flag ON → drawH=52 (stockier than hall 60).
const VAULT_SPRITE_ENABLED = false;
const VAULT_SPRITE_DRAWH = 52; // SIZE LOCK — squat mine-mouth bunker, << hall / Keep
const vaultSpr = { idle: null, damaged: null, ok: false };
(function loadVaultSprites() {
  if (!VAULT_SPRITE_ENABLED) return;
  const keys = ['idle', 'damaged'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) vaultSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) vaultSpr.ok = good > 0; };
    img.src = 'assets/buildings/vault/' + k + '.png';
    vaultSpr[k] = img;
  }
})();
function vaultSpriteReady(img) {
  return !!(VAULT_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawVaultSprite(s) {
  if (!VAULT_SPRITE_ENABLED || s.kind !== 'golddepot') return false;
  const hurt = s.hp < s.maxHp * 0.45;
  const img = (hurt && vaultSpriteReady(vaultSpr.damaged)) ? vaultSpr.damaged
    : vaultSpriteReady(vaultSpr.idle) ? vaultSpr.idle
    : vaultSpriteReady(vaultSpr.damaged) ? vaultSpr.damaged
    : null;
  if (!img) return false;
  const drawH = VAULT_SPRITE_DRAWH;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, s.x - drawW / 2, s.y - drawH + 2, drawW, drawH);
  return true;
}
// Aether Pit sheets — soft-wire OFF until building-art ship batch.
// Collision r stays STRUCT_KINDS.aetherpit.r (38). Flag ON → drawH=48 (low crater; between supply 46 and vault 52).
const PIT_SPRITE_ENABLED = false;
const PIT_SPRITE_DRAWH = 48; // SIZE LOCK — dug crater / well, squat << hall / Keep
const pitSpr = { idle: null, damaged: null, ok: false };
(function loadPitSprites() {
  if (!PIT_SPRITE_ENABLED) return;
  const keys = ['idle', 'damaged'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) pitSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) pitSpr.ok = good > 0; };
    img.src = 'assets/buildings/pit/' + k + '.png';
    pitSpr[k] = img;
  }
})();
function pitSpriteReady(img) {
  return !!(PIT_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawPitSprite(s) {
  if (!PIT_SPRITE_ENABLED || s.kind !== 'aetherpit') return false;
  const hurt = s.hp < s.maxHp * 0.45;
  const img = (hurt && pitSpriteReady(pitSpr.damaged)) ? pitSpr.damaged
    : pitSpriteReady(pitSpr.idle) ? pitSpr.idle
    : pitSpriteReady(pitSpr.damaged) ? pitSpr.damaged
    : null;
  if (!img) return false;
  const drawH = PIT_SPRITE_DRAWH;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, s.x - drawW / 2, s.y - drawH + 2, drawW, drawH);
  return true;
}
// Cloister / brick stronghold modular sheets — systems ON for master testing;
// store ship deferred with Continuity + building-art batch.
const brickWallSpr = {
  pillar: null, pillarDamaged: null,
  segment: null, segmentDamaged: null,
  corner: null, tee: null, ok: false,
};
(function loadBrickWallSprites() {
  if (!BRICKWALL_SPRITE_ENABLED) return;
  const keys = [
    ['pillar', 'pillar'], ['pillarDamaged', 'pillar-damaged'],
    ['segment', 'segment'], ['segmentDamaged', 'segment-damaged'],
    ['corner', 'corner'], ['tee', 'tee'],
  ];
  let left = keys.length, good = 0;
  for (const [prop, file] of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) brickWallSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) brickWallSpr.ok = good > 0; };
    img.src = 'assets/buildings/brickwall/' + file + '.png';
    brickWallSpr[prop] = img;
  }
})();
function brickWallSpriteReady(img) {
  return !!(BRICKWALL_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}
function drawBrickWallProceduralPillar(w, hurt) {
  const pulse = 0.85 + Math.sin(performance.now() / 280 + w.x) * 0.1;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(w.x, w.y + 2, 10, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hurt ? '#7a4a32' : '#a85a38';
  ctx.strokeStyle = '#5a3420'; ctx.lineWidth = 1.5;
  ctx.fillRect(w.x - 7, w.y - 28, 14, 28);
  ctx.strokeRect(w.x - 7, w.y - 28, 14, 28);
  ctx.fillStyle = '#c8c0b0';
  ctx.beginPath();
  ctx.moveTo(w.x, w.y - 40); ctx.lineTo(w.x + 8, w.y - 30); ctx.lineTo(w.x - 8, w.y - 30);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = 'rgba(200,160,106,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(w.x, w.y, w.r + 2, 0, TAU); ctx.stroke();
  ctx.globalAlpha = 1;
}
function drawBrickWallSegmentBetween(a, b, hurt) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const len = Math.hypot(b.x - a.x, b.y - a.y) - 16;
  if (len < 8) return;
  const segImg = (hurt && brickWallSpriteReady(brickWallSpr.segmentDamaged))
    ? brickWallSpr.segmentDamaged
    : brickWallSpriteReady(brickWallSpr.segment) ? brickWallSpr.segment : null;
  if (segImg) {
    const drawH = BRICKWALL_SEG_DRAWH;
    const drawW = Math.min(len + 8, drawH * (segImg.naturalWidth / segImg.naturalHeight));
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.drawImage(segImg, -drawW / 2, -drawH + 4, drawW, drawH);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.fillStyle = hurt ? '#6e4430' : '#9a5535';
  ctx.fillRect(-len / 2, -10, len, 12);
  ctx.fillStyle = '#b8b0a0';
  ctx.fillRect(-len / 2, -14, len, 4);
  ctx.strokeStyle = '#2a2830'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const px = -len / 2 + 6 + i * (len - 12) / 4;
    ctx.beginPath(); ctx.moveTo(px, -14); ctx.lineTo(px, -26); ctx.stroke();
  }
  ctx.restore();
}
function drawBrickWallPillar(w) {
  const hurt = w.hp < w.maxHp * 0.45;
  const jt = brickWallJunctionType(w);
  let img = null;
  if (jt === 'tee' && brickWallSpriteReady(brickWallSpr.tee)) img = brickWallSpr.tee;
  else if (jt === 'corner' && brickWallSpriteReady(brickWallSpr.corner)) img = brickWallSpr.corner;
  else if (hurt && brickWallSpriteReady(brickWallSpr.pillarDamaged)) img = brickWallSpr.pillarDamaged;
  else if (brickWallSpriteReady(brickWallSpr.pillar)) img = brickWallSpr.pillar;
  if (img) {
    const drawH = BRICKWALL_SPRITE_DRAWH;
    const drawW = drawH * (img.naturalWidth / img.naturalHeight);
    ctx.drawImage(img, w.x - drawW / 2, w.y - drawH + 2, drawW, drawH);
  } else {
    drawBrickWallProceduralPillar(w, hurt);
  }
  if (w.hp < w.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(w.x - 16, w.y - 42, 32, 3.5);
    ctx.fillStyle = '#c8a06a';
    ctx.fillRect(w.x - 16, w.y - 42, 32 * clamp(w.hp / w.maxHp, 0, 1), 3.5);
  }
  if ((w.neighbors || 0) > 0) {
    ctx.font = 'bold 8px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200,160,106,0.9)';
    const tag = jt === 'tee' ? 'T' : jt === 'corner' ? '⌞' : jt === 'cross' ? '+' : 'LINK×' + w.neighbors;
    ctx.fillText(tag, w.x, w.y + w.r + 11);
  }
}
function drawStructure(s) {
  const def = STRUCT_KINDS[s.kind];
  const pulse = 0.7 + Math.sin(performance.now() / 280 + s.x) * 0.2;
  const colMap = {
    keep: '255,213,74', timber: '200,160,106', farm: '124,180,90',
    golddepot: '255,200,80', muster: '176,77,255', aetherpit: '77,225,255',
  };
  const col = colMap[s.kind] || '200,160,106';
  ctx.strokeStyle = `rgba(${col},${0.55 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
  ctx.fillStyle = `rgba(${col},0.1)`;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
  // Keep / camp / hall / vault / pit sheets when flags ON; other kinds / fallback stay procedural
  const usedKeepSpr = drawKeepSprite(s);
  const usedCampH = usedKeepSpr ? false : drawCampSprite(s);
  const usedHallSpr = (usedKeepSpr || usedCampH) ? false : drawHallSprite(s);
  const usedVaultSpr = (usedKeepSpr || usedCampH || usedHallSpr) ? false : drawVaultSprite(s);
  const usedPitSpr = (usedKeepSpr || usedCampH || usedHallSpr || usedVaultSpr) ? false : drawPitSprite(s);
  // building body — Keep is taller (skipped when building sprite draws)
  const bw = s.kind === 'keep' ? 42 : 32, bh = s.kind === 'keep' ? 40 : 28;
  if (!usedKeepSpr && !usedCampH && !usedHallSpr && !usedVaultSpr && !usedPitSpr) {
    ctx.fillStyle = '#2a2218';
    ctx.fillRect(s.x - bw / 2, s.y - bh, bw, bh);
    ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 2;
    ctx.strokeRect(s.x - bw / 2, s.y - bh, bw, bh);
    if (s.kind === 'keep') {
      ctx.fillStyle = `rgba(${col},${pulse})`;
      ctx.fillRect(s.x - 8, s.y - bh - 16, 16, 16);
      ctx.fillRect(s.x - bw / 2 - 4, s.y - bh - 6, 10, 14);
      ctx.fillRect(s.x + bw / 2 - 6, s.y - bh - 6, 10, 14);
    } else if (s.kind === 'farm') {
      ctx.fillStyle = '#6a8a40';
      ctx.fillRect(s.x - 18, s.y - 8, 36, 6);
    } else {
      ctx.fillStyle = `rgba(${col},${pulse})`;
      ctx.fillRect(s.x - 10, s.y - bh - 12, 20, 12);
    }
  }
  const barH = usedKeepSpr ? KEEP_SPRITE_DRAWH
    : usedHallSpr ? HALL_SPRITE_DRAWH
    : usedVaultSpr ? VAULT_SPRITE_DRAWH
    : usedPitSpr ? PIT_SPRITE_DRAWH
    : (usedCampH || bh);
  const w = 34;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(s.x - w / 2, s.y - barH - 20, w, 3.5);
  ctx.fillStyle = `rgb(${col})`;
  ctx.fillRect(s.x - w / 2, s.y - barH - 20, w * clamp(s.hp / s.maxHp, 0, 1), 3.5);
  ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 3;
  const label = (def ? def.name : s.kind) + ' L' + s.lvl;
  ctx.strokeText(label, s.x, s.y + 14);
  ctx.fillStyle = `rgba(${col},0.95)`;
  ctx.fillText(label, s.x, s.y + 14);
}
function drawGoldVein(v) {
  // WC2-style mine building (v2.11)
  const pulse = 0.6 + Math.sin(performance.now() / 200 + v.x) * 0.25;
  ctx.fillStyle = `rgba(255,213,74,${0.12 * pulse})`;
  ctx.beginPath(); ctx.arc(v.x, v.y, v.r + 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a3228';
  ctx.fillRect(v.x - 18, v.y - 22, 36, 24);
  ctx.strokeStyle = `rgba(255,213,74,${0.7 * pulse})`; ctx.lineWidth = 2;
  ctx.strokeRect(v.x - 18, v.y - 22, 36, 24);
  // entrance arch
  ctx.fillStyle = '#1a1410';
  ctx.beginPath(); ctx.arc(v.x, v.y - 2, 9, Math.PI, 0); ctx.fill();
  ctx.fillRect(v.x - 9, v.y - 2, 18, 10);
  // ore sparkles
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath(); ctx.arc(v.x - 12, v.y - 16, 3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(v.x + 10, v.y - 14, 2.5, 0, TAU); ctx.fill();
  ctx.font = 'bold 8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,213,74,0.9)';
  ctx.fillText('Mine · ◈' + v.goldLeft, v.x, v.y + 18);
}
function drawForestStand(fs) {
  ctx.strokeStyle = 'rgba(90,140,70,0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.arc(fs.x, fs.y, fs.r, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
}
function drawColossus(c) {
  const t = c.walk || performance.now() / 1000;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 10;
  const swipe = c.swipeT || 0;
  const strike = swipe > 0 && swipe <= UNIT_SWIPE * 0.55 ? 1 - swipe / (UNIT_SWIPE * 0.55) : 0;
  const wind = swipe > UNIT_SWIPE * 0.55 ? (swipe - UNIT_SWIPE * 0.55) / (UNIT_SWIPE * 0.45) : 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 4 : Math.abs(Math.sin(t * 0.6)) * 1.2;
  const lean = strike * 0.12 - wind * 0.06;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.facing, 1);
  ctx.rotate(lean);
  // Gharok-scale silhouette (collision r=54, tall sprite) — SIZE LOCK
  const H = 210;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 8, 42 + strike * 4, 14, 0, 0, TAU); ctx.fill();
  const grd = ctx.createLinearGradient(0, -H + bob, 0, 10);
  grd.addColorStop(0, '#e0b8ff');
  grd.addColorStop(0.4, '#7a3db8');
  grd.addColorStop(1, '#2a1840');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(-28, 0); ctx.lineTo(-36, -H * 0.45 + bob); ctx.lineTo(-18, -H * 0.72 + bob);
  ctx.lineTo(0, -H + bob); ctx.lineTo(18, -H * 0.72 + bob); ctx.lineTo(36, -H * 0.45 + bob); ctx.lineTo(28, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(176,77,255,0.85)'; ctx.lineWidth = 3;
  ctx.stroke();
  // swinging arm mass
  ctx.fillStyle = '#5a3088';
  const armAng = moving ? Math.sin(t) * 0.35 : Math.sin(t * 0.5) * 0.08;
  const ax = 30 + Math.cos(-0.4 + armAng - wind * 0.8 + strike * 1.4) * 28;
  const ay = -H * 0.5 + bob + Math.sin(-0.4 + armAng - wind * 0.8 + strike * 1.4) * 28;
  ctx.beginPath(); ctx.ellipse(ax, ay, 14, 10, armAng, 0, TAU); ctx.fill();
  if (strike > 0) {
    ctx.strokeStyle = `rgba(176,77,255,${0.6 * strike})`;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(10, -H * 0.4, 55, -0.8, 0.9); ctx.stroke();
  }
  // visor glow
  ctx.fillStyle = '#9ef0ff';
  ctx.shadowColor = '#b04dff'; ctx.shadowBlur = 16;
  ctx.fillRect(-14, -H * 0.78 + bob, 28, 10);
  ctx.shadowBlur = 0;
  // stomping feet bob
  ctx.fillStyle = '#1a1028';
  ctx.fillRect(-30, -6 + Math.sin(t * 2) * (moving ? 3 : 1), 18, 12);
  ctx.fillRect(12, -6 + Math.sin(t * 2 + 1) * (moving ? 3 : 1), 18, 12);
  ctx.restore();
  // bars / name — keep HP bar offset consistent with prior layout
  const w = 56;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(c.x - w / 2, c.y - 58, w, 5);
  ctx.fillStyle = '#b04dff';
  ctx.fillRect(c.x - w / 2, c.y - 58, w * clamp(c.hp / c.maxHp, 0, 1), 5);
  ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
  ctx.strokeText('AETHER COLOSSUS', c.x, c.y + 20);
  ctx.fillStyle = '#e0b8ff';
  ctx.fillText('AETHER COLOSSUS', c.x, c.y + 20);
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
    } else if (p.type === 'pack') { // scout's supply pack: green box, cyan cross
      ctx.fillStyle = '#2e6a3a'; ctx.shadowColor = '#7CFC00'; ctx.shadowBlur = 10;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#9ef0ff';
      ctx.fillRect(-6, -2, 12, 4); ctx.fillRect(-2, -6, 4, 12);
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
      else if (n.role === 'riftnet') { mark = '◎'; mcolor = '#4de1ff'; }
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
      const linked = (b.neighbors || 0) >= 1;
      const col = linked ? '158,240,255' : '124,252,0';
      // adjacency link beams (visual hint for fortified merge)
      if (linked) {
        for (const o of barricades) {
          if (o === b || o.x < b.x || o.y < b.y - 0.01) continue; // draw each link once
          if (dist2(b.x, b.y, o.x, o.y) > BARRICADE_LINK_DIST * BARRICADE_LINK_DIST) continue;
          ctx.strokeStyle = `rgba(158,240,255,${0.35 + pulse * 0.25})`;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.moveTo(b.x, b.y - 8); ctx.lineTo(o.x, o.y - 8); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // energy dome wall (doubled radius when linked)
      ctx.strokeStyle = `rgba(${col},${0.5 * pulse})`;
      ctx.lineWidth = linked ? 4.5 : 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(${col},${(linked ? 0.12 : 0.08) * pulse})`;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      if (linked) {
        ctx.strokeStyle = `rgba(255,255,255,${0.2 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.72, 0, TAU); ctx.stroke();
      }
      // emitter pylon
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 8, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2c3a2c'; ctx.strokeStyle = linked ? '#6a9aaa' : '#4a6a4a'; ctx.lineWidth = 2;
      ctx.fillRect(b.x - 4, b.y - 20, 8, 20); ctx.strokeRect(b.x - 4, b.y - 20, 8, 20);
      ctx.fillStyle = `rgba(${col},${pulse})`;
      ctx.shadowColor = linked ? '#9ef0ff' : '#7CFC00'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x, b.y - 24, linked ? 5 : 4, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // v2.8 sentry: scrappy box turret bolted onto the pylon top
      if (sentryTier >= 1) {
        ctx.save();
        ctx.translate(b.x, b.y - 32);
        ctx.fillStyle = '#5a6478';
        ctx.fillRect(-5, 5, 10, 4); // mount collar
        ctx.rotate(b.gunA || 0);
        ctx.fillStyle = '#6f7a8e'; ctx.strokeStyle = '#3c4454'; ctx.lineWidth = 1.5;
        ctx.fillRect(-7, -5, 14, 10);
        ctx.strokeRect(-7, -5, 14, 10);
        ctx.fillStyle = '#454f66';
        for (const off of (sentryTier >= 3 ? [-2.6, 2.6] : [0])) ctx.fillRect(6, off - 1.2, 11, 2.4);
        if (b.gunFlash > 0) { // muzzle flash
          ctx.fillStyle = sentryTier >= 4 ? '#9ef0ff' : '#ffd54a';
          ctx.shadowColor = '#ffb02e'; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(18, 0, 3, 0, TAU); ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
        if (sentryTier >= 2) { // targeting antenna + status LED
          ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(b.x + 5, b.y - 36); ctx.lineTo(b.x + 9, b.y - 46); ctx.stroke();
          ctx.fillStyle = sentryTier >= 4 ? '#9ef0ff' : '#ff4d5e';
          ctx.beginPath(); ctx.arc(b.x + 9, b.y - 47, 1.6, 0, TAU); ctx.fill();
        }
      }
      // tier 2+: reinforced steel posts around the ring
      if (fenceTier >= 2) {
        ctx.fillStyle = fenceTier >= 4 ? '#a8c8d8' : '#8d99ae'; ctx.strokeStyle = '#5a6478'; ctx.lineWidth = 1;
        for (let i = 0; i < (fenceTier >= 5 ? 6 : 4); i++) {
          const a = i / (fenceTier >= 5 ? 6 : 4) * TAU + Math.PI / 4;
          const px = b.x + Math.cos(a) * b.r, py = b.y + Math.sin(a) * b.r;
          ctx.fillRect(px - 2, py - 12, 4, 12);
          ctx.strokeRect(px - 2, py - 12, 4, 12);
        }
      }
      // tier 3: electrified — crackling arc segments jump around the dome
      if (fenceTier >= 3 && Math.random() < 0.35) {
        const a0 = rand(0, TAU), a1 = a0 + rand(0.5, 1.4);
        ctx.strokeStyle = 'rgba(158,240,255,0.85)'; ctx.lineWidth = 1.5;
        ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a0) * b.r, b.y + Math.sin(a0) * b.r);
        const am = (a0 + a1) / 2, rm = b.r + rand(-6, 6);
        ctx.lineTo(b.x + Math.cos(am) * rm, b.y + Math.sin(am) * rm);
        ctx.lineTo(b.x + Math.cos(a1) * b.r, b.y + Math.sin(a1) * b.r);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // hp bar when damaged
      if (b.hp < b.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(b.x - 18, b.y - 36, 36, 4);
        ctx.fillStyle = linked ? '#9ef0ff' : '#7CFC00';
        ctx.fillRect(b.x - 18, b.y - 36, 36 * clamp(b.hp / b.maxHp, 0, 1), 4);
      }
      if (linked) {
        ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(158,240,255,0.9)';
        ctx.fillText('LINK×' + b.neighbors, b.x, b.y + b.r + 12);
      }
    }});
  }
  // cloister / brick stronghold walls (modular pillars + segments)
  if (BRICKWALL_ENABLED) {
    for (const w of brickWalls) {
      draws.push({ y: w.y, f: () => {
        const L = w.links || {};
        // segments once per undirected edge (east / south only)
        for (const o of [L.e, L.s]) {
          if (!o) continue;
          const hurt = (w.hp < w.maxHp * 0.45) || (o.hp < o.maxHp * 0.45);
          drawBrickWallSegmentBetween(w, o, hurt);
        }
        drawBrickWallPillar(w);
      }});
    }
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
      if (e.emergeT > 0) { // skeleton rising out of a grave
        const p = e.emergeT / SKELETON_EMERGE; // 1 → 0
        ctx.fillStyle = 'rgba(70,58,38,0.85)';  // disturbed grave dirt mound
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 16, 6, 0, 0, TAU); ctx.fill();
        const fig = enemyFigure(e);
        fig.alpha = 1 - p * 0.55;
        drawFigure(e.x, e.y + p * 18, fig);
        return;
      }
      const emerge = e.spawnT > 0 ? 1 - e.spawnT / 0.8 : 1;
      if (emerge < 1) {
        // rift emergence swirl
        ctx.strokeStyle = `rgba(176,77,255,${1 - emerge})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, 18 * (1 - emerge) + 6, 0, TAU); ctx.stroke();
      }
      if (e.type === 'warlord') {
        drawWarlord(e, emerge); // v2.8.6 sprite boss + gait bob + stomps (fallback: drawWarlordProcedural)
      } else if ((e.type === 'husk' || e.type === 'sprinter') && drawHuskSprite(e, emerge)) {
        // v2.13.2 Ashen Husk sheets — drawH=56 (sprinter ×0.87), r=21/18 toward ravager
      } else if (e.type === 'skeleton' && drawSkeletonSprite(e, emerge)) {
        // Ashen Skeleton sheets — drawH=38, r=12; UNCHANGED from 2.13.1
      } else if (e.type === 'bulwark' && drawBulwarkSprite(e, emerge)) {
        // Ashen Bulwark sheets — drawH=62, r=23; toward ravager (2.13.2)
      } else if (e.type === 'shaman' && drawShamanSprite(e, emerge)) {
        // Ashen Shaman sheets — drawH=56, r=20; toward ravager (2.13.2)
      } else if (e.type === 'ravager' && drawRavagerSprite(e, emerge)) {
        // Ashen Ravager sheets — articulation ready; flag OFF until ship (drawH=100 / r=36)
      } else {
        const fig = enemyFigure(e);
        fig.alpha = emerge;
        if (e.ascended) { fig.aura = '#ffd54a'; fig.glowEyes = '#ffd54a'; } // rift-blessed glow
        drawFigure(e.x, e.y, fig);
      }
      // sticker needles sticking out of the target
      if (e.needleN > 0) {
        ctx.strokeStyle = '#ff6bd8'; ctx.lineWidth = 1.6;
        ctx.shadowColor = '#ff6bd8'; ctx.shadowBlur = 4;
        for (let i = 0; i < e.needleN; i++) {
          const a = (e.needleA || 0) + Math.PI + Math.sin(i * 2.7) * 0.9;
          const bx = e.x - Math.cos(a) * e.r * 0.5;
          const by = e.y - e.r + Math.sin(i * 1.7) * e.r * 0.5;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * 7, by + Math.sin(a) * 7); ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      if (e.hp < e.maxHp && !e.boss) {
        const w = e.r * 2.4;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w, 4);
        ctx.fillStyle = '#7fbf4d';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w * clamp(e.hp / e.maxHp, 0, 1), 4);
      }
      // mini armor plate bar (v2.8 plated enemies) — small grey strip
      if (!e.boss && e.maxArmor) {
        const w = e.r * 2.4;
        ctx.fillStyle = 'rgba(8,14,26,0.7)';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9 + 5, w, 3);
        if (e.armor > 0) {
          ctx.fillStyle = '#aab8cc';
          ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9 + 5, w * clamp(e.armor / e.maxArmor, 0, 1), 3);
        }
      }
    }});
  }
  for (const c of companions) draws.push({ y: c.y, f: () => drawCompanion(c) });
  for (const m of militia) draws.push({ y: m.y, f: () => drawMilitia(m) });
  for (const L of laborers) draws.push({ y: L.y, f: () => drawLaborer(L) });
  for (const s of structures) draws.push({ y: s.y, f: () => drawStructure(s) });
  if (colossus && !colossus.dead) draws.push({ y: colossus.y, f: () => drawColossus(colossus) });
  for (const fs of forestStands) draws.push({ y: fs.y + 40, f: () => drawForestStand(fs) });
  for (const v of (goldMines.length ? goldMines : goldVeins)) {
    if (v.goldLeft > 0) draws.push({ y: v.y, f: () => drawGoldVein(v) });
  }
  draws.push({ y: player.y, f: () => {
    const fig = playerFigure();
    if (player.downed) { fig.alpha = 0.45; fig.aura = null; }
    drawFigure(player.x, player.y, fig);
    if (player.downed) {
      ctx.fillStyle = '#ff8a93';
      ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
      ctx.strokeText('✚ DOWN', player.x, player.y - 40);
      ctx.fillText('✚ DOWN', player.x, player.y - 40);
      const left = Math.max(0, ALLY_BLEEDOUT_SEC - (player.downedT || 0));
      ctx.font = '10px Segoe UI';
      ctx.fillStyle = '#ffd54a';
      ctx.fillText(left.toFixed(0) + 's', player.x, player.y - 52);
    }
  }});
  // co-op remote avatars (presence sync)
  for (const id of Object.keys(riftNet.remotes)) {
    const r = riftNet.remotes[id];
    draws.push({ y: r.y, f: () => {
      const fig = playerFigure();
      fig.cloth = '#3aa0c8'; fig.pauldron = '#9ef0ff'; fig.aura = '#4de1ff';
      fig.alpha = r.downed ? 0.45 : 0.85; fig.vestTrim = true;
      drawFigure(r.x, r.y, fig);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(r.x - 16, r.y - 52, 32, 4);
      ctx.fillStyle = r.downed ? '#ff8a93' : '#7CFC00';
      ctx.fillRect(r.x - 16, r.y - 52, 32 * clamp((r.hp || 0) / (r.maxHp || 1), 0, 1), 4);
      ctx.font = '9px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = '#9ef0ff';
      ctx.fillText((r.name || 'Ally') + (r.wave != null ? ' · W' + r.wave : ''), r.x, r.y + 14);
      if (r.downed) {
        ctx.fillStyle = '#ff8a93';
        ctx.font = 'bold 12px Segoe UI';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
        ctx.strokeText('✚ DOWN', r.x, r.y - 40);
        ctx.fillText('✚ DOWN', r.x, r.y - 40);
        if (reviveChan.kind === 'ally' && reviveChan.id === id)
          drawReviveProgress(r.x, r.y, reviveChan.t / REVIVE_HOLD_SEC);
      }
    }});
  }
  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.f();

  // ---- barricade / cloister place ghost + link preview (v2.9.3 + brick walls) ----
  if (state === 'playing' && !player.downed && !paused && !dialogOpen && !vendorOpen &&
      !settingsOpen && !infirmaryOpen && !riftNetOpen && !treeOpen) {
    if (buildGhostKind === 'brickwall' && BRICKWALL_ENABLED) {
      const aim = barricadeAimPos();
      const snap = brickWallSnapPos(aim.x, aim.y);
      const gx = clamp(snap.x, 40, WORLD.w - 40);
      const gy = clamp(snap.y, 40, WORLD.h - 40);
      const blocked = snap.overlap || brickWallSpotBlocked(gx, gy) || brickWalls.length >= BRICKWALL_MAX;
      const canAfford = canAffordCosts(BRICKWALL_COST);
      const links = brickWallLinkTargets(gx, gy);
      const willLink = !blocked && links.length > 0;
      const col = blocked || !canAfford ? '255,100,110' : willLink ? '200,160,106' : '212,165,116';
      const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.55 + pulse * 0.2;
      for (const o of links) {
        ctx.strokeStyle = `rgba(200,160,106,${0.55 + pulse * 0.3})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(o.x, o.y - 8); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(200,160,106,${0.35 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 4, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(${col},0.75)`;
      ctx.lineWidth = willLink ? 3.5 : 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(gx, gy, BRICKWALL_PILLAR_R + (willLink ? 6 : 2), 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${col},0.12)`;
      ctx.beginPath(); ctx.arc(gx, gy, BRICKWALL_PILLAR_R + 2, 0, TAU); ctx.fill();
      // ghost pillar stub
      ctx.fillStyle = `rgba(${col},0.55)`;
      ctx.fillRect(gx - 5, gy - 22, 10, 22);
      ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 3;
      let label = !canAfford ? 'NEED ' + costLabel(BRICKWALL_COST)
        : blocked ? 'NO ROOM'
        : willLink ? (links.length >= 2 ? `JUNCTION ×${links.length}` : `LINK ×${links.length}`)
        : 'CLOISTER';
      ctx.strokeText(label, gx, gy + BRICKWALL_PILLAR_R + 16);
      ctx.fillStyle = `rgba(${col},0.95)`;
      ctx.fillText(label, gx, gy + BRICKWALL_PILLAR_R + 16);
      ctx.restore();
    } else {
      const { x: gx, y: gy } = barricadeAimPos();
      const blocked = barricadeSpotBlocked(gx, gy) || barricades.length >= BARRICADE_MAX;
      const canAfford = cores >= BARRICADE_COST;
      const links = barricadeLinkTargets(gx, gy);
      const willLink = !blocked && links.length > 0;
      const col = blocked || !canAfford ? '255,100,110' : willLink ? '158,240,255' : '124,252,0';
      const ghostR = willLink ? BARRICADE_BASE_R * 2 : BARRICADE_BASE_R;
      const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.55 + pulse * 0.2;
      for (const o of links) {
        ctx.strokeStyle = `rgba(158,240,255,${0.55 + pulse * 0.3})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(o.x, o.y - 8); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(158,240,255,${0.35 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 4, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(${col},${0.75})`;
      ctx.lineWidth = willLink ? 3.5 : 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(gx, gy, ghostR, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${col},0.12)`;
      ctx.beginPath(); ctx.arc(gx, gy, ghostR, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${col},0.9)`;
      ctx.beginPath(); ctx.arc(gx, gy - 22, 3.5, 0, TAU); ctx.fill();
      ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 3;
      let label = !canAfford ? `NEED ${BARRICADE_COST}⬡` : blocked ? 'NO ROOM' : willLink ? `LINK ×${links.length}` : 'BUILD';
      ctx.strokeText(label, gx, gy + ghostR + 14);
      ctx.fillStyle = `rgba(${col},0.95)`;
      ctx.fillText(label, gx, gy + ghostR + 14);
      ctx.restore();
    }
  }

  // ---- projectiles over actors ----
  ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 10;
  for (const b of bolts) {
    if (b.wpn === 'gusher') { // teal energy orb with a bright core
      ctx.shadowColor = '#3ef0c8'; ctx.shadowBlur = 12;
      const gg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      gg.addColorStop(0, '#eafff8');
      gg.addColorStop(0.5, '#3ef0c8');
      gg.addColorStop(1, '#0f9c86');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 10;
    } else if (b.wpn === 'sticker') { // pink needle with a violet trail
      ctx.shadowColor = '#ff6bd8'; ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(176,77,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); ctx.stroke();
      ctx.strokeStyle = '#ff9de6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012); ctx.stroke();
      ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = '#9ef0ff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
    }
  }
  // companion fire: teal cannon shots / pale crossbow bolts
  for (const b of cbolts) {
    if (b.scout) {
      ctx.shadowColor = '#ffd7a8'; ctx.shadowBlur = 5;
      ctx.strokeStyle = '#ffe9cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.015, b.y - b.vy * 0.015); ctx.stroke();
    } else {
      ctx.shadowColor = '#3ef0c8'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#3ef0c8';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    }
  }
  // sentry tracers: short amber streaks
  ctx.shadowColor = '#ffb02e'; ctx.shadowBlur = 6;
  for (const s of sbolts) {
    ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.014, s.y - s.vy * 0.014); ctx.stroke();
  }
  ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 10;
  for (const b of ebolts) {
    if (b.fire) { // fireball: white-hot core, orange body, red rim, size pulse
      const pulse = 1 + Math.sin(performance.now() / 45 + b.x * 0.1) * 0.16;
      ctx.shadowColor = '#ff7a1f'; ctx.shadowBlur = 14;
      const fg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse);
      fg.addColorStop(0, '#fff3c4');
      fg.addColorStop(0.45, '#ffb02e');
      fg.addColorStop(1, '#ff3d1f');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * pulse, 0, TAU); ctx.fill();
    } else {
      ctx.shadowColor = '#d24dff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#d24dff';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    }
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
    const r = (3 + beamCharge * 14) * Math.sqrt(beamWidthMul());
    ctx.save();
    ctx.translate(player.x + Math.cos(player.aim) * 32, player.y - 14 + Math.sin(player.aim) * 32);
    ctx.fillStyle = `rgba(120,220,255,${0.5 + beamCharge * 0.5})`;
    ctx.shadowColor = '#4de1ff'; ctx.shadowBlur = 18 + beamCharge * 16;
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

  // ---- pine canopies over everything (layered scalloped tiers; trunk drawn in drawObstacle) ----
  for (const o of obstacles) {
    if (o.type !== 'tree') continue;
    drawPineCanopy(o);
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
    // armor plate bar (thinner, steel) just below the hp bar
    if (boss.maxArmor) {
      ctx.fillStyle = 'rgba(8,14,26,0.85)';
      ctx.fillRect(VW / 2 - w / 2 - 3, by + 19, w + 6, 8);
      ctx.fillStyle = '#232a36';
      ctx.fillRect(VW / 2 - w / 2, by + 21, w, 4);
      if (boss.armor > 0) {
        ctx.fillStyle = '#aab8cc';
        ctx.fillRect(VW / 2 - w / 2, by + 21, w * clamp(boss.armor / boss.maxArmor, 0, 1), 4);
      }
    }
    ctx.fillStyle = '#ffb0b7'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(boss.maxArmor && boss.armor <= 0 ? 'GHAROK — ARMOR SHATTERED · ENRAGED'
      : 'GHAROK — TWIN-SKULLED WAR-BRUTE', VW / 2, by - 5);
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

// Chunky faceted rocks — sprite first (v2.8.7), procedural fallback.
// variant: 0 boulder, 1 cluster, 2 slab, 3 mossy.
function drawRockFormation(o) {
  const img = rockSpriteFor(o);
  if (img) {
    const r = o.r;
    const drawH = r * (o.variant === 2 ? 1.35 : 1.85);
    const drawW = drawH * (img.naturalWidth / img.naturalHeight);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.28, Math.max(r * 1.05, drawW * 0.42), r * 0.36, 0, 0, TAU); ctx.fill();
    ctx.drawImage(img, -drawW / 2, -drawH + r * 0.2, drawW, drawH);
    return;
  }
  const v = o.variant == null ? (Math.floor(o.seed) % 4) : o.variant % 3;
  const r = o.r;
  const moss = (v !== 2) || (o.seed % 1 > 0.55);
  const stoneLite = '#9aa3b0', stone = '#6e7684', stoneDeep = '#3e4552', edge = '#2a303a';
  const mossCol = '#4a8a3a', mossDeep = '#2f6a28';
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.32, r * (v === 2 ? 1.35 : 1.15), r * 0.38, 0, 0, TAU); ctx.fill();

  const facetBlob = (ox, oy, rx, ry, rot, seed) => {
    ctx.beginPath();
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + rot + seed * 0.2;
      const rr = 0.78 + Math.sin(seed * 5 + i * 2.1) * 0.18;
      const px = ox + Math.cos(a) * rx * rr;
      const py = oy + Math.sin(a) * ry * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(ox - rx, oy - ry, ox + rx * 0.6, oy + ry * 0.8);
    g.addColorStop(0, stoneLite); g.addColorStop(0.4, stone); g.addColorStop(1, stoneDeep);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 2.2; ctx.stroke();
    // hard facet highlight (top-left)
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(ox - rx * 0.55, oy - ry * 0.1);
    ctx.lineTo(ox - rx * 0.1, oy - ry * 0.75);
    ctx.lineTo(ox + rx * 0.15, oy - ry * 0.35);
    ctx.closePath(); ctx.fill();
  };

  if (v === 0) {
    facetBlob(0, -r * 0.35, r * 0.95, r * 0.78, o.seed, o.seed);
    if (moss) {
      ctx.fillStyle = mossCol;
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 0.85, r * 0.38, r * 0.18, -0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = mossDeep;
      ctx.beginPath();
      ctx.ellipse(r * 0.2, -r * 0.7, r * 0.22, r * 0.12, 0.4, 0, TAU); ctx.fill();
    }
  } else if (v === 1) {
    // three upright pillars
    facetBlob(-r * 0.45, -r * 0.55, r * 0.38, r * 0.7, -0.15, o.seed);
    facetBlob(r * 0.1, -r * 0.85, r * 0.42, r * 0.95, 0.05, o.seed + 1);
    facetBlob(r * 0.48, -r * 0.5, r * 0.34, r * 0.62, 0.2, o.seed + 2);
    if (moss) {
      ctx.fillStyle = mossCol;
      ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 1.55, r * 0.28, r * 0.14, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 1.1, r * 0.2, r * 0.1, -0.2, 0, TAU); ctx.fill();
    }
  } else {
    // low overlapping slabs
    facetBlob(-r * 0.35, -r * 0.22, r * 0.7, r * 0.42, -0.25, o.seed);
    facetBlob(r * 0.4, -r * 0.28, r * 0.55, r * 0.36, 0.35, o.seed + 2);
    facetBlob(0.05 * r, -r * 0.55, r * 0.5, r * 0.3, 0.05, o.seed + 4);
    if (moss) {
      ctx.fillStyle = mossCol;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.72, r * 0.42, r * 0.14, 0.1, 0, TAU); ctx.fill();
    }
  }
}

// Pine canopy — sprite first (v2.8.7), scalloped procedural fallback.
// size: 0 small / 1 medium / 2 tall. Drawn above y-sorted entities.
function drawPineCanopy(o) {
  const size = o.size == null ? 1 : o.size;
  const sway = Math.sin(performance.now() / 900 + o.seed) * (2.2 + size);
  const img = pineSpriteFor(o);
  if (img) {
    const scale = size === 0 ? 0.78 : size === 2 ? 1.18 : 1;
    const drawH = (96 + size * 18) * scale;
    const drawW = drawH * (img.naturalWidth / img.naturalHeight);
    ctx.save();
    ctx.translate(o.x + sway, o.y);
    ctx.globalAlpha = 0.96;
    ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  const scale = size === 0 ? 0.72 : size === 2 ? 1.22 : 1;
  const tiers = size === 0 ? 3 : size === 2 ? 5 : 4;
  const baseY = -28 * scale;
  const topY = baseY - (38 + tiers * 14) * scale;
  ctx.save();
  ctx.translate(o.x + sway, o.y);
  ctx.globalAlpha = 0.94;
  for (let t = 0; t < tiers; t++) {
    const p = t / (tiers - 1 || 1); // 0 top → 1 bottom
    const y = topY + (baseY - topY) * p;
    const halfW = (10 + p * 28) * scale;
    const h = (12 + p * 4) * scale;
    const lite = '#6db84a', mid = '#3d8a32', deep = '#2a6a28', edge = '#0e2412';
    // scalloped tier silhouette
    ctx.beginPath();
    ctx.moveTo(0, y - h * 0.85);
    const bumps = 5 + (t & 1);
    for (let i = 0; i <= bumps; i++) {
      const u = i / bumps;
      const x = -halfW + u * halfW * 2;
      const scallop = Math.sin(u * Math.PI) * h * 0.35 + Math.sin(u * Math.PI * 3 + o.seed) * h * 0.08;
      ctx.lineTo(x, y + h * 0.55 - scallop);
    }
    ctx.lineTo(0, y - h * 0.85);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.4);
    g.addColorStop(0, lite); g.addColorStop(0.45, mid); g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    // needle tick marks (few — keep cheap)
    ctx.strokeStyle = 'rgba(14,36,18,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const u = 0.2 + k * 0.28 + (o.seed % 1) * 0.05;
      const x = -halfW * 0.7 + u * halfW * 1.4;
      const ty = y + h * 0.1;
      ctx.moveTo(x - 2 * scale, ty); ctx.lineTo(x, ty + 3.5 * scale); ctx.lineTo(x + 2 * scale, ty);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
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
    drawRockFormation(o);
  } else if (o.type === 'tree') {
    // Sprite pines draw full trunk+canopy in drawPineCanopy; procedural keeps trunk here.
    const size = o.size == null ? 1 : o.size;
    const scale = size === 0 ? 0.72 : size === 2 ? 1.22 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(0, 3, 14 * scale, 5.5 * scale, 0, 0, TAU); ctx.fill();
    if (!pineSpriteFor(o)) {
      const lean = Math.sin(o.seed) * 3 * scale;
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 8 * scale; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(lean, -26 * scale); ctx.stroke();
      ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(-2.2 * scale, -4); ctx.lineTo(-1.5 * scale + lean * 0.4, -20 * scale);
      ctx.moveTo(1.8 * scale, -8); ctx.lineTo(1.2 * scale + lean * 0.5, -18 * scale);
      ctx.stroke();
    }
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
    // stones with moss accents
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU;
      ctx.fillStyle = i % 2 ? '#4a5060' : '#3a4840';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 15, Math.sin(a) * 7, 3.4, 0, TAU); ctx.fill();
      if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(70,110,60,0.55)';
        ctx.beginPath(); ctx.arc(Math.cos(a) * 15 + 1, Math.sin(a) * 7 - 1, 1.4, 0, TAU); ctx.fill();
      }
    }
    // logs with bark notches
    ctx.strokeStyle = '#4a3826'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(8, -5); ctx.moveTo(-7, -5); ctx.lineTo(9, -1); ctx.stroke();
    ctx.strokeStyle = '#2e2214'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(2, -4.5); ctx.stroke();
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
  // two tents — canvas weave + guy-lines + pegs (v2.9 polish)
  for (const [txo, tyo, flip] of [[-95, -40, 1], [70, 55, -1]]) {
    draws.push({ y: CAMP.y + tyo, f: () => {
      ctx.save(); ctx.translate(CAMP.x + txo, CAMP.y + tyo); ctx.scale(flip, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(0, 2, 34, 10, 0, 0, TAU); ctx.fill();
      // main canvas
      const tent = ctx.createLinearGradient(-32, -34, 32, 0);
      tent.addColorStop(0, '#6a5638'); tent.addColorStop(0.5, '#5a4a30'); tent.addColorStop(1, '#493b25');
      ctx.fillStyle = tent;
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(0, -34); ctx.lineTo(32, 0); ctx.closePath(); ctx.fill();
      // seam / shade flap
      ctx.fillStyle = '#3f3220';
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(32, 0); ctx.lineTo(12, 0); ctx.lineTo(0, -26); ctx.closePath(); ctx.fill();
      // weave stitches
      ctx.strokeStyle = 'rgba(90,70,40,0.55)'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const t = (i + 1) / 5;
        ctx.beginPath();
        ctx.moveTo(-32 * (1 - t), -34 * t);
        ctx.lineTo(32 * (1 - t), -34 * t);
        ctx.stroke();
      }
      // door
      ctx.fillStyle = '#1a140c';
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -14); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill();
      // pole tip + banner scrap
      ctx.strokeStyle = '#2a2014'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, -42); ctx.stroke();
      ctx.fillStyle = '#2e6fff';
      ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(10, -37); ctx.lineTo(0, -34); ctx.closePath(); ctx.fill();
      // guy-lines + pegs
      ctx.strokeStyle = 'rgba(180,160,120,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-28, -4); ctx.lineTo(-40, 6); ctx.moveTo(28, -4); ctx.lineTo(40, 6); ctx.stroke();
      ctx.fillStyle = '#6a6048';
      ctx.fillRect(-42, 5, 4, 2); ctx.fillRect(38, 5, 4, 2);
      ctx.restore();
    }});
  }
}

// ========================= MAIN LOOP ==============================
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state === 'playing' && !paused && !dialogOpen && !treeOpen && !vendorOpen && !settingsOpen &&
      !infirmaryOpen && !riftNetOpen && !buildPickOpen && !structPanelOpen) update(dt);
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
  wood = 30; gold = 16; // starter stock — Keep + laborers reachable early
  goldVeins = []; goldMines = []; forestStands = [];
  structures = []; laborers = []; militia = []; colossus = null;
  waveTrainLeft = 3; militiaIdSeq = 1; rtsTipShown = false;
  buildPickOpen = false; structPanelOpen = false; selectedStructure = null;
  unitPanelOpen = false; selectedUnit = null;
  if ($('buildPick')) $('buildPick').classList.add('hidden');
  if ($('structPanel')) $('structPanel').classList.add('hidden');
  if ($('unitPanel')) $('unitPanel').classList.add('hidden');
  enemies = []; bolts = []; ebolts = []; grenades = []; pickups = []; particles = []; floaters = []; zaps = [];
  beam = null; beamCharge = 0; charging = false; paused = false; treeOpen = false;
  dialogOpen = false; vendorOpen = false; infirmaryOpen = false; riftNetOpen = false;
  destroyRiftNet();
  $('dialog').classList.add('hidden'); $('skilltree').classList.add('hidden'); $('vendor').classList.add('hidden');
  if ($('infirmary')) $('infirmary').classList.add('hidden');
  if ($('riftNet')) $('riftNet').classList.add('hidden');
  tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
  gear.forEach(u => u.lvl = 0);
  Object.keys(skillRanks).forEach(k => delete skillRanks[k]);
  questIdx = 0; questStage = 'offer'; questProgress = 0;
  miraIdx = 0; miraRewarded = false;
  chest = null; graceT = 0; barricades = []; pulseCd = 0;
  brickWalls = []; buildGhostKind = 'barricade';
  fenceTier = 1; graves = []; graveCount = 0;
  sentryTier = 0; sbolts = [];
  companions = []; cbolts = [];
  squad = { owned: {}, active: {} };
  loadout = { primary: 'rifle', secondary: null };
  currentRegion = '';
  buildWorld();
  seedStarterTown();
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
$('soundBtn').onclick = () => openSoundMenu();
$('soundBackBtn').onclick = () => closeSoundMenu();
$('volMaster').oninput = () => {
  sfx.setMaster((+$('volMaster').value || 0) / 100);
  $('volMasterVal').textContent = $('volMaster').value + '%';
};
$('volSfx').oninput = () => {
  sfx.setSfx((+$('volSfx').value || 0) / 100);
  $('volSfxVal').textContent = $('volSfx').value + '%';
};
$('volMusic').oninput = () => {
  sfx.setMusic((+$('volMusic').value || 0) / 100);
  $('volMusicVal').textContent = $('volMusic').value + '%';
};
$('togMuteMaster').onclick = () => { sfx.setMuteMaster(!settings.muteMaster); refreshSoundMenu(); sfx.play('click'); };
$('togMuteSfx').onclick = () => { sfx.setMuteSfx(!settings.muteSfx); refreshSoundMenu(); };
$('togMuteMusic').onclick = () => { sfx.setMuteMusic(!settings.muteMusic); refreshSoundMenu(); sfx.play('click'); };
$('togShake').onclick = () => { settings.shake = !settings.shake; persistSettings(); refreshToggles(); };
$('togDmg').onclick = () => { settings.dmgText = !settings.dmgText; persistSettings(); refreshToggles(); };
$('togVibro').onclick = () => {
  settings.vibro = !settings.vibro; persistSettings(); refreshToggles();
  buzz(30); // confirmation blip when turning it on
};
if ($('togAdaptHide')) $('togAdaptHide').onclick = () => {
  settings.adaptHidden = !settings.adaptHidden;
  persistSettings(); refreshToggles();
};
$('adaptbox').onclick = () => {
  if (settings.adaptHidden) return; // fully hidden via settings — ignore stray taps
  settings.adaptCollapsed = !settings.adaptCollapsed;
  persistSettings(); applyAdaptCollapse();
};
$('rowUiSize').onclick = () => {
  settings.uiScale = UI_SCALES[(UI_SCALES.indexOf(settings.uiScale) + 1) % UI_SCALES.length];
  applyUiScale(); applyLayout(); persistSettings(); refreshToggles();
};
$('rowBtnStyle').onclick = () => {
  settings.btnStyle = BTN_STYLES[(BTN_STYLES.indexOf(settings.btnStyle) + 1) % BTN_STYLES.length];
  applyBtnStyle(); persistSettings(); refreshToggles();
};
$('rowHudOff').onclick = () => {
  const i = HUD_OFFSETS.indexOf(settings.hudOffset || 0);
  settings.hudOffset = HUD_OFFSETS[(i + 1) % HUD_OFFSETS.length];
  applyHudOffset(); persistSettings(); refreshToggles();
};
$('rowMapSize').onclick = () => {
  settings.mapSize = MAP_SIZES[(MAP_SIZES.indexOf(settings.mapSize || 'medium') + 1) % MAP_SIZES.length];
  applyMapSize(); persistSettings(); refreshToggles();
  if (state === 'playing' || state === 'shop') drawMinimap();
};
$('rowCamView').onclick = () => {
  const i = CAM_VIEWS.findIndex(v => v.id === settings.camView);
  settings.camView = CAM_VIEWS[(i + 1) % CAM_VIEWS.length].id;
  persistSettings(); refreshToggles();
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
  settingsOpen = false; soundMenuOpen = false;
  $('settings').classList.add('hidden');
  $('soundMenu').classList.add('hidden');
  $('settingsMain').classList.remove('hidden');
  $('shop').classList.add('hidden'); $('gameover').classList.add('hidden');
  newGame();
};
$('quitBtn').onclick = () => {
  saveGame(false);
  settingsOpen = false;
  soundMenuOpen = false;
  $('settings').classList.add('hidden');
  $('soundMenu').classList.add('hidden');
  $('settingsMain').classList.remove('hidden');
  $('shop').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('btnMenu').classList.add('hidden');
  $('btnSettings').classList.add('hidden');
  $('btnTalk').classList.add('hidden');
  if ($('btnMend')) $('btnMend').classList.add('hidden');
  state = 'menu';
  sfx.syncMusic();
  $('continueBtn').classList.toggle('hidden', !hasSave());
  $('menu').classList.remove('hidden');
};

// Apply persisted audio levels once the graph can be built.
sfx.applyFromSettings();

requestAnimationFrame(loop);

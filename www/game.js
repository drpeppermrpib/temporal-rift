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
// v2.11 legacy playfield; v4.0.0 Step 6.0 — exterior scaffold (Continuity)
const CONTINUOUS_MAP_ENABLED = true; // soft-wire — false = legacy 4800×4800 only
const LEGACY_WORLD = { x: 0, y: 0, w: 4800, h: 4800 };
const WORLD_EXT_PAD = 2048; // +2048 per side → 4800 + 2048×2 = 8896 per axis
// Step 6.1 — dense tree ring at legacy edge; cardinal gaps reserved for 6.2 paths
const LEGACY_BORDER_RING_INSET_MIN = 52;
const LEGACY_BORDER_RING_INSET_MAX = 108;
const LEGACY_BORDER_RING_SPACING = 40;
const LEGACY_BORDER_RING_ROWS = 2;
const LEGACY_BORDER_GAP_HALF = 88; // half-width of N/S/E/W exit slots
const LEGACY_PATH_CORRIDOR_HALF = LEGACY_BORDER_GAP_HALF; // visible path width (Step 6.2)
const LEGACY_PATH_INTERIOR_DEPTH = 560; // corridor depth inward from legacy edge
// Step 9.1 — map zones: thin ring, spread groves, bike lanes, NW lake reserve (Step 10 water)
const EXTERIOR_TREE_SPREAD_ENABLED = true;
const LAKE_RESERVE_ENABLED = true;
const BIKE_TRAIL_LANES_ENABLED = true;
const LAKE_RESERVE = { x: 600, y: 600, w: 2600, h: 2200 }; // NW exterior — empty until Step 10
const BIKE_TRAIL_LANE_HALF = 100; // ~3× bike r — keep centerlines trunk-free
// Step 10.1 — Ashmere water body: organic blob SUBSET of the reserve rect (which is the
// legacy NW quadrant — camp at 2400,2400 sits inside it). Blob dodges the camp meadow
// (≥380px gap), both N/W path corridors, and spawn walks. See docs/step-10-plan.md.
const LAKE_WATER_ENABLED = true;        // soft-wire — false = bowl stays bare shore meadow
const LAKE_SPAWN_GUARD_ENABLED = true;  // soft-wire — false = spawns skip the dry re-route
// Superellipse blob (plan draft numbers): bounds ≈ x 720–2120, y 740–2060. The shore
// wobble only SHRINKS the waterline, so the envelope (camp gap / corridor lanes / ring
// shore ≥600) can never grow past these bounds.
const LAKE_BLOB = { cx: 1420, cy: 1400, a: 700, b: 660, n: 2.2 };
const LAKE_ISLE = { x: 1520, y: 1310, r: 180 }; // Driftwood Isle dry carve — content lands 10.4
const LAKE_SHALLOW_BAND = 46;    // px inside the waterline that reads as shallows (10.3 mount zone)
const LAKE_SHALLOW_FIELD = 0.86; // lakeFieldAt ≥ this (and < 1) ≈ that 46px outer band
const LAKE_SHORE_MARGIN = 2;     // clamp leaves actors this many px on the dry side
// Step 6.4–6.5 — exterior NPC holds (brick footprint + join/refuse + orange autonomy)
const HOLD_PATH_OFFSET = 280; // px beyond legacy edge along cardinal path axis
// Step 9.2 — Orange Quarter: 8 holds cluster SE inside legacy; Sunfall + Eastwatch stay at gates
const ORANGE_QUARTER_ENABLED = true;
const ORANGE_QUARTER_GATE_IDS = ['sunfall', 'eastwatch'];
// Step 9.3 — enemy slide-around + climb small obstacles (no A*)
const ENEMY_STEER_ENABLED = true;
const ENEMY_STEER_SLIDE_T = 0.55;
const ENEMY_CLIMB_MAX_OBST_R = 20; // 9.6 — was 22; size-0/1 trees only
const ENEMY_CLIMB_T = 0.34;
const ENEMY_CLIMB_SPEED_MUL = 1.45;
// Step 9.4 — gray fog shroud + wave-start spider dens (independent soft-wires)
const FOG_SHROUD_ENABLED = true;
const FOG_SHROUD_ALPHA = 0.52;
const SPIDER_DEN_ENABLED = true;
// Step 9.6 — dens scale with wave; never stamp inside legacy / Orange Quarter
const SPIDER_DEN_PER_WAVE_MIN = 2;
const SPIDER_DEN_PER_WAVE_MAX = 4;
const SPIDER_DEN_WAVE_SCALE = 8;
const SPIDER_DEN_LEGACY_EXCLUDE = true;
let spiderDens = [];
// Step 9.6 — balance: quarter hub clear, spread hold pad, tree grove trim
const ORANGE_QUARTER_TREE_CLEAR_PAD = 54;
const EXTERIOR_SPREAD_HOLD_PAD = 150;
// Step 9.5 — decade stack queue + path-corridor spawns (independent soft-wire)
const DECADE_STACK_QUEUE_ENABLED = true;
const DECADE_STACK_ONSCREEN_MAX = 1;
let decadeBossQueue = [];
const ORANGE_QUARTER_PREV_POS = {
  ashmarch: { x: LEGACY_WORLD.w / 2, y: LEGACY_WORLD.h + HOLD_PATH_OFFSET + 1280 },
  riftshore: { x: LEGACY_WORLD.w + HOLD_PATH_OFFSET + 1280, y: LEGACY_WORLD.h / 2 },
  emberwake: { x: 5600, y: 1050 },
  thornholt: { x: 7400, y: 1600 },
  greywater: { x: 6100, y: 3800 },
  mosslight: { x: 1100, y: 5400 },
  duskfen: { x: 3600, y: 7000 },
  cinderrest: { x: 6800, y: 6500 },
};
const HOLD_FOOT_HALF_W = 90;
const HOLD_FOOT_HALF_H = 70;
const HOLD_WALL_R = 14;
const HOLD_AUTONOMY_ENABLED = CONTINUOUS_MAP_ENABLED; // Step 6.5 soft-wire
// Step 7.5 — independent soft-wires (spider / captain / harvest flip without killing each other).
// Continuity defaults ON. Tick paths still require CONTINUOUS_MAP / autonomy where noted.
// Off-path: harvest false ⇒ no exterior sites; captain false ⇒ 6.6 brickpad-only; spider false ⇒ no BW.
// Player-assist Continuity default ON (A); B = OFF laborers-only — flip PLAYER_EXTERIOR_ASSIST_ENABLED.
const EXTERIOR_HARVEST_ENABLED = true; // 7.0 sites; independent of captain/spider
const EXTERIOR_CHOP_ENABLED = true; // 7.1 chop AI (no-op if harvest sites absent)
const EXTERIOR_MINE_ENABLED = true; // 7.2 mine AI
const EXTERIOR_COAL_ENABLED = true; // 8.1 exterior coal mines (gray/black gold-mine silhouette)
const FUEL_ECONOMY_ENABLED = true; // 8.2 coal → fuel at existing town buildings (no new shed art)
const FUEL_MAX = 100;
const COAL_PER_REFUEL = 1;
const FUEL_PER_COAL = 10; // 1 coal → 10 fuel (full tank = 10 coal)
const REFUEL_BUILDING_KINDS = ['keep', 'timber', 'golddepot', 'muster', 'pit']; // camp buildings only
// Step 8.3 — Ashen Rift Bike (exterior travel; v3 concept art placeholder)
const DIRT_BIKE_ENABLED = true;
const DIRT_BIKE_SPRITE_ENABLED = true; // uses ashen-rift-bike-concept-v3.png (idle/ride/wreck crops)
const DIRT_BIKE_R = 14;
const DIRT_BIKE_SPRITE_DRAWH = 48;
const DIRT_BIKE_SPEED_MUL = 1.85;
const FUEL_BURN_PER_SEC = 3.6; // 8.6 — ~28s full tank (was 4.5); exploration > sprint
const BIKE_REPAIR_WOOD = 30; // 8.6 tune (was 35)
const BIKE_REPAIR_GOLD = 18; // 8.6 tune (was 22)
const BIKE_INTERACT_R = 95;
const BIKE_KNOCKOFF_DMG = 28; // heavy hits knock rider off
const DIRT_BIKE_HOLD_LINKS_ENABLED = true; // 8.4 — park at holds, captain bikeshed, trail markers
const BIKE_HOLD_PARK_PAD = 100; // snap park / mount radius at hold pad
const BIKE_SHED_FUEL_BONUS = 8; // 8.6 — top-off when parking at hold with bikeshed
const PLAYER_EXTERIOR_ASSIST_ENABLED = true; // Continuity A=ON; set false = hold laborers only
const HOLD_CAPTAIN_ENABLED = true; // 7.3 captain + stage-2; independent of harvest/spider
const HOLD_EXTERIOR_CHOP_RANGE = 1200; // hold builders stay near own hold stands/mines
const HOLD_EXTERIOR_MINE_RANGE = HOLD_EXTERIOR_CHOP_RANGE;
const HOLD_EXTERIOR_COAL_RANGE = HOLD_EXTERIOR_CHOP_RANGE;
// Step 7.4 Ashen Burstweaver — kit locked at 7.4D; Continuity storage = enemies[] (A), not exteriorThreats[] (B)
const EXTERIOR_SPIDER_ENABLED = true; // exterior-only spawn/chase/attacks — NEVER via spawnEdgePos
const BURSTWEAVER_SPRITE_ENABLED = true; // idle/walk/threat/swell draw (independent of EXTERIOR_SPIDER)
const BURSTWEAVER_R = 42; // SIZE LOCK draft — between Ravager 36 and Gharok 54
const BURSTWEAVER_SPRITE_DRAWH = 115; // SIZE LOCK draft — mid of 110–120 plan band
const BURSTWEAVER_MAX_LIVE = 1; // base exterior pressure; 4.1.1: 2 live at wave 20+ (see burstweaverMaxLive)
const BURSTWEAVER_SPAWN_CD_MIN = 55; // 7.4D — slightly rarer than 7.4C 48–72
const BURSTWEAVER_SPAWN_CD_MAX = 80;
// 7.4D attack kit polish (no new attacks)
const BURSTWEAVER_WEB_RANGE = 270;
const BURSTWEAVER_WEB_DMG = 9;
const BURSTWEAVER_WEB_SLOW_T = 2.5; // 7.4D — shorter so poison+web stack is readable
const BURSTWEAVER_WEB_SLOW_MUL = 0.55; // 7.4D — was 0.48 (less root-feel)
const BURSTWEAVER_WEB_CD = 4.5;
const BURSTWEAVER_WEB_SPD = 340;
const BURSTWEAVER_BITE_REACH = 8;
const BURSTWEAVER_POISON_T = 10; // seconds — drains HP + aether
const BURSTWEAVER_POISON_DPS = 3.0; // 7.4D — ~30 HP over 10s (pre-armor); was 3.5
const BURSTWEAVER_POISON_KI_DPS = 4.0; // 7.4D — ~40 aether over 10s; was 4.5
const BURSTWEAVER_BITE_CD = 3.4;
const BURSTWEAVER_THREAT_POSE = 0.55;
const BURSTWEAVER_EXPLODE_R = 128; // 7.4D — was 140 (hold-friendlier)
const BURSTWEAVER_EXPLODE_BASE = 42; // 7.4D — legacy floor; explode uses HP frac now
const BURSTWEAVER_EXPLODE_HP_FRAC = 0.5; // 9.7.1 — ~half your health bar
const BURSTWEAVER_EXPLODE_WAVE = 1.5;
const BURSTWEAVER_SWELL_MIN = 1.35; // 7.4D — longer telegraph so explode isn't cheap
const BURSTWEAVER_SWELL_MAX = 1.75;
const BURSTWEAVER_EXPLODE_CD_MIN = 12;
const BURSTWEAVER_EXPLODE_CD_MAX = 16;
const BURSTWEAVER_EXPLODE_TRIGGER = 165;
let burstweaverSpawnCd = 22; // first exterior sighting delay
// Step 9.7.1 — spiders hunt you; never block wave clear; explode ≈ half HP
const SPIDER_HUNT_ENABLED = true;
const SPIDER_HUNT_SPEED_MUL = 1.32;
const SPIDER_BORDER_WEB_RANGE = 440;
const SPIDER_WAVE_DMG_SCALE = 0.045;
const SPIDER_WAVE_SPD_SCALE = 0.01;
// Step 8.5 — Ashen Broodmother + spiderling swarm (scaled Burstweaver look)
// Step 8.6 — balance: wave gate, spiderling cap, spawn cadence, fuel/bike tune
const BROODMOTHER_ENABLED = true;
const BROODMOTHER_SPRITE_ENABLED = true; // reuses burstweaver sheets at scale
const BROODMOTHER_R = 58;
const BROODMOTHER_DRAW_SCALE = 1.38;
const BROODMOTHER_FAT_SCALE = 1.22;
const BROODMOTHER_MAX_LIVE = 1;
const BROODMOTHER_MIN_WAVE = 12;
const BROODMOTHER_DEEP_R = 1500;
const BROODMOTHER_SPAWN_CD_MIN = 200;
const BROODMOTHER_SPAWN_CD_MAX = 320;
const BROODMOTHER_BIRTH_SWELL_MIN = 2.0;
const BROODMOTHER_BIRTH_SWELL_MAX = 2.6;
const BROODMOTHER_BIRTH_TRIGGER = 220;
const BROODMOTHER_BIRTH_RING_R = 96;
const SPIDERLING_COUNT_MIN = 8;
const SPIDERLING_COUNT_MAX = 10;
const SPIDERLING_MAX_LIVE = 24;
const SPIDERLING_R = 24;
const SPIDERLING_DRAW_SCALE = 0.58;
const SPIDERLING_WEB_RANGE = 190;
const SPIDERLING_WEB_CD = 5.2;
const SPIDERLING_BITE_CD = 2.9;
const SPIDERLING_POISON_T = 6;
const SPIDERLING_POISON_DPS = 2.0;
const SPIDERLING_POISON_KI_DPS = 2.5;
let broodmotherSpawnCd = 90;

const HOLD_WOOD_TO_ORANGESP = 1; // 1 exterior wood → 1 hold.orangeSp (no separate hold wood bank)
const HOLD_GOLD_TO_ORANGESP = 1; // 1 exterior gold → 1 hold.orangeSp (no hold gold bank; feeds 6.6)
const EXTERIOR_STAND_ID_BASE = 100; // offset so exterior standIds never collide with legacy 0..N
const HOLD_JOIN_WAVE_NEAR = 8;  // Sunfall / Eastwatch (path-exit holds)
const HOLD_JOIN_WAVE_FAR = 10;  // Ashmarch / Riftshore
const HOLD_ORB_UNLOCK = { scout: 5, sentinel: 12, warden: 20 }; // orangeSp thresholds (rover = starter)
const HOLD_GAUNTLET_WAVES = 3;
const HOLD_GAUNTLET_MAX_SEC = 120;
const HOLD_LEARN_GAUNTLET_WAVES = 2; // Step 7.3 post-brickpad captain drills
const HOLD_ORB_MAGNET = 140;
const HOLD_CAPTAIN_LEVEL_ORANGE = [0, 0, 20, 40, 60, 85]; // 7.5 Continuity — slight pace vs harvest (was 18/36/55/80)
const HOLD_CAPTAIN_TRAIN_COST = { rover: 6, scout: 7, sentinel: 9, warden: 12 }; // spend to reinforce beyond 1-cap
const HOLD_CAPTAIN_UNIT_CAP = { rover: 2, scout: 2, sentinel: 2, warden: 1 }; // bigger-village caps (captain AI only)
let npcHolds = [];
let holdUnits = [];   // orange-tinted hold squad (Rover/Scout/Sentinel/Warden)
let holdProbes = [];  // exterior-only weak probes — NOT in wave `enemies[]`
let holdLaborers = []; // orange hold builders — separate from player/squad laborers
const HOLD_LABORER_PER_HOLD = 1;
const HOLD_LABORER_GROWN = 2;        // 4.1.1 — graduated villages field a second builder
const HOLD_AUTO_GRADUATE_SEC = 300;  // 4.1.1 — a hold graduates on its own ~5 min after worldgen even unvisited
const HOLD_ORB_CADENCE_PRE = 18;     // 4.1.1 — ambient orb seconds before graduation (was 22)
const HOLD_ORB_CADENCE_POST = 14;    // 4.1.1 — after graduation (was 42 AND dead code — see tickHoldOrbSpawner)
const HOLD_OFFLINE_SP_INTERVAL = 24; // 4.1.1 — undiscovered graduated holds trickle 1 orangeSp per interval
const HOLD_ORB_BUILDER_MAGNET = 168; // builders collect orbs first
const HOLD_BUILD_ORB_COST = 3;
const HOLD_DEFENSE_MAX = { big: 4, far: 5 };
const HOLD_ZONE_PAD = 90;
// 4.1.2 — holds FIGHT: real enemies (Burstweavers, wave leakers) within aggro of a
// fog-known hold pull its units off their posts; they engage, then drift home. Units
// never chase past the leash (never into the legacy core — holds sit ≥280 outside it).
const HOLD_COMBAT_ENABLED = true;      // soft-wire — false = pre-4.1.2 probe-only AI
const HOLD_AGGRO_R = 300;              // threat ring beyond the hold zone edge
const HOLD_LEASH_R = 600;              // max unit distance from hold center while engaging
const HOLD_ALERT_T = 6;                // seconds units converge after something is hit
const HOLD_CAPTAIN_HP = 320;           // captain finally has a health pool (fights too)
const HOLD_CAPTAIN_DMG = 15;           // baton strike
const HOLD_CAPTAIN_ATK_CD = 1.05;
const HOLD_CAPTAIN_DOWN_T = 26;        // seconds before a downed captain staggers back up
const HOLD_WATCHPOST_RANGE = 420;      // 4.1.2 — the watchpost is a real turret now
const HOLD_WATCHPOST_DMG = 12;
const HOLD_WATCHPOST_CD = 1.15;
// 4.1.2 — first-contact showcase build: player reaches a hold with < N structures →
// a build force-starts within ~20–30s of arrival (no orangeSp gate for this one).
const HOLD_SHOWCASE_ENABLED = true;    // soft-wire
const HOLD_SHOWCASE_MIN_STRUCTS = 2;   // fewer than this on first contact → guaranteed build
const HOLD_SHOWCASE_NEAR = 800;        // player distance that counts as "at the hold"
const HOLD_SHOWCASE_DELAY_MIN = 10;    // + walk + raise ≈ the promised 20–30s window
const HOLD_SHOWCASE_DELAY_MAX = 16;
// Step 6.6 — autonomous NPC village structures (orangeSp costs; no player RTS)
// Step 7.3 — captain extends after brickpad: watchpost → hut2 → depot → stakewall
const HOLD_STRUCTURE_KINDS = {
  hut: { name: 'Hold Hut', buildSec: 8, orangeSp: 4, r: 28, drawH: 36, hp: 160 },
  timber: { name: 'Timber Pile', buildSec: 10, orangeSp: 5, r: 24, drawH: 28, hp: 120 },
  brickpad: { name: 'Brick Pad', buildSec: 12, orangeSp: 6, r: 32, drawH: 22, hp: 200 },
  // 7.5 Continuity finals — stage-2 paced vs harvest inflow (was 7/8/9/10)
  watchpost: { name: 'Watchpost', buildSec: 10, orangeSp: 8, r: 22, drawH: 44, hp: 180 },
  hut2: { name: 'Second Hut', buildSec: 10, orangeSp: 9, r: 28, drawH: 36, hp: 160 },
  depot: { name: 'Orange Depot', buildSec: 12, orangeSp: 10, r: 30, drawH: 32, hp: 220 },
  stakewall: { name: 'Outer Stakewall', buildSec: 14, orangeSp: 12, r: 36, drawH: 28, hp: 260 },
  bikeshed: { name: 'Rift Bike Shed', buildSec: 11, orangeSp: 9, r: 26, drawH: 38, hp: 150 }, // 8.4
};
const HOLD_VILLAGE_BUILD_ORDER = ['hut', 'timber', 'brickpad']; // 6.6 core — KEPT
const HOLD_CAPTAIN_BUILD_ORDER = ['watchpost', 'bikeshed', 'hut2', 'depot', 'stakewall']; // 7.3 + 8.4 bikeshed
// 4.1.1 — captain rallies the crew per structure so growth reads at a glance
const HOLD_BUILD_RALLY = {
  hut: 'RAISE THE HUT!', timber: 'STACK THAT TIMBER!', brickpad: 'LAY THE BRICK PAD!',
  watchpost: 'RAISE THE WATCHPOST!', bikeshed: 'PARK THE BIKE!', hut2: 'ANOTHER HUT — MOVE!', depot: 'STOCK THE DEPOT!',
  stakewall: 'STAKE THE WALL!',
};
const HOLD_BUILD_SLOTS = [
  { dx: -72, dy: 20 },  // hut — clear NPCs + corner pillars
  { dx: 80, dy: 15 },   // timber pile — clear scout + SE pillar
  { dx: 24, dy: -46 },  // brick pad — north inner pad
  { dx: -55, dy: -58 }, // watchpost — NW lookout
  { dx: -28, dy: 68 },  // bikeshed — south inner (8.4)
  { dx: 62, dy: 48 },   // second hut — SE pad
  { dx: -88, dy: 42 },  // depot — SW outer
  { dx: 8, dy: 78 },    // outer stakewall — south approach
];
const HOLD_TEMPLATES = [
  {
    id: 'sunfall',
    name: 'Sunfall Outpost',
    x: LEGACY_WORLD.w / 2,
    y: LEGACY_WORLD.h + HOLD_PATH_OFFSET,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: HOLD_JOIN_WAVE_NEAR,
    defenseTier: 'big',
    npcs: [
      { name: 'Warden Sable', dx: -32, dy: -8 },
      { name: 'Scout Lenya', dx: 36, dy: 14 },
    ],
    greet: [
      "Sunfall still holds the southern road — rift ash hasn't buried us yet.",
      "We're holding position. Emberfall hasn't called for our spears… not yet.",
    ],
    refuse: [
      "Still green, Vanguard. Come back after wave {W}.",
      "We don't sign spears for tourists. Prove yourself past wave {W}.",
    ],
    join: [
      "You've bled enough nights — take a Sunfall spearman.",
      "Emberfall has our allegiance. One of ours marches with you.",
    ],
  },
  {
    id: 'eastwatch',
    name: 'Eastwatch Redoubt',
    x: LEGACY_WORLD.w + HOLD_PATH_OFFSET,
    y: LEGACY_WORLD.h / 2,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: HOLD_JOIN_WAVE_NEAR,
    defenseTier: 'big',
    npcs: [
      { name: 'Keeper Thorne', dx: -28, dy: 6 },
      { name: 'Spearman Voss', dx: 34, dy: -10 },
    ],
    greet: [
      "Eastwatch eyes the tear from this ridge. The brick is low but true.",
      "No reinforcements march with you today — we hold the line here.",
    ],
    refuse: [
      "Eastwatch doesn't lend spears to greenhorns. Wave {W}, then talk.",
      "Still early for you. Hold Emberfall through wave {W} first.",
    ],
    join: [
      "Fine — one Eastwatch spearman joins your banner.",
      "Thorne stamps the roster. March with our spears.",
    ],
  },
  {
    id: 'ashmarch',
    name: 'Ashmarch Hold',
    x: 4510, y: 4200,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: HOLD_JOIN_WAVE_FAR,
    defenseTier: 'far',
    npcs: [{ name: 'Captain Dryn', dx: -20, dy: 0 }],
    greet: [
      "Ashmarch is a waypoint, not a parade ground. We dig in and wait.",
      "Talk to Emberfall if you need soldiers — we're not rostered yet.",
    ],
    refuse: [
      "Ashmarch waits for veterans. Wave {W} minimum.",
      "You're still green out here. Try us again after wave {W}.",
    ],
    join: [
      "Dryn nods — one Ashmarch spearman reports to you.",
      "Waypoint no longer — our spears march with the Vanguard.",
    ],
  },
  {
    id: 'riftshore',
    name: 'Riftshore Camp',
    x: 4120, y: 4440,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: HOLD_JOIN_WAVE_FAR,
    defenseTier: 'far',
    npcs: [
      { name: 'Quarter Aeldra', dx: 0, dy: -12 },
      { name: 'Bowman Hest', dx: 40, dy: 18 },
    ],
    greet: [
      "Riftshore strings nets for refugees who never arrive.",
      "Our orange squad drills while the rift probes us — stay clear of the gauntlet.",
    ],
    refuse: [
      "Riftshore nets aren't for rookies. Wave {W}, then ask.",
      "Still green — come back after wave {W}.",
    ],
    join: [
      "Aeldra signs one spearman to your roster.",
      "Riftshore allegiance pledged — a spearman joins you.",
    ],
  },
  // 9.2 — Orange Quarter cluster (SE legacy marsh + path fork). Gates: Sunfall + Eastwatch.
  {
    id: 'emberwake',
    name: 'Emberwake Steading',
    x: 3860, y: 3960,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 8,
    defenseTier: 'big',
    npcs: [
      { name: 'Herder Malwen', dx: -30, dy: 4 },
      { name: 'Torchhand Bryn', dx: 34, dy: -8 },
    ],
    greet: [
      "Emberwake keeps the north fires lit — travelers steer by our smoke.",
      "You walked the whole ridge to find us? The rift owes you boots.",
    ],
    refuse: [
      "Our torches don't march with strangers. Wave {W}, then we talk.",
      "Bryn says no. Bryn's usually right. Wave {W}.",
    ],
    join: [
      "A torch for the Vanguard — one spearman walks with you.",
      "Malwen whistles — an Emberwake spear answers.",
    ],
  },
  {
    id: 'thornholt',
    name: 'Thornholt Palisade',
    x: 4120, y: 3960,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 12,
    defenseTier: 'far',
    npcs: [{ name: 'Palisader Ruk', dx: -18, dy: 2 }],
    greet: [
      "Thornholt grows its walls from the briar itself. Mind the barbs.",
      "Few make it this far east. Fewer leave unimpressed.",
    ],
    refuse: [
      "The briar doesn't bend for wave-{W} greenery. Come back harder.",
      "Ruk counts your scars — not enough. Wave {W}.",
    ],
    join: [
      "The briar parts — a Thornholt spearman marches out.",
      "Ruk grunts approval. One spear, no refunds.",
    ],
  },
  {
    id: 'greywater',
    name: 'Greywater Landing',
    x: 4380, y: 3960,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 10,
    defenseTier: 'far',
    npcs: [
      { name: 'Ferrier Oda', dx: -26, dy: -6 },
      { name: 'Netman Cale', dx: 30, dy: 12 },
    ],
    greet: [
      "Greywater ferried refugees before the river dried. Now we ferry rumors.",
      "Watch the shallows, Vanguard — things nest where the water was.",
    ],
    refuse: [
      "No spears for waders. Prove yourself past wave {W}.",
      "Cale's nets catch braver fish than you. Wave {W} first.",
    ],
    join: [
      "Oda stamps your ledger — one Greywater spearman aboard.",
      "The landing pledges a spear to the Vanguard.",
    ],
  },
  {
    id: 'mosslight',
    name: 'Mosslight Hollow',
    x: 4640, y: 3960,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 8,
    defenseTier: 'big',
    npcs: [{ name: 'Lampkeep Ivven', dx: -16, dy: 0 }],
    greet: [
      "Mosslight glows so the lost can find a hearth. You count as lost.",
      "The hollow hums at night. We pretend it's the lamps.",
    ],
    refuse: [
      "Ivven trims no wicks for rookies. Wave {W}, then ask.",
      "The hollow keeps its own. Wave {W} before we lend a spear.",
    ],
    join: [
      "A lantern and a spearman — Mosslight marches with you.",
      "Ivven nods once. That's as warm as it gets. One spear joins.",
    ],
  },
  {
    id: 'duskfen',
    name: 'Duskfen Waystation',
    x: 3990, y: 4200,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 12,
    defenseTier: 'far',
    npcs: [
      { name: 'Marshal Tev', dx: -28, dy: 8 },
      { name: 'Bogscout Fenna', dx: 32, dy: -10 },
    ],
    greet: [
      "Duskfen marks the last dry ground before the fen swallows the road.",
      "Fenna maps the bog by ear. Don't ask. It works.",
    ],
    refuse: [
      "The fen eats the unproven. Wave {W} or turn back.",
      "Tev won't sign a spear over to wave-{W} boots.",
    ],
    join: [
      "Tev salutes — a Duskfen spearman slogs out with you.",
      "The waystation pledges one spear. Keep it dry.",
    ],
  },
  {
    id: 'cinderrest',
    name: 'Cinderrest Refuge',
    x: 4250, y: 4200,
    halfW: HOLD_FOOT_HALF_W,
    halfH: HOLD_FOOT_HALF_H,
    joinWave: 12,
    defenseTier: 'far',
    npcs: [{ name: 'Wardmother Sel', dx: -20, dy: -2 }],
    greet: [
      "Cinderrest sits where the ash settles last. Nobody finds us by accident.",
      "You crossed the whole waste for this? Sel will want your story.",
    ],
    refuse: [
      "The refuge shelters; it does not lend. Wave {W}, then we bargain.",
      "Sel measures you mid. Wave {W} and try again.",
    ],
    join: [
      "Sel presses a warm coal into your palm — and a spearman to your line.",
      "Cinderrest remembers its debts. One spear, freely given.",
    ],
  },
];
const WORLD_VERSION = 1;
// Step 6.3/6.7 — Warcraft-style fog; Version B = legacy core always visible; A = full-black
const FOG_DISCOVERY_ENABLED = CONTINUOUS_MAP_ENABLED;
const FOG_DISCOVERY_DEFAULT = 'legacy-core-visible'; // Version B — Continuity default
const FOG_DISCOVERY_MODES = ['legacy-core-visible', 'full-black'];
let fogDiscoveryMode = FOG_DISCOVERY_DEFAULT;
const FOG_CHUNK_SIZE = 128;
const FOG_REVEAL_RADIUS = 240;
let fogChunksX = 0, fogChunksY = 0, fogDiscovered = null;
// 4.1.1 perf — minimap fog cached offscreen; full 70×70 chunk scan only when fog actually changes
let fogMiniCanvas = null, fogMiniDirty = true, fogMiniKey = '';
function normalizeFogDiscoveryMode(mode) {
  return FOG_DISCOVERY_MODES.includes(mode) ? mode : FOG_DISCOVERY_DEFAULT;
}
function getFogDiscoveryMode() { return fogDiscoveryMode; }
function applyFogDiscoveryMode(mode) {
  fogDiscoveryMode = normalizeFogDiscoveryMode(mode);
  fogMiniDirty = true;
}
function fogDiscoveryModeLabel(mode) {
  return normalizeFogDiscoveryMode(mode) === 'full-black' ? 'FULL BLACK (A)' : 'CORE VISIBLE (B)';
}
function resolveFogDiscoveryModeFromSave(savedWorld) {
  const saved = savedWorld && savedWorld.fogMode;
  if (saved && FOG_DISCOVERY_MODES.includes(saved)) return saved;
  return normalizeFogDiscoveryMode(settings.fogDiscoveryMode);
}
const WORLD = CONTINUOUS_MAP_ENABLED
  ? { w: LEGACY_WORLD.w + WORLD_EXT_PAD * 2, h: LEGACY_WORLD.h + WORLD_EXT_PAD * 2 }
  : { w: LEGACY_WORLD.w, h: LEGACY_WORLD.h };

function initFogGrid() {
  if (!FOG_DISCOVERY_ENABLED) { fogDiscovered = null; return; }
  fogChunksX = Math.ceil(WORLD.w / FOG_CHUNK_SIZE);
  fogChunksY = Math.ceil(WORLD.h / FOG_CHUNK_SIZE);
  fogDiscovered = new Uint8Array(Math.ceil(fogChunksX * fogChunksY / 8));
  fogMiniDirty = true;
}
function fogChunkIndex(cx, cy) { return cy * fogChunksX + cx; }
/** Version B — legacy rect chunks never fogged; Version A (full-black) returns false. */
function fogChunkIsLegacyCore(cx, cy) {
  if (fogDiscoveryMode !== 'legacy-core-visible') return false;
  const x0 = cx * FOG_CHUNK_SIZE, y0 = cy * FOG_CHUNK_SIZE;
  const x1 = Math.min(x0 + FOG_CHUNK_SIZE, WORLD.w), y1 = Math.min(y0 + FOG_CHUNK_SIZE, WORLD.h);
  return x1 > LEGACY_WORLD.x && x0 < LEGACY_WORLD.x + LEGACY_WORLD.w &&
         y1 > LEGACY_WORLD.y && y0 < LEGACY_WORLD.y + LEGACY_WORLD.h;
}
function isFogChunkDiscovered(cx, cy) {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return true;
  if (cx < 0 || cy < 0 || cx >= fogChunksX || cy >= fogChunksY) return true;
  if (fogChunkIsLegacyCore(cx, cy)) return true;
  const idx = fogChunkIndex(cx, cy);
  return !!(fogDiscovered[idx >> 3] & (1 << (idx & 7)));
}
function setFogChunkDiscovered(cx, cy) {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return;
  if (fogChunkIsLegacyCore(cx, cy)) return;
  const idx = fogChunkIndex(cx, cy);
  const byte = idx >> 3, bit = 1 << (idx & 7);
  if (!(fogDiscovered[byte] & bit)) {
    fogDiscovered[byte] |= bit;
    fogMiniDirty = true;
  }
}
function revealFogAt(x, y, radius = FOG_REVEAL_RADIUS) {
  if (!FOG_DISCOVERY_ENABLED) return;
  const c0 = Math.floor((x - radius) / FOG_CHUNK_SIZE);
  const c1 = Math.floor((x + radius) / FOG_CHUNK_SIZE);
  const r0 = Math.floor((y - radius) / FOG_CHUNK_SIZE);
  const r1 = Math.floor((y + radius) / FOG_CHUNK_SIZE);
  const r2 = radius * radius, pad = FOG_CHUNK_SIZE * 0.72;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const mx = cx * FOG_CHUNK_SIZE + FOG_CHUNK_SIZE * 0.5;
    const my = cy * FOG_CHUNK_SIZE + FOG_CHUNK_SIZE * 0.5;
    if ((mx - x) ** 2 + (my - y) ** 2 <= r2 + pad * pad) setFogChunkDiscovered(cx, cy);
  }
}
function updateFogDiscovery() {
  if (!FOG_DISCOVERY_ENABLED) return;
  revealFogAt(player.x, player.y);
}
function snapshotFogDiscovered() {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return undefined;
  return Array.from(fogDiscovered);
}
function applyFogSave(data) {
  initFogGrid();
  if (!FOG_DISCOVERY_ENABLED || !data) return;
  if (Array.isArray(data.discovered) && data.discovered.length) {
    const bytes = new Uint8Array(data.discovered);
    fogDiscovered.set(bytes.subarray(0, fogDiscovered.length));
  }
  fogMiniDirty = true;
}

function fogChunkCenterXY(cx, cy) {
  return { x: cx * FOG_CHUNK_SIZE + FOG_CHUNK_SIZE * 0.5, y: cy * FOG_CHUNK_SIZE + FOG_CHUNK_SIZE * 0.5 };
}
function isFogChunkInVision(cx, cy) {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return true;
  if (fogChunkIsLegacyCore(cx, cy)) return true;
  const c = fogChunkCenterXY(cx, cy);
  const r = FOG_REVEAL_RADIUS + FOG_CHUNK_SIZE * 0.45;
  return dist2(c.x, c.y, player.x, player.y) <= r * r;
}
function isFogChunkShrouded(cx, cy) {
  if (!FOG_SHROUD_ENABLED || !FOG_DISCOVERY_ENABLED || !fogDiscovered) return false;
  if (fogChunkIsLegacyCore(cx, cy)) return false;
  return isFogChunkDiscovered(cx, cy) && !isFogChunkInVision(cx, cy);
}
function fogChunkExterior(cx, cy) {
  if (!CONTINUOUS_MAP_ENABLED) return false;
  const c = fogChunkCenterXY(cx, cy);
  return !inLegacyWorld(c.x, c.y);
}
function isSpiderDenChunkOk(cx, cy) {
  if (!fogChunkExterior(cx, cy)) return false;
  if (!SPIDER_DEN_LEGACY_EXCLUDE) return true;
  const c = fogChunkCenterXY(cx, cy);
  return !inLegacyWorld(c.x, c.y);
}
function spiderDenCountForWave(w) {
  return Math.min(SPIDER_DEN_PER_WAVE_MAX,
    SPIDER_DEN_PER_WAVE_MIN + Math.floor(w / SPIDER_DEN_WAVE_SCALE));
}
function pickSpiderDenChunks(need) {
  const discovered = [];
  for (let cy = 0; cy < fogChunksY; cy++) for (let cx = 0; cx < fogChunksX; cx++) {
    if (!isSpiderDenChunkOk(cx, cy) || !isFogChunkDiscovered(cx, cy)) continue;
    const center = fogChunkCenterXY(cx, cy);
    discovered.push({ cx, cy, x: center.x, y: center.y });
  }
  const seeds = [];
  const lx = LEGACY_WORLD.w, ly = LEGACY_WORLD.h, cx0 = lx / 2, cy0 = ly / 2;
  seeds.push(
    { x: cx0, y: ly + HOLD_PATH_OFFSET + 60 },
    { x: lx + HOLD_PATH_OFFSET + 60, y: cy0 },
    { x: 5200, y: cy0 }, { x: cx0, y: 5200 }, { x: 5200, y: 5200 },
  );
  for (const h of npcHolds) {
    if (!inLegacyWorld(h.x, h.y)) seeds.push({ x: h.x, y: h.y });
  }
  const picks = [];
  const used = new Set();
  const take = (cx, cy) => {
    const k = cx + ',' + cy;
    if (used.has(k) || !isSpiderDenChunkOk(cx, cy)) return false;
    used.add(k);
    const center = fogChunkCenterXY(cx, cy);
    picks.push({ cx, cy, x: center.x, y: center.y });
    return true;
  };
  while (picks.length < need && discovered.length) {
    const i = (Math.random() * discovered.length) | 0;
    const d = discovered.splice(i, 1)[0];
    take(d.cx, d.cy);
  }
  for (const s of seeds) {
    if (picks.length >= need) break;
    const cx = Math.floor(s.x / FOG_CHUNK_SIZE), cy = Math.floor(s.y / FOG_CHUNK_SIZE);
    if (cx < 0 || cy < 0 || cx >= fogChunksX || cy >= fogChunksY) continue;
    if (take(cx, cy)) setFogChunkDiscovered(cx, cy);
  }
  for (let cy = 0; cy < fogChunksY && picks.length < need; cy++) {
    for (let cx = 0; cx < fogChunksX; cx++) {
      if (picks.length >= need) break;
      if (take(cx, cy)) setFogChunkDiscovered(cx, cy);
    }
  }
  return picks;
}
function stampSpiderDensOnWaveStart() {
  spiderDens.length = 0;
  if (!SPIDER_DEN_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  const need = spiderDenCountForWave(wave);
  spiderDens.push(...pickSpiderDenChunks(need));
}
function pickSpiderDenSpawnPos() {
  if (!SPIDER_DEN_ENABLED || !spiderDens.length) return null;
  const den = spiderDens[(Math.random() * spiderDens.length) | 0];
  for (let i = 0; i < 6; i++) {
    const x = den.x + rand(-48, 48), y = den.y + rand(-48, 48);
    if (!inLegacyWorld(x, y) && x > 60 && y > 60 && x < WORLD.w - 60 && y < WORLD.h - 60) return { x, y };
  }
  return { x: den.x, y: den.y };
}

function drawFogOverlay() {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return;
  const cx0 = Math.max(0, Math.floor(camera.x / FOG_CHUNK_SIZE));
  const cy0 = Math.max(0, Math.floor(camera.y / FOG_CHUNK_SIZE));
  const cx1 = Math.min(fogChunksX, Math.ceil((camera.x + VW) / FOG_CHUNK_SIZE));
  const cy1 = Math.min(fogChunksY, Math.ceil((camera.y + VH) / FOG_CHUNK_SIZE));
  for (let cy = cy0; cy < cy1; cy++) for (let cx = cx0; cx < cx1; cx++) {
    if (fogChunkIsLegacyCore(cx, cy) || isFogChunkInVision(cx, cy)) continue;
    const x = cx * FOG_CHUNK_SIZE, y = cy * FOG_CHUNK_SIZE;
    const w = Math.min(FOG_CHUNK_SIZE, WORLD.w - x), h = Math.min(FOG_CHUNK_SIZE, WORLD.h - y);
    if (!isFogChunkDiscovered(cx, cy)) {
      ctx.fillStyle = 'rgba(4,6,10,0.94)';
      ctx.fillRect(x, y, w, h);
    } else if (FOG_SHROUD_ENABLED) {
      ctx.fillStyle = 'rgba(18,22,32,' + FOG_SHROUD_ALPHA + ')';
      ctx.fillRect(x, y, w, h);
    }
  }
}
function drawFogMinimap(g, toX, toY, sx, sy) {
  if (!FOG_DISCOVERY_ENABLED || !fogDiscovered) return;
  const csx = FOG_CHUNK_SIZE * sx, csy = FOG_CHUNK_SIZE * sy;
  if (csx < 0.35 || csy < 0.35) return;
  // 4.1.1 perf — the 70×70 chunk scan (~4900 iterations + thousands of fillRects) used to
  // run EVERY frame inside updateHud→drawMinimap and was a top mobile frame-time cost.
  // Cache the fog layer offscreen; rescan only when a chunk is revealed / mode / size change.
  const cw = g.canvas.width, chh = g.canvas.height;
  const key = cw + 'x' + chh + ':' + fogDiscoveryMode +
    (FOG_SHROUD_ENABLED ? ':' + (Math.floor(player.x / FOG_CHUNK_SIZE) | 0) + ',' + (Math.floor(player.y / FOG_CHUNK_SIZE) | 0) : '');
  if (!fogMiniCanvas) {
    fogMiniCanvas = (typeof document !== 'undefined' && document.createElement)
      ? document.createElement('canvas') : null;
    if (!fogMiniCanvas) { // headless smoke fallback — direct draw (old path)
      for (let cy = 0; cy < fogChunksY; cy++) for (let cx = 0; cx < fogChunksX; cx++) {
        if (fogChunkIsLegacyCore(cx, cy) || isFogChunkInVision(cx, cy)) continue;
        const x = cx * FOG_CHUNK_SIZE, y = cy * FOG_CHUNK_SIZE;
        if (!isFogChunkDiscovered(cx, cy)) {
          g.fillStyle = 'rgba(0,0,0,0.88)';
          g.fillRect(toX(x), toY(y), Math.max(1, csx), Math.max(1, csy));
        } else if (FOG_SHROUD_ENABLED) {
          g.fillStyle = 'rgba(18,22,32,0.55)';
          g.fillRect(toX(x), toY(y), Math.max(1, csx), Math.max(1, csy));
        }
      }
      return;
    }
  }
  if (fogMiniDirty || fogMiniKey !== key) {
    fogMiniKey = key;
    fogMiniDirty = false;
    fogMiniCanvas.width = cw; fogMiniCanvas.height = chh;
    const fg = fogMiniCanvas.getContext('2d');
    if (fg) {
      fg.clearRect(0, 0, cw, chh);
      for (let cy = 0; cy < fogChunksY; cy++) for (let cx = 0; cx < fogChunksX; cx++) {
        if (fogChunkIsLegacyCore(cx, cy) || isFogChunkInVision(cx, cy)) continue;
        const x = cx * FOG_CHUNK_SIZE, y = cy * FOG_CHUNK_SIZE;
        if (!isFogChunkDiscovered(cx, cy)) {
          fg.fillStyle = 'rgba(0,0,0,0.88)';
          fg.fillRect(toX(x), toY(y), Math.max(1, csx), Math.max(1, csy));
        } else if (FOG_SHROUD_ENABLED) {
          fg.fillStyle = 'rgba(18,22,32,0.55)';
          fg.fillRect(toX(x), toY(y), Math.max(1, csx), Math.max(1, csy));
        }
      }
    }
  }
  g.drawImage(fogMiniCanvas, 0, 0);
}
const CAMP = { x: LEGACY_WORLD.w / 2, y: LEGACY_WORLD.h / 2 };
const FORT  = { x: LEGACY_WORLD.w - 1280, y: 160, w: 1100, h: 1000 };            // Northreach Fort (stone)
const ASH   = { x: 160, y: LEGACY_WORLD.h - 1280, w: 1150, h: 1120 };            // The Ashen Reach
const MARSH = { x: LEGACY_WORLD.w - 1400, y: LEGACY_WORLD.h - 1400, w: 1240, h: 1240 }; // Duskmere Marsh

function legacySpawnBounds() { return LEGACY_WORLD; } // wave spawns stay at legacy edge (6.0)
function inLegacyWorld(x, y) {
  return x >= LEGACY_WORLD.x && x < LEGACY_WORLD.x + LEGACY_WORLD.w &&
         y >= LEGACY_WORLD.y && y < LEGACY_WORLD.y + LEGACY_WORLD.h;
}
/** Cardinal path corridor from legacy edge inward (Step 6.2). */
function isLegacyPathCorridor(x, y) {
  if (!CONTINUOUS_MAP_ENABLED) return false;
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const cx = lx + lw / 2, cy = ly + lh / 2;
  const half = LEGACY_PATH_CORRIDOR_HALF;
  const depth = LEGACY_PATH_INTERIOR_DEPTH;
  if (Math.abs(x - cx) < half && y >= ly && y <= ly + depth) return true;
  if (Math.abs(x - cx) < half && y >= ly + lh - depth && y <= ly + lh) return true;
  if (Math.abs(y - cy) < half && x >= lx && x <= lx + depth) return true;
  if (Math.abs(y - cy) < half && x >= lx + lw - depth && x <= lx + lw) return true;
  return false;
}
/** Border-ring tree skip — same corridor band as path stubs. */
function isLegacyBorderPathSlot(x, y) {
  return isLegacyPathCorridor(x, y);
}
function isNearGoldMine(x, y, pad = 52) {
  for (const m of goldMines) {
    if (dist2(x, y, m.x, m.y) < (m.r + pad) ** 2) return true;
  }
  for (const m of coalMines) {
    if (dist2(x, y, m.x, m.y) < (m.r + pad) ** 2) return true;
  }
  return false;
}
/** Step 9.1 — NW exterior bowl reserved for Step 10 lake (no trees/mines here). */
function isLakeReserve(x, y) {
  if (!LAKE_RESERVE_ENABLED || !CONTINUOUS_MAP_ENABLED) return false;
  const r = LAKE_RESERVE;
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}
// ---------- Step 10.1 — Ashmere water body (analytic blob; no tile array) ----------
/** Lake field for a raw offset from LAKE_BLOB center: <1 water, ≥1 dry. Superellipse plus
 * deterministic shrink-only wobble (organic shore inside the draft envelope). Cheap: bbox
 * early-out first, trig skipped when far outside; zero allocation. */
function lakeFieldOffset(dx, dy) {
  if (dx < -LAKE_BLOB.a || dx > LAKE_BLOB.a || dy < -LAKE_BLOB.b || dy > LAKE_BLOB.b) return 9;
  const f = Math.pow(Math.abs(dx) / LAKE_BLOB.a, LAKE_BLOB.n) +
            Math.pow(Math.abs(dy) / LAKE_BLOB.b, LAKE_BLOB.n);
  if (f > 1.35) return f; // beyond every wobble valley — skip the trig
  const th = Math.atan2(dy, dx);
  const wob = 1 - 0.05 * (0.5 + 0.5 * Math.sin(th * 3 + 1.7))
                - 0.04 * (0.5 + 0.5 * Math.sin(th * 5 - 0.6)); // ∈ [0.91, 1] — shrink only
  return f / wob;
}
function lakeFieldAt(x, y) { return lakeFieldOffset(x - LAKE_BLOB.cx, y - LAKE_BLOB.cy); }
/** True if (x,y) is Ashmere water (the Driftwood Isle carve stays dry land). */
function isLakeWaterAt(x, y) {
  if (!LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return false;
  if (lakeFieldAt(x, y) >= 1) return false;
  return dist2(x, y, LAKE_ISLE.x, LAKE_ISLE.y) >= LAKE_ISLE.r * LAKE_ISLE.r;
}
/** Shallow band: outer ~46px of water plus the ring around the isle (10.3 mount zone). */
function isLakeShallowAt(x, y) {
  if (!isLakeWaterAt(x, y)) return false;
  if (lakeFieldAt(x, y) >= LAKE_SHALLOW_FIELD) return true;
  const rr = LAKE_ISLE.r + LAKE_SHALLOW_BAND;
  return dist2(x, y, LAKE_ISLE.x, LAKE_ISLE.y) < rr * rr;
}
/** Nearest dry point for a WATER pos (callers gate on isLakeWaterAt): the field scales as
 * s^n along a center ray, so the shore sits at s = field^(-1/n) exactly — one pow, no
 * search. Zero-distance offsets get a fixed camp-side ray: no divide-by-zero, no NaN. */
function lakeNearestShore(x, y, pad) {
  let dx = x - LAKE_BLOB.cx, dy = y - LAKE_BLOB.cy;
  let d2 = dx * dx + dy * dy;
  if (d2 < 1) { dx = 1; dy = 1; d2 = 2; } // dead-center guard (isle covers it today; keep anyway)
  const g = Math.max(lakeFieldOffset(dx, dy), 1e-9);
  const m = Math.pow(g, -1 / LAKE_BLOB.n) + (LAKE_SHORE_MARGIN + (pad || 0)) / Math.sqrt(d2);
  return { x: LAKE_BLOB.cx + dx * m, y: LAKE_BLOB.cy + dy * m };
}
/** Spawn guard — water hits re-route to the nearest dry shore point (mainland side). */
function lakeGuardSpawnPos(x, y, pad) {
  if (!LAKE_SPAWN_GUARD_ENABLED || !isLakeWaterAt(x, y)) return { x, y };
  return lakeNearestShore(x, y, pad == null ? 24 : pad);
}
/** Shore clamp for every land actor (player/enemies/militia/companions/laborers/hold
 * units/Colossus — all funnel through collideObstacles). Radial push mirrors the circle
 * obstacle push-out, so walking at the shore slides along it. Water is NOT an obstacles[]
 * entry — no grid pollution. 10.3 skiff hull will set ent.waterOk to opt out. */
function clampLakeShore(ent) {
  if (!LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED || ent.waterOk) return;
  if (!isLakeWaterAt(ent.x, ent.y)) return; // dry / isle — bbox early-out keeps this cheap
  // Step 10.2 — the player (and ONLY the player) may stand on Emberfall Dock planks;
  // enemies/companions/militia/laborers keep the plain shore clamp and never walk the pier.
  if (LAKE_DOCK_ENABLED && ent === player && clampToDockDeck(ent)) return;
  // Step 10.4 — same player-only catch for the Driftwood Isle mini-pier deck.
  if (isleContentActive() && ent === player && clampToIslePierDeck(ent)) return;
  // Step 10.4 — the player (only) clamps to the NEARER dry edge when wet inside the isle's
  // shallow ring: back onto the isle rim, not the outer shore. Before this, a rim walk-off
  // radial-solved across the strait (~600px teleport) — which would beach a player away
  // from a skiff moored at the isle pier. Enemies keep the outer-shore solve everywhere:
  // 10.1's water wall stands and nothing on legs can ever reach isle-adjacent water anyway.
  if (isleContentActive() && ent === player) {
    const ix = ent.x - LAKE_ISLE.x, iy = ent.y - LAKE_ISLE.y;
    const id = Math.hypot(ix, iy);
    if (id > 1e-6 && id < LAKE_ISLE.r + LAKE_SHALLOW_BAND) {
      const m = (LAKE_ISLE.r - LAKE_SHORE_MARGIN) / id;
      ent.x = LAKE_ISLE.x + ix * m;
      ent.y = LAKE_ISLE.y + iy * m;
      return;
    }
  }
  let dx = ent.x - LAKE_BLOB.cx, dy = ent.y - LAKE_BLOB.cy;
  let d2 = dx * dx + dy * dy;
  if (d2 < 1) { dx = 1; dy = 1; d2 = 2; } // zero-distance normal guard — never /0 → NaN
  const g = Math.max(lakeFieldOffset(dx, dy), 1e-9);
  const m = Math.pow(g, -1 / LAKE_BLOB.n) + LAKE_SHORE_MARGIN / Math.sqrt(d2);
  ent.x = LAKE_BLOB.cx + dx * m;
  ent.y = LAKE_BLOB.cy + dy * m;
}
/** 9.3-style steer assist at the waterline: tangent along the shore, signed toward the
 * target, biased slightly off-shore so the slide hugs without re-clipping the water. */
function lakeShoreTangent(e, tgtX, tgtY) {
  let nx = e.x - LAKE_BLOB.cx, ny = e.y - LAKE_BLOB.cy;
  const d = Math.hypot(nx, ny) || 1;
  nx /= d; ny /= d;
  let tx = -ny, ty = nx;
  if (tx * (tgtX - e.x) + ty * (tgtY - e.y) < 0) { tx = -tx; ty = -ty; }
  const ux = tx + nx * 0.25, uy = ty + ny * 0.25;
  const len = Math.hypot(ux, uy) || 1;
  return { ux: ux / len, uy: uy / len };
}

// ---------- Step 10.2 — Emberfall Dock (wooden pier on the SE shore facing camp) ----------
const LAKE_DOCK_ENABLED = true; // soft-wire — false = bare SE shore (no pier/moor/decor/label)
const LAKE_DOCK_LEN = 150;      // planks: dry apron → ~122px past the waterline (clears the 46px shallows)
const LAKE_DOCK_HALF_W = 23;    // deck half-width (46px wide — player r15 fits with edge margin)
const LAKE_DOCK_BASE_IN = 28;   // px of dry meadow between the waterline solve and the first plank
const LAKE_DOCK_EDGE = 8;       // deck-edge margin the clamp preserves — no side/head step-offs
const LAKE_DOCK_GRACE = 26;     // px past the deck rect that still reads as boarding, not swimming
const LAKE_DOCK_MOOR_OUT = 24;  // moor snap point this far off the pier head (10.3 skiff sits here)
/** Deterministic pier frame — the dock rides the camp-facing shore ray (blob center → CAMP),
 * snapped to the exact 10.1 waterline solve (same radial math as buildLakeShorePts). Base on
 * the dry meadow, head + moor over open water. Pure consts — no worldgen rolls, no rand(). */
const LAKE_DOCK = (() => {
  const vx = CAMP.x - LAKE_BLOB.cx, vy = CAMP.y - LAKE_BLOB.cy;
  const d = Math.hypot(vx, vy) || 1;          // camp/center are fixed consts ≈1400 apart — never 0
  const ux = vx / d, uy = vy / d;             // unit ray: lake center → camp (the dry side)
  const m = Math.pow(Math.max(lakeFieldOffset(ux, uy), 1e-9), -1 / LAKE_BLOB.n);
  const sx = LAKE_BLOB.cx + ux * m, sy = LAKE_BLOB.cy + uy * m; // SE waterline point facing camp
  const baseX = sx + ux * LAKE_DOCK_BASE_IN, baseY = sy + uy * LAKE_DOCK_BASE_IN;
  const ax = -ux, ay = -uy;                   // walk axis: meadow base → pier head (into the lake)
  return {
    baseX, baseY, ax, ay,
    headX: baseX + ax * LAKE_DOCK_LEN, headY: baseY + ay * LAKE_DOCK_LEN,
    moorX: baseX + ax * (LAKE_DOCK_LEN + LAKE_DOCK_MOOR_OUT), // 10.3 Rift Skiff snap point
    moorY: baseY + ay * (LAKE_DOCK_LEN + LAKE_DOCK_MOOR_OUT),
  };
})();
/** True when (x,y) stands on the Emberfall Dock deck. Pier-local rect test via dot products
 * against the fixed unit axes — no divides, no NaN surface. */
function isOnDock(x, y) {
  if (!LAKE_DOCK_ENABLED || !LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return false;
  const rx = x - LAKE_DOCK.baseX, ry = y - LAKE_DOCK.baseY;
  const u = rx * LAKE_DOCK.ax + ry * LAKE_DOCK.ay;      // along the planks (0=base)
  if (u < -2 || u > LAKE_DOCK_LEN) return false;
  const v = ry * LAKE_DOCK.ax - rx * LAKE_DOCK.ay;      // across the deck
  return Math.abs(v) <= LAKE_DOCK_HALF_W;
}
/** Player-only deck catch inside clampLakeShore: an in-water position on/near the pier clamps
 * back onto the deck rect (u along, v across) instead of taking the radial shore push — the
 * player walks the pier over open water but can never step off the sides or the head end.
 * Boarding/leaving over the base apron needs no case here: the base strip is dry meadow.
 * Idempotent, dot products only (no zero-length normal divides for the NaN sentinel to catch). */
function clampToDockDeck(ent) {
  const D = LAKE_DOCK;
  const rx = ent.x - D.baseX, ry = ent.y - D.baseY;
  const u = rx * D.ax + ry * D.ay;
  if (u < 0 || u > LAKE_DOCK_LEN + LAKE_DOCK_GRACE) return false; // behind base / past head+grace
  const v = ry * D.ax - rx * D.ay;
  if (Math.abs(v) > LAKE_DOCK_HALF_W + LAKE_DOCK_GRACE) return false; // too far off the side
  const cu = Math.min(u, LAKE_DOCK_LEN - LAKE_DOCK_EDGE);
  const cv = clamp(v, -(LAKE_DOCK_HALF_W - LAKE_DOCK_EDGE), LAKE_DOCK_HALF_W - LAKE_DOCK_EDGE);
  ent.x = D.baseX + D.ax * cu - D.ay * cv;
  ent.y = D.baseY + D.ay * cu + D.ax * cv;
  return true;
}
/** Step 10.2 worldgen — keep the pier approach walkable (no random rock parked on the deck
 * or boarding apron) and dress the shoreline with NON-colliding decor[] only. Deterministic:
 * fixed angular offsets along the same waterline solve — nothing lands in water, nothing is
 * added to obstacles[] (10.1 spawn walks + shore-clamp guarantees stay intact). */
function seedEmberfallDock() {
  if (!LAKE_DOCK_ENABLED || !LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  const D = LAKE_DOCK;
  for (let i = obstacles.length - 1; i >= 0; i--) { // deck + apron + decor strip stays clear
    const o = obstacles[i], r = o.r || 0;
    const rx = o.x - D.baseX, ry = o.y - D.baseY;
    const u = rx * D.ax + ry * D.ay, v = ry * D.ax - rx * D.ay;
    if (u > -90 - r && u < LAKE_DOCK_LEN + 40 && Math.abs(v) < LAKE_DOCK_HALF_W + 46 + r) obstacles.splice(i, 1);
  }
  // reeds / cattails / driftwood fan on the DRY side of the waterline around the pier
  const th0 = Math.atan2(CAMP.y - LAKE_BLOB.cy, CAMP.x - LAKE_BLOB.cx);
  const kinds = ['reed', 'cattail', 'driftwood', 'cattail', 'reed', 'cattail',
                 'cattail', 'reed', 'driftwood', 'cattail', 'reed', 'cattail'];
  for (let i = 0; i < kinds.length; i++) {
    const th = th0 + (i - (kinds.length - 1) / 2) * 0.062; // ≈ ±20° fan around the dock ray
    if (Math.abs(th - th0) < 0.045) continue;              // keep the boarding lane itself clear
    const ux = Math.cos(th), uy = Math.sin(th);
    const m = Math.pow(Math.max(lakeFieldOffset(ux, uy), 1e-9), -1 / LAKE_BLOB.n)
            + 10 + 9 * ((i * 37) % 3);                     // 10–28px onto the dry meadow
    decor.push({ x: LAKE_BLOB.cx + ux * m, y: LAKE_BLOB.cy + uy * m, type: kinds[i], seed: i * 1.7, dockDecor: true });
  }
  // ember lantern + rope crate flanking the base (Emberfall lights its own pier)
  const px = -D.ay, py = D.ax; // deck cross axis
  decor.push({ x: D.baseX - D.ax * 34 + px * (LAKE_DOCK_HALF_W + 18),
               y: D.baseY - D.ay * 34 + py * (LAKE_DOCK_HALF_W + 18), type: 'docklantern', seed: 1.3, dockDecor: true });
  decor.push({ x: D.baseX - D.ax * 20 - px * (LAKE_DOCK_HALF_W + 22),
               y: D.baseY - D.ay * 20 - py * (LAKE_DOCK_HALF_W + 22), type: 'dockcrate', seed: 2.6, dockDecor: true });
}

// ---------- Step 10.3 — Ashen Rift Skiff (wreck → repair → own; the bike flow, water-side) ----------
const BOAT_ENABLED = true;            // soft-wire — whole kit no-ops if LAKE_WATER_ENABLED is off
const BOAT_WAVE_GATE_ENABLED = true;  // no launch mid-wave; ash-choked water if a wave catches you afloat
const BOAT_FUEL_MODEL = 'none';       // LOCKED at 10.0 — free rowing ('shared' bike-fuel model B = deferred)
const BOAT_REPAIR_WOOD = 40;          // wood-heavy — it's a hull (bike stays 30🪵/18🜚)
const BOAT_REPAIR_GOLD = 10;
const BOAT_INTERACT_R = 95;           // board/repair walk-up radius (bike parity)
const BOAT_SPEED_MUL = 1.30;          // top ≈1.30× walk — the bike (1.85×) stays the fast one
const BOAT_ACCEL_SEC = 1.1;           // thrust: ≈1.1s from rest to top speed
const BOAT_GLIDE_HALF = 0.8;          // glide: velocity half-life once the oars lift
const BOAT_HULL_MARGIN = 12;          // hull keeps this many px inside the waterline / off the isle rim
const BOAT_DOCK_SNAP_R = 120;         // dismount this close to the moor point → snap-moor at the dock
const BOAT_WAVE_GRACE = 10;           // seconds of grace when a wave starts while afloat
const BOAT_ASH_DRAIN_DPS = 3;         // then ash-choked water drains HP/s until ashore
function boatActive() { return BOAT_ENABLED && LAKE_WATER_ENABLED && CONTINUOUS_MAP_ENABLED; }
/** Worldgen — waterlogged skiff beached one deck-width off the pier side, snapped just DRY of
 * the waterline on its own center ray (same solve as the 10.2 decor fan — straight-line
 * offsets can't be trusted against a curving shore). Scenery only: never enters obstacles[],
 * so the 10.1 spawn-walk + shore-clamp guarantees are untouched. Sits inside the strip
 * seedEmberfallDock already cleared → always walkable. */
function buildBoatWreck() {
  boatWreck = null;
  if (!boatActive()) return;
  const D = LAKE_DOCK;
  const gx = D.baseX - D.ay * (LAKE_DOCK_HALF_W + 42) + D.ax * 22;
  const gy = D.baseY + D.ax * (LAKE_DOCK_HALF_W + 42) + D.ay * 22;
  const dx = gx - LAKE_BLOB.cx, dy = gy - LAKE_BLOB.cy;
  const d = Math.hypot(dx, dy) || 1;
  const m = Math.pow(Math.max(lakeFieldOffset(dx, dy), 1e-9), -1 / LAKE_BLOB.n) + 8 / d;
  boatWreck = { x: LAKE_BLOB.cx + dx * m, y: LAKE_BLOB.cy + dy * m, dripT: 0 };
}
function boatWreckDist2() { return boatWreck ? dist2(player.x, player.y, boatWreck.x, boatWreck.y) : 1e12; }
function boatMoorDist2() { return boat.owned ? dist2(player.x, player.y, boat.x, boat.y) : 1e12; }
function canInteractBoatWreck() {
  return boatActive() && boatWreck && !boat.owned &&
    boatWreckDist2() < BOAT_INTERACT_R * BOAT_INTERACT_R;
}
function canMountBoat() {
  return boatActive() && boat.owned && !boat.mounted && !bike.mounted && !player.downed &&
    boatMoorDist2() < BOAT_INTERACT_R * BOAT_INTERACT_R;
}
function tryRepairBoat() {
  if (!canInteractBoatWreck()) return false;
  if (wood < BOAT_REPAIR_WOOD || gold < BOAT_REPAIR_GOLD) {
    addFloater(boatWreck.x, boatWreck.y - 50, `NEED ${BOAT_REPAIR_WOOD} wood + ${BOAT_REPAIR_GOLD} gold`, '#ffb878', false);
    return false;
  }
  wood -= BOAT_REPAIR_WOOD;
  gold -= BOAT_REPAIR_GOLD;
  const wx = boatWreck.x, wy = boatWreck.y;
  boatWreck = null;
  boat.owned = true;
  boat.mounted = false;
  boat.x = LAKE_DOCK.moorX;  // restored hull floats at the 10.2 moor snap point
  boat.y = LAKE_DOCK.moorY;
  boat.moorDockId = 'emberfall';
  boat.ang = Math.atan2(LAKE_DOCK.ay, LAKE_DOCK.ax);
  spawnParticles(wx, wy, 26, '#7fd8e8', 5);
  addFloater(wx, wy - 56, 'ASHEN RIFT SKIFF RESTORED!', '#7fd8e8', true);
  banner('SKIFF AFLOAT', 'board at the pier head · beach at any shore');
  sfx.play('place');
  return true;
}
function mountBoat() {
  if (!boatActive() || boat.mounted || !boat.owned || player.downed || bike.mounted) return false;
  if (BOAT_WAVE_GATE_ENABLED && waveActive) {
    addFloater(player.x, player.y - 40, 'THE HORDE CALLS — SHORE FIRST', '#ffb878', false);
    return false;
  }
  if (boatMoorDist2() > BOAT_INTERACT_R * BOAT_INTERACT_R) return false;
  boat.mounted = true;
  boat.moorDockId = null;        // underway — re-set on dismount
  player.waterOk = true;         // the 10.1 designed opt-out; clampSkiffToWater owns the hull now
  player.x = boat.x;             // step aboard — rider and hull share a position while mounted
  player.y = boat.y;
  player.vx = 0; player.vy = 0;
  player.form = 0;
  beam = null; charging = false; beamCharge = 0; // bike-mount parity
  boat.ashT = 0; boat.ashWarned = false;
  addFloater(player.x, player.y - 48, '⛵ RIFT SKIFF', '#7fd8e8', true);
  sfx.play('dash');
  return true;
}
/** Nearest DRY ground for a hull position — outer shore vs Driftwood Isle rim, whichever is
 * closer (lakeNearestShore alone would teleport an isle-side dismount across the strait). */
function boatStepAshore(x, y, pad) {
  const outer = lakeNearestShore(x, y, pad);
  const ix = x - LAKE_ISLE.x, iy = y - LAKE_ISLE.y;
  const idist = Math.hypot(ix, iy);
  if (idist > 1e-6 && (idist - LAKE_ISLE.r) < Math.hypot(outer.x - x, outer.y - y)) {
    const m = (LAKE_ISLE.r - (pad || 0) - 4) / idist;
    return { x: LAKE_ISLE.x + ix * m, y: LAKE_ISLE.y + iy * m };
  }
  return outer;
}
function boatDockDismountSpot() { // pier-head deck point — inside the clampToDockDeck rect
  const u = LAKE_DOCK_LEN - LAKE_DOCK_EDGE - 4;
  return { x: LAKE_DOCK.baseX + LAKE_DOCK.ax * u, y: LAKE_DOCK.baseY + LAKE_DOCK.ay * u };
}
function tryDismountBoat(silent) {
  if (!boat.mounted) return false;
  const D = LAKE_DOCK;
  const nearMoor = LAKE_DOCK_ENABLED &&
    dist2(player.x, player.y, D.moorX, D.moorY) < BOAT_DOCK_SNAP_R * BOAT_DOCK_SNAP_R;
  // Step 10.4 — second berth: the Driftwood Isle mini-pier moor (same snap radius).
  const nearIsleMoor = !nearMoor && isleContentActive() &&
    dist2(player.x, player.y, LAKE_ISLE_PIER.moorX, LAKE_ISLE_PIER.moorY) < BOAT_DOCK_SNAP_R * BOAT_DOCK_SNAP_R;
  if (!nearMoor && !nearIsleMoor && !isLakeShallowAt(player.x, player.y)) {
    if (!silent) addFloater(player.x, player.y - 44, 'DEEP WATER — BEACH AT SHORE OR DOCK', '#ffb878', false);
    return false;
  }
  boat.mounted = false;
  player.waterOk = false;
  if (nearMoor) {
    boat.x = D.moorX; boat.y = D.moorY;      // skiff snaps back to its berth
    boat.moorDockId = 'emberfall';
    boat.ang = Math.atan2(D.ay, D.ax);
    const spot = boatDockDismountSpot();     // rider steps onto the pier-head planks
    player.x = spot.x; player.y = spot.y;
    if (!silent) addFloater(player.x, player.y - 40, 'MOORED AT EMBERFALL', '#7fd8e8', false);
  } else if (nearIsleMoor) {
    const P = LAKE_ISLE_PIER;                // 10.4 — re-berth at the isle mini-pier
    boat.x = P.moorX; boat.y = P.moorY;
    boat.moorDockId = 'isle';
    boat.ang = Math.atan2(P.ay, P.ax);
    const spot = islePierDismountSpot();     // rider steps onto the mini-pier head planks
    player.x = spot.x; player.y = spot.y;
    if (!silent) addFloater(player.x, player.y - 40, 'MOORED AT DRIFTWOOD ISLE', '#7fd8e8', false);
  } else {
    boat.x = player.x; boat.y = player.y;    // beaches where you left it (bike park-anywhere mirror)
    boat.moorDockId = null;
    const shore = boatStepAshore(player.x, player.y, 10);
    player.x = shore.x; player.y = shore.y;
    if (!silent) addFloater(player.x, player.y - 40, 'SKIFF BEACHED', '#7fd8e8', false);
  }
  if (isLakeWaterAt(player.x, player.y) && !isOnDock(player.x, player.y) &&
      !isOnIslePier(player.x, player.y)) { // 10.4 — the mini-pier deck is dry footing too
    const dry = boatStepAshore(player.x, player.y, 12); // belt + braces — never strand the rider wet
    player.x = dry.x; player.y = dry.y;
  }
  player.vx = 0; player.vy = 0;
  boat.ashT = 0; boat.ashWarned = false;
  return true;
}
/** Testable core — one thrust/glide integration frame (plan feel: ≈1.1s from rest to top;
 * glide half-life ≈0.8s once the oars lift — decay only when there is NO input, so thrust
 * really does reach top in BOAT_ACCEL_SEC). update() calls this instead of the instant-set
 * walk while mounted; turns stay drifty because velocity accumulates toward the new heading. */
function boatThrustFrame(dx, dy, m, dt) {
  if (m > 0.08) {
    const cap = Math.min(1, m);
    const top = moveSpeed() * cap;
    player.vx += dx / m * (top / BOAT_ACCEL_SEC) * dt;
    player.vy += dy / m * (top / BOAT_ACCEL_SEC) * dt;
    const sp = Math.hypot(player.vx, player.vy);
    if (sp > top) { player.vx *= top / sp; player.vy *= top / sp; }
  } else {
    const glide = Math.pow(0.5, dt / BOAT_GLIDE_HALF);
    player.vx *= glide;
    player.vy *= glide;
  }
}
/** Step 10.3 inverse shore clamp — the mounted hull can never cross the waterline outward or
 * beach on Driftwood Isle's dry carve. Same homogeneous-superellipse radial solve as
 * lakeNearestShore (field scales as t^n along a center ray), so the hull slides smoothly
 * along shore + isle rim. NaN-proof: the blob-center guard skips the outer solve (that point
 * is isle-dry anyway) and the isle guard picks a fixed exit when exactly centered. */
function clampSkiffToWater(ent) {
  if (!boatActive()) return;
  const dx = ent.x - LAKE_BLOB.cx, dy = ent.y - LAKE_BLOB.cy;
  const d2 = dx * dx + dy * dy;
  if (d2 > 0.01) {
    const d = Math.sqrt(d2);
    const g = Math.max(lakeFieldOffset(dx, dy), 1e-9);
    const maxD = d * Math.pow(g, -1 / LAKE_BLOB.n) - BOAT_HULL_MARGIN; // radial room to the waterline
    if (d > maxD) {
      const s = Math.max(0, maxD) / d;
      ent.x = LAKE_BLOB.cx + dx * s;
      ent.y = LAKE_BLOB.cy + dy * s;
    }
  }
  const ix = ent.x - LAKE_ISLE.x, iy = ent.y - LAKE_ISLE.y;
  const id2 = ix * ix + iy * iy, minD = LAKE_ISLE.r + BOAT_HULL_MARGIN;
  if (id2 <= 0.01) { ent.x = LAKE_ISLE.x; ent.y = LAKE_ISLE.y + minD; }
  else if (id2 < minD * minD) {
    const idist = Math.sqrt(id2);
    ent.x = LAKE_ISLE.x + ix / idist * minD;
    ent.y = LAKE_ISLE.y + iy / idist * minD;
  }
}
/** Per-frame skiff upkeep: wreck drip, hull/rider sync, heading + wake, and the 10.3 wave
 * gate — a wave that starts while afloat gives BOAT_WAVE_GRACE seconds, then ash-choked
 * water drains HP until the rider reaches shore. No knock-off mid-water, ever (nobody swims). */
function tickBoat(dt) {
  if (!boatActive()) return;
  if (boatWreck && !boat.owned) boatWreck.dripT = (boatWreck.dripT || 0) + dt;
  if (!boat.mounted) { boat.ashT = 0; boat.ashWarned = false; return; }
  boat.x = player.x;
  boat.y = player.y;
  const sp = Math.hypot(player.vx, player.vy);
  if (sp > 40) boat.ang = Math.atan2(player.vy, player.vx);
  boat.wakeT += dt * (sp > 40 ? 1 : 0.25);
  if (sp > 70 && Math.random() < dt * 8) {
    spawnParticles(player.x - Math.cos(boat.ang) * 16, player.y - Math.sin(boat.ang) * 8 + 4, 1, '#bfe8f0', 1.4);
  }
  if (BOAT_WAVE_GATE_ENABLED && waveActive && !player.downed) {
    boat.ashT += dt;
    if (!boat.ashWarned) {
      boat.ashWarned = true;
      addFloater(player.x, player.y - 52, `ASH RISES — SHORE IN ${BOAT_WAVE_GRACE}s`, '#ffb878', true);
    }
    if (boat.ashT >= BOAT_WAVE_GRACE) {
      const before = player.hp;
      player.hp -= BOAT_ASH_DRAIN_DPS * dt;
      if (Math.random() < dt * 5) spawnParticles(player.x + rand(-10, 10), player.y + 2, 1, '#8a8a96', 1.5);
      if (Math.random() < dt * 0.7) addFloater(player.x, player.y - 44, 'ASH-CHOKED WATER', '#c45a3a', false);
      if (before > 0 && player.hp <= 0) { player.hp = 0.01; hurtPlayer(1); } // downed/game-over path owns the rest
    }
  } else if (!waveActive) {
    boat.ashT = 0;
    boat.ashWarned = false;
  }
}
/** 10.3 — ONE V key / HUD button for both vehicles; the nearest actionable target wins.
 * With no skiff action in range this routes straight to tryBikeAction — bike kit unchanged. */
function tryVehicleAction() {
  if (state !== 'playing' || paused || player.downed) return false;
  if (boat.mounted) return tryDismountBoat();
  if (bike.mounted) { dismountBike(); return true; }
  const bikeD2 = canMountBike() ? bikeParkDist2() : (canInteractBikeWreck() ? bikeWreckDist2() : Infinity);
  const boatD2 = canMountBoat() ? boatMoorDist2() : (canInteractBoatWreck() ? boatWreckDist2() : Infinity);
  if (boatD2 < bikeD2) {
    if (canMountBoat()) return mountBoat();
    return tryRepairBoat();
  }
  return tryBikeAction();
}
/** Procedural TR-cartoon skiff (real mesh joins the deferred bike-art track, not 10.x).
 * Poses: 'wreck' broken-backed waterlogged hull + spiral drip; 'moor' sound ash-wood hull
 * with ember stern lantern; 'ride' adds bob + trailing wake ripples (velocity-based).
 * Plain fills/strokes only — no ctx.filter. Camera cull happens at the draw-queue push. */
function drawSkiffAt(x, y, pose, t) {
  const wreck = pose === 'wreck';
  const ang = wreck ? Math.atan2(LAKE_DOCK.ay, LAKE_DOCK.ax) + 2.35 : (boat.ang || 0);
  const bob = pose === 'ride' ? Math.sin((t || 0) * 3.1) * 1.6 :
              pose === 'moor' ? Math.sin((t || 0) * 1.1) * 1.1 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  if (pose === 'ride') { // wake ripples under the hull while underway
    const spd = Math.hypot(player.vx, player.vy);
    if (spd > 60) {
      ctx.strokeStyle = '#d6f0f6';
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 2; k++) {
        const ph = ((t || 0) * 1.25 + k * 0.5) % 1;
        const back = 16 + ph * 26;
        ctx.globalAlpha = (1 - ph) * 0.45;
        ctx.beginPath();
        ctx.arc(-Math.cos(ang) * back, -Math.sin(ang) * back * 0.55 + 3, 7 + ph * 9, ang - 2.2, ang + 2.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(8,30,38,0.45)'; // waterline shade under the hull
  ctx.beginPath(); ctx.ellipse(0, 4, 26, 9, 0, 0, TAU); ctx.fill();
  if (wreck) {
    ctx.rotate(-0.16); // broken-backed — swamped stern, raised bow
    ctx.fillStyle = '#463726';
    ctx.beginPath(); ctx.ellipse(-10, 1, 15, 7.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5c4830';
    ctx.beginPath(); ctx.ellipse(12, -4, 14, 6.5, -0.22, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#241c12';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(4, 3); ctx.stroke(); // the split
    ctx.fillStyle = '#6a5438'; // snapped planks poking up
    ctx.fillRect(-4, -11, 3, 9);
    ctx.fillRect(1, -13, 3, 10);
    const dp = ((t || 0) * 0.8) % 1; // spiral drip off the raised bow lip
    ctx.globalAlpha = 0.7 * (1 - dp);
    ctx.fillStyle = '#96c8d6';
    ctx.beginPath(); ctx.arc(20 + Math.sin(dp * TAU) * 2.4, -5 + dp * 15, 1.6, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#6a4e30'; // sound ash-wood hull
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 9.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7c5c38';
    ctx.beginPath(); ctx.ellipse(0, -2, 20, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#42311f'; // inner well
    ctx.beginPath(); ctx.ellipse(-2, -2.5, 13, 4.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2c1c'; // plank seams
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, -7); ctx.lineTo(-14, 6);
    ctx.moveTo(-5, -8.5); ctx.lineTo(-5, 7);
    ctx.moveTo(4, -8.5); ctx.lineTo(4, 7);
    ctx.moveTo(13, -7); ctx.lineTo(13, 6);
    ctx.stroke();
    ctx.fillStyle = '#7c5c38'; // bow nose
    ctx.beginPath(); ctx.moveTo(22, -4); ctx.lineTo(30, 0); ctx.lineTo(22, 4); ctx.closePath(); ctx.fill();
    const em = 0.62 + 0.38 * Math.sin((t || 0) * 4.4); // ember stern lantern
    ctx.globalAlpha = 0.16 * em + 0.06;
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath(); ctx.arc(-20, -7, 9, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a2a32';
    ctx.fillRect(-21.5, -12, 3, 6);
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath(); ctx.arc(-20, -7, 2.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
/** Slack mooring rope: cleat post → parked hull (drawn only when moorDockId is set).
 * 10.4 — the post follows the berth: Emberfall pier head or the Driftwood Isle mini-pier. */
function drawSkiffMoorRope() {
  let postX, postY;
  if (boat.moorDockId === 'isle') {
    const P = LAKE_ISLE_PIER;
    postX = P.baseX + P.ax * (LAKE_ISLE_PIER_LEN - 10);
    postY = P.baseY + P.ay * (LAKE_ISLE_PIER_LEN - 10) - 12;
  } else {
    const D = LAKE_DOCK;
    postX = D.baseX + D.ax * (LAKE_DOCK_LEN - 11);
    postY = D.baseY + D.ay * (LAKE_DOCK_LEN - 11) - 12;
  }
  const bowX = boat.x - Math.cos(boat.ang || 0) * 18, bowY = boat.y - Math.sin(boat.ang || 0) * 8;
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(postX, postY);
  ctx.quadraticCurveTo((postX + bowX) / 2, (postY + bowY) / 2 + 9, bowX, bowY);
  ctx.stroke();
}

// ---------- Step 10.4 — Driftwood Isle (mini-pier + Greywater ferry cache + player grove) ----------
const LAKE_ISLE_REWARD_ENABLED = true; // soft-wire — false = bare isle exactly as 10.3 left it
const LAKE_ISLE_PIER_LEN = 100;     // planks: dry apron on the isle → ~30px past the isle shallow ring
const LAKE_ISLE_PIER_HALF_W = 19;   // mini deck (38px wide — narrower than Emberfall's 46)
const LAKE_ISLE_PIER_BASE_IN = 24;  // px of dry isle ground between the rim and the first plank
const LAKE_ISLE_PIER_MOOR_OUT = 22; // second skiff berth this far off the pier head
const ISLE_CACHE_GOLD = 60;   // plan reward row (10.4): 60 gold + 6 coal + 8 cores, once ever
const ISLE_CACHE_COAL = 6;
const ISLE_CACHE_CORES = 8;
const ISLE_CACHE_OPEN_R = 46; // walk-over claim radius (wave supply chest is 36 — crate reads bigger)
const ISLE_CHOP_SEC = 1.15;   // player walk-up chop cadence — laborer gather parity
const ISLE_CHOP_REACH = 14;   // px past tree.r + player.r that still reads as swinging the axe
/** Deterministic mini-pier frame on the isle rim facing the Emberfall Dock (plan: SE edge).
 * The isle carve is an exact circle, so its "waterline solve" is the rim radius itself —
 * same pattern as LAKE_DOCK's radial solve, one step simpler. Pure consts, no rand(). */
const LAKE_ISLE_PIER = (() => {
  const vx = LAKE_DOCK.baseX - LAKE_ISLE.x, vy = LAKE_DOCK.baseY - LAKE_ISLE.y;
  const d = Math.hypot(vx, vy) || 1;          // isle center / dock base are fixed consts ≈730 apart
  const ax = vx / d, ay = vy / d;             // walk axis: isle base → head (out over the strait)
  const baseX = LAKE_ISLE.x + ax * (LAKE_ISLE.r - LAKE_ISLE_PIER_BASE_IN);
  const baseY = LAKE_ISLE.y + ay * (LAKE_ISLE.r - LAKE_ISLE_PIER_BASE_IN);
  return {
    baseX, baseY, ax, ay,
    headX: baseX + ax * LAKE_ISLE_PIER_LEN, headY: baseY + ay * LAKE_ISLE_PIER_LEN,
    moorX: baseX + ax * (LAKE_ISLE_PIER_LEN + LAKE_ISLE_PIER_MOOR_OUT), // second moor point
    moorY: baseY + ay * (LAKE_ISLE_PIER_LEN + LAKE_ISLE_PIER_MOOR_OUT),
  };
})();
function isleContentActive() {
  return LAKE_ISLE_REWARD_ENABLED && LAKE_WATER_ENABLED && CONTINUOUS_MAP_ENABLED;
}
/** True when (x,y) stands on the isle mini-pier deck (dot-product rect, LAKE_DOCK pattern). */
function isOnIslePier(x, y) {
  if (!isleContentActive()) return false;
  const P = LAKE_ISLE_PIER;
  const rx = x - P.baseX, ry = y - P.baseY;
  const u = rx * P.ax + ry * P.ay;
  if (u < -2 || u > LAKE_ISLE_PIER_LEN) return false;
  const v = ry * P.ax - rx * P.ay;
  return Math.abs(v) <= LAKE_ISLE_PIER_HALF_W;
}
/** Player-only deck catch for the mini-pier — clampToDockDeck's math on the isle frame
 * (shared LAKE_DOCK_EDGE / LAKE_DOCK_GRACE feel consts). Idempotent, no divides. */
function clampToIslePierDeck(ent) {
  const P = LAKE_ISLE_PIER;
  const rx = ent.x - P.baseX, ry = ent.y - P.baseY;
  const u = rx * P.ax + ry * P.ay;
  if (u < 0 || u > LAKE_ISLE_PIER_LEN + LAKE_DOCK_GRACE) return false;
  const v = ry * P.ax - rx * P.ay;
  if (Math.abs(v) > LAKE_ISLE_PIER_HALF_W + LAKE_DOCK_GRACE) return false;
  const cu = Math.min(u, LAKE_ISLE_PIER_LEN - LAKE_DOCK_EDGE);
  const cv = clamp(v, -(LAKE_ISLE_PIER_HALF_W - LAKE_DOCK_EDGE), LAKE_ISLE_PIER_HALF_W - LAKE_DOCK_EDGE);
  ent.x = P.baseX + P.ax * cu - P.ay * cv;
  ent.y = P.baseY + P.ay * cu + P.ax * cv;
  return true;
}
function islePierDismountSpot() { // head deck point — inside the clampToIslePierDeck rect
  const u = LAKE_ISLE_PIER_LEN - LAKE_DOCK_EDGE - 4;
  return { x: LAKE_ISLE_PIER.baseX + LAKE_ISLE_PIER.ax * u, y: LAKE_ISLE_PIER.baseY + LAKE_ISLE_PIER.ay * u };
}
/** Step 10.4 worldgen — Driftwood Isle content (runs after purgeLakeReserveContent, before
 * the obstacle grid ever builds). Clears stray worldgen rolls off the dry carve, then seeds:
 *  - the one-time Greywater ferry cache (scenery object, never an obstacle),
 *  - 4 choppable trees (the EXISTING tree kind — size/woodLeft/variant like mainland; tagged
 *    isle so laborer target picks skip them: the grove is player-chop only per plan),
 *  - driftwood/reed shoreline decor (non-colliding decor[], all dry).
 * Everything is placed on fixed angles/radii off the pier axis — deterministic, clear of the
 * boarding apron, the cache walk-up ring, and the skiff shore-slide (trees stay ≥40px inside
 * the rim; the hull slides at rim+12 and can never touch them). */
function seedDriftwoodIsle() {
  isleCache = null;
  isleTrees = [];
  if (!isleContentActive()) return;
  const I = LAKE_ISLE, P = LAKE_ISLE_PIER;
  for (let i = obstacles.length - 1; i >= 0; i--) { // stray rocks/crates rolled onto the isle
    const o = obstacles[i];
    if (dist2(o.x, o.y, I.x, I.y) < (I.r + (o.r || 0)) * (I.r + (o.r || 0))) obstacles.splice(i, 1);
  }
  for (let i = decor.length - 1; i >= 0; i--) { // stray tufts too — the isle dresses itself below
    if (dist2(decor[i].x, decor[i].y, I.x, I.y) < I.r * I.r) decor.splice(i, 1);
  }
  const th0 = Math.atan2(P.ay, P.ax); // pier axis angle (isle center → Emberfall Dock)
  // one-time Greywater ferry cache — beached just off the pier flank, well inside the rim
  const ca = th0 + 0.95;
  isleCache = { x: I.x + Math.cos(ca) * 96, y: I.y + Math.sin(ca) * 96 };
  // the player grove — 4 trees fanned across the far (NW) half, away from pier + cache
  const grove = [
    { off: -0.85, rad: 128, size: 2 },
    { off: -0.28, rad: 74,  size: 1 },
    { off: 0.30,  rad: 118, size: 1 },
    { off: 0.95,  rad: 96,  size: 0 },
  ];
  for (let i = 0; i < grove.length; i++) {
    const g = grove[i], a = th0 + Math.PI + g.off;
    const t = {
      x: I.x + Math.cos(a) * g.rad, y: I.y + Math.sin(a) * g.rad,
      r: 12 + g.size * 3, type: 'tree', seed: Math.random() * 9, size: g.size,
      woodLeft: 18 + g.size * 14, maxWood: 18 + g.size * 14, // scattered-tree wood formula
      isle: true, // player-chop only — pickChopTarget skips isle trees (laborers can't cross)
    };
    assignTreeVariant(t);
    obstacles.push(t);
    isleTrees.push(t);
  }
  // driftwood shoreline fan (it IS Driftwood Isle) — dry rim ring, clear of the pier lane
  const dressing = ['driftwood', 'reed', 'driftwood', 'cattail', 'driftwood', 'reed'];
  for (let i = 0; i < dressing.length; i++) {
    const a = th0 + 2.35 + i * 0.64; // ≈135°→330° off the pier axis — never the boarding lane
    const rad = 148 + (i % 3) * 6;
    decor.push({ x: I.x + Math.cos(a) * rad, y: I.y + Math.sin(a) * rad,
                 type: dressing[i], seed: 2.1 + i * 1.3, isleDecor: true });
  }
}
/** One-time walk-over claim — plan reward row: 60 gold + 6 coal + 8 cores + the lore line.
 * Direct credits (wave-end core stipend pattern — no questEvent), floaters + banner toast,
 * isleCacheOpened persists in world.lake. Can never fire twice: the flag gates re-entry. */
function tryOpenIsleCache() {
  if (!isleContentActive() || !isleCache || isleCacheOpened || player.downed) return false;
  if (dist2(player.x, player.y, isleCache.x, isleCache.y) > ISLE_CACHE_OPEN_R * ISLE_CACHE_OPEN_R) return false;
  isleCacheOpened = true;
  gold += ISLE_CACHE_GOLD;
  coal += ISLE_CACHE_COAL;
  cores += ISLE_CACHE_CORES;
  totalCores += ISLE_CACHE_CORES;
  const c = isleCache;
  camera.shake = Math.max(camera.shake, 4);
  spawnParticles(c.x, c.y, 34, '#ffd54a', 5);
  addFloater(c.x, c.y - 92, 'THE RIVER DRIED. GREYWATER\'S LAST FERRY RESTS HERE.', '#9fc4d0', true);
  addFloater(c.x, c.y - 66, `+${ISLE_CACHE_GOLD} ◈`, '#ffd54a', true);
  addFloater(c.x, c.y - 48, `+${ISLE_CACHE_COAL} ⬤`, '#a0a0a0', false);
  addFloater(c.x, c.y - 32, `+${ISLE_CACHE_CORES} ⬡`, '#4de1ff', false);
  banner('GREYWATER FERRY CACHE', `+${ISLE_CACHE_GOLD} ◈ · +${ISLE_CACHE_COAL} ⬤ · +${ISLE_CACHE_CORES} ⬡ — one-time supply drop`);
  sfx.play('place');
  return true;
}
/** Per-frame isle content tick — cache walk-over claim + the player grove chop. The chop is
 * the walk-up interaction the plan promises ("player-chop only"): stand beside an isle tree
 * and the axe works itself on laborer cadence — same woodLeft drain, +1 wood credit, chop
 * sfx and green chips as the mainland laborer path. Refused while downed or on a vehicle. */
function tickIsleContent(dt) {
  if (!isleContentActive()) return;
  if (isleCache && !isleCacheOpened) tryOpenIsleCache();
  isleChopT = Math.max(0, isleChopT - dt);
  if (isleChopT > 0 || player.downed || boat.mounted || bike.mounted) return;
  for (const t of isleTrees) {
    if (!(t.woodLeft > 0)) continue;
    const reach = t.r + player.r + ISLE_CHOP_REACH;
    if (dist2(player.x, player.y, t.x, t.y) < reach * reach) {
      isleChopT = ISLE_CHOP_SEC;
      t.woodLeft--;
      wood += 1;
      addFloater(t.x, t.y - 30, '+🪵', '#7a9a5a', false);
      spawnParticles(t.x, t.y - 10, 3, '#7a9a5a', 2);
      sfx.play('chop');
      break;
    }
  }
}

// ---------- Step 10.5 — Water rules (shaman swim + shore leash; the lake never breaks a wave) ----------
const SHAMAN_SWIM_ENABLED = true;     // user-requested 2026-09-16 — the magic caster (ONLY) may swim after a water-camper
const SHAMAN_SWIM_SPEED_MUL = 0.55;   // slow, deliberate head-above-water stroke (land spd × this while swimming)
const SHAMAN_SWIM_ENTER_DIST = 84;    // starts the swim within this many px of the waterline — OUTSIDE the 9.3
                                      // water-ahead hover band (~54px), so the shore slide can never starve the gate
const SHAMAN_SWIM_SINK = 26;          // px of body below the surface in the swim draw (head + shoulders stay dry)
const SHAMAN_SWIM_ISLE_PAD = 8;       // swimmers clamp to isle.r + this (still water) — Driftwood Isle stays enemy-free
const LAKE_LEASH_HOLD_R = 46;         // shore patrol slack for leashed melee (loose ring, not a pile-in wall)
/** The swim is a behavior on the existing caster — never a new enemy type, never bosses. */
function shamanCanSwim(e) {
  return SHAMAN_SWIM_ENABLED && LAKE_WATER_ENABLED && CONTINUOUS_MAP_ENABLED &&
         e.type === 'shaman' && !e.boss && !e.decadeBoss && !e.dead;
}
/** The one reason to be in the water: the prey is the player and the player is over
 * Ashmere water — afloat on the skiff or out on a pier deck (land can't reach either). */
function lakeSwimWants(e, tgt) {
  return tgt === player && isLakeWaterAt(player.x, player.y);
}
/** Signed distance to the waterline along the blob-center ray (>0 dry side, <0 wet).
 * The raw field can't gate the swim — its bbox early-out returns 9 anywhere outside the
 * a×b envelope, which covers most of the dry approach band. Same unit-ray shore solve as
 * the 10.2 dock frame; zero-distance offsets get a fixed ray (no /0 → NaN). */
function lakeShoreDistOnRay(x, y) {
  let dx = x - LAKE_BLOB.cx, dy = y - LAKE_BLOB.cy;
  let d = Math.hypot(dx, dy);
  if (d < 1) { dx = 1; dy = 1; d = Math.SQRT2; }
  const ux = dx / d, uy = dy / d;
  const m = Math.pow(Math.max(lakeFieldOffset(ux, uy), 1e-9), -1 / LAKE_BLOB.n);
  return d - m;
}
/** Step 10.5 — swim state driver (runs every enemy frame, cheap boolean gates for the 99%
 * dry case). Enter: target camps over water and the caster is at the waterline band.
 * While swimming, `waterOk` (the 10.1-designed opt-out) keeps clampLakeShore off its back.
 * Exit: first dry step once the reason is gone — chasing an ashore target self-resolves. */
function updateShamanSwim(e, tgt) {
  if (!shamanCanSwim(e)) {
    if (e.swim) { e.swim = false; e.waterOk = false; } // soft-wire off mid-swim → shore clamp beaches it
    return;
  }
  const wants = lakeSwimWants(e, tgt);
  if (!e.swim) {
    if (wants && lakeShoreDistOnRay(e.x, e.y) < SHAMAN_SWIM_ENTER_DIST) {
      e.swim = true;
      e.waterOk = true;             // clampLakeShore lets the swimmer pass (10.3 skiff pattern)
      e.steerT = 0; e.climbT = 0;   // drop any land-steer slide so the stroke starts clean
      spawnParticles(e.x, e.y, 10, '#9fdce8', 2);
    }
    return;
  }
  e.waterOk = true; // reassert every frame — swim owns the opt-out while active
  if (!wants && !isLakeWaterAt(e.x, e.y)) {
    e.swim = false;   // beached with no reason left to swim — back to the land kit
    e.waterOk = false;
    e.steerT = 0;
  }
}
/** Swimmers never make isle landfall — radial push off the rim keeps the 10.4 grove
 * enemy-free (the ring band is water, so the clamp never dries the swimmer out). */
function clampSwimmerToWater(ent) {
  if (!LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  const ix = ent.x - LAKE_ISLE.x, iy = ent.y - LAKE_ISLE.y;
  const min = LAKE_ISLE.r + SHAMAN_SWIM_ISLE_PAD;
  const d2 = ix * ix + iy * iy;
  if (d2 >= min * min) return;
  const d = Math.sqrt(d2);
  if (d < 1e-6) { ent.x = LAKE_ISLE.x + min; ent.y = LAKE_ISLE.y; return; } // dead-center guard — never /0 → NaN
  ent.x = LAKE_ISLE.x + ix / d * min;
  ent.y = LAKE_ISLE.y + iy / d * min;
}
/** Step 10.5 — the cast gate: ranged AND not mid-swim (the stroke occupies the staff arm;
 * full casting resumes the moment the caster stands on dry land again). */
function enemyCanCast(e) { return !!e.ranged && !e.swim; }
/** Shore leash applies to land-bound NON-ranged, non-boss wave enemies whose prey camps
 * over water: ranged keeps plinking the camper (bolts cross water — plan row), swimmers
 * handle it in the water, spiders never reach the lake, bosses keep their menace. */
function lakeLeashApplies(e, tgt) {
  return LAKE_WATER_ENABLED && CONTINUOUS_MAP_ENABLED && tgt === player &&
         !e.ranged && !e.boss && !e.decadeBoss && !e.swim && !isAshenSpiderType(e) &&
         isLakeWaterAt(player.x, player.y);
}
/** Nearest land threat for a leashed melee enemy — militia, companions, the titan, then
 * town structures (fences get chewed en route via the normal contact paths). Runs only
 * while the player is water-camping, so the scan cost never touches normal waves. */
function pickLakeLeashTarget(e) {
  let best = null, bd2 = Infinity;
  const take = u => { const d2 = dist2(e.x, e.y, u.x, u.y); if (d2 < bd2) { bd2 = d2; best = u; } };
  for (const m of militia) if (!m.downed) take(m);
  for (const c of companions) if (!c.downed) take(c);
  if (colossusActive()) take(colossus);
  for (const s of structures) if (s.hp === undefined || s.hp > 0) take(s);
  return best;
}
/** Nothing left to fight → hold a patrol slot at the waterline nearest the camper. A plain
 * seek point (never an entity): wantD backs the holder into a loose ring, separation
 * spreads the pack along the shore — menace without the jitter wall. */
function lakeShoreHoldPoint() {
  const p = lakeNearestShore(player.x, player.y, 12);
  return { x: p.x, y: p.y, _shoreHold: true };
}

/** Step 9.1 — strip vegetation + mines from NW bowl so Step 10 lake can land cleanly. */
function purgeLakeReserveContent() {
  if (!LAKE_RESERVE_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    if ((o.type === 'tree' || o.type === 'deadtree') && isLakeReserve(o.x, o.y)) obstacles.splice(i, 1);
  }
  for (let i = goldMines.length - 1; i >= 0; i--) {
    if (isLakeReserve(goldMines[i].x, goldMines[i].y)) goldMines.splice(i, 1);
  }
  goldVeins = goldMines;
  // Step 10.1 — the water blob itself: nothing solid or decorative may intersect Ashmere.
  // The rect purge above only strips trees + mines; rocks/crates/pillars + ground decor
  // inside (or edge-overlapping) the waterline go too. Blob ⊂ rect, so mines are covered.
  if (LAKE_WATER_ENABLED) {
    const wet = (x, y, r) => isLakeWaterAt(x, y) ||
      (r > 0 && (isLakeWaterAt(x - r, y) || isLakeWaterAt(x + r, y) ||
                 isLakeWaterAt(x, y - r) || isLakeWaterAt(x, y + r)));
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (wet(o.x, o.y, o.r || 0)) obstacles.splice(i, 1);
    }
    for (let i = decor.length - 1; i >= 0; i--) {
      if (isLakeWaterAt(decor[i].x, decor[i].y)) decor.splice(i, 1);
    }
  }
}
function distPointToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 0.01) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
/** Step 9.1 — cardinal paths + SE diagonal (camp/quarter → east bike wreck). */
function isBikeTrailLane(x, y) {
  if (!BIKE_TRAIL_LANES_ENABLED || !CONTINUOUS_MAP_ENABLED) return false;
  if (isLegacyPathCorridor(x, y)) return true;
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const cx = lx + lw / 2, cy = ly + lh / 2;
  const band = BIKE_TRAIL_LANE_HALF + LEGACY_PATH_CORRIDOR_HALF;
  if (inLegacyWorld(x, y)) {
    // SE interior fork toward Orange Quarter (9.2 hub site)
    if (distPointToSeg(x, y, cx + 520, cy + 520, lx + lw - LEGACY_PATH_INTERIOR_DEPTH,
        ly + lh - LEGACY_PATH_INTERIOR_DEPTH) < BIKE_TRAIL_LANE_HALF + 28) return true;
    return false;
  }
  if (Math.abs(x - cx) < band && y >= ly + lh - 48) return true;
  if (Math.abs(x - cx) < band && y < ly + 48) return true;
  if (Math.abs(y - cy) < band && x >= lx + lw - 48) return true;
  if (Math.abs(y - cy) < band && x < lx + 48) return true;
  if (distPointToSeg(x, y, lx + lw - 220, ly + lh - 220, 4920, 2100) < BIKE_TRAIL_LANE_HALF + 40) return true;
  return false;
}

const inRect = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
const REGIONS = [
  { name: 'NORTHREACH FORT', test: (x, y) => inRect(x, y, FORT) },
  { name: 'THE ASHEN REACH', test: (x, y) => inRect(x, y, ASH) },
  { name: 'DUSKMERE MARSH',  test: (x, y) => inRect(x, y, MARSH) },
  // Step 10.2 — Ashmere: the water, the dock, and ~≤100px of shore meadow past the
  // waterline (field <1.35 ≈ radial ×1.147). Bottom region flash only — the center
  // ENTERING popup stays REMOVED. Band never reaches the camp circle or N/W corridors.
  { name: 'ASHMERE', test: (x, y) => LAKE_DOCK_ENABLED && LAKE_WATER_ENABLED &&
      CONTINUOUS_MAP_ENABLED && lakeFieldAt(x, y) < 1.35 },
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
  } else if (kind === 'water') {
    // Step 10.1 — Ashmere body: calm ash-dark water (marsh-pool family, deeper teal)
    g.fillStyle = '#0e2027'; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 170; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .45 ? '#102630' : v < .78 ? '#0b1a20' : '#143038';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(2, 5), rand(1, 2));
    }
    // faint still-water striations
    g.strokeStyle = 'rgba(120,170,180,0.10)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const y = rand(4, TILE - 4);
      g.beginPath(); g.moveTo(rand(0, TILE * 0.4), y);
      g.lineTo(rand(TILE * 0.6, TILE), y + rand(-2, 2)); g.stroke();
    }
  } else if (kind === 'path') {
    g.fillStyle = '#2a2618'; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 200; i++) {
      const v = rand(0, 1);
      g.fillStyle = v < .45 ? '#342e1e' : v < .75 ? '#252018' : '#3d3624';
      g.fillRect(rand(0, TILE), rand(0, TILE), rand(2, 5), rand(1, 3));
    }
    g.strokeStyle = 'rgba(70,62,48,0.4)'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x = rand(4, TILE - 4), y = rand(4, TILE - 4);
      g.beginPath(); g.arc(x, y, rand(2, 5), 0, TAU); g.stroke();
    }
    g.strokeStyle = 'rgba(120,100,70,0.22)'; g.lineWidth = 2;
    g.strokeRect(1, 1, TILE - 2, TILE - 2);
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

// 4.1.2 FREEZE FIX — static spatial hash for obstacles. The obstacle list never
// changes after buildWorld() (chopped trees stay as stump colliders, hold walls are
// pushed during build), so one bucket pass replaces the per-entity / per-projectile
// full-array scans that dominated frame time on the 8896×8896 map.
const OBST_GRID_CELL = 256;
let obstGrid = null, obstGridW = 0, obstGridH = 0, obstGridMaxR = 0;
function rebuildObstacleGrid() {
  obstGridW = Math.max(1, Math.ceil(WORLD.w / OBST_GRID_CELL));
  obstGridH = Math.max(1, Math.ceil(WORLD.h / OBST_GRID_CELL));
  obstGrid = new Array(obstGridW * obstGridH).fill(null);
  obstGridMaxR = 0;
  for (const o of obstacles) {
    if (o.r > obstGridMaxR) obstGridMaxR = o.r;
    const gx = Math.min(obstGridW - 1, Math.max(0, (o.x / OBST_GRID_CELL) | 0));
    const gy = Math.min(obstGridH - 1, Math.max(0, (o.y / OBST_GRID_CELL) | 0));
    const idx = gy * obstGridW + gx;
    (obstGrid[idx] || (obstGrid[idx] = [])).push(o);
  }
}
/** Point-vs-obstacle test for projectiles (replaces obstacles.some full scans).
 * includeTrees=false mirrors the old `o.type !== 'tree'` bolt-passes-forest rule. */
function obstacleBlockedAt(x, y, pad, includeTrees) {
  if (!obstGrid) rebuildObstacleGrid();
  const reach = obstGridMaxR + (pad || 0);
  const gx0 = Math.max(0, ((x - reach) / OBST_GRID_CELL) | 0);
  const gx1 = Math.min(obstGridW - 1, ((x + reach) / OBST_GRID_CELL) | 0);
  const gy0 = Math.max(0, ((y - reach) / OBST_GRID_CELL) | 0);
  const gy1 = Math.min(obstGridH - 1, ((y + reach) / OBST_GRID_CELL) | 0);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const cell = obstGrid[gy * obstGridW + gx];
    if (!cell) continue;
    for (const o of cell) {
      if (!includeTrees && o.type === 'tree') continue;
      const rr = o.r + (pad || 0);
      if (dist2(x, y, o.x, o.y) < rr * rr) return true;
    }
  }
  return false;
}

function buildWorld() {
  obstacles = []; decor = []; decals = [];
  obstGrid = null; // 4.1.2 — grid rebuilds after all build steps (ring/paths/holds/harvest)
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
      tryPlace(rand(160, LEGACY_WORLD.w - 160), rand(160, LEGACY_WORLD.h - 160), rand(34, 58), 'rock')
        && (obstacles[obstacles.length - 1].variant = variant);
    } else {
      tryPlace(rand(160, LEGACY_WORLD.w - 160), rand(160, LEGACY_WORLD.h - 160), rand(36, 62), 'crate');
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
    const sx = clamp(site.x, 260, LEGACY_WORLD.w - 260);
    const sy = clamp(site.y, 260, LEGACY_WORLD.h - 260);
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
        assignTreeVariant(t);
      }
    }
  });
  // extra scattered trees across grass
  for (let i = 0; i < 48; i++) {
    const cx = rand(300, LEGACY_WORLD.w - 300), cy = rand(300, LEGACY_WORLD.h - 300);
    const z = zoneAt(cx, cy);
    if (z === 'grass') {
      const size = i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
      if (tryPlace(cx, cy, 12 + size * 3, 'tree')) {
        const t = obstacles[obstacles.length - 1];
        t.size = size;
        t.woodLeft = 18 + size * 14;
        t.maxWood = t.woodLeft;
        assignTreeVariant(t);
      }
    } else if (z === 'marsh') tryPlace(cx, cy, 12, 'deadtree');
  }
  // WC2-style gold mine buildings (v2.11) — laborers enter / carry gold out
  goldVeins = []; // kept for save compat / minimap alias
  goldMines = [];
  coalMines = []; // 8.1 — reset before legacy + exterior placement
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
    const bx = clamp(m.x, 200, LEGACY_WORLD.w - 200);
    const by = clamp(m.y, 200, LEGACY_WORLD.h - 200);
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
    const x = rand(40, LEGACY_WORLD.w - 40), y = rand(40, LEGACY_WORLD.h - 40);
    const z = zoneAt(x, y);
    const roll = hash2(x, y);
    let type;
    if (z === 'grass') type = roll < .5 ? 'tuft' : roll < .75 ? 'pebble' : roll < .9 ? 'flower' : 'mushroom';
    else if (z === 'ash') type = roll < .45 ? 'bone' : roll < .8 ? 'pebble' : 'skull';
    else if (z === 'marsh') type = roll < .55 ? 'reed' : roll < .8 ? 'lily' : 'mushroom';
    else type = roll < .6 ? 'crack' : 'pebble';
    decor.push({ x, y, type, seed: roll * 9 });
  }
  if (CONTINUOUS_MAP_ENABLED) {
    buildLegacyBorderRing();
    buildLegacyBorderPaths();
    buildNpcHolds();
    clearTreesInHoldFootprints();
    buildExteriorHarvest();
    buildExteriorSpreadTrees();
    buildBikeWreck();
  }
  purgeLakeReserveContent();
  seedEmberfallDock(); // Step 10.2 — clear the pier approach + shoreline decor (before grid)
  buildBoatWreck(); // Step 10.3 — beached skiff wreck by the pier (scenery — never an obstacle)
  seedDriftwoodIsle(); // Step 10.4 — isle cache + grove trees + decor (after purge, before grid)
  rebuildObstacleGrid(); // 4.1.2 — obstacles are final past this point
}

/** Step 7.0 — exterior forest stands + gold mine markers outside LEGACY_WORLD (no new harvest AI). */
function isNearNpcHold(x, y, pad = 200) {
  for (const h of npcHolds) {
    const hw = (h.halfW || HOLD_FOOT_HALF_W) + pad;
    const hh = (h.halfH || HOLD_FOOT_HALF_H) + pad;
    if (Math.abs(x - h.x) < hw && Math.abs(y - h.y) < hh) return true;
  }
  return false;
}
function isExteriorSiteVisible(x, y) {
  if (!FOG_DISCOVERY_ENABLED) return true;
  if (inLegacyWorld(x, y)) return true;
  const cx = Math.floor(x / FOG_CHUNK_SIZE);
  const cy = Math.floor(y / FOG_CHUNK_SIZE);
  return isFogChunkDiscovered(cx, cy);
}
function buildExteriorHarvest() {
  if (!EXTERIOR_HARVEST_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  // Tree stands — path exits + hold approaches (E/S exterior only; never inLegacyWorld)
  const standSites = ORANGE_QUARTER_ENABLED ? [
    { x: 2100, y: 4920 }, { x: 2700, y: 4920 },
    { x: 4920, y: 2100 }, { x: 4920, y: 2700 },
    { x: 2000, y: 5480 }, { x: 5480, y: 2000 },
    { x: 4920, y: 4080 }, { x: 4920, y: 4380 },
    { x: 3860, y: 4920 }, { x: 4260, y: 4920 },
  ] : [
    { x: 2100, y: 4920 }, { x: 2700, y: 4920 },
    { x: 4920, y: 2100 }, { x: 4920, y: 2700 },
    { x: 2000, y: 5480 }, { x: 5480, y: 2000 },
    { x: 2000, y: 6800 }, { x: 6800, y: 2000 },
  ];
  const mineSites = ORANGE_QUARTER_ENABLED ? [
    { x: 2550, y: 5600 }, { x: 5600, y: 2550 },
    { x: 5050, y: 4600 }, { x: 4500, y: 5050 }, { x: 5400, y: 5200 },
  ] : [
    { x: 2550, y: 5600 }, { x: 5600, y: 2550 },
    { x: 2550, y: 7000 }, { x: 7000, y: 2550 }, { x: 5600, y: 5600 },
  ];
  let standsPlaced = 0, minesPlaced = 0, treesPlaced = 0;
  const nextStandId = () => EXTERIOR_STAND_ID_BASE + standsPlaced;

  function placeExteriorTree(tx, ty, size, standId) {
    if (inLegacyWorld(tx, ty)) return false;
    if (LAKE_RESERVE_ENABLED && isLakeReserve(tx, ty)) return false;
    if (BIKE_TRAIL_LANES_ENABLED && isBikeTrailLane(tx, ty)) return false;
    if (isNearNpcHold(tx, ty, 140)) return false;
    const r = 12 + size * 3;
    // Tight pad so stand clusters can form (border ring uses ~26)
    if (obstacles.some(o => dist2(tx, ty, o.x, o.y) < (o.r + r + 26) ** 2)) return false;
    const woodLeft = 22 + size * 16;
    const t = {
      x: tx, y: ty, r, type: 'tree', seed: Math.random() * 9, size,
      standId, woodLeft, maxWood: woodLeft,
      exterior: true, exteriorTree: true,
    };
    assignTreeVariant(t);
    obstacles.push(t);
    treesPlaced++;
    return true;
  }

  for (const site of standSites) {
    const sx = clamp(site.x, 200, WORLD.w - 200);
    const sy = clamp(site.y, 200, WORLD.h - 200);
    if (inLegacyWorld(sx, sy)) continue;
    if (isNearNpcHold(sx, sy, 160)) continue;
    if (forestStands.some(fs => dist2(sx, sy, fs.x, fs.y) < 200 * 200)) continue;
    const sid = nextStandId();
    forestStands.push({ x: sx, y: sy, r: 110, id: sid, exterior: true });
    standsPlaced++;
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * TAU + sid * 0.37, d = 28 + (j % 3) * 22;
      const tx = sx + Math.cos(a) * d, ty = sy + Math.sin(a) * d;
      const size = j % 4 === 0 ? 2 : j % 2 === 0 ? 1 : 0;
      placeExteriorTree(tx, ty, size, sid);
    }
  }

  for (let i = 0; i < mineSites.length; i++) {
    const m = mineSites[i];
    const bx = clamp(m.x, 200, WORLD.w - 200);
    const by = clamp(m.y, 200, WORLD.h - 200);
    if (inLegacyWorld(bx, by)) continue;
    if (LAKE_RESERVE_ENABLED && isLakeReserve(bx, by)) continue;
    if (isNearNpcHold(bx, by, 220)) continue;
    if (obstacles.some(o => dist2(bx, by, o.x, o.y) < 80 * 80)) continue;
    if (goldMines.some(g => dist2(bx, by, g.x, g.y) < 140 * 140)) continue;
    const stock = 70 + (i % 3) * 20;
    goldMines.push({
      x: bx, y: by, r: 28, goldLeft: stock, maxGold: stock,
      occupied: 0, name: 'Gold Mine', exterior: true,
    });
    minesPlaced++;
  }
  goldVeins = goldMines;

  // Step 8.1 — exterior coal mines (gold-mine silhouette, gray/black). Never in legacy.
  let coalsPlaced = 0;
  if (EXTERIOR_COAL_ENABLED) {
    const coalSites = ORANGE_QUARTER_ENABLED ? [
      { x: 1800, y: 5200 }, { x: 5200, y: 1800 },
      { x: 5050, y: 4920 }, { x: 4920, y: 4680 },
      { x: 5400, y: 5400 }, { x: 4600, y: 5200 },
    ] : [
      { x: 1800, y: 5200 }, { x: 5200, y: 1800 },
      { x: 3200, y: 6200 }, { x: 6200, y: 3200 },
      { x: 6400, y: 6400 }, { x: 4200, y: 7600 },
    ];
    for (let i = 0; i < coalSites.length; i++) {
      const m = coalSites[i];
      const bx = clamp(m.x, 200, WORLD.w - 200);
      const by = clamp(m.y, 200, WORLD.h - 200);
      if (inLegacyWorld(bx, by)) continue;
      if (LAKE_RESERVE_ENABLED && isLakeReserve(bx, by)) continue;
      if (isNearNpcHold(bx, by, 220)) continue;
      if (obstacles.some(o => dist2(bx, by, o.x, o.y) < 80 * 80)) continue;
      if (goldMines.some(g => dist2(bx, by, g.x, g.y) < 160 * 160)) continue;
      if (coalMines.some(g => dist2(bx, by, g.x, g.y) < 160 * 160)) continue;
      const stock = 60 + (i % 3) * 18;
      coalMines.push({
        x: bx, y: by, r: 28, coalLeft: stock, maxCoal: stock,
        occupied: 0, name: 'Coal Mine', exterior: true, resource: 'coal',
      });
      coalsPlaced++;
    }
  }

  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[TR] exterior harvest scaffold — stands:', standsPlaced,
      'trees:', treesPlaced, 'mines:', minesPlaced, 'coal:', coalsPlaced,
      'legacyMines:', goldMines.filter(g => !g.exterior).length);
  }
}

/** Step 9.1 — spread ring surplus into exterior groves beside bike lanes (not on lake bowl). */
function buildExteriorSpreadTrees() {
  if (!EXTERIOR_TREE_SPREAD_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  const groves = [
    { x: 5350, y: 1850, n: 7 }, { x: 5480, y: 2350, n: 7 }, { x: 5280, y: 2850, n: 6 },
    { x: 5650, y: 3200, n: 6 }, { x: 5420, y: 4100, n: 6 },
    { x: 2250, y: 5350, n: 7 }, { x: 2850, y: 5520, n: 7 }, { x: 3450, y: 5280, n: 6 },
    { x: 3950, y: 5450, n: 6 },
    { x: 6150, y: 5350, n: 7 }, { x: 6550, y: 5850, n: 7 }, { x: 5850, y: 6500, n: 7 },
    { x: 7200, y: 6200, n: 6 }, { x: 6800, y: 7100, n: 6 },
    { x: 1400, y: 3800, n: 5 },
  ];
  let placed = 0;
  function placeSpreadTree(tx, ty, size) {
    if (inLegacyWorld(tx, ty)) return false;
    if (LAKE_RESERVE_ENABLED && isLakeReserve(tx, ty)) return false;
    if (BIKE_TRAIL_LANES_ENABLED && isBikeTrailLane(tx, ty)) return false;
    if (isNearNpcHold(tx, ty, EXTERIOR_SPREAD_HOLD_PAD)) return false;
    if (isNearGoldMine(tx, ty, 70)) return false;
    const r = 12 + size * 3;
    if (obstacles.some(o => dist2(tx, ty, o.x, o.y) < (o.r + r + 22) ** 2)) return false;
    const woodLeft = 20 + size * 15;
    const t = {
      x: tx, y: ty, r, type: 'tree', seed: Math.random() * 9, size,
      woodLeft, maxWood: woodLeft,
      exterior: true, exteriorSpread: true,
    };
    assignTreeVariant(t);
    obstacles.push(t);
    placed++;
    return true;
  }
  for (const g of groves) {
    if (LAKE_RESERVE_ENABLED && isLakeReserve(g.x, g.y)) continue;
    for (let j = 0; j < g.n; j++) {
      const a = (j / g.n) * TAU + g.x * 0.017;
      const d = 34 + (j % 4) * 26 + rand(-8, 8);
      placeSpreadTree(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d,
        j % 5 === 0 ? 2 : j % 2 === 0 ? 1 : 0);
    }
  }
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[TR] exterior spread groves — trees:', placed);
  }
}

/** Dense choppable tree wall just inside LEGACY_WORLD edges (Step 6.1). Interior scatter unchanged above. */
function buildLegacyBorderRing() {
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const edgePad = 64;
  const ringRows = EXTERIOR_TREE_SPREAD_ENABLED ? 1 : LEGACY_BORDER_RING_ROWS;
  const ringSpacing = EXTERIOR_TREE_SPREAD_ENABLED ? 58 : LEGACY_BORDER_RING_SPACING;
  const cornerLoops = EXTERIOR_TREE_SPREAD_ENABLED ? 2 : 4;
  let placed = 0;

  function placeRingTree(x, y) {
    if (isLegacyBorderPathSlot(x, y)) return false;
    const size = Math.random() < 0.38 ? 2 : Math.random() < 0.55 ? 1 : 0;
    const r = 14 + size * 4;
    if (obstacles.some(o => dist2(x, y, o.x, o.y) < (o.r + r + 26) ** 2)) return false;
    const t = {
      x, y, r, type: 'tree', seed: Math.random() * 9, size, borderRing: true,
      woodLeft: 18 + size * 14, maxWood: 18 + size * 14,
    };
    assignTreeVariant(t);
    obstacles.push(t);
    placed++;
    return true;
  }

  for (let row = 0; row < ringRows; row++) {
    const inset = LEGACY_BORDER_RING_INSET_MIN +
      (LEGACY_BORDER_RING_INSET_MAX - LEGACY_BORDER_RING_INSET_MIN) *
      (ringRows <= 1 ? 0 : row / (ringRows - 1));
    for (let x = lx + edgePad; x < lx + lw - edgePad; x += ringSpacing) {
      placeRingTree(x + rand(-7, 7), ly + inset + rand(-9, 9));
      placeRingTree(x + rand(-7, 7), ly + lh - inset + rand(-9, 9));
    }
    for (let y = ly + edgePad; y < ly + lh - edgePad; y += ringSpacing) {
      placeRingTree(lx + inset + rand(-9, 9), y + rand(-7, 7));
      placeRingTree(lx + lw - inset + rand(-9, 9), y + rand(-7, 7));
    }
  }
  // Corner bunch clusters — seal diagonal leaks between edge rows
  const corners = [
    [lx + LEGACY_BORDER_RING_INSET_MIN + 18, ly + LEGACY_BORDER_RING_INSET_MIN + 18],
    [lx + lw - LEGACY_BORDER_RING_INSET_MIN - 18, ly + LEGACY_BORDER_RING_INSET_MIN + 18],
    [lx + LEGACY_BORDER_RING_INSET_MIN + 18, ly + lh - LEGACY_BORDER_RING_INSET_MIN - 18],
    [lx + lw - LEGACY_BORDER_RING_INSET_MIN - 18, ly + lh - LEGACY_BORDER_RING_INSET_MIN - 18],
  ];
  for (const [cx, cy] of corners) {
    for (let i = 0; i < cornerLoops; i++) {
      const a = (i / 4) * TAU + Math.PI * 0.25, d = 22 + (i % 2) * 14;
      placeRingTree(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    }
  }
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[TR] legacy border ring trees:', placed);
  }
}

/** Step 6.2 — clear walkable cardinal corridors; path decals + signposts. */
function buildLegacyBorderPaths() {
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const cx = lx + lw / 2, cy = ly + lh / 2;
  const half = LEGACY_PATH_CORRIDOR_HALF;
  const depth = LEGACY_PATH_INTERIOR_DEPTH;
  let cleared = 0;

  obstacles = obstacles.filter(o => {
    if (!isLegacyPathCorridor(o.x, o.y)) return true;
    cleared++;
    return false;
  });
  decor = decor.filter(d => d.type === 'pathsign' || d.type === 'biketrail' || !isLegacyPathCorridor(d.x, d.y));

  const signposts = [
    { x: cx, y: ly + depth - 72, type: 'pathsign', dir: 'n', seed: 1.1 },
    { x: cx, y: ly + lh - depth + 72, type: 'pathsign', dir: 's', seed: 2.2 },
    { x: lx + depth - 72, y: cy, type: 'pathsign', dir: 'w', seed: 3.3 },
    { x: lx + lw - depth + 72, y: cy, type: 'pathsign', dir: 'e', seed: 4.4 },
  ];
  for (const sp of signposts) {
    if (!isNearGoldMine(sp.x, sp.y)) decor.push(sp);
  }

  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[TR] legacy path corridors cleared obstacles:', cleared,
      'mines:', goldMines.length);
  }
}

/** Step 6.4 — exterior holds visible only after fog cleared at hold site. */
function isHoldVisible(hold) {
  if (!CONTINUOUS_MAP_ENABLED || !hold) return false;
  if (!FOG_DISCOVERY_ENABLED) return true;
  const cx = Math.floor(hold.x / FOG_CHUNK_SIZE);
  const cy = Math.floor(hold.y / FOG_CHUNK_SIZE);
  return isFogChunkDiscovered(cx, cy);
}
/** 4.1.1 perf — draw gate: hold rectangle overlaps the camera viewport (+margin).
 * isHoldVisible is fog-based, so discovered holds used to render (brick ground,
 * walls, units) every frame even when the player was across the map. */
function isHoldOnCamera(hold, m) {
  m = m || 240;
  return hold.x + hold.halfW + m > camera.x && hold.x - hold.halfW - m < camera.x + VW &&
         hold.y + hold.halfH + m > camera.y && hold.y - hold.halfH - m < camera.y + VH;
}
function buildHoldWallLayout(hold) {
  const hw = hold.halfW, hh = hold.halfH, x = hold.x, y = hold.y;
  const corners = [
    { x: x - hw, y: y - hh },
    { x: x + hw, y: y - hh },
    { x: x + hw, y: y + hh },
    { x: x - hw, y: y + hh },
  ];
  hold.walls = corners.map(c => ({
    x: c.x, y: c.y, r: HOLD_WALL_R,
    hp: BRICKWALL_HP, maxHp: BRICKWALL_HP, baseHp: BRICKWALL_HP,
    neighbors: 2,
    links: {},
  }));
  hold.wallSegments = [
    [hold.walls[0], hold.walls[1]],
    [hold.walls[1], hold.walls[2]],
    [hold.walls[2], hold.walls[3]],
    [hold.walls[3], hold.walls[0]],
  ];
}

function translateOrangeQuarterHold(h, dx, dy) {
  if (!dx && !dy) return;
  for (const s of h.structures || []) { s.x += dx; s.y += dy; }
  if (h.activeBuild) { h.activeBuild.x += dx; h.activeBuild.y += dy; }
  for (const d of h.defenses || []) { d.x += dx; d.y += dy; }
  if (h.captain) { h.captain.x += dx; h.captain.y += dy; }
  for (const u of holdUnits) { if (u.holdId === h.id) { u.x += dx; u.y += dy; } }
  for (const L of holdLaborers) { if (L.holdId === h.id) { L.x += dx; L.y += dy; } }
}
function migrateOrangeQuarterOnLoad(holdsData) {
  if (!ORANGE_QUARTER_ENABLED || !Array.isArray(holdsData)) return;
  for (const hs of holdsData) {
    if (!hs || !hs.id || hs.orangeQuarterMigrated) continue;
    const old = ORANGE_QUARTER_PREV_POS[hs.id];
    const h = holdById(hs.id);
    if (!old || !h) continue;
    const dx = h.x - old.x, dy = h.y - old.y;
    if (Math.abs(dx) + Math.abs(dy) < 2) { h.orangeQuarterMigrated = true; continue; }
    const hasGeom = (hs.structures && hs.structures.length) || hs.captain ||
      (hs.laborers && hs.laborers.length) || (hs.units && hs.units.length) ||
      (hs.defenses && hs.defenses.length) || (hs.activeBuild && hs.activeBuild.kind);
    if (!hasGeom) { h.orangeQuarterMigrated = true; continue; }
    if (hs.structures && hs.structures.length) {
      const s0 = hs.structures[0];
      if (dist2(s0.x, s0.y, h.x, h.y) < dist2(s0.x, s0.y, old.x, old.y)) {
        h.orangeQuarterMigrated = true;
        continue;
      }
    }
    translateOrangeQuarterHold(h, dx, dy);
    h.orangeQuarterMigrated = true;
  }
}
function clearTreesInHoldFootprints() {
  if (!ORANGE_QUARTER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  for (const h of npcHolds) {
    const inQuarter = inLegacyWorld(h.x, h.y);
    const pad = Math.max(h.halfW || HOLD_FOOT_HALF_W, h.halfH || HOLD_FOOT_HALF_H) +
      (inQuarter ? ORANGE_QUARTER_TREE_CLEAR_PAD : 28);
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.type !== 'tree' && o.type !== 'deadtree') continue;
      if (Math.abs(o.x - h.x) < pad && Math.abs(o.y - h.y) < pad) obstacles.splice(i, 1);
    }
  }
}

function buildNpcHolds() {
  npcHolds.length = 0;
  holdUnits.length = 0;
  holdProbes.length = 0;
  holdLaborers.length = 0;
  if (!CONTINUOUS_MAP_ENABLED) return;
  for (const t of HOLD_TEMPLATES) {
    const hold = {
      id: t.id,
      name: t.name,
      x: t.x, y: t.y,
      halfW: t.halfW, halfH: t.halfH,
      defenseTier: t.defenseTier || 'big',
      visited: false,
      greet: t.greet || [],
      npcs: t.npcs.map(n => ({
        x: t.x + n.dx,
        y: t.y + n.dy,
        r: 14,
        name: n.name,
        role: 'hold',
        holdId: t.id,
      })),
      walls: [],
      wallSegments: [],
    };
    buildHoldWallLayout(hold);
    for (const w of hold.walls) {
      obstacles.push({ x: w.x, y: w.y, r: HOLD_WALL_R + 4, type: 'holdwall', seed: 0 });
    }
    npcHolds.push(hold);
    if (HOLD_AUTONOMY_ENABLED) seedHoldStarterDefenses(hold, t.defenseTier || 'big');
  }
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[TR] npc holds placed:', npcHolds.length);
  }
}
function drawHoldBrickGround(hold) {
  if (!isHoldVisible(hold)) return;
  const x0 = hold.x - hold.halfW, y0 = hold.y - hold.halfH;
  const w = hold.halfW * 2, h = hold.halfH * 2;
  ctx.fillStyle = '#7a4828';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = '#4a2a18';
  ctx.lineWidth = 1;
  const rowH = 14;
  for (let ry = y0; ry < y0 + h; ry += rowH) {
    const off = (Math.floor(ry / rowH) % 2) * 18;
    ctx.beginPath();
    for (let rx = x0 - off; rx < x0 + w + 18; rx += 36) ctx.rect(rx, ry, 32, rowH - 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(168,132,78,0.32)';
  ctx.fillRect(x0, y0, w, h);
}
function applyHoldSave(holdsData) {
  if (!Array.isArray(holdsData)) return;
  holdUnits.length = 0;
  holdProbes.length = 0;
  holdLaborers.length = 0;
  for (const hs of holdsData) {
    if (!hs || !hs.id) continue;
    const h = npcHolds.find(x => x.id === hs.id);
    if (!h) continue;
    h.visited = !!hs.visited;
    h.recruited = !!hs.recruited;
    h.refusedEarly = !!hs.refusedEarly;
    h.allegiance = !!hs.allegiance;
    h.gauntletDone = !!hs.gauntletDone;
    h.gauntletWave = hs.gauntletWave | 0;
    h.gauntletActive = !!hs.gauntletActive;
    h.gauntletT = +hs.gauntletT || 0;
    h.ageT = +hs.ageT || 0; // 4.1.1 — hold age persists (auto-graduation clock)
    h.orangeSp = Math.max(0, +hs.orangeSp || 0);
    h.orangeCores = Math.max(0, +hs.orangeCores || 0);
    h.coal = Math.max(0, +hs.coal || 0); // 8.1
    h.unlocked = Object.assign({ rover: true, scout: false, sentinel: false, warden: false }, hs.unlocked || {});
    if (Array.isArray(hs.defenses)) {
      h.defenses = hs.defenses.map(d => ({
        x: d.x, y: d.y, r: d.r || 22, hp: d.hp, maxHp: d.maxHp || d.hp || 120,
      }));
    }
    h.villageSeeded = !!hs.villageSeeded;
    h.structures = Array.isArray(hs.structures) ? hs.structures.map(s => ({
      id: s.id || ('hs_' + h.id + '_' + s.kind),
      kind: s.kind, x: s.x, y: s.y, r: s.r || (HOLD_STRUCTURE_KINDS[s.kind] && HOLD_STRUCTURE_KINDS[s.kind].r) || 24,
      hp: s.hp != null ? s.hp : (HOLD_STRUCTURE_KINDS[s.kind] && HOLD_STRUCTURE_KINDS[s.kind].hp) || 120,
      maxHp: s.maxHp || s.hp || (HOLD_STRUCTURE_KINDS[s.kind] && HOLD_STRUCTURE_KINDS[s.kind].hp) || 120,
    })) : [];
    h.buildQueue = Array.isArray(hs.buildQueue) ? hs.buildQueue.filter(q => q && q.kind).map(q => ({ kind: q.kind })) : [];
    h.activeBuild = hs.activeBuild && hs.activeBuild.kind ? {
      kind: hs.activeBuild.kind,
      x: +hs.activeBuild.x, y: +hs.activeBuild.y,
      r: +hs.activeBuild.r || (HOLD_STRUCTURE_KINDS[hs.activeBuild.kind] && HOLD_STRUCTURE_KINDS[hs.activeBuild.kind].r) || 24,
      progress: Math.max(0, +hs.activeBuild.progress || 0),
      buildSec: +hs.activeBuild.buildSec || (HOLD_STRUCTURE_KINDS[hs.activeBuild.kind] && HOLD_STRUCTURE_KINDS[hs.activeBuild.kind].buildSec) || 10,
    } : null;
    if (h.gauntletDone && !h.villageSeeded) seedHoldVillageQueue(h);
    h.showcaseDone = !!hs.showcaseDone; // 4.1.2
    h.captainLevel = hs.captainLevel | 0;
    h.growthStage = hs.growthStage | 0;
    h.captainQueueSeeded = !!hs.captainQueueSeeded;
    h.learnGauntletDone = !!hs.learnGauntletDone;
    h.learnGauntletWave = hs.learnGauntletWave | 0;
    h.learnGauntletActive = !!hs.learnGauntletActive;
    h.learnProbeCd = +hs.learnProbeCd || 0;
    if (HOLD_CAPTAIN_ENABLED && h.gauntletDone && (hs.captain || hs.captainLevel > 0 || h.gauntletDone)) {
      spawnHoldCaptain(h, hs.captain || null);
      if (hs.captainLevel) h.captainLevel = Math.max(h.captainLevel | 0, hs.captainLevel | 0);
      if (h.captainQueueSeeded || holdCoreVillageDone(h) || h.learnGauntletDone) seedHoldCaptainQueue(h);
      recomputeHoldCaptainLevel(h);
    }
    if (HOLD_AUTONOMY_ENABLED && Array.isArray(hs.units)) {
      for (const u of hs.units) {
        if (!u || !u.type) continue;
        holdUnits.push(restoreHoldUnit(h, u));
      }
    }
    if (HOLD_AUTONOMY_ENABLED) {
      if (Array.isArray(hs.laborers) && hs.laborers.length) {
        for (const ls of hs.laborers) holdLaborers.push(restoreHoldLaborer(h, ls));
      } else if (!holdLaborers.some(L => L.holdId === h.id)) {
        spawnHoldLaborer(h, h.x + rand(-16, 16), h.y + rand(-8, 12));
      }
    }
  }
  migrateOrangeQuarterOnLoad(holdsData);
}

// ---------- Step 6.5 — hold join/refuse, orange squad, gauntlet ----------
function holdTemplateFor(hold) { return HOLD_TEMPLATES.find(t => t.id === hold.id); }
function holdJoinWave(hold) {
  const t = holdTemplateFor(hold);
  return t && t.joinWave != null ? t.joinWave : HOLD_JOIN_WAVE_NEAR;
}
function holdCanJoin(hold) { return wave >= holdJoinWave(hold); }
function isHoldOrbPickup(p) { return p && p.type === 'hold_orb'; }
function holdById(id) { return npcHolds.find(h => h.id === id); }
function holdZoneRadius(hold) { return hold.halfW + hold.halfH + HOLD_ZONE_PAD; }
function inHoldZone(hold, x, y) { return dist2(x, y, hold.x, hold.y) < holdZoneRadius(hold) ** 2; }
function holdDefenseFacing(hold) {
  if (ORANGE_QUARTER_ENABLED && inLegacyWorld(hold.x, hold.y)) {
    const cx = LEGACY_WORLD.w / 2, cy = LEGACY_WORLD.h / 2;
    const dx = cx - hold.x, dy = cy - hold.y;
    const len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
  }
  if (hold.y > LEGACY_WORLD.h + 100) return { dx: 0, dy: -1 };
  if (hold.y < LEGACY_WORLD.y + 100) return { dx: 0, dy: 1 };
  if (hold.x > LEGACY_WORLD.w + 100) return { dx: -1, dy: 0 };
  return { dx: 1, dy: 0 };
}
function pickHoldDefenseSlot(hold) {
  const facing = holdDefenseFacing(hold);
  const maxDef = HOLD_DEFENSE_MAX[hold.defenseTier || 'big'] || 4;
  const live = (hold.defenses || []).filter(d => d.hp > 0).length;
  if (live >= maxDef) return null;
  for (let i = 0; i < 6; i++) {
    const along = rand(-hold.halfW * 0.7, hold.halfW * 0.7);
    const x = hold.x + facing.dx * (hold.halfH + 22) + (facing.dy ? along : 0);
    const y = hold.y + facing.dy * (hold.halfH + 22) + (facing.dx ? along : 0);
    const clash = (hold.defenses || []).some(d => d.hp > 0 && dist2(x, y, d.x, d.y) < 42 * 42);
    if (!clash && inHoldZone(hold, x, y)) return { x, y };
  }
  return null;
}

function makeHoldLaborer(hold, x, y, saved) {
  return {
    holdId: hold.id,
    holdSide: true,
    id: (saved && saved.id) || ('hl_' + hold.id + '_' + (Math.random() * 1e6 | 0)),
    x: saved ? (+saved.x || hold.x) : x,
    y: saved ? (+saved.y || hold.y) : y,
    vx: 0, vy: 0, r: 11,
    hp: saved ? clamp(+saved.hp || 90, 0, 90) : 90,
    maxHp: 90,
    downed: !!(saved && saved.downed),
    hurtT: 0, walk: rand(0, 8), facing: 1,
    gatherT: 0, buildT: 0, swipeT: 0,
    task: 'idle', targetDef: null, buildSite: null,
    target: null, res: null, carry: null, // Step 7.1/7.2 exterior harvest
    insideMine: false, mineT: 0,
  };
}
/** Hold orange builder: nearest fog-known exterior tree near this hold (not interior). */
function pickHoldChopTarget(L, hold) {
  if (!EXTERIOR_CHOP_ENABLED || !hold) return null;
  const maxR2 = HOLD_EXTERIOR_CHOP_RANGE * HOLD_EXTERIOR_CHOP_RANGE;
  let tree = null, td = maxR2;
  for (const o of obstacles) {
    if (o.type !== 'tree' || !o.exterior || !(o.woodLeft > 0)) continue;
    if (!isExteriorSiteVisible(o.x, o.y) && !hold.visited) continue;
    const fromHold = dist2(hold.x, hold.y, o.x, o.y);
    if (fromHold > maxR2) continue;
    let d2 = fromHold * 0.65 + dist2(L.x, L.y, o.x, o.y) * 0.35;
    if (o.standId != null) d2 *= 0.72;
    if (d2 < td) { td = d2; tree = o; }
  }
  return tree;
}
/** Hold orange builder: nearest fog-known exterior gold mine near this hold. */
function pickHoldMineTarget(L, hold) {
  if (!EXTERIOR_MINE_ENABLED || !hold) return null;
  const maxR2 = HOLD_EXTERIOR_MINE_RANGE * HOLD_EXTERIOR_MINE_RANGE;
  let mine = null, td = maxR2;
  for (const g of goldMines) {
    if (!g.exterior || !(g.goldLeft > 0)) continue;
    if (!isExteriorSiteVisible(g.x, g.y) && !hold.visited) continue;
    const fromHold = dist2(hold.x, hold.y, g.x, g.y);
    if (fromHold > maxR2) continue;
    const d2 = fromHold * 0.65 + dist2(L.x, L.y, g.x, g.y) * 0.35;
    if (d2 < td) { td = d2; mine = g; }
  }
  return mine;
}
/** Step 8.1 — hold builder: nearest fog-known exterior coal mine near this hold. */
function pickHoldCoalTarget(L, hold) {
  if (!EXTERIOR_COAL_ENABLED || !hold) return null;
  const maxR2 = HOLD_EXTERIOR_COAL_RANGE * HOLD_EXTERIOR_COAL_RANGE;
  let mine = null, td = maxR2;
  for (const g of coalMines) {
    if (!(g.coalLeft > 0)) continue;
    if (!isExteriorSiteVisible(g.x, g.y) && !hold.visited) continue;
    const fromHold = dist2(hold.x, hold.y, g.x, g.y);
    if (fromHold > maxR2) continue;
    const d2 = fromHold * 0.65 + dist2(L.x, L.y, g.x, g.y) * 0.35;
    if (d2 < td) { td = d2; mine = g; }
  }
  return mine;
}
function mineHasStock(m) {
  if (!m) return false;
  if (m.resource === 'coal') return (m.coalLeft | 0) > 0;
  return (m.goldLeft | 0) > 0;
}
function creditHoldWoodDeposit(hold, amt) {
  if (!hold || !(amt > 0)) return;
  hold.orangeSp = (hold.orangeSp | 0) + Math.floor(amt * HOLD_WOOD_TO_ORANGESP);
}
function creditHoldGoldDeposit(hold, amt) {
  if (!hold || !(amt > 0)) return;
  // No hold gold bank — mirror wood → orangeSp (feeds 6.6 queue)
  hold.orangeSp = (hold.orangeSp | 0) + Math.floor(amt * HOLD_GOLD_TO_ORANGESP);
}
/** Step 8.1 — coal banks separately (fuel convert in 8.2; does NOT feed orangeSp). */
function creditHoldCoalDeposit(hold, amt) {
  if (!hold || !(amt > 0)) return;
  hold.coal = (hold.coal | 0) + Math.floor(amt);
}

// ---------- Step 8.2 fuel economy (refuel at existing camp buildings) ----------
function structureCanRefuel(kind) {
  return FUEL_ECONOMY_ENABLED && REFUEL_BUILDING_KINDS.indexOf(kind) >= 0;
}
function fuelHudVisible() {
  return FUEL_ECONOMY_ENABLED && (coal > 0 || fuel > 0);
}
function tryRefuelAtStructure(s) {
  if (!FUEL_ECONOMY_ENABLED || !s || !structureCanRefuel(s.kind)) return false;
  if (fuel >= FUEL_MAX) {
    addFloater(s.x, s.y - 40, 'FUEL TANK FULL', '#a0a0a0', false);
    return false;
  }
  if (coal < COAL_PER_REFUEL) {
    addFloater(s.x, s.y - 40, 'NEED COAL — exterior gray mines', '#a0a0a0', false);
    return false;
  }
  coal -= COAL_PER_REFUEL;
  const before = fuel;
  fuel = Math.min(FUEL_MAX, fuel + FUEL_PER_COAL);
  const gained = fuel - before;
  spawnParticles(s.x, s.y - 12, 10, '#9a9aa8', 2.5);
  sfx.play('place');
  addFloater(s.x, s.y - 44, '+⛽ ' + gained + ' FUEL', '#c8a882', true);
  return true;
}
/** 8.3 hooks here — drain fuel while mounted on dirt bike. */
function tickFuelBurn(dt) {
  if (!FUEL_ECONOMY_ENABLED || !DIRT_BIKE_ENABLED) return;
  if (!bike.mounted) return;
  fuel = Math.max(0, fuel - FUEL_BURN_PER_SEC * dt);
  if (fuel <= 0) {
    dismountBike(true);
    addFloater(player.x, player.y - 44, 'OUT OF FUEL', '#ffb878', false);
  }
}

// ---------- Step 8.3 Ashen Rift Bike (exterior travel) ----------
function buildBikeWreck() {
  bikeWreck = null;
  if (!DIRT_BIKE_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  // East path exit north — first exterior trailhead (matches 7.0 harvest site)
  const x = 4920, y = 2100;
  if (inLegacyWorld(x, y)) return;
  bikeWreck = { x, y, smokeT: 0 };
  if (!bike.owned) {
    bike.parkX = x;
    bike.parkY = y;
  }
}
function bikeParkDist2() {
  return dist2(player.x, player.y, bike.parkX, bike.parkY);
}
function bikeWreckDist2() {
  return bikeWreck ? dist2(player.x, player.y, bikeWreck.x, bikeWreck.y) : 1e12;
}
function canInteractBikeWreck() {
  return DIRT_BIKE_ENABLED && bikeWreck && !bike.owned &&
    bikeWreckDist2() < BIKE_INTERACT_R * BIKE_INTERACT_R && isExteriorSiteVisible(bikeWreck.x, bikeWreck.y);
}
function canMountBike() {
  return DIRT_BIKE_ENABLED && bike.owned && !bike.mounted && !player.downed &&
    bikeParkDist2() < BIKE_INTERACT_R * BIKE_INTERACT_R && fuel > 0;
}
function tryRepairBike() {
  if (!canInteractBikeWreck()) return false;
  if (wood < BIKE_REPAIR_WOOD || gold < BIKE_REPAIR_GOLD) {
    addFloater(bikeWreck.x, bikeWreck.y - 50, `NEED ${BIKE_REPAIR_WOOD} wood + ${BIKE_REPAIR_GOLD} gold`, '#ffb878', false);
    return false;
  }
  wood -= BIKE_REPAIR_WOOD;
  gold -= BIKE_REPAIR_GOLD;
  bike.owned = true;
  bike.parkX = bikeWreck.x;
  bike.parkY = bikeWreck.y;
  bike.mounted = false;
  bike.parkHoldId = null;
  const trailX = bike.parkX, trailY = bike.parkY;
  bikeWreck = null;
  if (DIRT_BIKE_HOLD_LINKS_ENABLED) {
    decor.push({ x: trailX, y: trailY - 28, type: 'biketrail', seed: 8.4 });
  }
  spawnParticles(trailX, trailY, 28, '#d4b8ff', 5);
  addFloater(trailX, trailY - 56, 'RIFT BIKE RESTORED!', '#d4b8ff', true);
  banner('BIKE ONLINE', 'refuel at camp · ride the exterior');
  sfx.play('place');
  return true;
}
function mountBike() {
  if (!DIRT_BIKE_ENABLED || bike.mounted || !bike.owned || player.downed) return false;
  if (inLegacyWorld(player.x, player.y)) {
    addFloater(player.x, player.y - 40, 'BIKE STAYS PAST THE RING', '#ffb878', false);
    return false;
  }
  if (fuel <= 0) {
    addFloater(player.x, player.y - 40, 'REFUEL FIRST', '#ffb878', false);
    return false;
  }
  if (bikeParkDist2() > BIKE_INTERACT_R * BIKE_INTERACT_R) return false;
  bike.mounted = true;
  player.r = DIRT_BIKE_R;
  player.form = 0;
  beam = null; charging = false; beamCharge = 0;
  addFloater(player.x, player.y - 48, 'RIFT BIKE!', '#d4b8ff', true);
  sfx.play('dash');
  return true;
}
function dismountBike(silent) {
  if (!bike.mounted) return false;
  bike.mounted = false;
  player.r = 15;
  const snap = DIRT_BIKE_HOLD_LINKS_ENABLED ? snapBikeParkToHold(player.x, player.y) : { x: player.x, y: player.y, holdId: null };
  bike.parkX = snap.x;
  bike.parkY = snap.y;
  bike.parkHoldId = snap.holdId;
  if (!silent) {
    if (snap.holdId) {
      const h = holdById(snap.holdId);
      addFloater(player.x, player.y - 40, 'PARKED AT ' + (h && h.name || 'HOLD'), '#d4b8ff', false);
      if (FUEL_ECONOMY_ENABLED && h && (h.structures || []).some(s => s.kind === 'bikeshed') && fuel < FUEL_MAX) {
        const before = fuel;
        fuel = Math.min(FUEL_MAX, fuel + BIKE_SHED_FUEL_BONUS);
        if (fuel > before) addFloater(player.x, player.y - 52, '+⛽ ' + (fuel - before) + ' SHED', '#c8a882', false);
      }
    } else addFloater(player.x, player.y - 40, 'DISMOUNTED', '#9fb2c9', false);
  }
  return true;
}
function knockOffBike(dmg) {
  if (!bike.mounted) return;
  if (dmg < BIKE_KNOCKOFF_DMG) return;
  dismountBike(true);
  addFloater(player.x, player.y - 44, 'KNOCKED OFF!', '#ff8a93', true);
  camera.shake = Math.max(camera.shake, 8);
}
function tryBikeAction() {
  if (!DIRT_BIKE_ENABLED || state !== 'playing' || paused || player.downed) return false;
  if (bike.mounted) { dismountBike(); return true; }
  if (canMountBike()) return mountBike();
  if (canInteractBikeWreck()) return tryRepairBike();
  return false;
}
function tickBikeWreckSmoke(dt) {
  if (bikeWreck && !bike.owned) bikeWreck.smokeT = (bikeWreck.smokeT || 0) + dt;
}
function nearestHoldForBikePark(x, y) {
  if (!DIRT_BIKE_HOLD_LINKS_ENABLED) return null;
  let best = null, bd = 1e12;
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    const hw = h.halfW + HOLD_ZONE_PAD * 0.5, hh = h.halfH + HOLD_ZONE_PAD * 0.5;
    if (Math.abs(x - h.x) > hw || Math.abs(y - h.y) > hh) continue;
    const d2 = dist2(x, y, h.x, h.y);
    if (d2 < bd) { bd = d2; best = h; }
  }
  return best;
}
function getHoldBikeParkSpot(hold) {
  if (!hold) return { x: bike.parkX, y: bike.parkY };
  const shed = (hold.structures || []).find(s => s.kind === 'bikeshed');
  if (shed) return { x: shed.x, y: shed.y };
  const pad = (hold.structures || []).find(s => s.kind === 'brickpad');
  if (pad) return { x: pad.x, y: pad.y };
  const idx = holdBuildSlotIndex('bikeshed');
  if (idx >= 0 && HOLD_BUILD_SLOTS[idx]) {
    const o = HOLD_BUILD_SLOTS[idx];
    return { x: hold.x + o.dx, y: hold.y + o.dy };
  }
  return { x: hold.x, y: hold.y + hold.halfH * 0.35 };
}
function snapBikeParkToHold(x, y) {
  const hold = nearestHoldForBikePark(x, y);
  if (!hold) return { x, y, holdId: null };
  const spot = getHoldBikeParkSpot(hold);
  return { x: spot.x, y: spot.y, holdId: hold.id };
}

function bikeEffectiveR() {
  return bike.mounted ? DIRT_BIKE_R : player.r;
}

const dirtBikeSpr = { sheet: null, ok: false };
(function loadDirtBikeSprite() {
  if (!DIRT_BIKE_SPRITE_ENABLED) return;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => { dirtBikeSpr.sheet = img; dirtBikeSpr.ok = img.naturalWidth > 0; };
  img.onerror = () => { dirtBikeSpr.ok = false; };
  img.src = 'assets/vehicles/dirtbike/ashen-rift-bike-concept-v3.png';
})();

function drawBikeSpiralSmoke(x, y, time, s) {
  ctx.save();
  ctx.translate(x, y);
  for (let layer = 0; layer < 3; layer++) {
    const phase = time * 0.75 + layer * 0.65;
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const u = i / 36;
      const ang = u * 2.2 * TAU + phase;
      const rad = (5 + u * 22) * s * (1 + layer * 0.12);
      const px = Math.cos(ang) * rad * 0.5;
      const py = -u * 34 * s - Math.sin(ang) * rad * 0.2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(198,208,218,' + (0.2 - layer * 0.04) + ')';
    ctx.lineWidth = (3 - layer * 0.5) * s;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawBikeSpriteAt(x, y, pose, facing, walk, alpha) {
  const drawH = DIRT_BIKE_SPRITE_DRAWH;
  const bob = pose === 'ride' ? Math.abs(Math.sin(walk || 0)) * 2 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.beginPath(); ctx.ellipse(0, 2, 20, 7, 0, 0, TAU); ctx.fill();
  if (dirtBikeSpr.ok && dirtBikeSpr.sheet) {
    const img = dirtBikeSpr.sheet;
    const third = img.naturalWidth / 3;
    const sy = 0, sh = img.naturalHeight;
    let sx = 0;
    if (pose === 'ride') sx = third;
    else if (pose === 'wreck') sx = third * 2;
    const drawW = drawH * (third / sh);
    ctx.scale(facing || 1, 1);
  // faint whole-bike aura
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 700);
    const ar = drawH * 0.72 + pulse * 4;
    const ag = ctx.createRadialGradient(0, -drawH * 0.45, 4, 0, -drawH * 0.4, ar);
    ag.addColorStop(0, 'rgba(232,220,255,0)');
    ag.addColorStop(0.5, 'rgba(232,220,255,' + (0.12 + pulse * 0.06) + ')');
    ag.addColorStop(1, 'rgba(232,220,255,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.ellipse(0, -drawH * 0.4, ar * 0.9, ar * 0.5, 0, 0, TAU); ctx.fill();
    ctx.drawImage(img, sx, sy, third, sh, -drawW / 2, -drawH, drawW, drawH);
  } else {
    ctx.scale(facing || 1, 1);
    ctx.fillStyle = '#3a3e48';
    ctx.fillRect(-18, -drawH + 8, 36, 10);
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(-12, -drawH + 4, 24, 8);
  }
  ctx.restore();
}

function restoreHoldLaborer(hold, ls) { return makeHoldLaborer(hold, hold.x, hold.y, ls); }
/** 4.1.1 — graduated villages support a second builder (visible crew growth). */
function holdLaborerCap(hold) {
  return hold && hold.gauntletDone ? HOLD_LABORER_GROWN : HOLD_LABORER_PER_HOLD;
}
function spawnHoldLaborer(hold, x, y) {
  if (!HOLD_AUTONOMY_ENABLED || !hold) return null;
  let live = 0;
  for (const L of holdLaborers) { if (L.holdId === hold.id && !L.downed) live++; }
  if (live >= holdLaborerCap(hold)) return null;
  const L = makeHoldLaborer(hold, x, y);
  holdLaborers.push(L);
  return L;
}

function makeHoldUnit(hold, type, x, y, saved) {
  const t = COMP_TYPES[type];
  if (!t) return null;
  const hp = saved && saved.maxHp ? saved.maxHp : t.hp * 0.85;
  return {
    holdId: hold.id,
    type,
    x: saved ? (+saved.x || hold.x) : x,
    y: saved ? (+saved.y || hold.y) : y,
    vx: 0, vy: 0, r: type === 'rover' ? 11 : 13,
    hp: saved ? clamp(+saved.hp || hp, 0, hp) : hp,
    maxHp: hp,
    downed: !!(saved && saved.downed),
    hurtT: 0, atkCd: rand(0.3, 1), walk: rand(0, 9), facing: 1, aim: 0,
    swipeT: 0, uid: (saved && saved.uid) || ('hu_' + hold.id + '_' + type + '_' + (Math.random() * 1e6 | 0)),
  };
}
function restoreHoldUnit(hold, u) { return makeHoldUnit(hold, u.type, hold.x, hold.y, u); }

function holdUnitCapFor(hold, type) {
  if (HOLD_CAPTAIN_ENABLED && hold && (hold.captainLevel | 0) >= 2) {
    return HOLD_CAPTAIN_UNIT_CAP[type] || 1;
  }
  return 1;
}
function countHoldUnitsOfType(hold, type) {
  let n = 0; // 4.1.1 perf — was a per-frame filter() allocation via tryHoldUnlock
  for (const u of holdUnits) { if (u.holdId === hold.id && u.type === type && !u.downed) n++; }
  return n;
}
function spawnHoldUnit(hold, type, x, y) {
  if (!HOLD_AUTONOMY_ENABLED || !hold) return null;
  if (countHoldUnitsOfType(hold, type) >= holdUnitCapFor(hold, type)) return null;
  const u = makeHoldUnit(hold, type, x, y);
  if (!u) return null;
  holdUnits.push(u);
  hold.unlocked[type] = true;
  spawnParticles(x, y, 14, '#ff9d2e', 3);
  return u;
}

function seedHoldStarterDefenses(hold, tier) {
  if (!HOLD_AUTONOMY_ENABLED) return;
  hold.defenses = hold.defenses || [];
  hold.unlocked = { rover: true, scout: false, sentinel: false, warden: false };
  hold.orangeSp = 0;
  hold.orangeCores = 0;
  hold.coal = 0; // 8.1 — hold coal bank (fuel later)
  hold.gauntletDone = false;
  hold.gauntletWave = 0;
  hold.gauntletActive = false;
  hold.gauntletT = 0;
  hold.probeCd = 0;
  hold.orbSpawnT = rand(8, 16);
  hold.recruited = false;
  hold.refusedEarly = false;
  hold.allegiance = false;
  hold.structures = [];
  hold.buildQueue = [];
  hold.activeBuild = null;
  hold.villageSeeded = false;
  hold.captain = null;
  hold.captainLevel = 0;
  hold.growthStage = 0;
  hold.captainQueueSeeded = false;
  hold.learnGauntletDone = false;
  hold.learnGauntletWave = 0;
  hold.learnGauntletActive = false;
  hold.learnProbeCd = 0;
  hold.showcaseDone = false;   // 4.1.2 — first-contact guaranteed build
  hold.showcaseArmT = 0;
  hold.alertT = 0; hold.alertX = null; hold.alertY = null; // 4.1.2 — combat alarm
  const barricadeN = tier === 'far' ? 3 : 2;
  const facing = hold.y > LEGACY_WORLD.h + 100 ? { dx: 0, dy: -1 }
    : hold.y < LEGACY_WORLD.y + 100 ? { dx: 0, dy: 1 }
    : hold.x > LEGACY_WORLD.w + 100 ? { dx: -1, dy: 0 }
    : { dx: 1, dy: 0 };
  for (let i = 0; i < barricadeN; i++) {
    const along = (i - (barricadeN - 1) / 2) * 36;
    hold.defenses.push({
      x: hold.x + facing.dx * (hold.halfH + 18) + (facing.dy ? along : 0),
      y: hold.y + facing.dy * (hold.halfH + 18) + (facing.dx ? along : 0),
      r: 22, hp: tier === 'far' ? 150 : 120, maxHp: tier === 'far' ? 150 : 120,
    });
  }
  spawnHoldUnit(hold, 'rover', hold.x + rand(-24, 24), hold.y + rand(-12, 18));
  if (tier === 'far') {
    spawnHoldUnit(hold, 'sentinel', hold.x + rand(-30, 30), hold.y + rand(-8, 22));
  } else {
    spawnHoldUnit(hold, 'sentinel', hold.x + rand(-22, 22), hold.y + rand(4, 24));
  }
  spawnHoldLaborer(hold, hold.x + rand(-14, 14), hold.y + rand(-6, 10));
}

function holdStructureClash(hold, x, y, r) {
  if (!inHoldZone(hold, x, y)) return true;
  for (const n of hold.npcs || []) {
    if (dist2(x, y, n.x, n.y) < (r + (n.r || 14) + 4) ** 2) return true;
  }
  for (const d of hold.defenses || []) {
    if (d.hp > 0 && dist2(x, y, d.x, d.y) < (r + d.r + 12) ** 2) return true;
  }
  for (const s of hold.structures || []) {
    if (dist2(x, y, s.x, s.y) < (r + s.r + 14) ** 2) return true;
  }
  if (hold.activeBuild && dist2(x, y, hold.activeBuild.x, hold.activeBuild.y) < (r + hold.activeBuild.r + 14) ** 2) return true;
  for (const w of hold.walls || []) {
    if (dist2(x, y, w.x, w.y) < (r + HOLD_WALL_R + 4) ** 2) return true;
  }
  return false;
}

function holdBuildSlotIndex(kind) {
  const core = HOLD_VILLAGE_BUILD_ORDER.indexOf(kind);
  if (core >= 0) return core;
  const cap = HOLD_CAPTAIN_BUILD_ORDER.indexOf(kind);
  if (cap >= 0) return HOLD_VILLAGE_BUILD_ORDER.length + cap;
  return -1;
}
function pickHoldStructureSlot(hold, kind) {
  const def = HOLD_STRUCTURE_KINDS[kind];
  if (!def) return null;
  const idx = holdBuildSlotIndex(kind);
  if (idx >= 0 && HOLD_BUILD_SLOTS[idx]) {
    const o = HOLD_BUILD_SLOTS[idx];
    const x = hold.x + o.dx, y = hold.y + o.dy;
    if (!holdStructureClash(hold, x, y, def.r)) return { x, y, r: def.r };
  }
  for (let i = 0; i < 14; i++) {
    const x = hold.x + rand(-hold.halfW * 0.62, hold.halfW * 0.62);
    const y = hold.y + rand(-hold.halfH * 0.5, hold.halfH * 0.5);
    if (!holdStructureClash(hold, x, y, def.r)) return { x, y, r: def.r };
  }
  return null;
}

function seedHoldVillageQueue(hold) {
  if (!HOLD_AUTONOMY_ENABLED || !hold || hold.villageSeeded) return;
  hold.villageSeeded = true;
  hold.structures = hold.structures || [];
  hold.buildQueue = hold.buildQueue || [];
  const t = holdTemplateFor(hold);
  const order = (t && t.villageBuild) || HOLD_VILLAGE_BUILD_ORDER;
  for (const kind of order) {
    if (!HOLD_STRUCTURE_KINDS[kind]) continue;
    const done = hold.structures.some(s => s.kind === kind);
    const queued = hold.buildQueue.some(q => q.kind === kind);
    const building = hold.activeBuild && hold.activeBuild.kind === kind;
    if (!done && !queued && !building) hold.buildQueue.push({ kind });
  }
}

function holdHasStructureKind(hold, kind) {
  return !!(hold.structures && hold.structures.some(s => s.kind === kind));
}
function holdCoreVillageDone(hold) {
  return HOLD_VILLAGE_BUILD_ORDER.every(k => holdHasStructureKind(hold, k));
}
function holdGrowthStageIndex(hold) {
  let stage = 0;
  for (const kind of HOLD_CAPTAIN_BUILD_ORDER) {
    if (holdHasStructureKind(hold, kind)) stage++;
    else break;
  }
  return stage;
}
function seedHoldCaptainQueue(hold) {
  if (!HOLD_CAPTAIN_ENABLED || !hold || !hold.captain) return;
  if (!holdCoreVillageDone(hold) && !hold.learnGauntletDone) return;
  hold.captainQueueSeeded = true;
  hold.buildQueue = hold.buildQueue || [];
  hold.structures = hold.structures || [];
  for (const kind of HOLD_CAPTAIN_BUILD_ORDER) {
    if (!HOLD_STRUCTURE_KINDS[kind]) continue;
    const done = holdHasStructureKind(hold, kind);
    const queued = hold.buildQueue.some(q => q.kind === kind);
    const building = hold.activeBuild && hold.activeBuild.kind === kind;
    if (!done && !queued && !building) hold.buildQueue.push({ kind });
  }
  hold.growthStage = holdGrowthStageIndex(hold);
}

function makeHoldCaptain(hold, saved) {
  const cx = saved && saved.x != null ? +saved.x : hold.x + 18;
  const cy = saved && saved.y != null ? +saved.y : hold.y - 12;
  return {
    holdId: hold.id,
    role: 'hold_captain',
    name: (holdTemplateFor(hold) && holdTemplateFor(hold).captainName) || (hold.name.split(' ')[0] + ' Captain'),
    x: cx, y: cy, r: 14,
    facing: 1, walk: rand(0, 9),
    barkCd: rand(6, 14),
    trainCd: rand(10, 18),
    orderCd: rand(4, 9),
    xp: saved && saved.xp != null ? +saved.xp : 0,
    // 4.1.2 — the captain fights: health pool + baton strike (downed = staggers back up)
    hp: saved && saved.hp != null ? clamp(+saved.hp, 1, HOLD_CAPTAIN_HP) : HOLD_CAPTAIN_HP,
    maxHp: HOLD_CAPTAIN_HP,
    downed: false, downT: 0, hurtT: 0, atkCd: rand(0.4, 1),
  };
}

function spawnHoldCaptain(hold, saved) {
  if (!HOLD_CAPTAIN_ENABLED || !hold || !hold.gauntletDone) return null;
  if (hold.captain) {
    if (saved) {
      hold.captain.x = saved.x != null ? +saved.x : hold.captain.x;
      hold.captain.y = saved.y != null ? +saved.y : hold.captain.y;
      hold.captain.xp = saved.xp != null ? +saved.xp : hold.captain.xp;
    }
    return hold.captain;
  }
  hold.captain = makeHoldCaptain(hold, saved);
  hold.captainLevel = Math.max(1, hold.captainLevel | 0);
  recomputeHoldCaptainLevel(hold);
  addFloater(hold.x, hold.y - 70, 'CAPTAIN TAKES COMMAND', '#ff9d2e', true);
  return hold.captain;
}

function recomputeHoldCaptainLevel(hold) {
  if (!hold) return 0;
  let lvl = hold.gauntletDone ? 1 : 0;
  if (hold.captain) lvl = Math.max(lvl, 1);
  if (hold.learnGauntletDone) lvl = Math.max(lvl, 2);
  if (holdCoreVillageDone(hold)) lvl = Math.max(lvl, 2);
  const sp = hold.orangeSp | 0;
  for (let i = HOLD_CAPTAIN_LEVEL_ORANGE.length - 1; i >= 2; i--) {
    if (sp >= HOLD_CAPTAIN_LEVEL_ORANGE[i]) { lvl = Math.max(lvl, i); break; }
  }
  lvl = Math.max(lvl, 1 + holdGrowthStageIndex(hold));
  hold.captainLevel = clamp(lvl, 0, 5);
  hold.growthStage = holdGrowthStageIndex(hold);
  return hold.captainLevel;
}

function tryStartHoldVillageBuild(hold, L) {
  if (!hold.gauntletDone) return false;
  seedHoldVillageQueue(hold);
  if (HOLD_CAPTAIN_ENABLED && hold.captain && (holdCoreVillageDone(hold) || hold.learnGauntletDone)) {
    seedHoldCaptainQueue(hold);
  }
  if (hold.activeBuild) {
    L.buildSite = hold.activeBuild;
    return true;
  }
  if (!hold.buildQueue.length) return false;
  const next = hold.buildQueue[0];
  // Captain stage-2 kinds require captain present
  if (HOLD_CAPTAIN_BUILD_ORDER.indexOf(next.kind) >= 0) {
    if (!HOLD_CAPTAIN_ENABLED || !hold.captain) return false;
    if (!holdCoreVillageDone(hold) && !hold.learnGauntletDone) return false;
  }
  const def = HOLD_STRUCTURE_KINDS[next.kind];
  if (!def || hold.orangeSp < def.orangeSp) return false;
  const slot = pickHoldStructureSlot(hold, next.kind);
  if (!slot) return false;
  hold.orangeSp -= def.orangeSp;
  hold.buildQueue.shift();
  hold.activeBuild = {
    kind: next.kind,
    x: slot.x, y: slot.y, r: slot.r,
    progress: 0, buildSec: def.buildSec,
  };
  L.buildSite = hold.activeBuild;
  const who = hold.captain ? 'CAPTAIN ORDERS: ' : 'BUILDING ';
  addFloater(slot.x, slot.y - 24, who + def.name.toUpperCase(), '#ff9d2e', false);
  return true;
}

function completeHoldStructure(hold) {
  const b = hold.activeBuild;
  if (!b) return;
  const def = HOLD_STRUCTURE_KINDS[b.kind];
  if (!def) { hold.activeBuild = null; return; }
  hold.structures.push({
    id: 'hs_' + hold.id + '_' + b.kind + '_' + (Math.random() * 1e6 | 0),
    kind: b.kind, x: b.x, y: b.y, r: b.r,
    hp: def.hp, maxHp: def.hp,
  });
  hold.activeBuild = null;
  if (DIRT_BIKE_HOLD_LINKS_ENABLED && b.kind === 'bikeshed' && bike.owned && bike.parkHoldId === hold.id && !bike.mounted) {
    bike.parkX = b.x;
    bike.parkY = b.y;
  }
  spawnParticles(b.x, b.y, 16, '#ff9d2e', 3);
  addFloater(b.x, b.y - 28, def.name.toUpperCase() + ' COMPLETE', '#ff9d2e', true);
  if (HOLD_CAPTAIN_ENABLED) {
    if (hold.captain) {
      hold.captain.xp = (hold.captain.xp | 0) + 1;
      recomputeHoldCaptainLevel(hold);
    }
    if (b.kind === 'brickpad' || holdCoreVillageDone(hold)) {
      spawnHoldCaptain(hold);
      if (hold.captain && !hold.learnGauntletDone && !hold.learnGauntletActive) {
        hold.learnGauntletActive = true;
        hold.learnGauntletWave = 0;
        hold.learnProbeCd = 4;
        addFloater(hold.x, hold.y - 62, 'CAPTAIN DRILL — LEARNING GAUNTLET', '#ff9d2e', true);
      }
      seedHoldCaptainQueue(hold);
    }
    hold.growthStage = holdGrowthStageIndex(hold);
  }
}

function spawnOrangeOrb(x, y, holdId, amtSp) {
  pickups.push({
    x, y, type: 'hold_orb', holdId, amtSp: amtSp || 1, t: 0, holdOnly: true,
  });
}

function tryHoldUnlock(hold) {
  if (!hold || !hold.unlocked) return;
  const directed = HOLD_CAPTAIN_ENABLED && hold.captain;
  if (!hold.unlocked.scout && hold.orangeSp >= HOLD_ORB_UNLOCK.scout) {
    hold.unlocked.scout = true;
    spawnHoldUnit(hold, 'scout', hold.x + rand(-36, 36), hold.y + rand(-10, 24));
    addFloater(hold.x, hold.y - 52,
      directed ? 'CAPTAIN TRAINS ORANGE SCOUT' : 'ORANGE SCOUT UNLOCKED', '#ff9d2e', false);
  }
  if (!hold.unlocked.sentinel && hold.orangeSp >= HOLD_ORB_UNLOCK.sentinel) {
    hold.unlocked.sentinel = true;
    spawnHoldUnit(hold, 'sentinel', hold.x + rand(-32, 32), hold.y + rand(-8, 20));
    addFloater(hold.x, hold.y - 52,
      directed ? 'CAPTAIN TRAINS ORANGE SENTINEL' : 'ORANGE SENTINEL UNLOCKED', '#ff9d2e', false);
  }
  if (!hold.unlocked.warden && hold.orangeSp >= HOLD_ORB_UNLOCK.warden) {
    hold.unlocked.warden = true;
    spawnHoldUnit(hold, 'warden', hold.x + rand(-28, 28), hold.y + rand(-6, 18));
    addFloater(hold.x, hold.y - 52,
      directed ? 'CAPTAIN TRAINS ORANGE WARDEN' : 'ORANGE WARDEN UNLOCKED', '#ff9d2e', false);
  }
}

function tryHoldCaptainTrain(hold) {
  if (!HOLD_CAPTAIN_ENABLED || !hold || !hold.captain || (hold.captainLevel | 0) < 2) return false;
  const order = ['rover', 'scout', 'sentinel', 'warden'];
  for (const type of order) {
    if (!hold.unlocked[type] && type !== 'rover') continue;
    if (type !== 'rover' && hold.orangeSp < HOLD_ORB_UNLOCK[type]) continue;
    const cap = holdUnitCapFor(hold, type);
    if (countHoldUnitsOfType(hold, type) >= cap) continue;
    const cost = HOLD_CAPTAIN_TRAIN_COST[type] || 8;
    if (hold.orangeSp < cost) continue;
    // Prefer reinforcing when at least one already exists (captain spends for bigger village)
    if (countHoldUnitsOfType(hold, type) < 1) continue;
    hold.orangeSp -= cost;
    const u = spawnHoldUnit(hold, type, hold.x + rand(-40, 40), hold.y + rand(-14, 26));
    if (u) {
      addFloater(hold.x, hold.y - 56, 'CAPTAIN REINFORCES ' + COMP_TYPES[type].name.toUpperCase(), '#ff9d2e', false);
      hold.captain.xp = (hold.captain.xp | 0) + 1;
      recomputeHoldCaptainLevel(hold);
      return true;
    }
    hold.orangeSp += cost; // refund if spawn failed
  }
  return false;
}

function tickHoldLearnGauntlet(hold, dt) {
  if (!HOLD_CAPTAIN_ENABLED || !hold.captain || hold.learnGauntletDone) return;
  if (!holdCoreVillageDone(hold) && !hold.learnGauntletActive) return;
  if (!hold.learnGauntletActive) {
    hold.learnGauntletActive = true;
    hold.learnGauntletWave = 0;
    hold.learnProbeCd = 3;
  }
  hold.learnProbeCd = (hold.learnProbeCd || 0) - dt;
  if (hold.learnProbeCd <= 0 && hold.learnGauntletWave < HOLD_LEARN_GAUNTLET_WAVES) {
    spawnHoldProbeWave(hold);
    hold.learnGauntletWave++;
    hold.learnProbeCd = 18;
    addFloater(hold.x, hold.y - 66, 'CAPTAIN DRILL ' + hold.learnGauntletWave + '/' + HOLD_LEARN_GAUNTLET_WAVES, '#ff8a93', false);
  }
  let liveProbes = 0; // 4.1.1 perf — was holdProbes.filter().length every frame
  for (const p of holdProbes) { if (p.holdId === hold.id && !p.dead) liveProbes++; }
  if (hold.learnGauntletWave >= HOLD_LEARN_GAUNTLET_WAVES && liveProbes === 0) {
    hold.learnGauntletDone = true;
    hold.learnGauntletActive = false;
    if (hold.captain) hold.captain.xp = (hold.captain.xp | 0) + 2;
    recomputeHoldCaptainLevel(hold);
    seedHoldCaptainQueue(hold);
    addFloater(hold.x, hold.y - 58, hold.name + ' CAPTAIN LEVEL ' + hold.captainLevel, '#ff9d2e', true);
  }
}

function updateHoldCaptain(hold, dt) {
  if (!HOLD_CAPTAIN_ENABLED || !hold.captain || !isHoldVisible(hold)) return;
  const c = hold.captain;
  // 4.1.2 — downed captain staggers back up at the brick pad after a breather
  if (c.downed) {
    c.downT = (c.downT || HOLD_CAPTAIN_DOWN_T) - dt;
    if (c.downT <= 0) {
      c.downed = false;
      c.hp = Math.ceil((c.maxHp || HOLD_CAPTAIN_HP) * 0.6);
      c.x = hold.x + rand(-14, 14); c.y = hold.y + rand(-8, 8);
      addFloater(c.x, c.y - 32, c.name.toUpperCase() + ' BACK ON THEIR FEET', '#ff9d2e', true);
      spawnParticles(c.x, c.y, 12, '#ff9d2e', 3);
    }
    return;
  }
  c.hurtT = Math.max(0, (c.hurtT || 0) - dt);
  c.atkCd = (c.atkCd || 0) - dt;
  c.walk += dt * 1.4;
  c.barkCd = (c.barkCd || 0) - dt;
  c.trainCd = (c.trainCd || 0) - dt;
  c.orderCd = (c.orderCd || 0) - dt;
  if (c.swipeT > 0) c.swipeT = Math.max(0, c.swipeT - dt);
  // 4.1.2 — the captain FIGHTS: nearest leashed threat takes priority over the
  // build site; baton strikes + an engage bark.
  let foe = null, fd2 = Infinity;
  if (HOLD_COMBAT_ENABLED && hold._threats && hold._threats.length) {
    for (const e of hold._threats) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, hold.x, hold.y) > (HOLD_LEASH_R + 60) ** 2) continue;
      const d2 = dist2(e.x, e.y, c.x, c.y);
      if (d2 < fd2) { fd2 = d2; foe = e; }
    }
  }
  if (foe && c._foeRef !== foe) {
    c._foeRef = foe;
    addFloater(c.x, c.y - 38, randFrom([
      'TO ARMS! NOTHING TOUCHES MY VILLAGE!',
      'ORANGE SQUAD — ON ME!',
      'YOU PICKED THE WRONG HOLD!',
    ]), '#ff9d2e', true);
  } else if (!foe) c._foeRef = null;
  // 4.1.1 — the captain WORKS the active build site (hustles over, hammers alongside
  // the builders, and physically speeds the build) instead of only pacing the center.
  const site = hold.activeBuild;
  let tx, ty, spd;
  if (foe) {
    tx = foe.x; ty = foe.y; spd = 96;
  } else if (site) {
    tx = site.x + 26; ty = site.y + 12; spd = 74;
  } else if (HOLD_COMBAT_ENABLED && (hold.alertT || 0) > 0 && hold.alertX != null) {
    tx = hold.alertX; ty = hold.alertY; spd = 88; // answer the alarm
  } else {
    const ang = c.walk * 0.35; // gentle patrol near brick pad / center (pre-4.1.1 behavior)
    tx = hold.x + Math.cos(ang) * 28;
    ty = hold.y + Math.sin(ang) * 18 - 8;
    spd = 38;
  }
  // leash the captain like the units — never off into the wilds / legacy core
  if (dist2(c.x, c.y, hold.x, hold.y) > HOLD_LEASH_R * HOLD_LEASH_R) { tx = hold.x; ty = hold.y; spd = 96; }
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy) || 1;
  if (d > 6) {
    c.x += dx / d * spd * dt;
    c.y += dy / d * spd * dt;
    if (Math.abs(dx) > 2) c.facing = dx >= 0 ? 1 : -1;
  }
  if (foe) {
    const reach = c.r + (foe.r || 14) + 12;
    if (c.atkCd <= 0 && fd2 < reach * reach) {
      c.atkCd = HOLD_CAPTAIN_ATK_CD;
      c.swipeT = UNIT_SWIPE;
      c.facing = foe.x >= c.x ? 1 : -1;
      const fd = Math.sqrt(fd2) || 1;
      directDamage(foe, HOLD_CAPTAIN_DMG, (foe.x - c.x) / fd, (foe.y - c.y) / fd, 120);
      spawnParticles(foe.x, foe.y - 10, 5, '#ff9d2e', 2.5);
    }
  } else if (site && d < 34) {
    if (c.swipeT <= 0) c.swipeT = UNIT_SWIPE; // rhythmic hammer swings
    c.facing = site.x >= c.x ? 1 : -1;
    site.progress += dt * 0.5; // captain's labor visibly speeds the raise
    if (Math.random() < dt * 5) spawnParticles(site.x + rand(-12, 12), site.y - 10, 1, '#ffb45a', 2);
    if (site.progress >= site.buildSec) completeHoldStructure(hold);
  }
  c.lvlCd = (c.lvlCd || 0) - dt; // 4.1.1 perf — level recompute throttled (was every frame)
  if (c.lvlCd <= 0) { c.lvlCd = 1.5; recomputeHoldCaptainLevel(hold); }
  tickHoldLearnGauntlet(hold, dt);
  if (c.trainCd <= 0) {
    c.trainCd = 16;
    tryHoldCaptainTrain(hold);
  }
  if (c.orderCd <= 0) {
    c.orderCd = 11;
    if (holdCoreVillageDone(hold) || hold.learnGauntletDone) seedHoldCaptainQueue(hold);
    if (hold.activeBuild) {
      // 4.1.1 — structure-specific rally cry so construction is unmissable
      addFloater(c.x, c.y - 36, HOLD_BUILD_RALLY[hold.activeBuild.kind] ||
        ('BUILDERS — ' + ((HOLD_STRUCTURE_KINDS[hold.activeBuild.kind] && HOLD_STRUCTURE_KINDS[hold.activeBuild.kind].name) || 'SITE')), '#ff9d2e', false);
    } else if (hold.buildQueue && hold.buildQueue.length) {
      const nk = hold.buildQueue[0].kind;
      addFloater(c.x, c.y - 36, 'NEXT: ' + ((HOLD_STRUCTURE_KINDS[nk] && HOLD_STRUCTURE_KINDS[nk].name) || nk).toUpperCase(), '#ff9d2e', false);
    } else if (c.barkCd <= 0) {
      c.barkCd = 20;
      const barks = [
        'Chop the east stand — feed the orange pool.',
        'Open that mine. Depot needs ore.',
        'Hold the line. I grow this village like you grow Emberfall.',
        'Scout the perimeter. No greenhorns at my gate.',
      ];
      addFloater(c.x, c.y - 36, randFrom(barks), '#ffb46a', false);
    }
  }
}

function spawnHoldProbe(hold) {
  const ang = rand(0, TAU);
  const d = hold.halfW + hold.halfH + rand(40, 90);
  const x = hold.x + Math.cos(ang) * d;
  const y = hold.y + Math.sin(ang) * d;
  if (inLegacyWorld(x, y)) return;
  holdProbes.push({
    holdId: hold.id,
    type: 'husk', x, y, r: 14, vx: 0, vy: 0,
    hp: 16, maxHp: 16, spd: 48, dmg: 5, atkCd: rand(0.6, 1.2),
    flash: 0, dead: false, walk: rand(0, 9), facing: 1, spawnT: 0.35,
  });
}

function spawnHoldProbeWave(hold) {
  const n = hold.defenseTier === 'far' ? 3 : 2;
  for (let i = 0; i < n; i++) spawnHoldProbe(hold);
  addFloater(hold.x, hold.y - 64, 'RIFT PROBE — ' + hold.name, '#ff8a93', false);
}

function killHoldProbe(e) {
  e.dead = true;
  const hold = holdById(e.holdId);
  spawnParticles(e.x, e.y, 10, '#7a8f5a', 2);
  spawnOrangeOrb(e.x + rand(-10, 10), e.y + rand(-10, 10), e.holdId, 1);
  if (hold && Math.random() < 0.45) spawnOrangeOrb(hold.x + rand(-50, 50), hold.y + rand(-30, 30), hold.id, 1);
}

// ---------- 4.1.2 hold combat — threats, alerts, fighting captain ----------
/** Per-frame: bucket live enemies near each fog-known hold (hold._threats) and stamp
 * e._nearHoldId so exterior enemies can brawl with hold defenders. Runs once per
 * update; cost ≈ liveEnemies × holds dist2 (legacy waves barely notice). */
function computeHoldThreats() {
  if (!HOLD_COMBAT_ENABLED || !HOLD_AUTONOMY_ENABLED) return;
  for (const h of npcHolds) {
    h._vis = isHoldVisible(h);
    if (h._threats) h._threats.length = 0; else h._threats = [];
  }
  for (const e of enemies) {
    e._nearHoldId = null;
    if (e.dead || e.spawnT > 0.2 || (e.emergeT || 0) > 0) continue;
    for (const h of npcHolds) {
      if (!h._vis) continue;
      const reach = holdZoneRadius(h) + HOLD_AGGRO_R;
      if (dist2(e.x, e.y, h.x, h.y) < reach * reach) {
        h._threats.push(e);
        e._nearHoldId = h.id;
      }
    }
  }
}
function holdRaiseAlert(hold, x, y) {
  if (!hold || !HOLD_COMBAT_ENABLED) return;
  hold.alertT = HOLD_ALERT_T;
  hold.alertX = x; hold.alertY = y;
}
function hurtHoldCaptain(hold, dmg) {
  const c = hold && hold.captain;
  if (!c || c.downed || (c.hurtT || 0) > 0) return;
  c.hp = (c.hp != null ? c.hp : HOLD_CAPTAIN_HP) - dmg;
  c.hurtT = 0.6;
  holdRaiseAlert(hold, c.x, c.y);
  spawnParticles(c.x, c.y - 12, 6, '#ff9d2e', 2);
  if (c.hp <= 0) {
    c.hp = 0;
    c.downed = true;
    c.downT = HOLD_CAPTAIN_DOWN_T;
    addFloater(c.x, c.y - 30, hold.name.toUpperCase() + ' CAPTAIN DOWN', '#ff8a93', true);
  }
}

function hurtHoldUnit(u, dmg) {
  if (u.downed || u.hurtT > 0) return;
  u.hp -= dmg;
  u.hurtT = 0.65;
  holdRaiseAlert(holdById(u.holdId), u.x, u.y); // 4.1.2 — the hold answers back
  spawnParticles(u.x, u.y - 10, 5, '#ff9d2e', 2);
  if (u.hp <= 0) {
    u.hp = 0;
    u.downed = true;
    addFloater(u.x, u.y - 28, 'ORANGE ' + COMP_TYPES[u.type].name.toUpperCase() + ' DOWN', '#ff8a93', false);
  }
}

function holdUnitDamage(u) { return compDamage(u) * 0.9; }
function holdUnitInterval(u) { return compInterval(u); }

function updateHoldUnits(dt) {
  for (const u of holdUnits) {
    if (u.downed) continue;
    const hold = holdById(u.holdId);
    if (!hold || !isHoldVisible(hold)) continue;
    u.hurtT = Math.max(0, u.hurtT - dt);
    if (u.swipeT > 0) u.swipeT = Math.max(0, u.swipeT - dt);
    u.atkCd -= dt;
    const t = COMP_TYPES[u.type];
    const patrolR = hold.halfW + hold.halfH + 50;
    // 4.1.2 — REAL enemies first (Burstweavers, wave leakers, anything hostile in the
    // hold's aggro ring), leashed to the hold; gauntlet probes remain the fallback foe.
    let foe = null, fd2 = Infinity, foeIsEnemy = false;
    if (HOLD_COMBAT_ENABLED && hold._threats && hold._threats.length) {
      for (const e of hold._threats) {
        if (e.dead) continue;
        if (dist2(e.x, e.y, hold.x, hold.y) > (HOLD_LEASH_R + 60) ** 2) continue;
        const d2 = dist2(e.x, e.y, u.x, u.y);
        if (d2 < fd2) { fd2 = d2; foe = e; foeIsEnemy = true; }
      }
    }
    if (!foe) {
      fd2 = 420 * 420;
      for (const e of holdProbes) {
        if (e.dead || e.holdId !== u.holdId || e.spawnT > 0.2) continue;
        const d2 = dist2(e.x, e.y, u.x, u.y);
        if (d2 < fd2) { fd2 = d2; foe = e; }
      }
    }
    // engage cue — one bark per acquired target so fights read at a glance
    if (foeIsEnemy && u._foeRef !== foe) {
      u._foeRef = foe;
      if (Math.random() < 0.5) addFloater(u.x, u.y - 26, '⚔ ' + COMP_TYPES[u.type].name.toUpperCase() + ' ENGAGES', '#ff9d2e', false);
    } else if (!foe) u._foeRef = null;
    // default goal: rovers + scouts amble the perimeter (visible life even in peace);
    // sentinels/wardens hold their posts
    let gx, gy;
    if (HOLD_COMBAT_ENABLED && (u.type === 'rover' || u.type === 'scout')) {
      u.patrolA = (u.patrolA == null ? u.uid.length * 0.7 : u.patrolA) + dt * 0.22;
      gx = hold.x + Math.cos(u.patrolA) * patrolR * 0.66;
      gy = hold.y + Math.sin(u.patrolA) * patrolR * 0.5;
    } else {
      gx = hold.x + Math.cos(u.uid.length * 0.17) * patrolR * 0.55;
      gy = hold.y + Math.sin(u.uid.length * 0.23) * patrolR * 0.45;
    }
    // alert: something at the hold took a hit — converge on the spot
    if (!foe && HOLD_COMBAT_ENABLED && (hold.alertT || 0) > 0 && hold.alertX != null) {
      gx = hold.alertX; gy = hold.alertY;
    }
    if (foe) {
      if (u.type === 'rover') { gx = foe.x; gy = foe.y; }
      else {
        const fd = Math.sqrt(fd2) || 1;
        const holdDist = t.range * 0.55;
        if (fd < holdDist * 0.7) { gx = u.x - (foe.x - u.x) / fd * 50; gy = u.y - (foe.y - u.y) / fd * 50; }
        else if (fd > holdDist) { gx = foe.x; gy = foe.y; }
        else { gx = u.x; gy = u.y; }
      }
    }
    // leash — never wander past HOLD_LEASH_R (and so never into the legacy core)
    if (dist2(u.x, u.y, hold.x, hold.y) > HOLD_LEASH_R * HOLD_LEASH_R) { gx = hold.x; gy = hold.y; }
    const dx = gx - u.x, dy = gy - u.y, gd = Math.hypot(dx, dy);
    if (gd > 20) { u.vx = lerp(u.vx, dx / gd * t.spd * 0.92, dt * 4.5); u.vy = lerp(u.vy, dy / gd * t.spd * 0.92, dt * 4.5); }
    else { u.vx *= 0.82; u.vy *= 0.82; }
    u.x = clamp(u.x + u.vx * dt, u.r, WORLD.w - u.r);
    u.y = clamp(u.y + u.vy * dt, u.r, WORLD.h - u.r);
    collideObstacles(u);
    u.walk += dt * Math.hypot(u.vx, u.vy) * 0.045;
    if (Math.abs(u.vx) > 4) u.facing = u.vx >= 0 ? 1 : -1;
    if (foe) {
      u.aim = Math.atan2(foe.y - u.y, foe.x - u.x);
      u.facing = Math.cos(u.aim) >= 0 ? 1 : -1;
      if (u.type === 'rover') {
        const reach = u.r + foe.r + 12;
        if (u.atkCd <= 0 && fd2 < reach * reach) {
          u.atkCd = holdUnitInterval(u);
          u.swipeT = UNIT_SWIPE;
          const d = Math.sqrt(fd2) || 1;
          if (foeIsEnemy) {
            directDamage(foe, holdUnitDamage(u), (foe.x - u.x) / d, (foe.y - u.y) / d, 90);
          } else {
            foe.hp -= holdUnitDamage(u);
            foe.flash = 0.12;
            if (foe.hp <= 0 && !foe.dead) killHoldProbe(foe);
          }
          spawnParticles(foe.x, foe.y, 4, '#ff9d2e', 2);
        }
      } else if (u.atkCd <= 0 && fd2 < t.range * t.range) {
        u.atkCd = holdUnitInterval(u);
        u.swipeT = UNIT_SWIPE * 0.65;
        const a = u.aim + rand(-0.05, 0.05);
        cbolts.push({
          x: u.x + Math.cos(a) * 16, y: u.y - 12 + Math.sin(a) * 16,
          vx: Math.cos(a) * 640, vy: Math.sin(a) * 640,
          life: 0.9, r: 3, dmg: holdUnitDamage(u), pierce: 1, hit: [], scout: false,
          holdProbeOnly: true, holdId: u.holdId, orange: true,
        });
      }
    }
  }
}

function updateHoldProbes(dt) {
  for (const e of holdProbes) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    e.atkCd -= dt;
    const hold = holdById(e.holdId);
    if (!hold) { e.dead = true; continue; }
    let tgt = hold;
    let tx = hold.x, ty = hold.y, tr = Math.min(hold.halfW, hold.halfH);
    for (const u of holdUnits) {
      if (u.holdId !== e.holdId || u.downed) continue;
      const d2 = dist2(e.x, e.y, u.x, u.y);
      if (d2 < 200 * 200) { tx = u.x; ty = u.y; tr = u.r; break; }
    }
    for (const L of holdLaborers) {
      if (L.holdId !== e.holdId || L.downed) continue;
      const d2 = dist2(e.x, e.y, L.x, L.y);
      if (d2 < 180 * 180) { tx = L.x; ty = L.y; tr = L.r; break; }
    }
    for (const d of (hold.defenses || [])) {
      if (d.hp <= 0) continue;
      const d2 = dist2(e.x, e.y, d.x, d.y);
      if (d2 < 160 * 160) { tx = d.x; ty = d.y; tr = d.r; break; }
    }
    const ex = tx - e.x, ey = ty - e.y;
    const dist = Math.hypot(ex, ey) || 1;
    e.vx = lerp(e.vx, ex / dist * e.spd, dt * 3);
    e.vy = lerp(e.vy, ey / dist * e.spd, dt * 3);
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.walk += dt * 3;
    if (Math.abs(e.vx) > 2) e.facing = e.vx >= 0 ? 1 : -1;
    if (e.atkCd <= 0 && dist < tr + e.r + 8) {
      e.atkCd = 0.85;
      for (const u of holdUnits) {
        if (u.holdId === e.holdId && !u.downed && dist2(e.x, e.y, u.x, u.y) < (e.r + u.r + 10) ** 2) {
          hurtHoldUnit(u, e.dmg); break;
        }
      }
      for (const L of holdLaborers) {
        if (L.holdId === e.holdId && !L.downed && dist2(e.x, e.y, L.x, L.y) < (e.r + L.r + 10) ** 2) {
          hurtHoldLaborer(L, e.dmg); break;
        }
      }
      for (const d of (hold.defenses || [])) {
        if (d.hp <= 0) continue;
        if (dist2(e.x, e.y, d.x, d.y) < (e.r + d.r + 6) ** 2) {
          d.hp -= e.dmg * 0.8;
          spawnParticles(d.x, d.y, 3, '#c8a06a', 2);
          break;
        }
      }
    }
  }
  // 4.1.1 perf — only compact when something actually died (was a fresh array every frame)
  let anyDead = false;
  for (const e of holdProbes) { if (e.dead) { anyDead = true; break; } }
  if (anyDead) holdProbes = holdProbes.filter(e => !e.dead);
}

/** 4.1.1 — single graduation path (gauntlet clear, timeout, or age auto-graduate). */
function graduateHold(hold, label) {
  if (hold.gauntletDone) return;
  hold.gauntletDone = true;
  hold.gauntletActive = false;
  seedHoldVillageQueue(hold);
  spawnHoldCaptain(hold);
  if (isHoldVisible(hold)) addFloater(hold.x, hold.y - 58, hold.name + ' ' + (label || 'GRADUATED'), '#ff9d2e', true);
}

function tickHoldGauntlet(hold, dt) {
  if (!HOLD_AUTONOMY_ENABLED || hold.gauntletDone || !isHoldVisible(hold)) return;
  if (!hold.gauntletActive) {
    hold.gauntletActive = true;
    hold.gauntletT = 0;
    hold.probeCd = 3;
  }
  hold.gauntletT += dt;
  hold.probeCd -= dt;
  if (hold.probeCd <= 0 && hold.gauntletWave < HOLD_GAUNTLET_WAVES) {
    spawnHoldProbeWave(hold);
    hold.gauntletWave++;
    hold.probeCd = 24;
  }
  let liveProbes = 0; // 4.1.1 perf — was holdProbes.filter().length every frame
  for (const p of holdProbes) { if (p.holdId === hold.id && !p.dead) liveProbes++; }
  if (hold.gauntletWave >= HOLD_GAUNTLET_WAVES && liveProbes === 0) {
    graduateHold(hold, 'GRADUATED');
  }
  if (hold.gauntletT >= HOLD_GAUNTLET_MAX_SEC &&
      (holdUnits.some(u => u.holdId === hold.id && !u.downed) ||
       holdLaborers.some(L => L.holdId === hold.id && !L.downed))) {
    graduateHold(hold, 'HOLDS');
  }
}

/** 4.1.1 — ambient orange orb income. Moved OUT of tickHoldGauntlet: that function
 * early-returns once gauntletDone, so graduated villages received ZERO ambient
 * orangeSp (the `42s post-grad cadence` was dead code) — the visible reason
 * captains "never built anything" after graduation. */
function tickHoldOrbSpawner(hold, dt) {
  hold.orbSpawnT = (hold.orbSpawnT || 0) - dt;
  if (hold.orbSpawnT <= 0) {
    hold.orbSpawnT = hold.gauntletDone ? HOLD_ORB_CADENCE_POST : HOLD_ORB_CADENCE_PRE;
    spawnOrangeOrb(hold.x + rand(-hold.halfW, hold.halfW), hold.y + rand(-hold.halfH, hold.halfH), hold.id, 1);
  }
}

/** 4.1.1 — villages live their own lives (runs for ALL holds, seen or not):
 * age-based auto-graduation, an offline orangeSp trickle for undiscovered holds
 * (so first contact shows a village already flush enough to build), and builder
 * top-up (fields the 2nd post-graduation builder / replaces downed ones). */
function tickHoldAgeAndOffline(hold, dt) {
  hold.ageT = (hold.ageT || 0) + dt;
  if (!hold.gauntletDone && hold.ageT >= HOLD_AUTO_GRADUATE_SEC) graduateHold(hold, 'STANDS ON ITS OWN');
  if (hold.gauntletDone && !isHoldVisible(hold)) {
    hold.offlineSpT = (hold.offlineSpT || 0) + dt;
    while (hold.offlineSpT >= HOLD_OFFLINE_SP_INTERVAL) {
      hold.offlineSpT -= HOLD_OFFLINE_SP_INTERVAL;
      hold.orangeSp = (hold.orangeSp | 0) + 1;
    }
  }
  hold.laborerTopupT = (hold.laborerTopupT || 0) - dt;
  if (hold.laborerTopupT <= 0) {
    hold.laborerTopupT = 6;
    spawnHoldLaborer(hold, hold.x + rand(-16, 16), hold.y + rand(-8, 12));
  }
}

function updateHoldLaborers(dt) {
  const LABORER_SPD = 195;
  for (const L of holdLaborers) {
    if (L.downed) continue;
    const hold = holdById(L.holdId);
    if (!hold || !isHoldVisible(hold)) continue;
    L.hurtT = Math.max(0, L.hurtT - dt);
    if (L.swipeT > 0) L.swipeT = Math.max(0, L.swipeT - dt);
    L.buildT = Math.max(0, L.buildT - dt);

    // Step 7.2 / 8.1 — WC2 inside-mine work then exit with gold/coal → hold deposit
    if (L.insideMine && L.target) {
      L.task = 'mining';
      L.mineT = (L.mineT || 0) - dt;
      L.vx = 0; L.vy = 0;
      if (L.mineT <= 0) {
        if (L.target.resource === 'coal') {
          if (L.target.coalLeft > 0) {
            L.target.coalLeft--;
            L.carry = { type: 'coal', amt: 1 };
            L.target.occupied = Math.max(0, (L.target.occupied || 1) - 1);
            spawnParticles(L.target.x, L.target.y - 8, 5, '#8a8a8a', 2);
          }
        } else if (L.target.goldLeft > 0) {
          L.target.goldLeft--;
          L.carry = { type: 'gold', amt: 1 };
          L.target.occupied = Math.max(0, (L.target.occupied || 1) - 1);
          spawnParticles(L.target.x, L.target.y - 8, 5, '#ff9d2e', 2);
        }
        L.insideMine = false;
        L.task = 'deposit';
        L.target = null;
      }
      continue;
    }

    const zoneR2 = (holdZoneRadius(hold) + 80) ** 2;

    let damagedDef = null, dd2 = Infinity;
    for (const d of (hold.defenses || [])) {
      if (d.hp <= 0 || d.hp >= d.maxHp * 0.9) continue;
      const d2 = dist2(L.x, L.y, d.x, d.y);
      if (d2 < dd2) { dd2 = d2; damagedDef = d; }
    }

    let nearestOrb = null, od2 = Infinity;
    for (const p of pickups) {
      if (!isHoldOrbPickup(p) || p.got || p.holdId !== L.holdId) continue;
      const d2 = dist2(L.x, L.y, p.x, p.y);
      if (d2 < zoneR2 && d2 < od2) { od2 = d2; nearestOrb = p; }
    }

    let gx = hold.x + Math.cos(L.id.length * 0.31) * 28;
    let gy = hold.y + Math.sin(L.id.length * 0.27) * 22;
    L.task = 'idle';

    // Step 7.1/7.2/8.1 — deposit exterior wood/gold/coal before other chores
    if (L.carry && (L.carry.type === 'wood' || L.carry.type === 'gold' || L.carry.type === 'coal')) {
      L.task = 'deposit';
      L.targetDef = null;
      L.buildSite = null;
      gx = hold.x; gy = hold.y;
      if (dist2(L.x, L.y, gx, gy) < 36 * 36) {
        const amt = L.carry.amt | 0;
        if (L.carry.type === 'wood') {
          creditHoldWoodDeposit(hold, amt);
          addFloater(hold.x, hold.y - 28, '+✧' + amt, '#ff9d2e', false);
        } else if (L.carry.type === 'gold') {
          creditHoldGoldDeposit(hold, amt);
          addFloater(hold.x, hold.y - 28, '+✧' + amt, '#ff9d2e', false);
        } else {
          creditHoldCoalDeposit(hold, amt);
          addFloater(hold.x, hold.y - 28, '+⬤' + amt + ' COAL', '#a0a0a0', false);
        }
        L.carry = null;
        L.target = null;
        L.task = 'idle';
      }
    } else if (L.gatherT > 0 && L.targetDef && L.targetDef.hp > 0) {
      L.task = 'repair';
      gx = L.targetDef.x;
      gy = L.targetDef.y;
      if (dist2(L.x, L.y, gx, gy) < 32 * 32) {
        L.vx *= 0.65; L.vy *= 0.65;
        L.gatherT = Math.max(L.gatherT, 0.28);
        L.swipeT = UNIT_SWIPE * 0.5;
        L.targetDef.hp = Math.min(L.targetDef.maxHp, L.targetDef.hp + 34 * dt);
        if (L.targetDef.hp >= L.targetDef.maxHp * 0.98) L.targetDef = null;
      }
    } else if (nearestOrb && (!damagedDef || od2 < dd2 * 0.55)) {
      L.task = 'fetch_orb';
      L.targetDef = null;
      L.target = null;
      gx = nearestOrb.x; gy = nearestOrb.y;
    } else if (damagedDef) {
      L.task = 'repair';
      L.targetDef = damagedDef;
      L.buildSite = null;
      L.target = null;
      gx = damagedDef.x; gy = damagedDef.y;
      if (dist2(L.x, L.y, gx, gy) < 30 * 30) L.gatherT = 0.32;
    } else if (hold.gauntletDone && (hold.activeBuild || (hold.buildQueue && hold.buildQueue.length))) {
      if (!hold.activeBuild) tryStartHoldVillageBuild(hold, L);
      if (hold.activeBuild) {
        L.task = 'build';
        L.targetDef = null;
        L.target = null;
        L.buildSite = hold.activeBuild;
        gx = hold.activeBuild.x; gy = hold.activeBuild.y;
        if (dist2(L.x, L.y, gx, gy) < 34 * 34) {
          L.vx *= 0.6; L.vy *= 0.6;
          L.gatherT = Math.max(L.gatherT, 0.32);
          L.swipeT = UNIT_SWIPE * 0.55;
          hold.activeBuild.progress += dt;
          if (hold.activeBuild.progress >= hold.activeBuild.buildSec) {
            completeHoldStructure(hold);
            L.buildSite = null;
            L.buildT = 1.2;
          }
        }
      }
    } else if (L.buildT <= 0 && !hold.gauntletDone && hold.orangeSp >= HOLD_BUILD_ORB_COST) {
      const slot = pickHoldDefenseSlot(hold);
      if (slot) {
        L.task = 'build';
        L.buildT = 3.2;
        hold.orangeSp -= HOLD_BUILD_ORB_COST;
        hold.defenses.push({
          x: slot.x, y: slot.y, r: 22, hp: 55, maxHp: hold.defenseTier === 'far' ? 150 : 120,
        });
        gx = slot.x; gy = slot.y;
        L.gatherT = 0.45;
        L.swipeT = UNIT_SWIPE * 0.55;
        addFloater(slot.x, slot.y - 24, 'ORANGE BARRICADE', '#ff9d2e', false);
      }
    } else if (EXTERIOR_MINE_ENABLED || EXTERIOR_CHOP_ENABLED || EXTERIOR_COAL_ENABLED) {
      // Idle → nearest exterior coal/gold mine or stand/tree; WORLD clamp allows leaving legacy
      const keepMine = L.target && L.target.exterior && mineHasStock(L.target) && L.target.type !== 'tree';
      const keepTree = !keepMine && L.target && L.target.type === 'tree' && L.target.exterior && L.target.woodLeft > 0;
      // 4.1.1 perf — pickHold*Target scans; rescan on a cooldown.
      let mine = keepMine ? L.target : null;
      let tree = keepTree ? L.target : null;
      if (!mine && !tree) {
        L.scanCd = (L.scanCd || 0) - dt;
        if (L.scanCd <= 0) {
          const goldM = EXTERIOR_MINE_ENABLED ? pickHoldMineTarget(L, hold) : null;
          const coalM = EXTERIOR_COAL_ENABLED ? pickHoldCoalTarget(L, hold) : null;
          if (goldM && coalM) {
            mine = dist2(L.x, L.y, goldM.x, goldM.y) <= dist2(L.x, L.y, coalM.x, coalM.y) ? goldM : coalM;
          } else {
            mine = goldM || coalM;
          }
          if (!mine) tree = EXTERIOR_CHOP_ENABLED ? pickHoldChopTarget(L, hold) : null;
          if (!mine && !tree) L.scanCd = 1.35; // nothing in range — don't rescan every frame
        }
      }
      if (mine) {
        L.task = 'enterMine';
        L.target = mine;
        L.res = mine.resource === 'coal' ? 'coal' : 'gold';
        L.targetDef = null;
        L.buildSite = null;
        gx = mine.x; gy = mine.y;
        const reach = (mine.r || 28) + L.r + 6;
        if (dist2(L.x, L.y, gx, gy) < reach * reach) {
          L.vx *= 0.5; L.vy *= 0.5;
          L.insideMine = true;
          L.mineT = 2.2;
          mine.occupied = (mine.occupied || 0) + 1;
          L.task = 'mining';
          sfx.play('mine');
        }
      } else if (tree) {
        L.task = 'gather';
        L.target = tree;
        L.res = 'wood';
        L.targetDef = null;
        L.buildSite = null;
        gx = tree.x; gy = tree.y;
        const reach = (tree.r || 14) + L.r + 6;
        if (dist2(L.x, L.y, gx, gy) < reach * reach) {
          L.vx *= 0.5; L.vy *= 0.5;
          if (L.gatherT <= 0) {
            L.gatherT = 1.15;
            L.swipeT = UNIT_SWIPE * 0.5;
            sfx.play('chop');
            tree.woodLeft--;
            L.carry = { type: 'wood', amt: 1 };
            spawnParticles(tree.x, tree.y - 10, 3, '#ff9d2e', 2);
          }
        }
      }
    }

    const dx = gx - L.x, dy = gy - L.y, gd = Math.hypot(dx, dy);
    if (gd > 18) {
      L.vx = lerp(L.vx, dx / gd * LABORER_SPD, dt * 4.2);
      L.vy = lerp(L.vy, dy / gd * LABORER_SPD, dt * 4.2);
    } else { L.vx *= 0.78; L.vy *= 0.78; }
    L.x = clamp(L.x + L.vx * dt, L.r, WORLD.w - L.r);
    L.y = clamp(L.y + L.vy * dt, L.r, WORLD.h - L.r);
    collideObstacles(L);
    // 4.1.1 FREEZE FIX — unreachable-target release: a builder wedged against rocks/
    // walls en route to a mine or tree used to shove at it forever (endless retarget
    // churn). If it makes no headway for a few seconds, drop the target and cool down.
    if ((L.task === 'enterMine' || L.task === 'gather') && L.target && gd > 60 &&
        (L.vx * L.vx + L.vy * L.vy) < 22 * 22) {
      L.stuckT = (L.stuckT || 0) + dt;
      if (L.stuckT > 3.5) {
        L.stuckT = 0;
        L.target = null;
        L.task = 'idle';
        L.scanCd = 2.5;
      }
    } else {
      L.stuckT = 0;
    }
    L.walk += dt * Math.hypot(L.vx, L.vy) * 0.042;
    if (Math.abs(L.vx) > 3) L.facing = L.vx >= 0 ? 1 : -1;
    if (L.gatherT > 0) L.gatherT = Math.max(0, L.gatherT - dt);
  }
}

function hurtHoldLaborer(L, dmg) {
  if (L.downed || L.insideMine || L.hurtT > 0) return;
  L.hp -= dmg;
  L.hurtT = 0.65;
  holdRaiseAlert(holdById(L.holdId), L.x, L.y); // 4.1.2 — defenders answer a builder scream
  spawnParticles(L.x, L.y - 8, 5, '#ff9d2e', 2);
  if (L.hp <= 0) {
    L.hp = 0;
    L.downed = true;
    addFloater(L.x, L.y - 28, 'ORANGE BUILDER DOWN', '#ff8a93', false);
  }
}

// 4.1.2 — FIRST-CONTACT SHOWCASE BUILD. The user has never once seen a structure go
// up: the economy trickle (14s orb cadence + builder magnet + 4-6sp costs) meant a
// build only started minutes after arrival, usually off-screen. Now: player comes
// within HOLD_SHOWCASE_NEAR of a hold with < HOLD_SHOWCASE_MIN_STRUCTS structures →
// 10-16s later a build FORCE-starts (no orangeSp gate, auto-graduates the hold if
// the drill hasn't finished): captain announces, builder+captain walk over and
// hammer, scaffold + % bar rises, structure completes ≈20-30s after arrival.
function tickHoldShowcaseBuild(hold, dt) {
  if (!HOLD_SHOWCASE_ENABLED || hold.showcaseDone) return;
  if (!hold.showcaseArmT) {
    if (dist2(player.x, player.y, hold.x, hold.y) > HOLD_SHOWCASE_NEAR * HOLD_SHOWCASE_NEAR) return;
    const structs = (hold.structures || []).length + (hold.activeBuild ? 1 : 0);
    if (structs >= HOLD_SHOWCASE_MIN_STRUCTS) { hold.showcaseDone = true; return; }
    hold.showcaseArmT = rand(HOLD_SHOWCASE_DELAY_MIN, HOLD_SHOWCASE_DELAY_MAX);
    return;
  }
  hold.showcaseArmT -= dt;
  if (hold.showcaseArmT > 0) return;
  hold.showcaseDone = true;
  if (hold.activeBuild) return; // economy beat us to it — that's a win
  if (!hold.gauntletDone) graduateHold(hold, 'RALLIES FOR THE VANGUARD'); // seeds queue + captain
  seedHoldVillageQueue(hold);
  if (!hold.buildQueue || !hold.buildQueue.length) return; // village fully built already
  const next = hold.buildQueue[0];
  const def = HOLD_STRUCTURE_KINDS[next.kind];
  const slot = def && pickHoldStructureSlot(hold, next.kind);
  if (!slot) return;
  hold.buildQueue.shift(); // NO orangeSp spend — this one's on the house
  hold.activeBuild = { kind: next.kind, x: slot.x, y: slot.y, r: slot.r, progress: 0, buildSec: def.buildSec };
  const c = hold.captain;
  addFloater(c ? c.x : hold.x, (c ? c.y : hold.y) - 40,
    HOLD_BUILD_RALLY[next.kind] || ('BUILD THE ' + def.name.toUpperCase() + '!'), '#ff9d2e', true);
  addFloater(slot.x, slot.y - 24, 'BREAKING GROUND: ' + def.name.toUpperCase(), '#ffb45a', false);
  spawnParticles(slot.x, slot.y, 10, '#ffb45a', 2.5);
}

// 4.1.2 — the watchpost is a real turret: sweeps the hold's threat list and fires
// orange bolts (cbolts hit real enemies), so there's something to WATCH at a hold.
function tickHoldWatchposts(hold, dt) {
  if (!HOLD_COMBAT_ENABLED || !hold.structures || !hold.structures.length) return;
  for (const s of hold.structures) {
    if (s.kind !== 'watchpost') continue;
    s.atkCd = (s.atkCd || 0) - dt;
    if (s.atkCd > 0) continue;
    let foe = null, fd2 = HOLD_WATCHPOST_RANGE * HOLD_WATCHPOST_RANGE;
    if (hold._threats) {
      for (const e of hold._threats) {
        if (e.dead) continue;
        const d2 = dist2(e.x, e.y, s.x, s.y);
        if (d2 < fd2) { fd2 = d2; foe = e; }
      }
    }
    if (!foe) continue;
    s.atkCd = HOLD_WATCHPOST_CD;
    const a = Math.atan2(foe.y - (s.y - 34), foe.x - s.x) + rand(-0.03, 0.03);
    cbolts.push({
      x: s.x + Math.cos(a) * 10, y: s.y - 34,
      vx: Math.cos(a) * 700, vy: Math.sin(a) * 700,
      life: 0.85, r: 3, dmg: HOLD_WATCHPOST_DMG, pierce: 1, hit: [], scout: false, orange: true,
    });
    spawnParticles(s.x, s.y - 38, 2, '#ff9d2e', 1.5);
  }
}

function updateHoldAutonomy(dt) {
  if (!HOLD_AUTONOMY_ENABLED) return;
  for (const h of npcHolds) {
    tickHoldAgeAndOffline(h, dt); // 4.1.1 — all holds age/grow, seen or not
    if ((h.alertT || 0) > 0) h.alertT -= dt; // 4.1.2 — alarm cools off
    if (!isHoldVisible(h)) continue;
    tickHoldOrbSpawner(h, dt);    // 4.1.1 — ambient orangeSp pre AND post graduation
    tickHoldGauntlet(h, dt);
    tickHoldShowcaseBuild(h, dt); // 4.1.2 — first-contact guaranteed build
    tickHoldWatchposts(h, dt);    // 4.1.2 — watchpost turret fires at threats
    tryHoldUnlock(h);
    if (HOLD_CAPTAIN_ENABLED) {
      if (h.gauntletDone && !h.captain) spawnHoldCaptain(h);
      updateHoldCaptain(h, dt);
    }
  }
  if (!buildPlacePaused) {
    updateHoldLaborers(dt);
    updateHoldUnits(dt);
    updateHoldProbes(dt);
  }
}

function recruitHoldSpearman(hold) {
  if (hold.recruited) return false;
  const t = MILITIA_TYPES.spear;
  militia.push({
    id: militiaIdSeq++, kind: 'spear',
    x: player.x + rand(-40, 40), y: player.y + rand(20, 50),
    vx: 0, vy: 0, r: t.r,
    hp: t.hp, maxHp: t.hp, downed: false, hurtT: 0,
    atkCd: rand(0.2, 0.8), walk: rand(0, 8), facing: 1, aim: 0,
    sk: { dmg: 0, armor: 0, spd: 0, rate: 0, magnet: 0 },
    holdAllegiance: hold.id,
  });
  hold.recruited = true;
  hold.allegiance = true;
  spawnParticles(player.x, player.y, 22, '#ff9d2e', 4);
  addFloater(player.x, player.y - 46, hold.name.toUpperCase() + ' SPEARMAN JOINS!', '#ff9d2e', true);
  return true;
}

// 4.1.1 FREEZE FIX — hold units/builders read orange via a cheap translucent wash
// (same trick as the squad-laborer slate tunic) instead of a chained ctx.filter
// (sepia+saturate+hue-rotate+brightness), which forces slow software compositing
// per draw call on Android WebView and spiked frame times near active holds.
function drawHoldLaborer(L) {
  ctx.save();
  drawLaborer(L);
  if (!L.downed) {
    ctx.fillStyle = 'rgba(255,157,46,0.30)';
    ctx.fillRect(L.x - 6, L.y - 17, 12, 13);
  }
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,157,46,0.9)';
  ctx.fillText('BUILDER', L.x, L.y + 22);
  ctx.restore();
}

function drawHoldUnit(u) {
  ctx.save();
  drawCompanion(u);
  if (!u.downed) {
    ctx.fillStyle = 'rgba(255,157,46,0.26)';
    ctx.fillRect(u.x - 7, u.y - 21, 14, 15);
  }
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,157,46,0.9)';
  ctx.fillText('ORANGE', u.x, u.y + 22);
  ctx.restore();
}

function drawHoldCaptain(c) {
  if (!c) return;
  ctx.save();
  // 4.1.2 — downed captain sprawls with a recovery timer instead of vanishing
  if (c.downed) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 18, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c86820';
    ctx.fillRect(c.x - 14, c.y - 6, 28, 9);
    ctx.fillStyle = '#e0b088';
    ctx.beginPath(); ctx.arc(c.x + 16, c.y - 3, 5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,138,147,0.9)';
    ctx.fillText('CAPTAIN DOWN ' + Math.ceil(Math.max(0, c.downT || 0)) + 's', c.x, c.y + 18);
    ctx.restore();
    return;
  }
  const fig = {
    s: 1.08, walk: c.walk, facing: c.facing || 1, moving: true,
    skin: '#e0b088', hairSpikes: true, hairColor: '#2a2030',
    cloth: '#c86820', pauldron: '#ffb45a', legs: '#2a2420',
    hood: '#8a4a18', weapon: 'staff', staffColor: '#ff9d2e',
    // 4.1.4 — MUST be #RRGGBB hex. drawFigure appends '99'/'00' for 8-digit alpha;
    // rgba(...) + '99' → 'rgba(...)99' throws addColorStop every frame (= soft-lock).
    vestTrim: true, aura: '#ff9d2e',
    swipe: c.swipeT || 0, // 4.1.1 — hammer swing while working a build site
  };
  // 4.1.1 FREEZE FIX — dropped the chained ctx.filter (sepia+saturate+hue-rotate+
  // brightness): it forces slow software compositing per draw on Android WebView.
  // The captain's palette above is already orange, so the tint was redundant.
  drawFigure(c.x, c.y, fig);
  // 4.1.2 — captain shows a health bar once bloodied
  if (c.hp != null && c.hp < (c.maxHp || HOLD_CAPTAIN_HP)) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(c.x - 16, c.y - 44, 32, 4);
    ctx.fillStyle = '#ff9d2e';
    ctx.fillRect(c.x - 16, c.y - 44, 32 * clamp(c.hp / (c.maxHp || HOLD_CAPTAIN_HP), 0, 1), 4);
  }
  ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 2.5;
  ctx.strokeText('CAPTAIN', c.x, c.y + 22);
  ctx.fillStyle = 'rgba(255,157,46,0.95)';
  ctx.fillText('CAPTAIN', c.x, c.y + 22);
  if ((c.holdId && holdById(c.holdId) && (holdById(c.holdId).captainLevel | 0) > 1)) {
    const lvl = holdById(c.holdId).captainLevel;
    ctx.font = '8px Segoe UI';
    ctx.fillStyle = 'rgba(255,180,106,0.9)';
    ctx.fillText('Lv' + lvl, c.x, c.y + 32);
  }
  ctx.restore();
}

function drawHoldDefenses(hold) {
  for (const d of (hold.defenses || [])) {
    if (d.hp <= 0) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.35, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a5038'; ctx.strokeStyle = '#ff9d2e'; ctx.lineWidth = 1.5;
    ctx.fillRect(d.x - d.r, d.y - d.r * 0.55, d.r * 2, d.r * 1.1);
    ctx.strokeRect(d.x - d.r, d.y - d.r * 0.55, d.r * 2, d.r * 1.1);
    if (d.hp < d.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(d.x - 16, d.y - d.r - 10, 32, 3);
      ctx.fillStyle = '#ff9d2e';
      ctx.fillRect(d.x - 16, d.y - d.r - 10, 32 * clamp(d.hp / d.maxHp, 0, 1), 3);
    }
  }
}

function drawHoldStructureProcedural(s) {
  const def = HOLD_STRUCTURE_KINDS[s.kind];
  const dh = def ? def.drawH : 28;
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, s.r * 0.9, s.r * 0.28, 0, 0, TAU); ctx.fill();
  if (s.kind === 'hut') {
    ctx.fillStyle = '#6a5038'; ctx.strokeStyle = '#4a3828'; ctx.lineWidth = 1.5;
    ctx.fillRect(s.x - s.r * 0.75, s.y - dh * 0.55, s.r * 1.5, dh * 0.55);
    ctx.strokeRect(s.x - s.r * 0.75, s.y - dh * 0.55, s.r * 1.5, dh * 0.55);
    ctx.fillStyle = '#5a4030';
    ctx.beginPath();
    ctx.moveTo(s.x - s.r * 0.82, s.y - dh * 0.55);
    ctx.lineTo(s.x, s.y - dh);
    ctx.lineTo(s.x + s.r * 0.82, s.y - dh * 0.55);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9d2e';
    ctx.fillRect(s.x - 5, s.y - dh * 0.38, 10, 14);
  } else if (s.kind === 'timber') {
    ctx.fillStyle = '#5a4030'; ctx.strokeStyle = '#3a2818'; ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      const lx = s.x + i * 9;
      ctx.beginPath(); ctx.ellipse(lx, s.y - 4, 5, dh * 0.22, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
      ctx.fillRect(lx - 4, s.y - dh * 0.35, 8, dh * 0.32);
    }
    ctx.fillStyle = '#7a5838';
    ctx.fillRect(s.x - s.r * 0.55, s.y - 2, s.r * 1.1, 5);
  } else if (s.kind === 'brickpad') {
    const pw = s.r * 1.35, ph = s.r * 0.85;
    ctx.fillStyle = '#7a4828';
    ctx.fillRect(s.x - pw / 2, s.y - ph / 2, pw, ph);
    ctx.strokeStyle = '#4a2a18'; ctx.lineWidth = 1;
    const rowH = 8;
    for (let ry = s.y - ph / 2; ry < s.y + ph / 2; ry += rowH) {
      const off = (Math.floor(ry / rowH) % 2) * 10;
      ctx.beginPath();
      for (let rx = s.x - pw / 2 - off; rx < s.x + pw / 2 + 10; rx += 20) ctx.rect(rx, ry, 18, rowH - 1);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(168,132,78,0.35)';
    ctx.fillRect(s.x - pw / 2, s.y - ph / 2, pw, ph);
  } else if (s.kind === 'watchpost') {
    ctx.fillStyle = '#5a4838'; ctx.strokeStyle = '#ff9d2e'; ctx.lineWidth = 1.5;
    ctx.fillRect(s.x - 8, s.y - dh, 16, dh);
    ctx.strokeRect(s.x - 8, s.y - dh, 16, dh);
    ctx.fillStyle = '#6a5038';
    ctx.fillRect(s.x - s.r * 0.55, s.y - dh - 10, s.r * 1.1, 12);
    ctx.strokeRect(s.x - s.r * 0.55, s.y - dh - 10, s.r * 1.1, 12);
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath(); ctx.arc(s.x, s.y - dh - 14, 3, 0, TAU); ctx.fill();
  } else if (s.kind === 'hut2') {
    ctx.fillStyle = '#6a5038'; ctx.strokeStyle = '#4a3828'; ctx.lineWidth = 1.5;
    ctx.fillRect(s.x - s.r * 0.7, s.y - dh * 0.5, s.r * 1.4, dh * 0.5);
    ctx.strokeRect(s.x - s.r * 0.7, s.y - dh * 0.5, s.r * 1.4, dh * 0.5);
    ctx.fillStyle = '#7a5838';
    ctx.beginPath();
    ctx.moveTo(s.x - s.r * 0.78, s.y - dh * 0.5);
    ctx.lineTo(s.x, s.y - dh * 0.92);
    ctx.lineTo(s.x + s.r * 0.78, s.y - dh * 0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c87828';
    ctx.fillRect(s.x - 4, s.y - dh * 0.35, 8, 12);
  } else if (s.kind === 'depot') {
    ctx.fillStyle = '#4a3a28'; ctx.strokeStyle = '#ff9d2e'; ctx.lineWidth = 1.4;
    ctx.fillRect(s.x - s.r * 0.8, s.y - dh * 0.55, s.r * 1.6, dh * 0.55);
    ctx.strokeRect(s.x - s.r * 0.8, s.y - dh * 0.55, s.r * 1.6, dh * 0.55);
    ctx.fillStyle = '#ff9d2e';
    ctx.fillRect(s.x - s.r * 0.55, s.y - dh * 0.42, s.r * 1.1, 6);
    ctx.fillStyle = '#c8a06a';
    ctx.fillRect(s.x - 6, s.y - dh * 0.28, 12, 14);
  } else if (s.kind === 'bikeshed') {
    ctx.fillStyle = '#5a4838'; ctx.strokeStyle = '#d4b8ff'; ctx.lineWidth = 1.4;
    ctx.fillRect(s.x - s.r * 0.85, s.y - dh * 0.42, s.r * 1.7, dh * 0.42);
    ctx.strokeRect(s.x - s.r * 0.85, s.y - dh * 0.42, s.r * 1.7, dh * 0.42);
    ctx.fillStyle = '#6a5038';
    ctx.beginPath();
    ctx.moveTo(s.x - s.r * 0.95, s.y - dh * 0.42);
    ctx.lineTo(s.x, s.y - dh * 0.95);
    ctx.lineTo(s.x + s.r * 0.95, s.y - dh * 0.42);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(212,184,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(s.x - s.r * 0.55, s.y - dh * 0.55); ctx.lineTo(s.x + s.r * 0.55, s.y - dh * 0.55); ctx.stroke();
  } else if (s.kind === 'stakewall') {
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 3;
    for (let i = -4; i <= 4; i++) {
      const sx = s.x + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx, s.y + 4);
      ctx.lineTo(sx + (i % 2 ? 2 : -2), s.y - dh * 0.75);
      ctx.stroke();
      ctx.fillStyle = '#ff9d2e';
      ctx.beginPath(); ctx.moveTo(sx + (i % 2 ? 2 : -2), s.y - dh * 0.75);
      ctx.lineTo(sx - 3, s.y - dh * 0.55); ctx.lineTo(sx + 3, s.y - dh * 0.55);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#ff9d2e'; ctx.lineWidth = 1.2;
    ctx.strokeRect(s.x - s.r * 0.9, s.y - 2, s.r * 1.8, 6);
  }
}

function drawHoldBuildScaffold(site) {
  if (!site) return;
  const def = HOLD_STRUCTURE_KINDS[site.kind];
  const dh = def ? def.drawH : 28;
  const prog = clamp(site.progress / (site.buildSec || 1), 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(site.x, site.y + 4, site.r * 0.85, site.r * 0.26, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,106,0.85)'; ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(site.x - site.r * 0.7, site.y - dh * 0.5, site.r * 1.4, dh * 0.55);
  ctx.setLineDash([]);
  ctx.strokeStyle = '#c8a06a'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(site.x - site.r * 0.55, site.y - dh * 0.15);
  ctx.lineTo(site.x - site.r * 0.55, site.y - dh * 0.65);
  ctx.lineTo(site.x + site.r * 0.55, site.y - dh * 0.65);
  ctx.lineTo(site.x + site.r * 0.55, site.y - dh * 0.15);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(site.x - 20, site.y - dh - 14, 40, 5);
  ctx.fillStyle = '#ff9d2e';
  ctx.fillRect(site.x - 20, site.y - dh - 14, 40 * prog, 5);
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,157,46,0.92)';
  ctx.fillText(Math.floor(prog * 100) + '%', site.x, site.y - dh - 18);
}

function drawHoldStructures(hold) {
  for (const s of (hold.structures || [])) drawHoldStructureProcedural(s);
  if (hold.activeBuild) drawHoldBuildScaffold(hold.activeBuild);
}

function drawHoldProbe(e) {
  if (e.spawnT > 0) ctx.globalAlpha = 0.55;
  const flash = e.flash > 0;
  drawFigure(e.x, e.y, {
    s: 0.72, walk: e.walk, moving: true, flash: flash ? 0.1 : 0,
    skin: '#8a9a6a', cloth: '#4a3a28', legs: '#2a2018', hunch: 0.15,
  });
  ctx.globalAlpha = 1;
}

function drawLegacyPathGround() {
  if (!CONTINUOUS_MAP_ENABLED || !tileTex.path) return;
  const tx0 = Math.max(0, Math.floor(camera.x / TILE));
  const ty0 = Math.max(0, Math.floor(camera.y / TILE));
  const tx1 = Math.min(Math.ceil(WORLD.w / TILE), Math.ceil((camera.x + VW) / TILE));
  const ty1 = Math.min(Math.ceil(WORLD.h / TILE), Math.ceil((camera.y + VH) / TILE));
  for (let tx = tx0; tx < tx1; tx++) for (let ty = ty0; ty < ty1; ty++) {
    const px = tx * TILE + TILE / 2, py = ty * TILE + TILE / 2;
    if (!isLegacyPathCorridor(px, py) || isNearGoldMine(px, py)) continue;
    ctx.drawImage(tileTex.path, tx * TILE, ty * TILE);
  }
}

// ---------- Step 10.1 — Ashmere draw (camera-culled; no ctx.filter — 4.1.1 perf rule) ----------
// Shoreline polygon sampled once from the SAME field the collision uses (visual line ==
// clamp line); isle ring carves the dry hole via evenodd. Per-frame cost when on camera:
// 2 fills + 3 strokes + ~2 dozen shimmer rects. Off camera: one bbox test.
let lakeShorePts = null, lakeIslePts = null, lakeGlintPts = null, lakeWaterPattern = null;
const LAKE_SHORE_SAMPLES = 72, LAKE_ISLE_SAMPLES = 40;
function buildLakeShorePts() {
  lakeShorePts = new Float32Array(LAKE_SHORE_SAMPLES * 2);
  for (let i = 0; i < LAKE_SHORE_SAMPLES; i++) {
    const th = (i / LAKE_SHORE_SAMPLES) * TAU;
    const ux = Math.cos(th), uy = Math.sin(th);
    // radial shore solve — field(s·u) = s^n · field(u) → s = field(u)^(-1/n)
    const m = Math.pow(Math.max(lakeFieldOffset(ux, uy), 1e-9), -1 / LAKE_BLOB.n);
    lakeShorePts[i * 2] = LAKE_BLOB.cx + ux * m;
    lakeShorePts[i * 2 + 1] = LAKE_BLOB.cy + uy * m;
  }
  lakeIslePts = new Float32Array(LAKE_ISLE_SAMPLES * 2);
  for (let i = 0; i < LAKE_ISLE_SAMPLES; i++) {
    const th = (i / LAKE_ISLE_SAMPLES) * TAU;
    const wob = 1 + 0.06 * Math.sin(th * 4 + 0.9); // small deterministic isle-rim wobble (draw only)
    lakeIslePts[i * 2] = LAKE_ISLE.x + Math.cos(th) * LAKE_ISLE.r * wob;
    lakeIslePts[i * 2 + 1] = LAKE_ISLE.y + Math.sin(th) * LAKE_ISLE.r * wob;
  }
  // deterministic shimmer glints — water-only points, phases baked from index
  const cand = [];
  for (let i = 0; i < 44 && cand.length < 26; i++) {
    const gx = LAKE_BLOB.cx + (hash2(i * 7.3, 1.7) - 0.5) * 2 * LAKE_BLOB.a * 0.82;
    const gy = LAKE_BLOB.cy + (hash2(3.1, i * 5.7) - 0.5) * 2 * LAKE_BLOB.b * 0.82;
    if (isLakeWaterAt(gx, gy) && !isLakeShallowAt(gx, gy)) cand.push(gx, gy);
  }
  lakeGlintPts = new Float32Array(cand);
}
function traceLakePath() {
  ctx.beginPath();
  ctx.moveTo(lakeShorePts[0], lakeShorePts[1]);
  for (let i = 1; i < LAKE_SHORE_SAMPLES; i++) ctx.lineTo(lakeShorePts[i * 2], lakeShorePts[i * 2 + 1]);
  ctx.closePath();
  ctx.moveTo(lakeIslePts[0], lakeIslePts[1]);
  for (let i = 1; i < LAKE_ISLE_SAMPLES; i++) ctx.lineTo(lakeIslePts[i * 2], lakeIslePts[i * 2 + 1]);
  ctx.closePath();
}
function drawLakeWater() {
  if (!LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  if (LAKE_BLOB.cx + LAKE_BLOB.a < camera.x - 40 || LAKE_BLOB.cx - LAKE_BLOB.a > camera.x + VW + 40 ||
      LAKE_BLOB.cy + LAKE_BLOB.b < camera.y - 40 || LAKE_BLOB.cy - LAKE_BLOB.b > camera.y + VH + 40) return;
  if (!lakeShorePts) buildLakeShorePts();
  if (!lakeWaterPattern && tileTex.water && ctx.createPattern) {
    try { lakeWaterPattern = ctx.createPattern(tileTex.water, 'repeat'); } catch (e) { lakeWaterPattern = null; }
  }
  const t = performance.now() / 1000;
  traceLakePath();
  // deep base + still-water texture (evenodd keeps Driftwood Isle dry)
  ctx.fillStyle = '#0c1c24';
  ctx.fill('evenodd');
  if (lakeWaterPattern) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = lakeWaterPattern;
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.clip('evenodd');
  // shallow band hugging the waterline + isle ring (wide stroke, water-side half via clip)
  ctx.strokeStyle = 'rgba(58,110,116,0.30)';
  ctx.lineWidth = LAKE_SHALLOW_BAND * 2;
  ctx.stroke();
  // slow breathing sheen — whole body, very low alpha
  ctx.globalAlpha = 0.045 + 0.03 * Math.sin(t * 0.8);
  ctx.fillStyle = '#7fd6d0';
  ctx.fill('evenodd');
  // shimmer glints — deterministic points, phase-offset pulses, tiny drift
  ctx.fillStyle = '#a8dfe0';
  for (let i = 0; i < lakeGlintPts.length; i += 2) {
    const al = 0.06 + 0.11 * Math.sin(t * 1.8 + i * 1.23);
    if (al <= 0.03) continue;
    ctx.globalAlpha = al;
    ctx.fillRect(lakeGlintPts[i] + Math.sin(t * 0.5 + i) * 3, lakeGlintPts[i + 1] + Math.sin(t * 0.9 + i * 0.7) * 2,
      7 + (i % 3) * 4, 1.6);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // foam strokes on the waterline (path survives restore) — soft wide + crisp thin
  ctx.strokeStyle = 'rgba(190,220,220,0.14)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(214,236,236,0.26)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
/** Step 10.2 — Emberfall Dock: planks above the water, below decals/decor/entities. Same
 * bbox cull pattern as drawLakeWater; plain fills/strokes only (no ctx.filter). The moor
 * post + cleat + slack rope at the head visually reserve the 10.3 skiff snap point. */
function drawEmberfallDock() {
  if (!LAKE_DOCK_ENABLED || !LAKE_WATER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  const D = LAKE_DOCK, pad = LAKE_DOCK_LEN + 60;
  if (D.baseX + pad < camera.x - 40 || D.baseX - pad > camera.x + VW + 40 ||
      D.baseY + pad < camera.y - 40 || D.baseY - pad > camera.y + VH + 40) return;
  ctx.save();
  ctx.translate(D.baseX, D.baseY);
  ctx.rotate(Math.atan2(D.ay, D.ax)); // local frame: +x = out over the water, ±y = deck sides
  // pilings first — post pairs peeking past the deck edges, feet in the water
  ctx.fillStyle = '#241a12';
  for (let u = 26; u <= LAKE_DOCK_LEN - 6; u += 42) {
    ctx.fillRect(u - 3, -LAKE_DOCK_HALF_W - 4, 6, 8);
    ctx.fillRect(u - 3, LAKE_DOCK_HALF_W - 4, 6, 8);
  }
  // deck — one board fill (slight dry-side apron overhang), slat seams, side stringers
  ctx.fillStyle = '#4a3826';
  ctx.fillRect(-8, -LAKE_DOCK_HALF_W, LAKE_DOCK_LEN + 8, LAKE_DOCK_HALF_W * 2);
  ctx.strokeStyle = 'rgba(24,16,10,0.55)'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let u = 0; u <= LAKE_DOCK_LEN; u += 9) { ctx.moveTo(u, -LAKE_DOCK_HALF_W); ctx.lineTo(u, LAKE_DOCK_HALF_W); }
  ctx.stroke();
  ctx.strokeStyle = '#5f4a30'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -LAKE_DOCK_HALF_W + 1.5); ctx.lineTo(LAKE_DOCK_LEN, -LAKE_DOCK_HALF_W + 1.5);
  ctx.moveTo(-8, LAKE_DOCK_HALF_W - 1.5); ctx.lineTo(LAKE_DOCK_LEN, LAKE_DOCK_HALF_W - 1.5);
  ctx.stroke();
  // head cap + mooring post with cleat, slack rope curling toward the 10.3 moor point
  ctx.fillStyle = '#5f4a30';
  ctx.fillRect(LAKE_DOCK_LEN - 4, -LAKE_DOCK_HALF_W, 4, LAKE_DOCK_HALF_W * 2);
  ctx.fillStyle = '#33261a';
  ctx.fillRect(LAKE_DOCK_LEN - 11, -LAKE_DOCK_HALF_W - 7, 8, 13);
  ctx.strokeStyle = '#1d1410'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LAKE_DOCK_LEN - 14, -LAKE_DOCK_HALF_W - 1); ctx.lineTo(LAKE_DOCK_LEN - 0.5, -LAKE_DOCK_HALF_W - 1);
  ctx.stroke(); // cleat crossbar
  ctx.strokeStyle = 'rgba(196,178,140,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(LAKE_DOCK_LEN + 10, -2, 7, -0.8, 2.2); ctx.stroke();
  ctx.restore();
}
/** Step 10.4 — Driftwood Isle mini-pier: the Emberfall plank language at mini scale (same
 * palette, tighter piling rhythm), moor post + cleat reserving the second skiff berth.
 * Same bbox cull + plain fills/strokes (no ctx.filter). */
function drawIslePier() {
  if (!isleContentActive()) return;
  const P = LAKE_ISLE_PIER, pad = LAKE_ISLE_PIER_LEN + 50;
  if (P.baseX + pad < camera.x - 40 || P.baseX - pad > camera.x + VW + 40 ||
      P.baseY + pad < camera.y - 40 || P.baseY - pad > camera.y + VH + 40) return;
  ctx.save();
  ctx.translate(P.baseX, P.baseY);
  ctx.rotate(Math.atan2(P.ay, P.ax)); // local frame: +x = out over the strait, ±y = deck sides
  ctx.fillStyle = '#241a12'; // piling pairs, feet in the water
  for (let u = 18; u <= LAKE_ISLE_PIER_LEN - 6; u += 34) {
    ctx.fillRect(u - 3, -LAKE_ISLE_PIER_HALF_W - 4, 6, 8);
    ctx.fillRect(u - 3, LAKE_ISLE_PIER_HALF_W - 4, 6, 8);
  }
  ctx.fillStyle = '#4a3826'; // deck boards with a short dry-side apron overhang
  ctx.fillRect(-8, -LAKE_ISLE_PIER_HALF_W, LAKE_ISLE_PIER_LEN + 8, LAKE_ISLE_PIER_HALF_W * 2);
  ctx.strokeStyle = 'rgba(24,16,10,0.55)'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let u = 0; u <= LAKE_ISLE_PIER_LEN; u += 9) {
    ctx.moveTo(u, -LAKE_ISLE_PIER_HALF_W); ctx.lineTo(u, LAKE_ISLE_PIER_HALF_W);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5f4a30'; ctx.lineWidth = 3; // side stringers
  ctx.beginPath();
  ctx.moveTo(-8, -LAKE_ISLE_PIER_HALF_W + 1.5); ctx.lineTo(LAKE_ISLE_PIER_LEN, -LAKE_ISLE_PIER_HALF_W + 1.5);
  ctx.moveTo(-8, LAKE_ISLE_PIER_HALF_W - 1.5); ctx.lineTo(LAKE_ISLE_PIER_LEN, LAKE_ISLE_PIER_HALF_W - 1.5);
  ctx.stroke();
  ctx.fillStyle = '#5f4a30'; // head cap + moor post with cleat (the 10.4 second berth hint)
  ctx.fillRect(LAKE_ISLE_PIER_LEN - 4, -LAKE_ISLE_PIER_HALF_W, 4, LAKE_ISLE_PIER_HALF_W * 2);
  ctx.fillStyle = '#33261a';
  ctx.fillRect(LAKE_ISLE_PIER_LEN - 10, -LAKE_ISLE_PIER_HALF_W - 7, 7, 12);
  ctx.strokeStyle = '#1d1410'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LAKE_ISLE_PIER_LEN - 13, -LAKE_ISLE_PIER_HALF_W - 1);
  ctx.lineTo(LAKE_ISLE_PIER_LEN - 0.5, -LAKE_ISLE_PIER_HALF_W - 1);
  ctx.stroke(); // cleat crossbar
  ctx.strokeStyle = 'rgba(196,178,140,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(LAKE_ISLE_PIER_LEN + 9, -2, 6, -0.8, 2.2); ctx.stroke();
  ctx.restore();
}
/** Step 10.4 — the Greywater ferry cache: rope-bound gray-green supply crate under a faded
 * tarp. Unopened: soft gold beacon + walk-up hint. Opened: lid ajar, dark and empty — the
 * claim is one-time, but the ferry's last drop stays as lore scenery. Plain fills only. */
function drawIsleCache(c, t) {
  const open = isleCacheOpened;
  if (!open) { // low beacon — the wave-chest cue at half strength
    const g = ctx.createLinearGradient(c.x, c.y - 64, c.x, c.y);
    g.addColorStop(0, 'rgba(255,213,74,0)');
    g.addColorStop(1, `rgba(255,213,74,${0.14 + Math.sin((t || 0) * 2.4) * 0.05})`);
    ctx.fillStyle = g;
    ctx.fillRect(c.x - 10, c.y - 64, 20, 64);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, 19, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a5648'; ctx.strokeStyle = '#2c3630'; ctx.lineWidth = 2; // weathered hull planks
  ctx.fillRect(c.x - 16, c.y - 15, 32, 17); ctx.strokeRect(c.x - 16, c.y - 15, 32, 17);
  ctx.strokeStyle = 'rgba(20,26,22,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(c.x - 16, c.y - 9); ctx.lineTo(c.x + 16, c.y - 9);
  ctx.moveTo(c.x - 16, c.y - 3); ctx.lineTo(c.x + 16, c.y - 3);
  ctx.stroke();
  if (open) { // lid ajar against the stern, dark empty well
    ctx.fillStyle = '#151d18';
    ctx.fillRect(c.x - 13, c.y - 14, 26, 7);
    ctx.fillStyle = '#57645a';
    ctx.save();
    ctx.translate(c.x + 13, c.y - 14);
    ctx.rotate(-0.5);
    ctx.fillRect(0, -5, 20, 5);
    ctx.restore();
  } else { // closed lid under the faded Greywater tarp + rope lashing
    ctx.fillStyle = '#5c6a5a';
    ctx.beginPath(); ctx.moveTo(c.x - 16, c.y - 15);
    ctx.quadraticCurveTo(c.x, c.y - 24, c.x + 16, c.y - 15); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a6a42'; ctx.lineWidth = 2; // rope lashing
    ctx.beginPath();
    ctx.moveTo(c.x - 6, c.y - 21); ctx.lineTo(c.x - 6, c.y + 2);
    ctx.moveTo(c.x + 7, c.y - 21); ctx.lineTo(c.x + 7, c.y + 2);
    ctx.stroke();
    ctx.fillStyle = '#9fc4d0'; // faded ferry pennant
    ctx.fillRect(c.x - 1.5, c.y - 34, 3, 14);
    ctx.beginPath(); ctx.moveTo(c.x + 1.5, c.y - 34); ctx.lineTo(c.x + 12, c.y - 30.5);
    ctx.lineTo(c.x + 1.5, c.y - 27); ctx.closePath(); ctx.fill();
    if (dist2(player.x, player.y, c.x, c.y) < 260 * 260) {
      ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd54a';
      ctx.fillText('GREYWATER FERRY CACHE', c.x, c.y - 40);
    }
  }
}

function drawLegacyPathsMinimap(g, toX, toY, sx, sy) {
  if (!CONTINUOUS_MAP_ENABLED) return;
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const cx = lx + lw / 2, cy = ly + lh / 2;
  const half = LEGACY_PATH_CORRIDOR_HALF;
  const depth = LEGACY_PATH_INTERIOR_DEPTH;
  g.fillStyle = 'rgba(168,132,78,0.72)';
  g.fillRect(toX(cx - half), toY(ly), half * 2 * sx, depth * sy);
  g.fillRect(toX(cx - half), toY(ly + lh - depth), half * 2 * sx, depth * sy);
  g.fillRect(toX(lx), toY(cy - half), depth * sx, half * 2 * sy);
  g.fillRect(toX(lx + lw - depth), toY(cy - half), depth * sx, half * 2 * sy);
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
    if (buildPlaceMode) { cancelBuildPlaceMode(); return; }
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
    if (!nearestDownedCompanion() && !nearestDownedMilitia() && !nearestDownedLaborer() && !nearestDownedAlly() && !nearestDownedColossus()) tryTalk();
  }
  if (e.code === 'KeyV') tryVehicleAction(); // 10.3 — bike OR skiff, nearest actionable wins
  if (e.code === 'KeyB') {
    if (buildPlaceMode) { cancelBuildPlaceMode(); return; }
    openBuildPick();
  }
  if (e.code === 'KeyH') tryAetherMend();
  if (e.code === 'KeyC') trySummonColossus();
});
addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'KeyT') talkHeld = false;
});
canvas.addEventListener('mousemove', e => {
  // 4.1.3 NaN GUARD — mouse.x feeds player.aim (atan2) every frame
  if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) { mouse.x = e.clientX; mouse.y = e.clientY; }
});
canvas.addEventListener('mousedown', e => {
  if (dialogOpen) { advanceDialog(); return; }
  if (e.button === 0) {
    if (buildPlaceMode) { confirmBuildPlace(); return; }
    if (trySelectStructureAt(e.clientX, e.clientY)) return;
    mouse.down = true;
  }
  if (e.button === 2) mouse.rdown = true;
});
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    if (buildPlaceMode) {
      confirmBuildPlace();
      e.preventDefault(); e.stopPropagation();
      return;
    }
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
  if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return; // 4.1.3 NaN guard
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
  // 4.1.3 NaN GUARD — some WebView pointer events (pen/palm/cancel races) deliver
  // undefined clientX/Y; NaN here becomes NaN joy → NaN player velocity → NaN player
  // position → clamp(NaN)=NaN forever = "guys disappear and I can't move".
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
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
bindHold('btnFire', () => {
  if (buildPlaceMode) confirmBuildPlace();
  else touch.fire = true;
}, () => touch.fire = false);
bindHold('btnBeam', () => touch.beamHeld = true, () => { touch.beamHeld = false; releaseBeam(); });
bindHold('btnNova', () => tryNova());
bindHold('btnGren', () => tryGrenade());
bindHold('btnDash', () => tryDash(true));
bindHold('btnForm', () => tryTransform());
bindHold('btnBuild', () => {
  if (buildPlaceMode) cancelBuildPlaceMode();
  else openBuildPick();
});
bindHold('btnMend', () => tryAetherMend());
bindHold('btnColossus', () => trySummonColossus());
bindHold('btnBike', () => tryVehicleAction()); // 10.3 — shared vehicle button (🏍/⛵)
bindHold('btnTalk', () => {
  talkHeld = true;
  if (!nearestDownedCompanion() && !nearestDownedMilitia() && !nearestDownedLaborer() && !nearestDownedAlly() && !nearestDownedColossus()) tryTalk();
}, () => { talkHeld = false; });
$('btnMenu').addEventListener('pointerdown', e => { if (layoutEditing) return; e.preventDefault(); toggleTree(); });

// ==================== VERSION & UPDATE CHECK ======================
// BETA-3 Continuity apply batch (sideload test only — Play store stays 2.13.2 / vc46).
const APP_VERSION = '4.4.0';
const APP_VCODE = 102; // keep in step with android/app/build.gradle versionCode
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
  waveCoachSkip: false, // Continuity v4 Step 1 — persist Skip How-to-Play coach
  fogDiscoveryMode: FOG_DISCOVERY_DEFAULT, // Step 6.7 — default Version B for new games
};
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
if (!FOG_DISCOVERY_MODES.includes(settings.fogDiscoveryMode)) settings.fogDiscoveryMode = FOG_DISCOVERY_DEFAULT;
applyFogDiscoveryMode(settings.fogDiscoveryMode);
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

// ---------- ENHANCED SFX (v3.3.0 Step 4) — procedural WAV layer + synth fallback ----------
// Load order per cue: assets/audio/drop/<file> (user AI exports) → assets/audio/<file> (shipped
// procedural via gen-tr-sfx.mjs) → 3.1.3 synth voices. See assets/audio/drop/README.md.
const ENHANCED_SFX_ENABLED = true;
const AUDIO_DROP_DIR = 'assets/audio/drop';
const AUDIO_SHIPPED_DIR = 'assets/audio';

// ---------- SOUND ENGINE (v2.8.7) — shared WebAudio graph, synthesized SFX ----------
// Categories: sfx / music / ui. Lazy AudioContext (autoplay-safe). Vibration stays
// on settings.vibro via buzz() — never gated by muteMaster/muteSfx.
//
// WHAT PLAYS WHEN (muteMaster silences all; muteSfx → sfx/ui; muteMusic → music bus):
//   fire          — rifle / dual-wield bolt leave muzzle
//   cleaver       — Gharok / boss cleave swing
//   whoosh        — grenade throw
//   zap           — Gusher splash impact
//   crackle       — Sticker needle cluster burst
//   melee         — Nova pulse (close burst)
//   beamCharge    — holding Nova Beam charge (loops while charging)
//   beamBlast     — releasing charged Nova Beam
//   bark          — combat idle / attack / hurt grunts (opts.voice = unit type)
//   death         — enemy dies (opts.voice = type; skeleton = bone rattle, husk = wet, …)
//   place         — barricade / Cloister pillar / structure confirm place
//   hurt          — player takes damage
//   stomp         — Gharok foot plant (GHAROK_STOMP_JUICE)
//   levelup / waveclear / click — UI / progression
//   music (rift hum) — subtle low drone while playing/shop (muteMusic aware)
const GHAROK_STOMP_JUICE = true;
const sfx = (() => {
  let ac = null, noiseBuf = null, graph = null, musicNodes = null;
  const last = Object.create(null);
  let samples = null; // null = not started; {} = loading/loaded
  const sampleFiles = {
    death: 'death',
    beamCharge: 'beam-charge',
    beamBlast: 'beam-blast',
    place: 'place',
    bossBark: 'boss-bark',
    rifle: 'rifle',
    hurt: 'hurt',
    waveclear: 'waveclear',
    enemyBark: 'enemy-bark',
    chop: 'chop',
    mine: 'mine',
    music: 'rift-music',
  };
  const deathPitch = {
    skeleton: 1.35, sprinter: 1.18, shaman: 1.08, husk: 1.0,
    bulwark: 0.82, ravager: 0.75, warlord: 0.62,
  };

  function sampleCandidatePaths(baseName) {
    const base = baseName.replace(/\.(wav|ogg|mp3)$/i, '');
    const exts = ['.mp3', '.wav', '.ogg'];
    const paths = [];
    for (const e of exts) {
      paths.push(`${AUDIO_DROP_DIR}/${base}${e}`);
      paths.push(`${AUDIO_SHIPPED_DIR}/${base}${e}`);
    }
    return paths;
  }

  function loadSample(ctx, key, paths, idx) {
    if (idx >= paths.length) return;
    fetch(paths[idx]).then(r => {
      if (!r.ok) throw new Error('missing');
      return r.arrayBuffer();
    }).then(ab => ctx.decodeAudioData(ab)).then(buf => {
      samples[key] = buf;
    }).catch(() => loadSample(ctx, key, paths, idx + 1));
  }

  function ensureSamples(ctx) {
    if (!ENHANCED_SFX_ENABLED || samples) return;
    samples = {};
    for (const [key, file] of Object.entries(sampleFiles)) {
      loadSample(ctx, key, sampleCandidatePaths(file), 0);
    }
  }
  function playSample(name, ctx, dest, now, opts) {
    if (!ENHANCED_SFX_ENABLED || !samples || !samples[name]) return false;
    try {
      const buf = samples[name];
      const src = ctx.createBufferSource();
      src.buffer = buf;
      let rate = 1;
      if (name === 'death' && opts && opts.voice) rate = deathPitch[opts.voice] || 1;
      if (name === 'bossBark') rate = 0.94 + Math.random() * 0.12;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      const dur = buf.duration / rate;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.82, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.02);
      src.connect(g).connect(dest);
      src.start(now);
      src.stop(now + dur + 0.05);
      return true;
    } catch (e) { return false; }
  }

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
      ensureSamples(ac);
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
      if (ENHANCED_SFX_ENABLED && samples && samples.music) {
        const src = ctx.createBufferSource();
        src.buffer = samples.music;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.24, now + 1.4);
        src.connect(g).connect(graph.music);
        src.start(now);
        musicNodes = { src, g, sample: true };
        return;
      }
      // Subtle rift-hum bed (not a licensed track) — low sine + soft noise hiss
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 48;
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 72;
      const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = 96;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.028, now + 1.6);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      o1.connect(g); o2.connect(g); o3.connect(g);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx); src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 180; bp.Q.value = 0.6;
      const ng = ctx.createGain(); ng.gain.value = 0.012;
      src.connect(bp).connect(ng).connect(lp);
      g.connect(lp).connect(graph.music);
      o1.start(now); o2.start(now); o3.start(now); src.start(now);
      musicNodes = { o1, o2, o3, src, g };
    } catch (e) { musicNodes = null; }
  }
  function stopMusic() {
    if (!musicNodes) return;
    try {
      const g = musicNodes.g, ctx = ac;
      if (ctx && g) {
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      }
      const tStop = (ac ? ac.currentTime : 0) + 0.5;
      if (musicNodes.sample) {
        if (musicNodes.src) musicNodes.src.stop(tStop);
      } else {
        musicNodes.o1.stop(tStop);
        musicNodes.o2.stop(tStop);
        if (musicNodes.o3) musicNodes.o3.stop(tStop);
        if (musicNodes.src) musicNodes.src.stop(tStop);
      }
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
      } else if (v === 'shaman' || v === 'burstweaver' || v === 'broodmother' || v === 'spiderling') {
        // Shaman hex hiss · Burstweaver dry weave scrape (shared dry mid-tone)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(v === 'burstweaver' ? 260 : 210, now);
        osc.frequency.exponentialRampToValueAtTime(v === 'burstweaver' ? 70 : 90, now + 0.2);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = v === 'burstweaver' ? 1100 : 1400;
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
      } else if (v === 'rover') {
        // Aether-hound yip/woof — higher + shorter than orc barks (not husk/ravager sawtooth)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.11);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.1, now + 0.012);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3.2;
        bp.frequency.setValueAtTime(1600, now);
        bp.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.15);
        src.start(now); src.stop(now + 0.13);
      } else if (v === 'warden') {
        // Armored robot guardian — deep metallic square (not orc sawtooth, not dog yip)
        osc.type = 'square';
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.exponentialRampToValueAtTime(78, now + 0.22);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4.5;
        bp.frequency.setValueAtTime(980, now);
        bp.frequency.exponentialRampToValueAtTime(420, now + 0.24);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.28);
        src.start(now); src.stop(now + 0.24);
      } else if (v === 'scout') {
        // Ranger recon chirp — bright mid triangle (not dog yip, not deep warden square)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.13);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.095, now + 0.015);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5.2;
        bp.frequency.setValueAtTime(1400, now);
        bp.frequency.exponentialRampToValueAtTime(620, now + 0.14);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.17);
        src.start(now); src.stop(now + 0.14);
      } else if (v === 'sentinel') {
        // Militia spear line — mid brass square (not dog yip, not scout chirp, not deep warden tank)
        osc.type = 'square';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(105, now + 0.18);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4.0;
        bp.frequency.setValueAtTime(1100, now);
        bp.frequency.exponentialRampToValueAtTime(480, now + 0.2);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.24);
        src.start(now); src.stop(now + 0.2);
      } else if (v === 'laborer') {
        // Stocky worker grunt — warm mid saw (not orc roar, not dog yip, not scout/warden/sentinel)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(175, now);
        osc.frequency.exponentialRampToValueAtTime(88, now + 0.15);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.095, now + 0.018);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3.4;
        bp.frequency.setValueAtTime(900, now);
        bp.frequency.exponentialRampToValueAtTime(380, now + 0.16);
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.075, now + 0.014);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.2);
        src.start(now); src.stop(now + 0.17);
      } else if (v === 'colossus') {
        // Deep rift titan rumble — lower + longer than warlord (72) / ravager (82); not orc/warden/scout
        osc.type = 'sine';
        osc.frequency.setValueAtTime(52, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.48);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.17, now + 0.06);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.13, now + 0.05);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.54);
        src.start(now); src.stop(now + 0.44);
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
    // Enemy death — type-distinct (skeleton bone rattle, husk wet splat, …)
    death(ctx, dest, now, opts) {
      const v = (opts && opts.voice) || 'husk';
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const og = ctx.createGain();
      const ng = ctx.createGain();
      const osc = ctx.createOscillator();
      if (v === 'skeleton') {
        // Bone crackle / rattle — distinct from combat bark
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 10;
        bp.frequency.setValueAtTime(3600, now);
        bp.frequency.exponentialRampToValueAtTime(700, now + 0.22);
        ng.gain.setValueAtTime(0.0001, now);
        for (let i = 0; i < 5; i++) {
          ng.gain.exponentialRampToValueAtTime(0.14, now + 0.008 + i * 0.028);
          ng.gain.exponentialRampToValueAtTime(0.015, now + 0.022 + i * 0.028);
        }
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.22);
        src.start(now); src.stop(now + 0.24);
      } else if (v === 'bulwark' || v === 'warlord' || v === 'ravager') {
        const base = v === 'warlord' ? 55 : v === 'ravager' ? 62 : 78;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 0.35, now + 0.42);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.48);
        src.start(now); src.stop(now + 0.4);
      } else if (v === 'shaman') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        osc.connect(og).connect(dest);
        src.connect(hp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.32);
        src.start(now); src.stop(now + 0.28);
      } else if (v === 'sprinter') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
        bp.frequency.value = 700;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(og).connect(dest);
        src.connect(bp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.2);
        src.start(now); src.stop(now + 0.16);
      } else {
        // husk — wet splat / moan collapse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);
        og.gain.setValueAtTime(0.0001, now);
        og.gain.exponentialRampToValueAtTime(0.11, now + 0.05);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
        osc.connect(og).connect(dest);
        src.connect(lp).connect(ng).connect(dest);
        osc.start(now); osc.stop(now + 0.44);
        src.start(now); src.stop(now + 0.36);
      }
    },
    // Nova Beam charge loop pulse (throttled while holding)
    beamCharge(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(180, now);
      o.frequency.exponentialRampToValueAtTime(340, now + 0.22);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4;
      bp.frequency.setValueAtTime(1200, now);
      bp.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.035, now + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      o.connect(g).connect(dest);
      src.connect(bp).connect(ng).connect(dest);
      o.start(now); o.stop(now + 0.26);
      src.start(now); src.stop(now + 0.22);
    },
    // Nova Beam release blast — distinct from rifle fire / nova melee
    beamBlast(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, now);
      o.frequency.exponentialRampToValueAtTime(70, now + 0.38);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      const o2 = ctx.createOscillator(); o2.type = 'sine';
      o2.frequency.setValueAtTime(90, now);
      o2.frequency.exponentialRampToValueAtTime(36, now + 0.32);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, now);
      g2.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      o.connect(g).connect(dest);
      o2.connect(g2).connect(dest);
      src.connect(hp).connect(ng).connect(dest);
      o.start(now); o.stop(now + 0.44);
      o2.start(now); o2.stop(now + 0.38);
      src.start(now); src.stop(now + 0.3);
    },
    // Building / barricade / Cloister place confirm
    place(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      const src = ctx.createBufferSource(); src.buffer = noise(ctx);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      const th = ctx.createOscillator(); th.type = 'sine';
      th.frequency.setValueAtTime(70, now + 0.02);
      th.frequency.exponentialRampToValueAtTime(40, now + 0.14);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, now + 0.02);
      tg.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.connect(g).connect(dest);
      src.connect(lp).connect(ng).connect(dest);
      th.connect(tg).connect(dest);
      o.start(now); o.stop(now + 0.18);
      src.start(now); src.stop(now + 0.14);
      th.start(now); th.stop(now + 0.18);
    },
    chop(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(180, now);
      o.frequency.exponentialRampToValueAtTime(90, now + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      o.connect(g).connect(dest);
      o.start(now); o.stop(now + 0.12);
    },
    mine(ctx, dest, now) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(60, now + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.connect(g).connect(dest);
      o.start(now); o.stop(now + 0.18);
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
    death: { cat: 'sfx', throttle: 0.07 },
    beamCharge: { cat: 'sfx', throttle: 0.18 },
    beamBlast: { cat: 'sfx', throttle: 0.25 },
    place: { cat: 'sfx', throttle: 0.08 },
    chop: { cat: 'sfx', throttle: 0.35 },
    mine: { cat: 'sfx', throttle: 0.35 },
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
        if (ENHANCED_SFX_ENABLED) {
          let sampleName = null;
          if (name === 'death') sampleName = 'death';
          else if (name === 'beamCharge') sampleName = 'beamCharge';
          else if (name === 'beamBlast') sampleName = 'beamBlast';
          else if (name === 'place') sampleName = 'place';
          else if (name === 'bark' && opts && opts.voice === 'warlord') sampleName = 'bossBark';
          else if (name === 'bark') sampleName = 'enemyBark';
          else if (name === 'fire') sampleName = 'rifle';
          else if (name === 'hurt') sampleName = 'hurt';
          else if (name === 'waveclear') sampleName = 'waveclear';
          else if (name === 'chop') sampleName = 'chop';
          else if (name === 'mine') sampleName = 'mine';
          if (sampleName && playSample(sampleName, ctx, dest, now, opts || {})) return;
        }
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
    unlock() { const c = ensure(); if (c) ensureSamples(c); syncMusic(); },
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
  // Ashen Burstweaver — dry weave / venom / burst (not Minecraft creeper IP)
  burstweaver: ['…weave…', 'skrrt', 'ash web', 'burst…', 'venom!', '…swell…', 'sssk'],
  broodmother: ['…brood…', 'skrr-cht', 'spawn!', '…swell…', 'hatch!', '…venom…', 'sssk-k-k'],
  spiderling: ['skrt', 'nip!', 'web!', 'ssk', 'bite'],
};
const ENEMY_BARK_COLORS = {
  husk: '#9aaa88', sprinter: '#c8a070', skeleton: '#a8d8e8',
  bulwark: '#ff6a4d', shaman: '#b08cff', ravager: '#e07040', warlord: '#ff4d5e',
  burstweaver: '#e07040',
  broodmother: '#c85888',
  spiderling: '#d87850',
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
  addFloater(e.x, e.y - (e.r * 2.2 + 8), line, col, !!e.boss || e.type === 'bulwark' || e.type === 'ravager' || e.type === 'burstweaver' || e.type === 'broodmother');
}

// ============ ASHEN ROVER BARKS — aether-hound woof/grr (ally; mute-aware) ============
const ROVER_BARK_LINES = {
  alert:  ['woof!', 'rrf?', 'alert!', 'here!'],
  attack: ['grr!', 'SNAP', 'rrarf!', 'bite!'],
  combat: ['woof', 'grr…', 'arf!', 'hunt!', 'rrf'],
  hurt:   ['yelp!', 'rrf!', 'hurt…'],
  fetch:  ['fetch!', 'got it!', 'arf!'],
};
function tryRoverBark(c, reason) {
  if (!c || c.type !== 'rover' || c.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' ? 0.25 : reason === 'attack' ? 1.2 : reason === 'hurt' ? 1.6 : reason === 'fetch' ? 2.2 : 4.2;
  if ((c._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.3) return;
  if (reason === 'combat' && Math.random() > 0.4) return;
  if (reason === 'attack' && Math.random() > 0.5) return;
  const lines = ROVER_BARK_LINES[reason] || ROVER_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  c._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'rover', throttle: 0.07 });
  addFloater(c.x, c.y - 28, line, '#4de1ff', false);
}

// ============ ASHEN WARDEN BARKS — deep armored robot guardian (ally; mute-aware) ============
// Original lines — not orc snarls, not dog woofs. Metallic vox / seal-protocol tone.
const WARDEN_BARK_LINES = {
  alert:  ['CONTACT', 'HOLD', 'SEALED', 'WARDEN'],
  attack: ['FIRE', 'PULSE', 'ENGAGE', 'CANNON'],
  combat: ['HOLD LINE', 'STANDING', 'LOCKED', 'SHIELD', 'AEGIS'],
  hurt:   ['BREACH', 'ARMOR HIT', 'DAMAGE'],
};
function tryWardenBark(c, reason) {
  if (!c || c.type !== 'warden' || c.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' ? 0.3 : reason === 'attack' ? 1.35 : reason === 'hurt' ? 1.8 : 4.5;
  if ((c._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.32) return;
  if (reason === 'combat' && Math.random() > 0.38) return;
  if (reason === 'attack' && Math.random() > 0.48) return;
  const lines = WARDEN_BARK_LINES[reason] || WARDEN_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  c._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'warden', throttle: 0.08 });
  addFloater(c.x, c.y - 42, line, '#e8c84a', false);
}

// ============ ASHEN SCOUT BARKS — bright ranger recon chirp (ally; mute-aware) ============
// Original lines — not orc snarls, not dog woofs, not Warden tank vox. Scout/archer tone.
const SCOUT_BARK_LINES = {
  alert:  ['MARKED', 'SPOTTED', 'RANGE', 'TRACK'],
  attack: ['LOOSE!', 'DRAW', 'ARROW', 'FLANK'],
  combat: ['ON POINT', 'COVERING', 'SCOUT', 'RECON', 'CLEAR'],
  hurt:   ['HIT!', 'FALL BACK', 'PLATE CRACK'],
  pack:   ['SUPPLY', 'PACK DROP', 'RELOAD'],
};
function tryScoutBark(c, reason) {
  if (!c || c.type !== 'scout' || c.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' ? 0.28 : reason === 'attack' ? 1.25 : reason === 'hurt' ? 1.7 : reason === 'pack' ? 2.4 : 4.3;
  if ((c._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.3) return;
  if (reason === 'combat' && Math.random() > 0.4) return;
  if (reason === 'attack' && Math.random() > 0.5) return;
  const lines = SCOUT_BARK_LINES[reason] || SCOUT_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  c._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'scout', throttle: 0.07 });
  addFloater(c.x, c.y - 36, line, '#9d6cff', false);
}

// ============ ASHEN SENTINEL BARKS — militia spear line-holder (ally; mute-aware) ============
// Original lines — not orc snarls, not dog, not Scout recon, not Warden tank vox.
const SENTINEL_BARK_LINES = {
  alert:  ['LINE!', 'SPEAR UP', 'HOLD', 'FRONT'],
  attack: ['THRUST!', 'PIERCE', 'STRIKE', 'LOOSE'],
  combat: ['HOLD THE LINE', 'BRACE', 'SPEARS', 'STAND', 'ASHEN'],
  hurt:   ['HIT!', 'PLATE!', 'STILL STANDING'],
};
function trySentinelBark(c, reason) {
  if (!c || c.type !== 'sentinel' || c.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' ? 0.3 : reason === 'attack' ? 1.3 : reason === 'hurt' ? 1.75 : 4.4;
  if ((c._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.31) return;
  if (reason === 'combat' && Math.random() > 0.38) return;
  if (reason === 'attack' && Math.random() > 0.48) return;
  const lines = SENTINEL_BARK_LINES[reason] || SENTINEL_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  c._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'sentinel', throttle: 0.08 });
  addFloater(c.x, c.y - 40, line, '#ffb02e', false);
}

// Muster militia — cheap synth grunts (reuse sentinel timbre; mute-aware)
const MILITIA_BARK_LINES = {
  attack: ['HIT!', 'STRIKE', 'NOW!', 'PUSH'],
  hurt:   ['UGH!', 'HIT!', 'HOLD'],
};
function tryMilitiaBark(m, reason) {
  if (!m || m.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'attack' ? 1.4 : reason === 'hurt' ? 1.8 : 4;
  if ((m._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.34) return;
  if (reason === 'attack' && Math.random() > 0.45) return;
  const lines = MILITIA_BARK_LINES[reason] || MILITIA_BARK_LINES.attack;
  const line = lines[(Math.random() * lines.length) | 0];
  m._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'sentinel', throttle: 0.09 });
  addFloater(m.x, m.y - 34, line, '#c8a06a', false);
}

// ============ ASHEN LABORER BARKS — stocky worker grunts (workers≠squad; mute-aware) ============
// Original lines — not orc, not dog, not Scout/Warden/Sentinel squad vox.
const LABORER_BARK_LINES = {
  alert:  ['BACK!', 'WATCH IT', 'HEAVE', 'CLEAR'],
  work:   ['CHOP', 'ORE', 'HEAVE', 'SWING', 'BACK TO WORK'],
  attack: ['HEAVE!', 'SWING!', 'BACK OFF', 'OOF'],
  combat: ['BACK TO WORK', 'HEAVE', 'STAND CLEAR', 'ORE'],
  hurt:   ['OOF', 'HIT!', 'UGH', 'PLATE'],
};
function tryLaborerBark(L, reason) {
  if (!L || L.downed || L.insideMine) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' ? 0.32 : reason === 'attack' ? 1.2 : reason === 'work' ? 2.6 : reason === 'hurt' ? 1.7 : 4.5;
  if ((L._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.32) return;
  if (reason === 'combat' && Math.random() > 0.36) return;
  if (reason === 'attack' && Math.random() > 0.5) return;
  if (reason === 'work' && Math.random() > 0.45) return;
  const lines = LABORER_BARK_LINES[reason] || LABORER_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  L._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'laborer', throttle: 0.08 });
  addFloater(L.x, L.y - 28, line, '#4de1ff', false);
}

// ============ AETHER COLOSSUS BARKS — deep rift titan (ally; mute-aware) ============
// Original lines — not orc snarls, not Warden tank vox, not Scout recon.
const COLOSSUS_BARK_LINES = {
  alert:  ['ASSEMBLED', 'TITAN', 'RIFT CORE', 'ONLINE'],
  attack: ['CRUSH', 'CLEAVE', 'AETHER', 'STRIKE'],
  combat: ['HOLD', 'STANDING', 'CORE STABLE', 'VANGUARD', 'PLATES LOCK'],
  hurt:   ['CORE HIT', 'PLATE BREACH', 'DAMAGE'],
  down:   ['CORE DIM', 'UNBIND'],
  deploy: ['DEPLOY', 'TITAN OUT'],
  recall: ['DOCKING', 'RECALL'],
};
function tryColossusBark(c, reason) {
  if (!c || c.downed) return;
  const now = performance.now() / 1000;
  const minGap = reason === 'alert' || reason === 'deploy' ? 0.35
    : reason === 'attack' ? 1.5
    : reason === 'hurt' ? 1.9
    : reason === 'recall' || reason === 'down' ? 0.4
    : 4.8;
  if ((c._barkAt || 0) + minGap > now) return;
  if (now - _barkGlobalT < 0.34) return;
  if (reason === 'combat' && Math.random() > 0.36) return;
  if (reason === 'attack' && Math.random() > 0.45) return;
  const lines = COLOSSUS_BARK_LINES[reason] || COLOSSUS_BARK_LINES.combat;
  const line = lines[(Math.random() * lines.length) | 0];
  c._barkAt = now;
  _barkGlobalT = now;
  sfx.play('bark', { voice: 'colossus', throttle: 0.09 });
  addFloater(c.x, c.y - 72, line, '#e0b8ff', true);
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
const FLOAT_BTN_IDS = ['btnTalk', 'btnMend', 'btnMenu', 'btnSettings', 'btnBike']; // fixed-position controls outside the grid

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

function hydrateLaborerSave(L, squadSide) {
  return {
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
    squadSide: !!squadSide,
  };
}
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
    // BETA-3.1 step 3 — squad-side workers (own wood/gold; not player laborers)
    squadLaborers: squadLaborers.map(L => ({
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
        rate: (m.sk && m.sk.rate) || 0,
        magnet: (m.sk && m.sk.magnet) || 0,
      },
    })),
    barricades: barricades.map(b => ({
      x: b.x, y: b.y, r: b.r, hp: b.hp, maxHp: b.maxHp, baseHp: b.baseHp,
      upRate: b.upRate || 0, upRange: b.upRange || 0, upDmg: b.upDmg || 0, upRocket: b.upRocket || 0,
    })),
    brickWalls: brickWalls.map(w => ({
      x: w.x, y: w.y, r: w.r, hp: w.hp, maxHp: w.maxHp, baseHp: w.baseHp,
    })),
    waveTrainLeft,
    goldMines: goldMines.map(g => ({
      x: g.x, y: g.y, r: g.r,
      goldLeft: g.goldLeft, maxGold: g.maxGold,
      name: g.name || 'Gold Mine',
      exterior: g.exterior ? true : undefined,
    })),
    coalMines: coalMines.map(g => ({
      x: g.x, y: g.y, r: g.r,
      coalLeft: g.coalLeft, maxCoal: g.maxCoal,
      name: g.name || 'Coal Mine',
      exterior: true, resource: 'coal',
    })),
    // Continuity — Aether Colossus persist (owned / docked / downed / hp)
    colossus: colossusOwned ? {
      owned: true,
      docked: !colossus,
      downed: !!(colossus && colossus.downed),
      hp: colossus ? colossus.hp : colossusDockHp,
      maxHp: COLOSSUS_MAX_HP,
      x: colossus ? colossus.x : 0,
      y: colossus ? colossus.y : 0,
      facing: colossus ? (colossus.facing || 1) : 1,
    } : { owned: false },
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
    laborers = town.laborers.filter(L => L).map(L => hydrateLaborerSave(L, false));
  }
  if (Array.isArray(town.squadLaborers)) {
    squadLaborers = town.squadLaborers.filter(L => L).map(L => hydrateLaborerSave(L, true));
  } else {
    squadLaborers = [];
  }
  laborerIdSeq = Math.max(
    laborers.reduce((m, L) => Math.max(m, L.id || 0), 0),
    squadLaborers.reduce((m, L) => Math.max(m, L.id || 0), 0)
  ) + 1;
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
          rate: clamp(sk.rate || 0, 0, 3),
          magnet: clamp(sk.magnet || 0, 0, 3),
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
      upRate: clamp(b.upRate || 0, 0, SENTRY_UP_MAX),
      upRange: clamp(b.upRange || 0, 0, SENTRY_UP_MAX),
      upDmg: clamp(b.upDmg || 0, 0, SENTRY_UP_MAX),
      upRocket: clamp(b.upRocket || 0, 0, SENTRY_UP_MAX),
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
    // Keep exterior scaffold from buildWorld — old saves omit them
    const exteriorScaffold = goldMines.filter(g => g.exterior);
    goldMines = town.goldMines.filter(g => g).map(g => ({
      x: +g.x, y: +g.y, r: g.r || 28,
      goldLeft: Math.max(0, +g.goldLeft || 0),
      maxGold: Math.max(1, +g.maxGold || +g.goldLeft || 1),
      occupied: 0, name: g.name || 'Gold Mine',
      exterior: !!g.exterior,
    }));
    for (const m of exteriorScaffold) {
      if (!goldMines.some(g => dist2(g.x, g.y, m.x, m.y) < 48 * 48))
        goldMines.push(m);
    }
    goldVeins = goldMines;
  }
  if (Array.isArray(town.coalMines) && town.coalMines.length) {
    const scaffold = coalMines.slice();
    coalMines = town.coalMines.filter(g => g).map(g => ({
      x: +g.x, y: +g.y, r: g.r || 28,
      coalLeft: Math.max(0, +g.coalLeft || 0),
      maxCoal: Math.max(1, +g.maxCoal || +g.coalLeft || 1),
      occupied: 0, name: g.name || 'Coal Mine',
      exterior: true, resource: 'coal',
    }));
    for (const m of scaffold) {
      if (!coalMines.some(g => dist2(g.x, g.y, m.x, m.y) < 48 * 48))
        coalMines.push(m);
    }
  }
  // Additive colossus persist (old saves omit → unowned)
  colossusOwned = false;
  colossus = null;
  colossusDockHp = 0;
  const cs = town.colossus;
  if (cs && cs.owned) {
    colossusOwned = true;
    const maxHp = COLOSSUS_MAX_HP;
    const hp = clamp(+cs.hp || maxHp, 0, maxHp);
    colossusDockHp = hp;
    if (!cs.docked) {
      colossus = makeColossusEntity(+cs.x || player.x, +cs.y || player.y, hp, !!cs.downed, cs.facing || 1);
    }
  }
}
function snapshot() {
  return {
    v: 2,
    wavesCompleted: waveActive ? wave - 1 : wave,
    cores, kills, totalCores, runTime, wood, gold, coal, fuel,
    player: { hp: player.hp, ki: player.ki, level: player.level, xp: player.xp, xpNext: player.xpNext, sp: player.sp },
    gear: gear.map(u => u.lvl),
    skills: { ...skillRanks },
    quest: { idx: questIdx, stage: questStage, progress: questProgress },
    mira: { idx: miraIdx, rewarded: miraRewarded },
    tally: { ...tally },
    fenceTier,
    sentryTier,
    loadout: { primary: loadout.primary, secondary: loadout.secondary },
    squad: {
      owned: { ...squad.owned }, active: { ...squad.active },
      sp: squadSp, cores: squadCores,
      wood: squadWood, gold: squadGold, // BETA-3.1 step 3 — squad gather banks
    },
    town: snapshotTown(),
    // v4.0.0 Step 6.0–6.3 — additive world scaffold + exterior fog (old saves omit discovered)
    // v4.0.2 Step 7.1 — exteriorHarvest stub (sites rebuild in buildWorld; chop AI live, mine = 7.2)
    world: {
      version: WORLD_VERSION,
      extended: CONTINUOUS_MAP_ENABLED,
      legacyWorld: { x: LEGACY_WORLD.x, y: LEGACY_WORLD.y, w: LEGACY_WORLD.w, h: LEGACY_WORLD.h },
      fogMode: getFogDiscoveryMode(),
      discovered: snapshotFogDiscovered(),
      exteriorHarvest: EXTERIOR_HARVEST_ENABLED ? {
        enabled: true,
        stands: forestStands.filter(s => s.exterior).map(s => ({ id: s.id, x: s.x, y: s.y })),
        mines: goldMines.filter(g => g.exterior).map(g => ({ x: g.x, y: g.y })),
        coalMines: EXTERIOR_COAL_ENABLED
          ? coalMines.map(g => ({ x: g.x, y: g.y }))
          : undefined,
        bike: DIRT_BIKE_ENABLED ? {
          owned: !!bike.owned,
          parkX: +bike.parkX || 0,
          parkY: +bike.parkY || 0,
          parkHoldId: bike.parkHoldId || null,
        } : undefined,
      } : undefined,
      // Step 10.3 — additive skiff node (plan schema; free rowing = no fuel field). Step 10.4
      // adds isleCacheOpened (one-time ferry cache claim). Old saves simply omit → wreck
      // state + unclaimed cache; a 4.3.4 node without the flag loads unclaimed the same way.
      lake: (BOAT_ENABLED && LAKE_WATER_ENABLED) ? {
        boatOwned: !!boat.owned,
        moorX: +boat.x || 0,
        moorY: +boat.y || 0,
        moorDockId: boat.moorDockId || null,
        isleCacheOpened: !!isleCacheOpened,
      } : undefined,
      holds: npcHolds.map(h => ({
        id: h.id, visited: !!h.visited,
        recruited: !!h.recruited, refusedEarly: !!h.refusedEarly, allegiance: !!h.allegiance,
        gauntletDone: !!h.gauntletDone, gauntletWave: h.gauntletWave | 0,
        gauntletActive: !!h.gauntletActive, gauntletT: +h.gauntletT || 0,
        ageT: +h.ageT || 0, // 4.1.1 — auto-graduation clock
        orangeSp: h.orangeSp | 0, orangeCores: h.orangeCores | 0,
        coal: h.coal | 0, // 8.1
        unlocked: h.unlocked ? { ...h.unlocked } : undefined,
        defenses: (h.defenses || []).map(d => ({ x: d.x, y: d.y, r: d.r, hp: d.hp, maxHp: d.maxHp })),
        villageSeeded: !!h.villageSeeded,
        structures: (h.structures || []).map(s => ({
          id: s.id, kind: s.kind, x: s.x, y: s.y, r: s.r, hp: s.hp, maxHp: s.maxHp,
        })),
        buildQueue: (h.buildQueue || []).map(q => ({ kind: q.kind })),
        activeBuild: h.activeBuild ? {
          kind: h.activeBuild.kind, x: h.activeBuild.x, y: h.activeBuild.y, r: h.activeBuild.r,
          progress: h.activeBuild.progress, buildSec: h.activeBuild.buildSec,
        } : undefined,
        units: holdUnits.filter(u => u.holdId === h.id).map(u => ({
          type: u.type, x: u.x, y: u.y, hp: u.hp, maxHp: u.maxHp, downed: !!u.downed, uid: u.uid,
        })),
        laborers: holdLaborers.filter(L => L.holdId === h.id).map(L => ({
          id: L.id, x: L.x, y: L.y, hp: L.hp, downed: !!L.downed,
        })),
        captain: h.captain ? {
          x: h.captain.x, y: h.captain.y, xp: h.captain.xp | 0, name: h.captain.name,
          hp: h.captain.hp != null ? Math.round(h.captain.hp) : undefined, // 4.1.2
        } : undefined,
        showcaseDone: !!h.showcaseDone, // 4.1.2 — first-contact build already delivered
        captainLevel: h.captainLevel | 0,
        growthStage: h.growthStage | 0,
        captainQueueSeeded: !!h.captainQueueSeeded,
        learnGauntletDone: !!h.learnGauntletDone,
        learnGauntletWave: h.learnGauntletWave | 0,
        learnGauntletActive: !!h.learnGauntletActive,
        learnProbeCd: +h.learnProbeCd || 0,
        orangeQuarterMigrated: !!h.orangeQuarterMigrated,
      })),
    },
  };
}
function saveGame(announce) {
  wdMark('save'); // 4.1.2 watchdog — attribute serialization stalls precisely
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot()));
    if (announce) addFloater(player.x, player.y - 46, '💾 GAME SAVED', '#7CFC00', true);
  } catch (e) {}
  wdMark('post-save');
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  let s;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!s || s.v !== 2) return false;
  const savedWorld = s.world || null;
  newGame();                       // clean world + fresh entities first
  wave = s.wavesCompleted;
  waveActive = false; spawnQueue = 0; enemies = []; graceT = 0; chest = null;
  cores = s.cores; kills = s.kills; totalCores = s.totalCores; runTime = s.runTime;
  wood = s.wood || 0; gold = s.gold || 0; coal = s.coal || 0; fuel = s.fuel || 0;
  gear.forEach((u, i) => u.lvl = s.gear[i] || 0);
  fenceTier = clamp(s.fenceTier || 1, 1, FENCE_MAX_TIER); // pre-2.7 saves default to tier 1
  sentryTier = clamp(s.sentryTier || 0, 0, SENTRY_MAX_TIER); // pre-2.8: no sentries
  Object.assign(skillRanks, s.skills);
  // v2.8 squad + weapon loadout (older saves simply have neither)
  const sq = s.squad || {};
  squad = { owned: { ...(sq.owned || {}) }, active: { ...(sq.active || {}) } };
  // BETA-3.1 — additive squad wallets (old saves omit → 0)
  squadSp = Math.max(0, +(sq.sp) || 0);
  squadCores = Math.max(0, +(sq.cores) || 0);
  squadWood = Math.max(0, +(sq.wood) || 0);
  squadGold = Math.max(0, +(sq.gold) || 0);
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
  applyFogDiscoveryMode(resolveFogDiscoveryModeFromSave(savedWorld));
  applyFogSave(savedWorld);
  applyHoldSave(savedWorld && savedWorld.holds);
  if (DIRT_BIKE_ENABLED && savedWorld) {
    const bs = (savedWorld.exteriorHarvest && savedWorld.exteriorHarvest.bike) || savedWorld.bike;
    if (bs) {
      bike.owned = !!bs.owned;
      bike.parkX = +bs.parkX || (bikeWreck && bikeWreck.x) || 0;
      bike.parkY = +bs.parkY || (bikeWreck && bikeWreck.y) || 0;
      bike.parkHoldId = bs.parkHoldId || null;
      bike.mounted = false;
      player.r = 15;
    }
  }
  // Step 10.3 — additive world.lake restore. Missing node (any ≤4.3.3 save) keeps newGame()'s
  // wreck state without throwing. Never load afloat: the rider spawns at camp dry (waterOk
  // false). NaN-sentinel style hull guard: a skiff saved mid-deep-water (wave-end autosave
  // while rowing) or with a garbage/dry position re-moors at the dock snap point, so the only
  // boat in the game can never strand out of walk-up reach.
  if (BOAT_ENABLED && LAKE_WATER_ENABLED && savedWorld && savedWorld.lake) {
    const ls = savedWorld.lake;
    boat.mounted = false;
    player.waterOk = false;
    boat.owned = !!ls.boatOwned;
    // Step 10.4 — one-time ferry cache claim. 4.3.4 nodes lack the field → unclaimed.
    isleCacheOpened = !!ls.isleCacheOpened;
    if (boat.owned) {
      boatWreck = null; // wreck stays cleared once restored
      boat.x = +ls.moorX;
      boat.y = +ls.moorY;
      boat.moorDockId = ls.moorDockId || null;
      boat.ang = Math.atan2(LAKE_DOCK.ay, LAKE_DOCK.ax);
      if (boat.moorDockId === 'emberfall') {
        boat.x = LAKE_DOCK.moorX; boat.y = LAKE_DOCK.moorY; // berth is exact — ignore drift
      } else if (boat.moorDockId === 'isle' && isleContentActive()) {
        boat.x = LAKE_ISLE_PIER.moorX; boat.y = LAKE_ISLE_PIER.moorY; // 10.4 — isle berth is exact too
        boat.ang = Math.atan2(LAKE_ISLE_PIER.ay, LAKE_ISLE_PIER.ax);   // (round-trips like the isle-
        // shallow beaching 10.3 already allowed; rowing back out re-pairs rider and hull)
      } else if (!(Number.isFinite(boat.x) && Number.isFinite(boat.y) && isLakeShallowAt(boat.x, boat.y))) {
        boat.x = LAKE_DOCK.moorX; boat.y = LAKE_DOCK.moorY; // unreachable/invalid → re-moor
        boat.moorDockId = 'emberfall';
      }
    }
  }
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
  if ($('togWaveCoachSkip')) $('togWaveCoachSkip').classList.toggle('on', !!settings.waveCoachSkip);
  if ($('rowFogMode')) {
    $('rowFogMode').style.display = FOG_DISCOVERY_ENABLED ? '' : 'none';
    if ($('fogModeVal')) $('fogModeVal').textContent = fogDiscoveryModeLabel(settings.fogDiscoveryMode);
  }
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
let coal = 0; // Step 8.1 — exterior coal stock
let fuel = 0; // Step 8.2 — bike fuel tank (burn on mount in 8.3)
let bikeWreck = null; // Step 8.3 — { x, y, smokeT } trailhead wreck
let bike = { owned: false, mounted: false, parkX: 0, parkY: 0, parkHoldId: null, walk: 0 };
let boatWreck = null; // Step 10.3 — { x, y, dripT } waterlogged skiff beached at Emberfall Dock
let boat = { owned: false, mounted: false, x: 0, y: 0, moorDockId: null, ang: 0, wakeT: 0, ashT: 0, ashWarned: false };
let isleCache = null;        // Step 10.4 — { x, y } Greywater ferry cache on Driftwood Isle (worldgen)
let isleCacheOpened = false; // Step 10.4 — one-time claim flag; persists as world.lake.isleCacheOpened
let isleTrees = [];          // Step 10.4 — refs into obstacles[] (the player-chop grove)
let isleChopT = 0;           // Step 10.4 — walk-up chop cadence timer
let squadSp = 0, squadCores = 0; // BETA-3.1 — squad-only wallets (not player SP/cores)
let squadWood = 0, squadGold = 0; // BETA-3.1 step 3 — squad gather banks (not player wood/gold)
let goldVeins = [];      // alias → goldMines
let goldMines = [];      // WC2-style mine buildings (v2.11)
let coalMines = [];      // Step 8.1 — exterior coal (gray/black gold-mine look)
let forestStands = [];   // dedicated choppable stands (v2.11)
let structures = [];     // Rift Keep / camps / halls
let laborers = [];       // Ashen Laborers — workers ONLY (never squad slots)
let squadLaborers = [];  // BETA-3.1 step 3 — squad-side workers (own banks; still ≠ combat squad slots)
let militia = [];        // Muster combat squad (grows +3/wave)
let waveTrainLeft = 3;
let laborerIdSeq = 1;
let militiaIdSeq = 1;
let colossus = null;     // Aether Colossus ally (null = docked or never unlocked)
let colossusOwned = false; // persist unlock — call out/back; not destroyed on recall
let colossusDockHp = 0;    // HP stored while docked
let buildPickOpen = false, structPanelOpen = false, selectedStructure = null;
let selectedBarricade = null; // sentry / fence post select panel (reuses structPanel DOM)
let unitPanelOpen = false, selectedUnit = null;
let rtsTipShown = false;
// Continuity v4.0.0 Step 1 — short in-run How-to-Play coach (waves 1–5)
const WAVE_COACH_ENABLED = true;
const WAVE_COACH_HOLD = 9.2; // tip visible duration; fades near end (non-blocking)
const WAVE_COACH_LESSONS = {
  1: {
    id: '1-1', title: '1-1 MOVE & FIGHT',
    touch: 'Left thumb = move · FIRE = shoot · auto-aim helps',
    desk: 'WASD move · mouse aim · click / hold to fire',
    targets: ['joyZone', 'btnFire'],
  },
  2: {
    id: '1-2', title: '1-2 BUILD',
    touch: 'BUILD → pick → tap to place (horde freezes)',
    desk: 'B opens BUILD · aim · click to place (horde freezes)',
    targets: ['btnBuild'],
  },
  3: {
    id: '1-3', title: '1-3 UPGRADE',
    touch: 'Loot ⬡ 🪵 ◈ · spend in field lab & ✦ SKILLS',
    desk: 'Loot cores / wood / gold · K skills · shop between waves',
    targets: ['coreNum', 'btnMenu'],
  },
  4: {
    id: '1-4', title: '1-4 SQUAD',
    touch: 'Companions + COLOSSUS (C) — light intro, trees later',
    desk: 'Companions fight with you · C / COLOSSUS for the titan',
    targets: ['btnColossus', 'squadNum'],
  },
  5: {
    id: '1-5', title: '1-5 BOSS READY',
    touch: 'Wave %5 = Gharok — first boss beat. Focus fire!',
    desk: 'Every 5th wave: Gharok. This is your first boss beat.',
    targets: ['waveNum'],
  },
};
let waveCoach = { active: false, wave: 0, t: 0, targetI: 0, fingerReady: false };
let camera = { x: 0, y: 0, shake: 0 };
let enemies = [], bolts = [], ebolts = [], grenades = [], pickups = [], particles = [], floaters = [], zaps = [];
// 4.1.2 FREEZE FIX — per-frame enemy spatial buckets. Enemy↔enemy separation was
// O(n²) (waves scale 6 + wave×3.2 + squad size → 150–250 live at deep waves = 30–60k
// pairs/frame) and militia/sentry target scans were militia×enemies linear passes.
const ENEMY_GRID_CELL = 128;
let enemyGridMap = new Map();
function rebuildEnemyGrid() {
  enemyGridMap.clear();
  for (const e of enemies) {
    if (e.dead) continue;
    const key = ((e.x / ENEMY_GRID_CELL) | 0) * 8192 + ((e.y / ENEMY_GRID_CELL) | 0);
    const cell = enemyGridMap.get(key);
    if (cell) cell.push(e); else enemyGridMap.set(key, [e]);
  }
}
/** Visit live enemies within r of (x,y) — same candidates a full scan would keep. */
function forEachEnemyNear(x, y, r, fn) {
  const gx0 = ((x - r) / ENEMY_GRID_CELL) | 0, gx1 = ((x + r) / ENEMY_GRID_CELL) | 0;
  const gy0 = ((y - r) / ENEMY_GRID_CELL) | 0, gy1 = ((y + r) / ENEMY_GRID_CELL) | 0;
  const r2 = r * r;
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    const cell = enemyGridMap.get(gx * 8192 + gy);
    if (!cell) continue;
    for (const e of cell) {
      if (e.dead) continue;
      if (dist2(x, y, e.x, e.y) <= r2) fn(e);
    }
  }
}
let beam = null, beamCharge = 0, charging = false;
let spawnQueue = 0, spawnTimer = 0, waveActive = false;
let shopTimer = 0, victoryShown = false;
let waveCatsUsed = new Set(); // for the "Adaptive Doctrine" quest
let chest = null;             // end-of-wave supply cache {x,y,t}
let graceT = 0;               // looting window between wave end and shop
let barricades = [];          // player-built energy fences {x,y,r,hp,maxHp,baseHp,neighbors}
let pulseCd = 0;              // cooldown for the barricade exit-blast
// Place caps raised generously (costs unchanged) — Continuity post-3.1.0
const BARRICADE_MAX = 80, BARRICADE_COST = 3, BARRICADE_HP = 160;
const BARRICADE_BASE_R = 34;
const BARRICADE_LINK_DIST = 86; // centers within this count as adjacent (linked)
const BARRICADE_MIN_GAP = 52;   // allow closer placement so posts can touch/link
// Cloister / brick stronghold walls — systems ON for master Continuity testing;
// store ship deferred with town-save + art batch (no APK / no version bump).
const BRICKWALL_ENABLED = true;
const BRICKWALL_SPRITE_ENABLED = true; // soft art; procedural fallback if sheets fail
let brickWalls = []; // pillars {x,y,r,hp,maxHp,baseHp,neighbors,links:{n,e,s,w}}
let buildGhostKind = 'barricade'; // 'barricade' | 'brickwall' | 'structure' — aim ghost mode
let buildPlaceMode = false;       // BETA-3.1 step 5 — selected BUILD item, awaiting tap confirm
let buildPlacePaused = false;     // freezes enemies + squad combat AI + ebolts + spawn while placing (not full game pause)
let buildPlaceStructKind = null;  // STRUCT_KINDS key when buildGhostKind === 'structure'
const BRICKWALL_MAX = 80; // was 16 — quantity only; costs unchanged
const BRICKWALL_COST = { wood: 10, gold: 4, cores: 2 };
const BRICKWALL_HP = 280; // tougher than energy barricade (160)
const BRICKWALL_PILLAR_R = 18;
const BRICKWALL_LINK_DIST = 96;
const BRICKWALL_MIN_GAP = 58;
const BRICKWALL_SEG_THICK = 14;
const BRICKWALL_CARDINAL_TOL = 30;
const BRICKWALL_SPRITE_DRAWH = 44; // pillar draw height (feet at y)
const BRICKWALL_SEG_DRAWH = 36;
// Visual join: segment ends tuck into cropped pillar body.
// Root cause of “disconnected” look: pillars drew full 512×512 (opaque ~98×274
// centered) while segments used opaque crop — visual pillar half-width ≈8px vs
// old INSET=11 left a gap. Crop pillars + lower inset so straights/corners/T meet flush.
const BRICKWALL_SEG_INSET = 4;
const BRICKWALL_SEG_CROP = { sx: 82, sy: 234, sw: 348, sh: 266 };
const BRICKWALL_PILLAR_CROP = { sx: 207, sy: 228, sw: 98, sh: 274 };
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
// Per-barricade turret upgrades (click barricade panel) — stack on global uplink
const SENTRY_UP_MAX = 3;
const SENTRY_UP_COSTS = {
  rate:   [36, 64, 100],
  range:  [40, 72, 110],
  dmg:    [44, 80, 125],
  rocket: [70, 120, 190],
};
function barricadeSentryRange(b) {
  return sentryRange() * (1 + 0.14 * ((b && b.upRange) || 0));
}
function barricadeSentryInterval(b) {
  return sentryInterval() / (1 + 0.16 * ((b && b.upRate) || 0));
}
function barricadeSentryDamage(b) {
  return sentryDamage() * (1 + 0.2 * ((b && b.upDmg) || 0));
}

// =========================== PLAYER ===============================
const player = {};
function resetPlayer() {
  Object.assign(player, {
    x: CAMP.x, y: CAMP.y + 120, r: 15, vx: 0, vy: 0,
    hp: 100, ki: 30,
    waterOk: false,      // 10.3 — true only while the Rift Skiff carries the player
    aim: 0, facing: 1, walk: 0, moving: false,
    fireCd: 0, fire2Cd: 0, novaCd: 0, grenCd: 0, dashCd: 0, dashT: 0,
    grenades: 3,
    form: 0,             // 0 base · 1 Ascended · 2 Storm Ascendant
    xp: 0, level: 1, xpNext: 60, sp: 0,
    hurtT: 0,
    webSlowT: 0, webSlowMul: 1, // Burstweaver web slow
    poisonT: 0, poisonDps: 0, poisonKiDps: 0, // Burstweaver bite venom
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
function moveSpeed()     {
  let s = 235 * (1 + .08 * gearLvl('boots') + .08 * sk('s2')) * (player.form ? 1.25 : 1);
  if ((player.webSlowT || 0) > 0) s *= (player.webSlowMul || BURSTWEAVER_WEB_SLOW_MUL);
  if (bike.mounted) s *= DIRT_BIKE_SPEED_MUL;
  if (boat.mounted) s *= BOAT_SPEED_MUL; // 10.3 — skiff drift top; the bike stays the fast one
  return s;
}
function kiRegen()       { return (3.5 + 1.1 * gearLvl('ki')) * (1 + .4 * sk('a2')); }
function magnetRange()   { return 150 + 55 * sk('s3'); }
function squadMagnetRange() { return magnetRange(); } // base; per-unit nodes multiply via unitSquadMagnetRange
function isSquadPickup(p) { return p && (p.type === 'squad_sp' || p.type === 'squad_core'); }
// BETA-3.1 step 2 — per-unit squad-orb pull (companions via COMP_NODES; militia via m.sk.magnet)
function unitSquadMagnetRange(u) {
  let mul = 1;
  if (u && u.type) {
    if (u.type === 'rover') mul += 0.20 * sk('cr4');
    else if (u.type === 'warden') mul += 0.20 * sk('cw5');
    else if (u.type === 'scout') mul += 0.20 * sk('cs5');
    else if (u.type === 'sentinel') mul += 0.20 * sk('cn5');
  } else if (u && u.sk) {
    mul += 0.18 * (u.sk.magnet || 0);
  }
  return squadMagnetRange() * mul;
}
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
// Gharok; heavy hits / accumulated damage still shove.
// Wave knockback resistance (post-3.1.0 Continuity): every 20 waves, non-bosses
// need +1 hit before a shove applies. Waves 1–19: 1 hit (unchanged); 20–39: 2;
// 40–59: 3; … Bosses keep the mass/kbPool path (not the hit-count ladder).
function knockHitsNeeded() {
  return 1 + Math.floor(wave / 20);
}
function applyKnock(e, kbx, kby, kb, hitDmg) {
  if (!kb || (!kbx && !kby)) return;
  // Gharok + decade bosses: mass pool (not the wave hit-ladder). Decade mass < Gharok.
  if (e.boss || e.decadeBoss) {
    e.kbPool = (e.kbPool || 0) + hitDmg;
    const decadeIdx = e.decadeBoss ? Math.max(1, (e.decadeTier || 10) / 10) : 0;
    const mass = e.boss ? 16 : 9 + decadeIdx * 0.7;
    let force = kb / mass;
    if (hitDmg < 18) force *= 0.12;       // pulse-rifle ticks
    else if (hitDmg < 35) force *= 0.32;  // medium hits
    else force *= 0.55;                   // nova / grenade / gusher
    if (e.kbPool < 90 && hitDmg < 40) force *= 0.22; // need a shove threshold
    if (e.kbPool >= 90) e.kbPool = 0;
    e.vx += kbx * force;
    e.vy += kby * force;
    return;
  }
  // 4.1.1 — Ashen Burstweaver counts as HEAVY (r=42, between Ravager 36 and Gharok 54):
  // +1 hit on the wave shove ladder and a 0.6× dampened shove, so sustained rifle fire
  // can no longer perma-stagger it before the kit matters. Consistent with UNIT_SIZES.
  const heavy = e.type === 'burstweaver' || e.type === 'broodmother';
  const kbMul = heavy ? 0.6 : 1;
  const need = knockHitsNeeded() + (heavy ? 1 : 0);
  if (need <= 1) {
    e.vx += kbx * kb * kbMul; e.vy += kby * kb * kbMul;
    return;
  }
  e.kbHits = (e.kbHits || 0) + 1;
  if (e.kbHits < need) return; // accumulate hits; no shove yet
  e.kbHits = 0;
  e.vx += kbx * kb * kbMul; e.vy += kby * kb * kbMul;
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
// Companion skill trees — ranks in skillRanks (save Continuity).
// BETA-3.1 step 2: spend squadSp (✧), NOT player.sp. squadCores unused this step.
const COMP_NODES = {
  rover: [
    { id: 'cr1', name: 'Overvolt Fangs',   desc: '+35% bite damage / rank', max: 2 },
    { id: 'cr2', name: 'Fetch Protocol',   desc: '+80% core-fetch radius',  max: 1 },
    { id: 'cr3', name: 'Plated Chassis',   desc: '+40 max HP / rank', max: 2 },
    { id: 'cr4', name: 'Orb Sniffer',      desc: '+20% squad-orb magnet / rank', max: 2 },
    { id: 'cr5', name: 'Snap Jaws',        desc: '+15% attack rate / rank', max: 2 },
  ],
  warden: [
    { id: 'cw1', name: 'Rapid Capacitors', desc: '+25% cannon fire rate / rank', max: 2 },
    { id: 'cw2', name: 'Menace Beacon',    desc: '+45% taunt radius — more enemies attack Warden', max: 1 },
    { id: 'cw3', name: 'Bulk Frame',       desc: '+50 max HP / rank', max: 2 },
    { id: 'cw4', name: 'Pulse Focus',      desc: '+20% cannon damage / rank', max: 2 },
    { id: 'cw5', name: 'Orb Beacon',       desc: '+20% squad-orb magnet / rank', max: 2 },
  ],
  scout: [
    { id: 'cs1', name: 'Field Medkits',    desc: '+50% pack healing, faster drops / rank', max: 2 },
    { id: 'cs2', name: 'Lancer Bolts',     desc: 'Crossbow bolts pierce one extra enemy',  max: 1 },
    { id: 'cs3', name: 'Ranger Vitality',  desc: '+35 max HP / rank', max: 2 },
    { id: 'cs4', name: 'Quickdraw',        desc: '+18% fire rate / rank', max: 2 },
    { id: 'cs5', name: 'Loot Sense',       desc: '+20% squad-orb magnet / rank', max: 2 },
  ],
  sentinel: [
    { id: 'cn1', name: 'Spear Drill',      desc: '+30% bolt damage / rank', max: 2 },
    { id: 'cn2', name: 'Hold the Line',    desc: '+40 max HP · slight taunt aura', max: 1 },
    { id: 'cn3', name: 'Line Discipline',  desc: '+18% attack rate / rank', max: 2 },
    { id: 'cn4', name: 'Ash Plate',        desc: '+30 max HP / rank', max: 2 },
    { id: 'cn5', name: 'Muster Sense',     desc: '+20% squad-orb magnet / rank', max: 2 },
  ],
};
const COMP_SQ_SP_COST = 1; // ✧ per companion rank (balanced; not OP)
let squad = { owned: {}, active: {} };
let companions = [], cbolts = [];
const tauntRadius    = () => 240 * (1 + 0.45 * sk('cw2'));
const fetchRadius    = () => 260 * (1 + 0.8 * sk('cr2'));
const scoutPackDelay = () => Math.max(8, 16 - 3 * sk('cs1'));
const scoutPierce    = () => 2 + sk('cs2');
function compBonusHp(type) {
  if (type === 'rover') return 40 * sk('cr3');
  if (type === 'warden') return 50 * sk('cw3');
  if (type === 'scout') return 35 * sk('cs3');
  if (type === 'sentinel') return 40 * sk('cn2') + 30 * sk('cn4');
  return 0;
}
function compDamage(c) {
  let d = COMP_TYPES[c.type].dmg;
  if (c.type === 'rover') d *= 1 + 0.35 * sk('cr1');
  if (c.type === 'warden') d *= 1 + 0.20 * sk('cw4');
  if (c.type === 'sentinel') d *= 1 + 0.30 * sk('cn1');
  return d;
}
function compInterval(c) {
  const t = COMP_TYPES[c.type];
  let rate = 1;
  if (c.type === 'warden') rate *= 1 + 0.25 * sk('cw1');
  if (c.type === 'rover') rate *= 1 + 0.15 * sk('cr5');
  if (c.type === 'scout') rate *= 1 + 0.18 * sk('cs4');
  if (c.type === 'sentinel') rate *= 1 + 0.18 * sk('cn3');
  return t.atk / rate;
}
function refreshCompanionStats() {
  for (const c of companions) {
    if (!COMP_TYPES[c.type]) continue;
    const next = COMP_TYPES[c.type].hp + compBonusHp(c.type);
    const gain = Math.max(0, next - c.maxHp);
    c.maxHp = next;
    if (!c.downed && gain > 0) c.hp = Math.min(c.maxHp, c.hp + gain);
  }
}
// keep runtime entities in lockstep with the owned+active flags
function syncCompanions() {
  companions = companions.filter(c => squad.owned[c.type] && squad.active[c.type]);
  for (const k of Object.keys(COMP_TYPES)) {
    if (!squad.owned[k] || !squad.active[k]) continue;
    if (companions.some(c => c.type === k)) continue;
    const t = COMP_TYPES[k];
    const hp = t.hp + compBonusHp(k);
    // Step 10.5 — reinforcements land dry: a squad toggled on while the player is afloat
    // or out on a pier spawns at the nearest shore point, never in the water
    const cp = lakeGuardSpawnPos(player.x + rand(-70, 70), player.y + rand(30, 80), 30);
    companions.push({
      type: k, x: cp.x, y: cp.y,
      vx: 0, vy: 0, r: k === 'rover' ? 11 : 13,
      hp, maxHp: hp, downed: false, hurtT: 0,
      atkCd: rand(0.3, 1), walk: rand(0, 9), facing: 1, aim: 0,
      packT: scoutPackDelay(), fetchCd: 0,
    });
  }
  refreshCompanionStats();
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
  if (c.type === 'rover') tryRoverBark(c, 'hurt');
  if (c.type === 'warden') tryWardenBark(c, 'hurt');
  if (c.type === 'scout') tryScoutBark(c, 'hurt');
  if (c.type === 'sentinel') trySentinelBark(c, 'hurt');
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
              tryRoverBark(c, 'fetch');
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
        if (!c._barkedAlert) {
          c._barkedAlert = true;
          tryRoverBark(c, 'alert');
        }
        c._barkCombatCd = (c._barkCombatCd || rand(3.2, 5.8)) - dt;
        if (c._barkCombatCd <= 0) {
          c._barkCombatCd = rand(4.0, 6.5);
          tryRoverBark(c, 'combat');
        }
        if (c.atkCd <= 0 && fd2 < (c.r + foe.r + 12) ** 2) {
          c.atkCd = compInterval(c);
          c.swipeT = UNIT_SWIPE;
          tryRoverBark(c, 'attack');
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, compDamage(c), (foe.x - c.x) / d, (foe.y - c.y) / d, 140);
          zap(c.x, c.y - 8, foe.x, foe.y - 10); // plasma-bite arc
          spawnParticles(foe.x, foe.y - 8, 5, '#4de1ff', 3);
        }
      } else {
        if (c.type === 'warden') {
          if (!c._barkedAlert) {
            c._barkedAlert = true;
            tryWardenBark(c, 'alert');
          }
          c._barkCombatCd = (c._barkCombatCd || rand(3.5, 6.2)) - dt;
          if (c._barkCombatCd <= 0) {
            c._barkCombatCd = rand(4.2, 7.0);
            tryWardenBark(c, 'combat');
          }
        } else if (c.type === 'scout') {
          if (!c._barkedAlert) {
            c._barkedAlert = true;
            tryScoutBark(c, 'alert');
          }
          c._barkCombatCd = (c._barkCombatCd || rand(3.3, 5.9)) - dt;
          if (c._barkCombatCd <= 0) {
            c._barkCombatCd = rand(4.0, 6.6);
            tryScoutBark(c, 'combat');
          }
        } else if (c.type === 'sentinel') {
          if (!c._barkedAlert) {
            c._barkedAlert = true;
            trySentinelBark(c, 'alert');
          }
          c._barkCombatCd = (c._barkCombatCd || rand(3.4, 6.0)) - dt;
          if (c._barkCombatCd <= 0) {
            c._barkCombatCd = rand(4.1, 6.8);
            trySentinelBark(c, 'combat');
          }
        }
        if (c.atkCd <= 0) {
          c.atkCd = compInterval(c);
          c.swipeT = UNIT_SWIPE * 0.7;
          if (c.type === 'warden') tryWardenBark(c, 'attack');
          if (c.type === 'scout') tryScoutBark(c, 'attack');
          if (c.type === 'sentinel') trySentinelBark(c, 'attack');
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
    }
    // ---- scout support packs ----
    if (c.type === 'scout') {
      c.packT -= dt;
      if (c.packT <= 0) {
        c.packT = scoutPackDelay();
        pickups.push({ x: player.x + rand(-50, 50), y: player.y + rand(-50, 50), type: 'pack', t: 0 });
        addFloater(c.x, c.y - 26, '⊕ supply pack', '#7CFC00', false);
        tryScoutBark(c, 'pack');
      }
    }
  });
  // ---- companion bolts (teal cannon shots / piercing crossbow bolts) ----
  for (const b of cbolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacleBlockedAt(b.x, b.y, 0, false)) { b.life = 0; continue; }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4 || b.hit.indexOf(e) >= 0) continue;
      if (dist2(b.x, b.y + 12, e.x, e.y) < (e.r + b.r + 5) ** 2) {
        directDamage(e, b.dmg, b.vx / 800, b.vy / 800, 70);
        b.hit.push(e);
        spawnParticles(b.x, b.y, 4, b.scout ? '#ffd7a8' : '#3ef0c8', 2);
        if (b.hit.length >= b.pierce) { b.life = 0; break; }
      }
    }
    if (b.holdProbeOnly && b.life > 0) {
      for (const e of holdProbes) {
        if (e.dead || e.holdId !== b.holdId || b.hit.indexOf(e) >= 0) continue;
        if (dist2(b.x, b.y + 12, e.x, e.y) < (e.r + b.r + 5) ** 2) {
          e.hp -= b.dmg;
          e.flash = 0.12;
          b.hit.push(e);
          if (e.hp <= 0 && !e.dead) killHoldProbe(e);
          spawnParticles(b.x, b.y, 4, '#ff9d2e', 2);
          if (b.hit.length >= b.pierce) { b.life = 0; break; }
        }
      }
    }
  }
  cbolts = cbolts.filter(b => b.life > 0);
}

// =========================== ENEMIES ==============================
// husk (shambler) · sprinter (fast ghoul) · shaman (ranged caster)
// ravager (ork brute) · warlord (twin-skulled war-brute boss / Gharok, every 5 waves)
// bulwark (two husks fused mid-wave) · skeleton (claws out of husk graves)
// decade bosses (every 10 waves): stacked tiered elites — see spawnDecadeBoss / decadeBossTiers

// boss claw slash (v2.8): wind-up is the dodge window; strike linger reads the follow-through
const CLAW_WINDUP = 0.7, CLAW_STRIKE = 0.28, CLAW_RANGE = 165, CLAW_CD = 5, CLAW_DMG_MUL = 1.5, CLAW_KB = 820;
// Contact-melee swipe telegraph for non-boss figures (visual only — hitbox unchanged)
const UNIT_SWIPE = 0.32;
// Ashen Ravager sprite gate — ON for BETA-3 Continuity apply batch (Play still 2.13.2).
// Flag true → soft-load sheets + r=36 / drawH=100 / s≈2.78 (between bulwark and Gharok).
const RAVAGER_SPRITE_ENABLED = true;
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
  // 7.4C — exterior-only; NEVER via spawnEdgePos / wave tables (bite dmg=14; web/poison/explode AOE — 7.4D polish)
  // 4.1.1 — hp 120 → 290 (×hpScale): it melted under focus fire before its kit mattered.
  // Kit/damage LOCKED per 7.4D; survivability only. Heavy knock rule in applyKnock.
  burstweaver: { r: BURSTWEAVER_R, hp: 290, spd: 58, dmg: 17, core: 4, xp: 22, ranged: false, exteriorOnly: true },
  broodmother: { r: BROODMOTHER_R, hp: 480, spd: 42, dmg: 22, core: 8, xp: 45, ranged: false, exteriorOnly: true },
  spiderling: { r: SPIDERLING_R, hp: 52, spd: 82, dmg: 9, core: 1, xp: 9, ranged: false, exteriorOnly: true },
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
    exteriorOnly: !!t.exteriorOnly,
    kbPlayer: t.kbPlayer || 0,
    atkCd: rand(0.5, 1.5), flash: 0, dead: false,
    walk: rand(0, 9), facing: 1, spawnT: 0.8,
    ...opts,
  };
  if (type === 'burstweaver' || type === 'broodmother' || type === 'spiderling') {
    e.exteriorOnly = true;
    e.dmg = Math.round(e.dmg * (1 + wave * SPIDER_WAVE_DMG_SCALE));
    e.spd *= 1 + wave * SPIDER_WAVE_SPD_SCALE;
  }
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

function spawnEdgePos() {
  const b = legacySpawnBounds();
  const xMin = b.x + 60, xMax = b.x + b.w - 60;
  const yMin = b.y + 60, yMax = b.y + b.h - 60;
  let x, y;
  if (Math.random() < 0.55) { // learning engine: rift opens near your camping spot
    const a = rand(0, TAU), d = rand(560, 800);
    x = clamp(campTrackX + Math.cos(a) * d, xMin, xMax);
    y = clamp(campTrackY + Math.sin(a) * d, yMin, yMax);
  } else {
    const side = (Math.random() * 4) | 0;
    x = side < 2 ? (side === 0 ? xMin : xMax) : rand(xMin, xMax);
    y = side < 2 ? rand(yMin, yMax) : (side === 2 ? yMin : yMax);
  }
  if (dist2(x, y, player.x, player.y) < 450 * 450) {
    const a = Math.atan2(y - player.y, x - player.x);
    x = clamp(player.x + Math.cos(a) * 480, xMin, xMax);
    y = clamp(player.y + Math.sin(a) * 480, yMin, yMax);
  }
  // Step 10.1 — never spawn in Ashmere: both branches (edge + learning ring) re-route
  // to the nearest dry shore; NaN-sentinel respawns ride this same call
  if (LAKE_SPAWN_GUARD_ENABLED && isLakeWaterAt(x, y)) {
    const dry = lakeNearestShore(x, y, 24);
    x = clamp(dry.x, xMin, xMax);
    y = clamp(dry.y, yMin, yMax);
  }
  return { x, y };
}

function spawnEnemy(type) {
  // Burstweaver is exterior-only — never route through legacy edge spawner / wave mix
  if (type === 'burstweaver' || type === 'broodmother' || type === 'spiderling') return null;
  const { x, y } = spawnEdgePos();
  const e = makeEnemy(type, x, y);
  if (!e.boss && !e.decadeBoss && wave >= ESC_WAVE) {
    const asc = enemies.filter(o => o.ascended && !o.dead).length;
    const pl  = enemies.filter(o => !o.boss && !o.decadeBoss && o.maxArmor && !o.dead).length;
    if (asc < ASC_CAP && Math.random() < ascChance()) makeAscended(e);
    else if (pl < PLATE_CAP && Math.random() < plateChance()) makePlated(e);
  }
  spawnParticles(x, y, 14, e.ascended ? '#ffd54a' : '#b04dff', 3);
}

// ---------- 7.4B Ashen Burstweaver — exterior-only spawn stub (no spawnEdgePos) ----------
/** 4.1.1 — deep-wave exterior pressure: two live weavers from wave 20 (perf fixed). */
function burstweaverMaxLive() {
  return wave >= 20 ? 2 : BURSTWEAVER_MAX_LIVE;
}
function countLiveBurstweavers() {
  let n = 0;
  for (const e of enemies) { if (e.type === 'burstweaver' && !e.dead) n++; }
  return n;
}

/** Step 7.5 Continuity (A): lives in enemies[] with exterior-only spawn gate — not parallel exteriorThreats[] (B).
 *  Rejects inLegacyWorld coords. Never uses spawnEdgePos. Returns enemy or null. */
function spawnBurstweaverAt(x, y) {
  if (!EXTERIOR_SPIDER_ENABLED || !CONTINUOUS_MAP_ENABLED) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (inLegacyWorld(x, y)) return null;
  if (x < 60 || y < 60 || x > WORLD.w - 60 || y > WORLD.h - 60) return null;
  if (countLiveBurstweavers() >= burstweaverMaxLive()) return null;
  const e = makeEnemy('burstweaver', x, y, {
    exteriorOnly: true, spawnT: 0.55,
    bwWebCd: rand(1.2, 2.4),
    bwBiteCd: rand(0.8, 1.6),
    bwExplodeCd: rand(BURSTWEAVER_EXPLODE_CD_MIN, BURSTWEAVER_EXPLODE_CD_MAX),
    bwSwellT: 0,
    bwSwellDur: 0,
    bwThreatT: 0,
  });
  spawnParticles(x, y, 14, '#c45a3a', 3);
  addFloater(x, y - 52, 'ASHEN BURSTWEAVER', '#e07040', false);
  return e;
}

function pickBurstweaverSpawnPos() {
  if (SPIDER_DEN_ENABLED) {
    const denPos = pickSpiderDenSpawnPos();
    if (denPos) return denPos;
  }
  const candidates = [];
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    const ang = rand(0, TAU);
    const d = h.halfW + h.halfH + rand(90, 180);
    const x = h.x + Math.cos(ang) * d;
    const y = h.y + Math.sin(ang) * d;
    if (!inLegacyWorld(x, y)) candidates.push({ x, y });
  }
  if (!inLegacyWorld(player.x, player.y)) {
    for (let i = 0; i < 4; i++) {
      const ang = rand(0, TAU);
      const d = rand(400, 640);
      const x = player.x + Math.cos(ang) * d;
      const y = player.y + Math.sin(ang) * d;
      if (!inLegacyWorld(x, y) && x > 60 && y > 60 && x < WORLD.w - 60 && y < WORLD.h - 60) {
        candidates.push({ x, y });
      }
    }
  }
  if (!candidates.length) return null;
  return candidates[(Math.random() * candidates.length) | 0];
}

function tickBurstweaverSpawn(dt) {
  if (!EXTERIOR_SPIDER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  burstweaverSpawnCd -= dt;
  if (burstweaverSpawnCd > 0) return;
  burstweaverSpawnCd = rand(BURSTWEAVER_SPAWN_CD_MIN, BURSTWEAVER_SPAWN_CD_MAX);
  if (countLiveBurstweavers() >= burstweaverMaxLive()) return;
  const playerExt = !inLegacyWorld(player.x, player.y);
  let nearHold = false;
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    if (dist2(player.x, player.y, h.x, h.y) < 980 * 980) { nearHold = true; break; }
  }
  let canSpawn = playerExt || nearHold;
  if (SPIDER_DEN_ENABLED && spiderDens.length) canSpawn = true;
  if (!canSpawn) return;
  const pos = pickBurstweaverSpawnPos();
  if (!pos) return;
  spawnBurstweaverAt(pos.x, pos.y);
}

/** 4.1.1 — leash: the spider refuses to cross into the legacy core, so a player who
 * stays inside used to leave it pacing the border forever (blocking the max-live cap
 * and, pre-4.1.1, the wave-clear check). If the player hides in legacy and stops
 * engaging it for BURSTWEAVER_LEASH_T seconds, it loses interest and skitters off
 * (despawn — no loot/credit; it left, you didn't kill it). */
const BURSTWEAVER_LEASH_T = 20;
function countWaveEnemiesRemaining() {
  let n = 0;
  for (const e of enemies) { if (!e.dead && !e.exteriorOnly) n++; }
  return n;
}
function countLiveAshSpiders() {
  let n = 0;
  for (const e of enemies) { if (!e.dead && isAshenSpiderType(e)) n++; }
  return n;
}
function nearestLegacyBorderStalkPoint(px, py) {
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const pad = 40;
  const cx = clamp(px, lx, lx + lw), cy = clamp(py, ly, ly + lh);
  const left = px - lx, right = (lx + lw) - px, top = py - ly, bot = (ly + lh) - py;
  const m = Math.min(left, right, top, bot);
  if (m === left) return { x: lx - pad, y: cy };
  if (m === right) return { x: lx + lw + pad, y: cy };
  if (m === top) return { x: cx, y: ly - pad };
  return { x: cx, y: ly + lh + pad };
}
function spiderSeekPoint(e, tgt) {
  if (!SPIDER_HUNT_ENABLED || !isAshenSpiderType(e)) return { x: tgt.x, y: tgt.y };
  if (inLegacyWorld(tgt.x, tgt.y) && !inLegacyWorld(e.x, e.y)) {
    return nearestLegacyBorderStalkPoint(tgt.x, tgt.y);
  }
  return { x: tgt.x, y: tgt.y };
}
function spiderWebRange(e) {
  const base = e.type === 'spiderling' ? SPIDERLING_WEB_RANGE : BURSTWEAVER_WEB_RANGE;
  if (!SPIDER_HUNT_ENABLED) return base;
  if (inLegacyWorld(player.x, player.y) && !inLegacyWorld(e.x, e.y)) {
    if (e.type === 'spiderling') return Math.round(SPIDER_BORDER_WEB_RANGE * 0.75);
    if (e.type === 'broodmother') return Math.round(SPIDER_BORDER_WEB_RANGE * 0.88);
    return SPIDER_BORDER_WEB_RANGE;
  }
  return base;
}
function spiderHuntMoveMul(e) {
  if (!SPIDER_HUNT_ENABLED || !isAshenSpiderType(e)) return 1;
  let mul = waveActive ? 1.14 : 1;
  const td = Math.hypot(player.x - e.x, player.y - e.y);
  if (td > 480) mul *= SPIDER_HUNT_SPEED_MUL;
  return mul;
}
function tickBurstweaverLeash(e, dt) {
  if (e.dead) return;
  if (waveActive && SPIDER_HUNT_ENABLED) return; // ash spiders never despawn mid-wave
  if (inLegacyWorld(player.x, player.y) && !(e.flash > 0) && !(e.bwSwellDur > 0)) {
    e.bwLeashT = (e.bwLeashT || 0) + dt;
  } else {
    e.bwLeashT = 0;
  }
  if (e.bwLeashT > BURSTWEAVER_LEASH_T) {
    e.dead = true;
    e.hp = 0;
    spawnParticles(e.x, e.y, 18, '#c45a3a', 3);
    addFloater(e.x, e.y - 46, 'The Burstweaver skitters back into the ash…', '#e07040', false);
  }
}

/** Prefer turn-back at legacy border (plan) — never chase into core. */
function steerBurstweaverFromLegacy(e, dt) {
  if (!isAshenSpiderType(e)) return;
  const nx = e.x + e.vx * dt;
  const ny = e.y + e.vy * dt;
  const inside = inLegacyWorld(e.x, e.y);
  const wouldEnter = inLegacyWorld(nx, ny);
  if (!inside && !wouldEnter) return;
  const lx = LEGACY_WORLD.x + LEGACY_WORLD.w / 2;
  const ly = LEGACY_WORLD.y + LEGACY_WORLD.h / 2;
  let ax = e.x - lx, ay = e.y - ly;
  let ad = Math.hypot(ax, ay);
  if (ad < 1) {
    ax = e.x < lx ? -1 : 1;
    ay = e.y < ly ? -1 : 1;
    ad = Math.hypot(ax, ay) || 1;
  }
  e.vx = lerp(e.vx, ax / ad * e.spd * 1.05, dt * 7);
  e.vy = lerp(e.vy, ay / ad * e.spd * 1.05, dt * 7);
  if (inside) {
    // nudge fully out if somehow inside
    e.x += (ax / ad) * Math.max(e.spd * dt * 2, 4);
    e.y += (ay / ad) * Math.max(e.spd * dt * 2, 4);
  }
}

function applyBurstweaverWebSlow() {
  player.webSlowT = Math.max(player.webSlowT || 0, BURSTWEAVER_WEB_SLOW_T);
  player.webSlowMul = BURSTWEAVER_WEB_SLOW_MUL;
  addFloater(player.x, player.y - 36, 'WEBBED', '#c8c0a8', false);
}

function applyBurstweaverPoison() {
  player.poisonT = BURSTWEAVER_POISON_T;
  player.poisonDps = BURSTWEAVER_POISON_DPS;
  player.poisonKiDps = BURSTWEAVER_POISON_KI_DPS;
  addFloater(player.x, player.y - 44, 'ASH VENOM ' + BURSTWEAVER_POISON_T + 's', '#a060c0', true);
}

function burstweaverExplodeDmg() {
  return Math.max(Math.round(BURSTWEAVER_EXPLODE_BASE * 0.45),
    Math.round(maxHp() * BURSTWEAVER_EXPLODE_HP_FRAC));
}

function beginBurstweaverSwell(e) {
  e.bwSwellT = rand(BURSTWEAVER_SWELL_MIN, BURSTWEAVER_SWELL_MAX);
  e.bwSwellDur = e.bwSwellT; // 7.4D — telegraph ring progress
  e.bwExplodeCd = 999;
  e.vx *= 0.25; e.vy *= 0.25;
  addFloater(e.x, e.y - e.r * 2.4, '…WEAVE…BURST…', '#e07040', true);
  tryEnemyBark(e, 'attack');
  buzz(25);
  camera.shake = Math.max(camera.shake, 4);
}

function burstweaverWeb(e, tgt) {
  e.bwWebCd = BURSTWEAVER_WEB_CD;
  e.bwThreatT = BURSTWEAVER_THREAT_POSE * 0.65;
  tryEnemyBark(e, 'attack');
  const a = Math.atan2(tgt.y - e.y, tgt.x - e.x) + rand(-0.04, 0.04);
  ebolts.push({
    x: e.x, y: e.y - e.r * 0.35,
    vx: Math.cos(a) * BURSTWEAVER_WEB_SPD,
    vy: Math.sin(a) * BURSTWEAVER_WEB_SPD,
    life: 1.4, r: 8, dmg: BURSTWEAVER_WEB_DMG, web: true,
  });
  spawnParticles(e.x, e.y - 18, 7, '#c8c0a8', 2.2);
}

function burstweaverBite(e, tgt) {
  e.bwBiteCd = BURSTWEAVER_BITE_CD;
  e.bwThreatT = BURSTWEAVER_THREAT_POSE;
  e.swipeT = UNIT_SWIPE;
  tryEnemyBark(e, 'attack');
  if (tgt === player) {
    if (player.hurtT <= 0) {
      hurtPlayer(e.dmg);
      applyBurstweaverPoison();
    }
  } else if (tgt && companions.includes(tgt) && !tgt.downed) {
    hurtCompanion(tgt, e.dmg * 0.55);
  }
  spawnParticles(tgt.x, tgt.y - 12, 9, '#a060c0', 2.6);
}

/** Friendly-fire AOE then suicide (creeper fantasy). Kill during swell cancels — no call here. */
function detonateBurstweaver(e) {
  if (!e || e._bwDetonated) return;
  e._bwDetonated = true;
  e.bwSwellT = 0;
  const R = BURSTWEAVER_EXPLODE_R;
  const dmg = burstweaverExplodeDmg();
  spawnParticles(e.x, e.y, 52, '#e07040', 6);
  spawnParticles(e.x, e.y, 26, '#a060c0', 4);
  spawnRing(e.x, e.y, R);
  decals.push({ x: e.x, y: e.y, r: R * 0.55, color: '40,28,36', life: 16, maxLife: 16 });
  camera.shake = Math.max(camera.shake, 14);
  buzz(70);
  addFloater(e.x, e.y - 56, 'ASHBURST!', '#e07040', true);

  if (dist2(e.x, e.y, player.x, player.y) < (R + player.r) ** 2) {
    hurtPlayer(dmg);
    const pd = Math.hypot(player.x - e.x, player.y - e.y) || 1;
    player.vx += (player.x - e.x) / pd * 320;
    player.vy += (player.y - e.y) / pd * 320;
    player.dashT = Math.max(player.dashT, 0.18);
  }
  for (const c of companions) {
    if (c.downed) continue;
    if (dist2(e.x, e.y, c.x, c.y) < (R + c.r) ** 2) hurtCompanion(c, dmg * 0.75);
  }
  for (const m of militia) {
    if (m.downed) continue;
    if (dist2(e.x, e.y, m.x, m.y) < (R + m.r) ** 2) hurtMilitia(m, dmg * 0.55);
  }
  if (colossusActive() && dist2(e.x, e.y, colossus.x, colossus.y) < (R + colossus.r) ** 2)
    hurtColossus(dmg * 0.5);
  for (const u of holdUnits) {
    if (u.downed) continue;
    if (dist2(e.x, e.y, u.x, u.y) < (R + u.r) ** 2) hurtHoldUnit(u, dmg * 0.7);
  }
  for (const L of holdLaborers) {
    if (L.downed) continue;
    if (dist2(e.x, e.y, L.x, L.y) < (R + L.r) ** 2) hurtHoldLaborer(L, dmg * 0.65);
  }
  for (const L of laborers) {
    if (L.downed) continue;
    if (dist2(e.x, e.y, L.x, L.y) < (R + L.r) ** 2) hurtLaborer(L, dmg * 0.65);
  }
  for (const L of squadLaborers) {
    if (L.downed) continue;
    if (dist2(e.x, e.y, L.x, L.y) < (R + L.r) ** 2) hurtLaborer(L, dmg * 0.65);
  }
  // Friendly-fire: nearby enemies also take the blast
  for (const o of enemies) {
    if (o === e || o.dead) continue;
    if (dist2(e.x, e.y, o.x, o.y) < (R + o.r) ** 2) {
      const d = Math.hypot(o.x - e.x, o.y - e.y) || 1;
      directDamage(o, dmg * 0.85, (o.x - e.x) / d, (o.y - e.y) / d, 280);
    }
  }
  for (const b of barricades) {
    if (dist2(e.x, e.y, b.x, b.y) < (R + b.r) ** 2) b.hp -= dmg * 0.55;
  }
  for (const w of brickWalls) {
    if (dist2(e.x, e.y, w.x, w.y) < (R + w.r) ** 2) w.hp -= dmg * 0.45;
  }
  for (const s of structures) {
    if (dist2(e.x, e.y, s.x, s.y) < (R + (s.r || 24)) ** 2) s.hp -= dmg * 0.4;
  }
  for (const h of npcHolds) {
    for (const d of h.defenses || []) {
      if (d.hp > 0 && dist2(e.x, e.y, d.x, d.y) < (R + d.r) ** 2) d.hp -= dmg * 0.5;
    }
    for (const s of h.structures || []) {
      if (dist2(e.x, e.y, s.x, s.y) < (R + (s.r || 24)) ** 2)
        s.hp = (s.hp != null ? s.hp : 100) - dmg * 0.45;
    }
  }

  // Suicide detonation — scorched corpse via killEnemy decal/loot
  if (!e.dead) killEnemy(e);
}

/** Approach → web at range OR bite melee → occasionally swell → explode. Returns 'swell' while telegraphing. */
function tickBurstweaverCombat(e, dt, tgt) {
  e.bwThreatT = Math.max(0, (e.bwThreatT || 0) - dt);
  e.bwWebCd = Math.max(0, (e.bwWebCd || 0) - dt);
  e.bwBiteCd = Math.max(0, (e.bwBiteCd || 0) - dt);
  e.bwExplodeCd = Math.max(0, (e.bwExplodeCd || 0) - dt);

  if ((e.bwSwellT || 0) > 0) {
    e.bwSwellT -= dt;
    e.vx *= Math.pow(0.12, dt);
    e.vy *= Math.pow(0.12, dt);
    if (Math.random() < dt * 28) spawnParticles(e.x + rand(-18, 18), e.y - 22, 1, '#e07040', 2.5);
    if (Math.random() < dt * 16) spawnParticles(e.x + rand(-12, 12), e.y - 30, 1, '#a060c0', 2);
    if (e.bwSwellT <= 0 && !e.dead && !e._bwDetonated) detonateBurstweaver(e);
    return 'swell';
  }

  const td = Math.hypot(tgt.x - e.x, tgt.y - e.y) || 1;
  const meleeR = e.r + (tgt.r || player.r) + BURSTWEAVER_BITE_REACH;

  if (e.bwExplodeCd <= 0 && td < BURSTWEAVER_EXPLODE_TRIGGER) {
    beginBurstweaverSwell(e);
    return 'swell';
  }
  if (e.bwBiteCd <= 0 && td < meleeR) {
    burstweaverBite(e, tgt);
    return 'ok';
  }
  if (e.bwWebCd <= 0 && td < spiderWebRange(e) && td > meleeR * 0.9) {
    burstweaverWeb(e, tgt);
    return 'ok';
  }
  return 'ok';
}

function isAshenSpiderType(e) {
  return e && (e.type === 'burstweaver' || e.type === 'broodmother' || e.type === 'spiderling');
}
function countLiveBroodmothers() {
  let n = 0;
  for (const e of enemies) if (e.type === 'broodmother' && !e.dead) n++;
  return n;
}
function countLiveSpiderlings() {
  let n = 0;
  for (const e of enemies) if (e.type === 'spiderling' && !e.dead) n++;
  return n;
}
function playerDeepExterior() {
  if (!CONTINUOUS_MAP_ENABLED || inLegacyWorld(player.x, player.y)) return false;
  const lx = LEGACY_WORLD.x + LEGACY_WORLD.w / 2;
  const ly = LEGACY_WORLD.y + LEGACY_WORLD.h / 2;
  return dist2(player.x, player.y, lx, ly) > BROODMOTHER_DEEP_R * BROODMOTHER_DEEP_R;
}
function spawnSpiderlingAt(x, y, opts) {
  if (!BROODMOTHER_ENABLED || !CONTINUOUS_MAP_ENABLED) return null;
  if (countLiveSpiderlings() >= SPIDERLING_MAX_LIVE) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y) || inLegacyWorld(x, y)) return null;
  if (x < 60 || y < 60 || x > WORLD.w - 60 || y > WORLD.h - 60) return null;
  return makeEnemy('spiderling', x, y, {
    exteriorOnly: true, spawnT: 0.35,
    bwWebCd: rand(0.6, 1.4), bwBiteCd: rand(0.4, 1.0), bwThreatT: 0,
    ...opts,
  });
}
function spawnBroodmotherAt(x, y) {
  if (!BROODMOTHER_ENABLED || !CONTINUOUS_MAP_ENABLED) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y) || inLegacyWorld(x, y)) return null;
  if (x < 60 || y < 60 || x > WORLD.w - 60 || y > WORLD.h - 60) return null;
  if (countLiveBroodmothers() >= BROODMOTHER_MAX_LIVE) return null;
  const e = makeEnemy('broodmother', x, y, {
    exteriorOnly: true, spawnT: 0.65,
    bwWebCd: rand(1.4, 2.6), bwBiteCd: rand(1.0, 1.8), bwThreatT: 0,
    bmBirthDone: false, bmBirthCd: rand(4, 8),
  });
  spawnParticles(x, y, 22, '#c85888', 4);
  addFloater(x, y - 58, 'ASHEN BROODMOTHER', '#c85888', true);
  banner('BROODMOTHER', 'the ash brood stirs');
  camera.shake = Math.max(camera.shake, 6);
  return e;
}
function spawnBroodmotherBirth(e) {
  if (!e || e.dead || e.type !== 'broodmother') return 0;
  const n = SPIDERLING_COUNT_MIN + ((Math.random() * (SPIDERLING_COUNT_MAX - SPIDERLING_COUNT_MIN + 1)) | 0);
  let spawned = 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.35, 0.35);
    const d = rand(24, 48);
    const sx = clamp(e.x + Math.cos(a) * d, 60, WORLD.w - 60);
    const sy = clamp(e.y + Math.sin(a) * d, 60, WORLD.h - 60);
    const sl = spawnSpiderlingAt(sx, sy, {
      vx: Math.cos(a) * rand(140, 260),
      vy: Math.sin(a) * rand(140, 260),
    });
    if (sl) spawned++;
  }
  spawnParticles(e.x, e.y, 48, '#c85888', 6);
  spawnParticles(e.x, e.y, 24, '#a060c0', 4);
  spawnRing(e.x, e.y, BROODMOTHER_BIRTH_RING_R);
  camera.shake = Math.max(camera.shake, 12);
  buzz(55);
  addFloater(e.x, e.y - e.r * 2.6, spawned + ' SPIDERLINGS!', '#d87850', true);
  e.bmBirthDone = true;
  e.bmBirthCd = 999;
  return spawned;
}
function beginBroodmotherBirthSwell(e) {
  e.bwSwellT = rand(BROODMOTHER_BIRTH_SWELL_MIN, BROODMOTHER_BIRTH_SWELL_MAX);
  e.bwSwellDur = e.bwSwellT;
  e.vx *= 0.2; e.vy *= 0.2;
  addFloater(e.x, e.y - e.r * 2.5, '…THE BROOD SWELLS…', '#c85888', true);
  tryEnemyBark(e, 'attack');
  buzz(30);
  camera.shake = Math.max(camera.shake, 5);
}
function applySpiderlingPoison() {
  player.poisonT = Math.max(player.poisonT || 0, SPIDERLING_POISON_T);
  player.poisonDps = SPIDERLING_POISON_DPS;
  player.poisonKiDps = SPIDERLING_POISON_KI_DPS;
  addFloater(player.x, player.y - 40, 'SPIDER VENOM ' + SPIDERLING_POISON_T + 's', '#d87850', false);
}
function spiderlingBite(e, tgt) {
  e.bwBiteCd = SPIDERLING_BITE_CD;
  e.bwThreatT = BURSTWEAVER_THREAT_POSE * 0.55;
  e.swipeT = UNIT_SWIPE * 0.85;
  tryEnemyBark(e, 'attack');
  if (tgt === player) {
    if (player.hurtT <= 0) { hurtPlayer(e.dmg); applySpiderlingPoison(); }
  } else if (tgt && companions.includes(tgt) && !tgt.downed) {
    hurtCompanion(tgt, e.dmg * 0.5);
  }
  spawnParticles(tgt.x, tgt.y - 10, 6, '#d87850', 2.2);
}
function spiderlingWeb(e, tgt) {
  e.bwWebCd = SPIDERLING_WEB_CD;
  e.bwThreatT = BURSTWEAVER_THREAT_POSE * 0.45;
  tryEnemyBark(e, 'attack');
  const a = Math.atan2(tgt.y - e.y, tgt.x - e.x) + rand(-0.06, 0.06);
  ebolts.push({
    x: e.x, y: e.y - e.r * 0.35,
    vx: Math.cos(a) * (BURSTWEAVER_WEB_SPD * 0.92),
    vy: Math.sin(a) * (BURSTWEAVER_WEB_SPD * 0.92),
    life: 1.1, r: 6, dmg: Math.round(BURSTWEAVER_WEB_DMG * 0.55), web: true,
  });
  spawnParticles(e.x, e.y - 14, 5, '#c8c0a8', 1.8);
}
function tickSpiderlingCombat(e, dt, tgt) {
  e.bwThreatT = Math.max(0, (e.bwThreatT || 0) - dt);
  e.bwWebCd = Math.max(0, (e.bwWebCd || 0) - dt);
  e.bwBiteCd = Math.max(0, (e.bwBiteCd || 0) - dt);
  const td = Math.hypot(tgt.x - e.x, tgt.y - e.y) || 1;
  const meleeR = e.r + (tgt.r || player.r) + 6;
  if (e.bwBiteCd <= 0 && td < meleeR) { spiderlingBite(e, tgt); return 'ok'; }
  if (e.bwWebCd <= 0 && td < spiderWebRange(e) && td > meleeR * 0.85) { spiderlingWeb(e, tgt); return 'ok'; }
  return 'ok';
}
function tickBroodmotherCombat(e, dt, tgt) {
  e.bwThreatT = Math.max(0, (e.bwThreatT || 0) - dt);
  e.bwWebCd = Math.max(0, (e.bwWebCd || 0) - dt);
  e.bwBiteCd = Math.max(0, (e.bwBiteCd || 0) - dt);
  e.bmBirthCd = Math.max(0, (e.bmBirthCd || 0) - dt);
  if ((e.bwSwellT || 0) > 0) {
    e.bwSwellT -= dt;
    e.vx *= Math.pow(0.1, dt);
    e.vy *= Math.pow(0.1, dt);
    if (Math.random() < dt * 32) spawnParticles(e.x + rand(-22, 22), e.y - 26, 1, '#c85888', 2.4);
    if (Math.random() < dt * 18) spawnParticles(e.x + rand(-14, 14), e.y - 34, 1, '#d87850', 2);
    if (e.bwSwellT <= 0 && !e.dead && !e.bmBirthDone) spawnBroodmotherBirth(e);
    return 'swell';
  }
  const td = Math.hypot(tgt.x - e.x, tgt.y - e.y) || 1;
  const meleeR = e.r + (tgt.r || player.r) + BURSTWEAVER_BITE_REACH;
  if (!e.bmBirthDone && e.bmBirthCd <= 0 && td < BROODMOTHER_BIRTH_TRIGGER) {
    beginBroodmotherBirthSwell(e);
    return 'swell';
  }
  if (e.bwBiteCd <= 0 && td < meleeR) { burstweaverBite(e, tgt); return 'ok'; }
  if (e.bwWebCd <= 0 && td < spiderWebRange(e) && td > meleeR * 0.9) { burstweaverWeb(e, tgt); return 'ok'; }
  return 'ok';
}
function pickBroodmotherSpawnPos() {
  if (SPIDER_DEN_ENABLED) {
    const denPos = pickSpiderDenSpawnPos();
    if (denPos) return denPos;
  }
  const candidates = [];
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    for (let i = 0; i < 2; i++) {
      const ang = rand(0, TAU);
      const d = h.halfW + h.halfH + rand(220, 420);
      const x = h.x + Math.cos(ang) * d;
      const y = h.y + Math.sin(ang) * d;
      if (!inLegacyWorld(x, y)) candidates.push({ x, y });
    }
  }
  if (playerDeepExterior()) {
    for (let i = 0; i < 5; i++) {
      const ang = rand(0, TAU);
      const d = rand(520, 880);
      const x = player.x + Math.cos(ang) * d;
      const y = player.y + Math.sin(ang) * d;
      if (!inLegacyWorld(x, y) && x > 60 && y > 60 && x < WORLD.w - 60 && y < WORLD.h - 60) candidates.push({ x, y });
    }
  }
  if (!candidates.length) return null;
  return candidates[(Math.random() * candidates.length) | 0];
}
function tickBroodmotherSpawn(dt) {
  if (!BROODMOTHER_ENABLED || !CONTINUOUS_MAP_ENABLED) return;
  if (wave < BROODMOTHER_MIN_WAVE) return;
  broodmotherSpawnCd -= dt;
  if (broodmotherSpawnCd > 0) return;
  broodmotherSpawnCd = rand(BROODMOTHER_SPAWN_CD_MIN, BROODMOTHER_SPAWN_CD_MAX);
  if (countLiveBroodmothers() >= BROODMOTHER_MAX_LIVE) return;
  if (!playerDeepExterior()) return;
  const pos = pickBroodmotherSpawnPos();
  if (!pos) return;
  spawnBroodmotherAt(pos.x, pos.y);
}

// ---------- decade bosses (every 10 waves) ----------
// Wave W (W%10===0): spawn W/10 stacked elites at tiers 10,20,…,W.
// Hardness uses that tier’s wave curve — not full Gharok at every stack slot.
// Gharok (warlord, every 5 waves) stays separate; decade never sets boss:true.
const DECADE_ROSTER = [
  { type: 'ravager', title: 'Rift Decade Brute' },
  { type: 'bulwark', title: 'Ashen Decade Bulwark' },
  { type: 'warlord', title: 'Ashen Decade Warlord' },
];
function decadeBossTiers(w) {
  if (w < 10 || w % 10 !== 0) return [];
  const tiers = [];
  for (let t = 10; t <= w; t += 10) tiers.push(t);
  return tiers;
}
function enemyVisScale(e) {
  return e.visScale || 1;
}
function countLiveDecadeBosses() {
  let n = 0;
  for (const e of enemies) { if (e.decadeBoss && !e.dead) n++; }
  return n;
}
function countDecadeBossesOnCamera() {
  let n = 0;
  const pad = 96;
  for (const e of enemies) {
    if (!e.decadeBoss || e.dead) continue;
    if (e.x + e.r + pad > camera.x && e.x - e.r - pad < camera.x + VW &&
        e.y + e.r + pad > camera.y && e.y - e.r - pad < camera.y + VH) n++;
  }
  return n;
}
/** Step 9.5 — spawn on cleared N/S/E/W path stubs (not random tree wall). */
function spawnDecadePathPos() {
  if (!CONTINUOUS_MAP_ENABLED) return spawnEdgePos();
  const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
  const cx = lx + lw / 2, cy = ly + lh / 2;
  const depth = Math.min(LEGACY_PATH_INTERIOR_DEPTH, 520);
  const jitter = LEGACY_BORDER_GAP_HALF * 0.55;
  const slots = [
    { x: cx + rand(-jitter, jitter), y: ly + depth },
    { x: cx + rand(-jitter, jitter), y: ly + lh - depth },
    { x: lx + depth, y: cy + rand(-jitter, jitter) },
    { x: lx + lw - depth, y: cy + rand(-jitter, jitter) },
  ];
  const slot = slots[(Math.random() * slots.length) | 0];
  // Step 10.1 — corridor lanes are dry by geometry (water max x≈2120 < lane 2312); guard anyway
  if (LAKE_SPAWN_GUARD_ENABLED && isLakeWaterAt(slot.x, slot.y)) {
    return lakeNearestShore(slot.x, slot.y, 24);
  }
  return { x: slot.x, y: slot.y };
}
function makeDecadeBossAt(tier, x, y) {
  const decadeIdx = Math.max(1, tier / 10);
  const role = DECADE_ROSTER[(decadeIdx - 1) % DECADE_ROSTER.length];
  const t = ETYPES[role.type];
  const tierHp = 1 + (tier - 1) * 0.16;
  const eliteMul = 1.4 + decadeIdx * 0.5;
  const warlordLite = role.type === 'warlord' ? 0.42 + Math.min(decadeIdx, 8) * 0.02 : 1;
  const hp = Math.round(t.hp * tierHp * eliteMul * warlordLite);
  const dmg = Math.round(t.dmg * (1 + decadeIdx * 0.22) * (role.type === 'warlord' ? 0.72 : 1));
  let visScale, r;
  if (role.type === 'warlord') {
    visScale = Math.min(0.55 + decadeIdx * 0.04, 0.88);
    r = Math.min(54 * visScale, 48);
  } else {
    visScale = Math.min(1 + (decadeIdx - 1) * 0.06, 1.45);
    r = Math.min(t.r * visScale, 48);
  }
  const e = makeEnemy(role.type, x, y, {
    boss: false,
    decadeBoss: true,
    decadeTier: tier,
    decadeTitle: role.title,
    hp, maxHp: hp,
    r,
    visScale,
    spd: t.spd * (1 + tier * 0.012) * (0.92 + decadeIdx * 0.015),
    dmg,
    ranged: false,
    core: Math.round(8 + decadeIdx * 4),
    xp: Math.round(40 + decadeIdx * 18),
    kbPlayer: Math.round(200 + decadeIdx * 35),
  });
  if (decadeIdx >= 2) {
    e.maxArmor = Math.round((40 + decadeIdx * 28) * (1 + tier * 0.03));
    e.armor = e.maxArmor;
    e.armorCrack = 4;
  } else {
    e.maxArmor = 0;
    e.armor = 0;
    delete e.armorCrack;
  }
  spawnParticles(x, y, 22, '#ff8a4d', 4);
  const queued = DECADE_STACK_QUEUE_ENABLED && decadeBossQueue.length > 0;
  addFloater(x, y - (r * 2.4 + 12),
    (queued ? 'DECADE ARRIVES · ' : '') + role.title.toUpperCase() + ' · T' + tier, '#ff8a4d', true);
  return e;
}
function spawnDecadeBoss(tier) {
  const pos = DECADE_STACK_QUEUE_ENABLED ? spawnDecadePathPos() : spawnEdgePos();
  return makeDecadeBossAt(tier, pos.x, pos.y);
}
function trySpawnDecadeFromQueue() {
  if (!DECADE_STACK_QUEUE_ENABLED) return;
  if (!decadeBossQueue.length) return;
  if (countDecadeBossesOnCamera() >= DECADE_STACK_ONSCREEN_MAX) return;
  spawnDecadeBoss(decadeBossQueue.shift());
}
function queueDecadeBossStack(tiers) {
  decadeBossQueue.length = 0;
  if (!tiers || !tiers.length) return;
  if (!DECADE_STACK_QUEUE_ENABLED) {
    for (const tier of tiers) spawnDecadeBoss(tier);
    return;
  }
  decadeBossQueue.push(...tiers);
  trySpawnDecadeFromQueue();
}
function tickDecadeBossQueue(dt) {
  if (!DECADE_STACK_QUEUE_ENABLED || !decadeBossQueue.length) return;
  trySpawnDecadeFromQueue();
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
      let mx = (a.x + partner.x) / 2, my = (a.y + partner.y) / 2;
      // Step 10.1 — both husks are shore-clamped but a midpoint could dip past a
      // wobble notch; the Bulwark always fuses on dry land
      if (LAKE_SPAWN_GUARD_ENABLED && isLakeWaterAt(mx, my)) {
        const fp = lakeNearestShore(mx, my, 20);
        mx = fp.x; my = fp.y;
      }
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
  // 7.4C — kill during swell cancels explode (no friendly-fire blast)
  if (e.type === 'broodmother' && (e.bwSwellT || 0) > 0 && !e.bmBirthDone) {
    e.bwSwellT = 0;
    addFloater(e.x, e.y - 40, 'BROOD FIZZLE', '#9fb2c9', false);
  }
  if (e.type === 'burstweaver' && (e.bwSwellT || 0) > 0 && !e._bwDetonated) {
    e.bwSwellT = 0;
    addFloater(e.x, e.y - 40, 'BURST FIZZLE', '#9fb2c9', false);
  }
  e.dead = true;
  kills++;
  sfx.play('death', { voice: e.type || 'husk', throttle: 0.055 });
  if (e.ascended) { // rift-blessed foes burst into raw aether when slain
    player.ki = clamp(player.ki + 8, 0, maxKi());
    spawnRing(e.x, e.y, 60);
    spawnParticles(e.x, e.y, 14, '#ffd54a', 4);
    addFloater(e.x, e.y - 30, '+8 AETHER', '#4de1ff', false);
  }
  spawnParticles(e.x, e.y, e.boss || e.decadeBoss ? 60 : 16, e.type === 'ravager' || e.type === 'warlord' ? '#5f8f3a' : '#7a8f5a', e.boss || e.decadeBoss ? 5 : 3);
  decals.push({ x: e.x, y: e.y, r: e.r * 1.6, color: '46,66,36', life: 14, maxLife: 14 });
  camera.shake = Math.min(camera.shake + (e.boss ? 14 : e.decadeBoss ? 8 : 2), 18);
  // fallen zombies may claw back out of the ground as skeletons (same wave only)
  if ((e.type === 'husk' || e.type === 'sprinter') && waveActive &&
      graveCount < SKELETON_CAP && Math.random() < SKELETON_CHANCE) {
    graveCount++;
    const gp = lakeGuardSpawnPos(e.x, e.y, 20); // Step 10.1 — graves never open underwater
    graves.push({ x: gp.x, y: gp.y, t: rand(8, 15), wave });
  }
  // Step 10.1 — a shore-clamped death still scatters orbs ±18px; when the corpse is at
  // the waterline (field within ~6px of shore), anchor the drops fully on dry land
  let dropX = e.x, dropY = e.y;
  if (LAKE_SPAWN_GUARD_ENABLED && LAKE_WATER_ENABLED && lakeFieldAt(e.x, e.y) < 1.02) {
    const dp = lakeNearestShore(e.x, e.y, 22);
    dropX = dp.x; dropY = dp.y;
  }
  const bonus = Math.random() < 0.25 * sk('s3') ? 1 : 0;
  for (let i = 0; i < e.core + bonus; i++)
    pickups.push({ x: dropX + rand(-14, 14), y: dropY + rand(-14, 14), type: 'core', t: 0 });
  if (Math.random() < (e.boss || e.decadeBoss ? 1 : 0.06))
    pickups.push({ x: dropX, y: dropY, type: 'health', t: 0 });
  // BETA-3.1 step 1 — EXTRA squad-only orbs (never reduce player core/health drops)
  // Dark gray = squad SP; light gray = squad cores (separate wallets; see docs/beta-3.1-roadmap.md)
  const sqSpN = 1 + (e.boss ? 2 : e.decadeBoss ? 2 : (e.core >= 3 ? 1 : 0));
  for (let i = 0; i < sqSpN; i++)
    pickups.push({ x: dropX + rand(-18, 18), y: dropY + rand(-18, 18), type: 'squad_sp', t: 0, squadOnly: true });
  if (Math.random() < (e.boss || e.decadeBoss ? 1 : 0.35))
    pickups.push({ x: dropX + rand(-16, 16), y: dropY + rand(-16, 16), type: 'squad_core', t: 0, squadOnly: true });
  if (sk('s4')) player.hp = Math.min(maxHp(), player.hp + 3);
  if (e.type === 'broodmother') {
    const coalDrop = 2 + ((Math.random() * 3) | 0);
    coal += coalDrop;
    addFloater(e.x, e.y - 48, '+⬤' + coalDrop + ' COAL', '#a0a0a0', true);
    for (let i = 0; i < 2; i++)
      pickups.push({ x: e.x + rand(-20, 20), y: e.y + rand(-20, 20), type: 'core', t: 0 });
  }
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
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    for (const n of h.npcs) {
      const d2 = dist2(player.x, player.y, n.x, n.y);
      if (d2 < bd) { bd = d2; best = n; }
    }
    if (HOLD_CAPTAIN_ENABLED && h.captain) {
      const d2 = dist2(player.x, player.y, h.captain.x, h.captain.y);
      if (d2 < bd) { bd = d2; best = h.captain; }
    }
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
  if (nearestDownedCompanion() || nearestDownedMilitia() || nearestDownedLaborer() || nearestDownedAlly() || nearestDownedColossus()) return;
  const npc = nearestNpc();
  if (!npc) return;
  if (npc.role === 'vendor') { openVendor(); return; }
  if (npc.role === 'lore') { talkMira(); return; }
  if (npc.role === 'riftnet') { openRiftNet(); return; }
  if (npc.role === 'hold') { talkHoldNpc(npc); return; }
  if (npc.role === 'hold_captain') { talkHoldCaptain(npc); return; }
  // Bramm: if wounded / squad downed, offer aether infirmary first (mid-run recovery)
  if (npc.role === 'quest' && (player.hp < maxHp() * 0.92 || companions.some(c => c.downed) || militia.some(m => m.downed) || laborers.some(L => L.downed) || squadLaborers.some(L => L.downed) || (colossus && colossus.downed))) {
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

function talkHoldNpc(npc) {
  const hold = npcHolds.find(h => h.id === npc.holdId);
  if (!hold) return;
  hold.visited = true;
  const t = holdTemplateFor(hold) || {};
  const place = hold.name;
  const jw = holdJoinWave(hold);

  if (hold.recruited) {
    openDialog(npc.name, [
      randFrom(t.greet && t.greet.length ? t.greet : [`${place} stands with you.`]),
      hold.captain
        ? 'Our Continuity captain drills the builders and orange squad — you cannot upgrade them.'
        : 'Our spearman already marches in your militia. Our orange builder drills the hold — no upgrades from outsiders.',
    ]);
    return;
  }

  if (!holdCanJoin(hold)) {
    if (!hold.refusedEarly) hold.refusedEarly = true;
    const refusePool = t.refuse && t.refuse.length ? t.refuse : [
      "Still green, Vanguard. Come back after wave {W}.",
      "Not yet — hold Emberfall through wave {W} first.",
    ];
    const line = randFrom(refusePool).replace(/\{W\}/g, String(jw));
    openDialog(npc.name, [line, `Our orange builder keeps the hold running. Prove yourself through wave ${jw}.`]);
    return;
  }

  const joinLine = randFrom(t.join && t.join.length ? t.join : [
    'You have our allegiance — one spearman reports to your militia.',
  ]);
  openDialog(npc.name, [
    randFrom(t.greet && t.greet.length ? t.greet : [`${place} still holds.`]),
    joinLine + ' Each hold keeps its own orange builder and squad — you cannot upgrade them.',
  ], () => {
    recruitHoldSpearman(hold);
  });
}

function talkHoldCaptain(npc) {
  const hold = holdById(npc.holdId);
  if (!hold) return;
  hold.visited = true;
  const jw = holdJoinWave(hold);
  const lvl = hold.captainLevel | 0;
  const stage = hold.growthStage | 0;
  const nextKind = (hold.buildQueue && hold.buildQueue[0] && hold.buildQueue[0].kind)
    || HOLD_CAPTAIN_BUILD_ORDER[stage]
    || null;
  const nextName = nextKind && HOLD_STRUCTURE_KINDS[nextKind] ? HOLD_STRUCTURE_KINDS[nextKind].name : 'the next pad';

  if (!holdCanJoin(hold) && !hold.recruited) {
    if (!hold.refusedEarly) hold.refusedEarly = true;
    openDialog(npc.name || 'Hold Captain', [
      `Still green, Vanguard. I don't sign spears for tourists — come back after wave ${jw}.`,
      `Wave ${jw}. Then we talk allegiance. Until then I grow ${hold.name} without you.`,
    ]);
    return;
  }

  if (hold.recruited || hold.allegiance) {
    openDialog(npc.name || 'Hold Captain', [
      `Captain of ${hold.name} — level ${Math.max(1, lvl)}. I build like you do: bigger village, orange squads, no handouts.`,
      nextKind
        ? `Builders work ${nextName}. You harvest the stands if you want — but you cannot upgrade my units.`
        : 'Village pads are up. Drill continues. You cannot upgrade my orange squad.',
    ]);
    return;
  }

  // Eligible to join — captain welcomes and points to the roster (join still via hold sentry Talk)
  openDialog(npc.name || 'Hold Captain', [
    `You've bled enough nights past wave ${jw}. ${hold.name} will lend a spear — talk to my sentry to stamp the roster.`,
    `I train Rover, Scout, Sentinel, Warden on orange ✧. Outsiders don't touch the upgrade board.`,
  ]);
}

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
// Continuity: nearby non-downed companion/militia/laborer/colossus also auto-assist
// revive (slower). Colossus still costs 100 player ⬡ — player must pay / hold for titan.
const REVIVE_HOLD_SEC = 1.55;
const SQUAD_REVIVE_HOLD_SEC = 2.85; // slower than player hold-Talk
const SQUAD_REVIVE_RANGE = 78;
const REVIVE_RANGE = 74;
const ALLY_REVIVE_COST = 22; // aether — matches mid-tier companion revive
const ALLY_BLEEDOUT_SEC = 42;
let reviveChan = { kind: null, id: null, t: 0, cost: 0 };
// Per-downed assist progress: key = kind+id → { t, helper }
let squadReviveProg = Object.create(null);

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
  for (const L of squadLaborers) {
    if (!L.downed) continue;
    const d2 = dist2(L.x, L.y, player.x, player.y);
    if (d2 < bd) { bd = d2; best = L; }
  }
  return best;
}
function nearestDownedColossus() {
  if (!colossus || !colossus.downed) return null;
  const range = REVIVE_RANGE + colossus.r; // titan body is huge
  if (dist2(colossus.x, colossus.y, player.x, player.y) < range * range) return colossus;
  return null;
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
  if (kind === 'colossus') {
    if (cores < cost) return false;
    cores -= cost;
    finishColossusRevive(target);
    addFloater(player.x, player.y - 52, `−${cost} ⬡`, '#4de1ff', false);
    return true;
  }
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
// Squad assist: free revive for companions / militia / laborers when a living
// squadmate channels adjacent. Colossus stays player-only (100 ⬡ cores).
function completeSquadAssistRevive(kind, target) {
  if (kind === 'colossus' || kind === 'ally') return false;
  if (kind === 'comp') {
    finishCompanionRevive(target);
    addFloater(target.x, target.y - 44, 'SQUAD REVIVE', '#7CFC00', true);
    return true;
  }
  if (kind === 'militia') {
    finishMilitiaRevive(target);
    addFloater(target.x, target.y - 44, 'SQUAD REVIVE', '#7CFC00', true);
    return true;
  }
  if (kind === 'laborer') {
    finishLaborerRevive(target);
    addFloater(target.x, target.y - 44, 'SQUAD REVIVE', '#7CFC00', true);
    return true;
  }
  return false;
}
function squadReviveHelpersNear(tx, ty, exclude) {
  const r2 = SQUAD_REVIVE_RANGE * SQUAD_REVIVE_RANGE;
  const helpers = [];
  for (const c of companions) {
    if (c.downed || c === exclude) continue;
    if (dist2(c.x, c.y, tx, ty) < r2) helpers.push(c);
  }
  for (const m of militia) {
    if (m.downed || m === exclude) continue;
    if (dist2(m.x, m.y, tx, ty) < r2) helpers.push(m);
  }
  for (const L of laborers) {
    if (L.downed || L.insideMine || L === exclude) continue;
    if (dist2(L.x, L.y, tx, ty) < r2) helpers.push(L);
  }
  for (const L of squadLaborers) {
    if (L.downed || L.insideMine || L === exclude) continue;
    if (dist2(L.x, L.y, tx, ty) < r2) helpers.push(L);
  }
  if (colossus && !colossus.downed && colossus !== exclude) {
    const range = SQUAD_REVIVE_RANGE + colossus.r * 0.35;
    if (dist2(colossus.x, colossus.y, tx, ty) < range * range) helpers.push(colossus);
  }
  return helpers;
}
function updateSquadAssistRevive(dt) {
  if (player.downed || buildPlacePaused) return;
  const seen = Object.create(null);
  const jobs = [];
  for (const c of companions) {
    if (!c.downed) continue;
    jobs.push({ kind: 'comp', id: c.type, target: c, x: c.x, y: c.y });
  }
  for (const m of militia) {
    if (!m.downed) continue;
    jobs.push({ kind: 'militia', id: m.id, target: m, x: m.x, y: m.y });
  }
  for (const L of laborers) {
    if (!L.downed) continue;
    jobs.push({ kind: 'laborer', id: L.id, target: L, x: L.x, y: L.y });
  }
  for (const L of squadLaborers) {
    if (!L.downed) continue;
    jobs.push({ kind: 'laborer', id: L.id, target: L, x: L.x, y: L.y });
  }
  for (const job of jobs) {
    const key = job.kind + ':' + job.id;
    seen[key] = true;
    const helpers = squadReviveHelpersNear(job.x, job.y, job.target);
    if (!helpers.length) {
      delete squadReviveProg[key];
      continue;
    }
    // If player is already channeling this target, don't double-count assist
    if (reviveChan.kind === job.kind && reviveChan.id === job.id && reviveChan.t > 0) {
      delete squadReviveProg[key];
      continue;
    }
    if (!squadReviveProg[key]) squadReviveProg[key] = { t: 0 };
    // Multiple helpers speed assist slightly (cap ×1.6)
    const rate = 1 + Math.min(0.6, (helpers.length - 1) * 0.2);
    squadReviveProg[key].t += dt * rate;
    const hx = helpers[0].x, hy = helpers[0].y;
    if (Math.floor(squadReviveProg[key].t * 8) !== Math.floor((squadReviveProg[key].t - dt * rate) * 8)) {
      // light pulse while assisting
      if (Math.random() < 0.35) spawnParticles(job.x, job.y - 8, 2, '#4de1ff', 1);
    }
    if (squadReviveProg[key].t >= SQUAD_REVIVE_HOLD_SEC) {
      completeSquadAssistRevive(job.kind, job.target);
      delete squadReviveProg[key];
    } else {
      // stash for draw
      squadReviveProg[key].x = job.x;
      squadReviveProg[key].y = job.y;
      squadReviveProg[key].hx = hx;
      squadReviveProg[key].hy = hy;
    }
  }
  for (const k of Object.keys(squadReviveProg)) if (!seen[k]) delete squadReviveProg[k];
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
  updateSquadAssistRevive(dt);
  const ally = nearestDownedAlly();
  const colo = nearestDownedColossus();
  const mil = nearestDownedMilitia();
  const lab = nearestDownedLaborer();
  const comp = nearestDownedCompanion();
  let kind = null, target = null, cost = 0, id = null;
  if (ally) { kind = 'ally'; target = ally; cost = ALLY_REVIVE_COST; id = ally.id; }
  else if (colo) { kind = 'colossus'; target = colo; cost = COLOSSUS_REVIVE_CORES; id = 'titan'; }
  else if (mil) { kind = 'militia'; target = mil; cost = Math.max(12, 10 + Math.floor(mil.maxHp / 40)); id = mil.id; }
  else if (lab) { kind = 'laborer'; target = lab; cost = Math.max(10, 8 + Math.floor(lab.maxHp / 45)); id = lab.id; }
  else if (comp) { kind = 'comp'; target = comp; cost = aetherReviveCost(comp.type); id = comp.type; }

  const holding = talkHeld || !!keys.KeyT;
  if (!holding || !kind) {
    reviveChan = { kind: null, id: null, t: 0, cost: 0 };
    return;
  }
  const payCores = kind === 'colossus';
  if (payCores ? cores < cost : player.ki < cost) {
    if (reviveChan.t < 0.05) {
      addFloater(player.x, player.y - 40, payCores ? `NEED ${cost} ⬡` : `NEED ${cost} AETHER`, '#ff8a93', false);
    }
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
function reviveProgressFor(kind, id) {
  if (reviveChan.kind === kind && reviveChan.id === id && reviveChan.t > 0)
    return reviveChan.t / REVIVE_HOLD_SEC;
  const p = squadReviveProg[kind + ':' + id];
  if (p && p.t > 0) return p.t / SQUAD_REVIVE_HOLD_SEC;
  return 0;
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
  // Aether Colossus — 100 player cores (⬡), not aether / not squad cores
  if (colossus && colossus.downed) {
    const cost = COLOSSUS_REVIVE_CORES;
    const ok = cores >= cost;
    const div = document.createElement('div');
    div.className = 'shopitem' + (ok ? '' : ' maxed');
    div.innerHTML = `<h4>Revive Aether Colossus<span class="lvl" style="color:var(--cyan)">⬡ CORES</span></h4>
      <small>Pull the rift titan back up at 65% HP. Or hold Talk near him in the field. Does not auto-revive at wave end.</small>
      <div class="price" style="color:var(--cyan)">⬡ ${cost} cores${ok ? '' : ' · need more'}</div>`;
    if (ok) div.onclick = () => {
      if (!buyColossusRevive()) flashNeed(coresEl);
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
// ---------- Continuity v4 Step 1: wave coach (overlay-only) ----------
function waveCoachSkipped() {
  return !WAVE_COACH_ENABLED || !!settings.waveCoachSkip;
}
function paintWaveCoachFinger() {
  const cv = $('waveCoachFingerCv');
  if (!cv || waveCoach.fingerReady) return;
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  c.clearRect(0, 0, W, H);
  // Original Continuity glove pointer (procedural) — soft leather + cyan cuff
  c.save();
  c.translate(W * 0.42, H * 0.78);
  c.rotate(-0.55);
  // wrist cuff
  c.fillStyle = '#2a6a78';
  c.beginPath(); c.ellipse(0, 18, 16, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4de1ff';
  c.fillRect(-14, 12, 28, 4);
  // palm / glove body
  const g = c.createLinearGradient(-18, -10, 18, 30);
  g.addColorStop(0, '#e8dcc8'); g.addColorStop(0.55, '#c4b49a'); g.addColorStop(1, '#8a7a62');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-14, 14); c.quadraticCurveTo(-22, 0, -10, -8);
  c.quadraticCurveTo(-2, -18, 8, -12); c.quadraticCurveTo(18, -4, 14, 12);
  c.quadraticCurveTo(4, 22, -14, 14); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(40,30,20,.45)'; c.lineWidth = 1.5; c.stroke();
  // pointing index
  c.fillStyle = '#d2c4ae';
  c.beginPath();
  c.moveTo(2, -10); c.quadraticCurveTo(6, -38, 10, -52);
  c.quadraticCurveTo(14, -56, 16, -48); c.quadraticCurveTo(14, -28, 12, -8);
  c.closePath(); c.fill();
  c.stroke();
  // knuckle crease
  c.strokeStyle = 'rgba(60,45,30,.35)'; c.beginPath();
  c.moveTo(-6, 2); c.quadraticCurveTo(2, -2, 10, 0); c.stroke();
  // tip highlight
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.beginPath(); c.arc(12, -50, 3.2, 0, Math.PI * 2); c.fill();
  c.restore();
  waveCoach.fingerReady = true;
}
function coachTargetRect(id) {
  const el = $(id);
  if (el) {
    const hidden = el.classList.contains('hidden') ||
      (el.closest && el.closest('.touch-only') && !document.body.classList.contains('touch') &&
        !document.body.classList.contains('layout-editing'));
    if (!hidden) {
      const r = el.getBoundingClientRect();
      if (r.width > 6 && r.height > 6) return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.35, w: r.width, h: r.height };
    }
  }
  // Desktop / hidden-control fallbacks (screen positions — still guide, never softlock)
  const vw = innerWidth, vh = innerHeight;
  if (id === 'joyZone') return { x: vw * 0.18, y: vh * 0.78, w: 80, h: 80 };
  if (id === 'btnFire') return { x: vw * 0.88, y: vh * 0.82, w: 70, h: 70 };
  if (id === 'btnBuild') return { x: vw * 0.72, y: vh * 0.72, w: 64, h: 64 };
  if (id === 'btnColossus') return { x: vw * 0.88, y: vh * 0.58, w: 90, h: 40 };
  if (id === 'btnBike') return { x: vw * 0.88, y: vh * 0.50, w: 90, h: 40 };
  if (id === 'btnMenu') return { x: vw * 0.92, y: vh * 0.12, w: 70, h: 36 };
  if (id === 'coreNum' || id === 'waveNum' || id === 'squadNum') return { x: vw * 0.5, y: Math.max(36, (settings.hudOffset || 0) + 28), w: 120, h: 28 };
  return { x: vw * 0.5, y: vh * 0.55, w: 40, h: 40 };
}
function placeWaveCoachFinger(lesson) {
  const finger = $('waveCoachFinger');
  if (!finger || !lesson) return;
  const ids = lesson.targets || [];
  if (!ids.length) { finger.style.opacity = '0'; return; }
  // Cycle primary targets every ~2.4s so Move+Fire both get a point
  const idx = Math.floor((WAVE_COACH_HOLD - waveCoach.t) / 2.4) % ids.length;
  waveCoach.targetI = idx;
  const pt = coachTargetRect(ids[idx]);
  finger.style.left = Math.round(pt.x) + 'px';
  finger.style.top = Math.round(pt.y) + 'px';
}
function hideWaveCoach(immediate) {
  const el = $('waveCoach');
  if (!el) return;
  waveCoach.active = false;
  waveCoach.t = 0;
  if (immediate) {
    el.classList.remove('show', 'fade');
    el.style.display = 'none';
  } else {
    el.classList.add('fade');
    setTimeout(() => {
      if (!waveCoach.active) {
        el.classList.remove('show', 'fade');
        el.style.display = 'none';
      }
    }, 480);
  }
}
function skipWaveCoach() {
  settings.waveCoachSkip = true;
  persistSettings();
  if ($('togWaveCoachSkip')) refreshToggles();
  hideWaveCoach(true);
  addFloater(player.x, player.y - 48, 'COACH SKIPPED', '#8fa3bd', false);
}
function showWaveCoach(forWave) {
  if (waveCoachSkipped()) return;
  const lesson = WAVE_COACH_LESSONS[forWave];
  if (!lesson) return;
  const root = $('waveCoach');
  if (!root) return;
  paintWaveCoachFinger();
  $('waveCoachTitle').textContent = lesson.title;
  $('waveCoachBody').textContent = IS_TOUCH ? lesson.touch : lesson.desk;
  waveCoach.active = true;
  waveCoach.wave = forWave;
  waveCoach.t = WAVE_COACH_HOLD;
  root.style.display = 'block';
  root.classList.remove('fade');
  // next frame so transition plays
  requestAnimationFrame(() => root.classList.add('show'));
  placeWaveCoachFinger(lesson);
}
function updateWaveCoach(dt) {
  if (!waveCoach.active) return;
  waveCoach.t -= dt;
  const lesson = WAVE_COACH_LESSONS[waveCoach.wave];
  placeWaveCoachFinger(lesson);
  const el = $('waveCoach');
  if (waveCoach.t <= 1.2 && el) el.classList.add('fade');
  if (waveCoach.t <= 0) hideWaveCoach(true);
}
function maybeStartWaveCoach() {
  if (waveCoachSkipped()) return;
  if (wave < 1 || wave > 5) return;
  // Slight delay so WAVE banner can read first — still non-blocking
  const w = wave;
  setTimeout(() => {
    if (state !== 'playing' || wave !== w || waveCoachSkipped()) return;
    showWaveCoach(w);
  }, 700);
}

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
  const isGharokWave = wave % 5 === 0;
  const decadeTiers = decadeBossTiers(wave);
  if (isGharokWave) { spawnEnemy('warlord'); spawnQueue += 4; }
  if (decadeTiers.length) {
    queueDecadeBossStack(decadeTiers);
    spawnQueue += decadeTiers.length * 2;
  }
  let waveSub = waveTrainLeft ? `Muster: train up to ${waveTrainLeft} fighters` : 'the horde emerges…';
  if (decadeTiers.length && isGharokWave) {
    waveSub = `⚠ GHAROK + ${decadeTiers.length} DECADE BOSS${decadeTiers.length > 1 ? 'ES' : ''} ⚠`;
  } else if (isGharokWave) {
    waveSub = '⚠ ORK WARLORD APPROACHES ⚠';
  } else if (decadeTiers.length) {
    waveSub = `⚠ ${decadeTiers.length} DECADE BOSS STACK (T${decadeTiers.join('/')}) ⚠`;
  }
  banner(`WAVE ${wave}`, waveSub);
  // Continuity coach covers early tips; keep old TOWN TIP only if coach is off/skipped
  if (wave === 1 && !rtsTipShown && waveCoachSkipped()) {
    rtsTipShown = true;
    setTimeout(() => {
      if (state === 'playing')
        banner('TOWN TIP', 'B = BUILD · tap Laborers for Chop/Mine · tap Muster to train');
    }, 4200);
  }
  stampSpiderDensOnWaveStart();
  maybeStartWaveCoach();
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
  decadeBossQueue.length = 0;
  waveActive = false;
  hideWaveCoach(true);
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
  for (const L of squadLaborers) {
    if (!L.downed) continue;
    L.downed = false;
    L.hp = L.maxHp;
    spawnParticles(L.x, L.y, 12, '#7CFC00', 3);
    addFloater(L.x, L.y - 28, 'SQUAD LABORER BACK UP!', '#8a92a0', false);
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
  // Step 10.1 — the supply cache never sinks in Ashmere (player may stand on the shore);
  // pad 40 keeps openChest's ±26 orb scatter dry too
  const cp = lakeGuardSpawnPos(
    clamp(player.x + Math.cos(a) * 130, 80, WORLD.w - 80),
    clamp(player.y + Math.sin(a) * 130, 80, WORLD.h - 80), 40);
  chest = { x: cp.x, y: cp.y, t: 0 };
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
  sfx.play('beamBlast');
  beamCharge = 0;
}

function tryNova() {
  if (state !== 'playing' || paused || buildPlaceMode || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
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
  if (state !== 'playing' || paused || buildPlaceMode || dialogOpen || treeOpen || vendorOpen || settingsOpen || player.downed) return;
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
/** Step 10.6 — water placement gate (deferred from 10.5): player structures never sit on
 * Ashmere water or on the pier decks (the planks are a walkway, not a foundation — and the
 * skiff boarding lanes stay clear). Probes the pad center plus 8 footprint-edge points so a
 * shoreline placement can't overhang the waterline. Pure analytic tests riding the 10.1/10.2/
 * 10.4 helpers — each returns false with its lake flag off, so a dry world needs no extra
 * soft-wire (10.5 leash precedent: rules ride the existing flags, not a new one). */
function placementWaterBlockedAt(bx, by, r) {
  if (isLakeWaterAt(bx, by) || isOnDock(bx, by) || isOnIslePier(bx, by)) return true;
  const fr = Math.max(0, r || 0);
  if (fr <= 0) return false;
  for (let i = 0; i < 8; i++) {
    const px = bx + Math.cos(i * Math.PI / 4) * fr, py = by + Math.sin(i * Math.PI / 4) * fr;
    if (isLakeWaterAt(px, py) || isOnDock(px, py) || isOnIslePier(px, py)) return true;
  }
  return false;
}
function barricadeSpotBlocked(bx, by) {
  return placementWaterBlockedAt(bx, by, BARRICADE_BASE_R) ||
    obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + 40) ** 2) ||
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
  return placementWaterBlockedAt(bx, by, BRICKWALL_PILLAR_R) || // 10.6 water gate
    obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + 36) ** 2) ||
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
    cores: 4, wood: 0, gold: 0, max: 12, r: 40, hp: 220, // was 3
    upWood: [0, 20, 35], upGold: [0, 8, 18], upCores: [0, 4, 6],
  },
  farm: {
    name: 'Supply Camp', icon: '🌾',
    desc: 'Raises worker cap · light wood trickle',
    cores: 5, wood: 10, gold: 2, max: 16, r: 36, hp: 180, // was 4
    upWood: [0, 14, 26], upGold: [0, 6, 12], upCores: [0, 3, 5],
  },
  golddepot: {
    name: 'Gold Vault', icon: '◈',
    desc: 'Preferred gold deposit · slight mine speed',
    cores: 6, wood: 10, gold: 0, max: 8, r: 40, hp: 240, // was 2
    upWood: [0, 18, 32], upGold: [0, 0, 8], upCores: [0, 4, 7],
  },
  muster: {
    name: 'Muster Hall', icon: '⚔',
    desc: 'Trains combat squad (+3/wave) · Spearmen & Bowmen',
    cores: 8, wood: 12, gold: 6, max: 8, r: 46, hp: 300, // was 2
    upWood: [0, 28, 50], upGold: [0, 14, 28], upCores: [0, 6, 10],
  },
  aetherpit: {
    name: 'Aether Pit', icon: '✧',
    desc: 'Seeps gold slowly · tiny aether trickle',
    cores: 6, wood: 8, gold: 4, max: 8, r: 38, hp: 200, // was 2
    upWood: [0, 16, 30], upGold: [0, 10, 20], upCores: [0, 5, 8],
  },
};
const LABORER_BASE_MAX = 6;
const LABORER_TRAIN = { wood: 8, gold: 2, cores: 1 };
// BETA-3.1 step 3 — squad laborers: separate cap + spend squad wallets (not player wood/gold)
const SQUAD_LABORER_CAP = 3;
const SQUAD_LABORER_TRAIN = { sp: 2, cores: 1 }; // ✧2 squadSp + ◈1 squadCore
const SQUAD_LABORER_SHIRT = '#6a7380'; // slate tunic — distinct from Ashen ochre
const SPEAR_TRAIN = { wood: 14, gold: 8, cores: 3 };
const BOW_TRAIN = { wood: 12, gold: 10, cores: 3 };
const SENTINEL_TRAIN = { wood: 18, gold: 12, cores: 4 }; // unique named companion
const COLOSSUS_COST = { wood: 40, gold: 25, cores: 15 };
const COLOSSUS_DURATION = 0; // unused — no time-limit despawn (call back / downed only)
const COLOSSUS_MAX_HP = 1600; // was 820 — strongest ally tank (Warden 340; Gharok enemy 950+300 armor)
const COLOSSUS_SPD = 88;
const COLOSSUS_ATK_CD = 0.92; // was 1.05
const COLOSSUS_DMG_BASE = 44; // was 28
const COLOSSUS_DMG_WAVE = 1.5; // was 1.2 — wave 1 ≈ 45.5; does not one-shot Gharok
const COLOSSUS_SPLASH = 20; // was 10
const COLOSSUS_SPLASH_R = 145; // was 110
const COLOSSUS_KB = 380; // was 220 — titan knockback presence
const COLOSSUS_SPLASH_KB = 150; // was 80
const COLOSSUS_REVIVE_CORES = 100; // player ⬡ cores (not squad cores / not aether)
const MILITIA_TYPES = {
  // v2.13.2: smidge HP/dmg buff
  spear: { name: 'Ashen Spearman', melee: true, hp: 230, spd: 215, range: 70, dmg: 14, atk: 0.95, r: 12 },
  bow: { name: 'Ashen Bowman', melee: false, hp: 180, spd: 240, range: 480, dmg: 10, atk: 1.15, r: 12 },
};
// BETA-3.1 step 2 — militia skill tree spends squadSp (✧); wood/gold train costs unchanged
const MILITIA_SKILL_NODES = [
  { key: 'dmg', label: '⚔ Edge (+dmg)', desc: '+28% damage / rank', max: 3 },
  { key: 'armor', label: '🛡 Plate (+armor)', desc: 'Damage resist · +HP on buy', max: 3 },
  { key: 'spd', label: '» Stride (+speed)', desc: '+12% move / rank', max: 3 },
  { key: 'rate', label: '⚡ Tempo (+atk rate)', desc: '+14% attack rate / rank', max: 3 },
  { key: 'magnet', label: '✧ Orb Pull', desc: '+18% squad-orb magnet / rank', max: 3 },
];
const UNIT_SQUAD_SP_COST = [1, 2, 3]; // ✧ cost for militia ranks 1→2→3

function laborerCap() {
  let cap = LABORER_BASE_MAX;
  for (const s of structures) {
    if (s.kind === 'farm') cap += 2 + (s.lvl - 1);
    if (s.kind === 'keep') cap += 2 + s.lvl;
  }
  return cap;
}
function squadLaborerCap() { return SQUAD_LABORER_CAP; }
function canAffordSquadLaborerTrain() {
  return squadSp >= SQUAD_LABORER_TRAIN.sp && squadCores >= SQUAD_LABORER_TRAIN.cores;
}
function spendSquadLaborerTrain() {
  squadSp -= SQUAD_LABORER_TRAIN.sp;
  squadCores -= SQUAD_LABORER_TRAIN.cores;
}
function squadLaborerTrainLabel() {
  return `✧${SQUAD_LABORER_TRAIN.sp} · ◈${SQUAD_LABORER_TRAIN.cores}`;
}
function creditLaborerDeposit(L) {
  if (!L.carry) return;
  const amt = L.carry.amt | 0;
  if (L.carry.type === 'coal') {
    coal += amt; // 8.1 — player coal bank (squad also credits player coal for now)
    return;
  }
  if (L.squadSide) {
    if (L.carry.type === 'wood') squadWood += amt; else squadGold += amt;
  } else {
    if (L.carry.type === 'wood') wood += amt; else gold += amt;
  }
}
function laborerBankWood(L) { return L.squadSide ? squadWood : wood; }
function militiaName(m) { return (MILITIA_TYPES[m.kind] || { name: 'Fighter' }).name; }
function countStruct(kind) { return structures.filter(s => s.kind === kind).length; }
function structureSpotBlocked(bx, by, r) {
  return placementWaterBlockedAt(bx, by, r) || // 10.6 water gate
    obstacles.some(o => dist2(bx, by, o.x, o.y) < (o.r + r) ** 2) ||
    barricades.some(b => dist2(bx, by, b.x, b.y) < (b.r + r - 6) ** 2) ||
    brickWalls.some(w => dist2(bx, by, w.x, w.y) < (BRICKWALL_PILLAR_R + r - 4) ** 2) ||
    structures.some(s => dist2(bx, by, s.x, s.y) < (s.r + r) ** 2) ||
    goldMines.some(g => dist2(bx, by, g.x, g.y) < (g.r + r) ** 2) ||
    coalMines.some(g => dist2(bx, by, g.x, g.y) < (g.r + r) ** 2) ||
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
  if (buildPlaceMode) { cancelBuildPlaceMode(); return; }
  if (buildPickOpen) { closeBuildPick(); return; }
  buildPickOpen = true;
  renderBuildPick();
  $('buildPick').classList.remove('hidden');
}
function closeBuildPick() {
  buildPickOpen = false;
  if ($('buildPick')) $('buildPick').classList.add('hidden');
}
/** BETA-3.1 step 5 — enter tap-to-place mode; freezes horde until place/cancel. */
function enterBuildPlaceMode(kind) {
  if (state !== 'playing' || paused || player.downed) return;
  if (kind === 'barricade' || kind === 'brickwall') {
    buildGhostKind = kind;
    buildPlaceStructKind = null;
  } else {
    buildGhostKind = 'structure';
    buildPlaceStructKind = kind;
  }
  buildPlaceMode = true;
  buildPlacePaused = true;
  beam = null; charging = false; beamCharge = 0;
  mouse.down = false; touch.fire = false;
  closeBuildPick();
  const label = kind === 'barricade' ? 'BARRICADE'
    : kind === 'brickwall' ? 'CLOISTER'
    : ((STRUCT_KINDS[kind] && STRUCT_KINDS[kind].name) || 'BUILD').toUpperCase();
  addFloater(player.x, player.y - 48, 'AIM · TAP TO PLACE ' + label, '#9ef0ff', true);
}
function cancelBuildPlaceMode() {
  if (!buildPlaceMode && !buildPlacePaused) return;
  buildPlaceMode = false;
  buildPlacePaused = false;
  buildPlaceStructKind = null;
  if (buildGhostKind === 'structure') buildGhostKind = 'barricade';
  addFloater(player.x, player.y - 40, 'PLACE CANCELLED', '#9fb2c9', false);
}
function confirmBuildPlace() {
  if (!buildPlaceMode || state !== 'playing' || player.downed) return false;
  let ok = false;
  if (buildGhostKind === 'barricade') ok = tryPlaceBarricade();
  else if (buildGhostKind === 'brickwall') ok = tryPlaceBrickWall();
  else if (buildGhostKind === 'structure' && buildPlaceStructKind) ok = tryPlaceStructure(buildPlaceStructKind);
  if (ok) {
    buildPlaceMode = false;
    buildPlacePaused = false;
    buildPlaceStructKind = null;
  }
  return ok;
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
  bOpt.onclick = () => { buildGhostKind = 'barricade'; enterBuildPlaceMode('barricade'); };
  grid.appendChild(bOpt);
  if (BRICKWALL_ENABLED) {
    const cost = BRICKWALL_COST;
    const locked = brickWalls.length >= BRICKWALL_MAX || !canAffordCosts(cost);
    const wOpt = document.createElement('button');
    wOpt.className = 'buildopt' + (locked ? ' locked' : '');
    wOpt.innerHTML = `<h4>🧱 Cloister Wall</h4>
      <small>Brick stronghold · auto-link straights · corners & T-junctions</small>
      <div class="price">${costLabel(cost)} · ${brickWalls.length}/${BRICKWALL_MAX}</div>`;
    wOpt.onclick = () => { buildGhostKind = 'brickwall'; enterBuildPlaceMode('brickwall'); };
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
    opt.onclick = () => { enterBuildPlaceMode(kind); };
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
  barricades.push({
    x: bx, y: by, r: BARRICADE_BASE_R, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0,
    upRate: 0, upRange: 0, upDmg: 0, upRocket: 0,
  });
  refreshBarricadeLinks();
  const linked = barricades.find(b => Math.hypot(b.x - bx, b.y - by) < 1);
  if (linked && linked.neighbors > 0) {
    addFloater(bx, by - 36, 'LINKED FORTIFY ×' + (1 + linked.neighbors), '#9ef0ff', true);
    spawnParticles(bx, by, 22, '#9ef0ff', 4);
  } else {
    spawnParticles(bx, by, 18, '#7CFC00', 4);
  }
  spawnRing(bx, by, 40);
  sfx.play('place');
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
  sfx.play('place');
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
  sfx.play('place');
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
      riftNetOpen || infirmaryOpen || buildPickOpen || unitPanelOpen || buildPlaceMode || player.downed) return false;
  const wx = clientX + camera.x, wy = clientY + camera.y;
  // units first (laborers / militia / companions)
  if (trySelectUnitAt(wx, wy)) return true;
  let best = null, bestD = 52 * 52;
  for (const s of structures) {
    const d2 = dist2(wx, wy, s.x, s.y - 10);
    if (d2 < bestD) { bestD = d2; best = s; }
  }
  // barricades / sentries — tap for turret upgrade panel
  let bestBar = null, bestBarD = 44 * 44;
  for (const b of barricades) {
    const d2 = dist2(wx, wy, b.x, b.y - 12);
    if (d2 < bestBarD) { bestBarD = d2; bestBar = b; }
  }
  // also allow tapping gold / coal mines for a tip (not a full panel)
  for (const m of goldMines) {
    if (m.goldLeft <= 0) continue;
    if (dist2(wx, wy, m.x, m.y) < 40 * 40) {
      addFloater(m.x, m.y - 36, 'GOLD MINE — order Laborers to Mine', '#ffd54a', false);
      return true;
    }
  }
  for (const m of coalMines) {
    if (!(m.coalLeft > 0)) continue;
    if (dist2(wx, wy, m.x, m.y) < 40 * 40) {
      addFloater(m.x, m.y - 36, 'COAL MINE — black rock for the bike', '#a0a0a0', false);
      return true;
    }
  }
  if (bestBar && (!best || bestBarD <= bestD)) {
    if (dist2(bestBar.x, bestBar.y, player.x, player.y) > 180 * 180) {
      addFloater(player.x, player.y - 36, 'MOVE CLOSER TO TURRET', '#ffd54a', false);
      return true;
    }
    openBarricadePanel(bestBar);
    return true;
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
  for (const L of squadLaborers) {
    if (L.insideMine) continue;
    const d2 = dist2(wx, wy, L.x, L.y - 8);
    if (d2 < bestD) { bestD = d2; best = L; kind = 'squadLaborer'; }
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
  selectedBarricade = null;
  selectedStructure = s;
  structPanelOpen = true;
  renderStructPanel();
  $('structPanel').classList.remove('hidden');
}
function openBarricadePanel(b) {
  closeUnitPanel();
  selectedStructure = null;
  selectedBarricade = b;
  structPanelOpen = true;
  renderStructPanel();
  if ($('structPanel')) $('structPanel').classList.remove('hidden');
}
function closeStructPanel() {
  structPanelOpen = false;
  selectedStructure = null;
  selectedBarricade = null;
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
  if (selectedBarricade) {
    renderBarricadePanel();
    return;
  }
  const s = selectedStructure;
  if (!s || !STRUCT_KINDS[s.kind]) { closeStructPanel(); return; }
  const def = STRUCT_KINDS[s.kind];
  $('structTitle').textContent = def.icon + ' ' + def.name + ' · L' + s.lvl;
  const metaBits = [
    `HP ${Math.ceil(s.hp)}/${s.maxHp}`,
    `Workers ${laborers.length}/${laborerCap()} (not squad)`,
    `Sq workers ${squadLaborers.length}/${squadLaborerCap()}`,
    `Squad ${companions.length + militia.length} · train left ${waveTrainLeft}`,
  ];
  if (s.kind === 'timber') metaBits.push('Chop / deposit hub');
  if (s.kind === 'keep') metaBits.push('Town hub · wood+gold deposit · squad laborers');
  if (s.kind === 'muster') metaBits.push('Combat train · squad laborers');
  if (s.kind === 'farm') metaBits.push('Raises worker cap');
  if (s.kind === 'golddepot') metaBits.push('Gold deposit priority');
  if (structureCanRefuel(s.kind)) {
    metaBits.push(`Refuel: 1 coal → ${FUEL_PER_COAL} fuel (${fuel}/${FUEL_MAX})`);
  }
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
  // Step 8.2 — refuel at existing town buildings (Keep / Timber / Vault / Muster / Pit)
  if (structureCanRefuel(s.kind)) {
    const full = fuel >= FUEL_MAX;
    const noCoal = coal < COAL_PER_REFUEL;
    addBtn(`⛽ REFUEL (+${FUEL_PER_COAL} · 1 coal) · ${fuel}/${FUEL_MAX}`, 'gold', () => {
      if (tryRefuelAtStructure(s)) renderStructPanel();
    }, full || noCoal);
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
  // BETA-3.1 step 3 — squad laborers at Muster / Keep (spend squadSp + squadCores; own wood/gold)
  if (s.kind === 'muster' || s.kind === 'keep') {
    const atCap = squadLaborers.length >= squadLaborerCap();
    const canPay = canAffordSquadLaborerTrain();
    addBtn(`🪓 TRAIN SQUAD LABORER (${squadLaborerTrainLabel()}) · ${squadLaborers.length}/${squadLaborerCap()}`, 'green', () => {
      if (atCap) { addFloater(s.x, s.y - 40, 'MAX SQUAD WORKERS', '#ff8a93', false); return; }
      if (!canAffordSquadLaborerTrain()) {
        addFloater(s.x, s.y - 40, 'NEED ' + squadLaborerTrainLabel(), '#9a9a9a', false); return;
      }
      spendSquadLaborerTrain();
      spawnSquadLaborer(s.x + rand(-30, 30), s.y + 40);
      addFloater(s.x, s.y - 40, 'SQUAD LABORER READY', '#8a92a0', true);
      spawnParticles(s.x, s.y, 18, '#6a7380', 3);
      renderStructPanel();
    }, atCap || !canPay);
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
    addBtn(`✧ SQUAD SKILLS (${squadSp} ✧)`, 'gold', () => {
      closeStructPanel();
      if (!treeOpen) toggleTree();
      else renderTree();
    });
  }
  addBtn(colossusOwned
    ? (colossus && colossus.downed ? '⚔ TITAN DOWN' : (colossus ? '⚔ RECALL TITAN (C)' : '⚔ CALL TITAN (C)'))
    : '⚔ RIFT TITAN (C)', '', () => { closeStructPanel(); trySummonColossus(); });
}
function renderBarricadePanel() {
  const b = selectedBarricade;
  if (!b || !barricades.includes(b)) { closeStructPanel(); return; }
  $('structTitle').textContent = (sentryTier > 0 ? '🔫 Sentry Turret' : '⛨ Barricade') +
    (b.neighbors ? ' · LINK×' + b.neighbors : '');
  $('structMeta').textContent = [
    `HP ${Math.ceil(b.hp)}/${b.maxHp}`,
    `Uplink T${sentryTier}/${SENTRY_MAX_TIER}`,
    `Rate ${b.upRate || 0}/${SENTRY_UP_MAX}`,
    `Range ${b.upRange || 0}/${SENTRY_UP_MAX}`,
    `Dmg ${b.upDmg || 0}/${SENTRY_UP_MAX}`,
    `Rockets ${b.upRocket || 0}/${SENTRY_UP_MAX}`,
    `⬡ ${cores} · ✧s ${squadSp} · ◈s ${squadCores}`,
  ].join(' · ');
  const acts = $('structActions');
  acts.innerHTML = '';
  const addBtn = (label, cls, fn, disabled) => {
    const el = document.createElement('button');
    el.className = cls || '';
    el.textContent = label;
    el.disabled = !!disabled;
    if (!disabled) el.onclick = fn;
    acts.appendChild(el);
  };
  const buyUp = (key, label, costKey) => {
    const lvl = b[key] || 0;
    if (lvl >= SENTRY_UP_MAX) { addBtn(label + ' MAX', '', null, true); return; }
    const price = SENTRY_UP_COSTS[costKey][lvl];
    const needUplink = sentryTier < 1;
    const canPay = cores >= price || squadCores >= price;
    addBtn(label + ' L' + (lvl + 1) + ' (⬡/' + '◈s ' + price + ')', 'gold', () => {
      if (needUplink) {
        addFloater(b.x, b.y - 36, 'BUY SENTRY UPLINK FIRST (shop)', '#ffd54a', false);
        return;
      }
      if (cores >= price) cores -= price;
      else if (squadCores >= price) squadCores -= price;
      else {
        addFloater(b.x, b.y - 36, 'NEED ' + price + ' ⬡ or ◈s', '#ffd54a', false);
        return;
      }
      b[key] = lvl + 1;
      spawnParticles(b.x, b.y - 20, 14, '#ffb02e', 3);
      addFloater(b.x, b.y - 40, label.toUpperCase() + ' L' + b[key], '#7CFC00', true);
      sfx.play('click');
      renderBarricadePanel();
    }, needUplink || !canPay);
  };
  if (sentryTier < 1) {
    addBtn('Sentry Uplink required (shop Field Lab)', '', null, true);
  }
  buyUp('upRate', '⬆ Fire Rate', 'rate');
  buyUp('upRange', '⬆ Range', 'range');
  buyUp('upDmg', '⬆ Damage', 'dmg');
  buyUp('upRocket', 'Rockets', 'rocket');
  if (sentryTier < SENTRY_MAX_TIER) {
    const cost = SENTRY_COSTS[sentryTier];
    addBtn(`⬆ Global Uplink T${sentryTier + 1} (⬡ ${cost})`, 'green', () => {
      if (cores < cost) { addFloater(b.x, b.y - 36, 'NEED ' + cost + ' ⬡', '#ffd54a', false); return; }
      cores -= cost;
      sentryTier++;
      spawnParticles(b.x, b.y - 24, 20, '#9ef0ff', 4);
      addFloater(b.x, b.y - 42, 'SENTRY UPLINK T' + sentryTier, '#9ef0ff', true);
      sfx.play('click');
      renderBarricadePanel();
    }, cores < cost);
  } else {
    addBtn('Global Uplink MAX', '', null, true);
  }
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
  if (kind === 'laborer' || kind === 'squadLaborer') {
    const sq = !!u.squadSide || kind === 'squadLaborer';
    title.textContent = sq ? '🪓 Squad Laborer (squad worker)' : '🪓 Ashen Laborer (worker)';
    meta.textContent = sq
      ? `HP ${Math.ceil(u.hp)}/${u.maxHp} · Order: ${(u.order || 'auto').toUpperCase()} · Deposits to squadWood/squadGold · Cap ${squadLaborers.length}/${squadLaborerCap()} · Not combat squad`
      : `HP ${Math.ceil(u.hp)}/${u.maxHp} · Order: ${(u.order || 'auto').toUpperCase()} · Does NOT use squad slots · Revivable · Retaliates only when attacked`;
    addBtn('Chop Lumber', u.order === 'chop' ? 'green' : '', () => {
      u.order = 'chop'; u.task = 'idle'; u.target = null; u.carry = null; u.insideMine = false;
      addFloater(u.x, u.y - 24, 'ORDER: CHOP', sq ? '#8a92a0' : '#7a9a5a', false);
      renderUnitPanel();
    });
    addBtn('Mine Gold', u.order === 'mine' ? 'gold' : 'gold', () => {
      u.order = 'mine'; u.task = 'idle'; u.target = null; u.carry = null;
      addFloater(u.x, u.y - 24, 'ORDER: MINE', '#ffd54a', false);
      renderUnitPanel();
    });
    addBtn('Auto Gather', u.order === 'auto' || !u.order ? 'green' : '', () => {
      u.order = 'auto'; u.task = 'idle'; u.target = null;
      addFloater(u.x, u.y - 24, 'ORDER: AUTO', sq ? '#8a92a0' : '#c8a06a', false);
      renderUnitPanel();
    });
    addBtn('Follow (build assist)', u.order === 'follow' ? 'green' : '', () => {
      u.order = 'follow'; u.task = 'follow'; u.target = null; u.carry = null; u.insideMine = false;
      addFloater(u.x, u.y - 24, 'ORDER: FOLLOW', '#9ef0ff', false);
      renderUnitPanel();
    });
  } else if (kind === 'militia') {
    const t = MILITIA_TYPES[u.kind];
    if (!u.sk) u.sk = { dmg: 0, armor: 0, spd: 0, rate: 0, magnet: 0 };
    title.textContent = '⚔ ' + t.name + ' (squad)';
    meta.textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · D${u.sk.dmg}/A${u.sk.armor}/S${u.sk.spd}/T${u.sk.rate || 0}/M${u.sk.magnet || 0} · Squad ✧ ${squadSp}`;
    addMilitiaSkillButtons(u, addBtn);
  } else if (kind === 'companion') {
    title.textContent = '★ ' + COMP_TYPES[u.type].name + ' (named companion)';
    meta.textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · Squad ✧ ${squadSp} · Full tree also in K / field lab`;
    addCompanionSkillButtons(u.type, addBtn, u);
  }
}
function addMilitiaSkillButtons(u, addBtn) {
  for (const n of MILITIA_SKILL_NODES) {
    const rank = u.sk[n.key] || 0;
    if (rank >= n.max) { addBtn(n.label + ' MAX', '', null, true); continue; }
    const cost = UNIT_SQUAD_SP_COST[rank] || 3;
    addBtn(`${n.label} L${rank + 1} (✧ ${cost})`, 'gold', () => {
      if (squadSp < cost) { addFloater(u.x, u.y - 30, `NEED ✧ ${cost}`, '#9a9a9a', false); return; }
      squadSp -= cost;
      u.sk[n.key] = rank + 1;
      if (n.key === 'armor') {
        u.maxHp = Math.round(u.maxHp * 1.12);
        u.hp = Math.min(u.maxHp, u.hp + 20);
      }
      spawnParticles(u.x, u.y, 16, '#9a9a9a', 3);
      addFloater(u.x, u.y - 28, n.label.toUpperCase(), '#7CFC00', true);
      renderUnitPanel();
    }, squadSp < cost);
  }
}
function buyCompNode(type, nodeId) {
  const nodes = COMP_NODES[type];
  if (!nodes || !squad.owned[type]) return false;
  const i = nodes.findIndex(n => n.id === nodeId);
  if (i < 0) return false;
  const n = nodes[i];
  const rank = sk(n.id);
  if (rank >= n.max) return false;
  if (i > 0 && sk(nodes[i - 1].id) < 1) return false;
  if (squadSp < COMP_SQ_SP_COST) return false;
  squadSp -= COMP_SQ_SP_COST;
  skillRanks[n.id] = rank + 1;
  refreshCompanionStats();
  return true;
}
function addCompanionSkillButtons(type, addBtn, u) {
  const nodes = COMP_NODES[type] || [];
  nodes.forEach((n, i) => {
    const rank = sk(n.id);
    const prevOk = i === 0 || sk(nodes[i - 1].id) >= 1;
    if (rank >= n.max) { addBtn(`${n.name} MAX`, '', null, true); return; }
    const locked = !prevOk;
    const need = COMP_SQ_SP_COST;
    addBtn(`${n.name} ${rank}/${n.max} (✧ ${need})`, locked ? '' : 'gold', () => {
      if (locked) return;
      if (!buyCompNode(type, n.id)) {
        addFloater(u.x, u.y - 30, squadSp < need ? `NEED ✧ ${need}` : 'LOCKED', '#9a9a9a', false);
        return;
      }
      spawnParticles(u.x, u.y, 16, '#4de1ff', 3);
      addFloater(u.x, u.y - 28, n.name.toUpperCase(), '#7CFC00', true);
      renderUnitPanel();
    }, locked || squadSp < need);
  });
  addBtn('✧ Open full Squad tree (K)', '', () => {
    closeUnitPanel();
    if (!treeOpen) toggleTree();
    else renderTree();
  });
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
    sk: { dmg: 0, armor: 0, spd: 0, rate: 0, magnet: 0 },
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
    squadSide: false,
  });
}
function spawnSquadLaborer(x, y) {
  // BETA-3.1 step 3 — same pipeline/size as Ashen Laborer; slate shirt; deposits to squadWood/squadGold
  squadLaborers.push({
    id: laborerIdSeq++,
    x, y, vx: 0, vy: 0, r: 11, hp: 90, maxHp: 90,
    carry: null,
    target: null, task: 'idle', order: 'auto',
    gatherT: 0, walk: rand(0, 8), facing: 1, hurtT: 0,
    insideMine: false, mineT: 0,
    downed: false, atkCd: rand(0.2, 0.6), swipeT: 0, retaliateT: 0,
    squadSide: true,
  });
}
function nearestDeposit(from, resType) {
  let best = null, bd = 1e12;
  const prefer = resType === 'gold'
    ? ['golddepot', 'keep', 'timber', 'muster']
    : resType === 'coal'
    ? ['keep', 'timber', 'golddepot', 'muster'] // 8.1 — any town drop until fuel shed (8.2/8.4)
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
    if (o.isle) continue; // 10.4 — Driftwood Isle grove is player-chop only (nobody wades)
    if (o.exterior) {
      // Step 7.1 — exterior trees choppable when fog-revealed (player/squad assist)
      if (!EXTERIOR_CHOP_ENABLED || !PLAYER_EXTERIOR_ASSIST_ENABLED) continue;
      if (!isExteriorSiteVisible(o.x, o.y)) continue;
    }
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
    if (g.exterior) {
      // Step 7.2 — exterior mines harvestable when fog-revealed (player/squad assist)
      if (!EXTERIOR_MINE_ENABLED || !PLAYER_EXTERIOR_ASSIST_ENABLED) continue;
      if (!isExteriorSiteVisible(g.x, g.y)) continue;
    }
    const d2 = dist2(L.x, L.y, g.x, g.y);
    if (d2 < vd) { vd = d2; mine = g; }
  }
  return mine;
}
/** Step 8.1 — player/squad laborers: nearest fog-known exterior coal mine. */
function pickCoalTarget(L) {
  if (!EXTERIOR_COAL_ENABLED || !PLAYER_EXTERIOR_ASSIST_ENABLED) return null;
  let mine = null, vd = 720 * 720;
  for (const g of coalMines) {
    if (!(g.coalLeft > 0)) continue;
    if (!isExteriorSiteVisible(g.x, g.y)) continue;
    const d2 = dist2(L.x, L.y, g.x, g.y);
    if (d2 < vd) { vd = d2; mine = g; }
  }
  return mine;
}
function updateLaborers(dt) {
  const rate = gatherRateMul();
  const LABORER_RETALIATE_RANGE = 160;
  const LABORER_DMG = 7;
  const lists = [laborers, squadLaborers];
  for (const list of lists) for (const L of list) {
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
        if (!L._retaliateBarked) { L._retaliateBarked = true; tryLaborerBark(L, 'alert'); }
        else tryLaborerBark(L, 'combat');
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
          tryLaborerBark(L, 'attack');
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, LABORER_DMG, (foe.x - L.x) / d, (foe.y - L.y) / d, 90);
          zap(L.x, L.y - 6, foe.x, foe.y - 8);
          spawnParticles(foe.x, foe.y - 6, 3, L.squadSide ? '#6a7380' : '#c8a06a', 2);
        }
        continue;
      }
      L._retaliateBarked = false;
      // no foe in range while retaliating — resume work (timer still ticks down)
    } else {
      L._retaliateBarked = false;
    }
    // inside mine: work then exit with gold/coal
    if (L.insideMine && L.target) {
      L.mineT = (L.mineT || 0) - dt;
      L.vx = 0; L.vy = 0;
      if (L.mineT <= 0) {
        if (L.target.resource === 'coal') {
          if (L.target.coalLeft > 0) {
            L.target.coalLeft--;
            L.carry = { type: 'coal', amt: 1 + (Math.random() < 0.2 * rate ? 1 : 0) };
            L.target.occupied = Math.max(0, (L.target.occupied || 1) - 1);
            spawnParticles(L.target.x, L.target.y - 8, 5, '#8a8a8a', 2);
          }
          L.insideMine = false;
          L.task = 'deposit';
          L.target = nearestDeposit(L, 'coal');
        } else {
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
      }
      continue;
    }
    if (L.order === 'follow') {
      L.task = 'follow'; L.target = null;
    } else if (!L.carry && L.task !== 'gather' && L.task !== 'enterMine') {
      const want = L.order || 'auto';
      const tree = pickChopTarget(L);
      const mine = pickMineTarget(L);
      const coalM = pickCoalTarget(L);
      if (want === 'chop' && tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
      else if (want === 'mine' && mine) { L.task = 'enterMine'; L.target = mine; L.res = 'gold'; }
      else if (want === 'auto') {
        if (laborerBankWood(L) < 90 && tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
        else {
          // Prefer nearer of gold vs coal when both in range
          let pick = null, pickRes = null;
          if (mine && coalM) {
            if (dist2(L.x, L.y, mine.x, mine.y) <= dist2(L.x, L.y, coalM.x, coalM.y)) {
              pick = mine; pickRes = 'gold';
            } else { pick = coalM; pickRes = 'coal'; }
          } else if (mine) { pick = mine; pickRes = 'gold'; }
          else if (coalM) { pick = coalM; pickRes = 'coal'; }
          if (pick) { L.task = 'enterMine'; L.target = pick; L.res = pickRes; }
          else if (tree) { L.task = 'gather'; L.target = tree; L.res = 'wood'; }
          else { L.task = 'idle'; L.target = null; }
        }
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
          sfx.play('mine');
        } else if (L.gatherT <= 0) {
          L.gatherT = 1.15 / rate;
          tryLaborerBark(L, 'work');
          if (L.res === 'wood' && L.target.woodLeft > 0) {
            sfx.play('chop');
            L.target.woodLeft--;
            L.carry = { type: 'wood', amt: 1 + (Math.random() < 0.25 * rate ? 1 : 0) };
            spawnParticles(L.target.x, L.target.y - 10, 3, L.squadSide ? '#6a7380' : '#7a9a5a', 2);
          } else {
            L.task = 'idle'; L.target = null;
          }
        }
      }
    } else if (L.task === 'deposit') {
      const tipCol = L.squadSide ? '#8a92a0' : '#ffd54a';
      const tipW = L.squadSide ? '+S🪵' : '+🪵';
      const tipG = L.squadSide ? '+S◈' : '+◈';
      const tipC = '+⬤';
      const tipWD = L.squadSide ? '+S WOOD' : '+WOOD';
      const tipGD = L.squadSide ? '+S GOLD' : '+GOLD';
      const tipCD = '+COAL';
      const tipShort = L.carry.type === 'wood' ? tipW : L.carry.type === 'coal' ? tipC : tipG;
      const tipLong = L.carry.type === 'wood' ? tipWD : L.carry.type === 'coal' ? tipCD : tipGD;
      const tipColor = L.carry.type === 'coal' ? '#a0a0a0' : tipCol;
      if (!L.target) {
        creditLaborerDeposit(L);
        addFloater(L.x, L.y - 22, tipShort, tipColor, false);
        L.carry = null; L.task = 'idle';
      } else {
        gx = L.target.x; gy = L.target.y;
        if (dist2(L.x, L.y, gx, gy) < (L.target.r + 10) ** 2) {
          creditLaborerDeposit(L);
          addFloater(L.target.x, L.target.y - 36, tipLong, tipColor, false);
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
  if (selectedUnit && (selectedUnit.kind === 'laborer' || selectedUnit.kind === 'squadLaborer') &&
      !laborers.includes(selectedUnit.ref) && !squadLaborers.includes(selectedUnit.ref))
    closeUnitPanel();
}
function hurtLaborer(L, dmg) {
  if (L.insideMine || L.downed) return; // safe while in mine shaft
  L.hp -= dmg;
  L.hurtT = 0.5;
  L.retaliateT = 6; // v2.13.2: only fight back after taking a hit
  tryLaborerBark(L, 'hurt');
  if (L.hp <= 0) {
    L.hp = 0;
    L.downed = true;
    L.vx = 0; L.vy = 0;
    L.insideMine = false;
    L.carry = null;
    L.task = 'idle';
    L.retaliateT = 0;
    spawnParticles(L.x, L.y, 12, L.squadSide ? '#6a7380' : '#c8a06a', 3);
    addFloater(L.x, L.y - 28, L.squadSide ? 'SQUAD LABORER DOWN' : 'LABORER DOWN', '#ff8a93', false);
  }
}
function finishLaborerRevive(L) {
  L.downed = false;
  L.hp = Math.ceil(L.maxHp * 0.65);
  L.hurtT = 0.8;
  L.task = 'idle';
  spawnParticles(L.x, L.y, 14, L.squadSide ? '#8a92a0' : '#4de1ff', 4);
  addFloater(L.x, L.y - 32, L.squadSide ? 'SQUAD LABORER REVIVED' : 'LABORER REVIVED', L.squadSide ? '#8a92a0' : '#4de1ff', true);
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
  for (const L of squadLaborers) {
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
  if (colossusOnField() && dist2(e.x, e.y, colossus.x, colossus.y) < (e.r + colossus.r) ** 2) {
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
function militiaInterval(m) {
  const t = MILITIA_TYPES[m.kind];
  return t.atk / (1 + 0.14 * (m.sk.rate || 0));
}
function hurtMilitia(m, dmg) {
  if (m.downed || m.hurtT > 0) return;
  dmg *= 1 / (1 + 0.18 * (m.sk.armor || 0));
  if (dist2(m.x, m.y, player.x, player.y) < 115 * 115) dmg *= 0.58;
  m.hp -= dmg;
  m.hurtT = 0.65;
  spawnParticles(m.x, m.y - 10, 5, '#ff8a93', 2);
  tryMilitiaBark(m, 'hurt');
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
    // 4.1.2 FREEZE FIX — grid queries replace the militia×enemies full scan (same
    // candidate set: within aggro of self OR within 440 of the player; nearest to self)
    let foe = null, fd2 = Infinity;
    forEachEnemyNear(m.x, m.y, aggro, e => {
      if (e.spawnT > 0.3 || (e.emergeT || 0) > 0) return;
      const d2 = dist2(e.x, e.y, m.x, m.y);
      if (d2 < fd2) { fd2 = d2; foe = e; }
    });
    forEachEnemyNear(player.x, player.y, 440, e => {
      if (e.spawnT > 0.3 || (e.emergeT || 0) > 0) return;
      const d2 = dist2(e.x, e.y, m.x, m.y);
      if (d2 < fd2) { fd2 = d2; foe = e; }
    });
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
    // gait cadence: stride when moving, soft idle breath when planted (visual only)
    const spdNow = Math.hypot(m.vx, m.vy);
    m.walk += dt * (spdNow > 16 ? spdNow * 0.045 : 1.05);
    // Procedural L/R facing only (no militia art sheets): prefer lateral move; avoid flicker on N/S stride
    if (spdNow > 16 && Math.abs(m.vx) >= Math.abs(m.vy) * 0.55) m.facing = m.vx >= 0 ? 1 : -1;
    if (pd2 > 1300 * 1300) { m.x = player.x + rand(-70, 70); m.y = player.y + rand(-70, 70); }
    if (foe) {
      m.aim = Math.atan2(foe.y - m.y, foe.x - m.x);
      m.facing = Math.cos(m.aim) >= 0 ? 1 : -1;
      if (t.melee) {
        // spear reach uses type.range (70) so they poke instead of needing body contact
        const reach = Math.max(m.r + foe.r + 14, t.range);
        if (m.atkCd <= 0 && fd2 < reach * reach) {
          m.atkCd = militiaInterval(m);
          m.swipeT = UNIT_SWIPE;
          tryMilitiaBark(m, 'attack');
          const d = Math.sqrt(fd2) || 1;
          directDamage(foe, militiaDamage(m), (foe.x - m.x) / d, (foe.y - m.y) / d, 130);
          zap(m.x, m.y - 8, foe.x, foe.y - 10);
          spawnParticles(foe.x, foe.y - 8, 4, '#c8a06a', 2);
        }
      } else if (m.atkCd <= 0 && fd2 < t.range * t.range) {
        m.atkCd = militiaInterval(m);
        m.swipeT = UNIT_SWIPE * 0.65;
        tryMilitiaBark(m, 'attack');
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
function colossusActive() { return !!(colossus && !colossus.downed); }
function colossusOnField() { return !!colossus; }
function makeColossusEntity(x, y, hp, downed, facing) {
  const maxHp = COLOSSUS_MAX_HP;
  const h = downed ? 0 : clamp(hp == null ? maxHp : hp, 0, maxHp);
  return {
    x, y,
    r: 54, // SIZE LOCK — Gharok collision scale
    hp: h, maxHp, vx: 0, vy: 0,
    atkCd: 0.6, walk: 0, facing: facing || 1, dead: false,
    downed: !!downed, swipeT: 0, hurtT: 0,
  };
}
function deployColossus(opts) {
  const hp = opts && opts.hp != null ? opts.hp : (colossusDockHp > 0 ? colossusDockHp : COLOSSUS_MAX_HP);
  // Step 10.5 — CALL TITAN while afloat / out on a pier lands the titan on the nearest
  // shore instead of in the water (pad covers his r=54 bulk past the clamp margin)
  const gp = lakeGuardSpawnPos(player.x + Math.cos(player.aim) * 50,
                               player.y + Math.sin(player.aim) * 50, 60);
  colossus = makeColossusEntity(gp.x, gp.y, hp, false, player.facing || 1);
  colossusOwned = true;
  colossusDockHp = colossus.hp;
  spawnParticles(colossus.x, colossus.y, 50, '#b04dff', 6);
  spawnRing(colossus.x, colossus.y, 70);
  camera.shake = Math.max(camera.shake, 10);
  buzz([40, 30, 50]);
  tryColossusBark(colossus, 'deploy');
}
function recallColossus() {
  if (!colossus || colossus.downed) return;
  colossusDockHp = Math.max(1, colossus.hp);
  tryColossusBark(colossus, 'recall');
  addFloater(colossus.x, colossus.y - 50, 'TITAN RECALLED', '#b04dff', true);
  spawnParticles(colossus.x, colossus.y, 36, '#b04dff', 5);
  spawnRing(colossus.x, colossus.y, 50);
  colossus = null;
  banner('TITAN DOCKED', 'call out anytime — still yours');
}
function trySummonColossus() {
  if (state !== 'playing' || paused || dialogOpen || treeOpen || vendorOpen || settingsOpen ||
      riftNetOpen || infirmaryOpen || buildPickOpen || player.downed) return;
  // Owned: call out / call back (no duration). Downed stays on field until 100⬡ revive.
  if (colossusOwned) {
    if (colossus && colossus.downed) {
      addFloater(player.x, player.y - 40, `TITAN DOWN — HOLD TALK · ${COLOSSUS_REVIVE_CORES} ⬡`, '#ff8a93', false);
      return;
    }
    if (colossus) { recallColossus(); return; }
    deployColossus();
    banner('AETHER COLOSSUS', 'rift titan called out');
    return;
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
  deployColossus({ hp: COLOSSUS_MAX_HP });
  banner('AETHER COLOSSUS', 'rift titan assembled — stays until recalled');
}
function updateColossus(dt) {
  if (!colossus) return;
  if (colossus.hurtT > 0) colossus.hurtT = Math.max(0, colossus.hurtT - dt);
  if (colossus.swipeT > 0) colossus.swipeT = Math.max(0, colossus.swipeT - dt);
  if (colossus.downed) {
    colossus.vx = 0; colossus.vy = 0;
    return;
  }
  colossus.atkCd -= dt;
  let foe = null, fd2 = 420 * 420;
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.3) continue;
    const d2 = dist2(e.x, e.y, colossus.x, colossus.y);
    if (d2 < fd2) { fd2 = d2; foe = e; }
  }
  let gx = player.x + 40, gy = player.y + 40;
  if (foe) { gx = foe.x; gy = foe.y; }
  const dx = gx - colossus.x, dy = gy - colossus.y, gd = Math.hypot(dx, dy) || 1;
  const spd = COLOSSUS_SPD;
  if (gd > 40) { colossus.vx = lerp(colossus.vx, dx / gd * spd, dt * 3); colossus.vy = lerp(colossus.vy, dy / gd * spd, dt * 3); }
  else { colossus.vx *= 0.85; colossus.vy *= 0.85; }
  colossus.x = clamp(colossus.x + colossus.vx * dt, colossus.r, WORLD.w - colossus.r);
  colossus.y = clamp(colossus.y + colossus.vy * dt, colossus.r, WORLD.h - colossus.r);
  collideObstacles(colossus);
  colossus.walk += dt * 2;
  if (Math.abs(colossus.vx) > 3) colossus.facing = colossus.vx >= 0 ? 1 : -1;
  if (foe && !colossus._barkedAlert) {
    colossus._barkedAlert = true;
    tryColossusBark(colossus, 'alert');
  }
  colossus._barkCombatCd = (colossus._barkCombatCd || rand(3.6, 6.4)) - dt;
  if (foe && colossus._barkCombatCd <= 0) {
    colossus._barkCombatCd = rand(4.4, 7.2);
    tryColossusBark(colossus, 'combat');
  }
  if (foe && colossus.atkCd <= 0 && fd2 < (colossus.r + foe.r + 18) ** 2) {
    colossus.atkCd = COLOSSUS_ATK_CD;
    colossus.swipeT = UNIT_SWIPE * 1.2;
    const d = Math.sqrt(fd2) || 1;
    const dmg = COLOSSUS_DMG_BASE + wave * COLOSSUS_DMG_WAVE;
    directDamage(foe, dmg, (foe.x - colossus.x) / d, (foe.y - colossus.y) / d, COLOSSUS_KB);
    spawnParticles(foe.x, foe.y, 12, '#b04dff', 3);
    tryColossusBark(colossus, 'attack');
    const rr = COLOSSUS_SPLASH_R * COLOSSUS_SPLASH_R;
    for (const e of enemies) {
      if (e === foe || e.dead) continue;
      if (dist2(e.x, e.y, colossus.x, colossus.y) < rr)
        directDamage(e, COLOSSUS_SPLASH, 0, 0, COLOSSUS_SPLASH_KB);
    }
  }
}
function hurtColossus(dmg) {
  if (!colossus || colossus.downed || colossus.hurtT > 0) return;
  colossus.hp -= dmg;
  colossus.hurtT = 0.72;
  spawnParticles(colossus.x, colossus.y - 20, 8, '#ff8a93', 3);
  tryColossusBark(colossus, 'hurt');
  if (colossus.hp <= 0) {
    colossus.hp = 0;
    colossus.downed = true;
    colossus.vx = 0; colossus.vy = 0;
    colossus.swipeT = 0;
    addFloater(colossus.x, colossus.y - 50, 'TITAN DOWN', '#ff8a93', true);
    spawnParticles(colossus.x, colossus.y, 40, '#b04dff', 5);
    buzz([40, 40, 50]);
    sfx.play('bark', { voice: 'colossus', throttle: 0.05 });
    addFloater(colossus.x, colossus.y - 72, 'CORE DIM', '#e0b8ff', true);
  }
}
function finishColossusRevive(c) {
  if (!c) return;
  c.downed = false;
  c.hp = Math.ceil(c.maxHp * 0.65);
  c.hurtT = 0.8;
  colossusDockHp = c.hp;
  spawnParticles(c.x, c.y, 22, '#4de1ff', 5);
  addFloater(c.x, c.y - 50, 'TITAN REVIVED', '#4de1ff', true);
  sfx.play('click');
  tryColossusBark(c, 'deploy');
}
function buyColossusRevive() {
  if (!colossus || !colossus.downed) return false;
  if (cores < COLOSSUS_REVIVE_CORES) return false;
  cores -= COLOSSUS_REVIVE_CORES;
  finishColossusRevive(colossus);
  addFloater(player.x, player.y - 52, `−${COLOSSUS_REVIVE_CORES} ⬡`, '#4de1ff', false);
  return true;
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
      b.rocketCd = (b.rocketCd || 0) - dt;
      // 4.1.2 FREEZE FIX — grid query (was barricades×enemies full scan)
      let foe = null, fd2 = barricadeSentryRange(b) ** 2;
      forEachEnemyNear(b.x, b.y, barricadeSentryRange(b), e => {
        if (e.spawnT > 0.3 || e.emergeT > 0) return;
        const d2 = dist2(e.x, e.y, b.x, b.y);
        if (d2 < fd2) { fd2 = d2; foe = e; }
      });
      if (!foe) continue;
      b.gunA = Math.atan2(foe.y - b.y, foe.x - b.x); // scrappy servo: snaps to target
      // rocket volleys (per-barricade upgrade) — slow AoE, distinct from bolts
      if ((b.upRocket || 0) > 0 && b.rocketCd <= 0) {
        b.rocketCd = Math.max(1.1, 2.4 - 0.35 * b.upRocket);
        const a = b.gunA + rand(-0.04, 0.04);
        const spd = 420;
        sbolts.push({
          x: b.x + Math.cos(a) * 14, y: b.y - 28 + Math.sin(a) * 14,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1.4,
          rocket: true, splash: 48 + 10 * b.upRocket,
          dmgMul: 1.35 + 0.25 * b.upRocket,
          from: b,
        });
        b.gunFlash = 0.1;
      }
      if (b.gunCd > 0) continue;
      b.gunCd = barricadeSentryInterval(b);
      b.gunFlash = 0.07;
      const barrels = sentryTier >= 3 ? 2 : 1;
      for (let i = 0; i < barrels; i++) {
        const a = b.gunA + (barrels === 1 ? 0 : (i - 0.5) * 0.12) + rand(-0.03, 0.03);
        sbolts.push({
          x: b.x + Math.cos(a) * 14, y: b.y - 28 + Math.sin(a) * 14,
          vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, life: 0.8,
          from: b,
        });
      }
    }
  }
  for (const s of sbolts) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (obstacleBlockedAt(s.x, s.y, 0, false)) {
      if (s.rocket) {
        const R = s.splash || 55;
        spawnRing(s.x, s.y, R);
        spawnParticles(s.x, s.y, 12, '#ff8a4a', 3);
        for (const e of enemies) {
          if (e.dead || e.spawnT > 0.4) continue;
          if (dist2(s.x, s.y, e.x, e.y) < (R + e.r) ** 2) {
            const dmg = barricadeSentryDamage(s.from) * (s.dmgMul || 1.5);
            directDamage(e, dmg, 0, 0, 60);
          }
        }
      }
      s.life = 0; continue;
    }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0.4) continue;
      if (dist2(s.x, s.y + 22, e.x, e.y) < (e.r + (s.rocket ? 10 : 6)) ** 2) {
        if (s.rocket) {
          const R = s.splash || 55;
          spawnRing(s.x, s.y, R);
          spawnParticles(s.x, s.y, 14, '#ff8a4a', 3);
          for (const o of enemies) {
            if (o.dead || o.spawnT > 0.4) continue;
            if (dist2(s.x, s.y, o.x, o.y) < (R + o.r) ** 2) {
              const dmg = barricadeSentryDamage(s.from) * (s.dmgMul || 1.5) * (o === e ? 1 : 0.65);
              directDamage(o, dmg, 0, 0, 70);
            }
          }
        } else {
          let dmg = barricadeSentryDamage(s.from);
          if (sentryTier >= 4 && e.armor > 0) chipArmor(e, dmg * 0.35); // overcharge chips plates
          directDamage(e, dmg, s.vx / 760, s.vy / 760, 40);
          spawnParticles(s.x, s.y, 3, sentryTier >= 4 ? '#9ef0ff' : '#ffb02e', 2);
        }
        s.life = 0;
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
  if (bike.mounted || boat.mounted) return; // no dash on wheels or water (10.3 parity)
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
  tickFuelBurn(dt); // 8.2 — burns when mounted (8.3)
  tickBikeWreckSmoke(dt);
  wdSurfaceBootReport(); // 4.1.2 — one-shot "last session froze in X" banner
  wdMark('player+fog');  // 4.1.2 watchdog section
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
  } else if (boat.mounted) {
    boatThrustFrame(dx, dy, m, dt); // 10.3 — thrust + glide; no instant velocity set on water
  } else if (m > 0.08) {
    const cap = Math.min(1, m);
    player.vx = dx / m * moveSpeed() * cap;
    player.vy = dy / m * moveSpeed() * cap;
  } else { player.vx *= 0.8; player.vy *= 0.8; }
  player.moving = !player.downed && Math.hypot(player.vx, player.vy) > 30;
  if (player.moving) {
    if (!boat.mounted) player.walk += dt * 11; // rider stands braced afloat — no leg cycle
    if (bike.mounted) bike.walk += dt * 14;
  }
  player.x = clamp(player.x + player.vx * dt, player.r, WORLD.w - player.r);
  player.y = clamp(player.y + player.vy * dt, player.r, WORLD.h - player.r);
  collideObstacles(player);
  tickBoat(dt); // 10.3 — hull sync, wake, wave-gate ash drain (after the clamps)
  updateFogDiscovery();
  updateRiftNet(dt);

  // ---- aim ----
  if (IS_TOUCH) {
    // During place mode, aim from joystick (not enemy auto-aim) so ghost follows look
    if (buildPlaceMode) {
      if (touch.joy.active) player.aim = Math.atan2(touch.joy.y, touch.joy.x);
    } else autoAim();
  } else player.aim = Math.atan2(mouse.y + camera.y - player.y, mouse.x + camera.x - player.x);
  player.facing = Math.cos(player.aim) >= 0 ? 1 : -1;

  // learning engine: track lingering position
  campTrackX = lerp(campTrackX, player.x, dt * 0.25);
  campTrackY = lerp(campTrackY, player.y, dt * 0.25);

  // ---- regen / cooldowns ----
  player.novaCd = Math.max(0, player.novaCd - dt);
  player.grenCd = Math.max(0, player.grenCd - dt);
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.hurtT = Math.max(0, player.hurtT - dt);
  if ((player.webSlowT || 0) > 0) player.webSlowT = Math.max(0, player.webSlowT - dt);
  // Burstweaver ash venom — 10s DoT on HP + aether drain
  if ((player.poisonT || 0) > 0 && !player.downed) {
    const before = player.hp;
    player.poisonT = Math.max(0, player.poisonT - dt);
    player.hp -= (player.poisonDps || BURSTWEAVER_POISON_DPS) * dt * (1 - armorReduce());
    player.ki = Math.max(0, player.ki - (player.poisonKiDps || BURSTWEAVER_POISON_KI_DPS) * dt);
    if (Math.random() < dt * 9) spawnParticles(player.x + rand(-8, 8), player.y - 14, 1, '#a060c0', 1.6);
    if (before > 0 && player.hp <= 0) {
      player.hp = 0.01;
      hurtPlayer(1);
    }
  }
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
  tickIsleContent(dt); // Step 10.4 — ferry cache walk-over claim + player grove chop

  // ---- barricade exit-blast: leaving your fence repels the mob ----
  pulseCd = Math.max(0, pulseCd - dt);
  if (pulseCd <= 0 && !buildPlacePaused) {
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
    if (!buildPlacePaused && player.form === 2 && Math.random() < dt * 7) {
      let best = null, bd = 180 * 180;
      for (const e of enemies) if (!e.dead) { const d2 = dist2(e.x, e.y, player.x, player.y); if (d2 < bd) { bd = d2; best = e; } }
      if (best) { dealDamage(best, 10, 'melee', 0, 0, 0); zap(player.x, player.y - 20, best.x, best.y - 12); }
    }
  }

  // ---- weapons ----
  wdMark('weapons');
  if (!player.downed && !buildPlaceMode) fireWeapons(dt);
  const wantCharge = !player.downed && !buildPlaceMode && (mouse.rdown || touch.beamHeld);
  if (wantCharge && !beam) {
    charging = true;
    beamCharge = clamp(beamCharge + dt * 0.9, 0, 1);
    player.vx *= 0.4; player.vy *= 0.4;
    if (beamCharge > 0.08) sfx.play('beamCharge');
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
  wdMark('spawning+waveend');
  if (!buildPlacePaused) {
    if (waveActive && spawnQueue > 0) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTimer = Math.max(0.25, 1.1 - wave * 0.05);
        const burst = Math.min(spawnQueue, 1 + (Math.random() < 0.3 ? 1 : 0));
        for (let i = 0; i < burst; i++) { spawnEnemy(pickEnemyType()); spawnQueue--; }
      }
    }
    // 4.1.1 FREEZE FIX — exteriorOnly ambients (Burstweaver) no longer hold the wave
    // hostage: if the player stays inside legacy the spider waits at the border forever
    // and `enemies.every(e => e.dead)` could never fire → wave never ended (stall).
    if (waveActive && spawnQueue === 0) {
      let cleared = true;
      for (const e of enemies) { if (!e.dead && !e.exteriorOnly) { cleared = false; break; } }
      if (cleared) endWave();
    }
  }

  // ---- enemies ----
  wdMark('enemies');
  // Place pause: freeze enemy AI / movement / attacks while buildPlacePaused
  if (!buildPlacePaused) {
  rebuildEnemyGrid();   // 4.1.2 — one bucket pass feeds separation + militia/sentry/hold scans
  computeHoldThreats(); // 4.1.2 — per-frame hold aggro lists (hold units fight real enemies)
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
    // 4.1.2 — exterior brawls: inside a hold's aggro ring, a non-boss enemy turns on
    // the nearest orange defender (unit or captain) when that defender is closer than
    // the player — so fights at holds actually LOOK like fights, not a mob filing past.
    if (HOLD_COMBAT_ENABLED && e._nearHoldId && !e.boss && tgt === player && !isAshenSpiderType(e)) {
      const hh = holdById(e._nearHoldId);
      let best = null, bd2 = dist2(e.x, e.y, player.x, player.y);
      if (hh) {
        for (const u of holdUnits) {
          if (u.holdId !== hh.id || u.downed) continue;
          const d2 = dist2(e.x, e.y, u.x, u.y);
          if (d2 < bd2) { bd2 = d2; best = u; }
        }
        const cap = hh.captain;
        if (cap && !cap.downed) {
          const d2 = dist2(e.x, e.y, cap.x, cap.y);
          if (d2 < bd2) { bd2 = d2; best = cap; }
        }
      }
      if (best) tgt = best;
    }
    if (SPIDER_HUNT_ENABLED && isAshenSpiderType(e)) tgt = player;
    // Step 10.5 — water rules: the caster may swim after a water-camping target; land-bound
    // melee re-targets the nearest land threat (or holds a shore patrol slot) instead of
    // piling into the waterline. Ranged keeps plinking the camper — bolts cross water.
    updateShamanSwim(e, tgt);
    if (lakeLeashApplies(e, tgt)) tgt = pickLakeLeashTarget(e) || lakeShoreHoldPoint();
    e._tgt = tgt; // exposed for the test harness
    let seekPt = spiderSeekPoint(e, tgt);
    // a swimmer whose reason left the water (target back ashore / re-picked) strokes home
    if (e.swim && !lakeSwimWants(e, tgt)) seekPt = lakeNearestShore(e.x, e.y, 26);
    const ex = seekPt.x - e.x, ey = seekPt.y - e.y;
    const d = Math.hypot(ex, ey) || 1;
    const wantD = e.ranged && !e.boss && !e.swim ? 260 : (tgt._shoreHold ? LAKE_LEASH_HOLD_R : 0);
    const dir = d > wantD ? 1 : -0.6;
    let spdMul = 1;
    if (e.slowT > 0) { e.slowT -= dt; spdMul = FENCE_SLOW; } // fence tier 2+ drag
    if (e.swim) spdMul *= SHAMAN_SWIM_SPEED_MUL; // Step 10.5 — slow, deliberate stroke
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
    let bwPhase = 'ok';
    if (e.type === 'burstweaver') bwPhase = tickBurstweaverCombat(e, dt, tgt);
    else if (e.type === 'broodmother') bwPhase = tickBroodmotherCombat(e, dt, tgt);
    else if (e.type === 'spiderling') { tickSpiderlingCombat(e, dt, tgt); bwPhase = 'ok'; }
    if (bwPhase !== 'swell') {
      const seekUx = ex / d, seekUy = ey / d;
      const steer = updateEnemySteerState(e, dt, seekPt.x, seekPt.y, seekUx, seekUy);
      const huntMul = spiderHuntMoveMul(e);
      e.vx = lerp(e.vx, steer.ux * e.spd * spdMul * dir * huntMul, dt * 4);
      e.vy = lerp(e.vy, steer.uy * e.spd * spdMul * dir * huntMul, dt * 4);
    }
    // 7.4B/C — Burstweaver never enters legacy; turn back at border
    if (isAshenSpiderType(e)) { steerBurstweaverFromLegacy(e, dt); tickBurstweaverLeash(e, dt); }
    // warlord / decade mass drag — knockback bleeds off fast so rifle ticks don't skate them
    if (e.boss) { e.vx *= Math.pow(0.08, dt); e.vy *= Math.pow(0.08, dt); }
    else if (e.decadeBoss) { e.vx *= Math.pow(0.14, dt); e.vy *= Math.pow(0.14, dt); }
    // 4.1.2 FREEZE FIX — separation via grid buckets (was ALL-pairs O(n²); max pair
    // reach ≈ 102px, query 128 leaves margin for same-frame drift)
    forEachEnemyNear(e.x, e.y, 128, o => {
      if (o === e) return;
      const d2 = dist2(e.x, e.y, o.x, o.y), minD = e.r + o.r;
      if (d2 < minD * minD && d2 > 0.01) {
        const dd = Math.sqrt(d2);
        e.vx += (e.x - o.x) / dd * 40; e.vy += (e.y - o.y) / dd * 40;
      }
    });
    e.x = clamp(e.x + e.vx * dt, e.r, WORLD.w - e.r);
    e.y = clamp(e.y + e.vy * dt, e.r, WORLD.h - e.r);
    if (isAshenSpiderType(e) && inLegacyWorld(e.x, e.y)) {
      const lx = LEGACY_WORLD.x, ly = LEGACY_WORLD.y, lw = LEGACY_WORLD.w, lh = LEGACY_WORLD.h;
      const pad = e.r + 10;
      const left = e.x - lx, right = (lx + lw) - e.x, top = e.y - ly, bot = (ly + lh) - e.y;
      const m = Math.min(left, right, top, bot);
      if (m === left) e.x = lx - pad;
      else if (m === right) e.x = lx + lw + pad;
      else if (m === top) e.y = ly - pad;
      else e.y = ly + lh + pad;
      e.vx *= 0.2; e.vy *= 0.2;
    }
    if (ENEMY_STEER_ENABLED && e.climbT > 0) {
      const savedR = e.r;
      e.r = Math.max(8, e.r * 0.5);
      collideObstacles(e);
      e.r = savedR;
    } else collideObstacles(e);
    if (ENEMY_STEER_ENABLED) applyEnemySteerAfterCollide(e, tgt.x, tgt.y);
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
    // Burstweaver uses bite/web/explode instead of default contact melee
    const pd2c = dist2(e.x, e.y, player.x, player.y);
    if (!isAshenSpiderType(e) && pd2c < (e.r + player.r + 6) ** 2 && player.hurtT <= 0) {
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
    if (!isAshenSpiderType(e)) {
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
    // 4.1.2 — brawling with orange defenders (only runs inside a hold's aggro ring,
    // so legacy-core waves pay nothing for this)
    if (HOLD_COMBAT_ENABLED && e._nearHoldId) {
      for (const u of holdUnits) {
        if (u.downed || u.holdId !== e._nearHoldId) continue;
        if (dist2(e.x, e.y, u.x, u.y) < (e.r + u.r + 4) ** 2) {
          if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.85);
          hurtHoldUnit(u, e.dmg * 0.4);
        }
      }
      for (const L of holdLaborers) {
        if (L.downed || L.insideMine || L.holdId !== e._nearHoldId) continue;
        if (dist2(e.x, e.y, L.x, L.y) < (e.r + L.r + 4) ** 2) {
          if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.85);
          hurtHoldLaborer(L, e.dmg * 0.35);
        }
      }
      const hh = holdById(e._nearHoldId), cap = hh && hh.captain;
      if (cap && !cap.downed && dist2(e.x, e.y, cap.x, cap.y) < (e.r + cap.r + 4) ** 2) {
        if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.85);
        hurtHoldCaptain(hh, e.dmg * 0.4);
      }
    }
    if (colossusActive() && dist2(e.x, e.y, colossus.x, colossus.y) < (e.r + colossus.r + 6) ** 2) {
      if (!e.boss) e.swipeT = Math.max(e.swipeT || 0, UNIT_SWIPE * 0.7);
      hurtColossus(e.dmg * 0.45);
    }
    }
    if (enemyCanCast(e)) { // Step 10.5 — casting cut while swimming; staff resumes ashore
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
  } // end !buildPlacePaused enemy AI
  // Same place-pause gate: companions + militia (no move-to-attack / fire / melee /
  // swipe), sentries, laborers (incl. squad laborers), colossus. Structures still tick.
  wdMark('allies+holds');
  if (!buildPlacePaused) {
    updateCompanions(dt);
    updateMilitia(dt);
    updateSentries(dt);
    updateLaborers(dt);
    updateColossus(dt);
    updateHoldAutonomy(dt);
    tickBurstweaverSpawn(dt);
    tickBroodmotherSpawn(dt);
    tickDecadeBossQueue(dt);
  }
  updateStructures(dt);

  // ---- projectiles ----
  wdMark('projectiles');
  for (const b of bolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (obstacleBlockedAt(b.x, b.y, 0, false)) {
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

  if (!buildPlacePaused) {
  for (const b of ebolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.fire && Math.random() < dt * 46) { // flickering flame trail
      particles.push({ x: b.x + rand(-3, 3), y: b.y + rand(-3, 3), vx: rand(-16, 16), vy: rand(-34, -6),
        life: rand(0.12, 0.32), maxLife: 0.32, color: Math.random() < 0.5 ? '#ff9d2e' : '#ff5a1f', r: rand(1.5, 3) });
    }
    if (obstacleBlockedAt(b.x, b.y, 0, false)) {
      b.life = 0; if (b.fire) emberBurst(b.x, b.y); continue;
    }
    const wall = barricades.find(w => dist2(b.x, b.y, w.x, w.y) < w.r * w.r);
    if (wall) { wall.hp -= b.dmg * 0.6; b.life = 0; spawnParticles(b.x, b.y, 4, '#7CFC00', 2); if (b.fire) emberBurst(b.x, b.y); continue; }
    // only the Warden body-blocks enemy fire (Rover/Scout no longer eat every bolt)
    const ch = companions.find(c => !c.downed && c.type === 'warden' && dist2(b.x, b.y, c.x, c.y - 10) < (c.r + b.r + 4) ** 2);
    if (ch) {
      b.life = 0;
      if (b.fire) emberBurst(b.x, b.y);
      hurtCompanion(ch, b.web ? b.dmg * 0.5 : b.dmg);
      if (b.web) spawnParticles(b.x, b.y, 8, '#c8c0a8', 2);
      continue;
    }
    if (colossusActive() && dist2(b.x, b.y, colossus.x, colossus.y - 24) < (colossus.r + b.r + 8) ** 2) {
      b.life = 0;
      if (b.fire) emberBurst(b.x, b.y);
      hurtColossus(b.dmg * 0.55);
      continue;
    }
    if (dist2(b.x, b.y, player.x, player.y - 12) < (player.r + b.r + 4) ** 2) {
      b.life = 0;
      if (b.fire) emberBurst(b.x, b.y);
      if (b.web) {
        applyBurstweaverWebSlow();
        if (player.hurtT <= 0) hurtPlayer(b.dmg);
        spawnParticles(b.x, b.y, 10, '#c8c0a8', 2.5);
      } else if (player.hurtT <= 0) hurtPlayer(b.dmg);
    }
  }
  ebolts = ebolts.filter(b => b.life > 0);
  }

  for (const g of grenades) {
    g.x += g.vx * dt; g.y += g.vy * dt;
    g.vx *= 0.96; g.vy *= 0.96; g.t -= dt;
    if (obstacleBlockedAt(g.x, g.y, 6, false)) g.t = 0;
    if (g.t <= 0) explodeGrenade(g);
  }
  grenades = grenades.filter(g => g.t > 0);

  // ---- pickups ----
  for (const p of pickups) {
    p.t += dt;
    if (isHoldOrbPickup(p)) {
      const hold = holdById(p.holdId);
      if (!hold || !isHoldVisible(hold)) continue;
      let best = null, bd2 = Infinity, bestIsBuilder = false;
      for (const L of holdLaborers) {
        if (L.holdId !== p.holdId || L.downed) continue;
        const d2 = dist2(p.x, p.y, L.x, L.y);
        const mag = HOLD_ORB_BUILDER_MAGNET;
        if (d2 < mag * mag && d2 < bd2) { bd2 = d2; best = L; bestIsBuilder = true; }
      }
      for (const u of holdUnits) {
        if (u.holdId !== p.holdId || u.downed) continue;
        const d2 = dist2(p.x, p.y, u.x, u.y);
        if (d2 < HOLD_ORB_MAGNET * HOLD_ORB_MAGNET && d2 < bd2) { bd2 = d2; best = u; bestIsBuilder = false; }
      }
      if (best) {
        const d = Math.sqrt(bd2) || 1;
        const pull = bestIsBuilder ? 360 : 300;
        p.x += (best.x - p.x) / d * pull * dt;
        p.y += (best.y - p.y) / d * pull * dt;
        if (bd2 < (best.r + 14) ** 2) {
          p.got = true;
          hold.orangeSp += p.amtSp || 1;
          addFloater(p.x, p.y, '+' + (p.amtSp || 1) + ' ○ HOLD', '#ff9d2e', false);
          tryHoldUnlock(hold);
        }
      }
      continue;
    }
    if (isSquadPickup(p)) {
      // Squad-only orbs: companions + militia magnet; player + laborers ignore
      let best = null, bd2 = Infinity;
      for (const c of companions) {
        if (c.downed) continue;
        const mag = unitSquadMagnetRange(c);
        const d2 = dist2(p.x, p.y, c.x, c.y);
        if (d2 < mag * mag && d2 < bd2) { bd2 = d2; best = c; }
      }
      for (const m of militia) {
        if (m.downed) continue;
        const mag = unitSquadMagnetRange(m);
        const d2 = dist2(p.x, p.y, m.x, m.y);
        if (d2 < mag * mag && d2 < bd2) { bd2 = d2; best = m; }
      }
      if (best) {
        const d = Math.sqrt(bd2) || 1;
        p.x += (best.x - p.x) / d * 380 * dt;
        p.y += (best.y - p.y) / d * 380 * dt;
        if (bd2 < (best.r + 14) ** 2) {
          p.got = true;
          if (p.type === 'squad_sp') {
            squadSp++;
            addFloater(p.x, p.y, '+1 ✧ SQ', '#8a8a8a', false);
          } else {
            squadCores++;
            addFloater(p.x, p.y, '+1 ◈ SQ', '#c0c0c0', false);
          }
        }
      }
      continue;
    }
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
  wdMark('fx');
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
  wdMark('camera+hud');
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
  updateWaveCoach(dt);

  // talk / revive button visibility
  const npcNear = nearestNpc();
  const downComp = nearestDownedCompanion();
  const downMil = nearestDownedMilitia();
  const downLab = nearestDownedLaborer();
  const downAlly = nearestDownedAlly();
  const downColo = nearestDownedColossus();
  const talkBtn = $('btnTalk');
  const showTalk = state === 'playing' && !dialogOpen && !vendorOpen && !infirmaryOpen && !riftNetOpen &&
    (npcNear || downComp || downMil || downLab || downAlly || downColo || player.downed);
  talkBtn.classList.toggle('hidden', !showTalk);
  if (player.downed) talkBtn.textContent = '✚ PING';
  else if (downColo) talkBtn.textContent = `✚ HOLD REVIVE ${COLOSSUS_REVIVE_CORES}⬡`;
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
      !player.downed && !buildPickOpen && !structPanelOpen && !bike.mounted;
    coloBtn.classList.toggle('hidden', !showColo);
    if (showColo) {
      if (colossus && colossus.downed) coloBtn.textContent = '⚔ TITAN DOWN';
      else if (colossus) coloBtn.textContent = '⚔ RECALL (C)';
      else if (colossusOwned) coloBtn.textContent = '⚔ CALL TITAN (C)';
      else coloBtn.textContent = '⚔ COLOSSUS (C)';
    }
  }
  const bikeBtn = $('btnBike');
  if (bikeBtn && (DIRT_BIKE_ENABLED || BOAT_ENABLED)) {
    // 10.3 — one vehicle button; icon flips 🏍↔⛵ by nearest actionable target (bike unchanged
    // whenever no skiff action is in range). BOARD stays visible mid-wave: the press explains
    // the wave gate with the "THE HORDE CALLS" floater instead of a silently missing button.
    const boatOn = boatActive();
    const showVehicle = state === 'playing' && !dialogOpen && !vendorOpen && !infirmaryOpen && !riftNetOpen &&
      !player.downed && !buildPickOpen && !structPanelOpen &&
      (bike.mounted || canMountBike() || canInteractBikeWreck() ||
       (boatOn && (boat.mounted || canMountBoat() || canInteractBoatWreck())));
    bikeBtn.classList.toggle('hidden', !showVehicle);
    if (showVehicle) {
      const boatD2 = boatOn ? (canMountBoat() ? boatMoorDist2() : (canInteractBoatWreck() ? boatWreckDist2() : Infinity)) : Infinity;
      const bikeD2 = canMountBike() ? bikeParkDist2() : (canInteractBikeWreck() ? bikeWreckDist2() : Infinity);
      if (boat.mounted) bikeBtn.textContent = '⛵ BEACH (V)';
      else if (bike.mounted) bikeBtn.textContent = '🏍 DISMOUNT (V)';
      else if (boatD2 < bikeD2) {
        bikeBtn.textContent = canMountBoat() ? '⛵ BOARD (V)' : `🔧 REPAIR ${BOAT_REPAIR_WOOD}🪵 ${BOAT_REPAIR_GOLD}🜚`;
      } else if (canInteractBikeWreck()) bikeBtn.textContent = `🔧 REPAIR ${BIKE_REPAIR_WOOD}🪵 ${BIKE_REPAIR_GOLD}🜚`;
      else bikeBtn.textContent = '🏍 MOUNT (V)';
    }
  }

  updateHud();
}


function enemyObstacleClimbable(o) {
  if (!o) return false;
  if (o.type === 'tree' || o.type === 'deadtree') return o.r <= ENEMY_CLIMB_MAX_OBST_R;
  if (o.type === 'rock' || o.type === 'crate') return o.r <= ENEMY_CLIMB_MAX_OBST_R;
  return false;
}
function forEachObstacleNear(x, y, reach, fn) {
  if (!obstGrid) rebuildObstacleGrid();
  const gx0 = Math.max(0, ((x - reach) / OBST_GRID_CELL) | 0);
  const gx1 = Math.min(obstGridW - 1, ((x + reach) / OBST_GRID_CELL) | 0);
  const gy0 = Math.max(0, ((y - reach) / OBST_GRID_CELL) | 0);
  const gy1 = Math.min(obstGridH - 1, ((y + reach) / OBST_GRID_CELL) | 0);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const cell = obstGrid[gy * obstGridW + gx];
    if (!cell) continue;
    for (const o of cell) fn(o);
  }
}
function enemyBlockingObstacle(ent, ux, uy, pad = 8) {
  if (!ux && !uy) return null;
  const ul = Math.hypot(ux, uy) || 1;
  const nx = ux / ul, ny = uy / ul;
  const probe = ent.r + pad + 10;
  const px = ent.x + nx * probe, py = ent.y + ny * probe;
  let hit = null, hitD2 = 1e18;
  forEachObstacleNear(px, py, ent.r + obstGridMaxR + pad + 12, o => {
    const d2 = dist2(px, py, o.x, o.y);
    const minD = o.r + ent.r + pad;
    if (d2 < minD * minD && d2 < hitD2) { hit = o; hitD2 = d2; }
  });
  return hit;
}
function pickEnemySteerTangent(ent, o, tgtX, tgtY) {
  let nx = ent.x - o.x, ny = ent.y - o.y;
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl; ny /= nl;
  const t1x = -ny, t1y = nx;
  const t2x = ny, t2y = -nx;
  const toTx = tgtX - ent.x, toTy = tgtY - ent.y;
  const d1 = t1x * toTx + t1y * toTy;
  const d2 = t2x * toTx + t2y * toTy;
  const primary = d1 >= d2 ? { ux: t1x, uy: t1y } : { ux: t2x, uy: t2y };
  const alt = d1 < d2 ? { ux: t1x, uy: t1y } : { ux: t2x, uy: t2y };
  if (!enemyBlockingObstacle(ent, primary.ux, primary.uy, 4)) return primary;
  if (!enemyBlockingObstacle(ent, alt.ux, alt.uy, 4)) return alt;
  return primary;
}
function beginEnemyClimb(e, o) {
  e.climbT = ENEMY_CLIMB_T;
  e.climbOx = o.x; e.climbOy = o.y;
}
function updateEnemySteerState(e, dt, tgtX, tgtY, seekUx, seekUy) {
  if (!ENEMY_STEER_ENABLED || (e.boss && e.clawWind > 0)) return { ux: seekUx, uy: seekUy };
  // Step 10.5 — swimmers stroke straight at the seek point: no obstacles live in the water,
  // and rim-adjacent probes must not phantom-slide off the 10.4 isle grove trees. The isle
  // clamp + shore exit are the hard walls behind the stroke.
  if (e.swim) return { ux: seekUx, uy: seekUy };
  if (e.climbT > 0) {
    e.climbT -= dt;
    const dx = (e.climbOx || tgtX) - e.x, dy = (e.climbOy || tgtY) - e.y;
    const dl = Math.hypot(dx, dy) || 1;
    let ux = dx / dl * 0.65 + seekUx * 0.35;
    let uy = dy / dl * 0.65 + seekUy * 0.35;
    const len = Math.hypot(ux, uy) || 1;
    return { ux: ux / len * ENEMY_CLIMB_SPEED_MUL, uy: uy / len * ENEMY_CLIMB_SPEED_MUL };
  }
  if (e.steerT > 0) {
    e.steerT -= dt;
    return { ux: e.steerUx != null ? e.steerUx : seekUx, uy: e.steerUy != null ? e.steerUy : seekUy };
  }
  const block = enemyBlockingObstacle(e, seekUx, seekUy);
  if (block) {
    if (enemyObstacleClimbable(block)) beginEnemyClimb(e, block);
    else {
      const tan = pickEnemySteerTangent(e, block, tgtX, tgtY);
      e.steerT = ENEMY_STEER_SLIDE_T;
      e.steerUx = tan.ux; e.steerUy = tan.uy;
      return tan;
    }
  }
  // Step 10.1 — Ashmere ahead: slide along the shoreline like one giant rounded rock
  // (never climbable; the collideObstacles clamp is the hard wall behind this steer).
  // Step 10.5 — waterOk actors (swimming shamans) stroke straight in instead of sliding.
  if (LAKE_WATER_ENABLED && !block && !e.waterOk &&
      isLakeWaterAt(e.x + seekUx * (e.r + 34), e.y + seekUy * (e.r + 34))) {
    const tan = lakeShoreTangent(e, tgtX, tgtY);
    e.steerT = ENEMY_STEER_SLIDE_T;
    e.steerUx = tan.ux; e.steerUy = tan.uy;
    return tan;
  }
  return { ux: seekUx, uy: seekUy };
}
function applyEnemySteerAfterCollide(e, tgtX, tgtY) {
  if (!ENEMY_STEER_ENABLED || e.climbT > 0 || (e.boss && e.clawWind > 0)) return;
  const ex = tgtX - e.x, ey = tgtY - e.y;
  const d = Math.hypot(ex, ey) || 1;
  const ux = ex / d, uy = ey / d;
  if (Math.hypot(e.vx, e.vy) > e.spd * 0.38) return;
  const block = enemyBlockingObstacle(e, ux, uy, 2);
  if (!block || e.steerT > 0.12) return;
  if (enemyObstacleClimbable(block)) beginEnemyClimb(e, block);
  else {
    const tan = pickEnemySteerTangent(e, block, tgtX, tgtY);
    e.steerT = ENEMY_STEER_SLIDE_T;
    e.steerUx = tan.ux; e.steerUy = tan.uy;
  }
}
/** Test harness — one enemy steer frame toward a point (not full combat AI). */
function simEnemySteerFrame(e, tgt, dt) {
  if (!e || e.dead || !tgt) return;
  const ex = tgt.x - e.x, ey = tgt.y - e.y;
  const d = Math.hypot(ex, ey) || 1;
  const steer = updateEnemySteerState(e, dt, tgt.x, tgt.y, ex / d, ey / d);
  e.vx = steer.ux * e.spd;
  e.vy = steer.uy * e.spd;
  e.x = clamp(e.x + e.vx * dt, e.r, WORLD.w - e.r);
  e.y = clamp(e.y + e.vy * dt, e.r, WORLD.h - e.r);
  if (ENEMY_STEER_ENABLED && e.climbT > 0) {
    const savedR = e.r;
    e.r = Math.max(8, e.r * 0.5);
    collideObstacles(e);
    e.r = savedR;
  } else collideObstacles(e);
  applyEnemySteerAfterCollide(e, tgt.x, tgt.y);
}
/** Test harness — one Step 10.5 water-rules frame: swim state + shore leash + seek shaping
 * + steer + move + shore/isle clamps. Mirrors the live loop's water slice with tgt=player
 * (not full combat AI — no separation/attacks/HUD; velocity set, not lerped). */
function simEnemyWaterFrame(e, dt) {
  if (!e || e.dead) return;
  let tgt = player;
  updateShamanSwim(e, tgt);
  if (lakeLeashApplies(e, tgt)) tgt = pickLakeLeashTarget(e) || lakeShoreHoldPoint();
  e._tgt = tgt;
  let seekPt = { x: tgt.x, y: tgt.y };
  if (e.swim && !lakeSwimWants(e, tgt)) seekPt = lakeNearestShore(e.x, e.y, 26);
  const ex = seekPt.x - e.x, ey = seekPt.y - e.y;
  const d = Math.hypot(ex, ey) || 1;
  const wantD = e.ranged && !e.boss && !e.swim ? 260 : (tgt._shoreHold ? LAKE_LEASH_HOLD_R : 0);
  const dir = d > wantD ? 1 : -0.6;
  const steer = updateEnemySteerState(e, dt, seekPt.x, seekPt.y, ex / d, ey / d);
  const mul = (e.swim ? SHAMAN_SWIM_SPEED_MUL : 1) * dir;
  e.vx = steer.ux * e.spd * mul;
  e.vy = steer.uy * e.spd * mul;
  e.x = clamp(e.x + e.vx * dt, e.r, WORLD.w - e.r);
  e.y = clamp(e.y + e.vy * dt, e.r, WORLD.h - e.r);
  collideObstacles(e);
}

function collideObstacles(ent) {
  // 4.1.2 FREEZE FIX — was a linear scan of ALL ~1200–1600 obstacles for EVERY moving
  // entity EVERY frame (player + enemies + militia + laborers + hold units ≈ 300–500k
  // dist checks/frame at high waves — the top compounding frame cost). Static grid now.
  if (!obstGrid) rebuildObstacleGrid();
  const gx0 = Math.max(0, ((ent.x - ent.r - obstGridMaxR) / OBST_GRID_CELL) | 0);
  const gx1 = Math.min(obstGridW - 1, ((ent.x + ent.r + obstGridMaxR) / OBST_GRID_CELL) | 0);
  const gy0 = Math.max(0, ((ent.y - ent.r - obstGridMaxR) / OBST_GRID_CELL) | 0);
  const gy1 = Math.min(obstGridH - 1, ((ent.y + ent.r + obstGridMaxR) / OBST_GRID_CELL) | 0);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const cell = obstGrid[gy * obstGridW + gx];
    if (!cell) continue;
    for (const o of cell) {
      const d2 = dist2(ent.x, ent.y, o.x, o.y), minD = o.r + ent.r;
      if (d2 < minD * minD && d2 > 0.01) {
        const d = Math.sqrt(d2);
        ent.x = o.x + (ent.x - o.x) / d * minD;
        ent.y = o.y + (ent.y - o.y) / d * minD;
      }
    }
  }
  clampLakeShore(ent); // Step 10.1 — Ashmere is solid for everything on legs
  if (ent.swim) clampSwimmerToWater(ent); // Step 10.5 — swimmers stay off the isle rim (grove stays enemy-free)
  if (ent === player && boat.mounted) clampSkiffToWater(ent); // Step 10.3 — the hull stays wet
}

function hurtPlayer(dmg) {
  if (player.downed) return;
  knockOffBike(dmg);
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
  if ($('stSquadPoints')) $('stSquadPoints').textContent = squadSp;
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
  // ---- SQUAD column (BETA-3.1 step 2): companion trees spend squadSp ✧, not player.sp ----
  const sq = document.createElement('div');
  sq.className = 'treecol squad';
  sq.innerHTML = `<h3>SQUAD ✧ ${squadSp}</h3><p style="font-size:11px;color:#9a9a9a;margin:0 0 8px;line-height:1.35">Spend squad SP on companions. Militia: tap a fighter. Cores ◈ unused this step.</p>`;
  for (const k of Object.keys(COMP_NODES)) {
    const ownedC = !!squad.owned[k];
    COMP_NODES[k].forEach((n, i) => {
      const rank = sk(n.id);
      const prevOk = ownedC && (i === 0 || sk(COMP_NODES[k][i - 1].id) >= 1);
      const maxed = rank >= n.max;
      const cost = COMP_SQ_SP_COST;
      const canBuy = prevOk && !maxed && squadSp >= cost;
      const node = document.createElement('div');
      node.className = 'skillnode' + (canBuy ? ' avail' : '') + (maxed ? ' maxed' : '') + (!prevOk ? ' locked' : '');
      node.innerHTML = `<h5>${COMP_TYPES[k].name}: ${n.name}<span>${maxed ? 'MAX' : rank + '/' + n.max}</span></h5>
        <small>${n.desc}${!ownedC ? ' — recruit ' + COMP_TYPES[k].name + ' first' : (!prevOk ? ' — requires previous skill' : ` — ✧ ${cost}`)}</small>`;
      if (canBuy) node.onclick = () => {
        if (!buyCompNode(k, n.id)) return;
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
if ($('openSquadTreeLink')) $('openSquadTreeLink').onclick = e => { e.preventDefault(); if (!treeOpen) toggleTree(); else renderTree(); };

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
  // 7.4D — persistent HUD cues for Burstweaver web slow + bite poison
  {
    const bits = [];
    if ((player.webSlowT || 0) > 0) bits.push('WEBBED ' + player.webSlowT.toFixed(1) + 's');
    if ((player.poisonT || 0) > 0) bits.push('ASH VENOM ' + player.poisonT.toFixed(1) + 's');
    const dh = $('debuffHud');
    if (dh) {
      dh.textContent = bits.join(' · ');
      dh.classList.toggle('hidden', bits.length === 0);
    }
  }
  $('waveNum').textContent = wave;
  $('coreNum').textContent = cores;
  if ($('woodNum')) $('woodNum').textContent = wood;
  if ($('goldNum')) $('goldNum').textContent = gold;
  if ($('coalNum')) $('coalNum').textContent = coal;
  const fuelWrap = $('fuelHudWrap');
  if (fuelWrap) {
    const showFuel = fuelHudVisible();
    fuelWrap.style.display = showFuel ? '' : 'none';
    if (showFuel) {
      if ($('fuelfill')) $('fuelfill').style.width = (100 * fuel / FUEL_MAX) + '%';
      if ($('fueltext')) $('fueltext').textContent = fuel + ' / ' + FUEL_MAX +
        (coal > 0 ? ' · ⬤' + coal : '');
    }
  }
  if ($('workerNum')) $('workerNum').textContent = laborers.length + '/' + laborerCap();
  if ($('squadNum')) $('squadNum').textContent = (companions.length + militia.length) + (waveTrainLeft ? ` (+${waveTrainLeft})` : '');
  if ($('squadSpNum')) $('squadSpNum').textContent = squadSp;
  if ($('squadWoodNum')) $('squadWoodNum').textContent = squadWood;
  if ($('squadGoldNum')) $('squadGoldNum').textContent = squadGold;
  $('killNum').textContent = kills;
  $('spNum').textContent = player.sp;
  $('phaseLabel').textContent = paused ? '⏸ PAUSED' :
    bike.mounted ? '🏍 RIFT BIKE — shoot & ride (V dismount)' :
    boat.mounted ? '⛵ RIFT SKIFF — beach at shore (V)' :
    buildPlaceMode ? '🛠 TAP TO PLACE · B/Esc cancel' :
    graceT > 0 ? `🎁 lab opens in ${Math.ceil(graceT)}s` :
    waveActive ? (spawnQueue > 0 ? '🌑 horde incoming' :
      (() => { const w = countWaveEnemiesRemaining(); const ash = countLiveAshSpiders();
        return w + ' remaining' + (ash ? ' · ' + ash + ' ash spider' + (ash > 1 ? 's' : '') + ' outside' : ''); })()) : '';
  const cds = [];
  if (player.dashCd > 0.05) cds.push(`dash ${player.dashCd.toFixed(1)}`);
  if (player.novaCd > 0.05) cds.push(`nova ${player.novaCd.toFixed(1)}`);
  $('grenadeHud').textContent = '✦ ' + '●'.repeat(player.grenades) + '○'.repeat(Math.max(0, maxGrenades() - player.grenades)) +
    `  ·  ⛨ ${barricades.length}/${BARRICADE_MAX}` +
    (structures.length ? `  ·  🏛 ${structures.length}` : '') +
    (laborers.length ? `  ·  🪓 ${laborers.length}/${laborerCap()}` : '') +
    (squadLaborers.length ? `  ·  🪓s ${squadLaborers.length}/${squadLaborerCap()}` : '') +
    (militia.length ? `  ·  ⚔ ${militia.length}` : '') +
    (waveTrainLeft > 0 && waveActive ? `  ·  train ${waveTrainLeft}` : '') +
    (colossus && colossus.downed ? '  ·  ⚔ TITAN DOWN' : colossus ? '  ·  ⚔ TITAN OUT' : colossusOwned ? '  ·  ⚔ TITAN DOCKED' : '') +
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
const MINIMAP_ZONE = { grass: '#1a2a1c', stone: '#2a3038', ash: '#2a221c', marsh: '#152826', water: '#123542' };
let minimapLastDrawMs = 0; // 4.1.1 perf — radar repaints ~10Hz instead of 60 (was full redraw every frame)
function drawMinimap() {
  const c = $('minimap');
  if (!c || (state !== 'playing' && state !== 'shop')) return;
  const s = mapSizePx();
  const sizeChanged = c.width !== s;
  const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  if (!sizeChanged && nowMs - minimapLastDrawMs < 95) return;
  minimapLastDrawMs = nowMs;
  if (sizeChanged) { c.width = s; c.height = s; }
  const g = c.getContext('2d');
  const pad = 2;
  const inner = s - pad * 2;
  const sx = inner / WORLD.w, sy = inner / WORLD.h;
  const toX = x => pad + x * sx;
  const toY = y => pad + y * sy;
  g.clearRect(0, 0, s, s);
  g.fillStyle = '#0a1018';
  g.fillRect(0, 0, s, s);
  // zone blocks (coarse — cheap); full WORLD scale when extended
  g.fillStyle = MINIMAP_ZONE.grass;
  g.fillRect(pad, pad, inner, inner);
  if (CONTINUOUS_MAP_ENABLED) {
    g.fillStyle = 'rgba(26,42,28,0.55)';
    const lx = toX(LEGACY_WORLD.w), ly = toY(LEGACY_WORLD.h);
    g.fillRect(lx, pad, pad + inner - lx, inner); // east exterior
    g.fillRect(pad, ly, lx - pad, pad + inner - ly); // south exterior (excludes corner)
  }
  g.fillStyle = MINIMAP_ZONE.stone;
  g.fillRect(toX(FORT.x), toY(FORT.y), FORT.w * sx, FORT.h * sy);
  g.fillStyle = MINIMAP_ZONE.ash;
  g.fillRect(toX(ASH.x), toY(ASH.y), ASH.w * sx, ASH.h * sy);
  g.fillStyle = MINIMAP_ZONE.marsh;
  g.fillRect(toX(MARSH.x), toY(MARSH.y), MARSH.w * sx, MARSH.h * sy);
  // Step 10.1 — Ashmere patch (legacy-interior: fog Version B keeps it visible from boot;
  // Version A's fog layer below covers it until discovered)
  if (LAKE_WATER_ENABLED && CONTINUOUS_MAP_ENABLED) {
    g.fillStyle = MINIMAP_ZONE.water;
    g.beginPath();
    g.ellipse(toX(LAKE_BLOB.cx), toY(LAKE_BLOB.cy), LAKE_BLOB.a * sx * 0.96, LAKE_BLOB.b * sy * 0.96, 0, 0, TAU);
    g.fill();
    g.fillStyle = MINIMAP_ZONE.grass; // Driftwood Isle dry dot
    g.beginPath();
    g.ellipse(toX(LAKE_ISLE.x), toY(LAKE_ISLE.y), Math.max(1.2, LAKE_ISLE.r * sx), Math.max(1.2, LAKE_ISLE.r * sy), 0, 0, TAU);
    g.fill();
  }
  drawLegacyPathsMinimap(g, toX, toY, sx, sy);
  drawFogMinimap(g, toX, toY, sx, sy);
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
    if (fs.exterior && !isExteriorSiteVisible(fs.x, fs.y)) continue;
    g.beginPath(); g.arc(toX(fs.x), toY(fs.y), Math.max(2, fs.r * sx * 0.35), 0, TAU); g.fill();
  }
  g.fillStyle = '#ffd54a';
  for (const v of (goldMines.length ? goldMines : goldVeins)) {
    if (v.goldLeft > 0) {
      if (v.exterior && !isExteriorSiteVisible(v.x, v.y)) continue;
      g.fillRect(toX(v.x) - 1.5, toY(v.y) - 1.5, 3, 3);
    }
  }
  g.fillStyle = '#6a6a72'; // 8.1 coal — dark gray blip
  for (const v of coalMines) {
    if (!(v.coalLeft > 0)) continue;
    if (!isExteriorSiteVisible(v.x, v.y)) continue;
    g.fillRect(toX(v.x) - 1.5, toY(v.y) - 1.5, 3, 3);
  }
  g.fillStyle = '#9ef0ff';
  for (const m of militia) {
    if (!m.downed) g.fillRect(toX(m.x) - 1, toY(m.y) - 1, 2, 2);
  }
  if (colossusOnField()) {
    g.fillStyle = colossus.downed ? '#6a4a88' : '#b04dff';
    g.beginPath(); g.arc(toX(colossus.x), toY(colossus.y), 3, 0, TAU); g.fill();
  }
  // NPCs
  g.fillStyle = '#ffd54a';
  for (const n of NPCS) {
    g.beginPath(); g.arc(toX(n.x), toY(n.y), 1.6, 0, TAU); g.fill();
  }
  g.fillStyle = '#c8a06a';
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    g.fillRect(toX(h.x) - 2, toY(h.y) - 2, 4, 4);
  }
  // enemies
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0.5) continue;
    g.fillStyle = e.boss ? '#ff2d55' : e.decadeBoss ? '#ff6a3a' : '#ff8a93';
    const r = e.boss ? 2.4 : e.decadeBoss ? 2.0 : 1.3;
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
  // legacy core ring (purple rift border on minimap)
  if (CONTINUOUS_MAP_ENABLED) {
    g.strokeStyle = 'rgba(176,77,255,0.45)'; g.lineWidth = 1;
    g.strokeRect(toX(LEGACY_WORLD.x) + 0.5, toY(LEGACY_WORLD.y) + 0.5,
      LEGACY_WORLD.w * sx - 1, LEGACY_WORLD.h * sy - 1);
  }
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
  const plantAmp = o.plantAmp != null ? o.plantAmp : 1; // militia/companion-tier plant boost
  const bobAmp = o.bobAmp != null ? o.bobAmp : 1;
  const gaitLeanAmt = o.gaitLean || 0;   // side lean on stride (Sentinel-class readability)
  // Walk: opposite-phase limbs + plant squash. Idle: soft breath bob.
  const swing = isMoving ? Math.sin(t) * 0.62 : Math.sin(t * 0.55) * 0.08;
  const bob = (isMoving ? Math.abs(Math.sin(t)) * 2.2 * s : Math.abs(Math.sin(t * 0.55)) * 0.55 * s) * bobAmp
    + (o.swipe > 0 && !isMoving ? 0.45 * s * bobAmp : 0);
  const plant = isMoving ? Math.max(0, Math.cos(t * 2)) : 0; // peaks on footfalls
  const hunch = (o.hunch || 0) + (o.downed ? 0.9 : 0);
  const lean = hunch * 7 * s;            // forward lean offset
  // Attack phases from swipe countdown (UNIT_SWIPE): first half windup, second strike
  const swipe = o.swipe || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const hurtLean = (o.flash > 0 || o.hurtRecoil) ? -0.12 * (o.hurtLeanAmp || 1) : 0;
  const atkLean = windPose * -0.08 + strikePose * 0.14;
  const sideLean = o.downed ? 0.14
    : isMoving ? Math.sin(t) * gaitLeanAmt
    : windPose > 0 ? -gaitLeanAmt * (0.6 + windPose)
    : strikePose > 0 ? gaitLeanAmt * 1.4 * (1 - strikePose * 0.25)
    : 0;
  ctx.save();
  ctx.translate(x, y);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;

  // shadow — SIZE LOCK ellipse (stronger for grass readability)
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * s * (1 + plant * 0.04 * plantAmp), 5.2 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(o.facing || 1, 1);
  ctx.translate(0, -bob + (o.downed ? 4 * s : 0));
  ctx.rotate(hurtLean + atkLean + sideLean);
  // plant squash (visual only — collision r unchanged); plantAmp lifts militia toward companion readability
  if (plant > 0 || strikePose > 0) {
    const px = plant * 0.025 * plantAmp + strikePose * 0.02 * plantAmp;
    const py = plant * 0.03 * plantAmp + strikePose * 0.018 * plantAmp;
    ctx.scale(1 + px - (hurtLean ? 0.012 : 0), 1 - py + (hurtLean ? 0.012 : 0));
  }

  const hipY = -H * 0.42;
  const shY = -H * 0.72 + hunch * 5 * s; // shoulder line
  const headY = -H * 0.88 + hunch * 8 * s;
  const headR = 5.6 * s * (o.headScale || 1);

  const flash = o.flash > 0;
  const skin = flash ? '#fff' : o.skin;
  const cloth = flash ? '#fff' : o.cloth;
  const legC = flash ? '#fff' : (o.legs || '#20242e');

  // aura (behind the body) — expects #RRGGBB; refuse anything else so a bad
  // caller can't throw mid-render and blank the whole frame (4.1.4).
  if (o.aura && /^#[0-9a-fA-F]{6}$/.test(o.aura)) {
    const ar = H * 0.62 + Math.sin(performance.now() / 70) * 3 * s;
    const ag = ctx.createRadialGradient(lean, hipY, 3, lean, hipY, ar);
    ag.addColorStop(0, o.aura + '99'); ag.addColorStop(1, o.aura + '00');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.ellipse(lean, hipY, ar * 0.8, ar, 0, 0, TAU); ctx.fill();
  }

  ctx.lineCap = 'round';

  // ---- legs (flowing stride: hip → mid → foot, opposite phase) ----
  const legAmpMul = o.legAmp != null ? o.legAmp : 1;
  const legAmp = (isMoving ? 5.4 * s : 0.8 * s) * legAmpMul * (o.downed ? 0.15 : 1);
  const footL = -1.5 * s + Math.sin(t) * legAmp + (o.downed ? -3 * s : 0);
  const footR = 1.5 * s - Math.sin(t) * legAmp + (o.downed ? 5 * s : 0);
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
    // militia spear — off-hand hangs; shaft aims + windup pullback / strike thrust
    const thrust = strikePose * 12 * s - windPose * 5.5 * s;
    const ga = o.gunAngle || 0;
    ctx.beginPath();
    ctx.moveTo(lean, armY); ctx.lineTo(lean - 3.5 * s, armY + 8 * s + armSwing * 0.55); ctx.stroke(); // off hand
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga + windPose * -0.22 + strikePose * 0.1);
    ctx.beginPath(); // spear arm
    ctx.moveTo(0, 0); ctx.lineTo(5 * s + thrust * 0.25, 1.5 * s); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#c8a06a'; ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s + thrust * 0.15, 9 * s); ctx.lineTo(2 * s + thrust, -19 * s); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#d8d0c0';
    ctx.beginPath();
    ctx.moveTo(2 * s + thrust, -21 * s);
    ctx.lineTo(5.5 * s + thrust, -14.5 * s);
    ctx.lineTo(-1.5 * s + thrust, -14.5 * s);
    ctx.fill();
    ctx.restore();
  } else if (o.weapon === 'bow') {
    // militia bow — draw string on windup, release snap on strike (distinct from spear thrust)
    const drawAmt = windPose * 6.5 * s + (strikePose > 0 ? Math.max(0, 1 - strikePose * 2.2) * 3 * s : 0);
    const release = strikePose > 0.35 ? (strikePose - 0.35) / 0.65 : 0;
    const ga = o.gunAngle || 0;
    ctx.save();
    ctx.translate(lean, armY);
    ctx.rotate(ga + windPose * -0.1 + strikePose * 0.04);
    ctx.beginPath(); // bow arm forward
    ctx.moveTo(0, 0); ctx.lineTo(9 * s, -1 * s + armSwing * 0.15); ctx.stroke();
    ctx.beginPath(); // draw arm pulls back on windup
    ctx.moveTo(0, 0); ctx.lineTo(3 * s - drawAmt * 0.85, 3 * s + armSwing * 0.1); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#8a7050'; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -10 * s); ctx.quadraticCurveTo(14 * s - drawAmt * 0.35, 0, 4 * s, 10 * s); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#d8c8a0'; ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -10 * s); ctx.lineTo(4 * s - drawAmt * 0.7 + release * 5 * s, 0); ctx.lineTo(4 * s, 10 * s); ctx.stroke();
    if (windPose > 0.15 && release < 0.2) {
      // nocked shaft while drawn
      ctx.strokeStyle = flash ? '#fff' : '#b8a888'; ctx.lineWidth = 1.1 * s;
      ctx.beginPath(); ctx.moveTo(4 * s - drawAmt * 0.7, 0); ctx.lineTo(12 * s, 0); ctx.stroke();
    }
    ctx.restore();
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
    const tip = o.staffColor || '#d24dff';
    ctx.fillStyle = tip.startsWith('#')
      ? `rgba(${parseInt(tip.slice(1, 3), 16)},${parseInt(tip.slice(3, 5), 16)},${parseInt(tip.slice(5, 7), 16)},${pulse})`
      : tip;
    ctx.shadowColor = tip; ctx.shadowBlur = 10 + strikePose * 8;
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
  const vs = enemyVisScale(e);
  const base = {
    walk: e.walk, facing: e.facing, flash: e.flash, moving,
    swipe: e.swipeT || 0,
    hurtRecoil: e.flash > 0.04,
  };
  switch (e.type) {
    // v2.13.2 — figure s ≈ sprite drawH/36; toward ravager s=1.7; skeleton UNCHANGED
    case 'husk': return { ...base, s: 1.56 * vs, skin: '#8aa06a', cloth: '#55503f', rags: '#3f3a2c',
      legs: '#33302a', hunch: 0.7, armsForward: true, glowEyes: '#ff4d5e', scarDots: true };
    case 'sprinter': return { ...base, s: 1.35 * vs, skin: '#9db07a', cloth: '#4a4438', rags: '#37321f',
      legs: '#2c2a20', hunch: 0.9, armsForward: true, glowEyes: '#ffb02e' };
    case 'shaman': return { ...base, s: 1.56 * vs, skin: '#7a8f5a', cloth: '#4a2f63', hood: '#3a2350',
      legs: '#31264a', hunch: 0.3, weapon: 'staff', glowEyes: '#d24dff' };
    case 'ravager': return { ...base, s: RAVAGER_FIGURE_S * vs, bulk: 1.35, headScale: 1.1, skin: '#5f8f3a', cloth: '#4c3a26',
      pauldron: '#6b7686', legs: '#3a3026', tusks: true, ears: true, weapon: 'club', glowEyes: '#ffd54a' };
    case 'warlord': return { ...base, s: 3.2 * vs, bulk: 1.55, headScale: 1.15, skin: '#4ecf3a', cloth: '#5a2f78',
      pauldron: '#9aa8bc', legs: '#2f9a28', tusks: true, ears: true, horns: true, helmet: '#3a3f4c',
      weapon: 'club', glowEyes: '#ff2d55', aura: '#b04dff' };
    // tank — near ravager, still far below Gharok
    case 'bulwark': return { ...base, s: 1.72 * vs, bulk: 1.6, headScale: 1.05, skin: '#5f7a44', cloth: '#3f4a33',
      rags: '#2e3626', legs: '#2a3022', hunch: 0.8, armsForward: true, glowEyes: '#ff2d55' };
    // bony pale runner — SIZE LOCK 2.13.1 (unchanged in 2.13.2)
    case 'skeleton': return { ...base, s: 1.055 * vs, bulk: 0.62, skin: '#ddd6c0', cloth: '#b8b09a',
      rags: '#8a8272', legs: '#c9c2ac', hunch: 0.55, armsForward: true, glowEyes: '#9ef0ff' };
    // 7.4B procedural fallback — sprite path preferred; mild arachnid lean
    case 'burstweaver': return { ...base, s: 2.4 * vs, bulk: 1.45, headScale: 0.85, skin: '#3a3a42', cloth: '#2a2228',
      pauldron: '#c43a4a', legs: '#2a5a8a', hunch: 1.1, armsForward: true, glowEyes: '#e07040', tusks: true };
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
    case 'hold': return { ...base, skin: '#c8a888', cloth: '#6a5a48', pauldron: '#8a7048',
      legs: '#3a3228', weapon: 'spear' }; // exterior hold sentries (Step 6.4)
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

// ============ MULTI-DIR WALK VIEWS (3-view: front / side / back) ============
// Additive art only — attack/death/windup stay front. Side L/R via existing facing scale.
// Y-down canvas: back ≈ −Y (up), front ≈ +Y (down), side ≈ |vx| dominant.
function unitViewFromVel(vx, vy, aim, lastView) {
  const speed = Math.hypot(vx || 0, vy || 0);
  let ax, ay;
  if (speed > 12) {
    ax = vx; ay = vy;
  } else if (aim != null && Number.isFinite(aim)) {
    ax = Math.cos(aim); ay = Math.sin(aim);
  } else {
    return lastView || 'front';
  }
  const absX = Math.abs(ax), absY = Math.abs(ay);
  if (absY >= absX) return ay < 0 ? 'back' : 'front';
  return 'side';
}

/** Pick side/back walk sheet when ready; else front idle↔walk gait. Caller handles attack/death. */
function unitPickDirWalk(spr, ready, u, movingThresh) {
  const moving = Math.hypot(u.vx || 0, u.vy || 0) > movingThresh;
  const view = unitViewFromVel(u.vx, u.vy, u.aim, u._unitView);
  u._unitView = view;
  if (view === 'side' && ready(spr['walk-side'])) return spr['walk-side'];
  if (view === 'back' && ready(spr['walk-back'])) return spr['walk-back'];
  if (moving && ready(spr.walk) && ready(spr.idle)) {
    return (Math.floor((u.walk || 0) / Math.PI) & 1) ? spr.walk : spr.idle;
  }
  if (ready(spr.idle)) return spr.idle;
  if (ready(spr.walk)) return spr.walk;
  return null;
}

// ============ GHAROK SPRITES (v2.8.6) — real art from approved concept ============
// Loaded from assets/gharok/*.png (synced into www/). NOT skeletal articulation —
// frame-swap idle↔walk by gait phase + bob/lean/squash so steps read clearly.
// Procedural VFX stay in drawWarlord(); body falls back to drawWarlordProcedural.
// Multi-dir: + walk-side / walk-back (attack/windup stay front).
const gharokSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadGharokSprites() {
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
const zombieSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadZombieSprites() {
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
  // Attack: windup sheet while swipe telegraphs / strikes (husks use swipeT, not clawWind) — front only
  if ((e.swipeT || 0) > 0 && zombieSpriteReady(zombieSpr.windup)) return zombieSpr.windup;
  const dir = unitPickDirWalk(zombieSpr, zombieSpriteReady, e, 12);
  if (dir) return dir;
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

  // shadow — match procedural husk footprint (stronger for grass silhouette)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12.5 * s * (1 + plant * 0.04), 5.2 * s, 0, 0, TAU); ctx.fill();

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
  else ctx.filter = 'contrast(1.1) saturate(1.06)';
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
const skeletonSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadSkeletonSprites() {
  if (!SKELETON_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
  const dir = unitPickDirWalk(skeletonSpr, skeletonSpriteReady, e, 12);
  if (dir) return dir;
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

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, 9.5 * s * (1 + plant * 0.04), 4.4 * s, 0, 0, TAU); ctx.fill();

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
  else ctx.filter = 'contrast(1.12) saturate(1.05)';
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
const bulwarkSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadBulwarkSprites() {
  if (!BULWARK_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
  const dir = unitPickDirWalk(bulwarkSpr, bulwarkSpriteReady, e, 12);
  if (dir) return dir;
  if (bulwarkSpriteReady(bulwarkSpr.windup)) return bulwarkSpr.windup;
  return null;
}

function drawBulwarkSprite(e, alpha) {
  if (!BULWARK_SPRITE_ENABLED) return false;
  const img = bulwarkSpriteFrame(e);
  if (!img) return false;
  const s = 1.45; // UNIT_SIZES bulwark figure s
  const drawH = BULWARK_SPRITE_DRAWH * enemyVisScale(e); // base 62; decade may scale up (still << 228)
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

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12.5 * s * (1 + plant * 0.04), 5 * s, 0, 0, TAU); ctx.fill();

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
  else ctx.filter = 'contrast(1.1) saturate(1.05)';
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
const shamanSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadShamanSprites() {
  if (!SHAMAN_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
  const dir = unitPickDirWalk(shamanSpr, shamanSpriteReady, e, 12);
  if (dir) return dir;
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

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, 9.5 * s * (1 + plant * 0.04), 4.2 * s, 0, 0, TAU); ctx.fill();

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
  else ctx.filter = 'contrast(1.1) saturate(1.05)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

/** Step 10.5 — swimming caster: body sunk below the surface, head + shoulders above,
 * ripple rings + a small V-wake at the waterline. Clip-rect at the surface (no new
 * ctx.filter use); reuses the standard sprite draw — or the procedural figure when the
 * sheets aren't loaded — shifted down SHAMAN_SWIM_SINK px so only the top shows. */
function drawShamanSwimming(e, alpha) {
  const a = alpha === undefined ? 1 : alpha;
  const bob = Math.sin((e.walk || 0) * 1.7) * 1.6;
  const surfY = e.y + 2;
  // ripple rings expanding from the swimmer at the waterline
  ctx.save();
  ctx.strokeStyle = '#bfeaf2';
  ctx.lineWidth = 1.4;
  const ph = ((e.walk || 0) * 0.45) % 1;
  for (let i = 0; i < 2; i++) {
    const p = (ph + i * 0.5) % 1;
    ctx.globalAlpha = a * 0.45 * (1 - p);
    ctx.beginPath();
    ctx.ellipse(e.x, surfY, 13 + p * 22, (13 + p * 22) * 0.38, 0, 0, TAU);
    ctx.stroke();
  }
  // small V-wake trailing the stroke direction
  const vl = Math.hypot(e.vx || 0, e.vy || 0);
  if (vl > 8) {
    const wx = -(e.vx / vl), wy = -(e.vy / vl);
    ctx.globalAlpha = a * 0.4;
    ctx.strokeStyle = '#d8f4fa';
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(e.x, surfY);
      ctx.lineTo(e.x + wx * 16 - wy * s * 7, surfY + (wy * 16 + wx * s * 7) * 0.45);
      ctx.stroke();
    }
  }
  ctx.restore();
  // the body — standard draw sunk below a clip line at the surface (feet shadow clips away)
  ctx.save();
  ctx.beginPath();
  ctx.rect(e.x - 60, surfY - 110, 120, 110);
  ctx.clip();
  ctx.translate(0, SHAMAN_SWIM_SINK + bob);
  if (!drawShamanSprite(e, a)) {
    const fig = enemyFigure(e);
    fig.alpha = a;
    drawFigure(e.x, e.y, fig);
  }
  ctx.restore();
  return true;
}

// ============ ASHEN RAVAGER SPRITES (articulation+barks coded; flag OFF until ship batch) ============
// assets/ravager/{idle,walk,windup}.png — husk/bulwark quality, between others and boss.
// Flag OFF: live procedural r=24 / s=1.7. Flag ON: sheets + r=36 / drawH=100 / s≈2.78.
// Gate + size constants: RAVAGER_SPRITE_* near ETYPES. NOT boss (Gharok 54/228).
const ravagerSpr = { idle: null, walk: null, windup: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadRavagerSprites() {
  if (!RAVAGER_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'windup', 'walk-side', 'walk-back'];
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
  // Windup front-only; idle↔walk + multi-dir side/back when ready
  if ((e.swipeT || 0) > 0 && ravagerSpriteReady(ravagerSpr.windup)) return ravagerSpr.windup;
  const dir = unitPickDirWalk(ravagerSpr, ravagerSpriteReady, e, 12);
  if (dir) return dir;
  if (ravagerSpriteReady(ravagerSpr.windup)) return ravagerSpr.windup;
  return null;
}

function drawRavagerSprite(e, alpha) {
  if (!RAVAGER_SPRITE_ENABLED) return false;
  const img = ravagerSpriteFrame(e);
  if (!img) return false;
  const s = RAVAGER_FIGURE_S; // 2.78 when enabled (drawH/36)
  const drawH = RAVAGER_SPRITE_DRAWH * enemyVisScale(e); // base 100; decade may scale up (still << 228)
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

  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.beginPath(); ctx.ellipse(0, 0, 15.5 * s * (1 + plant * 0.05), 6 * s, 0, 0, TAU); ctx.fill();

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
  else ctx.filter = 'contrast(1.1) saturate(1.05)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN BURSTWEAVER SPRITES (7.4C — attacks: web / bite / explode) ============
// assets/burstweaver/{idle,walk,threat,swell}.png — threat=bite/aggro; swell=explode telegraph.
// No walk-side/walk-back sheets yet — unitPickDirWalk falls through to front idle↔walk gait.
// SIZE LOCK: r=42 / drawH=115. Soft-wire BURSTWEAVER_SPRITE_ENABLED.
const burstweaverSpr = { idle: null, walk: null, threat: null, swell: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadBurstweaverSprites() {
  if (!BURSTWEAVER_SPRITE_ENABLED) return;
  const keys = ['idle', 'walk', 'threat', 'swell'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) burstweaverSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) burstweaverSpr.ok = good > 0; };
    img.src = 'assets/burstweaver/' + k + '.png';
    burstweaverSpr[k] = img;
  }
})();

function burstweaverSpriteReady(img) {
  return !!(BURSTWEAVER_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function burstweaverSpriteFrame(e) {
  // swell telegraph > threat (bite/aggro) > idle/walk gait
  if ((e.bwSwellT || 0) > 0 && burstweaverSpriteReady(burstweaverSpr.swell))
    return burstweaverSpr.swell;
  if ((e.bwThreatT || 0) > 0 && burstweaverSpriteReady(burstweaverSpr.threat))
    return burstweaverSpr.threat;
  const dir = unitPickDirWalk(burstweaverSpr, burstweaverSpriteReady, e, 12);
  if (dir) return dir;
  if (burstweaverSpriteReady(burstweaverSpr.idle)) return burstweaverSpr.idle;
  if (burstweaverSpriteReady(burstweaverSpr.walk)) return burstweaverSpr.walk;
  return null;
}

function ashenSpiderDrawScale(e) {
  if (e.type === 'broodmother') return { scale: BROODMOTHER_DRAW_SCALE, fat: BROODMOTHER_FAT_SCALE, ringR: BROODMOTHER_BIRTH_RING_R, birth: true };
  if (e.type === 'spiderling') return { scale: SPIDERLING_DRAW_SCALE, fat: 1, ringR: 0, birth: false };
  return { scale: 1, fat: 1, ringR: BURSTWEAVER_EXPLODE_R, birth: false };
}

function drawBurstweaverSprite(e, alpha) {
  if (!BURSTWEAVER_SPRITE_ENABLED && !(BROODMOTHER_SPRITE_ENABLED && (e.type === 'broodmother' || e.type === 'spiderling'))) return false;
  const img = burstweaverSpriteFrame(e);
  if (!img) return false;
  const vis = ashenSpiderDrawScale(e);
  const swelling = (e.bwSwellT || 0) > 0;
  const s = vis.scale * (swelling ? 1.0 + Math.sin(performance.now() / 90) * 0.06 : 1.0);
  const drawH = BURSTWEAVER_SPRITE_DRAWH * vis.scale;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = e.walk || 0;
  const moving = Math.hypot(e.vx || 0, e.vy || 0) > 12 && !swelling;
  const hurt = e.flash > 0;
  // Low arachnid gait — plant squash + opposite-limb bob (Continuity husk/ravager grammar)
  const bob = moving ? Math.abs(Math.sin(t)) * 2.2 * s
    : Math.abs(Math.sin(t * 0.5)) * 0.5 * s;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : (swelling ? 0.35 : 0);
  const lean = moving ? Math.sin(t) * 0.045
    : hurt ? -0.1
    : Math.sin(t * 0.5) * 0.012;
  const squashY = 1 - plant * 0.06 + (hurt ? 0.016 : 0) + (swelling ? 0.04 : 0);
  const squashX = (1 + plant * 0.05 - (hurt ? 0.016 : 0) + (swelling ? 0.08 : 0)) * vis.fat;

  ctx.save();
  ctx.translate(e.x, e.y);
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  ctx.fillStyle = swelling ? 'rgba(160,40,60,0.45)' : 'rgba(0,0,0,0.58)';
  ctx.beginPath(); ctx.ellipse(0, 0, 18 * s * (1 + plant * 0.05), 7 * s, 0, 0, TAU); ctx.fill();

  ctx.scale(e.facing || 1, 1);
  ctx.translate(0, -bob);
  ctx.rotate(lean);
  ctx.scale(squashX * s, squashY * s);

  if (hurt) ctx.filter = 'brightness(2.5) saturate(0.15)';
  else if (swelling && e.type === 'broodmother') ctx.filter = 'contrast(1.12) saturate(1.35) hue-rotate(-18deg) brightness(1.06)';
  else if (swelling) ctx.filter = 'contrast(1.15) saturate(1.25) brightness(1.08)';
  else ctx.filter = 'contrast(1.08) saturate(1.05)';
  ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();

  // 7.4D — swell danger ring (full radius ghost + growing fill) so explode isn't cheap
  if (swelling && !e.dead) {
    const maxT = e.bwSwellDur || BURSTWEAVER_SWELL_MAX;
    const prog = 1 - clamp((e.bwSwellT || 0) / maxT, 0, 1);
    const ringMax = vis.birth ? vis.ringR : BURSTWEAVER_EXPLODE_R;
    const growR = ringMax * (0.28 + 0.72 * prog);
    ctx.save();
    ctx.translate(e.x, e.y);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(224,112,64,${0.25 + 0.45 * prog})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(0, 0, ringMax, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(160,96,192,${0.35 + 0.4 * prog})`;
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(0, 0, growR, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(224,80,60,${0.04 + 0.08 * prog})`;
    ctx.beginPath(); ctx.arc(0, 0, growR, 0, TAU); ctx.fill();
    ctx.restore();
  }
  return true;
}

// ============ WORLD SPRITES (v2.8.7) — pine trees + rocks ============
// assets/world/trees|rocks/*.png — drawImage when ready, procedural fallback otherwise.
// Continuity: TREE_SPRITE_VARIANTS_ENABLED adds one/few/bunch sheets (soft-wire).
const TREE_SPRITE_VARIANTS_ENABLED = true;
const worldSpr = {
  trees: {
    small: null, med: null, tall: null,
    broad: null, short: null, slender: null, leafy: null, fir: null,
    few_pair: null, few_grove: null, few_classic: null, few_mix: null,
    bunch_spruce: null, bunch_mix: null,
  },
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
  if (TREE_SPRITE_VARIANTS_ENABLED) {
    list.push(
      ['trees', 'broad', 'assets/world/trees/tree_single_broad.png'],
      ['trees', 'short', 'assets/world/trees/tree_single_short.png'],
      ['trees', 'slender', 'assets/world/trees/tree_single_slender.png'],
      ['trees', 'leafy', 'assets/world/trees/tree_single_leafy.png'],
      ['trees', 'fir', 'assets/world/trees/tree_single_fir.png'],
      ['trees', 'few_pair', 'assets/world/trees/tree_few_pair.png'],
      ['trees', 'few_grove', 'assets/world/trees/tree_few_grove.png'],
      ['trees', 'few_classic', 'assets/world/trees/tree_few_classic.png'],
      ['trees', 'few_mix', 'assets/world/trees/tree_few_mix.png'],
      ['trees', 'bunch_spruce', 'assets/world/trees/tree_bunch_spruce.png'],
      ['trees', 'bunch_mix', 'assets/world/trees/tree_bunch_mix.png'],
    );
  }
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
/** Weighted pick — weights are relative ints. Uses Math.random (spawn-time). */
function pickWeighted(entries) {
  let sum = 0;
  for (const e of entries) sum += e.w;
  let r = Math.random() * sum;
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.v;
  }
  return entries[entries.length - 1].v;
}
/** Assign one / few / bunch sprite key. Classic pines still majority of "one". */
function assignTreeVariant(t) {
  if (!TREE_SPRITE_VARIANTS_ENABLED) return;
  const kind = pickWeighted(t.borderRing ? [
    { v: 'one', w: 28 },
    { v: 'few', w: 42 },
    { v: 'bunch', w: 30 },
  ] : [
    { v: 'one', w: 55 },
    { v: 'few', w: 32 },
    { v: 'bunch', w: 13 },
  ]);
  t.treeKind = kind;
  if (kind === 'one') {
    // Prefer classic TR pines (~half) so biomes stay familiar; rest = meshed TR singles.
    if (Math.random() < 0.52) {
      t.treeSpr = t.size === 0 ? 'small' : t.size === 2 ? 'tall' : 'med';
    } else {
      t.treeSpr = pickWeighted([
        { v: 'broad', w: 22 },
        { v: 'short', w: 20 },
        { v: 'slender', w: 22 },
        { v: 'leafy', w: 18 },
        { v: 'fir', w: 18 },
      ]);
      if (t.treeSpr === 'short') t.size = 0;
      else if (t.treeSpr === 'slender' || t.treeSpr === 'broad' || t.treeSpr === 'leafy') t.size = 2;
      else t.size = 1;
    }
  } else if (kind === 'few') {
    t.treeSpr = pickWeighted([
      { v: 'few_pair', w: 30 },
      { v: 'few_classic', w: 28 },
      { v: 'few_mix', w: 24 },
      { v: 'few_grove', w: 18 },
    ]);
    if (t.size < 1) t.size = 1;
    t.r = Math.max(t.r || 12, 16 + (t.size > 1 ? 2 : 0));
  } else {
    t.treeSpr = pickWeighted([
      { v: 'bunch_spruce', w: 62 },
      { v: 'bunch_mix', w: 38 },
    ]);
    t.size = 2;
    t.r = Math.max(t.r || 12, 22);
  }
  // Refresh wood from size after variant tweaks
  if (t.woodLeft != null && t.maxWood != null) {
    const base = t.standId != null ? 22 : 18;
    t.woodLeft = base + t.size * (t.standId != null ? 16 : 14);
    t.maxWood = t.woodLeft;
  }
}
function pineSpriteFor(o) {
  if (TREE_SPRITE_VARIANTS_ENABLED && o.treeSpr) {
    const img = worldSpr.trees[o.treeSpr];
    if (worldSprReady(img)) return img;
  }
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
  // Attack: windup sheet during telegraph; keep windup through strike follow-through (front only)
  if ((e.clawWind > 0 || e.clawStrike > 0) && gharokSpriteReady(gharokSpr.windup)) return gharokSpr.windup;
  const dir = unitPickDirWalk(gharokSpr, gharokSpriteReady, e, 14);
  if (dir) return dir;
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
  const drawH = 228 * enemyVisScale(e); // Gharok 228; decade warlord skins use visScale ≤0.88 — SIZE LOCK
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
  const s = 3.2 * enemyVisScale(e);
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
// Rover: quadruped robot dog with a cyan visor (sheets ON Continuity).
// Warden: yellow knight-robot tank (sheets ON Continuity). Scout: art drafted, soft-wire OFF (no articulate yet).
//
// ============ ASHEN ROVER / RIFT HOUND SPRITES (articulation+barks ON for Continuity; store deferred) ============
// assets/allies/rover/{idle,walk,attack,death}.png — companion footprint, NOT boss.
// Flag ON for master Continuity testing (like Cloister Wall). Store ship deferred with peer batch.
// Size lock: collision r=11 always; drawH=30 (3.1.3 squad taller ~15%). Procedural drawRover remains fallback.
const ROVER_SPRITE_ENABLED = true;
const ROVER_SPRITE_DRAWH = 30; // SIZE LOCK (3.1.3) — was 26; collision r=11 unchanged; << husk 56 / Gharok 228
const roverSpr = { idle: null, walk: null, attack: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadRoverSprites() {
  if (!ROVER_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death', 'walk-side', 'walk-back'];
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
  // attack/death stay front; idle↔walk + multi-dir side/back
  if (c.downed && roverSpriteReady(roverSpr.death)) return roverSpr.death;
  if ((c.swipeT || 0) > 0 && roverSpriteReady(roverSpr.attack)) return roverSpr.attack;
  const dir = unitPickDirWalk(roverSpr, roverSpriteReady, c, 20);
  if (dir) return dir;
  if (roverSpriteReady(roverSpr.attack)) return roverSpr.attack;
  return null;
}

function drawRoverSprite(c) {
  if (!ROVER_SPRITE_ENABLED) return false;
  const img = roverSpriteFrame(c);
  if (!img) return false;
  const drawH = ROVER_SPRITE_DRAWH; // 30 — companion dog, not boss
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const bite = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  const flash = c.hurtT > 0.35;
  // Compact hound gait — plant squash/bob like husk/ravager sheet path (small footprint)
  const bob = moving ? Math.abs(Math.sin(t)) * 1.35
    : (swipe > 0) ? 0.55
    : Math.abs(Math.sin(t * 0.5)) * 0.35;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.05
    : windPose > 0 ? -0.06 - windPose * 0.04
    : strikePose > 0 ? 0.1 * (1 - strikePose * 0.3)
    : flash ? -0.07
    : Math.sin(t * 0.5) * 0.012;
  const squashY = 1 - plant * 0.055 - (strikePose > 0 ? 0.03 : 0) + (flash ? 0.015 : 0);
  const squashX = 1 + plant * 0.045 + (strikePose > 0 ? 0.035 : 0) - (flash ? 0.015 : 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * (1 + plant * 0.04) + bite * 2, 4.5, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.15);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if ((windPose > 0 || strikePose > 0) && !c.downed) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.35 + glow * 0.4;
    ctx.shadowColor = '#4de1ff';
    ctx.shadowBlur = 8 + glow * 6;
    ctx.fillStyle = `rgba(158,240,255,${0.12 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.22, -drawH * 0.45, 5 + glow * 3, 4 + glow * 2.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN WARDEN SPRITES (articulation+barks ON for Continuity; store deferred) ============
// assets/allies/warden/{idle,walk,attack,death}.png — tank companion footprint, NOT boss.
// Flag ON for master Continuity testing. Store ship deferred with peer batch.
// Size lock: collision r=13 always; drawH=55 (3.1.3 squad taller ~15%; was 48). No Warframe/Destiny IP.
const WARDEN_SPRITE_ENABLED = true;
const WARDEN_SPRITE_DRAWH = 55; // SIZE LOCK (3.1.3) — was 48; collision r=13 unchanged; << husk 56 / Gharok 228
const wardenSpr = { idle: null, walk: null, attack: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadWardenSprites() {
  if (!WARDEN_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death', 'walk-side', 'walk-back'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) wardenSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) wardenSpr.ok = good > 0; };
    img.src = 'assets/allies/warden/' + k + '.png';
    wardenSpr[k] = img;
  }
})();

function wardenSpriteReady(img) {
  return !!(WARDEN_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function wardenSpriteFrame(c) {
  if (c.downed && wardenSpriteReady(wardenSpr.death)) return wardenSpr.death;
  if ((c.swipeT || 0) > 0 && wardenSpriteReady(wardenSpr.attack)) return wardenSpr.attack;
  const dir = unitPickDirWalk(wardenSpr, wardenSpriteReady, c, 20);
  if (dir) return dir;
  if (wardenSpriteReady(wardenSpr.attack)) return wardenSpr.attack;
  return null;
}

function drawWardenSprite(c) {
  if (!WARDEN_SPRITE_ENABLED) return false;
  const img = wardenSpriteFrame(c);
  if (!img) return false;
  const drawH = WARDEN_SPRITE_DRAWH; // 55 — tank companion, not boss
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const fire = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  const flash = c.hurtT > 0.35;
  // Heavy tank plant — deeper squash / slower bob than Rover hound gait
  const bob = moving ? Math.abs(Math.sin(t)) * 1.05
    : (swipe > 0) ? 0.7
    : Math.abs(Math.sin(t * 0.4)) * 0.28;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.032
    : windPose > 0 ? -0.04 - windPose * 0.035
    : strikePose > 0 ? 0.07 * (1 - strikePose * 0.25)
    : flash ? -0.055
    : Math.sin(t * 0.4) * 0.01;
  const squashY = 1 - plant * 0.085 - (strikePose > 0 ? 0.04 : 0) + (flash ? 0.018 : 0);
  const squashX = 1 + plant * 0.07 + (strikePose > 0 ? 0.045 : 0) - (flash ? 0.018 : 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 13 * (1 + plant * 0.05) + fire * 1.5, 4.8, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.12);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if ((windPose > 0 || strikePose > 0) && !c.downed) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.32 + glow * 0.38;
    ctx.shadowColor = '#3ef0c8';
    ctx.shadowBlur = 10 + glow * 7;
    ctx.fillStyle = `rgba(62,240,200,${0.1 + glow * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.28, -drawH * 0.52, 6 + glow * 3.5, 4.5 + glow * 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN SCOUT SPRITES (articulation+barks ON for Continuity; store deferred) ============
// assets/allies/scout/{idle,walk,attack,death}.png — lighter archer companion, NOT Warden tank / NOT boss.
// Flag ON for master Continuity testing. Store ship deferred with peer batch.
// Size lock: collision r=13 always (syncCompanions non-rover); drawH=44 (3.1.3; was 38).
// Bright green plates + purple aether; bow silhouette — original TR Scout (no Fallout/Destiny IP).
const SCOUT_SPRITE_ENABLED = true;
const SCOUT_SPRITE_DRAWH = 44; // SIZE LOCK (3.1.3) — was 38; collision r=13 unchanged; << Warden 55 / husk 56 / Gharok 228
const scoutSpr = { idle: null, walk: null, attack: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadScoutSprites() {
  if (!SCOUT_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death', 'walk-side', 'walk-back'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) scoutSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) scoutSpr.ok = good > 0; };
    img.src = 'assets/allies/scout/' + k + '.png';
    scoutSpr[k] = img;
  }
})();

function scoutSpriteReady(img) {
  return !!(SCOUT_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function scoutSpriteFrame(c) {
  if (c.downed && scoutSpriteReady(scoutSpr.death)) return scoutSpr.death;
  if ((c.swipeT || 0) > 0 && scoutSpriteReady(scoutSpr.attack)) return scoutSpr.attack;
  const dir = unitPickDirWalk(scoutSpr, scoutSpriteReady, c, 20);
  if (dir) return dir;
  if (scoutSpriteReady(scoutSpr.attack)) return scoutSpr.attack;
  return null;
}

function drawScoutSprite(c) {
  if (!SCOUT_SPRITE_ENABLED) return false;
  const img = scoutSpriteFrame(c);
  if (!img) return false;
  const drawH = SCOUT_SPRITE_DRAWH; // 44 — lighter archer companion, not tank/boss
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const fire = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  const flash = c.hurtT > 0.35;
  // Lighter ranger plant — quicker bob than Warden tank, less squash than heavy plate
  const bob = moving ? Math.abs(Math.sin(t)) * 1.25
    : (swipe > 0) ? 0.55
    : Math.abs(Math.sin(t * 0.45)) * 0.32;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.038
    : windPose > 0 ? -0.05 - windPose * 0.04
    : strikePose > 0 ? 0.055 * (1 - strikePose * 0.3)
    : flash ? -0.05
    : Math.sin(t * 0.45) * 0.012;
  const squashY = 1 - plant * 0.065 - (strikePose > 0 ? 0.03 : 0) + (flash ? 0.015 : 0);
  const squashX = 1 + plant * 0.055 + (strikePose > 0 ? 0.035 : 0) - (flash ? 0.015 : 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * (1 + plant * 0.04) + fire * 1.2, 4.2, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.12);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if ((windPose > 0 || strikePose > 0) && !c.downed) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.3 + glow * 0.4;
    ctx.shadowColor = '#9d6cff';
    ctx.shadowBlur = 9 + glow * 6;
    ctx.fillStyle = `rgba(157,108,255,${0.1 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.3, -drawH * 0.55, 5 + glow * 3, 4 + glow * 2.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

// ============ ASHEN SENTINEL SPRITES (articulation+barks ON for Continuity; store deferred) ============
// assets/allies/sentinel/{idle,walk,attack,death}.png — militia spear line-holder, NOT Warden tank / NOT Scout archer / NOT boss.
// Flag ON for master Continuity testing. Store ship deferred with peer batch.
// Size lock: collision r=13 always (syncCompanions non-rover); drawH=50 (3.1.3; was 44).
// Weathered bronze/steel + forest-green cloak; amber aether spear — original TR Sentinel (no LOTR / Bastion / Rescale IP).
const SENTINEL_SPRITE_ENABLED = true;
const SENTINEL_SPRITE_DRAWH = 50; // SIZE LOCK (3.1.3) — was 44; between Scout 44 and Warden 55; collision r=13 unchanged
const sentinelSpr = { idle: null, walk: null, attack: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadSentinelSprites() {
  if (!SENTINEL_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death', 'walk-side', 'walk-back'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) sentinelSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) sentinelSpr.ok = good > 0; };
    img.src = 'assets/allies/sentinel/' + k + '.png';
    sentinelSpr[k] = img;
  }
})();

function sentinelSpriteReady(img) {
  return !!(SENTINEL_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function sentinelSpriteFrame(c) {
  if (c.downed && sentinelSpriteReady(sentinelSpr.death)) return sentinelSpr.death;
  if ((c.swipeT || 0) > 0 && sentinelSpriteReady(sentinelSpr.attack)) return sentinelSpr.attack;
  const dir = unitPickDirWalk(sentinelSpr, sentinelSpriteReady, c, 20);
  if (dir) return dir;
  if (sentinelSpriteReady(sentinelSpr.attack)) return sentinelSpr.attack;
  return null;
}

function drawSentinelSprite(c) {
  if (!SENTINEL_SPRITE_ENABLED) return false;
  const img = sentinelSpriteFrame(c);
  if (!img) return false;
  const drawH = SENTINEL_SPRITE_DRAWH; // 50 — sturdy militia companion, not tank/boss
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 20 && !c.downed;
  const swipe = c.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const fire = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : 0;
  const flash = c.hurtT > 0.35;
  // Mid militia plant — heavier than Scout ranger, lighter than Warden tank
  const bob = moving ? Math.abs(Math.sin(t)) * 1.15
    : (swipe > 0) ? 0.62
    : Math.abs(Math.sin(t * 0.42)) * 0.3;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.035
    : windPose > 0 ? -0.045 - windPose * 0.038
    : strikePose > 0 ? 0.065 * (1 - strikePose * 0.28)
    : flash ? -0.052
    : Math.sin(t * 0.42) * 0.011;
  const squashY = 1 - plant * 0.075 - (strikePose > 0 ? 0.035 : 0) + (flash ? 0.016 : 0);
  const squashX = 1 + plant * 0.062 + (strikePose > 0 ? 0.04 : 0) - (flash ? 0.016 : 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * (1 + plant * 0.045) + fire * 1.3, 4.4, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.12);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if ((windPose > 0 || strikePose > 0) && !c.downed) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.3 + glow * 0.4;
    ctx.shadowColor = '#ffb02e';
    ctx.shadowBlur = 9 + glow * 6.5;
    ctx.fillStyle = `rgba(255,176,46,${0.1 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.32, -drawH * 0.58, 5.5 + glow * 3.2, 4.2 + glow * 2.6, 0, 0, TAU);
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
  if (c.type === 'warden') return { ...base, s: 1.43, bulk: 1.5, skin: '#9aa7b8', cloth: '#5a6478',
    pauldron: '#7e8ba0', legs: '#3c4454', helmet: '#6b7686', glowEyes: '#3ef0c8', weapon: 'cannon' };
  if (c.type === 'sentinel') return { ...base, s: 1.31, bulk: 1.25, skin: '#c4a078', cloth: '#5a4030',
    pauldron: '#8a6a48', legs: '#3a3028', helmet: '#6a5040', glowEyes: '#ffb02e', weapon: 'crossbow' };
  return { ...base, s: 1.15, skin: '#d8a87e', cloth: '#3e5a48', hood: '#2e4438',
    legs: '#2e4038', weapon: 'crossbow' };
}
function drawCompanion(c) {
  if (c.type === 'rover') drawRover(c);
  else if (c.type === 'warden' && drawWardenSprite(c)) { /* sheet path when flag ON */ }
  else if (c.type === 'scout' && drawScoutSprite(c)) { /* sheet path when flag ON */ }
  else if (c.type === 'sentinel' && drawSentinelSprite(c)) { /* sheet path when flag ON */ }
  else drawFigure(c.x, c.y, companionFigure(c));
  // downed marker
  if (c.downed) {
    ctx.fillStyle = '#ff8a93';
    ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.strokeText('✚ DOWN', c.x, c.y - 34);
    ctx.fillText('✚ DOWN', c.x, c.y - 34);
    const rp = reviveProgressFor('comp', c.type);
    if (rp > 0) drawReviveProgress(c.x, c.y, rp);
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

// ============ ASHEN LABORER SPRITES (articulation+barks ON for Continuity; store deferred) ============
// assets/allies/laborer/{idle,walk,work,death}.png — stocky worker (≠ squad), NOT companion tank/archer.
// Flag ON for master Continuity testing. Store ship deferred with peer batch.
// Size lock: collision r=11 always; drawH=30 (3.1.3; was 26; matches Rover footprint scale).
// Ash-grey + ochre leather; cyan wrist cuff + pick-tip glow; short beard/goggles — original TR Laborer (not gallery dwarf clone).
const LABORER_SPRITE_ENABLED = true;
const LABORER_SPRITE_DRAWH = 30; // SIZE LOCK (3.1.3) — was 26; worker ≈ Rover drawH; collision r=11 unchanged
const laborerSpr = { idle: null, walk: null, work: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadLaborerSprites() {
  if (!LABORER_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'work', 'death', 'walk-side', 'walk-back'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) laborerSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) laborerSpr.ok = good > 0; };
    img.src = 'assets/allies/laborer/' + k + '.png';
    laborerSpr[k] = img;
  }
})();

function laborerSpriteReady(img) {
  return !!(LABORER_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function laborerSpriteFrame(L) {
  // work/death stay front; idle↔walk + multi-dir side/back
  if (L.downed && laborerSpriteReady(laborerSpr.death)) return laborerSpr.death;
  const working = !L.downed && ((L.gatherT || 0) > 0 || (L.swipeT || 0) > 0);
  if (working && laborerSpriteReady(laborerSpr.work)) return laborerSpr.work;
  const dir = unitPickDirWalk(laborerSpr, laborerSpriteReady, L, 8);
  if (dir) return dir;
  if (laborerSpriteReady(laborerSpr.work)) return laborerSpr.work;
  return null;
}

function drawLaborerSprite(L) {
  if (!LABORER_SPRITE_ENABLED) return false;
  const img = laborerSpriteFrame(L);
  if (!img) return false;
  const drawH = LABORER_SPRITE_DRAWH; // 30 — stocky worker, not companion knight
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = L.walk || 0;
  const moving = Math.hypot(L.vx || 0, L.vy || 0) > 8 && !L.downed;
  const swipe = L.swipeT || 0;
  const gathering = (L.gatherT || 0) > 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const chopPose = gathering && !swipe ? (0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 90))) : 0;
  const workPose = Math.max(windPose, strikePose, chopPose);
  const fire = swipe > 0 ? clamp(1 - swipe / UNIT_SWIPE, 0, 1) : (chopPose > 0 ? chopPose * 0.55 : 0);
  const flash = L.hurtT > 0.2;
  // Heavy worker plant — similar weight to mid Sentinel (heavier than Scout ranger)
  const bob = moving ? Math.abs(Math.sin(t)) * 1.2
    : (workPose > 0) ? 0.6
    : Math.abs(Math.sin(t * 0.42)) * 0.28;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.034
    : windPose > 0 ? -0.05 - windPose * 0.04
    : strikePose > 0 ? 0.07 * (1 - strikePose * 0.28)
    : chopPose > 0 ? -0.04 - chopPose * 0.03
    : flash ? -0.055
    : Math.sin(t * 0.42) * 0.01;
  const squashY = 1 - plant * 0.078 - (strikePose > 0 || chopPose > 0.5 ? 0.036 : 0) + (flash ? 0.016 : 0);
  const squashX = 1 + plant * 0.065 + (strikePose > 0 || chopPose > 0.5 ? 0.042 : 0) - (flash ? 0.016 : 0);

  ctx.save();
  ctx.translate(L.x, L.y);
  if (L.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 2, 8 * (1 + plant * 0.045) + fire * 1.1, 3, 0, 0, TAU); ctx.fill();

  ctx.scale(L.facing || 1, 1);
  ctx.translate(0, -bob);
  if (L.downed) ctx.rotate(0.12);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if (workPose > 0 && !L.downed) {
    ctx.save();
    const glow = workPose;
    ctx.globalAlpha *= 0.28 + glow * 0.4;
    ctx.shadowColor = '#4de1ff';
    ctx.shadowBlur = 8 + glow * 6;
    ctx.fillStyle = `rgba(77,225,255,${0.1 + glow * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.3, -drawH * 0.55, 5 + glow * 2.8, 3.8 + glow * 2.4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 2, drawW, drawH);
  ctx.filter = 'none';

  // BETA-3.1 step 3 — slate tunic override so squad laborers read distinct from Ashen ochre
  if (L.squadSide && !L.downed) {
    ctx.fillStyle = 'rgba(106,115,128,0.82)';
    ctx.fillRect(-drawW * 0.22, -drawH * 0.72, drawW * 0.44, drawH * 0.30);
  }

  // carry badge overlay (wood/gold lump)
  if (L.carry && !L.downed) {
    ctx.fillStyle = L.carry.type === 'wood' ? (L.squadSide ? '#6a7380' : '#7a9a5a') : '#ffd54a';
    ctx.fillRect(drawW * 0.18, -drawH * 0.55, 6, 5);
  }
  ctx.restore();
  return true;
}

function drawLaborer(L) {
  if (L.insideMine) return; // working underground
  if (drawLaborerSprite(L)) {
    // HUD overlays still drawn below after sprite path
  } else {
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
  ctx.fillStyle = L.hurtT > 0.2 ? '#fff' : (L.squadSide ? SQUAD_LABORER_SHIRT : '#b8895a');
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
    ctx.fillStyle = L.carry.type === 'wood' ? (L.squadSide ? '#6a7380' : '#7a9a5a') : '#ffd54a';
    ctx.fillRect(6, -14 + bob, 7, 6);
  }
  ctx.restore();
  }
  if (L.downed) {
    ctx.fillStyle = '#ff8a93';
    ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.strokeText('✚ DOWN', L.x, L.y - 34);
    ctx.fillText('✚ DOWN', L.x, L.y - 34);
    const rp = reviveProgressFor('laborer', L.id);
    if (rp > 0) drawReviveProgress(L.x, L.y, rp);
  } else if (L.hp < L.maxHp) {
    const w = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(L.x - w / 2, L.y - 32, w, 3);
    ctx.fillStyle = L.squadSide ? '#8a92a0' : '#c8a06a';
    ctx.fillRect(L.x - w / 2, L.y - 32, w * clamp(L.hp / L.maxHp, 0, 1), 3);
  }
  if (selectedUnit && (selectedUnit.kind === 'laborer' || selectedUnit.kind === 'squadLaborer') && selectedUnit.ref === L) {
    ctx.strokeStyle = L.squadSide ? 'rgba(138,146,160,0.9)' : 'rgba(124,252,0,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(L.x, L.y, 16, 0, TAU); ctx.stroke();
  }
  ctx.font = '8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = L.squadSide ? 'rgba(138,146,160,0.95)' : 'rgba(200,160,106,0.9)';
  const tag = L.downed ? (L.squadSide ? 'Sq Lab' : 'Laborer')
    : L.order === 'mine' ? 'Mine' : L.order === 'chop' ? 'Chop' : (L.squadSide ? 'Sq Lab' : 'Laborer');
  ctx.fillText(tag, L.x, L.y + 12);
}
function drawMilitia(m) {
  const tMeta = MILITIA_TYPES[m.kind];
  const moving = Math.hypot(m.vx || 0, m.vy || 0) > 16 && !m.downed;
  // idle breath uses walk phase (updateMilitia ticks slowly when planted)
  const fig = {
    walk: m.walk, facing: m.facing,
    moving,
    flash: m.hurtT > 0.2 ? 0.1 : 0,
    swipe: m.downed ? 0 : (m.swipeT || 0),
    hurtRecoil: m.hurtT > 0.2,
    hurtLeanAmp: 1.45,
    downed: !!m.downed,
    // Companion-tier plant on locked footprint (Sentinel-class readability, not resized)
    plantAmp: 2.6, bobAmp: 1.35, gaitLean: 0.038, legAmp: 1.15,
    // SIZE LOCK (3.1.3) — squad taller ~14%; was 0.78
    s: 0.89, skin: '#c8b090',
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
    const rp = reviveProgressFor('militia', m.id);
    if (rp > 0) drawReviveProgress(m.x, m.y, rp);
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
// Rift Keep building sheets — ON for BETA-3 Continuity apply batch.
// Collision r stays STRUCT_KINDS.keep.r (54). Flag ON → drawH=72 (near procedural ~56 tall, << Gharok).
const KEEP_SPRITE_ENABLED = true;
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
// Timber Camp / Supply Camp sheets — ON for BETA-3 Continuity apply batch.
// Collision r stays STRUCT_KINDS (timber 40 / farm=Supply 36). Flag ON → camp-tall drawH (<< Keep 72 / Gharok).
const CAMP_SPRITE_ENABLED = true; // master gate
const TIMBER_SPRITE_ENABLED = true; // per-type (also requires CAMP_SPRITE_ENABLED)
const SUPPLY_SPRITE_ENABLED = true;
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
// Muster Hall sheets — ON for BETA-3 Continuity apply batch.
// Collision r stays STRUCT_KINDS.muster.r (46). Flag ON → drawH=60 (between camp ~50 and Keep 72).
const HALL_SPRITE_ENABLED = true;
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
// Gold Vault sheets — ON for BETA-3 Continuity apply batch.
// Collision r stays STRUCT_KINDS.golddepot.r (40). Flag ON → drawH=52 (stockier than hall 60).
const VAULT_SPRITE_ENABLED = true;
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
// Harvestable gold/coal field mines — reuse vault mine-mouth sheets (same art pass).
const GOLD_MINE_SPRITE_ENABLED = true;
const GOLD_MINE_SPRITE_DRAWH = 52; // SIZE LOCK — matches vault mine-mouth; field mine r=28
function goldMineSpriteReady() {
  return !!(GOLD_MINE_SPRITE_ENABLED && vaultSpriteReady(vaultSpr.idle));
}
function drawMineMouthSprite(x, y, tint) {
  if (!goldMineSpriteReady()) return false;
  const img = vaultSpr.idle;
  const drawH = GOLD_MINE_SPRITE_DRAWH;
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  ctx.save();
  if (tint === 'coal') ctx.filter = 'grayscale(1) brightness(0.5) contrast(1.12)';
  ctx.drawImage(img, x - drawW / 2, y - drawH + 2, drawW, drawH);
  ctx.filter = 'none';
  ctx.restore();
  return true;
}
// Aether Pit sheets — ON for BETA-3 Continuity apply batch.
// Collision r stays STRUCT_KINDS.aetherpit.r (38). Flag ON → drawH=48 (low crater; between supply 46 and vault 52).
const PIT_SPRITE_ENABLED = true;
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
  const span = Math.hypot(b.x - a.x, b.y - a.y);
  // Stretch brick content flush between pillars (inset overlaps cropped pillar body).
  const len = span - BRICKWALL_SEG_INSET * 2;
  if (len < 8) return;
  const segImg = (hurt && brickWallSpriteReady(brickWallSpr.segmentDamaged))
    ? brickWallSpr.segmentDamaged
    : brickWallSpriteReady(brickWallSpr.segment) ? brickWallSpr.segment : null;
  if (segImg) {
    const drawH = BRICKWALL_SEG_DRAWH;
    const drawW = len; // do NOT aspect-clamp — square sheet padding was starving joins
    const c = BRICKWALL_SEG_CROP;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.drawImage(segImg, c.sx, c.sy, c.sw, c.sh, -drawW / 2, -drawH + 4, drawW, drawH);
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
  // Always draw cropped pillar post (never swap full corner/tee sheets — those
  // include arm art that fought with link segments and looked disconnected).
  let img = null;
  if (hurt && brickWallSpriteReady(brickWallSpr.pillarDamaged)) img = brickWallSpr.pillarDamaged;
  else if (brickWallSpriteReady(brickWallSpr.pillar)) img = brickWallSpr.pillar;
  if (img) {
    const c = BRICKWALL_PILLAR_CROP;
    const drawH = BRICKWALL_SPRITE_DRAWH;
    const drawW = drawH * (c.sw / c.sh);
    ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, w.x - drawW / 2, w.y - drawH + 2, drawW, drawH);
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
    const jt = brickWallJunctionType(w);
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
  // WC2-style mine building — vault mine-mouth sprite when loaded, procedural fallback
  const pulse = 0.6 + Math.sin(performance.now() / 200 + v.x) * 0.25;
  if (!drawMineMouthSprite(v.x, v.y, 'gold')) {
    ctx.fillStyle = `rgba(255,213,74,${0.12 * pulse})`;
    ctx.beginPath(); ctx.arc(v.x, v.y, v.r + 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3228';
    ctx.fillRect(v.x - 18, v.y - 22, 36, 24);
    ctx.strokeStyle = `rgba(255,213,74,${0.7 * pulse})`; ctx.lineWidth = 2;
    ctx.strokeRect(v.x - 18, v.y - 22, 36, 24);
    ctx.fillStyle = '#1a1410';
    ctx.beginPath(); ctx.arc(v.x, v.y - 2, 9, Math.PI, 0); ctx.fill();
    ctx.fillRect(v.x - 9, v.y - 2, 18, 10);
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath(); ctx.arc(v.x - 12, v.y - 16, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(v.x + 10, v.y - 14, 2.5, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = `rgba(255,213,74,${0.1 * pulse})`;
    ctx.beginPath(); ctx.arc(v.x, v.y, v.r + 8, 0, TAU); ctx.fill();
  }
  ctx.font = 'bold 8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,213,74,0.9)';
  ctx.fillText('Mine · ◈' + v.goldLeft, v.x, v.y + 18);
}
/** Step 8.1 — same mine-mouth sprite as gold, dark gray tint. */
function drawCoalMine(v) {
  const pulse = 0.55 + Math.sin(performance.now() / 220 + v.x * 0.7) * 0.2;
  if (!drawMineMouthSprite(v.x, v.y, 'coal')) {
    ctx.fillStyle = `rgba(40,40,48,${0.18 * pulse})`;
    ctx.beginPath(); ctx.arc(v.x, v.y, v.r + 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(v.x - 18, v.y - 22, 36, 24);
    ctx.strokeStyle = `rgba(140,140,150,${0.55 * pulse})`; ctx.lineWidth = 2;
    ctx.strokeRect(v.x - 18, v.y - 22, 36, 24);
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath(); ctx.arc(v.x, v.y - 2, 9, Math.PI, 0); ctx.fill();
    ctx.fillRect(v.x - 9, v.y - 2, 18, 10);
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath(); ctx.arc(v.x - 12, v.y - 16, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath(); ctx.arc(v.x + 10, v.y - 14, 2.5, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = `rgba(60,60,68,${0.14 * pulse})`;
    ctx.beginPath(); ctx.arc(v.x, v.y, v.r + 8, 0, TAU); ctx.fill();
  }
  ctx.font = 'bold 8px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(180,180,190,0.92)';
  ctx.fillText('Coal · ⬤' + v.coalLeft, v.x, v.y + 18);
}
function drawForestStand(fs) {
  ctx.strokeStyle = 'rgba(90,140,70,0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.arc(fs.x, fs.y, fs.r, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
}
// ============ AETHER COLOSSUS / RIFT TITAN SPRITES (articulation+barks ON Continuity; store deferred) ============
// assets/colossus/{idle,walk,attack,death,walk-side,walk-back}.png — combiner ~Gharok scale, NOT Megazord / Optimus IP.
// Flag ON for master Continuity. Size lock: collision r=54 always; sprite drawH=228 (Gharok lock).
// Procedural drawColossus remains live fallback if sheets fail.
const COLOSSUS_SPRITE_ENABLED = true;
const COLOSSUS_SPRITE_DRAWH = 228; // SIZE LOCK — Gharok drawH; collision r=54 unchanged
const colossusSpr = { idle: null, walk: null, attack: null, death: null, 'walk-side': null, 'walk-back': null, ok: false };
(function loadColossusSprites() {
  if (!COLOSSUS_SPRITE_ENABLED) return; // soft-load only when enabled
  const keys = ['idle', 'walk', 'attack', 'death', 'walk-side', 'walk-back'];
  let left = keys.length, good = 0;
  for (const k of keys) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { good++; if (--left === 0) colossusSpr.ok = good > 0; };
    img.onerror = () => { if (--left === 0) colossusSpr.ok = good > 0; };
    img.src = 'assets/colossus/' + k + '.png';
    colossusSpr[k] = img;
  }
})();

function colossusSpriteReady(img) {
  return !!(COLOSSUS_SPRITE_ENABLED && img && img.complete && img.naturalWidth > 0);
}

function colossusSpriteFrame(c) {
  // attack/death stay front; idle↔walk half-cycle + multi-dir side/back
  if (c.downed && colossusSpriteReady(colossusSpr.death)) return colossusSpr.death;
  if ((c.swipeT || 0) > 0 && colossusSpriteReady(colossusSpr.attack)) return colossusSpr.attack;
  const dir = unitPickDirWalk(colossusSpr, colossusSpriteReady, c, 12);
  if (dir) return dir;
  if (colossusSpriteReady(colossusSpr.attack)) return colossusSpr.attack;
  return null;
}

function drawColossusSprite(c) {
  if (!COLOSSUS_SPRITE_ENABLED) return false;
  const img = colossusSpriteFrame(c);
  if (!img) return false;
  const drawH = COLOSSUS_SPRITE_DRAWH; // 228 — Gharok lock
  const drawW = drawH * (img.naturalWidth / img.naturalHeight);
  const t = c.walk || 0;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 12 && !c.downed;
  const swipe = c.swipeT || 0;
  const windPose = swipe > UNIT_SWIPE * 0.5 ? (1 - (swipe - UNIT_SWIPE * 0.5) / (UNIT_SWIPE * 0.5)) : 0;
  const strikePose = swipe > 0 && swipe <= UNIT_SWIPE * 0.5 ? (1 - swipe / (UNIT_SWIPE * 0.5)) : 0;
  const flash = c.hurtT > 0.35;
  // Heavy titan plant — deeper squash / slower bob than Warden tank
  const bob = moving ? Math.abs(Math.sin(t)) * 4.4
    : (swipe > 0) ? 1.6
    : Math.abs(Math.sin(t * 0.32)) * 0.85;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const lean = moving ? Math.sin(t) * 0.05
    : windPose > 0 ? -0.06 - windPose * 0.05
    : strikePose > 0 ? 0.12 * (1 - strikePose * 0.22)
    : flash ? -0.08
    : Math.sin(t * 0.32) * 0.016;
  const squashY = 1 - plant * 0.125 - (strikePose > 0 ? 0.06 : 0) + (flash ? 0.022 : 0);
  const squashX = 1 + plant * 0.105 + (strikePose > 0 ? 0.065 : 0) - (flash ? 0.022 : 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 8, 42 * (1 + plant * 0.08) + strikePose * 6, 14, 0, 0, TAU); ctx.fill();

  ctx.scale(c.facing || 1, 1);
  ctx.translate(0, -bob);
  if (c.downed) ctx.rotate(0.1);
  else ctx.rotate(lean);
  ctx.scale(squashX, squashY);

  if ((windPose > 0 || strikePose > 0) && !c.downed) {
    ctx.save();
    const glow = windPose || strikePose;
    ctx.globalAlpha *= 0.34 + glow * 0.42;
    ctx.shadowColor = '#b04dff';
    ctx.shadowBlur = 16 + glow * 12;
    ctx.fillStyle = `rgba(158,240,255,${0.1 + glow * 0.24})`;
    ctx.beginPath();
    ctx.ellipse(drawW * 0.26, -drawH * 0.48, 14 + glow * 8, 10 + glow * 6, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (flash) ctx.filter = 'brightness(2.5) saturate(0.15)';
  ctx.drawImage(img, -drawW / 2, -drawH + 8, drawW, drawH);
  ctx.filter = 'none';

  ctx.restore();
  return true;
}

function drawColossusChrome(c, barY) {
  const w = 56;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(c.x - w / 2, barY, w, 5);
  ctx.fillStyle = c.downed ? '#6a4a88' : '#b04dff';
  ctx.fillRect(c.x - w / 2, barY, w * clamp(c.hp / c.maxHp, 0, 1), 5);
  ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
  const label = c.downed ? 'TITAN DOWN' : 'AETHER COLOSSUS';
  ctx.strokeText(label, c.x, c.y + 20);
  ctx.fillStyle = c.downed ? '#ff8a93' : '#e0b8ff';
  ctx.fillText(label, c.x, c.y + 20);
  if (c.downed) {
    ctx.font = 'bold 10px Segoe UI';
    ctx.strokeText(`HOLD TALK · ${COLOSSUS_REVIVE_CORES} ⬡`, c.x, c.y + 34);
    ctx.fillStyle = '#4de1ff';
    ctx.fillText(`HOLD TALK · ${COLOSSUS_REVIVE_CORES} ⬡`, c.x, c.y + 34);
  }
  if (reviveChan.kind === 'colossus')
    drawReviveProgress(c.x, c.y, reviveChan.t / REVIVE_HOLD_SEC);
}

function drawColossus(c) {
  if (drawColossusSprite(c)) {
    drawColossusChrome(c, c.y - (COLOSSUS_SPRITE_DRAWH - 18));
    return;
  }
  const t = c.walk || performance.now() / 1000;
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 10 && !c.downed;
  const swipe = c.swipeT || 0;
  const strike = swipe > 0 && swipe <= UNIT_SWIPE * 0.55 ? 1 - swipe / (UNIT_SWIPE * 0.55) : 0;
  const wind = swipe > UNIT_SWIPE * 0.55 ? (swipe - UNIT_SWIPE * 0.55) / (UNIT_SWIPE * 0.45) : 0;
  const plant = moving ? Math.max(0, Math.cos(t * 2)) : 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 5.2 : Math.abs(Math.sin(t * 0.35)) * 1.4;
  const lean = c.downed ? 0.18 : strike * 0.14 - wind * 0.07 + (moving ? Math.sin(t) * 0.04 : 0);
  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.downed) ctx.globalAlpha = 0.55;
  ctx.scale((c.facing || 1) * (1 + plant * 0.1), 1 - plant * 0.12);
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
  ctx.fillRect(-30, -6 + Math.sin(t * 2) * (moving ? 4 : 1), 18, 12);
  ctx.fillRect(12, -6 + Math.sin(t * 2 + 1) * (moving ? 4 : 1), 18, 12);
  ctx.restore();
  drawColossusChrome(c, c.y - 58);
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
  drawLegacyPathGround();
  for (const h of npcHolds) { if (isHoldOnCamera(h, 60)) drawHoldBrickGround(h); }
  drawLakeWater(); // Step 10.1 — Ashmere sits under decals/decor/entities
  drawEmberfallDock(); // Step 10.2 — pier above the water, below decals/decor/entities
  drawIslePier(); // Step 10.4 — Driftwood Isle mini-pier, same layer as the main dock

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

  // ---- sealed legacy core cue (purple rift at legacy edge; tree ring sits just inside when extended) ----
  ctx.strokeStyle = 'rgba(176,77,255,0.55)'; ctx.lineWidth = 6;
  ctx.strokeRect(LEGACY_WORLD.x, LEGACY_WORLD.y, LEGACY_WORLD.w, LEGACY_WORLD.h);
  ctx.strokeStyle = 'rgba(176,77,255,0.18)'; ctx.lineWidth = 22;
  ctx.strokeRect(LEGACY_WORLD.x, LEGACY_WORLD.y, LEGACY_WORLD.w, LEGACY_WORLD.h);

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
    } else if (p.type === 'squad_sp' || p.type === 'squad_core') {
      // BETA-3.1 — squad-only hex orbs (dark gray SP / light gray cores); distinct from cyan player cores
      const col = p.type === 'squad_sp' ? '#5a5a5a' : '#b0b0b0';
      ctx.rotate(performance.now() / 520);
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7) : ctx.moveTo(7, 0); }
      ctx.closePath(); ctx.fill();
    } else if (p.type === 'hold_orb') {
      ctx.rotate(performance.now() / 480);
      ctx.fillStyle = '#ff9d2e'; ctx.shadowColor = '#ff6a1a'; ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 7.5, Math.sin(a) * 7.5) : ctx.moveTo(7.5, 0); }
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
  // 4.1.1 perf — camera cull for world props. The 8896×8896 map holds hundreds of
  // exterior trees/rocks; pre-4.1.1 every one was pushed into the y-sort queue (closure
  // alloc + sort + draw call) every frame even when far offscreen. Cull with generous
  // margins so canopies/shadows never pop at the viewport edge.
  const cullL = camera.x - 280, cullR = camera.x + VW + 280;
  const cullT = camera.y - 320, cullB = camera.y + VH + 280;
  const inView = (x, y) => x > cullL && x < cullR && y > cullT && y < cullB;
  for (const o of obstacles) {
    if (!inView(o.x, o.y)) continue;
    if (o.exterior && !isExteriorSiteVisible(o.x, o.y)) continue;
    draws.push({ y: o.y + o.r, f: () => drawObstacle(o) });
  }
  if (inView(CAMP.x, CAMP.y)) drawCampProps(draws);
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
    if (!inView(b.x, b.y)) continue; // 4.1.1 perf cull
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
      if (!inView(w.x, w.y)) continue; // 4.1.1 perf cull
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
  // exterior NPC holds — low brick walls + sentries (Step 6.4; fog-gated)
  for (const h of npcHolds) {
    if (!isHoldVisible(h)) continue;
    if (!isHoldOnCamera(h, 620)) continue; // 4.1.1 perf — skip draw when hold is far offscreen (updates unaffected)
    for (const seg of h.wallSegments) {
      const a = seg[0], b = seg[1];
      draws.push({ y: Math.max(a.y, b.y), f: () => drawBrickWallSegmentBetween(a, b, false) });
    }
    for (const w of h.walls) {
      draws.push({ y: w.y, f: () => drawBrickWallPillar(w) });
    }
    draws.push({ y: h.y - h.halfH, f: () => {
      ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 2.5;
      ctx.strokeText(h.name, h.x, h.y - h.halfH - 8);
      ctx.fillStyle = 'rgba(200,160,106,0.95)';
      ctx.fillText(h.name, h.x, h.y - h.halfH - 8);
    }});
    for (const n of h.npcs) {
      draws.push({ y: n.y, f: () => {
        drawFigure(n.x, n.y, npcFigure(n));
        const by = n.y - 58 + Math.sin(performance.now() / 300) * 4;
        ctx.fillStyle = '#c8a06a';
        ctx.font = 'bold 20px Segoe UI'; ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
        ctx.strokeText('…', n.x, by); ctx.fillText('…', n.x, by);
        ctx.font = '10px Segoe UI';
        const short = n.name.split(' ').pop();
        ctx.strokeText(short, n.x, n.y + 12);
        ctx.fillStyle = 'rgba(223,233,245,0.9)';
        ctx.fillText(short, n.x, n.y + 12);
      }});
    }
    if (HOLD_AUTONOMY_ENABLED) {
      draws.push({ y: h.y + h.halfH, f: () => drawHoldDefenses(h) });
      draws.push({ y: h.y, f: () => drawHoldStructures(h) });
      for (const L of holdLaborers) {
        if (L.holdId !== h.id) continue;
        draws.push({ y: L.y, f: () => drawHoldLaborer(L) });
      }
      for (const u of holdUnits) {
        if (u.holdId !== h.id) continue;
        draws.push({ y: u.y, f: () => drawHoldUnit(u) });
      }
      if (HOLD_CAPTAIN_ENABLED && h.captain) {
        draws.push({ y: h.captain.y, f: () => drawHoldCaptain(h.captain) });
      }
      for (const e of holdProbes) {
        if (e.holdId !== h.id || e.dead) continue;
        draws.push({ y: e.y, f: () => drawHoldProbe(e) });
      }
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
      } else if (e.type === 'shaman' && e.swim && isLakeWaterAt(e.x, e.y)) {
        // Step 10.5 — head-above-water pursuit: submerged body, ripple rings, small wake
        drawShamanSwimming(e, emerge);
      } else if (e.type === 'shaman' && drawShamanSprite(e, emerge)) {
        // Ashen Shaman sheets — drawH=56, r=20; toward ravager (2.13.2)
      } else if (e.type === 'ravager' && drawRavagerSprite(e, emerge)) {
        // Ashen Ravager sheets — articulation ready; flag OFF until ship (drawH=100 / r=36)
      } else if (isAshenSpiderType(e) && drawBurstweaverSprite(e, emerge)) {
        // 7.4B+8.5 Ashen spider family — Burstweaver / Broodmother / spiderling scaled sheets
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
        const w = e.r * (e.decadeBoss ? 3.2 : 2.4);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w, e.decadeBoss ? 5 : 4);
        ctx.fillStyle = e.decadeBoss ? '#ff6a3a' : '#7fbf4d';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9, w * clamp(e.hp / e.maxHp, 0, 1), e.decadeBoss ? 5 : 4);
      }
      // mini armor plate bar (v2.8 plated enemies) — small grey strip
      if (!e.boss && e.maxArmor) {
        const w = e.r * (e.decadeBoss ? 3.2 : 2.4);
        ctx.fillStyle = 'rgba(8,14,26,0.7)';
        ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9 + (e.decadeBoss ? 6 : 5), w, 3);
        if (e.armor > 0) {
          ctx.fillStyle = '#aab8cc';
          ctx.fillRect(e.x - w / 2, e.y - e.r * 2.9 + (e.decadeBoss ? 6 : 5), w * clamp(e.armor / e.maxArmor, 0, 1), 3);
        }
      }
    }});
  }
  for (const c of companions) draws.push({ y: c.y, f: () => drawCompanion(c) });
  for (const m of militia) draws.push({ y: m.y, f: () => drawMilitia(m) });
  for (const L of laborers) draws.push({ y: L.y, f: () => drawLaborer(L) });
  for (const L of squadLaborers) draws.push({ y: L.y, f: () => drawLaborer(L) });
  for (const s of structures) { if (inView(s.x, s.y)) draws.push({ y: s.y, f: () => drawStructure(s) }); }
  if (colossusOnField()) draws.push({ y: colossus.y, f: () => drawColossus(colossus) });
  for (const fs of forestStands) {
    if (!inView(fs.x, fs.y)) continue; // 4.1.1 perf cull
    if (fs.exterior && !isExteriorSiteVisible(fs.x, fs.y)) continue;
    draws.push({ y: fs.y + 40, f: () => drawForestStand(fs) });
  }
  for (const v of (goldMines.length ? goldMines : goldVeins)) {
    if (v.goldLeft <= 0) continue;
    if (!inView(v.x, v.y)) continue; // 4.1.1 perf cull
    if (v.exterior && !isExteriorSiteVisible(v.x, v.y)) continue;
    draws.push({ y: v.y, f: () => drawGoldVein(v) });
  }
  for (const v of coalMines) {
    if (!(v.coalLeft > 0)) continue;
    if (!inView(v.x, v.y)) continue;
    if (!isExteriorSiteVisible(v.x, v.y)) continue;
    draws.push({ y: v.y, f: () => drawCoalMine(v) });
  }
  if (DIRT_BIKE_ENABLED && bikeWreck && !bike.owned && isExteriorSiteVisible(bikeWreck.x, bikeWreck.y)) {
    draws.push({ y: bikeWreck.y, f: () => {
      drawBikeSpiralSmoke(bikeWreck.x, bikeWreck.y - 28, bikeWreck.smokeT || 0, 1);
      drawBikeSpriteAt(bikeWreck.x, bikeWreck.y, 'wreck', 1, 0);
      if (canInteractBikeWreck()) {
        ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffb878';
        ctx.fillText('RIFT BIKE WRECK', bikeWreck.x, bikeWreck.y - 62);
      }
    }});
  }
  if (DIRT_BIKE_ENABLED && bike.owned && !bike.mounted && inView(bike.parkX, bike.parkY)) {
    draws.push({ y: bike.parkY, f: () => drawBikeSpriteAt(bike.parkX, bike.parkY, 'idle', 1, 0) });
  }
  // Step 10.3 — Ashen Rift Skiff: wreck (pre-repair) or parked hull; camera-culled like the bike
  if (boatActive() && boatWreck && !boat.owned && inView(boatWreck.x, boatWreck.y)) {
    draws.push({ y: boatWreck.y, f: () => {
      drawSkiffAt(boatWreck.x, boatWreck.y, 'wreck', boatWreck.dripT || 0);
      if (canInteractBoatWreck()) {
        ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillStyle = '#7fd8e8';
        ctx.fillText('RIFT SKIFF WRECK', boatWreck.x, boatWreck.y - 36);
      }
    }});
  }
  if (boatActive() && boat.owned && !boat.mounted && inView(boat.x, boat.y)) {
    draws.push({ y: boat.y, f: () => {
      if (boat.moorDockId) drawSkiffMoorRope(); // slack line to the pier cleat while berthed
      drawSkiffAt(boat.x, boat.y, 'moor', runTime);
    }});
  }
  // Step 10.4 — Greywater ferry cache on Driftwood Isle (persistent lore scenery once opened)
  if (isleContentActive() && isleCache && inView(isleCache.x, isleCache.y)) {
    draws.push({ y: isleCache.y, f: () => drawIsleCache(isleCache, runTime) });
  }
  draws.push({ y: player.y, f: () => {
    if (bike.mounted) {
      drawBikeSpriteAt(player.x, player.y, 'ride', player.facing, bike.walk);
      return;
    }
    if (boat.mounted) {
      drawSkiffAt(player.x, player.y, 'ride', boat.wakeT);
      const bfig = playerFigure();
      bfig.moving = false; bfig.walk = 0; // standing braced on the hull — no leg cycle
      drawFigure(player.x, player.y - 7, bfig);
      return;
    }
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
    } else {
      // 7.4D — world-space debuff tags (mirrors HUD chips)
      let tagY = player.y - 42;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      if ((player.poisonT || 0) > 0) {
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillStyle = '#c080e8';
        ctx.strokeText('ASH VENOM', player.x, tagY);
        ctx.fillText('ASH VENOM', player.x, tagY);
        tagY -= 14;
      }
      if ((player.webSlowT || 0) > 0) {
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillStyle = '#d0c8b0';
        ctx.strokeText('WEBBED', player.x, tagY);
        ctx.fillText('WEBBED', player.x, tagY);
      }
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

  // ---- barricade / cloister / structure place ghost + link preview (v2.9.3 + brick + BETA-3.1 step 5) ----
  if (state === 'playing' && !player.downed && !paused && !dialogOpen && !vendorOpen &&
      !settingsOpen && !infirmaryOpen && !riftNetOpen && !treeOpen &&
      (buildPlaceMode || buildGhostKind === 'barricade' || buildGhostKind === 'brickwall')) {
    if (buildGhostKind === 'structure' && buildPlaceStructKind && STRUCT_KINDS[buildPlaceStructKind]) {
      const def = STRUCT_KINDS[buildPlaceStructKind];
      const { x: gx, y: gy } = barricadeAimPos();
      const blocked = structureSpotBlocked(gx, gy, def.r);
      const cost = { cores: def.cores, wood: def.wood, gold: def.gold };
      const canAfford = canAffordCosts(cost) && countStruct(buildPlaceStructKind) < def.max;
      const col = blocked || !canAfford ? '255,100,110' : '200,160,106';
      const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.55 + pulse * 0.2;
      ctx.strokeStyle = `rgba(${col},0.8)`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(gx, gy, def.r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${col},0.12)`;
      ctx.beginPath(); ctx.arc(gx, gy, def.r, 0, TAU); ctx.fill();
      ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 3;
      let label = !canAfford ? 'NEED ' + costLabel(cost) : blocked ? 'NO ROOM' : def.name.toUpperCase();
      ctx.strokeText(label, gx, gy + def.r + 14);
      ctx.fillStyle = `rgba(${col},0.95)`;
      ctx.fillText(label, gx, gy + def.r + 14);
      if (buildPlaceMode) {
        ctx.font = 'bold 10px Segoe UI';
        ctx.strokeText('TAP TO PLACE', gx, gy - def.r - 10);
        ctx.fillStyle = '#9ef0ff';
        ctx.fillText('TAP TO PLACE', gx, gy - def.r - 10);
      }
      ctx.restore();
    } else if (buildGhostKind === 'brickwall' && BRICKWALL_ENABLED) {
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
      if (buildPlaceMode) {
        ctx.strokeText('TAP TO PLACE', gx, gy - BRICKWALL_PILLAR_R - 12);
        ctx.fillStyle = '#9ef0ff';
        ctx.fillText('TAP TO PLACE', gx, gy - BRICKWALL_PILLAR_R - 12);
      }
      ctx.restore();
    } else if (buildGhostKind === 'barricade') {
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
      if (buildPlaceMode) {
        ctx.strokeText('TAP TO PLACE', gx, gy - ghostR - 12);
        ctx.fillStyle = '#9ef0ff';
        ctx.fillText('TAP TO PLACE', gx, gy - ghostR - 12);
      }
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
    } else if (b.orange) { // 4.1.2 — hold-unit / watchpost fire reads orange
      ctx.shadowColor = '#ff9d2e'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffb45a';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
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
  // 4.1.1 perf — this loop had NO culling (and no exterior-visibility gate): every tree on
  // the full map ran sway math + drawImage per frame. Now camera-culled like the trunks.
  for (const o of obstacles) {
    if (o.type !== 'tree') continue;
    if (!inView(o.x, o.y)) continue;
    if (o.exterior && !isExteriorSiteVisible(o.x, o.y)) continue;
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

  drawFogOverlay();

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
// Variants (TREE_SPRITE_VARIANTS_ENABLED): one / few / bunch — drawH scaled by kind.
function drawPineCanopy(o) {
  const size = o.size == null ? 1 : o.size;
  const sway = Math.sin(performance.now() / 900 + o.seed) * (2.2 + size);
  const img = pineSpriteFor(o);
  if (img) {
    const scale = size === 0 ? 0.78 : size === 2 ? 1.18 : 1;
    const kind = o.treeKind || 'one';
    // DrawH locks: classic one keeps 96+18*size; few/bunch slightly taller, not unit-scale.
    let drawH = (96 + size * 18) * scale;
    if (kind === 'few') drawH = (112 + size * 12) * scale;
    else if (kind === 'bunch') drawH = (138 + size * 10) * scale;
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
    case 'cattail': { // Step 10.2 — Ashmere shoreline
      const sway = Math.sin(performance.now() / 900 + d.seed) * 1.8;
      ctx.strokeStyle = 'rgba(96,124,74,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, 0); ctx.lineTo(-2 + sway, -13);
      ctx.moveTo(2, 0); ctx.lineTo(2 + sway * 0.7, -10);
      ctx.stroke();
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(-2 + sway - 1.5, -19, 3, 7); break; } // brown seed head
    case 'driftwood': // Step 10.2 — Ashmere shoreline
      ctx.strokeStyle = 'rgba(150,132,104,0.75)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(0, -3 + d.seed % 2, 10, 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(110,95,72,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(2, -1); ctx.stroke(); break;
    case 'docklantern': { // Step 10.2 — ember lantern at the pier base
      const fl = 0.75 + 0.25 * Math.sin(performance.now() / 260 + d.seed);
      ctx.fillStyle = '#3a2c1c';
      ctx.fillRect(-1.5, -18, 3, 18);
      ctx.fillRect(-4.5, -22, 9, 4);
      ctx.fillStyle = `rgba(255,157,46,${(0.55 * fl).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, -14, 6.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(-2, -17, 4, 5); break; }
    case 'dockcrate': // Step 10.2 — rope crate by the pier base
      ctx.fillStyle = '#243447'; ctx.strokeStyle = '#3d5a86'; ctx.lineWidth = 1.5;
      ctx.fillRect(-6, -10, 12, 10); ctx.strokeRect(-6, -10, 12, 10);
      ctx.strokeStyle = 'rgba(196,178,140,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(3, -12, 3.5, 0, TAU); ctx.stroke(); break;
    case 'biketrail': {
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(-2, -18, 4, 18);
      ctx.fillStyle = '#8a7050';
      ctx.fillRect(-14, -22, 28, 10);
      ctx.strokeStyle = 'rgba(212,184,255,0.7)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-14, -22, 28, 10);
      ctx.fillStyle = '#d4b8ff';
      ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('BIKE', 0, -15);
      break; }
    case 'pathsign': {
      const dir = d.dir || 'n';
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(-2, -20, 4, 20);
      ctx.fillStyle = '#8a7050';
      ctx.beginPath();
      if (dir === 'n') { ctx.moveTo(0, -24); ctx.lineTo(10, -16); ctx.lineTo(-10, -16); }
      else if (dir === 's') { ctx.moveTo(0, 4); ctx.lineTo(10, -4); ctx.lineTo(-10, -4); }
      else if (dir === 'w') { ctx.moveTo(-14, -10); ctx.lineTo(-6, -18); ctx.lineTo(-6, -2); }
      else { ctx.moveTo(14, -10); ctx.lineTo(6, -18); ctx.lineTo(6, -2); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,170,110,0.55)'; ctx.lineWidth = 1;
      ctx.strokeRect(-2, -20, 4, 20);
      break; }
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
    const kind = o.treeKind || 'one';
    const shadowW = kind === 'bunch' ? 22 : kind === 'few' ? 18 : 14;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(0, 3, shadowW * scale, (shadowW * 0.4) * scale, 0, 0, TAU); ctx.fill();
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
// ---------- 4.1.2 PERF_WATCHDOG (BETA) ----------
// Times each major frame section (player/fog, weapons, enemies, allies+holds,
// projectiles, fx, hud, draw, save). Any frame ≥2s → console.error naming the
// slowest section + on-screen banner, and the report persists to localStorage so
// the NEXT launch surfaces "last freeze was in X" even if the tab died.
const PERF_WATCHDOG_ENABLED = (window.TR_CHANNEL || 'github') !== 'play'; // BETA on, Play off
const PERF_WATCHDOG_KEY = 'tr412_watchdog_report';
const PERF_WATCHDOG_FRAME_MS = 2000;
let wdMarks = [], wdT0 = 0, wdArmed = false;
function wdFrameBegin() {
  if (!PERF_WATCHDOG_ENABLED) return;
  wdMarks.length = 0;
  wdT0 = performance.now();
  wdArmed = true;
}
function wdMark(name) {
  if (!PERF_WATCHDOG_ENABLED || !wdArmed) return;
  wdMarks.push(name, performance.now());
}
function wdFrameEnd() {
  if (!PERF_WATCHDOG_ENABLED || !wdArmed) return;
  wdArmed = false;
  const end = performance.now();
  const total = end - wdT0;
  if (total < PERF_WATCHDOG_FRAME_MS) return;
  // section spans: mark i covers marks[i].t → marks[i+1].t (last one runs to frame end)
  let worst = 'pre-update', worstMs = wdMarks.length ? wdMarks[1] - wdT0 : total;
  const sections = [];
  for (let i = 0; i < wdMarks.length; i += 2) {
    const ms = (i + 2 < wdMarks.length ? wdMarks[i + 3] : end) - wdMarks[i + 1];
    sections.push([wdMarks[i], Math.round(ms)]);
    if (ms > worstMs) { worstMs = ms; worst = wdMarks[i]; }
  }
  const report = {
    at: new Date().toISOString(), ver: APP_VERSION, wave, totalMs: Math.round(total),
    worst, worstMs: Math.round(worstMs), sections,
    counts: { enemies: enemies.length, obstacles: obstacles.length, particles: particles.length,
      pickups: pickups.length, holdUnits: holdUnits.length, militia: militia.length },
  };
  wdLastReport = report; // 4.1.3 — surfaced in the Debug menu
  try { console.error('[TR WATCHDOG] ' + Math.round(total) + 'ms frame — slowest: ' + worst + ' (' + Math.round(worstMs) + 'ms)', report); } catch (e) {}
  try { localStorage.setItem(PERF_WATCHDOG_KEY, JSON.stringify(report)); } catch (e) {}
  try {
    banner('⚠ ' + (total / 1000).toFixed(1) + 's STALL', 'slowest system: ' + worst.toUpperCase() + ' — report saved');
    if (state === 'playing') addFloater(player.x, player.y - 60, '⚠ STALL IN ' + worst.toUpperCase(), '#ff8a93', true);
  } catch (e) {}
}
// next-launch surfacing — tells the tester where the LAST session froze
let wdBootReport = null, wdLastReport = null;
try {
  const raw = localStorage.getItem(PERF_WATCHDOG_KEY);
  if (raw) {
    wdBootReport = JSON.parse(raw);
    wdLastReport = wdBootReport; // keep visible in the Debug menu this session
    localStorage.removeItem(PERF_WATCHDOG_KEY); // surface once
    console.error('[TR WATCHDOG] previous session stalled ' + wdBootReport.totalMs + 'ms in "' +
      wdBootReport.worst + '" (wave ' + wdBootReport.wave + ', v' + wdBootReport.ver + ')', wdBootReport);
  }
} catch (e) {}
function wdSurfaceBootReport() {
  if (!wdBootReport) return;
  const r = wdBootReport;
  wdBootReport = null;
  try {
    banner('⚠ LAST SESSION FROZE', (r.totalMs / 1000).toFixed(1) + 's in ' + String(r.worst).toUpperCase() + ' (wave ' + r.wave + ')');
  } catch (e) {}
}

// ---------- 4.1.3 SOFT-LOCK TRIPWIRES ----------
// User clue: "I can open menus, just all the guys disappear and can't move" — that is
// NOT a frame stall (watchdog can't fire on it). Two real mechanisms produce exactly
// that: (1) NaN positions — canvas draws at NaN are silent no-ops, so entities vanish
// while DOM menus stay alive, and clamp(NaN)=NaN keeps the player stuck forever;
// (2) an uncaught throw in update()/render() — the old loop() put rAF at the END, so
// one exception KILLED the rAF chain: canvas keeps the last partial frame (terrain
// drawn, entities not yet) while DOM menus still respond. Both are trapped below.

// -- error ring buffer (last 20, persisted) --
const ERR_RING_KEY = 'tr413_error_ring';
let errRing = [];
try { errRing = JSON.parse(localStorage.getItem(ERR_RING_KEY) || '[]') || []; } catch (e) { errRing = []; }
let errBannerCd = 0;
function trapError(kind, msg, stack) {
  try {
    errRing.push({
      at: new Date().toISOString(), kind, wave, ver: APP_VERSION,
      msg: String(msg == null ? 'unknown' : msg).slice(0, 220),
      stack: String(stack || '').slice(0, 420),
      counts: { e: enemies.length, hu: holdUnits.length, m: militia.length, p: particles.length },
    });
    if (errRing.length > 20) errRing.splice(0, errRing.length - 20);
    localStorage.setItem(ERR_RING_KEY, JSON.stringify(errRing));
  } catch (e2) {}
  if (errBannerCd <= 0) {
    errBannerCd = 10;
    try { banner('⚠ ERROR TRAPPED — GAME CONTINUES', kind + ': see Debug menu'); } catch (e3) {}
  }
}
try {
  window.addEventListener('error', ev => trapError('window', ev.message, ev.error && ev.error.stack));
  window.addEventListener('unhandledrejection', ev =>
    trapError('promise', (ev.reason && ev.reason.message) || ev.reason, ev.reason && ev.reason.stack));
} catch (e) {}

// -- NaN sentinel + auto-recovery (the "guys disappear" fix) --
const NAN_EVENT_KEY = 'tr413_nan_event';
let nanEvent = null, nanTotal = 0, nanBannerCd = 0, nanLogBudget = 0;
try { nanEvent = JSON.parse(localStorage.getItem(NAN_EVENT_KEY) || 'null'); } catch (e) {}
const lastGoodP = { x: 0, y: 0, ok: false };
function badNum(a, b, c, d) {
  return !Number.isFinite(a) || (b !== undefined && !Number.isFinite(b)) ||
         (c !== undefined && !Number.isFinite(c)) || (d !== undefined && !Number.isFinite(d));
}
function recordNaN(sys, info) {
  nanTotal++;
  if (nanLogBudget-- <= 0) return; // mass-NaN sweep: log the first few, count the rest
  nanEvent = { at: new Date().toISOString(), wave, t: Math.round(runTime), sys, info: String(info).slice(0, 140), total: nanTotal };
  try { localStorage.setItem(NAN_EVENT_KEY, JSON.stringify(nanEvent)); } catch (e) {}
  try { console.error('[TR NaN] ' + sys + ' — ' + info + ' (wave ' + wave + ')'); } catch (e) {}
  if (nanBannerCd <= 0) {
    nanBannerCd = 8;
    try { banner('⚠ NaN CAUGHT — AUTO-RECOVERED', 'in ' + sys.toUpperCase() + ' · details in Debug menu'); } catch (e) {}
  }
}
/** Runs EVERY frame (even if update threw). Player/camera restore to last good pos,
 * broken enemies/projectiles cull, broken allies teleport home — game keeps playing. */
function nanSweep(dt) {
  nanBannerCd = Math.max(0, nanBannerCd - dt);
  errBannerCd = Math.max(0, errBannerCd - dt);
  nanLogBudget = 3;
  if (badNum(player.x, player.y, player.vx, player.vy)) {
    recordNaN('player', 'x=' + player.x + ' y=' + player.y + ' vx=' + player.vx + ' vy=' + player.vy);
    player.x = lastGoodP.ok ? lastGoodP.x : CAMP.x;
    player.y = lastGoodP.ok ? lastGoodP.y : CAMP.y;
    player.vx = player.vy = 0; player.dashT = 0;
  } else { lastGoodP.x = player.x; lastGoodP.y = player.y; lastGoodP.ok = true; }
  if (!Number.isFinite(player.aim)) { recordNaN('player.aim', player.aim); player.aim = 0; }
  if (!Number.isFinite(camera.shake)) camera.shake = 0;
  if (badNum(camera.x, camera.y)) {
    recordNaN('camera', 'x=' + camera.x + ' y=' + camera.y);
    camera.x = clamp(player.x - VW / 2, 0, Math.max(0, WORLD.w - VW));
    camera.y = clamp(player.y - VH / 2, 0, Math.max(0, WORLD.h - VH));
  }
  for (const e of enemies) {
    if (!e.dead && badNum(e.x, e.y, e.vx, e.vy)) { recordNaN('enemies', e.type); e.dead = true; e.hp = 0; }
  }
  for (const c of companions) {
    if (badNum(c.x, c.y, c.vx, c.vy)) { recordNaN('companions', c.type); c.x = player.x + rand(-40, 40); c.y = player.y + 44; c.vx = c.vy = 0; }
  }
  for (const m of militia) {
    if (badNum(m.x, m.y, m.vx, m.vy)) { recordNaN('militia', m.kind); m.x = player.x + rand(-50, 50); m.y = player.y + 50; m.vx = m.vy = 0; }
  }
  for (const u of holdUnits) {
    if (badNum(u.x, u.y, u.vx, u.vy)) {
      recordNaN('holdUnits', u.type + '@' + u.holdId);
      const h = holdById(u.holdId);
      u.x = h ? h.x + rand(-20, 20) : CAMP.x; u.y = h ? h.y + rand(-12, 12) : CAMP.y; u.vx = u.vy = 0;
    }
  }
  for (const L of holdLaborers) {
    if (badNum(L.x, L.y, L.vx, L.vy)) {
      recordNaN('holdLaborers', L.holdId);
      const h = holdById(L.holdId);
      L.x = h ? h.x + rand(-16, 16) : CAMP.x; L.y = h ? h.y + rand(-8, 8) : CAMP.y; L.vx = L.vy = 0;
    }
  }
  for (const L of laborers) {
    if (badNum(L.x, L.y, L.vx, L.vy)) { recordNaN('laborers', L.id); L.x = CAMP.x + rand(-40, 40); L.y = CAMP.y + rand(-30, 30); L.vx = L.vy = 0; }
  }
  for (const L of squadLaborers) {
    if (badNum(L.x, L.y, L.vx, L.vy)) { recordNaN('squadLaborers', L.id); L.x = player.x + rand(-46, 46); L.y = player.y + 46; L.vx = L.vy = 0; }
  }
  for (const h of npcHolds) {
    const c = h.captain;
    if (c && badNum(c.x, c.y)) { recordNaN('captain', h.id); c.x = h.x; c.y = h.y; }
  }
  if (colossus && badNum(colossus.x, colossus.y, colossus.vx, colossus.vy)) {
    recordNaN('colossus', 'pos'); colossus.x = player.x; colossus.y = player.y - 40; colossus.vx = colossus.vy = 0;
  }
  for (const e of holdProbes) { if (!e.dead && badNum(e.x, e.y)) { recordNaN('holdProbes', e.holdId); e.dead = true; } }
  for (const b of bolts)   { if (badNum(b.x, b.y)) b.life = 0; }
  for (const b of cbolts)  { if (badNum(b.x, b.y)) b.life = 0; }
  for (const b of ebolts)  { if (badNum(b.x, b.y)) b.life = 0; }
  for (const g of grenades){ if (badNum(g.x, g.y)) g.t = 0; }
  for (const p of pickups) { if (badNum(p.x, p.y)) p.got = true; }
}

let last = performance.now();
let fpsMs = 16.7; // EMA frame time for the Debug menu
function loop(now) {
  let dt = Math.min(0.033, (now - last) / 1000);
  if (!Number.isFinite(dt) || dt < 0) dt = 0.016; // rAF timestamp paranoia
  fpsMs = fpsMs * 0.92 + Math.min(500, Math.max(0, now - last)) * 0.08;
  last = now;
  wdFrameBegin();
  // 4.1.3 — exceptions no longer kill the rAF chain (that was soft-lock mechanism #2):
  // a throw in update/render is trapped to the error ring and the NEXT frame proceeds.
  if (state === 'playing' && !paused && !dialogOpen && !treeOpen && !vendorOpen && !settingsOpen &&
      !infirmaryOpen && !riftNetOpen && !buildPickOpen && !structPanelOpen) {
    try { update(dt); }
    catch (err) { trapError('update', err && err.message, err && err.stack); try { console.error('[TR] update() threw', err); } catch (e) {} }
    try { nanSweep(dt); }
    catch (err) { trapError('nanSweep', err && err.message, err && err.stack); }
  }
  if (state === 'shop' && !treeOpen && !settingsOpen) {
    shopTimer -= dt;
    $('shopTimer').textContent = Math.max(0, Math.ceil(shopTimer));
    if (shopTimer <= 0) startWave();
  }
  if (state !== 'menu') {
    wdMark('draw');
    try { render(); }
    catch (err) { trapError('render', err && err.message, err && err.stack); try { console.error('[TR] render() threw', err); } catch (e) {} }
  }
  else renderMenuBg(now);
  wdFrameEnd();
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
  coal = 0; // 8.1 — stockpile via exterior coal mines
  fuel = 0; // 8.2 — refuel at Keep / Timber / etc.
  bike = { owned: false, mounted: false, parkX: 0, parkY: 0, parkHoldId: null, walk: 0 };
  boatWreck = null; // 10.3 — reseeded in buildWorld
  boat = { owned: false, mounted: false, x: 0, y: 0, moorDockId: null, ang: 0, wakeT: 0, ashT: 0, ashWarned: false };
  isleCacheOpened = false; isleChopT = 0; // 10.4 — cache/trees reseed in buildWorld
  squadSp = 0; squadCores = 0; // BETA-3.1 squad wallets
  squadWood = 0; squadGold = 0; // BETA-3.1 step 3 squad gather banks
  goldVeins = []; goldMines = []; forestStands = [];
  structures = []; laborers = []; squadLaborers = []; militia = []; colossus = null;
  colossusOwned = false; colossusDockHp = 0;
  waveTrainLeft = 3; militiaIdSeq = 1; laborerIdSeq = 1; rtsTipShown = false;
  hideWaveCoach(true);
  buildPickOpen = false; structPanelOpen = false; selectedStructure = null;
  selectedBarricade = null;
  unitPanelOpen = false; selectedUnit = null;
  buildPlaceMode = false; buildPlacePaused = false; buildPlaceStructKind = null;
  if ($('buildPick')) $('buildPick').classList.add('hidden');
  if ($('structPanel')) $('structPanel').classList.add('hidden');
  if ($('unitPanel')) $('unitPanel').classList.add('hidden');
  enemies = []; bolts = []; ebolts = []; grenades = []; pickups = []; particles = []; floaters = []; zaps = [];
  burstweaverSpawnCd = 22;
  broodmotherSpawnCd = 90;
  spiderDens = [];
  decadeBossQueue = [];
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
  applyFogDiscoveryMode(settings.fogDiscoveryMode);
  buildWorld();
  initFogGrid();
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
tileTex.path = makeTileTex('path');
tileTex.water = makeTileTex('water'); // Step 10.1 — Ashmere pattern source

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
if ($('togWaveCoachSkip')) $('togWaveCoachSkip').onclick = () => {
  settings.waveCoachSkip = !settings.waveCoachSkip;
  persistSettings(); refreshToggles();
  if (settings.waveCoachSkip) hideWaveCoach(true);
};
if ($('rowFogMode')) $('rowFogMode').onclick = () => {
  const i = FOG_DISCOVERY_MODES.indexOf(settings.fogDiscoveryMode);
  settings.fogDiscoveryMode = FOG_DISCOVERY_MODES[(i + 1) % FOG_DISCOVERY_MODES.length];
  applyFogDiscoveryMode(settings.fogDiscoveryMode);
  persistSettings(); refreshToggles();
};
if ($('waveCoachSkip')) $('waveCoachSkip').onclick = e => {
  e.preventDefault(); e.stopPropagation();
  skipWaveCoach();
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

// ---------- 4.1.3 DEBUG MENU (BETA only — the user's screenshot tool) ----------
// Opens from the pause menu; sits ABOVE the settings overlay (z60 vs z50) so pause
// state is untouched — closing it drops you back on the pause menu.
const DEBUG_MENU_ENABLED = UPDATE_CHANNEL !== 'play';
let debugOpen = false, debugTick = null;
function dbgEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function dbgNum(v, dec) {
  return Number.isFinite(v) ? v.toFixed(dec == null ? 1 : dec) : '<span class="bad">NaN!</span>';
}
function collectDebugReport() {
  const liveE = enemies.filter(e => !e.dead).length;
  return {
    ver: APP_VERSION, vc: APP_VCODE, channel: UPDATE_CHANNEL, at: new Date().toISOString(),
    wave, state, runTime: Math.round(runTime),
    fps: Math.round(1000 / Math.max(1, fpsMs)), frameMs: +fpsMs.toFixed(1),
    counts: {
      enemies: liveE, companions: companions.length, militia: militia.length,
      holdUnits: holdUnits.length, holdLaborers: holdLaborers.length,
      laborers: laborers.length + squadLaborers.length,
      bolts: bolts.length, ebolts: ebolts.length, cbolts: cbolts.length,
      pickups: pickups.length, floaters: floaters.length, particles: particles.length,
    },
    player: { x: +player.x, y: +player.y, vx: +player.vx, vy: +player.vy, hp: Math.round(player.hp), aim: +player.aim },
    camera: { x: +camera.x, y: +camera.y, shake: +camera.shake },
    zone: inLegacyWorld(player.x, player.y) ? 'legacy' : 'exterior',
    coal, fuel, fuelMax: FUEL_MAX,
    nan: { total: nanTotal, last: nanEvent },
    watchdog: wdLastReport,
    errors: errRing.slice(-20),
    holds: npcHolds.map(h => ({
      id: h.id, stage: h.gauntletDone ? 'village' : 'camp',
      structs: (h.structures || []).length, building: h.activeBuild ? h.activeBuild.kind : null,
      sp: Math.round(h.orangeSp || 0), threats: (h._threats || []).length,
    })),
    ua: (navigator.userAgent || '').slice(0, 120),
  };
}
function renderDebugPanel() {
  const r = collectDebugReport();
  const c = r.counts;
  const L = [];
  L.push('<span class="hd">TEMPORAL RIFT ' + r.ver + ' (vc' + r.vc + ') · ' + r.channel.toUpperCase() + ' · ' + r.zone.toUpperCase() + '</span>');
  L.push('wave <span class="hd">' + r.wave + '</span> · state ' + r.state + ' · run ' + r.runTime + 's · fps <span class="hd">' + r.fps + '</span> (' + r.frameMs + 'ms)');
  L.push('enemies ' + c.enemies + ' · comps ' + c.companions + ' · militia ' + c.militia + ' · holdU ' + c.holdUnits + ' · labor ' + (c.holdLaborers + c.laborers));
  L.push('bolts ' + c.bolts + '/' + c.ebolts + '/' + c.cbolts + ' (plr/enemy/ally) · pickups ' + c.pickups + ' · float ' + c.floaters + ' · parts ' + c.particles);
  L.push('player x ' + dbgNum(player.x) + ' y ' + dbgNum(player.y) + ' · v(' + dbgNum(player.vx, 0) + ',' + dbgNum(player.vy, 0) + ') · hp ' + r.player.hp);
  L.push('camera x ' + dbgNum(camera.x) + ' y ' + dbgNum(camera.y) + ' · shake ' + dbgNum(camera.shake));
  L.push(r.nan.total === 0
    ? '<span class="dim">NaN sentinel: OK — 0 events this session</span>'
    : '<span class="bad">NaN sentinel: ' + r.nan.total + ' caught!</span> last: ' +
      (r.nan.last ? dbgEsc(r.nan.last.sys + ' (' + r.nan.last.info + ') @wave ' + r.nan.last.wave + ' t=' + r.nan.last.t + 's') : '—'));
  L.push(r.watchdog
    ? '<span class="bad">watchdog: ' + r.watchdog.totalMs + 'ms stall in "' + dbgEsc(r.watchdog.worst) + '" @wave ' + r.watchdog.wave + '</span>'
    : '<span class="dim">watchdog: no stall recorded</span>');
  if (r.errors.length) {
    L.push('<span class="bad">errors (' + r.errors.length + '/20 in ring):</span>');
    for (const er of r.errors.slice(-5))
      L.push('  ' + dbgEsc(er.kind) + '|w' + er.wave + '| ' + dbgEsc(er.msg).slice(0, 76));
  } else L.push('<span class="dim">errors: none trapped</span>');
  L.push('<span class="hd">holds:</span>');
  for (const h of r.holds)
    L.push('  ' + h.id.padEnd(14) + (h.stage === 'village' ? 'VLG' : 'camp') + ' s' + h.structs +
      (h.building ? '+' + h.building : '') + ' sp' + h.sp + (h.threats ? ' <span class="bad">thr' + h.threats + '</span>' : ' thr0'));
  $('debugBody').innerHTML = L.join('\n');
}
function openDebugMenu() {
  debugOpen = true;
  $('debug').classList.remove('hidden');
  renderDebugPanel();
  if (!debugTick) debugTick = setInterval(() => { if (debugOpen) renderDebugPanel(); }, 500);
}
function closeDebugMenu() {
  debugOpen = false;
  $('debug').classList.add('hidden');
  if (debugTick) { clearInterval(debugTick); debugTick = null; }
}
if (DEBUG_MENU_ENABLED) {
  if ($('debugBtn')) $('debugBtn').style.display = '';
  $('debugBtn').onclick = () => openDebugMenu();
  $('debugCloseBtn').onclick = () => closeDebugMenu();
  $('debugClearBtn').onclick = () => {
    errRing = []; nanEvent = null; nanTotal = 0; wdLastReport = null;
    try {
      localStorage.removeItem(ERR_RING_KEY);
      localStorage.removeItem(NAN_EVENT_KEY);
      localStorage.removeItem(PERF_WATCHDOG_KEY);
    } catch (e) {}
    renderDebugPanel();
    $('debugClearBtn').textContent = '✕ CLEARED ✓';
    setTimeout(() => { $('debugClearBtn').textContent = '✕ CLEAR LOGS'; }, 1200);
  };
  $('debugCopyBtn').onclick = () => {
    const json = JSON.stringify(collectDebugReport(), null, 1);
    const done = () => {
      $('debugCopyBtn').textContent = '⧉ COPIED ✓';
      setTimeout(() => { $('debugCopyBtn').textContent = '⧉ COPY REPORT'; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(done).catch(() => {});
    } else {
      try { // WebView fallback
        const ta = document.createElement('textarea');
        ta.value = json; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        done();
      } catch (e) {}
    }
  };
}
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
  hideWaveCoach(true);
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

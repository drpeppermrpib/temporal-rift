# Continuous / open map — Step 6 design plan (v4.0.0 arc)

**Status:** Step **6.8** shipped — **4.0.0** / vc**66** (BETA + Play AAB staged). Step 6 arc complete.

**Follow-on:** exterior harvest / captain / Burstweaver → [`exterior-expansion-plan.md`](./exterior-expansion-plan.md) (Step **7.2 Done** at 4.0.3; **7.3–7.6** pending).

---

## Vision summary

Extend Temporal Rift beyond today’s **4800×4800** playfield without changing anything **inside** that rectangle. The current map is the **known core** (Emberfall camp, biomes, town, waves, RTS). New land is built **around** it like a globe wrapping a familiar homeland: tree-ring borders, dirt paths, distant **NPC holds** (brick-on-ground strongholds like Cloister / town footprint), optional **laborer-built villages**, and **Warcraft-style fog of war** on undiscovered exterior.

Traversal: one continuous scrollable world (recommended) or toroidal wrap (noted as easier technically but weaker for “paths to other holds”). Discovery: moving past the legacy border reveals fogged terrain until visited; minimap mirrors fog in exterior zones. NPC holds may **recruit into squad** or **refuse with a light insult** if the player is too early. Ship **Version B** (core always visible) as default; **Version A** (full black until explored) as alternate build or toggle after the arc.

---

## What is frozen (do not alter inside legacy bounds)

| Area | Current code anchor | Constraint |
|---|---|---|
| **Legacy world rect** | `WORLD = { w: 4800, h: 4800 }` (`game.js` ~L43) | All existing placement, biomes, obstacles, mines, camp, regions, camera clamp, player clamp, purple rift border, minimap scale — **behavior inside this rect stays identical** after Step 6. |
| **Biomes / regions** | `FORT`, `ASH`, `MARSH`, `CAMP`, `REGIONS`, `zoneAt()` (~L45–65) | Zone tests and ground tiles inside legacy rect unchanged. |
| **Town / RTS Continuity** | `snapshotTown()` / `applyTownSave()`, `seedStarterTown()`, structures, laborers, militia, barricades, `brickWalls` | Save/load additive only; starter Keep + 2 laborers unchanged. |
| **Cloister / brick** | `BRICKWALL_*`, `town.brickWalls` (~L2142+) | Existing stronghold build rules and caps preserved in core. |
| **Squad / laborer split** | `laborers` vs `squadLaborers`, workers≠squad | No merge; NPC village laborers extend existing worker AI, not combat slots. |
| **Wave survival loop** | `startWave`, horde spawn, decade bosses, Gharok cadence | Core wave logic unchanged; exterior may add optional content later, not replace waves. |
| **Minimap HUD** | `drawMinimap()`, `MAP_SIZE_PX`, settings `mapSize` (~L465+, ~L6882+) | Core minimap content for legacy rect unchanged; fog is additive overlay for exterior only (Version B). |
| **Continuity shipped features** | Coach, enhanced SFX, trees, Colossus, place-pause, etc. | Per `docs/CHANGE_MEMORY.md` KEPT register. |
| **REMOVED** | Center “ENTERING” popup, Play GitHub banner, Saiyan names | Must not return. Bottom `regionFlashT` label stays. |

**Implementation pattern:** Introduce `LEGACY_WORLD = { x: 0, y: 0, w: 4800, h: 4800 }` (name TBD at 6.0). After expansion, `WORLD.w/h` grow; all legacy systems continue to use `LEGACY_WORLD` for “inside core” tests. New systems use `WORLD` for bounds.

---

## Technical options: scroll vs wrap

### Option A — Extend / scroll (recommended)

- **Idea:** Increase `WORLD.w` / `WORLD.h` (or chunk grid) outward; camera and player clamp to new bounds; legacy content stays at fixed coordinates **0…4800**.
- **Pros:** Matches “build the world **around** it”; paths can lead to **distinct** NPC holds at real offsets; fog tiles map naturally; saves can store `discoveredChunks` by world coords; no confusion with “southern holds” wrapping to north edge.
- **Cons:** Larger coordinate space; minimap must scale or show legacy + overview; more save payload; need chunk or region loader for performance if world grows large.

### Option B — Wrap-around (torus)

- **Idea:** Keep `WORLD` size; crossing east edge spawns player on west (and vice versa); same for camera modulo.
- **Pros:** Smaller diff to `clamp(player…)` and `camera` (~L6034–6035, ~L6488–6490); no world size bump; minimap stays one square.
- **Cons:** Contradicts “paths to **other** holds” (wrap makes holds feel like the same island); fog + wrap is disorienting; tree border ring becomes a seam, not a gateway; harder to keep legacy rect “frozen” visually.

### Recommendation

**Use extend / scroll (Option A).** User noted wrap might be easier — it is, but only for bounds math. The stated design (exterior holds, directed paths, fog on **new** land only) fits an enlarged map. Implement wrap only if a later perf/size cap forces it; do not default to wrap.

---

## Fog modes (ship after 6.7)

| Mode | Flag suggestion | Behavior |
|---|---|---|
| **Version B (default)** | `FOG_DISCOVERY_MODE = 'legacy-core-visible'` | Everything inside `LEGACY_WORLD` always uncovered on main view + minimap. Exterior chunks: **unexplored** (black/minimap fog) until player enters; **explored** stays visible once visited. |
| **Version A (alternate)** | `FOG_DISCOVERY_MODE = 'full-black'` | Entire world including legacy rect starts fogged; only visited tiles reveal (full Warcraft black). |

**Persistence:** `discoveredMask` or chunk bitset in save snapshot (additive field, e.g. `world.discovered`). **Soft-wire** default `'legacy-core-visible'` for Continuity testing.

---

## Numbered implementation steps

Process: **one sub-step per user “next”** → read `docs/CHANGE_MEMORY.md` + `decisions.log.md` → implement → smoke → append memory. **No APK** until 6.8 gate + Steps 5 and 3 complete.

---

### Step 6.0 — World extension scaffold (prerequisite) ✅ Done (3.4.0 / vc58)

**Goal:** Enlarge world coordinates without spawning any new content yet.

| Item | Detail |
|---|---|
| **Work** | Add `LEGACY_WORLD`; bump `WORLD` (e.g. +2048 px per side → 8896×8896, exact size TBD); update player/camera clamp, tile draw loops, minimap scale, save `world` stub; keep `buildWorld()` output identical inside legacy rect. |
| **Acceptance** | New game: player/camera behave exactly as today inside 4800×4800; exterior is empty grass (or void strip) with no gameplay change in core; `node --check game.js` PASS; `test-town-save.js` PASS. |
| **Memory checks** | REMOVED untouched; town save additive; do not bump to 4.0.0. |
| **Do NOT break** | Region names, camp heal radius, mine/tree sites, starter town, wave spawns, purple border at **legacy** edge (may move to inner ring in 6.1). |

**Shipped 2026-08-28:** `CONTINUOUS_MAP_ENABLED=true`; `LEGACY_WORLD` 4800×4800 at origin; `WORLD` **8896×8896** (+2048×2 per axis); `buildWorld()` + wave spawns use legacy bounds; player/camera/tiles clamp/draw full WORLD; purple rift at legacy edge; minimap full-world scale + legacy ring; save `world` stub; APP **3.4.0** / vc**58**; no APK.

---

### Step 6.1 — Border tree ring

**Goal:** Visual + collision ring at **legacy** perimeter; core unchanged inside.

| Item | Detail |
|---|---|
| **Work** | Dense tree/obstacle ring just inside or on `LEGACY_WORLD` edges; reuse `assignTreeVariant` / forest stand patterns; block easy walk-off without a path; remove or repurpose purple rift stroke as inner “sealed core” cue only. |
| **Acceptance** | Walking the legacy border feels like a forest wall; cannot clip through; interior tree/mine counts unchanged; no new enemies. |
| **Memory checks** | `TREE_SPRITE_VARIANTS_ENABLED` KEPT; world tree art plan respected. |
| **Do NOT break** | `buildWorld()` scatter inside legacy; camp clearance; laborer pathing to mines. |

**Shipped 2026-08-28:** `buildLegacyBorderRing()` after interior `buildWorld()` scatter; 2-row dense ring at insets 52–108 px inside `LEGACY_WORLD` edges; spacing ~40 px; **~350 trees** (+ corner seals; count varies slightly); cardinal gaps `LEGACY_BORDER_GAP_HALF=88` via `isLegacyBorderPathSlot()` (6.2 widens); `assignTreeVariant` reused (border bias few/bunch); purple rift stroke kept at legacy edge as sealed-core cue; APP **3.4.1** / vc**59**; no APK.

---

### Step 6.2 — Path stubs through the ring ✅ Done (3.4.2 / vc60)

**Goal:** 3–4 clear **path corridors** through the tree ring leading outward (cardinal or toward planned hold sites).

| Item | Detail |
|---|---|
| **Work** | Carve non-tree corridors; ground decal or `stone`/`grass` path tiles; optional signposts; stubs end at legacy edge facing exterior (no holds yet). |
| **Acceptance** | Player can exit legacy rect via paths only; ring otherwise blocks; region banner still works in core; paths visible on minimap. |
| **Memory checks** | Bottom region label only (no center ENTERING). |
| **Do NOT break** | Obstacle collision for combat; build place blocked on paths same as today. |

**Shipped 2026-08-28:** `isLegacyPathCorridor()` + `buildLegacyBorderPaths()`; 4 cardinal corridors (`LEGACY_PATH_CORRIDOR_HALF=88`, depth 560px); `path` ground tile + `drawLegacyPathGround()`; minimap tan stubs; wooden signposts at interior ends; ring-tree skip + obstacle purge in corridor; gold mines unchanged (`mineSites`×9, `isNearGoldMine` skips path decals); APP **3.4.2** / vc**60**; no APK.

---

### Step 6.3 — Fog layer (exterior only, Version B default)

**Goal:** Warcraft-style discovery on **outside** legacy rect; core always visible.

| Item | Detail |
|---|---|
| **Work** | Tile/chunk visibility state; main render mask for unexplored exterior; minimap fog overlay; reveal on player proximity/visit; persist in save. |
| **Acceptance** | Inside legacy: no fog regression. Step off path into new land: black until walked; revisiting stays clear; minimap matches; save/load restores fog. |
| **Memory checks** | Compact minimap KEPT; settings `mapSize` still works. |
| **Do NOT break** | Enemy/player draw order; HUD cluster; co-op position sync (exterior optional). |

**Shipped 2026-08-28:** `FOG_DISCOVERY_ENABLED=CONTINUOUS_MAP_ENABLED`; `FOG_DISCOVERY_MODE='legacy-core-visible'` (Version B); **128×128 chunk bitset** (`fogDiscovered` Uint8Array, ~613 bytes); `revealFogAt` / `updateFogDiscovery` on player move (radius 240); `drawFogOverlay` + `drawFogMinimap`; save `world.discovered` + `world.fogMode`; APP **3.4.3** / vc**61**; no APK.

---

### Step 6.4 — NPC hold template

**Goal:** Data-driven **hold** prefab: brick ground footprint, low walls, 1–2 NPCs, no recruitment logic yet.

| Item | Detail |
|---|---|
| **Work** | `HOLD_TEMPLATES` with position in exterior; reuse Cloister brick tiles / `drawBrickWall` aesthetic for “brick on ground”; placeholder hold names (original IP); place first hold at end of one path stub. |
| **Acceptance** | Hold visible after fog cleared; Talk opens placeholder dialog; no squad change; town RTS in core unaffected. |
| **Memory checks** | `BRICKWALL_ENABLED` / Cloister art plan; workers≠squad. |
| **Do NOT break** | Existing `NPCS` at camp; quest flow with Quartermaster Bramm. |

**Shipped 2026-08-28:** `HOLD_TEMPLATES` + `npcHolds[]` at S/E/far-S/far-E exterior path exits; Cloister brick ground + low walls; 1–2 hold NPCs each; Talk → placeholder dialog (no recruitment); fog-gated draw; save `world.holds` (`id`, `visited`); APP **3.4.4** / vc**62**; no APK.

---

### Step 6.5 — Squad join / refuse + hold autonomous orange squad ✅ Done (3.4.5 / vc63)

**Goal:** Visiting a hold offers recruitment or a **light insult** refusal; holds self-play with orange squad, builders, and learning gauntlet.

| Item | Detail |
|---|---|
| **Work** | Wave-gated join/refuse via `tryTalk`; join → one **Ashen Spearman** to player militia + `hold.allegiance`; refuse lines before wave 8 (near) / 10 (far). **Orange hold economy** separate from player gray orbs. **Orange droppables** (`hold_orb`) collected by hold builders/units. **Hold squad** unlock: Rover starter + Scout@5 / Sentinel@12 / Warden@20 orangeSp. **Orange builder** (`holdLaborers`, 1/hold): laborer sprite + orange tint; collects orbs, repairs/places starter barricades (3 orangeSp each, max 4 big / 5 far). **Gauntlet**: 3 weak probe waves or 120s survival in exterior only. Starter defenses at init. |
| **Acceptance** | Early visit → refuse; wave 8+ → join once; player cannot spend on hold upgrades; hold builders autonomous; save `world.holds` extended; smoke PASS. |
| **Memory checks** | `laborers` / `squadLaborers` untouched; companion/militia caps unchanged for player. |
| **Do NOT break** | Legacy wave spawns; camp NPCs; decade bosses. |

**Shipped 2026-08-28:** `HOLD_AUTONOMY_ENABLED`; join wave 8/10; militia spearman recruit; `holdUnits` + `holdLaborers` + `holdProbes`; orange orbs + unlock table; gauntlet; save extended; APP **3.4.5** / vc**63**; no APK.

---

### Step 6.6 — Laborer NPC village (extension) ✅ Done (3.4.6 / vc64)

**Goal:** Ashen Laborers (or squad laborers at hold) **construct** village structures over time — extension of chop/mine/orders.

| Item | Detail |
|---|---|
| **Work** | Hold spawns build queue (hut, timber pile, brick pad); laborer `order` type `build` when assigned; visual progress; no player RTS menu required for NPC village. |
| **Acceptance** | Assign laborer near hold → structure appears over N seconds; uses wood/gold from hold pool or free NPC build; core player town build unchanged. |
| **Memory checks** | Laborer retaliate-on-hit only; squad laborer cap 3; place-pause still freezes workers. |
| **Do NOT break** | Player `seedStarterTown`; train laborer from Keep. |

**Shipped 2026-08-28:** `HOLD_STRUCTURE_KINDS` (hut 4✧/8s, timber 5✧/10s, brickpad 6✧/12s orangeSp); per-hold `buildQueue` seeded after `gauntletDone`; hold builder `build` order + scaffold/progress bar; `hold.structures[]` save/load; barricade repair/placement from 6.5 unchanged; APP **3.4.6** / vc**64**; no APK.

---

### Step 6.7 — Fog Version A / B toggle ✅ Done (3.4.7 / vc65)

**Goal:** Ship-ready switch between full-black and legacy-core-visible.

| Item | Detail |
|---|---|
| **Work** | Soft-wire `fogDiscoveryMode` runtime + `settings.fogDiscoveryMode` in `tr_settings`; settings row **Fog of war** cycles Core visible (B) ↔ Full black (A); save `world.fogMode`; load prefers stored `world.fogMode` else settings default. |
| **Acceptance** | `'legacy-core-visible'`: same as 6.3. `'full-black'`: legacy rect also fogged until visited. Toggle does not corrupt saves. |
| **Memory checks** | Default Continuity = Version B per user. |
| **Do NOT break** | Version B remains default for Play/BETA until user chooses A build. |

**Shipped 2026-08-28:** Runtime `fogDiscoveryMode` + `FOG_DISCOVERY_MODES`; settings **Fog of war** row (B default); save/load `world.fogMode`; main overlay + minimap respect mode; smoke fog A/B in `test-town-save.js`; APP **3.4.7** / vc**65**; no APK.

#### Manual test pass A — Version B (Core visible)

1. Fresh install / clear save → **Settings → Fog of war** shows **CORE VISIBLE (B)**.
2. Start run → legacy town/minimap always visible; walk south path to exterior → fog clears in reveal radius; minimap matches main view.
3. Save → quit → Continue → exterior explored chunks stay clear; legacy still always visible.

#### Manual test pass B — Version A (Full black)

1. **Settings → Fog of war** → tap until **FULL BLACK (A)**; start **new** run.
2. Legacy core starts black on main view + minimap until you walk; explored chunks stay clear after visit.
3. Save → set settings back to B → Continue → save still loads in **full-black** (`world.fogMode` wins); discovered mask intact.

---

### Step 6.8 — Gate to v4.0.0 (Step 6 complete) ✅ Done (4.0.0 / vc66)

**Goal:** Close Step 6 arc; label **4.0.0** when map arc complete (Step 5 deferred, Step 3 Console user-side).

| Item | Detail |
|---|---|
| **Work** | Update `docs/v4.0.0-roadmap.md` Step 6 → Done; CHANGE_MEMORY channel matrix; smoke checklist; `test-continuous-map.js` (fog save, hold state, legacy bounds); bump **4.0.0** / vc**66**; BETA-4.0.0 APK + Play 4.0.0 AAB staged. |
| **Acceptance** | All 6.0–6.7 acceptance criteria still pass; roadmap gate documents remaining Step 5 size + Step 3 Console. |
| **Memory checks** | REMOVED untouched. |
| **Shipped 2026-08-28:** APP **4.0.0** / vc**66**; BETA `TemporalRift-BETA-4.0.0.apk`; Play `TemporalRift-4.0.0.aab` + `mapping-4.0.0.txt`; smoke ALL PASS. |

---

## Per-step agent checklist (every sub-step)

1. Read `docs/CHANGE_MEMORY.md` (Remove/Keep, channel matrix).
2. Skim latest `docs/decisions.log.md`.
3. Implement **only** the current sub-step.
4. Run `node --check game.js`; run `test-town-save.js` (+ new smoke if added).
5. Append `decisions.log.md` row; update CHANGE_MEMORY pending/shipped as appropriate.
6. **Do not** build APK unless user requests after full v4.0.0 arc.

---

## What NOT to break (global)

- Wave coach, enhanced SFX, tree variants, Colossus, decade bosses, tap-place + enemy pause, squad economy, town save, Cloister walls, wooden barricades (KEPT), learning engine, channel-aware update banner, bottom region flash (not center ENTERING).
- Play/GitHub version lag notes — Step 6 is master Continuity only until user ships.
- Full co-op combat sync remains **deferred**; exterior may be host-local only.

---

## Code anchors (current master)

| Topic | Location |
|---|---|
| World size | `const WORLD = { w: 4800, h: 4800 }` |
| Camp / biomes | `CAMP`, `FORT`, `ASH`, `MARSH`, `zoneAt`, `REGIONS` |
| Player bounds | `player.x/y = clamp(..., player.r, WORLD.w - player.r)` |
| Camera | `camera.x/y` clamped to `WORLD` minus viewport |
| World border draw | Purple `strokeRect(0,0,WORLD.w,WORLD.h)` “rift wall” |
| Minimap | `drawMinimap()` — full world, zones, no fog |
| Town / brick | `snapshotTown`, `brickWalls`, `BRICKWALL_*`, `seedStarterTown` |
| Laborers | `laborers`, `squadLaborers`, `spawnLaborer`, orders |
| NPC talk | `NPCS`, `tryTalk`, `nearestNpc` |

---

## Related docs

- [`v4.0.0-roadmap.md`](./v4.0.0-roadmap.md) — Step 6 entry links here.
- [`CHANGE_MEMORY.md`](./CHANGE_MEMORY.md) — constraints and channel matrix.
- [`brickwall-art-plan.md`](./brickwall-art-plan.md) — Cloister / stronghold visual language for holds.
- [`laborer-art-plan.md`](./laborer-art-plan.md) — worker visuals for NPC village.

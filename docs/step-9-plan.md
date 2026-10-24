# Step 9 design plan — trees, pathing, gray fog, decade stack

**Status:** Step **9.7** Done — **4.3.0** / vc**94** BETA shipped. Step 9 arc **closed**.

**Process:** Same as Steps 6–8 — **one sub-step per user “next”** → read `docs/CHANGE_MEMORY.md` + `decisions.log.md` → implement → smoke → append memory. Arc APK gate at **9.7** → **4.3.0**.

**Related:** [`v4.3-roadmap.md`](./v4.3-roadmap.md) · [`continuous-map-plan.md`](./continuous-map-plan.md) (fog A/B) · [`exterior-expansion-plan.md`](./exterior-expansion-plan.md) (Burstweaver) · [`dirt-bike-art-plan.md`](./dirt-bike-art-plan.md) (mesh after APK test, not 9.x)

---

## Vision (plain language)

Four problems from 4.2.0 play:

1. **The purple border is a tree wall.** The new land feels empty; the old map is clogged. **Move some of those ring trees out** and **spread them** in the development.
2. **Bad guys walk into trees and stop.** They need to **go around**, or **climb over** small stuff, so the horde (and extra bosses) can actually reach you.
3. **Spiders only show up when you first peel black fog.** After that the land stays fully lit and they don’t keep coming. We want **Warcraft gray fog** (see-through after uncover) and **new gray dens at each wave start** so spiders have a place to crawl out of again.
4. **Decade bosses were supposed to stack every 10 waves.** Wave 50 = 5 bosses (hardness 50 / 40 / 30 / 20 / 10). Wave 100 = 10. You have not seen 2nd/3rd. Fix arrival + an **on-screen budget** so they still all exist, just wait their turn if the screen is full.

**Not this arc:** lake/boats **tiles** (Step 10 — we only **reserve** the bowl now). Bike mesh after you test the 4.2.0 APK.

---

## Macro map — slot this before we move trees or villages (9.0.1)

Today the map fights itself:

| Zone | Today | Problem |
|---|---|---|
| **Player town** | Center `CAMP` (2400, 2400) | Waves / RTS — stays |
| **Orange holds** | 4 on cardinal paths **outside** ring + 6 scattered deep exterior | You ride forever to visit “your people”; SE interior (marsh + path fork) is empty |
| **Bike wreck** | East path `(4920, 2100)` | East highway must stay clear |
| **Purple ring** | ~350 trees, 2 rows | Blocks horde **and** bike |
| **Lake (10)** | Not placed | If we random-spread trees now, we paint ourselves into a corner |

### Recommended layout (one coherent world)

```
8896 map (legacy 4800×4800 in top-left)

  NW exterior ─────────────── NE exterior
       │    [ LAKE BOWL      │     Emberwake strip
       │      reserved 10 ]  │     (resources only)
       │                     │
  WEST │   LEGACY 4800       │  EAST ← bike trail + wreck
       │   CAMP center       │
       │   MARSH bottom-R    │
       │   [ ORANGE QUARTER ]│  ← holds cluster HERE (inside ring)
       │      SE path fork   │
  SW ──┴── south path ──────┴── SE exterior (resources, gray dens)
```

| Zone | Placement rule |
|---|---|
| **Orange Quarter** | **Inside** legacy, **bottom-right**: Duskmere Marsh edge + **south/east path corridor fork** (already cleared ground from 6.2 — the “pad” you remember). Short bike/walk from center camp. All orange villagers feel like one frontier neighborhood. |
| **Cardinal outposts** (optional) | Keep **Sunfall** (south mouth) + **Eastwatch** (east mouth) as **small gate camps** only — lore: “road guards.” Other holds **move into the Quarter** (not deleted). |
| **Bike lanes** | Widen tree gaps on N/S/E/W corridors + **SE diagonal** (camp → Orange Quarter → east wreck). Groves sit **beside** lanes, never across. Min clear width ≈ **3× bike r** (~160–200px). |
| **Lake bowl (Step 10)** | **NW exterior** — e.g. box ~(600,600)–(3200, 2800). **No** new trees/mines/coal/hold pads in 9.1. Greywater lore still works (“river dried” west of camp). |
| **Resource exterior** | Mines / coal / stands / spider dens on **lanes between** Quarter and lake — not in the bowl, not on bike highways. |

### What we do **not** lose (preservation contract)

Every shipped system keeps working — only **coordinates** and **tree placement** change:

| System | Preserve |
|---|---|
| 10 hold IDs, names, NPCs, join waves, refuse/join text | ✅ `hold.id` unchanged |
| Captain, builder queue, hut→timber→brickpad→watchpost→bikeshed… | ✅ save fields |
| Orange autonomy, orangeSp, showcase, hold combat, watchposts | ✅ |
| Exterior harvest (chop/mine/coal), hold deposit → orangeSp | ✅ retarget sites near new positions |
| Bike wreck, repair, mount, fuel, park at hold pad/shed | ✅ pad/shed at Quarter |
| Burstweaver / Broodmother / spiderlings exterior-only | ✅ dens off-lanes |
| Waves, Gharok, decade formula | ✅ spawn edge unchanged |
| Fog Version B (core visible) | ✅ |
| Saves | ✅ migrate `hold.x/y`, `hold.structures`, `parkHoldId`, exterior harvest merge |

**Tests to update (not delete):** `holds outside legacy` → `holds in Orange Quarter or cardinal mouths`; spacing → minimum pad gap inside Quarter grid.

---

## Revised step order (recommended)

| Step | What | Why this slot |
|---|---|---|
| **9.1** | **Map zones + trees** — thin ring, spread groves, bike lanes, lake reserve (no water tiles) | Trees must respect lanes **and** NW bowl **before** we lock hold coords |
| **9.2** | **Orange Quarter** — move holds to SE interior cluster + retarget harvest sites + save migration | Depends on 9.1 clearings; biggest layout win |
| **9.3** | Enemy steer / climb | Bosses use the lanes you just opened |
| **9.4** | Gray fog + wave dens | Dens on exterior resource lanes, not on Quarter |
| **9.5** | Decade stack queue + path spawn | Needs 9.1 lanes + 9.3 steer |
| **9.6** | Balance | Hub density, spider caps, tree counts |
| **9.7** | Gate **4.3.0** BETA | |

**Why not cram holds into 9.1?** Hold move touches saves, tests, harvest sites, and showcase — deserves its own version bump so we can revert if the cluster feels crowded.

**Why not defer holds to Step 10?** Step 10 is water geometry; orange hub is land layout. Doing hub first means lake docks **toward** a known camp, not random exterior.

---

## What is frozen

| Area | Rule |
|---|---|
| **Legacy rect** | `LEGACY_WORLD` 4800×4800 town, waves, 9 gold mines, **interior** forest scatter — unchanged |
| **Purple rift** | Still the sealed-core cue. Ring gets **thinner**, not deleted |
| **Gharok** | Every **5** waves, `boss:true`, exclusive claw kit |
| **Decade formula** | Already `decadeBossTiers(W)` → `10, 20, …, W`. Do not invent a new math — **make it show up** |
| **Fog Version B** | Legacy core stays visible. New gray layer is **exterior only** (Version A still full-black until explored) |
| **Spiders** | Still **exterior-only**. Never `spawnEdgePos()` into legacy |
| **REMOVED** | Untouched |
| **Bike mesh** | Out of scope until APK test |

---

## Pillar A — Map zones + spread trees (9.1)

### Today

`buildLegacyBorderRing()` plants **2 rows**, spacing **40px**, ~350 trees **just inside** the purple edge. Exterior only has **8 stands / ~30 trees**. Ring is a solid fence; path corridors are the only holes. Holds are scattered; no lake reserve.

### Goal

**Layout-first tree pass** — not random scatter.

| Piece | Rule |
|---|---|
| **Ring leftover** | 1 thinner row (or wider spacing) — still reads as purple seal |
| **Moved trees** | Ring surplus → exterior **groves** beside bike lanes (wood count preserved) |
| **Bike lanes** | N/S/E/W corridors + SE diagonal to Orange Quarter / east wreck; **no grove trunks** on lane centerlines |
| **Lake reserve** | NW exterior bowl marked `LAKE_RESERVE` — empty in 9.1 (Step 10 fills) |
| **Groves** | Clumps along resource routes (E strip, S strip, deep SE) — **not** one new wall |
| **Chop** | Same laborer rules |
| **Do not** | Touch interior random scatter trees; no trees in lake bowl; no trees on hold pad footprints |

**Acceptance:** ring visible; exterior tree count up; bike can run east path without pinball; NW bowl has zero new obstacles; smoke updated.

---

## Pillar A2 — Orange Quarter (9.2)

### Today

10 holds: 4 outside cardinal paths + 6 deep exterior (Emberwake…Cinderrest). Player at center camp; orange allies are a sightseeing tour.

### Goal

**One neighborhood** inside the legacy **bottom-right** — marsh + south/east path fork (cleared corridor ground ≈ existing “pad” feel).

| Piece | Rule |
|---|---|
| **Primary cluster** | Move **6 interior-scattered holds** (Emberwake, Thornholt, Greywater, Mosslight, Duskfen, Cinderrest) into a **staggered grid** in SE legacy (~3800–4600, ~3800–4600), ≥pad spacing |
| **Gate camps** | **Sunfall** + **Eastwatch** stay at south/east path mouths (outside or just past ring) — optional slim footprint |
| **Ashmarch / Riftshore** | Fold into Quarter **or** keep as far south/east **resource outposts** (decide in 9.2 implement — default: fold all 10 into Quarter if spacing works; else 8 in Quarter + 2 gates) |
| **Brick pads** | Showcase / captain builds stay per hold; reads as one town square |
| **Bike** | Park at nearest hold pad/shed in Quarter; trail marker from Quarter to east wreck |
| **Harvest** | Re-seat exterior stands/mines/coal within `HOLD_EXTERIOR_*_RANGE` of new coords |
| **Saves** | On load, if hold still at old template xy → migrate once to Quarter slot |

**Soft-wire:** `ORANGE_QUARTER_ENABLED` (ON at 9.2).

**Acceptance:** walk/bike from camp to orange NPCs in one short trip; all 10 captains/builders/join flows work; save Continue keeps orangeSp/structures; no hold overlap.

---

## Pillar B — Maneuver / climb (9.3)

### Today

`collideObstacles` **shoves** the unit out of a tree/rock. AI still steers **straight at the player**. Result: stuck in the ring, especially fat decade bosses (`r` up to 48).

### Goal

Cheap local steering — **no A\* on the 8896 map** (that froze us in 4.1.x).

| Mode | Who | When |
|---|---|---|
| **Slide around** | All enemies | Hit a blocker → try left/right tangent for a short time, then re-seek |
| **Climb / vault** | Enemies vs **small** obstacles (small trees, pebbles-scale rocks — `o.r` under a cap) | Short hop over, brief `climbT`, then resume chase |
| **No climb** | Mines, buildings, brick, big trees, hold pads | Always slide |

Decade / Gharok use the same rules (they are why you never see the stack). Player / laborers **unchanged** this step (you already path by feel).

**Soft-wire:** `ENEMY_STEER_ENABLED` (ON at 9.3).

**Acceptance:** a dummy enemy spawned in the ring reaches camp; bosses don’t pin forever on one pine.

---

## Pillar C — Gray fog + spider dens (9.4)

### Today (binary fog)

- **Black** = never visited (`fogDiscovered` bit off)
- Once uncovered → **fully clear forever**
- Burstweaver spawn: only if **you are outside** or **near a visible hold**; max 1 live (2 at wave ≥ 20)
- So: explore once, stay in core, spiders starve

### Goal (Warcraft-style, exterior)

Three looks:

| Look | Meaning | Spawn? |
|---|---|---|
| **Black** | Never seen | No (still hidden) |
| **Gray (see-through)** | Seen before, **not in current vision** — dim overlay, you can still make out terrain | **Yes — spider dens** |
| **Clear** | Inside current vision (player radius, same ~240 as reveal) | Normal play |

**Legacy core:** Version B stays fully clear. Gray never paints inside `LEGACY_WORLD`.

### Wave-start dens (“they keep coming back”)

At **`startWave`**, stamp **a few random exterior dens**:

- Prefer **already discovered** chunks (they flip back to **gray** until you walk near)
- If almost nothing is discovered yet, pick **black** chunks **near path exits / holds** and mark them gray dens **without** fully exploring the whole map
- Burstweaver / Broodmother / spiderlings **spawn from dens** (gray), not from “first uncover”
- Dens **refresh each wave** so one trip to the east doesn’t permanently shut spiders off
- Live caps stay (`burstweaverMaxLive`, Broodmother 1, spiderlings 24)

Player hiding in core: spiders may still **pop in a gray dens** out there (you’ll see them if you ride out, or they leash/despawn if you never leave — **keep the 20s legacy leash** so waves still end).

**Soft-wire:** `FOG_SHROUD_ENABLED` (vision vs discovered) + `SPIDER_DEN_ENABLED` (wave dens). Independent literals.

**Acceptance:** walk out, leave, that land goes gray not full-black; next wave a gray patch appears; spider can spawn from it; legacy core never gray.

---

## Pillar D — Decade stack you can see (9.5)

### Today (already coded, often invisible)

```
Wave W (W % 10 === 0): spawn W/10 elites at tiers 10, 20, …, W
Hardness = that tier’s curve (not full Gharok)
Gharok still every 5 (`boss:true`)
```

So **wave 50 already means 5 decade bosses** (T50, T40, T30, T20, T10) **plus** Gharok (50 is also a 5-wave). That **is** your “steps of 10 less.” They spawn at **legacy map edge** via `spawnEdgePos()` → **into the tree wall** → shove-stuck → you never see #2 / #3.

### Goal

Same formula. Make it **true in play**.

| Piece | Rule |
|---|---|
| **Count** | `floor(W / 10)` decade bosses. Wave 10→1, 20→2, 50→5, 100→10 |
| **Hardness** | Slot 0 = current decade (W). Each extra = **that lower decade** (W−10, W−20, …, 10) |
| **On-screen budget** | Soft cap of live **non-exterior** enemies on camera. Extra decade bosses **wait in a queue**, they are **not skipped**. When a slot frees, next walks in |
| **Spawn** | Prefer **path-corridor edges** (not a random tree), after 9.1/9.2 so they can walk |
| **Banner** | Keep / strengthen “N DECADE BOSS STACK (T50/40/30/…)” so you know they exist even off-screen |
| **Gharok** | Unchanged every 5 |

**Soft-wire:** `DECADE_STACK_QUEUE_ENABLED` (on-screen wait). Tiers function already exists — don’t rewrite unless tests prove it’s wrong.

**Acceptance:** debug/start wave 20 → **two** distinct decade titles on the field (or one fighting + one queued then arriving). Wave 30 → three. None eaten by the tree ring.

---

## Soft-wire draft

| Flag | Step | Default |
|---|---|---|
| `EXTERIOR_TREE_SPREAD_ENABLED` | 9.1 | ON |
| `LAKE_RESERVE_ENABLED` | 9.1 | ON (placement mask only) |
| `BIKE_TRAIL_LANES_ENABLED` | 9.1 | ON |
| `ORANGE_QUARTER_ENABLED` | 9.2 | ON |
| `ENEMY_STEER_ENABLED` | 9.3 | ON |
| `ENEMY_CLIMB_ENABLED` | 9.3 | ON |
| `FOG_SHROUD_ENABLED` | 9.4 | ON |
| `SPIDER_DEN_ENABLED` | 9.4 | ON |
| `DECADE_STACK_QUEUE_ENABLED` | 9.5 | ON |

Independent literals. 9.5 still wants 9.1 lanes + 9.3 steer.

---

## Out of scope (do not sneak in)

- Lake **water tiles** / boats / docks (Step **10** — bowl reserved in 9.1 only)
- Bike `idle/ride/wreck` mesh (after **4.2.0 APK test**)
- New enemy types
- Changing Gharok cadence
- Fogging the legacy core in Version B
- Full grid pathfinding

---

## Step checklist (implement later)

### 9.1 — Zones + trees
- `LAKE_RESERVE` rect; `BIKE_TRAIL_LANES`; thin ring; `buildExteriorSpreadTrees()` respects lanes + bowl; smoke; **no APK**

### 9.2 — Orange Quarter
- Reposition `HOLD_TEMPLATES` / migration; retarget exterior harvest sites; bike trail to wreck; tests for Quarter spacing; **no APK**

### 9.3 — Steer / climb
- Local tangent steer + small-obstacle vault; smoke “reaches camp”; **no APK**

### 9.4 — Gray + dens
- Discovered vs vision bitsets; gray draw; `startWave` dens; spider spawn from dens; leash kept; **no APK**

### 9.5 — Decade visible
- Path-edge spawn; on-screen queue; tests `decadeBossTiers(50).length === 5`; **no APK**

### 9.6 — Balance
- Hub density, dens per wave, climb cap, tree counts

### 9.7 — Gate
- **4.3.0** / next versionCode; `build-beta.ps1`; Play AAB optional

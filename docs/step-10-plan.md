# Step 10 design plan — Ashmere lake + Ashen Rift Skiff

**Status:** Step **10.7 ARC GATE Done** — **4.4.0** / vc**102** BETA APK + Play AAB. Step 10 closed (10.1–10.6 code + gate). Live sideload: `TemporalRift-BETA-4.4.0.apk`. Play: `TemporalRift-4.4.0.aab` (existing listing update).

**Process:** Same as Steps 6–9 — **one sub-step per user "next"** → read `docs/CHANGE_MEMORY.md` + `decisions.log.md` → implement → smoke → append memory. Arc APK gate at **10.7** → **4.4.0**.

**Related:** [`v4.4-roadmap.md`](./v4.4-roadmap.md) · [`step-9-plan.md`](./step-9-plan.md) (bowl reserved at 9.1) · [`exterior-travel-plan.md`](./exterior-travel-plan.md) (Step 8 bike kit — the skiff mirrors it) · [`continuous-map-plan.md`](./continuous-map-plan.md) (fog A/B) · [`dirt-bike-art-plan.md`](./dirt-bike-art-plan.md) (deferred mesh track — skiff art joins it, not 10.x)

---

## Vision (plain language)

The NW bowl has been a bare plain since 9.1 — cleared, reserved, and then ignored. Step 10 makes it the thing it was cleared for:

1. **A real lake.** Water fills most of the bowl NW of camp — Greywater's "river dried" lore finally points at something wet. You can see it from the camp meadow.
2. **A dock on the near shore.** Short walk NW of camp: wooden pier, moored-boat snap point, reeds and driftwood so the shore reads as a place, not an edge.
3. **A boat you restore.** A waterlogged skiff wreck at the dock — same beat as the bike wreck: pay wood+gold once, own it forever. Rowing feels different from riding: thrust + glide, slower than the bike, water-only (the exact inverse of the bike's land-only rule).
4. **A reason to cross.** Driftwood Isle in the middle of the water — one-time Greywater ferry cache (gold/coal/cores + a lore note), a few choppable isle trees only you can reach. Modest on purpose; no new enemy families.
5. **Water that never breaks waves.** Nothing walks into the lake, nothing spawns in it, no wave ever stalls on it — and the boat can't become a mid-wave camping platform.

**Not this arc:** fishing, rivers, skiff mesh art (procedural placeholder like the bike), co-op water sync.

---

## Where the water actually is — read before 10.1

The docs have been saying "NW **exterior** bowl." The shipped code says otherwise, and code wins:

| Fact | Value |
|---|---|
| `LAKE_RESERVE` (shipped 9.1) | `{ x: 600, y: 600, w: 2600, h: 2200 }` → x 600–3200, y 600–2800 |
| `LEGACY_WORLD` | (0,0)–(4800,4800); exterior land exists **only east and south** (WORLD 8896², legacy in the NW corner of it) |
| So the bowl is | the **legacy NW quadrant**, inside the purple ring — not exterior |
| Camp | `CAMP` (2400,2400), stone circle r 300, player start, Bramm/Kael, starter Keep — **inside the reserve rect** |
| 9.1 purge (`purgeLakeReserveContent`) | removed all trees + **4 of 9 legacy gold mines** + trees of **3 forest stands** inside the rect — intentional, smoke-asserted (`no legacy mines in lake bowl`, `legacy mines >= 4`) |
| Ring + path stubs | border ring (insets 52–108) and N/W corridors (depth 560) sit **outside** the rect — untouched |

**Consequence:** 10.1 must NOT flood the rect. The water body is an organic **blob subset** of the reserve that dodges the camp, both path corridors, and the wave-spawn walks. The rest of the rect stays what it already is today: bare shore meadow.

### Bowl sketch (legacy NW quadrant)

```
(0,0) ─ ring/purple seal ── N path stub (x≈2400) ──
  │  shore meadow (spawn-walkable)      │
  │   ┌────────────────────┐            │
  │   │   ASHMERE  ~~~~~   │  E meadow  │
  │   │  ~~~ (isle) ~~~~   │  (N appr.) │
  │   │   ~~~~~~~~~~~~     │            │
  │   └────────── dock ▨   │       CAMP (2400,2400)
  │  S meadow (W approach) │       stone circle r300
  ── W path stub (y≈2400) ─┴─── town / waves as-is ──
```

### Waterline rules (draft numbers — tune at 10.1)

| Piece | Rule |
|---|---|
| **Water blob** | Analytic superellipse, center ≈ (1420,1400), semi-axes ≈ 700×660 → bounds ≈ x 720–2120, y 740–2060. No tile-map array — cheap math test like `zoneAt` / `isBikeTrailLane` |
| **Isle** | Dry circle carved in the blob, ≈ (1520,1310) r 180, shallow ring around it |
| **Camp gap** | Nearest waterline ≥ ~380 px from the camp stone circle (SE water extreme ≈ (1915,1866) vs circle edge ≈ (2188,2188)) |
| **N path approach** | Water max x ≈ 2120 < corridor lane 2312–2488 — decade/horde walks from the N stub to camp stay dry |
| **W path approach** | Water max y ≈ 2060 < corridor lane 2312–2488 — same for the W stub |
| **Ring shore** | ≥ ~600 px meadow between ring trees and NW waterline — edge-spawned enemies path around |
| **Purge** | `purgeLakeReserveContent` stays rect-based as shipped (tests keep passing); waterline sits inside it; meadow stays bare flats unless user opts into a mine re-seat at 10.6 |

### What we do **not** lose (preservation contract)

| System | Preserve |
|---|---|
| Camp, player start, NPCs, tents, starter town, campfire | ✅ dry, ≥380 px from water |
| Waves, Gharok, decade stack, 9.5 path-stub spawns | ✅ N/W approaches stay land; spawn guard re-rolls water points |
| Remaining 5 legacy gold mines + stands, Orange Quarter, marsh/fort/ash | ✅ all outside the blob |
| Bike kit, east trail, hold links | ✅ untouched — bike still refuses legacy; bike and boat never meet |
| Spiders exterior-only + SPIDER_HUNT 4.3.1 + dens legacy-excluded | ✅ lake is legacy-interior — spiders physically can't reach it |
| Fog Version B core-visible | ✅ lake always visible in B; A fogs it until visited for free |
| Saves | ✅ additive `world.lake` node only; old saves → wreck present, cache unopened |

---

## What is frozen

| Area | Rule |
|---|---|
| **Legacy rect** | Untouched **outside the 9.1 bowl** — the bowl is the sanctioned canvas (9.1 relaxation carried forward, same pattern as 9.2's Quarter relaxation) |
| **Camp + waves** | No water inside the camp circle or the N/W path approaches; wave spawn cadence/count unchanged |
| **Gharok / decade** | Every 5 waves / `decadeBossTiers` + queue — unchanged |
| **Spiders** | Exterior-only, never `spawnEdgePos`, never gate wave clear — unchanged |
| **Bike** | Kit, fuel, legacy gate, hold links — unchanged; mesh art still deferred |
| **REMOVED** | Untouched (no center popups — ASHMERE label uses the bottom region flash only) |
| **Perf Continuity** | Analytic water test (no per-tile array), camera-culled draw, no A*, spatial grids untouched |

---

## Pillar A — Ashmere water body (10.1)

### Today

Bare purged flats. `isLakeReserve()` masks tree/mine placement; nothing else knows the bowl exists.

### Goal

The lake exists, looks like water, and **nothing on legs can enter it**.

| Piece | Rule |
|---|---|
| **Geometry** | `isLakeWaterAt(x,y)` / `isLakeShallowAt(x,y)` analytic blob + isle carve (draft numbers above); shallow band ≈ 46 px inside the waterline |
| **Ground draw** | New `water` tile kind in `makeTileTex` (marsh-pool palette, deeper teal) + cheap animated shimmer overlay + foam stroke along the waterline; camera-culled like everything else |
| **Shore collision** | Movement clamp for **player, enemies, militia, companions, laborers, hold units, Colossus**: if next position is water and actor is land-bound → slide along shore (same inside/wouldEnter pattern as the legacy border turn-back). Water is NOT an `obstacles[]` entry — no grid pollution |
| **Spawn guard** | `spawnEdgePos` (both branches — edge and camping-ring) re-rolls water hits, then clamps to nearest shore; NaN-sentinel respawns covered by the same call |
| **Minimap** | Water patch drawn in the fog minimap cache (Version B = visible from boot) |
| **Bolts** | Projectiles fly over water (water isn't in `obstacleBlockedAt`) — no code, verify in smoke |

**Soft-wire:** `LAKE_WATER_ENABLED` + `LAKE_SPAWN_GUARD_ENABLED` (independent literals).

**Acceptance:** camp/keep/Bramm dry; can't walk into water from any angle; enemy sim frame never enters water; 500-roll spawn test never lands in water; N/S/E/W + SE lanes still dry; smoke updated; **no APK**.

---

## Pillar B — Emberfall Dock (10.2)

### Goal

The shore reads as a destination before the boat exists.

| Piece | Rule |
|---|---|
| **Dock** | SE shore facing camp, draft ≈ (2010,1920) snapped to the computed waterline — planks from meadow over the shallow band, moor snap point at the end |
| **Decor** | Reeds/cattails, driftwood, foam — `decor[]` entries, non-colliding, camera-culled; **no new obstacles** on the meadow (keeps spawn walks clean) |
| **Region label** | `ASHMERE` row in `REGIONS` (bottom region flash only — center ENTERING popup stays REMOVED) |
| **Second pier** | The isle gets a **mini-pier** at 10.4; a third far-shore pier is out of scope |

**Soft-wire:** `LAKE_DOCK_ENABLED`.

**Acceptance:** dock visible from camp approach; walkable to pier end; no collision surprises; label flashes on shore; **no APK**.

---

## Pillar C — Ashen Rift Skiff (10.3)

### Today

Bike is the only vehicle: wreck → repair (30🪵+18◈) → mount V/🏍 → fuel burn → legacy-gated. The skiff mirrors that flow with inverted terrain rules.

### Goal

| Piece | Rule |
|---|---|
| **Wreck** | Waterlogged skiff beached at Emberfall Dock (`boatWreck`, spiral-drip draw); repair **40🪵 + 10◈** (wood-heavy — it's a hull) → `boat.owned`, banner "SKIFF AFLOAT" |
| **Mount** | At dock moor or while standing in the shallow band next to the moored skiff (`BOAT_INTERACT_R` 95); refused while `player.downed` |
| **Movement** | **Water-only** — inverse of bike: hull cannot cross the waterline outward; drift feel = thrust toward joy/WASD + glide decay (accel ≈ 1.1 s to top, glide half-life ≈ 0.8 s), top speed ≈ **1.30×** walk (bike stays the fast one at 1.85×); wake particles |
| **Dismount** | Only at dock or shallow band → step ashore, skiff moors at snap point (dock) or beaches where you left it (mirror of bike park-anywhere); `moorDockId` saved |
| **Fuel** | **Free rowing — `BOAT_FUEL_MODEL = 'none'`** (decision locked, see A–B below). No coal/fuel drain, no strand-at-zero mid-water failure mode |
| **Wave gate** | `BOAT_WAVE_GATE_ENABLED` — mount refused while a wave is active ("THE HORDE CALLS — SHORE FIRST"); if a wave starts while afloat: 10 s grace floater, then ash-choked water drains ≈ 3 HP/s until ashore. No mid-water knock-off ever (nobody swims) |
| **Weapons** | Guns/beam/nova/grenade allowed afloat (parity with 8.4 bike); dash blocked like bike; the wave gate is what prevents cheese, not a weapon ban |
| **Controls/HUD** | Same V key / vehicle button — icon flips 🏍↔⛵ by nearest vehicle (`tryVehicleAction` picks boat when nearer); phase label "⛵ RIFT SKIFF — beach at shore" |
| **Save** | Additive `world.lake { boatOwned, moorX, moorY, moorDockId, isleCacheOpened }`; on load, a player position stranded in water while unmounted nudges to nearest shore (NaN-sentinel style) |
| **Art** | Procedural TR cartoon skiff (concept-sheet placeholder allowed) — real mesh joins the **deferred bike mesh track**, not 10.x |

### Fuel A–B (locked at 10.0 — recommend A)

| Model | Verdict |
|---|---|
| **A — free rowing (`'none'`)** | **SHIP.** The lake is a bounded pond: no distance to gate, the wave gate already kills camping cheese, and coal keeps its bike identity. Zero "out of fuel mid-water" softlock surface |
| B — shared bike fuel (`'shared'`) | Deferred, documented: burn ~1.5/s while thrusting; only worth revisiting if a future arc adds long water routes |

**Acceptance:** repair → mount at dock → row around isle → beach on far shore → walk; mount refused mid-wave; wave-start afloat drains until ashore; save/Continue restores moor + ownership; **no APK**.

---

## Pillar D — Driftwood Isle (10.4)

### Goal

One modest, real reason to cross — not a new biome.

| Piece | Rule |
|---|---|
| **Mini-pier** | Isle SE edge; moor snap like the dock |
| **Ferry cache** | One-time chest-style cache (own small object, not the quest chest): draft **60 gold + 6 coal + 8 cores** + lore floater — "The river dried. Greywater's last ferry rests here." (ties Greywater Landing's line); `isleCacheOpened` saved |
| **Isle trees** | 3–5 choppable trees on the isle — player-chop only (laborers can't cross water, and that's fine — it reads as "your" grove) |
| **No enemies** | Nothing spawns on the isle; no new enemy types anywhere in Step 10 |

**Soft-wire:** `LAKE_ISLE_REWARD_ENABLED`.

**Acceptance:** cross → moor → open cache once → loot banks; Continue keeps it opened; trees choppable, wood credits player; **no APK**.

---

## Pillar E — Water rules (10.5)

### Goal

The lake can never break a wave, and threats near the shore stay honest.

| Piece | Rule |
|---|---|
| **Enemies never enter water** | Hard clamp from 10.1 stands; 9.3 steer tangent-slides them along the convex shoreline instead of pinning — the lake behaves like one giant rounded rock |
| **Leash at shore** | Enemy chasing a boated player holds/patrols at the waterline and re-targets nearest land threat (militia/structures) when the player is unreachable — no shore-hugging pile-up freeze |
| **Ranged harassment** | Free, already works: shaman bolts and other projectiles fly over water — a boated player during the grace window still gets plinked. No new attack code |
| **Spiders** | Unchanged: exterior-only, SPIDER_HUNT 4.3.1 kept, dens still `SPIDER_DEN_LEGACY_EXCLUDE` — they can never reach the lake |
| **Shaman SWIM (user-requested 2026-09-16)** | ✅ **SHIPPED 4.3.6** — anti-camping counter: the **Ashen Shaman / magic caster** (only) enters water **slowly** (`SHAMAN_SWIM_SPEED_MUL` 0.55×) — head-above-water draw (ripples + wake), **casting fully cut while swimming** (contact poke breaks the camp; staff resumes ashore), engages within 84px of the waterline when the player is skiff-afloat / on a pier deck, never lands on the isle (rim clamp isle.r+8), strokes home when the camper steps ashore. All other enemies keep the hard shore clamp |
| **Ally clamps** | Squad/militia/laborers hold at shore when the player boats; CALL TITAN and reinforcement spawns clamp to nearest shore point |
| **Stall-proof** | Smoke: wave with player mid-lake still ends (enemies reachable on land or clearable); nothing spawns in water; `countWaveEnemiesRemaining` HUD unaffected |

**Soft-wire:** rules ride `LAKE_WATER_ENABLED`/`BOAT_ENABLED`; leash polish is code, not a new flag.

**Acceptance:** dummy enemy chases boated player → waits ashore, re-targets, wave still clears; no NaN/steer regressions at the shoreline; **no APK**.

---

## Soft-wire draft

| Flag | Step | Default |
|---|---|---|
| `LAKE_WATER_ENABLED` | 10.1 | ON |
| `LAKE_SPAWN_GUARD_ENABLED` | 10.1 | ON |
| `LAKE_DOCK_ENABLED` | 10.2 | ON |
| `BOAT_ENABLED` | 10.3 | ON |
| `BOAT_WAVE_GATE_ENABLED` | 10.3 | ON |
| `BOAT_FUEL_MODEL` | 10.3 | `'none'` (free rowing; `'shared'` = deferred B) |
| `LAKE_ISLE_REWARD_ENABLED` | 10.4 | ON |

Independent literals (Step 7.5 / 8.6 / 9.6 pattern) — flip any without killing the others. 10.3+ no-op if `LAKE_WATER_ENABLED` is off.

---

## Out of scope (do not sneak in)

- **Fishing minigame** (defer — optional post-arc)
- Multiplayer / co-op water sync (boat host-local like the bike)
- New enemy families or water monsters
- Moving water / rivers beyond the lake; third far-shore pier
- Skiff mesh art (procedural placeholder; joins the deferred bike mesh track)
- Swimming — the player can never enter water on foot, ever
- Play AAB (optional at the 10.7 gate, user-side upload)

---

## Step checklist (implement later)

### 10.1 — Water body
- `isLakeWaterAt`/`isLakeShallowAt` blob + isle carve; `water` tile + shimmer + foam; shore clamp for all land actors; `spawnEdgePos` water re-roll; minimap patch; smoke Step 10.1 block; **no APK**

### 10.2 — Dock
- Pier + moor snap at SE shore; reeds/driftwood decor (non-colliding); ASHMERE region row; smoke; **no APK**

### 10.3 — Skiff
- `boatWreck` + repair 40🪵/10◈; mount/dismount dock+shallows; thrust/glide water-only movement; wave gate + ash-water drain; `tryVehicleAction` V/⛵; save `world.lake`; smoke (mount-refused-mid-wave, water-only sim); **no APK**

### 10.4 — Isle
- Mini-pier; ferry cache one-time loot + lore; isle trees; save `isleCacheOpened`; smoke; **no APK**

### 10.5 — Water rules ✅ Done (4.3.6 / vc100)
- Shore leash/re-target polish; ally/titan shore clamps; stall-proof wave smoke; **shaman swim** (`SHAMAN_SWIM_ENABLED`, user-requested 2026-09-16 — slow head-above-water pursuit, casting cut while swimming, magic caster ONLY); **no APK** — all shipped 4.3.6; water placement gate intentionally left to 10.6 (not in this checklist)

### 10.6 — Balance ✅ Done (4.3.7 / vc101)
- ✅ Drift accel/glide/top speed — LOCKED at draft (1.30× / ≈1.1s to top / 0.8s glide half-life; bike stays the fast one at 1.85×)
- ✅ Drain rate + grace — LOCKED at draft (10s grace → 3 HP/s ash drain)
- ✅ Repair cost — LOCKED at draft (skiff 40🪵+10◈ wood-heavy; bike 30/18 untouched)
- ✅ Cache loot — LOCKED at draft (60 ◈ / 6 ⬤ / 8 ⬡); swim exposure LOCKED (0.55× stroke / 84px waterline gate)
- ✅ A–B notes locked — A free rowing (`BOAT_FUEL_MODEL='none'`) shipped; B shared-fuel stays deferred
- ✅ **Water placement gate** (deferred from 10.5) — `placementWaterBlockedAt` (center + 8 footprint-edge probes vs `isLakeWaterAt`/`isOnDock`/`isOnIslePier`) rides all three placement paths (barricade / Cloister / structures) with the stock NO ROOM feedback (tap + ghost share the spot-blocked helpers); no new flag per the 10.5 precedent — gate no-ops with `LAKE_WATER_ENABLED` off
- ✅ Soft-wire audit — all 7 Step 10 flags independent `const NAME = true;` literals per the draft table; flip audit ×7 (each flag false alone → boot + newGame clean, surface no-ops)
- ✅ Meadow mine re-seat **NOT taken** — user never opted in; the 4 purged camp mines / 3 stands stay gone (economy unchanged pre-gate); **opt-in stays open** before/after 10.7

### 10.7 — Gate
- ✅ **4.4.0** / vc**102**; `build-beta.ps1` + `build-all.ps1` Play AAB; CHANGE_MEMORY matrix + changelog; Step 10 closed

---

## Open decisions (user, before 10.1 — keep to these)

1. **Wave gate feel** — OK that the skiff refuses to launch during an active wave, and ash-water drains you ashore if a wave catches you afloat? It's the anti-cheese keystone for a lake that sits inside the wave arena; if you want mid-wave boating we need a different answer before 10.3.
2. **Shore-meadow mines** — 9.1's bowl purge removed the 4 camp-side gold mines + 3 stand groves (tests assert it). Default = leave them gone (meadow stays open shore). Say the word if you want 1–2 mines/stands re-seated on the dry meadow east/south of the waterline at 10.6. **10.6 outcome: default taken — mines stay purged (smoke re-asserted); the opt-in remains open and can land before or after the 10.7 gate.**
3. **Free rowing** — locked as `BOAT_FUEL_MODEL='none'` (bike keeps the fuel identity). Flip to shared-fuel now or hold your peace until a future arc adds long water routes.

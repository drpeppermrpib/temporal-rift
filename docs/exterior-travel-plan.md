# Exterior travel — Step 8 design plan (post-4.1 Continuity)

**Status:** Step **8.1** Done (**4.1.5** / vc**81** — coal mines). **8.0** plan landed. Next = **8.2** fuel. **No APK until 8.7.**

**Process:** Same as Steps 6–7 — **one sub-step per user “next”** → read `docs/CHANGE_MEMORY.md` + `decisions.log.md` → implement → smoke → append memory. Arc APK gate at **8.7** → **4.2.0**.

**Related:** [`v4.2-roadmap.md`](./v4.2-roadmap.md) · [`exterior-expansion-plan.md`](./exterior-expansion-plan.md) (Step 7 complete) · [`continuous-map-plan.md`](./continuous-map-plan.md) · [`v4.1-roadmap.md`](./v4.1-roadmap.md)

---

## Vision summary

Step 7 filled the outer land with harvest, villages, and Burstweavers — but players still mostly *walk*. User wants a clear **reason to ride out** into the new development:

1. **Dirt bike** (or similar light ATV) — fast exterior travel, not a tank, not a flying mount.
2. **Coal mines** for **fuel** — bike burns a resource you gather outside the legacy core (gold/wood stay as-is; fuel is additive).
3. **Ashen Broodmother** — “pregnant spider” rare exterior threat that rewards going deep (after travel exists).
4. **Lake + boats** — explicitly **later (Step 10)**; needs water geography and different controls.

Fantasy: coal seams beyond the tree ring → fill a jerry can / tank → mount the bike at a trailhead or hold shed → cut across fogged grassland to distant villages → dismount to fight / chop / mine. Core 4800×4800 wave survival stays foot-based and unchanged.

---

## What is frozen (legacy core 100%)

| Area | Constraint |
|---|---|
| **Legacy rect** | `LEGACY_WORLD` 4800×4800 — waves, gold mines×9, forest stands, town RTS, path corridors, border ring — **untouched** |
| **Full world** | `WORLD` 8896×8896 — do not shrink |
| **Gold / wood economy** | Player wood/gold, squad wallets, orangeSp — coal/fuel are **new tracks**, not replacements |
| **Hold autonomy** | Orange captain / builders / combat KEPT; no player hold-upgrade menu |
| **Burstweaver 7.4D kit** | HP buffs from 4.1.x KEPT; Broodmother is a **separate** type, not a retune of Burstweaver explode |
| **Fog** | Version B default; exterior sites respect discovery |
| **REMOVED** | ENTERING popup, Play GitHub banner, Saiyan names — must not return |
| **Perf Continuity** | Spatial grids, draw culling, Debug menu, NaN sentinel — keep |

**Hard rule:** Bike speed / coal AI / Broodmother spawn must gate on `!inLegacyWorld` (or equivalent). No bike inside camp for wave farming cheese unless a later soft rule explicitly allows a **slow walk-assist only** (default: **no riding in legacy**).

---

## Pillar A — Coal mines (8.1)

### Fantasy

Dark **cinder seams** / coal heads outside legacy — **same building silhouette as gold mines**, recolored **gray / black / ash** (no new mesh required for 8.1). WC2-adjacent enter/carry loop like gold, but feed **fuel**, not gold.

### Look (locked 2026-08-31 — user)

| Piece | Rule |
|---|---|
| **Shape / collide / enter** | Reuse gold mine draw path + footprint (`r`, door, laborer enter) |
| **Palette** | Gray + black + dark ash (desaturate / charcoal roof, dark mouth, cool shadow) — **not** gold yellow |
| **Minimap / HUD cue** | Dark gray blip (distinct from gold tan/yellow) |
| **Art later** | Optional dedicated coal sheets; 8.1 ships **recolor only** |

### Placement

- Exterior-only sites, spaced from gold mines, holds, and each other (reuse exterior harvest spacing patterns from 7.0).
- Fog-gated; laborers ignore fogged sites (same as exterior gold/trees).
- Soft count draft: **4–6** coal mines worldgen-seeded.

### Harvest

| Actor | Behavior |
|---|---|
| Hold laborers | Can target nearby exterior coal → credit **hold fuel bank** or convert to orangeSp later (decide at 8.1/8.2: prefer **holdFuel** separate from orangeSp) |
| Player laborers | Optional assist (`PLAYER_EXTERIOR_ASSIST`) → player **fuel** tank / coal inventory |
| Captain | Optional bark when coal opens (“BLACK ROCK FOR THE BIKE!”) |

### Soft-wire

`EXTERIOR_COAL_ENABLED` — sites + AI; independent of bike until 8.2/8.3.

### Out of 8.1 scope

Fuel HUD, bike, Broodmother.

---

## Pillar B — Fuel economy (8.2)

### Draft model

| Concept | Draft |
|---|---|
| **Coal pickup / stock** | Integer `coal` (player) and optional `hold.coal` |
| **Fuel tank** | `fuel` 0…`FUEL_MAX` (draft **100**) on player when bike owned |
| **Convert** | At camp depot **or** exterior fuel shed / hold depot: coal → fuel (e.g. 1 coal = 8–12 fuel) |
| **Burn** | While **mounted** and moving: fuel drains per second; idle mounted drains slow or zero |
| **Empty** | Bike stalls → forced dismount; walk until refuel |

### HUD

Compact fuel bar (not a dashboard clutter): only shows when bike owned or coal > 0. Safe-area aware. Continuity with existing HUD offset settings.

### Soft-wire

`FUEL_ECONOMY_ENABLED` — without bike, coal can still stockpile (prep for 8.3).

---

## Pillar C — Dirt bike (8.3)

### Fantasy

Rift-scavenged **dirt bike** — not a car, not a horse. Fast, loud, vulnerable. Reason you cross the grassland between holds.

### Unlock (pick one at implement; recommend A)

| Option | Idea |
|---|---|
| **A (recommended)** | Discover **bike wreck** near first exterior path exit / trailhead; spend wood+gold (or coal) to repair once |
| **B** | Hold captain gifts bike after growth stage X |
| **C** | Quest from camp NPC |

### Controls

- Mount / dismount button (touch + key) — **cannot** shoot beam/rifle while mounted ( Continuity: dismount to fight).
- Steering uses existing joy / WASD; higher `moveSpeed` while mounted.
- Collision: bike has small `r`; trees/walls block; Burstweaver / Broodmother can knock you off on heavy hit.
- Camera: slight lead ahead of bike optional; keep camView settings respected.

### Legacy gate

**Default:** mounting refused inside `LEGACY_WORLD` (floater: “BIKE STAYS PAST THE RING”). Prevents wave cheese. Soft-wire override only for debug.

### Soft-wire

`DIRT_BIKE_ENABLED`.

### Art

**8.3 ships procedural placeholder** (TR cartoon draw, `DIRT_BIKE_SPRITE_ENABLED=false`). User rejected chat concept collages — **real mesh deferred after all Step 8 sub-steps (8.7 gate)**; return via Ravager-style pipeline (`docs/dirt-bike-art-plan.md` DEFERRED section). Size lock row in `UNIT_SIZES.md` when art locks.

---

## Pillar D — Bike ↔ holds (8.4)

- Park bike near hold brick pad (persist `bike.parkHoldId` / world xy in save).
- Optional captain stage: **bike shed** / fuel shed after watchpost (orangeSp cost).
- Travel loops: floating signposts already exist on paths — optional “trailhead” marker for bike spawn after repair.

---

## Pillar E — Ashen Broodmother (8.5)

### Naming

| Role | Name |
|---|---|
| **Primary** | **Ashen Broodmother** |
| Flavor | gravid Burstweaver matriarch |
| Avoid | Minecraft IP, “pregnant creeper,” etc. |

### Fantasy

Rare exterior **matriarch** — larger than Burstweaver, telegraphs a **birth swell**, then drops **spiderling** adds (small Burstweaver-kin or husk-spider). Not a legacy wave boss.

### Draft rules

| Rule | Draft |
|---|---|
| Spawn | Exterior only; cadence rarer than Burstweaver (e.g. every 3–5 min when player deep exterior, max 1 live) |
| HP / size | Above Burstweaver; own `UNIT_SIZES` row |
| Birth | Telegraph + spawn 2–4 spiderlings; can still web/poison lightly |
| Loot | Coal + cores + rare bike repair kit / fuel jerry |
| FF | Spiderlings can hurt holds (pressure villages) |

### Soft-wire

`BROODMOTHER_ENABLED` + `BROODMOTHER_SPRITE_ENABLED` (art off until sheets exist).

---

## Deferred — lake + boats (Step 10)

Needs: water tiles / lake body outside legacy, shore collision, dock, boat mount distinct from bike, possibly fishing or ferry between shores. **Do not** implement under Step 8 or Step 9. Track only as vision footnote. Step 9 = [`step-9-plan.md`](./step-9-plan.md).

---

## Soft-wire matrix (independent literals)

| Flag | Gates | Default at first ship of its step |
|---|---|---|
| `EXTERIOR_COAL_ENABLED` | Coal sites + harvest | ON at 8.1 |
| `FUEL_ECONOMY_ENABLED` | Tank / convert / burn | ON at 8.2 |
| `DIRT_BIKE_ENABLED` | Mount / ride / dismount | ON at 8.3 |
| `BIKE_HOLD_LINKS_ENABLED` | Park / shed | ON at 8.4 |
| `BROODMOTHER_ENABLED` | Boss AI / spawn | ON at 8.5 |
| `BROODMOTHER_SPRITE_ENABLED` | Sheets | OFF until art |

---

## Save Continuity

Additive fields only (examples — finalize per step):

- `town.coal`, `town.fuel`, `town.bike` `{ owned, x, y, parked, fuel }`
- `world.coalMines[]` exterior stubs (or re-derive from worldgen + stock like gold)
- Broodmother: no long-term save required beyond kill tally optional

Old saves without fields → defaults 0 / no bike / sites reseed.

---

## Sub-step checklist (agents)

### 8.7 — Arc gate ✅ (4.2.0 / vc87)

- **APP_VERSION 4.2.0** — full Step 8 arc (8.1 coal → 8.2 fuel → 8.3 bike → 8.4 hold links → 8.5 Broodmother → 8.6 balance).
- BETA `rollouts\TemporalRift-BETA-4.2.0.apk` + Desktop (`com.drpep.temporalrift.beta`, `TR_CHANNEL=github`).
- Smoke PASS. **No Play AAB this pass** (optional later). Bike mesh art still deferred post-8.7.

### 8.6 — Balance ✅ (4.1.10 / vc86)

- **Soft-wires independent** (same pattern as 7.5): coal / fuel / bike / hold links / broodmother each flip without killing the others.
- **Fuel loop:** burn **3.6**/s (~28s tank); repair **30 wood + 18 gold**; bikeshed park **+8 fuel** top-off.
- **Broodmother:** wave **≥12**, deep radius **1500**, spawn **200–320s**; HP **480**; spiderlings HP **52**, max **24** live.
- **A–B locked:** coal ≠ orangeSp (A); bike in `exteriorHarvest` save (A); brood birth not explode (A); spiderlings in `enemies[]` (A).

### 8.5 — Broodmother ✅ (4.1.9 / vc85)

- `BROODMOTHER_ENABLED` ON. Rare deep-exterior matriarch (max 1 live, ~3–5 min cadence).
- **Same Burstweaver sheets** — Broodmother drawn **1.38× scale + wider fat squash** (r=58); spiderlings **0.58× mini** (r=24, not pin-sized).
- **Birth swell** (not explode): telegraph → **8–10 spiderlings** burst out with web/bite/poison kit (no suicide blast).
- Kill loot: bonus coal + cores. Spiderlings/hold FF preserved. Exterior-only; won't stall waves.

### 8.4 — Hold links ✅ (4.1.8 / vc84)

- `DIRT_BIKE_HOLD_LINKS_ENABLED` ON. Dismount inside hold zone → bike snaps to **brick pad** (or **bikeshed** when built); `parkHoldId` saved.
- Captain stage **bikeshed** after watchpost (9 orangeSp). Violet lean-to draw; bike re-snaps when shed completes.
- Trailhead **biketrail** signpost after wreck repair. **Shoot while mounted** (guns, beam, nova, grenade); dash still blocked on bike.

### 8.3 — Dirt bike ✅ (4.1.7 / vc83)

- `DIRT_BIKE_ENABLED` ON. East trailhead **wreck** (spiral smoke) → repair **35 wood + 22 gold** → mount with fuel.
- **V** or **🏍** button: mount/dismount. **Legacy gate** (“BIKE STAYS PAST THE RING”).
- Fuel burns ~4.5/sec riding; empty tank auto-dismount. Heavy hits knock off.
- Art: **v3 concept sheet** (`ashen-rift-bike-concept-v3.png`) — real Ravager-style mesh **deferred after 8.7**.

### 8.2 — Fuel economy ✅ (4.1.6 / vc82)

- `FUEL_ECONOMY_ENABLED` ON. Player `fuel` 0–100; **1 coal → 10 fuel** at existing buildings: **Keep, Timber, Gold Vault, Muster, Pit** (tap building → **⛽ REFUEL**). No new shed sprite.
- **FUEL** bar appears on HUD when coal or fuel > 0. Burn on bike = **8.3**.

### 8.1 — Coal mines ✅ (4.1.5 / vc81)

- Soft-wire `EXTERIOR_COAL_ENABLED` ON; 6 exterior sites; gold-mine silhouette charcoal recolor; dark minimap blip.
- Hold laborers + player assist harvest → `hold.coal` / player `coal` (does **not** feed orangeSp).
- HUD `coalNum`; save/load additive. Fuel convert = 8.2.

### 8.0 — Plan (this ship)

1. Write `v4.2-roadmap.md` + this plan.
2. Point Step 7 docs / CHANGE_MEMORY / decisions at Step 8.
3. **No code / no APK.**

### 8.1 — Coal mines

1. Read memory + this plan.
2. Scaffold exterior coal sites (mirror 7.0/7.2 patterns; `exterior: true`, `resource: 'coal'`).
3. Hold ± player assist harvest → coal stock (fuel convert can wait for 8.2).
4. Smoke + memory. Stop.

### 8.2 — Fuel

1. Tank + convert + HUD; burn stub OK if bike not in yet (or no-op burn until 8.3).
2. Smoke + memory. Stop.

### 8.3 — Dirt bike

1. Unlock + mount/dismount + speed + legacy gate + fuel burn.
2. Smoke + memory. Stop.

### 8.4 — Hold links

1. Park / shed / captain hook.
2. Smoke + memory. Stop.

### 8.5 — Broodmother

1. Type + spawn + birth adds + loot; soft-wire sprites.
2. Smoke + memory. Stop.

### 8.6 — Balance / flags / notes

### 8.7 — Arc gate 4.2.0 BETA (+ AAB optional)

---

## Open decisions (resolve at step, not now)

1. Hold coal → orangeSp vs separate `hold.fuel`?
2. Bike repair cost numbers?
3. Exact Broodmother birth add type (mini-Burstweaver vs new `spiderling`)?
4. May player *push* bike through legacy path gaps at walk speed? (Default no.)

---

## Continuity reminders

- Add, don’t take away — Debug / NaN / grids / villages / Burstweaver stay.
- One “next” at a time; no APK until 8.7 unless user asks for interim BETA.
- REMOVED register untouched.

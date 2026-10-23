# Exterior expansions — Step 7 design plan (post-4.0.0 Continuity)

**Status:** Step **7 complete** — **7.6** arc gate shipped (2026-08-31) as **4.1.0** / vc**76** (BETA + Play AAB). Steps **7.0–7.5** done. Step 6 continuous map (6.0–6.8) shipped as **4.0.0** / vc**66**. This arc fills the **outer land** beyond `LEGACY_WORLD` without touching legacy core gameplay.

**Process:** Same as Step 6 — **one sub-step per user “next”** → read `docs/CHANGE_MEMORY.md` + `decisions.log.md` → implement → smoke → append memory. Arc APK gate closed at **7.6**.

**Follow-on:** Step 8 — [`exterior-travel-plan.md`](./exterior-travel-plan.md) · [`v4.2-roadmap.md`](./v4.2-roadmap.md) (8.0 plan landed; coal → fuel → bike → Broodmother).

**Related:** [`continuous-map-plan.md`](./continuous-map-plan.md) (Step 6 complete) · [`v4.1-roadmap.md`](./v4.1-roadmap.md) · [`v4.0.0-roadmap.md`](./v4.0.0-roadmap.md) (post-gate pointer)

---

## Vision summary

4.0.0 continuous map is good, but the **outer part** (beyond legacy **4800×4800**) still feels empty of economy and threat. User wants:

1. **Gold mines in exterior** — WC2-style buildings laborers can enter/mine (like interior `goldMines`).
2. **Trees to chop in exterior** — harvestable forest stands in new land, not only the legacy **border ring** (6.1).
3. **“A guy like me”** who grows the village bigger over time — see interpretation section; lean **NPC Continuity captain** (player-analogue) directing hold growth beyond the 6.6 hut→timber→brickpad queue, with optional player laborer assist.
4. **New bad guy:** large exploding spider-like enemy — **only outside** original/legacy map. Core wave spawns inside `LEGACY_WORLD` stay **100% as-is**. Original TR naming (no Minecraft creeper IP).

Exterior harvest + captain growth deepen orange hold autonomy and give players a reason to leave the sealed core. The Burstweaver (recommended name below) is an exterior-only pressure valve — never a replacement for husk/ravager/Gharok waves inside the legacy rect.

---

## What is frozen (legacy core 100%)

| Area | Code anchor (post-4.0.0) | Constraint |
|---|---|---|
| **Legacy world rect** | `LEGACY_WORLD = { x:0, y:0, w:4800, h:4800 }` | Gameplay, biomes, town, mines×9, forest stands, border ring, paths, purple rift — **untouched** |
| **Full world size** | `WORLD` **8896×8896** (`CONTINUOUS_MAP_ENABLED`) | Do not shrink; exterior content places **outside** legacy only |
| **Wave spawns** | `spawnEdgePos()` → `legacySpawnBounds()`; `startWave` / decade / Gharok | Core horde spawn stays on **legacy** edges; Step 7 enemies must **not** call `spawnEdgePos` into legacy or alter wave tables for core |
| **Interior mines / trees** | `mineSites`×9, `standSites`, `buildWorld()` scatter, `buildLegacyBorderRing()` | Counts, positions, laborer AI to interior sites unchanged |
| **Hold 6.4–6.6 surface** | `HOLD_TEMPLATES`, `npcHolds`, `holdUnits`, `holdLaborers`, `HOLD_VILLAGE_BUILD_ORDER` hut→timber→brickpad | Keep working; captain **extends** queue after brickpad — does not replace 6.6 |
| **Orange vs gray economy** | `hold.orangeSp` / `hold_orb` vs player/squad wood-gold | Separation KEPT; exterior mines may feed orange and/or player gold via clear rules (per step) |
| **Fog** | Version B default `legacy-core-visible`; A toggle | Exterior harvest sites respect fog visibility; do not fog legacy by default |
| **Town / RTS Continuity** | `snapshotTown` / `applyTownSave`, player laborers | Player town RTS unchanged; optional assist must not become “player upgrades holds” menu |
| **REMOVED** | ENTERING popup, Play GitHub banner, Saiyan names | Must not return |
| **Size locks** | `UNIT_SIZES.md`, Colossus, enemy/squad sizes | New spider has its **own** exterior size row; do not bump existing locks |

**Hard rule:** If `inLegacyWorld(x, y)` — Step 7 must not change spawn cadence, enemy mix, mine/tree generation, or hold-probe rules that already gate with `inLegacyWorld`.

---

## “Guy like me” — interpretations + recommendation

### Interpretation A — NPC Vanguard-style captain (player-analogue)

- Each joined/eligible hold gains a **Continuity captain**: orange-tinted sprite reading as “player-like” (Vanguard silhouette / distinct captain kit — not a second controllable avatar).
- Captain **directs** hold growth: after 6.6 brickpad completes, queues further stages (walls, second hut, watchtower, depot, etc.) using orangeSp + exterior wood/gold.
- Talk lines / floaters convey orders (“chop the east stand”, “open that mine”).
- Player may optionally **assist** by sending own laborers to exterior trees/mines near that hold (Interpretation B lite).

### Interpretation B — Player laborers expand exterior villages

- No new NPC director. Player assigns `laborers` / `squadLaborers` to exterior sites; hold structures grow when player deposits resources or builds via a limited exterior build order.
- Stronger player agency; weaker “guy like me” fantasy; risks blurring orange autonomy vs player town RTS (6.5 explicitly: player cannot upgrade hold units).

### Interpretation C — Hybrid (recommended)

| Piece | Owner |
|---|---|
| **Director** | NPC captain per hold (A) — “guy like me” |
| **Workforce** | Existing `holdLaborers` (expand count later if needed) + **optional** player laborer assist on exterior harvest only |
| **Economy** | OrangeSp for hold builds; exterior wood/gold can credit hold orange pool and/or player town per soft rules |
| **Player control** | Assist harvest / defend hold — **no** hold unit upgrade menu, **no** replacing captain AI |

**Recommendation:** **Interpretation C**, lean hard on **A for identity**. Matches Continuity orange hold autonomy, reuses `holdLaborers` / village queue, and honors “a guy like me” as an **NPC captain** who grows the village over time. Optional player assist satisfies “send my laborers” without undoing 6.5 autonomy.

**Art note (7.3):** Prefer orange-tint of player/Vanguard-adjacent procedural figure, or a distinct Continuity captain (cloak + baton). Do not add a second player-controlled body.

---

## New enemy — Ashen Burstweaver (exterior-only)

### Naming (original TR — no Minecraft IP)

| Role | Name |
|---|---|
| **Primary (recommended)** | **Ashen Burstweaver** |
| Alternate title / bark flavor | Riftweaver, Ashen Webburst |
| Avoid | “Creeper”, Minecraft-adjacent names, green pixel-creeper silhouette as brand |

### Fantasy

Large rift-spider that **stalks exterior grass**, swells with ash-light, then **detonates** in a burst of webbing/shards. Threat is telegraph + radius, not stealth mimicry of another IP.

### Draft stats → **7.4D finals** (7.5 locked — no kit retune)

| Stat | Final (4.0.8 / locked 4.0.9) | Notes |
|---|---|---|
| `type` key | `burstweaver` | New `ETYPES` entry; **not** in legacy wave tables |
| Collision `r` | **42** | Between Ravager (36) and Gharok (54) — size lock |
| `drawH` | **115** | Size lock |
| HP | 120 base × `hpScale()` | Below Ravager tankiness; dies if focused during telegraph |
| Speed | 52 | Slightly above Ravager; no sprinter |
| Melee / bite dmg | **14** | Secondary; main threat is explode |
| Web | dmg **9**, slow×**0.55** @ **2.5s**, CD **4.5s** | Softer stack with poison |
| Poison | **10s** @ **3.0** HP/s + **4.0** aether/s | Bite apply |
| Explode radius | **128 px** | Player, militia, hold orange, laborers, structures, **enemies** |
| Explode dmg | **42** + wave×1.5 | Soft-cap vs Keep/Cloister if any exterior structure |
| Swell | **1.35–1.75s** + danger ring | Kill = BURST FIZZLE |
| Spawn | **55–80s**, max **1** | Player exterior or near visible hold |
| Core / XP | 4 / 22 | Between ravager and decade lite |
| Armor | none at spawn | Optional light plate only in late exterior cadence |
| Storage | **Continuity A** = `enemies[]` | B = parallel `exteriorThreats[]` (deferred) |

### Telegraph (mandatory)

1. **Approach** — walk toward nearest player / hold unit / captain in exterior.
2. **Swell** — `bwSwellT` ~**1.35–1.75s**: scale pulse, ash particles, **danger ring**, distinct bark (“…weave…burst…”).
3. **Cancel window** — killing during telegraph = no explode (BURST FIZZLE) — rewards focus fire.
4. **Detonate** — particles + shake; scorched web decal (exterior only); **suicide**.

### Spawn rules (CRITICAL)

| Rule | Detail |
|---|---|
| **Exterior only** | Spawn position must fail `inLegacyWorld(x,y)`; if clamp would enter legacy, **abort spawn** |
| **Not `spawnEdgePos()`** | Do **not** reuse legacy edge spawner for Burstweavers |
| **Pattern** | Mirror `spawnHoldProbe` spirit: exterior ring around player-when-outside, or around holds, or random exterior chunks that are fog-revealed |
| **Wave table** | Core `startWave` / decade / Gharok **unchanged**. Burstweaver is a **parallel exterior pressure** (like `holdProbes`), optionally wave-cadence gated when player is outside |
| **Legacy rect** | Zero Burstweaver spawns, chases that cross into legacy **despawn or turn back** at border (pick one in 7.4; prefer turn-back to avoid core pollution) |
| **Decade optional** | Soft idea for 7.5: every N waves while player is exterior, 1 Burstweaver — never stacked into legacy decade roster |

### Soft-wire

`EXTERIOR_SPIDER_ENABLED` (**true** as of 7.4B Continuity testing).

---

## Soft-wire flag suggestions

| Flag | Gates | Default when step ships |
|---|---|---|
| `EXTERIOR_HARVEST_ENABLED` | Exterior forest stands + exterior gold mine sites (7.0–7.2) | **true** (independent; still needs continuous map for placement) |
| `EXTERIOR_CHOP_ENABLED` | Exterior tree chop AI for player/squad + hold builders (7.1) | **true** (independent) |
| `EXTERIOR_MINE_ENABLED` | Exterior gold mine enter/carry AI for player/squad + hold builders (7.2) | **true** (independent) |
| `HOLD_CAPTAIN_ENABLED` | Captain NPC + growth stages beyond brickpad (7.3) | **true** (independent of harvest/spider) |
| `EXTERIOR_SPIDER_ENABLED` | Ashen Burstweaver spawn/chase/attacks | **true** (independent) |
| `BURSTWEAVER_SPRITE_ENABLED` | Burstweaver idle/walk/threat/swell draw | **true** (independent) |
| `PLAYER_EXTERIOR_ASSIST_ENABLED` | Player/squad laborer pathing to exterior chop/mine sites | **true** Continuity A (ON); B = OFF laborers-only |

Master gate remains `CONTINUOUS_MAP_ENABLED`. If continuous map off, Step 7 systems no-op.

---

## Code hooks (grounded — do not invent parallel systems)

| Hook | Role for Step 7 |
|---|---|
| `inLegacyWorld(x,y)` / `legacySpawnBounds()` | Freeze tests; exterior placement + spider spawn gate |
| `buildWorld()` mineSites / standSites | **Do not edit lists**; add **`buildExteriorHarvest()`** after world build when flag on |
| `goldMines` / `goldVeins` / laborer `enterMine` | Reuse mine object shape; exterior mines push into same array **or** tagged `exterior: true` with shared AI |
| `forestStands` / trees `woodLeft` / chop gather | Exterior stands reuse chop path; tag `exterior: true` / `standId` offset |
| `isNearGoldMine` | Protect exterior mines from path/decor clash |
| `holdLaborers` / `updateHoldLaborers` | Captain orders → laborer tasks chop/mine/build next stage |
| `HOLD_VILLAGE_BUILD_ORDER` / `seedHoldVillageQueue` | Extend with stage-2 kinds after brickpad (captain) |
| `holdProbes` / `spawnHoldProbe` | Pattern for exterior-only entities **not** in wave `enemies[]` — Burstweaver may live in `enemies[]` **only if** spawn gated, or parallel array like probes |
| `spawnEdgePos()` | **Legacy waves only** — do not route Burstweaver here |
| Fog reveal / `isHoldVisible` | Exterior sites draw when chunk discovered |

---

## Numbered implementation steps

Process: **one sub-step per user “next”.** Arc APK gate closed at **7.6** (**4.1.0**).

---

### Step 7.0 — Exterior harvest scaffold (sites only; no new AI) ✅ Done (4.0.1 / vc67)

**Goal:** Place exterior forest-stand markers + gold mine site data beyond `LEGACY_WORLD` without changing laborer behavior yet.

| Item | Detail |
|---|---|
| **Work** | `buildExteriorHarvest()` when `EXTERIOR_HARVEST_ENABLED`; N forest stand centers + M mine footprints in E/S exterior (clear of holds, paths, fog OK); tag `exterior: true`; draw mines (inactive OK) + tree clusters with `woodLeft`; skip if `inLegacyWorld`. |
| **Acceptance** | Legacy mine count still 9; interior stands unchanged; exterior sites visible after fog reveal; `node --check` + town-save PASS; no new enemy; hold AI unchanged. |
| **Memory checks** | REMOVED untouched; `CONTINUOUS_MAP` KEPT; do not bump to 4.1.0. |
| **Do NOT break** | `buildWorld()` interior; border ring; `spawnEdgePos`; orange economy. |

**Shipped 2026-08-31:** `EXTERIOR_HARVEST_ENABLED=CONTINUOUS_MAP_ENABLED`; **8** exterior forest stands + **~30** tagged `exteriorTree` trees; **5** exterior gold mines (`exterior: true`); laborer `pickChopTarget`/`pickMineTarget` skip exterior (AI = 7.1/7.2); fog-gated draw/minimap; save `world.exteriorHarvest` stub + additive mine merge; APP **4.0.1** / vc**67**; no APK.

---

### Step 7.1 — Exterior trees choppable + laborer pathing ✅ Done (4.0.2 / vc68)

**Goal:** Hold laborers (and optionally player laborers if assist flag) can chop exterior stands and return wood.

| Item | Detail |
|---|---|
| **Work** | Wire chop/gather targets to exterior trees; hold laborer prefer stands near own hold; deposit wood → hold orangeSp conversion **or** hold wood bank (pick one rule, document in memory); soft `PLAYER_EXTERIOR_ASSIST_ENABLED` optional. |
| **Acceptance** | Chopping exterior increases hold resources; legacy tree chop identical; pathing does not delete border ring; fog-hidden stands not auto-targeted until revealed (or only if hold already visited). |
| **Memory checks** | Workers ≠ squad; holdLaborers separate from player laborers. |
| **Do NOT break** | Interior gather AI; squad laborer wood/gold; 6.6 build queue. |

**Shipped 2026-08-31:** `EXTERIOR_CHOP_ENABLED=EXTERIOR_HARVEST_ENABLED`; `PLAYER_EXTERIOR_ASSIST_ENABLED` ON; `pickChopTarget` includes fog-revealed exterior trees (player/squad → town/squad wood); `pickMineTarget` still skips exterior; hold builders `pickHoldChopTarget` prefer stands within 1200 of own hold; deposit **1 wood → 1 `hold.orangeSp`** (no hold wood bank); path via `WORLD` clamp (legacy exit OK); APP **4.0.2** / vc**68**; no APK.

---

### Step 7.2 — Exterior gold mines ✅ Done (4.0.3 / vc69)

**Goal:** WC2 enter/carry gold on exterior mines for hold economy (+ optional player assist).

| Item | Detail |
|---|---|
| **Work** | Exterior `goldMines` entries participate in `enterMine` / carry / stock; hold laborers mine nearest exterior mine; minimap dots when discovered; save additive (`exterior` flag or world.exteriorMines merge into goldMines on load). |
| **Acceptance** | Legacy 9 mines stock/behavior identical; exterior mines deplete; no mine spawned inside legacy from this step. |
| **Memory checks** | Town save additive; goldVeins alias intact. |
| **Do NOT break** | `isNearGoldMine` path protection; player town vault flow for interior gold. |

**Shipped 2026-08-31:** `EXTERIOR_MINE_ENABLED=EXTERIOR_HARVEST_ENABLED`; `PLAYER_EXTERIOR_ASSIST_ENABLED` covers mines; `pickMineTarget` includes fog-revealed exterior mines (player → gold, squad → squadGold); hold builders `pickHoldMineTarget` prefer mines within 1200 of own hold + WC2 enter/carry; deposit **1 gold → 1 `hold.orangeSp`** (no hold gold bank; mirrors wood); interior mines identical; APP **4.0.3** / vc**69**; no APK.

---

### Step 7.3 — Village growth captain (“guy like me”) + growth stages ✅ Done (4.0.4 / vc70)

**Goal:** NPC Continuity captain directs hold growth beyond hut→timber→brickpad.

| Item | Detail |
|---|---|
| **Work** | `HOLD_CAPTAIN_ENABLED`; spawn captain at hold after gauntlet (or allegiance); orange-tint player-analogue / distinct captain draw; extend `HOLD_VILLAGE_BUILD_ORDER` with stage-2 kinds (e.g. watchpost → second hut → depot → outer stakewall — exact list TBD in step); captain floaters / Talk lines; holdLaborers follow captain build + harvest orders; optional player assist harvest only. |
| **Acceptance** | After brickpad, village visibly grows over time with orangeSp + exterior resources; player cannot open hold upgrade menu; camp NPCS untouched; 6.5 join/refuse intact. |
| **Memory checks** | Orange ≠ gray; player cannot upgrade hold **units**; REMOVED untouched. |
| **Do NOT break** | 6.6 three-pad queue; hold barricade repair; militia join spearman. |

**Shipped 2026-08-31:**
- `HOLD_CAPTAIN_ENABLED=HOLD_AUTONOMY_ENABLED` (soft-wire ON)
- Captain NPC after `gauntletDone` — orange-tint Vanguard cloak + orange baton/staff; not player-controllable; Talk (`hold_captain`) reinforces join wave **8/10** insult/welcome
- 6.6 core KEPT: hut→timber→brickpad; captain stage-2 `HOLD_CAPTAIN_BUILD_ORDER`: **watchpost → hut2 → depot → stakewall** (7.5 Continuity **8/9/10/12** orangeSp; was 7/8/9/10)
- Captain directs unlock floaters; Lv≥2 spends orangeSp to reinforce beyond 1-cap (rover/scout/sentinel×2); player still cannot upgrade holds
- Learning gauntlet 2: after brickpad, **2** exterior probe waves → `learnGauntletDone` + captainLevel bump (reuses `holdProbes`)
- Save: `hold.captain`, `captainLevel`, `growthStage`, `captainQueueSeeded`, learn-gauntlet flags
- APP **4.0.4** / vc**70**; www synced; smoke PASS; no APK

**Deferred (not this step):** Burstweaver (7.4); second controllable avatar; extra laborers beyond 1/hold; APK / 4.1.0

---

### Step 7.4 — Ashen Burstweaver (mini-steps)

**Goal:** Large exploding spider threat **only** outside legacy rect. Split like prior boss/enemy art: **look first**, then move/spawn, then attacks.

See also [`burstweaver-art-plan.md`](./burstweaver-art-plan.md).

| Mini | Scope | Status |
|---|---|---|
| **7.4A** | Look: meshed original Continuity sprites (idle/walk/threat/swell), size locks `r=42` / `drawH=115`, soft-wire `BURSTWEAVER_SPRITE_ENABLED=false` + `EXTERIOR_SPIDER_ENABLED=false`; `ETYPES.burstweaver` stub **without** spawn/waves | **Done (4.0.5 / vc71)** |
| **7.4B** | Movement articulation (+ multi-dir if needed); exterior-only spawn stub (reject legacy coords); still **no** attacks | **Done (4.0.6 / vc72)** |
| **7.4C** | Attacks: **Web** (slow + dmg), **Bite** (poison 10s energy+health drain), **Explode** (friendly-fire AOE — player/allies **and** enemies); swell telegraph + kill-cancel; exterior-only full AI; barks | **Done (4.0.7 / vc73)** |
| **7.4D** | Balance polish before 7.5 | **Done (4.0.8 / vc74)** |

#### 7.4A — Look only ✅ Done (4.0.5 / vc71)

| Item | Detail |
|---|---|
| **Work** | Refs → GenerateImage mesh → transparent 512 sheets under `assets/burstweaver/`; www sync; UNIT_SIZES draft row; soft-wire flags OFF; no draw/spawn/combat. |
| **Acceptance** | Sheets present; flags false; legacy waves unchanged; REMOVED untouched; no Minecraft naming. |
| **Assets** | `idle.png` · `walk.png` · `threat.png` · `swell.png` |

#### 7.4B — Movement + exterior spawn ✅ Done (4.0.6 / vc72)

| Item | Detail |
|---|---|
| **Work** | Flags ON; idle↔walk sprite draw; `spawnBurstweaverAt` rejects legacy; rare exterior timer; chase + turn-back at border; mild melee dmg=14; no web/bite/explode. |
| **Acceptance** | Legacy-only play: zero Burstweaver spawns; exterior: see move; `spawnEnemy`/`spawnEdgePos` never used; decade/Gharok unchanged. |
| **Memory checks** | Size locks; REMOVED untouched; no Minecraft naming. |

#### 7.4C — Attacks ✅ Done (4.0.7 / vc73)

| Item | Detail |
|---|---|
| **Work** | Telegraph swell → explode (suicide); web/bite; damage player/hold units/laborers/structures **and** nearby enemies on explode; kill-during-telegraph cancel; barks original TR; **no** edits to `spawnEdgePos` / core wave mix. |
| **Acceptance** | Exterior: telegraph + explode feel fair; `inLegacyWorld` chase policy respected. |
| **Do NOT break** | Wave coach, Gharok, ravager, holdProbes gauntlet. |
| **Numbers** | Web dmg9 / slow×0.48@2.8s; bite dmg14 + poison 10s (3.5 HP/s + 4.5 aether/s); explode r140 dmg 45+1.5w; swell 1.1–1.4s; suicide on detonate. |

#### 7.4D — Balance polish ✅ Done (4.0.8 / vc74)

| Item | Detail |
|---|---|
| **Work** | Additive tune only — no new attacks. Longer swell + danger ring; rarer spawn; softer web/poison stack; mild explode soften; HUD WEBBED / ASH VENOM; soft-wires stay independent. |
| **Acceptance** | Exterior feels threatening but fair (not chaotic); FF explode still hits hold orange + enemies; fizzle KEPT; legacy untouched. |
| **Do NOT break** | Size locks r=42/drawH=115; exterior-only; max 1 live; wave tables. |
| **Final numbers** | Spawn **55–80s** max1; web dmg9 slow×**0.55**@**2.5s** CD4.5; bite dmg14 poison 10s (**3.0** HP/s + **4.0** aether/s) CD3.4; explode **r128** dmg **42+1.5w** CD12–16 trigger165; swell **1.35–1.75s** + danger ring. |

**Shipped:** **7.4A–7.4D**. Next = **7.5**.

---

### Step 7.5 — Balance / soft-wire flags / A-B notes ✅ Done (4.0.9 / vc75)

**Goal:** Tune harvest rates, captain stage costs, Burstweaver cadence/dmg; document A/B options.

| Item | Detail |
|---|---|
| **Work** | Pass numbers; ensure flags can disable spider / captain / harvest independently; A-B notes: (A) Burstweaver in `enemies[]` vs (B) parallel `exteriorThreats[]` like probes — pick Continuity default; player-assist ON/OFF default. |
| **Acceptance** | Flags flip cleanly; legacy-only run indistinguishable from 4.0.0; exterior run feels richer not chaotic. |
| **Memory checks** | Soft-wire pattern matches coach/SFX/map. |
| **Do NOT break** | Fog A/B settings; save load of world.holds / discovered. |

**Shipped 2026-08-31 (4.0.9 / vc75, no APK):**
- Soft-wires **independent** literals: `EXTERIOR_HARVEST_*` / chop / mine / `PLAYER_EXTERIOR_ASSIST` / `HOLD_CAPTAIN` / `EXTERIOR_SPIDER` / `BURSTWEAVER_SPRITE` — each Continuity **true**; flip any without killing the others (placement still needs continuous map).
- Harvest rates Continuity **A**: wood/gold → orangeSp **1:1** (B = half-rate deferred).
- Captain stage-2 costs **8/9/10/12** orangeSp; level floors **20/40/60/85** (paced vs harvest inflow).
- Burstweaver kit **locked** at 7.4D (no retune).
- Continuity storage **(A)** Burstweaver in `enemies[]` with exterior-only gate; **(B)** `exteriorThreats[]` documented deferred.
- Player-assist Continuity **(A) ON**; **(B) OFF** = hold laborers only.
- Decade-wave Burstweaver spawn: deferred (timer-only Continuity).
- www synced; smoke `node --check` + town/continuous PASS.

---

### Step 7.6 — Gate to 4.1.0 ✅ Done (4.1.0 / vc76)

**Goal:** Close Step 7 arc; version bump + smoke; **then** APK/AAB if user requests (same process as Step 6.8).

| Item | Detail |
|---|---|
| **Work** | Mark 7.0–7.5 Done in this plan; update `v4.1-roadmap.md` + CHANGE_MEMORY channel matrix; choose label: **4.0.1** (patch Continuity) vs **4.1.0** (feature exterior arc) — **recommend 4.1.0** if captain+spider+harvest all ship; **4.0.1** only if a tiny subset ships first. Full smoke: legacy identical + exterior harvest + captain + spider exterior-only. |
| **Acceptance** | All 7.x acceptance re-verified; REMOVED untouched; user says go on APK. |
| **Memory checks** | Append SHIPPED; no silent REMOVED re-add. |
| **Do NOT break** | Play/GitHub channel rules; Step 3 Console still user-side if still open. |

**Shipped 2026-08-31:** Full harvest+captain+spider arc closed → label **4.1.0** / vc**76**. Smoke PASS (`node --check` + town/continuous/build-place/channel). BETA `TemporalRift-BETA-4.1.0.apk` + Play `TemporalRift-4.1.0.aab` + `mapping-4.1.0.txt` → rollouts + playstore + Desktop. REMOVED untouched. Legacy core unchanged; Burstweaver exterior-only.

---

## Per-step agent checklist

1. Read `CHANGE_MEMORY.md` + latest `decisions.log.md`.
2. Implement **only** the named sub-step.
3. Soft-wire flag off-path must leave 4.0.0 behavior.
4. Smoke: `node --check game.js` + town/continuous-map tests as applicable.
5. Append decisions + memory; mark step ✅ in this plan.
6. Stop. Wait for next “next”. (Step 7 APK gate closed at 7.6.)

---

## What NOT to break (global)

- LEGACY_WORLD 4800×4800 gameplay, waves, mines, trees, town — **100% as-is**
- `spawnEdgePos` / decade / Gharok / wave coach
- Border ring + path stubs + fog Version B default
- Hold join/refuse, orange autonomy, 6.6 hut→timber→brickpad
- REMOVED register
- Player town RTS Continuity save
- Copyrighted / Minecraft naming

---

## Arc complete

**Step 7.0–7.6 Done** as **4.1.0** / vc**76** (BETA + Play AAB). Further Continuity work is post–Step 7.

### 4.1.1 retest patch (2026-08-31 — post-arc fixes, BETA vc77)

4.1.0 user retest: freezing / spider too weak / captain growth invisible. Fixes (see `CHANGE_MEMORY.md` 4.1.1 + `decisions.log.md`):

- **Freeze:** fog-minimap offscreen cache (~4900-chunk scan was per-frame), camera culling for the y-sort queue + pine canopies (whole-map iteration), `isHoldOnCamera` draw gate, hold-unit `ctx.filter` → overlay wash, builder scan cooldown + stuck release, wave-clear no longer hostage to border-stuck Burstweaver (+20s leash).
- **7.4D kit intact; survivability only:** hp 290, HEAVY knock (+1 ladder hit, 0.6× shove), 2 live at wave ≥20.
- **7.3 growth now visible:** post-grad orb spawner revived (dead code), 300s auto-graduation + offline SP trickle (`hold.ageT`), 2nd builder, captain hammers at build sites + structure rally lines.

### 4.1.2 retest patch (2026-08-31 — freeze round 2 + 10 villages + guaranteed build + hold combat, BETA vc78)

4.1.1 user retest: STILL froze / wants more villages / never saw a build / hold units passive. (Full detail: `CHANGE_MEMORY.md` 4.1.2 + `decisions.log.md`.)

**Freeze round 2 — root causes (the compounding-scan tier under the 4.1.1 draw fixes):**

| Cause | Cost | Fix |
|---|---|---|
| `collideObstacles` linear scan — ALL ~1200–1600 obstacles × every moving entity × frame | ≈300–500k dist checks/frame deep-wave | static spatial hash `obstGrid` (256px, built once post-`buildWorld`) |
| projectile `obstacles.some(...)` full scans (bolts/cbolts/sbolts/ebolts/grenades) | per-bolt × per-frame | `obstacleBlockedAt` grid query (tree-pass rules preserved) |
| enemy↔enemy separation O(n²) all-pairs | 30–60k pairs/frame at 150–250 live | `enemyGridMap` 128px buckets + `forEachEnemyNear` (also feeds militia aggro + sentry scans) |
| 4.1.1 additions (auto-grad, offline SP), `while` loops, save payload, timers/listeners | — | audited clean: dt-clamp bounds catch-up loops, pickups expire 30s, exterior statics re-derive from worldgen, fog packed bytes |

**PERF_WATCHDOG (BETA only):** section marks per frame (player+fog / weapons / spawning / enemies / allies+holds / projectiles / fx / camera+hud / draw / save). Frame ≥2s → console.error + on-screen banner naming the slowest section + `tr412_watchdog_report` in localStorage; **next launch banners "LAST SESSION FROZE — Xs in SECTION (wave N)"**, so any freeze we miss is pinpointed by the next tester report.

**Villages — 4 → 10 holds** (worldgen-seeded fixed coords, full kit, ≥1200 apart, ≥600 off legacy border):

| Hold | Pos | Region | Join | Tier |
|---|---|---|---|---|
| Sunfall / Eastwatch / Ashmarch / Riftshore | (unchanged) | cardinal path exits | 8/8/10/10 | big/big/far/far |
| Emberwake Steading | 5600,1050 | east strip north | 8 | big |
| Thornholt Palisade | 7400,1600 | deep east | 12 | far |
| Greywater Landing | 6100,3800 | east strip south | 10 | far |
| Mosslight Hollow | 1100,5400 | southwest border | 8 | big |
| Duskfen Waystation | 3600,7000 | deep south | 12 | far |
| Cinderrest Refuge | 6800,6500 | far SE corner | 12 | far |

**Guaranteed first-contact build (`HOLD_SHOWCASE_ENABLED`):** within 800px of a hold with <2 structures → build force-starts 10–16s later, NO orangeSp gate (auto-graduates if the drill hasn't run): captain rally → builder+captain hammer → scaffold + % bar → complete ≈20–30s after arrival. Once per hold (`showcaseDone` saved); the orb economy drives everything after.

**Hold combat (`HOLD_COMBAT_ENABLED`):** 300px aggro ring past the zone edge (`computeHoldThreats`), 600px leash (never into legacy core), rover/scout perimeter patrols, 6s alarm on any unit/builder/captain hit, captain fights (320hp + bar, baton 15dmg, barks, 26s downed recovery), watchpost = real turret (420 range / 12 dmg / 1.15s cd, orange bolts), enemies retarget nearest orange defender + contact damage (gated `_nearHoldId` → zero legacy cost).

---

## Related docs

| Doc | Role |
|---|---|
| [`continuous-map-plan.md`](./continuous-map-plan.md) | Step 6 complete — map scaffold this arc extends |
| [`v4.1-roadmap.md`](./v4.1-roadmap.md) | Post-4.0.0 arc home |
| [`v4.0.0-roadmap.md`](./v4.0.0-roadmap.md) | Closed 4.0.0 + pointer to Step 7 |
| [`CHANGE_MEMORY.md`](./CHANGE_MEMORY.md) | Frozen KEPT / REMOVED |
| [`decisions.log.md`](./decisions.log.md) | Append-only decisions |
| [`UNIT_SIZES.md`](./UNIT_SIZES.md) | Burstweaver draft lock `r=42` / `drawH=115` (7.4A) |
| [`burstweaver-art-plan.md`](./burstweaver-art-plan.md) | 7.4 mini-steps + sheets + attack docs |

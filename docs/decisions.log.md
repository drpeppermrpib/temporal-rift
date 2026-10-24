# Temporal Rift - Decision Log

**Append-only.** Newest entries at the top. Do not edit or delete prior rows; add a correcting entry instead.

**Statuses:** `REMOVED` — `KEPT` — `SHIPPED` — `WONTFIX` — `OPS` — `DEFERRED`

**Format:**

```
### YYYY-MM-DD — STATUS — short title
- Version / commit / APK: …
- User intent: …
- Agent action: …
- Notes: …
```

### 2026-10-23 — OPS — 4.5.0 controller + touch-hide + hero refresh (branch only, NOT shipped)
- Version / commit / APK: **4.5.0** / versionCode **103**; branch `update-4.5-controller-hero` (based on `wip-snapshot-20261023` = exact Play 4.4.0 source, hash-verified against `playstore\TemporalRift-4.4.0.aab`); **not merged to master, not pushed, not uploaded to Play**
- User intent: next update = (1) game controller support, (2) hide on-screen touch controls (auto when a pad is used + Settings toggle), (3) upgraded main-character look; build on the latest code; no publish/push/merge.
- Agent action: Gamepad API layer (`pollGamepad` per frame; radial deadzone 0.20, trigger 0.35; twin-stick move/aim with auto-aim when right stick idle; RT/A fire, LT beam hold, B/L3 dash, X nova, Y talk/hold-revive, LB grenade, RB ascend, D-pad ↑ vehicle ↓ build ← mend → colossus, R3 inspect nearest building/turret, Start pause, Back skills); spatial D-pad navigation + gold focus ring for every overlay (title, shop, vendor, infirmary, Rift-Net, skill tree, build pick, struct/unit panels, pause/sound/controls, game over, dialogs); `settings.touchCtl` auto/show/hide (persisted in `tr_settings`); Settings ▸ CONTROLS panel with live pad status + full layout; contextual Talk/Mend/Colossus/Bike buttons become non-touch button prompts while a pad is active; new `drawHero()` (procedural, SIZE LOCK kept, hitbox unchanged, flag `HERO_V45_ENABLED`); `MainActivity.dispatchKeyEvent` swallows unhandled pad keys (B can't fall back to BACK); manifest `android.hardware.gamepad required=false`.
- Notes: smoke town-save / build-place / continuous-map ALL PASS (version pin → 4.5.0); headless Chromium pad suite 43/43 with simulated XInput pad; 4.4.0 save + settings load clean. Needs on-device check with a real controller before Play upload. Weapon-cycle (LB/RB) not mapped — the game has no in-run weapon swap (loadout is chosen in the shop).

### 2026-09-22 — SHIPPED — Step 10.7 arc gate → 4.4.0 (BETA + Play AAB)
- Version / commit / APK: **4.4.0** / versionCode **102** / BETA `rollouts\TemporalRift-BETA-4.4.0.apk` (+ Desktop) / Play `playstore\TemporalRift-4.4.0.aab` + `rollouts\` + Desktop + `mapping-4.4.0.txt`
- User intent: close Step 10 with the arc gate; then give click-by-click Play Console steps for monetization/purchase; after drag-drop, agent takes over full publishing (pre-authorized 2026-09-17). User asked whether Google treats the upload as a new game.
- Agent action: bump APP_VERSION/APP_VCODE + gradle → 4.4.0/102; www sync; smoke ALL PASS; `build-beta.ps1` + `build-all.ps1` (Play AAB verified channel=play); docs (v4.4-roadmap, step-10-plan, CHANGE_MEMORY matrix+changelog, this row). GitHub debug APK copy in build-all hit a Windows file-lock at the very end — Play AAB + BETA are the shippable artifacts and both landed.
- Notes: **Google will NOT treat this as a new game** if uploaded to the existing `com.drpep.temporalrift` listing — it is a version update (vc102 supersedes prior Open testing builds). A new listing would only happen if a different package name / Create app were used. Standing next-action: user drag-drops the AAB (or asks agent to publish) → full Console publish + pricing/monetization path.

### 2026-09-17 — SHIPPED — Step 10.6 balance + water placement gate
- Version / commit / APK: **4.3.7** / versionCode **101**; code + www synced (hash-verified); **no APK, no git commit** (arc gate **10.7** is next — nothing blocks it)
- User intent: sixth and LAST code sub-step before the 10.7 arc gate — the balance/soft-wire pass plus the water placement gate the 10.5 entry deferred here; **standing next-action (user pre-authorized 2026-09-17):** after the **4.4.0** APK is built at 10.7 the user will **drag-drop it in the Cursor tab and the agent takes over full publishing**
- Agent action: **water placement gate** — `placementWaterBlockedAt(bx,by,r)` (pad center + 8 footprint-edge probes vs `isLakeWaterAt`/`isOnDock`/`isOnIslePier` — a shoreline pad can't overhang the waterline; pier decks are a walkway, not a foundation, keeping the skiff boarding lanes clear) wired as the first clause of all three spot-blocked helpers (`barricadeSpotBlocked`/`brickWallSpotBlocked`/`structureSpotBlocked`) so the tap refusal AND the red ghost share the stock "NO ROOM" feedback; **no new flag** (10.5 leash precedent) — the gate rides the lake flags and no-ops flip-verified with `LAKE_WATER_ENABLED` off; **balance rows LOCKED, zero knob changes** — the plan's 10.6 row lists areas without new targets and every shipped const already sits on the plan draft (drift 1.30×/≈1.1s/0.8s vs bike 1.85×; 10s grace/3 HP/s drain; repair 40🪵+10◈ vs bike 30/18; cache 60◈/6⬤/8⬡; swim 0.55×/84px; `BOAT_FUEL_MODEL='none'` A locked, B deferred) — all now smoke-asserted; **soft-wire audit** — 7/7 Step 10 flags independent `const NAME = true;` literals per the plan table (regex-asserted) + scratch flip runs booted the game with each flag false alone (newGame clean ×7, surfaces no-op correctly; scratch deleted after)
- Notes: smoke `test-continuous-map.js` Step 10.6 block (**20 checks** — gate on all three paths over open water, Emberfall deck dry+wet planks, isle mini-pier deck, center-dry bare pass vs keep-r54 overhang refusal, camp arena + Orange Quarter analytically unaffected, end-to-end tap refused over water then landing on open dry shore meadow, balance locks, soft-wires, mines purged, 10.5 leash quick-regression) — **ALL PASS ×3 stable**; town-save PASS; **build-place PASS** (the arena-parity proof: the same camp placement spot as pre-10.6 still places); `test-channel.js` known-broken on stock — ignored; **no pre-existing checks loosened**; saves untouched (gate is placement-time only — 4.3.6 saves load clean); **shore-meadow mine re-seat NOT taken** — the plan's 10.6 row says "only if user opted in" and the user hasn't: 4 purged camp mines / 3 stands stay gone, **user opt-in still open before/after 10.7**; one prompt-vs-plan discrepancy resolved plan-side (prompt recap said skiff repair "10 coal" — plan + code say 10 ◈ gold; plan wins, nothing changed); next user "next" = **10.7 ARC GATE** → **4.4.0** BETA APK (`build-beta.ps1`, Play AAB optional, then the pre-authorized drag-drop publish flow above)

### 2026-09-17 — SHIPPED — Step 10.5 Water rules + shaman swim
- Version / commit / APK: **4.3.6** / versionCode **100**; code + www synced (hash-verified); **no APK** (arc gate 10.7)
- User intent: fifth code sub-step of Step 10 — the lake can never break a wave, and threats near the shore stay honest; **ships the user's 2026-09-16 request** ("maybe a swimming feature for one of the bad guys (magic one seems best) for camping") — the Ashen Shaman, alone, follows a water-camping player into Ashmere
- Agent action: soft-wire `SHAMAN_SWIM_ENABLED` (magic caster ONLY — behavior on the existing type, no new ETYPES; bosses/decade bosses excluded); `updateShamanSwim` enters the water when the target is the player over lake water (skiff-afloat or pier deck) and the caster stands within 84px of the waterline (`lakeShoreDistOnRay` unit-ray solve — the raw field's bbox early-out returns 9 across the dry band and can't gate it); while swimming: `waterOk` bypasses `clampLakeShore` (the 10.1-designed opt-out), **0.55×** speed head-above-water stroke, **casting fully cut** via `enemyCanCast` (contact poke breaks the camp; staff resumes ashore), straight-line steer (skips the 9.3 slide — nothing to dodge in water, and rim-adjacent probes must not phantom-slide off isle grove trees), 260px ranged comfort band dropped (closes to contact); `clampSwimmerToWater` in the `collideObstacles` tail radial-clamps swimmers to isle.r+8 — **Driftwood Isle stays enemy-free** (a crossing swimmer rounds the rim; smoke: minIsle=188 exactly, reaches the far pier head); target ashore/on dry isle → stroke home via `lakeNearestShore`, first dry step exits; `drawShamanSwimming` head+shoulders above a surface clip line (body sunk 26px, feet shadow clipped), ripple rings + V-wake, sprite or procedural fallback; **shore leash** — `lakeLeashApplies`/`pickLakeLeashTarget`: melee non-boss enemies whose prey camps over water re-target the nearest land threat (militia → companions → titan → structures) or hold a `lakeShoreHoldPoint` patrol slot (46px loose ring — no waterline pile-in jitter); ranged casters keep plinking the camper (ebolts/bolts cross water both ways — verified, zero code); **ally clamps** — `deployColossus` + `syncCompanions` spawns ride `lakeGuardSpawnPos` (CALL TITAN while afloat lands the titan ashore, pad 60 for r54)
- Notes: smoke `test-continuous-map.js` Step 10.5 block (**22 checks**) + `simEnemyWaterFrame` harness — swim gates caster-only, enters/closes/exits (player mid-lake → contact ≈0px; back ashore → swimmer beaches + exits), measured stroke ≤ 0.55× land step, cast gate on/off, isle rounding, leash re-target + patrol-slot stability (far=47 vs 46 ring), titan/ally dry, stall-proof pack (finite/targetable/counter → killable → 0, mid-water kill drops ashore), swim draw smoke on/off camera, save schema untouched + 4.3.5-schema load clean — **ALL PASS ×3 stable**; town-save + build-place PASS; **no pre-existing checks loosened** (10.4 isle shove sim uses plain walkers — untouched); pier-head campers inside the caster's 260px band get plinked rather than swum at (plan's ranged-harassment row — swim covers mid-lake/out-of-band camping); **water placement gating deliberately NOT shipped** — the plan's 10.5 checklist omits it → flag for **10.6** balance/soft-wire pass alongside drift/drain/cost tune; next user "next" = **10.6**

### 2026-09-17 — SHIPPED — Step 10.4 Driftwood Isle
- Version / commit / APK: **4.3.5** / versionCode **99**; code + www synced (hash-verified); **no APK** (arc gate 10.7)
- User intent: fourth code sub-step of Step 10 — the island content payoff: a mini-pier second berth so the crossing has a destination, the one-time Greywater ferry cache (the "river dried" lore made tangible), and a small player-only grove; dock/skiff/lake feel unchanged, isle stays enemy-free
- Agent action: soft-wire `LAKE_ISLE_REWARD_ENABLED` (off = bare isle exactly as 10.3); deterministic `LAKE_ISLE_PIER` on the isle rim facing the dock (rim-radius waterline solve — the carve is an exact circle; len 100 / half-w 19 / 24px apron / moor +22px off the head); player-only `isOnIslePier`+`clampToIslePierDeck` in `clampLakeShore` (10.2 dock consts shared) **plus a new player-only isle-rim catch** — wet inside the isle shallow ring clamps back onto the isle rim, not the outer shore (kills the ~600px cross-strait teleport a rim walk-off used to solve to); `tryDismountBoat` second berth (≤120px of the isle moor → `moorDockId='isle'`, rider on the mini-pier head, rope cleat follows the berth) and `loadGame` restores the isle berth exactly; `seedDriftwoodIsle` worldgen (post-purge, pre-grid: strays cleared off the isle disc, cache crate + 4 `isle`-tagged trees + 6 driftwood/reed/cattail decor, all dry, clear of apron/cache-ring/shore-slide); `tryOpenIsleCache` walk-over ≤46px once-ever → **+60 ◈ +6 ⬤ +8 ⬡** direct credits + lore floater + banner, `isleCacheOpened` in `world.lake` (4.3.4/older saves load unclaimed); `tickIsleContent` walk-up auto-chop on laborer cadence (1.15s, +1 🪵, chop sfx/chips; refused downed/mounted); `pickChopTarget` skips `o.isle` (player-chop only per plan); `drawIslePier`/`drawIsleCache` (mini Emberfall plank language; crate closed = beacon+label, opened = lid-ajar lore scenery)
- Notes: smoke `test-continuous-map.js` Step 10.4 block (**37 checks**) — consts/reward row vs plan, pier base dry + head/moor wet + SE facing, worldgen dry/clearance probes (apron/cache-ring/decor), full crossing (repair → board → isle moor → deck dismount), deck standable + edge-shove clamp, isle-berth save round-trip + re-board + row home re-moor at Emberfall, rim walk-off clamps to the isle (no strait teleport), cache exact-once/refused-twice/persists/4.3.4-node-unclaimed/newGame-reset, chop drain+credit+cadence gate, laborer picker skip, enemy 12s shove never wet (minIsle≈554px), headless draw smoke on/off camera — **ALL PASS ×3 stable**; town-save + build-place PASS; **one pre-existing check loosened with comment** (9.1 `lake bowl clear` now ignores `o.isle` trees — the grove is deliberate isle content inside the reserve rect; still bans every stray worldgen tree); 10.5 shaman-swim amendment kept intact in the plan; next user "next" = **10.5** water rules + shaman swim

### 2026-09-16 — SHIPPED — Step 10.3 Ashen Rift Skiff
- Version / commit / APK: **4.3.4** / versionCode **98**; code + www synced (hash-verified); **no APK** (arc gate 10.7)
- User intent: third code sub-step of Step 10 — the player's first boat, mirroring the 8.3 bike flow water-side: derelict wreck beached by the dock → walk-up repair (wood-heavy) → owned skiff moored at the 10.2 moor point; boards at the pier, moves ONLY on water, no fuel (free rowing locked at 10.0), no launching mid-wave; bike/dock/lake untouched. **Same day the user also asked** (2026-09-16): "maybe a swimming feature for one of the bad guys (magic one seems best) for camping" — recorded as a **10.5 plan amendment** (shaman-only SWIM, `SHAMAN_SWIM_ENABLED`, slow head-above-water pursuit, casting cut while swimming), NOT implemented this step
- Agent action: soft-wires `BOAT_ENABLED` / `BOAT_WAVE_GATE_ENABLED` / `BOAT_FUEL_MODEL='none'` (whole kit no-ops if the lake is off); `buildBoatWreck` beaches a waterlogged hull one deck-width west of the pier base via the 10.1 waterline solve (dry, inside the 10.2 cleared strip, scenery not obstacle); `tryRepairBoat` **40🪵+10🜚** → skiff owned + moored at `moorX/moorY`; `tryVehicleAction` unifies V-key/`btnBike` for bike AND boat (nearest actionable wins, bike behavior identical when no skiff in range; HUD flips 🏍/🔧/⛵ with costed labels); `mountBoat` within 95px (refused mid-wave "THE HORDE CALLS — SHORE FIRST" / downed / on bike) → rider gains `player.waterOk` (the 10.1 designed opt-out) and the hull carries him; `boatThrustFrame` thrust ≈1.1s to top (**1.30×** walk; bike keeps 1.85×) + glide half-life 0.8s, dash blocked afloat, weapons still fire (8.4 parity); `clampSkiffToWater` rides the `collideObstacles` tail (player+mounted only) — inverse radial solve keeps the hull ≥12px wet inside the shoreline and outside the isle rim, slides along both edges, zero-distance NaN guards; `tryDismountBoat` only near the moor (≤120px → snap re-berth + rider on the pier head) or in shallows (skiff beaches where left, `boatStepAshore` lands the rider on the **nearer** of outer shore / isle rim — no cross-strait teleports), refused in deep water; `tickBoat` wave-caught-afloat = 10s grace floater → **3 HP/s** ash drain to the poison hp-floor/downed path (pauses while downed, clears ashore); additive save `world.lake { boatOwned, moorX, moorY, moorDockId }` — missing node (≤4.3.3) = wreck, deep-water/dry/NaN saved hull re-moors at the dock, never loads mounted; procedural skiff draw (wreck planks+drip / moored+slack rope to the pier cleat / ride pose with braced rider, ember stern lantern, velocity wake arcs + foam, camera-culled, no ctx.filter)
- Notes: smoke `test-continuous-map.js` Step 10.3 block (**53 checks**) — consts/flags, wreck dry+cleared placement, repair spend/refusal paths, mount gates (wave/downed/bike/range), waterOk lifecycle, thrust reaches top + glide decays + heading drift, land/isle shove clamps stay wet no-NaN, dock + shallow dismounts land dry (isle-side lands on isle), deep dismount refused, wave-gate grace→drain→downed-pause→ashore-clear, save→load round-trip + ≤4.3.3 missing-node migration + stranded-hull re-moor + never-loads-mounted, `tryVehicleAction` routing incl. bike-parity guard, headless draw smoke all poses+rope — **ALL PASS ×3 stable**; town-save + build-place PASS (save schema addition verified additive); **no pre-existing checks loosened**; one physics fix mid-run (glide decay was eating thrust — decay now only when input idle, matching the plan's "≈1.1s to top" feel); enemies/minimap untouched (water rules 10.5 — swimmer amendment filed there; no skiff minimap dot in plan); bike kit verified unchanged (all BIKE_ consts + flow intact); next user "next" = **10.4** Driftwood Isle (mini-pier moor, Greywater ferry cache, isle trees)

### 2026-09-16 — SHIPPED — Step 10.2 Emberfall Dock
- Version / commit / APK: **4.3.3** / versionCode **97**; code + www synced (hash-verified); **no APK** (arc gate 10.7)
- User intent: second code sub-step of Step 10 — the SE shore reads as a destination before the boat exists: a wooden pier the player (and only the player) can walk out over the water, a moor snap point ready for the 10.3 skiff, shoreline dressing, and the ASHMERE label; the 10.1 lake envelope must not move
- Agent action: soft-wire `LAKE_DOCK_ENABLED`; deterministic `LAKE_DOCK` frame snapped to the exact 10.1 waterline solve on the camp-facing ray (base ≈(1925,1915), 28px dry apron, len 150 / half-width 23, head ≈122px past the waterline, `moorX/moorY` +24px off the head with moor post/cleat/rope hint); `isOnDock` + `clampToDockDeck` player-only deck catch inside `clampLakeShore` (`ent === player`; dot-product frame, no zero-length divides; side/head edge clamps keep the player on the planks; enemies/allies still shore-clamp and never walk the pier); `seedEmberfallDock` clears the deck+apron of random obstacles (pre-grid) and seeds 12 deterministic non-colliding decor (reed/cattail/driftwood fan + ember lantern + rope crate, all dry); `drawEmberfallDock` above water below entities (bbox cull, no ctx.filter); ASHMERE row in `REGIONS` (bottom flash only, `lakeFieldAt<1.35` band — ENTERING popup stays REMOVED)
- Notes: smoke `test-continuous-map.js` Step 10.2 block (30 checks) — dock consts/axis, base+boarding strip dry, head+moor open water past shallows, isOnDock rect probes, player mid-pier survives `collideObstacles` unmoved (waterOk false), side/head shoves clamp back onto the deck, enemy mid-pier shore-clamps dry + 12s moor-chase sim never wet, approach clear of obstacles, decor dry/non-colliding/kinds, ASHMERE first-match label with camp/fields neighbors unchanged, headless draw smoke on+off camera — **ALL PASS ×3 stable**; town-save + build-place PASS; **no pre-existing checks loosened**; 10.1 geometry/envelope untouched (dock reads the solve, never writes); pier-head mid-wave camping intentionally left to 10.5 water rules (melee foes wait ashore, shaman bolts already reach); no save-field changes (dock is pure worldgen; boat state lands 10.3); next user "next" = **10.3** Ashen Rift Skiff

### 2026-09-16 — SHIPPED — Step 10.1 Ashmere water body
- Version / commit / APK: **4.3.2** / versionCode **96**; code + www synced (hash-verified); **no APK** (arc gate 10.7)
- User intent: first code sub-step of Step 10 — the lake exists, looks like water, and nothing on legs can enter it; camp/waves/corridors/town untouched on dry land
- Agent action: soft-wires `LAKE_WATER_ENABLED`/`LAKE_SPAWN_GUARD_ENABLED`; `LAKE_BLOB` superellipse (cx1420,cy1400 a700 b660 n2.2, shrink-only wobble keeps the plan envelope) + `LAKE_ISLE` dry carve (content 10.4); helpers `lakeFieldAt`/`isLakeWaterAt`/`isLakeShallowAt`/`lakeNearestShore`/`lakeGuardSpawnPos`/`clampLakeShore`/`lakeShoreTangent`; shore clamp rides `collideObstacles` (player/enemies/militia/companions/laborers/hold units/Colossus; `ent.waterOk` = 10.3 skiff hook); 9.3 steer slides enemies along the shore; spawn guards on `spawnEdgePos` both branches + `spawnDecadePathPos` + graves + bulwark fusion + wave supply chest + death drops; `purgeLakeReserveContent` extended to purge blob obstacles/decor (4 purged camp mines / 3 stands stay gone per plan — user re-seat decision deferred to 10.6); `water` tile kind + `drawLakeWater` (cached shoreline polygon from the same field as collision, shallow band, foam, shimmer glints, camera-culled, no ctx.filter) + minimap patch (fog Version B keeps it visible)
- Notes: smoke `test-continuous-map.js` Step 10.1 block — geometry envelope (water ⊂ reserve, camp 380 dry ring + circle-edge 380, N/W corridor+approach walks), worldgen purge, 200-roll spawn guard at the shore, enemy 12s shove-at-shore sim never wet, zero-distance NaN guard, minimap headless smoke — **ALL PASS ×6 stable**; loosened two legacy-mine checks ≥4→≥3 with comments (pre-existing placement roll, measured {3:1, 4:13, 5:16}/30 on stock — water purge never touches goldMines); fixed stale `test-town-save.js` 'captain build order 4 stages' → 5 stages (stale since 8.4 bikeshed; failed on stock 4.3.1, verified); `test-channel.js` FAILs on stock 4.3.1 too (pre-existing, out of 10.1 scope); no save-field changes (worldgen deterministic; boat state lands 10.3); next user "next" = **10.2** Emberfall Dock

### 2026-09-16 — SHIPPED — Step 10.0 lake/boats plan (Ashmere + Rift Skiff)
- Version / commit / APK: still **4.3.1** / vc**95**; plan only, no code / no APK
- User intent: start Step 10 lake+boats arc — water in the 9.1 NW bowl, dock, repairable boat mirroring the bike flow, a reason to cross, nothing breaks waves
- Agent action: wrote `docs/v4.4-roadmap.md` + `docs/step-10-plan.md` (ladder 10.1–10.6 → gate **4.4.0**/vc**102**; interim **4.3.2–4.3.7** / vc**96–101**); pointed `v4.3-roadmap.md` status + CHANGE_MEMORY docs index at Step 10
- Notes: **bowl truth locked** — shipped `LAKE_RESERVE` is the legacy **NW quadrant** (camp sits inside the rect; 9.1 purge of 4 camp mines + 3 stand groves is smoke-asserted), so 10.1 water = **blob subset** dodging camp circle + N/W path approaches + spawn walks; skiff = **free rowing** (`BOAT_FUEL_MODEL='none'`, shared-fuel B deferred) + **wave gate** (no launch mid-wave; ash-water drain if caught afloat); enemies never enter water (shore leash); spiders can't reach the lake (exterior-only 4.3.1 kept); reward = Driftwood Isle ferry cache + isle trees; REMOVED untouched; next user "next" = **10.1** water body

### 2026-09-01 — SHIPPED — Step 9.7.1 spider hunt + explode tune (4.3.1 BETA)
- Version / commit / APK: **4.3.1** / versionCode **95** / **`rollouts\TemporalRift-BETA-4.3.1.apk`**
- User intent: spiders find/attack player; explode ~half HP; more aggressive hits; ash spiders must not stall wave end (lost spider in gray)
- Agent action: `SPIDER_HUNT_ENABLED`, border stalk + extended web, wave-scaled spider stats, `countWaveEnemiesRemaining()` HUD, explode `maxHp()*0.5`, no leash despawn mid-wave, `exteriorOnly` hard-set on all ash spiders

### 2026-09-01 — SHIPPED — Step 9.7 arc gate (4.3.0 / vc94 BETA)
- Version / commit / APK: **4.3.0** / versionCode **94** / **`rollouts\TemporalRift-BETA-4.3.0.apk`**; www synced
- User intent: close Step 9 arc with sideload BETA for playtest + debug confirmation upload
- Agent action: version bump 4.3.0/vc94; `build-beta.ps1`; full 9.1–9.6 stack in APK
- Next: user playtest + debug upload; **Step 10** lake/boats when ready

### 2026-09-01 — SHIPPED — Step 9.6 balance (hub / dens / climb / trees)
- Version / commit / APK: **4.2.6** / versionCode **93**; code + www synced; **no APK** (gate at 9.7)
- User intent: tune Step 9 features after layout/pathing/decade stack; keep Orange Quarter readable; spiders on gray highways not in hub; fair climb cap
- Agent action: `ORANGE_QUARTER_TREE_CLEAR_PAD` 54; `EXTERIOR_SPREAD_HOLD_PAD` 150; `ENEMY_CLIMB_MAX_OBST_R` 20; `spiderDenCountForWave()` 2–4 (+1/8 waves); `SPIDER_DEN_LEGACY_EXCLUDE`; grove n trim
- Next user “next” = **9.7** arc gate **4.3.0** BETA APK

### 2026-09-01 — SHIPPED — Step 9.5 decade stack queue + path spawns
- Version / commit / APK: **4.2.5** / versionCode **92**; code + www synced; **no APK** (gate at 9.7)
- User intent: decade bosses (W/10 stack, −10 hardness each) spawn on cleared N/S/E/W path stubs instead of tree wall; on-screen budget queues extras; all tiers still arrive
- Agent action: `DECADE_STACK_QUEUE_ENABLED`, `spawnDecadePathPos()`, `queueDecadeBossStack()`, `tickDecadeBossQueue()` (one dequeue per tick when on-camera slot free); `makeDecadeBossAt()` refactor
- Next user “next” = **9.6** balance

### 2026-09-01 — SHIPPED — Step 9.4 gray fog shroud + wave spider dens
- Version / commit / APK: **4.2.4** / versionCode **91**; code + www synced; **no APK** (gate at 9.7)
- User intent: Warcraft-style gray on explored-but-out-of-vision exterior; wave-start spider dens refresh each wave; Burstweaver can spawn from gray while player in core; legacy core never gray
- Agent action: `FOG_SHROUD_ENABLED`, `SPIDER_DEN_ENABLED`, `isFogChunkInVision`/`isFogChunkShrouded`, `stampSpiderDensOnWaveStart()`, den-first spawn in `pickBurstweaverSpawnPos`; 20s leash kept
- Next user “next” = **9.5** decade stack queue

### 2026-09-01 — SHIPPED — Step 9.3 enemy steer / climb
- Version / commit / APK: **4.2.3** / versionCode **90**; code + www synced; **no APK** (gate at 9.7)
- User intent: enemies slide around blockers instead of pinning on border ring; vault small trees/rocks; decade/Gharok use same rules; no A*; player/laborers unchanged
- Agent action: `ENEMY_STEER_ENABLED`, `updateEnemySteerState()`, tangent slide + `climbT` hop, `simEnemySteerFrame()` for smoke; bosses included
- Next user “next” = **9.4** gray fog + wave dens

### 2026-09-01 — SHIPPED — Step 9.2 Orange Quarter (hold reposition + save migrate)
- Version / commit / APK: **4.2.2** / versionCode **89**; code + www synced; **no APK** (gate at 9.7)
- User intent: one orange neighborhood SE inside legacy (marsh + path fork); Sunfall + Eastwatch stay at gates; preserve all 10 hold IDs/captains/saves/harvest/bike
- Agent action: `ORANGE_QUARTER_ENABLED`; 8 holds in staggered SE grid (~3860–4640, ~3960–4440); `migrateOrangeQuarterOnLoad()`; `clearTreesInHoldFootprints()`; exterior harvest belts retargeted E/S of Quarter; defenses face camp
- Next user “next” = **9.3** enemy steer/climb

### 2026-09-01 — SHIPPED — Step 9.1 map zones + spread trees + lake bowl reserve
- Version / commit / APK: **4.2.1** / versionCode **88**; code + www synced; **no APK** (gate at 9.7)
- User intent: thin legacy border ring; spread purple-ring surplus into exterior groves beside bike lanes; reserve NW bowl for Step 10 lake; keep bike highways trunk-free
- Agent action: `EXTERIOR_TREE_SPREAD_ENABLED`, `LAKE_RESERVE`, `BIKE_TRAIL_LANES`, `buildExteriorSpreadTrees()`, `purgeLakeReserveContent()`, thinner `buildLegacyBorderRing()`; smoke tests Step 9.1 block
- Next user “next” = **9.2** Orange Quarter (hold reposition SE inside legacy)

### 2026-09-01 — SHIPPED — Step 9.0.1 layout revision (Orange Quarter + bike lanes + lake reserve)
- Version / commit / APK: still **4.2.0** / vc**87**; plan only
- User intent: trees mapped for bike driving; reserve NW for Step 10 water; move orange villages to SE bottom-right **inside** legacy purple ring (path-fork “pad”) so player + orange allies share one place; lose nothing we built
- Agent action: expanded `docs/step-9-plan.md` + `docs/v4.3-roadmap.md` — 9.1 zones/trees, **9.2 Orange Quarter**, renumber 9.3–9.7; preservation contract for all 10 holds/captains/saves/harvest/bike
- Next user “next” = **9.1** map zones + trees (hold move waits for **9.2**)

### 2026-09-01 — SHIPPED — Step 9.0 plan (trees / steer / gray fog / decade stack)
- Version / commit / APK: still **4.2.0** / vc**87**; plan only, no code
- User intent: spread purple-ring trees into exterior; enemies go around or climb obstacles; Warcraft gray fog + wave-start dens so spiders keep spawning; decade bosses every 10 as stacked hardness (50→5 bosses at 50/40/30/20/10); bike sprite after APK test
- Agent action: wrote `docs/v4.3-roadmap.md` + `docs/step-9-plan.md`; lake/boats moved to **Step 10**; bike mesh stays deferred post-4.2.0 APK
- Continuity: decade formula already exists (`decadeBossTiers`) — 9.4 is arrival + on-screen queue; fog Version B core stays clear; REMOVED untouched; next user “next” = **9.1** trees

### 2026-09-01 — SHIPPED — Field gold/coal mines use vault mine-mouth sprites
- Harvestable gold mines (`drawGoldVein`) now draw `assets/buildings/vault/idle.png` via `GOLD_MINE_SPRITE_ENABLED`; coal uses same sheet with dark gray tint; procedural fallback if sheet missing

### 2026-09-01 — SHIPPED — Step 8.7 arc gate (4.2.0 / vc87 BETA)
- Version / commit / APK: **4.2.0** / versionCode **87** / **`rollouts\TemporalRift-BETA-4.2.0.apk`**; www synced
- Full Step 8 exterior travel arc closed; Play AAB optional later; bike mesh art deferred

### 2026-09-01 — SHIPPED — Step 8.6 balance (4.1.10 / vc86, no BETA)
- Version / commit / APK: **4.1.10** / versionCode **86** / **no BETA APK** (arc gate 8.7); www synced
- Fuel 3.6/s, repair 30/18, brood wave≥12, spider cap 24, shed +8 fuel

### 2026-09-01 — SHIPPED — Step 8.5 Broodmother (4.1.9 / vc85, 8–10 spiderlings, no BETA)
- Version / commit / APK: **4.1.9** / versionCode **85** / **no BETA APK** (arc gate 8.7); www synced
- Fat scaled Burstweaver matriarch; birth swell → 8–10 mini spiderlings; coal loot

### 2026-09-01 — SHIPPED — Step 8.4 hold links (4.1.8 / vc84, shoot on bike, no BETA)
- Version / commit / APK: **4.1.8** / versionCode **84** / **no BETA APK** (arc gate 8.7); www synced
- Park at hold brick pad / bikeshed; captain bikeshed stage; trail marker; guns while mounted

### 2026-09-01 — SHIPPED — Step 8.3 dirt bike (4.1.7 / vc83, v3 art placeholder, no BETA)
- Version / commit / APK: **4.1.7** / versionCode **83** / **no BETA APK** (arc gate 8.7); www synced
- User intent: “next for 8.3 just use v3 art for now”
- Agent action: `DIRT_BIKE_ENABLED`; east trailhead wreck + smoke; repair 35🪵+22🜚; mount/dismount (V/🏍); v3 concept sheet crops; fuel burn; legacy gate; no weapons mounted; knock-off; save/load
- Continuity: mesh art still DEFERRED after 8.7; next = **8.4** hold links

### 2026-09-01 — DEFERRED — dirt bike art mesh (return after Step 8 complete)
- Version / commit / APK: **no version bump** — plan/docs only
- User intent: bike previews (v1–v3) still look bad / AI-assembled; “not like how we meshed orcs”; **save response and come back after all the 8’s done**
- Agent action: locked decision in `docs/dirt-bike-art-plan.md` ⏸ DEFERRED section — orc mesh = trait table + per-pose sheets + `process-*-sprites.mjs`; 8.3 gameplay uses procedural placeholder; real `idle/ride/wreck` mesh pass **after 8.7** (same pipeline as Ravager/Cyclope)
- Notes: preview HTML + concept v2/v3 kept as audit; refs in `assets/vehicles/dirtbike/_refs/`; trait table + glow/bone/wreck smoke prefs preserved for return pass

### 2026-09-01 — SHIPPED — Step 8.2 fuel economy (4.1.6 / vc82, no BETA)
- Version / commit / APK: **4.1.6** / versionCode **82** / **no BETA APK** (arc gate 8.7); www synced
- User intent: refuel at existing camp buildings (no new shed sprite); “next” after 8.1 coal
- Agent action: `FUEL_ECONOMY_ENABLED`; player `fuel` 0–100; 1 coal→10 fuel at Keep/Timber/Vault/Muster/Pit; HUD fuel bar; save/load; burn stub for 8.3; tests PASS
- Continuity: coal 8.1 / Debug / REMOVED untouched; next = **8.3 dirt bike** (procedural art)

### 2026-08-31 — SHIPPED — Step 8.1 exterior coal mines (4.1.5 / vc81, no BETA)
- Version / commit / APK: **4.1.5** / versionCode **81** / **no BETA APK this pass** (arc gate 8.7); www synced
- User intent: “next” after locking coal look = gray/black gold-mine recolor
- Agent action: `EXTERIOR_COAL_ENABLED`; 6 exterior `coalMines`; drawCoalMine charcoal palette; hold/player harvest → coal banks; HUD + save; tests
- Continuity: gold mines / orangeSp / Debug / NaN kept; REMOVED untouched; next = **8.2 fuel**

### 2026-08-31 — KEPT — coal mines = gold-mine silhouette, gray/black recolor (Step 8.1 art)
- User intent: for coal mine look, just color the gold mines gray and black
- Agent action: locked in `docs/exterior-travel-plan.md` Pillar A — reuse gold mine draw/footprint/enter; charcoal palette; dark minimap blip; no new mesh in 8.1
- Continuity: gold mines inside legacy + exterior gold keep yellow look; only `resource:'coal'` / coal sites use gray-black

### 2026-08-31 — SHIPPED — Step 8.0 exterior travel plan (coal / fuel / dirt bike / Broodmother)
- Version / commit / APK: **plan only** — APP stays **4.1.4** / vc**80**; **no code / no APK**
- User intent: pregnant spider + lake/boats later; dirt bike + coal fuel as reason to visit exterior; “do Step 8 — start with plan”
- Agent action: wrote `docs/v4.2-roadmap.md` (8.0–8.7) + `docs/exterior-travel-plan.md`; deferred lake/boats to Step 9; order coal → fuel → bike → hold links → Broodmother → balance → 4.2.0 gate
- Continuity: legacy core frozen; REMOVED untouched; next user “next” = **8.1 coal mines**

### 2026-09-01 — SHIPPED — 4.1.4 captain aura render crash (guys vanish; BETA)
- Version / commit / APK: **4.1.4** / versionCode **80** / BETA `rollouts\TemporalRift-BETA-4.1.4.apk` + Desktop / **no Play AAB** / no git commit
- User intent: pasted Debug Copy Report from wave 13 soft-lock
- Agent action: root cause = `drawFigure` aura `hex+'99'` fed `rgba(...)` from captain → throw every frame; fix hex + harden regex gate
- Continuity: Debug menu / NaN / grids kept; REMOVED untouched

### 2026-08-31 — SHIPPED — 4.1.3 NaN auto-recover + Debug menu (guys-disappear soft-lock; BETA)
- Version / commit / APK: **4.1.3** / versionCode **79** / BETA `rollouts\TemporalRift-BETA-4.1.3.apk` + Desktop / **no Play AAB this pass** / no git commit
- User intent: still "freezes" but clue — menus work, guys disappear, can't move; wants a Debug menu button for screenshots, done right
- Agent action: NaN sentinel + auto-recover every frame; pointer clientX/Y guards; rAF try/catch so throws don't kill the loop; error ring (20) + localStorage; BETA-only Debug overlay in pause menu (live telemetry + Copy report)
- Continuity: 4.1.2 grids/villages/showcase/combat kept; REMOVED untouched
- Verify: smoke tests PASS; BETA vc79 / beta id / `TR_CHANNEL='github'`

### 2026-08-31 — SHIPPED — 4.1.2 freeze round 2 (spatial grids + watchdog) + 10 villages + guaranteed build + holds fight (BETA)
- Version / commit / APK: **4.1.2** / versionCode **78** / BETA `rollouts\TemporalRift-BETA-4.1.2.apk` + Desktop / **no Play AAB this pass** / no git commit
- User intent: 4.1.1 retest — (1) STILL froze (draw fixes insufficient), (2) wants more exterior villages, (3) still never saw a structure go up, (4) hold units sit passively instead of fighting — fix all four
- Agent action — **freeze round 2 (P1), the compounding-scan tier the 4.1.1 draw pass didn't touch:**
  - `collideObstacles`: linear scan of ALL ~1200–1600 obstacles × EVERY moving entity × every frame (≈300–500k dist checks/frame at deep waves) → static spatial hash `obstGrid` (256px cells, rebuilt once after `buildWorld`; obstacles never change post-worldgen — stumps persist, hold walls pushed during build)
  - Projectile blocked-tests: `obstacles.some(...)` full scans for every bolt/cbolt/sbolt/ebolt/grenade each frame → `obstacleBlockedAt` grid query (tree-pass rule preserved per projectile type)
  - Enemy separation O(n²) all-pairs (30–60k pairs/frame at 150–250 live) → per-frame `enemyGridMap` (128px buckets) + `forEachEnemyNear`; militia aggro scan (militia×enemies) and sentry target scan (barricades×enemies) moved to the same grid
  - 4.1.1 additions audited clean: offline-SP `while` bounded by dt clamp; only bounded `while` loops in sim; pickups expire 30s; save payload bounded (exterior statics re-derive from worldgen; fog = packed bytes); no timer/listener pile-ups
  - **PERF_WATCHDOG** (BETA only — `TR_CHANNEL !== 'play'`): per-frame section marks (player+fog/weapons/spawning/enemies/allies+holds/projectiles/fx/camera+hud/draw/save); frame ≥2s → console.error + banner naming slowest section + report → `tr412_watchdog_report`; next launch banners "LAST SESSION FROZE — Xs in SECTION (wave N)" so the tester's next report pinpoints any freeze we didn't reproduce
- Agent action — **villages (P2):** 6 new worldgen-seeded `HOLD_TEMPLATES` (10 total, full hold kit each): Emberwake (5600,1050), Thornholt (7400,1600), Greywater (6100,3800), Mosslight (1100,5400), Duskfen (3600,7000), Cinderrest (6800,6500) — E strip / deep E / S strip / deep SE spread, join waves 8/10/12, tiers big/far; ≥1200px pair spacing + ≥600 off legacy border (test-asserted); caps + fog/camera gates keep perf flat
- Agent action — **guaranteed first build (P3):** `HOLD_SHOWCASE_ENABLED` — first time the player is within 800px of a hold with <2 structures, a build force-starts 10–16s later with NO orangeSp cost (auto-graduates the hold if needed): captain rally, builder+captain hammer, scaffold+% bar, complete ≈20–30s after arrival; once per hold (`showcaseDone` persisted); economy loop (orb→bank→spend) verified end-to-end in town-save test and drives later builds
- Agent action — **hold combat (P4):** `HOLD_COMBAT_ENABLED` — `computeHoldThreats` (zone+300px aggro, fog-known holds); units engage real enemies first with 600px leash, return to posts; rover/scout perimeter patrols; 6s alarm on any unit/builder/captain damage converges defenders; captain fights (320hp, 15dmg baton, 1.05s cd, engage barks, 26s downed recovery, hp bar); watchpost fires real orange bolts (420 range / 12 dmg / 1.15s); enemies retarget nearest orange defender when closer than player + contact damage vs units/laborers/captain (all gated on `_nearHoldId` — zero legacy-core cost)
- Tests: `node --check` repo+www PASS; `test-town-save.js` ALL PASS; `test-build-place.js` ALL PASS; `test-continuous-map.js` ALL PASS incl. **13 new 4.1.2 checks** (10-hold layout/spacing/legacy-clear, showcase arm→force-start→no-gate→auto-grad, threat list + `_nearHoldId`, watchpost orange bolt, unit-damage alert)
- Notes: legacy core gameplay unchanged (grids are exact-candidate optimizations; hold combat costs nothing away from holds). All four features soft-wired (`HOLD_COMBAT_ENABLED`, `HOLD_SHOWCASE_ENABLED`, `PERF_WATCHDOG_ENABLED`). REMOVED untouched.

### 2026-08-31 — SHIPPED — 4.1.1 freeze fixes + Burstweaver buff + visible captain growth (BETA)
- Version / commit / APK: **4.1.1** / versionCode **77** / BETA `rollouts\TemporalRift-BETA-4.1.1.apk` + Desktop / **no Play AAB this pass** / no git commit
- User intent: 4.1.0 retest found (1) game keeps freezing, (2) spiders too easy to kill, (3) captain not visibly building a bigger village — fix all three, BETA for retest
- Agent action — **freeze root causes (P1):**
  - `drawFogMinimap` scanned all 70×70=4900 fog chunks + thousands of `fillRect`s EVERY frame (via `updateHud`→`drawMinimap` at 60fps) → now cached to an offscreen canvas, redrawn only on fog change; whole radar repaint throttled to ~10Hz
  - Y-sorted world draw + the pine-canopy overlay iterated **every obstacle on the 8896×8896 map** per frame (closure alloc + sort + offscreen draws; canopy loop had NO cull at all) → camera-culled with generous margins (obstacles, canopies, barricades, brick walls, structures, forest stands, gold mines, camp props)
  - Discovered holds rendered brick ground (~800 path rects) + walls + units from anywhere on the map (`isHoldVisible` is fog-based, not camera-based) → new `isHoldOnCamera` draw gate (updates unaffected)
  - Chained `ctx.filter` (sepia+saturate+hue-rotate+brightness) on every hold laborer/unit/captain draw → software compositing on Android WebView → replaced with cheap orange overlay wash (captain palette already orange)
  - Hold builder target scans (`pickHoldMineTarget`/`pickHoldChopTarget` over ALL obstacles/mines) ran per frame per idle builder → 1.35s rescan cooldown + 3.5s stuck-release (unreachable-target churn fix)
  - Per-frame array allocs trimmed: probe `filter().length` counts, conditional `holdProbes` compaction, `enemies.every` closure, `countLiveBurstweavers`; captain level recompute throttled 1.5s
  - **Wave-stall:** Burstweaver pacing the legacy border (player inside) blocked `enemies.every(e=>e.dead)` → wave never ended; wave-clear now ignores `exteriorOnly` ambients + 20s leash despawn when player hides in legacy
- Agent action — **spider buff (P2):** hp 120→**290** (×hpScale; kit/damage LOCKED 7.4D); **HEAVY knock** (+1 hit on wave shove ladder, 0.6× shove); `burstweaverMaxLive()` **2 at wave ≥ 20**; UNIT_SIZES + burstweaver-art-plan updated
- Agent action — **visible captain growth (P3):** post-graduation ambient orb income was DEAD CODE (spawner lived inside `tickHoldGauntlet`, which early-returns once `gauntletDone`) → new `tickHoldOrbSpawner` (18s pre / 14s post-grad); holds age + auto-graduate at **300s** even unvisited (`tickHoldAgeAndOffline`, `hold.ageT` saved); undiscovered graduated holds trickle 1 orangeSp/24s (banked growth on first contact); **2nd builder** post-graduation (`holdLaborerCap`, 6s top-up); captain **walks to the active build site, hammers** (`swipe` pose + sparks) and **adds 0.5×dt build progress**; structure-specific rally floaters (`HOLD_BUILD_RALLY`: "RAISE THE WATCHPOST!" etc.)
- Tests: `node --check` PASS; `test-town-save.js` PASS; `test-continuous-map.js` PASS ×4 (APP_VERSION check → 4.1.1; de-flaked `exterior trees tagged` ≥30→≥24 — worldgen legitimately rolls 29–32); `test-build-place.js` PASS (knockback ladder intact)
- Notes: Legacy core gameplay untouched — all culling is draw-only, minimap ~10Hz is HUD cadence, knock ladder for non-Burstweaver enemies unchanged. REMOVED untouched.

### 2026-08-31 — SHIPPED — Step 7.6 arc gate → 4.1.0 (BETA + Play AAB)
- Version / commit / APK: **4.1.0** / versionCode **76** / BETA `rollouts\TemporalRift-BETA-4.1.0.apk` + Desktop / Play `rollouts\TemporalRift-4.1.0.aab` + `playstore\TemporalRift-4.1.0.aab` + `mapping-4.1.0.txt` (+ Desktop)
- User intent: “okay next lets see what we did” — implement 7.6, bump 4.1.0, build BETA + Play AAB, summarize Step 7
- Agent action: Full smoke PASS; marked 7.0–7.6 Done in exterior-expansion-plan + v4.1-roadmap; APP_VERSION/gradle → 4.1.0/vc76; www sync; `build-beta.ps1` + `build-all.ps1`; verified beta=`com.drpep.temporalrift.beta` TR_CHANNEL=github, play=`com.drpep.temporalrift` TR_CHANNEL=play; CHANGE_MEMORY + this row; REMOVED untouched; no git commit
- Notes: Step 7 complete. Legacy core unchanged; Burstweaver exterior-only. Try: walk path outside legacy map.

### 2026-08-31 — SHIPPED — Step 7.5 soft-wire A-B + harvest/captain tune (4.0.9; no APK)
- Version / commit / APK: **4.0.9** / versionCode **75** / **no APK**
- User intent: “did 7.4/7.5 do anything?” + next for 7.5 — status then implement 7.5 if missing; no APK
- Agent action: Confirmed 7.4A–D already shipped 4.0.5–4.0.8; 7.5 was pending. Independent soft-wires (harvest/chop/mine/assist/captain/spider/sprite); wood/gold→orangeSp 1:1 Continuity; captain stage costs 8/9/10/12 + floors 20/40/60/85; BW kit locked 7.4D; Continuity A=enemies[] (B exteriorThreats deferred); assist ON default; www sync; smoke PASS; docs marked 7.5 done
- Notes: Not 4.1.0. Next = **7.6** (arc gate + APK on user go).

### 2026-08-31 — SHIPPED — Step 7.4D Ashen Burstweaver balance polish (4.0.8; no APK)
- Version / commit / APK: **4.0.8** / versionCode **74** / **no APK**
- User intent: 7.4D balance polish — threatening but fair; additive tweaks only; no new attacks; no APK; HUD poison/slow if missing; document finals; bump 4.0.8/vc74; next=7.5
- Agent action: Spawn 55–80s max1; swell 1.35–1.75s + danger ring; web×0.55@2.5s CD4.5; poison 3.0HP/s+4.0aether/s; explode r128 dmg42+1.5w CD12–16; HUD `#debuffHud` + world tags; FF hold/enemies verified; fizzle KEPT; soft-wires independent; www sync; smoke town+continuous; docs 7.4D done
- Notes: Not 4.1.0. Next = **7.5** (harvest/captain/A-B flag matrix — not implemented here).

### 2026-08-31 — SHIPPED — Step 7.4C Ashen Burstweaver attacks (4.0.7; no APK)
- Version / commit / APK: **4.0.7** / versionCode **73** / **no APK**
- User intent: 7.4C attacks — web (slow+dmg), bite (poison 10s energy+HP), explode (friendly-fire AOE); threat/swell sheets; kill-during-telegraph cancel; sync www; bump 4.0.7/vc73; no APK; mark docs done
- Agent action: Attack AI approach→web/bite→swell→suicide explode; web dmg9 slow×0.48@2.8s; bite dmg14 + poison 10s (3.5 HP/s + 4.5 aether/s); explode r140 dmg 45+1.5w hits player/allies/hold orange/**enemies**; kill during swell fizzles; threat/swell draw; exterior-only + no wave tables KEPT; www sync; smoke town+continuous; docs 7.4C done
- Notes: Explode is **suicide** (creeper fantasy) with scorched decal + loot. Not 4.1.0. Next = optional **7.4D** or **7.5**.

### 2026-08-31 — OPS — CHANGE_MEMORY confirm 4.0.6 / vc72 Step 7.4B
- Version / commit / APK: **4.0.6** / versionCode **72** / **no APK**
- User intent: Append CHANGE_MEMORY after 7.4B ship; sync channel matrix/changelog if not at 4.0.6; do not re-add REMOVED
- Agent action: Audited `docs/CHANGE_MEMORY.md` — channel matrix App version **4.0.6**/vc72, Burstweaver move+spawn row, lag note, pending **Shipped Continuity 4.0.6**, changelog **### 4.0.6** all present and match summary (flags ON, legacy-reject spawn, ~48–72s max 1, chase turn-back, dmg=14, r=42/drawH=115, next 7.4C). **No CHANGE_MEMORY edits** — already synced by parent. REMOVED untouched.
- Notes: Next = **7.4C**.

### 2026-08-31 — SHIPPED — Step 7.4B Ashen Burstweaver move + exterior spawn (4.0.6; no APK)
- Version / commit / APK: **4.0.6** / versionCode **72** / **no APK**
- User intent: 7.4A look approved (“perfect”); next = 7.4B only — movement + exterior spawn stub; no attacks; no APK
- Agent action: `BURSTWEAVER_SPRITE_ENABLED=true` idle↔walk draw (plant squash/bob; multi-dir ready via `unitPickDirWalk`, no side/back sheets yet); `EXTERIOR_SPIDER_ENABLED=true`; `spawnBurstweaverAt` rejects `inLegacyWorld` / never `spawnEdgePos`; rare timer near holds or player-exterior (max 1 live, ~48–72s); chase + turn-back/snap at legacy border; mild default melee dmg=14; size locks r=42/drawH=115; www sync; smoke + legacy-reject test; docs 7.4B done
- Notes: Deferred **7.4C** web/bite/explode + swell telegraph. Not 4.1.0. Next = **7.4C**.

### 2026-08-31 — SHIPPED — Step 7.4A Ashen Burstweaver look (4.0.5; no APK)
- Version / commit / APK: **4.0.5** / versionCode **71** / **no APK**
- User intent: Break 7.4 into mini-steps like prior enemy art; start with look; mesh refs into original Continuity sprites; soft-wire OFF; document attacks for later; bump if code touched; no APK
- Agent action: Copied 6 refs → `assets/burstweaver/_refs/`; generated+processed idle/walk/threat/swell (512 transparent); www sync; size draft r=42 / drawH=115; `BURSTWEAVER_SPRITE_ENABLED=false` + `EXTERIOR_SPIDER_ENABLED=false`; `ETYPES.burstweaver` stub no spawn; docs burstweaver-art-plan + exterior mini-steps 7.4A–D + UNIT_SIZES + CHANGE_MEMORY; Desktop preview folder; smoke `node --check`; REMOVED untouched; no Minecraft naming
- Notes: Deferred **7.4B** move/spawn, **7.4C** web/bite/explode AI. Attacks documented: web slow+dmg; bite poison 10s energy+HP; explode friendly-fire AOE. Next = **7.4B**.

### 2026-08-31 — SHIPPED — Step 7.3 village growth captain (4.0.4; no APK)
- Version / commit / APK: **4.0.4** / versionCode **70** / **no APK**
- User intent: Step 7.3 hard/detailed — “guy like me” captain; growth beyond brickpad; squad direction; learning gauntlet if possible; keep 6.5 join gates; bump 4.0.4/vc70; no APK
- Agent action: `HOLD_CAPTAIN_ENABLED`; captain NPC after gauntlet (cloak+baton orange tint); `HOLD_CAPTAIN_BUILD_ORDER` watchpost→hut2→depot→stakewall; unlock/train direction + reinforce caps Lv≥2; learning gauntlet 2 via holdProbes; Talk reinforces wave 8/10; save captain/level/growthStage; www sync; docs 7.3 done; smoke PASS; REMOVED untouched
- Notes: 6.6 hut→timber→brickpad KEPT. Player cannot upgrade hold units. Deferred: Burstweaver 7.4, second avatar, APK. Not 4.1.0. Next = **7.4**.

### 2026-08-31 — SHIPPED — Step 7.2 exterior gold mines (4.0.3; no APK)
- Version / commit / APK: **4.0.3** / versionCode **69** / **no APK**
- User intent: Step 7.2 only — exterior mines harvestable; player + hold laborers enter/carry; deposit mapping; bump 4.0.3/vc69; no APK
- Agent action: `EXTERIOR_MINE_ENABLED`; `pickMineTarget` fog-revealed exterior; hold `pickHoldMineTarget` + WC2 enter/carry; deposit player→gold / squad→squadGold / hold **1 gold→1 orangeSp**; www sync; docs 7.2 done; smoke PASS; REMOVED untouched
- Notes: No hold gold bank — orangeSp conversion mirrors wood (feeds 6.6). Interior mines unchanged. Next = **7.3** captain. Not 4.1.0.

### 2026-08-31 — SHIPPED — Step 7.1 exterior trees choppable + laborer pathing (4.0.2; no APK)
- Version / commit / APK: **4.0.2** / versionCode **68** / **no APK**
- User intent: Step 7.1 only — exterior trees choppable; player + hold laborers path/chop; mines still deferred; bump 4.0.2/vc68; no APK
- Agent action: `EXTERIOR_CHOP_ENABLED` + `PLAYER_EXTERIOR_ASSIST_ENABLED`; `pickChopTarget` fog-revealed exterior; `pickMineTarget` still skips; hold `pickHoldChopTarget` + deposit **1 wood→1 orangeSp**; www sync; docs 7.1 done; smoke PASS; REMOVED untouched
- Notes: No hold wood bank — orangeSp conversion feeds 6.6 queue. Next = **7.2** exterior mine AI. Not 4.1.0.

### 2026-08-31 — SHIPPED — Step 7.0 exterior harvest scaffold (4.0.1; no APK)
- Version / commit / APK: **4.0.1** / versionCode **67** / **no APK**
- User intent: Step 7.0 only — exterior mine + tree site markers beyond LEGACY_WORLD; no new chop/mine AI; soft-wire; interim 4.0.1/vc67; no APK
- Agent action: `EXTERIOR_HARVEST_ENABLED`; `buildExteriorHarvest()` after holds — 8 exterior stands + ~30 `exteriorTree` trees + 5 exterior gold mines (`exterior: true`); laborer pick targets skip exterior; fog-gated draw/minimap; save `world.exteriorHarvest` stub + town mine merge; www sync; docs 7.0 done; smoke PASS; REMOVED untouched
- Notes: Legacy interior mineSites/standSites codepaths unchanged. Next = **7.1** exterior chop AI. Not 4.1.0.

### 2026-08-28 — DEFERRED — Step 7 exterior expansions (plan only; no code)
- Version / commit / APK: master Continuity **4.0.0** / vc**66** — **no version bump** / **no APK**
- User intent: Post-4.0.0 outer land needs exterior gold mines, choppable forest stands (not only border ring), “guy like me” village growth, and a large exploding spider **only outside** legacy 4800×4800; nested 7.x steps like continuous-map-plan; no APK until full 7.x; legacy core untouched
- Agent action: Wrote `docs/exterior-expansion-plan.md` (7.0–7.6); added `docs/v4.1-roadmap.md`; linked from `docs/v4.0.0-roadmap.md` post-gate; grepped game.js hooks (`goldMines`, `forestStands`, `holdLaborers`, `spawnEdgePos`, `inLegacyWorld`, `holdProbes`); CHANGE_MEMORY related-docs + note; **no gameplay code**
- Notes: Recommend **Ashen Burstweaver** (not creeper IP); “guy like me” = **NPC Continuity captain** + optional player laborer assist (hybrid C). Soft-wires: `EXTERIOR_HARVEST_ENABLED`, `HOLD_CAPTAIN_ENABLED`, `EXTERIOR_SPIDER_ENABLED`. First next = **7.0** scaffold. REMOVED untouched.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.8 arc gate + label 4.0.0 (BETA + Play AAB)
- Version / commit / APK: **4.0.0** / versionCode **66** / BETA `rollouts\TemporalRift-BETA-4.0.0.apk` + Desktop / Play `rollouts\TemporalRift-4.0.0.aab` + `playstore\TemporalRift-4.0.0.aab` + `mapping-4.0.0.txt`
- User intent: Step 6.8 — close Step 6 arc; bump to 4.0.0 when map arc complete; build BETA + stage Play AAB; document gate (Step 5 deferred, Step 3 Console pending)
- Agent action: `test-continuous-map.js` light smoke; roadmap + continuous-map-plan Step 6 Done; APP 4.0.0/vc66; `build-beta.ps1` + `build-all.ps1` Play section; CHANGE_MEMORY channel matrix + changelog; smoke ALL PASS; REMOVED untouched
- Notes: **Step 6 complete (6.0–6.8).** Remaining: **Step 5 size shrink** (deferred/skipped), **Step 3 Console uploads** (user-side). GitHub Release still 2.13.2.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.7 fog Version A/B toggle (3.4.7; no APK)
- Version / commit / APK: **3.4.7** / versionCode **65** / **no APK**
- User intent: Step 6.7 — ship-ready switch between full-black (A) and legacy-core-visible (B); settings toggle persists in tr_settings; load respects world.fogMode; bump 3.4.7; no APK
- Agent action: Runtime `fogDiscoveryMode` + `settings.fogDiscoveryMode`; settings **Fog of war** row; `full-black` fogs legacy until visited; save/load `world.fogMode`; minimap + overlay use mode; manual test passes in continuous-map-plan; www sync; docs 6.7 done; smoke PASS; REMOVED untouched
- Notes: Default **Version B**. Save `world.fogMode` overrides settings on Continue. Next = **6.8 arc gate**. Not 4.0.0.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.6 hold village build queue (3.4.6; no APK)
- Version / commit / APK: **3.4.6** / versionCode **64** / **no APK**
- User intent: Step 6.6 — hold orange builders construct village structures over time after gauntlet; build queue hut→timber→brickpad; visual progress; orangeSp costs; save hold.buildQueue/structures; bump 3.4.6; no APK
- Agent action: `HOLD_STRUCTURE_KINDS` + `HOLD_VILLAGE_BUILD_ORDER`; `seedHoldVillageQueue` after gauntletDone; builder `build` order + scaffold/progress bar; procedural draw; save/load extended; 6.5 barricade repair intact; player town unchanged; www sync; docs 6.6 done; smoke PASS; REMOVED untouched
- Notes: Costs hut **4** / timber **5** / brickpad **6** orangeSp; build times 8/10/12s. No player RTS menu. Next = **6.7 fog toggle**. Not 4.0.0.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.5 hold join/refuse + orange autonomy + builders (3.4.5; no APK)
- Version / commit / APK: **3.4.5** / versionCode **63** / **no APK**
- User intent: Step 6.5 — join/refuse at holds; hold self-play orange squad; **each hold needs orange builder** (laborer sprite, orange tint); separate orange orb economy; gauntlet; player cannot upgrade holds; bump 3.4.5; no APK
- Agent action: `HOLD_AUTONOMY_ENABLED`; wave-gated join → militia spearman + `hold.allegiance`; refuse insult lines; `holdUnits` (Rover/Scout/Sentinel/Warden orange tint); **`holdLaborers` 1/hold** collects orbs, repairs/places barricades; `holdProbes` gauntlet exterior-only; orange orb unlock table; save `world.holds` extended; www sync; docs 6.5 done; smoke PASS; REMOVED untouched
- Notes: Join = **militia spearman** (not companion slot). Builders separate from `laborers`/`squadLaborers`. Full village build queue = **6.6**. Next = **6.6 laborer village**. Not 4.0.0.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.4 NPC hold template (3.4.4; no APK)
- Version / commit / APK: **3.4.4** / versionCode **62** / **no APK**
- User intent: Implement Step 6.4 only — data-driven hold prefab with brick footprint, low walls, 1–2 NPCs, placeholder Talk (no recruitment); fog-gated exterior visibility; save stub; bump interim 3.4.4/vc62 (NOT 4.0.0); no APK
- Agent action: `HOLD_TEMPLATES` + `npcHolds[]` at S/E/far-S/far-E exterior path offsets; `buildNpcHolds`/`drawHoldBrickGround`/`isHoldVisible`; Cloister brick walls via `drawBrickWall*`; `talkHoldNpc` placeholder; `nearestNpc` includes hold sentries; save/load `world.holds`; www sync; docs 6.4 done; smoke `node --check` + `test-town-save.js` PASS; REMOVED untouched
- Notes: 4 holds — Sunfall (2400,5080), Eastwatch (5120,2400), Ashmarch (2400,6360), Riftshore (6360,2400). NPCs: Sable/Lenya, Thorne/Voss, Dryn, Aeldra/Hest. Next sub-step = **6.5 join/refuse**. Do not label 4.0.0 until arc gate complete.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.3 fog layer exterior Version B (3.4.3; no APK)
- Version / commit / APK: **3.4.3** / versionCode **61** / **no APK**
- User intent: Implement Step 6.3 only — Warcraft-style fog on exterior; legacy core always visible (Version B); persist discovered chunks in save; bump interim 3.4.3/vc61 (NOT 4.0.0); no APK
- Agent action: `FOG_DISCOVERY_ENABLED=CONTINUOUS_MAP_ENABLED`; `FOG_DISCOVERY_MODE='legacy-core-visible'`; 128px chunk Uint8Array bitset; `revealFogAt`/`updateFogDiscovery`/`drawFogOverlay`/`drawFogMinimap`; save `world.discovered` + `world.fogMode`; loadGame restore; www sync; docs 6.3 done; smoke `node --check` + `test-town-save.js` PASS; REMOVED untouched
- Notes: ~70×70 chunks on 8896 world; Version A (`full-black`) stub only for 6.7. Next sub-step = **6.4 NPC holds**. Do not label 4.0.0 until arc gate complete.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.2 path stubs through ring (3.4.2; no APK)
- Version / commit / APK: **3.4.2** / versionCode **60** / **no APK**
- User intent: Implement Step 6.2 only — cardinal path corridors through border tree ring; visible walkable paths to legacy edge; gold mines must remain functional; bump interim 3.4.2/vc60 (NOT 4.0.0); no APK
- Agent action: `isLegacyPathCorridor()` + `buildLegacyBorderPaths()`; path ground tile + render + minimap stubs; signposts; obstacle purge in corridors; `isNearGoldMine` protects mine sites from path decals; mines/laborer pathing unchanged; www sync; docs 6.2 done; smoke `node --check` + `test-town-save.js` PASS; REMOVED untouched
- Notes: 4 corridors N/S/E/W, half-width 88px, depth 560px. Ring blocks except paths. Next sub-step = **6.3 fog**. Do not label 4.0.0 until arc gate complete.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.1 border tree ring (3.4.1; no APK)
- Version / commit / APK: **3.4.1** / versionCode **59** / **no APK**
- User intent: Implement Step 6.1 only — dense tree/obstacle ring at legacy perimeter; block walk-off except cardinal gaps for 6.2; purple rift as sealed-core cue; interior scatter unchanged; bump interim 3.4.1/vc59 (NOT 4.0.0); no APK
- Agent action: `buildLegacyBorderRing()` + `isLegacyBorderPathSlot()`; ring insets 52–108 px, spacing 40, 2 rows, ~350 trees; `assignTreeVariant` border bias; purple rift at legacy edge; www sync; docs 6.1 done; smoke `node --check` + `test-town-save.js` PASS; REMOVED untouched
- Notes: Cardinal gaps at map center N/S/E/W (`GAP_HALF=88`). Next sub-step = **6.2 path stubs**. Do not label 4.0.0 until arc gate complete.

### 2026-08-28 — SHIPPED — v4.0.0 Step 6.0 world extension scaffold (3.4.0; no APK)
- Version / commit / APK: **3.4.0** / versionCode **58** / **no APK**
- User intent: Implement Step 6.0 only — enlarge world coords without changing gameplay inside legacy 4800×4800; exterior empty grass; purple rift at legacy edge; save stub; bump interim 3.4.0/vc58 (NOT 4.0.0); no APK
- Agent action: `CONTINUOUS_MAP_ENABLED=true`; `LEGACY_WORLD` + `WORLD` 8896×8896; CAMP/biomes anchored to legacy; `buildWorld()` + `spawnEdgePos()` use legacy bounds; player/camera/clamps + tile loops use full WORLD; minimap full-world scale + legacy ring; save `world` additive stub; www sync; docs 6.0 done; smoke `node --check` + `test-town-save.js` PASS; REMOVED untouched
- Notes: Exterior L-shaped (east/south of legacy origin). Next sub-step = **6.1 tree ring**. Do not label 4.0.0 until arc gate complete.

### 2026-08-27 — DEFERRED — v4.0.0 Step 6 continuous/open map design (plan only; no code)
- Version / commit / APK: master Continuity — **no version bump** / **no APK**
- User intent: Document stepped plan for open map around frozen 4800×4800 core; tree-ring border + paths + exterior NPC holds + Warcraft fog (Version B default); laborer NPC village; squad join/refuse; A/B fog modes; one sub-step per “next”; read CHANGE_MEMORY each step
- Agent action: `docs/continuous-map-plan.md` (6.0–6.8 acceptance criteria); `docs/v4.0.0-roadmap.md` Step 6 updated; CHANGE_MEMORY pending row + related files table; recommend extend/scroll over wrap
- Notes: Flag names `FOG_DISCOVERY_MODE`: `'legacy-core-visible'` (B) / `'full-black'` (A). First implementation slice = **6.0 world extension scaffold**. REMOVED untouched.

### 2026-08-27 — SHIPPED — Guttural orc enemy-bark for non-boss (3.3.2)
- Version / commit / APK: **3.3.2** / versionCode **57** / BETA `rollouts\TemporalRift-BETA-3.3.2.apk` + Desktop
- User intent: Wire `Guttural_zombie_orc` for smaller/non-boss enemy barks; leave boss-bark unchanged; skip `magicorc.wav` (credits exhausted); bump 3.3.2
- Agent action: CUE_MAP `Guttural_zombie_orc__#3-1787886126171.mp3` → `enemy-bark.mp3` (replaces normalsmallzombieorc); removed magicorc from bake; sync-audio-drop + www sync; boss-bark routing unchanged (warlord voice); `node --check` PASS; build-beta; no git commit
- Notes: `normalsmallzombieorc.mp3` superseded in drop but kept as mirror; `magicorc.wav` unwired; decade warlord still uses boss-bark via warlord voice.

### 2026-08-27 — SHIPPED — User AI SFX drop baked + optional hooks wired (3.3.1)
- Version / commit / APK: **3.3.1** / versionCode **56** / BETA `rollouts\TemporalRift-BETA-3.3.1.apk` + Desktop
- User intent: Process 14 files in `assets/audio/drop/`; map to triggers; bake via sync script; wire rifle/hurt/waveclear and obvious extras; bump patch if code changed
- Agent action: `sync-audio-drop.mjs` CUE_MAP (12 mapped); MP3 in loader; wired fire→rifle, hurt, enemy-bark, chop/mine, rift-music; synth fallback preserved; `node --check` PASS; no git commit
- Notes: Duplicates `gettinghurt#2`, `Guttural_zombie_orc` unused; `magicorc.wav` baked as `enemy-bark-magic.wav` but not hooked (pending confirm); no `waveclear` drop file — synth only.

### 2026-08-27 — SHIPPED — User AI SFX drop folder workflow (3.3.0 doc+loader)
- Version / commit / APK: **3.3.0** unchanged (no version bump)
- User intent: Folder-based AI SFX — drag/save files from external tools; agent loads from drop folder; keep procedural defaults + gen-tr-sfx.mjs
- Agent action: `assets/audio/drop/` + README; loader priority drop → shipped → synth in `game.js`; `docs/audio-drop-in-guide.md`; `scripts/sync-audio-drop.mjs`; CHANGE_MEMORY row; roadmap Step 4 note; optional rifle/hurt/waveclear filenames reserved
- Notes: No gameplay trigger changes. Say "bake audio" to run sync script before release. Say "wire optional SFX" to hook rifle/hurt/waveclear.

### 2026-08-27 — SHIPPED — Continuity v4.0.0 Step 4 enhanced SFX layer + BETA-3.3.0 + Play AAB staged
- Version / commit / APK: **3.3.0** / versionCode **55** / BETA `rollouts\TemporalRift-BETA-3.3.0.apk` + Desktop / Play `rollouts\TemporalRift-3.3.0.aab` + `mapping-3.3.0.txt` / TR_CHANNEL beta=github, prod=play
- User intent: Continue v4.0.0 arc — Step 4 audio pass; one layer at a time; keep synth fallback; preserve Continuity; bump interim 3.3.0/vc55 (NOT 4.0.0); BETA + Play AAB for testing; no git commit/push
- Agent action: `ENHANCED_SFX_ENABLED`; `scripts/gen-tr-sfx.mjs` → original procedural WAVs (death/beam-charge/beam-blast/place/boss-bark); WebAudio sample layer + pitch map on death + warlord boss-bark hook; synth fallback intact; www sync; docs Step 4 done; smoke `node --check`; build-beta + build-all Play section; REMOVED untouched
- Notes: Next arc steps = size shrink (5), open map (6), Console uploads (3 user). Do not label 4.0.0 until gate complete. discoverability_risk: none (audio auto).

### 2026-08-27 — SHIPPED — Continuity v4.0.0 Step 2 Play mapping/symbols + BETA-3.2.0 (build/config only)
- Version / commit / APK: **3.2.0** / versionCode **54** unchanged / BETA `rollouts\TemporalRift-BETA-3.2.0.apk` + Desktop / Play `rollouts\TemporalRift-3.2.0.aab` + `mapping-3.2.0.txt` / TR_CHANNEL beta=github, prod=play
- User intent: Fix Play Open testing 3.1.5 warnings (mapping + native symbols); no gameplay changes; BETA 3.2.0 with coach+trees+Continuity; stage Play AAB artifacts; no git commit/push
- Agent action: Enabled R8 minify + Capacitor ProGuard rules; `ndk.debugSymbolLevel FULL`; updated `build-all.ps1`/`build-beta.ps1` artifact copies; `bundleRelease`/`assembleRelease` PASS; BETA aapt verified beta/vc54/3.2.0; prod release apk verified `com.drpep.temporalrift`/vc54; mapping copied; native symbols zip N/A (AAB has zero `.so`); docs Step 2 done; REMOVED untouched
- Notes: Upload `mapping-3.2.0.txt` with AAB in Play Console. Native symbol warning may clear on upload (no native libs packaged) or stay informational.

### 2026-08-27 — SHIPPED — Continuity v4.0.0 Step 1 wave How-to-Play coach (3.2.0; no APK)
- Version / commit / APK: master Continuity — **APP_VERSION 3.2.0** / versionCode **54**; **no APK / no Play / no Production**
- User intent: Ready for 1-1 then 1-2… — short in-run How-to-Play coach waves 1–5; Skip anytime; gloved finger; overlay-only; do not jump to 4.0.0 until map/audio/size done
- Agent action: Soft-wire `WAVE_COACH_ENABLED`; lessons 1-1…1-5; Skip → `settings.waveCoachSkip` + settings toggle; procedural glove finger aimed at HUD; startWave hooks; www sync; `docs/v4.0.0-roadmap.md`; CHANGE_MEMORY + this row; smoke `node --check`; REMOVED untouched
- Notes: Interim **3.2.0** tracks Step 1 of the 4.0.0 arc. Combat non-blocking. discoverability_risk: low (auto tips; Skip persists).

### 2026-08-27 — OPS / SHIPPED — TemporalRift-3.1.5.aab (Play Open testing staged)
- Version / commit / APK: **3.1.5** / versionCode **53** / `com.drpep.temporalrift` / `playstore\TemporalRift-3.1.5.aab` (+ `rollouts\` + Desktop) / TR_CHANNEL=play / same `temporalrift-upload.jks` as 3.1.4
- User intent: Paid Play AAB for Open testing drag-drop; include Continuity remeshed trees; do not change anything else; continuous/open map later
- Agent action: Confirmed `TREE_SPRITE_VARIANTS_ENABLED=true` + remeshed sheets already on Continuity; bumped APP_VERSION **3.1.5** + gradle vc**53**; www sync; Play-only build-all path (github debug APK skipped); bundletool/aapt verified package/vc53/3.1.5/channel=play + trees in AAB; CHANGE_MEMORY + this row; **no git commit/push**
- Notes: No gameplay/map redesign. REMOVED untouched. Play Closed live still 2.13.2 until user uploads.

### 2026-08-25 — SHIPPED — Meshed original trees (refs inspiration only)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.4** (vc52); **no APK / no version bump**
- User intent: Do NOT ship stock/reference trees as-is — mesh them like Continuity unit art (orc/zombie husks); refs inspiration only; original TR composites with classic pine DNA
- Agent action: GenerateImage remeshed all 11 variant sheets (singles/few/bunch) blending classic TR cartoon pines with spruce-bunch + multi-type silhouette cues; rewrote `process-tree-sprites.mjs` to flood-key gens (retired photo crop composites); www sync; `TREE_SPRITE_VARIANTS_ENABLED` stays **true**; weights unchanged; updated `tree-art-plan.md` + CHANGE_MEMORY; REMOVED untouched
- Notes: Shipping art is remeshed Continuity-style, not free PNG packs. Prior photo isolates archived as `_raw/*_photo_prev.png` only. Soft-wire ON (results match pine readability). discoverability_risk: low (world scenery).

### 2026-08-25 — SHIPPED — World tree one/few/bunch visual variety (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.4** (vc52); **no APK / no version bump**
- User intent: Trees should sometimes be one, sometimes a few, sometimes a bunch — mix new tree refs with existing in-game pine
- Agent action: Soft-wire `TREE_SPRITE_VARIANTS_ENABLED=true`; process refs → transparent sheets under `assets/world/trees/` (+ `_refs`); spawn weights one 55% / few 32% / bunch 13%; drawH/collision scaled by kind; classic pines kept native aspect; www sync; `docs/tree-art-plan.md` + CHANGE_MEMORY; smoke `node --check`; REMOVED untouched
- Notes: Inspiration sheets only (no IP claims). Foliage-close texture kept in `_refs` only (not shipped). discoverability_risk: low (world scenery).

### 2026-08-11 — OPS / SHIPPED-BETA — TemporalRift-BETA-3.1.4.apk (3.1.4 / vc52)
- Version / commit / APK: **3.1.4** / versionCode **52** / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.1.4.apk` + Desktop copy / TR_CHANNEL=github / **not Play** / Play+GitHub stay **2.13.2** vc46
- User intent: "yes ready" - package decade stacked bosses (every 10 waves, W/10 tiers 10..W; Gharok every-5 unchanged) into BETA APK
- Agent action: APP_VERSION **3.1.4** + gradle vc**52**; www sync; CHANGE_MEMORY channel matrix + changelog; `build-beta.ps1`; smoke `node --check` + APK size; left VCS untouched (no commit, no push); no Play upload
- Notes: Decade bosses were already on master under 3.1.3 Continuity (no APK); first sideload is 3.1.4. REMOVED untouched.

### 2026-08-11 — SHIPPED — Decade bosses every 10 waves (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.3** (versionCode **51**); **no APK / no version bump**
- User intent: Every 10 waves spawn stacked decade bosses (W/10) at tiers 10…W with hardness scaled per decade; keep Gharok; reuse warlord/ravager/bulwark; no APK
- Agent action: `decadeBossTiers` + `spawnDecadeBoss` (roster Brute/Bulwark/Warlord titles); tier HP via `hpScale(tier)×eliteMul`; `boss:false` so Gharok claw/bar/AI stay exclusive; visScale size lock (< Gharok 228); mass KB + death juice; startWave banners; www sync; CHANGE_MEMORY channel row + Continuity changelog; smoke tier formula + `node --check`
- Notes: Wave 10/20/… also still spawn Gharok (%5). REMOVED untouched.

### 2026-08-11 — OPS — CHANGE_MEMORY confirm BETA-3.1.3 / vc51 size locks
- Version / commit / APK: **3.1.3** / vc**51** / `rollouts` + Desktop `TemporalRift-BETA-3.1.3.apk` — already documented
- User intent: Confirm CHANGE_MEMORY + decisions.log for squad taller; fix channel matrix/changelog only if critical missing; no commit
- Agent action: Audited channel matrix (app 3.1.3/vc51, companion drawH rows, Squad taller row), changelog 3.1.3, pending ship row, and SHIPPED-BETA entry — all match locks (Rover/Laborer drawH=30, Scout=44, Sentinel=50, Warden=55, militia s=0.89, r unchanged; Colossus r=54/drawH=228; player/enemies unchanged). **No CHANGE_MEMORY edits** — nothing critical missing. REMOVED untouched.
- Notes: Confirm-only pass.

### 2026-08-11 — OPS / SHIPPED-BETA — TemporalRift-BETA-3.1.3.apk (3.1.3 / vc51)
- Version / commit / APK: **3.1.3** / versionCode **51** / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.1.3.apk` + Desktop copy / TR_CHANNEL=github / **not Play** / Play+GitHub stay **2.13.2** vc46
- User intent: “making the squad a bit taller too then write the 3.1.3 with all that” — modest squad drawH bump + package Continuity punch list since 3.1.2
- Agent action: Squad taller (~10–15%, collision `r` unchanged): Rover/Laborer drawH 26→**30**, Scout 38→**44**, Sentinel 44→**50**, Warden 48→**55**, militia `s` 0.78→**0.89**; procedural companion fallback `s` matched; Colossus/player/enemies untouched. APP_VERSION **3.1.3** + gradle vc**51**. Docs UNIT_SIZES + CHANGE_MEMORY. Smoke `node --check` / place / town-save PASS; `build-beta.ps1`; **no git commit/push; no Play upload**
- Notes: Packages post-3.1.2 Continuity (audio / Cloister flush / squad assist revive / turret ups / foe shadows) + 3.1.2 Colossus persist. REMOVED untouched.

### 2026-08-11 — SHIPPED — Continuity punch list: audio / Cloister flush / squad revive / turret ups / foe shadows (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.2** (versionCode **50**); **no APK / no version bump**
- User intent: (1) denser synth audio — deaths, beam charge/blast, place, rift hum, grunts; (2) Cloister walls still disconnected — fix flush joins; (3) squad can revive downed allies; (4) turret upgrades when clicked; (5) grass readability via stronger foe shadows; sync www; no APK
- Agent action: Added `death`/`beamCharge`/`beamBlast`/`place` voices + muted-aware wiring; enhanced music bus as subtle rift hum; militia attack/hurt grunts. Cloister: `BRICKWALL_PILLAR_CROP` + `SEG_INSET=4`; stop using corner/tee sheets as posts. Squad assist revive (~2.85s, free for comp/militia/laborer; colossus still 100⬡ player hold-Talk). Tap barricade → rate/range/dmg/rockets (player ⬡ or squad ◈s) + optional global uplink. Stronger enemy ground shadows + slight sprite contrast. `node --check`; www sync; REMOVED untouched
- Notes: MuteMaster/muteSfx/muteMusic respected. Wooden barricades KEPT. Play/GitHub stay 2.13.2.

### 2026-08-11 — OPS / SHIPPED-BETA — TemporalRift-BETA-3.1.2.apk (3.1.2 / vc50)
- Version / commit / APK: **3.1.2** / versionCode **50** / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.1.2.apk` + Desktop copy / TR_CHANNEL=github / **not Play** / Play+GitHub stay **2.13.2** vc46
- User intent: “yes and go” — sideload BETA APK with Colossus Continuity (sprites + persist + call/recall) that 3.1.1 missed, plus everything already in 3.1.1; light audit for missed-from-before wiring
- Agent action: Audit — all `*_SPRITE_ENABLED` already true; `game.js`/`www/game.js` hashes matched; colossus idle/walk/attack/death/walk-side/walk-back present in `www/assets/colossus/`. Bumped APP_VERSION **3.1.2** + gradle vc**50**; smoke `node --check` / `test-build-place.js` / `test-town-save.js` ALL PASS; `build-beta.ps1`; aapt verified package/version/label; CHANGE_MEMORY channel matrix + changelog; **no git commit/push; no Play upload**
- Notes: Packages Colossus Continuity (sprites + persist + CALL TITAN/RECALL) that 3.1.1 missed. No extra wiring needed. REMOVED untouched. Sideload-test next.

### 2026-08-11 — SHIPPED — Aether Colossus articulate + 3-view + persist summon (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.1** (versionCode **49**); **no APK / no version bump**
- User intent: Flip colossus sprites ON; gait/plant/barks; walk-side+walk-back matching this titan (not Megazord); no time limit; call out/back; can go down; revive ~100 orbs (player cores); make him strongest guy; no APK
- Agent action: `COLOSSUS_SPRITE_ENABLED=true`; idle↔walk half-cycle + attack on swipeT + death when downed; heavy titan plant (heavier than Warden); bark `voice:'colossus'`; generated+processed `walk-side`/`walk-back` (gunmetal+ochre+cyan core); `unitViewFromVel`/`unitPickDirWalk`; removed duration despawn; C / ⚔ CALL TITAN ↔ RECALL docks without destroying unlock; downed lingers; hold-Talk revive **100 ⬡ player cores** (not squad cores / not aether); stats HP 820→**1600**, dmg 28+1.2w→**44+1.5w**, splash 10/110/80→**20/145/150**, kb 220→**380**, atk 1.05→**0.92**; size lock r=54 / drawH=228; `town.colossus` persist; www sync + `node --check` + town-save smoke; Desktop `TemporalRift-Colossus-Sprites`; REMOVED untouched
- Notes: Store deferred. Play/GitHub stay 2.13.2. Does not auto-revive at wave end. Gharok not one-shot (wave 1 hit ≈45.5 vs 950 HP + 300 armor).

### 2026-08-11 — DEFERRED — Aether Colossus / Rift Titan sprite art (flag OFF)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.1** (versionCode **49**); **no APK / no version bump**
- User intent: “lets do the colossus” art-first like Sentinel — mesh combiner-bulk refs into original TR Aether Colossus / Rift Titan; flag OFF; no APK
- Agent action: Generated original idle/walk/attack/death (512×512 transparent); refs under `assets/colossus/_refs/` (combiner bulk + blocky titan + layered plate — not Megazord / Optimus / Autobot IP; strip dinosaur-leg clones / logos / Sentai primaries); size lock collision `r=54` unchanged, flag ON → `drawH=228` Gharok lock; soft-wire `COLOSSUS_SPRITE_ENABLED=false` (basic stub, no gait/barks — procedural `drawColossus` live H=210); docs `colossus-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Colossus-Sprites` (+ Pictures); www sync sheets (no `_refs`); REMOVED untouched
- Notes: Articulate later. Store deferred. Play/GitHub stay 2.13.2.

### 2026-08-10 — OPS / SHIPPED-BETA — TemporalRift-BETA-3.1.1.apk (3.1.1 / vc49)
- Version / commit / APK: **3.1.1** / versionCode **49** / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.1.1.apk` + Desktop copy / TR_CHANNEL=github / **not Play** / Play+GitHub stay **2.13.2** vc46
- User intent: “okay go” — sideload BETA APK with post-3.1.0 Continuity (squad place-pause freeze, raised build caps, knockback ladder) + everything already in 3.1.0
- Agent action: Bumped APP_VERSION **3.1.1** + gradle vc**49**; smoke `node --check` / `test-build-place.js` ALL PASS; `build-beta.ps1`; aapt verified package/version/label; CHANGE_MEMORY channel matrix + changelog; roadmap note; **no git commit/push; no Play upload**
- Notes: Includes prior Continuity (no-APK) batch now packaged. REMOVED untouched. Sideload-test next.

### 2026-08-10 — SHIPPED — Place-pause freezes squads + raised build caps + wave knockback resistance (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.1.0** (versionCode **48**); **no APK / no version bump**
- User intent: (1) place-pause must freeze companions+militia combat too; (2) raise placeable build quantity caps generously; (3) every 20 waves zombies need +1 hit before knockback shove; no APK
- Agent action: Gate `updateCompanions` / `updateMilitia` / `updateSentries` / `updateLaborers` / `updateColossus` behind `buildPlacePaused` (same as enemy AI); caps → barricade/Cloister **80**, timber **12**, farm **16**, golddepot/muster/aetherpit **8** (keep **1**; costs unchanged); `knockHitsNeeded = 1 + floor(wave/20)` hit-ladder on non-bosses (bosses keep mass/`kbPool`); smoke extended; synced www; `node --check`; roadmap step 7 note; CHANGE_MEMORY pin; REMOVED untouched; Play untouched
- Notes: Wooden barricades KEPT. Early waves (1–19) knockback unchanged. Rebuild APK later when user asks. **Superseded for sideload by 3.1.1 / vc49.**

---

### 2026-08-10 — OPS / SHIPPED-BETA — TemporalRift-BETA-3.1.apk (3.1.0 / vc48)
- Version / commit / APK: **3.1.0** / versionCode **48** / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.1.apk` (+ `…-3.1.0.apk`) + Desktop copies / TR_CHANNEL=github / **not Play** / Play+GitHub stay **2.13.2** vc46
- User intent: “one more … apk check … beforehand the go ahead” — preflight all BETA-3.1 pieces, then package if pass
- Agent action: Wrote `docs/beta-3.1-preflight.md` (rows 0–5 ALL PASS + package/REMOVED/Play gates); bumped APP_VERSION 3.1.0 + gradle vc48; smoke `node --check` / `test-build-place.js` / `test-town-save.js` ALL PASS; `build-beta.ps1`; aapt verified package/version/label; updated roadmap step 6 done + CHANGE_MEMORY channel matrix; **no git commit/push; no Play upload**
- Notes: Sideload-test next — multi-dir walk, gray squad orbs/magnet/SP trees, squad laborers, brick joins, tap-place+pause. REMOVED untouched.

### 2026-08-10 — SHIPPED — BETA-3.1 step 5 tap-to-place + enemy pause (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.0.0** (versionCode 47); **no BETA-3.1 APK / no version bump**
- User intent: “okay next for step 5” — keep look-around ghost; after selecting a BUILD item, tap/click to place; freeze zombies/badguys while placing; cancel unpauses; solid + verify path; no APK
- Agent action: `buildPlaceMode` / `buildPlacePaused` — picker selects → ghost aim (barricade/Cloister/structures) → LMB/tap/Fire confirms at ghost; freezes enemy AI + ebolts + spawn (not full game pause); B/Esc/BUILD cancel unpauses; combat unchanged outside place mode; HUD `TAP TO PLACE`; `test-build-place.js` smoke; synced www; `node --check`; roadmap step 5 done (next = BETA-3.1 APK + verify brick joins + place pause); CHANGE_MEMORY; REMOVED untouched; barricades KEPT
- Notes: Wooden barricades KEPT. Final APK + post-ship verification of steps 4–5 still deferred until user asks.

---

### 2026-08-10 — SHIPPED — BETA-3.1 step 4 Cloister brickwall visual joins (no APK)
- Version / commit / APK: master Continuity only — **APP_VERSION stays 3.0.0** (versionCode 47); **no BETA-3.1 APK / no version bump**
- User intent: Fix brick/Cloister wall segments that don’t meet visually when linking posts (pillars OK); step 4 only — **do not** implement step 5 tap-place+pause yet; keep barricades; REMOVED untouched
- Agent action: Root cause = `drawBrickWallSegmentBetween` aspect-clamped 512×512 segment sheets to `BRICKWALL_SEG_DRAWH` (~36px) inside `BRICKWALL_LINK_DIST` 96, plus transparent padding. Fix: stretch content to `span − 2×BRICKWALL_SEG_INSET` with `BRICKWALL_SEG_CROP` opaque bounds; procedural length matched; collision/links unchanged. Synced `www/game.js`; `node --check`; updated `docs/beta-3.1-roadmap.md` (step 4 done; step 5 waiting; APK later + verify after BETA-3.1); CHANGE_MEMORY channel/pending
- Notes: Wooden barricades KEPT. Step 5 (tap-to-place + enemy pause) still waiting. Final APK + post-ship join verification deferred.

---

### 2026-08-10 — KEPT / DEFERRED — BETA-3.1 step 3 squad laborers + own wood/gold (no APK)
- Version / commit / APK: **3.0.0** Continuity / BETA-3 context — **APP_VERSION stays 3.0.0** / vc47 unchanged / **no APK** / **no Play** / **not store-shipped**
- User intent: “next for step 3” — trainable squad laborers (slate shirt) with own wood/gold; player laborers unchanged; no version bump / no APK; note further user steps may follow before final APK
- Agent action: Added `squadLaborers` (slate `#6a7380` tunic overlay / procedural shirt; size lock r=11 / drawH=26); wallets `squadWood`/`squadGold` (save `squad.wood`/`squad.gold`); train at Muster/Keep for ✧2 `squadSp` + ◈1 `squadCore` (cap 3); Chop/Mine/Follow/Auto deposit to squad banks only; HUD `🪵s`/`◈s` near ✧; town save `squadLaborers` additive; player laborers unchanged; workers≠squad preserved; www sync + `node --check` + town-save smoke; roadmap notes further steps may precede final APK; CHANGE_MEMORY; REMOVED untouched
- Notes: **KEPT / DONE** = step 3 squad laborers. **DEFERRED** = step 4/5 versionName 3.1.x + BETA-3.1 APK (+ any extra user steps first). discoverability_risk: low (Muster/Keep train button + HUD).

### 2026-08-10 — KEPT / DEFERRED — BETA-3.1 step 2 squad SP skill trees (no APK)
- Version / commit / APK: **3.0.0** Continuity / BETA-3 context — **APP_VERSION stays 3.0.0** / vc47 unchanged / **no APK** / **no Play** / **not store-shipped**
- User intent: “next for step 2” — bigger companion + militia skill trees spending `squadSp`; player SP untouched; no version bump / no APK
- Agent action: Expanded `COMP_NODES` to 5 nodes each (HP/dmg/rate/squad-orb magnet + prior unique); companion ranks debit `squadSp` (✧1) via `skillRanks`; militia tree adds `rate`/`magnet` with ✧1/2/3 costs (save `town.militia[].sk` additive); unit panels + Muster **✧ SQUAD SKILLS** + field lab **squad skills ✧** + K SQUAD column; player skill columns still use `player.sp`; `squadCores` unused this step; www sync + `node --check` + town-save smoke; roadmap/CHANGE_MEMORY; REMOVED untouched
- Notes: **KEPT / DONE** = step 2 squad SP trees. **DEFERRED** = step 3 squad laborers + own wood/gold; step 4/5 versionName 3.1.x + BETA-3.1 APK. discoverability_risk: low (unit panel + Muster/lab links + existing K tree).

### 2026-08-10 — KEPT / DEFERRED — BETA-3.1 step 1 squad orbs + magnet + SP bank (no APK)
- Version / commit / APK: **3.0.0** Continuity / BETA-3 context — **APP_VERSION stays 3.0.0** / vc47 unchanged / **no APK** / **no Play** / **not store-shipped**
- User intent: Start BETA-3.1 one step at a time; step 1 = extra gray/light-gray squad-only orbs on enemy death + squad magnets + squad SP bank; do not reduce player drops; no version bump / no APK; wait for “next” on steps 2–5
- Agent action: Roadmap `docs/beta-3.1-roadmap.md`; `killEnemy` spawns EXTRA `squad_sp` (dark gray → `squadSp` +1) + chance `squad_core` (light gray → `squadCores` +1); player magnet + Rover fetch ignore squad orbs; companions+militia attract via `squadMagnetRange()` (= player magnet); laborers excluded (workers≠squad); save additive `squad.sp`/`squad.cores`; HUD `✧ squadSpNum`; www sync + `node --check`; CHANGE_MEMORY; REMOVED untouched
- Notes: **KEPT / DONE** = step 1 orbs/magnet/wallets. **DEFERRED** = step 2 bigger companion/militia SP trees; step 3 squad laborers + own wood/gold; step 4/5 versionName 3.1.x + BETA-3.1 APK. Currency choice documented (separate SP + cores wallets). discoverability_risk: low (auto magnet; HUD compact).

### 2026-08-10 — KEPT / DEFERRED — Multi-dir 3-view walk for Continuity unit skins (no APK)
- Version / commit / APK: **3.0.0** Continuity / BETA-3 context — **APP_VERSION stays 3.0.0** / vc47 unchanged / **no APK** / **no Play** / **not store-shipped**
- User intent: Ship multi-dir walk (front + side + back) for all Continuity unit skins; keep sizes locked; leave REMOVED untouched; no version bump / no APK
- Agent action: Added `walk-side.png` + `walk-back.png` per unit (husk/zombie, skeleton, bulwark, shaman, ravager, gharok, rover, warden, scout, sentinel, laborer) via `scripts/process-multidir-sprites.mjs` → 512 transparent + www sync; code `unitViewFromVel` + `unitPickDirWalk` with soft-load on each *Spr; L/R via existing facing scale of side sheet; sizes (r/drawH) UNCHANGED; docs `multi-dir-views-plan.md` + UNIT_SIZES multi-dir additive note + CHANGE_MEMORY; REMOVED list untouched
- Notes: **KEPT / DONE** = 3-view walk. **DEFERRED** = attack/death/windup still front-only; militia art sheets (procedural L/R facing tweak only this pass); idle-side/idle-back skipped; buildings N/A (don't walk). discoverability_risk: none (auto from velocity; not menu-only).

### 2026-08-10 — OPS / SHIPPED-BETA — TemporalRift-BETA-3 Continuity apply (not Play)
- Version / commit / APK: **3.0.0** (versionCode **47**) / `com.drpep.temporalrift.beta` / `rollouts\TemporalRift-BETA-3.apk` (+ `TemporalRift-BETA-3.0.0.apk`) / TR_CHANNEL=github / **not Play store** / Play+GitHub stay **2.13.2** vc46
- User intent: Package post-2.13.2 Continuity work into a separate BETA-3 sideload APK; flip soft-wire art flags ON for deferred batch; keep Play 2.13.2 untouched; no militia sheets; no REMOVED re-adds; no commit/push unless required
- Agent action: Flipped `RAVAGER_SPRITE_ENABLED` + `KEEP`/`CAMP`/`TIMBER`/`SUPPLY`/`HALL`/`VAULT`/`PIT_SPRITE_ENABLED` → true; confirmed Rover/Warden/Scout/Sentinel/Laborer + BRICKWALL already ON; bumped APP_VERSION 3.0.0 / vc47; ran `build-beta.ps1`; updated CHANGE_MEMORY channel matrix + decisions; militia art mesh still DEFERRED
- Notes: Included Continuity batch = town/`town` save + Cloister Wall + ravager/building sprites ON + companions/laborer ON + militia procedural articulation. **DEFERRED→OPS/SHIPPED-BETA** (sideload test only). REMOVED untouched.

### 2026-08-10 — KEPT / DEFERRED — Muster militia procedural articulation post-confirm (no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **unpinned** / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append/confirm CHANGE_MEMORY after militia procedural articulation ship; no version bump; REMOVED untouched; only patch gaps
- Agent action: Confirmed decisions KEPT/DEFERRED + UNIT_SIZES + backlog + batch order + changelog already matched (procedural ON via `drawMilitia`/`drawFigure`; size lock r=12 / s=0.78; cloth `#5a6878`/`#6a7a58`; art mesh pending `assets/militia/_refs`; no sheets/flags; barks skipped; no APK). Filled gaps — channel matrix row (master-only / store lag) + changelog cloth palette + barks-skipped pin. REMOVED list untouched.
- Notes: KEPT = procedural articulation. DEFERRED = art mesh. APP_VERSION stays 2.13.2 / vc46.

### 2026-08-10 — KEPT / DEFERRED — Muster militia procedural articulation (art mesh later)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; commit **unpinned**; **not store-shipped**
- User intent: Articulate muster militia movements on current procedural spear/bow (`drawMilitia`/`drawFigure`); defer militia art mesh/refs; do not generate sheets or flip sprite flags; size lock r=12 / s=0.78; keep cloth palette; no companion/laborer redo; no APK
- Agent action: Enhanced `drawFigure` plantAmp/bobAmp/gaitLean/legAmp + downed collapse + stronger hurt lean; spear aim/thrust vs bow draw/release on swipeT; `drawMilitia` companion-tier plant on locked footprint; idle walk tick for breath; www sync + `node --check`; UNIT_SIZES + CHANGE_MEMORY; **militia art mesh still pending** (`assets/militia/_refs`); REMOVED untouched; barks skipped this pass
- Notes: KEPT = procedural articulation live. DEFERRED = art mesh/skins. Size lock confirmed. Palette spear `#5a6878` / bow `#6a7a58`.

### 2026-08-10 — DEFERRED — Ashen Laborer articulation+barks post-confirm (flag ON Continuity; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **unpinned** / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Laborer articulation pass completed; do not re-add REMOVED; short append only
- Agent action: Confirmed channel matrix / pending / changelog / laborer-art-plan (status articulate ON) / UNIT_SIZES / decisions already matched — `LABORER_SPRITE_ENABLED=true` Continuity (store deferred); size lock r=11 / drawH=26; idle↔walk gait half-cycle / work on gatherT/swipeT / death when downed / heavy worker plant (~mid Sentinel) / cyan work glow; voice `laborer` CHOP/ORE/HEAVE/BACK TO WORK/OOF (not orc/dog/scout/warden/sentinel); remesh kept (no redo); Desktop `TemporalRift-Laborer-Sprites`; workers≠squad; militia skins still pending; REMOVED untouched; no gap fills
- Notes: APP_VERSION stays 2.13.2 / vc46; no APK. Store deferred with peer batch.

### 2026-08-10 — DEFERRED — Ashen Laborer articulation+barks ON Continuity (no APK)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; `LABORER_SPRITE_ENABLED=true` for Continuity/source testing; commit **unpinned**; **not store-shipped**
- User intent: Next for articulation movement — same Scout/Sentinel articulate pass; remesh already present → proceed; flag ON master Continuity; no APK / no version bump
- Agent action: Kept remesh sheets (ash-grey+ochre; cyan cuff/pick-tip — original enough, no redo); upgraded `laborerSpriteFrame` idle↔walk gait half-cycle + work on gatherT/swipeT + death; `drawLaborerSprite` heavy worker plant (~mid Sentinel) + cyan work glow; `tryLaborerBark` + synth `voice:'laborer'` (CHOP/ORE/HEAVE/BACK TO WORK/OOF alert/work/attack/combat/hurt); wired hurt + gather work + retaliate alert/attack/combat; size lock r=11 / drawH=26; www sync; Desktop refresh; docs laborer-art-plan + UNIT_SIZES + CHANGE_MEMORY; REMOVED untouched; workers≠squad unchanged
- Notes: Store deferred with peer batch. Militia skins still pending. Procedural `drawLaborer` fallback stays.

### 2026-08-10 — DEFERRED — Ashen Laborer originality remesh post-confirm (flag OFF; no articulate; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Laborer originality remesh; do not mark store-shipped; REMOVED untouched; only fix gaps
- Agent action: Confirmed channel matrix / pending / changelog / laborer-art-plan / decisions already matched (`LABORER_SPRITE_ENABLED=false`, r=11 / drawH=26, soft-wire stub only, ash-grey+ochre + cyan cuff/pick-tip + short beard/goggles, not gallery dwarf clone, Desktop `TemporalRift-Laborer-Sprites`, militia skins pending, no APK); filled gaps — UNIT_SIZES collision note still said “sheets drafted”; drawH/animation notes missing scarf/satchel + dual-braid/forehead-gem avoid + APP_VERSION/no-APK/militia-pending pins; REMOVED list untouched
- Notes: Workers≠squad. Articulate + flag flip = later user ask. Militia skins still pending. Remesh for originality — not store-shipped.

### 2026-08-10 — DEFERRED — Ashen Laborer originality remesh (flag OFF; no articulate; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Prior Laborer sheets too copied from Google/ref dwarf miner (cyan lamp + dual braid); remesh into original TR worker borrowing traits only; keep flag OFF until articulate ask; finish soft-wire/docs
- Agent action: Regenerated idle/walk/work/death (ash-grey+ochre leather; cyan wrist cuff + pick-tip glow; short beard/scarf/goggles; simpler satchel — not forehead gem + diamond pack lantern / dual-braid clone); `process-laborer-sprites.mjs` → 512 sheets + www sync; Desktop+Pictures `TemporalRift-Laborer-Sprites`; soft-wire intact `LABORER_SPRITE_ENABLED=false` / drawH=26 / r=11; docs laborer-art-plan + UNIT_SIZES + CHANGE_MEMORY; REMOVED untouched
- Notes: Workers≠squad. Articulate + flag flip = later user ask. Militia skins still pending. Remesh for originality — not store-shipped.

### 2026-08-10 — DEFERRED — #3d Ashen Sentinel articulation+barks post-ship confirm (commit unpinned; flag ON Continuity; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **unpinned** (pending commit — not landed yet) / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Ashen Sentinel articulation+barks on master Continuity; do not mark store-shipped; REMOVED untouched; only fix gaps
- Agent action: Confirmed channel matrix / pending / changelog / sentinel-art-plan / decisions already largely matched (flag ON Continuity, size lock r=13/drawH=44, #3d done, all four companions Continuity ON, store deferred, no APK, commit unpinned); filled gaps — UNIT_SIZES still said flag OFF / no articulate; pending+changelog+art-plan+implementation bark lines missing BRACE + half-cycle / mid-plant weight; REMOVED list untouched
- Notes: Articulation: idle↔walk gait half-cycle, attack on swipeT, death when downed, mid plant squash/bob/lean (heavier than Scout, lighter than Warden), amber aether attack glow. Barks: voice `sentinel` militia spear — HOLD THE LINE/THRUST/SPEAR UP/BRACE (alert/attack/combat/hurt); not orc/dog/Scout/Warden. Ally #3d Sentinel done; all four companions Continuity ON.

### 2026-08-10 — DEFERRED — #3d Ashen Sentinel articulation+barks (flag ON Continuity; no APK)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; `SENTINEL_SPRITE_ENABLED=true` for Continuity/source testing; commit **unpinned**
- User intent: Open Sentinel sprites + next for articulate movement — same as Scout pass; flag ON master Continuity; no APK / no version bump
- Agent action: Opened Desktop `TemporalRift-Sentinel-Sprites` + idle in editor; gait idle↔walk + attack on swipeT spear + death sheet; mid plant squash/bob/lean; amber aether attack glow; militia bark voice (`voice:'sentinel'`) + HOLD THE LINE/THRUST/SPEAR UP/BRACE lines (alert/attack/combat/hurt); size lock `r=13` / `drawH=44` unchanged; docs sentinel-art-plan + CHANGE_MEMORY + UNIT_SIZES + decisions; www sync game.js
- Notes: **Not store-shipped.** Ally #3d Sentinel done. All four companions Continuity ON (Rover/Warden/Scout/Sentinel).

### 2026-08-10 — DEFERRED — #3d Ashen Sentinel art draft post-confirm (flag OFF; commit unpinned; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **unpinned** (pending commit — not landed yet) / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Ashen Sentinel art draft on master Continuity; do not mark store-shipped; REMOVED untouched; only fix gaps
- Agent action: Confirmed channel matrix / pending / changelog / UNIT_SIZES / sentinel-art-plan already largely matched (`SENTINEL_SPRITE_ENABLED=false`, size lock r=13 / drawH=44 between Scout 38 and Warden 48, soft-wire stub only — no articulate/barks, weathered bronze/steel + forest-green cloak + amber aether spear, mesh refs inspiration only strip LOTR/Bastion/Rescale, Desktop `TemporalRift-Sentinel-Sprites`, #3d articulate next, APP_VERSION 2.13.2 / vc46 no APK); filled gaps — decisions entry missing; channel/pending/changelog/#3d + commit-unpinned + store-deferred pins; UNIT_SIZES between-Scout/Warden note; sentinel-art-plan commit-unpinned ship note; REMOVED list untouched
- Notes: **Not store-shipped.** Ally **#3d** art drafted flag OFF; articulate+barks next. Procedural companionFigure stays live.

### 2026-08-10 — DEFERRED — #3c Ashen Scout articulation+barks post-ship confirm (commit unpinned; flag ON Continuity; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **unpinned** (pending commit — not landed yet) / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Scout articulation+barks on master Continuity; do not mark store-shipped; REMOVED untouched; only fix gaps
- Agent action: Confirmed channel matrix / pending / changelog / scout-art-plan / decisions already largely matched (flag ON Continuity, size lock r=13/drawH=38, #3c done, Sentinel pending, store deferred, no APK); filled gaps — UNIT_SIZES scout/sentinel note still said flag OFF; pending+changelog+channel commit-unpinned + purple aether attack glow + DRAW/SUPPLY bark detail; scout-art-plan bark/glow/commit notes; REMOVED list untouched
- Notes: Articulation: idle↔walk gait half-cycle, attack on swipeT, death when downed, lighter plant squash/bob/lean than Warden, purple aether attack glow. Barks: voice `scout` bright ranger recon chirp — MARKED/LOOSE/ON POINT/DRAW/SUPPLY etc (alert/attack/combat/hurt/pack); not orc, not dog, not Warden tank vox. Ally #3c Scout done; Sentinel still pending.

### 2026-08-10 — DEFERRED — #3c Ashen Scout articulation+barks (flag ON Continuity; no APK)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; `SCOUT_SPRITE_ENABLED=true` for Continuity/source testing; commit **unpinned** (pending)
- User intent: Next for articulate movement — same as Rover/Warden pass; articulate move + bark; flag ON master Continuity; no APK / no version bump
- Agent action: Gait idle↔walk + attack on swipeT bow draw + death sheet; lighter plant squash/bob/lean on sprite path; purple aether attack glow; ranger recon bark voice (`voice:'scout'`) + original MARKED/LOOSE/ON POINT/DRAW/SUPPLY lines (alert/attack/combat/hurt/pack); size lock `r=13` / `drawH=38` unchanged; docs scout-art-plan + CHANGE_MEMORY + UNIT_SIZES + decisions; www sync game.js
- Notes: **Not store-shipped.** Distinct from Warden tank vox and Rover dog. Ally #3c Scout done; Sentinel still pending.

### 2026-08-10 — DEFERRED — Ashen Scout art draft (flag OFF; no articulate; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / **no BETA APK** / **no version bump** / **no Play**
- User intent: Mesh Scout companion bright green + purple power-armor archer (arrow guy, not yellow Warden tank); soft-wire OFF; no APK; no articulate yet; Desktop + Photos; docs + CHANGE_MEMORY; commit+push
- Agent action: Generated original Ashen Scout idle/walk/attack/death (512×512 transparent); refs under `assets/allies/scout/_refs/` (power-armor bulk + armored archer pose/bow — not Fallout BoS / Destiny IP); size lock collision `r=13` unchanged, flag ON → `drawH=38`; soft-wire `SCOUT_SPRITE_ENABLED=false` (basic stub, no gait plant/barks); docs `scout-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Scout-Sprites` (+ Pictures); www sync sheets (no `_refs`)
- Notes: Procedural ranger stays live. Articulate + barks = later user ask. Sentinel still pending.

### 2026-08-09 — DEFERRED — #3b Ashen Warden post-ship docs pins (2114ce3 / a55db1e)
- Version / commit / APK: **2.13.2** / vc46 unchanged / code **`abe9e02`** + docs pins **`2114ce3`** / **`a55db1e`** / **no BETA APK** / **no version bump** / **no Play** / **not store-shipped**
- User intent: Append CHANGE_MEMORY after Ashen Warden articulation+barks ship on master Continuity; do not mark store-shipped; REMOVED untouched; only fix gaps
- Agent action: Confirmed channel matrix / pending / changelog / batch order already matched (flag ON Continuity, size lock r=13/drawH=48, #3b done, Scout/Sentinel pending, store deferred, no APK); appended missing docs pins **2114ce3** / **a55db1e** + fuller articulation/bark detail on pending+changelog rows; REMOVED list untouched
- Notes: Articulation: idle↔walk gait, attack on swipeT, death when downed, heavy plant squash/bob/lean. Barks: voice `warden` deep metallic armored robot guardian — CONTACT/FIRE/HOLD LINE etc (not orc, not dog). Ally #3b Warden done; Scout/Sentinel still pending.

### 2026-08-09 — DEFERRED — #3b Ashen Warden articulation+barks post-ship confirm (abe9e02; flag ON Continuity; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **`abe9e02`** pushed `origin/master` / **no BETA APK** / **no version bump** / **no Play**
- User intent: Append post-ship change memory after Warden articulation+barks; do not mark store-shipped; REMOVED untouched; Scout/Sentinel still next
- Agent action: Confirmed CHANGE_MEMORY channel/pending/changelog already matched (flag ON Continuity, size lock r=13/drawH=48, store deferred); pinned commit hash here; REMOVED list untouched
- Notes: **Not store-shipped.** Sheets gait idle↔walk, attack on swipeT, death when downed, heavy plant squash/bob/lean; bark voice `warden` (deep metallic, not orc/dog) + alert/attack/combat/hurt (mute-aware). Scout/Sentinel still pending.

### 2026-08-09 — DEFERRED — #3b Ashen Warden articulation+barks (flag ON Continuity; no APK)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; `WARDEN_SPRITE_ENABLED=true` for Continuity/source testing; later pinned **`abe9e02`**
- User intent: Next for articulation movement — same as Rover pass; articulate move + bark; flag ON master Continuity; no APK / no version bump
- Agent action: Gait idle↔walk + attack on swipeT pulse-cannon + death sheet; heavy plant squash/bob/lean on sprite path; armored-robot guardian bark voice (`voice:'warden'`) + original CONTACT/FIRE/HOLD LINE lines (alert/attack/combat/hurt); size lock `r=13` / `drawH=48` unchanged; docs warden-art-plan + CHANGE_MEMORY + UNIT_SIZES + decisions; www sync game.js
- Notes: **Not store-shipped.** Distinct from orc enemy barks and Rover dog woofs (deep metallic square synth). Procedural `companionFigure` remains fallback. Scout/Sentinel still pending. REMOVED list intact.

### 2026-08-09 — DEFERRED — #3b Ashen Warden art drafted (flag OFF; no APK)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / commit **`4c66510`** pushed `origin/master` / **no BETA APK** / **no live enable** / **no articulation yet**
- User intent: Mesh knight + yellow mech refs into original Ashen Warden (yellowish priority); soft-wire OFF; Desktop Photos; size lock r=13; no APK / no version bump; articulate later like Rover
- Agent action: Generated original Ashen Warden idle/walk/attack/death (512×512 transparent); refs under `assets/allies/warden/_refs/` (knight structure + yellow mech palette; not Warframe/Destiny IP); size lock collision `r=13` unchanged, flag ON → `drawH=48`; soft-wire `WARDEN_SPRITE_ENABLED=false`; docs `warden-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Warden-Sprites` (+ Pictures); www sync sheets (no `_refs`)
- Notes: Ally **#3b Warden art only**. Procedural cannon figure still live. Scout/Sentinel still pending. REMOVED list intact.

### 2026-08-09 — DEFERRED — #3a Ashen Rover articulation+barks post-ship confirm (4b9b2ea; flag ON Continuity; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **`4b9b2ea`** pushed `origin/master` / **no BETA APK** / **no version bump** / **no Play**
- User intent: Append post-ship change memory after Rover articulation+barks; do not mark store-shipped; REMOVED untouched; #3b still next
- Agent action: Confirmed CHANGE_MEMORY channel/pending/changelog already matched (flag ON Continuity, size lock r=11/drawH=26, store deferred); pinned commit hash here; REMOVED list untouched
- Notes: **Not store-shipped.** Sheets gait idle↔walk, attack on swipeT, death when downed, plant squash/bob/lean; bark voice `rover` (higher/shorter than orcs) + alert/attack/combat/hurt/fetch (mute-aware). Ally **#3b** Warden/Scout/Sentinel still next.

### 2026-08-09 — DEFERRED — #3a Ashen Rover articulation+barks (flag ON Continuity; no APK)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; `ROVER_SPRITE_ENABLED=true` for Continuity/source testing; later pinned **`4b9b2ea`**
- User intent: Art approved — add articulate move + bark like ravager after art; flag ON for master Continuity testing; still no APK / no version bump / no Play; store ship deferred with batch
- Agent action: Gait idle↔walk + attack on swipeT + death sheet; plant squash/bob/lean on sprite path; aether-hound bark voice (`voice:'rover'`) + original woof/grr/alert lines (alert/attack/combat/hurt/fetch); size lock `r=11` / `drawH=26` unchanged; docs rover-art-plan + CHANGE_MEMORY + decisions; www sync game.js
- Notes: **Not store-shipped.** Distinct from orc enemy barks (higher/shorter synth). Procedural `drawRover` remains fallback. Ally #3b Warden/Scout/Sentinel still pending. REMOVED list intact.

### 2026-08-09 — DEFERRED — #3a Ashen Rover post-ship confirm (cd8a042; flag OFF; no APK)
- Version / commit / APK: **2.13.2** / vc46 unchanged / commit **`cd8a042`** pushed `origin/master` / **no BETA APK** / **no version bump** / **no live enable**
- User intent: Record post-ship change memory after ally #3a dog art draft; do not mark shipped/live; do not re-add REMOVED
- Agent action: Confirmed master-only soft-wire `ROVER_SPRITE_ENABLED=false` (procedural `drawRover` live); sheets `assets/allies/rover/{idle,walk,attack,death}.png` + `_refs/` (cybernetic dog mesh; not Boston Dynamics / branded IP); size lock collision `r=11` unchanged, flag ON → `drawH=26`; Desktop `C:\Users\drpep\Desktop\TemporalRift-Rover-Sprites`; www sync sheets (no `_refs`); CHANGE_MEMORY channel/pending already aligned
- Notes: **Not shipped/live** — flag stays OFF. Ally batch **#3a dog only**; **#3b** Warden/Scout/Sentinel next when user photos or says go. REMOVED list intact.

### 2026-08-09 — DEFERRED — #3a Ashen Rover / Rift Hound art drafted (flag OFF; no APK)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK** / **no live enable**
- User intent: Allies art pass start with dog only; mesh cybernetic/robot dog refs into original Temporal Rift Rover; soft-wire OFF; Desktop Photos; no APK / no version bump; Warden/Scout/Sentinel later
- Agent action: Generated original Ashen Rover idle/walk/attack/death (512×512 transparent); refs under `assets/allies/rover/_refs/`; size lock `r=11` / `drawH=26` (collision r unchanged); soft-wire `ROVER_SPRITE_ENABLED=false`; docs `rover-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Rover-Sprites`; www sync sheets (no `_refs`)
- Notes: Ally batch **#3a dog only**. Procedural `drawRover` still live. Ready for #3b skill-tree squad when user photos or says go. REMOVED list intact. Not Boston Dynamics / branded IP copies.

### 2026-08-09 — DEFERRED — Cloister / brick stronghold walls systems+art (no APK)
- Version / commit / APK: master code+art only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; systems ON for Continuity/source testing only
- User intent: Mesh brick fence refs as modular sections (straight / corners / T-junctions); Continuity town save; no APK / no version bump; keep wooden barricades; store ship deferred
- Agent action: Modular sprites `assets/buildings/brickwall/{pillar,segment,corner,tee}(+damaged).png` + `_refs`; BUILD → **Cloister Wall** (wood 10 / gold 4 / cores 2; HP 280; max 16) with cardinal auto-link straights + corners/T + LINK ghost (like barricades); collide + HP brace; Continuity `town.brickWalls` additive with barricades; `BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true`; docs `brickwall-art-plan.md` + CHANGE_MEMORY channel/pending/KEPT; Desktop `C:\Users\drpep\Desktop\TemporalRift-BrickWall-Sprites`; `test-town-save.js` covers `brickWalls`
- Notes: **Not store-shipped.** Store ship still deferred with Continuity + ravager/building-art batch. Wooden barricades KEPT (Cloister additive). REMOVED list intact.

### 2026-08-09 — DEFERRED — #2e Aether Pit art drafted (flag OFF; no APK)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK** / **no live enable**
- User intent: Mesh stone well / earth pit / tiered quarry / rocky crater structure refs + Razer lamp **glow mood only** into Aether Pit; soft-wire OFF; Desktop Photos; no APK / no version bump / no live enable; same pipeline as keep/camp/hall/vault
- Agent action: Generated original Aether Pit idle/damaged (512×512 transparent); refs under `assets/buildings/pit/_refs/` incl. `aether-glow-mood-insp` (README: glow/lighting mood ONLY — no lamp object/logo/product); size lock `r=38` / `drawH=48` (collision r unchanged); soft-wire `PIT_SPRITE_ENABLED=false`; docs `pit-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Pit-Sprites`; www sync sheets (no `_refs`)
- Notes: Keep/camp/hall/vault already drafted flag OFF. Building-art batch #2a–#2e complete (all flags OFF). Apply pit (flag ON) with stronghold + town-save batch. REMOVED list intact — nothing added to REMOVED. No lamp/logo/branded product in sheets.

### 2026-08-09 — DEFERRED — #2d Gold Vault remesh to mine-mouth (flag OFF; no APK)
- Version / commit / APK: assets+docs only (no APP_VERSION / versionCode bump) / **no BETA APK** / **no live enable**
- User intent: Remesh Gold Vault from freestanding stronghouse/arcade vault look to dug-into-hill / fortified mine-mouth aesthetic; soft-wire stays OFF; Desktop Photos; no APK / no version bump / no live enable
- Agent action: Replaced `assets/buildings/vault/{idle,damaged}.png` with timber-framed rocky bunker mouth + aether-gold interior glow (no readable IP/sign text); new `_refs/`: `hillside-bunker-mouth-insp`, `rocky-cave-ladder-insp`, `timber-frame-mine-mouth-insp` (old arcade refs removed); kept `VAULT_SPRITE_ENABLED=false`, sizes `r=40` / `drawH=52` unchanged; docs `vault-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Vault-Sprites` refreshed
- Notes: Prior arcade/stronghouse mesh superseded. Aether Pit still pending; apply vault (flag ON) with stronghold batch. REMOVED list intact — nothing added to REMOVED.

### 2026-08-09 — DEFERRED — #2c Muster Hall + #2d Gold Vault art drafted (pit pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `080094b` / **no BETA APK**
- User intent: Mesh town-hall / half-timber / gothic / arcade refs into Muster Hall (#2c) then Gold Vault (#2d); soft-wire flags OFF; Desktop photos; no APK / no live enable / no stronghold this pass
- Agent action: Generated original Muster Hall + Gold Vault idle/damaged (512×512 transparent); refs under `assets/buildings/hall/_refs/` + `vault/_refs/`; size locks muster `r=46`/`drawH=60`, vault `r=40`/`drawH=52` (collision r unchanged); soft-wire `HALL_SPRITE_ENABLED=false` / `VAULT_SPRITE_ENABLED=false`; docs `hall-art-plan.md` + `vault-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `TemporalRift-Hall-Sprites` + `TemporalRift-Vault-Sprites`; www sync sheets (no `_refs`)
- Notes: Keep/camp already drafted flag OFF. Aether Pit still pending. Flip hall/vault flags + apply with Keep/camp/ravager + stronghold + town-save batch. REMOVED list intact. Original Ashen/Rift naming — inspiration only.

### 2026-08-09 — DEFERRED — #2b Camp art drafted (halls pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `0484c67` / **no BETA APK**
- User intent: Mesh medieval camp refs into Timber Camp / Supply Camp building art (#2b); soft-wire flags OFF; Desktop photos; no APK / no live enable / no halls / no stronghold this pass
- Agent action: Generated original Timber + Supply idle/damaged (512×512 transparent) + shared idle/damaged; refs under `assets/buildings/camp/_refs/`; size lock timber `r=40`/`drawH=50`, supply(farm) `r=36`/`drawH=46` (collision r unchanged); soft-wire `CAMP_SPRITE_ENABLED`/`TIMBER_SPRITE_ENABLED`/`SUPPLY_SPRITE_ENABLED=false`; docs `camp-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `TemporalRift-Camp-Sprites`; www sync sheets (no `_refs`)
- Notes: #2a Keep already drafted flag OFF. Muster/halls still pending user photos. Flip camp flags + apply with Keep + ravager + stronghold + town-save batch. REMOVED list intact. Original Ashen/Rift camp naming — inspiration only.

### 2026-08-09 — DEFERRED — #2 Keep art drafted (halls/camps pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK**
- User intent: Mesh castle/keep refs into Rift Keep building art only for batch #2 part 1; halls/camps later; soft-wire flag OFF; Desktop photos; no APK / no live enable / no brick stronghold this pass
- Agent action: Generated original Rift Keep idle+damaged (512×512 transparent); refs under `assets/buildings/keep/_refs/`; size lock collision `r=54` / `drawH=72` (procedural ~42×56); soft-wire `KEEP_SPRITE_ENABLED=false`; docs `keep-art-plan.md` + CHANGE_MEMORY; Desktop `TemporalRift-Keep-Sprites`; www sync sheets (no `_refs`)
- Notes: Halls/timber/supply/muster/camps pending user photos (#2 parts). Flip flag + apply with stronghold + town-save batch. REMOVED list intact. Original keep — not a named real-world castle clone.

### 2026-08-09 — DEFERRED — Ashen Ravager articulation + barks coded (flag OFF; ship later)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**
- User intent: After approving Ravager art — “next!” add articulation with movements + sounds like other sprite foes; stop; buildings (#2) separately; don’t ship store update yet
- Agent action: Wired idle↔walk↔windup + heavier plant squash/bob/lean on sprite path; size gates `RAVAGER_R`/`RAVAGER_FIGURE_S`/`drawH=100` follow flag; distinct deep cyclops-orc bark lines + lower/longer synth voice vs bulwark; left `RAVAGER_SPRITE_ENABLED=false` (live procedural unchanged); UNIT_SIZES + ravager-art-plan + CHANGE_MEMORY; www sync sheets (no `_refs`)
- Notes: Flip one flag line to enable locally/ship. Store enable deferred with stronghold + building-art batch. Ready for #2 building photos. REMOVED list intact. No WoW/Blizzard IP.

### 2026-08-09 — DEFERRED — Ashen Ravager art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK**
- User intent: Mesh 6 orc/cyclops/zombie refs into one-eyed fat zombie-orc Ravager sheets; size between others and boss; soft-wire flag OFF; Desktop photos; stop before articulation/sounds; no APK / no live enable
- Agent action: Generated original Ashen Ravager / Rift Cyclope idle/walk/windup (512×512 transparent); refs under `assets/ravager/_refs/`; planned size lock `r=36` / `drawH=100` / `s≈2.78` (live still `r=24` / `s=1.7`); soft-wire `RAVAGER_SPRITE_ENABLED=false`; docs + Desktop `TemporalRift-Ravager-Sprites`; CHANGE_MEMORY pending
- Notes: Articulation/barks when user says "next". Flip flag + apply size with update batch. No WoW/Saurfang/Blizzard IP. No stronghold this pass.

### 2026-08-09 — DEFERRED — Town/RTS save fix coded (ship with stronghold+art batch)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play AAB / no versionCode bump**
- User intent: Continue after quit lost buildings, Ashen Laborers, and Muster militia (companion squad was fine); fix in code + document for next update batch with fence brick stronghold; do not apply/build/release this pass
- Agent action: Extended `snapshot`/`loadGame` with additive `town` payload (structures+levels, laborers orders/HP/downed, militia skills/HP/pos, barricades, waveTrainLeft, gold mine stocks); wood/gold already saved; old saves without `town` keep starter Keep+laborers; companion/player/wave/skill-tree untouched; smoke test `test-town-save.js`; CHANGE_MEMORY pending note
- Notes: Next ship bundles save fix + stronghold + more art. Suggested batch order: (1) ravager last enemy mesh (2) building art mesh (3) ally/militia/laborer skins if photos (4) fence brick stronghold systems (5) one update apply. REMOVED list intact.

### 2026-08-09 — SHIPPED — Play Closed testing 2.13.2 live
- Version / commit / APK: 2.13.2 (versionCode 46) / Play Closed testing (`playstore/TemporalRift-2.13.2.aab`, TR_CHANNEL=play)
- User intent: Confirm Play Closed rollout finished — “nvm it worked”
- Agent action: Interrupted unfinished browser/rollout work as SUCCESS; updated channel matrix Play Closed → **2.13.2** (versionCode 46); cleared AAB-upload-pending + Ops pending row; docs-only commit
- Notes: User confirmed Closed testing live from their side; prior OPS handoff “upload pending” superseded

### 2026-08-09 — OPS — Public channel ship: GitHub v2.13.2 + Play AAB handoff
- Version / commit / APK: 2.13.2 (versionCode 46) / tag `v2.13.2` / GitHub `TemporalRift.apk` (TR_CHANNEL=github) / Play `playstore/TemporalRift-2.13.2.aab` + `rollouts/rollout-4-v2.13.2/` (TR_CHANNEL=play, verified)
- User intent: Roll 2.13.2 as a real update (not BETA sideload); user at Play Console with only ≤2.8 available — need 2.13.2 Play AAB ASAP
- Agent action: Verified existing play AAB (TR_CHANNEL=play); opened Explorer on `rollouts/rollout-4-v2.13.2/TemporalRift-2.13.2.aab`; created GitHub Release 8 tag `v2.13.2` with github-channel APK; updated channel matrix (GitHub=2.13.2; Play=AAB ready, upload pending)
- Notes: Do **not** upload `TemporalRift-2.8.aab`. Play Closed status flips to 2.13.2 only after Console upload. REMOVED list intact (no ENTERING popup, no GitHub banner on Play, no IP names). No stronghold / no ravager art this ship.

### 2026-08-09 — SHIPPED — v2.13.2 enemy→ravager size + laborer retaliate + squad buff
- Version / commit / APK: 2.13.2 (versionCode 46) / `f921eca` / BETA `TemporalRift-BETA-2.13.2.apk`
- User intent: Sprite foes nearly ravager-sized (skeleton unchanged); laborers attack back only if hit; companions+militia smidge stronger; skip stronghold/brick walls
- Agent action: Size pass husk/sprinter/bulwark/shaman toward ravager; skeleton left at 2.13.1; laborer `retaliateT` on-damage only (removed threaten engage + flee-to-fight); slight companion/militia HP+dmg; UNIT_SIZES + CHANGE_MEMORY; stronghold skipped
- Notes: Gharok/ravager/sprites/barks/RTS core intact. Old→new sizes in UNIT_SIZES.md.

### 2026-08-09 — SHIPPED — v2.13.1 enemy size + militia engage + laborer revive/defend
- Version / commit / APK: 2.13.1 (versionCode 45) / `306a9be` / BETA `TemporalRift-BETA-2.13.1.apk`
- User intent: Bad guys a bit bigger than player (not boss); spear/militia actually attack; peasants revivable + defend; keep rest intact
- Agent action: Modest drawH/r bumps (husk/sprinter/skel/bulwark/shaman); militia aggro near self OR player + spear reach; laborers downed+Talk revive + flee-to-fight; workers≠squad kept; UNIT_SIZES + CHANGE_MEMORY updated; REMOVED list intact
- Notes: Gharok/RTS/sprites/barks left intact. Old→new sizes documented in UNIT_SIZES.md.

### 2026-08-09 — SHIPPED — v2.13.0 sprites APPLIED + enemy barks
- Version / commit / APK: 2.13.0 (versionCode 44) / `2ec64a1` / BETA `TemporalRift-BETA-2.13.0.apk`
- User intent: Articulate enemy walk; orc talk/barks with different voices; apply deferred skeleton/bulwark/shaman sprites; ship BETA; leave Gharok movement intact
- Agent action: Enabled `SKELETON_SPRITE_ENABLED` / `BULWARK_SPRITE_ENABLED` / `SHAMAN_SPRITE_ENABLED`; verified husk still on; gait plant/squash polish; bark synth + original lines (rate-limited, mute-aware); Gharok left as-is from 2.12.x; size locks untouched
- Notes: Ravager still procedural. No Play upload. Copyright-safe lines only.

### 2026-08-09 — DEFERRED — Ashen Shaman art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / ccefeae / **no BETA APK**
- User intent: Mesh 4 shaman/mage refs into detailed caster sprites like Husk/Skeleton/Bulwark; art for NPCs; no new APK this pass
- Agent action: Generated original Ashen Shaman / Rift Hexer idle/walk/windup; size lock `r=13` / `drawH=36` (36×1.0 husk baseline); soft-wire behind `SHAMAN_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for NPC #4 ravager. Flip flag + BETA when applying. No WoW/Blizzard/Warhammer/Disney IP.

### 2026-08-09 — DEFERRED — Ashen Bulwark art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `d639ebd` / **no BETA APK**
- User intent: Mesh 4 orc/brute refs into detailed tank sprites like Ashen Husk / Skeleton; art for NPCs; no new APK this pass
- Agent action: Generated original Ashen Bulwark / Rift Brute idle/walk/windup; size lock `r=20` / `drawH=52.2` (36×1.45); soft-wire behind `BULWARK_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for NPC #3 shaman/ravager. Flip flag + BETA when applying. No WoW/Blizzard/Warhammer IP.

### 2026-08-09 — DEFERRED — Ashen Skeleton art drafted (APK apply later)
- Version / commit / APK: assets+docs only (no APP_VERSION / versionCode bump) / `24c4c31` / **no BETA APK**
- User intent: Mesh 3 skeleton refs into detailed sprites like Ashen Husk / Gharok; art for NPCs first; no new APK this pass
- Agent action: Generated original Ashen Skeleton idle/walk/windup; size lock `r=10` / `drawH=32.4` (36×0.9); soft-wire behind `SKELETON_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for next NPC refs. Flip flag + BETA when applying. No WoW/Blizzard/InkWell IP.

### 2026-08-09 — SHIPPED — v2.12.1 Ashen Husk detailed sprites (small footprint)
- Version / commit / APK: 2.12.1 (versionCode 43) / `2454291` / BETA `TemporalRift-BETA-2.12.1.apk`
- User intent: Make zombies the same way as Gharok (detailed sprite art from refs); rest of zombie polish next part; **CRITICAL:** keep current small husk size — Gharok pipeline = quality only, not boss `r=54` / `drawH=228`
- Agent action: Generated original Ashen Husk idle/walk/windup PNGs; wired husk+sprinter frame-swap with `HUSK_SPRITE_DRAWH=36` (matches figure H); collision `r=14`/`11` untouched; procedural fallback; `docs/zombie-art-plan.md` + UNIT_SIZES note; strip `_refs` from APK
- Notes: Refs = inspiration (cartoon shamble + forest creep vibe); no Valve/L4D Creep IP / Warhammer / Blizzard. Next part: more frames, bulwark/skeleton variants, fuller polish. No Pixelorama. No Play upload.

### 2026-08-08 — SHIPPED — v2.12.0 in-engine unit animation finish (sizes locked)
- Version / commit / APK: 2.12.0 (versionCode 42) / `a15fa7d` / BETA `TemporalRift-BETA-2.12.0.apk`
- User intent: Can't use Pixelorama (SplashTop); do Gharok-style finished movements for all units; keep current sizes; no Pixelorama workflow push
- Agent action: Finished Gharok idle/walk/attack(windup+strike)/hurt lean on existing sheets + procedural fallback; additive limb-flow walk/attack/hurt for enemies + allies + laborers/militia/Colossus; locked radii/draw scales in `docs/UNIT_SIZES.md`; noted Pixelorama/Forge deferred — primary = in-engine
- Notes: No dedicated death corpse sheets (particle death remains). Militia still thinner than Gharok sheet quality. SplashTop/Pixelorama out of scope.

### 2026-08-08 — SHIPPED — Windows character-drop pipeline (docs + folder)
- Version / commit / APK: docs only (no APP_VERSION bump) / `526f9ac`
- User intent: Rift Forge APK too hard for skins; want limb-flowing enemies/allies + moving textures via easy Windows tools; drop files for agent; AI-smart tooling wish
- Agent action: Researched FOSS Windows 2D tools; scaffolded `content/character-drops/` + `docs/CHARACTER_DROP_FORMAT.md`; copied ash-scout metadata example; recommended Pixelorama primary / LibreSprite backup; **no** in-engine skeletal/sheet loader this pass (procedural draw still default)
- Notes: **Rift Forge APK deferred for ease** — Windows drop pipeline preferred for v3 art. ComfyUI/AnimateDiff optional drafts only. Next: artist drops sheets → agent wires one unit sheet player.

### 2026-08-08 — DEFERRED — Rift Forge APK expansion for day-to-day skins
- Version / commit / APK: n/a (companion path)
- User intent: Skins/characters easier than Forge APK
- Agent action: Do not expand Forge APK; document simpler Windows editor → `character-drops` handoff instead
- Notes: Forge scaffold remains; v3 overhaul still deferred. Prefer Pixelorama/LibreSprite locally.

### 2026-08-08 — SHIPPED — v2.11.0 WC2-inspired RTS overhaul slice
- Version / commit / APK: 2.11.0 (versionCode 41) / `740e93a` / BETA `TemporalRift-BETA-2.11.0.apk`
- User intent: Warcraft-2–inspired additive overhaul (~2hr playable slice): town buildings, choppable forests, gold mines, workers≠squad, Muster +3/wave fighters, click orders/skills, expanded map; original names only; keep wave survival
- Agent action: Map 3600→4800; forest stands + gold mine buildings; Rift Keep / Supply Camp / Gold Vault + existing halls; Ashen Laborers worker-only with Chop/Mine/Follow orders; Muster Spearmen/Bowmen (+3 train/wave, revivable); light fighter skill nodes; starter Keep+2 laborers + tips; HUD worker/squad counts; kept companions/barricades/mend/revive/learning/BETA id; no Play Console; no Rift Forge v3
- Notes: discoverability_risk reduced (starter Keep + tip banner + clearer BUILD hint). Pathfinding/AI polish still thin vs full WC2. No copyrighted names.

### 2026-08-08 — SHIPPED — Rift Forge companion scaffold (sibling project)
- Version / commit / APK: Forge 0.1.0 / sibling repo `videogamemakes/rift-forge` / `rollouts/RiftForge-0.1.0.apk`
- User intent: Companion APK/web workshop for 2D kits → Drive → later Temporal Rift v3; not a Tripo 3D clone
- Agent action: Scaffold Capacitor app + pack format + sample `ash-scout` + debug APK; v3 loader remains stub/docs only
- Notes: Game still procedural/hardcoded draw paths. Cloud gen stubbed (no paid key required). v3 overhaul still DEFERRED until ordered.

### 2026-08-08 — DEFERRED — Rift Forge companion started; v3 overhaul pending
- Version / commit / APK: n/a (companion / planning)
- User intent: Note that Rift Forge companion work has started; full v3 overhaul still pending
- Agent action: Thin memory note only — no gameplay/APK ship this entry
- Notes: Do not treat as SHIPPED remove/keep; overhaul deferred until explicitly ordered

### 2026-08-08 — SHIPPED — v2.10.0 additive RTS build picker slice
- Version / commit / APK: 2.10.0 (versionCode 40) / `fe493db` / BETA `TemporalRift-BETA-2.10.0.apk`
- User intent: Free Tripo alternatives research + Warcraft-2-inspired additive RTS (build picker, wood/gold workers, upgradable buildings, more squads, megazord-like combiner) without gutting wave survival; copyright-safe names only
- Agent action: BUILD opens picker (barricade / Timber Camp / Muster Hall / Aether Pit); wood+gold HUD; Ashen Laborers chop trees + mine gold veins; tap building to upgrade/train; Ashen Sentinel companion; Aether Colossus combiner (~Gharok r=54); kept wave loop / learning / barricades / mend / revive / BETA package
- Notes: Buildable city pathway moved from deferred→started. discoverability_risk: Colossus needs 2 nearby allies + resources (button + Key C). No Play Console upload. Boss art skipped.

### 2026-08-08 — SHIPPED — v2.9.3 hide learning / one-tap mend / wall ghost
- Version / commit / APK: 2.9.3 (versionCode 39) / `baa9f3f` / BETA `TemporalRift-BETA-2.9.3.apk`
- User intent: Fix audit polish misses and apply to current version
- Agent action: Settings `adaptHidden` toggle (persisted); field MEND btn + Key H (`tryAetherMend`, same costs as infirmary); barricade aim ghost + link lines/`LINK ×N` before place; kept 2.9.2 field Talk revive
- Notes: discoverability_risk reduced for mend (was menu-only). Co-op combat sync + buildable city still deferred. Play/GitHub public tracks not uploaded this pass.

### 2026-08-08 — SHIPPED — change memory system
- Version / commit / APK: docs on master (post-`180f2b6`); tag `baseline-pre-memory-system` = audit recovery point
- User intent: GO on remembering system; keep chat audit as stable revert line
- Agent action: Added `docs/CHANGE_MEMORY.md`, this log, `.cursor/rules/change-memory.mdc`; baseline note on audit doc only
- Notes: No gameplay code changes

### 2026-08-08 — KEPT — baseline chat audit immutable
- Version / commit / APK: `180f2b6` / tag `baseline-pre-memory-system`
- User intent: Treat `docs/chat_audit_misses_and_regressions.md` as revert reference
- Agent action: Header note only; body not rewritten
- Notes: Corrections go in CHANGE_MEMORY / this log

### 2026-08-08 — DEFERRED — OnePlus 9 Pro / Evolution X bug (unknown)
- Version / commit / APK: unknown package/version
- User intent: Device bug mentioned at audit time; not in prior chats
- Agent action: Placeholder in CHANGE_MEMORY open bugs
- Notes: Needs repro + logcat; do not invent root cause

### 2026-08-08 — DEFERRED — co-op combat sync / buildable city / polish backlog
- Version / commit / APK: n/a (pending)
- User intent: From audit misses — full enemy sync; buildable city; hide learning toggle; one-tap mend; wall preview; channel catch-up
- Agent action: Listed under Pending in CHANGE_MEMORY
- Notes: Boss art / feel polish skipped unless user reopens

### 2026-08-08 — SHIPPED — v2.9.2 field squad revive + PeerJS downed revive
- Version / commit / APK: 2.9.2 / `dd08d2d` / BETA APK
- User intent: “Revive squad gone?” + MP revive
- Agent action: Field hold-Talk revive channel; PeerJS downed/revive
- Notes: Prior menu-only path had discoverability_risk (wave-end auto-clear)

### 2026-08-08 — SHIPPED — v2.9.1 compact HUD + thinner beam
- Version / commit / APK: 2.9.1 / `6122374`
- User intent: Compact map+HP HUD; thinner beam ladder
- Agent action: Shipped HUD/beam; agent polish suggestions left pending
- Notes: See Pending in CHANGE_MEMORY

### 2026-08-07 — SHIPPED — v2.9.0 infirmary, fortify links, Riftnet foundation
- Version / commit / APK: 2.9.0 / `15035e0`
- User intent: Aether heal/revive, dog durability, linked barricades, co-op foundation
- Agent action: Shipped; combat sync deferred in README/UI
- Notes: Enemies remain local

### 2026-08-07 — SHIPPED — v2.8.7 sound + world sprites
- Version / commit / APK: 2.8.7
- User intent: Sound engine submenu; sprite pines/rocks
- Agent action: Shipped
- Notes: —

### 2026-08-06 — SHIPPED — v2.8 BETA package + systems
- Version / commit / APK: 2.8 / `com.drpep.temporalrift.beta`
- User intent: Dual-wield, companions, sentry, camera peek, death checkpoints, separate beta package
- Agent action: Shipped on master/BETA
- Notes: Store/GitHub stayed behind (~2.6) — OPS lag

### 2026-08-06 — OPS — public channels held at ~2.6
- Version / commit / APK: GitHub latest v2.6; Play closed last confirmed 2.6; shelf has 2.7/2.8 AABs
- User intent: Testers should feel updates (expectation vs ops)
- Agent action: BETA raced ahead; public upload not confirmed for 2.7+
- Notes: Channel lag ≠ code regression

### 2026-08-06 — SHIPPED — v2.7 content (shelf)
- Version / commit / APK: 2.7 in master; store rollout deferred
- User intent: Fusion zombies, graves/skeletons, fireballs, boss armor, fence upgrades
- Agent action: In master code
- Notes: Distribution incomplete for public tracks

### 2026-08-06 — SHIPPED — v2.6 HUD / layout / vibration
- Version / commit / APK: 2.6
- User intent: HUD under notch, movable buttons, styles, vibration
- Agent action: Shipped; became last confirmed public channel point for many testers
- Notes: —

### 2026-08-05 — REMOVED — center “ENTERING” city popup
- Version / commit / APK: v2.4
- User intent: Remove center popup; keep bottom label
- Agent action: Removed; bottom `regionFlashT` kept
- Notes: Still removed as of 2.9.2 — do not re-add

### 2026-08-05 — KEPT / SHIPPED — Play must not get GitHub update banner
- Version / commit / APK: v2.5
- User intent: Play update banner must not send users to GitHub sideload
- Agent action: `checkForUpdate()` only when `UPDATE_CHANNEL === 'github'`
- Notes: True regression-class bug if this gate breaks — keep gated

## 2026-08-09 15:45 — SHIPPED (Play AAB staged)
- **2.13.2** Play AAB ready for Closed testing upload: `playstore\TemporalRift-2.13.2.aab` (+ `rollouts\TemporalRift-2.13.2.aab`), package `com.drpep.temporalrift`, versionCode **46**, `TR_CHANNEL=play` (GitHub updater off).

## 2026-08-13 14:45 — SHIPPED (Play AAB staged)
- **3.1.4** Play AAB ready for upload: `playstore\TemporalRift-3.1.4.aab` (+ `rollouts\TemporalRift-3.1.4.aab` + Desktop copy), package `com.drpep.temporalrift`, versionCode **52**, `TR_CHANNEL=play` (GitHub updater off). Built via the build-all.ps1 Play pipeline (github debug APK step skipped — repo-root TemporalRift.apk untouched). Same upload keystore as 2.13.2 (`temporalrift-upload.jks`, signer SHA-256 match; bundletool-verified vc52/3.1.4/prod package). Carries master Continuity 3.1.4 (town save, sprites, multi-dir walk, squad steps, Colossus, decade bosses). Play Closed remains **2.13.2**/vc46 until the user uploads to Play Console.

## 2026-08-27 — SHIPPED (Play AAB staged — Open testing)
- **3.1.5** Play AAB ready for Open testing drag-drop: `playstore\TemporalRift-3.1.5.aab` (+ `rollouts\TemporalRift-3.1.5.aab` + Desktop), package `com.drpep.temporalrift`, versionCode **53**, `TR_CHANNEL=play`. Same upload keystore as 3.1.4 (`temporalrift-upload.jks`). Continuity remeshed trees included (`TREE_SPRITE_VARIANTS_ENABLED=true`); no other game changes; continuous/open map not implemented.

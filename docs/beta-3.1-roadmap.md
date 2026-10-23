# BETA-3.1 roadmap

Features land **one at a time**. User says **"next"** between steps. Do not jump ahead.

**Shipped:** APP_VERSION **3.1.2** / versionCode **50** — `TemporalRift-BETA-3.1.2.apk` (`com.drpep.temporalrift.beta`) = all of 3.1.1 + Colossus Continuity. Prior: `TemporalRift-BETA-3.1.1.apk` (3.1.1 / vc49). Preflight: `docs/beta-3.1-preflight.md` (ALL PASS for 3.1.0). Play/GitHub remain **2.13.2**.

**Verify on device after sideload:** Cloister Wall visual joins (step 4), tap-to-place + enemy/squad pause (steps 5+7), raised caps + kb ladder (step 7), squad steps 1–3, and Colossus CALL TITAN / RECALL / downed revive.

---

## Currency choice (step 1)

| Orb | Color | Pickup `type` | Wallet | Amount |
|---|---|---|---|---|
| Squad SP | **Dark gray** `#5a5a5a` | `squad_sp` | `squadSp` | +1 |
| Squad cores | **Light gray** `#b0b0b0` | `squad_core` | `squadCores` | +1 |

- Player magnet **ignores** both; player `cores` / player SP unchanged.
- Companions **and** militia attract both (laborers do **not** — workers≠squad; squad laborers also do **not** attract).
- Persist under save `squad.sp` / `squad.cores` (additive; old saves default 0).
- Step 2 spends `squadSp` on companion/militia trees; step 3 spends `squadSp` + `squadCores` to train squad laborers.

---

## Steps

| # | Status | Feature |
|---|---|---|
| 0 | ✅ Done (master) | Multi-dir front/side/back walk |
| **1** | **✅ Done (master Continuity; no APK)** | Enemy extra gray/light-gray orbs for squads + squad magnets + squad SP/cores bank (does **not** reduce player drops) |
| **2** | **✅ Done (master Continuity; no APK)** | Bigger skill trees for companions + militia spending squad SP |
| **3** | **✅ Done (master Continuity; no APK)** | Squad laborers (slate shirt) + own wood/gold alongside player laborers |
| **4** | **✅ Done (master Continuity; no APK)** | Cloister / brickwall **visual joins** — segments flush between pillars (straights + corners) |
| **5** | **✅ Done (master Continuity; no APK)** | Tap-to-place build with **enemy pause** while placing |
| 6 | ✅ Done | `versionName` **3.1.0**, `versionCode` **48**, `TemporalRift-BETA-3.1.apk` (+ `…-3.1.0.apk`) — preflight `docs/beta-3.1-preflight.md` ALL PASS; sideload-verify steps 4–5 (+1–3) on device |
| **7** | **✅ Done + packaged in 3.1.1** | Place-pause freezes **squads** too + raised build **quantity caps** + wave **knockback resistance** (+1 hit / 20 waves) |
| **8** | **✅ Done** | `versionName` **3.1.1**, `versionCode` **49**, `TemporalRift-BETA-3.1.1.apk` — packages step 7 Continuity |
| **9** | **✅ Done** | `versionName` **3.1.2**, `versionCode` **50**, `TemporalRift-BETA-3.1.2.apk` — packages Colossus Continuity (sprites + persist + CALL TITAN/RECALL) |

*(Table uses 0–9 for clarity; user plan may number multi-dir as completed item 1 — same order.)*

**Open for more:** Further Continuity waits for **"next"**. Next package / APK only when the user asks.

**Superseded for Continuity pacing:** See [`docs/v4.0.0-roadmap.md`](./v4.0.0-roadmap.md) — Step 1 wave coach shipped as **3.2.0** (do not jump to 4.0.0 yet).

### User plan mapping

1. ✅ Multi-dir front/side/back walk (already on master)
2. **✅ Done:** Enemy extra gray/light-gray orbs for squads + squad magnets + squad SP bank (does NOT reduce player drops)
3. **✅ Done:** Bigger skill trees for companions + militia spending squad SP
4. **✅ Done:** Squad laborers (recolor shirt) + own wood/gold alongside player laborers
5. **✅ Done:** Brickwall / Cloister visual joins (segments meet pillars)
6. **✅ Done:** Tap-to-place build + enemy pause while placing — master Continuity; **no APK**
7. **✅ Done:** versionName **3.1.0**, versionCode **48**, `TemporalRift-BETA-3.1.apk` — device re-check steps 4–5 (+1–3)
8. **✅ Done (master Continuity; no APK):** Place-pause freezes squads + raised build caps + wave knockback resistance

---

## Step 2 notes (done)

- **Companions (`COMP_NODES`):** 5 nodes each (rover/warden/scout/sentinel) — HP, dmg, attack rate, squad-orb magnet, plus prior unique perks. Ranks in `skillRanks`; cost **✧ 1 `squadSp`** each. Player `sp` / player skill columns unchanged.
- **Militia:** expanded per-fighter tree (`dmg`/`armor`/`spd` + `rate`/`magnet`); costs **✧ 1/2/3** escalating; save under `town.militia[].sk` (additive keys).
- **UI:** tap companion/militia unit panel; Muster Hall **✧ SQUAD SKILLS**; field lab **squad skills ✧**; K skill tree **SQUAD** column.
- **`squadCores`:** unused this step (documented).

---

## Step 3 notes (done) — squad laborers

| Item | Choice |
|---|---|
| **Train / unlock** | **Muster Hall** or **Rift Keep** → **TRAIN SQUAD LABORER** |
| **Cost** | **✧ 2 `squadSp` + ◈ 1 `squadCore`** (`SQUAD_LABORER_TRAIN`) |
| **Cap** | **3** fixed (`SQUAD_LABORER_CAP`) — separate from player `laborerCap()` |
| **Wallets** | **`squadWood` / `squadGold`** — save `squad.wood` / `squad.gold` (additive). Do **not** take from player `wood`/`gold` |
| **Units** | `squadLaborers[]` with `squadSide: true`; town save `town.squadLaborers` |
| **Visual** | Same laborer pipeline + size lock **r=11 / drawH=26**; **slate tunic** `#6a7380` (sprite cloth overlay + procedural shirt) — distinct from Ashen ochre |
| **Orders** | Chop / Mine / Auto / Follow — same as Ashen Laborers; deposit floaters `+S WOOD` / `+S GOLD` |
| **HUD** | Compact `🪵s` / `◈s` next to squad ✧ (`squadWoodNum` / `squadGoldNum`) |
| **Preserved** | Player Ashen Laborers unchanged; workers≠squad for player path; squad laborers do **not** attract squad orbs / do **not** fill combat squad slots |

---

## Step 4 notes (done) — brickwall visual joins

| Item | Choice |
|---|---|
| **Bug** | Linked Cloister pillars looked fine; **segments left gaps** / funny joins on straights + corners |
| **Root cause (3.1.0)** | `drawBrickWallSegmentBetween` aspect-clamped square 512 sheets to `drawH` → **~36px** wide in a **96** link gap, plus transparent canvas padding starved visible brick further |
| **Fix (3.1.0)** | Stretch segment to `span − 2×BRICKWALL_SEG_INSET`; source-crop `BRICKWALL_SEG_CROP` to opaque brick; procedural path uses same length. Collision / links / barricades unchanged |
| **Root cause (post-3.1.2 Continuity)** | Pillars still drew **full 512×512** (opaque body ~98×274 centered → ~8px half-width at drawH=44) while segments used opaque crop + **INSET=11** → visible gap; corner/tee full sheets also fought link segments |
| **Fix (post-3.1.2 Continuity)** | `BRICKWALL_PILLAR_CROP` + `SEG_INSET=4`; always draw cropped pillar (never swap corner/tee sheets for the post). Straights / corners / T / mixed runs meet flush |
| **Preserved** | Wooden barricades KEPT; REMOVED untouched; no APK / no version bump |

---

## Continuity punch list (2026-08-11, no APK) — audio / revive / turrets / grass

Short note: filled sparse SFX (death by type, beam charge/blast, place confirm, rift-hum music bus, militia grunts); Cloister flush re-fix; squad assist revive (~2.85s, free for non-colossus; titan still 100⬡ player); tap barricade → rate/range/dmg/rockets (+ optional global uplink); stronger foe ground shadows + slight sprite contrast. APP_VERSION stays **3.1.2**. See `decisions.log.md`.

---

## Step 5 notes (done) — tap-to-place + enemy pause

| Item | Choice |
|---|---|
| **Flow** | BUILD picker **selects** item → `buildPlaceMode` (ghost aim) → **tap/click/Fire confirms** at ghost → unpause |
| **Ghost** | Keep look-around aim ghost (barricade / Cloister / structures); `TAP TO PLACE` label while placing |
| **Pause** | `buildPlacePaused` freezes enemy AI/movement/attacks + enemy bolts + spawn **+ companions/militia/sentries/laborers/colossus** (structures still tick); player still moves/aims ghost; **not** full `paused` |
| **Cancel** | **B** / **Esc** / BUILD btn while placing → `cancelBuildPlaceMode` (unpause). Failed place (no room) stays in mode |
| **Combat** | Outside place mode unchanged; weapons/nova/grenade blocked only while placing |
| **Smoke** | `node test-build-place.js` (no APK) |
| **Preserved** | Barricades KEPT; REMOVED untouched; **APP_VERSION stays 3.0.0**; **no APK** |

### Manual verify checklist (device / desktop after APK — also useful on Continuity now)

1. Open **B** BUILD → pick Energy Barricade → picker closes, HUD shows **TAP TO PLACE**, horde frozen.
2. Look around (mouse / joystick) → ghost + link preview moves; enemies do **not** walk/attack.
3. **Click / tap canvas / Fire** → barricade places at ghost; horde resumes.
4. Repeat for **Cloister Wall** and a **structure** (e.g. Timber Camp) — ghost + tap confirm + pause/unpause.
5. Enter place mode → **B** or **Esc** → cancelled, horde unpauses, nothing spent.
6. Leave place mode → shoot / fight normally (no stuck pause).
7. After final **BETA-3.1 APK**: re-check this list + step 4 brick joins.

---

## Step 7 notes (done) — place-pause squads + build caps + knockback ladder (no APK)

| Item | Choice |
|---|---|
| **Squad freeze** | While `buildPlacePaused`, skip `updateCompanions` / `updateMilitia` / `updateSentries` / `updateLaborers` (incl. squad laborers) / `updateColossus` — no move-to-attack / fire / melee / swipe |
| **Player** | Still moves + aims ghost; cancel/place still clears pause |
| **Build caps** | Barricade **80** (was 8); Cloister **80** (was 16); timber **12**; farm **16**; golddepot/muster/aetherpit **8**; keep **1**. Costs unchanged |
| **Knockback** | Non-boss: hits needed = `1 + floor(wave/20)` before shove; waves 1–19 unchanged; bosses keep mass/`kbPool` (not hit-ladder) |
| **Preserved** | Barricades KEPT; REMOVED untouched |
| **Packaged** | **3.1.1** / vc**49** — `TemporalRift-BETA-3.1.1.apk` (was Continuity-only until user “okay go”) |
| **Smoke** | `node test-build-place.js` (caps + kb ladder checks)

---

## Constraints (every step)

- Do not break REMOVED features.
- Do not steal player drops / do not change player core rates for this feature.
- Workers ≠ squad (player laborers stay Chop/Mine/Follow only).
- No militia art sheets.
- Sync `www/game.js` (+ HTML if HUD changes); `node --check`; CHANGE_MEMORY + decisions note.
- No APK / no version bump until the final APK step — **and** further user steps may land before that APK.

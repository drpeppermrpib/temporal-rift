# BETA-3.1 preflight audit

**Date:** 2026-08-10  
**Scope:** Verify all BETA-3.1 pieces in code/docs before packaging `TemporalRift-BETA-3.1.apk`.  
**Sources:** `docs/beta-3.1-roadmap.md` + CHANGE_MEMORY + `game.js` / `www/game.js` / assets / smoke tests.

| # | Feature | Verify | Result | Evidence |
|---|---------|--------|--------|----------|
| 0 | Multi-dir walk (front/side/back) for Continuity unit skins | `unitViewFromVel` / `unitPickDirWalk` + `walk-side` / `walk-back` assets + loaders | **PASS** | Helpers + soft-load keys on husk/zombie, skeleton, bulwark, shaman, ravager, gharok, rover, warden, scout, sentinel, laborer; PNGs under `assets/` + synced `www/assets/` |
| 1 | Squad gray orbs + magnets + `squadSp`/`squadCores`; player loot untouched | spawn + magnet ignore player | **PASS** | `killEnemy` EXTRA `squad_sp`/`squad_core`; `isSquadPickup` path magnets companions+militia only; player magnet skipped via `continue`; save `squad.sp`/`squad.cores` |
| 2 | Bigger companion + militia trees spending `squadSp` | `COMP_NODES` expanded; UI spend ✧ | **PASS** | `COMP_NODES` 5 nodes each (rover/warden/scout/sentinel); militia `rate`/`magnet`; spend `squadSp` (not player.sp); K SQUAD column + Muster/unit panel |
| 3 | Squad laborers slate tunic + `squadWood`/`squadGold` | train cost, cap, HUD | **PASS** | `SQUAD_LABORER_TRAIN` ✧2+◈1; cap 3; slate `#6a7380`; HUD `squadSpNum`/`squadWoodNum`/`squadGoldNum`; `squadLaborers[]` |
| 4 | Brick wall segments meet pillars | stretch/crop fix present | **PASS** | `BRICKWALL_SEG_INSET` + `BRICKWALL_SEG_CROP` in `drawBrickWallSegmentBetween` |
| 5 | Tap-to-place BUILD + enemy pause | `buildPlaceMode` / `buildPlacePaused`; smoke `test-build-place.js` | **PASS** | Mode + pause flags; confirm/cancel; smoke test file present |

## Extra gates

| Gate | Result | Notes |
|------|--------|-------|
| BETA package `com.drpep.temporalrift.beta` | **PASS** | `build-beta.ps1` patches applicationId; aapt verify after build |
| REMOVED not re-added | **PASS** | No center ENTERING popup; update banner gated `UPDATE_CHANNEL === 'github'`; no Saiyan/Kamehameha names restored |
| Play 2.13.2 not touched | **PASS** | Channel matrix / build path is BETA sideload only — no Play upload |

## Verdict

**ALL PASS** → packaged **3.1.0** / versionCode **48** as `TemporalRift-BETA-3.1.apk`.

**Post-build aapt:** `name='com.drpep.temporalrift.beta' versionCode='48' versionName='3.1.0'` · label `Temporal Rift BETA`.

**Paths:** `rollouts\TemporalRift-BETA-3.1.apk` (= `…-3.1.0.apk`) · Desktop `TemporalRift-BETA-3.1.apk`.

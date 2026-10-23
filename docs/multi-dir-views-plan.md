# Multi-dir walk views plan (3-view model)

**Pass:** additive art + soft-wire only. No collision/`drawH`/HP/dmg/AI/cost changes. No APP_VERSION bump. No APK.
**Model:** Front (existing) + Side (`walk-side`, mirrored via `facing`) + Back (`walk-back`).
**Attack / death / windup:** stay **front** this pass.
**Y-down canvas:** back ≈ moving −Y, front ≈ +Y, side ≈ |vx| dominant.
**Code:** `unitViewFromVel` + `unitPickDirWalk` in `game.js`; soft-load on each unit `*Spr`.

## Inventory checklist

| Unit | Kind | Existing sheets | Sheets this pass | Status |
|------|------|-----------------|------------------|--------|
| Husk / Sprinter (zombie) | enemy | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Skeleton | enemy | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Bulwark | enemy | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Shaman | enemy | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Ravager | enemy | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Gharok (Warlord) | boss | idle, walk, windup | **walk-side**, **walk-back** | **done** |
| Rover | companion | idle, walk, attack, death | **walk-side**, **walk-back** | **done** |
| Warden | companion | idle, walk, attack, death | **walk-side**, **walk-back** | **done** |
| Scout | companion | idle, walk, attack, death | **walk-side**, **walk-back** | **done** |
| Sentinel | companion | idle, walk, attack, death | **walk-side**, **walk-back** | **done** |
| Laborer | worker | idle, walk, work, death | **walk-side**, **walk-back** | **done** |
| Aether Colossus | combiner ally | idle, walk, attack, death | **walk-side**, **walk-back** | **done (2026-08-11)** |
| Militia spear/bow | muster | none (procedural) | **none** — procedural facing only | **deferred art** (cheap L/R facing tweak applied) |

## Out of scope (N/A)

- Buildings (keep/camp/hall/vault/pit/brickwall) — do not walk
- Militia full art sheets — still deferred; procedural L/R facing only this pass
- idle-side / idle-back — skipped; walk sheets + front idle fallback
- Attack/death directional sheets

## Process / sync

- Mid-grey studio `#B8B8B8` → `scripts/process-multidir-sprites.mjs` → 512 transparent
- Synced `www/assets/...` (no `_raw` / `_refs`)
- Desktop preview: `TemporalRift-MultiDir-Preview`

## Deferred / KEPT

- Attack/death/windup still front-only
- Militia art mesh still deferred
- No APK this pass; APP_VERSION stays **3.0.0** / Continuity+BETA-3
- REMOVED list untouched
- Collision `r` / `drawH` unchanged (multi-dir additive)

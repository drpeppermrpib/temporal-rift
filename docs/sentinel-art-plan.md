# Ashen Sentinel / Rift Sentinel art plan

Original Temporal Rift **Ashen Sentinel** (Muster Hall recruit) sheets —
sturdy militia spear companion soft-wire pipeline (same as Rover / Warden / Scout).
Companion footprint (not boss, not yellow Warden tank, not green Scout archer).

**Status (2026-08-10):** **Articulation + barks on master** — `SENTINEL_SPRITE_ENABLED=true`
for Continuity/source testing. Store ship deferred with peer batch.
**No APK / no version bump / no Play.** Ally **#3d** Sentinel after Scout.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Sentinel collision `r` | **13** | Unchanged — `docs/UNIT_SIZES.md` / `syncCompanions` (`rover` 11, others 13) |
| Procedural figure | `s=1.15`, bulk `1.25`, `H≈41.4` | Warm leather fallback; between Scout `s=1.0` and Warden `s=1.25` |
| Sprite `drawH` | **44** | Matches procedural ≈41 + pad — **not** Scout `38`, **not** Warden `48`, **not** husk `56`, **not** Gharok `228` |
| On-screen | sturdy militia line-holder | Keep current Sentinel footprint; do not boss-size or Warden-tank-size |

Source PNGs are 512×512 transparent but drawn at companion scale (`drawH=44`) when flag ON.

## Assets

- `assets/allies/sentinel/idle.png`
- `assets/allies/sentinel/walk.png`
- `assets/allies/sentinel/attack.png` (spear thrust + amber aether tip)
- `assets/allies/sentinel/death.png` (kneeling / spear planted)

Transparent background. Soft-load when `SENTINEL_SPRITE_ENABLED === true`;
procedural `companionFigure` remains fallback if sheets fail.
Attack frame maps to `swipeT`; death when `downed`.

Process: `node scripts/process-sentinel-sprites.mjs` (mid-grey studio flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (wired)

Same sheet gait pattern as Rover / Warden / Scout:

| Pose | Trigger |
|------|---------|
| idle ↔ walk | gait half-cycle while moving (`walk` / π) |
| attack | `swipeT` spear thrust / bolt fire |
| death | `downed` |
| plant squash / bob / lean | mid plant — heavier than Scout, lighter than Warden |
| barks | `voice:'sentinel'` — militia spear (HOLD THE LINE / THRUST / SPEAR UP / BRACE; alert/attack/combat/hurt; not orc, not dog, not Scout, not Warden tank) |
| attack glow | amber aether on spear tip |

## Design (original — mesh of spear-militia refs)

**Name:** Ashen Sentinel / Rift Sentinel

Meshed traits (inspiration only — **not** LOTR / Bastion of Purity / Rescale / trademarked IP):

1. Weathered **bronze + dark steel** plate (knight + Norse plate language only — no clan logos)
2. **Forest-green** cloak / tunic trim + fur collar (militia line identity)
3. **Amber / gold aether** visor slit + spear-tip glow (matches procedural `glowEyes: #ffb02e`)
4. **Primary silhouette:** long **spear** (militia spear — not Warden pulse-cannon, not Scout bow)
5. Sturdy line-holder bulk between Scout ranger and Warden tank
6. Attack: thrust with amber aether bolt telegraph; death: kneeling, spear planted
7. **Strip from sheets:** Bastion/Rescale logos, winged holy-miniature branding, LOTR/Cardolan emblems, readable IP marks

## References (inspiration only)

Under `assets/allies/sentinel/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `viking-bronze-spear-insp.png` | Bronze plate + green cloak + spear guard pose |
| `silver-energy-polearm-insp.png` | Energy tip / polearm telegraph mood ONLY |
| `plate-spear-knight-insp.png` | Heavy plate spear knight structure |
| `militia-spear-line-insp.png` | Militia spear line / cloak + round-shield language ONLY (no LOTR marks) |
| `ornate-spear-bulk-insp.png` | Ornate spear bulk / stance ONLY — no Bastion/Rescale logos in sheets |

## Soft-wire

```js
SENTINEL_SPRITE_ENABLED = true    // master Continuity testing; store ship deferred
SENTINEL_SPRITE_DRAWH = 44        // size lock
// collision r=13 always (syncCompanions)
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Sentinel-Sprites\` — idle / walk / attack / death  
Also mirrored under `C:\Users\drpep\Pictures\TemporalRift-Sentinel-Sprites\`

## Ship notes

- **No APK / no version bump / no Play** this pass
- Flag ON for Continuity/source testing only
- Store ship deferred with peer companion batch
- Commit **unpinned** — pin hash when landed
- Ally roster art: Rover ✓ Warden ✓ Scout ✓ Sentinel ✓ (all Continuity ON; store deferred)

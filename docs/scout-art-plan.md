# Ashen Scout / Rift Scout art plan

Original Temporal Rift **Ashen Scout** (shop name **Scout**) sheets —
lighter archer companion soft-wire pipeline (same as Rover / Warden / buildings).
Companion footprint (not boss, not yellow Warden tank).

**Status (2026-08-10):** **Art drafted on master** — `SCOUT_SPRITE_ENABLED=false`
(live procedural `companionFigure` ranger). Soft-load stub present; **no articulation /
barks yet** (user: next later). **No APK / no version bump / no Play.** Ally batch
**#3b remainder** Scout after Warden.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Scout collision `r` | **13** | Unchanged — `docs/UNIT_SIZES.md` / `syncCompanions` (`rover` 11, others 13). Lighter *feel* vs Warden tank; not Rover dog `r=11` |
| Procedural figure | `s=1.0`, `H=36*s=36` | Hood + tech-crossbow fallback; bulk default (not Warden `s=1.25` / bulk `1.5`) |
| Sprite `drawH` | **38** | Matches procedural ≈36 + pad — **not** Warden `48`, **not** husk `56`, **not** Gharok `228` |
| On-screen | lighter archer companion | Keep current Scout footprint; do not boss-size or tank-size |

Source PNGs are 512×512 transparent (same sheet resolution as unit/building art)
but drawn at companion scale (`drawH=38`) when flag ON.

## Assets

- `assets/allies/scout/idle.png`
- `assets/allies/scout/walk.png`
- `assets/allies/scout/attack.png` (full-draw bow / aether arrow)
- `assets/allies/scout/death.png` (kneeling / powered-down)

Transparent background. Soft-load path ready when `SCOUT_SPRITE_ENABLED === true`;
procedural `companionFigure` (crossbow) remains live while flag OFF.
Attack frame maps to `swipeT`; death when `downed` (basic frame pick only until articulate pass).

Process: `node scripts/process-scout-sprites.mjs` (mid-grey studio flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (deferred — do not ship this pass)

Same sheet gait pattern as Rover / Warden — **not wired yet**:

| Pose | Trigger (planned) |
|------|-------------------|
| idle ↔ walk | gait half-cycle while moving (`walk` / π) |
| attack | `swipeT` bow draw / bolt fire |
| death | `downed` |
| plant squash / bob / lean | lighter plant than Warden tank |
| barks | distinct scout ranger voice (later) |

## Design (original — mesh of power-armor bulk + armored archer refs)

**Name:** Ashen Scout / Rift Scout

Meshed traits (inspiration only — **not** Fallout Brotherhood / Destiny / trademarked IP):

1. Slimmer knight-robotics power-armor — plate language + exposed charcoal hinge hubs
   at shoulders / elbows / knees / hips (bulk ref = structure only; **no** T-60 clone,
   **no** BoS logo, **no** Prydwen)
2. **Primary palette:** bright **emerald / lime-green** plates with scuffs + rivets
3. **Aether accents:** vivid **purple / violet** visor slit, joint seams, bowstring / arrow glow
4. **Primary silhouette:** tech-recurve **bow + arrow** (arrow guy — not Warden pulse-cannon tank)
5. Ranger cloth scraps / short cape OK; quiver on back
6. Attack: full draw with purple aether arrow telegraph; death: kneeling powered-down

## References (inspiration only)

Under `assets/allies/scout/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `power-armor-bulk-insp.png` | Plate bulk / joint language ONLY — no BoS / no airship / no T-60 clone |
| `armored-archer-pose-insp.png` | Armored archer draw pose / bow silhouette |
| `bow-stance-insp.png` | Classic bow stance |
| `ornate-archer-armor-insp.png` | Slim ornate plate archer armor structure |

## Soft-wire

```js
SCOUT_SPRITE_ENABLED = false   // art draft; live procedural; articulate later
SCOUT_SPRITE_DRAWH = 38        // size lock
// collision r=13 always (syncCompanions)
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Scout-Sprites\` — idle / walk / attack / death  
Also mirrored under `C:\Users\drpep\Pictures\TemporalRift-Scout-Sprites\`

## Ship notes

- **No APK / no version bump / no Play** this pass
- Flip flag + articulate + barks = later user ask
- Store ship deferred with peer companion batch

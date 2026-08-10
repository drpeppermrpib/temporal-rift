# Ashen Warden / Rift Warden art plan

Original Temporal Rift **Ashen Warden** (shop name **Warden**) sheets —
tank companion soft-wire pipeline (same as Rover / buildings). Companion footprint
(not boss).

**Status (2026-08-09):** **Articulation + barks on master** — `WARDEN_SPRITE_ENABLED=true`
for Continuity / source testing (like Rover / Cloister Wall). **Store ship deferred** with peer
batch — **no APK / no version bump / no Play**. Ally batch **#3b** Warden; Scout /
Sentinel still pending.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Warden collision `r` | **13** | Unchanged — `docs/UNIT_SIZES.md` / `syncCompanions` (`rover` 11, others 13) |
| Procedural figure | `s=1.25`, `H=36*s≈45` | Tank bulk `1.5`, pulse cannon weapon (fallback) |
| Sprite `drawH` | **48** | Matches procedural ≈45 + pad — **not** husk `56`, **not** Gharok `228` |
| On-screen | tank companion | Keep current Warden footprint; do not boss-size |

Source PNGs are 512×512 transparent (same sheet resolution as unit/building art)
but drawn at companion scale (`drawH=48`).

## Assets

- `assets/allies/warden/idle.png`
- `assets/allies/warden/walk.png`
- `assets/allies/warden/attack.png` (pulse-cannon windup / fire)
- `assets/allies/warden/death.png` (downed / powered-down)

Transparent background. Soft-load path mirrors Rover frame-swap when
`WARDEN_SPRITE_ENABLED === true`; procedural `companionFigure` (cannon) remains fallback.
Attack frame maps to `swipeT`; death when `downed`.

Process: `node scripts/process-warden-sprites.mjs` (mid-grey studio flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (in-engine)

Same sheet gait pattern as Rover / husk / ravager — heavier plant for tank feel:

| Pose | Trigger |
|------|---------|
| idle ↔ walk | gait half-cycle while moving (`walk` / π) |
| attack | `swipeT` pulse-cannon windup / fire |
| death | `downed` |
| plant squash / bob / lean | heavy plant (deeper squash, slower bob) + cannon wind/strike + hurt flash |

## Barks (armored robot guardian)

Distinct from orc enemy barks and Rover dog woofs — deep metallic square `voice: 'warden'`, ochre floaters:

| Reason | When | Sample lines |
|--------|------|--------------|
| alert | first engage foe | CONTACT / HOLD / SEALED / WARDEN |
| attack | pulse-cannon fire | FIRE / PULSE / ENGAGE / CANNON |
| combat | occasional while fighting | HOLD LINE / STANDING / LOCKED / SHIELD / AEGIS |
| hurt | takes damage | BREACH / ARMOR HIT / DAMAGE |

Mute-aware via `sfx.play('bark')` + shared global anti-spam with enemy/Rover barks.

## Design (original — mesh of knight + robotics armor refs)

**Name:** Ashen Warden / Rift Warden

Meshed traits (inspiration only — **not** Warframe Orokin / Destiny Guardian IP):

1. Medieval plate knight silhouette — closed helm with visor slit, layered pauldrons,
   cuirass / faulds / greaves structure (ref #1)
2. Robotic power-armor articulation — exposed charcoal hydraulics / hinge hubs at
   shoulders, elbows, knees, hips (refs #2–#5 silhouette language only)
3. **Primary palette:** weathered industrial **yellow / ochre** plates with scuffs,
   chips, rivets (refs #3–#5 **yellow priority**)
4. Small Temporal Rift aether accents: cyan visor slit + cyan/violet pulse-cannon
   emitter (game lore arm cannon — not a branded rifle clone)
5. Attack: cannon braced / muzzle aether telegraph; death: kneeling powered-down

## References (inspiration only)

Under `assets/allies/warden/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `medieval-plate-knight-insp.png` (+ hires jpg) | Knight plate structure / silhouette |
| `orokin-lancer-silhouette-insp.png` | Smooth power-armor massing only — **no Warframe IP** |
| `yellow-black-heavy-mech-insp.png` (+ hires jpg) | **Yellow/black weathered palette priority** |
| `yellow-robot-rifle-insp.png` | Yellow armor mood |
| `yellow-blue-power-armor-insp.png` (+ hires) | Yellow accents OK — **no Destiny IP clone** |

## Soft-wire

```js
WARDEN_SPRITE_ENABLED = true    // master Continuity testing; store ship deferred
WARDEN_SPRITE_DRAWH = 48        // size lock
// collision r=13 always
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Warden-Sprites\` — idle / walk / attack / death
for Photos review (chat may not show PNGs).

## Next

- Scout / Sentinel (#3b remainder)
- Store ship with peer Continuity batch (no APK this pass)

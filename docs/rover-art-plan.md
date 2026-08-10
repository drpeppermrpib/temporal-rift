# Ashen Rover / Rift Hound art plan

Original Temporal Rift **Ashen Rover** (aka **Rift Hound**, shop name **Rover**) sheets —
same pipeline as enemy / building soft-wire art. Companion footprint (not boss).

**Status (2026-08-09):** **Articulation + barks on master** — `ROVER_SPRITE_ENABLED=true`
for Continuity / source testing (like Cloister Wall). **Store ship deferred** with peer
batch — **no APK / no version bump / no Play**. Ally batch **#3a** dog only; Warden /
Scout / Sentinel = later.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Rover collision `r` | **11** | Unchanged — `docs/UNIT_SIZES.md` / `syncCompanions` |
| Procedural chassis | ~21 px tall | Visor/snout ~y−21 → feet at 0 (fallback) |
| Sprite `drawH` | **26** | Matches procedural footprint + pad — **not** husk `56`, **not** Gharok `228` |
| On-screen | companion dog | Keep current Rover footprint; do not boss-size |

Source PNGs are 512×512 transparent (same sheet resolution as unit/building art)
but drawn at companion scale (`drawH=26`).

## Assets

- `assets/allies/rover/idle.png`
- `assets/allies/rover/walk.png`
- `assets/allies/rover/attack.png` (plasma-bite windup / lunge)
- `assets/allies/rover/death.png` (downed)

Transparent background. Soft-load path mirrors husk/shaman/ravager frame-swap when
`ROVER_SPRITE_ENABLED === true`; procedural `drawRover` remains fallback.
Attack frame maps to `swipeT` plasma-bite telegraph; death when `downed`.

Process: `node scripts/process-rover-sprites.mjs` (light/grey flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (in-engine)

Same sheet gait pattern as husk / ravager:

| Pose | Trigger |
|------|---------|
| idle ↔ walk | gait half-cycle while moving (`walk` / π) |
| attack | `swipeT` plasma-bite windup / strike |
| death | `downed` |
| plant squash / bob / lean | moving plant + bite wind/strike poses + hurt flash |

## Barks (aether-hound)

Distinct from orc enemy barks — higher/shorter synth `voice: 'rover'`, cyan floaters:

| Reason | When | Sample lines |
|--------|------|--------------|
| alert | first engage foe | woof! / alert! / here! |
| attack | plasma-bite | grr! / SNAP / rrarf! |
| combat | occasional while fighting | woof / hunt! / arf! |
| hurt | takes damage | yelp! / rrf! |
| fetch | picks up loose core | fetch! / got it! |

Mute-aware via `sfx.play('bark')` + shared global anti-spam with enemy barks.

## Design (original — mesh of cybernetic dog refs)

**Name:** Ashen Rover / Rift Hound

Meshed traits (inspiration only — **not** Boston Dynamics / branded IP copies):

1. Angular gunmetal chassis + predatory quadruped silhouette (companion-concepts #1 + mech refs)
2. Cyan aether visor slits + plasma jaw glow + cyan antenna-tail tip (Temporal Rift palette; violet accents OK)
3. Weathered plates / rivets / joint hubs — industrial Rift tech, not consumer Spot
4. Attack windup: lunging bite with bright plasma mouth telegraph
5. Death: collapsed / powered-down with dim cyan

## References (inspiration only)

Under `assets/allies/rover/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `companion-concepts-insp.png` | Original TR Rover concept + pixel cue |
| `shadowfang-bot-insp.png` | Heavy cyber-canine massing |
| `cute-futuristic-robot-dog-insp.png` | Head/eye/aether mood |
| `vladimir-voronov-robot-insp.png` | Angular plate language |
| `highly-detailed-robotic-dog-insp.png` | Cyan core accents |
| `robotic-dog-tests-insp.png` | Tactical mech dog silhouette |
| `th-robot-dog-insp.png` / `ef59bcb8-robot-dog-insp.png` | Extra mesh |

## Soft-wire

```js
ROVER_SPRITE_ENABLED = true    // master Continuity testing; store ship deferred
ROVER_SPRITE_DRAWH = 26        // size lock
// collision r=11 always
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Rover-Sprites\` — idle / walk / attack / death
for Photos review (chat may not show PNGs).

## Next

- **#3b** skill-tree squad (Warden / Scout / Sentinel) when user sends photos or says go
- Store ship with Continuity + peer art batch (no APK this pass)

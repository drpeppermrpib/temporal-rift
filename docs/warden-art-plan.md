# Ashen Warden / Rift Warden art plan

Original Temporal Rift **Ashen Warden** (shop name **Warden**) sheets —
tank companion soft-wire pipeline (same as Rover / buildings). Companion footprint
(not boss).

**Status (2026-08-09):** **Art drafted, soft-wire OFF** — `WARDEN_SPRITE_ENABLED=false`.
Procedural `companionFigure` (cannon arm) stays live. **No APK / no version bump /
no live enable / no articulation yet.** Ally batch **#3b** Warden art; Scout /
Sentinel still pending. Say “next” (like Rover) for articulation + flag ON Continuity.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Warden collision `r` | **13** | Unchanged — `docs/UNIT_SIZES.md` / `syncCompanions` (`rover` 11, others 13) |
| Procedural figure | `s=1.25`, `H=36*s≈45` | Tank bulk `1.5`, pulse cannon weapon |
| Sprite `drawH` | **48** | Matches procedural ≈45 + pad — **not** husk `56`, **not** Gharok `228` |
| On-screen | tank companion | Keep current Warden footprint; do not boss-size |

Source PNGs are 512×512 transparent (same sheet resolution as unit/building art)
but drawn at companion scale (`drawH=48` when flag ON).

## Assets

- `assets/allies/warden/idle.png`
- `assets/allies/warden/walk.png`
- `assets/allies/warden/attack.png` (pulse-cannon windup / fire)
- `assets/allies/warden/death.png` (downed / powered-down)

Transparent background. Soft-load path mirrors Rover frame-swap when
`WARDEN_SPRITE_ENABLED === true`; procedural figure remains fallback.
Attack frame maps to `swipeT`; death when `downed`. Full plant squash /
lean articulation **deferred**.

Process: `node scripts/process-warden-sprites.mjs` (mid-grey studio flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

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
WARDEN_SPRITE_ENABLED = false  // art draft; procedural live
WARDEN_SPRITE_DRAWH = 48       // size lock
// collision r=13 always
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Warden-Sprites\` — idle / walk / attack / death
for Photos review (chat may not show PNGs).

## Next

- Articulation + Continuity flag ON when user says go (Rover pattern)
- Scout / Sentinel (#3b remainder)
- Store ship with peer Continuity batch (no APK this pass)

# Ashen Skeleton / Rift Bonewalker art plan

Original Temporal Rift **Ashen Skeleton** sheets — same Gharok / Ashen Husk
**art quality / process**, **not** boss or husk footprint.

**Status (2026-08-09):** art drafted + committed. **APK apply deferred** — enable
in-game when ready (`SKELETON_SPRITE_ENABLED` in `game.js`).

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Skeleton collision `r` | **10** | Unchanged — `docs/UNIT_SIZES.md` |
| Procedural figure `s` | **0.9** | Existing skeleton figure scale |
| Sprite `drawH` | **36 × 0.9 = 32.4** | Matches `drawFigure` `H = 36 * s` |
| On-screen | smaller than husk `drawH=36` | **Not** husk-36, **not** Gharok `228` |

Source PNGs are 512×512 (same sheet resolution as Gharok/Husk) but drawn at skeleton scale.

## Assets

- `assets/skeleton/idle.png`
- `assets/skeleton/walk.png`
- `assets/skeleton/windup.png`

Transparent background. Soft-load path mirrors husk/Gharok frame-swap when
`SKELETON_SPRITE_ENABLED === true`; procedural `drawFigure` remains default / fallback.

## Design (original — mesh of 3 inspiration refs)

**Name:** Ashen Skeleton / Rift Bonewalker

Meshed traits (inspiration only — no WoW / Blizzard / InkWell IP copies):

1. Tusked / heavy jaw silhouette (subtle tusks, not full orc boss skull)
2. Cyan / aether eye glow (Temporal Rift), scrap light bone/leather armor
3. Fur scrap pauldron + light blade/buckler vibe — **not** full boss bulk

## References (inspiration only)

Under `assets/skeleton/_refs/` (stripped from APK by build scripts):

| File | Role |
|------|------|
| `tusk-skull-apose-insp.png` | Bone silhouette / heavy jaw |
| `armored-barbarian-insp.png` | Cyan eyes, axe/shield barbarian vibe |
| `sword-shield-warrior-insp.png` | Fur pauldron / sword+shield warrior vibe |

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Skeleton-Sprites\` — idle / walk / windup
for Photos review (chat may not show PNGs).

## Next

- User may send more skeleton NPC refs → additional mesh sets
- Flip `SKELETON_SPRITE_ENABLED` + BETA APK when applying to game
- Optional more walk / hurt / emerge frames

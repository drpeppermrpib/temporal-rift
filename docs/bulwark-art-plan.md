# Ashen Bulwark / Rift Brute art plan

Original Temporal Rift **Ashen Bulwark** (aka **Rift Brute**) sheets — same Gharok /
Ashen Husk / Ashen Skeleton **art quality / process**, tank footprint (not boss).

**Status (2026-08-09):** **APPLIED in v2.13.0** — `BULWARK_SPRITE_ENABLED=true` in BETA.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Bulwark collision `r` | **20** | Unchanged — `docs/UNIT_SIZES.md` / `ETYPES.bulwark` |
| Procedural figure `s` | **1.45** | Existing bulwark figure scale |
| Sprite `drawH` | **36 × 1.45 = 52.2** | Matches `drawFigure` `H = 36 * s` |
| On-screen | larger than husk `36` / skeleton `32.4` | **Not** husk-14/`36`, **not** boss `r=54` / `drawH=228` |

Source PNGs are 512×512 (same sheet resolution as Gharok/Husk/Skeleton) but drawn at bulwark scale.

## Assets

- `assets/bulwark/idle.png`
- `assets/bulwark/walk.png`
- `assets/bulwark/windup.png`

Transparent background. Soft-load path mirrors skeleton/husk frame-swap when
`BULWARK_SPRITE_ENABLED === true`; procedural `drawFigure` remains default / fallback.

## Design (original — mesh of 4 inspiration refs)

**Name:** Ashen Bulwark / Rift Brute

Meshed traits (inspiration only — no WoW / Blizzard / Warhammer IP copies):

1. Bulky tank silhouette + tusks (orc/brute mashup)
2. Scrap spiked pauldrons / bracers / greaves — asymmetrical tank read
3. Green-grey ashen mottled skin + ember-red eye glow (Temporal Rift)
4. Optional subtle ember/aether fist accent on windup — **not** full shaman fire-hand kit

## References (inspiration only)

Under `assets/bulwark/_refs/` (stripped from APK by build scripts):

| File | Role |
|------|------|
| `fire-hand-undead-orc-insp.png` | Ashen skin / tusks / optional ember accent (not full shaman) |
| `spiked-brute-insp.png` | Spiked scrap armor / bulky undead brute silhouette |
| `green-orc-warrior-insp.png` | Green orc warrior / spiked pauldron + tusk read |
| `spiked-pauldron-orc-insp.png` | Spiked pauldron tank / ashen green-grey skin |

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Bulwark-Sprites\` — idle / walk / windup
for Photos review (chat may not show PNGs).

## Next

- Optional more walk / hurt / fusion-emerge frames
- Ravager (#4) still procedural until art pass

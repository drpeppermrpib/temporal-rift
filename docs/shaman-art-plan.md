# Ashen Shaman / Rift Hexer art plan

Original Temporal Rift **Ashen Shaman** (aka **Rift Hexer**) sheets — same Gharok /
Ashen Husk / Skeleton / Bulwark **art quality / process**, caster footprint (not boss).

**Status (2026-08-09):** **APPLIED in v2.13.0** — `SHAMAN_SPRITE_ENABLED=true` in BETA.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Shaman collision `r` | **13** | Unchanged — `docs/UNIT_SIZES.md` / `ETYPES.shaman` |
| Procedural figure `s` | **1.0** | Same as husk figure scale |
| Sprite `drawH` | **36 × 1.0 = 36** | Matches `drawFigure` `H = 36 * s` — **husk baseline** |
| On-screen | same height as husk `36` | **Not** skeleton `32.4`, **not** bulwark `52.2`, **not** Gharok `228` |

Source PNGs are 512×512 (same sheet resolution as Gharok/Husk/Skeleton/Bulwark)
but drawn at shaman scale (`drawH=36`).

## Assets

- `assets/shaman/idle.png`
- `assets/shaman/walk.png`
- `assets/shaman/windup.png`

Transparent background. Soft-load path mirrors bulwark/skeleton/husk frame-swap when
`SHAMAN_SPRITE_ENABLED === true`; procedural `drawFigure` remains default / fallback.
Windup frame maps to staff cast telegraph (`swipeT` on ranged shaman).

## Design (original — mesh of 4 inspiration refs)

**Name:** Ashen Shaman / Rift Hexer

Meshed traits (inspiration only — no WoW / Blizzard / Warhammer / Disney IP copies):

1. Lean undead caster silhouette + staff (orc-elf mage / bone shaman mashup)
2. Tattered violet/indigo hooded robes + bone talismans (ragged hood/cowl — **not** Disney pointed hat)
3. Ashen grey-green mottled skin + cyan-violet eye/staff aether glow (Temporal Rift)
4. Cast windup: raised staff + free-hand aether orb / orbital glow (staff glow only from cosmic ref)

## References (inspiration only)

Under `assets/shaman/_refs/` (stripped from APK by build scripts):

| File | Role |
|------|------|
| `orc-elf-mage-staff-spirits-insp.png` | Staff + cyan runes / spirit-caller silhouette |
| `bone-shaman-necromancer-insp.png` | Lean caster / bone talismans / cast windup |
| `cosmic-staff-glow-insp.png` | Staff head glow / cyan-violet aether only |
| `rotting-wizard-lightning-insp.png` | Tattered robe / undead ashen skin |

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Shaman-Sprites\` — idle / walk / windup
for Photos review (chat may not show PNGs).

## Next

- NPC **#4** ravager art pass when refs ready (still procedural)
- Optional more walk / hurt / cast-release frames

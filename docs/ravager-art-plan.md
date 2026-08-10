# Ashen Ravager / Rift Cyclope art plan

Original Temporal Rift **Ashen Ravager** (aka **Rift Cyclope**) sheets — same Gharok /
Ashen Husk / Bulwark **art quality / process**, sized **between** common foes and boss.

**Status (2026-08-09):** **DEFERRED** — `RAVAGER_SPRITE_ENABLED=false`. Art drafted; live
game still uses procedural ravager at current lock. Flip flag + apply size + ship BETA later
(with next update batch). **No APK / no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | Planned on apply | Notes |
|-------|---------------------|------------------|--------|
| Ravager collision `r` | **24** | **36** | Between bulwark **23** and Gharok **54** |
| Procedural figure `s` | **1.7** (~drawH 61) | **≈2.78** (`100/36`) | Match sprite `drawH` / 36 |
| Sprite `drawH` | n/a (unused) | **100** | Between bulwark **62** and Gharok **228** |
| On-screen | procedural brute | clearly > bulwark, << boss | Documented in `docs/UNIT_SIZES.md` |

Source PNGs are 512×512 (same sheet resolution as Gharok/Husk/Bulwark) but drawn at ravager scale.

## Assets

- `assets/ravager/idle.png`
- `assets/ravager/walk.png`
- `assets/ravager/windup.png`

Transparent background. Soft-load path mirrors bulwark/husk frame-swap when
`RAVAGER_SPRITE_ENABLED === true`; procedural `drawFigure` remains default / fallback
while flag is false (live unchanged).

## Design (original — mesh of inspiration refs)

**Name:** Ashen Ravager / Rift Cyclope

Meshed traits (inspiration only — no WoW / Saurfang / Blizzard / Warhammer IP copies):

1. **One central cyclops eye** (scarred sealed other socket) + ember-amber glow
2. Tall, big, **fat** zombie-orc belly bulk + tusks
3. Decay mottling / sores / crude stitches (from zombie-orc ref — **no spaghetti gag**)
4. Scrap spiked club + asymmetrical rusty pauldron / leather straps / bone necklace
5. Ashen olive–grey-green Temporal Rift undead read

## References (inspiration only)

Under `assets/ravager/_refs/` (stripped from APK by build scripts):

| File | Role |
|------|------|
| `warrior-armor-tusks-insp.png` | Veteran orc skin / tusks (not WoW identity) |
| `cyclops-club-insp.png` | Single eye + club + stout silhouette |
| `hulking-armored-insp.png` | Tall fat belly + scrap armor + crude weapon |
| `forest-green-orc-insp.png` | Big green mass / belly scale |
| `zombie-orc-decay-insp.png` | Decay / rot / tusks (skip spaghetti gag) |

Fat-giant source file was missing on disk from the Cursor assets cache; belly bulk taken from hulking + forest refs.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Ravager-Sprites\` — `01-idle` / `02-walk` /
`03-windup` / `preview-all-three.png` for Photos review (chat may not show PNGs).

## Next (when user says "next")

- Articulation polish / walk feel
- Enemy barks / voice for ravager
- Flip `RAVAGER_SPRITE_ENABLED=true`, apply `r=36` / `s≈2.78` / `drawH=100`, ship with update batch
- Do **not** enable in live store build until that apply

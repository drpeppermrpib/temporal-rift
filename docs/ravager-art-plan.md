# Ashen Ravager / Rift Cyclope art plan

Original Temporal Rift **Ashen Ravager** (aka **Rift Cyclope**) sheets — same Gharok /
Ashen Husk / Bulwark **art quality / process**, sized **between** common foes and boss.

**Status (2026-08-09):** **Articulation + barks coded on master; flag still OFF.** Live game
still uses procedural ravager (`r=24` / `s=1.7`). Flip `RAVAGER_SPRITE_ENABLED=true` (one line
near `ETYPES`) to enable sheets + `r=36` / `drawH=100` / `s≈2.78`. **Store ship deferred** with
stronghold / building-art batch — **no APK / no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON (coded) | Notes |
|-------|---------------------|--------------------|--------|
| Ravager collision `r` | **24** | **36** (`RAVAGER_R`) | Between bulwark **23** and Gharok **54** |
| Procedural / figure `s` | **1.7** (~drawH 61) | **≈2.78** (`RAVAGER_FIGURE_S`) | Match sprite `drawH` / 36 |
| Sprite `drawH` | n/a (unused) | **100** | Between bulwark **62** and Gharok **228** |
| On-screen | procedural brute | clearly > bulwark, << boss | Documented in `docs/UNIT_SIZES.md` |

Source PNGs are 512×512 (same sheet resolution as Gharok/Husk/Bulwark) but drawn at ravager scale.

## Assets

- `assets/ravager/idle.png`
- `assets/ravager/walk.png`
- `assets/ravager/windup.png`

Transparent background. Soft-load path mirrors bulwark/husk **idle↔walk↔windup** frame-swap +
plant squash / bob / lean when `RAVAGER_SPRITE_ENABLED === true`; procedural `drawFigure`
remains default / fallback while flag is false (live unchanged).

## Articulation (coded)

Same pattern as husk / bulwark / shaman:

- **Windup sheet** while `swipeT > 0`
- **Walk:** alternate idle (plant) ↔ walk (stride) each half gait cycle (`floor(walk/π)`)
- **Plant squash / bob / lean** on footfalls (slightly heavier than bulwark for lumbering mass)
- Procedural fallback when flag OFF or sheets fail

## Barks (coded)

- Float lines: deep cyclops-orc originals (`grrrahh`, `smash!`, `rarrr`, `one eye…`, etc.) —
  distinct from bulwark tank shouts
- Synth voice: lower + longer than bulwark (≈82→36 Hz saw + lowpass), mute-aware via `sfx` bark
- Shared rate-limit / aggro / attack / combat triggers as other foes

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

## Apply / ship (later batch)

1. Set `RAVAGER_SPRITE_ENABLED = true` (sizes auto-follow via `RAVAGER_R` / `RAVAGER_FIGURE_S`)
2. Ship with stronghold + building art + town Continuity save (one update)
3. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager art~~ drafted · ~~articulation+barks~~ coded flag OFF → (2) **building art** (user photos)
→ (3) ally skins if photos → (4) fence brick stronghold → (5) one update apply (flag ON + town save)

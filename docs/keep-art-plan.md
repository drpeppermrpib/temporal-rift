# Rift Keep building art plan

Original Temporal Rift **Rift Keep** town-hub sheets — meshed from castle/keep
inspiration refs (not a real-world named castle clone). **Keep only** this pass;
halls / timber / supply / muster / camps deferred to later #2 parts.

**Status (2026-08-09):** Art drafted + soft-wired. Live game still uses procedural
keep (`drawStructure` rects). Flip `KEEP_SPRITE_ENABLED=true` (one line near
`drawStructure`) to enable sheets. **Store ship deferred** with halls/camps +
stronghold + town-save batch — **no APK / no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON | Notes |
|-------|---------------------|------------|--------|
| Keep collision `r` | **54** (`STRUCT_KINDS.keep.r`) | **54** (unchanged) | Same footprint as current Keep |
| Procedural body | bw **42** × bh **40** (+ ~16 tower bits ≈ **56** tall) | unused when sprite draws | Baseline silhouette |
| Sprite `drawH` | n/a | **72** (`KEEP_SPRITE_DRAWH`) | Slightly taller for detail; still << Gharok **228** |
| Sprite `drawW` | n/a | aspect from sheet (~**55–65** typical) | Feet at `s.y`; not sprawling fortress |

Source PNGs are 512×512 transparent (same sheet resolution as unit art) but drawn
at Keep scale — compact tower-house, not Gharok-huge.

## Assets

- `assets/buildings/keep/idle.png` — main hero Keep
- `assets/buildings/keep/damaged.png` — battle-scarred variant (HP &lt; 45% when flag ON)

Transparent background. Soft-load path mirrors unit flags: when
`KEEP_SPRITE_ENABLED === true`, Keep draws sheets; procedural body remains default /
fallback while flag is false (live unchanged). Other structure kinds untouched.

## Design (original — mesh of inspiration refs)

**Name:** Rift Keep

Meshed traits (inspiration only — original Temporal Rift keep, not a named real castle):

1. Tall rectangular tower-house + crenellated battlements
2. Corbelled / machicolation flare under the parapet
3. Weathered multi-tone grey–tan fieldstone + quoin corners
4. Arched banded wooden door + short steps; sparse slits + a few arched windows
5. Compact footprint (single keep, not sprawling curtain walls)
6. Subtle Temporal Rift accent: cool cyan–violet aether glow in windows + muted purple–gold pennant

## References (inspiration only)

Under `assets/buildings/keep/_refs/` (stripped from APK by build scripts — not copied to `www/`):

| File | Role |
|------|------|
| `ross-keep-insp.png` | Tower-house + curtain silhouette / mottled stone (inspiration only) |
| `remote-outpost-insp.png` | Compact 3/4 keep massing / gothic slits / flared base |
| `blocky-tower-insp.png` | Tall standalone keep read / battlement silhouette |
| `machicolation-keep-insp.png` | Corbelled gallery + peaked merlons / chunky masonry |
| `miniature-keep-insp.png` | Compact hero keep / steps + flag energy |

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Keep-Sprites\` — `01-idle` / `02-damaged` /
checker variants / `preview-idle-damaged.png` for Photos review.

## Apply / ship (later batch)

1. Finish #2 building parts (halls / timber / supply / muster / camps) when user sends photos
2. Set `KEEP_SPRITE_ENABLED = true` (and peer building flags) with stronghold + town Continuity save
3. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager~~ coded flag OFF → (2a) **~~Keep art~~ drafted flag OFF** → (2b) **halls/camps** (user photos next)
→ (3) ally skins if photos → (4) fence brick stronghold → (5) one update apply

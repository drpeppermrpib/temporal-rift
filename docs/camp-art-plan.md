# Timber Camp / Supply Camp building art plan

Original Temporal Rift **camp** town buildings — meshed from medieval camp
inspiration refs (not a named real-world camp clone). **Camps only** this pass
(#2b); Muster Hall / other halls deferred until user sends photos.

**Status (2026-08-09):** Art drafted + soft-wired. Live game still uses procedural
timber/farm rects (`drawStructure`). Flip `CAMP_SPRITE_ENABLED=true` plus
`TIMBER_SPRITE_ENABLED` / `SUPPLY_SPRITE_ENABLED` near `drawStructure` to enable
sheets. **Store ship deferred** with halls + stronghold + town-save batch —
**no APK / no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON | Notes |
|-------|---------------------|------------|--------|
| Timber collision `r` | **40** (`STRUCT_KINDS.timber.r`) | **40** (unchanged) | Same footprint |
| Supply collision `r` | **36** (`STRUCT_KINDS.farm.r`) | **36** (unchanged) | `farm` kind = Supply Camp |
| Procedural body | bw **32** × bh **28** (+ roof bits) | unused when sprite draws | Baseline silhouette |
| Timber sprite `drawH` | n/a | **50** (`TIMBER_SPRITE_DRAWH`) | Camp-tall; << Keep **72** / Gharok **228** |
| Supply sprite `drawH` | n/a | **46** (`SUPPLY_SPRITE_DRAWH`) | Slightly shorter than timber |
| Sprite `drawW` | n/a | aspect from sheet | Feet at `s.y`; not Keep-tall sprawl |

Source PNGs are 512×512 transparent (same sheet resolution as Keep / unit art)
but drawn at camp scale — compact shed/tent hub, not fortress or Gharok-huge.

## Assets

- `assets/buildings/camp/idle.png` / `damaged.png` — shared default (timber twin)
- `assets/buildings/camp/timber-idle.png` / `timber-damaged.png` — logs / lumber shed
- `assets/buildings/camp/supply-idle.png` / `supply-damaged.png` — tents / crates / barrels

Transparent background. Soft-load path mirrors Keep: when
`CAMP_SPRITE_ENABLED === true` and the per-type flag is true, that kind draws
sheets; procedural body remains default / fallback while flags are false
(live unchanged). Keep / muster / vault / pit untouched this pass.

## Design (original — mesh of inspiration refs)

**Names:** Timber Camp · Supply Camp (Ashen / Rift town slice)

Meshed traits (inspiration only):

1. Compact single-hub footprint (not a full encampment panorama)
2. Timber: stacked logs, open wood shed, stump/axe, warm brown wood
3. Supply: A-frame canvas tent(s), crates, barrels, sacks, cart wheel
4. Low fence / post accents; painterly 3/4 view matching Rift Keep style
5. Subtle Temporal Rift accent: cool cyan–violet aether lantern / pennant glow

## References (inspiration only)

Under `assets/buildings/camp/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `camp-site-insp.png` | Fenced tent row + crates / log stacks |
| `marsh-camp-insp.png` | Marsh tent + wagon / barrel logistics |
| `camp-detail-insp.png` | Patterned tents + trestle / supply clutter |

## Soft-wire flags

```
CAMP_SPRITE_ENABLED = false   // master
TIMBER_SPRITE_ENABLED = false // timber kind
SUPPLY_SPRITE_ENABLED = false // farm kind = Supply Camp
```

All three stay **false** until the building-art + stronghold ship batch.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Camp-Sprites\` — numbered idle/damaged
variants / checker boards / `preview-camps.png` for Photos review.

## Apply / ship (later batch)

1. Finish #2 building parts (**Muster Hall** / other halls) when user sends photos
2. Set `CAMP_SPRITE_ENABLED` + timber/supply flags (and Keep peer) with stronghold + town Continuity save
3. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager~~ coded flag OFF → (2a) ~~Keep art~~ drafted flag OFF → (2b) **~~camps~~ drafted flag OFF** → halls when photos → (3) ally skins if photos → (4) fence brick stronghold → (5) one update apply

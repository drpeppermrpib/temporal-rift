# Aether Pit building art plan

Original Temporal Rift **Aether Pit** town building — meshed from stone well /
earth crater / tiered quarry cues, with Temporal Rift aether glow in the hole.
**Aether Pit only** this pass; Keep/camp/hall/vault already drafted flag OFF.

**Status (2026-08-09):** Drafted + soft-wired. Live game still uses procedural
`aetherpit` rects (`drawStructure`). Flip `PIT_SPRITE_ENABLED=true` (one line
near `drawStructure`) to enable sheets. **Store ship deferred** with
keep/camp/hall/vault + stronghold + town-save batch — **no APK / no version
bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON | Notes |
|-------|---------------------|------------|--------|
| Pit collision `r` | **38** (`STRUCT_KINDS.aetherpit.r`) | **38** (unchanged) | Between supply (36) and vault/timber (40) |
| Procedural body | bw **32** × bh **28** (+ roof bits) | unused when sprite draws | Baseline silhouette |
| Sprite `drawH` | n/a | **48** (`PIT_SPRITE_DRAWH`) | Low dug crater; between supply **46** and vault **52** |
| Sprite `drawW` | n/a | aspect from sheet | Feet at `s.y`; ground pit, not hall / Keep / Gharok |

Source PNGs are 512×512 transparent but drawn at pit scale — stone-lined crater
with cyan→teal / purple aether glow deep in the hole.

## Assets

- `assets/buildings/pit/idle.png` — main Aether Pit (dug crater / well)
- `assets/buildings/pit/damaged.png` — battle-scarred variant (HP &lt; 45% when flag ON)

Transparent background. Soft-load path mirrors vault/hall: when
`PIT_SPRITE_ENABLED === true`, `aetherpit` kind draws sheets; procedural body
remains default / fallback while flag is false (live unchanged).

## Design (original — mesh of inspiration refs)

**Name:** Aether Pit

Meshed traits (inspiration only):

1. Circular dug stone-lined well / earth pit rim (photogrammetry well + earth pit)
2. Rocky crater mound of angular grey-brown boulders
3. Optional faint tiered quarry ledge cues inside the hole
4. Deep **cyan→teal** aether pool with **purple/violet** ambient on inner stones
5. Damaged: collapsed rim, rubble in hole, scorched rock, weaker uneven glow
6. **No** freestanding house, mine timber door, branded lamp object, logo, or readable text

## References (inspiration only)

Under `assets/buildings/pit/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `stone-well-insp.png` | Dry-stone lined circular well / pit |
| `earth-pit-rim-insp.png` | Raised earth rim + dug circular hole |
| `tiered-quarry-insp.png` | Tiered quarry crater massing |
| `rocky-crater-insp.png` | Rocky boulder crater / quarry hole |
| `aether-glow-mood-insp.png` | **GLOW ONLY** — cyan→teal core + purple ambient mood from a lamp photo; **do not** depict the lamp cylinder, logo, or product |

## Soft-wire flags

```
PIT_SPRITE_ENABLED = false   // aetherpit kind
PIT_SPRITE_DRAWH = 48
```

Stay **false** until the building-art + stronghold ship batch.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Pit-Sprites\` — `01-idle` / `02-damaged` /
checker variants / `preview-idle-damaged.png` for Photos review.

## Apply / ship (later batch)

1. Set `PIT_SPRITE_ENABLED = true` (and peer building flags) with stronghold + town Continuity save
2. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager~~ → (2a) ~~Keep~~ → (2b) ~~camps~~ → (2c) ~~Muster Hall~~ →
(2d) ~~Gold Vault~~ → **(2e) ~~Aether Pit~~ drafted, flag OFF** → (3) allies →
(4) fence brick stronghold → (5) one update apply

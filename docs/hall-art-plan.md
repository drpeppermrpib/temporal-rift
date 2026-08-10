# Muster Hall building art plan

Original Temporal Rift **Muster Hall** town building — meshed from medieval
town-hall / half-timber / gothic detail inspiration refs (not a named real-world
landmark clone). **Muster Hall only** this pass (#2c); Keep / camps already
drafted; Gold Vault is #2d; Aether Pit still pending.

**Status (2026-08-09):** Art drafted + soft-wired. Live game still uses procedural
muster rects (`drawStructure`). Flip `HALL_SPRITE_ENABLED=true` (one line near
`drawStructure`) to enable sheets. **Store ship deferred** with vault/pit +
stronghold + town-save batch — **no APK / no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON | Notes |
|-------|---------------------|------------|--------|
| Muster collision `r` | **46** (`STRUCT_KINDS.muster.r`) | **46** (unchanged) | Same footprint |
| Procedural body | bw **32** × bh **28** (+ roof bits) | unused when sprite draws | Baseline silhouette |
| Sprite `drawH` | n/a | **60** (`HALL_SPRITE_DRAWH`) | Between camp **~50** and Keep **72**; training hall, not cathedral |
| Sprite `drawW` | n/a | aspect from sheet | Feet at `s.y`; not Keep-tall / not Gharok **228** |

Source PNGs are 512×512 transparent (same sheet resolution as Keep / camp / unit
art) but drawn at Muster scale — civic training hall with modest clock tower,
not a cathedral massing.

## Assets

- `assets/buildings/hall/idle.png` — main Muster Hall
- `assets/buildings/hall/damaged.png` — battle-scarred variant (HP &lt; 45% when flag ON)

Transparent background. Soft-load path mirrors Keep/camp: when
`HALL_SPRITE_ENABLED === true`, `muster` kind draws sheets; procedural body
remains default / fallback while flag is false (live unchanged). Other structure
kinds untouched by this flag.

## Design (original — mesh of inspiration refs)

**Name:** Muster Hall

Meshed traits (inspiration only — original Temporal Rift hall):

1. Stone arcade / arched ground floor (town-hall loggia cue)
2. Half-timber upper story (dark beams on cream) + modest stepped gables
3. Short clock-tower / cupola — training-hall height, not cathedral spire
4. Red dormer / window accents + spear-rack / banner training cues
5. Subtle Temporal Rift accent: cool cyan–violet aether glow in windows + purple pennant

## References (inspiration only)

Under `assets/buildings/hall/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `town-hall-church-insp.png` | Arcade + stepped gables / civic massing (hall only — ignore church) |
| `half-timber-hall-insp.png` | Half-timber + stone arcade + clock tower proportion |
| `gothic-hall-detail-insp.png` | Ornate window / dormer / red accent detail |
| `cathedral-massing-insp.png` | Scale ceiling only — do **not** ship cathedral footprint |

## Soft-wire flags

```
HALL_SPRITE_ENABLED = false   // muster kind
HALL_SPRITE_DRAWH = 60
```

Stay **false** until the building-art + stronghold ship batch.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Hall-Sprites\` — `01-idle` / `02-damaged` /
checker variants / `preview-idle-damaged.png` for Photos review.

## Apply / ship (later batch)

1. Finish remaining #2 building parts (**Aether Pit** if desired) when ready
2. Set `HALL_SPRITE_ENABLED = true` (and peer building flags) with stronghold + town Continuity save
3. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager~~ coded flag OFF → (2a) ~~Keep~~ drafted → (2b) ~~camps~~ drafted →
**(2c) ~~Muster Hall~~ drafted flag OFF** → (2d) Gold Vault → pit optional →
(3) ally skins if photos → (4) fence brick stronghold → (5) one update apply

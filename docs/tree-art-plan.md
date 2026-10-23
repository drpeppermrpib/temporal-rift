# World tree variety art plan (Temporal Rift)

Original **world scenery** soft-wire — one / few / bunch placements. Same Continuity
**mesh** rule as Ashen Husk / Ravager / allies: refs are inspiration only; shipping
sheets are **original Temporal Rift composites** (GenerateImage remesh + flood-key),
not free PNG / photo cutouts.

**Status (2026-08-25 remesh):** `TREE_SPRITE_VARIANTS_ENABLED=true` on Continuity /
master. Photo-stock isolates retired; all variant sheets remeshed to classic TR
cartoon pine DNA. **No APK / no version bump** (APP_VERSION stays **3.1.4**).

## Design (original — mesh of inspiration refs)

Meshed traits (inspiration only — **not** stock photo pack cutouts):

1. **Classic TR pine DNA** — thick black outlines, scalloped/bubbly foliage tiers,
   cel lime→forest green, short reddish-brown trunk with simple bark lines
2. **Silhouette variety** from multi-tree sheet cue — broad spruce, short bushy,
   slender fir, leafy deciduous canopy, mid fir (all restyled as TR cartoons)
3. **Dense thicket read** from spruce-bunch cue — overlapping cones as bunch sheets
4. **One / few / bunch** spawn kinds with classic pines still ~half of singles

## Size / draw locks

| Kind | Collision `r` | `drawH` (sprite path) | Notes |
|------|---------------|------------------------|--------|
| **one** (classic) | `12 + size*3` | `(96 + size*18) * scale` | Unchanged from 2.8.7 pines |
| **one** (meshed) | same | same formula | `size` nudged by sprite (short→0, broad/slender/leafy→2) |
| **few** | ≥16–18 | `(112 + size*12) * scale` | 2–3+ tree cluster sheets |
| **bunch** | ≥22 | `(138 + size*10) * scale` | Dense thicket — sparse weight |

`scale` from size: 0→0.78 / 1→1 / 2→1.18. Procedural scalloped canopy remains fallback if sheets fail.

## Assets (ship — synced to `www/`)

### one

| File | Role |
|------|------|
| `pine_small.png` / `pine_med.png` / `pine_tall.png` | Classic TR cartoon singles (native aspect — **not** forced 512) |
| `tree_single_broad.png` | Broad spruce silhouette remesh |
| `tree_single_short.png` | Short/bushy conifer remesh |
| `tree_single_slender.png` | Slender blue-green fir remesh |
| `tree_single_leafy.png` | Leafy deciduous remesh |
| `tree_single_fir.png` | Mid fir remesh |

### few

| File | Role |
|------|------|
| `tree_few_pair.png` | Tall + short pair remesh |
| `tree_few_grove.png` | Multi-style grove remesh |
| `tree_few_classic.png` | Classic TR pine cluster remesh |
| `tree_few_mix.png` | Pine + spruce + leafy mix remesh |

### bunch

| File | Role |
|------|------|
| `tree_bunch_spruce.png` | Dense spruce thicket remesh (primary bunch) |
| `tree_bunch_mix.png` | Mixed thicket remesh |

Variant sheets are **512×512** transparent PNGs. Classic pines keep original
dimensions so drawH footprint stays locked.

## Random combo (spawn)

`assignTreeVariant(t)` after each `tree` place in `buildWorld`:

| Kind | Weight | Sprite pick |
|------|--------|-------------|
| **one** | **55%** | ~52% classic small/med/tall by `size`; else weighted meshed singles |
| **few** | **32%** | pair / classic / mix / grove (grove rarest) |
| **bunch** | **13%** | spruce 62% / mix 38% |

Flag **OFF** → classic `pineSpriteFor` size→small/med/tall only (2.8.7 behavior).

## Pipeline

1. Inspiration under `assets/world/trees/_refs/` (APK-stripped; not copied to `www/`)
2. **GenerateImage** original sheets meshing classic TR pine DNA + ref silhouettes → `_raw/*_gen.png`
3. `node scripts/process-tree-sprites.mjs` — light/grey/black flood-key → crop → 512 → transparent PNGs
4. Sync ship sheets → `www/assets/world/trees/` (no `_refs` / `_raw` / `_probe`)
5. Soft-wire: `TREE_SPRITE_VARIANTS_ENABLED` + procedural fallback

Prior photo-isolate composites kept as `_raw/*_photo_prev.png` audit only (not shipped).

## References (inspiration only)

| File | Role |
|------|------|
| `insp-spruce-thicket.png` | Dense bunch / thicket silhouette cue |
| `insp-multi-tree-sheet.png` | Multi-type silhouette cue → singles + fews |
| `insp-pine-foliage-close.png` | Foliage texture cue only (not shipped — watermark / no silhouette) |
| `insp-tr-pine-*.png` | Existing in-game classic pines (style DNA) |

## Naming

Original Temporal Rift scenery names only (`tree_*` / `pine_*`). Not branded
stock-tree IP copies / free PNG pack ships.

# Ashen Laborer art plan

Original Temporal Rift **Ashen Laborer** (town worker — **≠ squad**) sheets —
stocky miner/chopper soft-wire pipeline (same as companions / buildings).
Worker footprint (not companion knight, not boss).

**Status (2026-08-10):** **Articulation + barks on master** —
`LABORER_SPRITE_ENABLED=true` for Continuity/source testing (store ship deferred).
Prior originality remesh kept (ash-grey+ochre; cyan cuff/pick-tip — not gallery
dwarf clone). **No APK / no version bump / no Play.**

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Laborer collision `r` | **11** | Unchanged — `docs/UNIT_SIZES.md` / spawn. Same as Rover footprint |
| Procedural figure | ~22px tall stick worker | torso `-16` / head `-20` box (fallback) |
| Sprite `drawH` | **26** | Matches Rover drawH scale + pad — **not** Scout 38 / Warden 48 / husk 56 |
| On-screen | stocky worker | Keep worker≠squad; do not knight-size or boss-size |

Source PNGs are 512×512 transparent; drawn at `drawH=26` when flag ON.

## Assets

- `assets/allies/laborer/idle.png`
- `assets/allies/laborer/walk.png`
- `assets/allies/laborer/work.png` (pickaxe chop / mine swing; also retaliate swipe)
- `assets/allies/laborer/death.png` (kneeling downed)

Transparent background. Soft-load when `LABORER_SPRITE_ENABLED === true`;
procedural `drawLaborer` remains fallback if sheets fail.
`work` when gathering (`gatherT`) or defend `swipeT`; death when `downed`.
Hidden while `insideMine`.

Process: `node scripts/process-laborer-sprites.mjs` (mid-grey studio flood-key → 512).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (ON Continuity)

| Pose | Trigger |
|------|---------|
| idle ↔ walk | gait half-cycle while moving (`walk` / π) |
| work | chop/mine `gatherT` or retaliate `swipeT` |
| death | `downed` |
| plant squash / bob / lean | heavy worker plant (~ mid Sentinel weight) |
| cyan aether glow | optional on work swing |
| barks | `voice:'laborer'` — CHOP / ORE / HEAVE / BACK TO WORK / OOF (alert/work/attack/combat/hurt) |

## Design (original remesh — traits only from refs)

**Name:** Ashen Laborer

Meshed traits (inspiration only — **not** gallery-signed IP / branded hardhats /
**not** a 1:1 dwarf-miner clone):

1. Stocky **short worker** silhouette (dwarf-like proportions OK — face/gear MUST differ from refs)
2. Rift-worn leather in **dusty ash-grey + warm ochre** straps/patches (not chocolate quilted steampunk clone)
3. **Aether-cyan** as wrist cuff and/or pick-tip glow (not circular forehead gem + diamond backpack lantern combo)
4. **Primary tool:** pickaxe; small simple satchel (simpler than overloaded pipe-rig)
5. Short beard / scarf / forehead goggles for read-at-a-glance (not dual-braid bronze-banded beard)
6. Workers **≠ squad** — town labor, not Warden/Scout/Sentinel

## References (inspiration only)

Under `assets/allies/laborer/_refs/` (not copied to `www/`):

| File | Role |
|------|------|
| `dwarf-miner-lamp-insp.png` | Miner lamp + pack silhouette (**avoid likeness**) |
| `hardhat-crew-insp.png` | Industrial crew grit mood ONLY (no brand hardhats in sheets) |
| `scavenger-shovel-insp.png` | Heavy worker burden / tool stance |
| `porter-lantern-insp.png` | Porter pack + lantern light |
| `woodcutter-axe-insp.png` | Woodcutter axe / log burden |
| `crystal-mine-dwarf-insp.png` | Crystal-mine dwarf work pose / cyan glow mood |
| `pack-dwarf-insp.png` | Overloaded pack dwarf utility silhouette |

## Soft-wire

```js
LABORER_SPRITE_ENABLED = true    // master Continuity testing; store ship deferred
LABORER_SPRITE_DRAWH = 26        // size lock
// collision r=11 always
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Laborer-Sprites\` — idle / walk / work / death  
Also `C:\Users\drpep\Pictures\TemporalRift-Laborer-Sprites\`

## Ship notes

- **No APK / no version bump / no Play** this pass
- Store ship deferred with peer art batch
- Militia skins still pending after laborers
- Workers ≠ squad unchanged

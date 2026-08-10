# Gold Vault building art plan

Original Temporal Rift **Gold Vault** town building — meshed from hillside mine /
fortified bunker-mouth cues (not a named real-world landmark clone, and **not**
the earlier freestanding stronghouse / arcade vault look). **Gold Vault only**
this remesh; Muster Hall is #2c; Aether Pit still pending.

**Status (2026-08-09):** Remeshed to dug-into-hill mine-mouth + soft-wired.
Live game still uses procedural `golddepot` rects (`drawStructure`). Flip
`VAULT_SPRITE_ENABLED=true` (one line near `drawStructure`) to enable sheets.
**Store ship deferred** with hall/pit + stronghold + town-save batch — **no APK
/ no version bump this pass.**

## Size lock

| Field | Live now (flag OFF) | On flag ON | Notes |
|-------|---------------------|------------|--------|
| Vault collision `r` | **40** (`STRUCT_KINDS.golddepot.r`) | **40** (unchanged) | Same footprint as timber camp radius |
| Procedural body | bw **32** × bh **28** (+ roof bits) | unused when sprite draws | Baseline silhouette |
| Sprite `drawH` | n/a | **52** (`VAULT_SPRITE_DRAWH`) | Squat mine mouth; stockier / shorter than Muster Hall **60**; near camp timber **50** |
| Sprite `drawW` | n/a | aspect from sheet | Feet at `s.y`; hillside bunker mouth, not hall / Keep / Gharok |

Source PNGs are 512×512 transparent but drawn at vault scale — low rocky mound
with timber-framed entrance and aether-gold interior glow.

## Assets

- `assets/buildings/vault/idle.png` — main Gold Vault (mine mouth)
- `assets/buildings/vault/damaged.png` — battle-scarred variant (HP &lt; 45% when flag ON)

Transparent background. Soft-load path mirrors Keep/hall: when
`VAULT_SPRITE_ENABLED === true`, `golddepot` kind draws sheets; procedural body
remains default / fallback while flag is false (live unchanged).

## Design (original — mesh of inspiration refs)

**Name:** Gold Vault

Meshed traits (inspiration only):

1. Dug-into-hill / rocky mound bunker mouth (not a freestanding two-story treasury)
2. Heavy rustic timber frame — posts + lintel (optional rope/iron bindings)
3. Dark tunnel interior with warm **aether-gold** glow deep inside
4. Optional rustic ladder + hanging lantern; dirt path / rubble at feet
5. Subtle Temporal Rift accent: cool cyan–violet rim optional; **no readable IP /
   landmark sign text** (do not clone “CRUICE MONITAN” or similar)

## References (inspiration only)

Under `assets/buildings/vault/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `hillside-bunker-mouth-insp.png` | Fortified stone bunker dug into grassy hillside |
| `rocky-cave-ladder-insp.png` | Natural rocky cave opening + rustic ladder |
| `timber-frame-mine-mouth-insp.png` | Timber-framed mine mouth miniature (posts + lintel) |

Prior arcade / fortified-storehouse refs were replaced by this mine-mouth set.

## Soft-wire flags

```
VAULT_SPRITE_ENABLED = false   // golddepot kind
VAULT_SPRITE_DRAWH = 52
```

Stay **false** until the building-art + stronghold ship batch.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Vault-Sprites\` — `01-idle` / `02-damaged` /
checker variants / `preview-idle-damaged.png` for Photos review.

## Optional note — Aether Pit

Aether Pit (`aetherpit`, r=38) remains procedural; no sprite draft this pass
unless a later #2 part adds it. Vault only for #2d remesh.

## Apply / ship (later batch)

1. Optional: Aether Pit art if user sends refs
2. Set `VAULT_SPRITE_ENABLED = true` (and peer building flags) with stronghold + town Continuity save
3. Do **not** enable in live store build until that apply — **no BETA / Play this pass**

## Next batch order

(1) ~~ravager~~ → (2a) ~~Keep~~ → (2b) ~~camps~~ → (2c) ~~Muster Hall~~ →
**(2d) ~~Gold Vault~~ remeshed mine-mouth, flag OFF** → pit optional → (3) allies →
(4) fence brick stronghold → (5) one update apply

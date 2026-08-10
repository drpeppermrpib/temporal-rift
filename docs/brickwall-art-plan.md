# Cloister Wall (brick stronghold) art + systems plan

Original Temporal Rift **Cloister Wall** — modular brick stronghold / cloister
fence meshed from rustic pyramid-cap, iron-picket, variegated scroll, and
arch-slat refs. **Original Ashen/Rift brick only** — no product branding.

**Status (2026-08-09):** Systems + modular art on master. `BRICKWALL_ENABLED=true`
and `BRICKWALL_SPRITE_ENABLED=true` for Continuity / source testing. **Store ship
deferred** with town Continuity save + ravager/building-art batch — **no APK /
no version bump this pass** (stays 2.13.2 / vc46).

Wooden energy barricades are unchanged.

## Size lock

| Field | Value | Notes |
|-------|-------|--------|
| Pillar collision `r` | **18** (`BRICKWALL_PILLAR_R`) | Compact post; << barricade linked dome |
| Link distance | **96** | Cardinal snap between posts |
| Segment thick | **14** | Enemy smash capsule |
| Base HP | **280** (+ wave×10) | Tougher than barricade 160 |
| Pillar `drawH` | **44** | Feet at `y` |
| Segment `drawH` | **36** | Rotated between posts |
| Max posts | **16** | Cap separate from barricade 8 |

## Assets

Under `assets/buildings/brickwall/` (synced to `www/assets/buildings/brickwall/`;
`_refs` stripped from APK):

| File | Role |
|------|------|
| `pillar.png` / `pillar-damaged.png` | Connector post + stone pyramid cap |
| `segment.png` / `segment-damaged.png` | Wall between pillars (brick + iron picket vibe) |
| `corner.png` / `tee.png` (+ damaged) | Optional junction sheets (also auto-composed) |
| `_refs/*-insp.png` | Inspiration only |

Generator: `scripts/gen-brickwall-sprites.mjs`.

## Gameplay (additive)

BUILD picker → **Cloister Wall** (🪵10 · ◈4 · ⬡2):

1. Places a **pillar** at aim (cardinal-snaps toward neighbors).
2. Adjacent posts within link distance on N/E/S/W **auto-link** with a segment.
3. Two perpendicular links → **corner**; three → **T-junction**; four → cross.
4. Ghost preview (after selecting Cloister Wall) shows dashed **LINK** lines like barricade.
5. Enemies smash pillars + segment capsules; braced junctions soak more.
6. Persists in Continuity `town.brickWalls` (with structures/laborers/militia/barricades).

Flags:

```
BRICKWALL_ENABLED = true          // place / link / collide / save
BRICKWALL_SPRITE_ENABLED = true   // sheets; procedural fallback if load fails
```

Set either `false` to soft-disable without deleting code.

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-BrickWall-Sprites\` — pillar / segment /
corner / tee (+ damaged) + `preview-modular.png`.

## Apply / ship (later batch)

1. Keep systems ON; flip peer building/ravager flags with town Continuity ship.
2. Do **not** bump versionCode / ship BETA/Play until that batch.
3. Suggested order: … (2e) Aether Pit drafted → (3) allies → **(4) fence brick stronghold ← this** → (5) one update apply.

# Character drop format (Windows → agent → Temporal Rift)

Easy art path for **2D canvas** characters (orcs, zombies, skeletons, allies).  
**Not** Tripo / full 3D. **Not** expanding the Rift Forge APK this pass — Forge remains a deferred companion; this drop folder is the preferred pilot.

## Pilot stack (recommended)

| Role | Tool | License | Why |
|---|---|---|---|
| **Primary** | [**Pixelorama**](https://www.pixelorama.org/) | **MIT (FOSS)** | Easiest maintained free Windows pixel editor; onion skinning; sprite-sheet export; `winget install pixelorama` or [itch.io](https://orama-interactive.itch.io/pixelorama) / [GitHub releases](https://github.com/Orama-Interactive/Pixelorama/releases) |
| **Backup** | [**LibreSprite**](https://libresprite.github.io/) | **GPLv2 (FOSS)** | Aseprite-like UI (old fork); [Windows builds](https://github.com/LibreSprite/LibreSprite/releases) — fine if you already know Aseprite shortcuts |

### Honest tradeoffs

| Path | Limbs that “flow” | Moving textures | Ease | Fit for TR canvas today |
|---|---|---|---|---|
| **Pixelorama / LibreSprite** frame sheets | Fake it with good walk frames (limbs redrawn per frame) | Yes — paint texture motion into frames | **Easiest** | **Best now** — game can blit sheets without a skeletal runtime |
| **Aseprite** (~$20, not FOSS) | Same as above, polished tools | Same | Easy if you pay | Same sheets as Pixelorama |
| **DragonBones** (free skeletal) | Real bones / skins | Atlas UVs, not full “shader cloth” | Medium; tooling aged | Needs a JS runtime later — **not** for first pilot |
| **Spine / Creature** | Pro skeletal | Pro | Paid + learning curve | Overkill until v3 art pipeline |
| **Godot** AnimatedSprite | Preview only | Preview only | Easy editor | Use to **preview** sheets; export PNGs into this drop folder — do **not** replace the HTML5 game |
| **OpenToonz / Synfig / Blender GP** | Vector / cutout | Possible | Steeper | Too heavy for “drop PNGs for agent” |
| **Cascadeur** | 3D-ish | N/A | Medium | Wrong target (3D) |
| **ComfyUI / A1111 + AnimateDiff** | Can invent frames | Can invent texture motion | **Hard** install + VRAM; cleanup/redraw still needed | Optional later for **drafts only** — not the default pilot |

**AI gen verdict:** Draw in **Pixelorama** first. Local ComfyUI is optional for concept frames; you will still crop, retime, and fix limbs by hand before dropping files here.

## How the pilot works

1. Install **Pixelorama** (or LibreSprite).
2. Create clips: idle / walk / attack / death (see below).
3. Export **horizontal sprite sheets** (or one PNG per clip) into  
   `content/character-drops/`  
   using the naming rules.
4. Tell the agent: *“ingest `orc_walk.png` from character-drops”* (or drop a zip and say the same).
5. Agent wires art into the game in a later pass (loader + unit draw). **This folder is the handoff**, not auto-ingest yet.

## Drop folder

```
content/character-drops/
  README.md                 ← human pilot instructions
  examples/ash-scout/       ← format example (metadata from Rift Forge sample)
  <your files here>
```

Optional: put a whole unit in a subfolder or zip:

```
content/character-drops/orc/
  orc_idle.png
  orc_walk.png
  orc_attack.png
  orc_death.png
  orc.json                  ← optional metadata (see below)
```

or `content/character-drops/orc.zip` with the same layout inside.

## Naming

```
{id}_{clip}.png
```

- `{id}` — lowercase kebab or snake: `orc`, `ash-scout`, `skel_archer`
- `{clip}` — one of: `idle` | `walk` | `attack` | `death`  
  Optional later: `hurt`, `cast`, `run`

Examples: `orc_idle.png`, `orc_walk.png`, `zombie_attack.png`

Also accepted:

- `{id}_{clip}_sheet.png`
- `{id}.zip` containing the PNGs above
- Optional `{id}.json` sidecar (see metadata)

## Recommended frame sizes

| Use | Frame size | Notes |
|---|---|---|
| Default units | **64×64** | Matches Rift Forge `ash-scout` pack hints; good for canvas blit |
| Large / boss | **96×96** or **128×128** | Keep power-of-two; same size for all clips of one unit |
| Tiny fodder | **48×48** | Only if readable at game zoom |

Rules:

- **Feet near bottom-center** of each frame (anchor for procedural→sprite swap).
- Transparent background (PNG).
- One row per sheet, left → right; **no trimmed/rotated frames**.
- Same `frameW` × `frameH` across all clips for a unit.
- Prefer **nearest-neighbor** friendly art (hard pixels or clean edges).

## Clip guidelines

| Clip | Frames (suggest) | FPS (suggest) | Loop |
|---|---|---|---|
| `idle` | 4 | 6 | yes |
| `walk` | 6–8 | 10 | yes |
| `attack` | 4–6 | 12 | no |
| `death` | 4–6 | 8 | no |

“Limbs flow together”: on walk/attack, keep torso/hips continuous — onion-skin in Pixelorama; avoid teleporting hands between frames.  
“Moving textures”: shift cloth/armor highlights 1–2 px across the walk loop so the sheet feels alive (no engine shader required yet).

## Optional metadata (`{id}.json`)

Compatible with Rift Forge pack animation block (simplified):

```json
{
  "id": "orc",
  "name": "Orc Raider",
  "role": "enemy",
  "animations": {
    "idle":   { "sheet": "orc_idle.png",   "frameW": 64, "frameH": 64, "frames": 4, "fps": 6,  "loop": true },
    "walk":   { "sheet": "orc_walk.png",   "frameW": 64, "frameH": 64, "frames": 6, "fps": 10, "loop": true },
    "attack": { "sheet": "orc_attack.png", "frameW": 64, "frameH": 64, "frames": 4, "fps": 12, "loop": false },
    "death":  { "sheet": "orc_death.png",  "frameW": 64, "frameH": 64, "frames": 4, "fps": 8,  "loop": false }
  }
}
```

If JSON is missing, the agent will infer grid from filename + equal frame width (document frame count in chat when dropping).

## Example: ash-scout

See `content/character-drops/examples/ash-scout/` — metadata copied from `../rift-forge/sample-packs/ash-scout`.  
**Sheets are not drawn yet**; replace placeholders by exporting `idle`/`walk`/`attack`/`death` 64×64 sheets into that folder (or a new `ash-scout_*.png` drop at the root of `character-drops/`).

## What the agent will do later (not this pass)

1. Copy approved sheets into `www/assets/characters/{id}/`.
2. Add a small sheet player (frame index from `t * fps`).
3. Swap one enemy/ally draw path from procedural humanoid → sheet blit.
4. Only then consider skeletal (DragonBones/Spine-like) or UV “moving texture” shaders.

## Still needed in-engine for “limbs flow + moving textures”

| Goal | Engine work |
|---|---|
| Limbs flow (sheet) | Good art + sheet player + state machine (idle/walk/attack/death) |
| Limbs flow (true skeletal) | Bone runtime + pack format + part atlases — **v3**, after sheets work |
| Moving textures | Short-term: paint into frames; mid: scroll UVs on cloth mesh/quad; long: shader materials |
| Allies + enemies parity | Same drop format; role in JSON (`enemy` / `ally`) |

Rift Forge APK stays **deferred for ease** — use this Windows drop workflow until sheets are proven in-game.

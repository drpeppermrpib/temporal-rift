# Character drops — easy Windows → agent handoff

Rift Forge APK is **too hard** for day-to-day skins. Use this folder instead.

## Pilot apps (install on Windows)

1. **Primary — Pixelorama (MIT, free/open source)**  
   - Site: https://www.pixelorama.org/  
   - Install: `winget install pixelorama`  
   - Or: https://orama-interactive.itch.io/pixelorama / https://github.com/Orama-Interactive/Pixelorama/releases  

2. **Backup — LibreSprite (GPLv2)**  
   - https://libresprite.github.io/  
   - https://github.com/LibreSprite/LibreSprite/releases  

Full format, sizes, and tradeoffs: [`docs/CHARACTER_DROP_FORMAT.md`](../../docs/CHARACTER_DROP_FORMAT.md)

## Workflow

1. Draw / animate in Pixelorama (onion skin walk cycles).
2. Export horizontal PNG sprite sheets.
3. Save here with names like:
   - `orc_idle.png`
   - `orc_walk.png`
   - `orc_attack.png`
   - `orc_death.png`
4. Optional: zip the set (`orc.zip`) or add `orc.json` metadata.
5. Tell the agent: *“ingest the orc drop from character-drops.”*

## Example

`examples/ash-scout/` — Rift Forge sample **metadata** (sheets still to be drawn). Target **64×64** frames.

## Do not

- Expect auto-load into the live game yet (docs + drop only this pass).
- Expand the Forge APK for this — Windows editor + this folder is the path.

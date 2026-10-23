# User AI SFX drop folder

Save AI-generated or hand-picked sound files **here** with the exact filenames below. The game checks this folder **first**; if a file is missing, it uses shipped procedural WAVs in `assets/audio/` (from `scripts/gen-tr-sfx.mjs`), then falls back to synth.

No rebuild needed for browser dev if `www/assets/audio/drop/` is synced — refresh the page. For APK/AAB, run a build (copies `assets/` → `www/assets/`).

---

## Recommended free tools (indie / $0.99 mobile)

| Tool | Best for | Notes |
|------|----------|-------|
| [ElevenLabs Sound Effects](https://elevenlabs.io/sound-effects) | Short combat/UI SFX from text prompts | Free tier with monthly credits; export WAV; good for death blasts, boss roars, place thuds |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Royalty-free library (not AI) | Free commercial use on Pixabay license — rename to exact filenames below; no attribution required |
| [ChipTone](https://sfbgames.com/chiptone/) | Retro 8/16-bit bleeps | Browser, free, export WAV; great for rifle zaps and UI clicks |
| [jsfxr](https://sfxr.me/) | Quick retro one-shots | Browser port of sfxr; tune sliders, download WAV; zero account |
| Udio / Suno | **Music / ambience later** | Overkill for 0.2s SFX; keep for rift hum / menu music in a future pass |

**Tips:** Keep clips **under ~0.6s** for death/place; mono is fine; trim silence at start; avoid loud clipping (normalize to ~−3 dB).

---

## Required filenames (wired today)

| Save as | Game trigger |
|---------|----------------|
| `death.wav` | Enemy killed (`killEnemy`) — pitch varies by enemy type |
| `beam-charge.wav` | Holding Nova Beam charge |
| `beam-blast.wav` | Releasing charged Nova Beam |
| `place.wav` | Barricade / Cloister / structure confirm |
| `boss-bark.wav` | Warlord / Gharok bark (`bark` + warlord voice) |

## Optional filenames (loaded if present — not wired to gameplay yet)

| Save as | Planned trigger |
|---------|-------------------|
| `rifle.wav` | Rifle / dual-wield fire |
| `hurt.wav` | Player damage |
| `waveclear.wav` | Wave cleared / level-up sting |

Say **"wire optional SFX"** in chat when you add these and want them hooked up.

---

## Format

- **WAV or OGG** (`.wav` preferred; `.ogg` also tried)
- **44.1 kHz** (22.05 kHz OK)
- Mono or stereo OK
- Max ~512 KB per file keeps mobile load snappy

---

## Release bake (optional)

When you want drop files copied into shipped `assets/audio/` for a store build:

```bash
node scripts/sync-audio-drop.mjs
```

Then build as usual. Procedural defaults in `assets/audio/` stay until overwritten by sync or your drop files.

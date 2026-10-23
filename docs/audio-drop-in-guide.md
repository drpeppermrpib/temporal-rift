# Audio drop-in guide — user AI SFX workflow

Temporal Rift **3.3.0+** supports a folder-based SFX pipeline alongside procedural defaults. You generate sounds in an external tool, save them with fixed names, and the game picks them up automatically.

---

## Quick path

1. **Generate** a sound in an AI or free SFX tool (see table below).
2. **Export** as WAV (or OGG), 44.1 kHz.
3. **Save** into `assets/audio/drop/` using the exact filename from the table.
4. **Sync for mobile/web bundle:**
   - Browser on root files: copy `game.js` → `www/` if you changed code; assets copy on build.
   - Quick test: ensure `www/assets/audio/drop/your-file.wav` exists (build scripts copy `assets/` → `www/assets/`).
5. **Reload** the game (hard refresh or restart WebView). No gameplay code change needed.
6. **Optional store bake:** `node scripts/sync-audio-drop.mjs` copies drop → `assets/audio/` for release.

---

## Loader priority (how the game chooses a sound)

For each cue (e.g. `death`):

```
1. assets/audio/drop/<name>.wav
2. assets/audio/drop/<name>.ogg
3. assets/audio/<name>.wav      ← shipped procedural (gen-tr-sfx.mjs)
4. assets/audio/<name>.ogg
5. Synth voice (3.1.3 WebAudio) ← if all fetches/decode fail or ENHANCED_SFX_ENABLED=false
```

First successful decode wins. Drop folder **never deletes** shipped files — it overrides at runtime only.

Flag: `ENHANCED_SFX_ENABLED` in `game.js` (default `true`).

---

## Filename table

| File in `assets/audio/drop/` | When it plays | Status |
|------------------------------|---------------|--------|
| `death.wav` / `.ogg` | Enemy death | **Wired** |
| `beam-charge.wav` | Nova Beam charging | **Wired** |
| `beam-blast.wav` | Nova Beam release | **Wired** |
| `place.wav` | Build confirm (barricade, Cloister, structures) | **Wired** |
| `boss-bark.wav` | Warlord / Gharok bark | **Wired** |
| `rifle.wav` | Rifle fire | Optional — load only |
| `hurt.wav` | Player hurt | Optional — load only |
| `waveclear.wav` | Wave clear | Optional — load only |

Ask the agent to **wire optional SFX** when you add the last three and want them in combat.

---

## Recommended tools ($0 budget)

| Tool | URL | Use case |
|------|-----|----------|
| ElevenLabs Sound Effects | https://elevenlabs.io/sound-effects | Text → SFX; free tier |
| Pixabay Sound Effects | https://pixabay.com/sound-effects/ | Free library; rename to match |
| ChipTone | https://sfbgames.com/chiptone/ | Retro WAV export |
| jsfxr | https://sfxr.me/ | 8-bit one-shots |
| Udio / Suno | (accounts) | Music later — not short SFX |

Example prompts (ElevenLabs): *"short wet monster death dissolve"*, *"deep cyclops boss roar 0.5s"*, *"wooden thud stone ping construction"*.

---

## Step-by-step: replace death sound

1. Open ElevenLabs Sound Effects (or Pixabay).
2. Generate or pick a ~0.3–0.5s death sound.
3. Download WAV.
4. Rename to **`death.wav`** (exact, lowercase, hyphen rules only where listed).
5. Move to `temporal-rift/assets/audio/drop/death.wav`.
6. Run `build-beta.ps1` **or** manually:
   ```powershell
   Copy-Item assets\audio\drop\death.wav www\assets\audio\drop\ -Force
   ```
7. Launch game, kill an enemy — skeleton types play higher pitch; husk lower (same sample, playback rate map unchanged).

---

## Procedural defaults (unchanged)

- Generator: `node scripts/gen-tr-sfx.mjs` → writes `assets/audio/*.wav`
- These ship in the repo/APK until you drop replacements or run `sync-audio-drop.mjs`
- Synth fallback remains for mute-safe degradation

---

## Hot reload

- **Local browser:** refresh after copying into `www/assets/audio/drop/`
- **Capacitor APK:** rebuild or at minimum re-copy `assets/` → `www/` + `npx cap sync`
- **No** in-game settings UI for SFX paths — folder convention only

---

## Agent hooks

- New cue name → ask agent to add to `sampleFiles` in `game.js` + this doc
- Bake for Play: `node scripts/sync-audio-drop.mjs` then normal `build-all.ps1`
- Revert to procedural only: delete files from `drop/` (shipped WAVs still used)

See also: `assets/audio/drop/README.md`, `docs/v4.0.0-roadmap.md` Step 4.

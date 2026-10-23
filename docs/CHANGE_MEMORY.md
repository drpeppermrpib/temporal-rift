# Temporal Rift â€” Change Memory

Living memory for agents and humans. Seeded from [`chat_audit_misses_and_regressions.md`](./chat_audit_misses_and_regressions.md) (baseline â€” do not rewrite that file).

**Recovery point:** git tag `baseline-pre-memory-system` â†’ commit `180f2b6` (chat audit on master before this system).

---

## How to use

### Agents (before coding)

1. Read this file + the **Remove / Keep register** below.
2. Skim recent entries in [`decisions.log.md`](./decisions.log.md).
3. Check the **Channel matrix** so you know which APK/channel the user might be on.
4. Never silently re-add anything marked **REMOVED**.
5. Do not treat the baseline audit as editable truth â€” append corrections here or in the decision log.

### Agents (after every ship / BETA / version bump)

1. Append a dated row to [`decisions.log.md`](./decisions.log.md) (`SHIPPED` / `REMOVED` / `KEPT` / `DEFERRED`).
2. Update the **Channel matrix** if versions moved.
3. Add a short **Changelog by version** entry here when `APP_VERSION` bumps.
4. If user says â€œtake out / donâ€™t bring back,â€ add a **Remove** row immediately.

### Humans

- Feel a feature â€œgoneâ€? Check channel matrix first (store/GitHub may lag BETA).
- Device bugs go in **Open bugs / device notes** with package + version + ROM if known.

---

## Channel matrix

Update when any channel ships. Audit snapshot as of 2026-08-10:

| Feature / version | Master (repo) | BETA APK | GitHub Release | Play Closed |
|---|---|---|---|---|
| **App version** | **4.4.0** (versionCode 102) — Step **10.7** Ashmere lake arc gate | **`TemporalRift-BETA-4.4.0.apk`** (vc102) | **v2.13.2** ([Release 8](https://github.com/drpeppermrpib/temporal-rift/releases/tag/v2.13.2)) - **unchanged** | **3.1.5** AAB live Open testing (vc53); **4.4.0** AAB ready (`TemporalRift-4.4.0.aab` / vc102) — upload as update to existing listing |
| Package | `com.drpep.temporalrift` (prod) | `com.drpep.temporalrift.beta` | Sideload / release assets | Store-signed prod |
| Update banner → GitHub | GitHub channel only | Per build channel (github) | Yes (github) | Must stay **off** (`TR_CHANNEL !== 'github'`) |
| Learning engine + adapt panel | Yes (+ settings hide toggle) | Yes (2.9.3+) | Yes (2.13.2) | Yes (2.13.2) |
| Dual-wield / companions / sentry | Yes (2.8+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Aether Infirmary + field revive | Yes (2.9.0–2.9.2) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| One-tap Aether Mend + wall ghost | Yes (2.9.3) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| RTS build picker / wood-gold / laborers | Yes (2.10.0+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| WC2-style town / mines / worker≠squad / +3 train | Yes (2.11.0+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| In-engine unit anim finish (Gharok + all figures) | Yes (2.12.0+) | Yes (2.12.0+) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Husk detailed sprites (idle/walk/windup, r=21 drawH=56) | Yes (2.12.1; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Skeleton sprites (idle/walk/windup, r=12 drawH=38) | Yes (2.13.0; size 2.13.1 lock) | Yes (2.13.1+) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Bulwark sprites (idle/walk/windup, r=23 drawH=62) | Yes (2.13.0; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Shaman sprites (idle/walk/windup, r=20 drawH=56) | Yes (2.13.0; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Enemy combat barks (synth + lines) | Yes (2.13.0) | Yes (2.13.0) | Yes (2.13.2) | Yes (2.13.2) |
| Muster militia WC2 engage + laborer revive | Yes (2.13.1) | Yes (2.13.1) | Yes (2.13.2) | Yes (2.13.2) |
| Laborer retaliate-on-hit only + squad smidge buff | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Town/RTS Continuity save (`town` payload) | **Yes (3.0.0 / BETA-3)** | **Yes (BETA-3)** | **No** (still 2.13.2) | **No** (still 2.13.2) |
| Ashen Ravager sprites + articulation + barks | **Yes** (`RAVAGER_SPRITE_ENABLED=true`; r=36 / drawH=100) | **Yes (BETA-3)** | **No** | **No** |
| Rift Keep building sprites (idle/damaged) | **Yes** (`KEEP_SPRITE_ENABLED=true`; drawH=72, r=54) | **Yes (BETA-3)** | **No** | **No** |
| Timber/Supply Camp building sprites | **Yes** (`CAMP`/`TIMBER`/`SUPPLY_SPRITE_ENABLED=true`) | **Yes (BETA-3)** | **No** | **No** |
| Muster Hall building sprites (idle/damaged) | **Yes** (`HALL_SPRITE_ENABLED=true`; drawH=60) | **Yes (BETA-3)** | **No** | **No** |
| Gold Vault building sprites (idle/damaged) | **Yes** (`VAULT_SPRITE_ENABLED=true`; drawH=52) | **Yes (BETA-3)** | **No** | **No** |
| Aether Pit building sprites (idle/damaged) | **Yes** (`PIT_SPRITE_ENABLED=true`; drawH=48) | **Yes (BETA-3)** | **No** | **No** |
| Cloister Wall / brick stronghold | **Yes** (`BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true`; `town.brickWalls`) | **Yes (BETA-3)** | **No** | **No** |
| Ashen Rover / Rift Hound companion sprites | **Yes** (`ROVER_SPRITE_ENABLED=true`; r=11 / drawH=30) | **Yes (BETA-3.1.4)** | **No** | **No** |
| Ashen Warden companion sprites | **Yes** (`WARDEN_SPRITE_ENABLED=true`; r=13 / drawH=55) | **Yes (BETA-3.1.4)** | **No** | **No** |
| Ashen Scout companion sprites | **Yes** (`SCOUT_SPRITE_ENABLED=true`; r=13 / drawH=44) | **Yes (BETA-3.1.4)** | **No** | **No** |
| Ashen Sentinel companion sprites | **Yes** (`SENTINEL_SPRITE_ENABLED=true`; r=13 / drawH=50) | **Yes (BETA-3.1.4)** | **No** | **No** |
| Ashen Laborer sprites | **Yes** (`LABORER_SPRITE_ENABLED=true`; r=11 / drawH=30) | **Yes (BETA-3.1.4)** | **No** | **No** |
| Muster militia procedural articulation | **Yes** (procedural; **art mesh still deferred**) | **Yes (BETA-3 procedural)** | **No** | **No** |
| Riftnet co-op (presence/HP/wave/revive) | Yes (partial) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Full co-op combat sync (enemies shared) | **No** (deferred) | **No** | **No** | **No** |
| Buildable city / craft behind fences | **Deepened** (2.11.0 WC2-style slice) | **Deepened** | **Deepened** (2.13.2) | **Deepened** (2.13.2) |
| Compact HUD + thinner beam (2.9.1) | Yes | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Multi-dir 3-view **walk** (side+back sheets) | **Yes (3.1.0)** — all Continuity unit skins | **Yes (BETA-3.1)** | **No** | **No** |
| BETA-3.1 step 1 — squad orbs / magnet / SP bank | **Yes (3.1.0)** — extra `squad_sp`/`squad_core`; companions+militia magnet; `squadSp`/`squadCores` | **Yes (BETA-3.1)** | **No** | **No** |
| BETA-3.1 step 2 — squad SP skill trees | **Yes (3.1.0)** — expanded `COMP_NODES` + militia skills spend `squadSp`; player SP untouched | **Yes (BETA-3.1)** | **No** | **No** |
| BETA-3.1 step 3 — squad laborers + own wood/gold | **Yes (3.1.0)** — `squadLaborers` slate tunic; `squadWood`/`squadGold`; train Muster/Keep ✧2+◈1; cap 3 | **Yes (BETA-3.1)** | **No** | **No** |
| BETA-3.1 step 4 — Cloister brickwall visual joins | **Yes (3.1.0)** — segment stretch + crop flush to pillars | **Yes (BETA-3.1)** | **No** | **No** |
| BETA-3.1 step 5 — tap-to-place + enemy pause | **Yes (3.1.0)** — `buildPlaceMode` / `buildPlacePaused`; ghost + tap confirm; horde freeze | **Yes (BETA-3.1)** | **No** | **No** |
| Post-3.1.0 Continuity — squad place-pause + caps + kb ladder | **Yes (3.1.1)** — squads freeze on place-pause; build caps raised; `knockHitsNeeded` | **Yes (BETA-3.1.1)** | **No** | **No** |
| Aether Colossus / Rift Titan sprites | **Yes (3.1.2)** (`COLOSSUS_SPRITE_ENABLED=true`; r=54 / drawH=228; 3-view walk; persist call out/back; 100⬡ revive) | **Yes (BETA-3.1.2)** | **No** | **No** |
| Continuity punch list (audio / wall flush / squad revive / turret ups / foe shadows) | **Yes (3.1.3+)** | **Yes (BETA-3.1.4)** | **No** | **No** |
| Squad taller (modest drawH/s; r unchanged) | **Yes (3.1.3+)** — rover/laborer 30; scout 44; sentinel 50; warden 55; militia s=0.89; Colossus/player/enemies unchanged | **Yes (BETA-3.1.4)** | **No** | **No** |
| Decade bosses (every 10 waves, stacked tiers) | **Yes (3.1.4)** - `decadeBossTiers` / `spawnDecadeBoss`; Gharok every-5 kept | **Yes (BETA-3.1.4)** | **No** | **No** |
| World tree one/few/bunch (`TREE_SPRITE_VARIANTS_ENABLED`) | **Yes (3.1.5)** — meshed original TR trees; soft-wire ON; in Play AAB | **No** (not in current BETA-3.1.4 APK) | **No** | **Yes (3.1.5 AAB staged)** |
| Wave How-to-Play coach (waves 1–5 + Skip + finger) | **Yes (3.2.0)** — `WAVE_COACH_ENABLED`; prefs `waveCoachSkip` | **Yes (BETA-3.3.0)** | **No** | **No** |
| Enhanced SFX layer (death/beam/place/boss-bark WAV + synth fallback) | **Yes (3.3.0)** — `ENHANCED_SFX_ENABLED`; `assets/audio/*.wav` | **Yes (BETA-3.3.0)** | **No** | **No** |
| User AI SFX drop folder (`assets/audio/drop/` → shipped fallback → synth) | **Yes (3.3.2)** — 11 user clips mapped; guttural orc → enemy-bark (non-boss); boss-bark unchanged; magicorc unwired | **Yes (BETA-4.0.0)** | **No** | **No** |
| Continuous / open map (8896×8896, legacy core frozen) | **Yes (4.0.0)** — `CONTINUOUS_MAP_ENABLED`; border tree ring; path stubs; fog A/B; NPC holds; orange autonomy; village build queue | **Yes (BETA-4.0.0)** | **No** | **Yes (4.0.0 AAB staged)** |
| Exterior harvest scaffold (sites only) | **Yes (4.0.1+ / 4.1.0)** — `EXTERIOR_HARVEST_ENABLED`; exterior stands/mines beyond legacy | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Exterior trees choppable + laborer pathing | **Yes (4.0.2+ / 4.1.0)** — `EXTERIOR_CHOP_ENABLED`; hold→orangeSp; player assist ON | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Exterior gold mines harvestable | **Yes (4.0.3+ / 4.1.0)** — `EXTERIOR_MINE_ENABLED`; hold→orangeSp; player/squad assist ON | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Hold growth captain (“guy like me”) | **Yes (4.0.4+ / 4.1.0)** — `HOLD_CAPTAIN_ENABLED`; stages after brickpad; orange squad direction; join gates KEPT | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Ashen Burstweaver look (7.4A) | **Yes (4.0.5+ / 4.1.0)** — sheets + size draft | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Ashen Burstweaver move+spawn (7.4B) | **Yes (4.0.6+ / 4.1.0)** — idle/walk draw; exterior spawn; flags ON | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Ashen Burstweaver attacks (7.4C) | **Yes (4.0.7+ / 4.1.0)** — web/bite poison/explode FF AOE; swell cancel; suicide detonate | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Ashen Burstweaver balance polish (7.4D) | **Yes (4.0.8+ / 4.1.0)** — cadence/swell/explode/web/poison tune; HUD debuff cues; danger ring | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Soft-wire A-B + harvest/captain tune (7.5) | **Yes (4.0.9+ / 4.1.0)** — independent harvest/captain/spider flags; stage costs 8/9/10/12; BW in enemies[] (A); assist ON | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB)** |
| Step 7 arc gate (7.6) | **Yes (4.1.0)** — full exterior arc closed; BETA + Play AAB | **Yes (BETA-4.1.0)** | **No** | **Yes (4.1.0 AAB ready)** |

**Channel lag note:** GitHub Release remains **2.13.2** (vc46). Play Open testing live **3.1.5** (vc53). Master **4.1.0** / vc**76** (Step 7 complete). BETA sideload **4.1.0** (vc76). Play **4.1.0** AAB ready (upload user-side). **Step 5 size shrink deferred; Step 3 Console uploads user-side pending.**

---
## Remove / Keep register

Hard constraints. Agents must check before reintroducing UI or features.

### REMOVED â€” must NOT come back

| Item | Intent | Since | Status |
|---|---|---|---|
| Center-screen region **â€œENTERINGâ€** popup | Remove; keep bottom region label only | v2.4 | Stayed removed in 2.9.2 â€” do not re-add |
| GitHub update banner on **Play** builds | Must not push Play users to sideload | v2.5 | Gated: `UPDATE_CHANNEL === 'github'` only â€” keep gated |
| Copyrighted Saiyan / Kamehameha naming | Scrub for store | v2 rewrite | Do not restore original IP names |

### KEPT â€” must stay

| Item | Notes |
|---|---|
| Bottom region / city label (`regionFlashT`) | Replacement for removed center popup |
| Channel-aware update check | Play builds must not offer GitHub updates |
| Learning engine + collapsible adapt panel | Discoverability â‰  removal; 2.9.3 adds settings hide toggle (not removal of system) |
| Barricades, exit pulse, fence tiers, sentry uplink, adjacency fortify links | Core defense; 2.9.3 adds pre-place link ghost. **Wooden barricades KEPT** â€” Cloister Walls are additive (master, store deferred), not a replacement |
| Autosave / settings / layout drag / HUD offset / button styles / vibration | Mobile UX; town/RTS Continuity (`town` payload) coded on master â€” ship with next update batch |
| Dual-wield Ascension, Gusher, Sticker, companions (Rover/Warden/Scout) | 2.8+ |
| Death checkpoints | 2.8+ |
| Camera view Normal/Low/Lower | 2.8+ |
| Sound engine + SOUND submenu | 2.8.7 |
| Enhanced SFX layer (death/beam/place/boss-bark WAV + synth fallback) | Continuity **3.3.0** — soft-wire `ENHANCED_SFX_ENABLED`; original procedural WAVs via `scripts/gen-tr-sfx.mjs`; synth voices remain fallback |
| User AI SFX drop folder | Continuity **3.3.0** — `assets/audio/drop/` checked first; shipped `assets/audio/` procedural defaults; optional `scripts/sync-audio-drop.mjs` bake; see `docs/audio-drop-in-guide.md` |
| World pine/rock sprites | 2.8.7 |
| World tree **one/few/bunch** variety (`TREE_SPRITE_VARIANTS_ENABLED`) | Continuity remesh 2026-08-25; packaged in Play **3.1.5** AAB (vc53) — soft-wire ON |
| Wave How-to-Play coach (waves 1–5) | Continuity **3.2.0** — soft-wire `WAVE_COACH_ENABLED`; Skip anytime + `settings.waveCoachSkip`; gloved finger; non-blocking |
| Aether Infirmary (mend + menu revive) | 2.9.0 |
| One-tap field Aether Mend (H / MEND btn) | 2.9.3 â€” same costs as infirmary |
| Compact minimap + HP/aether cluster; map S/M/L; thinner beam ladder | 2.9.1 |
| Field hold-Talk revive + PeerJS downed/revive | 2.9.2 |
| BETA package `com.drpep.temporalrift.beta` | Side-by-side installs |
| RTS build picker + wood/gold + Ashen Laborers + upgradable halls + Aether Colossus | 2.10.0 â€” additive city pathway started; deepened in 2.11.0; master adds **Cloister Wall** to BUILD (store deferred) |
| WC2-style Rift Keep town + forest stands + gold mines + Muster militia | 2.11.0 â€” workersâ‰ squad; +3 combat train/wave; militia engage fixed 2.13.1; laborers revivable 2.13.1; retaliate-on-hit only 2.13.2 |

### Discoverability risk (not removed â€” easy to feel â€œgoneâ€)

| Item | Risk |
|---|---|
| Mid-wave squad revive (pre-2.9.2 was menu-only) | Wave-end auto-revive cleared downed companions before shop; fixed with field hold-Talk in 2.9.2 â€” keep field path if changing revive UX |
| Menu-only systems generally | Mark `discoverability_risk` in decisions when shipping menu-only combat helpers |

---

## Open bugs / device notes

| Date | Device / ROM | Package | Version | Symptom | Status |
|---|---|---|---|---|---|
| 2026-08-08 | **OnePlus 9 Pro / Evolution X** (user-reported; Android custom ROM) | unknown | unknown | **Unknown** â€” not documented in prior chat transcripts; no diagnosis | Open â€” needs repro + logcat + packageId + version label |

*Hypotheses only (unconfirmed):* WebView/Chromium skew, battery killers vs AudioContext/WebRTC, cutout/gesture nav, SELinux on sideload vs Play, thermal throttle on heavier 2.8.5+ assets. Capture logcat around repro before assuming root cause.

---

## Pending / missed items (from audit)

Do not invent extras. Skip boss art / combat â€œfeelâ€ polish unless user reopens (out of audit scope).

| Priority | Item | Notes |
|---|---|---|
| High | Full **co-op combat sync** | PeerJS presence/HP/wave/revive shipped; enemies stay local â€” explicitly deferred |
| **Shipped BETA-3 (not Play)** | **Town/RTS Continuity save** | In `TemporalRift-BETA-3.apk` / master **3.0.0** vc47: additive `town` in snapshot/loadGame â€” structures+levels, laborers, militia, barricades, **brickWalls**, gold-mine stocks, waveTrainLeft. Play/GitHub still 2.13.2 drop town on Continue until store ship. |
| **Shipped BETA-3 (not Play)** | Fence brick / cloister / **stronghold** | `BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true` in BETA-3; BUILD Cloister Wall; `town.brickWalls`. **Not store-shipped.** |
| Backlog | **Rift Forge** companion + **v3 overhaul** | Companion scaffold SHIPPED at `../rift-forge` + `RiftForge-0.1.0.apk`; **APK deferred for ease** â€” prefer Windows **character-drops** pipeline for v3 art (see `docs/CHARACTER_DROP_FORMAT.md`); full v3 loader/overhaul still pending |
| Backlog | **Character sheet ingest** (canvas) | Drop folder ready; **primary path now in-engine anim** (2.12.0). Pixelorama/Forge APK optional later â€” do not require user Pixelorama |
| Backlog | Clan spot 2â€“5 players / robust rooms | Passkeys exist; not full lobby/matchmaking |
| Backlog | Skill-tree polish | Called backlog in 2.8.3 notes |
| Backlog | Music bus / full soundtrack | Largely stubbed |
| Backlog | RTS AI polish / more buildings / Colossus merge FX | 2.11.0 deepened town slice; pathfinding / true WC2 sim still thin |
| **Shipped BETA-3 (not Play)** | **Ashen Ravager** sprites | `RAVAGER_SPRITE_ENABLED=true` in BETA-3 (r=36 / drawH=100). Play still procedural. |
| **Shipped BETA-3 (not Play)** | **Building sprites** (Keep/Camp/Timber/Supply/Hall/Vault/Pit) | All `*_SPRITE_ENABLED=true` in BETA-3. Play still procedural. |
| **Shipped BETA-3 (not Play)** | **Companions + Laborer** sprites | Rover/Warden/Scout/Sentinel/Laborer flags already ON; included in BETA-3. |
| Backlog | **Muster militia** — **procedural articulation ON; art mesh still pending** | BETA-3 includes procedural motion polish. **No sprite sheets / no militia sprite flag.** Art mesh deferred — refs in `assets/militia/_refs`. This pass: procedural L/R facing tweak only. |
| **Shipped BETA-3.1** | **Multi-dir 3-view walk** | In `TemporalRift-BETA-3.1.apk` / **3.1.0** vc48: `walk-side.png` + `walk-back.png` for husk/zombie, skeleton, bulwark, shaman, ravager, gharok, rover, warden, scout, sentinel, laborer. Code: `unitViewFromVel` + `unitPickDirWalk`. Sizes UNCHANGED. See `docs/multi-dir-views-plan.md`. |
| **Shipped BETA-3.1** | **Squad orbs / magnet / SP bank** | Extra dark-gray (`squad_sp`→`squadSp`) + light-gray (`squad_core`→`squadCores`); player magnet ignores; companions+militia attract; HUD `squadSpNum`; save `squad.sp`/`squad.cores`. Player drops untouched. |
| **Shipped BETA-3.1** | **Squad SP skill trees** | Expanded `COMP_NODES` (5/companion) + militia `rate`/`magnet` spend `squadSp` (✧); player SP untouched; UI unit panel / Muster / field lab / K SQUAD. |
| **Shipped BETA-3.1** | **Squad laborers** | `squadLaborers` slate tunic; `squadWood`/`squadGold`; train Muster/Keep ✧2+◈1; cap 3; HUD `🪵s`/`◈s`; workers≠squad preserved. |
| **Shipped BETA-3.1** | **Brickwall visual joins** | Segment stretch + crop flush to pillars (`BRICKWALL_SEG_INSET` / `CROP`). |
| **Shipped BETA-3.1** | **Tap-place + enemy pause** | `buildPlaceMode` / `buildPlacePaused`; smoke `test-build-place.js`. |
| **Shipped BETA-3.1.1** | **Squad place-pause + build caps + kb ladder** | In `TemporalRift-BETA-3.1.1.apk` / **3.1.1** vc49: place-pause gates companions/militia/sentries/laborers/colossus; barricade/Cloister max 80; timber 12 / farm 16 / vault·muster·pit 8; `knockHitsNeeded=1+floor(wave/20)` (bosses excluded). |
| **Shipped BETA-3.1.2** | **Aether Colossus articulate + persist** | In `TemporalRift-BETA-3.1.2.apk` / **3.1.2** vc50: flag ON; 3-view walk; no duration despawn; CALL TITAN/RECALL; downed + 100 player ⬡ revive; HP 1600 / dmg 44+1.5w / kb 380; `town.colossus`. Size lock r=54 / drawH=228. See `docs/colossus-art-plan.md`. |
| **Shipped BETA-3.1.4** | **Decade stacked bosses** | In `TemporalRift-BETA-3.1.4.apk` / **3.1.4** vc52: every 10 waves spawn `W/10` bosses at tiers `10..W`; Gharok every-5 unchanged; packages all of 3.1.3 Continuity. |
| **Shipped Play AAB 3.1.5 (Open testing staged)** | **Meshed original TR trees** | In `TemporalRift-3.1.5.aab` / **3.1.5** vc53 — remeshed variant sheets + `TREE_SPRITE_VARIANTS_ENABLED=true`; not in BETA-3.1.4 APK. Continuous/open map still later. |
| **Shipped Continuity 3.3.0 (BETA + Play AAB staged)** | **v4.0.0 Step 4 — enhanced SFX layer** | `ENHANCED_SFX_ENABLED`; procedural WAVs death/beam-charge/beam-blast/place/boss-bark; synth fallback; `scripts/gen-tr-sfx.mjs`; BETA-3.3.0 APK. |
| **Shipped Continuity 3.2.0 (BETA + Play AAB staged)** | **v4.0.0 Step 2 — Play mapping/symbols** | R8 `minifyEnabled true` + Capacitor ProGuard; `ndk.debugSymbolLevel FULL`; `mapping-3.2.0.txt` in rollouts/playstore; BETA-3.2.0 APK. No gameplay changes. |
| **Shipped Continuity 3.2.0 (no APK)** | **v4.0.0 Step 1 — wave coach** | Waves 1–5 How-to-Play coach + Skip + gloved finger; `WAVE_COACH_ENABLED`; prefs persist. See `docs/v4.0.0-roadmap.md`. |
| **Shipped BETA-3.1.3** | **Continuity punch list + squad taller** | In `TemporalRift-BETA-3.1.3.apk` / **3.1.3** vc51: audio fill-in; Cloister flush; squad assist revive; barricade turret ups; foe shadows; squad drawH/s bump (r unchanged; Colossus/player/enemies locked). |
| Deferred | Device re-verify + Play Continuity | Sideload-check decade bosses + joins/place/squad/caps/kb + Colossus + taller squad on BETA-3.1.4; store/Play Continuity still waiting user greenlight |
| **Shipped Continuity 4.1.0 (BETA + Play AAB)** | **Step 7.6 — exterior arc gate** | Closes 7.0–7.5; APP **4.1.0** / vc**76**; BETA + Play AAB + mapping; legacy core frozen; Burstweaver exterior-only; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.9 (no APK)** | **Step 7.5 — soft-wire A-B + harvest/captain tune** | independent harvest/captain/spider flags; wood/gold→orangeSp 1:1; stage costs 8/9/10/12; captain floors 20/40/60/85; BW kit locked 7.4D; Continuity A=`enemies[]`; assist ON; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.7 (no APK)** | **Step 7.4C — Ashen Burstweaver attacks** | web slow+dmg; bite poison 10s HP+aether; explode FF AOE suicide; swell kill-cancel; see `docs/burstweaver-art-plan.md` |
| **Shipped Continuity 4.0.6 (no APK)** | **Step 7.4B — Ashen Burstweaver move + exterior spawn** | idle↔walk draw; `spawnBurstweaverAt` rejects legacy; rare exterior timer; chase turn-back; mild melee; attacks deferred 7.4C; see `docs/burstweaver-art-plan.md` |
| **Shipped Continuity 4.0.5 (no APK)** | **Step 7.4A — Ashen Burstweaver look** | Sheets `assets/burstweaver/{idle,walk,threat,swell}`; size draft r=42 / drawH=115; soft-wire flags OFF; attacks documented for 7.4C; see `docs/burstweaver-art-plan.md` |
| **Shipped Continuity 4.0.4 (no APK)** | **Step 7.3 — village growth captain (“guy like me”)** | `HOLD_CAPTAIN_ENABLED`; NPC captain after gauntlet; stage-2 watchpost→hut2→depot→stakewall; unlock/train direction + reinforce caps; learning gauntlet 2; join 8/10 KEPT; save `hold.captain`/`captainLevel`/`growthStage`; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.3 (no APK)** | **Step 7.2 — exterior gold mines harvestable** | `EXTERIOR_MINE_ENABLED`; player/squad mine fog-revealed exterior → town/squad gold; hold builders mine near hold → 1 gold=1 orangeSp; interior mines identical; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.2 (no APK)** | **Step 7.1 — exterior trees choppable + laborer pathing** | `EXTERIOR_CHOP_ENABLED`; player/squad chop fog-revealed exterior → town/squad wood; hold builders chop near hold → 1 wood=1 orangeSp; mines deferred to 7.2; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.1 (no APK)** | **Step 7.0 — exterior harvest scaffold** | `EXTERIOR_HARVEST_ENABLED`; 8 exterior stands + ~30 trees + 5 exterior gold mines; laborer AI skipped exterior until 7.1/7.2; fog-gated; save stub; see `docs/exterior-expansion-plan.md` |
| **Shipped Continuity 4.0.0 (BETA + Play AAB staged)** | **v4.0.0 Step 6.8 — arc gate / label 4.0.0** | Step 6 complete (6.0–6.8); BETA-4.0.0 APK + Play 4.0.0 AAB staged; Step **5 size shrink deferred**; Step **3 Console user-side pending** |
| **Shipped Continuity 3.4.7 (no APK)** | **v4.0.0 Step 6.7 — fog Version A/B toggle** | Runtime `fogDiscoveryMode`; settings **Fog of war** cycles Core visible (B) / Full black (A); default B; save/load `world.fogMode`; main + minimap respect mode; see `docs/continuous-map-plan.md` |
| **Shipped Continuity 3.4.6 (no APK)** | **v4.0.0 Step 6.6 — hold village build queue** | After gauntlet: hut→timber→brickpad queue; orange builder `build` order + scaffold/progress; costs 4/5/6 orangeSp; save `hold.buildQueue`/`hold.structures[]`; player town unchanged; see `docs/continuous-map-plan.md` |
| **Shipped Continuity 3.4.3 (no APK)** | **v4.0.0 Step 6.3 — exterior fog (Version B)** | `FOG_DISCOVERY_MODE='legacy-core-visible'`; 128px chunk bitset; reveal radius 240; main + minimap fog overlay; save `world.discovered`; legacy core always clear; see `docs/continuous-map-plan.md` |
| **Shipped Continuity 3.4.2 (no APK)** | **v4.0.0 Step 6.2 — path stubs through ring** | 4 cardinal corridors N/S/E/W; path ground tile + minimap stubs + signposts; ring walkable via paths only; gold mines unchanged; see `docs/continuous-map-plan.md` |
| **Shipped Continuity 3.4.1 (no APK)** | **v4.0.0 Step 6.1 — border tree ring** | Dense choppable tree wall at legacy perimeter; cardinal path slots for 6.2; purple rift sealed-core cue; interior scatter unchanged; see `docs/continuous-map-plan.md` |
| **Shipped Continuity 3.4.0 (no APK)** | **v4.0.0 Step 6.0 — world extension scaffold** | `CONTINUOUS_MAP_ENABLED=true`; `LEGACY_WORLD` 4800×4800; `WORLD` 8896×8896; exterior empty grass; purple rift at legacy edge; save `world` stub; see `docs/continuous-map-plan.md` |
| Deferred | Attack/death/windup multi-dir | Still front-only sheets |
| Deferred | idle-side / idle-back | Skipped this pass |
| N/A | Buildings multi-dir walk | Don't walk |

**Next batch suggested order:** **BETA-3.1.3** sideload is live (`TemporalRift-BETA-3.1.3.apk`, 3.1.3 / vc51). Store/Play Continuity still pending user greenlight. Militia art mesh later. Attack/death/windup + idle side/back multi-dir later.

---

## Changelog by version (seed â€” brief)

Append new versions at the top of this list when shipping.

### 4.4.0 (Continuity — Step 10.7 arc gate — Ashmere lake / dock / skiff / isle)
- Closes Step 10: water body, Emberfall Dock, Ashen Rift Skiff, Driftwood Isle, shaman swim + water rules, placement gate + balance lock.
- **BETA** `rollouts\TemporalRift-BETA-4.4.0.apk` (+ Desktop) — `com.drpep.temporalrift.beta` / TR_CHANNEL=github / vc102.
- **Play** `playstore\TemporalRift-4.4.0.aab` + `rollouts\` + Desktop + `mapping-4.4.0.txt` — `com.drpep.temporalrift` / TR_CHANNEL=play / vc102. Upload to the **existing** listing (not a new app).
- Smoke: continuous-map / town-save / build-place ALL PASS. www synced. No git commit.

### 4.3.7 (Continuity — Step 10.6 balance + water placement gate; code only, no BETA)
- **APP_VERSION 4.3.7** / gradle versionCode **101**. Last code step before the **10.7 arc gate** (4.4.0 BETA APK). **Water placement gate (deferred from 10.5):** `placementWaterBlockedAt(bx,by,r)` — pad center + **8 footprint-edge probes** against `isLakeWaterAt` / `isOnDock` / `isOnIslePier` (a shoreline pad can't overhang the waterline; the pier decks are a walkway, not a foundation — skiff boarding lanes stay clear) — wired as the FIRST clause of all three spot-blocked helpers (`barricadeSpotBlocked` / `brickWallSpotBlocked` / `structureSpotBlocked`), so the tap refusal ("NO ROOM HERE" floater) and the red ghost 'NO ROOM' tint share it with **zero new feedback UI**; **no new flag** (10.5 leash precedent — the gate rides the existing lake flags and fully no-ops with `LAKE_WATER_ENABLED` off, flip-verified). **Balance rows:** the plan's 10.6 row lists knob AREAS with no new targets — every shipped const already sits on the plan's draft numbers, so the pass **verifies + LOCKS** them in smoke (drift 1.30× / ≈1.1s to top / 0.8s glide half-life, bike still 1.85×; wave-over-water 10s grace / 3 HP/s ash drain; repair skiff 40🪵+10◈ vs bike 30/18; cache 60 ◈ / 6 ⬤ / 8 ⬡; swim 0.55× stroke / 84px waterline gate; `BOAT_FUEL_MODEL='none'` A locked, B shared-fuel deferred) — **no knob values changed** (inventing targets the plan doesn't list = scope violation). **Soft-wire audit:** all 7 Step 10 flags (`LAKE_WATER_ENABLED`, `LAKE_SPAWN_GUARD_ENABLED`, `LAKE_DOCK_ENABLED`, `BOAT_ENABLED`, `BOAT_WAVE_GATE_ENABLED`, `LAKE_ISLE_REWARD_ENABLED`, `SHAMAN_SWIM_ENABLED`) are independent `const NAME = true;` literals named per the plan table (regex-asserted in smoke) + scratch flip audit booted the game 7× with each flag false alone — newGame clean every time, each surface no-ops (water off = dry world + gate no-op; dock off = gate still blocks open water but skips decks; boat off = no wreck/hull, gate live; isle off = bare isle; swim off = caster stays a land unit). **Shore-meadow mine re-seat NOT taken** (default): the 4 purged camp gold mines / 3 stands stay gone — user never opted in, economy unchanged pre-gate; smoke re-asserts the purge; **opt-in stays open** before/after 10.7.
- Tests: Step 10.6 block (**20 checks**) in `test-continuous-map.js` — gate blocks open water on all three paths / Emberfall deck (dry plank AND wet plank) / isle mini-pier deck; center-dry passes bare while a keep-r54 footprint overhang refuses; camp arena + Orange Quarter analytically unaffected; end-to-end tap refused over water then still lands on open dry shore meadow; all balance locks; soft-wires ON + literal; mines purged; 10.5 leash quick-regression — **ALL PASS ×3 stable**; town-save + build-place PASS (build-place is the arena-parity proof for the gate: same camp placement spot as pre-10.6); **no pre-existing checks loosened**. www synced hash-identical. Saves untouched (the gate is placement-time only — no schema change; 4.3.6 saves load clean via the existing suites). **No APK** (arc gate 10.7). **Standing next-action:** after the 4.4.0 APK is built at 10.7, the user drag-drops it in the Cursor tab and the agent takes over full publishing (user pre-authorized 2026-09-17).

### 4.3.6 (Continuity — Step 10.5 Water rules + shaman swim; code only, no BETA)
- **APP_VERSION 4.3.6** / gradle versionCode **100**. `SHAMAN_SWIM_ENABLED` (**user-requested 2026-09-16**) — the Ashen Shaman (the ranged magic caster, ONLY — never husks/bosses/decade bosses; a behavior on the existing type, no new ETYPES) may enter Ashmere after a water-camping player. **Swim:** `updateShamanSwim` engages when its target is the player over lake water (afloat on the skiff or out on a pier deck) and the caster is within `SHAMAN_SWIM_ENTER_DIST` **84px** of the waterline (`lakeShoreDistOnRay` unit-ray solve — the raw field's bbox early-out returns 9 across most of the dry band, so distance gates it); while swimming: `e.waterOk` (the 10.1-designed opt-out — `clampLakeShore` never fights the swimmer), **0.55×** land speed (`SHAMAN_SWIM_SPEED_MUL` — slow, deliberate), **casting fully cut** (`enemyCanCast` gate; staff resumes ashore, contact poke is the camping breaker), swimmers steer straight (skip the 9.3 slide — no obstacles in water, no phantom slides off isle grove trees), `wantD` 260 comfort band dropped while swimming (closes to contact). **Isle stays enemy-free:** `clampSwimmerToWater` radial-clamps swimmers to isle.r+**8** (still water) — a crossing swimmer rounds the rim, never lands on the 10.4 grove; a target on dry isle ground (or ashore anywhere) flips the stroke home via `lakeNearestShore` and the first dry step exits the swim. **Draw:** `drawShamanSwimming` — head + shoulders above a clip line at the surface (body sunk `SHAMAN_SWIM_SINK` 26px; feet shadow clips away), ripple rings + V-wake, sprite or procedural fallback, no new ctx.filter. **Shore leash (melee):** `lakeLeashApplies` + `pickLakeLeashTarget` — land-bound non-ranged/non-boss wave enemies whose prey camps over water re-target the nearest land threat (militia → companions → titan → structures) or hold a `lakeShoreHoldPoint` patrol slot (`LAKE_LEASH_HOLD_R` 46 loose ring — no waterline pile-in); ranged keeps plinking the camper (bolts cross water both ways — verified, no code); bosses/decade bosses keep the player + 10.1 shore slide. **Ally clamps:** `deployColossus` + `syncCompanions` spawn points ride `lakeGuardSpawnPos` (CALL TITAN afloat lands the titan ashore, pad 60 for r54); militia/laborer spawns are structure-anchored (dry by construction); 10.1 shore clamp still rides `collideObstacles` for every land ally.
- Stall-proof smoke: mixed pack (husk/skeleton/shaman) with the player afloat stays finite + targetable, non-swimmers dry, `countWaveEnemiesRemaining` sees all → killable → 0 (no despawn watchdog — the plan doesn't ask for one); mid-water kills drop loot ashore (10.1 anchor). **Water placement gating NOT shipped** — the plan's 10.5 checklist omits it (balance/soft-wire pass 10.6). Swim is runtime-only state — save schema untouched, 4.3.5 saves load clean (smoke-asserted). Tests: Step 10.5 block (**22 checks**) in `test-continuous-map.js` incl. harness `simEnemyWaterFrame` — ALL PASS ×3 stable; town-save + build-place PASS; **no pre-existing checks loosened** (10.4's isle shove sim uses plain walkers — untouched). www synced hash-identical. **No APK** (arc gate 10.7).

### 4.3.5 (Continuity — Step 10.4 Driftwood Isle; code only, no BETA)
- **APP_VERSION 4.3.5** / gradle versionCode **99**. `LAKE_ISLE_REWARD_ENABLED` — the isle content payoff: a reason to row the strait. **Mini-pier (second berth):** deterministic `LAKE_ISLE_PIER` frame on the isle rim facing the Emberfall Dock (SE edge per plan) — the isle carve is an exact circle so the waterline solve is the rim radius itself; len **100** / half-width **19** / 24px dry apron / **`moorX/moorY` +22px off the head** (second skiff berth). Player-ONLY deck walk via `isOnIslePier` + `clampToIslePierDeck` inside `clampLakeShore` (same dot-product catch + 8px edge / 26px grace consts as the 10.2 dock; enemies still shore-clamp and never board). **New player-only isle-rim catch** in `clampLakeShore`: wet inside the isle's shallow ring → clamp back onto the isle rim, not the outer shore (before this a rim walk-off radial-solved a ~600px cross-strait teleport — would strand a rider away from a moored skiff). `tryDismountBoat` gains the isle berth: dismount ≤120px of the isle moor → hull snaps to the berth, `moorDockId='isle'`, rider steps onto the mini-pier head ("MOORED AT DRIFTWOOD ISLE"); `drawSkiffMoorRope` cleat post follows the berth; save round-trips the isle berth exactly. **One-time Greywater ferry cache:** `seedDriftwoodIsle` worldgen (after purge, before grid) beaches a rope-bound tarp crate off the pier flank (scenery, never an obstacle; gold beacon + walk-up label; opened = lid-ajar lore scenery stays); walk-over ≤46px → **+60 ◈ +6 ⬤ +8 ⬡** direct credits + lore floater "THE RIVER DRIED. GREYWATER'S LAST FERRY RESTS HERE." + banner; `isleCacheOpened` persists in `world.lake` (4.3.4 nodes / old saves load unclaimed; flag gates re-entry forever). **Player grove:** 4 choppable trees (existing tree kind — `assignTreeVariant`, scattered-tree woodLeft 18/32/46 by size) fanned across the NW half, clear of apron/cache/shore-slide, tagged `isle` — `pickChopTarget` skips them (laborers can't cross; plan: "your grove"); walk-up auto-chop on laborer cadence (1.15s swing, +1 🪵 + chips + chop sfx; refused downed/mounted). Driftwood/reed/cattail shoreline decor fan (6, dry, off the boarding lane). `drawIslePier` mini-scale Emberfall plank language; worldgen clears stray obstacles/decor off the whole isle disc first. Soft-wire off = bare isle exactly as 10.3 left it.
- Isle stays enemy-free (10.1 water wall + spawn guards; 12s shove sim asserted). No dock/skiff/bike feel changes; no enemy water behavior (10.5); mainland forests/mines untouched. Tests: 10.4 block (37 checks) in `test-continuous-map.js` — ALL PASS ×3 stable; town-save + build-place PASS; one pre-existing 9.1 check loosened with comment (`lake bowl clear` now ignores `o.isle` trees — the grove is deliberate isle content inside the reserve rect).

### 4.3.4 (Continuity — Step 10.3 Ashen Rift Skiff; code only, no BETA)
- **APP_VERSION 4.3.4** / gradle versionCode **98**. `BOAT_ENABLED` + `BOAT_WAVE_GATE_ENABLED` + `BOAT_FUEL_MODEL='none'` (free rowing LOCKED per 10.0 A–B; shared-fuel B stays deferred) — the player's first boat, mirroring the 8.3 bike flow water-side. **Wreck → repair → own:** `buildBoatWreck` seeds a waterlogged skiff beached one deck-width off the pier (own waterline solve, dry, inside the 10.2 cleared strip, scenery — never an obstacle; spiral-drip draw); repair **40🪵+10🜚** (wood-heavy hull; bike keeps 30/18) → "SKIFF AFLOAT" banner, hull moored at the 10.2 `moorX/moorY` snap point with slack rope to the pier cleat. **Mount/dismount:** board within 95px of the hull (pier head or beside a beached skiff); mount refused mid-wave ("THE HORDE CALLS — SHORE FIRST") / while downed / on the bike; rider gains `player.waterOk` (the 10.1 designed opt-out); dismount only near the dock moor (`BOAT_DOCK_SNAP_R` 120 → skiff re-berths, rider steps onto the pier-head planks) or in the shallow band (skiff beaches where left, `boatStepAshore` lands the rider dry on the **nearer** of outer shore / Driftwood Isle rim — no cross-strait teleports); deep-water dismount refused; never strands the rider wet. **Water-only drift:** `boatThrustFrame` thrust ≈1.1s to top (`BOAT_SPEED_MUL` 1.30× walk — bike stays the fast one at 1.85×) + glide half-life 0.8s on release, dash blocked, guns/nova/grenade allowed (8.4 parity), no leg-cycle afloat; `clampSkiffToWater` rides the `collideObstacles` tail (player+mounted only) — inverse radial shore solve keeps the hull ≥12px inside the waterline and slides it around the isle dry carve (NaN-proof center guards both sides). **Wave gate:** wave starting while afloat → 10s grace floater then **3 HP/s** ash-choked drain until ashore (poison-pattern hp floor → downed path); no mid-water knock-off ever; drain pauses while downed, resets ashore/at wave end. **Save:** additive `world.lake { boatOwned, moorX, moorY, moorDockId }` (no fuel field — free rowing; `isleCacheOpened` joins at 10.4); load never afloat, missing node (≤4.3.3 saves) = wreck state, and a hull saved mid-deep-water (wave-end autosave while rowing) or dry/NaN **re-moors at the dock** so the only boat can't strand out of reach. **Controls/HUD:** one V key + `btnBike` button via `tryVehicleAction` — nearest actionable vehicle wins (🏍↔⛵/🔧 flips; ⛵ BEACH while riding; BOARD stays visible mid-wave so the refusal toast explains the gate); phase label "⛵ RIFT SKIFF — beach at shore (V)"; bike behavior IDENTICAL when no skiff action is in range. **Draw:** procedural TR-cartoon skiff (wreck/moor/ride poses; ember stern lantern; velocity wake arcs + foam particles; no ctx.filter; camera-culled pushes; real mesh joins the deferred bike-art track); rider figure drawn standing braced on the hull. Enemies/minimap untouched (water rules = 10.5, skiff minimap dot not in plan — skipped). **Plan amendment:** user (2026-09-16) requested a swimming counter-camper — 10.5 pillar + checklist now carry **shaman-only SWIM** (`SHAMAN_SWIM_ENABLED`, slow head-above-water pursuit, casting cut while swimming) — NOT implemented this step. Next: **10.4** Driftwood Isle. REMOVED untouched. Smoke PASS (map ×3 stable incl. 53-check Step 10.3 block — no loosened bounds; town; build). www synced (hash-verified). **No APK** (arc gate 10.7).

### 4.3.3 (Continuity — Step 10.2 Emberfall Dock; code only, no BETA)
- **APP_VERSION 4.3.3** / gradle versionCode **97**. `LAKE_DOCK_ENABLED` — Emberfall Dock pier on the SE shore facing camp: deterministic `LAKE_DOCK` frame snapped to the exact 10.1 waterline solve on the camp ray (base ≈(1925,1915) with 28px dry apron; len **150** / half-width **23**; head ≈122px past the waterline beyond the 46px shallows; **`moorX/moorY` snap point +24px off the head** — the 10.3 skiff berth, visually hinted by moor post + cleat + slack rope). **Player-ONLY pier walk:** `isOnDock(x,y)` + `clampToDockDeck` deck-rect catch inside `clampLakeShore` (`ent === player` gate; pure dot-product local frame — no zero-length normal divides for the NaN sentinel; side/head edges clamp back onto the planks with 8px margin + 26px boarding grace; walking ashore over the dry base is seamless; enemies/companions/militia/laborers keep the plain shore clamp and never walk the pier). `seedEmberfallDock` (worldgen, before grid rebuild) clears random obstacles off the deck + boarding apron and seeds **12 deterministic NON-colliding decor** (reed/cattail/driftwood shoreline fan + ember `docklantern` + rope `dockcrate`, all dry — 10.1 spawn-walk guarantees untouched). `drawEmberfallDock` planks/pilings/head-cap above water below decals/decor/entities (bbox cull like `drawLakeWater`, no ctx.filter). **ASHMERE** region row (bottom region flash only — shore band `lakeFieldAt<1.35` ≈ ≤100px past the waterline; center ENTERING popup stays REMOVED; camp/N-W corridor labels unreachable by the band). Minimap dock tick not in plan — skipped. Next: **10.3** skiff. REMOVED untouched. Smoke PASS (map ×3 stable incl. 30 new 10.2 checks — no loosened bounds; town; build). www synced (hash-verified). **No APK** (arc gate 10.7).

### 4.3.2 (Continuity — Step 10.1 Ashmere water body; code only, no BETA)
- **APP_VERSION 4.3.2** / gradle versionCode **96**. `LAKE_WATER_ENABLED` + `LAKE_SPAWN_GUARD_ENABLED` — Ashmere superellipse blob SUBSET of the 9.1 bowl (bounds ≈ x 720–2120 / y 740–2060; shrink-only shore wobble; Driftwood Isle dry carve for 10.4); `isLakeWaterAt`/`isLakeShallowAt`; shore clamp for ALL land actors via `collideObstacles` (`clampLakeShore`, zero-distance NaN guard) + 9.3 shore tangent slide; spawn guard re-routes `spawnEdgePos` (both branches) / decade path spawns / graves / fusion / wave chest / death drops to nearest dry shore; `purgeLakeReserveContent` extended to blob obstacles+decor; `water` tile + `drawLakeWater` layered draw (cached shoreline polygon, shallow band, foam, shimmer glints; camera-culled; no ctx.filter); minimap lake patch + isle dot (fog Version B visible from boot). Camp ≥380px dry ring + N/W corridors + approach walks dry (smoke-asserted). Next: **10.2** dock. REMOVED untouched. Smoke PASS (map ×6 stable, town, build). www synced. **No APK** (arc gate 10.7).

### 4.3.1 (Continuity — Step 9.7.1 spider hunt + explode tune; BETA rebuild)
- **APP_VERSION 4.3.1** / gradle versionCode **95**. `SPIDER_HUNT_ENABLED` — ash spiders stalk border, extended web range, faster hunt; never block wave clear; HUD shows wave count + ash spider tag; explode ≈ 50% maxHp; spider dmg/spd scales per wave. BETA `rollouts\TemporalRift-BETA-4.3.1.apk`. Smoke PASS.

### 4.3.0 (Continuity — Step 9.7 arc gate BETA)
- **APP_VERSION 4.3.0** / gradle versionCode **94**. Full Step 9 arc shipped: zones/trees (9.1) → Orange Quarter (9.2) → steer/climb (9.3) → gray fog + dens (9.4) → decade stack (9.5) → balance (9.6). BETA `rollouts\TemporalRift-BETA-4.3.0.apk` (`com.drpep.temporalrift.beta`, `TR_CHANNEL=github`). Bike mesh art still deferred. Step 9 **closed**. Next: **Step 10** lake/boats. REMOVED untouched. Smoke PASS. www synced.

### 4.2.6 (Continuity — Step 9.6 balance; code only, no BETA)
- **APP_VERSION 4.2.6** / gradle versionCode **93**. Quarter hub tree clear +54 pad; spread hold pad 150; climb cap r≤20; spider dens 2–4 wave-scaled (+1/8 waves), legacy interior excluded; grove trim. Next: **9.7** → 4.3.0 BETA. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.5 (Continuity — Step 9.5 decade stack queue; code only, no BETA)
- **APP_VERSION 4.2.5** / gradle versionCode **92**. `DECADE_STACK_QUEUE_ENABLED` — path-corridor spawns via `spawnDecadePathPos()`; on-screen cap 1 with `decadeBossQueue` drip (one spawn per tick); wave banner unchanged. Next: **9.6** balance. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.4 (Continuity — Step 9.4 gray fog + spider dens; code only, no BETA)
- **APP_VERSION 4.2.4** / gradle versionCode **91**. FOG_SHROUD_ENABLED gray overlay on discovered exterior out of vision; SPIDER_DEN_ENABLED wave-start dens + Burstweaver spawn from gray while in core. Next: **9.5** decade stack. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.3 (Continuity — Step 9.3 enemy steer/climb; code only, no BETA)
- **APP_VERSION 4.2.3** / gradle versionCode **90**. `ENEMY_STEER_ENABLED` — tangent slide around obstacles + climb hop over small trees/rocks; decade/Gharok included. Next: **9.4** gray fog dens. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.2 (Continuity — Step 9.2 Orange Quarter; code only, no BETA)
- **APP_VERSION 4.2.2** / gradle versionCode **89**. Eight holds clustered SE inside legacy (Orange Quarter); Sunfall + Eastwatch gate camps unchanged; `migrateOrangeQuarterOnLoad()` for saves; exterior harvest retargeted. Next: **9.3** steer/climb. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.1 (Continuity — Step 9.1 map zones + spread trees; code only, no BETA)
- **APP_VERSION 4.2.1** / gradle versionCode **88**. Thinner legacy border ring; exterior spread groves beside bike lanes; `LAKE_RESERVE` NW bowl cleared for Step 10 lake; `purgeLakeReserveContent()`. Next: **9.2** Orange Quarter. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 9.7).

### 4.2.0 (Continuity — Step 8.7 arc gate BETA)
- **APP_VERSION 4.2.0** / gradle versionCode **87**. Full Step 8 arc shipped: coal (8.1) → fuel (8.2) → dirt bike (8.3) → hold links + shoot on bike (8.4) → Broodmother + spiderlings (8.5) → balance (8.6). BETA `rollouts\TemporalRift-BETA-4.2.0.apk` (`com.drpep.temporalrift.beta`, `TR_CHANNEL=github`). Bike mesh art still deferred (after APK test). Step 8 **closed**. Next: **Step 9** (`docs/v4.3-roadmap.md` + `docs/step-9-plan.md`) — trees / steer / gray fog dens / decade stack. Lake/boats = Step 10. REMOVED untouched. Smoke PASS. www synced.

### 4.1.10 (Continuity — Step 8.6 balance + soft-wires; code only, no BETA this pass)
- **APP_VERSION 4.1.10** / gradle versionCode **86**. Fuel/bike/repair tune; brood wave≥12 + spider cap 24 + shed +8 fuel. Step 8 A–B notes locked. Next: **8.7** → 4.2.0. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).

### 4.1.9 (Continuity — Step 8.5 Broodmother + spiderlings; code only, no BETA this pass)
- **APP_VERSION 4.1.9** / gradle versionCode **85**. BROODMOTHER_ENABLED — scaled fat matriarch, birth swell spawns 8–10 mini spiderlings (same Burstweaver art). Next: **8.6** balance. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).

### 4.1.8 (Continuity — Step 8.4 hold links + shoot on bike; code only, no BETA this pass)
- **APP_VERSION 4.1.8** / gradle versionCode **84**. DIRT_BIKE_HOLD_LINKS_ENABLED — park at hold pad/shed, captain bikeshed stage, trail marker, parkHoldId save. Shooting while mounted enabled. Next: **8.5** Broodmother. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).

### 4.1.7 (Continuity — Step 8.3 dirt bike; v3 art; code only, no BETA this pass)
- **APP_VERSION 4.1.7** / gradle versionCode **83**. DIRT_BIKE_ENABLED + v3 concept sprite. Wreck/repair/mount/dismount/fuel burn/legacy gate. Real mesh deferred after 8.7. Next: **8.4**. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).

### 4.1.6 (Continuity — Step 8.2 fuel economy; code only, no BETA this pass)
- **APP_VERSION 4.1.6** / gradle versionCode **82**. `FUEL_ECONOMY_ENABLED`. Player fuel 0–100; refuel at Keep/Timber/Vault/Muster/Pit (1 coal→10 fuel). HUD fuel bar when coal/fuel > 0. Save/load. Burn stub for 8.3 bike. Next: **8.3 dirt bike** (procedural placeholder — **bike mesh art DEFERRED after 8.7**, see `dirt-bike-art-plan.md`). REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).

### DEFERRED — dirt bike art mesh (2026-09-01)
- User: preview concepts look bad; not orc-mesh quality. **Return after all Step 8 sub-steps done.** 8.3–8.7 ship gameplay with procedural bike draw; real `idle/ride/wreck` sheets via Ravager pipeline later. Full notes: `docs/dirt-bike-art-plan.md` ⏸ section.

### 4.1.5 (Continuity — Step 8.1 exterior coal mines; code only, no BETA this pass)
- **APP_VERSION 4.1.5** / gradle versionCode **81**. Soft-wire `EXTERIOR_COAL_ENABLED`. Six exterior coal sites (gold-mine silhouette, gray/black). Hold + player laborers harvest → `hold.coal` / player `coal` (not orangeSp). HUD coal counter. Save/load additive. Gold mines unchanged. Next: **8.2 fuel**. REMOVED untouched. Smoke PASS. www synced. **No APK** (arc gate 8.7).
### 4.1.4 (Continuity — Debug report root cause: captain aura crashes render every frame; BETA only)
- **APP_VERSION 4.1.4** / gradle versionCode **80**. BETA `TemporalRift-BETA-4.1.4.apk` → rollouts + Desktop. **No Play AAB / no git commit this pass.**
- **Root cause (from user Copy Report):** `drawHoldCaptain` passed `aura: 'rgba(255,157,46,0.55)'` but `drawFigure` does `o.aura + '99'` (expects `#RRGGBB` hex). Result: `'rgba(255,157,46,0.55)99'` → `addColorStop` throws **every frame** while any captain is on camera → render aborts → guys "disappear", menus still work. Matches the soft-lock clue exactly.
- **Fix:** captain aura → `#ff9d2e`; `drawFigure` aura path rejects non-hex so a bad caller can't soft-lock again.
- Continuity: Debug menu / NaN sentinel / 4.1.2 grids kept; REMOVED untouched.
- **Follow-on (2026-08-31):** Step **8.0** plan — `docs/v4.2-roadmap.md` + `docs/exterior-travel-plan.md` (coal → fuel → dirt bike → Broodmother; lake/boats deferred Step 9). No code/APK.

### 4.1.3 (Continuity — "guys disappear" soft-lock = NaN + Debug menu screenshot tool; BETA only)
- **APP_VERSION 4.1.3** / gradle versionCode **79**. BETA `TemporalRift-BETA-4.1.3.apk` → rollouts + Desktop. **No Play AAB / no git commit this pass.**
- **Revised freeze diagnosis (user clue):** menus still open, guys vanish, can't move → NOT a frame-stall (watchdog may never fire). Root path: **NaN propagation** (bad pointer/clientX → joy → vx/vy → position; zero-dist `/dist` in separation/aim) + **uncaught throw killing rAF while DOM menus live**.
- **NaN sentinel + auto-recover:** every frame sweeps player/camera/enemies/allies/holds/projectiles; restores last-good player pos, culls/respawns broken entities; banners "NaN CAUGHT — AUTO-RECOVERED" with system name; persists last event to localStorage.
- **Error ring:** `window.onerror` + `unhandledrejection` → last 20 errors (kind/msg/stack/wave) persisted; `update()`/`render()` wrapped in try/catch so a throw no longer kills the rAF chain.
- **Pointer NaN guards:** touch/mouse handlers reject non-finite `clientX/Y` before they become joy/aim NaN.
- **Debug menu (BETA only, hidden on Play channel):** pause → **🐞 DEBUG ▸** → live panel (ver/vc/wave/fps/counts/player+camera with red NaN flags/zone/NaN sentinel/watchdog/error ring/per-hold lines) + **COPY REPORT** / CLEAR / BACK. Built for screenshots when things go weird.
- Continuity: 4.1.2 spatial grids + 10 villages + showcase + hold combat kept; REMOVED untouched.

### 4.1.2 (Continuity — 4.1.1 retest: FREEZE round 2 + 10 villages + guaranteed build + holds FIGHT; BETA only)
- **APP_VERSION 4.1.2** / gradle versionCode **78**. BETA `TemporalRift-BETA-4.1.2.apk` → rollouts + Desktop. **No Play AAB / no git commit this pass.**
- **P1 FREEZE round 2 — the 4.1.1 draw fixes weren't the whole story; the remaining cost was collision/AI scans that COMPOUND with entity count:**
  - `collideObstacles` was a **linear scan of ALL ~1200–1600 obstacles for EVERY moving entity every frame** (player + enemies + militia + laborers + hold units ≈ 300–500k dist checks/frame at deep waves — the top cost). → static spatial hash `obstGrid` (256px cells, built once after `buildWorld`; obstacle list never changes post-worldgen).
  - **Every projectile** (`bolts`/`cbolts`/`sbolts`/`ebolts`/grenades) ran `obstacles.some(...)` full scans per frame → `obstacleBlockedAt(x,y,pad,includeTrees)` grid query (bolt-passes-forest rule preserved).
  - **Enemy↔enemy separation was O(n²)** (150–250 live at deep waves = 30–60k pairs/frame) → per-frame `enemyGridMap` buckets (128px) via `rebuildEnemyGrid` + `forEachEnemyNear`; militia aggro & sentry target scans (militia×enemies / barricades×enemies) now use the same grid.
  - Audited 4.1.1 additions: `tickHoldAgeAndOffline` offline-SP `while` is bounded by dt-clamp (0.033s); only 2 other `while` loops in sim (`gainXp` bounded); orb pickups expire at 30s; save payload bounded (exterior statics rebuild from worldgen; fog is a packed byte array). No interval pile-ups; `pointermove` listener removed correctly.
  - **PERF_WATCHDOG (BETA only, `TR_CHANNEL !== 'play'`):** marks each frame section (player+fog / weapons / spawning+waveend / enemies / allies+holds / projectiles / fx / camera+hud / draw / save). Any frame ≥2s → `console.error` + on-screen banner naming the slowest section + report persisted to `tr412_watchdog_report`; **next launch surfaces "LAST SESSION FROZE — Xs in SECTION (wave N)"** and re-logs the full report, then clears it. Even a missed freeze now tells us exactly where.
- **P2 villages: 4 → 10 holds.** Six new worldgen-seeded templates (fixed coords, full hold kit — ground/walls/units/builder/captain pipeline): Emberwake Steading (5600,1050 E-strip N), Thornholt Palisade (7400,1600 deep E), Greywater Landing (6100,3800 E-strip S), Mosslight Hollow (1100,5400 SW), Duskfen Waystation (3600,7000 deep S), Cinderrest Refuge (6800,6500 far SE). All ≥600 off the legacy border, ≥1200 apart (tested). Perf scales: per-hold ticks gate on fog visibility, unit/laborer caps enforced, draw gates on camera.
- **P3 guaranteed FIRST-CONTACT BUILD (`HOLD_SHOWCASE_ENABLED`):** player within 800px of a hold with <2 structures → 10–16s later a build **force-starts with NO orangeSp gate** (auto-graduates the hold if the drill hasn't finished): captain rally floater, builder+captain walk over and hammer, scaffold + % bar, structure completes ≈**20–30s after arrival**. One per hold (`showcaseDone` saved); economy (orb→bank→spend, verified end-to-end in town-save test) drives everything after.
- **P4 holds FIGHT (`HOLD_COMBAT_ENABLED`):** `computeHoldThreats` buckets real enemies (Burstweavers, wave leakers) within zone+**300px aggro** of fog-known holds. Hold units engage real foes first (probes = fallback), leashed to **600px**; rovers/scouts amble a perimeter patrol in peacetime; damage to any unit/builder/captain raises a 6s hold alarm that converges defenders. **Captain fights:** 320hp pool + bar, baton strikes (15 dmg), engage barks ("NOTHING TOUCHES MY VILLAGE!"), downed→26s stagger-up at 60% hp. **Watchpost = real turret** (420 range, 12 dmg, 1.15s cd, orange bolts). Enemies fight back: retarget nearest orange defender when closer than the player + contact damage vs units/laborers/captain (gated on `_nearHoldId` — legacy waves pay nothing). Hold-unit bolts hit real enemies (cbolt path).
- Smoke: `node --check` repo+www, town-save, build-place, continuous-map (+13 new 4.1.2 checks: 10-hold layout/spacing, showcase force-start/no-gate/auto-grad, threat list, watchpost fire, alert wiring) — **ALL PASS**. www synced (hash-verified). REMOVED untouched.

### 4.1.1 (Continuity — 4.1.0 retest fixes: FREEZE + spider + visible captain; BETA only)
- **APP_VERSION 4.1.1** / gradle versionCode **77**. BETA `TemporalRift-BETA-4.1.1.apk` → rollouts + Desktop. **No Play AAB this pass.**
- **P1 FREEZE root causes fixed (all draw-side + AI-churn; legacy gameplay untouched):**
  - `drawFogMinimap` walked all **4900 fog chunks + thousands of fillRects every frame** (updateHud→drawMinimap at 60fps) → offscreen cache redrawn only on fog change; radar repaint throttled ~10Hz.
  - Y-sorted draw queue + **pine-canopy overlay iterated every obstacle on the full 8896×8896 map per frame** (canopy loop had no cull and no fog gate) → camera culling for obstacles/canopies/barricades/brick walls/structures/stands/mines/camp props; discovered holds now also need `isHoldOnCamera` to render (brick ground was ~800 path rects per hold per frame from anywhere).
  - **Chained `ctx.filter`** on hold laborer/unit/captain draws (software compositing on WebView) → cheap orange overlay wash.
  - Hold-builder full-array target rescans per frame → 1.35s scan cooldown + 3.5s stuck-target release; assorted per-frame allocation trims (probe counts/compaction, wave-clear loop, captain level recompute 1.5s).
  - **Wave-stall:** border-stuck Burstweaver (player hiding in legacy) blocked `endWave` forever → wave-clear ignores `exteriorOnly` ambients; 20s leash despawn (no loot/credit).
- **P2 spider:** Burstweaver hp **120→290** (kit/damage locked 7.4D); **HEAVY knock** (+1 shove-ladder hit, 0.6× shove — r=42); `burstweaverMaxLive()` = **2 at wave ≥20**. UNIT_SIZES + art plan updated.
- **P3 captain visibly grows the village:** post-grad ambient orbs were **dead code** (spawner inside gauntlet early-return) → `tickHoldOrbSpawner` 18s/14s; holds **auto-graduate at 300s** + offline orangeSp trickle (1/24s) via `tickHoldAgeAndOffline` (`hold.ageT` saved); **2nd builder** after graduation; captain walks to the site, **hammers with the crew** (+0.5×dt progress, sparks) and calls structure rallies ("RAISE THE WATCHPOST!"). Expect first new structure within ~1–3 min of visiting a graduated hold.
- Smoke: `node --check`, town-save, continuous-map ×4 (version → 4.1.1; de-flaked tree-count roll ≥24), build-place — **ALL PASS**. www synced. REMOVED untouched.

### 4.1.0 (Continuity — Step 7.6 exterior arc gate; BETA + Play AAB)
- **APP_VERSION 4.1.0** / gradle versionCode **76**.
- **Step 7.6:** Closed Step 7 (7.0–7.5). Full exterior harvest + hold captain + Ashen Burstweaver. Smoke PASS. BETA `TemporalRift-BETA-4.1.0.apk` (`com.drpep.temporalrift.beta`, `TR_CHANNEL=github`) + Play `TemporalRift-4.1.0.aab` + `mapping-4.1.0.txt` (`com.drpep.temporalrift`, `TR_CHANNEL=play`) → rollouts + playstore + Desktop. REMOVED untouched. Legacy core unchanged; Burstweaver exterior-only.

### 4.0.9 (Continuity — Step 7.5 soft-wire A-B + harvest/captain tune; no APK)
- **APP_VERSION 4.0.9** / gradle versionCode **75**.
- **Step 7.5:** Independent soft-wires (`EXTERIOR_HARVEST`/`CHOP`/`MINE`, `PLAYER_EXTERIOR_ASSIST`, `HOLD_CAPTAIN`, `EXTERIOR_SPIDER`, `BURSTWEAVER_SPRITE`) all Continuity **true** — flip any without killing the others. Harvest rates **1:1** wood/gold→orangeSp (B=half deferred). Captain stage-2 costs **8/9/10/12**; level floors **20/40/60/85**. Burstweaver kit **locked** at 7.4D. Continuity storage **(A)** BW in `enemies[]` (B=`exteriorThreats[]` deferred). Player-assist Continuity **(A) ON**. Fog A/B + `world.holds` KEPT. www synced. Smoke `node --check` + town/continuous PASS. **Not 4.1.0.** No APK. **Next:** **7.6**.

### 4.0.8 (Continuity — Step 7.4D Ashen Burstweaver balance polish; no APK)
- **APP_VERSION 4.0.8** / gradle versionCode **74**.
- **Step 7.4D:** Additive balance polish only (no new attacks). Spawn **55–80s** max1; swell **1.35–1.75s** + growing danger ring; web dmg9 slow×**0.55**@**2.5s** CD4.5; bite dmg14 poison 10s **3.0** HP/s + **4.0** aether/s CD3.4; explode **r128** dmg **42+1.5w** CD12–16 trigger165; HUD `#debuffHud` + world WEBBED/ASH VENOM cues; FF explode + fizzle KEPT; soft-wires independently togglable. www synced. Smoke `node --check` + town/continuous. **Not 4.1.0.** No APK. **Next:** **7.5**.

### 4.0.7 (Continuity — Step 7.4C Ashen Burstweaver attacks; no APK)
- **APP_VERSION 4.0.7** / gradle versionCode **73**.
- **Step 7.4C:** Attack AI approach → web (dmg9, slow×0.48 @ 2.8s) OR bite (dmg14 + poison 10s @ 3.5 HP/s + 4.5 aether/s) → swell telegraph 1.1–1.4s → explode radius 140 dmg 45+1.5w (friendly-fire: player/allies/hold orange/**enemies**); kill-during-swell cancels; **suicide** on detonate; threat/swell sheets wired; barks; not in wave tables; exterior-only rules KEPT. www synced. Smoke `node --check` + town/continuous (+ attack kit). **Not 4.1.0.** No APK. **Deferred:** optional 7.4D balance.

### 4.0.6 (Continuity — Step 7.4B Ashen Burstweaver move + exterior spawn; no APK)
- **APP_VERSION 4.0.6** / gradle versionCode **72**.
- **Step 7.4B:** `BURSTWEAVER_SPRITE_ENABLED=true` idle↔walk draw (plant squash/bob; `unitPickDirWalk`); `EXTERIOR_SPIDER_ENABLED=true`; `spawnBurstweaverAt` rejects `inLegacyWorld` / never `spawnEdgePos`; rare timer (~48–72s, max 1) when player exterior or near visible hold; chase + turn-back/snap at legacy border; mild default melee **dmg=14**; size locks **r=42** / **drawH=115**; threat/swell unused (7.4C). www synced. Smoke `node --check` + town/continuous (+ legacy-reject). **Not 4.1.0.** No APK. **Deferred:** 7.4C web/bite/explode.

### 4.0.5 (Continuity — Step 7.4A Ashen Burstweaver look; no APK)
- **APP_VERSION 4.0.5** / gradle versionCode **71**.
- **Step 7.4A:** Original meshed Burstweaver sheets (`idle`/`walk`/`threat`/`swell`) under `assets/burstweaver/` + www; refs inspiration-only in `_refs/`; size draft **r=42** / **drawH=115**; soft-wire `BURSTWEAVER_SPRITE_ENABLED=false` + `EXTERIOR_SPIDER_ENABLED=false`; `ETYPES.burstweaver` stub (`exteriorOnly`) with **no** spawn/waves/draw; attacks documented (web / bite poison / explode friendly-fire) for 7.4C. Docs: `burstweaver-art-plan.md` + exterior mini-steps + UNIT_SIZES. Smoke `node --check`. **Not 4.1.0.** No APK. **Deferred:** 7.4B move/spawn, 7.4C attacks/AI.

### 4.0.4 (Continuity — Step 7.3 village growth captain; no APK)
- **APP_VERSION 4.0.4** / gradle versionCode **70**.
- **Step 7.3:** `HOLD_CAPTAIN_ENABLED=HOLD_AUTONOMY_ENABLED`; NPC Continuity captain (orange-tint Vanguard cloak+baton) per hold after `gauntletDone`; extends growth **watchpost → hut2 → depot → stakewall** after 6.6 hut→timber→brickpad; captain directs unlock floaters + spends orangeSp to reinforce beyond 1-cap (Lv≥2); learning gauntlet 2 (2 exterior probe waves) after brickpad; Talk reinforces join wave 8/10; save `hold.captain` / `captainLevel` / `growthStage` / learn gauntlet flags. Player cannot upgrade hold units. www synced. Smoke `node --check` + `test-town-save.js` + `test-continuous-map.js` PASS. **Not 4.1.0.** No APK. **Deferred:** Burstweaver (7.4), second controllable avatar, APK.

### 4.0.3 (Continuity — Step 7.2 exterior gold mines; no APK)
- **APP_VERSION 4.0.3** / gradle versionCode **69**.
- **Step 7.2:** `EXTERIOR_MINE_ENABLED=EXTERIOR_HARVEST_ENABLED`; `PLAYER_EXTERIOR_ASSIST_ENABLED` covers mines; `pickMineTarget` includes fog-revealed exterior mines (player → gold, squad → squadGold); hold laborers `pickHoldMineTarget` (prefer mines ≤1200 of own hold) + WC2 enter/carry + deposit **1 gold → 1 `hold.orangeSp`**; interior mine behavior unchanged; www synced. Smoke `node --check` + `test-town-save.js` + `test-continuous-map.js` PASS. **Not 4.1.0.** No APK.

### 4.0.2 (Continuity — Step 7.1 exterior chop + laborer pathing; no APK)
- **APP_VERSION 4.0.2** / gradle versionCode **68**.
- **Step 7.1:** `EXTERIOR_CHOP_ENABLED=EXTERIOR_HARVEST_ENABLED`; `PLAYER_EXTERIOR_ASSIST_ENABLED` ON; `pickChopTarget` includes fog-revealed `exteriorTree` (player → wood, squad → squadWood); `pickMineTarget` still skips exterior; hold laborers `pickHoldChopTarget` (prefer stands ≤1200 of own hold) + deposit **1 wood → 1 `hold.orangeSp`**; WORLD clamp pathing leaves legacy via path gaps; interior chop unchanged; www synced. Smoke `node --check` + `test-town-save.js` + `test-continuous-map.js` PASS. **Not 4.1.0.** No APK.

### 4.0.1 (Continuity — Step 7.0 exterior harvest scaffold; no APK)
- **APP_VERSION 4.0.1** / gradle versionCode **67**.
- **Step 7.0:** `EXTERIOR_HARVEST_ENABLED=CONTINUOUS_MAP_ENABLED`; `buildExteriorHarvest()` places **8** exterior forest stands + **~30** `exteriorTree` trees + **5** exterior gold mines beyond `LEGACY_WORLD` (path exits + hold approaches); tagged `exterior: true`; laborer `pickChopTarget`/`pickMineTarget` skip exterior (AI deferred to 7.1/7.2); fog-gated draw + minimap; save `world.exteriorHarvest` stub + additive exterior mine merge on load; interior mineSites/standSites untouched. www synced. Smoke `node --check` + `test-town-save.js` + `test-continuous-map.js` PASS. **Not 4.1.0.** No APK.

### 4.0.0 (Continuity — v4.0.0 Step 6 arc complete + BETA + Play AAB staged)
- **APP_VERSION 4.0.0** / gradle versionCode **66**.
- **Step 6.8 gate:** Step 6 marked Done (6.0–6.7 acceptance re-verified); `test-continuous-map.js` light smoke (fog save, hold state, legacy core bounds); roadmap gate documents **Step 5 size shrink deferred** + **Step 3 Console user-side pending**.
- **Includes:** continuous map (8896×8896, legacy 4800×4800 frozen), border tree ring, path stubs, fog A/B, NPC holds, orange autonomy + builders, village build queue; wave coach; enhanced SFX + user audio drop; full Continuity through 3.3.x.
- **BETA:** `rollouts\TemporalRift-BETA-4.0.0.apk` + Desktop — vc**66**, `com.drpep.temporalrift.beta`.
- **Play AAB staged:** `rollouts\TemporalRift-4.0.0.aab` + `playstore\` + Desktop; `mapping-4.0.0.txt`. REMOVED untouched. Smoke: `node --check` + `test-town-save.js` + `test-build-place.js` + `test-continuous-map.js` ALL PASS.

### 3.4.7 (Continuity — v4.0.0 Step 6.7 fog Version A/B toggle; no APK)
- **APP_VERSION 3.4.7** / gradle versionCode **65**.
- **Step 6.7:** Runtime `fogDiscoveryMode` + `settings.fogDiscoveryMode` in `tr_settings` (default **Version B** `legacy-core-visible`); settings row **Fog of war** cycles **CORE VISIBLE (B)** ↔ **FULL BLACK (A)**; `'full-black'` fogs legacy rect until visited; save/load `world.fogMode` (save wins over settings); main overlay + minimap unchanged plumbing; discovered bitset preserved on toggle/reload. www synced. Smoke `node --check` + `test-town-save.js` fog A/B PASS. **Not 4.0.0.**

### 3.4.6 (Continuity — v4.0.0 Step 6.6 hold village build queue; no APK)
- **APP_VERSION 3.4.6** / gradle versionCode **64**.
- **Step 6.6:** After `gauntletDone`, per-hold `buildQueue` (hut → timber pile → brick pad); orange builder `build` order walks to site, hammers over N seconds; scaffold + progress bar; costs **4/5/6 orangeSp**; procedural hut/timber/brickpad art; save `hold.buildQueue`, `hold.structures[]`, `hold.activeBuild`, `hold.villageSeeded`. Player town RTS unchanged; 6.5 barricade repair/placement intact. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.5 (Continuity — v4.0.0 Step 6.5 hold autonomy + orange builders; no APK)
- **APP_VERSION 3.4.5** / gradle versionCode **63**.
- **Step 6.5:** `HOLD_AUTONOMY_ENABLED`; join/refuse at holds (wave 8 near / 10 far) → one Ashen Spearman to player militia + allegiance; refuse = light insult lines. **Orange hold economy** (`hold_orb` droppables, `hold.orangeSp`) separate from player gray squad orbs. **Hold squad** (`holdUnits`): Rover+Sentinel starter, unlock Scout@5 / Sentinel@12 / Warden@20 orangeSp; orange tint on draw. **Hold builders** (`holdLaborers`, **1 per hold**): laborer sprite + orange tint; collect orbs, repair barricades, place new stubs (3 orangeSp, max 4 big / 5 far). **Gauntlet**: 3 exterior probe waves or 120s; starter barricades + combat units. Player cannot upgrade hold units. Save `world.holds` extended. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.4 (Continuity — v4.0.0 Step 6.4 NPC hold template; no APK)
- **APP_VERSION 3.4.4** / gradle versionCode **62**.
- **Step 6.4 (holds):** `HOLD_TEMPLATES` + `npcHolds[]` at 4 exterior path exits (S/E + far S/E); Cloister brick ground footprint + low walls (`drawBrickWall*`); 1–2 original TR NPCs per hold; Talk → placeholder dialog (no squad join); fog-gated draw; save `world.holds` (`id`, `visited`); camp `NPCS` untouched. REMOVED untouched. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.3 (Continuity — v4.0.0 Step 6.3 fog layer; no APK)
- **APP_VERSION 3.4.3** / gradle versionCode **61**.
- **Step 6.3 (fog):** `FOG_DISCOVERY_ENABLED=CONTINUOUS_MAP_ENABLED`; `FOG_DISCOVERY_MODE='legacy-core-visible'` (Version B default); **128×128 chunk bitset** (`world.discovered` Uint8Array ~613 bytes); `revealFogAt` / `updateFogDiscovery` (radius 240); `drawFogOverlay` + `drawFogMinimap`; legacy core never fogged; exterior unexplored = dark mask until visited; save/load restores fog; `'full-black'` stub for 6.7. REMOVED untouched. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.2 (Continuity — v4.0.0 Step 6.2 path stubs; no APK)
- **APP_VERSION 3.4.2** / gradle versionCode **60**.
- **Step 6.2 (path stubs):** `isLegacyPathCorridor()` + `buildLegacyBorderPaths()`; 4 cardinal corridors (`LEGACY_PATH_CORRIDOR_HALF=88`, depth 560px inward from legacy edge); `path` ground tile + `drawLegacyPathGround()`; minimap tan stubs via `drawLegacyPathsMinimap()`; wooden signposts at interior ends; ring trees skip path zones; obstacle purge in corridors; `isNearGoldMine()` skips path decals on mine sites; **gold mines unchanged** (`mineSites`×9, laborer `pickMineTarget`/`assignMine` intact). REMOVED untouched. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.1 (Continuity — v4.0.0 Step 6.1 border tree ring; no APK)
- **APP_VERSION 3.4.1** / gradle versionCode **59**.
- **Step 6.1 (border ring):** `buildLegacyBorderRing()` after unchanged interior `buildWorld()`; 2-row dense choppable trees at insets 52–108 px inside `LEGACY_WORLD` (4800×4800); ~350 trees; cardinal gaps `LEGACY_BORDER_GAP_HALF=88` via `isLegacyBorderPathSlot()` for 6.2 paths; `assignTreeVariant` reused (border few/bunch bias); purple rift stroke at legacy edge = sealed-core cue; exterior still empty grass. REMOVED untouched. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.4.0 (Continuity — v4.0.0 Step 6.0 world extension scaffold; no APK)
- **APP_VERSION 3.4.0** / gradle versionCode **58**.
- **Step 6.0 (map scaffold):** Soft-wire `CONTINUOUS_MAP_ENABLED=true`; frozen `LEGACY_WORLD` 4800×4800 at origin; `WORLD` **8896×8896** (+2048×2 per axis); `buildWorld()` + wave spawns unchanged inside legacy; player/camera/tile draw use full WORLD; purple rift border at legacy edge; minimap full-world scale + legacy ring; additive save `world` stub (`worldVersion`, `legacyWorld`).
- Exterior = empty traversable grass (no trees ring / fog / holds — 6.1+). REMOVED untouched. www synced. Smoke `node --check` + `test-town-save.js` PASS. **Not 4.0.0.**

### 3.3.2 (Continuity — guttural orc enemy-bark for non-boss)
- **APP_VERSION 3.3.2** / gradle versionCode **57**.
- **User drop:** `Guttural_zombie_orc__#3-1787886126171.mp3` → `enemy-bark.mp3` (replaces `normalsmallzombieorc.mp3`); warlord/Gharok still `boss-bark.mp3`; `magicorc.wav` left unwired (removed from CUE_MAP).
- **Routing:** existing `tryEnemyBark` + `sfx.play('bark')` — `voice==='warlord'` → boss-bark; all other enemy types → enemy-bark (husk/skeleton/ravager/bulwark/shaman).
- **BETA:** `rollouts\TemporalRift-BETA-3.3.2.apk` + Desktop — vc**57**. REMOVED untouched. Smoke `node --check` PASS.

### 3.3.1 (Continuity — user AI SFX drop baked + optional hooks)
- **APP_VERSION 3.3.1** / gradle versionCode **56**.
- **User drop:** 12 clips mapped via `scripts/sync-audio-drop.mjs` (MP3 + WAV); drop-first loader extended for `.mp3`.
- **Wired:** death, beam-charge, beam-blast, place, boss-bark, rifle→fire, hurt, enemy-bark, chop/mine (laborers), rift-music bed; waveclear still synth (no drop file).
- **BETA:** `rollouts\TemporalRift-BETA-3.3.1.apk` + Desktop — vc**56**. REMOVED untouched. Smoke `node --check` PASS.

### 3.3.0 (Continuity — v4.0.0 Step 4 enhanced SFX + BETA/Play staged)
- **APP_VERSION 3.3.0** / gradle versionCode **55**.
- **Step 4 (audio):** Soft-wire `ENHANCED_SFX_ENABLED=true`; original procedural WAVs under `assets/audio/` (death, beam-charge, beam-blast, place, boss-bark) generated via `scripts/gen-tr-sfx.mjs`; WebAudio sample layer with pitch variation by enemy type on death; Gharok/warlord boss-bark hook; **3.1.3 synth voices remain fallback** if samples fail to load.
- **User AI SFX drop folder:** `assets/audio/drop/` — loader prefers user WAV/OGG, then shipped procedural, then synth; `docs/audio-drop-in-guide.md`; optional `scripts/sync-audio-drop.mjs` for release bake; optional rifle/hurt/waveclear filenames reserved.
- Triggers unchanged: `killEnemy` → death; beam charge/blast; barricade/Cloister/structure place; warlord bark (Gharok).
- **BETA:** `rollouts\TemporalRift-BETA-3.3.0.apk` + Desktop — vc**55**, includes coach+trees+Continuity+audio.
- **Play AAB staged:** `rollouts\TemporalRift-3.3.0.aab` + `mapping-3.3.0.txt`. REMOVED untouched. Smoke `node --check` PASS.

### 3.2.0 (Continuity — v4.0.0 Step 2 Play artifacts + BETA; build/config only)
- **APP_VERSION 3.2.0** / gradle versionCode **54** unchanged.
- **Step 2 (build/config):** release `minifyEnabled true` + `shrinkResources false`; Capacitor/Cordova ProGuard keeps; `ndk { debugSymbolLevel 'FULL' }`; `build-all.ps1` copies `mapping-<ver>.txt` + native symbols zip when present.
- **BETA:** `rollouts\TemporalRift-BETA-3.2.0.apk` + Desktop — `com.drpep.temporalrift.beta`, vc**54**, TR_CHANNEL=github; includes Step 1 wave coach + trees + full Continuity.
- **Play AAB staged:** `rollouts\TemporalRift-3.2.0.aab` + `playstore\` + Desktop; `mapping-3.2.0.txt` (~5.4MB). AAB contains **zero** packaged `.so` — native symbols zip not emitted (NDK config ready if libs added later).
- No gameplay changes. REMOVED untouched. Smoke `node --check` PASS.

### 3.2.0 (Continuity — v4.0.0 Step 1 wave coach; no APK)
- **APP_VERSION 3.2.0** / gradle versionCode **54**. Soft-wire `WAVE_COACH_ENABLED=true`.
- In-run How-to-Play coach for **waves 1–5** (one lesson/wave, fades, no stack): 1-1 Move+Fight · 1-2 Build · 1-3 Upgrade/resources · 1-4 Squad/Colossus light · 1-5 Boss ready (Gharok %5).
- **Skip anytime** → `settings.waveCoachSkip` (persisted in `tr_settings`) + settings toggle; procedural Continuity **gloved finger** points at real HUD controls.
- Overlay-only — combat not softlocked; town/sprites/Colossus/decade bosses/trees/squads KEPT; REMOVED untouched.
- **Do not** ship as 4.0.0 until map/audio/size arc done. No Play AAB / no Production this pass. www synced. Smoke `node --check`.

### 3.1.5 (Play AAB staged — Open testing drag-drop)
- **Package:** `com.drpep.temporalrift` — `playstore\TemporalRift-3.1.5.aab` (+ `rollouts\` + Desktop), versionCode **53**, channel=play (no GitHub banner), same upload keystore as 3.1.4 (`temporalrift-upload.jks`).
- **Content:** master Continuity through 3.1.4 **plus** remeshed world tree one/few/bunch (`TREE_SPRITE_VARIANTS_ENABLED=true`). No other gameplay changes; continuous/open map **not** implemented.
- Play Closed live remains **2.13.2**/vc46 until upload. BETA-3.1.4 sideload unchanged. REMOVED untouched. No git commit/push.

### 3.1.4 Continuity (no version bump / no APK) — meshed original trees
- All **11** variant sheets under `assets/world/trees/` (+ www) remeshed (GenerateImage + `process-tree-sprites.mjs` flood-key): classic TR cartoon pine DNA + silhouette cues from user refs; photo-stock isolates retired (`_raw/*_photo_prev.png` only).
- `TREE_SPRITE_VARIANTS_ENABLED` stays **ON**; weights / soft-wire unchanged. APP_VERSION stays **3.1.4**. REMOVED untouched. See `docs/tree-art-plan.md`.

### 3.1.4 (BETA-3.1.4 sideload - not Play)
- **Package:** `com.drpep.temporalrift.beta` - `rollouts/TemporalRift-BETA-3.1.4.apk`, versionCode **52** + Desktop copy.
- **Decade stacked bosses:** every **10 waves** spawn `W/10` bosses at tiers `10..W` (e.g. wave 20 = T10+T20; wave 100 = 10 bosses). Hardness via `hpScale(tier)` x elite mul; `boss:false` so Gharok claw/bar stay exclusive; visScale capped below Gharok.
- Gharok every **5 waves** **unchanged**; on waves that are both %10 and %5, Gharok spawns **plus** the decade stack.
- Roster: Rift Decade Brute / Ashen Decade Bulwark / Ashen Decade Warlord (ravager/bulwark/warlord skins).
- Includes all of **3.1.3** Continuity (audio / Cloister flush / squad assist revive / turret ups / foe shadows / squad taller).
- Smoke: `node --check`; `build-beta.ps1`. **Play Closed / GitHub Release stay on 2.13.2** (vc46). REMOVED untouched.
- **2026-08-13:** prod Play AAB **staged** — `playstore\TemporalRift-3.1.4.aab` (+ `rollouts\` + Desktop), package `com.drpep.temporalrift`, versionCode **52**, channel=play (no GitHub banner), same upload keystore as 2.13.2. Play Closed remains 2.13.2 until uploaded.

### 3.1.3 Continuity (landed in 3.1.4 APK) - decade bosses (pre-ship note)
- Implemented on master while APP_VERSION was still 3.1.3; first sideload package is **BETA-3.1.4**.

### 3.1.3 (BETA-3.1.3 sideload - not Play)
- **Package:** `com.drpep.temporalrift.beta` — `rollouts/TemporalRift-BETA-3.1.3.apk`, versionCode **51** + Desktop copy.
- Everything in **3.1.2** plus Continuity punch list: audio (death/beam/place/hum/militia grunts); Cloister pillar crop flush; squad assist revive; barricade turret upgrades (rockets etc.); foe shadow readability.
- Modest squad taller (~10–15% drawH/s; collision `r` unchanged): Rover/Laborer **30**, Scout **44**, Sentinel **50**, Warden **55**, militia `s=0.89`. Colossus/player/enemies unchanged.
- Smoke: `node --check`, `test-build-place.js`, `test-town-save.js` — ALL PASS.
- **Play Closed / GitHub Release stay on 2.13.2** (versionCode 46) — not touched. No Play upload.
- REMOVED untouched.

### 3.1.2 Continuity (no version bump / no APK) — punch list
- Audio fill-in: `death` / `beamCharge` / `beamBlast` / `place` + rift-hum music bus; militia grunts; mute buses respected.
- Cloister flush re-fix: pillar opaque crop + `SEG_INSET=4`; no corner/tee sheet-as-post.
- Squad assist revive (~2.85s free for non-colossus); titan still **100 player ⬡**.
- Tap barricade → rate / range / dmg / rockets (+ optional global uplink).
- Stronger foe ground shadows + slight sprite contrast (grass left alone).
- www synced; `node --check` + place/town smokes PASS. APP_VERSION stays **3.1.2**.

### 3.1.2 (BETA-3.1.2 sideload — not Play)
- **Package:** `com.drpep.temporalrift.beta` — `rollouts/TemporalRift-BETA-3.1.2.apk`, versionCode **50** + Desktop copy.
- Everything in **3.1.1** plus Colossus Continuity that 3.1.1 missed: `COLOSSUS_SPRITE_ENABLED=true`; r=54 / drawH=228; walk-side/walk-back; no time-limit despawn; C / CALL TITAN ↔ RECALL; downed linger + hold-Talk **100 player ⬡** revive; HP **1600** / dmg **44+1.5w** / kb **380**; `town.colossus` persist.
- Smoke: `node --check`, `test-build-place.js`, `test-town-save.js` — ALL PASS. aapt: package beta / vc50 / 3.1.2 / label Temporal Rift BETA.
- **Play Closed / GitHub Release stay on 2.13.2** (versionCode 46) — not touched. No Play upload.
- REMOVED untouched.

### 3.1.1 (BETA-3.1.1 sideload — not Play)
- **Package:** `com.drpep.temporalrift.beta` — `rollouts/TemporalRift-BETA-3.1.1.apk`, versionCode **49** + Desktop copy.
- Everything in **3.1.0** plus Continuity: place-pause freezes squads (companions/militia/sentries/laborers/colossus); barricade/Cloister max **80**; timber **12** / farm **16** / vault·muster·pit **8**; non-boss knockback `1+floor(wave/20)`.
- Smoke: `node --check`, `test-build-place.js` — ALL PASS. aapt: package beta / vc49 / 3.1.1 / label Temporal Rift BETA.
- **Play Closed / GitHub Release stay on 2.13.2** (versionCode 46) — not touched. No Play upload.
- REMOVED untouched.

### 3.1.0 (BETA-3.1 sideload — not Play)
- **Package:** `com.drpep.temporalrift.beta` — `rollouts/TemporalRift-BETA-3.1.apk` (= `TemporalRift-BETA-3.1.0.apk`), versionCode **48** + Desktop copies.
- Preflight ALL PASS: `docs/beta-3.1-preflight.md`.
- Includes Continuity apply batch (town save, Cloister, sprite flags) **plus** multi-dir walk, squad orbs/magnet/SP, squad SP trees, squad laborers + wood/gold, brickwall visual joins, tap-to-place BUILD + enemy pause.
- Smoke: `node --check`, `test-build-place.js`, `test-town-save.js` — ALL PASS.
- **Play Closed / GitHub Release stay on 2.13.2** (versionCode 46) — not touched. No Play upload.
- REMOVED untouched. **Device verify next:** brick joins, tap-place/pause, squad steps 1–3.

### 3.0.0 (BETA-3 sideload — not Play)
- **Continuity apply batch** for `com.drpep.temporalrift.beta` only (`TemporalRift-BETA-3.apk` / `TemporalRift-BETA-3.0.0.apk`, versionCode **47**).
- Town/RTS Continuity save (`town` payload) + Cloister Wall / brickwall.
- Flags flipped ON: `RAVAGER_SPRITE_ENABLED`, `KEEP`/`CAMP`/`TIMBER`/`SUPPLY`/`HALL`/`VAULT`/`PIT_SPRITE_ENABLED`.
- Already ON: Rover/Warden/Scout/Sentinel/Laborer + BRICKWALL; militia procedural articulation (art mesh still deferred).
- **Play Closed / GitHub Release stay on 2.13.2** (versionCode 46) — not touched.
- REMOVED untouched (ENTERING popup, Play GitHub banner, Saiyan names).
- Superseded for sideload by **3.1.0 / BETA-3.1** (post-BETA-3 Continuity features now in that APK).

### 2.13.2
- **Enemy size toward ravager:** husk/sprinter/bulwark/shaman drawH+r scaled toward ravager (`r=24` / `s=1.7`); still << Gharok. **Skeleton unchanged** (r=12 / drawH=38 / s=1.055). Oldâ†’new: husk 15/42â†’21/56, sprinter 12/~36.5â†’18/~48.7, shaman 14/42â†’20/56, bulwark 22/58â†’23/62.
- **Laborers:** retaliate-on-hit only (`retaliateT` after damage); removed proactive threaten-engage and flee-to-fight-when-threatened. Still workersâ‰ squad, still revivable.
- **Squad smidge buff:** companions + muster militia slight HP/dmg (rover 185/10â†’210/11, warden 300/9â†’340/10, scout 165/8â†’185/9, sentinel 240/11â†’270/12, spear 200/12â†’230/14, bow 155/9â†’180/10).
- **Skipped (at 2.13.2 release):** fence brick wall / cloister / stronghold connection.
- **Later applied in BETA-3 (3.0.0):** Continuity town save + Cloister Wall + ravager/building/companion/laborer sprite flags — see 3.0.0 entry. Play still deferred.
### 2.13.1
- **Enemy size pass (modest):** husk/sprinter/skeleton/bulwark/shaman slightly larger than player visual â€” not boss-sized. drawH/r: husk 36/14â†’42/15, sprinter ~30.6/11â†’~36.5/12, skeleton 32.4/10â†’38/12, bulwark 52.2/20â†’58/22, shaman 36/13â†’42/14. Gharok untouched.
- **Muster militia combat:** spears/bows engage foes near self **or** near player (was melee aggro=90 â†’ follow-only). Spear poke uses type.range; bow still range-gated. Companion AI unchanged.
- **Ashen Laborers:** field hold-Talk revive (+ wave-end auto) like militia; flee-to-fight melee when threatened; still workersâ‰ squad (no squad slots). Colossus merge no longer wipes downed workers.

### 2.13.0
- Applied deferred sprite sets: Skeleton / Bulwark / Shaman flags **on** (size locks intact at ship: r=10/20/13, drawH=32.4/52.2/36 â€” superseded by 2.13.1 size pass). Husk still on from 2.12.1.
- Articulate walk polish: clearer gait cadence + plant squash/bob on sprite units; procedural types keep 2.12 limb stride.
- Enemy bark system SHIPPED: per-type synth grunts + original orc float lines (aggro / attack / combat rate-limit); respects mute SFX.
- Gharok walk/idle/windup/stomp left as-is (shipped 2.12.x) â€” no regression.
- Gap: Ravager still procedural (no sheet yet).

### 2.12.1
- Ashen Husk detailed sprite sheets (`assets/zombie/{idle,walk,windup}.png`) wired to husk/sprinter like Gharok frame-swap; **size lock:** husk `r=14`, sprite `drawH=36` (sprinter `Ã—0.85`) â€” art upgrade only, not boss footprint. Procedural fallback kept. Refs inspiration-only under `_refs/` (stripped from APK). See `docs/zombie-art-plan.md`.
- **Ashen Skeleton / Bulwark / Shaman art drafted same day** (flags were off; **applied in 2.13.0**). See art-plan docs.

### 2.12.0
- In-engine animation finish (no Pixelorama required): Gharok idle/walk/windup+strike/hurt lean at locked `r=54` / `drawH=228`; additive walk/attack/hurt for husks, sprinters, shamans, ravagers, bulwarks, skeletons, companions, militia, laborers, Colossus. Sizes locked in `docs/UNIT_SIZES.md`. Pixelorama drop path optional later.

### 2.11.0
- WC2-inspired town slice: larger map (4800); forest stands; gold mine buildings; Rift Keep / Supply Camp / Gold Vault; Ashen Laborers = workers only (Chop/Mine orders, separate cap); Muster Spearmen/Bowmen (+3/wave, revivable); click unit skill nodes; starter Keep+laborers + tips. Wave survival / learning / barricades / mend / revive / companions kept.

### 2.10.0
- Additive RTS slice: BUILD picker (barricade / Timber Camp / Muster Hall / Aether Pit); wood+gold HUD; Ashen Laborers gather trees/gold veins; building selectâ†’upgrade + train; Ashen Sentinel squad unit; Aether Colossus (Rift Titan) combiner ~Gharok scale. Wave survival / companions / barricades / mend / revive kept.

### 2.9.3
- Hide learning panel settings toggle; one-tap Aether Mend (H / MEND); linked-wall ghost preview before place (`baa9f3f`).

### 2.9.2
- Field hold-Talk squad revive + PeerJS downed/revive (`dd08d2d`).

### 2.9.1
- Compact map+HP HUD cluster; thinner beam ladder.

### 2.9.0
- Aether heal/revive (infirmary), dog durability, linked barricades, Gharok knockback mass, Riftnet co-op foundation (combat sync deferred).

### 2.8.7
- Sound engine submenu; sprite pines/rocks.

### 2.8.1â€“2.8.6
- Boss redesign iterations (art quality out of memory scope unless reopened).

### 2.8
- Dual-wield Ascension, Gusher/Sticker, companions, sentry, camera peek, death checkpoints; separate BETA package.

### 2.7
- Fusion zombies, graves/skeletons, fireballs, boss armor, fence upgrades (shelf; store rollout deferred).

### 2.6
- HUD under notch, movable buttons, styles; vibration on attacks. Last confirmed GitHub/Play public ship point for many testers.

### 2.5
- Play channel hides GitHub update banner.

### 2.4
- Removed center â€œentering cityâ€ popup; bottom region label kept.

### Earlier (2.0â€“2.3)
- v2 Ashen Vanguard rewrite, chests/armor/NPCs/barricades, autosave/settings, layout + city name on boss bar, GitHub update banner foundation.

---

## Related files

| File | Role |
|---|---|
| [`chat_audit_misses_and_regressions.md`](./chat_audit_misses_and_regressions.md) | **Baseline audit** â€” immutable revert reference |
| [`decisions.log.md`](./decisions.log.md) | Append-only dated decisions |
| [`brickwall-art-plan.md`](./brickwall-art-plan.md) | Cloister Wall / brick stronghold art + systems plan (master ON, store deferred) |
| [`rover-art-plan.md`](./rover-art-plan.md) | Ashen Rover / Rift Hound ally art (#3a articulation+barks on master, flag ON Continuity; store deferred) |
| [`warden-art-plan.md`](./warden-art-plan.md) | Ashen Warden / Rift Warden ally art (#3b articulation+barks on master, flag ON Continuity; store deferred) |
| [`scout-art-plan.md`](./scout-art-plan.md) | Ashen Scout / Rift Scout ally art (#3c articulation+barks on master, flag ON Continuity; store deferred; commit unpinned) |
| [`sentinel-art-plan.md`](./sentinel-art-plan.md) | Ashen Sentinel / Rift Sentinel ally art (#3d articulation+barks ON Continuity; r=13 / drawH=44) |
| [`laborer-art-plan.md`](./laborer-art-plan.md) | Ashen Laborer worker art (articulation+barks ON Continuity; r=11 / drawH=26; workers≠squad) |
| [`colossus-art-plan.md`](./colossus-art-plan.md) | Aether Colossus / Rift Titan combiner art (flag ON Continuity; r=54 / drawH=228; persist call out/back) |
| [`tree-art-plan.md`](./tree-art-plan.md) | World tree one/few/bunch — meshed original TR sheets (`TREE_SPRITE_VARIANTS_ENABLED` ON Continuity; no APK) |
| [`multi-dir-views-plan.md`](./multi-dir-views-plan.md) | Multi-dir 3-view walk plan (side+back sheets; attack/death/idle multi-dir deferred) |
| [`continuous-map-plan.md`](./continuous-map-plan.md) | v4.0.0 Step 6 — open/continuous map design (legacy core frozen; fog A/B; sub-steps 6.0–6.8 **complete** at 4.0.0) |
| [`exterior-expansion-plan.md`](./exterior-expansion-plan.md) | Post-4.0.0 Step **7** — exterior mines/trees, hold captain, Ashen Burstweaver (**7.6** done at **4.1.0**) |
| [`v4.1-roadmap.md`](./v4.1-roadmap.md) | Post-4.0.0 arc home — Step 7 exterior expansions (complete) |
| [`v4.2-roadmap.md`](./v4.2-roadmap.md) | Step 8 arc — coal / fuel / bike / Broodmother → 4.2.0 gate (**closed**) |
| [`exterior-travel-plan.md`](./exterior-travel-plan.md) | Step 8 design detail (Pillars A–E) |
| [`v4.3-roadmap.md`](./v4.3-roadmap.md) | Step 9 arc — tree spread / enemy steer / gray fog dens / decade stack → 4.3.0 (**closed**) |
| [`step-9-plan.md`](./step-9-plan.md) | Step 9 design detail |
| [`v4.4-roadmap.md`](./v4.4-roadmap.md) | Step 10 arc — Ashmere lake / Emberfall Dock / Rift Skiff / Driftwood Isle → 4.4.0 gate (**10.0 planning started 2026-09-16**) |
| [`step-10-plan.md`](./step-10-plan.md) | Step 10 design detail (bowl-truth lake geometry / boat / wave gate) |
| [`dirt-bike-art-plan.md`](./dirt-bike-art-plan.md) | **DEFERRED** bike mesh — return after 4.2.0 APK test; not a 9.x step |
| [`UNIT_SIZES.md`](./UNIT_SIZES.md) | Locked r/drawH + multi-dir additive note (sizes unchanged) |
| `.cursor/rules/change-memory.mdc` | Agent rule to load/update this system |

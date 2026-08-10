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

Update when any channel ships. Audit snapshot as of 2026-08-09:

| Feature / version | Master (repo) | BETA APK | GitHub Release | Play Closed |
|---|---|---|---|---|
| **App version** | **2.13.2** (versionCode 46) | Through `TemporalRift-BETA-2.13.2.apk` | **v2.13.2** ([Release 8](https://github.com/drpeppermrpib/temporal-rift/releases/tag/v2.13.2)) | **2.13.2** (versionCode 46) â€” Closed testing live (user confirmed 2026-08-09) |
| Package | `com.drpep.temporalrift` (prod) | `com.drpep.temporalrift.beta` | Sideload / release assets | Store-signed prod |
| Update banner â†’ GitHub | GitHub channel only | Per build channel | Yes (github) | Must stay **off** (`TR_CHANNEL !== 'github'`) |
| Learning engine + adapt panel | Yes (+ settings hide toggle) | Yes (2.9.3+) | Yes (2.13.2) | Yes (2.13.2) |
| Dual-wield / companions / sentry | Yes (2.8+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Aether Infirmary + field revive | Yes (2.9.0â€“2.9.2) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| One-tap Aether Mend + wall ghost | Yes (2.9.3) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| RTS build picker / wood-gold / laborers | Yes (2.10.0+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| WC2-style town / mines / workerâ‰ squad / +3 train | Yes (2.11.0+) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| In-engine unit anim finish (Gharok + all figures) | Yes (2.12.0+) | Yes (2.12.0+) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Husk detailed sprites (idle/walk/windup, r=21 drawH=56) | Yes (2.12.1; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Skeleton sprites (idle/walk/windup, r=12 drawH=38) | Yes (2.13.0; size 2.13.1 lock) | Yes (2.13.1+) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Bulwark sprites (idle/walk/windup, r=23 drawH=62) | Yes (2.13.0; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Ashen Shaman sprites (idle/walk/windup, r=20 drawH=56) | Yes (2.13.0; size 2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Enemy combat barks (synth + lines) | Yes (2.13.0) | Yes (2.13.0) | Yes (2.13.2) | Yes (2.13.2) |
| Muster militia WC2 engage + laborer revive | Yes (2.13.1) | Yes (2.13.1) | Yes (2.13.2) | Yes (2.13.2) |
| Laborer retaliate-on-hit only + squad smidge buff | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) | Yes (2.13.2) |
| Town/RTS Continuity save (`town` payload) | **Coded on master only (unreleased)** â€” still 2.13.2 / vc46; no BETA/Play ship | **No** | **No** | **No** |
| Ashen Ravager sprites + articulation + barks | **Coded on master, flag OFF** (`RAVAGER_SPRITE_ENABLED=false`; live procedural; flip â†’ r=36 / drawH=100) â€” **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Rift Keep building sprites (idle/damaged) | **Drafted on master, flag OFF** (`KEEP_SPRITE_ENABLED=false`; live procedural keep; flip â†’ drawH=72, r=54 unchanged) â€” **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Timber/Supply Camp building sprites | **Drafted on master, flags OFF** (`CAMP_SPRITE_ENABLED`/`TIMBER_SPRITE_ENABLED`/`SUPPLY_SPRITE_ENABLED=false`; live procedural; flip â†’ timber drawH=50 r=40 / supply drawH=46 r=36) â€” **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Muster Hall building sprites (idle/damaged) | **Drafted on master, flag OFF** (`HALL_SPRITE_ENABLED=false`; live procedural muster; flip â†’ drawH=60, r=46 unchanged) â€” **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Gold Vault building sprites (idle/damaged) | **Remeshed mine-mouth on master, flag OFF** (`VAULT_SPRITE_ENABLED=false`; live procedural golddepot; flip â†’ drawH=52, r=40 unchanged) â€” hillside bunker / timber frame + aether-gold glow (replaced prior stronghouse mesh); **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Aether Pit building sprites (idle/damaged) | **Drafted on master, flag OFF** (`PIT_SPRITE_ENABLED=false`; live procedural aetherpit; flip â†’ drawH=48, r=38 unchanged) â€” same pipeline as keep/camp/hall/vault; `aether-glow-mood-insp` = glow/lighting mood ONLY (no lamp object/logo/product); **no APK / no version bump / no live enable**; **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Cloister Wall / brick stronghold | **Coded on master** (`BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true`; Continuity `town.brickWalls`) â€” **store ship deferred** with town-save + peer art batch; no APK / no version bump | **No** | **No** | **No** |
| Ashen Rover / Rift Hound companion sprites | **Articulation+barks on master, flag ON** (`ROVER_SPRITE_ENABLED=true`; Continuity/source testing; r=11 / drawH=26) â€” ally **#3a**; commit **`4b9b2ea`**; **store ship deferred** with peer batch; **no APK / no version bump** | **No** | **No** | **No** |
| Ashen Warden companion sprites | **Articulation+barks on master, flag ON** (`WARDEN_SPRITE_ENABLED=true`; Continuity/source testing; r=13 / drawH=48) — ally **#3b**; commit **PLACEHOLDER**; **store ship deferred** with peer batch; **no APK / no version bump** | **No** | **No** | **No** |
| Riftnet co-op (presence/HP/wave/revive) | Yes (partial) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Full co-op combat sync (enemies shared) | **No** (deferred) | **No** | **No** | **No** |
| Buildable city / craft behind fences | **Deepened** (2.11.0 WC2-style slice) | **Deepened** | **Deepened** (2.13.2) | **Deepened** (2.13.2) |
| Compact HUD + thinner beam (2.9.1) | Yes | Yes | Yes (2.13.2) | Yes (2.13.2) |

**Channel lag note:** GitHub Release **v2.13.2** and Play Closed testing **2.13.2** (versionCode 46) both live as of 2026-08-09 (user confirmed Play rollout). **Town/RTS Continuity save** and **Cloister Wall / brick stronghold** are coded on master only (still labeled 2.13.2 / vc46; no APK) â€” live BETA/GitHub/Play 2.13.2 builds still drop town on Continue and have no Cloister Wall BUILD option until the next store update batch ships.

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
| World pine/rock sprites | 2.8.7 |
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
| **Next update (coded, unreleased)** | **Town/RTS Continuity save** | On master at **2.13.2** (no versionCode bump, no BETA/Play): additive `town` in snapshot/loadGame â€” structures+levels, laborers, militia, barricades, **brickWalls**, gold-mine stocks, waveTrainLeft; wood/gold already saved; companion/player/wave/skill-tree unchanged. `test-town-save.js` covers `brickWalls`. **Store ship deferred** with peer art flags ON (stronghold systems already ON on master). Live APKs still drop town on Continue until that ship. |
| Next update batch | Fence brick / cloister / **stronghold** | **Systems+art coded on master** (`BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true` for Continuity/source testing); BUILD Cloister Wall (wood 10 / gold 4 / cores 2; HP 280; max 16); cardinal auto-link + corners/T + LINK ghost; **store ship deferred** with Continuity + peer art flags â€” **not** store-shipped |
| Backlog | **Rift Forge** companion + **v3 overhaul** | Companion scaffold SHIPPED at `../rift-forge` + `RiftForge-0.1.0.apk`; **APK deferred for ease** â€” prefer Windows **character-drops** pipeline for v3 art (see `docs/CHARACTER_DROP_FORMAT.md`); full v3 loader/overhaul still pending |
| Backlog | **Character sheet ingest** (canvas) | Drop folder ready; **primary path now in-engine anim** (2.12.0). Pixelorama/Forge APK optional later â€” do not require user Pixelorama |
| Backlog | Clan spot 2â€“5 players / robust rooms | Passkeys exist; not full lobby/matchmaking |
| Backlog | Skill-tree polish | Called backlog in 2.8.3 notes |
| Backlog | Music bus / full soundtrack | Largely stubbed |
| Backlog | RTS AI polish / more buildings / Colossus merge FX | 2.11.0 deepened town slice; pathfinding / true WC2 sim still thin |
| Backlog | **Ashen Ravager** sprites â€” **articulation+barks coded, flag OFF, ship deferred** | Sheets + gait/plant + distinct deep cyclops barks on master; `RAVAGER_SPRITE_ENABLED=false`; live still procedural `r=24`/`s=1.7`. Flip flag â†’ `r=36`, `drawH=100`, `sâ‰ˆ2.78`. See `docs/ravager-art-plan.md`. Store ship with stronghold batch |
| Backlog | **Rift Keep** building art â€” **drafted, flag OFF** | `assets/buildings/keep/{idle,damaged}.png`; `KEEP_SPRITE_ENABLED=false`; collision `r=54` unchanged; flag ON â†’ `drawH=72`. See `docs/keep-art-plan.md`. Apply with stronghold batch |
| Backlog | **Timber/Supply Camp** building art â€” **drafted, flags OFF** | Commit `0484c67`; `assets/buildings/camp/{idle,damaged,timber-idle,timber-damaged,supply-idle,supply-damaged}.png`; `CAMP_SPRITE_ENABLED`/`TIMBER_SPRITE_ENABLED`/`SUPPLY_SPRITE_ENABLED=false`; flip â†’ timber r=40 drawH=50 / supply(farm) r=36 drawH=46 (collision r unchanged). Desktop `TemporalRift-Camp-Sprites`. See `docs/camp-art-plan.md`. Apply with stronghold batch |
| Backlog | **Muster Hall** building art â€” **drafted, flag OFF** | Commit `080094b`; `assets/buildings/hall/{idle,damaged}.png`; `HALL_SPRITE_ENABLED=false`; collision `r=46` unchanged; flag ON â†’ `drawH=60` (between camp ~50 and Keep 72). Desktop `TemporalRift-Hall-Sprites`. See `docs/hall-art-plan.md`. Apply with stronghold batch |
| Backlog | **Gold Vault** building art â€” **remeshed mine-mouth, flag OFF** | Replaced stronghouse/arcade mesh with dug-into-hill timber-framed mine mouth + aether-gold interior glow (no readable IP/sign text); `assets/buildings/vault/{idle,damaged}.png`; `_refs/`: hillside-bunker-mouth-insp, rocky-cave-ladder-insp, timber-frame-mine-mouth-insp (old arcade refs removed); `VAULT_SPRITE_ENABLED=false`; collision `r=40` unchanged; flag ON â†’ `drawH=52`. Desktop `TemporalRift-Vault-Sprites`. See `docs/vault-art-plan.md`. Apply with stronghold batch |
| Backlog | **Aether Pit** building art â€” **drafted, flag OFF** | Same pipeline as keep/camp/hall/vault. Stone-lined dug crater / quarry pit + cyanâ†’teal / purple aether glow in hole; `_refs/` includes `aether-glow-mood-insp` (Razer lamp) = **glow/lighting mood ONLY** â€” no lamp object/logo/product in sheets (README); `assets/buildings/pit/{idle,damaged}.png` (512Ã—512 transparent); `PIT_SPRITE_ENABLED=false`; collision `r=38` unchanged; flag ON â†’ `drawH=48`. Desktop `C:\Users\drpep\Desktop\TemporalRift-Pit-Sprites`. No APK / no version bump / no live enable. See `docs/pit-art-plan.md`. Apply with stronghold batch |
| Backlog | **Cloister Wall / brick stronghold** â€” **systems+art on master, store deferred** | Modular `assets/buildings/brickwall/{pillar,segment,corner,tee}(+damaged).png` + `_refs`; BUILD â†’ Cloister Wall (wood 10 / gold 4 / cores 2; HP 280; max 16); cardinal auto-link straights/corners/T; LINK ghost like barricades; `town.brickWalls` Continuity (additive with barricades); `BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true` for source testing. Desktop `C:\Users\drpep\Desktop\TemporalRift-BrickWall-Sprites`. See `docs/brickwall-art-plan.md`. No APK / no version bump / **not store-shipped** |
| Backlog | **Ashen Rover / Rift Hound** â€” **#3a articulation+barks on master, store deferred** | Sheets `cd8a042`; articulation+barks **`4b9b2ea`** + `ROVER_SPRITE_ENABLED=true` for Continuity/source testing; collision `r=11` / `drawH=26` locked; aether-hound bark voice + lines (distinct from orcs). Desktop `C:\Users\drpep\Desktop\TemporalRift-Rover-Sprites`. See `docs/rover-art-plan.md`. **No APK / no version bump / not store-shipped.** |
| Backlog | **Ashen Warden** — **#3b articulation+barks on master, store deferred** | Sheets `4c66510`; articulation+barks **PLACEHOLDER** + `WARDEN_SPRITE_ENABLED=true` for Continuity/source testing; collision `r=13` / `drawH=48` locked; armored-robot guardian bark voice + lines (distinct from orcs/Rover). Desktop `C:\Users\drpep\Desktop\TemporalRift-Warden-Sprites`. See `docs/warden-art-plan.md`. **No APK / no version bump / not store-shipped.** |

**Next batch suggested order** (user photos â†’ art upgrades + buildings + ravager + stronghold later): (1) ~~ravager mesh~~ **art+articulation+barks coded (flag OFF)** (2a) ~~**Keep art**~~ **drafted (flag OFF)** (2b) ~~**camps**~~ **drafted (flags OFF)** (2c) ~~**Muster Hall**~~ **drafted (flag OFF)** (2d) ~~**Gold Vault**~~ **remeshed mine-mouth (flag OFF)** (2e) ~~**Aether Pit**~~ **drafted (flag OFF)** â†’ **(3a) ~~Rover dog~~ articulation+barks ON master Continuity (store deferred)** â†’ **(3b) ~~Warden~~ articulation+barks ON master Continuity (store deferred); Scout/Sentinel still pending** â†’ (4) ~~fence brick stronghold systems~~ **coded on master (store deferred)** â†’ (5) one update apply (town save + ravager/keep/camp/hall/vault/pit flags ON + rover+warden already ON Continuity + brickwall already ON).

---

## Changelog by version (seed â€” brief)

Append new versions at the top of this list when shipping.

### 2.13.2
- **Enemy size toward ravager:** husk/sprinter/bulwark/shaman drawH+r scaled toward ravager (`r=24` / `s=1.7`); still << Gharok. **Skeleton unchanged** (r=12 / drawH=38 / s=1.055). Oldâ†’new: husk 15/42â†’21/56, sprinter 12/~36.5â†’18/~48.7, shaman 14/42â†’20/56, bulwark 22/58â†’23/62.
- **Laborers:** retaliate-on-hit only (`retaliateT` after damage); removed proactive threaten-engage and flee-to-fight-when-threatened. Still workersâ‰ squad, still revivable.
- **Squad smidge buff:** companions + muster militia slight HP/dmg (rover 185/10â†’210/11, warden 300/9â†’340/10, scout 165/8â†’185/9, sentinel 240/11â†’270/12, spear 200/12â†’230/14, bow 155/9â†’180/10).
- **Skipped (at 2.13.2 release):** fence brick wall / cloister / stronghold connection.
- **Master later (unreleased; still 2.13.2 / vc46, no APK):** Cloister Wall / brick stronghold systems+art coded â€” `BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true` for Continuity/source testing; BUILD Cloister Wall; `town.brickWalls`; wooden barricades KEPT. **Store ship deferred** with Continuity + peer art batch.
- **Master later (unreleased; still 2.13.2 / vc46, no APK):** Ashen Rover / Rift Hound â€” sheets + articulation+barks (`4b9b2ea`); `ROVER_SPRITE_ENABLED=true` for Continuity testing (r=11 / drawH=26); store ship deferred. Ally #3a.
- **Master later (unreleased; still 2.13.2 / vc46, no APK):** Ashen Warden — sheets + articulation+barks (PLACEHOLDER); `WARDEN_SPRITE_ENABLED=true` for Continuity testing (r=13 / drawH=48); store ship deferred. Ally #3b Warden; Scout/Sentinel pending.

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
| `.cursor/rules/change-memory.mdc` | Agent rule to load/update this system |

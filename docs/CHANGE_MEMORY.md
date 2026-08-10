# Temporal Rift — Change Memory

Living memory for agents and humans. Seeded from [`chat_audit_misses_and_regressions.md`](./chat_audit_misses_and_regressions.md) (baseline — do not rewrite that file).

**Recovery point:** git tag `baseline-pre-memory-system` → commit `180f2b6` (chat audit on master before this system).

---

## How to use

### Agents (before coding)

1. Read this file + the **Remove / Keep register** below.
2. Skim recent entries in [`decisions.log.md`](./decisions.log.md).
3. Check the **Channel matrix** so you know which APK/channel the user might be on.
4. Never silently re-add anything marked **REMOVED**.
5. Do not treat the baseline audit as editable truth — append corrections here or in the decision log.

### Agents (after every ship / BETA / version bump)

1. Append a dated row to [`decisions.log.md`](./decisions.log.md) (`SHIPPED` / `REMOVED` / `KEPT` / `DEFERRED`).
2. Update the **Channel matrix** if versions moved.
3. Add a short **Changelog by version** entry here when `APP_VERSION` bumps.
4. If user says “take out / don’t bring back,” add a **Remove** row immediately.

### Humans

- Feel a feature “gone”? Check channel matrix first (store/GitHub may lag BETA).
- Device bugs go in **Open bugs / device notes** with package + version + ROM if known.

---

## Channel matrix

Update when any channel ships. Audit snapshot as of 2026-08-09:

| Feature / version | Master (repo) | BETA APK | GitHub Release | Play Closed |
|---|---|---|---|---|
| **App version** | **2.13.2** (versionCode 46) | Through `TemporalRift-BETA-2.13.2.apk` | **v2.13.2** ([Release 8](https://github.com/drpeppermrpib/temporal-rift/releases/tag/v2.13.2)) | **2.13.2** (versionCode 46) — Closed testing live (user confirmed 2026-08-09) |
| Package | `com.drpep.temporalrift` (prod) | `com.drpep.temporalrift.beta` | Sideload / release assets | Store-signed prod |
| Update banner → GitHub | GitHub channel only | Per build channel | Yes (github) | Must stay **off** (`TR_CHANNEL !== 'github'`) |
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
| Town/RTS Continuity save (`town` payload) | **Coded on master only (unreleased)** — still 2.13.2 / vc46; no BETA/Play ship | **No** | **No** | **No** |
| Ashen Ravager sprites + articulation + barks | **Coded on master, flag OFF** (`RAVAGER_SPRITE_ENABLED=false`; live procedural; flip → r=36 / drawH=100) — **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Rift Keep building sprites (idle/damaged) | **Drafted on master, flag OFF** (`KEEP_SPRITE_ENABLED=false`; live procedural keep; flip → drawH=72, r=54 unchanged) — halls/camps pending; **ship deferred** with stronghold batch | **No** | **No** | **No** |
| Riftnet co-op (presence/HP/wave/revive) | Yes (partial) | Yes | Yes (2.13.2) | Yes (2.13.2) |
| Full co-op combat sync (enemies shared) | **No** (deferred) | **No** | **No** | **No** |
| Buildable city / craft behind fences | **Deepened** (2.11.0 WC2-style slice) | **Deepened** | **Deepened** (2.13.2) | **Deepened** (2.13.2) |
| Compact HUD + thinner beam (2.9.1) | Yes | Yes | Yes (2.13.2) | Yes (2.13.2) |

**Channel lag note:** GitHub Release **v2.13.2** and Play Closed testing **2.13.2** (versionCode 46) both live as of 2026-08-09 (user confirmed Play rollout). **Town/RTS Continuity save** is coded on master only — live BETA/GitHub/Play 2.13.2 builds still drop town on Continue until the next update batch ships.

---
## Remove / Keep register

Hard constraints. Agents must check before reintroducing UI or features.

### REMOVED — must NOT come back

| Item | Intent | Since | Status |
|---|---|---|---|
| Center-screen region **“ENTERING”** popup | Remove; keep bottom region label only | v2.4 | Stayed removed in 2.9.2 — do not re-add |
| GitHub update banner on **Play** builds | Must not push Play users to sideload | v2.5 | Gated: `UPDATE_CHANNEL === 'github'` only — keep gated |
| Copyrighted Saiyan / Kamehameha naming | Scrub for store | v2 rewrite | Do not restore original IP names |

### KEPT — must stay

| Item | Notes |
|---|---|
| Bottom region / city label (`regionFlashT`) | Replacement for removed center popup |
| Channel-aware update check | Play builds must not offer GitHub updates |
| Learning engine + collapsible adapt panel | Discoverability ≠ removal; 2.9.3 adds settings hide toggle (not removal of system) |
| Barricades, exit pulse, fence tiers, sentry uplink, adjacency fortify links | Core defense; 2.9.3 adds pre-place link ghost |
| Autosave / settings / layout drag / HUD offset / button styles / vibration | Mobile UX; town/RTS Continuity (`town` payload) coded on master — ship with next update batch |
| Dual-wield Ascension, Gusher, Sticker, companions (Rover/Warden/Scout) | 2.8+ |
| Death checkpoints | 2.8+ |
| Camera view Normal/Low/Lower | 2.8+ |
| Sound engine + SOUND submenu | 2.8.7 |
| World pine/rock sprites | 2.8.7 |
| Aether Infirmary (mend + menu revive) | 2.9.0 |
| One-tap field Aether Mend (H / MEND btn) | 2.9.3 — same costs as infirmary |
| Compact minimap + HP/aether cluster; map S/M/L; thinner beam ladder | 2.9.1 |
| Field hold-Talk revive + PeerJS downed/revive | 2.9.2 |
| BETA package `com.drpep.temporalrift.beta` | Side-by-side installs |
| RTS build picker + wood/gold + Ashen Laborers + upgradable halls + Aether Colossus | 2.10.0 — additive city pathway started; deepened in 2.11.0 |
| WC2-style Rift Keep town + forest stands + gold mines + Muster militia | 2.11.0 — workers≠squad; +3 combat train/wave; militia engage fixed 2.13.1; laborers revivable 2.13.1; retaliate-on-hit only 2.13.2 |

### Discoverability risk (not removed — easy to feel “gone”)

| Item | Risk |
|---|---|
| Mid-wave squad revive (pre-2.9.2 was menu-only) | Wave-end auto-revive cleared downed companions before shop; fixed with field hold-Talk in 2.9.2 — keep field path if changing revive UX |
| Menu-only systems generally | Mark `discoverability_risk` in decisions when shipping menu-only combat helpers |

---

## Open bugs / device notes

| Date | Device / ROM | Package | Version | Symptom | Status |
|---|---|---|---|---|---|
| 2026-08-08 | **OnePlus 9 Pro / Evolution X** (user-reported; Android custom ROM) | unknown | unknown | **Unknown** — not documented in prior chat transcripts; no diagnosis | Open — needs repro + logcat + packageId + version label |

*Hypotheses only (unconfirmed):* WebView/Chromium skew, battery killers vs AudioContext/WebRTC, cutout/gesture nav, SELinux on sideload vs Play, thermal throttle on heavier 2.8.5+ assets. Capture logcat around repro before assuming root cause.

---

## Pending / missed items (from audit)

Do not invent extras. Skip boss art / combat “feel” polish unless user reopens (out of audit scope).

| Priority | Item | Notes |
|---|---|---|
| High | Full **co-op combat sync** | PeerJS presence/HP/wave/revive shipped; enemies stay local — explicitly deferred |
| **Next update (coded, unreleased)** | **Town/RTS Continuity save** | On master at **2.13.2** (no versionCode bump, no BETA/Play): additive `town` in snapshot/loadGame — structures+levels, laborers, militia, barricades, gold-mine stocks, waveTrainLeft; wood/gold already saved; companion/player/wave/skill-tree unchanged. **Ship deferred** until fence-brick stronghold + art batch. Live APKs still drop town on Continue until that ship. |
| Next update batch | Fence brick / cloister / **stronghold** | Explicitly skipped in 2.13.2; bundle with save fix + art |
| Backlog | **Rift Forge** companion + **v3 overhaul** | Companion scaffold SHIPPED at `../rift-forge` + `RiftForge-0.1.0.apk`; **APK deferred for ease** — prefer Windows **character-drops** pipeline for v3 art (see `docs/CHARACTER_DROP_FORMAT.md`); full v3 loader/overhaul still pending |
| Backlog | **Character sheet ingest** (canvas) | Drop folder ready; **primary path now in-engine anim** (2.12.0). Pixelorama/Forge APK optional later — do not require user Pixelorama |
| Backlog | Clan spot 2–5 players / robust rooms | Passkeys exist; not full lobby/matchmaking |
| Backlog | Skill-tree polish | Called backlog in 2.8.3 notes |
| Backlog | Music bus / full soundtrack | Largely stubbed |
| Backlog | RTS AI polish / more buildings / Colossus merge FX | 2.11.0 deepened town slice; pathfinding / true WC2 sim still thin |
| Backlog | **Ashen Ravager** sprites — **articulation+barks coded, flag OFF, ship deferred** | Sheets + gait/plant + distinct deep cyclops barks on master; `RAVAGER_SPRITE_ENABLED=false`; live still procedural `r=24`/`s=1.7`. Flip flag → `r=36`, `drawH=100`, `s≈2.78`. See `docs/ravager-art-plan.md`. Store ship with stronghold batch |
| Backlog | **Rift Keep** building art — **drafted, flag OFF; halls/camps pending** | `assets/buildings/keep/{idle,damaged}.png`; `KEEP_SPRITE_ENABLED=false`; collision `r=54` unchanged; flag ON → `drawH=72`. See `docs/keep-art-plan.md`. Halls/camps/#2 remainder when user sends photos; apply with stronghold batch |

**Next batch suggested order** (user photos → art upgrades + buildings + ravager + stronghold later): (1) ~~ravager mesh~~ **art+articulation+barks coded (flag OFF)** (2a) ~~**Keep art**~~ **drafted (flag OFF)** (2b) **halls/camps building art** (user photos next) (3) ally/militia/laborer skins if photos (4) fence brick stronghold systems (5) one update apply (town save + ravager/keep flags ON).

---

## Changelog by version (seed — brief)

Append new versions at the top of this list when shipping.

### 2.13.2
- **Enemy size toward ravager:** husk/sprinter/bulwark/shaman drawH+r scaled toward ravager (`r=24` / `s=1.7`); still << Gharok. **Skeleton unchanged** (r=12 / drawH=38 / s=1.055). Old→new: husk 15/42→21/56, sprinter 12/~36.5→18/~48.7, shaman 14/42→20/56, bulwark 22/58→23/62.
- **Laborers:** retaliate-on-hit only (`retaliateT` after damage); removed proactive threaten-engage and flee-to-fight-when-threatened. Still workers≠squad, still revivable.
- **Squad smidge buff:** companions + muster militia slight HP/dmg (rover 185/10→210/11, warden 300/9→340/10, scout 165/8→185/9, sentinel 240/11→270/12, spear 200/12→230/14, bow 155/9→180/10).
- **Skipped:** fence brick wall / cloister / stronghold connection (later update).

### 2.13.1
- **Enemy size pass (modest):** husk/sprinter/skeleton/bulwark/shaman slightly larger than player visual — not boss-sized. drawH/r: husk 36/14→42/15, sprinter ~30.6/11→~36.5/12, skeleton 32.4/10→38/12, bulwark 52.2/20→58/22, shaman 36/13→42/14. Gharok untouched.
- **Muster militia combat:** spears/bows engage foes near self **or** near player (was melee aggro=90 → follow-only). Spear poke uses type.range; bow still range-gated. Companion AI unchanged.
- **Ashen Laborers:** field hold-Talk revive (+ wave-end auto) like militia; flee-to-fight melee when threatened; still workers≠squad (no squad slots). Colossus merge no longer wipes downed workers.

### 2.13.0
- Applied deferred sprite sets: Skeleton / Bulwark / Shaman flags **on** (size locks intact at ship: r=10/20/13, drawH=32.4/52.2/36 — superseded by 2.13.1 size pass). Husk still on from 2.12.1.
- Articulate walk polish: clearer gait cadence + plant squash/bob on sprite units; procedural types keep 2.12 limb stride.
- Enemy bark system SHIPPED: per-type synth grunts + original orc float lines (aggro / attack / combat rate-limit); respects mute SFX.
- Gharok walk/idle/windup/stomp left as-is (shipped 2.12.x) — no regression.
- Gap: Ravager still procedural (no sheet yet).

### 2.12.1
- Ashen Husk detailed sprite sheets (`assets/zombie/{idle,walk,windup}.png`) wired to husk/sprinter like Gharok frame-swap; **size lock:** husk `r=14`, sprite `drawH=36` (sprinter `×0.85`) — art upgrade only, not boss footprint. Procedural fallback kept. Refs inspiration-only under `_refs/` (stripped from APK). See `docs/zombie-art-plan.md`.
- **Ashen Skeleton / Bulwark / Shaman art drafted same day** (flags were off; **applied in 2.13.0**). See art-plan docs.

### 2.12.0
- In-engine animation finish (no Pixelorama required): Gharok idle/walk/windup+strike/hurt lean at locked `r=54` / `drawH=228`; additive walk/attack/hurt for husks, sprinters, shamans, ravagers, bulwarks, skeletons, companions, militia, laborers, Colossus. Sizes locked in `docs/UNIT_SIZES.md`. Pixelorama drop path optional later.

### 2.11.0
- WC2-inspired town slice: larger map (4800); forest stands; gold mine buildings; Rift Keep / Supply Camp / Gold Vault; Ashen Laborers = workers only (Chop/Mine orders, separate cap); Muster Spearmen/Bowmen (+3/wave, revivable); click unit skill nodes; starter Keep+laborers + tips. Wave survival / learning / barricades / mend / revive / companions kept.

### 2.10.0
- Additive RTS slice: BUILD picker (barricade / Timber Camp / Muster Hall / Aether Pit); wood+gold HUD; Ashen Laborers gather trees/gold veins; building select→upgrade + train; Ashen Sentinel squad unit; Aether Colossus (Rift Titan) combiner ~Gharok scale. Wave survival / companions / barricades / mend / revive kept.

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

### 2.8.1–2.8.6
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
- Removed center “entering city” popup; bottom region label kept.

### Earlier (2.0–2.3)
- v2 Ashen Vanguard rewrite, chests/armor/NPCs/barricades, autosave/settings, layout + city name on boss bar, GitHub update banner foundation.

---

## Related files

| File | Role |
|---|---|
| [`chat_audit_misses_and_regressions.md`](./chat_audit_misses_and_regressions.md) | **Baseline audit** — immutable revert reference |
| [`decisions.log.md`](./decisions.log.md) | Append-only dated decisions |
| `.cursor/rules/change-memory.mdc` | Agent rule to load/update this system |

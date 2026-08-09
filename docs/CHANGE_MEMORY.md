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

Update when any channel ships. Audit snapshot as of 2026-08-08:

| Feature / version | Master (repo) | BETA APK | GitHub Release | Play Closed |
|---|---|---|---|---|
| **App version** | **2.12.1** (versionCode 43) | Through `TemporalRift-BETA-2.12.1.apk` | **v2.6** latest | Last confirmed **2.6**; 2.7+ shelf not confirmed live |
| Package | `com.drpep.temporalrift` (prod) | `com.drpep.temporalrift.beta` | Sideload / release assets | Store-signed prod |
| Update banner → GitHub | GitHub channel only | Per build channel | Yes (github) | Must stay **off** (`UPDATE_CHANNEL !== 'github'`) |
| Learning engine + adapt panel | Yes (+ settings hide toggle) | Yes (2.9.3+) | No (stuck ~2.6) | No if still on 2.6 |
| Dual-wield / companions / sentry | Yes (2.8+) | Yes | No (~2.6) | No if still on 2.6 |
| Aether Infirmary + field revive | Yes (2.9.0–2.9.2) | Yes | No | No if still on 2.6 |
| One-tap Aether Mend + wall ghost | Yes (2.9.3) | Yes | No | No if still on 2.6 |
| RTS build picker / wood-gold / laborers | Yes (2.10.0+) | Yes | No | No if still on 2.6 |
| WC2-style town / mines / worker≠squad / +3 train | Yes (2.11.0+) | Yes | No | No if still on 2.6 |
| In-engine unit anim finish (Gharok + all figures) | Yes (2.12.0+) | Yes (2.12.0+) | No | No if still on 2.6 |
| Ashen Husk detailed sprites (idle/walk/windup, r=14) | Yes (2.12.1) | Yes (2.12.1) | No | No if still on 2.6 |
| Ashen Skeleton sprites (idle/walk/windup, r=10) | Art in repo; flag **off** (APK deferred) | No | No | No |
| Ashen Bulwark sprites (idle/walk/windup, r=20) | Art in repo; flag **off** (APK deferred) | No | No | No |
| Ashen Shaman sprites (idle/walk/windup, r=13) | Art in repo; flag **off** (APK deferred) | No | No | No |
| Riftnet co-op (presence/HP/wave/revive) | Yes (partial) | Yes | No | No if still on 2.6 |
| Full co-op combat sync (enemies shared) | **No** (deferred) | **No** | **No** | **No** |
| Buildable city / craft behind fences | **Deepened** (2.11.0 WC2-style slice) | **Deepened** | **No** | **No** |
| Compact HUD + thinner beam (2.9.1) | Yes | Yes | No | No if still on 2.6 |

**Channel lag note:** Play closed + GitHub “latest” were held around **2.6** while master/BETA raced to **2.9.x**. That is distribution lag, not a code regression.

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
| Autosave / settings / layout drag / HUD offset / button styles / vibration | Mobile UX |
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
| WC2-style Rift Keep town + forest stands + gold mines + Muster militia | 2.11.0 — workers≠squad; +3 combat train/wave |

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
| Ops | Store / GitHub channel lag behind BETA | 2.7+ AABs on shelf; public channels last confirmed at 2.6 |
| Backlog | **Rift Forge** companion + **v3 overhaul** | Companion scaffold SHIPPED at `../rift-forge` + `RiftForge-0.1.0.apk`; **APK deferred for ease** — prefer Windows **character-drops** pipeline for v3 art (see `docs/CHARACTER_DROP_FORMAT.md`); full v3 loader/overhaul still pending |
| Backlog | **Character sheet ingest** (canvas) | Drop folder ready; **primary path now in-engine anim** (2.12.0). Pixelorama/Forge APK optional later — do not require user Pixelorama |
| Backlog | Clan spot 2–5 players / robust rooms | Passkeys exist; not full lobby/matchmaking |
| Backlog | Skill-tree polish | Called backlog in 2.8.3 notes |
| Backlog | Music bus / full soundtrack | Largely stubbed |
| Backlog | RTS AI polish / more buildings / Colossus merge FX | 2.11.0 deepened town slice; pathfinding / true WC2 sim still thin |
| Backlog | **Ashen Ravager** sprite art (NPC #4) | Next after Shaman; wait for refs — same soft-wire / APK-deferred pattern as Skeleton/Bulwark/Shaman |

---

## Changelog by version (seed — brief)

Append new versions at the top of this list when shipping.

### 2.12.1
- Ashen Husk detailed sprite sheets (`assets/zombie/{idle,walk,windup}.png`) wired to husk/sprinter like Gharok frame-swap; **size lock:** husk `r=14`, sprite `drawH=36` (sprinter `×0.85`) — art upgrade only, not boss footprint. Procedural fallback kept. Refs inspiration-only under `_refs/` (stripped from APK). See `docs/zombie-art-plan.md`.
- **Ashen Skeleton art drafted (same day, no version bump):** `assets/skeleton/{idle,walk,windup}.png` — `r=10`, `drawH=32.4`; soft-wire `SKELETON_SPRITE_ENABLED=false`; **APK apply deferred**. See `docs/skeleton-art-plan.md`.
- **Ashen Bulwark art drafted (same day, no version bump):** `assets/bulwark/{idle,walk,windup}.png` — `r=20`, `drawH=52.2` (36×1.45); soft-wire `BULWARK_SPRITE_ENABLED=false`; **APK apply deferred**. See `docs/bulwark-art-plan.md`.
- **Ashen Shaman art drafted (same day, no version bump):** `assets/shaman/{idle,walk,windup}.png` — `r=13`, `drawH=36` (36×1.0 husk baseline); soft-wire `SHAMAN_SPRITE_ENABLED=false`; **APK apply deferred**. See `docs/shaman-art-plan.md`.

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

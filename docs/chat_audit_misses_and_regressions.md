# Temporal Rift — Chat Audit: Misses, Regressions, Writebacks

> **BASELINE AUDIT — do not rewrite; append corrections elsewhere.**  
> Immutable snapshot / revert reference (git tag `baseline-pre-memory-system`, commit `180f2b6`).  
> Living memory lives in [`CHANGE_MEMORY.md`](./CHANGE_MEMORY.md) and [`decisions.log.md`](./decisions.log.md).

**Date:** 2026-08-08  
**Scope:** Reconstruct feature history from Cursor agent transcripts + spot-check current code (`APP_VERSION` **2.9.2**).  
**Not in scope:** Boss look / how combat “feels” / Gharok art touchups (deferred by user).  
**Remembering system:** seeded after this audit — see `CHANGE_MEMORY.md` (do not edit this body to “catch up”).

**Primary transcript:** [`a840435d-eb1f-4c40-8138-c782e5fe4af8`](../../../../projects/c-Users-drpep-cursor-agents-videogamemakes/agent-transcripts/a840435d-eb1f-4c40-8138-c782e5fe4af8/a840435d-eb1f-4c40-8138-c782e5fe4af8.jsonl) (~691 lines, ~130 user turns, Aug 4–8 2026)  
**Related subagent / fork chats under same folder:** `1a69c006…` (v2.9.0 features), `5f0415cb…` (sound+sprites 2.8.7), `15a7205d…` / `658af4a8…` / `f0dd909c…` / `afb7e78d…` (Gharok passes), revive worker `3b175607…`  
**SearchConversations:** not available in this environment’s MCP tool set — reconstruction is transcript-folder + code only.

---

## Executive verdict

**Reconstruction quality: good for intentional changelog and agent misses; weak for proving “accidental writebacks.”**

We can rebuild a clear **ask → claimed ship → version** timeline from ~2.0 through **2.9.2**, and we can verify most claims against `game.js` / `index.html` / rollout shelf / GitHub releases. What chats do **not** give us is a clean ledger of “feature X was deleted then silently re-added.” Most “gone” feelings are **UX / channel lag / menu-only systems**, not git reverts.

Honest answer for a future remembering system: **yes, with caveats** — chats + versioned APKs are enough for a useful human-readable changelog; they are **not** enough alone for automatic regression detection without tying each decision to a commit/APK and a remove/keep flag.

---

## Timeline of major asks (user → what agents claimed)

| When (approx) | User ask | Claimed ship | Evidence now |
|---|---|---|---|
| Aug 4 | DBZ/Halo/Zombies prompt → playable game | v1 browser prototype | Superseded by v2 rewrite |
| Aug 4 | Humanoid sprites, Skyrim layer, copyright-safe, APK | **v2.0** Ashen Vanguard + Capacitor APK | Core loop still present |
| Aug 4 | Treasure chests, armor, NPCs, barricades + exit blast | **v2.1** Release 2 | Present |
| Aug 4–5 | Autosave, settings, screen fit, save button | **v2.2** | Present |
| Aug 5 | Layout adjust + city name on boss bar | **v2.2/2.3** layout + bottom region label | Present |
| Aug 5 | Auto-update + GitHub vs Play channels | **v2.3** GitHub update banner; later **v2.5** channel gate | `UPDATE_CHANNEL` / `TR_CHANNEL` in code |
| Aug 5 | **Remove** center “entering city” popup; keep bottom label | **v2.4** | No `ENTERING` string in `game.js`; region flash at bottom remains |
| Aug 5 | Play update banner must not send Play users to GitHub | **v2.5** play channel hides banner | Code: `UPDATE_CHANNEL === 'github'` only |
| Aug 5–6 | Closed test / TestersCommunity / promo codes | Console ops; **store live on 2.5 then 2.6** | GitHub releases latest = **v2.6**; closed track updated per chat |
| Aug 6 | HUD under notch, movable buttons, styles | **v2.6** | Present |
| Aug 6 | Vibration on attacks | Folded into **v2.6** | `navigator.vibrate` + settings toggle |
| Aug 6 | Fusion zombies, graves/skeletons, fireballs, boss armor, fence upgrades | **v2.7** (shelf; store rollout deferred) | In master code |
| Aug 6 | Dual-wield Ascension, Gusher/Sticker, companions, sentry, camera peek, death checkpoints, separate beta package | **v2.8** + `com.drpep.temporalrift.beta` | Present; BETA APKs through 2.9.2 |
| Aug 6–7 | Boss redesign iterations (user: “trash clumped slop” → T-pose sprite) | **2.8.1–2.8.6** | Present (skipped deep art critique per user) |
| Aug 7 | Sound engine submenu + sprite pines/rocks | **2.8.7** | Present |
| Aug 7 | Aether heal/revive squad, dog durability, linked barricades, Gharok knockback mass, Riftnet co-op foundation | **2.9.0** | Present; combat sync still deferred |
| Aug 8 | Compact map+HP HUD, thinner beam ladder; agent *suggested* later polish | **2.9.1** shipped HUD/beam; suggestions left pending | HUD/beam present; suggestions mostly still open |
| Aug 8 | “Revive squad gone?” + MP revive | **2.9.2** field hold-Talk revive + PeerJS downed/revive | Present (`dd08d2d`) |
| Aug 8 | Remembering system — **audit first** | This doc | — |

**Channel lag (important):** Play closed testers and GitHub “latest release” were intentionally held around **2.6** while BETA / master raced to **2.9.x**. Rollout shelf has 2.7/2.8 AABs; chat said store stayed on 2.6 until green-lit. That is **distribution lag**, not a code regression.

---

## Accidental writebacks / regressions

### Confirmed “user said remove / don’t do this” — code check

| Item | User intent | Status in 2.9.2 code | Verdict |
|---|---|---|---|
| Center-screen region “ENTERING” popup | Remove; keep bottom label | No `ENTERING` / region `showChapter` on zone change; bottom `regionFlashT` remains | **Stayed removed** — not a writeback |
| GitHub update banner on Play builds | Must not push Play users to sideload | `checkForUpdate()` only if `UPDATE_CHANNEL === 'github'` | **Fixed and held** |
| Copyrighted Saiyan/Kamehameha naming | Scrub for store | Original IP naming in README/game | Intentional rewrite, not a writeback |

### Suspected “gone” that was **not** an accidental deletion

| Symptom | Chat/code finding |
|---|---|
| “Revive the squad (gone now?)” | Worker `3b175607` concluded: **not removed**. Mid-wave revive lived only in infirmary/shop menus; **wave-end auto-revive clears downed companions before shop**, so Revive tiles rarely appeared. Fixed in **2.9.2** with field hold-Talk channel. |
| Store / friends on older build | Expected — closed track + GitHub release last published **v2.6** while BETA is **2.9.2**. |

### Soft / process “writebacks” (not feature re-adds)

| Item | What happened |
|---|---|
| Repo made public | Agent made repo public for GitHub Pages privacy policy; earlier privacy concern conflicted; user then accepted public demo + paid Play. |
| Master vs released channel | Master advanced 2.7→2.9.2 while GitHub release channel was rebuilt from archived **2.6** for Update 1 — easy to misread as “features disappeared” if you open the wrong APK. |
| Stomps on/off | Deferred (`GHAROK_STOMP_JUICE = false`) then enabled after look approval — intentional flag, not accidental restore of a removed feature. |

### No hard evidence found of

- A feature the user explicitly ordered **removed** being **re-inserted later against that order** (beyond the Play update-banner bug, which was fixed in 2.5 and remains gated).
- A silent git revert of barricades / companions / learning engine / vibration.

**Bottom line on writebacks:** the strongest *true* regression-class event in chat was **Play channel offering GitHub updates** (fixed). The strongest *felt* regression was **squad revive UX**, which was incomplete shipping, not accidental writeback.

---

## Missing / never finished (agent misses)

Ranked by how clearly the user asked vs what never fully shipped:

1. **Full co-op combat sync** — User asked for joinable map with friends + revive; agents shipped PeerJS presence/HP/wave + revive (2.9.0–2.9.2). **Enemies stay local.** Explicitly deferred in README and UI copy.
2. **Buildable city / Warcraft-style crafting pathway behind fences** — User roadmap item (Aug 6). Agent parked as “post-launch.” **Not started.**
3. **Store / GitHub public channel lag behind BETA** — User expected testers to feel updates; **2.7 and 2.8+ never confirmed uploaded** after 2.6 while BETA raced ahead. Shelf has AABs; distribution ops incomplete.
4. **Agent-suggested polish still open (Aug 8, after 2.9.0):**
   - Dedicated **hide learning panel** toggle (collapse chevron/`adaptCollapsed` exists; not the full “settings toggle hide in combat” pitch)
   - **One-tap Aether Mend** on HUD (still menu/infirmary)
   - **Linked-wall ghost preview** before place (links apply on place; no pre-place ghost)
   - Finish co-op combat sync (same as #1)
5. **Squad revive discoverability (pre-2.9.2)** — Shipped as menu-only in a way that self-cleared at wave end; user correctly felt it “gone.” Agent missed the mid-fight path until called out.
6. **Longer-horizon asks partially unmet:** clan spot 2–5 known players with robust rooms (passkeys exist; not full lobby/matchmaking); skill-tree polish called backlog in 2.8.3 notes; music bus largely stubbed vs full soundtrack.
7. **Early mobile cut-off / APK packaging friction** — Fixed iteratively (2.2 title fit), but cost many turns; pattern of “ship then discover phone layout” repeats.

---

## Intentionally changed & still present

Spot-checked in current `game.js` / `index.html` / README (non-exhaustive):

- Learning engine + collapsible adapt panel  
- Barricades, exit pulse, fence tiers, sentry uplink, **adjacency fortify links**  
- Autosave / settings / layout drag / HUD offset / button styles / vibro  
- Channel-aware update banner  
- Dual-wield Ascension, Gusher, Sticker, companions (Rover/Warden/Scout)  
- Death checkpoints  
- Camera view Normal/Low/Lower  
- Sound engine + SOUND submenu  
- World pine/rock sprites; Gharok sprite path (art quality out of scope)  
- Aether Infirmary (mend + menu revive)  
- Compact minimap + HP/aether cluster; map size S/M/L; thinner beam ladder (2.9.1)  
- Field hold-Talk revive + PeerJS downed/revive (2.9.2)  
- BETA package `com.drpep.temporalrift.beta` for side-by-side installs  

**Version reality:**

| Channel | Version (as of audit) |
|---|---|
| Repo `APP_VERSION` / gradle | **2.9.2** / versionCode **38** |
| Latest GitHub release | **v2.6** |
| Play closed track (per chat + ops) | Last confirmed ship **2.6**; 2.7+ shelf not confirmed live |
| Local BETA APKs | Through **TemporalRift-BETA-2.9.2.apk** |

---

## Device bug (OnePlus 9 Pro / Evolution X 11.6.2)

### What chats say

- **No prior mention** of OnePlus 9 Pro, Evolution X, Android 16 custom ROM, root, or a device-specific crash until the **2026-08-08 audit ask** itself.
- Older phone-adjacent issues in chat were **distribution**, not ROM quirks:
  - “MY PHONE WONT LET ME DOWNLOAD IT” → Play tester / opt-in / group membership
  - Notification bar overlapping HUD → fixed with safe-area + HUD offset (2.6)
  - Vibration requested and implemented via `navigator.vibrate` in WebView
  - Capacitor / WebView packaging discussed generically (R8 warning, channel builds)

**Conclusion:** the user’s device bug is **undocumented in transcripts**. We cannot identify it from chat history.

### Plausible ROM-related failure modes (from stack discussed — not diagnosed)

These are hypotheses consistent with a **rooted OnePlus 9 Pro + Evolution X + Capacitor WebView** game; **none are confirmed as the user’s bug**:

- WebView / Chromium version skew on custom ROM → WebAudio, PeerJS WebRTC, or `navigator.vibrate` flaky  
- Aggressive battery / background killers interrupting AudioContext or network for Riftnet  
- Gesture / navbar / cutout differences defeating safe-area CSS despite HUD offset  
- SELinux / permission quirks on sideloaded BETA vs Play-signed APK  
- Touch / pointer event differences with custom gesture nav during hold-to-beam / hold-to-revive  
- Performance thermal throttling on canvas particle/sprite load (2.8.5+ assets heavier)

To catch the real bug later: device logcat around repro + note which APK package (store vs `.beta`) and version label.

---

## Recommended “remembering system” scope (LATER — do not implement now)

- **Decision log** (append-only): date, version, user quote, agent action, status (`shipped` / `deferred` / `removed` / `wontfix`), commit + APK path.  
- **Remove/keep register:** anything user says “take out / don’t bring back” gets a hard row agents must check before UI/feature reintro.  
- **Channel matrix:** master / BETA APK / GitHub release / Play track versions side-by-side (this audit’s biggest confusion source).  
- **Felt-gone checklist:** if a feature is menu-only or auto-clears, mark `discoverability_risk`.  
- **Bug inbox:** device model + ROM + packageId + version + log snippet — separate from feature changelog.  
- **Do not** rely on chat search alone; require linking to `APP_VERSION` bump commits.

---

## Confidence notes / gaps in transcript coverage

| Area | Confidence |
|---|---|
| Main chat feature asks Aug 4–8 | **High** — full user briefs extracted; key full texts re-read |
| Subagent feature workers (2.8.x–2.9.x) | **High** for what was tasked; medium for every internal false start |
| Exact Play Console live version today | **Medium** — last chat confirmation was 2.6 live; console not re-queried in this audit |
| Accidental writebacks of removed features | **Low-to-medium** — absence of evidence ≠ proof none occurred in unlogged edits |
| OnePlus ROM bug | **None in chat** — unknown |
| Boss cosmetics / feel | **Skipped** per user |
| SearchConversations across other Cursor workspaces | **Unavailable** — may miss parallel chats outside this project’s transcript folder |
| Noise in transcripts | Many “Perform any necessary follow-up…” system turns; filtered for analysis |

---

## Sources used

- Main JSONL `a840435d-eb1f-4c40-8138-c782e5fe4af8`  
- Related chats: `1a69c006`, `5f0415cb`, `15a7205d`, `658af4a8`, `f0dd909c`, `afb7e78d`  
- Revive worker report: `subagents/3b175607-4670-497f-b4b8-cd93901fd494`  
- Code: `game.js`, `index.html`, `README.md`, `android/app/build.gradle`, `rollouts/` shelf, `gh release list` (latest **v2.6**)

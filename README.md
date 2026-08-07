# Temporal Rift: Ashen Vanguard

A playable mobile-ready action-RPG prototype fusing the *feel* of DBZ: Kakarot's ki
combat and progression, Halo 2's gunplay and tactical cover, Nazi Zombies' wave
survival, and Skyrim's open zones, NPC quests, and skill trees — under **100% original
IP** so it can legally ship as an APK.

## Play it

No install, no build step:

- **Desktop:** open `index.html` in any browser (or serve the folder and visit it).
- **Phone:** serve the folder on your network (`npx http-server -p 8321`) and open
  `http://<your-pc-ip>:8321` on the phone — full touch controls appear automatically.
- **APK:** see "Building the APK" below.

## Controls

| Desktop | Touch (auto-detected) | Action |
|---|---|---|
| `W A S D` + mouse | Left-thumb virtual joystick, auto-aim | Move / aim |
| Left click (hold) | FIRE button (hold) | Pulse rifle |
| Right click (hold, release) | BEAM button (hold, release) | Charge & fire Nova Beam |
| `Q` | NOVA button | Aether nova (melee AoE burst) |
| `E` | GRENADE button | Energy grenade |
| `Shift` | DASH button | Dash |
| `F` | ASCEND button | Transform (requires full aether) |
| `K` | SKILLS button | Skill tree |
| `T` | TALK button (appears near NPC) | Talk / quests |
| `P` / `Esc` | ⚙ MENU button | Pause / settings / save |

## What's in the build

- **Humanoid character sprites** — every actor is a rigged vector figure (head, torso,
  swinging legs, arms, weapons, shadows, walk cycles): the spiky-haired Vanguard with a
  rifle, hunched glowing-eyed husks and sprinters, hooded staff-wielding grave shamans,
  tusked pointy-eared **ork ravagers** with spiked clubs, and the horned boss warlord
  Gharok. No more floating orbs.
- **Textured open zones** — procedurally generated grass/ash/stone ground tiles plus
  900 decor items (grass tufts, flowers, mushrooms, bones, skulls, cracks), trees with
  swaying canopies, ruined pillars, rocks, and crates. Named regions with entry
  banners: **Emberfall Camp**, **The Shattered Fields**, **Northreach Fort**,
  **The Ashen Reach**.
- **NPC, quests & story progression** — Quartermaster Bramm at the campfire gives a
  6-quest storyline across chapters (survive assaults, gather rift cores, hunt
  ravagers, slay the warlord, out-play the learning engine, seal the rift), with
  dialogue, quest markers (`!`/`?`), a HUD tracker, and rewards in cores and skill
  points. Resting near the campfire slowly heals you.
- **Health & skills (RPG layer)** — XP levels grant skill points spent in a 3-branch,
  12-node skill tree (Warrior / Aether Arts / Survivor) with rank requirements and a
  capstone transformation (**Storm Ascendant**). Separate core-currency gear shop
  between waves (7 upgrade tracks).
- **Learning engine (adaptive AI)** — damage is tallied per attack category; push any
  tactic past a 25% usage share and the horde builds up to 60% resistance (live HUD
  panel, resisted hits flash red), decaying ~18% per wave. It also tracks where you
  linger and opens spawn rifts near camping spots.
- **Hybrid combat** — rifle, chargeable sweeping beam, nova burst, grenades, dash,
  transformations; hard cover blocks projectiles both ways; boss health bar; gore
  decals and scorch marks persist on the ground.
- **Mobile-first tech** — virtual joystick, hold-to-fire ability buttons, auto-aim,
  devicePixelRatio-aware rendering, no scroll/zoom bleed, zero dependencies.

### New in Release 2.8.3 (Gharok twin war-brute)

- **Boss look** — Gharok redrawn as a bigger original twin-headed green war-brute
  (procedural canvas): purple tunic, black skull-buckle belt, skull+horn pauldron vs
  spiked silver pauldron, spiked mace + oversized cleaver (red wind-up telegraph).
  `armorCrack` now chips chest straps then pauldrons. Cleaver slam floaters updated.
  Foot-stomp juice is **deferred** (`GHAROK_STOMP_JUICE = false`) until the look is
  signed off. v2.8.2 clean silhouette kept as `drawWarlord_v282_template` +
  `gharok-template-2.8.2.png`. Concept: `gharok-twinorc-concept.png`.
  Art roadmap: `docs/gharok-art-plan.md`.
- **Backlog (not in this build):** skill-tree polish, better sound engine, stomp juice.

### New in Release 2.8.2 (Gharok clean twin-brute)

- **Boss readability pass** — replaced the muddy 2.8.1 twin-goblin with a cleaner
  geometric twin-brute silhouette (chunky shapes, dark outlines, separated heads,
  club + claw). Kept as template for 2.8.3+.

### New in Release 2.8.1 (Gharok green twin-goblin)

- **Boss look pass** — Gharok’s procedural sprite shifts toward a muscular
  **double-headed green goblin** war-brute (bright green skin, solid glowing
  red eyes, big swirl-ears, jewelry, tattered tunic/sash, metal greaves). Still
  pure canvas — no Meiker image assets. Keeps the claw red telegraph and the
  four steel plates that crack/fall with `armorCrack`. Concept sketch:
  `gharok-hybrid-concept.png`.

### New in Release 2.8 (Arsenal & Checkpoints)

- **Dual-wield Ascension** — while Ascended, your equipped **Twin Weapon** fires
  alongside the primary (60% rate stock). The new **Twin Channeling** skill
  (Warrior tree, 2 ranks) brings the off-hand to full rate, then halves the
  dual-wield spread. Pick the pair in the field lab's ⌖ loadout cards.
- **Two new guns in the field lab:**
  - **Gusher** (120 ⬡) — slow teal energy bolts that detonate in a splash,
    blasting the whole pack backwards (strong knockback + `buzz(40)` haptic)
    with a synthesized "zap-thump".
  - **Sticker** (180 ⬡) — rapid pink needles that visibly embed in enemies;
    0.8 s after the first hit the cluster bursts in a small AoE that scales
    with the number of needles (max 12), with a "crackle-pop" synth sound.
  - Both share the rifle upgrade tracks and the learning engine's 'rifle'
    category, so the horde still reads all gunfire as one tactic.
- **Companions (SQUAD)** — three recruitable allies, all original designs,
  bought with cores in the field lab (up to 3 deployed at once):
  - **Rover** (300 ⬡) — robot dog: plasma-bite melee, cyan visor, fetches
    loose cores back to your pickup magnet.
  - **Warden** (500 ⬡) — salvaged combat android: teal arm pulse-cannon,
    tanky, taunts nearby enemies into attacking it first (it also blocks
    enemy fire).
  - **Scout** (800 ⬡) — hooded ranger: piercing tech-crossbow bolts, drops a
    med/energy supply pack near you every ~16 s.
  - Each has a mini skill tree in the new **SQUAD** column of the skill-tree
    overlay (bite damage/fetch radius, fire rate/taunt radius, pack healing/
    extra pierce) paid with normal skill points. Companions follow with
    flocking, never body-block you, can be **downed** and revive free at wave
    end. Owned squad + loadout persist in the save. Combined squad DPS is
    tuned to ~40–45% of player DPS; each deployed companion adds +1 enemy to
    the wave budget.
- **Boss redesign: Gharok the Twin-Goblin War-Brute** — muscular double-headed
  green goblin (v2.8.1 look pass): two heads fused at the neck with glowing
  red eyes, swirl-ears, tunic/jewelry/greaves. Four steel armor plates crack
  and **fall off** as the armor bar chips at 75/50/25%. One arm ends in a
  **claw gauntlet**: linger in range → 0.7 s red telegraph wind-up, then a
  1.5× knockback slash. Other arm swings a spiked war club.
- **Enemy escalation (wave 7+)** — spawns can roll **Ascended** (golden aura,
  +30% speed, +40% damage, bursts into +8 aether for you on death; max 3
  alive) or **Plated** (mini grey armor bar that halves damage until chipped
  off, same mechanics as the boss plate; max 4 alive). Chances ramp gently
  per wave and are capped so difficulty climbs instead of spiking. Shamans
  can also swap mid-wave between fireballs and a faster low-damage rift bolt.
- **Sentry Uplink** — new tiered defense line: mounts an auto-targeting
  scrappy sentry gun on **every barricade you build**. Tier 1 (200 ⬡) single
  barrel, Tier 2 (350 ⬡) +fire rate/+range + antenna, Tier 3 (550 ⬡) dual
  barrels. Sentry fire (amber tracers) doesn't feed the learning engine —
  it studies you, not your hardware. Tier persists in the save.
- **Camera view setting** — Normal / Low (5%) / Lower (10%): shifts the
  camera center down by a fixed % of the viewport so you see further ahead;
  persisted in settings.
- **Death checkpoints** — dying no longer wipes the run. **⟲ RESPAWN AT
  CHECKPOINT** reloads the last end-of-wave auto-save (exact same snapshot
  format the CONTINUE button uses) minus a **15% core death toll**
  (`DEATH_CORE_PENALTY`). **☠ GIVE UP — RESTART RUN** deletes the save for a
  true fresh start.

### New in Release 2.7 (Update 2 — horde evolution)

- **Zombie fusion** — from wave 4 on, two husks that stay within arm's reach of each
  other for 1.5 s fuse into a **Bulwark**: a hulking dark-tinted brute with 2.5× husk
  health, slower stride, a heavier slam that shoves you backwards, and a fusion burst
  of rift particles. At most 2 Bulwarks can exist at once, so waves stay fair.
- **Skeletons** — when a husk or sprinter dies mid-wave there's a 35% chance (max 3
  per wave) its grave reopens 8–15 s later: a bony pale skeleton claws out of the
  dirt (brief rising animation, untouchable for the first 0.5 s), then sprints at
  you — faster than a sprinter but very fragile. Same wave only; cleared waves stay
  cleared.
- **Fireballs** — shaman and warlord projectiles are now proper fireballs: white-hot
  core with a red rim, pulsing size, flickering flame trail, and an ember burst on
  impact. Each volley plays a synthesized "whoosh" (band-passed noise sweep + falling
  sine — generated in WebAudio, no samples).
- **Boss armor** — Gharok now enters with a steel armor plate shown as a thin grey
  bar under his health bar. While it holds, he takes only 50% health damage and hits
  chip the plate instead — it visibly cracks at 75/50/25%. Shatter it and he takes
  full damage but moves 18% faster (enraged).
- **Fence Grid Uplink** — a new field-lab upgrade path for your buildable barricades:
  Tier 1 is the stock energy fence, **Tier 2 (150 ⬡)** adds reinforced steel posts and
  slows enemies grinding on any fence by 45%, **Tier 3 (400 ⬡)** electrifies fences,
  zapping enemies in contact (6 + wave/2 damage per second, with arc effects). The
  tier is part of the auto-save.

### New in Release 2.6 (Update 1 — UI/HUD quality)

- **Notification-bar / safe-area fixes** — the top HUD (health/aether bars, wave/cores/
  kills counter bar, learning-engine panel, quest tracker) now starts below the phone's
  status bar (`env(safe-area-inset-top)`), and the counter bar sits slightly lower by
  default. Because many Android webviews report no inset, a new **HUD top offset**
  setting (0/16/32/48 px) lets you push the whole top HUD down manually; the skill-tree
  header tracks it too.
- **Per-button layout editor** — EDIT LAYOUT now drags **every control individually**:
  each action button (FIRE, BEAM, NOVA, DASH, GRENADE, ASCEND, BUILD), the TALK /
  SKILLS / MENU buttons, and the joystick zone. Old whole-clump layouts from ≤2.5
  still load unchanged; RESET restores defaults; positions are clamped on-screen and
  survive control-size changes.
- **Button styles** — new setting with three looks for the touch controls:
  **Classic**, **Neon** (bright borders + glow), and **Minimal** (thin, low-opacity).
- **Vibration** — haptic feedback (with an on/off toggle, default on for touch
  devices): light tap on nova/melee, a pulse when you take damage (stronger for boss
  hits), grenade/beam rumbles, and celebration patterns on wave clear and level-up.
  Rifle shots deliberately don't buzz.

### New in Release 2

- **Supply caches** — a glowing treasure chest drops after every cleared wave with a
  10-second looting window: cores, health packs, a grenade restock, and rare jackpots
  (+1 skill point or a full aether surge).
- **Riftsteel Armor** — a new gear line (−7% damage taken per plate, up to −35%);
  your pauldron turns steel at 3+ plates.
- **Buildable barricades** (`B` / BUILD button, 3 cores each, max 8) — energy fences
  that enemies cannot pass and must smash down (they have HP and get attacked). Step
  out through your fence line and you emit a free **repel blast** that knocks the mob
  away, so you're never mauled leaving your safe space.
- **Two new NPCs** — **Merchant Vex** runs a trading post in Northreach Fort
  (mid-run heals, restocks, aether flasks, armor plates for cores) and **Scout Mira**
  in the Ashen Reach shares frontier lore chapter by chapter (first visit pays 10 cores).
- **Duskmere Marsh** — the world grew to 3600×3600 with a fourth region: still-water
  pools, swaying reeds, lily pads, and dead trees. More decor everywhere (1,400 items).
- **Readability pass** — all combat text is outlined, NPC name tags and markers pop,
  cleaner quest/dialogue layout.

### New in Release 3

- **Auto-save after every wave** — your run (wave, cores, XP/level, skill points &
  ranks, gear, quest and story progress) is written to device storage the moment a
  wave is cleared. A **CONTINUE** button appears on the title screen whenever a save
  exists; resuming drops you back at the between-wave shop.
- **Save-anywhere button** — open the pause menu (`P` / `Esc` / ⚙ MENU) and hit
  **💾 SAVE GAME** mid-fight. Resuming replays the current wave from its start.
- **Settings / pause menu** — RESUME, SAVE GAME, toggles for **screen shake** and
  **damage numbers** (remembered between sessions), RESTART RUN, and
  SAVE & QUIT TO TITLE. Opening it fully pauses the game, even in the shop.
- **Screen auto-fit** — every menu (title, shop, skill tree, vendor, settings,
  game-over) now centers when it fits and scrolls when it doesn't, with notch/safe-area
  padding, so nothing gets cut off on any phone screen.

### New in Release 6

- **Channel-aware updates** — the GitHub auto-update banner is now gated by a
  distribution channel (`UPDATE_CHANNEL` in `game.js`, driven by
  `window.TR_CHANNEL` in `index.html`). Only the **github** channel (sideloaded
  APK / web demo) checks GitHub releases and shows the banner. The Google Play
  build is stamped with the **play** channel at build time and never offers
  out-of-store updates (Play policy) — Play handles its own updates.
  `build-all.ps1` builds both artifacts and verifies the channel baked into each
  one; `node test-channel.js` unit-tests the gate.

### New in Release 4

- **Auto-update checker** — on launch the app pings GitHub for the latest release; if
  a newer version exists, a dismissible banner appears on the title screen with a
  tap-to-download link to the release page. Sideloaded APKs stay up to date without a
  store; Play Store builds will auto-update through the store instead.
- **Controls layout editor** — **✥ EDIT LAYOUT** in the pause menu lets you drag every
  touch control (joystick and buttons) wherever you want, with a controls-size option
  (small/normal/large); your layout is saved between sessions.
- **Region name over the boss bar** — the current zone name is shown above the boss
  health bar so you always know where the fight is happening.

## Building the APK

The game is a static web app, so wrap it with [Capacitor](https://capacitorjs.com):

```bash
cd temporal-rift
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Temporal Rift" com.yourname.temporalrift --web-dir .
npx cap add android
npx cap sync
npx cap open android    # opens Android Studio
```

In Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**. The debug APK
lands in `android/app/build/outputs/apk/debug/`. For the Play Store, generate a signed
release build (Build → Generate Signed App Bundle) with your own keystore.

Recommended extras before shipping: lock orientation to landscape in
`android/app/src/main/AndroidManifest.xml` (`android:screenOrientation="landscape"`),
and set your icon/splash with `npx @capacitor/assets generate`.

## Copyright rules (why the names changed)

You cannot ship an APK using Dragon Ball, Halo, Call of Duty, or Skyrim characters,
names, attacks, logos, music, or recognizable designs — stores will pull it and the
rights holders (Toei/Shueisha, Microsoft, Activision, Bethesda) can pursue damages.
**Game mechanics, however, are not copyrightable.** So this project keeps the
mechanics you wanted and renames every expression of them as original IP:

| Inspired by | Shipped as |
|---|---|
| Saiyan hero, ki, Kamehameha, Super Saiyan | Riftborn Vanguard, aether, Nova Beam, Ascended/Storm Ascendant forms |
| Plasma rifle, energy grenades, cover combat | Pulse rifle, energy grenades, cover combat (mechanics ≠ IP) |
| Zombie waves, mystery-box economy | Rift-horde waves, energy-core field lab |
| Skyrim holds, draugr, quest NPCs, skill trees | Northreach Fort, husks/grave shamans, Bramm's quest line, Vanguard tree |

Everything visual is drawn procedurally in code — no ripped sprites, sounds, or fonts.

---

## The fixed prompt (v2 design brief)

The original prompt mixed pitch language with mechanics and named copyrighted IP.
Here is the tightened, buildable version:

> ### Temporal Rift: Ashen Vanguard — mobile action-RPG design brief
>
> **Elevator pitch.** A mobile-first, wave-survival action RPG where a rift-touched
> warrior blends martial energy arts with sci-fi gunplay across fused fantasy /
> sci-fi / plague-land zones. An enemy "learning engine" studies the player's habits
> and punishes repetition. Original IP throughout — *inspired by* the progression of
> action-RPGs, the gunfeel of arena shooters, wave survival, and open-world quest
> design, without using any protected names or designs.
>
> **Pillars.**
> 1. *Hybrid combat feel* — every fight invites mixing energy arts and firearms.
> 2. *Adaptive pressure* — repeating one tactic gets measurably worse; diversity is the meta.
> 3. *Earned power* — transformations, skill points, and gear are paid for with risk.
> 4. *A place, not a menu* — quests, NPCs, and named regions make the arena feel like a world.
>
> **Core loop (60–90 s).** Fight a night wave → loot cores in danger zones → turn in
> quests / spend cores and skill points → face a harder, adapted wave.
>
> **Combat.** Energy: chargeable beam, melee nova, dash, drain-over-time transformations.
> Tech: pulse rifle, grenades; hard cover blocks projectiles. Touch: virtual joystick +
> hold-buttons + auto-aim; desktop: WASD + mouse.
>
> **Learning engine (spelled out).** Per-category damage tallies;
> `resistance = clamp((share − 0.25) × 1.1, 0, 0.6)`, decaying ~18%/wave; spawn points
> biased toward the player's tracked lingering position. Both surfaced in the HUD.
>
> **RPG layer.** XP → levels → skill points → 3-branch tree (offense / energy /
> survival) with rank gates and one capstone form. Cores → timed inter-wave gear shop.
> One NPC quest-giver drives a 6-beat story with chapter cards; final quest = win state
> (wave 15), then endless mode.
>
> **Enemies.** Shambling husks, fast sprinters, ranged shamans, heavy ork ravagers,
> and a summoning ork warlord every 5th wave with a boss bar.
>
> **Mobile/ship constraints.** Single static web bundle wrapped with Capacitor for
> Android; procedural art only (no licensed assets); 60 fps target on mid-range phones;
> landscape layout; all UI reachable by thumbs.
>
> **v2 scope cuts.** Vehicles, co-op, procedural rift dungeons, cosmetics — only after
> the loop proves fun.

Key fixes vs. the original prompt: original IP replaces copyrighted names (required to
ship), "reinforcement learning" became a concrete resistance formula, Skyrim's
influence became concrete systems (quests, skill tree, named regions, NPC), mobile
requirements became explicit constraints, and unbuildable v1 scope was cut into a v2 list.

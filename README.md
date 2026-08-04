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
| `P` | — | Pause |

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

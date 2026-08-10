# Unit size lock (v2.13.2)

**Do not enlarge or shrink collision radii or draw scales** without an explicit size-pass decision.
In-engine animation (limb swing / windup / strike / hurt lean) must stay additive on top of these footprints.
**Ashen Husk / Sprinter / Bulwark / Shaman (2.13.2 size pass):** scale **toward ravager** (`r=24`, figure `s=1.7`, visual ~`drawH=61`) so sprite foes feel nearly as big as ravager ? still **below Gharok** `drawH=228`.
**Skeleton:** **UNCHANGED** from 2.13.1 (`r=12`, `drawH=38`, `s=1.055`) ? do not bump.

## Collision radii (`r`)

| Unit | `r` | Notes |
|------|-----|--------|
| Player | **15** | |
| Husk | **21** | zombie shambler ? SIZE LOCK (2.13.2; was 15) toward ravager 24 |
| Sprinter | **18** | fast ghoul ? SIZE LOCK (2.13.2; was 12) |
| Shaman | **20** | ranged caster ? SIZE LOCK (2.13.2; was 14) |
| Ravager | **24** live / **36** when flag ON | orc brute -- live procedural `r=24`; articulation+barks coded; `RAVAGER_SPRITE_ENABLED=false` until ship batch; flag ON -> `RAVAGER_R=36` (between bulwark 23 and Gharok 54) |
| Warlord (Gharok) | **54** | boss ? locked |
| Bulwark | **23** | fused husks / tank ? SIZE LOCK (2.13.2; was 22); near ravager, still << Gharok |
| Skeleton | **12** | grave emergers ? SIZE LOCK (2.13.1; **unchanged in 2.13.2**) |
| Companion (rover) | **11** | SIZE LOCK � sheets + Continuity flag ON; do not bump |
| Companion (warden) | **13** | SIZE LOCK � sheets + Continuity flag ON; do not bump |
| Companion (scout/sentinel) | **13** | Scout sheets drafted flag OFF; Sentinel later; do not bump |
| Ashen Laborer | **11** | |
| Militia spear/bow | **12** | `MILITIA_TYPES.*.r` |
| Aether Colossus | **54** | ~Gharok scale |
| NPC (Bramm/Vex/Mira/Kael) | **14** | |

## Draw scales (visual only ? collision unchanged unless noted)

| Unit | Draw scale | Notes |
|------|------------|--------|
| Gharok sprite | `drawH = 228` | idle/walk/windup PNG frame-swap (boss only) |
| Gharok procedural fallback | `s = 3.2` | |
| Ashen Husk sprite | `drawH = 56` | was 42 ? toward ravager ~61; **not** boss |
| Sprinter sprite | `drawH = 56 * 0.87` (~48.7) | was 42�0.87; same husk sheets |
| Ashen Skeleton sprite | `drawH = 38` | **UNCHANGED** from 2.13.1 |
| Ashen Bulwark sprite | `drawH = 62` | was 58 ? near ravager; **not** Gharok 228 |
| Ashen Shaman sprite | `drawH = 56` | was 42 ? matches husk toward ravager |
| Figure `H` | `36 * s` | shared humanoid rig |
| Husk / shaman figure `s` | **1.56** | was 1.17 |
| Sprinter `s` | **1.35** | was 1.02 |
| Ravager `s` | **1.7** live / **~2.78** when flag ON | `RAVAGER_FIGURE_S`; sprite `drawH=100` when enabled |
| Bulwark `s` | **1.72** | was 1.61 |
| Skeleton `s` | **1.055** | **UNCHANGED** from 2.13.1 |
| Militia figure `s` | **0.78** | matches prior box height |
| Colossus silhouette `H` | **210** | |
| Ashen Rover sprite | `drawH = 26` | companion dog � **not** husk 56 / Gharok 228; collision `r=11` unchanged; `ROVER_SPRITE_ENABLED=true` Continuity |
| Ashen Warden sprite | `drawH = 48` | tank companion � procedural `H?45` (`s=1.25`) + pad; collision `r=13` unchanged; `WARDEN_SPRITE_ENABLED=true` Continuity |
| Ashen Scout sprite | `drawH = 38` | lighter archer companion � procedural `H=36` (`s=1.0`) + pad; collision `r=13` unchanged; `SCOUT_SPRITE_ENABLED=false` (art draft; articulate later) |

## Animation path (v2.13)

- **Primary:** in-engine additive poses (walk plant/squash, opposite-limb swing, swipe windup?strike, hurt lean).
- **Gharok:** existing `assets/gharok/{idle,walk,windup}.png` + bob/lean/strike arc; Pixelorama drop path optional later ? not required. Boss movement shipped 2.12.x ? left intact.
- **Ashen Husk (2.12.1 / size 2.13.2):** `assets/zombie/{idle,walk,windup}.png` on husk/sprinter at `drawH=56*s`; procedural fallback. See `docs/zombie-art-plan.md`.
- **Ashen Skeleton (2.13.0 APPLIED / size 2.13.1 lock):** `assets/skeleton/{idle,walk,windup}.png` at `drawH=38`; `SKELETON_SPRITE_ENABLED=true`. See `docs/skeleton-art-plan.md`. **Not resized in 2.13.2.**
- **Ashen Bulwark (2.13.0 APPLIED / size 2.13.2):** `assets/bulwark/{idle,walk,windup}.png` at `drawH=62`; `BULWARK_SPRITE_ENABLED=true`. See `docs/bulwark-art-plan.md`.
- **Ashen Shaman (2.13.0 APPLIED / size 2.13.2):** `assets/shaman/{idle,walk,windup}.png` at `drawH=56`; `SHAMAN_SPRITE_ENABLED=true`. See `docs/shaman-art-plan.md`.
- **Enemy barks (2.13.0):** synth grunts + original orc lines via `sfx` bark voice; respects mute SFX.
- **Death:** particle/decal burst (no lingering corpse sheet yet).
- **Ashen Ravager (articulation coded, flag OFF 2026-08-09):** `assets/ravager/{idle,walk,windup}.png` + idle<->walk<->windup gait / plant squash + distinct deep cyclops barks coded on master; `RAVAGER_SPRITE_ENABLED=false` (live procedural `r=24`/`s=1.7`). Flip flag -> `r=36`, `drawH=100`, `s~2.78` -- between bulwark (`23`/`62`) and Gharok (`54`/`228`). Store ship deferred with stronghold batch. See `docs/ravager-art-plan.md`.
- **Rift Keep (art drafted, flag OFF 2026-08-09):** `assets/buildings/keep/{idle,damaged}.png`; `KEEP_SPRITE_ENABLED=false` (live procedural keep bw42/bh40/~56 tall). Flip flag -> `drawH=72`, collision `r=54` unchanged (keep-sized, not Gharok-huge). See `docs/keep-art-plan.md`.
- **Timber/Supply Camp (art drafted, flags OFF 2026-08-09):** `assets/buildings/camp/{idle,damaged,timber-idle,timber-damaged,supply-idle,supply-damaged}.png`; `CAMP_SPRITE_ENABLED`/`TIMBER_SPRITE_ENABLED`/`SUPPLY_SPRITE_ENABLED=false` (live procedural bw32/bh28). Flip -> timber `drawH=50` r=40 / supply `drawH=46` r=36 (camp-tall, << Keep 72). See `docs/camp-art-plan.md`.
- **Muster Hall (art drafted, flag OFF 2026-08-09):** `assets/buildings/hall/{idle,damaged}.png`; `HALL_SPRITE_ENABLED=false` (live procedural muster). Flip flag -> `drawH=60`, collision `r=46` unchanged (between camp ~50 and Keep 72; training hall, not cathedral). See `docs/hall-art-plan.md`.
- **Gold Vault (mine-mouth remesh, flag OFF 2026-08-09):** `assets/buildings/vault/{idle,damaged}.png`; hillside bunker / timber-framed entrance + aether-gold glow (not freestanding stronghouse). `VAULT_SPRITE_ENABLED=false` (live procedural golddepot). Flip flag -> `drawH=52`, collision `r=40` unchanged (stockier than hall 60). See `docs/vault-art-plan.md`.
- **Aether Pit (art drafted, flag OFF 2026-08-09):** `assets/buildings/pit/{idle,damaged}.png`; stone/earth/quarry dug crater + cyan?teal / purple aether glow in hole (lamp ref = glow mood only). `PIT_SPRITE_ENABLED=false` (live procedural aetherpit). Flip flag -> `drawH=48`, collision `r=38` unchanged (between supply 46 and vault 52). See `docs/pit-art-plan.md`.
- **Ashen Rover / Rift Hound (articulation+barks ON Continuity 2026-08-09):** `assets/allies/rover/{idle,walk,attack,death}.png`; gunmetal cyber-dog + aether cyan accents. `ROVER_SPRITE_ENABLED=true` for master Continuity testing (store ship deferred). Collision `r=11` / `drawH=26` locked. Idle?walk gait + attack swipe + death + plant squash; aether-hound barks. See `docs/rover-art-plan.md`.
- **Ashen Warden / Rift Warden (articulation+barks ON Continuity 2026-08-09):** `assets/allies/warden/{idle,walk,attack,death}.png`; weathered yellow/ochre knight-robotics armor + cyan/violet aether accents. `WARDEN_SPRITE_ENABLED=true` for master Continuity testing (store ship deferred). Collision `r=13` / `drawH=48` locked. Idle?walk gait + attack swipe + death + heavy plant squash; armored-robot guardian barks. See `docs/warden-art-plan.md`.
- **Ashen Scout / Rift Scout (art drafted, flag OFF 2026-08-10):** `assets/allies/scout/{idle,walk,attack,death}.png`; bright green plates + purple aether; slim knight-robotics archer (bow silhouette — not Warden yellow tank; not Fallout/Destiny IP). `SCOUT_SPRITE_ENABLED=false` (live procedural `s=1.0`); soft-wire stub only — **no articulate/barks yet**. Collision `r=13` / `drawH=38` locked. Desktop `TemporalRift-Scout-Sprites`. See `docs/scout-art-plan.md`.

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
| Ravager | **24** live / **36** pending apply | orc brute ù live procedural `r=24`; Ashen Ravager sheets drafted with planned `r=36` (between bulwark 23 and Gharok 54); `RAVAGER_SPRITE_ENABLED=false` |
| Warlord (Gharok) | **54** | boss ? locked |
| Bulwark | **23** | fused husks / tank ? SIZE LOCK (2.13.2; was 22); near ravager, still << Gharok |
| Skeleton | **12** | grave emergers ? SIZE LOCK (2.13.1; **unchanged in 2.13.2**) |
| Companion (rover) | **11** | |
| Companion (warden/scout/sentinel) | **13** | |
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
| Sprinter sprite | `drawH = 56 * 0.87` (~48.7) | was 42ù0.87; same husk sheets |
| Ashen Skeleton sprite | `drawH = 38` | **UNCHANGED** from 2.13.1 |
| Ashen Bulwark sprite | `drawH = 62` | was 58 ? near ravager; **not** Gharok 228 |
| Ashen Shaman sprite | `drawH = 56` | was 42 ? matches husk toward ravager |
| Figure `H` | `36 * s` | shared humanoid rig |
| Husk / shaman figure `s` | **1.56** | was 1.17 |
| Sprinter `s` | **1.35** | was 1.02 |
| Ravager `s` | **1.7** live / **?2.78** pending | live procedural; planned with sprite `drawH=100` |
| Bulwark `s` | **1.72** | was 1.61 |
| Skeleton `s` | **1.055** | **UNCHANGED** from 2.13.1 |
| Militia figure `s` | **0.78** | matches prior box height |
| Colossus silhouette `H` | **210** | |

## Animation path (v2.13)

- **Primary:** in-engine additive poses (walk plant/squash, opposite-limb swing, swipe windup?strike, hurt lean).
- **Gharok:** existing `assets/gharok/{idle,walk,windup}.png` + bob/lean/strike arc; Pixelorama drop path optional later ? not required. Boss movement shipped 2.12.x ? left intact.
- **Ashen Husk (2.12.1 / size 2.13.2):** `assets/zombie/{idle,walk,windup}.png` on husk/sprinter at `drawH=56*s`; procedural fallback. See `docs/zombie-art-plan.md`.
- **Ashen Skeleton (2.13.0 APPLIED / size 2.13.1 lock):** `assets/skeleton/{idle,walk,windup}.png` at `drawH=38`; `SKELETON_SPRITE_ENABLED=true`. See `docs/skeleton-art-plan.md`. **Not resized in 2.13.2.**
- **Ashen Bulwark (2.13.0 APPLIED / size 2.13.2):** `assets/bulwark/{idle,walk,windup}.png` at `drawH=62`; `BULWARK_SPRITE_ENABLED=true`. See `docs/bulwark-art-plan.md`.
- **Ashen Shaman (2.13.0 APPLIED / size 2.13.2):** `assets/shaman/{idle,walk,windup}.png` at `drawH=56`; `SHAMAN_SPRITE_ENABLED=true`. See `docs/shaman-art-plan.md`.
- **Enemy barks (2.13.0):** synth grunts + original orc lines via `sfx` bark voice; respects mute SFX.
- **Death:** particle/decal burst (no lingering corpse sheet yet).
- **Ashen Ravager (DEFERRED 2026-08-09):** `assets/ravager/{idle,walk,windup}.png` drafted; `RAVAGER_SPRITE_ENABLED=false` (live procedural). Planned apply: `r=36`, `drawH=100`, `s?2.78` ó between bulwark (`23`/`62`) and Gharok (`54`/`228`). See `docs/ravager-art-plan.md`.

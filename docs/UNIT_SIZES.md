# Unit size lock (v2.13.0)

**Do not enlarge or shrink collision radii or draw scales** without an explicit size-pass decision.
In-engine animation (limb swing / windup / strike / hurt lean) must stay additive on top of these footprints.
**Ashen Husk sprite art (2.12.1) upgrades detail only ? keep husk `r=14` and `drawH=36`, never Gharok `drawH=228`.**
**Ashen Skeleton sprites APPLIED (2.13.0)** ? collision `r=10`, sprite `drawH=32.4` (36×0.9).
**Ashen Bulwark sprites APPLIED (2.13.0)** ? collision `r=20`, sprite `drawH=52.2` (36×1.45).
**Ashen Shaman sprites APPLIED (2.13.0)** ? collision `r=13`, sprite `drawH=36` (36×1.0 husk baseline).

## Collision radii (`r`)

| Unit | `r` | Notes |
|------|-----|--------|
| Player | **15** | |
| Husk | **14** | zombie shambler ? SIZE LOCK (sprite art must not enlarge) |
| Sprinter | **11** | fast ghoul |
| Shaman | **13** | ranged caster ? SIZE LOCK (sprite art must not enlarge) |
| Ravager | **24** | orc brute |
| Warlord (Gharok) | **54** | boss ? locked |
| Bulwark | **20** | fused husks ? SIZE LOCK (sprite art must not enlarge to boss) |
| Skeleton | **10** | grave emergers ? SIZE LOCK (sprite art must not enlarge) |
| Companion (rover) | **11** | |
| Companion (warden/scout/sentinel) | **13** | |
| Ashen Laborer | **11** | |
| Militia spear/bow | **12** | `MILITIA_TYPES.*.r` |
| Aether Colossus | **54** | ~Gharok scale |
| NPC (Bramm/Vex/Mira/Kael) | **14** | |

## Draw scales (visual only ? collision unchanged)

| Unit | Draw scale | Notes |
|------|------------|--------|
| Gharok sprite | `drawH = 228` | idle/walk/windup PNG frame-swap (boss only) |
| Gharok procedural fallback | `s = 3.2` | |
| Ashen Husk sprite | `drawH = 36` | `assets/zombie/*.png` ? matches figure `H`; **not** boss scale |
| Sprinter sprite | `drawH = 36 * 0.85` | same sheets, scaled |
| Ashen Skeleton sprite | `drawH = 32.4` | `assets/skeleton/*.png` ? `36 * 0.9`; smaller than husk; **APPLIED 2.13.0** |
| Ashen Bulwark sprite | `drawH = 52.2` | `assets/bulwark/*.png` ? `36 * 1.45`; tank > husk; **not** Gharok `228`; **APPLIED 2.13.0** |
| Ashen Shaman sprite | `drawH = 36` | `assets/shaman/*.png` ? `36 * 1.0` husk baseline; **APPLIED 2.13.0** |
| Figure `H` | `36 * s` | shared humanoid rig |
| Husk / shaman figure `s` | **1.0** | procedural fallback / shaman sprite drawH |
| Sprinter `s` | **0.85** | |
| Ravager `s` | **1.7** | |
| Bulwark `s` | **1.45** | matches sprite `drawH` |
| Skeleton `s` | **0.9** | |
| Militia figure `s` | **0.78** | matches prior box height |
| Colossus silhouette `H` | **210** | |

## Animation path (v2.13)

- **Primary:** in-engine additive poses (walk plant/squash, opposite-limb swing, swipe windup?strike, hurt lean).
- **Gharok:** existing `assets/gharok/{idle,walk,windup}.png` + bob/lean/strike arc; Pixelorama drop path optional later ? not required. Boss movement shipped 2.12.x ? left intact.
- **Ashen Husk (2.12.1):** `assets/zombie/{idle,walk,windup}.png` on husk/sprinter at `drawH=36*s`; procedural fallback. See `docs/zombie-art-plan.md`.
- **Ashen Skeleton (2.13.0 APPLIED):** `assets/skeleton/{idle,walk,windup}.png` at `drawH=32.4`; `SKELETON_SPRITE_ENABLED=true`. See `docs/skeleton-art-plan.md`.
- **Ashen Bulwark (2.13.0 APPLIED):** `assets/bulwark/{idle,walk,windup}.png` at `drawH=52.2`; `BULWARK_SPRITE_ENABLED=true`. See `docs/bulwark-art-plan.md`.
- **Ashen Shaman (2.13.0 APPLIED):** `assets/shaman/{idle,walk,windup}.png` at `drawH=36`; `SHAMAN_SPRITE_ENABLED=true`. See `docs/shaman-art-plan.md`.
- **Enemy barks (2.13.0):** synth grunts + original orc lines via `sfx` bark voice; respects mute SFX.
- **Death:** particle/decal burst (no lingering corpse sheet yet).
- **Gap:** Ashen Ravager still procedural (no sheet yet).

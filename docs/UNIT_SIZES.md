# Unit size lock (v2.12.0)

**Do not enlarge or shrink collision radii or draw scales** without an explicit size-pass decision.
In-engine animation (limb swing / windup / strike / hurt lean) must stay additive on top of these footprints.

## Collision radii (`r`)

| Unit | `r` | Notes |
|------|-----|--------|
| Player | **15** | |
| Husk | **14** | zombie shambler |
| Sprinter | **11** | fast ghoul |
| Shaman | **13** | ranged caster |
| Ravager | **24** | orc brute |
| Warlord (Gharok) | **54** | boss — locked |
| Bulwark | **20** | fused husks |
| Skeleton | **10** | grave emergers |
| Companion (rover) | **11** | |
| Companion (warden/scout/sentinel) | **13** | |
| Ashen Laborer | **11** | |
| Militia spear/bow | **12** | `MILITIA_TYPES.*.r` |
| Aether Colossus | **54** | ~Gharok scale |
| NPC (Bramm/Vex/Mira/Kael) | **14** | |

## Draw scales (visual only — collision unchanged)

| Unit | Draw scale | Notes |
|------|------------|--------|
| Gharok sprite | `drawH = 228` | idle/walk/windup PNG frame-swap |
| Gharok procedural fallback | `s = 3.2` | |
| Figure `H` | `36 * s` | shared humanoid rig |
| Husk / shaman figure `s` | **1.0** | |
| Sprinter `s` | **0.85** | |
| Ravager `s` | **1.7** | |
| Bulwark `s` | **1.45** | |
| Skeleton `s` | **0.9** | |
| Militia figure `s` | **0.78** | matches prior box height |
| Colossus silhouette `H` | **210** | |

## Animation path (v2.12)

- **Primary:** in-engine additive poses (walk plant/squash, opposite-limb swing, swipe windup→strike, hurt lean).
- **Gharok:** existing `assets/gharok/{idle,walk,windup}.png` + bob/lean/strike arc; Pixelorama drop path optional later — not required.
- **Death:** particle/decal burst (no lingering corpse sheet yet).

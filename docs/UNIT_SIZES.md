# Unit size lock (v2.13.1)

**Do not enlarge or shrink collision radii or draw scales** without an explicit size-pass decision.
In-engine animation (limb swing / windup / strike / hurt lean) must stay additive on top of these footprints.
**Ashen Husk / Sprinter / Skeleton / Bulwark / Shaman (2.13.1 size pass):** modest bump so sprite foes read slightly larger than the player (`r?15`, figure `s?1.06`) ? **never** Gharok `drawH=228`.

## Collision radii (`r`)

| Unit | `r` | Notes |
|------|-----|--------|
| Player | **15** | |
| Husk | **15** | zombie shambler ? SIZE LOCK (2.13.1; was 14) |
| Sprinter | **12** | fast ghoul ? SIZE LOCK (2.13.1; was 11) |
| Shaman | **14** | ranged caster ? SIZE LOCK (2.13.1; was 13) |
| Ravager | **24** | orc brute |
| Warlord (Gharok) | **54** | boss ? locked |
| Bulwark | **22** | fused husks / tank ? SIZE LOCK (2.13.1; was 20); still << Gharok |
| Skeleton | **12** | grave emergers ? SIZE LOCK (2.13.1; was 10) |
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
| Ashen Husk sprite | `drawH = 42` | was 36 ? slight > player visual; **not** boss |
| Sprinter sprite | `drawH = 42 * 0.87` (~36.5) | was 36×0.85; same husk sheets |
| Ashen Skeleton sprite | `drawH = 38` | was 32.4 ? **APPLIED 2.13.1** |
| Ashen Bulwark sprite | `drawH = 58` | was 52.2 ? tank > husk; **not** Gharok 228 |
| Ashen Shaman sprite | `drawH = 42` | was 36 ? matches husk baseline |
| Figure `H` | `36 * s` | shared humanoid rig |
| Husk / shaman figure `s` | **1.17** | was 1.0 |
| Sprinter `s` | **1.02** | was 0.85 |
| Ravager `s` | **1.7** | |
| Bulwark `s` | **1.61** | was 1.45 |
| Skeleton `s` | **1.055** | was 0.9 |
| Militia figure `s` | **0.78** | matches prior box height |
| Colossus silhouette `H` | **210** | |

## Animation path (v2.13)

- **Primary:** in-engine additive poses (walk plant/squash, opposite-limb swing, swipe windup?strike, hurt lean).
- **Gharok:** existing `assets/gharok/{idle,walk,windup}.png` + bob/lean/strike arc; Pixelorama drop path optional later ? not required. Boss movement shipped 2.12.x ? left intact.
- **Ashen Husk (2.12.1 / size 2.13.1):** `assets/zombie/{idle,walk,windup}.png` on husk/sprinter at `drawH=42*s`; procedural fallback. See `docs/zombie-art-plan.md`.
- **Ashen Skeleton (2.13.0 APPLIED / size 2.13.1):** `assets/skeleton/{idle,walk,windup}.png` at `drawH=38`; `SKELETON_SPRITE_ENABLED=true`. See `docs/skeleton-art-plan.md`.
- **Ashen Bulwark (2.13.0 APPLIED / size 2.13.1):** `assets/bulwark/{idle,walk,windup}.png` at `drawH=58`; `BULWARK_SPRITE_ENABLED=true`. See `docs/bulwark-art-plan.md`.
- **Ashen Shaman (2.13.0 APPLIED / size 2.13.1):** `assets/shaman/{idle,walk,windup}.png` at `drawH=42`; `SHAMAN_SPRITE_ENABLED=true`. See `docs/shaman-art-plan.md`.
- **Enemy barks (2.13.0):** synth grunts + original orc lines via `sfx` bark voice; respects mute SFX.
- **Death:** particle/decal burst (no lingering corpse sheet yet).
- **Gap:** Ashen Ravager still procedural (no sheet yet).

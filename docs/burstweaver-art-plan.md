# Ashen Burstweaver art plan (Step 7.4)

Original Temporal Rift **Ashen Burstweaver** (aka **Riftweaver** / Ashen Webburst) ?
exterior-only exploding rift-spider. Same Gharok / husk / ravager **art quality / process**.
**Not** Minecraft creeper IP. **Not** photo cutouts.

**Status (2026-08-31):** **7.4D DONE** ? balance polish (cadence / swell telegraph / stack / explode /
HUD cues). `BURSTWEAVER_SPRITE_ENABLED=true` / `EXTERIOR_SPIDER_ENABLED=true` (independently
togglable). **APP_VERSION 4.0.8** / vc**74** (no APK).

**4.1.1 survivability buff (2026-08-31 ? user: "too easy to kill"; kit stays 7.4D locked):**

| Field | 4.1.0 | 4.1.1 | Notes |
|-------|-------|-------|-------|
| Base HP | 120 | **290** | ?`hpScale()` as before; explode/web/bite damage **unchanged** |
| Knockback | non-boss ladder `1+floor(wave/20)` | **HEAVY: ladder+1 hits, 0.6? shove** | r=42 large ? rifle ticks can no longer perma-stagger it |
| Max live | 1 | **1; 2 at wave ? 20** (`burstweaverMaxLive()`) | perf headroom from 4.1.1 freeze fixes |
| Leash | ? | despawns after **20s** if player hides in legacy core untouched | frees the live cap; wave-clear no longer waits on it (no loot/credit) |

## Mini-steps

| Step | Scope | Status |
|------|-------|--------|
| **7.4A** | Look: meshed original sprites (idle / walk / threat / swell), size locks, soft-wire flags OFF ? no spawn/combat AI | **Done** |
| **7.4B** | Movement articulation + multi-dir if needed; exterior-only spawn stub (no attacks yet) | **Done** |
| **7.4C** | Attacks: **Web** (slow + some dmg), **Bite** (poison 10s draining energy + health), **Explode** (friendly-fire AOE ? hurts player/allies **and** enemies nearby); swell telegraph; exterior-only full AI | **Done** |
| **7.4D** | Balance polish before 7.5 | **Done (4.0.8 / vc74)** |

## Size lock (draft ? 7.4A)

| Field | Value | Notes |
|-------|-------|--------|
| Collision `r` | **42** | Between Ravager **36** and Gharok **54** |
| Sprite `drawH` | **115** | Mid of plan band **110?120** |
| On-screen | large exterior threat | << boss; > ravager |

Documented in `docs/UNIT_SIZES.md`. Do not bump without a size-pass.

## Assets (7.4A)

- `assets/burstweaver/idle.png`
- `assets/burstweaver/walk.png`
- `assets/burstweaver/threat.png` (threat / bite / aggro pose)
- `assets/burstweaver/swell.png` (explode telegraph ? abdomen swell + ash-light fissure)

Transparent 512?512. Process: `node scripts/process-burstweaver-sprites.mjs`
? www sync sheets only (no `_refs` / `_raw`).

## Soft-wire

| Flag | Gates | 7.4D default |
|------|-------|--------------|
| `BURSTWEAVER_SPRITE_ENABLED` | Sheet soft-load / idle-walk-threat-swell draw | **true** (independent) |
| `EXTERIOR_SPIDER_ENABLED` | Exterior spawn / chase / attacks | **true** (independent) |

`ETYPES.burstweaver` (`exteriorOnly: true`, bite melee **dmg=14**) is **not** in wave tables;
`spawnEnemy('burstweaver')` blocked; only `spawnBurstweaverAt` (rejects legacy).

## 7.4B spawn + movement

| Rule | Detail |
|------|--------|
| Helper | `spawnBurstweaverAt(x,y)` ? abort if `inLegacyWorld` |
| Cadence | `tickBurstweaverSpawn` **55?80s** (7.4D; was 48?72); max **1** live; player exterior or near visible hold |
| Chase | Default chase toward player; **turn-back** + snap if would enter legacy |
| Draw | idle-walk gait via `unitPickDirWalk`; threat/swell for 7.4C poses |
| Melee | Contact replaced by bite (7.4C); ETYPES dmg=14 on bite |

## 7.4C attacks (baseline) ? 7.4D finals

AI cycle: **approach ? web at range OR bite in melee ? swell telegraph ? explode (suicide)**.

| Attack | 7.4C (4.0.7) | **7.4D final (4.0.8)** | Notes |
|--------|--------------|------------------------|-------|
| **Web** | Range 270; CD 4.2s; dmg 9; slow?0.48 @ 2.8s | Range **270**; CD **4.5s**; dmg **9**; slow?**0.55** @ **2.5s** | Softer stack with poison |
| **Bite** | Melee; CD 3.2s; dmg 14; poison 10s @ 3.5 HP/s + 4.5 aether/s | Melee; CD **3.4s**; dmg **14**; poison **10s** @ **3.0** HP/s + **4.0** aether/s | Same duration; milder DPS |
| **Explode** | First CD 10?14s; trigger 175; swell 1.1?1.4s; r140; dmg 45+1.5w | First CD **12?16s**; trigger **165**; swell **1.35?1.75s** + **danger ring**; r**128**; dmg **42+1.5w** | Clearer telegraph; hold-friendlier radius |
| **Cancel** | Kill during swell ? BURST FIZZLE | **KEPT** | Rewards focus fire |
| **FF targets** | Player / allies / hold orange / enemies / structures | **KEPT** (verified) | Suicide on detonate |

### HUD cues (7.4D)

| Cue | Where |
|-----|--------|
| `WEBBED Xs` | `#debuffHud` under HP/aether bars + world tag above player |
| `ASH VENOM Xs` | `#debuffHud` + world tag above player |
| Swell danger ring | Growing fill + dashed full-radius ghost during `bwSwellT` |
| BURST FIZZLE | Floater on kill-during-swell (unchanged) |

Sheets: **threat.png** = bite/aggro; **swell.png** = explode telegraph (pulse scale).

## Design (original ? mesh of inspiration refs)

**Name:** Ashen Burstweaver

Meshed traits (inspiration only ? no Minecraft / stock cutouts):

1. **Spiny orb-weaver** ? crimson conical rim spikes on armored abdomen
2. **Cobalt tarantula** ? cobalt-blue mid-leg segments as charged accents
3. **Black/orange jumper** ? ember-orange abdomen burst-mark / honeycomb pores
4. **Threat rear** ? raised front legs + tusks/fangs for threat sheet
5. **Wolf-spider brood vibe** ? swell telegraph = living bomb / fissure glow
   (**not** a literal baby-spider swarm paint)
6. **Orc-spider hybrid miniature** ? fantasy TR lean: tusked cephalothorax on
   low arachnid body (not upright humanoid)

**Palette:** ashen charcoal / silver carapace ? crimson spikes ? cobalt legs ?
ember-orange + ash-violet swell glow.

**Strip:** Minecraft creeper naming/silhouette, photo cutouts, copyrighted IP.

## References

Under `assets/burstweaver/_refs/` (stripped from APK):

See `_refs/README.md`.

## Repo location (canonical)

`assets/burstweaver/` ? idle / walk / threat / swell (also synced to `www/assets/burstweaver/`).
Optional Desktop preview copy: `C:\Users\drpep\Desktop\TemporalRift-Burstweaver-Sprites\` (duplicate; safe to delete after confirming repo has files).

## Apply / next

1. **7.6** ? arc gate ? shipped **4.1.0** / vc76 (BETA + Play AAB)
2. **4.1.1** / vc77 ? survivability buff (hp 290, heavy knock, wave-20 dual-live, 20s legacy-hide leash) ? BETA
3. Optional later: BW storage B (`exteriorThreats[]`); harvest half-rate; decade-wave BW spawn; `walk-side` / `walk-back` sheets

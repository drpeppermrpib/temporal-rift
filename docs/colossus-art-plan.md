# Aether Colossus / Rift Titan art plan

Original Temporal Rift **Aether Colossus** (aka **Rift Titan**) sheets —
combiner ally ~Gharok scale. Soft-wire pipeline (same as companions / ravager).
**Not** a second Gharok; **not** Power Rangers Megazord / Optimus Prime / Autobot IP.

**Status (2026-08-11):** **Articulated + multi-dir ON Continuity.** Flag
`COLOSSUS_SPRITE_ENABLED=true`. Collision `r=54` / sprite `drawH=228` Gharok lock.
Procedural `drawColossus` remains fallback if sheets fail.
**Packaged BETA-3.1.2** / vc50 (`TemporalRift-BETA-3.1.2.apk`). **No Play.** Play/GitHub stay 2.13.2.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Collision `r` | **54** | ~Gharok scale — SIZE LOCK |
| Procedural silhouette `H` | **210** | Fallback only |
| Sprite `drawH` | **228** | Gharok lock — do not shrink/enlarge |
| On-screen | Gharok-tall rift titan | Same collision footprint |

Source PNGs are 512×512 transparent (same sheet resolution as Gharok) drawn at
`drawH=228`.

## Assets

- `assets/colossus/idle.png`
- `assets/colossus/walk.png`
- `assets/colossus/walk-side.png` (3-view; L/R via facing flip)
- `assets/colossus/walk-back.png`
- `assets/colossus/attack.png` (rift-shard greatsword strike + cyan/violet slash)
- `assets/colossus/death.png` (kneeling combiner unbind; core dimming)

Transparent background. Attack/death stay **front**. Side L/R via `facing` scale.
Process: `node scripts/process-colossus-sprites.mjs` (front frames) and
`node scripts/process-multidir-sprites.mjs colossus` (side/back).
www sync sheets only (no `_refs` / `_raw`).

## Articulation (ON)

| Pose | Trigger |
|------|---------|
| idle ↔ walk | half-cycle gait via `unitPickDirWalk` |
| walk-side / walk-back | `unitViewFromVel` while moving |
| attack | `swipeT` / windup rift-blade strike |
| death | `downed` (lingers on field — not deleted) |
| plant squash / bob / lean | **heavier than Warden** (squashY plant 0.125 vs Warden 0.085) |
| barks | `voice:'colossus'` — deep rift titan rumble (not orc/warden/scout) |

## Call out / call back + persist

Once merged, the titan is **yours** — no duration despawn.

| Control | Behavior |
|---------|----------|
| First C / ⚔ COLOSSUS | Merge (wood/gold/cores + 2 nearby allies) → unlock + deploy |
| C while out | **Recall** → docked (unlock kept; HP stored) |
| C while docked | **Call out** → deploy near player (free) |
| C while downed | Floater: hold Talk · 100 ⬡ |
| Hold Talk on body | Revive at 65% HP for **100 player cores** (⬡) — not squad cores, not aether |
| Wave end | Does **not** auto-revive (must pay orbs) |

Save: additive `town.colossus` `{ owned, docked, downed, hp, maxHp, x, y, facing }`.

## Strongest ally (stats)

Keep `r=54` / `drawH=228`. Buffs vs prior combiner (not Gharok one-shot):

| Stat | Before | After |
|------|--------|-------|
| HP | 820 | **1600** (Warden 340; Gharok enemy 950+300 armor) |
| Primary dmg | 28 + wave×1.2 | **44 + wave×1.5** (wave 1 ≈ 45.5) |
| Splash | 10 / r=110 / kb=80 | **20 / r=145 / kb=150** |
| Knockback | 220 | **380** |
| Atk CD | 1.05s | **0.92s** |
| Speed | 95 | **88** (heavy plant) |
| Duration | 48s fade-delete | **none** — recall or downed |

## Design (original — mesh of combiner-bulk refs)

**Name:** Aether Colossus / Rift Titan

Meshed traits (inspiration only — **not** Megazord / Optimus / Autobot / Super Sentai IP):

1. **Combining-mecha bulk** — layered modular plates that read as assembled modules,
   all the same ashen design language (not distinct animal/vehicle zords)
2. **Blocky titan silhouette** — wide square shoulders, barrel torso, pillar legs,
   small recessed helm
3. **Palette:** ashen **gunmetal** plates + **rift-ochre** trim/weathering
4. **Aether:** cyan/violet chest **core** (hex/octagonal iris), visor slit, joint vents —
   matches TR, **not** primary red/blue/yellow Sentai
5. **Weapon:** original **rift-shard greatsword** (dark slab + cyan/violet energy edge) —
   not MMPR/dragon dagger
6. Matching mechanical pillar legs + shovel-feet — **not** dinosaur/tiger/triceratops
   clones, **not** truck wheels / exhaust / windshield chest
7. Attack: two-hand aether-blade strike with slash telegraph; death: kneeling unbind,
   plates separating, core dimming

**Strip from sheets:** Autobot logos, Power Rangers/Megazord likeness, dinosaur-leg
clones, copyrighted names, Sentai primary palette.

## References (inspiration only)

Under `assets/colossus/_refs/` (stripped from APK — not copied to `www/`):

| File | Role |
|------|------|
| `combiner-bulk-insp.png` | Layered combiner bulk / chest-core silhouette ONLY |
| `blocky-titan-silhouette-insp.png` | Blocky titan proportions / pillar-leg mass ONLY |
| `layered-plate-titan-insp.png` | Layered plate + heavy-fist language ONLY — no Autobot marks |
| `modular-mecha-bulk-insp.png` | Modular mecha bulk / assembled-module read ONLY |

## Soft-wire

```js
COLOSSUS_SPRITE_ENABLED = true    // Continuity; procedural fallback if sheets fail
COLOSSUS_SPRITE_DRAWH = 228       // Gharok lock
// collision r=54 always (spawn)
```

## Desktop preview

`C:\Users\drpep\Desktop\TemporalRift-Colossus-Sprites\` — idle / walk / attack / death / walk-side / walk-back  
Also mirrored under `C:\Users\drpep\Pictures\TemporalRift-Colossus-Sprites`

## Ship notes

- **No APK / no version bump / no Play** this pass
- Flag ON Continuity — store deferred
- REMOVED untouched (no Saiyan names, no Play GitHub banner)

# Ashen Husk art plan (v2.12.1)

Original Temporal Rift **Ashen Husk** zombie sheets — Gharok **art quality / process**,
**not** Gharok footprint.

## Size lock (enforced)

| Field | Value | Notes |
|-------|-------|--------|
| Husk collision `r` | **14** | Unchanged — `docs/UNIT_SIZES.md` |
| Sprinter collision `r` | **11** | Unchanged |
| Sprite `drawH` | **36 × s** | Matches procedural `drawFigure` `H = 36 * s` |
| Husk on-screen | `drawH = 36` | **Not** Gharok `drawH = 228` |
| Sprinter on-screen | `drawH ≈ 30.6` | `s = 0.85` |

Source PNGs are 512×512 (same sheet resolution as Gharok) but drawn at husk scale.

## Shipped assets

- `assets/zombie/idle.png`
- `assets/zombie/walk.png`
- `assets/zombie/windup.png`

Loaded like Gharok: idle ↔ walk by gait phase; `windup` while `swipeT > 0`.
Procedural `drawFigure` remains the fallback if images fail.

Wired to **husk** and **sprinter** (same family). Bulwark stays procedural this pass.
Skeleton: see `docs/skeleton-art-plan.md` (art drafted; APK flag-gated).

## References (inspiration only)

Under `assets/zombie/_refs/` (stripped from APK):

1. Cartoon shambling zombie — primary vibe.
2. Forest creep WIP — atmosphere / hunch only; **do not** copy Valve/L4D “Creep” IP.
3. Bulk/detail bar — muscular silhouette density; orc-armor source path was missing on disk (see `_refs/README.md`). Gharok sheets also set the detail-density bar.

No Warhammer / Blizzard / Valve character names or assets shipped.

## Next part (deferred)

- More walk frames / hurt / death sheets
- Bulwark / fusion variants
- Optional palette variants
- Full in-game polish beyond frame-swap + bob/lean
- Skeleton APK apply (flag on) — see `docs/skeleton-art-plan.md`

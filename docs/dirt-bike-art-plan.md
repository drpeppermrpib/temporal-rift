# Ashen Rift Bike art plan (Step 8.3)

Original Temporal Rift **Ashen Rift Bike** — exterior-only fast travel mount.

**Status (2026-09-01):** **8.3 shipped** (4.1.7) using **v3 concept sheet** as placeholder. Real Ravager-style mesh **DEFERRED until after 4.2.0 BETA APK testing** (Step 8 closed; not a Step 9 sub-step).

---

## ⏸ DEFERRED — return after 4.2.0 APK testing

**User decision (2026-09-01):** Bike preview concepts (v1–v3) still look bad / “AI put together.” User agreed: **not the same quality as orc mesh** (Rift Cyclope / one-eyed Ravager). Step 8 closed. **Come back after sideload-testing `TemporalRift-BETA-4.2.0.apk`** — do not block Step 9 (trees / pathing / fog / decade) on bike art.

### Why orcs worked (Rift Cyclope) — the real pipeline

Chat `GenerateImage` collages are **not** how unit art ships. Orcs used the **unit mesh pipeline**:

1. **Trait table** — one trait per ref (cyclops eye, fat belly, decay, club, etc.)
2. **Separate sheets** — `idle.png`, `walk.png`, `windup.png` each generated individually
3. **Process script** — flood-key → crop → 512 transparent (`process-ravager-sprites.mjs` pattern)
4. **Iterate** — raw → process → Desktop preview → regen one pose if needed

See `docs/ravager-art-plan.md` + `docs/tree-art-plan.md` (GenerateImage remesh + `process-tree-sprites.mjs`).

### What failed for bike previews

- Concept collages + procedural `preview-dirt-bike.html` — not the mesh pipeline
- Vehicles harder than humanoids; chat images mush into composites
- v2/v3 user tweaks (more bone, bigger wheels, lighter glow, wreck smoke) did not fix the core issue

### Locked for when we return (art pass)

| Piece | Rule |
|-------|------|
| **Silhouette** | Motocross dirt bike (KTM/KX proportions) — not a car |
| **Bones** | Rib tank + spine rail + bone spokes — structural, not clipart |
| **Wheels** | Oversized knobby off-road |
| **Glow** | Faint aura around **entire silhouette** (`#e8dcff`) + ember bone edges |
| **Rider** | Option B — armored silhouette on **ride sheet only** |
| **Wreck** | Tipped + broken wheel + **spiral smoke** (animated) |
| **Ride anim** | Vertical suspension only — no side wobble |
| **Strip** | Brand logos, photo cutouts, copyrighted IP |

### Mesh traits (when art pass runs)

| # | Ref | Trait |
|---|-----|-------|
| 1 | KTM 450 / Kawasaki KX | Trellis frame, gold forks, high fender, knobbies, exhaust header |
| 2 | Pit bike | Engine block, disc brakes, swingarm |
| 3 | Terminator bike | Segmented spine rail |
| 4 | Bone decal | Rib cage = tank/frame |
| 5 | Streamline art bike | Flowing fender lines |

### Path when returning

| Path | Plan |
|------|------|
| **8.3 gameplay (now)** | Mount/dismount, fuel burn, wreck repair, legacy gate. Draw = **simple TR cartoon** (`drawFigure` grammar). `DIRT_BIKE_SPRITE_ENABLED=false`. |
| **Art pass (after 8.7)** | Trait table locked → `idle` / `ride` / `wreck` sheets → `process-dirtbike-sprites.mjs` → `www` sync → Desktop preview. Same as Ravager/Burstweaver. |

### Preview artifacts (audit only — not shipping art)

- `preview-dirt-bike.html` (procedural v3)
- `assets/vehicles/dirtbike/ashen-rift-bike-concept-v2.png`, `ashen-rift-bike-concept-v3.png`
- `assets/vehicles/dirtbike/_refs/` (photo inspiration, APK-stripped)
- Desktop: `C:\Users\drpep\Desktop\TemporalRift-DirtBike-Preview\`

---

## Size lock (draft — pending art pass)

| Field | Value |
|-------|-------|
| `r` | **14** |
| `drawH` | **32** |

## Assets (when art pass runs)

- `assets/vehicles/dirtbike/idle.png`
- `assets/vehicles/dirtbike/ride.png`
- `assets/vehicles/dirtbike/wreck.png`
- `process-dirtbike-sprites.mjs` (new)
- Soft-wire: `DIRT_BIKE_SPRITE_ENABLED` (default false until processed)

## Next

1. **8.3–8.7** — gameplay + balance + **4.2.0** gate (no final bike sheets)
2. **After Step 8** — dedicated bike mesh pass (orc pipeline)

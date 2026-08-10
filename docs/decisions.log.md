# Temporal Rift — Decision Log

**Append-only.** Newest entries at the top. Do not edit or delete prior rows; add a correcting entry instead.

**Statuses:** `REMOVED` · `KEPT` · `SHIPPED` · `WONTFIX` · `OPS` · `DEFERRED`

**Format:**

```
### YYYY-MM-DD — STATUS — short title
- Version / commit / APK: …
- User intent: …
- Agent action: …
- Notes: …
```

---

### 2026-08-09 — DEFERRED — Cloister / brick stronghold walls systems+art (no APK)
- Version / commit / APK: master code+art only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**; systems ON for Continuity/source testing only
- User intent: Mesh brick fence refs as modular sections (straight / corners / T-junctions); Continuity town save; no APK / no version bump; keep wooden barricades; store ship deferred
- Agent action: Modular sprites `assets/buildings/brickwall/{pillar,segment,corner,tee}(+damaged).png` + `_refs`; BUILD → **Cloister Wall** (wood 10 / gold 4 / cores 2; HP 280; max 16) with cardinal auto-link straights + corners/T + LINK ghost (like barricades); collide + HP brace; Continuity `town.brickWalls` additive with barricades; `BRICKWALL_ENABLED`/`BRICKWALL_SPRITE_ENABLED=true`; docs `brickwall-art-plan.md` + CHANGE_MEMORY channel/pending/KEPT; Desktop `C:\Users\drpep\Desktop\TemporalRift-BrickWall-Sprites`; `test-town-save.js` covers `brickWalls`
- Notes: **Not store-shipped.** Store ship still deferred with Continuity + ravager/building-art batch. Wooden barricades KEPT (Cloister additive). REMOVED list intact.

### 2026-08-09 — DEFERRED — #2e Aether Pit art drafted (flag OFF; no APK)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK** / **no live enable**
- User intent: Mesh stone well / earth pit / tiered quarry / rocky crater structure refs + Razer lamp **glow mood only** into Aether Pit; soft-wire OFF; Desktop Photos; no APK / no version bump / no live enable; same pipeline as keep/camp/hall/vault
- Agent action: Generated original Aether Pit idle/damaged (512×512 transparent); refs under `assets/buildings/pit/_refs/` incl. `aether-glow-mood-insp` (README: glow/lighting mood ONLY — no lamp object/logo/product); size lock `r=38` / `drawH=48` (collision r unchanged); soft-wire `PIT_SPRITE_ENABLED=false`; docs `pit-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Pit-Sprites`; www sync sheets (no `_refs`)
- Notes: Keep/camp/hall/vault already drafted flag OFF. Building-art batch #2a–#2e complete (all flags OFF). Apply pit (flag ON) with stronghold + town-save batch. REMOVED list intact — nothing added to REMOVED. No lamp/logo/branded product in sheets.

### 2026-08-09 — DEFERRED — #2d Gold Vault remesh to mine-mouth (flag OFF; no APK)
- Version / commit / APK: assets+docs only (no APP_VERSION / versionCode bump) / **no BETA APK** / **no live enable**
- User intent: Remesh Gold Vault from freestanding stronghouse/arcade vault look to dug-into-hill / fortified mine-mouth aesthetic; soft-wire stays OFF; Desktop Photos; no APK / no version bump / no live enable
- Agent action: Replaced `assets/buildings/vault/{idle,damaged}.png` with timber-framed rocky bunker mouth + aether-gold interior glow (no readable IP/sign text); new `_refs/`: `hillside-bunker-mouth-insp`, `rocky-cave-ladder-insp`, `timber-frame-mine-mouth-insp` (old arcade refs removed); kept `VAULT_SPRITE_ENABLED=false`, sizes `r=40` / `drawH=52` unchanged; docs `vault-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `C:\Users\drpep\Desktop\TemporalRift-Vault-Sprites` refreshed
- Notes: Prior arcade/stronghouse mesh superseded. Aether Pit still pending; apply vault (flag ON) with stronghold batch. REMOVED list intact — nothing added to REMOVED.

### 2026-08-09 — DEFERRED — #2c Muster Hall + #2d Gold Vault art drafted (pit pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `080094b` / **no BETA APK**
- User intent: Mesh town-hall / half-timber / gothic / arcade refs into Muster Hall (#2c) then Gold Vault (#2d); soft-wire flags OFF; Desktop photos; no APK / no live enable / no stronghold this pass
- Agent action: Generated original Muster Hall + Gold Vault idle/damaged (512×512 transparent); refs under `assets/buildings/hall/_refs/` + `vault/_refs/`; size locks muster `r=46`/`drawH=60`, vault `r=40`/`drawH=52` (collision r unchanged); soft-wire `HALL_SPRITE_ENABLED=false` / `VAULT_SPRITE_ENABLED=false`; docs `hall-art-plan.md` + `vault-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `TemporalRift-Hall-Sprites` + `TemporalRift-Vault-Sprites`; www sync sheets (no `_refs`)
- Notes: Keep/camp already drafted flag OFF. Aether Pit still pending. Flip hall/vault flags + apply with Keep/camp/ravager + stronghold + town-save batch. REMOVED list intact. Original Ashen/Rift naming — inspiration only.

### 2026-08-09 — DEFERRED — #2b Camp art drafted (halls pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `0484c67` / **no BETA APK**
- User intent: Mesh medieval camp refs into Timber Camp / Supply Camp building art (#2b); soft-wire flags OFF; Desktop photos; no APK / no live enable / no halls / no stronghold this pass
- Agent action: Generated original Timber + Supply idle/damaged (512×512 transparent) + shared idle/damaged; refs under `assets/buildings/camp/_refs/`; size lock timber `r=40`/`drawH=50`, supply(farm) `r=36`/`drawH=46` (collision r unchanged); soft-wire `CAMP_SPRITE_ENABLED`/`TIMBER_SPRITE_ENABLED`/`SUPPLY_SPRITE_ENABLED=false`; docs `camp-art-plan.md` + UNIT_SIZES + CHANGE_MEMORY; Desktop `TemporalRift-Camp-Sprites`; www sync sheets (no `_refs`)
- Notes: #2a Keep already drafted flag OFF. Muster/halls still pending user photos. Flip camp flags + apply with Keep + ravager + stronghold + town-save batch. REMOVED list intact. Original Ashen/Rift camp naming — inspiration only.

### 2026-08-09 — DEFERRED — #2 Keep art drafted (halls/camps pending; apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK**
- User intent: Mesh castle/keep refs into Rift Keep building art only for batch #2 part 1; halls/camps later; soft-wire flag OFF; Desktop photos; no APK / no live enable / no brick stronghold this pass
- Agent action: Generated original Rift Keep idle+damaged (512×512 transparent); refs under `assets/buildings/keep/_refs/`; size lock collision `r=54` / `drawH=72` (procedural ~42×56); soft-wire `KEEP_SPRITE_ENABLED=false`; docs `keep-art-plan.md` + CHANGE_MEMORY; Desktop `TemporalRift-Keep-Sprites`; www sync sheets (no `_refs`)
- Notes: Halls/timber/supply/muster/camps pending user photos (#2 parts). Flip flag + apply with stronghold + town-save batch. REMOVED list intact. Original keep — not a named real-world castle clone.

### 2026-08-09 — DEFERRED — Ashen Ravager articulation + barks coded (flag OFF; ship later)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play / no version bump**
- User intent: After approving Ravager art — “next!” add articulation with movements + sounds like other sprite foes; stop; buildings (#2) separately; don’t ship store update yet
- Agent action: Wired idle↔walk↔windup + heavier plant squash/bob/lean on sprite path; size gates `RAVAGER_R`/`RAVAGER_FIGURE_S`/`drawH=100` follow flag; distinct deep cyclops-orc bark lines + lower/longer synth voice vs bulwark; left `RAVAGER_SPRITE_ENABLED=false` (live procedural unchanged); UNIT_SIZES + ravager-art-plan + CHANGE_MEMORY; www sync sheets (no `_refs`)
- Notes: Flip one flag line to enable locally/ship. Store enable deferred with stronghold + building-art batch. Ready for #2 building photos. REMOVED list intact. No WoW/Blizzard IP.

### 2026-08-09 — DEFERRED — Ashen Ravager art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / **no BETA APK**
- User intent: Mesh 6 orc/cyclops/zombie refs into one-eyed fat zombie-orc Ravager sheets; size between others and boss; soft-wire flag OFF; Desktop photos; stop before articulation/sounds; no APK / no live enable
- Agent action: Generated original Ashen Ravager / Rift Cyclope idle/walk/windup (512×512 transparent); refs under `assets/ravager/_refs/`; planned size lock `r=36` / `drawH=100` / `s≈2.78` (live still `r=24` / `s=1.7`); soft-wire `RAVAGER_SPRITE_ENABLED=false`; docs + Desktop `TemporalRift-Ravager-Sprites`; CHANGE_MEMORY pending
- Notes: Articulation/barks when user says "next". Flip flag + apply size with update batch. No WoW/Saurfang/Blizzard IP. No stronghold this pass.

### 2026-08-09 — DEFERRED — Town/RTS save fix coded (ship with stronghold+art batch)
- Version / commit / APK: master code only — **APP_VERSION stays 2.13.2** (versionCode 46); **no BETA APK / no Play AAB / no versionCode bump**
- User intent: Continue after quit lost buildings, Ashen Laborers, and Muster militia (companion squad was fine); fix in code + document for next update batch with fence brick stronghold; do not apply/build/release this pass
- Agent action: Extended `snapshot`/`loadGame` with additive `town` payload (structures+levels, laborers orders/HP/downed, militia skills/HP/pos, barricades, waveTrainLeft, gold mine stocks); wood/gold already saved; old saves without `town` keep starter Keep+laborers; companion/player/wave/skill-tree untouched; smoke test `test-town-save.js`; CHANGE_MEMORY pending note
- Notes: Next ship bundles save fix + stronghold + more art. Suggested batch order: (1) ravager last enemy mesh (2) building art mesh (3) ally/militia/laborer skins if photos (4) fence brick stronghold systems (5) one update apply. REMOVED list intact.

### 2026-08-09 — SHIPPED — Play Closed testing 2.13.2 live
- Version / commit / APK: 2.13.2 (versionCode 46) / Play Closed testing (`playstore/TemporalRift-2.13.2.aab`, TR_CHANNEL=play)
- User intent: Confirm Play Closed rollout finished — “nvm it worked”
- Agent action: Interrupted unfinished browser/rollout work as SUCCESS; updated channel matrix Play Closed → **2.13.2** (versionCode 46); cleared AAB-upload-pending + Ops pending row; docs-only commit
- Notes: User confirmed Closed testing live from their side; prior OPS handoff “upload pending” superseded

### 2026-08-09 — OPS — Public channel ship: GitHub v2.13.2 + Play AAB handoff
- Version / commit / APK: 2.13.2 (versionCode 46) / tag `v2.13.2` / GitHub `TemporalRift.apk` (TR_CHANNEL=github) / Play `playstore/TemporalRift-2.13.2.aab` + `rollouts/rollout-4-v2.13.2/` (TR_CHANNEL=play, verified)
- User intent: Roll 2.13.2 as a real update (not BETA sideload); user at Play Console with only ≤2.8 available — need 2.13.2 Play AAB ASAP
- Agent action: Verified existing play AAB (TR_CHANNEL=play); opened Explorer on `rollouts/rollout-4-v2.13.2/TemporalRift-2.13.2.aab`; created GitHub Release 8 tag `v2.13.2` with github-channel APK; updated channel matrix (GitHub=2.13.2; Play=AAB ready, upload pending)
- Notes: Do **not** upload `TemporalRift-2.8.aab`. Play Closed status flips to 2.13.2 only after Console upload. REMOVED list intact (no ENTERING popup, no GitHub banner on Play, no IP names). No stronghold / no ravager art this ship.

### 2026-08-09 — SHIPPED — v2.13.2 enemy→ravager size + laborer retaliate + squad buff
- Version / commit / APK: 2.13.2 (versionCode 46) / `f921eca` / BETA `TemporalRift-BETA-2.13.2.apk`
- User intent: Sprite foes nearly ravager-sized (skeleton unchanged); laborers attack back only if hit; companions+militia smidge stronger; skip stronghold/brick walls
- Agent action: Size pass husk/sprinter/bulwark/shaman toward ravager; skeleton left at 2.13.1; laborer `retaliateT` on-damage only (removed threaten engage + flee-to-fight); slight companion/militia HP+dmg; UNIT_SIZES + CHANGE_MEMORY; stronghold skipped
- Notes: Gharok/ravager/sprites/barks/RTS core intact. Old→new sizes in UNIT_SIZES.md.

### 2026-08-09 — SHIPPED — v2.13.1 enemy size + militia engage + laborer revive/defend
- Version / commit / APK: 2.13.1 (versionCode 45) / `306a9be` / BETA `TemporalRift-BETA-2.13.1.apk`
- User intent: Bad guys a bit bigger than player (not boss); spear/militia actually attack; peasants revivable + defend; keep rest intact
- Agent action: Modest drawH/r bumps (husk/sprinter/skel/bulwark/shaman); militia aggro near self OR player + spear reach; laborers downed+Talk revive + flee-to-fight; workers≠squad kept; UNIT_SIZES + CHANGE_MEMORY updated; REMOVED list intact
- Notes: Gharok/RTS/sprites/barks left intact. Old→new sizes documented in UNIT_SIZES.md.

### 2026-08-09 — SHIPPED — v2.13.0 sprites APPLIED + enemy barks
- Version / commit / APK: 2.13.0 (versionCode 44) / `2ec64a1` / BETA `TemporalRift-BETA-2.13.0.apk`
- User intent: Articulate enemy walk; orc talk/barks with different voices; apply deferred skeleton/bulwark/shaman sprites; ship BETA; leave Gharok movement intact
- Agent action: Enabled `SKELETON_SPRITE_ENABLED` / `BULWARK_SPRITE_ENABLED` / `SHAMAN_SPRITE_ENABLED`; verified husk still on; gait plant/squash polish; bark synth + original lines (rate-limited, mute-aware); Gharok left as-is from 2.12.x; size locks untouched
- Notes: Ravager still procedural. No Play upload. Copyright-safe lines only.

### 2026-08-09 — DEFERRED — Ashen Shaman art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / ccefeae / **no BETA APK**
- User intent: Mesh 4 shaman/mage refs into detailed caster sprites like Husk/Skeleton/Bulwark; art for NPCs; no new APK this pass
- Agent action: Generated original Ashen Shaman / Rift Hexer idle/walk/windup; size lock `r=13` / `drawH=36` (36×1.0 husk baseline); soft-wire behind `SHAMAN_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for NPC #4 ravager. Flip flag + BETA when applying. No WoW/Blizzard/Warhammer/Disney IP.

### 2026-08-09 — DEFERRED — Ashen Bulwark art drafted (APK apply later)
- Version / commit / APK: assets+docs+soft-wire only (no APP_VERSION / versionCode bump) / `d639ebd` / **no BETA APK**
- User intent: Mesh 4 orc/brute refs into detailed tank sprites like Ashen Husk / Skeleton; art for NPCs; no new APK this pass
- Agent action: Generated original Ashen Bulwark / Rift Brute idle/walk/windup; size lock `r=20` / `drawH=52.2` (36×1.45); soft-wire behind `BULWARK_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for NPC #3 shaman/ravager. Flip flag + BETA when applying. No WoW/Blizzard/Warhammer IP.

### 2026-08-09 — DEFERRED — Ashen Skeleton art drafted (APK apply later)
- Version / commit / APK: assets+docs only (no APP_VERSION / versionCode bump) / `24c4c31` / **no BETA APK**
- User intent: Mesh 3 skeleton refs into detailed sprites like Ashen Husk / Gharok; art for NPCs first; no new APK this pass
- Agent action: Generated original Ashen Skeleton idle/walk/windup; size lock `r=10` / `drawH=32.4` (36×0.9); soft-wire behind `SKELETON_SPRITE_ENABLED=false`; docs + Desktop preview; CHANGE_MEMORY append
- Notes: Ready for next NPC refs. Flip flag + BETA when applying. No WoW/Blizzard/InkWell IP.

### 2026-08-09 — SHIPPED — v2.12.1 Ashen Husk detailed sprites (small footprint)
- Version / commit / APK: 2.12.1 (versionCode 43) / `2454291` / BETA `TemporalRift-BETA-2.12.1.apk`
- User intent: Make zombies the same way as Gharok (detailed sprite art from refs); rest of zombie polish next part; **CRITICAL:** keep current small husk size — Gharok pipeline = quality only, not boss `r=54` / `drawH=228`
- Agent action: Generated original Ashen Husk idle/walk/windup PNGs; wired husk+sprinter frame-swap with `HUSK_SPRITE_DRAWH=36` (matches figure H); collision `r=14`/`11` untouched; procedural fallback; `docs/zombie-art-plan.md` + UNIT_SIZES note; strip `_refs` from APK
- Notes: Refs = inspiration (cartoon shamble + forest creep vibe); no Valve/L4D Creep IP / Warhammer / Blizzard. Next part: more frames, bulwark/skeleton variants, fuller polish. No Pixelorama. No Play upload.

### 2026-08-08 — SHIPPED — v2.12.0 in-engine unit animation finish (sizes locked)
- Version / commit / APK: 2.12.0 (versionCode 42) / `a15fa7d` / BETA `TemporalRift-BETA-2.12.0.apk`
- User intent: Can't use Pixelorama (SplashTop); do Gharok-style finished movements for all units; keep current sizes; no Pixelorama workflow push
- Agent action: Finished Gharok idle/walk/attack(windup+strike)/hurt lean on existing sheets + procedural fallback; additive limb-flow walk/attack/hurt for enemies + allies + laborers/militia/Colossus; locked radii/draw scales in `docs/UNIT_SIZES.md`; noted Pixelorama/Forge deferred — primary = in-engine
- Notes: No dedicated death corpse sheets (particle death remains). Militia still thinner than Gharok sheet quality. SplashTop/Pixelorama out of scope.

### 2026-08-08 — SHIPPED — Windows character-drop pipeline (docs + folder)
- Version / commit / APK: docs only (no APP_VERSION bump) / `526f9ac`
- User intent: Rift Forge APK too hard for skins; want limb-flowing enemies/allies + moving textures via easy Windows tools; drop files for agent; AI-smart tooling wish
- Agent action: Researched FOSS Windows 2D tools; scaffolded `content/character-drops/` + `docs/CHARACTER_DROP_FORMAT.md`; copied ash-scout metadata example; recommended Pixelorama primary / LibreSprite backup; **no** in-engine skeletal/sheet loader this pass (procedural draw still default)
- Notes: **Rift Forge APK deferred for ease** — Windows drop pipeline preferred for v3 art. ComfyUI/AnimateDiff optional drafts only. Next: artist drops sheets → agent wires one unit sheet player.

### 2026-08-08 — DEFERRED — Rift Forge APK expansion for day-to-day skins
- Version / commit / APK: n/a (companion path)
- User intent: Skins/characters easier than Forge APK
- Agent action: Do not expand Forge APK; document simpler Windows editor → `character-drops` handoff instead
- Notes: Forge scaffold remains; v3 overhaul still deferred. Prefer Pixelorama/LibreSprite locally.

### 2026-08-08 — SHIPPED — v2.11.0 WC2-inspired RTS overhaul slice
- Version / commit / APK: 2.11.0 (versionCode 41) / `740e93a` / BETA `TemporalRift-BETA-2.11.0.apk`
- User intent: Warcraft-2–inspired additive overhaul (~2hr playable slice): town buildings, choppable forests, gold mines, workers≠squad, Muster +3/wave fighters, click orders/skills, expanded map; original names only; keep wave survival
- Agent action: Map 3600→4800; forest stands + gold mine buildings; Rift Keep / Supply Camp / Gold Vault + existing halls; Ashen Laborers worker-only with Chop/Mine/Follow orders; Muster Spearmen/Bowmen (+3 train/wave, revivable); light fighter skill nodes; starter Keep+2 laborers + tips; HUD worker/squad counts; kept companions/barricades/mend/revive/learning/BETA id; no Play Console; no Rift Forge v3
- Notes: discoverability_risk reduced (starter Keep + tip banner + clearer BUILD hint). Pathfinding/AI polish still thin vs full WC2. No copyrighted names.

### 2026-08-08 — SHIPPED — Rift Forge companion scaffold (sibling project)
- Version / commit / APK: Forge 0.1.0 / sibling repo `videogamemakes/rift-forge` / `rollouts/RiftForge-0.1.0.apk`
- User intent: Companion APK/web workshop for 2D kits → Drive → later Temporal Rift v3; not a Tripo 3D clone
- Agent action: Scaffold Capacitor app + pack format + sample `ash-scout` + debug APK; v3 loader remains stub/docs only
- Notes: Game still procedural/hardcoded draw paths. Cloud gen stubbed (no paid key required). v3 overhaul still DEFERRED until ordered.

### 2026-08-08 — DEFERRED — Rift Forge companion started; v3 overhaul pending
- Version / commit / APK: n/a (companion / planning)
- User intent: Note that Rift Forge companion work has started; full v3 overhaul still pending
- Agent action: Thin memory note only — no gameplay/APK ship this entry
- Notes: Do not treat as SHIPPED remove/keep; overhaul deferred until explicitly ordered

### 2026-08-08 — SHIPPED — v2.10.0 additive RTS build picker slice
- Version / commit / APK: 2.10.0 (versionCode 40) / `fe493db` / BETA `TemporalRift-BETA-2.10.0.apk`
- User intent: Free Tripo alternatives research + Warcraft-2-inspired additive RTS (build picker, wood/gold workers, upgradable buildings, more squads, megazord-like combiner) without gutting wave survival; copyright-safe names only
- Agent action: BUILD opens picker (barricade / Timber Camp / Muster Hall / Aether Pit); wood+gold HUD; Ashen Laborers chop trees + mine gold veins; tap building to upgrade/train; Ashen Sentinel companion; Aether Colossus combiner (~Gharok r=54); kept wave loop / learning / barricades / mend / revive / BETA package
- Notes: Buildable city pathway moved from deferred→started. discoverability_risk: Colossus needs 2 nearby allies + resources (button + Key C). No Play Console upload. Boss art skipped.

### 2026-08-08 — SHIPPED — v2.9.3 hide learning / one-tap mend / wall ghost
- Version / commit / APK: 2.9.3 (versionCode 39) / `baa9f3f` / BETA `TemporalRift-BETA-2.9.3.apk`
- User intent: Fix audit polish misses and apply to current version
- Agent action: Settings `adaptHidden` toggle (persisted); field MEND btn + Key H (`tryAetherMend`, same costs as infirmary); barricade aim ghost + link lines/`LINK ×N` before place; kept 2.9.2 field Talk revive
- Notes: discoverability_risk reduced for mend (was menu-only). Co-op combat sync + buildable city still deferred. Play/GitHub public tracks not uploaded this pass.

### 2026-08-08 — SHIPPED — change memory system
- Version / commit / APK: docs on master (post-`180f2b6`); tag `baseline-pre-memory-system` = audit recovery point
- User intent: GO on remembering system; keep chat audit as stable revert line
- Agent action: Added `docs/CHANGE_MEMORY.md`, this log, `.cursor/rules/change-memory.mdc`; baseline note on audit doc only
- Notes: No gameplay code changes

### 2026-08-08 — KEPT — baseline chat audit immutable
- Version / commit / APK: `180f2b6` / tag `baseline-pre-memory-system`
- User intent: Treat `docs/chat_audit_misses_and_regressions.md` as revert reference
- Agent action: Header note only; body not rewritten
- Notes: Corrections go in CHANGE_MEMORY / this log

### 2026-08-08 — DEFERRED — OnePlus 9 Pro / Evolution X bug (unknown)
- Version / commit / APK: unknown package/version
- User intent: Device bug mentioned at audit time; not in prior chats
- Agent action: Placeholder in CHANGE_MEMORY open bugs
- Notes: Needs repro + logcat; do not invent root cause

### 2026-08-08 — DEFERRED — co-op combat sync / buildable city / polish backlog
- Version / commit / APK: n/a (pending)
- User intent: From audit misses — full enemy sync; buildable city; hide learning toggle; one-tap mend; wall preview; channel catch-up
- Agent action: Listed under Pending in CHANGE_MEMORY
- Notes: Boss art / feel polish skipped unless user reopens

### 2026-08-08 — SHIPPED — v2.9.2 field squad revive + PeerJS downed revive
- Version / commit / APK: 2.9.2 / `dd08d2d` / BETA APK
- User intent: “Revive squad gone?” + MP revive
- Agent action: Field hold-Talk revive channel; PeerJS downed/revive
- Notes: Prior menu-only path had discoverability_risk (wave-end auto-clear)

### 2026-08-08 — SHIPPED — v2.9.1 compact HUD + thinner beam
- Version / commit / APK: 2.9.1 / `6122374`
- User intent: Compact map+HP HUD; thinner beam ladder
- Agent action: Shipped HUD/beam; agent polish suggestions left pending
- Notes: See Pending in CHANGE_MEMORY

### 2026-08-07 — SHIPPED — v2.9.0 infirmary, fortify links, Riftnet foundation
- Version / commit / APK: 2.9.0 / `15035e0`
- User intent: Aether heal/revive, dog durability, linked barricades, co-op foundation
- Agent action: Shipped; combat sync deferred in README/UI
- Notes: Enemies remain local

### 2026-08-07 — SHIPPED — v2.8.7 sound + world sprites
- Version / commit / APK: 2.8.7
- User intent: Sound engine submenu; sprite pines/rocks
- Agent action: Shipped
- Notes: —

### 2026-08-06 — SHIPPED — v2.8 BETA package + systems
- Version / commit / APK: 2.8 / `com.drpep.temporalrift.beta`
- User intent: Dual-wield, companions, sentry, camera peek, death checkpoints, separate beta package
- Agent action: Shipped on master/BETA
- Notes: Store/GitHub stayed behind (~2.6) — OPS lag

### 2026-08-06 — OPS — public channels held at ~2.6
- Version / commit / APK: GitHub latest v2.6; Play closed last confirmed 2.6; shelf has 2.7/2.8 AABs
- User intent: Testers should feel updates (expectation vs ops)
- Agent action: BETA raced ahead; public upload not confirmed for 2.7+
- Notes: Channel lag ≠ code regression

### 2026-08-06 — SHIPPED — v2.7 content (shelf)
- Version / commit / APK: 2.7 in master; store rollout deferred
- User intent: Fusion zombies, graves/skeletons, fireballs, boss armor, fence upgrades
- Agent action: In master code
- Notes: Distribution incomplete for public tracks

### 2026-08-06 — SHIPPED — v2.6 HUD / layout / vibration
- Version / commit / APK: 2.6
- User intent: HUD under notch, movable buttons, styles, vibration
- Agent action: Shipped; became last confirmed public channel point for many testers
- Notes: —

### 2026-08-05 — REMOVED — center “ENTERING” city popup
- Version / commit / APK: v2.4
- User intent: Remove center popup; keep bottom label
- Agent action: Removed; bottom `regionFlashT` kept
- Notes: Still removed as of 2.9.2 — do not re-add

### 2026-08-05 — KEPT / SHIPPED — Play must not get GitHub update banner
- Version / commit / APK: v2.5
- User intent: Play update banner must not send users to GitHub sideload
- Agent action: `checkForUpdate()` only when `UPDATE_CHANNEL === 'github'`
- Notes: True regression-class bug if this gate breaks — keep gated

## 2026-08-09 15:45 — SHIPPED (Play AAB staged)
- **2.13.2** Play AAB ready for Closed testing upload: `playstore\TemporalRift-2.13.2.aab` (+ `rollouts\TemporalRift-2.13.2.aab`), package `com.drpep.temporalrift`, versionCode **46**, `TR_CHANNEL=play` (GitHub updater off).

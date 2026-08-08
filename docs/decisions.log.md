# Temporal Rift — Decision Log

**Append-only.** Newest entries at the top. Do not edit or delete prior rows; add a correcting entry instead.

**Statuses:** `REMOVED` · `KEPT` · `DEFERRED` · `SHIPPED` · `WONTFIX` · `OPS`

**Format:**

```
### YYYY-MM-DD — STATUS — short title
- Version / commit / APK: …
- User intent: …
- Agent action: …
- Notes: …
```

---

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

# Agent notes — Temporal Rift

## Change memory (required)

Before gameplay, UX, or distribution-channel work:

1. Read [`docs/CHANGE_MEMORY.md`](docs/CHANGE_MEMORY.md) — especially **Remove / Keep** and the **channel matrix**.
2. Skim [`docs/decisions.log.md`](docs/decisions.log.md) (newest first).

After every ship / BETA / version bump: append a decision log row and update the matrix/changelog as needed.

**Baseline audit (do not rewrite):** [`docs/chat_audit_misses_and_regressions.md`](docs/chat_audit_misses_and_regressions.md)  
**Recovery tag:** `baseline-pre-memory-system` → `180f2b6`

Cursor rule: `.cursor/rules/change-memory.mdc` (always apply).

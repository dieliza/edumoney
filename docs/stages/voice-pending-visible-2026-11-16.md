# Visible pending dictations — 2026.11.16.10

Scope: pending dictation text and the classifier's exact outstanding reasons are always visible in a transparent, touchable summary. Same-page editing uses a transparent underlined multiline field rather than a white Field card. Explicit theme-aware ink and warning colors make the task legible on the native app background. Editing summary is disabled while its editor is open to preserve unsaved input; save, delete and concurrency guards remain.

The existing encrypted pending-note persistence and inbox event already create a stable, per-vault notification. Voice task links now route directly to /dictations with the existing dictation ID. Existing legacy document route compatibility is retained. Pending saves retain the same reminder; confirmation/deletion removes it. No new provider, push permission, data model, category, financial calculation or authentication changes.

Validation: 17/100 focused cases passed, including visible outstanding reasons and contrast, summary-to-editor action, notification creation/update without duplicates, disappearance on resolution/deletion, vault isolation, failed saves, stale edits, transaction rollback and exact financial persistence. TypeScript, ESLint, web build and worker syntax checked. No physical mobile or browser visual QA available; automated rendering/event and real SQLite tests only.

Publication succeeded: Sites version 66; implementation 6a48a01; source cc7e06a691124b5b8124e0a4b68ec9fb960f71ba; saved version appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_b34bcf649f94819199c42c6321e23c8d; deployment appgdep_6afa9caea9fc8191a0b146b0317e6f1a; environment revision 1. URL https://edumoney-web.diegoluissantospabon.chatgpt.site . All required checks succeeded.

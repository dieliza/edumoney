# Visible pending dictations — 2026.11.16.10

Scope: pending dictation text and the classifier's exact outstanding reasons are always visible in a transparent, touchable summary. Same-page editing uses a transparent underlined multiline field rather than a white Field card. Explicit theme-aware ink and warning colors make the task legible on the native app background. Editing summary is disabled while its editor is open to preserve unsaved input; save, delete and concurrency guards remain.

The existing encrypted pending-note persistence and inbox event already create a stable, per-vault notification. Voice task links now route directly to /dictations with the existing dictation ID. Existing legacy document route compatibility is retained. Pending saves retain the same reminder; confirmation/deletion removes it. No new provider, push permission, data model, category, financial calculation or authentication changes.

Validation: 17/100 focused cases passed, including visible outstanding reasons and contrast, summary-to-editor action, notification creation/update without duplicates, disappearance on resolution/deletion, vault isolation, failed saves, stale edits, transaction rollback and exact financial persistence. TypeScript, ESLint, web build and worker syntax checked. No physical mobile or browser visual QA available; automated rendering/event and real SQLite tests only.

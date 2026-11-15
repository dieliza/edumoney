# Transaction editing and consolidated histories — 2026.11.15.10

## Diagnosis
The screenshot's save error was the existing linked-record guard: the ledger edit lacked the document context required to update a receipt-backed movement. It was not a password or button-permission problem.

## Changes
- Removed the correction-reason input from transaction editing. Initial records show Editar movimiento and Guardar; the backend records Edición guardada por el usuario when no manual reason is supplied. Previous versions and audit records are retained. Deletion/restoration requirements are unchanged.
- Added editFromHistory, which resolves the current valid linked document and reuses the existing document-aware edit transaction. Stale movement/document versions remain rejected. Receipt originals/sha/raw text are retained and flagged for review when their financial movement changes.
- The form has a synchronous submission guard and visible saving indicator. Existing validation and duplicate checks remain.
- Nueva transacción retains the Gasto/Ingreso creation selector, with three separate Historiales controls below: Gastos, Ingresos, Mis dictados. The first two load the selected transaction type, with direct Editar actions and expansion beyond 50 records.
- History edits remount with the selected record identity/version, avoiding stale creation-form state. Save returns to the originating history; the X independently closes the sheet.
- Mis dictados embeds the existing pending-note editor with Guardar, correction, delete and confirmation behavior. Its scanner-page button is removed. Notification deep links to a pending dictation remain supported.

## Integrity and limits
No migrations, new dependencies, API, authentication, pricing or financial formula changes. Editing remains version-checked and atomic. The wrapper does not bypass bill-payment, debt-payment, goal or tax links; those specialized linked operations retain their existing origin-module protections. No attempt was made to rewrite those modules or relax their safeguards. Income deduction/net calculations, receipt recognition and encrypted persistence are unchanged.

## Validation
13 cases passed, no repetitions/failures:
- Five database tests for no-reason editing, linked-receipt edits, graph/month totals, audit/evidence preservation, stale versions, manual expenses and preserved debt-link guards.
- Two existing document-context/link-protection regressions.
- Four static UI tests for no motive field + Guardar, separate creation/history controls, all three history panes and scanner camera/gallery without Mis dictados.
- Two existing pending-dictation edit/confirmation cases.
TypeScript, ESLint, web export passed; Worker syntax checked at packaging. Physical iPad/iPhone/Android and browser tap-through verification was unavailable. Static markup tests do not prove device appearance or touch behavior.

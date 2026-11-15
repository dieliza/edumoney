# Ambiguous dictation category reminders — 2026.11.15.09

## Requested rule
A saved phrase such as Añade 100 dólares de limpieza de patio remains an ambiguous voice note. The internal bell displays Dictado ambiguo: ¿gasto o ingreso? and asks the owner to choose the type and personalize its category. No income/expense or balance change is inferred from an ambiguous sentence.

## Implementation
- Read-only inbox projection loads active, standalone voice notes from the existing encrypted database. Known income/expense notes get type-specific category reminders; unknown types get the explicit expense/income question.
- One stable notification ID per note prevents duplicate alerts and preserves read markers across edits. Resolved/deleted/corrected notes no longer qualify.
- After successful voice saves/updates/resolution or UI deletion, a payload-free local event refreshes the bell. A failed write does not emit a new reminder; observer failures cannot fail persistence.
- Revisar deep-links to the specific pending dictation and opens its editor. Personalizar categoría opens the existing category administration screen, where income/expense categories can be created or edited.
- Existing ambiguous-note persistence still requires Guardar. The reminder does not silently save microphone audio or an unconfirmed financial movement.

## Compatibility/privacy
No database migrations, new dependencies, API calls, AI usage, billing changes or OS push enrollment. Existing notification pause/read preferences remain effective. Financial text remains in the encrypted database and in-memory inbox rendering; read preferences still store identifiers only. This is an in-app reminder, not an email/push or a server-scheduled recurring alert. Cross-device refresh follows existing sync/open behavior; read markers remain device-local.

## Validation
20 cases passed, one run, no repeats: six new reminder/database/event cases, five existing inbox/preference cases and nine pending-note regressions. Covers the exact patio example, income-vs-expense wording, unchanged financial totals, stable deduplication, update/remove/resolve behavior, event timing, failed saves, observer failures and separate databases.
TypeScript, ESLint and web export passed. Worker syntax checked during packaging. Physical-device/browser visual and tap-through verification remains unavailable; deep-link route payload and storage behavior are tested in code.

# Transaction-level income/expense charts — 2026.11.15.07

## Diagnosis
Income categories were present in stored movements but the chart breakdown and category-trend selector only included expenses. Monthly totals were correct; that aggregate presentation did not expose each incoming/outgoing transaction.

## Changes
- Added a read-only chart model returning one point per income/expense movement with the existing ID, financial date, amount, description and stored category. It does not merge transactions, even when date/category/amount match.
- Home's compact chart defaults to individual movements. Resumen preserves the original circle/totals/format controls; Movimientos returns to the individual view. Green identifies income, red expense. Bars/columns share a scale and print exact monetary values.
- Charts defaults to Cada movimiento, with month, type and category filters. Existing monthly trends, full category breakdown, categories/budgets and monthly transaction-history access remain available.
- Breakdown now supports both income and expense categories; selecting one shows its individual movements. Monthly category trends support income, personal/archived categories and distinct income/expense uncategorized entries.
- Every bar labels date, income/expense, category and description. More movements can be expanded beyond the initial display count; no record is discarded or aggregated by the transaction view.

## Integrity
No financial writes, inferred recategorization, migrations, APIs, dependencies, authentication or pricing changes. Existing net monetary values and financial formulas remain unchanged. Original category names (including archived ones) are read from the same encrypted snapshot. Unclassified historical records stay labeled Sin categoría; missing metadata is not invented. Only the recorded financial date is displayed; capture time is not presented as transaction time.

## Validation
17 cases passed, no repeats/failures:
- Eight new model tests: distinct transactions, date/type/category filters, excluded loans/transfers/debt/goals/deleted records, archived/custom categories, exact reconciliation to monthly totals, income trends, immutable source data and more than 50 records.
- Four existing monthly chart and two persistence regressions.
- One persisted voice-to-chart integration for Gané 100 dólares de mi sueldo: income amount 10000 cents, Salario, recorded date and original text; separate food expense preserved.
- Two static render tests assert separate salary bars, exact amounts/category labels and preserved access to Home's original circle.
TypeScript, ESLint and web export passed. Worker syntax checked at packaging. Static rendering and mocked native views do not establish physical browser/device appearance; iPhone/iPad/Android/PWA visual checks remain pending.

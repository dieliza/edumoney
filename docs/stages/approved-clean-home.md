# Approved compact Home — 2026.11.15.08

## Approved scope
Home keeps the existing header controls/branding, greeting, month control and estimated available balance. Below the balance, one row contains exactly three neon actions: red Gastos / Ingresos, cyan Escanear recibo, and green Dictado por voz. The existing Top 3 expense block follows. The original official logo, bottom navigation, theme and notification/security controls are unchanged; generated mockup example figures are not imported into real financial data.

## Implementation
Removed the Home chart block and Home debt tile. Moved the existing voice trigger into the third neon tile; recording/transcription/save logic remains in the same component and executes from the direct button gesture. The voice animation, review form and privacy detail appear only when the dictation flow has activity, text, errors or confirmation, keeping idle Home clean while preserving in-place review/save.

The next Charts page now has Resumen for the relocated original circle/totals and retains Cada movimiento, Tendencias mensuales and Desglose mensual. A functional Deudas y mis facturas shortcut opens the existing debt module. Top 3 continues opening the full expense breakdown. No routes or financial modules were deleted.

## Integrity
No migrations, new dependencies, API, authentication, billing or financial formula changes. Movement/category/receipt data and existing duplicate protection remain unchanged. Existing native installations need a new native build for source changes; the web deployment is updated here.

## Validation
Seven focused cases passed without repeating completed cases:
- Three static-render/navigation cases for allowed Home content, retained expense/scanner callbacks, and charts/debt access on the next page.
- One callback case covering all five neon variants, including the new voice variant.
- Two existing transaction-chart render cases.
- One additional relocated-summary case verifying the circle and access to individual movements.
The first static-layout suite failed during module import because the test lacked a mock for native Expo Crypto; zero layout cases ran at that time. Added the isolated ID mock and ran the three layout cases successfully. Conservative budget: eight attempts including that setup failure, below 100.

TypeScript, ESLint and web export passed; packaged Worker syntax checked before publication. Static markup/callback checks are not real Safari/iPad/Android/PWA visual or microphone tests. Device appearance and microphone QA remain pending; no pixel-perfect comparison is claimed.

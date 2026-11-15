# Home buttons, chart navigation and in-app inbox — 2026.11.15.01

## Changes
- Styled only the four Home actions with green, red, cyan and purple gradients, highlights and SVG artwork inspired by the supplied reference. Existing action callbacks remain unchanged.
- Removed Home Transacciones and Gráficas y categorías shortcuts. Historial remains available in the side menu. Header graph icon sits below the theme control and preserves the selected ledger month; the bell sits beside themes.
- Compacted chart view/range tabs while preserving 44px touch targets. Labels now say Desglose mensual and Transacciones mensuales.
- Added an in-app inbox derived from existing pending bills, debt minima, scheduled income and earned educational awards. Linked bill/debt notices are deduplicated. Opening/returning refreshes records; no financial records are written by the inbox.
- Read markers and tray pause setting persist per local vault. Only notice identifiers and preferences use AsyncStorage, without financial text or amounts. Read state is device-local, not synchronized. Pause affects this tray only; existing OS reminders retain their settings.

## Compatibility
No migrations, new dependencies, provider/API changes, authentication changes, financial calculation changes, paid services or push enrollment. No claim of remote message delivery while the app is closed. Settled records cease appearing as pending notices; this is not a permanent delivery archive. Existing installed native binaries need a new build to include these source changes.

## Validation
Six focused tests passed (five inbox/preferences cases and one four-button callback case), with no repetitions. TypeScript passed. ESLint and web export passed before final packaging (see publication receipt below). Callback tests assert the exact provided handlers are retained. No physical iPhone/iPad/Android or browser visual QA was available; visual matching and device behavior remain for device review. Existing records are preserved.

## Publication
Published successfully to https://edumoney-web.diegoluissantospabon.chatgpt.site

- App version: 2026.11.15.01; Sites version: 40.
- App implementation: 5b96040 on web-edumoney (GitHub main untouched).
- Hosting source: 3f83c958419f26970cd4d1f8fb98c4200b46a5f7.
- Saved version: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_228ea17b47dc8191b37b475be79670d0.
- Deployment: appgdep_6af912ff4e448191b92ac8cbf6519c4c, succeeded, existing environment revision 1 preserved.
- TypeScript, ESLint, web export and packaged Worker syntax check passed.
- Public audience preserved; no runtime secret changes.

# Home: hold-to-dictate and deterministic classification — 2026.11.15.04

## Behavior
Home includes a round microphone separate from its existing three action buttons. Hold to speak and release to stop, review/edit the transcript and press Guardar. It does not open the documents screen's legacy stop/cancel controls. Desktop supports holding Space/Enter; assistive technology can start/end through the same control. Pointer capture, pointer cancel and blur release the microphone. App background/navigation aborts recognition; a release during pending permission is applied as soon as the session is available.

## Classification without a new AI service
A local deterministic parser proposes income/expense, one amount, date, explicit payment method and an active category. It handles common Spanish amount words (up to hundreds), numeric currency, cents, ISO dates, hoy/ayer and category aliases. Existing/personal categories are reused. Unknown/ambiguous category uses a new Dictado por voz category of the appropriate income/expense type on confirmed financial saves. An archived category is preserved and a numbered alternative is created/reused.

Negation, future dates/payments, loans/debts/transfers, competing amounts/types, unknown method, uncertain dates and excessive text remain notes. No arbitrary rate, total, method or financial value is invented. Date defaults explicitly to today in the displayed proposal. No financial record is saved until Guardar; review shows either a financial proposal or reasons for a pending note. Multiple transactions in one dictation are not automatically split. Unsupported phrasing can remain pending even when meaningful to a human.

## Persistence and integrity
Uses the existing encrypted DocumentStore and MoneyStore: no schema or authentication changes, no new APIs or dependencies. Full recognized text is retained as source=voice in Documents, and Home's Mis dictados link opens the voice-filtered list. Clear confirmed entries create a linked movement and feed the normal monthly summaries; pending notes do not affect totals. Existing duplicate checks, idempotent document IDs and synchronous save guarding are preserved. Recognition itself never writes money. Existing entries/categories are not reclassified. Saved text follows existing encrypted backup/sync behavior, not public localStorage.

The browser voice engine may use its provider's services; the web UI discloses this. Deterministic classification makes no AI request and uses no Anthropic credit. No claim of fully offline speech recognition is made. Native speech module remains unchanged. Existing APKs need a new native build for this UI.

## Validation
19 focused cases executed, all passed, no repeats:
- 13 initial parser/database cases (cents, income/expense, personal categories, ambiguous/negative/future inputs, duplicate protection, month totals, persistence, separate databases).
- Four hold-control cases (press/release, cancel/retry, keyboard, assistive activation).
- Two additional long-input/archived-category cases; original 13 skipped on that run.
TypeScript, ESLint, web export and Worker syntax checks are required before publication. React best-practices review applied to hook lifecycle, event handling, accessibility and side-effect placement. Expo 58 reference consulted.

No browser/device microphone or visual QA was available. Real Safari iPhone/iPad, Chrome Android, installed PWA and desktop microphone checks remain pending; mocked control tests do not prove physical recognition quality.

## Publication receipt
- Published successfully: https://edumoney-web.diegoluissantospabon.chatgpt.site
- App 2026.11.15.04; Sites version 43.
- Implementation commit 8cfd772, branch web-edumoney; GitHub main untouched.
- Hosting source 38d8b8069889ed76cd90dc7c99f9820fe8cfded8.
- Saved version appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_d41870bdb3a88191a2d9c7380f45c938.
- Deployment appgdep_6af91b40d6f88191aefef5f8e45859da: succeeded. Public audience and existing environment revision 1 preserved.
- Final TypeScript, ESLint (zero warnings), web export and packaged Worker syntax checks passed.

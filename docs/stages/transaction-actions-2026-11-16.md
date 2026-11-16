# Transaction actions and chart controls — 2026.11.16.8

Scope: trash icon alongside Edit in expense history, Spanish transaction terminology throughout visible source copy, and six equal-size colored chart tabs using the debt palette. No schemas, migrations, financial calculations, authentication or API changes.

The trash action persists the existing reversible soft deletion with an internal audit reason; no confirmation prompt. Document version and movement version checks and all debt/bill/tax/goal link protections remain enforced. Success updates local rows and refreshes totals; errors remain visible. Double presses are guarded. Restore remains in Eliminados.

Chart controls share 144 × 56 dimensions, 800 font weight and six distinct colors; the existing horizontal scroll and radio selection semantics remain. Other Choices callers retain their original sizing.

Validation: 15 distinct focused tests. First run: 13 passed, 2 failed because the old Sheet test mock omitted headerAction. Corrected the mock and reran its four cases: all passed. Total executions 19/100. Covers document-linked soft deletion and restoration, stale versions, debt protection, editing, history navigation, debt navigation and shared chart button styles. TypeScript, ESLint, web build and worker syntax checks are recorded in this task's logs. No real-device or browser visual verification was available; no claim of physical iOS/Android validation. Existing stored descriptions and historical audit text are not rewritten.

Publication confirmed succeeded: Sites version 64, source cdca4c93c6378e8b05ef0ac95bc7b0dd21b9dae0, saved version appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_776c8939fd0c8191aed8ec4439c31969, deployment appgdep_6afa981ab58c81918e1aa0ceede45698, environment revision 1. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site . Implementation commit 57f13c6. TypeScript, ESLint, web compilation and worker syntax checks completed successfully.

# Progress month selector and biometric activation repair

Reported Safari error precisely identifies the build issue: the appended enableBiometric wrapper used `r(32010)` but module877 declares `const r='edumoney-local-biometric-v1'`; its Metro loader parameter is `_r`. Correct the call to the actual factory loader and fix the original packaging recipe to read its parameter name. Preserve WebAuthn user verification, PRF support checks, AES-GCM, IndexedDB envelope, account key verification and all fallback/error handling. No biometrics or password data is collected by EduMoney.

Replace only the progress-month text field with a themed native HTML month input and an explicit calendar icon button. Direct user interaction invokes showPicker, with focus/click fallback when unavailable. Keep YYYY-MM internally and reject empty/invalid selections; preserve all progress calculations. Native source fallback reuses existing MonthControl. No Expo/React Native API changes.

Verification: TypeScript and targeted ESLint passed. Six packaged artifact scenarios planned: canceled activation reaches WebAuthn, PRF/AES/IndexedDB full roundtrip, no PRF cannot enable, wrong credentials cannot create authenticator, valid month selection, unsupported showPicker fallback. WebAuthn is simulated; real iPhone Face ID unavailable in this environment. No actual personal financial data, biometric key or credential modified in tests.

## Prepared release127
Actual artifact cases all six passed. Local six-case fixture run also passed; repeated cases included in budget. Earlier packaging aborted before mutation because the label matched a required-fields registry instead of the screen; predicate now also requires progress-month. An earlier first-case attempt stopped because simulated location was missing; fixture corrected, production code unchanged by that test fix. Conservative14 cases consumed before live HTTP checks,17 expected after three live checks, below100.

Build calendar-biometric-3188abc4a7c1, source fcb77449181c0f12483febbda3f01aa7e306d73d based on126 d038f9918220ce684a8dde76dbf22ad81459909f. Modified factories877 and856; added32013. All1,420 unrelated factory bodies preserved exactly. Archive omitted because of persistent workspace capacity; build completed in isolated process-local memory and native remote build used for publication.

Final surface correction preserves the original field's themed opaque card and16px radius, preventing the month label from sitting directly on the page background. This follow-up modifies only module32013; all other1,422 factories (including the already verified biometric fix) remain unchanged. Two calendar scenarios repeat with an added surface/radius assertion. Final budget planned19 cases including three live checks.

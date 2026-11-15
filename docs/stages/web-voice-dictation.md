# Browser voice dictation — 2026.11.15.03

## Scope and behavior
The existing Escaneo y documentos > Dictar datos control now uses browser SpeechRecognition or Safari's prefixed webkitSpeechRecognition. It starts directly in the user's click, in es-PR, with interim text, one alternative and a single utterance. No new dependencies, API, billing, schema, authentication or financial calculations.

Text passes through the existing review/proposal form; the user chooses expense/income and confirms the fields. Recognition never saves a financial record automatically. A second dictation appends to the existing draft, cancellation retains recognized text, and result revisions replace interim hypotheses rather than duplicating them. Stop permits the final result; cancellation/navigation suppress late callbacks. A 45-second stop and 3-second cleanup fallback bound microphone sessions.

Browser permissions, missing microphone, no speech, unsupported browsers and network errors display recovery guidance. Manual typing/pasting and the keyboard microphone remain available. Native on-device recognition implementation is unchanged.

## Privacy and limitations
The browser's provider may process audio remotely. This is disclosed in the web screen; no guarantee of offline or zero-retention recognition is made. EduMoney does not record/upload audio to its own API or Anthropic. No new transcription API or charge to the Anthropic balance. Platform permissions are controlled by the browser and may be requested again according to its settings. Availability varies by browser, device, installed PWA, language and network.

## Validation
- 14 cases passed: seven browser-recognition tests and seven existing native tests, one run, no repetitions.
- Covers synchronous start, Safari prefix, interim numbers, final results on stop, abort/retry, permission/network errors, absent support, secure-context guard, stale callbacks and time limits.
- TypeScript, ESLint and web export passed. Worker syntax check runs at packaging.
- Browser tests use a mocked recognition engine; no real audio/browser/device validation was available. Physical Safari iPhone/iPad, Chrome Android, installed PWA and desktop microphone checks remain pending.

## Files
src/modules/documents/voice.ts, DocumentsScreen.tsx, src/ui/buildVersion.ts, tests/documents-voice-web.test.ts and this report.

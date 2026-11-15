# Voice feedback and pending dictations — 2026.11.15.05

## Diagnosis and interaction
The prior control stopped on pointer release and blur, including possible permission-prompt focus changes, and showed a listening state before the recognition engine confirmed start. A short tap could therefore stop before any transcript. This is a code-level failure path, not a verified diagnosis of the owner's physical iPad.

The microphone is now a 104px tap-to-start/tap-to-finish button. Browser start runs directly inside the trusted click, supporting native button keyboard and assistive activation. Release/blur no longer stops recognition. AppState inactive does not abort a permission prompt; background/navigation still ends the session. Startup has a 30-second recovery timeout. Native startup remains cancellable while permissions are pending.

Home distinguishes Preparando micrófono, Escuchando and Terminando. A high-contrast animated waveform is displayed only after the engine's start event. It indicates session activity, not measured voice volume. Reduced motion preferences disable the animation while retaining color/text status. Empty results, permission/network/unsupported errors are visible; manual text entry remains available on errors. Transcript updates and Guardar remain in Home. Extra status prose was removed; provider privacy information is collapsible.

## Mis dictados
The former scanner Dictar datos action now opens Mis dictados. This screen lists only active, standalone voice notes, with inline Editar, Guardar and Borrar. Confirmation of a complete edited note creates the linked income/expense and removes the pending note atomically. Failures, duplicates and stale versions leave the note pending. Confirmed financial records remain in financial history and normal document records, outside the pending list.

Delete is a version-checked soft withdrawal of an unlinked voice note, with encrypted audit history. It cannot delete/edit a confirmed financial document, bill or receipt through these new methods. Withdrawn/resolved voice-note fingerprints become tombstones so the same ambiguous phrase can be dictated again without changing receipt duplicate protection. Financial creation and pending withdrawal share the existing transaction. Editing an incomplete note updates it without creating a second note or movement.

## Compatibility
Existing encrypted stores/schema are reused: no migrations, new dependencies, authentication changes, external API or billing changes. Existing financial formulas and classifier rules remain unchanged. Recognition may use browser-provider services; no Anthropic call is added. Existing native binaries require a rebuild for these source changes.

## Validation
- First run: 19 voice/control tests passed (4 updated tap-control, 8 browser, 7 native).
- Second run: 23 database/classifier tests passed (8 pending operations, 15 classifier regressions).
- After tombstone handling: 9 pending tests passed, including 8 repeated cases and 1 new case.
- Total: 51 executions, 43 distinct cases, all passed; within the 100-case limit.
- Covers click/permission focus behavior, engine-confirmed status, final/interim text, duplicate prevention, note edits, delete guards, stale versions, idempotent confirmation, transactional rollback and repeat dictation after withdrawal.
- TypeScript, ESLint, web export passed. Packaged Worker syntax checked before publication.
- No real microphone/browser or physical iPhone/iPad/Android/PWA validation was available. No visual screenshot or recognition-quality claim is made. These device checks remain pending.

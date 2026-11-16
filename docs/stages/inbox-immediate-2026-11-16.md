# Immediate dictation task indicator — 2026.11.16.11

The inbox has no scheduled 30-second delay: saveVoiceEntry signals after local persistence. Two issues were addressed: initial/refresh snapshot races could overwrite newer data, and reviewing a pending task marked its notification read so the badge disappeared even though the task remained unresolved.

NotificationBell now uses one serialized, coalescing refresh controller for initial load, save events, reopen and app activation. A change during a read forces a new read and suppresses the superseded snapshot. Unmount disposes callbacks. Pending voice tasks remain counted in the attention badge independently of read status until the underlying note is resolved or deleted. Other read notifications and explicit paused inbox preference retain their behavior. A failed refresh shows ! on the bell with an accessible error label; opening it permits retry. Existing personalization shortcut is preserved for direct dictation routes.

No OS push, server timers, new permissions, financial changes or new APIs. This is the existing app inbox and updates after a pending dictation is saved.

Validation: 18/100 focused executions, all passed. 17 inbox/controller/voice reminder tests plus one new real SQLite save→commit event→inbox refresh→attention badge integration case. No timers or 30-second waits needed for that integration. Covers overlapping reads, read-yet-unresolved tasks, removal, retry, disposal, isolation and preferences. TypeScript, ESLint, web build and worker syntax checked. No physical device/browser QA available; automated controller/integration tests do not measure the user's device latency.

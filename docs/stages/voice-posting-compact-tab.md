# Compact dictation history and financial posting — 2026.11.15.06

## Scope
Removed the Mis dictados action from Home. The existing scanner-page action is now a compact, content-width tab with 44px minimum touch height, smaller icon/text and no equal-width expansion. Its destination and edit/delete behavior are preserved. Microphone gestures and scanner capture are unchanged.

## Posting diagnosis and fix
A dictation with a clear expense/income and amount but without a spoken payment method was previously saved as a note. It therefore correctly did not enter financial summaries, but gave the owner the impression that recognized expenses were not reflected.

Home and pending-dictation editing now show the existing payment-method selector for that specific missing-data case. Guardar retains the text and requests that confirmation instead of silently sending it to pending history. The user explicitly selects the payment method; no cash, credit or other method is assumed. The selected method is passed into the existing classification/save flow without rewriting the original transcript. A spoken method takes precedence. Other ambiguities remain pending, preserving financial safeguards.

After a confirmed Home save, the ledger refreshes and shows the transaction's month so its expense/income and category distribution are visible in Home's chart. Existing monthly formulas and credit treatment remain unchanged. Previously saved pending notes can be completed with the same selector and confirmed into a movement through their existing edit view.

## Validation
30 distinct cases exercised: 15 classifier/storage regressions, 9 pending-note cases and 6 new payment/posting cases. Initial run had 29 passes and one assertion using the wrong chart-data property; corrected that assertion to the existing spent field and reran only that case successfully. Total 31 executions, below 100; no product failure remained.

New coverage verifies expense posting, category chart spent totals, available balance, income totals, existing credit behavior, completion of old pending notes, preservation of ambiguous notes, spoken-method precedence and absence of an automatic method default.

TypeScript, ESLint and web export passed; packaged Worker syntax checked before publication. Browser visual and physical-device verification remain unavailable. No migrations, dependencies, API, authentication, pricing or unrelated function changes.

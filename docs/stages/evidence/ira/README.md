# IRA and jurisdiction implementation

## Integration

The existing FundsSummary dashboard gains one IRA card using the same component/gradient/typography and showing **net confirmed transfers**, not projected contributions or returns. IRA assets remain outside spending availability. The actual restricted asset, opening balance and returns are visible in IRA details. The Total de fondos includes the actual restricted asset once.

The IRA screen reuses Screen, Card, Sheet, Choices, automatic decimal Field, ThemeProvider and the existing MeaningHelp, including the exact explanation requested for restricted availability. It supports multiple institutions, four IRA types (federal traditional/Roth and PR deductible/nondeductible), account editing, opening assets, contributions, withdrawals, signed returns/corrections, traceable reversals, schedules, history and a contributions-versus-returns growth display. Existing web routing is reused: `/funds?kind=ira&scope=personal`; the Expo source also includes `/ira`.

Confirmed contributions and withdrawals reuse FundsStore.transferInTransaction and MoneyStore's single serialized encrypted database queue. No bank operations, ordinary consumption expenses or new income rows are created. A previously assigned budget fund can supply an IRA without reducing available twice; outstanding obligations remain protected. Budget availability uses the existing monthly budget report with a transaction change guard. Future income is never treated as current cash. The IRA cannot be converted into an ordinary fund. Initial balances are prior restricted assets, not newly deductible contributions. Scheduled contributions are plans until explicitly confirmed, with deterministic occurrence IDs and atomic next-date advancement.

## Data

Additive SQLite migration **23**: ira_accounts, ira_events, ira_contributions, ira_schedules, ira_tax_inputs, tax_jurisdiction and ira_audit. Existing financial rows are not rewritten. Encrypted backups/sync include these tables; earlier backup formats remain accepted with a warning before replacement. Business totals and other users' encrypted databases remain separate.

Annual tax and Planilla screens receive the IRA summary sourced from confirmed nonreversed transfers and approved jurisdiction policies; the existing PR calculation engine is unchanged. Contribution, eligibility, deduction and estimated tax saving are different values. Age, earned income, eligibility attestation and optional taxable income stay in the encrypted local database. Unknown values/rules are pending, not fabricated zeros. Different IRA policies can share a combined annual group.

## Server research and owner review

`web-server/tax-rules.mjs` uses the existing R2 binding and owner authorization; no administrators, collaborators, roles, secrets or paid research services are added. Ordinary research requests are authenticated and accept **only jurisdiction and tax year**. Government requests contain no personal financial payload. The server permits HTTPS `.gov` URLs, bounds redirects/body sizes, follows a few relevant links only within the selected jurisdiction and IRS domains, fingerprints evidence, retains effective years and immutable history, reuses cached investigations and prepares changes for review. It does not research all 50 states in advance.

Approval requires the existing owner, the exact draft version, explicit review, exact official-source citations and unchanged fresh source hashes. Proposed rules are not used in calculations. Owner review is appended to existing Administration and reuses the already authorized owner device. Weekly refresh/status tools are added to the existing Site MCP server; the existing education tools and monthly automation remain intact.

## Validation

See logs and test-ledger.txt. 89 executed unit/regression cases including repeats, followed by 9 browser cases including the corrected research case (98 total before final production/updater checks). All final selected assertions passed. One initial backup test had an incorrect asynchronous assertion for a synchronous validator; corrected the test. The first browser investigation case caught a missing dynamic-import mapping; changed the service to a static import and corrected the compiler's quoted-require detection before publication.

Real Chromium, isolated fictitious identity/local encrypted vault and blocked external write APIs: create IRA; contribute $200 from $1,600; verify available $1,400 and restricted $200; add $15 return with no increase in available; confirm a scheduled weekly $25 contribution; automatically request PR/NY research with only jurisdiction/year; validate 390px and 412px layouts and dark dashboard. Screenshots are in this directory. Fake balances are test-only. No real accounts or user finances were used.

TypeScript and targeted ESLint pass. Expo exports for iOS and Android compile successfully. There is no physical-device/simulator execution available in this environment: mobile browser viewport checks do not establish Safari/WebKit or native runtime compatibility.

Static packaging compares every unrelated module factory and every decoded asset/route, preserves all historical URLs, canonical `/sw.js`, coherent aliases, push and safe activation. Static payloads use the existing lossless codec, expanding individual historical assets on demand to avoid startup CPU/size limits; financial factories are unaffected by this storage representation. Core/runtime modules are not relocated. All compiled source hashes are checked against the reviewed checkout.

## Deliberate pending items / technical limits

- **No new real tax catalog is pre-approved.** New jurisdiction/year calculations remain pending until the owner verifies the official evidence and approves structured rules. The service collects evidence; it does not claim autonomous legal interpretation.
- Full federal/state returns, withholding, credits, forms and exceptional eligibility are recorded as pending coverage where no approved evaluator exists. Existing PR work is preserved. Cross-residence/work coordination remains pending rather than inventing an interjurisdiction deduction or credit.
- PDF-only sources require manual owner review; the research crawler does not parse official PDF tables automatically. Unavailable/nonofficial sources cannot produce an approved calculation.
- Native local accounts currently have no online account JWT. New research activation is available through authenticated EduMoney Web; native apps save the selection, can read approved rules, and clearly report that activation must be done on Web. No authentication bypass was added. Completing automatic activation directly from native requires integrating the native online identity/session path.
- No iOS App Store/Android release or physical-device execution is claimed. Native code/build artifacts are prepared; actual device validation remains pending.
- Scheduled IRA contributions require confirmation; no unattended transfer of money is performed.

Final deployment and weekly scheduling results are recorded in publication.json and schedule.json when available.

## Published result

**Version 156** is live at https://edumoney-web.diegoluissantospabon.chatgpt.site. Source commit `f99dde44b028a5a2f31ae5fb3c4c4dd1a4017fa7`; archive-backed deployment succeeded, public audience and environment revision 4 preserved.

A fresh production Chromium context passed the combined end-to-end/update-delivery case: real existing login with isolated fictitious identity; confirmed IRA contribution and return; account institution edited; opening date cannot move past earlier financial records; available $1,400, net transferred $200, restricted asset $210, total $1,610; dashboard displays net transferred $200. No uncaught page errors. Canonical service-worker delivery and published factories were verified. Anonymous rule administration returned 403. No real users, bank transfers or personal balances were involved.

Weekly schedule saved and enabled for Mondays **08:00 America/Puerto_Rico**, first scheduled occurrence 2026-11-30. Existing monthly education automation was preserved. Existing owner authorization was verified through the connected owner tool. **Immediate unattended-run/readback verification remains pending:** automation execution control returned `404 Action not found` before invoking the new writer, and new tax tools were not refreshed in this conversation's connected tool surface. No claim of a completed weekly run is made. The schedule and exact error are recorded in schedule.json.

Final test ledger reached **100/100**, including repeats and the blocked automation verification. No further cases were run. Native exports are successful builds, not physical device tests. See the technical limitations above before treating the implementation as fully verified across all platforms/jurisdiction scenarios.

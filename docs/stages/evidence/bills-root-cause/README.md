# Facturas: original blank-screen cause

Production v153 was reproduced in real Chromium with a new isolated profile, opening `/bills` before Goals. The actual uncaught error was `Requiring unknown module "806"`; body became empty. BillsScreen (849) renders shared GoalCalendar (39000), which imports goals/localStore (806). That store and its GoalStore dependency (807) were registered exclusively in the lazy Goals chunk. Opening Bills first therefore failed during render.

The fix relocates the **unchanged** 806/807 definitions into the common bundle and removes their old declarations. It also corrects the original calendar packaging script so future regeneration retains that dependency closure. All 1,455 module factories compare byte-for-byte with v153. No financial logic, forms, routes, screens, fallback, exception suppression, authentication, database migrations, or user data changed.

Static packaging reuses the existing Z85 codec for content suffixes as well as the prefix pool, staying below the hosting size limit while preserving every decoded payload and historical URL. The packaging reader understands both old and new representations. Every route, asset payload and service-worker alias is checked; canonical `/sw.js`, push handlers and safe activation remain intact.

## Validation

- Real-browser reproduction: `browser-before.json`, `before.png`.
- Real Chromium against the exact local Worker: cold Bills load; create $100 fictitious invoice; edit to $120 with reason; confirm payment; invoice appears paid and in calendar. All passed without page errors. `browser-local.json` also records one **test harness failure** at reload: it checked for a login field before rendering completed; the expected login screen appeared. Persistence is covered by existing SQLite tests; this particular browser reload was not validated.
- Separate browser navigation: Bills, Mis deudas, monthly budget/Proyección de fin de mes (opened), Mis metas, Aprende, Mi progreso, Mi dinero, Negocio. All passed, no uncaught errors (`browser-local-routes.json`). These are navigation smoke checks, not exhaustive verification of every operation.
- 51 targeted unit/regression cases: 47 passed initially, 4 failed. Two new fixture maps used unquoted keys although production uses JSON maps; corrected the fixture. Two old Bills assertions expected masculine “vinculado” while the existing product message says “vinculada”; corrected only the assertions. Repeated affected 21 cases: all passed. Debts and budget simulation already passed, no product changes needed.
- TypeScript and targeted ESLint: passed.
- Worker build: passed, 10 reachable modules, 66,668,706 bytes.
- Test budget: 94 executed browser/unit cases including repeats and conservative initial allowance; two checks reserved for live cold-load and public delivery. Build/typecheck/packaging assertions are tracked separately (no additional test cases).

Browser tests use fictitious identity and an isolated encrypted local vault. Auth responses are fixtures; outbound API/write requests are blocked. No real accounts, balances, recovery emails, notifications or bank operations were touched. Fixtures are test-only and are not deployed.

Publication and post-publication results are recorded separately in this directory.

Local Worker build succeeded in the retained source workspace. Deployment used the pushed-source remote build because that workspace's `/dev/shm` mount cannot be passed as a local archive to Sites, and the shared filesystem had less free space than the 66.7 MB output. Production audience remains public and environment revision remains 4.

The first publication attempt (v154) was rejected by hosting startup CPU limits. It is not a successful publication. The follow-up package bounds additional Z85 transport to 12 MB and uses a lookup table in the existing decoder, keeping decoded assets identical while reducing startup work. See the final publication record for the successful version.

## Final production result

Version **155** published successfully, source `068a0e1c7c1d29b34548e4c9438602bd3c0ab960`, environment revision 4. A new real Chromium profile opened production `/bills` directly through the existing login: **passed**, empty invoice list rendered, no page errors, without opening Goals. Screenshot: `after-production.png`; trace: `browser-production-routes.json`.

The first public-delivery script invocation could not reach the egress proxy (`ECONNREFUSED`); repeated with Node's existing environment proxy support. Both attempts count toward the limit: **97/100 actual browser/unit cases/checks including repeats and conservative initial allowance**. Production delivery verification is recorded in `public-delivery.json`.

No migrations or real-user data changes. Modified implementation files: shared-module promotion helper; original calendar packager; corrective Bills packager; static graph reader and existing lossless codec. Tests add three shared-registration cases and correct two stale grammatical assertions. No screen/component redesigns or alternative mechanisms for opening Bills.

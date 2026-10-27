# Account workspace upgrade

The site entry opens `pages/journey.html#home`. Existing replay hashes still route to `pages/backtesting.html`. The shared sidebar links the overview, replay, strategies, analytics, screenshot journal, library, mindset and vision, builder experiments, private documents and weekly reviews.

## Database and files

`public.journey_records` is keyed by `(user_id,id)` and holds a kind, JSON payload, optimistic integer revision and update timestamp. SELECT/INSERT/UPDATE/DELETE are restricted by four owner RLS policies. Anonymous access is revoked. The private `journey-private` Storage bucket accepts PDF/JPG/PNG/WebP files up to 50 MB; owner folder policies permit insert, select and delete. File names are immutable random IDs. The executed schema is recorded in `docs/journey-database.sql` and Supabase migration history (`mytradingjourney_private_records_and_files`). Existing tables and history policies were not altered.

New pages use `journey-api.js` directly; they do not use the legacy browser storage mirror in cloud.js. Only the Supabase authentication session persists in browser storage. Reading records and other workspace records are fetched from the database. Uploads use private Storage; readers use owner-authorized expiring URLs. PDF.js 5.6.205 and supabase-js 2.57.4 are pinned, delivered by jsDelivr. The reader renders uploaded PDFs, offers page/zoom controls and saves reading position through revision checks. PDFs are supplied by users; commercial ebooks are not bundled. The 21 default covers are original SVG designs and can be replaced with uploaded cover images.

## Replay compatibility

Sessions retain `onepercent:backtesting:v1:<account-id>` in the existing user_data database rows. The existing BacktestSync concurrency adapter now receives an in-memory storage adapter rather than browser localStorage. Drawing favorites, desk settings and templates use that same adapter and are included as optional `preferences` in the schema-1 workspace backup. Session/strategy payloads and replay calculations retain their existing format. Unsaved network changes stay in memory and prompt before navigating away. A successful server acknowledgement updates the save label. Offline records are not silently persisted in browser storage.

Old browser records are never deleted. Library and replay each provide an explicit import option. Replay import replaces the loaded account workspace only after confirmation, so export its backup first. Reading import replaces matching notes while keeping file attachments. JSON reading backups contain file references, not the private file bytes. The files remain in the account and can be opened/downloaded individually.

## Validation

124 Node tests pass. Browser QA with a deterministic test account service covered shared navigation, 21 books, note/PDF upload, reloading records from that service, PDF rendering/page bookmarking, journal net R, session creation/database save and no new localStorage record writes. Desktop and 390px phone layouts were inspected. SQL assertions against the connected database tested owner read/update and blocked foreign read/update/forged insert inside a rolled-back transaction. Bucket privacy, RLS policies and grants were checked. Advisors reported no new journey-table or bucket findings; pre-existing project advisories were left outside this change. Real account uploads still require a signed-in browser; QA did not use the user's credentials.

## Rollback

Revert the website commit to restore the previous pages and storage adapter. Keep the new table and bucket so records/files are retained. Export account and legacy browser backups before any future destructive cleanup. This upgrade creates no new paid Supabase project.

## Partial exits, themes and uploads

Partial exits are explicit next-open requests with 25/50/75 percent and custom quantities. Brackets have opening-gap priority, fees allocate by exited quantity, and each exit records a leg and reason. The remaining bracket stays live, including on the partial-exit bar. Win rate and strategy counts group legs into completed positions; cashflow reports retain each exit date. Actions round-trip through existing single/portfolio backups. Legacy full-close review keys are preserved.

Appearance is stored as `journey_records` id `settings:appearance` and filtered from document lists. The sidebar toggle applies both CSS tokens and the live chart palette without resetting replay. No browser appearance record is written. The vault accepts mixed PDF/image attachments, and editing can remove individual attachments after a successful database save.

The library includes The 10X Rule, batch PDF import, automatic first-page covers and PDF page counts. It links the official Navalmanack free PDF and Project Gutenberg edition of Reminiscences. Private user PDFs are never included in this source repository.

Validation: 131 Node tests pass. Browser QA covers mixed attachment add/remove, theme changes, partial-close UI/database restoration, PDF reading, notes and account persistence with a test service. Real private book imports require the existing signed-in upload flow. A proposed temporary backend importer was rejected by automatic approval review and was not deployed.

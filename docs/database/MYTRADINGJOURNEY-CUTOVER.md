# MyTradingJourney database separation

Prepared 31 October 2026. Provisioning quote: $0/month at creation; future usage or plan changes may change the bill.

## Projects

- Existing shared project: `ecnxstqfnjaiibwiwwto` (TheOnePercent).
- New dedicated project: `lazdabmppsznsoaoufkj` (MyTradingJourney), Europe / Ireland (`eu-west-1`).
- New API URL: `https://lazdabmppsznsoaoufkj.supabase.co`.
- Organization selected in the supplied dashboard screenshot: `dsvyvjcgxnclhdkjpdcj`.

## Database prepared and verified

Applied migration: `mytradingjourney_private_workspace`, with SQL retained in `mytradingjourney-initial.sql`.

- `journey_records`: completed journal entries, book records, mindset, business experiments, documents and weekly reviews.
- `user_data`: compatible replay account state.
- `journey_learning`: library progress, plans, notes, checklists, ratings and reading goals.
- `journey_drafts`: drafts separate from completed entries.
- `journey-private`: private PDF/image bucket, 50 MB per-file limit.

All four tables have row level security and owner checks for select/insert/update/delete. Anonymous table SELECT privilege is revoked. The Supabase security advisor returned no lints after setup. These checks verify the schema; they do not prove an end-to-end authenticated migration.

## Live application status

The published app still uses the existing project. It has not been switched to the empty new project. Existing records and private files have not been deleted, reassigned or overwritten. The old project inventory reported 41 journey records and 56 private storage objects.

A new database does not automatically move authentication users, OAuth configuration, private files, replay market-history services, or browser-only Book Hub progress. Creating tables alone does not add autosave to a form.

## Required cutover sequence

1. Configure the new project's Authentication Site URL and allowed login/recovery redirects for `https://hooki535.github.io/MyTradingJourney/`.
2. Configure Google OAuth in the new project using secrets entered directly in the provider dashboards; do not commit OAuth client secrets or database passwords.
3. Establish verified user identity mapping between the projects. Do not export password hashes into client-side code or remap ownership based on an unverified client-supplied email.
4. Transfer the user's workspace rows and private files with explicit owner mapping; verify counts, PDF readability and attachment references. Retain the source until the destination has been verified.
5. Transfer personal replay state only. Per the user’s 1 November instruction, retain TheOnePercent as the read-only candlestick-history source for every available pair. Do not move, remove, or replace its history tables, catalog, payloads, or RPCs. Before a future personal-account cutover, preserve separately authenticated access to this original history source; destination Auth tokens are not valid source-project tokens.
6. Connect Book Hub progress and reader device files to database/private storage sync. Offer an explicit import for device-only and guest progress; never silently combine different accounts.
7. Implement debounced draft saves with optimistic revision checks. Flush pending saves before sign-out. Block sign-out with an actionable error if a save fails; report saved state only after database acknowledgment.
8. Change the common Supabase configuration across JourneyAPI and any legacy Cloud clients together. Use a project-specific auth storage key so TheOnePercent and MyTradingJourney sessions are independent.
9. Verify email login, Google login, confirmation and recovery, account isolation, uploads, replay, book progress, note autosave and sign-out on a second device.
10. Publish the verified cutover, then retain the old project as a recovery source until the user has confirmed the migrated records.

## Authentication configuration completed

Dashboard access was verified for `hooki535` in `hooki535's Org`.

- Site URL saved and verified: `https://hooki535.github.io/MyTradingJourney/`.
- Redirect allowlist saved and verified (two entries):
  - `https://hooki535.github.io/MyTradingJourney/pages/login.html**`
  - `https://hooki535.github.io/MyTradingJourney/pages/reset-password.html**`
- Email provider enabled; email confirmation remains required.
- Google provider enabled, verified through the public Auth settings endpoint. Email provider also verified enabled.
- User supplied a Google Audience screenshot showing their test account added. OAuth remains in Testing.
- Google callback shown by the dashboard: `https://lazdabmppsznsoaoufkj.supabase.co/auth/v1/callback`.

## Current blocker

Google OAuth provider setup is complete. The user reported rotating the disclosed OAuth secret; secret values were not copied into source files or migration notes.

The staged account connection is available at `pages/login.html?connect=new`. This mode initializes only the destination Auth client, uses the separate `mtj.workspace.auth.v1` session key, preserves the destination flag through OAuth/confirmation/recovery callbacks, verifies the user with Auth and an owner-filtered database read, and stops at a connection confirmation. It does not open the source workspace with a destination session. The normal login route and all workspace records still use the source project.

Next required handoff: the user signs into the staged connection using their Google test account. The new project was checked before this handoff: zero Auth users and zero journey records. Real OAuth callback and destination identity mapping remain unverified until that sign-in completes.

The live application remains connected to the source project; no accounts, records or private files have been migrated yet. Database-only creation and Auth URL configuration do not constitute a completed cutover.


## Staged self-service transfer

`assets/workspace-transfer.js` adds a review-and-copy flow after the destination connection is verified. The source client explicitly disables callback URL detection, so it cannot consume destination OAuth tokens. It uses the existing source session and independently validates each account using Auth `getUser`.

The review lists both account emails and counts before the user starts copying. Queries filter by authenticated owner; private files are listed only under that owner's prefix. It copies workspace records and only replay-related `user_data` keys, including remapping the owner suffix of the account replay key. TheOnePercent academy, trade, and profile keys are excluded.

Copies never overwrite destination records or files. Existing conflicts stop the process. File bytes are checked with SHA-256 after upload, including duplicate-file retries. Attachment owner paths are remapped only when the referenced source file exists. Source snapshots are rechecked before and after the copy. A transfer report is offered only after verification. Partial copies are retained for retry; source data is never deleted.

Remaining limits: this does not transfer browser-only Book Hub progress, local IndexedDB PDFs/annotations, or provision market-history services. It does not switch the website backend. Authentication and real storage/RLS transfer still require the user's sign-in; automated tests use isolated fake clients.


## Cloud saving added to the current workspace — 1 November 2026

The live application's source project remains `ecnxstqfnjaiibwiwwto` until account migration and history provisioning are verified. To make the current workspace persist user data now, migration `private_learning_progress_and_drafts` added owner-only `journey_learning` and `journey_drafts` tables there. The SQL is retained in `account-learning-drafts.sql`; the destination already has compatible tables. No source records were moved or deleted.

- Book Hub learning profiles load from the account database into memory. Edits use debounced saves, revision checks and visible pending/error/conflict states. Account learning profiles no longer write to localStorage. Guests can explore in the current tab; they must sign in for persistence.
- Private account PDFs are stored in `journey-private` with owner metadata records. Reader annotations for account PDFs use database records keyed by PDF bytes. Metadata checks do not download PDFs.
- Explicit Library imports copy the current account’s previous browser progress/PDFs or the guest scope selected by the user. PDF records are enumerated only within the selected scope. Different PDFs sharing a book slug are preserved in Document Vault; existing cloud progress and browser originals are kept. Other users’ scopes are not silently imported.
- Trade, mindset, builder, document, review, custom-book creation and account-book forms save resumable drafts. Existing-entry forms provide draft download and explicit reload controls for conflict recovery. Selected attachments upload privately while drafting. Completed entries keep stable IDs, and stale revisions cannot overwrite newer records.
- Reader note text autosaves to the account annotation record while typing.
- Sign-out flushes registered learning, draft, reader, replay and appearance saves. A pending upload, conflict or failure blocks sign-out with an actionable message. The generic discard confirmation was removed.
- The staged transfer now also copies database learning profiles and drafts, in addition to records, files and replay state.

Validation: 216 automated tests passed. Unit/integration models cover concurrent devices, ownership filters, failed writes, pending edits, retries, draft restore/clear and transfer ownership mapping. Browser checks used isolated clients, not real user credentials, and verified Book Hub note acknowledgments, draft save/restore/completion, and the sign-out gate. Transactional database checks verified authenticated-owner access and different-owner invisibility, then rolled back the probes. Anonymous SELECT privileges are absent on both new tables.

The source project's security advisor reports existing history/Auth-function advisories unrelated to these two new tables. No shared TheOnePercent functions or Auth settings were changed as part of this update. A real signed-in cross-device check and the destination cutover remain unverified until user authentication is completed.


## Market history remains shared — 1 November 2026

The user explicitly confirmed that TheOnePercent should continue supplying historical candles for all available pairs. The active workspace client still points to `ecnxstqfnjaiibwiwwto`, and `BacktestCloudHistory.History` still reads its existing catalog/month/payload RPCs through that client. No history data, pair lists, permissions, storage, or RPC definitions were changed.

A create-session warning was traced to date-range validation. The UI now keeps the selected source/coverage beside the date fields, reports concrete eligible dates when context is insufficient, offers an explicit first-valid-date action, and accepts a final-candle start that leaves one replay step. It does not substitute prices, shift the chosen date silently, or remove the warm-up requirement. A later personal-database cutover must retain the original source session or provide an authenticated server bridge before changing account clients.

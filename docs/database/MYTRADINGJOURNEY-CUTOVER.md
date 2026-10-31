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
5. Transfer replay state and provision or migrate the market-history functions/catalog used by Backtesting Lab.
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

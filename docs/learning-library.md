# Learning Library

Open `pages/library.html` from the workspace sidebar or primary navigation. The page uses a light, responsive layout and the requested 21-book order across five categories. Book artwork is original typography, not downloaded cover images.

Each book supports planned, reading, paused and completed states; chapter/page; personal notes; takeaways; a questioned idea; one action; review date; and a related session, strategy or project name. Related names are plain text references. Search and category/status filters narrow the reading path. The feature panel selects the first reading book, then the first unfinished book.

## Persistence and backup

Explicit Save writes `mytradingjourney:library:v1` in localStorage. Shape: `{kind: "mytradingjourney-library", version: 1, records: {[catalogId]: {status, chapter, notes, takeaways, question, action, reviewDate, related}}}`. Existing backtesting keys, snapshots and sync adapters are not modified. Library records are device/browser scoped, including when someone is signed into backtesting. The page explicitly describes this limitation; library notes are not in workspace backups or account sync.

Export downloads library JSON. Import validates format, known book IDs, statuses, field types/lengths and dates before asking to merge. Matching book records are replaced and unrelated records are retained. Invalid imports, unreadable existing data and storage write failures do not reset data. Unreadable existing text can be downloaded with the export recovery path. Same-book edits from another tab reject stale writes and preserve the current draft; independent book edits merge against the latest saved state. Cancel/Escape and navigation warn about unsaved edits. User content is escaped or assigned through textContent.

## Checks and rollback

Run `node --test tests/library.test.cjs`. This covers persistence, isolation from workspace storage, stale edit detection, backup merge/round trip, corrupt or invalid data and quota failures. Run `node --check assets/library.js` and `node --check assets/shell.js` for syntax checks.

Rollback removes the Library links from `pages/backtesting.html` and `assets/shell.js` and the four new library assets/page. No existing records require migration. Leave the library key in place so notes remain available after re-enabling the page.

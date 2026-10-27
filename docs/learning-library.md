# Learning Library

The 22-book path now belongs to the unified account workspace. Notes, reading progress, custom books, uploaded cover images and PDFs save to the database/private file bucket. The PDF reader saves page position to the same account. See `account-workspace.md` for schema, verification, import and rollback details.

The old `mytradingjourney:library:v1` browser records remain readable only through the explicit import control. They are not written or removed by the new UI. `library-data.js` retains legacy validation and backup functions for compatibility; the page uses `JourneyAPI` for normal reads/writes.

Use Import book PDFs to select one or more files. Known filenames are matched to the catalog; other PDFs become custom books. Existing notes are kept. Each successful import saves its PDF, first-page cover and page count to the signed-in account. Official free reading links are shown for the Almanack and Reminiscences; other commercial books require your own copy.

## Reader and cover update

The supplied cover photographs are resized proportionally into WebP files, with no cropping, redrawing or AI replacement. Card artwork uses a fixed-height responsive stage and `object-fit: contain`; private cover uploads still take precedence. The catalog contains 24 defaults, and the visible count includes personal books dynamically. PDF batch imports preserve both catalog cover photographs and existing private cover uploads.

The PDF reader provides selectable text, four highlight colors, comments on selections, page notes, rectangular highlights for scans, bookmarks, chapter navigation, whole-document text search, zoom and White/Dark/Sepia paper modes. Its side panel adapts to mobile. Notes export as JSON; deleted notes can be restored from the Deleted notes filter.

Reader data is stored in the existing owner-protected `journey_records` table as `kind: document`, id `settings:reader:<SHA-256 of exact PDF bytes>`. These settings records are excluded from the Document Vault. No schema or security-policy change is needed. A separate record prevents reading position updates from overwriting book notes. The save queue serializes writes and retains edits made during in-flight saves. A conflict stops automatic retries and keeps the current draft available for export. Existing per-book `readerPage` values provide the initial position when there is no new reader record.

Two verified public-domain reading editions are bundled under `assets/free-books/`; their source and redistribution details are recorded there. Read PDF opens them directly, and Add free PDFs to my account uploads copies through the signed-in user's existing private Storage permissions. An existing attached PDF is never replaced by that action. The Almanack is linked to its official free download and can be imported privately after downloading; it is not rehosted. Other books retain the private PDF upload flow.

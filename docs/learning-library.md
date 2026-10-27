# Learning Library

The 22-book path now belongs to the unified account workspace. Notes, reading progress, custom books, uploaded cover images and PDFs save to the database/private file bucket. The PDF reader saves page position to the same account. See `account-workspace.md` for schema, verification, import and rollback details.

The old `mytradingjourney:library:v1` browser records remain readable only through the explicit import control. They are not written or removed by the new UI. `library-data.js` retains legacy validation and backup functions for compatibility; the page uses `JourneyAPI` for normal reads/writes.

Use Import book PDFs to select one or more files. Known filenames are matched to the catalog; other PDFs become custom books. Existing notes are kept. Each successful import saves its PDF, first-page cover and page count to the signed-in account. Official free reading links are shown for the Almanack and Reminiscences; other commercial books require your own copy.

# Learning Library

The 21-book path now belongs to the unified account workspace. Notes, reading progress, custom books, uploaded cover images and PDFs save to the database/private file bucket. The PDF reader saves page position to the same account. See `account-workspace.md` for schema, verification, import and rollback details.

The old `mytradingjourney:library:v1` browser records remain readable only through the explicit import control. They are not written or removed by the new UI. `library-data.js` retains legacy validation and backup functions for compatibility; the page uses `JourneyAPI` for normal reads/writes.

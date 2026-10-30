# Learning Hub

Open `pages/library.html`. Every catalog card opens a lazy native modal Book Hub; `?book=atomic-habits` links directly to one. Existing account PDF uploads, private notes, bulk import, bundled free books and personal-book cards remain available. Covers were not changed.

## Content

`data/books.js` contains 24 original guides with two-paragraph overviews, six ideas and examples, learning outcomes, relevant mistakes, two distinct practice routines, a seven-day application plan, five journal prompts, daily habits and related books. Application routines are explicitly labeled as original adaptations, not official exercises. Primary author/publisher sources accompany each guide. Four broad overviews are flagged in `needsReview`: Think and Grow Rich, The Disciplined Trader, The Millionaire Fastlane, and The 10X Rule. These intentionally avoid uncertain edition-specific claims. Unverified page counts remain null; known reference-edition counts are labeled. Read times estimate the **Hub guide**, not a whole book.

## Storage and accounts

`js/library-store.js` owns `mtj.library.v1`. Guest and signed-in account IDs use distinct profiles on the current browser. Plans, status, journal entries, checklist dates, stars, recommendations, quarterly goals, monthly challenges, weekly reviews, and pending applications persist locally. Imported JSON is validated before replacement. The import confirmation describes its scope. File blobs are excluded from JSON.

PDFs added inside a Hub live in IndexedDB `mtj.library.files.v1`, scoped to the same profile. Local PDFs open in the existing reader with its full annotation tools; local annotations also use IndexedDB and optimistic revisions. The deployed HTTPS reader uses WebCrypto SHA-256 to identify document notes. Existing cloud PDFs keep their existing account-based reader and save flow. To move a device PDF, retain its source file and use the reader's notebook export for annotations.

An explicit Apply or Copy action first saves a pending task. When signed in, the task is sent through the existing JourneyAPI into Mindset or Trade Journal, using an idempotent record ID. Failed sends remain queued. Learning tasks have empty result fields, so they do not invent financial results. Guest progress is copied to an account profile only with its explicit import control; account matches are retained. There is no automatic cross-device synchronization of Hub progress. Use the separate Hub JSON export/import controls.

## Interface

`js/library.js` adapts the existing account Library. `js/book-hub.js` renders tabs only when selected. `css/library.css` reuses the existing identity variables and serif headings, with desktop side-panel, mobile full-screen sheet, keyboard tabs, native modal background inertness, explicit Tab cycling, Escape close, reduced motion and summary print styles. Monthly challenge markers are user-controlled practice days; the Sunday reminder is an in-page banner, not a push notification.

Two user-supplied ZIP images appear as a Library reading spotlight and a homepage study section. Existing cover SVGs and theme files remain unchanged.

## Validation

`node --test tests/*.test.cjs` includes guide-content contracts, backup validation, scope isolation, storage-failure recovery, state round-trip and local-calendar streak checks, alongside the existing account/PDF/reader and replay suite. Browser checks exercise saved plan/journal/habit state after reload, keyboard tabs, ratings, pending application, filtering, desktop/mobile layouts and PDF attachment. An ignored HTTP-preview-only reader fixture supplies the independently computed sample PDF fingerprint and UUID support because WebCrypto is limited to secure contexts; no fixture is shipped. The deployed reader retains real WebCrypto.

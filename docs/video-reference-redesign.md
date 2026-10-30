# Public site refresh from the supplied video

The supplied 17-second recording shows a trading education site with a compact white navigation bar, a portrait-led introduction, a three-column editorial grid, a dark multi-column footer, and a floating help affordance. This refresh uses that structure with MyTradingJourney's existing forest-green identity, serif headings, original personal story and workspace routes.

The homepage now includes a split introduction with the owner's real study photo, portrait About section, image-led entry points, unchanged book artwork and previews, aspirational vision section, original Field Notes, native FAQ disclosures, and a dark green footer. The floating Quick Guide opens self-guided workspace links and supports keyboard dismissal. It does not claim an agent is online or send messages.

`pages/field-notes.html` serves a searchable six-article collection and `?note=<slug>` article views. Content in `assets/field-notes.js` is original editorial text. Articles have real related links, workspace actions, print styles, a copy-link control with a clipboard-failure message, and an unknown-article state. Public UI behavior lives in `assets/public-site.js`; responsive visual styling is isolated in `assets/public-site.css`.

Existing account, replay, Library, PDF, and authentication behavior is unchanged. The homepage routing shim still preserves prior workspace/replay bookmarks and account callbacks. Existing cover assets and their rendering dimensions remain unchanged. The old `#life` anchor is retained on the closing section.

The selected chart-study image comes from the user's previously supplied image ZIP and is displayed as a study example, without attaching a claimed result or account performance. The video site's logo, portrait, testimonials, business claims, contact information, and sales offerings were not reused.

Validation: existing 184 Node checks pass. Browser QA covers the desktop hero and About layout, mobile menu opening/closing and horizontal overflow, field-note search/topic filtering/empty reset, article navigation, workspace links, Quick Guide dismissal, FAQ disclosure, featured book filtering and preview-to-Hub links. Reduced-motion and print styles are included. Preview fixtures remain ignored and are not published.

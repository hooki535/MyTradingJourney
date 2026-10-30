# Public homepage

The repository root now shows a public editorial landing page. Existing signed-in tools remain at `pages/journey.html`, `pages/backtesting.html` and `pages/library.html`. The landing page reads no private records and adds no account dependencies.

## Experience

- Ivory, charcoal, forest and champagne palette with editorial serif headings.
- Original sports coupe hero and luxury SUV vision imagery.
- Direct routes into backtesting, reading, building, journaling and weekly reviews.
- Six featured books with category filtering and accessible learning-preview dialogs: Atomic Habits, Trading in the Zone, The Psychology of Money, Market Wizards, The Almanack of Naval Ravikant, and The Lean Startup.
- Each preview includes an original short overview, three learning points, and a practical action. Covers reuse existing repository assets. The Library link opens the existing catalog, without changing reading records.
- Freedom, Mastery and Ownership selectors connect aspirations to concrete actions.
- Responsive mobile menu, native dialog keyboard handling, focus return and reduced-motion support.

Legacy root bookmarks and authentication callback parameters still route to their existing workspace destinations. New public anchors (`#practice`, `#books`, `#vision`) remain on the homepage. The workspace Overview navigation continues to open the account overview directly; the sidebar brand now returns to the public homepage.

## Personal story and broader life design

Three owner-supplied images are included: the study desk, the brown-polo portrait, and the conceptual black-and-white future-self artwork. Originals remain outside the repository; web copies are resized, encoded as WebP, and saved without embedded EXIF. The other supplied photographs are not published. Original first-person reflections sit beside the personal story and conceptual artwork. Additional visual cards cover time and freedom, coding and product ownership, health, and relationships.

## Generated image provenance

The built-in image-generation tool produced the two illustrative images; WebP encoding reduces transfer size. They portray aspirations, not the owner's possessions or trading outcomes.

- `assets/home/grand-tourer.webp`: cinematic editorial photograph of an unbranded graphite silver grand touring sports coupe on a mountain overlook at dawn; car on the right, dark left-side negative space for headline, warm champagne sunrise, no people or text.
- `assets/home/vision-drive.webp`: editorial photograph of an unbranded champagne cream luxury sports SUV beside a minimalist stone villa and palms in late afternoon sunlight; horizontal composition, muted sand colors, no people or text.

## Validation

The existing 173 tests and three new entry-routing tests pass. Browser checks cover the desktop hero, book filtering and preview dialog, vision selection, and a 390px iframe viewport for mobile navigation and horizontal overflow. No signed-in records or database schemas are changed.

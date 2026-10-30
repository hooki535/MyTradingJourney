# Private library PDFs and cover sizing

The library imports owned PDFs through the signed-in user's existing private
storage workflow. Personal books and generated reading copies stay outside Git;
only code, tests and this documentation belong in the repository.

Batch attachment rejects empty files, matches common catalog filename variations,
and skips existing PDFs and SHA-256 duplicates. Unmatched files are skipped: this
action never creates a book title. Existing notes and covers are kept. Filenames
marked as excerpts retain a visible excerpt label.

Records with `libraryArchived: true` are excluded from the reading path. Archiving
preserves their private files and record contents and can be reversed. The extra
entries created by the earlier broad import have been archived; the original
catalog remains the reading path.

The library can display an older filename-based record under its matching catalog
title when no canonical record exists. Its existing reader link, storage object,
revision and notes remain attached to the original record; no record is deleted.

Cover slots have explicit dimensions with inset images and `object-fit: contain`.
The complete cover fits within the card on desktop and narrow screens.

Free editions use verified public-domain sources already documented in
`assets/free-books/README.md`, plus the author's official download at
https://www.navalmanack.com/. Commercial books are not bundled or downloaded from
unauthorized mirrors. A short excerpt is not presented as a complete edition.

Validation: library, import and account API regression tests; JavaScript syntax
and Git whitespace checks; browser checks of account imports, reader links and
the rendered cover bounds. Lossless splits of oversized PDFs are checked against
the original page count and decoded content streams and visually reviewed.

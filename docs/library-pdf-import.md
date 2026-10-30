# Private library PDFs and cover sizing

The library imports owned PDFs through the signed-in user's existing private
storage workflow. Personal books and generated reading copies stay outside Git;
only code, tests and this documentation belong in the repository.

Batch imports now reject empty files, match common catalog filename variations,
and skip existing PDFs and SHA-256 duplicates. New personal book identifiers are
derived from the PDF hash so retries do not create another book. Existing notes
and covers are kept. Filenames marked as excerpts retain a visible excerpt label.

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

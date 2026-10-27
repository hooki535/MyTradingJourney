# Reading room

Open a PDF from Learning Library or Document Vault. The PDF remains unchanged; annotations are saved as private, owner-scoped reader records keyed by the SHA-256 fingerprint of the exact PDF bytes. Existing notes, bookmarks and progress remain compatible.

## Reading

White, dark and sepia paper apply to the entire reader. Fit width, fit page and fixed zoom levels are available. The bottom slider jumps through the document. Focus hides secondary controls; fullscreen uses the browser fullscreen API when available. Notebook opens Notes, Saved pages, Contents or Find. A PDF without an outline shows page links.

## Text and ink

Select PDF text for a floating toolbar: highlight, underline, squiggly underline, comment or copy. The notebook provides four annotation colors and an area tool for scanned pages. Notes and comments can be edited, soft-deleted or restored.

Draw opens a dedicated dock. Pen and translucent marker support a mouse, touch or stylus. Choose ink color and width; the eraser removes intersecting strokes. Undo and redo operate on drawings on the current page during this session, preserving text notes. Save drawing closes the current group and starts a new one without leaving drawing mode. Done leaves drawing mode. Completed strokes enter the existing serialized save queue automatically. Page changes finish the active stroke. Ink is stored in normalized page coordinates and follows zoom. Drawings appear in the notebook, support comments, and can be reopened for editing or soft-deleted.

Annotations require sign-in. Public free PDFs remain readable signed out. The status bar reports pending, saved and failed writes; Retry save resumes stopped writes. Conflicts preserve the local draft for export instead of overwriting a newer remote version.

## Keyboard and exports

- Left/right arrows, H/L, Page Up/Down and Space turn pages. Shift+Space goes back. Home/End jump to the first/last page. Text-selection adjustment retains arrow keys.
- S toggles the notebook; N opens notes; Ctrl/Cmd+F opens document search.
- D toggles drawing; F toggles focus; Escape leaves drawing or focus.
- Ctrl/Cmd+B bookmarks a page. In drawing mode, Ctrl/Cmd+Z undoes; Shift+Ctrl/Cmd+Z redoes.
- Export notebook as Markdown or plain text for reading, or JSON for complete annotation geometry and drawing strokes. Text exports indicate where ink exists. Export does not embed annotations in the original PDF.

This is a Readest-inspired PDF reading workflow. It does not include EPUB reflow, Readest Cloud, translation or third-party account integration.

## Verification

Run `node --test tests/*.test.cjs`. Reader tests cover legacy compatibility, geometry, malformed stroke rejection, eraser intersections, private PDF fingerprint separation, concurrent save ordering, conflicts, exports and drawing reloads. Browser checks use a separate preview-only test account adapter and real PDF.js; no QA adapter is deployed.

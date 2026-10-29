# Bow & Purl v3.3 — quiet knitting studio

Implemented October 29, 2026.

- Rebuilt the stylesheet around cream, charcoal and restrained rose tokens, system sans typography, serif page headings, consistent touch targets and visible focus states.
- Replaced repeated work-screen banners with one compact cat portrait. Retained original photos in Help and the authored animated cats in Help and monthly inspiration, with motion preferences intact.
- Added five black-heart navigation items: Projects, Charts, Stash, Patterns and More. More preserves access to monthly ideas, planner, prices, help, backups and settings.
- Put the current project session before the other-project filters. Added compact project choices, explicit completed-row/next-row wording and expandable planning/history.
- Gave the same chart separate Design and Knit presentations, keeping its original lock, painting, keyboard controls, zoom, symbols, row reading, float analysis and exports.
- Moved stash and pattern results ahead of add/import forms. Grouped secondary filters and card details while keeping unknown quantities explicit.
- Added a continuous pattern grid, with the existing weight groups and overview still available on demand.
- Added selected-tier price rows with dates/sources, retaining the full comparison, manual monthly review, CSV tools and recorded quotes.
- Simplified the project form's first view while retaining every optional field and saved value.
- Versioned the complete offline shell as 3.3. No new storage schema, runtime dependency, paid asset or remote font was introduced.

**Workers:** unchanged from v3.2. Only deployments still using v3.1/earlier connector code need the previous Worker upgrade described in PUBLISH_TO_GITHUB.md.

**Validation:** see TESTING.md. Nothing was published from this workspace; the release is prepared for the user's existing GitHub Pages site.

---

# Bow & Purl v3.2 changes

Reviewed and implemented October 29, 2026. See `REVIEW.md` for evidence, prioritization and recommendations.

## Data integrity

- Added `data.js`, a single-record persistence boundary with legacy migration, failed-save notices and stale-tab protection.
- Kept valid neighbors when saved collections contain invalid records; retained originals for recovery downloads.
- Made recovery notices dismissible without deleting retained originals.
- Added complete version 4 backups, including the open chart draft and project records.
- Replaced sequential partial restore with validated preview, explicit conflict choices and one atomic save.
- Retained compatibility with version 1–3 backups and remapped Ravelry stash references during merges.
- Preserved source, link, designer and yardage metadata when charts are re-saved.
- Kept the current saved-pattern association across reloads and editing undo/redo.

## Knitting and projects

- Added a functional project notebook with needles, gauge, current section, notes, dates, status, row goals, completed-row tracking, derived repeats, two independent counters and recent history.
- Added links from patterns into projects and an optional screen wake lock.
- Added a locked knitting mode so touch panning cannot paint stitches.
- Added redo, zoom, flat/round row reading, keyboard painting, color-symbol overlays and text row instructions.
- Replaced identical-color-run float checking with per-color gaps and circular row joins; flagged three-color rows.
- Corrected the image-to-grid knit-proportion calculation and added decoded image-size checks.
- Kept all 55 supplied chart designs, layouts, custom motif tools, local image conversion and PNG/print export.

## Stash, patterns and prices

- Preserved incomplete Ravelry stash imports and tested missing/partial quantities, repeat imports and local corrections.
- Added stash search, weight filters, sorting, bounded list expansion, fiber, dye lot, historical purchase prices and exact meter conversion.
- Prevented skein adjustment from erasing a known total when per-skein yardage is unknown.
- Kept locally edited yarn details and handled disposal status when Ravelry returns it.
- Replaced pattern-edit prompt sequences with one form; validated yardage ranges; retained local changes on import.
- Bounded initial pattern-card rendering to 24 per weight group and collapsed the optional yardage overview.
- Corrected catalog entries for Spincycle Dream State, Hedgehog Fibres Skinny Singles and Lion Brand Truboo using manufacturer sources.
- Preserved cents on recorded USD amounts, including prices above $100; protected exported CSV text against spreadsheet formulas.
- Kept manual monthly price reviews and dated quotes; did not invent live prices or add a paid pricing service.

## Connectors, offline operation and design

- Enforced actual streamed request-body byte limits, JSON object validation and credential checks in both standalone Workers.
- Added controlled upstream/client timeouts and JSON error handling for yarn-search failures.
- Required an explicit AI model, bounded paid output tokens, honored full chart dimensions and rejected malformed output without replacing the chart.
- Reported import truncation, kept absent records during partial imports and added an optional personal-username restriction.
- Removed advice to make a private stash public merely to resolve connector access errors.
- Added the new scripts to the version 3.2 offline shell and showed a waiting-update notice only for actual updates.
- Added a mobile section picker, compact working views, larger touch targets, stronger contrast, accessible labels and a keyboard skip link.
- Preserved the fixed black navigation hearts, cat photography and motion preferences. Replaced font-dependent decorative glyphs where needed.
- Improved print CSS to include the chart and color key without hidden app layout creating extra chrome.

## Deployment changes

Update every website file, close old app windows and redeploy any Worker you use. The AI Worker now requires `MODEL`. Credentials are not bundled. See `README.md` for the exact update steps.

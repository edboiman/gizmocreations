> Historical v3.2 reliability audit. For the shipped v3.3 visual refresh, read DESIGN.md, CHANGELOG.md and TESTING.md.

# Bow & Purl — independent audit and v3.2 implementation review

**Reviewed:** October 29, 2026. **Input:** `bow-and-purl-v3.1(1).zip`. **Output:** incremental v3.2 update, reproducible tests and this report.

References marked **original** refer to the supplied v3.1 source, not the edited files. Findings distinguish reproduced defects, code-supported risks, external research and product recommendations. No live account credentials or paid AI calls were used. This is a source audit and implementation review, not a penetration-test certification or a representative user study.

## A. Executive Assessment

The original app is a capable chart-and-stash prototype with several failures that make it unsafe to trust casually with accumulated work. Its weak point is the connection between a pleasant interface and reliable working data. A chart can look saved while its useful metadata has disappeared; a failed restore can still change inventory; an apparently harmless malformed record can hide the rest of the library.

Those are more consequential than adding another attractive screen. They were addressed first.

The useful foundation is concrete: a buildless static app, original local motif designs, local image conversion, weight-based pattern organization, optional server-side connectors, 48 offline inspiration briefs, a scoped offline cache, and an existing reduced-motion-aware cat illustration system. The supplied version already supported incomplete Ravelry stash quantities. That support was preserved and tested; it is not being claimed as newly invented here.

v3.2 adds a genuine project notebook, safer chart use while knitting, recoverable collection loading, complete backups, atomic restore, clearer local-vs-imported data, and substantially better mobile navigation. It keeps the cat photographs, animated companions, fixed black navigation hearts, plain JavaScript and straightforward GitHub Pages deployment.

The remaining product boundary matters: this is still a colorwork studio and local knitting notebook. It does not provide an interactive PDF pattern reader, project-specific chart sessions, multi-yarn reservations, a technically validated garment generator or automatic multi-device synchronization. Live API permissions and physical-device behavior remain unverified. It should not yet be marketed as a complete replacement for a mature pattern-following application.

## B. Critical Issues

**Priority:** P0 = protect work immediately; P1 = important correctness/daily use; P2 = valuable improvement; P3 = polish. **Effort:** S = usually under a day; M = a few days in a normal reviewed release; L = a larger feature. Estimates express scope, not time claimed to have been spent.

| ID | Finding and user consequence | Evidence in original | Resolution in v3.2 | Priority / effort |
| --- | --- | --- | --- | --- |
| B1 | One invalid pattern hides every valid pattern. A later save can overwrite the original collection using the empty in-memory list. | **Reproduced.** `app.js:27`: a valid pattern plus an invalid neighbor produced an empty library. | Keep valid entries, set aside invalid/duplicate entries and retain originals for recovery. | P0 / M |
| B2 | Restore writes sections separately. A later quota failure can leave the stash changed while patterns were not restored. | **Reproduced.** `app.js:370`: forcing the pattern write to fail still persisted the imported stash. | Preflight every section, preview merge choices and commit the resulting data as one storage record. A failed write changes no saved section. | P0 / M |
| B3 | A normal backup omits the current chart draft. Clearing browser data or moving devices can lose a chart the user reasonably thought was covered. | **Reproduced.** `app.js:357`, `makeBackup()`, has no draft field. | Version 4 backups include the draft and its saved-pattern association, projects and the other user collections. | P0 / S |
| B4 | Re-saving a chart replaces the pattern object with a smaller object, discarding source, designer, yardage and link. | **Reproduced.** `app.js:292`: a re-saved fixture lost yardage/source and its link became empty. | Update chart fields while preserving the existing pattern metadata. | P0 / S |
| B5 | A saved chart's identity is not restored with its draft. After reopening, row changes can stop updating the saved library chart. Undo also does not track that identity. | Code-supported: original `draft()`, `changeRow()` and startup draft loading. | Persist the pattern ID alongside the draft; keep identity in undo/redo; save draft and library row together. | P1 / M |
| B6 | Adjusting skeins discards a separately recorded total even when per-skein length is unknown. An entry with two skeins and 450 known total yards can become “total unknown.” | Code-supported: `yarns.js:264` sets `totalYards = null` unconditionally. | Disable the shortcut when per-skein yardage is unknown; keep Edit details available for deliberate changes. | P1 / S |
| B7 | The float checker only measures runs of identical colors. Alternating two colors can conceal a long float of a third color. | **Reproduced.** `app.js:114`: `0,1,2,1,2,1,2,1,2,1,2,0` was reported as having no float over seven despite the ten-stitch gap for color zero. | Measure gaps per color, handle circular joins, identify rows using three colors and qualify the result. | P1 / M |
| B8 | Image conversion compensates for knitted stitch shape in the wrong direction. The artwork becomes wider when the physical stitch proportions are applied. | **Reproduced.** `app.js:211`: square artwork occupied 8 × 6 cells under knit proportions. With 16 × 12 physical cells that is not square. | Use the inverse ratio. The same fixture now occupies 6 × 8 cells, giving a square physical preview. Actual gauge is still required. | P1 / S |
| B9 | AI silently clamps requests to 60 × 60 and the frontend stamps the answer using motif layout settings. Requested dimensions and composition need not match the result. | Original `worker/claude-worker.js:46` and AI handler in `app.js`. | Accept the full supported chart bounds, require exact output dimensions and place the result directly. Failed output keeps the existing chart. | P1 / M |
| B10 | Request limits only inspect `Content-Length`. A body without that header bypasses the intended limit. Valid JSON such as `null` can also escape the intended validation path. | **Reproduced.** Original AI Worker accepted a JSON request with more than 12 KB of padding and no length header. Both Workers used the same header-only limit. | Read and cap actual streamed bytes; validate content type and a JSON object; return controlled errors. Existing token/origin checks remain. This is authenticated-input hardening, not evidence of an unauthenticated open proxy. | P1 / M |
| B11 | Ravelry yarn search has upstream work outside its catch path; stash/search requests lack the same controlled client timeout as pattern import. Failures can become opaque network errors or prolonged disabled controls. | Code-supported: original `worker/ravelry-worker.js:53` and stash/search handlers in `yarns.js`. | Controlled upstream/client timeouts, JSON failure responses, persistent import results and restored controls. | P1 / S |
| B12 | Yardage parsing extracts numbers from invalid text and permits reversed ranges. This feeds incorrect requirements and cost estimates. | Code-supported: original `app.js:325`. | Accept a single amount or ordered range only; reject invalid/reversed values before saving. | P1 / S |
| B13 | Saving in two tabs uses last-writer-wins without detecting stale in-memory data. One tab can replace changes made in another. | Code-supported: original `app.js:14` and full-array saves. | Detect a newer saved revision and pause stale-tab writes; expose export/reload recovery. Sequential stale-tab behavior is tested. This is not a distributed transaction lock across devices. | P1 / M |
| B14 | Several catalog rows give incorrect material or weight guidance. Dream State was listed as fingering, 465 yards and wool/mohair; Skinny Singles and Truboo were grouped incorrectly. | Source inspection plus manufacturer verification; see D and sources. | Correct those three entries. Keep label/gauge checks and undated-price warnings. The rest of the catalog is not claimed fully verified. | P1 / S |
| B15 | A Ravelry detail marked used-up/gifted/sold/traded is skipped, so an already imported positive stock entry can remain available. | Code-supported: original stash detail filter in `worker/ravelry-worker.js`. | Return disposal status and zero uncorrected imported availability when that status is returned; flag local overrides for review. Records absent from a partial API response are still kept. | P1 / M |
| B16 | Actual dollar amounts at or above $100 are rounded to whole dollars in display, including named quotes and purchase-style values. | Code-supported: original `yarns.js`, `money()`. | Format recorded USD amounts with cents. Estimates remain explicitly approximate. | P1 / S |

The original security posture also had useful protections: no provider keys were embedded in frontend files, user content was generally inserted as text, external links were constrained, and both Workers checked an app token and origin. No active provider secret was found in the supplied source. There are no runtime npm dependencies to audit; installing development QA tools did not add production dependencies.

Risks still requiring attention are browser storage loss/quotas, secrets readable by other trusted code on the same origin, external photo requests, connector spending controls and the exact permissions of the Ravelry credentials. Masking a token field is not encryption or user authentication. A shared bearer token and CORS are insufficient for a public paid multi-user service.

## C. UX/UI Review

The cat identity is distinctive enough to preserve. The problem was the amount of decorative and configuration content between a user and their next useful action. Long forms, a horizontally hidden set of phone tabs, small inventory buttons and prompt-by-prompt editing worked against actual knitting sessions.

Implemented improvements include a phone section picker, a compact working view, a project-first navigation entry, a single pattern editing dialog, larger stash actions, a prominent current-row control near the chart, and a mobile layout that puts the editor before detailed generator settings. The introductory hero is hidden while using other sections. Colors, headings and the cat artwork remain recognizable.

The more useful refinements are functional: pausing chart edits while following a pattern, showing the next repeat row unambiguously, keeping a “resume here” note, searching by dye lot, and showing whether a save failed. These save more effort than additional decorative animation.

Accessibility now includes keyboard painting, cursor announcements, text row instructions, color-identifying symbols, labeled forms/dialogs, a working skip link and larger touch targets. Contrast issues found by automated checks were corrected. Decorative sleeping-cat letters became paths so they do not conflict with the button's accessible name. Reduced motion continues to stop cat animation, and tab-state transitions no longer produce briefly unreadable color combinations.

The final automated accessibility sweep found no WCAG A/AA violations in the tested desktop sections and project form. This is not proof of full accessibility. Screen-reader behavior, speech control, large operating-system text, visual impairment workflows and physical phone ergonomics still need human testing. A color-symbol chart is also not a semantic lace/cable chart.

### Real knitting scenarios

| Scenario | Original friction | What now works | What remains |
| --- | --- | --- | --- |
| First sweater | No structured working project; construction details disappear into pattern notes. | Pattern-linked project with needles, blocked gauge, size yardage, section and notes. | No fit engine or complete sweater instructions; use a tested pattern. |
| Several projects | One chart draft is the principal active workspace. | Separate project cards, counters, paused/finished filters and recent activity. | Linked chart row markers are not yet per-project working sessions. |
| Complicated colorwork | Touch can paint while panning; color-only canvas; weak float reassurance. | Locked mode, zoom, row text, symbols and per-color gap checks. | Stitch-by-stitch position, repeat-region editing and automatic catch placement are absent. |
| Incomplete Ravelry stash | Support existed, but unknown amounts needed stronger visibility and protection. | Unknown entries survive imports, are searchable/editable and stay out of unsupported coverage claims. | Live permission/account variations remain unverified. |
| “Do I have enough yarn?” | Weight and a minimum range can sound more conclusive than they are. | Exact length conversion, explicit unknowns and qualified yardage coverage; project estimates add 10%. | No multi-color proportions, reservations or guarantee for a particular size. |
| Return after months | Few structured cues about where to resume. | Section, notes, needle/gauge records, row/repeat state, dates and history. | Photos, measurements and a unified PDF/chart working copy would help. |
| Knit offline | Good shell design, but update/readiness behavior needed verification. | Cached subpath reopening, projects, charts, ideas and saved data work with networking disabled in tests. | External links, new imports and AI need internet. Real iOS reopening remains a device check. |
| One-handed knitting | Long scrolling and small quantity controls; no edit lock. | Large row button, safer panning, sticky navigation and optional wake lock. | Wake lock and ergonomics need a physical-device check. |

## D. Existing Feature Assessment

### Yarn stash — preserve and extend carefully

Incomplete records are useful records. Keeping unknown yardage as null is correct; substituting zero or invented catalog totals is not. Existing partial-pack handling was preserved. The import/merge tests cover unknown quantities, repeated imports, local corrections and differing pack lengths.

Search, weight filters, amount sorting, fiber, dye lot and purchase details are now functional. Known totals are protected during quantity adjustment. Inventory suggestions are explicitly yardage comparisons. Combining unrelated yarns merely because their weights match cannot establish a good substitution; the UI now says so.

Current limitations include one reference yarn per project, no reservation/consumption ledger and no color-by-color allocation. Importing the first 300 stash details also cannot bring in an entire larger account without a future continuation mechanism.

### Pattern library — preserve, simplify and bound rendering

Weight/source search and organization are useful. Replacing three editing prompts with one form reduces interruptions and makes validation understandable. Locally edited name, weight, yardage and link survive later imports. Re-saving a chart preserves imported metadata.

The optional yardage overview starts collapsed. Large groups initially render 24 cards, avoiding thousands of immediate card/thumbnail nodes; Show more expands a group while counts and search still cover all records.

The library remains metadata/links/notes plus native colorwork charts. Pattern categories, difficulty, manual favorites/tags, measurements and local PDF attachments are not yet structured features. Do not label the current library an interactive pattern reader.

### Colorwork generator — preserve its useful scope

Local motifs, typed grids, image conversion, palettes, transformations and exports are worth keeping. Undo/redo, lock mode, direction-aware text and symbols make the editor more useful in practice. Image geometry and three-color gap analysis received correctness fixes rather than cosmetic changes.

AI is optional and online. It returns color cells, not garment instructions. Request limits use documented provider parameters: [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) and [Claude Messages](https://platform.claude.com/docs/en/api/typescript/messages/create). Model-specific output capacity still needs live verification. Exact shape validation is necessary but cannot prove knittability, fabric behavior, stretch, color balance or yarn requirements. The app now states these boundaries. A fixed stitch-aspect preview is not a gauge calculator. Large printouts are not tiled.

### Project tracking — new, functional foundation

The new notebook covers completed rows, next repeat position, two independent counters, row goals, needles/gauge, notes, start/completion dates, pause/resume and recent history. Starting from a pattern avoids retyping its name and reference. Finish status provides a basic archive.

The next substantial improvement should be a project-owned working view: a project's chart/PDF position, counters and notes should live together. Current chart row markers and project completed-row counters are intentionally described as separate because they are separate in the implementation. Linking the same pattern to two projects does not yet give each project its own independent chart marker.

### Monthly inspiration — preserve its offline honesty

The 48 built-in briefs and hemisphere-aware seasons are appropriate for a lightweight offline app. Calendar themes stay with the month. Saving an idea and preparing studio settings work; ideas are clearly briefs rather than complete patterns.

Estimated duration, user-authored ideas and a larger editorial rotation could help later. Live weather access is unnecessary for useful seasonal defaults. Do not introduce a location requirement or paid recommendation service for this screen.

### Ravelry — improve reliability; keep permission claims narrow

Provider credentials stay on the Worker. Frontend app tokens are masked and excluded from normal backups. Unknown amounts and local edits are retained, duplicate records merge, partial imports report limits and failed details, and network failures keep existing collections.

This is a manual import, not bidirectional synchronization. The Worker supports up to 1,500 distinct pattern details and the first 300 stash details per import. API responses that omit an item do not justify deleting local data. Access errors no longer recommend making a private stash public as a workaround.

The official API entry point redirected to a Ravelry login. Its current developer agreement and account-specific permission scopes were not available for inspection. The public general terms do not resolve that question. **This review establishes neither permission nor a prohibition on commercial API use.** Check the exact developer agreement and obtain clarification from Ravelry for the intended distribution model before monetizing the connector. Sources: [API entry point](https://www.ravelry.com/api), [general terms](https://www.ravelry.com/about/terms).

### Pricing — separate estimates, quotes and purchases

Weight-based estimates, named current quotes and historical paid prices answer different questions. The UI now keeps them distinct. Manual price editing, CSV merging, dated sources, monthly review dates and preserved USD cents work. A monthly review does not fetch prices or verify each row. Named quotes remain references; they do not silently change a weight average.

Project estimates use the chosen size's entered yardage plus an allowance. A known purchase-price rate can estimate yarn value; it is not a whole-skein shopping bill. Tax, shipping, multiple yarns, sale schedules, currency conversion and consumption accounting are not modeled.

Three catalog corrections were verified with manufacturers:

| Yarn | Corrected supplied information | Primary evidence |
| --- | --- | --- |
| Spincycle Dream State | Current manufacturer listing: worsted, 150 yards, superwash American wool. Existing skein versions still require a label check. | [Manufacturer](https://spincycleyarns.com/collections/dream-state) |
| Hedgehog Fibres Skinny Singles | Fingering; manufacturer lists 366 m per approximately 100 g, consistent with roughly 400 yd. | [Manufacturer](https://shop.hedgehogfibres.com/products/skinny-singles) |
| Lion Brand Truboo | Light/DK, 241 yd; moved out of fingering. | [Manufacturer](https://www.lionbrand.com/products/truboo-yarn) |

Those corrections do not validate every remaining catalog row or turn stored dollar estimates into current prices.

### Competitor and support research

Research reviewed current official feature/help pages, rather than relying on speculative feature lists or claiming hands-on competitor testing.

| Verified observation | Product implication for Bow & Purl — recommendation/inference |
| --- | --- |
| knitCompanion documents per-project knitting views and configurable simple counters; its product description supports offline PDF use. | A dependable working session and independent counters are central, not decorative extras. The new notebook is a start; project-owned document position is next. [Official help](https://www.knitcompanion.com/), [product description](https://shop.knitcompanion.com/shop/product/knitcompanion/) |
| Knitting Chart documents working-mode controls, gauge settings, written chart instructions and archived recovery after a crash. Its FAQ also addresses confusion between original PDFs and editable project files. | Make the active working copy and saved state explicit; build recoverable storage before adding attachments. These are recognized support cases, not evidence of how frequently users encounter them. [Official FAQ](https://www.knitting-chart.com/faq/) |
| My Row Counter documents secondary counters, reminders, highlighters and offline behavior; its recent features include rearranging pattern content into a clearer working page. | Prioritize reminders and a concise pattern-following surface over another browsing screen. [Features](https://rowcounterapp.com/counter.html), [FAQ](https://rowcounterapp.com/faq.html), [updates](https://rowcounterapp.com/new-features.html) |

These sources support feature comparisons, not claims that all knitters prefer them. No representative complaint-frequency research was performed. Bow & Purl can differentiate through an approachable offline-first workflow, clear data ownership and excellent stash-to-project transitions.

## E. Missing Opportunities

| ID / class | Proposed capability | Why it earns its complexity |
| --- | --- | --- |
| E1 / essential next step | Project-owned chart position and working settings. | Two projects using one pattern should not share a row marker. One next-row action should keep the working chart and project counters consistent. |
| E2 / high value | Offline PDF reader with highlights/notes and a visible working-copy identity. | Most real projects follow a longer pattern; opening another app breaks the session. Requires attachment storage, backup/export design and migration testing first. |
| E3 / high value | Multiple yarn references, reservations, dye-lot/color roles and explicit consumption. | Makes coverage and cost planning credible for sweaters/colorwork and prevents double-counting the same stash across projects. Every adjustment needs a reversible ledger. |
| E4 / high value | Row-specific reminders and shaping schedules. | “Decrease every eighth row six times” is exactly where a generic counter stops helping. Start with explicit manual rules, not guessed AI parsing. |
| E5 / high value | Swatch/gauge and repeat-multiple calculator with metric/imperial inputs. | Reduces arithmetic and repeated entry. Explain rounding, repeats, selvedges and the difference between arithmetic and fit. |
| E6 / high value | Chart repeat regions, two-colors-per-row review, project-specific palettes and tiled print export. | Addresses actual knitting readability and construction rather than prettier pixel art alone. |
| E7 / optional | Measurement profiles, needle inventory, favorites/tags and a last-worked dashboard. | Useful when it removes repeated entry; validate with a few regular knitters before building a large inventory system. |
| E8 / optional polish | Small completion celebration and customizable cat visibility. | Fits the identity if brief, dismissible and reduced-motion aware. It should never delay saving or a counter tap. |

Avoid a mandatory account/backend, a social feed, collectible currencies, paid APIs for seasonal ideas, unexplained AI difficulty ratings and a framework rewrite. None is necessary to solve the current work. Automatic multi-device sync is a separate product commitment, not a checkbox to add before conflict handling is designed.

## F. Top 10 Recommended Improvements

Ranked by expected practical value, including work completed during this review.

| Rank | Improvement | User benefit | Status |
| --- | --- | --- | --- |
| 1 | Atomic saving/restoration plus retained recovery originals | Protects months of accumulated work and avoids misleading half-restores. | Implemented; browser quotas still apply. |
| 2 | Complete, understandable backups with conflict choices | A backup covers the current draft and projects; moving devices has explicit merge behavior. | Implemented. |
| 3 | Preserve metadata and saved-chart identity | Reopening or saving a chart does not erase yardage/source details or lose progress association. | Implemented. |
| 4 | First-class projects with resume notes and useful counters | Supports several ongoing pieces and makes returning after a break easier. | Implemented foundation; E1 remains. |
| 5 | Locked, accessible knitting view | Prevents accidental stitch edits while panning and adds text/symbol alternatives. | Implemented; physical-device testing remains. |
| 6 | Correct image geometry and per-color float checks | Avoids distorted motifs and false reassurance about carried yarn. | Implemented; swatching still required. |
| 7 | Usable incomplete stash records, filtering and dye lots | Keeps real inventory useful without forcing users to invent missing quantities. | Preserved, extended and tested. |
| 8 | Predictable imports with local edits, limits and error recovery | Removes repeated corrections and makes partial imports understandable. | Implemented technical changes; live permissions unverified. |
| 9 | Bounded large-list rendering and reliable mobile navigation | Reduces immediate rendering work and makes every section discoverable on a phone. | Implemented. |
| 10 | A project-owned offline pattern reader | Brings instructions, position and counters together for the everyday knitting session. | Recommended next major feature, not implemented. |

Price correctness, clear estimate dates and connector spending controls remain important release requirements even though they are not novel headline features.

## G. Implementation Roadmap

Risk means risk of disturbing current behavior. Dependencies include actual testing/release work, not only code libraries.

| Phase / item | Proposed solution and benefit | Priority | Effort | Breakage risk | Dependencies / status |
| --- | --- | --- | --- | --- | --- |
| 1 — B1–B4, B13 | Atomic local record, validated restore preview, complete backups, retained invalid records and stale-tab guard. | P0 | M | Medium | Storage fixtures, quota/conflict tests and legacy backup tests. Implemented. |
| 1 — B5–B8 | Preserve chart identity, protect known totals, fix per-color gaps and image aspect math. | P1 | M | Medium | Chart/quantity fixtures and round-trip tests. Implemented. |
| 1 — B9–B12 | Exact AI dimensions, bounded request bytes/output, clear errors/timeouts and strict yardage. | P1 | M | Medium | Frontend/Worker updates must ship together; mock provider tests. Implemented. |
| 1 — B14–B16 | Correct verified catalog rows, process returned disposal status and retain cents. | P1 | S | Low | Manufacturer sources and numeric fixtures. Implemented. |
| 1 — live service validation | Deploy updated Workers, configure the chosen model, verify credential scopes, rate limiting and provider spending caps. | P1 | S–M | Medium | Real account access/deployment settings. Still required outside this package. |
| 2 — working notebook | Completed-row/repeat/independent counters, notes, dates and project references. | P1 | M | Low–medium | Atomic data/backup schema. Implemented. |
| 2 — mobile/accessibility | Safe chart mode, keyboard/text/symbol alternatives, section picker, dialogs and targets. | P1 | M | Medium | Touch/keyboard/axe checks; physical-device follow-up. Implemented. |
| 2 — stash/library workflow | Search, weight/dye-lot filters, purchase details, bounded lists and local import overrides. | P2 | M | Low–medium | Consistent validators and merge behavior. Implemented. |
| 2 — E1 | Add project-owned working-chart state and one clearly defined next-row operation. | P1 | M | Medium | Decide completed-row/current-row semantics; migrate existing markers; keep backups compatible. Recommended. |
| 3 — storage before attachments | Move larger documents/photos to IndexedDB with migration, export manifests and recovery tests. | P1 for attachments | L | High | Preserve original data until migration verified; test quota/eviction and malformed attachment cases. Recommended. |
| 3 — E2 | Add a local PDF working copy with annotations and persistent position. | P2 | L | Medium–high | Attachment storage, licensed reader dependency/security review and file-inclusive backup. Recommended. |
| 3 — E3 | Add multi-yarn allocations and reversible consumption, with lot/color roles and purchase costs. | P2 | L | High | Project-owned data and explicit inventory ledger; allocation tests. Recommended. |
| 3 — E4 | Manual row reminders/shaping rules. | P2 | M | Medium | Project-owned counters, reset/repeat semantics and clear notification behavior. Recommended. |
| 3 — E5 | Gauge/repeat calculator with explicit assumptions. | P2 | M | Medium | Validated units, rounding and knitting-domain fixtures. Recommended. |
| 3 — E6 | Repeat regions, palette roles and tiled printouts. | P2 | M–L | Medium | Chart schema versioning and print/gauge fixtures. Recommended. |
| 4 — E7 | Add only the most-used measurement/needle/tag fields after observing actual sessions. | P3 | M | Low–medium | A small human usability study and export updates. Optional. |
| 4 — E8 | Brief completion response and user-controlled decorative density. | P3 | S | Low | Reduced-motion and save-state checks. Optional. |

Do not add photos/PDFs as base64 strings in the current localStorage record. Do not weaken the existing CSP to make a viewer work. Keep offline operation and manual export usable when any online connector fails.

## H. Changes Implemented

The implementation is incremental. The supplied image assets, motif collection and seasonal briefs remain in place. No production framework, remote font, analytics service, database or required subscription was introduced.

| File | Significant changes |
| --- | --- |
| `data.js` — new | Legacy migration, a single saved record, atomic commit, recovery retention/acknowledgment, persistent failed-save state and stale-tab detection. |
| `backup.js` — new | Version 4 backup export, full validation, restore planning/preview, conflict choices, stash-reference remapping and one-save restoration. |
| `projects.js` — new | Project records, forms, counters, repeat position, notes/status/dates/history, pattern/yarn references, planning estimates and optional wake lock. |
| `app.js` | Correct chart geometry/gap analysis, lock/zoom/symbol/text/keyboard controls, redo, saved-pattern identity, metadata-safe saving, validated ranges, one-form editing, import overrides/results, section navigation and bounded library cards. |
| `yarns.js` | Recovery-aware loading, quantity protection, stash filters/paging/details, meters, local corrections, disposal status, recorded USD cents, safe CSV text and three catalog corrections. |
| `index.html`, `style.css` | New real working forms/views, mobile navigation, accessible labels, touch targets, contrast, compact working surfaces and print treatment. |
| `llm.js`, `worker/claude-worker.js` | Exact dimension checks, direct chart placement, explicit model configuration, bounded provider output, actual request-body limits and controlled failures. |
| `worker/ravelry-worker.js` | Streamed request limits, input validation, credential checks, controlled yarn-search failure, upstream deadlines, disposal status, deduplication/partial-result reporting and optional username restriction. |
| `sw.js`, `offline.js` | Version 3.2 shell includes the new scripts; update/readiness messages are more accurate; old tabs retain the existing safe activation policy. |
| `cats.js` | Decorative sleep marks use SVG paths; cat style and motion controls remain. |
| `tests/run-tests.mjs`, `tests/browser-tests.cjs` | Reproducible dependency-free data/Worker tests and optional real-browser workflow/accessibility tests. |
| `README.md`, `CHANGELOG.md`, `TESTING.md` | Current deployment steps, model/Worker requirements, backup/recovery instructions, monthly price instructions and honest test limits. |

Not implemented: E1–E8's remaining capabilities, live-account permission verification, external deployment changes, a multi-user authentication service, automatic price retrieval or complete cloud synchronization. These are recommendations or deployment follow-ups, not hidden mockups.

## I. Testing Results

**Final recorded checks:** 36 dependency-free data/security/Worker tests and 38 real Chromium browser scenarios passed. Static checks also verified JavaScript syntax, unique HTML IDs, literal DOM references and consistent versioned offline assets. The browser profiles used synthetic data. API calls were intercepted with synthetic responses; no paid provider calls or real Ravelry account records were used.

The browser suite covered:

- Existing-data migration with an invalid neighbor, retained recovery originals and acknowledgment across reopening.
- Chart generation validation, mouse/touch/keyboard editing, lock protection, undo/redo, typed grids, custom motif saving and downloaded PNG bytes.
- Correct square-image aspect conversion, three-color gaps, flat-row direction, chart save metadata and progress identity after reload.
- Bounded rendering/search in a larger pattern fixture.
- Incomplete/repeated Ravelry imports, local corrections, disposal status, filters, dye lots, meter conversion and unknown total protection.
- Creating/editing projects; rows, repeats and secondary counters; pause behavior; notes and row persistence.
- Backup download content, restore preview/merge choices, invalid backups, simulated quota failure, older backup formats and remapped yarn references.
- Price arithmetic, CSV round-trip, formula-like exported text, preserved cents, leap-day validation and year-end review dates.
- All twelve months in both hemispheres, plus saving an inspiration brief.
- Malformed/failed AI responses preserving the chart, full-sized output without motif scaling and failed import recovery.
- Text-only rendering of an HTML-shaped pattern name and rejection of unsafe backup links.
- Actual service-worker installation and cached reopening at a subpath with browser networking disabled.
- 320px/390px phone emulation and 844px landscape, reduced motion, print CSS and a stale second tab.
- An axe WCAG A/AA sweep of all eight desktop sections and the project form, with zero reported violations in those tested states.

Separately, browser fixtures against the **unmodified original ZIP** reproduced the hidden-library, omitted-draft, metadata-loss, float false-negative, image-distortion and partial-restore defects. A mocked Worker test also demonstrated the original length-header bypass. This supports the findings independently of tests written against the fixes.

### Not verified

Live Ravelry authentication/scopes, private-library access, actual API rate budgets, real account pagination and the commercial developer agreement remain unverified. Provider-specific AI model behavior, billing limits, Cloudflare dashboard configuration and deployed GitHub Pages behavior were not tested with account access.

Chromium mobile emulation is not an iPhone or Android device. Safari/WebKit/Firefox, physical one-handed ergonomics, VoiceOver/TalkBack, operating-system font scaling, battery behavior/wake-lock lifecycle, real browser eviction and a maximum-size real user library still need dedicated checks. The accessibility scan did not exercise every possible imported card/dialog/error state. Print CSS was inspected; large tiled or publication-grade PDF output is not supported.

The app has no automatic cloud backup. localStorage remains synchronous and quota-limited; retaining migration/recovery copies can increase space use. Multi-tab detection prevents ordinary stale saves but is not a cross-device synchronization protocol. Normal Restore imports backup JSON; recovery JSON is a diagnostic safeguard, not an automatic repair format.

`TESTING.md` provides commands and a short deployment smoke test. These limits should remain visible in release notes rather than being covered by a blanket “fully tested” claim.

## J. Final Product Vision

Bow & Purl can become a calm, dependable knitting companion that begins with the yarn a person owns and helps them resume exactly where they stopped. Its identity should come from the cats, warm visual system and a few thoughtful interactions, while its value comes from trustworthy saved work, clear chart reading and low-effort project continuity.

The strongest next release would unify a project's working pattern, chart position, reminders, yarn allocations and notes. It should keep explicit units, transparent estimates, reversible inventory changes, offline access and complete portable backups. A smaller number of deeply reliable knitting workflows would distinguish it more convincingly than a long menu of loosely connected features.

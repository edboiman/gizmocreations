# Bow & Purl v3.3

An offline knitting chart studio, pattern library, yarn stash and project notebook. The cat photographs, animated studio cats and solid black navigation hearts remain. The app is plain HTML, CSS and JavaScript: no build step, account, subscription or runtime package install is required.

This release applies the approved quiet knitting studio design: cream surfaces, charcoal text, restrained rose, compact cat branding and black-heart navigation. Projects put the working session first; Charts has Design and Knit presentations; inventory and patterns precede setup. The v3.2 storage protections and tools are retained.

## Publish to GitHub Pages

Read **`PUBLISH_TO_GITHUB.md`** for the exact upload steps and the optional Worker upgrade notes.

1. Export a backup from your existing app. Keep the same app address to retain browser-local data.
2. Extract the ZIP and open `bow-and-purl`. Upload **the contents of that folder** where your existing `index.html` lives, replacing matching files and preserving subfolders. Upload every website file together.
3. Let GitHub Pages finish publishing. Open the existing address online, allow the offline update to download, close all Bow & Purl tabs/home-screen windows, then reopen. Never clear browser data to force the update.
4. Check the cream/rose design, black-heart navigation and **Knit · locked** view. Wait for **Ready for offline use** before disconnecting.

**Updating from v3.2:** both standalone Workers are unchanged. Keep their code, settings, URLs and secrets.

**Updating directly from v3.1 or earlier:** this ZIP also includes the previous connector fixes. If you use a connector, update its Worker separately as described in `PUBLISH_TO_GITHUB.md`. The AI connector requires an explicit `MODEL`. No connector is needed for local chart, project, stash or monthly tools.

## What you can do

### My projects

The most recently updated active project leads when the app opens this screen. Continue knitting selects another active project for the current visit without changing its data. Completing a row updates its activity time, so that session leads on reopening. Search/status filter the other-project list; the working session stays in view. Planning, goal progress, history and status actions expand below the counters.

Start a project directly or from a pattern card. Record the pattern reference, yarn reference, current section, needles, blocked gauge, your size's yardage, notes and start date. Projects support:

- A large completed-row counter with a one-row correction button.
- An optional row goal and a repeat position derived from completed rows.
- Two optional independent named counters, such as decreases and cable crossings.
- Pausing, resuming, finishing dates and recent activity.
- An optional keep-screen-awake control on browsers that support it.

The repeat line shows the **next row to work**. Twelve completed rows of a twelve-row repeat means one repeat completed and row one next.

Project counters and a linked chart's current-row marker are separate. A yarn reference does **not** reserve inventory or deduct skeins. Multiple projects may reference the same stash entry. This release has one yarn reference per project; multi-yarn allocation is a future upgrade.

If you enter your size's yardage, the planning estimate adds 10%. With a linked yarn's recorded purchase price and known yards per skein, it estimates yarn value from that purchase price; otherwise it uses the selected weight estimate. This is a proportional yarn-value estimate, not a whole-skein shopping total or a fit guarantee.

### Chart studio

Use **Design · editable** for the motif inspector and drawing. **Knit · locked** hides the design inspector and gives the chart and row controls priority. Chart view & drawing controls, text reading, float details and save/export remain available below. Edit name, motif & dimensions returns to Design.

Choose 8–120 stitches and 8–160 rows. Keep using the 55 supplied motifs/all-over designs, layouts, image conversion, custom typed grids, palettes and saved motifs.

- **Edit chart:** tap/drag to paint. Arrow keys move the keyboard cursor; Space paints a stitch.
- **Knit (locked):** touch cannot paint. Swipe to pan and use the row controls.
- **Undo / Redo:** up to 30 editing steps; changing the chart's saved-pattern association is tracked too.
- **In rounds / Flat:** row text and column numbering follow the selected direction.
- **Show color symbols:** dot = background, cross = motif, circle = accent. These identify yarn colors, not knit/purl operations.
- **Read the current row as text:** gives color runs in working order.
- **Zoom:** 75%, 100%, 150% or 200%.

The float guide estimates gaps for each color actually used in that row, including the join for rounds. A color missing from an entire row is not included. Edge carries and where you introduce/drop yarn still need judgment. Three-color rows are flagged. The guide does not certify a chart as technically correct.

Knit proportions use a fixed 4:3 stitch-width-to-height assumption. Image conversion now compensates in the correct direction. This is still a preview, not your personal gauge. Use a swatch. Images must be under 12 MB and 32 megapixels.

PNG and browser Print/PDF include the chart. Print includes the color key. Large charts shrink to fit; tiled multi-page printing is not implemented.

### Pattern library

Search comes first. Filter & sort contains weight, source, ordering and grouping. Import patterns opens Ravelry configuration; Add pattern opens the manual form. Notes, yarn alternatives and edit/delete actions expand within each card.

Search by name, designer or notes; filter by weight and source; sort by name or yardage. Edit details in a single dialog. Ravelry imports retain details you edit locally and your notes. Saving a chart keeps existing source, designer, link and yardage metadata.

The default continuous grid initially shows up to 24 matching patterns. Show more expands it. Under Filter & sort, Group by yarn weight restores separate groups, each with its own paging and a yardage overview. Counts include every match.

Patterns are metadata, notes, links and saved colorwork charts. The app does not import, store or annotate pattern PDFs.

### Yarn stash

Search and inventory come first. Add yarn and Import open the existing forms on demand. Filter & sort contains weight and ordering. Fiber, purchase records and skein adjustments expand within each entry.

Incomplete Ravelry entries continue to import: missing amounts stay unknown, not zero. Enter per-skein details or a known total. Unknown totals do not count toward coverage estimates.

Search yarn, color, fiber and dye lot; filter by weight; sort by name, amount or unknown quantities. Record fiber, dye lot, paid price per skein and purchase date. Enter length in yards or meters; the app stores yards using `1 yard = 0.9144 meters`. Edit amounts are in yards.

Quantity corrections and manually edited yarn details survive re-import. If the Worker returns a used-up/gifted/sold/traded status, an uncorrected imported entry becomes unavailable; explicit local quantity corrections are kept and shown for review. A partial import does not delete absent entries. Review disposed yarn that was not returned by the API yourself.

The +/− skein buttons require known per-skein yardage so they cannot destroy an independently recorded total. Use Edit details otherwise. Stash suggestions compare yardage only. Matching weight does not prove compatible fiber, gauge, construction, color proportions or dye lots.

### Monthly ideas

There are 48 original, bundled project briefs, four per month. Month, hemisphere, weight, skill and stash filters work offline. Southern-hemisphere seasonal ideas shift six months; calendar themes keep their calendar month. Ideas repeat annually and are not live weather recommendations.

Save idea adds a brief to the library. Set up chart fills studio settings; Generate applies them. These are inspiration briefs with rough planning yardage, not complete tested garment patterns.

## Saving, backups and recovery

Data remains on this browser/device. v3.2 migrates the existing data into one saved record, allowing a multi-section restore to succeed or fail as one update. Original legacy keys are retained as a safety copy; they are not continuously synchronized with older app versions.

- **Export backup** is available on every section. Version 4 backup JSON includes patterns, the current draft, projects, stash, motifs, saved yarns, prices and seasonal preferences. Connector credentials and tokens are excluded.
- **Restore backup** accepts versions 1–4. It previews the contents before saving. Choose whether this device's versions or backup versions win for matching IDs, whether to replace the current chart draft, and whether to use the backup's price settings. New items merge in; items absent from the backup are kept.
- Invalid backup sections reject the restore before saving. A storage failure cannot leave only some sections restored.
- Invalid saved records are set aside while valid neighbors remain available. Original affected data is kept for a **recovery file**. This diagnostic JSON is separate from normal backup JSON; the normal Restore command does not import recovery files.
- You can hide the recovery reminder without deleting the retained originals. Download recovery and Restore backup remain available under More → Help & settings → Backups & saved data. A new detected issue raises the reminder again.
- If storage is full/unavailable, a persistent notice appears. Keep the tab open and export current work. Do not assume a disappearing notification means data was saved.
- If another tab saves newer data, saving pauses in the stale tab. Export any unsaved work there, then reload it.

Keep regular backups outside the browser. The app cannot prevent browser data eviction, a device failure or someone clearing site data. Retaining legacy/recovery copies also needs space; very full existing stores may be unable to migrate until you have exported and safely resolved the storage issue. There is no automatic cloud backup.

Limits: 3,000 patterns, 500 stash entries, 500 projects, 300 saved yarn definitions, 25 MB per backup import. Browser storage capacity may be reached before these item counts, especially with large charts.

## Updating prices each month

Built-in prices remain undated estimates in USD, not verified current shop prices. The app never fetches monthly prices automatically.

1. Open **Prices** at the beginning of the month. Check your usual shop or receipts for yarns you actually use. Record the skein price and label yardage.
2. In **Update a price**, choose **Weight estimate** to change estimates throughout the app for that weight/tier. Choose **Named yarn quote** for a dated reference quote. Named quotes do not automatically replace a weight average. Historical purchase prices belong on stash entries.
3. For several changes, download the current CSV, edit it and import it. Keep this column order: `type,name,price,yards,weight,tier,source,checked`. Prices and yardage must be positive. Dates use `YYYY-MM-DD`; leave an unchecked date blank. Tiers are `budget`, `mid`, `premium` or `0/1/2`.
4. Four-column files still work: `weight,Fingering,12,400` or `yarn,Cascade 220,10.99,220`. Example prices in the downloaded template are samples.
5. Record a checked date only for prices you checked. Tap **Finish this month's review** after reviewing the prices you use. This records the review; it does not fetch or change prices. The next review is due on the first of the next calendar month.
6. Export a backup after editing. Price CSVs and JSON backups work offline. Opening shop listings requires internet. The review reminder appears when you use the app, not as a closed-app notification.

CSV export prefixes formula-like text with an apostrophe for spreadsheet safety. That apostrophe can remain literal if you re-import an unusual formula-like yarn name. JSON backups preserve original names.

## Optional Ravelry connector

Use the current `worker/ravelry-worker.js` as a standalone Cloudflare Worker. Set:

| Setting | Value |
| --- | --- |
| `RAVELRY_USER` | Secret API credential username, not necessarily your Ravelry login |
| `RAVELRY_PASS` | Secret API credential password |
| `ALLOWED_ORIGIN` | Exact site origin, e.g. `https://yourname.github.io`, without a path or trailing slash |
| `APP_TOKEN` | Secret random string of 16–512 characters |
| `ALLOWED_USERNAME` | Optional: restrict notebook requests to your own Ravelry username |

Enter the Worker URL, app token and Ravelry username under Patterns → Import patterns → Connector settings. This is a manual one-way import; changes in Bow & Purl do not change Ravelry.

The Worker reads at most 1,000 favorites and 1,000 library listings, and fetches up to 1,500 distinct pattern details per import. Single-pattern library records are supported; patterns inside books/magazines are not expanded. Stash detail imports are capped at the first 300 listed entries. Truncation and failed stash details are reported. A successful limited import is not proof that every account record was synchronized.

Credential scopes and resource privacy can restrict access. Do not make private data public merely to work around an error. This package does not establish what private-library access your credentials grant.

The API documentation/agreement requires a signed-in Ravelry account. The public review could not verify that agreement. Before commercial distribution, check the exact API agreement and permissions granted to your app with Ravelry; technical access does not establish commercial permission.

## Optional AI connector

Deploy `worker/claude-worker.js` and configure:

| Setting | Value |
| --- | --- |
| `PROVIDER` | `anthropic` (default) or `openai` |
| `MODEL` | Explicit provider model available in your account; required |
| `ANTHROPIC_API_KEY` | Secret, for Anthropic |
| `OPENAI_API_KEY` | Secret, for OpenAI |
| `ALLOWED_ORIGIN` | Exact site origin |
| `APP_TOKEN` | Secret random string of 16–512 characters |

In Chart studio → Design with AI → AI settings, enter the Worker URL and app token. Do not enter a provider API key into the public app. Your prompt and dimensions go to your Worker/provider. The provider may charge for requests.

The Worker validates exact chart dimensions, caps output tokens and times out upstream requests. Some selected models may have smaller output limits or incompatible API capabilities. Use a model that supports the requested output size. AI still cannot validate fit, yarn usage or all knitting technique constraints.

**Configure Cloudflare rate limiting and provider spending limits separately.** A browser token is a bearer credential, not multi-user authentication. Anyone who obtains it can call the connector. CORS is not a spending limit. Do not publish the token or put it into frontend source code.

## Offline access and privacy

Wait for Ready for offline use on each browser/device after an online visit. Then the same address can reopen offline, including at a GitHub Pages subpath.

| Works offline after installation | Needs internet |
| --- | --- |
| Charts, row text, editing and saved motifs | New AI designs |
| Projects, counters, notes and saved data | Ravelry imports/searches |
| Monthly ideas and stash estimates | External pattern websites/photos |
| JSON backup/restore and saved price CSVs | Checking current shop listings |

The authored app shell is cached; Worker responses and external photos are not. Opening `index.html` directly as a local file does not install an offline service worker.

Provider keys and Ravelry API credentials live on Workers. App tokens remain in device browser storage and are masked in settings. All pages on one GitHub Pages origin share browser storage: avoid untrusted applications on that same origin. There is no analytics SDK or remote font dependency. User text is rendered as text; the only SVG markup assembled with `innerHTML` is fixed, authored cat artwork.

## Tests and known limits

Run dependency-free checks with `node tests/run-tests.mjs`.

For browser checks, install Playwright as a development tool, install its Chromium browser, then run `node tests/browser-tests.cjs`. This starts its own local server and synthetic browser profiles. `BOW_PURL_QA_DIR` optionally writes internal test screenshots/results. `BOW_PURL_AXE_PATH` optionally points to an installed `axe-core/axe.min.js` for the accessibility sweep. These test dependencies are not loaded by the app or needed for GitHub Pages.

See `TESTING.md` for recorded results and remaining device checks. Live Ravelry and paid AI requests were not exercised with account credentials. iOS Safari, physical-device wake lock and real device eviction are not certified by Chromium emulation. Full PDF reading, multi-yarn reservations, a needle inventory, row-specific reminders, tiled printouts and automatic multi-device sync are not implemented.

# Bow & Purl v3.3 design notes

The implemented direction is a quiet knitting studio: cream surfaces, charcoal reading text, a restrained rose action color, a small real cat portrait, and the original solid black navigation hearts. Original photographs and authored animated cats remain in Help and monthly inspiration. Working screens no longer repeat introductory photo banners.

## Tokens

| Role | Value |
| --- | --- |
| Page / surface | `#F7F4EF` / `#FFFDF9` |
| Main / secondary text | `#302826` / `#6F625C` |
| Primary / contextual rose | `#8D3F58` / `#F1E3E6` |
| Decorative / input borders | `#DED6CD` / `#9C8C82` |
| Focus | `#625185` |
| Success / warning / destructive | `#456A55` / `#8A5A19` / `#A13F3F` |
| Navigation heart | `#171117` |

System sans-serif handles reading and controls; Georgia/Times handles the brand and page headings. Body/input text is 16px/24px, supporting text 14px/20px, page headings 28px/34px on phones and 32px on desktop. Project counters use 64px tabular numerals. Buttons are normally at least 48px high; row controls are 56px. Cards use 12px corners and flat borders. Fields/buttons use 9px corners. Keyboard focus uses a 3px outline with 3px offset. There are no remote fonts, image services or new runtime dependencies.

The spacing rhythm is 4/8/12/16/24/32px. Phone outer/card padding is 16px; desktop uses 24–32px. Optional cat animation retains reduced-motion handling. Mobile navigation and notifications account for the safe-area inset.

## Working rules

- The most recently updated active project leads on reopening Projects. A different active project can be selected for the current visit without editing its data. Updating that project's row/counter records activity as before.
- Project completed-row counts and linked chart current-row markers remain separate. Neither yarn references nor the redesign deduct inventory.
- Design and Knit use the same chart, draft, view preference and lock. Secondary view/drawing controls, text row reading, float details and exports expand on demand. Float flag counts stay visible.
- Stash and pattern search/results precede add/import setup. Filter & sort holds secondary filters. Pattern weight grouping and its yardage overview remain available.
- Price rows show the selected tier's cost per 220 yards plus per-yard rate, checked date and source. The full table and manual update/CSV workflows remain available.
- Optional project form groups preserve existing values when collapsed. Unknown stash amounts remain explicitly unknown.
- Storage keys, backup version 4 and Worker contracts are unchanged from v3.2. Failed-save/recovery notices remain prominent.

## Changed files

`index.html`, `style.css`, `app.js`, `projects.js`, `yarns.js`, the routine status wording in `backup.js`, `sw.js`, `manifest.webmanifest`, browser regression checks and documentation.

`data.js`, Worker implementations, motif definitions, seasonal data, cat artwork, original photographs and existing connector settings were retained.

See TESTING.md for the validation record and physical-device/live-service limits. See PUBLISH_TO_GITHUB.md to publish the package yourself.

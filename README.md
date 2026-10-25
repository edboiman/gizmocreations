# Bow & Purl v3.1 — matching hearts and monthly price reviews
A phone-friendly knitting colorwork studio. Static HTML, CSS and JavaScript — no build step. Runs on GitHub Pages.

## Updating your existing app

1. In the current app, open **Pattern library → Export backup** first.
2. Unzip this download. Open the `bow-and-purl` folder.
3. Upload **the contents of that folder** to the same place in your GitHub repository where `index.html` already lives. Replace the existing files and keep `images/` and `worker/` as folders. Do not upload the ZIP itself or nest another `bow-and-purl` folder inside your repository. This package has fewer than 30 files; one upload batch is enough.
4. Wait for GitHub Pages to finish publishing, then refresh the app. For a future update after v3, close all Bow & Purl browser tabs and the home-screen app, then reopen it to activate the new offline version. Do not clear browser data to update: that can erase your saved stash and patterns.
5. **For the improved Ravelry connector:** open your existing Ravelry Cloudflare Worker → Edit code, replace the code with `worker/ravelry-worker.js` from this package, then Deploy. Keep the existing variables, secrets, URL and app token. No new account or API key is needed. The AI Worker needs no change.
6. Open **My stash → Import stash from Ravelry** again. Existing imported records update; missing amount details remain visible as **unknown**. The website change fixes skipping incomplete entries even with the previous stash-capable Worker; the updated Worker also improves partial-pack totals and reports failed detail requests.

For a new repository, use Settings → Pages → Deploy from a branch → main → / (root).

## New in v3.1

- Every navigation tab uses the same fixed, solid black heart. The icon is vector artwork so device emoji fonts cannot turn it into a colored emoji.
- **Prices → Monthly price review** shows the last review and next due date. Reviews become due on the first of the following calendar month. This works when you open the app; it does not send background notifications or automatically fetch shop prices.
- Enter a current price per skein and label yardage directly in **Update a price**. Choose **Weight estimate** to change app cost estimates for that weight and tier. Choose **Named yarn quote** to keep a dated reference quote for a particular yarn. Existing custom quotes have Edit quote buttons.
- Each edited weight/tier estimate and yarn quote keeps a date checked and optional shop/source. Finishing a monthly review records the overall review without changing individual price dates or inventing new prices.
- **Download current prices CSV** preserves all weight tiers, named quotes, source notes and checked dates. Four-column CSVs from earlier versions still import into the selected estimate tier.

### Monthly price-update instructions

1. Open **Prices** at the start of each month. Check your usual shop's regular prices or a recent receipt for yarns you actually use. Record the price per skein in USD and yards per skein. For meters, multiply by 1.0936 to get yards. Checking a shop website needs internet; an existing receipt can be used offline.
2. Update a few prices with the form. For a weight estimate, use a representative skein for that weight and budget/mid/premium tier. The price divided by its yardage becomes the new price per yard used for project estimates. Named yarn quotes are stored for reference; they do not automatically replace a weight average.
3. For many prices, download the current CSV, open it in a spreadsheet, edit the price and yardage cells, and save as CSV. Preserve the column order: `type,name,price,yards,weight,tier,source,checked`. Valid tiers are `budget`, `mid`, `premium` (or 0/1/2); dates use `YYYY-MM-DD`. Only change the checked date for rows you really checked. Re-import merges matching rows and retains other saved prices. Invalid rows are counted and skipped.
4. After reviewing your usual prices, click **Finish this month's review**. The next review becomes due on the first of the next month. This records a manual check; it does not update prices itself.
5. Export a backup from Pattern library. Dates, notes, prices and review status are included. Price files and backups are per device; use them to transfer updates to another phone or browser.

This release needs only a website-file update. **No new Cloudflare Worker deployment is needed if you already installed the v3 Worker.** After uploading the new files, open the app online once to let the offline update download, close every Bow & Purl tab/home-screen window, then reopen it. If the previous version remains, repeat closing and reopening after the download finishes. Do not clear site data to update.

## New in v3

- **Animated studio cats:** blinking, kneading paws, moving tails, rolling yarn, and a sleepy cat on the ideas tab. Tap for a heart. Pause cats is remembered on this device; reduced-motion settings are respected.
- **Monthly ideas:** 48 original project briefs, four for each month. The device date selects the current month. Browse other months and filter by yarn weight, skill or stash yardage. Southern hemisphere seasons shift six months; calendar themes stay with their month.
- **Save or design:** Save idea adds the brief to the Pattern library. Set up chart fills chart controls; Generate applies them, and Undo restores the previous chart. Briefs are inspiration with approximate planning yardage, not full garment patterns. Choose a tested pattern and swatch for your measurements.
- **Incomplete stash imports:** missing skein counts or yards no longer discard a yarn. Edit amounts accepts either skein details or total yards. Unknown quantities stay unknown and do not count as zero or produce misleading project matches. Locally edited amounts survive re-imports; they do not change Ravelry.
- **More reliable backups:** keep incomplete stash records, Ravelry identifiers, local quantity corrections, saved yarns and price settings. Older v1/v2 backups still load. Restore adds stash records without duplicating matching IDs and keeps existing entries. Saved price settings restore when the device still uses built-in estimates; existing custom prices are kept.
- **Float check fix:** long runs at the beginning of multicolor rows are now flagged. This remains a simple color-run guide, especially for three-color designs; review actual floats yourself.

## Offline use

Open the published HTTPS app once while connected and wait for **Ready for offline use** at the bottom. This saves the app, cat photos, animations, motif library and monthly ideas on that browser/device. You can then reopen the same address or home-screen app offline.

| Feature | Works offline after setup? |
| --- | --- |
| Monthly ideas, filters and animated cats | Yes |
| Creating/editing charts, local image conversion, row counter | Yes |
| Saved pattern details and stash, editing quantities | Yes |
| Built-in yarn/price data and JSON backup export/restore | Yes |
| New Ravelry imports and Ravelry yarn searches | Needs internet |
| Optional AI designs and external pattern links/photos | Needs internet |

Monthly ideas are bundled in `seasonal.js`; there is no AI call, subscription or live lookup. They repeat each year. Add new briefs to that file in a future release. Browser data and offline caches can be removed by the browser or by clearing site data; keep exported backups. The first online visit is needed on each device. Opening `index.html` directly as a file does not install the offline cache.

The app stays buildless: plain HTML/CSS/JavaScript. All new assets are local, with no downloaded animation library or web fonts. The Worker scripts are deployed separately and are not part of the offline cache.

## Validation for v3

Checked the desktop and 390px phone layouts; saving unknown stash amounts, editing to fractional skeins, stash matching, saving ideas, chart setup/generation/undo; JavaScript syntax; and regression fixtures for incomplete/repeated imports, local corrections, backup restore, all 12 months and both hemispheres, and partial Ravelry pack totals. A cache test verified offline navigation and asset loading at a GitHub Pages-style subpath with the network disabled. The internal preview uses HTTP, so actual service-worker installation and airplane-mode reopening must be checked on your published HTTPS app. No live Ravelry account credentials were used in testing.

## What's new in v2
- **55-design dropdown**: 23 cute & cozy motifs, 25 original game/fantasy pixel designs (swords, shields, potions, dragon, slime, wizard hat, runes, dice…), 7 all-over patterns (argyle, peerie, zigzag, dots…). Plus "Surprise me".
- **Three colors** (background, motif, accent) with preset palettes and a "two colors only" switch.
- **Knit controls**: grid, half-drop, brick, single band (yokes/hems) or centred layout; scale 1–4× or auto; gap across/down; mirror, flip, swap colors, peerie border.
- **Editor**: accent paint, 2×2 / 3×3 brush, 10-stitch guide lines, current-row highlight, mirror/swap/clear, and a **float checker** that flags color runs longer than 5/7/9 stitches.
- **Better image conversion**: live darkness and contrast sliders, 2 or 3 colors, optional dithering, lone-stitch cleanup, fit/fill/stretch, and knit-proportion correction.
- **Type your own grid**: paste rows of 0/1/2 (or . # @); "Copy chart into box" exports the current chart as text.
- **My motifs**: tap "♡ Save as my motif" to crop the current chart and add it to the top of the motif dropdown. Build designs by typing a grid, uploading an image or painting. Saved per device and included in backups.
- **Yarn shop tab**: pick the weight on a yarn label and enter the skein length (yards or meters). See every matching pattern from your library with yardage and skeins needed, smallest to largest size. Optionally enter how many skeins you'd buy to see what fits.
- **Ravelry favorites + library**: import patterns you've favorited and the patterns in your Ravelry library. The library groups them by yarn weight, shows yards per pattern, and a "Yarn at a glance" table with totals and averages per weight. Search, sort by yardage and filter by source.
- **Yardage on any pattern**: add or edit yards on your own patterns too.
- **Library thumbnails**. Old v1 charts and backups still load.

## Cat photos
The hero and each tab use the owner's own cat photos in `images/` (resized, with all EXIF/GPS metadata removed). To swap one, replace the file with the same name.

## Yarn, stash and prices
- **Yarn suggestions**: every pattern shows the yarn the designer used (from Ravelry, when listed) plus common brands for its weight.
- **Yarn library**: 135 built-in yarns (indie brands plus craft-store staples like Caron, Bernat, Red Heart, Lion Brand, Loops & Threads, Premier, Lily and Scheepjes), including Knitting for Olive, Sandnes Garn, Drops, Isager, Brooklyn Tweed, Hedgehog Fibres, La Bien Aimée, Biches & Bûches, Jamieson's and more. Yardages and prices are approximate; KFO Merino and Heavy Merino were checked against retailer listings.
- **Ravelry yarn search**: in My stash, tap 🔍 Ravelry to search Ravelry's whole yarn database (any brand). Picking a result fills in weight and yardage and saves that yarn, so it also shows up in suggestions for patterns of that weight. Uses the Ravelry connector; redeploy `worker/ravelry-worker.js` to enable it.
- **Yarn dropdown**: in My stash, yarns already in your stash come first, then yarns designers used in your saved patterns, then yarns saved from Ravelry, then everything by weight. Choosing one fills in weight, yardage and the color you last had of it; the color box suggests your colors first, then common color names.
- **Import stash from Ravelry**: My stash → Import stash from Ravelry. Brings in yarn, weight, yards per skein, skeins and colorway. Re-importing updates those entries (marked ↻); yarns you added by hand are kept. Items marked used up, gifted, traded or sold are skipped. Missing yardage or skein counts are imported as unknown. Reads up to 300 stash entries. Use the updated connector for complete pack-total handling.
- **My stash tab**: add brand, weight, yards per skein and skeins (pick a known yarn to auto-fill). It lists patterns from your library that each yarn covers, or all yarns of a weight combined, with "every size fits" or "smaller sizes fit" and leftovers.
- **Prices tab**: built-in rough 2026 US Midwest averages per yard in budget, mid and premium tiers, used for cost estimates across the app. Import your own CSV (`yarn,Cascade 220,10.99,220` or `weight,Fingering,12,400`; price per skein); "Download template" shows the format. Brand yardages and prices are typical values; check ball bands and your shop.

## Optional AI design (Claude or ChatGPT)
`llm.js` sends a prompt to a small connector that you host; the connector holds the API key. **Never put an API key in the GitHub files** — anyone could read it.

1. Create a free Cloudflare account → Workers → Create Worker → paste `worker/claude-worker.js` → Deploy.
2. In the Worker's Settings → Variables add:
   - `ANTHROPIC_API_KEY` (as a secret) — from console.anthropic.com. **Or** for ChatGPT: `PROVIDER=openai`, `OPENAI_API_KEY` (secret) and `MODEL` (an OpenAI model name).
   - `ALLOWED_ORIGIN` = your Pages address, e.g. `https://yourname.github.io`
   - `APP_TOKEN` (secret) = a random string of 16+ characters (required).
3. Add a rate-limiting rule for the Worker and set a monthly spending limit with your AI provider.
4. In the app: Chart studio → Design with AI → AI settings. Paste the Worker URL and app token, then Save.

The connector asks for original designs and validates the returned grid before the app accepts it. AI output still needs a human check for knittability.

## Ravelry setup (about 10 minutes, free)
Ravelry requires API credentials, and they must not go in the public GitHub files, so a tiny connector holds them.
1. Sign in to Ravelry and open https://www.ravelry.com/pro/developer. Create an app and choose **Basic Auth – read only**. Note the username and password it shows (these are API credentials, not your login).
2. Cloudflare → Workers → Create Worker → paste `worker/ravelry-worker.js` → Deploy.
3. Worker Settings → Variables: `RAVELRY_USER` and `RAVELRY_PASS` (as secrets, from step 1), `ALLOWED_ORIGIN` = your Pages address (e.g. `https://yourname.github.io`), `APP_TOKEN` (secret) = a random string of 16+ characters (required).
4. In the app: Pattern library → Connector settings → paste the Worker URL and app token. Enter your Ravelry username, choose Favorites + library, and tap **Import from Ravelry**.

Re-importing updates existing patterns without touching your notes. Imports up to 2,000 patterns. The library import includes single patterns (PDFs, purchases); patterns inside books and magazines in your Ravelry library aren't included, so favorite those individually or add them by hand. If your library is private, only favorites are imported. Patterns without yardage on Ravelry show "Yardage not listed"; tap Edit details to fill it in. Yardage ranges run from smallest to largest size. Use of the Ravelry API is subject to Ravelry's API terms; this read-only setup is intended for personal use.

## Design notes
All motifs are original artwork. The app does not include licensed characters, game logos or emblems; the AI connector is instructed to make original designs in the same spirit if asked for one.

## Security
- No API keys or Ravelry credentials are in the site files; they live only in the Cloudflare Workers as secrets.
- Both connectors refuse to run unless `ALLOWED_ORIGIN` and a 16+ character `APP_TOKEN` are set, check the token in constant time, and reject large requests.
- The app token is stored in your browser on this device. Anyone with it can use your connectors, so don't share it. If it leaks, change `APP_TOKEN` in Cloudflare and re-enter it in the app.
- **Add a rate-limiting rule** to each Worker (Cloudflare → Security → WAF → Rate limiting, e.g. 30 requests per minute) and set a **monthly spending cap** with your AI provider.
- All pages on `yourname.github.io` share browser storage. Don't host other people's code under the same GitHub Pages address, or use a custom domain for this app.
- A Content Security Policy blocks outside scripts. All user text is shown as plain text, and links are limited to http(s).
- Imported backups and price files are validated before use.
- Ravelry pattern photos load from Ravelry's servers, which see your IP address like any image on the web.

## Limits
Patterns, stash and prices are stored in the browser on one device; backups include them. No accounts or sync. The float check is a guide, not a full stranded-knitting review. Test on a real phone and print once before sharing with customers.

## Troubleshooting the Ravelry import
The app now says what went wrong. Common causes:
- **"out of date"**: paste the newest `worker/ravelry-worker.js` into Cloudflare and click Deploy (the old one only knows patterns).
- **"could not reach your connector"**: wrong Connector URL, or `ALLOWED_ORIGIN` in Cloudflare doesn't exactly match your site address (`https://name.github.io`, no trailing slash or path).
- **"app token doesn't match"**: the token in the app must equal `APP_TOKEN` in Cloudflare.
- **"stash is private" / "empty stash"**: the connector uses read-only keys, which I believe can only read what you've made public. Set your stash (and favorites/library) to visible in Ravelry → Settings → Privacy, import, then set it back.
- Settings are saved as you type, so you no longer need to run the pattern import first.

## Validation for v3.1
Checked direct price edits and review dates in the browser; legacy and extended CSV round-trips across all tiers; quoted yarn names; invalid rows; month/year review rollover; backup metadata; and JavaScript syntax. Offline cache references were updated together to v3.1.

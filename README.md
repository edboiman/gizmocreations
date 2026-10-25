# Bow & Purl v2
A phone-friendly knitting colorwork studio. Static HTML, CSS and JavaScript — no build step. Runs on GitHub Pages.

## Upload to GitHub Pages
Upload everything in this folder to the repository root, keeping the folders:
```
index.html  style.css  app.js  yarns.js  motifs.js  llm.js  README.md
images/     (the cat photos)
worker/claude-worker.js   (optional AI connector; deployed separately, harmless if uploaded)
```
Then Settings → Pages → Deploy from a branch → main → / (root).

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
- **Import stash from Ravelry**: My stash → Import stash from Ravelry. Brings in yarn, weight, yards per skein, skeins and colorway. Re-importing updates those entries (marked ↻); yarns you added by hand are kept. Items marked used up, gifted, traded or sold, or with no yardage or skein count on Ravelry, are skipped. Reads up to 300 stash entries. Needs the updated connector.
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

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
- **My stash tab**: add brand, weight, yards per skein and skeins (pick a known yarn to auto-fill). It lists patterns from your library that each yarn covers, or all yarns of a weight combined, with "every size fits" or "smaller sizes fit" and leftovers.
- **Prices tab**: built-in rough 2026 US Midwest averages per yard in budget, mid and premium tiers, used for cost estimates across the app. Import your own CSV (`yarn,Cascade 220,10.99,220` or `weight,Fingering,12,400`; price per skein); "Download template" shows the format. Brand yardages and prices are typical values; check ball bands and your shop.

## Optional AI design (Claude or ChatGPT)
`llm.js` sends a prompt to a small connector that you host; the connector holds the API key. **Never put an API key in the GitHub files** — anyone could read it.

1. Create a free Cloudflare account → Workers → Create Worker → paste `worker/claude-worker.js` → Deploy.
2. In the Worker's Settings → Variables add:
   - `ANTHROPIC_API_KEY` (as a secret) — from console.anthropic.com. **Or** for ChatGPT: `PROVIDER=openai`, `OPENAI_API_KEY` (secret) and `MODEL` (an OpenAI model name).
   - `ALLOWED_ORIGIN` = your Pages address, e.g. `https://yourname.github.io`
   - `APP_TOKEN` = any random phrase (optional but recommended).
3. Add a rate-limiting rule for the Worker and set a monthly spending limit with your AI provider.
4. In the app: Chart studio → Design with AI → AI settings. Paste the Worker URL and app token, then Save.

The connector asks for original designs and validates the returned grid before the app accepts it. AI output still needs a human check for knittability.

## Ravelry setup (about 10 minutes, free)
Ravelry requires API credentials, and they must not go in the public GitHub files, so a tiny connector holds them.
1. Sign in to Ravelry and open https://www.ravelry.com/pro/developer. Create an app and choose **Basic Auth – read only**. Note the username and password it shows (these are API credentials, not your login).
2. Cloudflare → Workers → Create Worker → paste `worker/ravelry-worker.js` → Deploy.
3. Worker Settings → Variables: `RAVELRY_USER` and `RAVELRY_PASS` (as secrets, from step 1), `ALLOWED_ORIGIN` = your Pages address (e.g. `https://yourname.github.io`), `APP_TOKEN` = any random phrase (secret).
4. In the app: Pattern library → Connector settings → paste the Worker URL and app token. Enter your Ravelry username, choose Favorites + library, and tap **Import from Ravelry**.

Re-importing updates existing patterns without touching your notes. Imports up to 2,000 patterns. The library import includes single patterns (PDFs, purchases); patterns inside books and magazines in your Ravelry library aren't included, so favorite those individually or add them by hand. If your library is private, only favorites are imported. Patterns without yardage on Ravelry show "Yardage not listed"; tap Edit details to fill it in. Yardage ranges run from smallest to largest size. Use of the Ravelry API is subject to Ravelry's API terms; this read-only setup is intended for personal use.

## Design notes
All motifs are original artwork. The app does not include licensed characters, game logos or emblems; the AI connector is instructed to make original designs in the same spirit if asked for one.

## Limits
Patterns, stash and prices are stored in the browser on one device; backups include them. No accounts or sync. The float check is a guide, not a full stranded-knitting review. Test on a real phone and print once before sharing with customers.

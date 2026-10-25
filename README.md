# Bow & Purl v2
A phone-friendly knitting colorwork studio. Static HTML, CSS and JavaScript — no build step. Runs on GitHub Pages.

## Upload to GitHub Pages
Upload everything in this folder to the repository root, keeping the folders:
```
index.html  style.css  app.js  motifs.js  llm.js  README.md
images/     (your kitten photos — see below)
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
- **Ravelry favorites**: import every pattern you've favorited on Ravelry. The library groups them by yarn weight, shows yards per pattern, and a "Yarn at a glance" table with totals and averages per weight. Search, sort by yardage and filter by source.
- **Yardage on any pattern**: add or edit yards on your own patterns too.
- **Library thumbnails**. Old v1 charts and backups still load.

## Kitten photos
The studio, library and help tabs each show a kitten banner. Add your own photos to `images/`:
`kitten-studio.jpg`, `kitten-library.jpg`, `kitten-help.jpg` (landscape, ~1200×400 works well).
Use photos you took or that are licensed for reuse (e.g. Unsplash or Pexels — check each photo's licence). Any banner without a file simply hides itself.

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

## Ravelry favorites setup (about 10 minutes, free)
Ravelry requires API credentials, and they must not go in the public GitHub files, so a tiny connector holds them.
1. Sign in to Ravelry and open https://www.ravelry.com/pro/developer. Create an app and choose **Basic Auth – read only**. Note the username and password it shows (these are API credentials, not your login).
2. Cloudflare → Workers → Create Worker → paste `worker/ravelry-worker.js` → Deploy.
3. Worker Settings → Variables: `RAVELRY_USER` and `RAVELRY_PASS` (as secrets, from step 1), `ALLOWED_ORIGIN` = your Pages address (e.g. `https://yourname.github.io`), `APP_TOKEN` = any random phrase (secret).
4. In the app: Pattern library → Connector settings → paste the Worker URL and app token. Enter your Ravelry username and tap **Import my favorites**.

Re-importing updates existing favorites without touching your notes. Imports up to 500 favorites. Patterns without yardage on Ravelry show "Yardage not listed"; tap Edit details to fill it in. Yardage ranges run from smallest to largest size. Use of the Ravelry API is subject to Ravelry's API terms; this read-only setup is intended for personal use.

## Design notes
All motifs and the mascot (Mochi, a calico cat) are original artwork. The app does not include licensed characters, game logos or emblems; the AI connector is instructed to make original designs in the same spirit if asked for one.

## Limits
Patterns are stored in the browser on one device; export backups. No accounts or sync. The float check is a guide, not a full stranded-knitting review. Test on a real phone and print once before sharing with customers.

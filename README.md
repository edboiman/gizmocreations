# Bow & Purl
A phone-friendly, Hello Kitty inspired knitting studio. Static HTML, CSS and JavaScript: no build, subscription, account or API key required.

## Put it on GitHub Pages
1. Unzip this download.
2. Create a GitHub repository (a public repository is the simplest Pages option).
3. Choose **Add file → Upload files**. Upload the FOUR FILES INSIDE this folder: `index.html`, `style.css`, `app.js`, and `README.md`. Put them at the repository root; do not upload the ZIP or the enclosing folder.
4. Commit the files.
5. In repository **Settings → Pages**, select **Deploy from a branch**, then **main** and **/ (root)**. Save.
6. Open the Pages URL GitHub displays once deployment finishes. On a phone, open that URL in your browser. Add to Home Screen if your browser offers it.

No hidden files are needed. There are only four files to upload. If your default branch has a different name, select that branch instead of main.

## Included
- Set 8–120 stitch columns and 8–160 rows.
- Prompt matching for hearts, stars, flowers, bows, cats / Hello Kitty, diamonds, checks and stripes.
- Centered or repeated motifs, two editable yarn colors, touch painting, undo, knitted aspect preview.
- Upload PNG/JPEG/WebP artwork and convert it to a two-color silhouette.
- Numbered PNG download and browser Print / Save as PDF (large charts shrink to fit).
- Save charts and external pattern links by standard yarn weight, with notes.
- Track current row; export and merge JSON backups.
- Browser-local data; no images or patterns are sent to a server.

## Customer requirement that needs a second phase
The prompt field is a transparent built-in motif selector. It does NOT invent arbitrary artwork using AI. For example, “pink hearts” selects a heart motif; color comes from the color pickers. “A fox drinking tea on the moon” needs uploaded artwork or a future AI integration. Unsupported requests show a message instead of silently generating an unrelated chart.

For unrestricted AI prompts, keep GitHub Pages as the frontend and add an authenticated backend or serverless function that holds the provider key, limits requests and returns chart data. Never put a secret API key in these files. Budget for model usage and manually review generated charts for stranded-knitting suitability.

## Practical limits
Saved patterns belong to the specific browser and site address. They do not sync between devices. Export backups regularly. Clearing browser data, switching domains or using private browsing can remove saved work. No PDF attachments, accounts, automatic stitch instructions, shaping, float warnings or offline guarantee are included.

This is an independent fan-style project, not an official Sanrio product. The cat illustration is built with CSS; there are no downloaded character assets.

## Verification
JavaScript syntax and automated logic checks cover dimensions, motif generation, row limits and backup validation. Phone browser interaction and printed layout still need a real-device check before customer release.

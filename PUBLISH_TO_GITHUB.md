# Publish Bow & Purl v3.3 to your existing GitHub Pages site

This is the finished app, not a screenshot or mockup. No build command or new hosting service is required. Nothing has been published for you.

## 1. Back up in the app first

Open the currently installed app and export a backup. Keep that JSON file outside the browser. If you are still on v3.1 and have an unsaved chart, save it to the pattern library first; the old backup does not include an unsaved draft.

Keep using the same GitHub Pages address. The browser stores your knitting data locally; another domain or device has its own storage. Do not clear site data.

## 2. Upload the extracted files

1. Extract `bow-and-purl-v3.3.zip` on your computer.
2. Open the extracted **`bow-and-purl`** folder. You should see `index.html`, `style.css`, JavaScript files and the `images`, `worker`, and `tests` folders.
3. Open your existing Bow & Purl GitHub repository. Go to the branch and folder used by Pages — the same location that already contains your app's `index.html`. If you publish from `/docs`, open `docs` first.
4. Choose **Add file → Upload files**. Drag in **everything inside** the extracted `bow-and-purl` folder, preserving the subfolders. Replace matching files.
5. Use a commit message such as `Refresh Bow & Purl to v3.3`. Commit to your publishing branch if permitted. If GitHub requires a new branch, create it and merge its pull request into the publishing branch.

Upload the folder's contents, not the ZIP and not a new outer `bow-and-purl` directory. The uploaded `index.html` must replace the existing entry file at the same path. Keep any existing custom-domain `CNAME` or unrelated repository configuration. There are fewer than 100 files in this release.

For clarity, these are the website's root files:

| Files/folders | What to do |
| --- | --- |
| `index.html`, `style.css` | Replace |
| `app.js`, `data.js`, `backup.js`, `projects.js`, `yarns.js` | Upload/replace all |
| `motifs.js`, `seasonal.js`, `cats.js`, `llm.js`, `offline.js`, `sw.js` | Upload/replace all |
| `manifest.webmanifest`, `images/` | Upload/replace, preserving the images folder |
| Markdown guides, `tests/`, `worker/` | Safe to keep in the repository; uploading Worker source does not deploy a Worker |

You do not upload development folders such as `node_modules`. None are included in this ZIP.

## 3. Keep the existing Pages configuration

If the site already works, keep its existing Pages source. Check the repository's **Actions** tab for the Pages deployment to finish.

For a brand-new branch-based setup, use **Settings → Pages → Build and deployment → Deploy from a branch**, then select your publishing branch (often `main`) and the folder containing `index.html` (`/(root)` or `/docs`). Save. If your repository already uses GitHub Actions for Pages, retain that workflow instead of switching its source.

## 4. Worker decision — separate from the upload

### You already installed the v3.2 connector update

**No Worker change is needed for this visual refresh.** The two Worker source files in v3.3 are byte-for-byte the v3.2 versions. Keep the existing Worker URLs, environment variables, API secrets and app tokens. No new token or model is required by the redesign.

### You are updating directly from v3.1 or earlier

The ZIP includes the earlier reliability fixes as well as the design refresh. Update only the connectors you actually use:

- **Ravelry:** replace your existing Cloudflare Worker's source with `worker/ravelry-worker.js` and deploy it there. Keep its URL, `ALLOWED_ORIGIN`, API credentials and app token. The optional `ALLOWED_USERNAME` can restrict personal imports; it is not required by this redesign.
- **AI:** replace your existing AI Worker's source with `worker/claude-worker.js` and deploy it there. The earlier update requires an explicit `MODEL` available to your provider account. Keep your existing provider/API secret, allowed origin and app token. See README for the exact existing variable names.
- **Neither connector:** skip Workers entirely. Local charts, projects, manual stash/pattern entries, monthly ideas and price files work without them.

The site cannot determine which Worker code you currently deployed. GitHub Pages publishes the website; it does not deploy Cloudflare Workers. Never put private API keys into website files.

## 5. Open the update without deleting knitting data

1. Visit your existing app address while online and allow its offline update to download.
2. If the old design is still visible, close **every** Bow & Purl browser tab and home-screen app window, then reopen the same address. The service worker waits for old windows to close before activating the new release. A second online visit/close/reopen may be needed if the update was still downloading.
3. Look for the cream background, small cat portrait, black-heart navigation and the **Design · editable / Knit · locked** selector in Charts. The loaded CSS/JS URLs end in `?v=3.3` if you inspect them.
4. Check one project counter, a known pattern and an incomplete stash entry. Export another backup.
5. Wait for **Ready for offline use**, then test reopening the app without internet.

Do not clear browser data, uninstall stored data, or change domains to force an update.

## If something looks wrong

- **An extra `/bow-and-purl/` appears in the repository:** move the extracted contents to the original publishing folder.
- **An old or mixed design:** verify all files were replaced together; let Pages finish and follow the close/reopen steps.
- **Missing styles/images:** check that `style.css` and `images/` are beside the app entry file, with their original names/case.
- **Ravelry or AI fails:** keep existing connector settings; check the separate Worker deployment section above. The visual redesign does not require replacing your credentials.
- **A failed-save or recovery notice appears:** keep the tab open and download its backup/recovery file before making further changes.

## Official GitHub instructions

- [Upload files to a repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Configure the GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Instructions checked October 29, 2026. Your repository's branch rules may require a pull request.

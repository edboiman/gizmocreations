# Bow & Purl v3.3 validation

Run date: October 29, 2026.

- **36 dependency-free tests passed**, covering storage migration/recovery, atomic failure, stale-tab detection, request authentication and byte limits, Worker failures, AI dimensions/output limits, Ravelry pack quantities and offline asset consistency.
- **44 real Chromium browser scenarios passed**, using synthetic profiles and mocked API responses. These cover chart/motif/image/PNG workflows, mouse/touch/keyboard input, metadata/progress, project counters, stash imports and filters, price CSVs, backup/restore, narrow screens and offline reopening.
- Six refresh-specific browser scenarios cover active-session selection/data retention, 320/390px chart controls above bottom navigation, More-menu focus/routing, continuous/grouped library filtering, dated selected-tier prices, and collapsed-form value retention.
- **Nine accessibility states checked with axe:** eight desktop sections and the project form, WCAG A/AA tags; zero reported violations in those tested states.
- All application and Worker JavaScript passed syntax checks. HTML IDs and literal script element references were checked. Versioned HTML assets match service-worker core entries.
- Defects were also reproduced against the supplied, unmodified v3.1 project: valid records hidden by an invalid neighbor, omitted draft backups, metadata loss on re-save, missed three-color gaps, reversed image compensation, partial restore and a header-only request limit bypass.

API fixtures used invented names and tokens. No real account secrets, Ravelry data or paid AI requests were used. Development tools are not app dependencies and are not included in the deployment bundle.

## Run the tests

From the `bow-and-purl` folder:

```sh
node tests/run-tests.mjs
```

For browser QA, install Playwright as a development tool and its Chromium browser, then run:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser-tests.cjs
```

The browser script starts its own local HTTP server and uses test profiles. It does not connect to a deployed production app.

Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `BOW_PURL_QA_DIR` | Destination for local QA screenshots and result JSON. Leave unset if these are not needed. |
| `BOW_PURL_AXE_PATH` | Absolute path to an installed `axe-core/axe.min.js` for the accessibility sweep. Without it the browser suite runs 43 scenarios. |
| `CHROMIUM_PATH` | Optional installed Chromium executable when the normal Playwright download is unavailable. The recorded run used a packaged headless Chromium binary. |

The visual refresh retains the exact v3.2 data.js persistence code, standalone Workers, motif definitions, seasonal idea data and image assets. There is no new storage migration. All 36 dependency-free checks also passed on this release.

The app itself does not require `node_modules`, npm installation or these development tools. Do not upload development dependency folders to GitHub Pages.

## Coverage limits

Live Ravelry permission scopes, private-library access, actual service rate budgets and the current developer agreement were not verified. Provider-specific model behavior, billing settings and Cloudflare production settings were not tested. The test API responses do not substitute for an account-connected smoke test.

Phone layouts were exercised at 320 × 740, 390 × 844 and 844 × 390 in Chromium emulation. No physical iPhone/Android, Safari/WebKit/Firefox, VoiceOver/TalkBack, OS-level large-text behavior, real battery/wake-lock behavior or browser data eviction was certified. The axe sweep is not an exhaustive accessibility audit of every possible imported/error/dialog state.

Offline reopening was tested with an actual local service worker, a GitHub Pages-style subpath and browser networking disabled. Deployed GitHub Pages and service-worker upgrades across real existing devices still need the smoke test below. Print CSS includes the chart/key and excludes app chrome; multi-page tiled exports are not implemented.

## Deployment smoke test

1. Before updating, export the existing app's backup. If needed, keep the current draft's grid or PNG separately because v3.1 backup omits it.
2. Upload every website file to the same repository location. Redeploy the Workers you use. The AI Worker now needs an explicit `MODEL`.
3. Open online, allow the update to download, close all app tabs/home-screen windows and reopen. Confirm My projects and Knit (locked) mode appear.
4. Check a known chart, pattern yardage/link and incomplete stash record. Export a new version 4 backup.
5. Create a test project, increase/decrease its row, reload and confirm the count/notes remain.
6. Wait for Ready for offline use. Reopen in airplane mode and verify the chart, projects, monthly ideas and stash.
7. Reconnect and test one real Ravelry import if configured. Review partial-import messages and local quantity overrides.
8. If AI is configured, try a small chart with the selected provider model. Confirm exact dimensions and review the design before knitting.
9. Try the chart's locked pan mode, native section picker and dialogs on the actual phone. Check its print layout before relying on a large printed chart.
10. Keep the exported backup outside the browser. If a save/recovery notice appears, export first and keep the tab open; do not clear site data as an update method.

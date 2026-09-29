# Stormkeeper

A phone-first Magic: The Gathering tracker for floating mana, storm count, and lands played. Keep your turn on one screen with large tap targets, automatic saving, and undo.

**[Open Stormkeeper](https://stormkeeper-production.up.railway.app/)**

## What it tracks

| Counter | What to count |
| --- | --- |
| Floating mana | White, blue, black, red, green, and colorless mana, with a combined total. |
| Storm | Spells cast by all players this turn, including countered spells. Copies put onto the stack without being cast do not count. |
| Lands played | Only your land plays this turn. Fetches, ramp, and other effects that put lands onto the battlefield do not count. |

All counters are manual. Clear mana when your pool empties, taking your cards' effects into account.

## Controls

- Tap **+ / −** to adjust a counter, or tap its number to enter an amount directly.
- **Clear mana** empties the mana pool and keeps storm and lands played intact.
- **New turn** clears all counters and advances the turn number.
- **Undo** reverses up to 100 actions, including resets. **Cmd/Ctrl+Z** also works on desktop.
- Open **Help and settings** for instructions or **Start a new game**, which resets the counters and returns to turn one.

Counts support whole numbers from 0 to 999,999,999. Counters and undo history save in your browser and survive refreshes. Each browser/device keeps its own state.

## Use it on your phone

1. Open the [live app](https://stormkeeper-production.up.railway.app/).
2. Add it to your home screen from your browser's menu. On iPhone, use **Share → Add to Home Screen**. Supported browsers also offer an **Install app** button in Help.
3. Check that Help reports **Ready to use offline** after the first online load.

The built app caches its interface, icons, and fonts for offline use. Offline access and saved counters depend on the browser retaining the site's storage. Updates activate after all open app windows/tabs close; reopen the app to use the new release.

## Development

Built with **TypeScript, Vite, and plain CSS**. Requires **Node.js 24 or newer** and npm.

```sh
git clone git@github.com:dailyprice/mtg-stormkeeper.git
cd mtg-stormkeeper
npm ci
npm run dev
```

Vite prints the local and network addresses. Your phone can use the network address while on the same Wi-Fi. HTTPS or localhost is required for installation and offline support; counters and local saving also work over a local HTTP connection. The development server does not register a service worker.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with access from your local network. |
| `npm test` | Run the state, validation, and undo tests. |
| `npm run build` | Check TypeScript and build the app and offline cache into `dist/`. |
| `npm run test:e2e` | Run browser tests against the production build. |
| `npm run preview` | Serve the production build locally. |

For a release check:

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests require Google Chrome to be installed and automatically start a preview server. They cover phone and desktop controls, reload recovery, reset/undo behavior, input validation, large counts, unavailable storage, touch targets, and offline reloads.

## Deployment

Serve `dist/` at the root of an HTTPS static host. The manifest and service worker currently assume root hosting. Serve HTML and `sw.js` with `Cache-Control: no-cache`; hashed `/assets/` files can be cached immutably.

The included Dockerfile builds with Node and serves the static files with Caddy on `PORT` (8080 by default). `railway.json` configures the Docker build and health check. Game state stays on each user's device.

The live app runs in Railway's **Paraply Ventures** workspace, project **mtg-storm-tracker**, service **stormkeeper**, environment **production**. Releases are uploaded using the Railway CLI. With access to that project, deploy a tested revision using:

```sh
railway up \
  --project 75addc90-abb5-4ffe-98a8-8284f80b8d7f \
  --environment 017164e1-451b-4e49-9833-d322f79205b5 \
  --service 0c0fd3e6-3930-40bc-8fd4-85ba0d68a23a \
  --detach \
  -m "Describe the change"
```

## Project structure

| Path | Purpose |
| --- | --- |
| `src/state.ts` | Pure state transitions, validation, persistence format, and undo history. |
| `src/main.ts` | Controls, local storage, dialogs, and PWA registration. |
| `src/style.css` | Responsive layout and locally bundled fonts. |
| `scripts/build-sw.mjs` | Generates the versioned offline cache during builds. |
| `public/` | Manifest, home-screen icons, and font license notices. |
| `tests/` | Browser tests. |

Home-screen PNG icons are checked in. To regenerate them, run `python3 scripts/generate-icons.py` with Pillow installed.

## Credits

Uses DM Sans and Manrope, distributed with their [font license notices](public/licenses/). Stormkeeper is an independent companion for Magic: The Gathering and is not affiliated with Wizards of the Coast.

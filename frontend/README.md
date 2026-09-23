# SyndiQA — Frontend

Angular 21 · PrimeNG 21 · Tailwind CSS 4 · standalone components.

See the [root README](../README.md) for full setup. Quick reference below.

## Run

```bash
npm install
npm start          # http://localhost:4200
```

The app calls the backend at `http://localhost:8089` (see
`src/environments/environment.ts`). Start the backend first.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | dev server on :4200 |
| `npm run build` | production build → `dist/syndiqa-ng/browser/` |
| `npm test` | unit tests (Karma/Jasmine) |
| `npm run format` | Prettier |

## Layout

```
src/
├── app/
│   ├── core/        # auth (service, guard, interceptor), interceptors, pipes, utils
│   ├── layout/      # shell: topbar, sidebar, menu
│   ├── features/    # standalone feature areas (financial, …)
│   ├── pages/       # screens grouped by domain (backoffice, frontoffice, auth, …)
│   ├── services/    # cross-cutting services
│   └── models/
├── environments/    # environment.ts (dev) / environment.prod.ts
├── app.config.ts    # providers (router, http, PrimeNG theme)
├── app.routes.ts    # top-level routes
└── index.html
```

## Assets

`src/assets/` holds styles (`styles.scss`, `tailwind.css`), the SyndiQA logo and
the offline model data. `public/` is copied verbatim to the site root.
`scripts/train-model.js` regenerates `public/model-weights.json` from
`src/assets/property-prices.csv` (`node scripts/train-model.js`).

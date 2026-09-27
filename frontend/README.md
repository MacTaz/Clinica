# Clinica frontend

React 19.3 (plain JS) + Vite 8. No React Router — screens are switched with
plain React state in `App.jsx`, per the tech stack decision. No axios —
`src/api/client.js` wraps the built-in `fetch`.

See `../docs/API_CONTRACT.md` before writing or changing any `src/api/*.js`
call.

## Folder layout

```
src/
├── api/           one file per backend domain, thin wrappers around fetch
├── components/     shared, reusable UI (NavBar, buttons, loading/error states)
├── screens/        one folder per domain — this is where each screen lives
│   ├── dashboard/
│   ├── patients/
│   ├── doctors/
│   ├── appointments/
│   └── payments/
├── styles/         global CSS
├── utils/          shared helpers
├── App.jsx          top-level screen switcher (no router)
└── main.jsx
```

## Run

```bash
npm install
npm run dev
```

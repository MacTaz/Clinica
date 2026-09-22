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
│   ├── patients/
│   ├── doctors/
│   ├── appointments/
│   └── payments/
├── styles/         global CSS
├── App.jsx          top-level screen switcher (no router)
└── main.jsx
```

`src/api/specializations.js` and `src/screens/patients/PatientDirectory.jsx`
are fully wired up end to end — use them as the pattern to copy. Every
other screen is a working stub: it renders, and it's already wired to the
matching `src/api/*.js` call (which is already wired to a real backend
stub endpoint), but the form/list markup itself is `// TODO`.

## Run

```bash
npm install
npm run dev
```

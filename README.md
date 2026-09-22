# Clinica

A lightweight clinic management system: patient/doctor records, appointment
booking by specialization, and simple payment recording.

## Project layout

```
clinica/
├── docs/                  # Source of Truth
│   ├── API_CONTRACT.md    # Every endpoint, request/response shape
│   └── DATA_MODEL.md      # Table/column names, types, constraints
├── backend/                # Java 21, Spring Boot 4.1.x, Maven
└── frontend/                # React 19.3, Vite 8, plain JS
```


## Running the backend

```bash
cd backend
cp .env.example .env          # fill in your local MySQL credentials
docker compose -f ../docker-compose.yml up -d   # or run MySQL yourself
./mvnw spring-boot:run
```

Backend runs on **http://localhost:8080**. `schema.sql` creates all tables
on startup; `data.sql` seeds the fixed list of specializations.

## Running the frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** (Vite default).

## Who owns what (by folder, not by name)

- `backend/.../patient/`, `backend/.../doctor/`, `backend/.../specialization/`
  — patient & doctor database system
- `backend/.../appointment/` — appointment system
- `backend/.../payment/` — payment system
- `frontend/src/screens/patients/`, `frontend/src/screens/doctors/`
  — patient/doctor screens + Figma-driven UI
- `frontend/src/screens/appointments/` — appointment booking flow
- `frontend/src/screens/payments/` — payment recording screen

Shared frontend pieces (`src/api/client.js`, `src/components/`,
`src/styles/`) are common ground — coordinate before changing them.

## Rules

1. Never change a URL path, field name, or status code without updating
   `docs/API_CONTRACT.md` in the same change.
2. Backend: every new endpoint gets added to the contract *and* gets a
   stub controller method before the real logic is written, so frontend
   is never blocked.
3. Frontend: always call the backend through `src/api/*.js`, never with a
   raw `fetch()` inside a screen component. That keeps the base URL,
   error handling, and JSON shape in one place.
4. Keep enum-like values (specialization names, payment methods, payment
   statuses) exactly as spelled in `DATA_MODEL.md` on both sides.

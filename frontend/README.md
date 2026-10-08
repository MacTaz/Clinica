# Clinica Frontend

The modern user interface for the Clinica Medical Office Management System, built with **React 19**, **Vite 8**, and **Vanilla CSS**.

---

## 🛠️ Tech Stack & Requirements

- **Node.js**: Version 18.x or 20.x+
- **Package Manager**: npm (bundled with Node.js)
- **Framework & Tooling**: React 19.3, Vite 8.3
- **Dependencies**:
  - `qrcode.react`: Generates demo QR codes for simulated GCash transactions.
  - `react-day-picker`: Calendar and date picker component for scheduling appointments.

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to create `.env`:
   - **Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
   - **Windows (PowerShell / Command Prompt)**:
     ```powershell
     copy .env.example .env
     ```

2. Environment Variables Overview:

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL pointing to the Spring Boot REST API |

---

## 🚀 Development & Scripts

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be available at **`http://localhost:5173`**.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── api/                 # Domain-based API client modules wrapping fetch
│   │   ├── appointments.js  # Availability & appointment scheduling endpoints
│   │   ├── client.js        # Generic HTTP client with error unwrapping
│   │   ├── doctors.js       # Doctor registration, updates & shifts
│   │   ├── patients.js      # Patient registration, updates & medical history
│   │   └── payments.js      # Payment records & PayMongo checkout session creation
│   ├── components/          # Reusable shared UI elements (NavBar, LoadingSpinner, ErrorBanner)
│   ├── screens/             # Screen views
│   │   ├── appointments/    # AppointmentList & booking modal
│   │   ├── dashboard/       # Dashboard metrics & live duty overview
│   │   ├── doctors/         # DoctorDirectory & weekly schedule builder
│   │   ├── patients/        # PatientDirectory, patient registration & edit
│   │   └── payments/        # PaymentsScreen (manual recording & online checkout)
│   ├── styles/              # Global styles and design system variables (index.css)
│   ├── utils/               # Helper utilities (doctor status calculator, formatting)
│   ├── App.jsx              # Main shell and screen switcher state
│   └── main.jsx             # React DOM root entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 📖 Architecture & Conventions

- **State-driven Navigation**: The application uses top-level React state inside `App.jsx` to switch between views cleanly without requiring heavy router packages.
- **Unified API Client**: All backend communication flows through `src/api/*.js` modules using `client.js`. Direct `fetch()` calls inside UI components are avoided to keep error handling and base URLs centralized.
- **Design System Tokens**: Colors, typography, spacing, and component styling are standardized in `src/styles/index.css`.

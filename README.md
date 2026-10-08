# 🏥 Clinica — Medical Office Management System

Clinica is a modern, full-stack clinic management system designed for medical practices. It provides complete workflows for patient and doctor record management, real-time doctor availability checking, appointment booking, payment recording, and online billing via PayMongo.

---

## 🏗️ Project Architecture & Layout

```text
ClinicSystem/
├── docs/                      # Single Source of Truth Documentation
│   ├── API_CONTRACT.md        # REST endpoints, request/response DTO schemas & error codes
│   ├── DATA_MODEL.md          # Database schema, table structures, constraints & migrations
│   ├── GENERAL_CONTEXT.md     # High-level architecture reference
│   └── SITEMAP.md             # Frontend screen hierarchy & user navigation flows
├── backend/                   # Java 21 & Spring Boot 4.1.x REST API
│   ├── .env.example           # Sample environment variables for backend
│   ├── mvnw / mvnw.cmd        # Cross-platform Maven wrapper
│   ├── pom.xml                # Backend dependencies and build configuration
│   └── src/main/              # Java application source and resources (schema.sql, application.properties)
├── frontend/                  # React 19.3 & Vite 8 UI Application
│   ├── .env.example           # Sample environment variables for frontend
│   ├── package.json           # Frontend dependencies & npm scripts
│   ├── vite.config.js         # Vite configuration
│   └── src/                   # React components, screens, styling, and API clients
├── docker-compose.yml         # MySQL 8.4 database service configuration
└── README.md                  # Main project setup and developer guide
```

---

## 📋 Prerequisites & System Requirements

Before running the project, make sure you have the following installed:

1. **Java Development Kit (JDK) 21**:
   - Verify installation: `java -version`
2. **Node.js (v18.x, v20.x, or newer)** and **npm**:
   - Verify installation: `node -v` and `npm -v`
3. **Database (MySQL 8.4)**:
   - **Recommended**: [Docker Desktop](https://www.docker.com/) to run MySQL using Docker Compose.
   - **Alternative**: A local MySQL 8.4 installation running on port `3306`.

---

## ⚡ Quick Start Guide

Follow these steps to get the full application up and running on your machine:

### Step 1: Start the MySQL Database

From the root directory of the project, run:

```bash
docker compose up -d
```

This starts a MySQL 8.4 container pre-configured with:
- **Database**: `clinica`
- **Username**: `clinica`
- **Password**: `clinica`
- **Port**: `3306`

> **Note**: Database tables and constraints are initialized automatically by Spring Boot upon application startup via `backend/src/main/resources/schema.sql`. No manual SQL import is required.

---

### Step 2: Configure and Start the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create your `.env` file from `.env.example`:
   - **Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
   - **Windows (PowerShell / Command Prompt)**:
     ```powershell
     copy .env.example .env
     ```

3. Start the Spring Boot backend server:
   - **Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```
   - **Windows**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```

The backend server will start at **`http://localhost:8080`** (REST API base at **`http://localhost:8080/api`**).

---

### Step 3: Configure and Start the Frontend

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Create your `.env` file from `.env.example`:
   - **Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
   - **Windows (PowerShell / Command Prompt)**:
     ```powershell
     copy .env.example .env
     ```

3. Install dependencies and start the Vite development server:
   ```bash
   npm install
   npm run dev
   ```

4. Open your browser and navigate to **`http://localhost:5173`**.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/clinica` | JDBC connection URL for MySQL |
| `DB_USERNAME` | `clinica` | MySQL user |
| `DB_PASSWORD` | `clinica` | MySQL password |
| `SERVER_PORT` | `8080` | Spring Boot HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Allowed frontend origins for CORS |
| `PAYMONGO_SECRET_KEY` | *(empty)* | PayMongo Sandbox API secret key (`sk_test_...`) |
| `PAYMONGO_WEBHOOK_SECRET` | *(empty)* | PayMongo webhook signature secret (`whsk_...`) |
| `PAYMONGO_SUCCESS_URL` | `http://localhost:5173/payments?status=success` | Redirect on completed checkout |
| `PAYMONGO_CANCEL_URL` | `http://localhost:5173/payments?status=cancelled` | Redirect on cancelled checkout |

### Frontend (`frontend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL of the backend REST API |

---

## 🌟 Core System Modules & Features

### 1. 📊 Dashboard
- Live operational dashboard with summary metric cards (Patient Visits, Confirmed Appointments, Cancelled Visits).
- Today's appointment schedule table.
- Real-time doctor duty and availability tracker.

### 2. 👥 Patient Management
- Patient registry with search and filter capabilities.
- Create and edit patient details (name, age, contact, ailment, insurance provider).
- Chronological patient medical history logging.
- Safe cascade deletion (removes associated history and appointment records).

### 3. 🩺 Doctor Management & Shift Scheduling
- Doctor registry with weekly multi-day duty shift schedule builder.
- Configurable time blocks (start time, end time, day of week).
- Live on-duty status indicators based on local day and clock time.

### 4. 📅 Appointment Scheduling
- Dynamic slot availability engine (`GET /api/appointments/availability?date=...`).
- 30-minute interval slot booking with automatic double-booking prevention.
- Appointment lifecycle statuses: `SCHEDULED` ➔ `COMPLETED` (or `CANCELLED`).

### 5. 💳 Payment Processing
- **Supported Manual Payment Modes**:
  - `CASH`: Records the receiving staff member's name.
  - `CARD`: Records card last 4 digits, POS authorization code, and optional 3/6/12-month installment plans for transactions ≥ ₱10,000.
  - `GCASH`: Records 13-digit transaction reference number and displays sample QR code.
  - `INSURANCE`: Records insurance LOA or approval authorization code.
- **PayMongo Sandbox Online Checkout**:
  - Staff can launch hosted checkout sessions (`POST /api/appointments/{id}/paymongo-checkout`).
  - Asynchronous webhook receiver (`POST /api/webhooks/paymongo`) automatically marks payment and appointment as paid with gateway reference tracking.
- Collapsible payment audit history with detailed receipt breakdowns.

---

## 📦 How to Create a Clean Zip for Sharing

When sharing this project as a `.zip` archive, make sure to exclude build artifacts and dependencies to keep the file size lightweight (< 1MB instead of > 200MB):

### Files and folders to exclude from your zip:
- `backend/target/`
- `frontend/node_modules/`
- `frontend/dist/`
- `.env` files with private credentials (recipient can copy from `.env.example`)
- `.git/` (if sharing a source zip)
- `.idea/` or `.vscode/`

### Creating a clean zip via terminal:

- **Linux / macOS**:
  ```bash
  zip -r clinica-system.zip . -x "*/node_modules/*" "*/target/*" "*/dist/*" "*/.git/*" "*.env"
  ```
- **Windows (PowerShell)**:
  ```powershell
  # Clean build artifacts first:
  cd backend; .\mvnw.cmd clean; cd ..
  # Compress project folder without node_modules:
  Compress-Archive -Path * -DestinationPath ClinicaSystem.zip -CompressionLevel Optimal
  ```

---

## 🛠️ Verification & Building for Production

### Verify Backend Compilation
```bash
cd backend
./mvnw clean test-compile   # Windows: .\mvnw.cmd clean test-compile
```

### Verify Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## ❓ Troubleshooting & FAQs

1. **Port 3306 is already in use**:
   - If you have an existing local MySQL service running, either stop it (`net stop MySQL80` on Windows) or adjust `docker-compose.yml` and `DB_URL` in `backend/.env` to use another port (e.g., `3307:3306`).

2. **Backend cannot connect to MySQL**:
   - Verify the database container is running: `docker compose ps`
   - Ensure the credentials in `backend/.env` match `docker-compose.yml` (`clinica` / `clinica`).

3. **CORS errors in browser console**:
   - Ensure `CORS_ALLOWED_ORIGINS` in `backend/.env` contains `http://localhost:5173`.

---

## 📚 Complete Documentation Links

- **[API Contract](docs/API_CONTRACT.md)**: Full REST API specification with request/response schemas.
- **[Data Model](docs/DATA_MODEL.md)**: Database tables, fields, constraints, and relationships.
- **[Architecture & Context](docs/GENERAL_CONTEXT.md)**: System design and development guide.
- **[UI Sitemap](docs/SITEMAP.md)**: Screen hierarchy and user action workflows.

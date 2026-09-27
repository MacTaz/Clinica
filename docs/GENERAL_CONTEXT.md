# Clinica System - General Context & Architecture Reference

This document serves as the high-level technical reference and system context for the Clinica Medical Office Management System. Use this document when starting new conversations or resuming work on the project.

---

## 1. System Overview & Tech Stack

- **Application Name**: Clinica Medika Office Management System
- **Purpose**: Comprehensive clinical management system for appointment scheduling, patient tracking, doctor scheduling, and payment processing.
- **Backend**:
  - Java 21
  - Spring Boot (Spring Data JPA, Spring Web, Hibernate, Validation)
  - Database: MySQL 8.4 (via Docker / local MySQL at port `3306`)
  - Base URL: `http://localhost:8080/api`
- **Frontend**:
  - React 19 + Vite
  - Plain JavaScript (JSX)
  - Styling: Vanilla CSS with design system tokens in `src/styles/index.css`
  - `qrcode.react`: renders the demo-only sample GCash QR on the Payments screen
  - Base URL: `http://localhost:5173`
- **Documentation Sources of Truth**:
  - [`API_CONTRACT.md`](file:///c:/Users/micot/Desktop/Projects/ClinicSystem/docs/API_CONTRACT.md) — Exact endpoints, request/response DTO schemas, and HTTP error codes.
  - [`DATA_MODEL.md`](file:///c:/Users/micot/Desktop/Projects/ClinicSystem/docs/DATA_MODEL.md) — Database table definitions, constraints, and relationships.
  - [`SITEMAP.md`](file:///c:/Users/micot/Desktop/Projects/ClinicSystem/docs/SITEMAP.md) — UI sitemap, screen hierarchies, and component routing.

---

## 2. Directory Structure

```text
ClinicSystem/
├── docs/
│   ├── API_CONTRACT.md          # Single source of truth for REST endpoints
│   ├── DATA_MODEL.md            # Schema, columns, FKs, and constraints
│   ├── GENERAL_CONTEXT.md       # High-level architecture and system summary
│   └── SITEMAP.md               # Frontend navigation tree and view actions
├── backend/
│   ├── src/main/java/com/clinica/
│   │   ├── config/              # WebConfig / CORS settings
│   │   ├── controller/          # REST controllers (appointment, doctor, patient, payment)
│   │   ├── dto/                 # Request and response records
│   │   ├── exception/           # Custom domain exceptions and GlobalExceptionHandler
│   │   ├── model/               # JPA entities (Person, Patient, Doctor, DoctorSchedule, Appointment, Payment)
│   │   ├── repository/          # Spring Data JPA repositories
│   │   └── service/             # Business logic and transaction handling
│   └── src/main/resources/
│       ├── application.properties
│       ├── schema.sql           # DDL initializing tables
│       └── data.sql             # Data initialization
├── frontend/
│   ├── src/
│   │   ├── api/                 # Thin fetch API client modules (appointments.js, doctors.js, patients.js, payments.js)
│   │   ├── components/          # Reusable UI components (NavBar.jsx, LoadingSpinner.jsx, ErrorBanner.jsx)
│   │   ├── screens/             # Screen modules (dashboard, appointments, patients, doctors, payments)
│   │   ├── styles/              # Global CSS (index.css)
│   │   ├── utils/               # Utilities (doctorStatus.js)
│   │   ├── App.jsx              # Main shell and screen switching state
│   │   └── main.jsx
│   └── index.html
└── docker-compose.yml           # MySQL 8.4 container configuration
```

---

## 3. Data Models & Relationships

1. **Doctors** (`doctors` and `doctor_schedules` tables):
   - Extends `Person` (`name`, `age`, `contact`).
   - Doctor fields: `id`, `salary`.
   - `doctor_schedules`: Multi-row collection (`id`, `doctor_id` FK, `day_of_week` `MONDAY`..`SUNDAY`, `start_time`, `end_time`) allowing doctors to work across multiple days and time intervals throughout the week.

2. **Patients** (`patients` and `patient_medical_history` tables):
   - Extends `Person` (`name`, `age`, `contact`).
   - Patient fields: `id`, `ailment`, `insurance_provider`.
   - `patient_medical_history`: `patient_id` (FK), `entry_order`, `entry` (text history).

3. **Appointments** (`appointments` table):
   - Fields: `id`, `patient_id` (FK), `doctor_id` (FK), `appointment_date`, `start_time` (30-minute intervals), `status` (`SCHEDULED`, `COMPLETED`, `PAID`), `payment_method`, `ailment`.
   - Constraints: Unique per `(doctor_id, appointment_date, start_time)` and `(patient_id, appointment_date, start_time)`.

4. **Payments** (`payments` table):
   - Fields: `id`, `appointment_id` (FK, unique), `amount`, `method` (`CASH`, `CARD`, `GCASH`, `INSURANCE`), `status` (`UNPAID`, `PAID`), `paid_at`.
   - Method details: `received_by` (CASH), `card_last4` + `approval_code` (CARD; never the full card number), `gcash_reference` (GCASH), `approval_code` (INSURANCE LOA reference).
   - `installment_months` (3, 6, 12): card installments for CARD payments of at least 10,000.00. The bank pays the clinic in full, so it is still one PAID payment per appointment.

---

## 4. API Endpoints Overview

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Patients** | `POST` | `/api/patients` | Register a new patient |
| | `GET` | `/api/patients` | Retrieve all patients with medical history |
| | `POST` | `/api/patients/{id}/history` | Append a medical history entry |
| | `DELETE` | `/api/patients/{id}` | Delete patient (cascades history & appointments) |
| **Doctors** | `POST` | `/api/doctors` | Register a doctor with weekly schedules |
| | `GET` | `/api/doctors` | Retrieve all doctors and their schedule blocks |
| | `PUT` | `/api/doctors/{id}` | Update doctor profile or schedules |
| | `DELETE` | `/api/doctors/{id}` | Delete doctor (409 if active appointments exist) |
| **Appointments** | `GET` | `/api/appointments/availability?date={date}` | Get doctors with open 30-min slots for a given date |
| | `POST` | `/api/appointments` | Book appointment (`patientId`, `doctorId`, `appointmentDate`, `startTime`, `[ailment]`, `[paymentMethod]`) |
| | `GET` | `/api/appointments` | List all booked appointments |
| | `PATCH` | `/api/appointments/{id}/complete` | Mark appointment as COMPLETED |
| | `DELETE` | `/api/appointments/{id}` | Cancel/delete an appointment |
| **Payments** | `POST` | `/api/appointments/{id}/payment` | Record payment (`amount`, `method`, details) |
| | `GET` | `/api/payments` | List all payment transactions |

---

## 5. Development Startup Guide

### Start Database
```powershell
docker compose up -d
```

### Start Backend API
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Start Frontend UI
```powershell
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

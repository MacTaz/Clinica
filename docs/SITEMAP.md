# Clinica UI Sitemap & Navigation Architecture

This document defines the sitemap, screen hierarchy, and user action workflows for the Clinica Medical Office Management System.

---

## 1. Sitemap Hierarchy

```text
Clinica Management System
├── Dashboard (Default Landing View)
│   ├── Scheduled Appointments Table
│   │   └── Columns: Patient Name, Age, Ailment, Doctor, Date & Time, Payment, Status
│   ├── Today's Metrics Grid
│   │   ├── Patient Visits (total active visits)
│   │   ├── Successful Appointments (confirmed appointments)
│   │   └── Canceled Appointments
│   └── Doctor Schedule Status Table
│       └── Columns: Name, Phone Number, Scheduled Appointments, Current Status
│
├── Appointments
│   ├── Appointments Schedule View
│   │   ├── Search bar for appointments (by patient, doctor, date, ailment)
│   │   ├── List of scheduled appointments
│   │   ├── Columns: ID, Patient, Ailment / Reason, Doctor, Date & Time, Payment, Status, Actions
│   │   └── Action: Cancel Appointment / Complete Appointment
│   └── "+ Add Appointment" Modal Flow
│       ├── 1. Search & Select Patient (live search filter by name or contact)
│       ├── 2. Enter Ailment / Reason for Visit (captured for this appointment & added to patient history)
│       ├── 3. Select Date Picker & View Doctor Duty Info
│       ├── 4. Select Available Doctor & 30-minute free slot chip
│       └── 5. Confirm & Book Slot (`POST /api/appointments`)
│
├── Patients
│   ├── Patients Directory View
│   │   ├── Search bar for patients (by name, contact, ailment)
│   │   ├── Directory table (Name, Age, Contact, Current / Last Ailment, Insurance, Actions)
│   │   └── Action: Edit Patient, Delete Patient (`DELETE /api/patients/{id}`)
│   └── "+ Register Patient" Modal Flow
│       ├── Fields: Full Name, Age (0–150), Contact Number, Insurance Provider
│       └── Submit action (`POST /api/patients`)
│
├── Doctors
│   ├── Doctors Directory View
│   │   ├── Doctors List (Name, Age, Contact, Duty Shifts Summary, Actions: Edit/Delete)
│   │   └── Doctor Schedules & Availability Table (Name, Day of Week, Duty Hours, Availability Status, Actions: Adjust Schedule)
│   └── "+ Register Doctor" Modal Flow
│       ├── Left Column: Doctor Profile (First Name, Last Name, Age, Contact)
│       ├── Right Column: Weekly Duty Schedule Builder (Day of Week, Start Time, End Time)
│       └── Submit action (`POST /api/doctors`)
│
└── Payments
    ├── Record Payment Action (Manual)
    │   ├── Select Appointment (only completed appointments without payment)
    │   ├── Amount & Payment Method (`CASH`, `CARD`, `GCASH`, `INSURANCE`)
    │   ├── Method fields: CASH → Received by; CARD → Card last 4 digits + Approval code;
    │   │   GCASH → sample QR (demo only) + GCash reference number; INSURANCE → LOA Approval Code
    │   ├── Payment term (CARD with amount ≥ 10,000 only): Straight, 3, 6 or 12 months
    │   └── Submit action (`POST /api/appointments/{id}/payment`)
    ├── Online Payment (PayMongo Sandbox Checkout)
    │   ├── Select Appointment
    │   ├── Click "Open Test Checkout" (`POST /api/appointments/{id}/paymongo-checkout`)
    │   └── Opens hosted checkout URL in new tab for sandbox card/e-wallet testing
    └── Payments History (collapsible, collapsed by default, header shows the count)
        └── Columns: Appointment ID, Amount, Method, Details (includes gateway status/reference), Status, Paid At
```

---

## 2. Screen Specifications & Component Mapping

| Sitemap Item | Component Path | Main Backend APIs Used | Description |
|---|---|---|---|
| **Dashboard** | `src/screens/dashboard/DashboardScreen.jsx` | `GET /api/appointments`<br>`GET /api/patients`<br>`GET /api/doctors` | Live operational overview of scheduled visits, daily metrics, and doctor duty hours. |
| **Appointments** | `src/screens/appointments/AppointmentList.jsx` | `GET /api/appointments`<br>`GET /api/appointments/availability`<br>`POST /api/appointments`<br>`PATCH /api/appointments/{id}/complete`<br>`DELETE /api/appointments/{id}` | Schedule manager with live slot availability checker and booking modal. |
| **Patients** | `src/screens/patients/PatientDirectory.jsx` | `GET /api/patients`<br>`POST /api/patients`<br>`PUT /api/patients/{id}`<br>`DELETE /api/patients/{id}` | Patient records directory with modal for new patient registrations and editing existing patients. |
| **Doctors** | `src/screens/doctors/DoctorDirectory.jsx` | `GET /api/doctors`<br>`POST /api/doctors`<br>`PUT /api/doctors/{id}`<br>`DELETE /api/doctors/{id}` | Clinical staff directory with schedule viewer and doctor registration / editing modal. |
| **Payments** | `src/screens/payments/PaymentsScreen.jsx` | `GET /api/payments`<br>`GET /api/appointments`<br>`POST /api/appointments/{id}/payment`<br>`POST /api/appointments/{id}/paymongo-checkout` | Billing, payment recording, and PayMongo online checkout. |


---

## 3. UI Shell Layout

- **Left Sidebar** (`src/components/NavBar.jsx`):
  - Brand header: **Clinica**
  - Navigation links with SVG icons: `Dashboard`, `Appointments`, `Patients`, `Doctors`, `Payments`
  - Active tab indicated by white pill button styling with dark text
  - Footer profile card: **Clinica Staff / Clinica Management**
- **Main View Area** (`src/App.jsx`):
  - Top header: **Clinica Medika Office - Management System**
  - Subtitle: *Management system for scheduling, appointing, listing patients and doctors, and creating payments.*
  - Active screen rendering area.

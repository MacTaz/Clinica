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
│   │   └── Action: Cancel Appointment
│   └── "+ Add Appointment" Modal Flow
│       ├── 1. Search & Select Patient (live search filter by name or contact)
│       ├── 2. Enter Ailment / Reason for Visit (captured for this appointment & added to patient history)
│       ├── 3. Select Specialization & Date Picker
│       ├── 4. Fetch Doctor Availability (live 30-minute free slots)
│       └── 5. Confirm & Book Slot (`POST /api/appointments`)
│
├── Patients
│   ├── Patients Directory View
│   │   ├── Search bar for patients (by name, contact, ailment)
│   │   ├── Directory table (Name, Age, Contact, Current / Last Ailment, Actions)
│   │   └── Action: Delete Patient (`DELETE /api/patients/{id}`)
│   └── "+ Register Patient" Modal Flow
│       ├── Fields: Full Name, Age (0–150), Contact Number
│       └── Submit action (`POST /api/patients`)
│
├── Doctors
│   ├── Doctors Directory View
│   │   ├── Directory table (Name, Specialization, Age, Contact, Salary, Schedule Pills, Actions)
│   │   └── Action: Delete Doctor (`DELETE /api/doctors/{id}`)
│   └── "+ Register Doctor" Modal Flow
│       ├── Fields: Full Name, Age, Contact, Specialization, Monthly Salary
│       ├── Dynamic Weekly Schedule Builder: Add/Remove multiple schedule blocks (Day of Week `MONDAY`..`SUNDAY`, Start Time, End Time)
│       └── Submit action (`POST /api/doctors`)
│
└── Payments
    ├── Record Payment Action
    │   ├── Select Appointment
    │   ├── Amount & Payment Method (`CASH`, `CARD`, `GCASH`)
    │   └── Submit action (`POST /api/appointments/{id}/payment`)
    └── Payments History Table
        └── Columns: ID, Appointment ID, Amount, Method, Status, Paid At
```

---

## 2. Screen Specifications & Component Mapping

| Sitemap Item | Component Path | Main Backend APIs Used | Description |
|---|---|---|---|
| **Dashboard** | `src/screens/dashboard/DashboardScreen.jsx` | `GET /api/appointments`<br>`GET /api/patients`<br>`GET /api/doctors` | Live operational overview of scheduled visits, daily metrics, and doctor duty hours. |
| **Appointments** | `src/screens/appointments/AppointmentList.jsx` | `GET /api/appointments`<br>`GET /api/appointments/availability`<br>`POST /api/appointments`<br>`DELETE /api/appointments/{id}` | Schedule manager with live slot availability checker and booking modal. |
| **Patients** | `src/screens/patients/PatientDirectory.jsx` | `GET /api/patients`<br>`POST /api/patients`<br>`DELETE /api/patients/{id}` | Patient records directory with modal for new patient registrations. |
| **Doctors** | `src/screens/doctors/DoctorDirectory.jsx` | `GET /api/doctors`<br>`GET /api/specializations`<br>`POST /api/doctors`<br>`DELETE /api/doctors/{id}` | Clinical staff directory with schedule viewer and doctor registration modal. |
| **Payments** | `src/screens/payments/PaymentsScreen.jsx` | `GET /api/payments`<br>`POST /api/appointments/{id}/payment` | Billing and receipt management. |

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

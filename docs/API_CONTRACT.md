# API Contract

Base URL (local dev): `http://localhost:8080/api`

This is the single source of truth for every endpoint. If backend and
frontend disagree with each other, this file is right and the code is
wrong — fix the code, not this file (unless the group agrees to change the
contract, in which case update this file first).

All request/response bodies are JSON. Dates are `YYYY-MM-DD`, times are
`HH:mm` (24-hour), datetimes are ISO-8601 (`YYYY-MM-DDTHH:mm:ss`).

## Patients

| Method | Endpoint | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/patients` | `{name, age, contact, [ailment]}` | 201 + Patient | ailment is optional on initial registration |
| GET | `/patients` | — | 200 + Patient[] | |
| POST | `/patients/{id}/history` | `{entry}` | 201 + Patient | appends an entry |
| DELETE | `/patients/{id}` | — | 204 | cascades history + appointments |

**Patient** shape:
```json
{ "id": 1, "name": "Jane Cruz", "age": 34, "contact": "0917...",
  "ailment": "Recurring migraines",
  "medicalHistory": ["First visit: migraines started 2 weeks ago"] }
```

## Specializations

| Method | Endpoint | Body | Success | Notes |
|---|---|---|---|---|
| GET | `/specializations` | — | 200 + Specialization[] | fixed list, seeded in `data.sql` |

**Specialization** shape: `{ "id": 1, "name": "Dermatology" }`

## Doctors

| Method | Endpoint | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/doctors` | `{name, age, contact, specializationId, salary, schedules}` | 201 + Doctor | |
| GET | `/doctors` | — | 200 + Doctor[] | |
| DELETE | `/doctors/{id}` | — | 204 | 409 if the doctor still has appointments |

**Doctor** shape:
```json
{ "id": 1, "name": "Dr. Reyes", "age": 41, "contact": "0917...",
  "specialization": { "id": 1, "name": "Dermatology" }, "salary": 45000.00,
  "schedules": [ { "id": 1, "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "12:00" } ] }
```

## Appointments

| Method | Endpoint | Body | Success | Notes |
|---|---|---|---|---|
| GET | `/appointments/availability?specializationId={id}&date={yyyy-mm-dd}` | — | 200 + DoctorAvailability[] | |
| POST | `/appointments` | `{patientId, doctorId, appointmentDate, startTime, [ailment]}` | 201 + Appointment | 400 invalid, 409 slot taken; sets ailment & history |
| GET | `/appointments` | — | 200 + Appointment[] | |
| DELETE | `/appointments/{id}` | — | 204 | also deletes its payment, if any |

**DoctorAvailability** shape (response of the availability endpoint):
```json
{ "doctorId": 1, "doctorName": "Dr. Reyes", "freeSlots": ["09:00", "09:30", "10:00"] }
```

**Appointment** shape:
```json
{ "id": 1, "patient": { "id": 1, "name": "Jane Cruz" },
  "doctor": { "id": 1, "name": "Dr. Reyes" },
  "appointmentDate": "2026-10-02", "startTime": "09:00" }
```

## Payments

| Method | Endpoint | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/appointments/{id}/payment` | `{amount, method}` | 201 + Payment | one per appointment |
| GET | `/payments` | — | 200 + Payment[] | |

**Payment** shape:
```json
{ "id": 1, "appointmentId": 1, "amount": 800.00, "method": "CASH",
  "status": "PAID", "paidAt": "2026-10-02T10:15:00" }
```

`method` is one of `CASH`, `CARD`, `GCASH`. `status` is one of `UNPAID`, `PAID`.

## Errors

Every non-2xx response has this shape:
```json
{ "status": 400, "message": "age must not be negative" }
```

| HTTP status | Thrown by | Meaning |
|---|---|---|
| 400 | `InvalidRecordDataException` | validation failed |
| 404 | `ResourceNotFoundException` | id doesn't exist |
| 409 | `SlotUnavailableException` | double-booked slot |
| 409 | `ResourceInUseException` | delete blocked (e.g. doctor has appointments) |

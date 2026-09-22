# Data Model

Mirrors `schema.sql`. Keep field names identical here, in the entity
classes, and in the API contract — this is what keeps both sides in sync.

## specializations
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| name | VARCHAR(100) | required, unique |

## doctors
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| name | VARCHAR(100) | required |
| age | INT | 0–150 |
| contact | VARCHAR(30) | required |
| specialization_id | BIGINT | FK -> specializations(id) |
| salary | DECIMAL(10,2) | not negative |

## doctor_schedules
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| doctor_id | BIGINT | FK -> doctors(id) |
| day_of_week | VARCHAR(9) | MONDAY..SUNDAY |
| start_time | TIME | on the hour/half hour |
| end_time | TIME | later than start_time |

## patients
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| name | VARCHAR(100) | required |
| age | INT | 0–150 |
| contact | VARCHAR(30) | required |
| ailment | VARCHAR(255) | required |

## patient_medical_history
| Column | Type | Notes |
|---|---|---|
| patient_id | BIGINT | PK part 1, FK -> patients(id) |
| entry_order | INT | PK part 2 |
| entry | TEXT | required |

## appointments
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| patient_id | BIGINT | FK -> patients(id) |
| doctor_id | BIGINT | FK -> doctors(id) |
| appointment_date | DATE | required |
| start_time | TIME | 30-minute slots |

Unique per doctor+date+start_time, and per patient+date+start_time.

## payments
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| appointment_id | BIGINT | FK -> appointments(id), unique |
| amount | DECIMAL(10,2) | not negative |
| method | VARCHAR(20) | CASH, CARD, GCASH |
| status | VARCHAR(10) | UNPAID, PAID |
| paid_at | DATETIME | set once status = PAID |

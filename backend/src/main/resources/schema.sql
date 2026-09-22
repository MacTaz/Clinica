-- Mirrors docs/DATA_MODEL.md. Keep both in sync.

CREATE TABLE IF NOT EXISTS specializations (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS doctors (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    age                INT NOT NULL CHECK (age BETWEEN 0 AND 150),
    contact            VARCHAR(30) NOT NULL,
    specialization_id  BIGINT NOT NULL,
    salary             DECIMAL(10,2) NOT NULL CHECK (salary >= 0),
    FOREIGN KEY (specialization_id) REFERENCES specializations(id)
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id    BIGINT NOT NULL,
    day_of_week  VARCHAR(9) NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patients (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    age      INT NOT NULL CHECK (age BETWEEN 0 AND 150),
    contact  VARCHAR(30) NOT NULL,
    ailment  VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_medical_history (
    patient_id  BIGINT NOT NULL,
    entry_order INT NOT NULL,
    entry       TEXT NOT NULL,
    PRIMARY KEY (patient_id, entry_order),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id        BIGINT NOT NULL,
    doctor_id         BIGINT NOT NULL,
    appointment_date  DATE NOT NULL,
    start_time        TIME NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    UNIQUE (doctor_id, appointment_date, start_time),
    UNIQUE (patient_id, appointment_date, start_time)
);

CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT NOT NULL UNIQUE,
    amount          DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    method          VARCHAR(20) NOT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'UNPAID',
    paid_at         DATETIME NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

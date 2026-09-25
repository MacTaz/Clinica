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
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id   BIGINT NOT NULL UNIQUE,
    amount           DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    method           VARCHAR(20) NOT NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'UNPAID',
    paid_at          DATETIME NULL,
    received_by      VARCHAR(100) NULL,  -- CASH: staff who received the cash
    card_last4       CHAR(4) NULL,       -- CARD: last 4 digits only, never the full card number
    approval_code    VARCHAR(12) NULL,   -- CARD: approval code from the POS terminal receipt
    gcash_reference  CHAR(13) NULL,      -- GCASH: 13-digit GCash reference number
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT chk_payments_method CHECK (method IN ('CASH', 'CARD', 'GCASH')),
    CONSTRAINT chk_payments_status CHECK (status IN ('UNPAID', 'PAID')),
    CONSTRAINT chk_payments_paid_at CHECK ((status = 'PAID' AND paid_at IS NOT NULL) OR (status = 'UNPAID' AND paid_at IS NULL)),
    CONSTRAINT chk_payments_method_details CHECK (
        (method = 'CASH'
            AND received_by IS NOT NULL AND TRIM(received_by) <> ''
            AND card_last4 IS NULL AND approval_code IS NULL AND gcash_reference IS NULL)
     OR (method = 'CARD'
            AND card_last4 IS NOT NULL AND card_last4 REGEXP '^[0-9]{4}$'
            AND approval_code IS NOT NULL AND approval_code REGEXP '^[A-Za-z0-9]{1,12}$'
            AND received_by IS NULL AND gcash_reference IS NULL)
     OR (method = 'GCASH'
            AND gcash_reference IS NOT NULL AND gcash_reference REGEXP '^[0-9]{13}$'
            AND received_by IS NULL AND card_last4 IS NULL AND approval_code IS NULL)
    )
);

-- Upgrades for databases created before the columns/constraints above existed.
-- CREATE TABLE IF NOT EXISTS doesn't alter an existing table, and MySQL has no
-- ADD COLUMN / ADD CONSTRAINT IF NOT EXISTS, so each change checks
-- information_schema first and runs only when missing. Safe on every startup.
-- Keep each definition identical to the CREATE TABLE above.

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'received_by') = 0,
              'ALTER TABLE payments ADD COLUMN received_by VARCHAR(100) NULL AFTER paid_at',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'card_last4') = 0,
              'ALTER TABLE payments ADD COLUMN card_last4 CHAR(4) NULL AFTER received_by',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'approval_code') = 0,
              'ALTER TABLE payments ADD COLUMN approval_code VARCHAR(12) NULL AFTER card_last4',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'gcash_reference') = 0,
              'ALTER TABLE payments ADD COLUMN gcash_reference CHAR(13) NULL AFTER approval_code',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'chk_payments_method') = 0,
              'ALTER TABLE payments ADD CONSTRAINT chk_payments_method CHECK (method IN (''CASH'', ''CARD'', ''GCASH''))',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'chk_payments_status') = 0,
              'ALTER TABLE payments ADD CONSTRAINT chk_payments_status CHECK (status IN (''UNPAID'', ''PAID''))',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'chk_payments_paid_at') = 0,
              'ALTER TABLE payments ADD CONSTRAINT chk_payments_paid_at CHECK ((status = ''PAID'' AND paid_at IS NOT NULL) OR (status = ''UNPAID'' AND paid_at IS NULL))',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'chk_payments_method_details') = 0,
              'ALTER TABLE payments ADD CONSTRAINT chk_payments_method_details CHECK ((method = ''CASH'' AND received_by IS NOT NULL AND TRIM(received_by) <> '''' AND card_last4 IS NULL AND approval_code IS NULL AND gcash_reference IS NULL) OR (method = ''CARD'' AND card_last4 IS NOT NULL AND card_last4 REGEXP ''^[0-9]{4}$'' AND approval_code IS NOT NULL AND approval_code REGEXP ''^[A-Za-z0-9]{1,12}$'' AND received_by IS NULL AND gcash_reference IS NULL) OR (method = ''GCASH'' AND gcash_reference IS NOT NULL AND gcash_reference REGEXP ''^[0-9]{13}$'' AND received_by IS NULL AND card_last4 IS NULL AND approval_code IS NULL))',
              'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

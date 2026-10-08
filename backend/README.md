# Clinica Backend

The REST API backend for the Clinica Medical Office Management System, built with **Java 21**, **Spring Boot 4.1.x**, **Spring Data JPA**, and **MySQL 8.4**.

---

## 🛠️ Tech Stack & Requirements

- **Java**: JDK 21
- **Framework**: Spring Boot 4.1.0 (Spring Web, Spring Data JPA, Hibernate, Jakarta Validation)
- **Database**: MySQL 8.4
- **Build Tool**: Apache Maven (Wrapper included: `./mvnw` or `mvnw.cmd`)

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to create `.env` (or pass environment variables directly):
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
| `DB_URL` | `jdbc:mysql://localhost:3306/clinica` | JDBC connection URL to MySQL database |
| `DB_USERNAME` | `clinica` | MySQL database user |
| `DB_PASSWORD` | `clinica` | MySQL database password |
| `SERVER_PORT` | `8080` | Port for the Spring Boot server |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed frontend origins |
| `PAYMONGO_SECRET_KEY` | *(empty)* | PayMongo Sandbox Secret API key (`sk_test_...`) |
| `PAYMONGO_WEBHOOK_SECRET` | *(empty)* | PayMongo Webhook Secret signature (`whsk_...`) |
| `PAYMONGO_SUCCESS_URL` | `http://localhost:5173/payments?status=success` | Redirect URL on successful online checkout |
| `PAYMONGO_CANCEL_URL` | `http://localhost:5173/payments?status=cancelled` | Redirect URL on cancelled checkout |

---

## 🚀 Running the Application

### 1. Start MySQL
Ensure MySQL 8.4 is running. You can run the provided Docker Compose file from the repository root:
```bash
docker compose up -d
```

### 2. Start the Spring Boot Application
- **Linux / macOS**:
  ```bash
  ./mvnw spring-boot:run
  ```
- **Windows**:
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```

The server starts at **`http://localhost:8080`** with the REST API base URL at **`http://localhost:8080/api`**.

> **Note on Database Initialization**: `schema.sql` automatically executes on startup to create and update all tables, check constraints, and indexes idempotently. You do not need to manually import any SQL dump.

---

## 🧪 Testing and Building

- **Run Tests**:
  ```bash
  ./mvnw test          # On Windows: .\mvnw.cmd test
  ```

- **Build Executable JAR**:
  ```bash
  ./mvnw clean package # On Windows: .\mvnw.cmd clean package
  ```
  The packaged JAR will be located in `target/clinica-backend-0.1.0.jar`.

---

## 📂 Package Architecture

```
com.clinica
├── ClinicaApplication.java        # Application bootstrap entry point
├── client/paymongo/               # PayMongo REST client integration
├── config/                        # CORS (WebConfig) & PayMongo beans
├── controller/                    # Thin REST controllers
│   ├── appointment/               # AppointmentController
│   ├── doctor/                    # DoctorController
│   ├── patient/                   # PatientController
│   └── payment/                   # PaymentController, PayMongoCheckoutController
├── dto/                           # Immutable request/response records
├── exception/                     # Custom domain exceptions & GlobalExceptionHandler
├── model/                         # JPA entities & mapped superclasses
├── repository/                    # Spring Data JPA repositories
└── service/                       # Business logic, schedule slot engines & validations
```

---

## 📖 Related Documentation

- [API Contract (`../docs/API_CONTRACT.md`)](../docs/API_CONTRACT.md) — Endpoint specifications, request/response bodies, and HTTP status codes.
- [Data Model (`../docs/DATA_MODEL.md`)](../docs/DATA_MODEL.md) — Database schema, relationships, and check constraints.

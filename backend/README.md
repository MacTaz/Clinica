# Clinica backend

Spring Boot 4.1, Java 21, MySQL 8.4. See `../docs/API_CONTRACT.md` and
`../docs/DATA_MODEL.md` before adding or changing anything here.

## Package layout

```
com.clinica
├── ClinicaApplication.java
├── config/            CORS, shared beans
├── model/             JPA entities (one table per type; Person is @MappedSuperclass)
├── repository/         Spring Data JPA interfaces
├── dto/                request/response shapes that cross the REST boundary
├── service/            business rules — this is where validation, slot
│                        generation and double-booking checks live
├── controller/          REST endpoints (thin — delegate to service)
└── exception/           custom exceptions + GlobalExceptionHandler
```

Sub-packages under `model`, `repository`, `service`, `controller` are split
by domain (`patient`, `doctor`, `appointment`, `payment`).

## Run

```bash
./mvnw spring-boot:run
```

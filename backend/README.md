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
by domain (`patient`, `doctor`, `specialization`, `appointment`,
`payment`) so different people can work in parallel without touching the
same files.

## Status of the stubs

`SpecializationController` / `SpecializationService` /
`SpecializationRepository` are fully wired up end-to-end — use them as the
pattern to copy for the other domains. Everything else under
`appointment/` and `payment/` compiles and returns realistic mock data so
the frontend isn't blocked, but the real logic is still `// TODO`.

## Run

```bash
./mvnw spring-boot:run
```

package com.clinica.dto.appointment;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime startTime) {
}

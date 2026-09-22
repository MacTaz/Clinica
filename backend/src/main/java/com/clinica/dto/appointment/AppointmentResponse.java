package com.clinica.dto.appointment;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id, PersonRef patient, PersonRef doctor,
        LocalDate appointmentDate, LocalTime startTime) {

    public record PersonRef(Long id, String name) {
    }
}

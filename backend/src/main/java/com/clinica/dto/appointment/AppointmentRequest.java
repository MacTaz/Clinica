package com.clinica.dto.appointment;

import com.clinica.model.payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime startTime,
        String ailment,
        @NotNull(message = "Payment method is required") PaymentMethod paymentMethod) {
}


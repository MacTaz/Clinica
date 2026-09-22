package com.clinica.dto.patient;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PatientRequest(
        @NotBlank String name,
        @Min(0) int age,
        @NotBlank String contact,
        @NotBlank String ailment) {
}

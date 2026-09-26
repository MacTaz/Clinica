package com.clinica.dto.patient;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PatientRequest(
        @NotBlank String name,
        @Min(0) int age,
        @NotBlank String contact,
        String ailment,
        String insuranceProvider, // Optional; null = uninsured
        String medicalBackground // Optional; pre-existing conditions, notes
) {
}

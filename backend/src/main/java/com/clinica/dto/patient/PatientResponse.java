package com.clinica.dto.patient;

import java.util.List;

public record PatientResponse(
        Long id, String name, int age, String contact, String ailment,
        String insuranceProvider,
        List<String> medicalHistory) {
}

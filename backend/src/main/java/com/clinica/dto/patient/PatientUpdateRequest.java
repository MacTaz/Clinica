package com.clinica.dto.patient;

public record PatientUpdateRequest(
        String contact,
        String ailment
) {}
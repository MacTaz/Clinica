package com.clinica.repository.patient;

import com.clinica.model.patient.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}

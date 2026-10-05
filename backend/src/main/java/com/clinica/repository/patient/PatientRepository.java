package com.clinica.repository.patient;

import com.clinica.model.patient.Patient;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByNameIgnoreCaseAndContact(String name, String contact);
    Optional<Patient> findByNameIgnoreCaseAndContact(String name, String contact);
}
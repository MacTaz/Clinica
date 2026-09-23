package com.clinica.repository.doctor;

import com.clinica.model.doctor.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    // Used by AvailabilityService to find doctors in a specific field
    List<Doctor> findBySpecializationId(Long specializationId);
}
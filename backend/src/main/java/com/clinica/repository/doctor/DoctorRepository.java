package com.clinica.repository.doctor;

import com.clinica.model.doctor.Doctor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndContact(String name, String contact);
    Optional<Doctor> findByNameIgnoreCase(String name);
    Optional<Doctor> findByNameIgnoreCaseAndContact(String name, String contact);
}
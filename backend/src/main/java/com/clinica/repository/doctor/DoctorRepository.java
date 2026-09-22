package com.clinica.repository.doctor;

import com.clinica.model.doctor.Doctor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findBySpecializationId(Long specializationId);
}

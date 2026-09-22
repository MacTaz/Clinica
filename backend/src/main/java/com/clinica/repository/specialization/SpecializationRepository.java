package com.clinica.repository.specialization;

import com.clinica.model.specialization.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecializationRepository extends JpaRepository<Specialization, Long> {
}

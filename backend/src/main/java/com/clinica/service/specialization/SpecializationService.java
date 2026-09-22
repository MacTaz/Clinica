package com.clinica.service.specialization;

import com.clinica.dto.specialization.SpecializationDto;
import com.clinica.repository.specialization.SpecializationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Fully implemented — use this as the pattern for the other services.
 * Read-only: specializations are seeded once in data.sql (see
 * docs/DATA_MODEL.md) and are not editable through the API.
 */
@Service
public class SpecializationService {

    private final SpecializationRepository specializationRepository;

    public SpecializationService(SpecializationRepository specializationRepository) {
        this.specializationRepository = specializationRepository;
    }

    public List<SpecializationDto> getAllSpecializations() {
        return specializationRepository.findAll().stream()
                .map(s -> new SpecializationDto(s.getId(), s.getName()))
                .toList();
    }
}

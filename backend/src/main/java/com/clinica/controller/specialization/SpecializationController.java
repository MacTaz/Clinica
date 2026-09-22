package com.clinica.controller.specialization;

import com.clinica.dto.specialization.SpecializationDto;
import com.clinica.service.specialization.SpecializationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/specializations")
public class SpecializationController {

    private final SpecializationService specializationService;

    public SpecializationController(SpecializationService specializationService) {
        this.specializationService = specializationService;
    }

    @GetMapping
    public List<SpecializationDto> getAllSpecializations() {
        return specializationService.getAllSpecializations();
    }
}

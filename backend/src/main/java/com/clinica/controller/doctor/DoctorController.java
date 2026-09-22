package com.clinica.controller.doctor;

import com.clinica.dto.doctor.DoctorRequest;
import com.clinica.dto.doctor.DoctorResponse;
import com.clinica.dto.specialization.SpecializationDto;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * STUB: routes match docs/API_CONTRACT.md and return realistic mock data
 * so the frontend can build against real HTTP calls today. Swap the body
 * of each method for a call into DoctorService once it's implemented.
 */
@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @PostMapping
    public ResponseEntity<DoctorResponse> createDoctor(@RequestBody DoctorRequest request) {
        // TODO(Arthur): return doctorService.registerDoctor(request) instead.
        DoctorResponse mock = new DoctorResponse(
                1L, request.name(), request.age(), request.contact(),
                new SpecializationDto(request.specializationId(), "Dermatology"),
                request.salary(), List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(mock);
    }

    @GetMapping
    public List<DoctorResponse> getAllDoctors() {
        // TODO(Arthur): return doctorService.getAllDoctors() instead.
        return List.of(new DoctorResponse(
                1L, "Dr. Reyes", 41, "0917-000-0000",
                new SpecializationDto(1L, "Dermatology"), new BigDecimal("45000.00"),
                List.of(new DoctorResponse.ScheduleBlock(1L, "MONDAY", "09:00", "12:00"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        // TODO(Arthur): return doctorService.deleteDoctor(id) instead;
        // throws ResourceInUseException (409) if the doctor has appointments.
        return ResponseEntity.noContent().build();
    }
}

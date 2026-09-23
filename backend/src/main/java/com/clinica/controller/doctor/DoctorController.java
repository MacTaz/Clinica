package com.clinica.controller.doctor;

import com.clinica.dto.doctor.DoctorRequest;
import com.clinica.dto.doctor.DoctorResponse;
import com.clinica.dto.specialization.SpecializationDto;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.doctor.Doctor;
import com.clinica.model.doctor.DoctorSchedule;
import com.clinica.model.specialization.Specialization;
import com.clinica.repository.specialization.SpecializationRepository;
import com.clinica.service.doctor.DoctorService;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;
    private final SpecializationRepository specializationRepository;

    // Injecting the service and repository via constructor
    public DoctorController(DoctorService doctorService, SpecializationRepository specializationRepository) {
        this.doctorService = doctorService;
        this.specializationRepository = specializationRepository;
    }

    @PostMapping
    public ResponseEntity<DoctorResponse> createDoctor(@RequestBody DoctorRequest request) {
        // 1. Fetch the specialization to link to the new doctor
        Specialization spec = specializationRepository.findById(request.specializationId())
                .orElseThrow(() -> new ResourceNotFoundException("Specialization not found with ID: " + request.specializationId()));

        // 2. Map the DTO to the Doctor Entity
        Doctor doctor = new Doctor();
        doctor.setName(request.name());
        doctor.setAge(request.age());
        doctor.setContact(request.contact());
        doctor.setSpecialization(spec);
        doctor.setSalary(request.salary());

        // 3. Map the schedule DTOs to DoctorSchedule Entities
        List<DoctorSchedule> schedules = request.schedules().stream().map(s -> {
            DoctorSchedule schedule = new DoctorSchedule();
            schedule.setDayOfWeek(DayOfWeek.valueOf(s.dayOfWeek().toUpperCase()));
            schedule.setStartTime(LocalTime.parse(s.startTime()));
            schedule.setEndTime(LocalTime.parse(s.endTime()));
            return schedule;
        }).collect(Collectors.toList());

        doctor.setSchedule(schedules);

        // 4. Save using the service and return the mapped response
        Doctor savedDoctor = doctorService.registerDoctor(doctor);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(savedDoctor));
    }

    @GetMapping
    public List<DoctorResponse> getAllDoctors() {
        // Fetch all doctors and map them to DTOs
        return doctorService.getAllDoctors().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        // Service handles the ResourceInUseException block if appointments exist
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // Helper method to convert a Doctor Entity into a DoctorResponse DTO
    private DoctorResponse mapToResponse(Doctor doctor) {
        SpecializationDto specDto = new SpecializationDto(
                doctor.getSpecialization().getId(),
                doctor.getSpecialization().getName()
        );

        List<DoctorResponse.ScheduleBlock> scheduleBlocks = doctor.getSchedule().stream()
                .map(s -> new DoctorResponse.ScheduleBlock(
                        s.getId(),
                        s.getDayOfWeek().name(),
                        s.getStartTime().toString(),
                        s.getEndTime().toString()
                ))
                .collect(Collectors.toList());

        return new DoctorResponse(
                doctor.getId(),
                doctor.getName(),
                doctor.getAge(),
                doctor.getContact(),
                specDto,
                doctor.getSalary(),
                scheduleBlocks
        );
    }
}
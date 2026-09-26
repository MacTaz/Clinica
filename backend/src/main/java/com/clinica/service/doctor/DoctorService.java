package com.clinica.service.doctor;

import com.clinica.dto.doctor.DoctorRequest;
import com.clinica.dto.doctor.DoctorResponse;
import com.clinica.dto.specialization.SpecializationDto;
import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceInUseException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.doctor.Doctor;
import com.clinica.model.doctor.DoctorSchedule;
import com.clinica.model.specialization.Specialization;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.doctor.DoctorRepository;
import com.clinica.repository.specialization.SpecializationRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns all doctor business logic: registration (including specialization
 * lookup and schedule mapping), listing, and deletion.  The controller layer
 * only routes HTTP — it never touches repositories or entities directly.
 */
@Service
@Transactional
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final SpecializationRepository specializationRepository;

    public DoctorService(DoctorRepository doctorRepository,
                         AppointmentRepository appointmentRepository,
                         SpecializationRepository specializationRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.specializationRepository = specializationRepository;
    }

    /**
     * Maps the incoming DTO to a Doctor entity, persists it, and returns
     * a response DTO.  All DTO-level constraints (@NotBlank, @NotEmpty, etc.)
     * are already validated by @Valid in the controller before this runs.
     */
    public DoctorResponse registerDoctor(DoctorRequest request) {
        Specialization spec = specializationRepository.findById(request.specializationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Specialization not found with ID: " + request.specializationId()));

        Doctor doctor = new Doctor();
        doctor.setName(request.name());
        doctor.setAge(request.age());             // Person.setAge validates 0–150
        doctor.setContact(request.contact());
        doctor.setSpecialization(spec);
        doctor.setSalary(request.salary());       // Doctor.setSalary validates >= 0

        List<DoctorSchedule> schedules = request.schedules().stream().map(s -> {
            DoctorSchedule schedule = new DoctorSchedule();
            schedule.setDayOfWeek(DayOfWeek.valueOf(s.dayOfWeek().toUpperCase()));
            schedule.setStartTime(LocalTime.parse(s.startTime()));
            schedule.setEndTime(LocalTime.parse(s.endTime()));
            return schedule;
        }).collect(Collectors.toList());

        for (int i = 0; i < schedules.size(); i++) {
            DoctorSchedule s1 = schedules.get(i);
            if (!s1.getStartTime().isBefore(s1.getEndTime())) {
                throw new InvalidRecordDataException(
                        "Schedule row #" + (i + 1) + ": Start time (" + s1.getStartTime() + ") must be earlier than End time (" + s1.getEndTime() + ").");
            }
            for (int j = i + 1; j < schedules.size(); j++) {
                DoctorSchedule s2 = schedules.get(j);
                if (s1.getDayOfWeek() == s2.getDayOfWeek()) {
                    boolean overlaps = s1.getStartTime().isBefore(s2.getEndTime()) && s2.getStartTime().isBefore(s1.getEndTime());
                    if (overlaps) {
                        throw new InvalidRecordDataException(
                                "Duplicate or overlapping schedule for " + s1.getDayOfWeek() + " (" + s1.getStartTime() + "–" + s1.getEndTime() + " and " + s2.getStartTime() + "–" + s2.getEndTime() + "). Schedules cannot repeat or overlap.");
                    }
                }
            }
        }

        // setSchedule links the bidirectional doctor <-> schedule relationship
        doctor.setSchedule(schedules);
        return toResponse(doctorRepository.save(doctor));
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (request.name() != null && !request.name().trim().isEmpty()) {
            doctor.setName(request.name().trim());
        }
        if (request.age() > 0) {
            doctor.setAge(request.age());
        }
        if (request.contact() != null && !request.contact().trim().isEmpty()) {
            doctor.setContact(request.contact().trim());
        }

        if (request.schedules() != null) {
            List<DoctorSchedule> schedules = request.schedules().stream().map(s -> {
                DoctorSchedule schedule = new DoctorSchedule();
                schedule.setDayOfWeek(DayOfWeek.valueOf(s.dayOfWeek().toUpperCase()));
                schedule.setStartTime(LocalTime.parse(s.startTime()));
                schedule.setEndTime(LocalTime.parse(s.endTime()));
                return schedule;
            }).collect(Collectors.toList());

            for (int i = 0; i < schedules.size(); i++) {
                DoctorSchedule s1 = schedules.get(i);
                if (!s1.getStartTime().isBefore(s1.getEndTime())) {
                    throw new InvalidRecordDataException(
                            "Schedule row #" + (i + 1) + ": Start time (" + s1.getStartTime() + ") must be earlier than End time (" + s1.getEndTime() + ").");
                }
                for (int j = i + 1; j < schedules.size(); j++) {
                    DoctorSchedule s2 = schedules.get(j);
                    if (s1.getDayOfWeek() == s2.getDayOfWeek()) {
                        boolean overlaps = s1.getStartTime().isBefore(s2.getEndTime()) && s2.getStartTime().isBefore(s1.getEndTime());
                        if (overlaps) {
                            throw new InvalidRecordDataException(
                                    "Duplicate or overlapping schedule for " + s1.getDayOfWeek() + " (" + s1.getStartTime() + "–" + s1.getEndTime() + " and " + s2.getStartTime() + "–" + s2.getEndTime() + "). Schedules cannot repeat or overlap.");
                        }
                    }
                }
            }
            doctor.setSchedule(schedules);
        }

        return toResponse(doctorRepository.save(doctor));
    }

    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        // Per API_CONTRACT.md: 409 if doctor still has appointments
        if (appointmentRepository.existsByDoctorId(id)) {
            throw new ResourceInUseException("Cannot delete doctor with existing appointments.");
        }
        doctorRepository.delete(doctor);
    }

    // Converts a saved Doctor entity to the response DTO sent to the frontend.
    private DoctorResponse toResponse(Doctor doctor) {
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
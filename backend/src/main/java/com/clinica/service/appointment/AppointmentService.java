package com.clinica.service.appointment;

import com.clinica.dto.appointment.AppointmentRequest;
import com.clinica.dto.appointment.AppointmentResponse;
import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.exception.SlotUnavailableException;
import com.clinica.model.appointment.Appointment;
import com.clinica.model.doctor.Doctor;
import com.clinica.model.patient.Patient;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.doctor.DoctorRepository;
import com.clinica.repository.patient.PatientRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class AppointmentService {

    private final AvailabilityService availabilityService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(AvailabilityService availabilityService,
                              AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              DoctorRepository doctorRepository) {
        this.availabilityService = availabilityService;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    // Per API_CONTRACT.md: POST /appointments → 201 + Appointment, 400 invalid, 409 slot taken
    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        // Validate date is not in the past
        if (request.appointmentDate().isBefore(LocalDate.now())) {
            throw new InvalidRecordDataException("Appointment date cannot be in the past.");
        }

        // Validate patient exists
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        // Validate the requested time falls within the doctor's schedule for that day
        boolean withinSchedule = doctor.getSchedule().stream().anyMatch(block ->
                block.getDayOfWeek().equals(request.appointmentDate().getDayOfWeek())
                && !request.startTime().isBefore(block.getStartTime())
                && request.startTime().plusMinutes(30).compareTo(block.getEndTime()) <= 0
        );
        if (!withinSchedule) {
            throw new InvalidRecordDataException("Requested time is outside the doctor's schedule.");
        }

        // Re-check the slot is still open right before saving (400 → 409 per contract)
        if (!availabilityService.isSlotOpen(doctor, request.appointmentDate(), request.startTime())) {
            throw new SlotUnavailableException("This time slot is already booked.");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setStartTime(request.startTime());

        return toResponse(appointmentRepository.save(appointment));
    }

    // Per API_CONTRACT.md: GET /appointments → 200 + Appointment[]
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // Per API_CONTRACT.md: DELETE /appointments/{id} → 204, also deletes its payment if any
    public void cancelAppointment(Long appointmentId) {
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new ResourceNotFoundException("Appointment not found");
        }
        // Payment has FK on appointment_id — cascade delete handles it per DATA_MODEL.md
        appointmentRepository.deleteById(appointmentId);
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                new AppointmentResponse.PersonRef(
                        appointment.getPatient().getId(),
                        appointment.getPatient().getName()
                ),
                new AppointmentResponse.PersonRef(
                        appointment.getDoctor().getId(),
                        appointment.getDoctor().getName()
                ),
                appointment.getAppointmentDate(),
                appointment.getStartTime()
        );
    }
}

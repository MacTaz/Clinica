package com.clinica.controller.appointment;

import com.clinica.dto.appointment.AppointmentRequest;
import com.clinica.dto.appointment.AppointmentResponse;
import com.clinica.dto.appointment.DoctorAvailability;
import com.clinica.service.appointment.AppointmentService;
import com.clinica.service.appointment.AvailabilityService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AvailabilityService availabilityService;

    public AppointmentController(AppointmentService appointmentService, AvailabilityService availabilityService) {
        this.appointmentService = appointmentService;
        this.availabilityService = availabilityService;
    }

    @GetMapping("/availability")
    public List<DoctorAvailability> getAvailability(
            @RequestParam Long specializationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.getAvailableDoctors(specializationId, date);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.bookAppointment(request));
    }

    @GetMapping
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.noContent().build();
    }
}

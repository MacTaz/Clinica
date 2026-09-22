package com.clinica.controller.appointment;

import com.clinica.dto.appointment.AppointmentRequest;
import com.clinica.dto.appointment.AppointmentResponse;
import com.clinica.dto.appointment.DoctorAvailability;
import java.time.LocalDate;
import java.time.LocalTime;
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

/**
 * STUB: routes match docs/API_CONTRACT.md and return realistic mock data
 * so the frontend can build against real HTTP calls today. Swap the body
 * of each method for a call into AppointmentService once implemented.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @GetMapping("/availability")
    public List<DoctorAvailability> getAvailability(
            @RequestParam Long specializationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // TODO(Mico): return availabilityService.getAvailableDoctors(...) instead.
        return List.of(new DoctorAvailability(1L, "Dr. Reyes",
                List.of(LocalTime.of(9, 0), LocalTime.of(9, 30), LocalTime.of(10, 0))));
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> bookAppointment(@RequestBody AppointmentRequest request) {
        // TODO(Mico): return appointmentService.bookAppointment(request) instead.
        AppointmentResponse mock = new AppointmentResponse(
                1L, new AppointmentResponse.PersonRef(request.patientId(), "Jane Cruz"),
                new AppointmentResponse.PersonRef(request.doctorId(), "Dr. Reyes"),
                request.appointmentDate(), request.startTime());
        return ResponseEntity.status(HttpStatus.CREATED).body(mock);
    }

    @GetMapping
    public List<AppointmentResponse> getAllAppointments() {
        // TODO(Mico): return appointmentService.getAllAppointments() instead.
        return List.of(new AppointmentResponse(
                1L, new AppointmentResponse.PersonRef(1L, "Jane Cruz"),
                new AppointmentResponse.PersonRef(1L, "Dr. Reyes"),
                LocalDate.now().plusDays(1), LocalTime.of(9, 0)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        // TODO(Mico): return appointmentService.cancelAppointment(id) instead.
        return ResponseEntity.noContent().build();
    }
}

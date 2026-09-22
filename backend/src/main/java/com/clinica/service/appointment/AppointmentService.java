package com.clinica.service.appointment;

import com.clinica.dto.appointment.AppointmentRequest;
import com.clinica.dto.appointment.AppointmentResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final AvailabilityService availabilityService;

    public AppointmentService(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        // TODO(Mico): validate patient/doctor exist, date not in the past,
        // time inside the doctor's schedule (400 InvalidRecordDataException
        // otherwise); re-check the slot via availabilityService (409
        // SlotUnavailableException if taken); save.
        throw new UnsupportedOperationException("TODO: implement bookAppointment");
    }

    public List<AppointmentResponse> getAllAppointments() {
        throw new UnsupportedOperationException("TODO: implement getAllAppointments");
    }

    public void cancelAppointment(Long appointmentId) {
        // TODO(Mico): also delete the appointment's payment record, if any
        // — see docs/DATA_MODEL.md delete rules.
        throw new UnsupportedOperationException("TODO: implement cancelAppointment");
    }
}

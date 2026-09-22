package com.clinica.service.appointment;

import com.clinica.dto.appointment.DoctorAvailability;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AvailabilityService {

    private static final int SLOT_MINUTES = 30;

    public List<DoctorAvailability> getAvailableDoctors(Long specializationId, LocalDate date) {
        // TODO(Mico): find doctors in this specialization who work on
        // date.getDayOfWeek(), split each doctor's schedule blocks into
        // 30-minute slots, remove slots already booked that day (and, if
        // date is today, slots already in the past). See docs/API_CONTRACT.md
        // for the exact DoctorAvailability shape the frontend expects.
        throw new UnsupportedOperationException("TODO: implement getAvailableDoctors");
    }

    // TODO(Mico): isSlotOpen(Doctor, LocalDate, LocalTime) — reused by
    // AppointmentService to re-check a slot right before saving.
}

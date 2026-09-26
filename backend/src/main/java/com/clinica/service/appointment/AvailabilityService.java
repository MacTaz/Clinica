package com.clinica.service.appointment;

import com.clinica.dto.appointment.DoctorAvailability;
import com.clinica.model.doctor.Doctor;
import com.clinica.model.doctor.DoctorSchedule;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.doctor.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private static final int SLOT_MINUTES = 30;

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public AvailabilityService(DoctorRepository doctorRepository,
                               AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    // Returns available doctors with free 30-min slots for the given specialization (or all doctors) and date.
    // Per API_CONTRACT.md: GET /appointments/availability?date={yyyy-mm-dd}&specializationId={id}
    public List<DoctorAvailability> getAvailableDoctors(Long specializationId, LocalDate date) {
        List<Doctor> doctors = specializationId != null
                ? doctorRepository.findBySpecializationId(specializationId)
                : doctorRepository.findAll();
        LocalTime now = LocalTime.now();
        boolean isToday = date.equals(LocalDate.now());

        List<DoctorAvailability> result = new ArrayList<>();
        for (Doctor doctor : doctors) {
            List<LocalTime> freeSlots = new ArrayList<>();

            for (DoctorSchedule block : doctor.getSchedule()) {
                // Only include schedule blocks that match the requested day of week
                if (!block.getDayOfWeek().equals(date.getDayOfWeek())) continue;

                // Split the block into 30-minute slots
                LocalTime slot = block.getStartTime();
                while (!slot.plusMinutes(SLOT_MINUTES).isAfter(block.getEndTime())) {
                    // Skip slots already in the past if date is today
                    if (isToday && !slot.isAfter(now)) {
                        slot = slot.plusMinutes(SLOT_MINUTES);
                        continue;
                    }
                    // Skip slots already booked for this doctor
                    if (!appointmentRepository.existsByDoctorIdAndAppointmentDateAndStartTime(
                            doctor.getId(), date, slot)) {
                        freeSlots.add(slot);
                    }
                    slot = slot.plusMinutes(SLOT_MINUTES);
                }
            }

            if (!freeSlots.isEmpty()) {
                result.add(new DoctorAvailability(
                        doctor.getId(),
                        doctor.getName(),
                        freeSlots
                ));
            }
        }
        return result;
    }

    // Reused by AppointmentService to re-check a slot right before saving (prevents race conditions).
    public boolean isSlotOpen(Doctor doctor, LocalDate date, LocalTime startTime) {
        return !appointmentRepository.existsByDoctorIdAndAppointmentDateAndStartTime(
                doctor.getId(), date, startTime);
    }
}

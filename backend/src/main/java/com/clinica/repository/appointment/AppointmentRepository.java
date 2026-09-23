package com.clinica.repository.appointment;

import com.clinica.model.appointment.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Retrieves all appointments for a specific doctor on a given date (used to calculate open slots)
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate appointmentDate);

    // Checks if a doctor's slot is already taken
    boolean existsByDoctorIdAndAppointmentDateAndStartTime(Long doctorId, LocalDate appointmentDate, LocalTime startTime);

    // Checks if a doctor has any appointments at all (used before deletion)
    boolean existsByDoctorId(Long doctorId);

    // Checks if a patient is already booked for a specific date and time
    boolean existsByPatientIdAndAppointmentDateAndStartTime(Long patientId, LocalDate appointmentDate, LocalTime startTime);
}
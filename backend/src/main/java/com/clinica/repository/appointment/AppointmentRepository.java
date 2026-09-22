package com.clinica.repository.appointment;

import com.clinica.model.appointment.Appointment;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    boolean existsByDoctorId(Long doctorId);

    boolean existsByPatientIdAndAppointmentDateAndStartTime(
            Long patientId, LocalDate date, LocalTime startTime);
}

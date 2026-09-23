package com.clinica.service.doctor;

import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceInUseException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.doctor.Doctor;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.doctor.DoctorRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public DoctorService(DoctorRepository doctorRepository, AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public Doctor registerDoctor(Doctor doctor) {
        if (doctor.getSalary() == null || doctor.getSalary().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidRecordDataException("Salary cannot be negative."); // Validates salary
        }
        if (doctor.getSchedule() == null || doctor.getSchedule().isEmpty()) {
            throw new InvalidRecordDataException("Doctor must have a weekly availability schedule.");
        }
        // Link bidirectional schedule relationships
        doctor.getSchedule().forEach(schedule -> schedule.setDoctor(doctor));
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        // Prevent deletion if appointments exist
        boolean hasAppointments = !appointmentRepository.findByDoctorIdAndAppointmentDate(id, null).isEmpty();
        if (hasAppointments) {
            throw new ResourceInUseException("Cannot delete doctor with existing appointments.");
        }
        doctorRepository.delete(doctor);
    }
}
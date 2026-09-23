package com.clinica.service.patient;

import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.patient.Patient;
import com.clinica.repository.patient.PatientRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient registerPatient(Patient patient) {
        if (patient.getAge() < 0) {
            throw new InvalidRecordDataException("Age cannot be negative."); // Input validation
        }
        if (patient.getName() == null || patient.getName().trim().isEmpty()) {
            throw new InvalidRecordDataException("Patient name is required.");
        }
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient addMedicalHistory(Long id, String entry) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        patient.addHistoryEntry(entry); // Appends medical history
        return patientRepository.save(patient);
    }

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found");
        }
        patientRepository.deleteById(id); // Safe deletion of patient profile, including history and appointments
    }
}
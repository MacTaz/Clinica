package com.clinica.service.patient;

import com.clinica.dto.patient.PatientRequest;
import com.clinica.dto.patient.PatientResponse;
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

    public PatientResponse registerPatient(PatientRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new InvalidRecordDataException("Patient name is required.");
        }
        Patient patient = new Patient();
        patient.setName(request.name());
        patient.setAge(request.age()); // setAge validates 0–150 range
        patient.setContact(request.contact());
        patient.setAilment(request.ailment());
        return toResponse(patientRepository.save(patient));
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PatientResponse addMedicalHistory(Long id, String entry) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        patient.addHistoryEntry(entry); // Appends medical history
        return toResponse(patientRepository.save(patient));
    }

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found");
        }
        patientRepository.deleteById(id); // Safe deletion of patient profile, including history and appointments
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getName(),
                patient.getAge(),
                patient.getContact(),
                patient.getAilment(),
                patient.getMedicalHistory()
        );
    }
}
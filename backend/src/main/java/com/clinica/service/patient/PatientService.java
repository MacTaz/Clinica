package com.clinica.service.patient;

import com.clinica.dto.patient.PatientRequest;
import com.clinica.dto.patient.PatientResponse;
import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.patient.Patient;
import com.clinica.repository.patient.PatientRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public PatientResponse registerPatient(PatientRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new InvalidRecordDataException("Patient name is required.");
        }
        if (request.contact() == null || request.contact().trim().isEmpty()) {
            throw new InvalidRecordDataException("Contact number is required.");
        }
        if (request.age() < 0 || request.age() > 150) {
            throw new InvalidRecordDataException("Age must be between 0 and 150.");
        }

        String cleanName = normalizeName(request.name());
        String cleanContact = normalizeContact(request.contact());

        // Check for duplicate patient (same name case-insensitive and contact number)
        java.util.Optional<Patient> existing = patientRepository.findByNameIgnoreCaseAndContact(cleanName, cleanContact);
        if (existing.isPresent()) {
            Patient p = existing.get();
            if (p.getAge() == request.age()) {
                throw new InvalidRecordDataException(
                        "A patient with name '" + cleanName + "', age " + request.age() + ", and contact '" + cleanContact + "' is already registered.");
            }
            throw new InvalidRecordDataException(
                    "A patient with name '" + cleanName + "' and contact '" + cleanContact + "' is already registered.");
        }

        Patient patient = new Patient();
        patient.setName(cleanName);
        patient.setAge(request.age()); // setAge validates 0–150 range
        patient.setContact(cleanContact);
        patient.setAilment(request.ailment() != null && !request.ailment().trim().isEmpty() ? request.ailment().trim() : "None");
        patient.setInsuranceProvider(request.insuranceProvider() != null && !request.insuranceProvider().trim().isEmpty()
                ? request.insuranceProvider().trim() : null);
        if (request.medicalBackground() != null && !request.medicalBackground().trim().isEmpty()) {
            patient.addHistoryEntry("Medical Background: " + request.medicalBackground().trim());
        }
        return toResponse(patientRepository.save(patient));
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return toResponse(patient);
    }

    public PatientResponse addMedicalHistory(Long id, String entry) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        patient.addHistoryEntry(entry); // Appends medical history
        return toResponse(patientRepository.save(patient));
    }

    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        String targetName = (request.name() != null && !request.name().trim().isEmpty())
                ? normalizeName(request.name())
                : patient.getName();
        String targetContact = (request.contact() != null && !request.contact().trim().isEmpty())
                ? normalizeContact(request.contact())
                : patient.getContact();

        // Check if updating causes duplicate with another patient
        java.util.Optional<Patient> existing = patientRepository.findByNameIgnoreCaseAndContact(targetName, targetContact);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new InvalidRecordDataException(
                    "Another patient with name '" + targetName + "' and contact '" + targetContact + "' already exists.");
        }

        if (request.name() != null && !request.name().trim().isEmpty()) {
            patient.setName(targetName);
        }
        if (request.age() >= 0) {
            if (request.age() > 150) {
                throw new InvalidRecordDataException("Age must be between 0 and 150.");
            }
            patient.setAge(request.age());
        }
        if (request.contact() != null && !request.contact().trim().isEmpty()) {
            patient.setContact(targetContact);
        }
        if (request.ailment() != null) {
            patient.setAilment(request.ailment().trim().isEmpty() ? "None" : request.ailment().trim());
        }
        patient.setInsuranceProvider(request.insuranceProvider() != null && !request.insuranceProvider().trim().isEmpty()
                ? request.insuranceProvider().trim()
                : null);

        if (request.medicalBackground() != null) {
            String newBg = request.medicalBackground().trim();
            List<String> history = patient.getMedicalHistory();
            int bgIdx = -1;
            for (int i = 0; i < history.size(); i++) {
                if (history.get(i).startsWith("Medical Background:") || history.get(i).startsWith("Initial Background:")) {
                    bgIdx = i;
                    break;
                }
            }
            if (!newBg.isEmpty()) {
                if (bgIdx >= 0) {
                    history.set(bgIdx, "Medical Background: " + newBg);
                } else {
                    history.add(0, "Medical Background: " + newBg);
                }
            } else if (bgIdx >= 0) {
                history.remove(bgIdx);
            }
            patient.setMedicalHistory(history);
        }

        return toResponse(patientRepository.save(patient));
    }

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found");
        }
        patientRepository.deleteById(id); // Safe deletion of patient profile, including history and appointments
    }

    private String normalizeName(String name) {
        if (name == null) return null;
        return name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeContact(String contact) {
        if (contact == null) return null;
        return contact.trim();
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getName(),
                patient.getAge(),
                patient.getContact(),
                patient.getAilment(),
                patient.getInsuranceProvider(),
                patient.getMedicalHistory()
        );
    }
}
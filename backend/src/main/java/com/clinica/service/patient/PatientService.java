package com.clinica.service.patient;

import com.clinica.dto.patient.PatientRequest;
import com.clinica.dto.patient.PatientResponse;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.patient.Patient;
import com.clinica.repository.patient.PatientRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional
    public PatientResponse registerPatient(PatientRequest request) {
        Patient patient = new Patient();
        patient.setName(request.name());
        patient.setAge(request.age());
        patient.setContact(request.contact());
        patient.setAilment(request.ailment());
        return toResponse(patientRepository.save(patient));
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PatientResponse addMedicalHistory(Long patientId, String entry) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient " + patientId + " not found"));
        patient.addHistoryEntry(entry);
        return toResponse(patient);
    }

    @Transactional
    public void deletePatient(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient " + patientId + " not found");
        }
        // TODO(Arthur): also removes appointments per the delete-rules design
        // decision — cascade or explicit cleanup, whichever the appointment
        // owner (Mico) and DB owner agree on. See docs/DATA_MODEL.md.
        patientRepository.deleteById(patientId);
    }

    private PatientResponse toResponse(Patient p) {
        return new PatientResponse(
                p.getId(), p.getName(), p.getAge(), p.getContact(), p.getAilment(),
                p.getMedicalHistory().stream().map(h -> h.getEntry()).toList());
    }
}

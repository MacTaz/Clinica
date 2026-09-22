package com.clinica.model.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/** patient_medical_history: composite key (patient_id, entry_order). */
@Entity
@Table(name = "patient_medical_history")
public class PatientMedicalHistoryEntry {

    @EmbeddedId
    private PatientMedicalHistoryId id = new PatientMedicalHistoryId();

    @ManyToOne
    @MapsId("patientId")
    private Patient patient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String entry;

    public void setPatient(Patient patient) { this.patient = patient; }
    public Patient getPatient() { return patient; }

    public void setEntryOrder(int order) { this.id.setEntryOrder(order); }
    public int getEntryOrder() { return id.getEntryOrder(); }

    public String getEntry() { return entry; }
    public void setEntry(String entry) { this.entry = entry; }
}

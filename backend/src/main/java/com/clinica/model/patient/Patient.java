package com.clinica.model.patient;

import com.clinica.model.Person;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient extends Person {

    @Column(nullable = false)
    private String ailment;

    @Column(name = "insurance_provider", length = 100)
    private String insuranceProvider; // Optional; null = none / uninsured

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "patient_medical_history",
            joinColumns = @JoinColumn(name = "patient_id")
    )
    @OrderColumn(name = "entry_order")
    @Column(name = "entry", columnDefinition = "TEXT", nullable = false)
    private List<String> medicalHistory = new ArrayList<>(); // Private field for sensitive data

    @Override
    public String displayRole() {
        return "Patient";
    }

    public String getAilment() { return ailment; }
    public void setAilment(String ailment) { this.ailment = ailment; }

    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) {
        this.insuranceProvider = (insuranceProvider != null && !insuranceProvider.trim().isEmpty())
                ? insuranceProvider.trim() : null;
    }

    public List<String> getMedicalHistory() {
        return new ArrayList<>(medicalHistory);
    }

    public void setMedicalHistory(List<String> medicalHistory) {
        this.medicalHistory = medicalHistory != null ? new ArrayList<>(medicalHistory) : new ArrayList<>();
    }

    public void addHistoryEntry(String entry) {
        if (entry != null && !entry.trim().isEmpty()) {
            this.medicalHistory.add(entry);
        }
    }
}
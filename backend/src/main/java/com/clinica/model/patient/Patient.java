package com.clinica.model.patient;

import com.clinica.model.Person;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient extends Person {

    @Column(nullable = false, length = 255)
    private String ailment;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("entryOrder ASC")
    private List<PatientMedicalHistoryEntry> medicalHistory = new ArrayList<>();

    @Override
    public String displayRole() {
        return "Patient";
    }

    public String getAilment() { return ailment; }
    public void setAilment(String ailment) { this.ailment = ailment; }
    public List<PatientMedicalHistoryEntry> getMedicalHistory() { return medicalHistory; }

    public void addHistoryEntry(String entry) {
        int nextOrder = medicalHistory.size();
        PatientMedicalHistoryEntry e = new PatientMedicalHistoryEntry();
        e.setPatient(this);
        e.setEntryOrder(nextOrder);
        e.setEntry(entry);
        medicalHistory.add(e);
    }
}

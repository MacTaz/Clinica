package com.clinica.model.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PatientMedicalHistoryId implements Serializable {

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "entry_order")
    private int entryOrder;

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public int getEntryOrder() { return entryOrder; }
    public void setEntryOrder(int entryOrder) { this.entryOrder = entryOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PatientMedicalHistoryId that)) return false;
        return entryOrder == that.entryOrder && Objects.equals(patientId, that.patientId);
    }

    @Override
    public int hashCode() { return Objects.hash(patientId, entryOrder); }
}

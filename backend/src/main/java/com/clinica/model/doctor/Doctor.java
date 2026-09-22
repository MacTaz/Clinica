package com.clinica.model.doctor;

import com.clinica.model.Person;
import com.clinica.model.specialization.Specialization;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor extends Person {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "specialization_id", nullable = false)
    private Specialization specialization;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal salary;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorSchedule> schedules = new ArrayList<>();

    @Override
    public String displayRole() {
        return "Doctor";
    }

    public Specialization getSpecialization() { return specialization; }
    public void setSpecialization(Specialization specialization) { this.specialization = specialization; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public List<DoctorSchedule> getSchedules() { return schedules; }
    public void addSchedule(DoctorSchedule schedule) {
        schedule.setDoctor(this);
        schedules.add(schedule);
    }
}

package com.clinica.model.doctor;

import com.clinica.model.Person;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor extends Person {

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal salary; // Private sensitive field

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DoctorSchedule> schedule = new ArrayList<>(); // Weekly schedule

    @Override
    public String displayRole() {
        return "Doctor";
    }

    public BigDecimal getSalary() { return salary; }

    public void setSalary(BigDecimal salary) {
        if (salary != null && salary.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Salary cannot be negative."); // Validates salary
        }
        this.salary = salary;
    }

    public List<DoctorSchedule> getSchedule() { return schedule; }
    public void setSchedule(List<DoctorSchedule> schedule) {
        // Clear the Hibernate-tracked collection first so orphanRemoval deletes stale rows,
        // then re-populate it in place — replacing the reference would break dirty-tracking.
        this.schedule.clear();
        this.schedule.addAll(schedule);
        for (DoctorSchedule s : this.schedule) {
            s.setDoctor(this);
        }
    }
}
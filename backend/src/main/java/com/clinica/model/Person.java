package com.clinica.model;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.MappedSuperclass;

/**
 * Shared fields for Patient and Doctor. Per the design decision to keep
 * one table per person type (see docs/DATA_MODEL.md), this is a
 * @MappedSuperclass, not an @Entity — there is no "persons" table.
 */
@MappedSuperclass
public abstract class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private int age;

    @Column(nullable = false, length = 30)
    private String contact;

    public abstract String displayRole();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
}

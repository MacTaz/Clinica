package com.clinica.repository.payment;

import com.clinica.model.payment.Payment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByAppointmentId(Long appointmentId);
}

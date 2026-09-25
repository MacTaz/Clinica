package com.clinica.service.payment;

import com.clinica.dto.payment.PaymentRequest;
import com.clinica.dto.payment.PaymentResponse;
import com.clinica.exception.ResourceInUseException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.appointment.Appointment;
import com.clinica.model.payment.Payment;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.payment.PaymentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          AppointmentRepository appointmentRepository) {
        this.paymentRepository = paymentRepository;
        this.appointmentRepository = appointmentRepository;
    }

    // Per API_CONTRACT.md: POST /appointments/{id}/payment → 201 + Payment, one per appointment
    public PaymentResponse recordPayment(Long appointmentId, PaymentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (paymentRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new ResourceInUseException("Payment already recorded for this appointment.");
        }

        // amount (> 0) and method (CASH/CARD/GCASH) are validated on PaymentRequest via @Valid
        Payment payment = new Payment();
        payment.setAppointment(appointment);
        payment.setAmount(request.amount());
        payment.markPaid(request.method()); // Sets status PAID and paidAt = now

        return toResponse(paymentRepository.save(payment));
    }

    // Per API_CONTRACT.md: GET /payments → 200 + Payment[]
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAppointment().getId(),
                payment.getAmount(),
                payment.getMethod().name(),
                payment.getStatus().name(),
                payment.getPaidAt()
        );
    }
}

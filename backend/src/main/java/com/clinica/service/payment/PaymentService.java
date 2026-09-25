package com.clinica.service.payment;

import com.clinica.dto.payment.PaymentRequest;
import com.clinica.dto.payment.PaymentResponse;
import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceInUseException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.appointment.Appointment;
import com.clinica.model.payment.Payment;
import com.clinica.model.payment.PaymentMethod;
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
        applyMethodDetails(payment, request);
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

    // Each method requires its own fields and forbids the others' (mirrored by chk_payments_method_details)
    private void applyMethodDetails(Payment payment, PaymentRequest request) {
        PaymentMethod method = request.method();
        String receivedBy = normalize(request.receivedBy());
        String cardLast4 = normalize(request.cardLast4());
        String approvalCode = normalize(request.approvalCode());
        String gcashReference = normalize(request.gcashReference());

        switch (method) {
            case CASH -> {
                if (receivedBy == null) {
                    throw new InvalidRecordDataException("receivedBy is required for CASH payments.");
                }
                if (receivedBy.length() > 100) {
                    throw new InvalidRecordDataException("receivedBy must be at most 100 characters.");
                }
                rejectIfPresent(method, "cardLast4", cardLast4);
                rejectIfPresent(method, "approvalCode", approvalCode);
                rejectIfPresent(method, "gcashReference", gcashReference);
            }
            case CARD -> {
                if (cardLast4 == null || !cardLast4.matches("\\d{4}")) {
                    throw new InvalidRecordDataException("cardLast4 must be exactly 4 digits.");
                }
                if (approvalCode == null || !approvalCode.matches("[A-Za-z0-9]{1,12}")) {
                    throw new InvalidRecordDataException("approvalCode must be 1 to 12 letters or digits.");
                }
                rejectIfPresent(method, "receivedBy", receivedBy);
                rejectIfPresent(method, "gcashReference", gcashReference);
            }
            case GCASH -> {
                if (gcashReference == null || !gcashReference.matches("\\d{13}")) {
                    throw new InvalidRecordDataException("gcashReference must be exactly 13 digits.");
                }
                rejectIfPresent(method, "receivedBy", receivedBy);
                rejectIfPresent(method, "cardLast4", cardLast4);
                rejectIfPresent(method, "approvalCode", approvalCode);
            }
        }

        payment.setReceivedBy(receivedBy);
        payment.setCardLast4(cardLast4);
        payment.setApprovalCode(approvalCode);
        payment.setGcashReference(gcashReference);
    }

    private static void rejectIfPresent(PaymentMethod method, String field, String value) {
        if (value != null) {
            throw new InvalidRecordDataException(field + " is not allowed for " + method + " payments.");
        }
    }

    // Trims input; blank strings count as not provided
    private static String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAppointment().getId(),
                payment.getAmount(),
                payment.getMethod().name(),
                payment.getStatus().name(),
                payment.getPaidAt(),
                payment.getReceivedBy(),
                payment.getCardLast4(),
                payment.getApprovalCode(),
                payment.getGcashReference()
        );
    }
}

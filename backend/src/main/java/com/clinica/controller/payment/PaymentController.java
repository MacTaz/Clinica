package com.clinica.controller.payment;

import com.clinica.dto.payment.PaymentRequest;
import com.clinica.dto.payment.PaymentResponse;
import com.clinica.service.payment.PaymentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Note the mapping: POST /api/appointments/{id}/payment lives here, not on
 * AppointmentController — it's a payment-domain operation even though the
 * URL is nested under appointments (matches docs/API_CONTRACT.md).
 */
@RestController
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/api/appointments/{id}/payment")
    public ResponseEntity<PaymentResponse> recordPayment(
            @PathVariable("id") Long appointmentId, @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordPayment(appointmentId, request));
    }

    @GetMapping("/api/payments")
    public List<PaymentResponse> getAllPayments() {
        return paymentService.getAllPayments();
    }
}

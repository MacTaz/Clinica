package com.clinica.controller.payment;

import com.clinica.dto.payment.PaymentRequest;
import com.clinica.dto.payment.PaymentResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * STUB: routes match docs/API_CONTRACT.md and return realistic mock data
 * so the frontend can build against real HTTP calls today. Swap the body
 * of each method for a call into PaymentService once implemented.
 *
 * Note the mapping: POST /api/appointments/{id}/payment lives here, not on
 * AppointmentController — it's a payment-domain operation even though the
 * URL is nested under appointments (matches docs/API_CONTRACT.md).
 */
@RestController
public class PaymentController {

    @PostMapping("/api/appointments/{id}/payment")
    public ResponseEntity<PaymentResponse> recordPayment(
            @PathVariable("id") Long appointmentId, @RequestBody PaymentRequest request) {
        // TODO(Agatha): return paymentService.recordPayment(appointmentId, request) instead.
        PaymentResponse mock = new PaymentResponse(
                1L, appointmentId, request.amount(), request.method(), "PAID", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(mock);
    }

    @GetMapping("/api/payments")
    public List<PaymentResponse> getAllPayments() {
        // TODO(Agatha): return paymentService.getAllPayments() instead.
        return List.of(new PaymentResponse(
                1L, 1L, new BigDecimal("800.00"), "CASH", "PAID", LocalDateTime.now()));
    }
}

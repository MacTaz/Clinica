package com.clinica.service.payment;

import com.clinica.dto.payment.PaymentRequest;
import com.clinica.dto.payment.PaymentResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentService {

    public PaymentResponse recordPayment(Long appointmentId, PaymentRequest request) {
        // TODO(Agatha): look up the appointment (404 if missing), reject if
        // a payment already exists for it, validate amount is not negative
        // and method is one of CASH/CARD/GCASH, then create + save a
        // Payment with status PAID and paidAt = now().
        throw new UnsupportedOperationException("TODO: implement recordPayment");
    }

    public List<PaymentResponse> getAllPayments() {
        // TODO(Agatha): map Payment entities to PaymentResponse.
        throw new UnsupportedOperationException("TODO: implement getAllPayments");
    }
}

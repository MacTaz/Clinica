package com.clinica.dto.payment;

import com.clinica.model.payment.PaymentMethod;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * Method-specific fields: CASH needs receivedBy; CARD needs cardLast4 and
 * approvalCode; GCASH needs gcashReference. Fields for other methods must be
 * null. installmentMonths (3, 6 or 12) is optional and only for CARD payments
 * of at least 10,000.00; null means a straight payment (validated in PaymentService).
 */
public record PaymentRequest(
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal amount, // Matches DECIMAL(10,2)
        @NotNull PaymentMethod method,
        String receivedBy,
        String cardLast4,
        String approvalCode,
        String gcashReference,
        BigDecimal installmentMonths) { // BigDecimal, not Integer: Jackson would silently truncate 6.5 to 6
}

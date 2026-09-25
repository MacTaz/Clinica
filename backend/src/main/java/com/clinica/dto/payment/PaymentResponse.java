package com.clinica.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id, Long appointmentId, BigDecimal amount,
        String method, String status, LocalDateTime paidAt,
        String receivedBy, String cardLast4, String approvalCode, String gcashReference) {
}

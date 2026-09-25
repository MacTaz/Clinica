package com.clinica.dto.payment;

import com.clinica.model.payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull @Positive BigDecimal amount,
        @NotNull PaymentMethod method) {
}

package com.clinica.dto.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull @DecimalMin("0.0") BigDecimal amount,
        @NotNull String method) {
}

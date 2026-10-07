package com.clinica.dto.payment.paymongo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Minimal response DTO for POST /v1/checkout_sessions.
 *
 * We only need checkout_url to redirect the user; all other fields are ignored.
 * @JsonIgnoreProperties(ignoreUnknown = true) protects against PayMongo adding new fields.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CheckoutSessionResponse(Data data) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(String id, Attributes attributes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Attributes(
            @JsonProperty("checkout_url") String checkoutUrl,
            @JsonProperty("status") String status,
            @JsonProperty("reference_number") String referenceNumber
    ) {}

    /** Convenience accessor for the hosted checkout URL. */
    public String checkoutUrl() {
        if (data == null || data.attributes() == null) return null;
        return data.attributes().checkoutUrl();
    }

    /** Checkout session ID (cs_xxx). */
    public String sessionId() {
        if (data == null) return null;
        return data.id();
    }
}

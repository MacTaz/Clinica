package com.clinica.dto.payment.paymongo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Payload for PayMongo webhook events (POST /api/webhooks/paymongo).
 *
 * PayMongo wraps webhook events under data.attributes. For checkout session events:
 *   data.attributes.type = "checkout_session.payment.paid"
 *   data.attributes.data = the full checkout session object
 *     .attributes.payments[0] = the Payment object
 *     .attributes.metadata.appointment_id = our Clinica appointment ID
 *
 * All unknown fields are ignored for forward-compatibility.
 *
 * Reference: https://developers.paymongo.com/docs/webhooks
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PayMongoWebhookPayload(Data data) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(String id, Attributes attributes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Attributes(
            String type,                 // e.g. "checkout_session.payment.paid"
            @JsonProperty("data") CheckoutSessionData data
    ) {}

    // The inner checkout session object within the webhook event
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CheckoutSessionData(
            String id,
            @JsonProperty("attributes") CheckoutSessionAttributes attributes
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CheckoutSessionAttributes(
            List<PaymentEntry> payments,
            Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaymentEntry(
            String id,                             // pay_xxx — the payment ID
            @JsonProperty("attributes") PaymentAttributes attributes
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaymentAttributes(
            long amount,                           // centavos
            String currency,
            String status,
            Source source
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Source(
            String type,                           // "card", "gcash", "paymaya"
            @JsonProperty("last4") String last4    // card last 4 digits; null for wallets
    ) {}

    // ── Convenience accessors ────────────────────────────────────────────────

    /** The event type string, e.g. "checkout_session.payment.paid". */
    public String eventType() {
        if (data == null || data.attributes() == null) return null;
        return data.attributes().type();
    }

    /** The first payment entry inside the checkout session. */
    public PaymentEntry firstPayment() {
        if (data == null || data.attributes() == null) return null;
        CheckoutSessionData cs = data.attributes().data();
        if (cs == null || cs.attributes() == null) return null;
        List<PaymentEntry> payments = cs.attributes().payments();
        return (payments != null && !payments.isEmpty()) ? payments.get(0) : null;
    }

    /** The metadata map attached when the checkout session was created. */
    public Map<String, Object> metadata() {
        if (data == null || data.attributes() == null) return null;
        CheckoutSessionData cs = data.attributes().data();
        if (cs == null || cs.attributes() == null) return null;
        return cs.attributes().metadata();
    }

    /** Extracts appointment_id from metadata. */
    public Long appointmentId() {
        Map<String, Object> meta = metadata();
        if (meta == null) return null;
        Object val = meta.get("appointment_id");
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) return Long.parseLong(s);
        return null;
    }
}

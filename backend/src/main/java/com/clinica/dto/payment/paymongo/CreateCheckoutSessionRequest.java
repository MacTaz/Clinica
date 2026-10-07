package com.clinica.dto.payment.paymongo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Request body for POST /v1/checkout_sessions.
 *
 * PayMongo wraps all request/response data under a "data" → "attributes" envelope.
 * Amount is in centavos (PHP 1.00 = 100 centavos).
 *
 * Reference: https://developers.paymongo.com/reference/create-a-checkout
 */
public record CreateCheckoutSessionRequest(Data data) {

    public record Data(String type, Attributes attributes) {}

    public record Attributes(
            @JsonProperty("billing") Billing billing,
            @JsonProperty("cancel_url") String cancelUrl,
            @JsonProperty("description") String description,
            @JsonProperty("line_items") List<LineItem> lineItems,
            @JsonProperty("payment_method_types") List<String> paymentMethodTypes,
            @JsonProperty("success_url") String successUrl,
            @JsonProperty("metadata") Map<String, Object> metadata
    ) {}

    public record Billing(String email, String name, String phone) {}

    public record LineItem(
            @JsonProperty("amount") long amount,      // centavos
            @JsonProperty("currency") String currency, // "PHP"
            @JsonProperty("name") String name,
            @JsonProperty("quantity") int quantity
    ) {}

    /**
     * Factory method — builds the full request envelope ready to POST.
     *
     * @param amountInCentavos  PHP amount × 100
     * @param description       Short text shown on checkout page
     * @param appointmentId     Injected into metadata so the webhook knows which appointment paid
     * @param successUrl        Redirect after successful payment
     * @param cancelUrl         Redirect after cancelled/expired payment
     */
    public static CreateCheckoutSessionRequest of(
            long amountInCentavos,
            String description,
            Long appointmentId,
            String successUrl,
            String cancelUrl) {

        Billing billing = new Billing(null, null, null);
        LineItem item = new LineItem(amountInCentavos, "PHP", description, 1);
        Map<String, Object> metadata = Map.of("appointment_id", appointmentId);

        Attributes attrs = new Attributes(
                billing,
                cancelUrl,
                description,
                List.of(item),
                List.of("card", "gcash", "paymaya"),
                successUrl,
                metadata
        );

        return new CreateCheckoutSessionRequest(new Data("checkout_session", attrs));
    }
}

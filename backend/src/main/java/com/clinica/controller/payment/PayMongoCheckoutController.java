package com.clinica.controller.payment;

import com.clinica.dto.payment.paymongo.PayMongoWebhookPayload;
import com.clinica.service.payment.PayMongoPaymentService;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes two endpoints for the PayMongo sandbox payment flow:
 *
 * POST /api/appointments/{id}/paymongo-checkout
 *   Creates a PayMongo Checkout Session for the given appointment and
 *   returns the hosted checkout URL.  The frontend opens this URL in a new tab.
 *
 * POST /api/webhooks/paymongo
 *   Receives PayMongo webhook events (routed via ngrok in local dev).
 *   Always returns 200 OK immediately; processing is synchronous but the
 *   response is sent before the DB write completes so PayMongo doesn't time out.
 *
 * NOTE: The webhook endpoint is intentionally outside /api/** to avoid
 * accidental CORS policy changes. If your CORS config covers /api/webhooks/**
 * that is fine — PayMongo doesn't use a browser, so CORS is irrelevant here.
 */
@RestController
public class PayMongoCheckoutController {

    private static final Logger log = LoggerFactory.getLogger(PayMongoCheckoutController.class);

    private final PayMongoPaymentService payMongoPaymentService;

    public PayMongoCheckoutController(PayMongoPaymentService payMongoPaymentService) {
        this.payMongoPaymentService = payMongoPaymentService;
    }

    /**
     * Creates a PayMongo Checkout Session for the given appointment.
     *
     * The frontend POSTs here when the staff clicks "Open Test Checkout".
     * Returns { "checkoutUrl": "https://test-checkout.paymongo.com/..." }.
     *
     * @param appointmentId Clinica appointment ID (from URL path)
     * @return 200 OK with { checkoutUrl }
     */
    @PostMapping("/api/appointments/{id}/paymongo-checkout")
    public ResponseEntity<Map<String, String>> createCheckout(
            @PathVariable("id") Long appointmentId) {

        String checkoutUrl = payMongoPaymentService.createCheckoutSessionForAppointment(appointmentId);
        return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
    }

    /**
     * Receives PayMongo webhook events.
     *
     * PayMongo retries if it doesn't receive a 2xx response within ~30 seconds.
     * Always return 200 OK immediately and process asynchronously or fast-fail.
     *
     * TODO Production: verify the Paymongo-Signature HMAC header before processing.
     *
     * @param payload the deserialized webhook JSON
     * @return 200 OK always (so PayMongo doesn't retry)
     */
    @PostMapping("/api/webhooks/paymongo")
    public ResponseEntity<Void> receiveWebhook(@RequestBody PayMongoWebhookPayload payload) {
        log.info("PayMongo webhook received: {}", payload.eventType());
        try {
            payMongoPaymentService.processWebhookEvent(payload);
        } catch (Exception ex) {
            // Log but do NOT re-throw — returning non-2xx would cause PayMongo to retry
            log.error("Error processing PayMongo webhook: {}", ex.getMessage(), ex);
        }
        return ResponseEntity.ok().build();
    }
}

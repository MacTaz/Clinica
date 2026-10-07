package com.clinica.client.paymongo;

import com.clinica.dto.payment.paymongo.CheckoutSessionResponse;
import com.clinica.dto.payment.paymongo.CreateCheckoutSessionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Thin HTTP client for the PayMongo REST API.
 *
 * Communicates with https://api.paymongo.com/v1 via the pre-configured
 * {@link RestClient} bean ({@link com.clinica.config.PayMongoConfig}).
 *
 * Only the endpoints needed for the Checkout Sessions sandbox flow are
 * implemented here. Add more methods (Payment Intents, Sources, etc.) as needed.
 */
@Component
public class PayMongoRestClient {

    private static final Logger log = LoggerFactory.getLogger(PayMongoRestClient.class);

    private final RestClient restClient;

    @Value("${paymongo.success-url}")
    private String successUrl;

    @Value("${paymongo.cancel-url}")
    private String cancelUrl;

    public PayMongoRestClient(@Qualifier("payMongoHttpClient") RestClient payMongoHttpClient) {
        this.restClient = payMongoHttpClient;
    }

    /**
     * Creates a PayMongo hosted Checkout Session.
     *
     * @param amountInCentavos  PHP amount × 100 (e.g. ₱500.00 → 50000)
     * @param description       Text shown on the checkout page ("Clinic Appointment #42")
     * @param appointmentId     Clinica appointment ID injected as metadata for webhook routing
     * @return the checkout session response containing the hosted checkout URL
     */
    public CheckoutSessionResponse createCheckoutSession(long amountInCentavos,
            String description, Long appointmentId) {

        CreateCheckoutSessionRequest request = CreateCheckoutSessionRequest.of(
                amountInCentavos, description, appointmentId, successUrl, cancelUrl);

        log.info("Creating PayMongo checkout session for appointment {} — amount: {} centavos",
                appointmentId, amountInCentavos);

        try {
            CheckoutSessionResponse response = restClient
                    .post()
                    .uri("/checkout_sessions")
                    .body(request)
                    .retrieve()
                    .body(CheckoutSessionResponse.class);

            log.info("PayMongo checkout session created: {} → {}",
                    response != null ? response.sessionId() : "null",
                    response != null ? response.checkoutUrl() : "null");

            return response;
        } catch (RestClientException ex) {
            log.error("PayMongo API error creating checkout session: {}", ex.getMessage());
            throw new RuntimeException("PayMongo checkout session creation failed: " + ex.getMessage(), ex);
        }
    }
}

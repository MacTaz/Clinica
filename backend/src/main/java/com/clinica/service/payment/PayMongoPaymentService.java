package com.clinica.service.payment;

import com.clinica.client.paymongo.PayMongoRestClient;
import com.clinica.dto.payment.PaymentResponse;
import com.clinica.dto.payment.paymongo.CheckoutSessionResponse;
import com.clinica.dto.payment.paymongo.PayMongoWebhookPayload;
import com.clinica.exception.InvalidRecordDataException;
import com.clinica.exception.ResourceInUseException;
import com.clinica.exception.ResourceNotFoundException;
import com.clinica.model.payment.PaymentMethod;
import com.clinica.repository.appointment.AppointmentRepository;
import com.clinica.repository.payment.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates the PayMongo sandbox Checkout Session flow:
 * <ol>
 *   <li>Staff clicks "Pay Online (Sandbox)" → createCheckoutSession() is called</li>
 *   <li>Returns the hosted checkout URL; frontend redirects the patient there</li>
 *   <li>Patient completes the mock payment on PayMongo's sandbox checkout page</li>
 *   <li>PayMongo POSTs a webhook to /api/webhooks/paymongo → processWebhookEvent() is called</li>
 *   <li>Service delegates to PaymentService to persist the payment record</li>
 * </ol>
 */
@Service
@Transactional
public class PayMongoPaymentService {

    private static final Logger log = LoggerFactory.getLogger(PayMongoPaymentService.class);
    private static final String GATEWAY_NAME = "PAYMONGO_SANDBOX";
    private static final String EVENT_PAYMENT_PAID = "checkout_session.payment.paid";

    private final PayMongoRestClient payMongoRestClient;
    private final PaymentService paymentService;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;

    public PayMongoPaymentService(PayMongoRestClient payMongoRestClient,
            PaymentService paymentService,
            AppointmentRepository appointmentRepository,
            PaymentRepository paymentRepository) {
        this.payMongoRestClient = payMongoRestClient;
        this.paymentService = paymentService;
        this.appointmentRepository = appointmentRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Creates a PayMongo Checkout Session for the given appointment and returns
     * the hosted checkout URL that the frontend will open in a new tab.
     *
     * Validations:
     * - Appointment must exist
     * - Appointment must be COMPLETED (same rule as manual payment recording)
     * - No payment must already exist for this appointment
     *
     * @param appointmentId Clinica appointment ID
     * @return the hosted PayMongo checkout URL
     */
    public String createCheckoutSessionForAppointment(Long appointmentId) {
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // Same pre-condition as manual payment recording
        if (appointment.getStatus().name().equals("PAID")) {
            throw new ResourceInUseException("Payment already recorded for appointment: " + appointmentId);
        }
        if (!appointment.getStatus().name().equals("COMPLETED")) {
            throw new InvalidRecordDataException(
                    "Appointment must be COMPLETED before an online checkout can be created. Current status: "
                    + appointment.getStatus());
        }

        if (paymentRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new ResourceInUseException("Payment already exists for appointment: " + appointmentId);
        }

        // Use consultation fee if available, otherwise fall back to a standard amount
        // PayMongo amounts are in centavos (PHP 1.00 = 100 centavos)
        long amountInCentavos = 50000L; // default ₱500.00 — override with actual fee when available
        String description = "Clinic Appointment #" + appointmentId;
        if (appointment.getDoctor() != null) {
            description += " with Dr. " + appointment.getDoctor().getName();
        }

        CheckoutSessionResponse response = payMongoRestClient.createCheckoutSession(
                amountInCentavos, description, appointmentId);

        if (response == null || response.checkoutUrl() == null) {
            throw new RuntimeException("PayMongo did not return a checkout URL — check your secret key and account status.");
        }

        log.info("PayMongo checkout URL created for appointment {}: {}", appointmentId, response.checkoutUrl());
        return response.checkoutUrl();
    }

    /**
     * Processes an incoming PayMongo webhook event.
     *
     * Only handles checkout_session.payment.paid — all other event types are
     * acknowledged with 200 OK but not processed.
     *
     * Idempotent: delegates to PaymentService.recordGatewayPayment() which
     * checks for an existing gateway_reference before inserting.
     *
     * @param payload the deserialized webhook payload
     */
    @Transactional
    public void processWebhookEvent(PayMongoWebhookPayload payload) {
        String eventType = payload.eventType();
        log.info("Received PayMongo webhook: {}", eventType);

        if (!EVENT_PAYMENT_PAID.equals(eventType)) {
            log.debug("Ignoring PayMongo event type: {}", eventType);
            return;
        }

        PayMongoWebhookPayload.PaymentEntry payment = payload.firstPayment();
        if (payment == null) {
            log.warn("PayMongo webhook missing payment data — skipping");
            return;
        }

        Long appointmentId = payload.appointmentId();
        if (appointmentId == null) {
            log.warn("PayMongo webhook metadata missing appointment_id — skipping");
            return;
        }

        // Convert centavos → PHP
        BigDecimal amountPhp = BigDecimal.valueOf(payment.attributes().amount())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        String sourceType = payment.attributes().source() != null
                ? payment.attributes().source().type() : "card";
        String cardLast4 = payment.attributes().source() != null
                ? payment.attributes().source().last4() : null;

        PaymentMethod method = switch (sourceType) {
            case "gcash", "paymaya" -> PaymentMethod.GCASH;
            default -> PaymentMethod.CARD;
        };

        log.info("Processing PayMongo payment {} for appointment {} — method: {}, amount: ₱{}",
                payment.id(), appointmentId, method, amountPhp);

        try {
            PaymentResponse saved = paymentService.recordGatewayPayment(
                    appointmentId, amountPhp, method, GATEWAY_NAME, payment.id(), cardLast4);
            log.info("Gateway payment recorded successfully: payment ID {}", saved.id());
        } catch (ResourceInUseException e) {
            // Payment already recorded (duplicate webhook) — not an error
            log.info("Duplicate webhook for appointment {} — payment already recorded", appointmentId);
        }
    }
}

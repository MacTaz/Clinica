package com.clinica.model.payment;

import com.clinica.model.appointment.Appointment;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PaymentStatus status = PaymentStatus.UNPAID;

    private LocalDateTime paidAt;

    // Method-specific details: only the fields for the payment's method are set (see schema.sql)
    @Column(name = "received_by", length = 100)
    private String receivedBy; // CASH

    @Column(name = "card_last4", length = 4)
    private String cardLast4; // CARD: last 4 digits only, never the full card number

    @Column(name = "approval_code", length = 12)
    private String approvalCode; // CARD: from the POS terminal receipt

    @Column(name = "gcash_reference", length = 13)
    private String gcashReference; // GCASH

    @Column(name = "installment_months")
    private Integer installmentMonths; // CARD >= 10,000.00 only: 3, 6 or 12; null = straight payment

    public void markPaid(PaymentMethod method) {
        this.method = method;
        this.status = PaymentStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public PaymentMethod getMethod() { return method; }
    public PaymentStatus getStatus() { return status; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }
    public String getApprovalCode() { return approvalCode; }
    public void setApprovalCode(String approvalCode) { this.approvalCode = approvalCode; }
    public String getGcashReference() { return gcashReference; }
    public void setGcashReference(String gcashReference) { this.gcashReference = gcashReference; }
    public Integer getInstallmentMonths() { return installmentMonths; }
    public void setInstallmentMonths(Integer installmentMonths) { this.installmentMonths = installmentMonths; }
}

import { useEffect, useState } from "react";
import { getAppointments } from "../../api/appointments.js";
import { getPayments, recordPayment, createOnlineCheckout } from "../../api/payments.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const PAYMENT_METHODS = ["CASH", "CARD", "GCASH", "INSURANCE"];

// Method-specific fields; only the selected method's fields are sent (others must be null)
const EMPTY_DETAILS = { receivedBy: "", cardLast4: "", approvalCode: "", gcashReference: "" };

// Card installments (bank pays the clinic in full): CARD payments of at least 10,000.00 only
const INSTALLMENT_MIN_AMOUNT = 10000;
const INSTALLMENT_TERMS = [3, 6, 12];

const formatAmount = (amount) =>
  `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDetails = (p) => {
  if (p.gatewayName) {
    const gatewayLabel = p.gatewayName === "PAYMONGO_SANDBOX" ? "🧪 PayMongo Sandbox" : p.gatewayName;
    const ref = p.gatewayReference ? ` · ${p.gatewayReference}` : "";
    return `${gatewayLabel}${ref}`;
  }
  if (p.method === "CASH" && p.receivedBy) return `Received by: ${p.receivedBy}`;
  if (p.method === "CARD" && p.cardLast4) {
    const term = p.installmentMonths ? `, ${p.installmentMonths}-month installment` : "";
    return `Card ••••${p.cardLast4}, Approval: ${p.approvalCode}${term}`;
  }
  if (p.method === "GCASH" && p.gcashReference) return `Ref: ${p.gcashReference}`;
  if (p.method === "INSURANCE" && p.approvalCode) return `Claim/Auth: ${p.approvalCode}`;
  return "—";
};

export default function PaymentsScreen() {
  const [appointments, setAppointments] = useState(null);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);

  // Record Payment form state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [installmentMonths, setInstallmentMonths] = useState(""); // "" = Straight
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // PayMongo sandbox state
  const [onlineApptId, setOnlineApptId] = useState("");
  const [onlineSubmitting, setOnlineSubmitting] = useState(false);
  const [onlineError, setOnlineError] = useState(null);
  const [onlineBannerMsg, setOnlineBannerMsg] = useState(null);

  const fetchAllData = () => {
    Promise.all([getAppointments(), getPayments()])
      .then(([appts, pays]) => {
        setAppointments(appts);
        setPayments(pays);
        setError(null);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Payment term only applies to CARD payments of at least 10,000; otherwise reset to Straight
  const installmentAvailable = method === "CARD" && Number(amount) >= INSTALLMENT_MIN_AMOUNT;
  useEffect(() => {
    if (!installmentAvailable) setInstallmentMonths("");
  }, [installmentAvailable]);

  const setDetail = (field) => (e) => setDetails((d) => ({ ...d, [field]: e.target.value }));

  const handleMethodChange = (e) => {
    setMethod(e.target.value);
    setDetails(EMPTY_DETAILS); // Don't carry another method's fields over
  };

  const buildMethodDetails = () => {
    const receivedBy = details.receivedBy.trim();
    const cardLast4 = details.cardLast4.trim();
    const approvalCode = details.approvalCode.trim();
    const gcashReference = details.gcashReference.trim();

    if (method === "CASH") {
      if (!receivedBy) return { error: "Please enter who received the cash." };
      return { receivedBy };
    }
    if (method === "CARD") {
      if (!/^\d{4}$/.test(cardLast4)) return { error: "Card last 4 digits must be exactly 4 digits." };
      if (!/^[A-Za-z0-9]{1,12}$/.test(approvalCode)) return { error: "Approval code must be 1 to 12 letters or digits." };
      return { cardLast4, approvalCode };
    }
    if (method === "GCASH") {
      if (!/^\d{13}$/.test(gcashReference)) return { error: "GCash reference number must be exactly 13 digits." };
      return { gcashReference };
    }
    if (method === "INSURANCE") {
      if (!approvalCode) return { error: "Please enter the insurance claim or approval reference code." };
      return { approvalCode };
    }
    return {};
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedAppointmentId) {
      setFormError("Please select an appointment.");
      return;
    }
    if (!(Number(amount) > 0)) {
      setFormError("Amount must be greater than 0.");
      return;
    }
    const { error: detailsError, ...methodDetails } = buildMethodDetails();
    if (detailsError) {
      setFormError(detailsError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await recordPayment(parseInt(selectedAppointmentId, 10), {
        amount: Number(amount),
        method, // CASH / CARD / GCASH / INSURANCE
        ...methodDetails,
        ...(installmentAvailable && installmentMonths ? { installmentMonths: Number(installmentMonths) } : {}),
      });
      setSelectedAppointmentId("");
      setAmount("");
      setMethod(PAYMENT_METHODS[0]);
      setDetails(EMPTY_DETAILS);
      setInstallmentMonths("");
      fetchAllData();
    } catch (err) {
      setFormError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && (!appointments || !payments)) return <ErrorBanner message={error} />;
  if (!appointments || !payments) return <LoadingSpinner />;

  // One payment per appointment — only COMPLETED appointments without a payment can be selected
  const paidAppointmentIds = new Set(payments.map((p) => p.appointmentId));
  const unpaidAppointments = appointments.filter(
    (a) => a.status === "COMPLETED" && !paidAppointmentIds.has(a.id)
  );
  const hasUnpaidAppointment = unpaidAppointments.length > 0;

  // Submit is enabled once required fields are filled; formats are checked on submit so errors are shown
  const methodFieldsFilled = {
    CASH: details.receivedBy.trim() !== "",
    CARD: details.cardLast4.trim() !== "" && details.approvalCode.trim() !== "",
    GCASH: details.gcashReference.trim() !== "",
    INSURANCE: details.approvalCode.trim() !== "",
  }[method];
  const canSubmit = selectedAppointmentId !== "" && Number(amount) > 0 && methodFieldsFilled;

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Payments</h2>
          <p className="section-subtext">Record appointment payments, process insurance claims, and review payment history.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Record Payment */}
      <div className="dash-card">
        <h3 className="dash-card-title">Record Payment</h3>

        {formError && <ErrorBanner message={formError} />}

        <form onSubmit={handleRecordPayment} className="form-layout">
          <div className="form-group">
            <label>Appointment *</label>
            <select
              value={selectedAppointmentId}
              onChange={(e) => {
                const apptId = e.target.value;
                setSelectedAppointmentId(apptId);
                if (apptId) {
                  const appt = appointments.find((a) => String(a.id) === String(apptId));
                  if (appt && appt.paymentMethod && PAYMENT_METHODS.includes(appt.paymentMethod)) {
                    setMethod(appt.paymentMethod);
                    setDetails(EMPTY_DETAILS);
                  }
                }
              }}
            >
              {hasUnpaidAppointment ? (
                <>
                  <option value="">Select an appointment...</option>
                  {unpaidAppointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.patient?.name} with {a.doctor?.name}, {a.appointmentDate}{" "}
                      {a.startTime?.substring(0, 5)}{a.paymentMethod ? ` [Set: ${a.paymentMethod}]` : ""}
                    </option>
                  ))}
                </>
              ) : (
                <option value="" disabled>
                  No unpaid appointments
                </option>
              )}
            </select>
            {!hasUnpaidAppointment && (
              <small className="section-subtext">
                No completed appointments awaiting payment. Mark an appointment as <strong>Done</strong> in the Appointments tab first.
              </small>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₱) *</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 800.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select value={method} onChange={handleMethodChange}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m === "INSURANCE" ? "INSURANCE (Health Insurance Claim)" : m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {method === "CASH" && (
            <div className="form-group">
              <label>Received by *</label>
              <input
                required
                type="text"
                maxLength={100}
                placeholder="Staff name, e.g. Ana"
                value={details.receivedBy}
                onChange={setDetail("receivedBy")}
              />
            </div>
          )}

          {method === "CARD" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Card last 4 digits *</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="\d{4}"
                    title="Exactly 4 digits: the last 4 of the card only"
                    placeholder="e.g. 1234"
                    value={details.cardLast4}
                    onChange={setDetail("cardLast4")}
                  />
                </div>

                <div className="form-group">
                  <label>Approval code *</label>
                  <input
                    required
                    type="text"
                    autoComplete="off"
                    pattern="[A-Za-z0-9]{1,12}"
                    title="1 to 12 letters or digits"
                    placeholder="From the POS terminal receipt"
                    value={details.approvalCode}
                    onChange={setDetail("approvalCode")}
                  />
                </div>
              </div>
              <small className="section-subtext">Never enter the full card number — only the last 4 digits are recorded.</small>

              {installmentAvailable && (
                <div className="form-group">
                  <label>Payment term</label>
                  <select value={installmentMonths} onChange={(e) => setInstallmentMonths(e.target.value)}>
                    <option value="">Straight</option>
                    {INSTALLMENT_TERMS.map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {method === "GCASH" && (
            <div className="form-group">
              <label>GCash reference number *</label>
              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="off"
                pattern="\d{13}"
                title="Exactly 13 digits"
                placeholder="13-digit reference from the GCash receipt"
                value={details.gcashReference}
                onChange={setDetail("gcashReference")}
              />
            </div>
          )}

          {method === "INSURANCE" && (
            <div className="form-group">
              <label>Insurance Claim / Approval Reference Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. PHIL-CLAIM-98234 or Insurance Approval #"
                value={details.approvalCode}
                onChange={setDetail("approvalCode")}
              />
              <small className="section-subtext">Authorization, LOA, or claim reference number from the insurance provider.</small>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting || !canSubmit}
            >
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>

      {/* PayMongo Sandbox Online Payment */}
      <div className="dash-card">
        <h3 className="dash-card-title">
          💳 Online Payment
          <span style={{
            marginLeft: "10px",
            fontSize: "11px",
            fontWeight: 600,
            background: "#f59e0b",
            color: "#1c1917",
            padding: "2px 8px",
            borderRadius: "999px",
            verticalAlign: "middle",
            letterSpacing: "0.05em"
          }}>🧪 SANDBOX TEST MODE</span>
        </h3>
        <p className="section-subtext" style={{ marginBottom: "16px" }}>
          Launch a PayMongo hosted checkout page for test card / GCash mock payments.
          The payment will be automatically recorded once the customer completes checkout.
        </p>

        {onlineError && <ErrorBanner message={onlineError} />}

        {onlineBannerMsg && (
          <div style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "14px",
          }}>
            <strong style={{ color: "var(--text-primary, #f1f5f9)" }}>⏳ Waiting for payment confirmation</strong>
            <p style={{ margin: "4px 0 8px" }}>{onlineBannerMsg}</p>
            <button
              id="refresh-payments-btn"
              className="primary-btn"
              style={{ padding: "6px 14px", fontSize: "13px" }}
              onClick={() => { fetchAllData(); setOnlineBannerMsg(null); }}
            >
              🔄 Refresh Payments List
            </button>
          </div>
        )}

        <div className="form-layout">
          <div className="form-group">
            <label>Appointment *</label>
            <select
              id="online-checkout-appointment-select"
              value={onlineApptId}
              onChange={(e) => { setOnlineApptId(e.target.value); setOnlineError(null); setOnlineBannerMsg(null); }}
            >
              {hasUnpaidAppointment ? (
                <>
                  <option value="">Select an appointment...</option>
                  {unpaidAppointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.patient?.name} with {a.doctor?.name}, {a.appointmentDate}{" "}
                      {a.startTime?.substring(0, 5)}
                    </option>
                  ))}
                </>
              ) : (
                <option value="" disabled>No completed appointments awaiting payment</option>
              )}
            </select>
          </div>

          {onlineApptId && (() => {
            const appt = appointments.find((a) => String(a.id) === String(onlineApptId));
            return appt ? (
              <div style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "4px",
                fontSize: "14px",
                color: "var(--text-secondary, #94a3b8)",
              }}>
                <div><strong style={{ color: "var(--text-primary, #f1f5f9)" }}>Patient:</strong> {appt.patient?.name}</div>
                <div><strong style={{ color: "var(--text-primary, #f1f5f9)" }}>Doctor:</strong> {appt.doctor?.name}</div>
                <div><strong style={{ color: "var(--text-primary, #f1f5f9)" }}>Date:</strong> {appt.appointmentDate} at {appt.startTime?.substring(0, 5)}</div>
                <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
                  Use test card <code>4242 4242 4242 4242</code> (any expiry/CVV) or GCash mock on the PayMongo sandbox page.
                </div>
              </div>
            ) : null;
          })()}

          <div className="modal-actions">
            <button
              id="open-online-checkout-btn"
              className="primary-btn"
              disabled={!onlineApptId || onlineSubmitting}
              onClick={async () => {
                if (!onlineApptId) return;
                setOnlineSubmitting(true);
                setOnlineError(null);
                setOnlineBannerMsg(null);
                try {
                  const { checkoutUrl } = await createOnlineCheckout(parseInt(onlineApptId, 10));
                  window.open(checkoutUrl, "_blank", "noopener,noreferrer");
                  setOnlineBannerMsg(
                    "Complete the payment in the opened tab. Once done, click \"Refresh Payments List\" below to see the updated status."
                  );
                } catch (err) {
                  setOnlineError(err.message || "Failed to create checkout session.");
                } finally {
                  setOnlineSubmitting(false);
                }
              }}
            >
              {onlineSubmitting ? "Creating checkout..." : "🔗 Open Test Checkout"}
            </button>
          </div>
        </div>
      </div>

      {/* Payments History — collapsed by default */}
      <details className="dash-card collapsible-card">
        <summary className="dash-card-title">Payments History ({payments.length})</summary>

        {payments.length === 0 ? (
          <p className="empty-notice">No payments recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Details</th>
                  <th style={{ width: "100px", minWidth: "100px" }}>Status</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.appointmentId}</td>
                    <td>{formatAmount(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{formatDetails(p)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className={`payment-badge ${p.status === "PAID" ? "paid" : "unpaid"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}

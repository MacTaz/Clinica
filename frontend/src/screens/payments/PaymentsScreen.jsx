import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getAppointments } from "../../api/appointments.js";
import { getPayments, recordPayment } from "../../api/payments.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const PAYMENT_METHODS = ["CASH", "CARD", "GCASH"];

// Method-specific fields; only the selected method's fields are sent (others must be null)
const EMPTY_DETAILS = { receivedBy: "", cardLast4: "", approvalCode: "", gcashReference: "" };

const formatAmount = (amount) =>
  `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDetails = (p) => {
  if (p.method === "CASH" && p.receivedBy) return `Received by: ${p.receivedBy}`;
  if (p.method === "CARD" && p.cardLast4) return `Card ••••${p.cardLast4}, Approval: ${p.approvalCode}`;
  if (p.method === "GCASH" && p.gcashReference) return `Ref: ${p.gcashReference}`;
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

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
    if (!/^\d{13}$/.test(gcashReference)) return { error: "GCash reference number must be exactly 13 digits." };
    return { gcashReference };
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
        method, // Already uppercase: CASH / CARD / GCASH
        ...methodDetails,
      });
      setSelectedAppointmentId("");
      setAmount("");
      setMethod(PAYMENT_METHODS[0]);
      setDetails(EMPTY_DETAILS);
      fetchAllData();
    } catch (err) {
      setFormError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && (!appointments || !payments)) return <ErrorBanner message={error} />;
  if (!appointments || !payments) return <LoadingSpinner />;

  // One payment per appointment — only appointments without a payment can be selected
  const paidAppointmentIds = new Set(payments.map((p) => p.appointmentId));
  const unpaidAppointments = appointments.filter((a) => !paidAppointmentIds.has(a.id));
  const hasUnpaidAppointment = unpaidAppointments.length > 0;

  // Demo-only GCash QR: encodes a fake string, not a real payment request
  const qrReady = selectedAppointmentId && Number(amount) > 0;
  const qrValue = `CLINICA|appt=${selectedAppointmentId}|amount=${Number(amount).toFixed(2)}`;

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Payments</h2>
          <p className="section-subtext">Record appointment payments and review the payment history.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Record Payment */}
      <div className="dash-card">
        <h3 className="dash-card-title">Record Payment</h3>

        {formError && <ErrorBanner message={formError} />}

        <form onSubmit={handleRecordPayment} className="form-layout">
          {!hasUnpaidAppointment ? (
            <p className="empty-notice">
              {appointments.length === 0
                ? "No appointments yet. Book one in the Appointments tab to record a payment."
                : "All appointments are already paid. Book a new appointment to record a payment."}
            </p>
          ) : (
            <>
              {/* Placeholder appointment picker — to be replaced by Mico's appointment picker */}
              <div className="form-group">
                <label>Appointment *</label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                >
                  <option value="">Select an appointment...</option>
                  {unpaidAppointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.patient?.name} with {a.doctor?.name}, {a.appointmentDate}{" "}
                      {a.startTime?.substring(0, 5)}
                    </option>
                  ))}
                </select>
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
                        {m}
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
                      {/* No maxLength: truncating a pasted card number would keep its FIRST 4 digits */}
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
                </>
              )}

              {method === "GCASH" && (
                <>
                  <div className="form-group">
                    <label>Sample QR - demo only, not a real payment</label>
                    {qrReady ? (
                      <QRCodeSVG value={qrValue} size={160} />
                    ) : (
                      <p className="empty-notice">Select an appointment and enter an amount to show the sample QR.</p>
                    )}
                  </div>

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
                </>
              )}
            </>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting || !hasUnpaidAppointment || !selectedAppointmentId || !amount}
            >
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
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
                  <th>Status</th>
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
                    <td>
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

import { useEffect, useState } from "react";
import { getAppointments } from "../../api/appointments.js";
import { getPayments, recordPayment } from "../../api/payments.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const PAYMENT_METHODS = ["CASH", "CARD", "GCASH"];

const formatAmount = (amount) =>
  `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsScreen() {
  const [appointments, setAppointments] = useState(null);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);

  // Record Payment form state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
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

    try {
      setSubmitting(true);
      setFormError(null);
      await recordPayment(parseInt(selectedAppointmentId, 10), {
        amount: Number(amount),
        method, // Already uppercase: CASH / CARD / GCASH
      });
      setSelectedAppointmentId("");
      setAmount("");
      setMethod(PAYMENT_METHODS[0]);
      fetchAllData();
    } catch (err) {
      setFormError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && (!appointments || !payments)) return <ErrorBanner message={error} />;
  if (!appointments || !payments) return <LoadingSpinner />;

  // One payment per appointment — already-paid appointments are listed but disabled
  const paidAppointmentIds = new Set(payments.map((p) => p.appointmentId));
  const hasUnpaidAppointment = appointments.some((a) => !paidAppointmentIds.has(a.id));

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
                  {appointments.map((a) => {
                    const paid = paidAppointmentIds.has(a.id);
                    return (
                      <option key={a.id} value={a.id} disabled={paid}>
                        #{a.id} — {a.patient?.name} with {a.doctor?.name}, {a.appointmentDate}{" "}
                        {a.startTime?.substring(0, 5)}
                        {paid ? " (paid)" : ""}
                      </option>
                    );
                  })}
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
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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

      {/* Payments History */}
      <div className="dash-card">
        <h3 className="dash-card-title">Payments History</h3>

        {payments.length === 0 ? (
          <p className="empty-notice">No payments recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Appointment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>#{p.appointmentId}</td>
                    <td>{formatAmount(p.amount)}</td>
                    <td>{p.method}</td>
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
      </div>
    </section>
  );
}

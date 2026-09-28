import { useEffect, useState } from "react";
import { getAppointments, cancelAppointment, completeAppointment, getAvailability, bookAppointment } from "../../api/appointments.js";
import { getPatients } from "../../api/patients.js";
import { getDoctors } from "../../api/doctors.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import { getDoctorScheduleStatus } from "../../utils/doctorStatus.js";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAYMENT_METHODS = ["CASH", "CARD", "GCASH", "INSURANCE"];

const STATUS_LABELS = {
  SCHEDULED: { label: "Scheduled", className: "status-scheduled" },
  COMPLETED: { label: "Completed", className: "status-completed" },
  PAID: { label: "Paid", className: "status-paid" },
};

/** Convert "HH:MM" or "HH:MM:SS" to "h:MM AM/PM" */
function formatTimeTo12h(timeStr) {
  if (!timeStr) return "--";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/** Format a date string "YYYY-MM-DD" to "MM/DD/YYYY" */
function formatDate(dateStr) {
  if (!dateStr) return "--";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}

/** Build a YYYY-MM-DD string from year/month/day (all numbers) */
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [bookingAilment, setBookingAilment] = useState("");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("CASH");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAllData = () => {
    Promise.all([
      getAppointments(),
      getPatients(),
      getDoctors(),
    ])
      .then(([appts, pats, docs]) => {
        setAppointments(appts);
        setPatients(pats);
        setDoctors(docs);
        if (pats.length > 0 && !selectedPatientId) setSelectedPatientId(String(pats[0].id));
      })
      .catch((err) => setError(err.message));
  };

  // Lightweight refresh — only appointments change after a book/cancel action.
  const refreshAppointments = () => {
    getAppointments()
      .then(setAppointments)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute selected day of week name
  const selectedDayOfWeekName = selectedDate
    ? DAYS_NAMES[new Date(selectedDate + "T00:00:00").getDay()]
    : "";

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  // Fetch slots whenever date changes in booking modal
  useEffect(() => {
    if (showModal && selectedDate) {
      setLoadingSlots(true);
      setBookingError(null);
      getAvailability(selectedDate)
        .then((uniqueDocs) => {
          // Filter out doctors whose schedule for the selected day is marked "Not Available"
          // in localStorage (set from the Doctor Schedules & Availability table).
          const selectedDayOfWeek = new Date(selectedDate + "T00:00:00").toLocaleString("en-US", { weekday: "long" }).toUpperCase();

          const availableDoctorsList = (uniqueDocs || []).filter((docAvail) => {
            // Find the full doctor record (which has schedule blocks with day/time info)
            const fullDoctor = doctors.find((d) => String(d.id) === String(docAvail.doctorId));
            if (!fullDoctor || !fullDoctor.schedules) return true; // no schedule data — let it through

            // If ANY schedule block for the selected day is explicitly "Not Available", hide this doctor
            for (let idx = 0; idx < fullDoctor.schedules.length; idx++) {
              const sched = fullDoctor.schedules[idx];
              if ((sched.dayOfWeek || "").toUpperCase() !== selectedDayOfWeek) continue;
              const status = getDoctorScheduleStatus(fullDoctor, sched, idx);
              if (status === "Not Available") return false;
            }
            return true;
          });

          setAvailableDoctors(availableDoctorsList);
          if (availableDoctorsList.length > 0) {
            // Find existing selected doctor or pick the first available doctor
            const currentDoc = availableDoctorsList.find((d) => String(d.doctorId) === String(selectedDoctorId));
            const activeDoc = currentDoc || availableDoctorsList[0];
            setSelectedDoctorId(String(activeDoc.doctorId));

            if (activeDoc.freeSlots && activeDoc.freeSlots.length > 0) {
              const firstSlot = activeDoc.freeSlots[0];
              setSelectedSlot(typeof firstSlot === "string" ? firstSlot.substring(0, 5) : String(firstSlot));
            } else {
              setSelectedSlot("");
            }
          } else {
            setSelectedDoctorId("");
            setSelectedSlot("");
          }
        })
        .catch(() => {
          setAvailableDoctors([]);
          setSelectedDoctorId("");
          setSelectedSlot("");
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [showModal, selectedDate, doctors]);

  const handleOpenModal = () => {
    setBookingError(null);
    setPatientSearch("");
    setBookingAilment("");
    let initialPatientId = selectedPatientId;
    if (patients.length > 0 && !initialPatientId) {
      initialPatientId = String(patients[0].id);
      setSelectedPatientId(initialPatientId);
    }
    const pat = patients.find((p) => String(p.id) === String(initialPatientId));
    setBookingPaymentMethod(pat?.insuranceProvider ? "INSURANCE" : "CASH");
    setShowModal(true);
  };

  const handleBookAppointment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedPatientId) {
      setBookingError("Please select a registered patient.");
      return;
    }
    if (!bookingAilment.trim()) {
      setBookingError("Please enter the patient's ailment or reason for this visit.");
      return;
    }
    if (!bookingPaymentMethod) {
      setBookingError("Please select a required payment method (Cash, Card, GCash, or Insurance).");
      return;
    }
    if (!selectedDate) {
      setBookingError("Please select an appointment date.");
      return;
    }
    if (!selectedDoctorId || availableDoctors.length === 0) {
      setBookingError(`No doctors are on duty on ${selectedDayOfWeekName} (${selectedDate}). Please choose a date matching doctor duty days.`);
      return;
    }
    if (!selectedSlot) {
      setBookingError("Please select an available 30-minute time slot chip.");
      return;
    }

    try {
      setSubmitting(true);
      setBookingError(null);
      await bookAppointment({
        patientId: parseInt(selectedPatientId, 10),
        doctorId: parseInt(selectedDoctorId, 10),
        appointmentDate: selectedDate,
        startTime: selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot,
        ailment: bookingAilment.trim(),
        paymentMethod: bookingPaymentMethod,
      });
      setShowModal(false);
      refreshAppointments();
    } catch (err) {
      setBookingError(err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm("Mark this appointment as completed? This will allow payment to be recorded.")) return;
    setCompletingId(id);
    try {
      await completeAppointment(id);
      refreshAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelingId(id);
    try {
      await cancelAppointment(id);
      refreshAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelingId(null);
    }
  };

  if (error && !appointments) return <ErrorBanner message={error} />;
  if (!appointments) return <LoadingSpinner />;

  const activeDoctorObj = availableDoctors.find((d) => String(d.doctorId) === String(selectedDoctorId));

  // Registered doctors with active schedules
  const scheduledDoctors = doctors.filter((d) => d.schedules && d.schedules.length > 0);

  // Filtered patients in modal search
  const filteredModalPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.contact && p.contact.toLowerCase().includes(q)) ||
      String(p.id).includes(q)
    );
  });

  const selectedPatientObj = patients.find((p) => String(p.id) === String(selectedPatientId));

  // Filtered appointments in table
  const filteredAppointments = appointments.filter((a) => {
    const q = searchTerm.toLowerCase();
    const pat = patientMap.get(a.patient?.id);
    return (
      (a.patient?.name && a.patient.name.toLowerCase().includes(q)) ||
      (a.doctor?.name && a.doctor.name.toLowerCase().includes(q)) ||
      (pat?.ailment && pat.ailment.toLowerCase().includes(q)) ||
      (a.appointmentDate && a.appointmentDate.includes(q))
    );
  });

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Appointments Schedule</h2>
          <p className="section-subtext">Search registered patients, assign ailments, select payment method, and schedule reservations.</p>
        </div>
        <button className="primary-btn" onClick={handleOpenModal}>
          + Add Appointment
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="dash-card">
        {/* Table Search Bar */}
        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search appointments by patient, doctor, or ailment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕ Clear
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <p className="empty-notice">No appointments found. Click "+ Add Appointment" to book a patient slot.</p>
        ) : filteredAppointments.length === 0 ? (
          <p className="empty-notice">No appointments found matching "{searchTerm}".</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Ailment / Reason</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Payment</th>
                  <th style={{ width: "160px", minWidth: "160px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const statusInfo = STATUS_LABELS[a.status] || { label: a.status, className: "status-confirmed" };
                  const isScheduled = a.status === "SCHEDULED" || !a.status;
                  const isCompleted = a.status === "COMPLETED";
                  const isPaid = a.status === "PAID";

                  return (
                    <tr key={a.id}>
                      <td>#{a.id}</td>
                      <td className="cell-patient-name">{a.patient?.name}</td>
                      <td>{a.ailment || "General Consultation"}</td>
                      <td className="cell-doctor-name">{a.doctor?.name}</td>
                      <td>{formatDate(a.appointmentDate)}</td>
                      <td>{formatTimeTo12h(a.startTime)}</td>
                      <td>
                        {a.paymentMethod ? (
                          <span className="payment-method-tag">{a.paymentMethod}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {isScheduled ? (
                          <select
                            className="status-dropdown-select status-scheduled"
                            value="SCHEDULED"
                            disabled={completingId === a.id || cancelingId === a.id}
                            onChange={(e) => {
                              if (e.target.value === "COMPLETED") handleComplete(a.id);
                              else if (e.target.value === "CANCEL") handleCancel(a.id);
                            }}
                            title="Change status or cancel appointment"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="COMPLETED">Mark as Completed</option>
                            <option value="CANCEL">✕ Cancel</option>
                          </select>
                        ) : isCompleted ? (
                          <select
                            className="status-dropdown-select status-completed"
                            value="COMPLETED"
                            disabled={completingId === a.id || cancelingId === a.id}
                            onChange={(e) => {
                              if (e.target.value === "CANCEL") handleCancel(a.id);
                            }}
                            title="Completed — ready for payment in Payments tab"
                          >
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCEL">✕ Cancel</option>
                          </select>
                        ) : (
                          <span className="status-paid" title="Payment settled">Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-content-wide">
            <div className="modal-header">
              <div>
                <h3>Book an Appointment</h3>
                <span className="section-subtext">Fill in patient details on the left, then select a date and time slot on the right.</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {bookingError && <ErrorBanner message={bookingError} />}

            <form onSubmit={handleBookAppointment}>
              <div className="modal-two-col">

                {/* ── LEFT COLUMN: Patient + Ailment + Payment ── */}
                <div className="modal-col">
                  <p className="form-section-label">Patient Info</p>

                  {/* Patient Search */}
                  <div className="form-group">
                    <label>Search &amp; Select Patient *</label>
                    {patients.length === 0 ? (
                      <div className="warn-box">
                        <p>No patients registered yet. Please register a patient in the <strong>Patients</strong> tab first.</p>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search by name or contact..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                        <select
                          className="patient-select-box"
                          value={selectedPatientId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setSelectedPatientId(newId);
                            const pat = patients.find((p) => String(p.id) === String(newId));
                            if (pat?.insuranceProvider) setBookingPaymentMethod("INSURANCE");
                          }}
                        >
                          {filteredModalPatients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — Age {p.age} · {p.contact}
                            </option>
                          ))}
                        </select>
                        {selectedPatientObj && (
                          <div className="patient-selected-card">
                            <span className="patient-selected-title">Selected:</span>
                            <strong>{selectedPatientObj.name}</strong> &nbsp;·&nbsp; Age {selectedPatientObj.age} &nbsp;·&nbsp; {selectedPatientObj.contact}
                            {selectedPatientObj.insuranceProvider && (
                              <span className="insurance-tag"> 🛡 {selectedPatientObj.insuranceProvider}</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Ailment */}
                  <div className="form-group">
                    <label>Ailment / Reason for Visit *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Fever, Headache, Annual physical..."
                      value={bookingAilment}
                      onChange={(e) => setBookingAilment(e.target.value)}
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select
                      required
                      value={bookingPaymentMethod}
                      onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m === "INSURANCE"
                            ? `INSURANCE (${selectedPatientObj?.insuranceProvider || "Health Insurance Claim"})`
                            : m}
                        </option>
                      ))}
                    </select>
                    <span className="field-hint">Set before booking — finalized when the appointment is completed.</span>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Date + Doctor + Time Slots ── */}
                <div className="modal-col">
                  <p className="form-section-label">Schedule</p>

                  {/* Date picker */}
                  <div className="form-group">
                    <label>Appointment Date *</label>
                    <div className="date-day-row">
                      <input
                        type="date"
                        style={{ flex: 1 }}
                        min={new Date().toISOString().split("T")[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                      {selectedDayOfWeekName && (
                        <span className="day-of-week-badge">{selectedDayOfWeekName}</span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Duty Info */}
                  {scheduledDoctors.length > 0 && (
                    <div className="schedule-info-box">
                      <span className="schedule-info-title">Doctor Duty Days</span>
                      {scheduledDoctors.map((doc) => (
                        <div key={doc.id} className="schedule-info-item">
                          <strong>{doc.name}:</strong>{" "}
                          {doc.schedules?.length > 0
                            ? doc.schedules.map((s) => `${s.dayOfWeek} (${s.startTime?.substring(0, 5)}–${s.endTime?.substring(0, 5)})`).join(", ")
                            : "No schedule"}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available Doctors */}
                  <div className="form-group">
                    <label>Available Doctor *</label>
                    {loadingSlots ? (
                      <p className="loading-text">Checking schedules for {selectedDayOfWeekName}…</p>
                    ) : availableDoctors.length === 0 ? (
                      <div className="warn-box">
                        <p>No doctors on duty on <strong>{selectedDayOfWeekName}</strong>.</p>
                        <small>Pick a date matching a doctor's duty day above.</small>
                      </div>
                    ) : (
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => {
                          const newDocId = e.target.value;
                          setSelectedDoctorId(newDocId);
                          const doc = availableDoctors.find((d) => String(d.doctorId) === newDocId);
                          if (doc && doc.freeSlots?.length > 0) {
                            const slot0 = doc.freeSlots[0];
                            setSelectedSlot(typeof slot0 === "string" ? slot0.substring(0, 5) : String(slot0));
                          } else {
                            setSelectedSlot("");
                          }
                        }}
                      >
                        {availableDoctors.map((doc) => (
                          <option key={doc.doctorId} value={doc.doctorId}>
                            {doc.doctorName} — {doc.freeSlots?.length || 0} slot{doc.freeSlots?.length !== 1 ? "s" : ""} open
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Time Slots */}
                  {activeDoctorObj && activeDoctorObj.freeSlots?.length > 0 && (
                    <div className="form-group">
                      <label>Select a 30-min Time Slot *</label>
                      <div className="slots-grid">
                        {activeDoctorObj.freeSlots.map((slot) => {
                          const slotStr = typeof slot === "string" ? slot.substring(0, 5) : String(slot);
                          const isSelected = selectedSlot === slotStr;
                          return (
                            <button
                              key={slotStr}
                              type="button"
                              className={`slot-chip ${isSelected ? "selected" : ""}`}
                              onClick={() => setSelectedSlot(slotStr)}
                            >
                              {formatTimeTo12h(slotStr)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Booking…" : "Confirm Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

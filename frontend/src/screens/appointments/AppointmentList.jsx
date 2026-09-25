import { useEffect, useState } from "react";
import { getAppointments, cancelAppointment, getAvailability, bookAppointment } from "../../api/appointments.js";
import { getPatients } from "../../api/patients.js";
import { getSpecializations } from "../../api/specializations.js";
import { getDoctors } from "../../api/doctors.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AppointmentList() {
  const [appointments, setAppointments] = useState(null);
  const [patients, setPatients] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [bookingAilment, setBookingAilment] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAllData = () => {
    Promise.all([
      getAppointments(),
      getPatients(),
      getSpecializations().catch(() => []),
      getDoctors(),
    ])
      .then(([appts, pats, specs, docs]) => {
        setAppointments(appts);
        setPatients(pats);
        setSpecializations(specs);
        setDoctors(docs);
        if (pats.length > 0 && !selectedPatientId) setSelectedPatientId(String(pats[0].id));
      })
      .catch((err) => setError(err.message));
  };

  // Lightweight refresh — only appointments change after a book/cancel action.
  // Patients, specializations, and doctors are static during a session.
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
      const specsToQuery = specializations.length > 0 ? specializations : [{ id: 1 }];
      Promise.all(specsToQuery.map((s) => getAvailability(s.id, selectedDate).catch(() => [])))
        .then((results) => {
          const merged = results.flat();
          // Deduplicate doctors
          const uniqueDocs = Array.from(new Map(merged.map((d) => [d.doctorId, d])).values());
          setAvailableDoctors(uniqueDocs);
          if (uniqueDocs.length > 0) {
            setSelectedDoctorId(String(uniqueDocs[0].doctorId));
            if (uniqueDocs[0].freeSlots && uniqueDocs[0].freeSlots.length > 0) {
              const firstSlot = uniqueDocs[0].freeSlots[0];
              setSelectedSlot(typeof firstSlot === "string" ? firstSlot.substring(0, 5) : firstSlot);
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
  }, [showModal, specializations, selectedDate]);

  const handleOpenModal = () => {
    setBookingError(null);
    setPatientSearch("");
    setBookingAilment("");
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(String(patients[0].id));
    }
    setShowModal(true);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setBookingError("Please select a registered patient.");
      return;
    }
    if (!bookingAilment.trim()) {
      setBookingError("Please enter the patient's ailment or reason for this visit.");
      return;
    }
    if (!selectedDoctorId) {
      setBookingError("No doctor selected or available for this date.");
      return;
    }
    if (!selectedSlot) {
      setBookingError("Please select an available time slot.");
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
      });
      setShowModal(false);
      refreshAppointments();
    } catch (err) {
      setBookingError(err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
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
          <p className="section-subtext">Search registered patients, assign ailments, and schedule clinical reservations.</p>
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
                <col style={{ width: "7%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Ailment / Reason</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const patient = patientMap.get(a.patient?.id);
                  const startTime = a.startTime?.substring(0, 5) || "--:--";

                  return (
                    <tr key={a.id}>
                      <td>#{a.id}</td>
                      <td className="cell-patient-name">{a.patient?.name}</td>
                      <td>{patient?.ailment || "General Consultation"}</td>
                      <td className="cell-doctor-name">{a.doctor?.name}</td>
                      <td>{a.appointmentDate} @ {startTime}</td>
                      <td>
                        <span className="status-confirmed">Confirmed</span>
                      </td>
                      <td className="cell-actions">
                        <button
                          className="danger-btn-sm"
                          disabled={cancelingId === a.id}
                          onClick={() => handleCancel(a.id)}
                        >
                          {cancelingId === a.id ? "Canceling..." : "Cancel"}
                        </button>
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
          <div className="modal-content modal-content-lg">
            <div className="modal-header">
              <h3>Book an Appointment</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {bookingError && <ErrorBanner message={bookingError} />}

            <form onSubmit={handleBookAppointment} className="form-layout">
              {/* Patient Search and Selection */}
              <div className="form-group">
                <label>1. Search & Select Registered Patient *</label>
                {patients.length === 0 ? (
                  <div className="warn-box">
                    <p>No patients registered yet. Please register a patient in the <strong>Patients</strong> tab first.</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Type patient name or contact number to search..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                    <select
                      className="patient-select-box"
                      value={selectedPatientId}
                      onChange={(e) => {
                        setSelectedPatientId(e.target.value);
                        const p = patients.find((pat) => String(pat.id) === e.target.value);
                        if (p && p.ailment && p.ailment !== "None") {
                          setBookingAilment(p.ailment);
                        }
                      }}
                    >
                      {filteredModalPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Age: {p.age}, Contact: {p.contact})
                        </option>
                      ))}
                    </select>

                    {selectedPatientObj && (
                      <div className="patient-selected-card">
                        <span className="patient-selected-title">Selected Patient:</span>
                        <strong>{selectedPatientObj.name}</strong> • Age: {selectedPatientObj.age} • Contact: {selectedPatientObj.contact}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Ailment / Reason for Visit */}
              <div className="form-group">
                <label>2. Ailment / Reason for this Appointment *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Skin rash, Persistent headache, Annual physical, Fever"
                  value={bookingAilment}
                  onChange={(e) => setBookingAilment(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>3. Date ({selectedDayOfWeekName}) *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Doctor Duty Information Banner */}
              {scheduledDoctors.length > 0 && (
                <div className="schedule-info-box">
                  <span className="schedule-info-title">Registered Doctor Duty Days:</span>
                  {scheduledDoctors.map((doc) => (
                    <div key={doc.id} className="schedule-info-item">
                      <strong>{doc.name}:</strong>{" "}
                      {doc.schedules?.length > 0
                        ? doc.schedules.map((s) => `${s.dayOfWeek} (${s.startTime?.substring(0, 5)}-${s.endTime?.substring(0, 5)})`).join(", ")
                        : "No duty schedule configured"}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label>4. Available Doctors & 30-Min Slots</label>
                {loadingSlots ? (
                  <p className="loading-text">Checking available doctor schedules for {selectedDayOfWeekName}...</p>
                ) : availableDoctors.length === 0 ? (
                  <div className="warn-box">
                    <p>No available doctor slots found on <strong>{selectedDayOfWeekName} ({selectedDate})</strong>.</p>
                    <small>Tip: Choose a date matching the doctor's duty schedule above.</small>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        const doc = availableDoctors.find((d) => String(d.doctorId) === e.target.value);
                        if (doc && doc.freeSlots?.length > 0) {
                          const slot0 = doc.freeSlots[0];
                          setSelectedSlot(typeof slot0 === "string" ? slot0.substring(0, 5) : slot0);
                        }
                      }}
                    >
                      {availableDoctors.map((doc) => (
                        <option key={doc.doctorId} value={doc.doctorId}>
                          {doc.doctorName} ({doc.freeSlots?.length || 0} slots open)
                        </option>
                      ))}
                    </select>

                    {activeDoctorObj && activeDoctorObj.freeSlots?.length > 0 && (
                      <div className="slots-wrapper">
                        <label className="slots-sublabel">Select a 30-min slot:</label>
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
                                {slotStr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting || availableDoctors.length === 0 || !selectedSlot || !bookingAilment.trim() || !selectedPatientId}
                >
                  {submitting ? "Booking..." : "Confirm Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

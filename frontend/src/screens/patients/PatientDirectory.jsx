import { useEffect, useState } from "react";
import { getPatients, registerPatient, updatePatient, deletePatient } from "../../api/patients.js";
import { getAppointments } from "../../api/appointments.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

export default function PatientDirectory() {
  const [patients, setPatients] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  const INITIAL_FORM_STATE = {
    firstName: "",
    lastName: "",
    age: "",
    contact: "",
    insuranceProvider: "",
    medicalBackground: "",
  };
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editFormData, setEditFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState(null);

  function loadData() {
    Promise.all([getPatients(), getAppointments().catch(() => [])])
      .then(([pats, appts]) => {
        setPatients(pats);
        setAppointments(appts || []);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleCloseRegisterModal() {
    setShowModal(false);
    setFormData(INITIAL_FORM_STATE);
  }

  function handleClosePatientModal() {
    setSelectedPatientForHistory(null);
    setIsEditingPatient(false);
    setEditError(null);
  }

  function handleStartEdit() {
    if (!selectedPatientForHistory) return;
    const nameParts = (selectedPatientForHistory.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    setEditFormData({
      firstName,
      lastName,
      age: String(selectedPatientForHistory.age ?? ""),
      contact: selectedPatientForHistory.contact || "",
      insuranceProvider: selectedPatientForHistory.insuranceProvider || "",
      medicalBackground: getPatientBackground(selectedPatientForHistory) || "",
    });
    setEditError(null);
    setIsEditingPatient(true);
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      await registerPatient({
        name: fullName,
        age: parseInt(formData.age, 10),
        contact: formData.contact.trim(),
        insuranceProvider: formData.insuranceProvider.trim() || null,
        medicalBackground: formData.medicalBackground.trim() || null,
      });
      handleCloseRegisterModal();
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      setEditError("Please provide both First Name and Last Name.");
      return;
    }
    try {
      setUpdating(true);
      setEditError(null);
      const fullName = `${editFormData.firstName.trim()} ${editFormData.lastName.trim()}`.trim();
      const updated = await updatePatient(selectedPatientForHistory.id, {
        name: fullName,
        age: parseInt(editFormData.age, 10),
        contact: editFormData.contact.trim(),
        insuranceProvider: editFormData.insuranceProvider.trim() || null,
        medicalBackground: editFormData.medicalBackground.trim() || null,
      });
      setIsEditingPatient(false);
      setSelectedPatientForHistory(updated);
      loadData();
    } catch (err) {
      setEditError(err.message || "Failed to update patient");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this patient? This will also remove their associated appointment records.")) return;
    try {
      await deletePatient(id);
      handleClosePatientModal();
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // Helper to extract medical background description string
  const getPatientBackground = (p) => {
    if (!p) return null;
    const entry = p.medicalHistory?.find(
      (h) => h.startsWith("Medical Background:") || h.startsWith("Initial Background:")
    );
    if (entry) {
      return entry.replace(/^Medical Background:\s*|^Initial Background:\s*/i, "").trim();
    }
    return null;
  };

  if (error && !patients) return <ErrorBanner message={error} />;
  if (!patients) return <LoadingSpinner />;

  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    const bg = getPatientBackground(p);
    const matchesBg = bg && bg.toLowerCase().includes(q);
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.contact && p.contact.toLowerCase().includes(q)) ||
      (p.insuranceProvider && p.insuranceProvider.toLowerCase().includes(q)) ||
      matchesBg
    );
  });

  // Appointments for the currently selected patient in the history modal
  const patientAppointments = selectedPatientForHistory
    ? appointments.filter((a) => a.patient?.id === selectedPatientForHistory.id)
    : [];

  const selectedBackground = getPatientBackground(selectedPatientForHistory);

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Patients Directory</h2>
          <p className="section-subtext">Register patients with medical background descriptions, or click any patient to view their appointment history.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Register Patient
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="dash-card">
        {/* Search Bar for Patients */}
        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient by name, contact, medical background, or insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕ Clear
            </button>
          )}
        </div>

        {patients.length === 0 ? (
          <p className="empty-notice">No patients registered yet. Click "+ Register Patient" to add one.</p>
        ) : filteredPatients.length === 0 ? (
          <p className="empty-notice">No registered patients found matching "{searchTerm}".</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Medical Background</th>
                  <th>Health Insurance</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const bg = getPatientBackground(p);
                  return (
                    <tr
                      key={p.id}
                      className="clickable-row"
                      onClick={() => {
                        setSelectedPatientForHistory(p);
                        setIsEditingPatient(false);
                      }}
                      title="Click to view patient profile, edit details, or view appointment history"
                    >
                      <td className="cell-patient-name">
                        <span className="patient-link-text">{p.name}</span>
                      </td>
                      <td>{p.age} yrs</td>
                      <td>{p.contact}</td>
                      <td>{bg ? bg : <span className="text-muted">—</span>}</td>
                      <td>
                        {p.insuranceProvider ? (
                          <span className="insurance-tag">🛡 {p.insuranceProvider}</span>
                        ) : (
                          <span className="text-muted">—</span>
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

      {/* Register Patient Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button className="modal-close-btn" onClick={handleCloseRegisterModal}>✕</button>
            </div>
            <form onSubmit={handleRegister} className="form-layout">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Jane"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Cruz"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="150"
                  placeholder="e.g. 34"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 09171234567"
                  value={formData.contact}
                  onKeyDown={(e) => {
                    if (
                      e.key.length === 1 &&
                      !/[0-9]/.test(e.key) &&
                      !(e.ctrlKey || e.metaKey)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, contact: digits });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Health Insurance Provider <span className="optional-label">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. PhilHealth, Maxicare, Intellicare"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                />
                <small className="section-subtext">For logging purposes only.</small>
              </div>
              <div className="form-group">
                <label>Medical Background / Notes <span className="optional-label">(optional)</span></label>
                <textarea
                  rows="2"
                  placeholder="e.g. Asthma since childhood, allergic to penicillin, hypertension history"
                  value={formData.medicalBackground}
                  onChange={(e) => setFormData({ ...formData, medicalBackground: e.target.value })}
                />
                <small className="section-subtext">Pre-existing conditions or background notes description.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={handleCloseRegisterModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Profile & Appointment History Modal */}
      {selectedPatientForHistory && (
        <div className="modal-backdrop" onClick={handleClosePatientModal}>
          <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedPatientForHistory.name}</h3>
                <span className="section-subtext">
                  {isEditingPatient
                    ? `Edit Patient #${selectedPatientForHistory.id} Details`
                    : `Patient #${selectedPatientForHistory.id} Profile & Appointment History`}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleClosePatientModal}>✕</button>
            </div>

            {editError && <ErrorBanner message={editError} />}

            {isEditingPatient ? (
              /* Editable Patient Details Form */
              <form onSubmit={handleSaveEdit} className="form-layout">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Jane"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Cruz"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="150"
                      placeholder="e.g. 34"
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 09171234567"
                      value={editFormData.contact}
                      onKeyDown={(e) => {
                        if (
                          e.key.length === 1 &&
                          !/[0-9]/.test(e.key) &&
                          !(e.ctrlKey || e.metaKey)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setEditFormData({ ...editFormData, contact: digits });
                      }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Health Insurance Provider <span className="optional-label">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. PhilHealth, Maxicare, Intellicare"
                    value={editFormData.insuranceProvider}
                    onChange={(e) => setEditFormData({ ...editFormData, insuranceProvider: e.target.value })}
                  />
                  <small className="section-subtext">Leave blank if uninsured / self-pay.</small>
                </div>
                <div className="form-group">
                  <label>Medical Background / Notes <span className="optional-label">(optional)</span></label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Asthma since childhood, allergic to penicillin, hypertension history"
                    value={editFormData.medicalBackground}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalBackground: e.target.value })}
                  />
                  <small className="section-subtext">Pre-existing conditions, allergies, and patient notes.</small>
                </div>

                <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="danger-btn-sm"
                    onClick={() => handleDelete(selectedPatientForHistory.id)}
                    title="Delete this patient record"
                  >
                    🗑 Delete Patient
                  </button>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setIsEditingPatient(false);
                        setEditError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn" disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* View Patient Profile & History Mode */
              <>
                <div className="patient-profile-summary">
                  <div className="patient-info-stat">
                    <span className="stat-label">Age</span>
                    <span className="stat-value">{selectedPatientForHistory.age} yrs</span>
                  </div>
                  <div className="patient-info-stat">
                    <span className="stat-label">Contact</span>
                    <span className="stat-value">{selectedPatientForHistory.contact}</span>
                  </div>
                  <div className="patient-info-stat">
                    <span className="stat-label">Health Insurance</span>
                    <span className="stat-value">
                      {selectedPatientForHistory.insuranceProvider ? (
                        <span className="insurance-tag">🛡 {selectedPatientForHistory.insuranceProvider}</span>
                      ) : (
                        "None / Self-pay"
                      )}
                    </span>
                  </div>
                  <div className="patient-info-stat">
                    <span className="stat-label">Total Visits</span>
                    <span className="stat-value">{patientAppointments.length} appointments</span>
                  </div>
                </div>

                <div className="patient-background-box">
                  <span className="stat-label">📋 Pre-existing Medical Background:</span>
                  <p>{selectedBackground ? selectedBackground : <span className="text-muted">No pre-existing conditions or notes recorded on registration.</span>}</p>
                </div>

                <div className="history-section">
                  <h4 className="history-section-title">Appointment History</h4>

                  {patientAppointments.length === 0 ? (
                    <div className="history-empty-box">
                      <p>No appointment history found for this patient.</p>
                      <small className="section-subtext">Appointments booked for this patient will appear here with the assigned doctor, ailment, and date.</small>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Doctor Name</th>
                            <th>Ailment</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientAppointments.map((appt) => (
                            <tr key={appt.id}>
                              <td className="cell-doctor-name">{appt.doctor?.name}</td>
                              <td>{appt.ailment || "General Consultation"}</td>
                              <td>
                                {appt.appointmentDate}
                                {appt.startTime ? ` @ ${appt.startTime.substring(0, 5)}` : ""}
                              </td>
                              <td>
                                <span className={appt.status === "PAID" ? "status-paid" : appt.status === "COMPLETED" ? "status-completed" : "status-scheduled"}>
                                  {appt.status || "SCHEDULED"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="danger-btn-sm"
                    onClick={() => handleDelete(selectedPatientForHistory.id)}
                    title="Delete this patient record"
                  >
                    🗑 Delete Patient
                  </button>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleStartEdit}
                      title="Edit this patient's details"
                    >
                      ✎ Edit Details
                    </button>
                    <button type="button" className="primary-btn" onClick={handleClosePatientModal}>
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

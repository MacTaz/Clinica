import { useEffect, useState } from "react";
import { getDoctors, registerDoctor, deleteDoctor } from "../../api/doctors.js";
import { getSpecializations } from "../../api/specializations.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DEFAULT_SCHEDULE_ROW = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "12:00",
};

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    contact: "",
    specializationId: "",
    salary: "",
    schedules: [{ ...DEFAULT_SCHEDULE_ROW }],
  });

  function loadData() {
    Promise.all([getDoctors(), getSpecializations()])
      .then(([docs, specs]) => {
        setDoctors(docs);
        setSpecializations(specs);
        if (specs.length > 0 && !formData.specializationId) {
          setFormData((prev) => ({ ...prev, specializationId: specs[0].id }));
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleAddScheduleRow() {
    setFormData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, { ...DEFAULT_SCHEDULE_ROW }],
    }));
  }

  function handleRemoveScheduleRow(index) {
    if (formData.schedules.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, idx) => idx !== index),
    }));
  }

  function handleScheduleChange(index, field, value) {
    setFormData((prev) => {
      const updated = [...prev.schedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedules: updated };
    });
  }

  function handleOpenModal() {
    setModalError(null);
    setFormData({
      name: "",
      age: "",
      contact: "",
      specializationId: specializations[0]?.id || "",
      salary: "",
      schedules: [{ ...DEFAULT_SCHEDULE_ROW }],
    });
    setShowModal(true);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!formData.schedules || formData.schedules.length === 0) {
      setModalError("Please provide at least one weekly schedule block.");
      return;
    }

    // Validate that start time is before end time for each block
    for (const [idx, s] of formData.schedules.entries()) {
      if (s.startTime >= s.endTime) {
        setModalError(`Schedule row #${idx + 1}: Start time (${s.startTime}) must be earlier than End time (${s.endTime}).`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setModalError(null);
      await registerDoctor({
        name: formData.name,
        age: parseInt(formData.age, 10),
        contact: formData.contact,
        specializationId: parseInt(formData.specializationId, 10),
        salary: parseFloat(formData.salary),
        schedules: formData.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
          endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
        })),
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to register doctor");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !doctors) return <ErrorBanner message={error} />;
  if (!doctors) return <LoadingSpinner />;

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Doctors Directory</h2>
          <p className="section-subtext">Manage clinical staff, specialties, and weekly duty schedules.</p>
        </div>
        <button className="primary-btn" onClick={handleOpenModal}>
          + Register Doctor
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="dash-card">
        {doctors.length === 0 ? (
          <p className="empty-notice">No doctors registered yet. Click "+ Register Doctor" to add one.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Salary</th>
                  <th>Weekly Schedules</th>
                  <th className="th-status">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-doctor-name">{d.name}</td>
                    <td><span className="spec-badge">{d.specialization?.name || "General"}</span></td>
                    <td>{d.age}</td>
                    <td>{d.contact}</td>
                    <td>₱{Number(d.salary).toLocaleString()}</td>
                    <td>
                      {d.schedules && d.schedules.length > 0 ? (
                        <div className="schedules-list">
                          {d.schedules.map((s, idx) => (
                            <div key={idx} className="schedule-pill">
                              <strong>{s.dayOfWeek?.substring(0, 3)}:</strong> {s.startTime?.substring(0, 5)}–{s.endTime?.substring(0, 5)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No schedule</span>
                      )}
                    </td>
                    <td className="cell-actions">
                      <button className="danger-btn-sm" onClick={() => handleDelete(d.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Doctor Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Register New Doctor</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {modalError && <ErrorBanner message={modalError} />}

            <form onSubmit={handleRegister} className="form-layout">
              <div className="form-group">
                <label>Doctor Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    required
                    type="number"
                    min="20"
                    max="120"
                    placeholder="e.g. 42"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 09181234567"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Specialization *</label>
                  <select
                    value={formData.specializationId}
                    onChange={(e) => setFormData({ ...formData, specializationId: e.target.value })}
                  >
                    {specializations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Salary (₱) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 65000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>

              {/* Multiple Weekly Schedules Section */}
              <div className="form-group">
                <div className="schedule-header-row">
                  <label>Weekly Duty Schedules *</label>
                  <button
                    type="button"
                    className="secondary-btn-sm"
                    onClick={handleAddScheduleRow}
                  >
                    + Add Schedule Day
                  </button>
                </div>

                <div className="schedules-builder-container">
                  {formData.schedules.map((row, idx) => (
                    <div key={idx} className="schedule-builder-row">
                      <select
                        value={row.dayOfWeek}
                        onChange={(e) => handleScheduleChange(idx, "dayOfWeek", e.target.value)}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        required
                        value={row.startTime}
                        onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                      />
                      <span className="schedule-to-label">to</span>
                      <input
                        type="time"
                        required
                        value={row.endTime}
                        onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                      />
                      {formData.schedules.length > 1 && (
                        <button
                          type="button"
                          className="remove-row-btn"
                          title="Remove this schedule block"
                          onClick={() => handleRemoveScheduleRow(idx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { getDoctors, registerDoctor, deleteDoctor } from "../../api/doctors.js";
import { getSpecializations } from "../../api/specializations.js";
import { getDoctorScheduleStatus, setDoctorScheduleStatus, statusToSlug, STATUS_OPTIONS } from "../../utils/doctorStatus.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DEFAULT_SCHEDULE_ROW = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "12:00",
};

/**
 * Detects duplicate or overlapping schedule rows for a doctor on the same day.
 * Returns { conflicts: Set<number>, conflictMessages: string[] }
 */
function findScheduleConflicts(schedules) {
  const conflicts = new Set();
  const conflictMessages = [];

  for (let i = 0; i < schedules.length; i++) {
    const s1 = schedules[i];
    if (!s1 || !s1.startTime || !s1.endTime) continue;

    for (let j = i + 1; j < schedules.length; j++) {
      const s2 = schedules[j];
      if (!s2 || !s2.startTime || !s2.endTime) continue;

      if (s1.dayOfWeek === s2.dayOfWeek) {
        // Overlap condition: start1 < end2 && start2 < end1
        const overlaps = s1.startTime < s2.endTime && s2.startTime < s1.endTime;
        if (overlaps) {
          conflicts.add(i);
          conflicts.add(j);
          if (s1.startTime === s2.startTime && s1.endTime === s2.endTime) {
            conflictMessages.push(
              `Duplicate schedule on ${s1.dayOfWeek} (${s1.startTime}–${s1.endTime}): Row #${i + 1} and Row #${j + 1} cannot have the exact same schedule.`
            );
          } else {
            conflictMessages.push(
              `Overlapping schedule on ${s1.dayOfWeek}: Row #${i + 1} (${s1.startTime}–${s1.endTime}) and Row #${j + 1} (${s2.startTime}–${s2.endTime}) overlap. Schedules cannot repeat or overlap.`
            );
          }
        }
      }
    }
  }

  return { conflicts, conflictMessages };
}

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, setStatusVersion] = useState(0);

  useEffect(() => {
    function onStatusChange() {
      setStatusVersion((v) => v + 1);
    }
    window.addEventListener("clinica-doctor-status-change", onStatusChange);
    return () => window.removeEventListener("clinica-doctor-status-change", onStatusChange);
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    contact: "",
    schedules: [{ ...DEFAULT_SCHEDULE_ROW }],
  });

  const { conflicts: scheduleConflicts, conflictMessages: scheduleConflictMessages } =
    findScheduleConflicts(formData.schedules);

  function loadData() {
    Promise.all([getDoctors(), getSpecializations().catch(() => [])])
      .then(([docs, specs]) => {
        setDoctors(docs);
        setSpecializations(specs);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleAddScheduleRow() {
    setFormData((prev) => {
      const usedDays = new Set(prev.schedules.map((s) => s.dayOfWeek));
      const nextUnusedDay = DAYS_OF_WEEK.find((d) => !usedDays.has(d)) || "MONDAY";
      return {
        ...prev,
        schedules: [
          ...prev.schedules,
          {
            dayOfWeek: nextUnusedDay,
            startTime: "09:00",
            endTime: "12:00",
          },
        ],
      };
    });
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
      firstName: "",
      lastName: "",
      age: "",
      contact: "",
      schedules: [{ ...DEFAULT_SCHEDULE_ROW }],
    });
    setShowModal(true);
  }

  async function handleRegister(e) {
    e.preventDefault();
    const cleanFirst = formData.firstName.trim();
    const cleanLast = formData.lastName.trim();

    if (!cleanFirst || !cleanLast) {
      setModalError("Please provide both First Name and Last Name.");
      return;
    }

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

    // Validate that no duplicate or overlapping schedules exist on the same day
    const { conflictMessages } = findScheduleConflicts(formData.schedules);
    if (conflictMessages.length > 0) {
      setModalError(conflictMessages[0]);
      return;
    }

    // Format doctor's name with title "Dr." on the record
    const formattedName = cleanFirst.toLowerCase().startsWith("dr.") || cleanFirst.toLowerCase().startsWith("dr ")
      ? `${cleanFirst} ${cleanLast}`.trim()
      : `Dr. ${cleanFirst} ${cleanLast}`.trim();

    try {
      setSubmitting(true);
      setModalError(null);
      await registerDoctor({
        name: formattedName,
        age: parseInt(formData.age, 10),
        contact: formData.contact,
        specializationId: specializations[0]?.id || 1,
        salary: 0,
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
          <p className="section-subtext">Manage clinical staff and weekly duty schedules.</p>
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
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Weekly Schedules</th>
                  <th>Availability Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-doctor-name">{d.name}</td>
                    <td>{d.age}</td>
                    <td>{d.contact}</td>
                    <td>
                      {d.schedules && d.schedules.length > 0 ? (
                        <div className="schedules-vertical-list">
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
                    <td>
                      {d.schedules && d.schedules.length > 0 ? (
                        <div className="status-vertical-list">
                          {d.schedules.map((s, idx) => {
                            const currentStatus = getDoctorScheduleStatus(d, s, idx);
                            const slug = statusToSlug(currentStatus);

                            return (
                              <select
                                key={idx}
                                className={`status-select status-select-${slug}`}
                                value={currentStatus}
                                onChange={(e) => {
                                  setDoctorScheduleStatus(d.id, s, idx, e.target.value);
                                  setStatusVersion((v) => v + 1);
                                }}
                              >
                                <option value="">Select Status</option>
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
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
                    placeholder="e.g. Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 09181234567"
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
                  {formData.schedules.map((row, idx) => {
                    const isConflict = scheduleConflicts.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`schedule-builder-row ${isConflict ? "schedule-builder-row-conflict" : ""}`}
                      >
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
                    );
                  })}
                  {scheduleConflictMessages.length > 0 && (
                    <div className="schedule-conflict-warning">
                      <span>⚠️</span>
                      <span>{scheduleConflictMessages[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting || scheduleConflictMessages.length > 0}
                >
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

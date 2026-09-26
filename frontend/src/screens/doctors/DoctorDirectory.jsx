import { useEffect, useState } from "react";
import { getDoctors, registerDoctor, updateDoctor, deleteDoctor } from "../../api/doctors.js";
import { getDoctorScheduleStatus, setDoctorScheduleStatus, statusToSlug, STATUS_OPTIONS } from "../../utils/doctorStatus.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_ORDER = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

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

const JAVA_DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function DoctorDirectory() {
  const currentDayName = JAVA_DAY_NAMES[new Date().getDay()];
  const [selectedDayFilter, setSelectedDayFilter] = useState(currentDayName);
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("REGISTER"); // "REGISTER" | "EDIT_DOCTOR" | "EDIT_SCHEDULE"
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [, setStatusVersion] = useState(0);

  // Edit Mode toggles for top-right edit buttons
  const [isEditingDoctors, setIsEditingDoctors] = useState(false);
  const [isEditingSchedules, setIsEditingSchedules] = useState(false);

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
    getDoctors()
      .then((docs) => {
        setDoctors(docs);
        setError(null);
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

  function handleOpenRegisterModal() {
    setModalMode("REGISTER");
    setEditingDoctor(null);
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

  function handleOpenEditDoctorModal(doctor) {
    setModalMode("EDIT_DOCTOR");
    setEditingDoctor(doctor);
    setModalError(null);
    const nameParts = (doctor.name || "").replace(/^Dr\.?\s*/i, "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const existingSchedules = doctor.schedules && doctor.schedules.length > 0
      ? doctor.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime?.substring(0, 5) || "09:00",
          endTime: s.endTime?.substring(0, 5) || "12:00",
        }))
      : [{ ...DEFAULT_SCHEDULE_ROW }];

    setFormData({
      firstName,
      lastName,
      age: String(doctor.age || ""),
      contact: doctor.contact || "",
      schedules: existingSchedules,
    });
    setShowModal(true);
  }

  function handleOpenEditScheduleModal(doctor) {
    setModalMode("EDIT_SCHEDULE");
    setEditingDoctor(doctor);
    setModalError(null);
    const nameParts = (doctor.name || "").replace(/^Dr\.?\s*/i, "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const existingSchedules = doctor.schedules && doctor.schedules.length > 0
      ? doctor.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime?.substring(0, 5) || "09:00",
          endTime: s.endTime?.substring(0, 5) || "12:00",
        }))
      : [{ ...DEFAULT_SCHEDULE_ROW }];

    setFormData({
      firstName,
      lastName,
      age: String(doctor.age || ""),
      contact: doctor.contact || "",
      schedules: existingSchedules,
    });
    setShowModal(true);
  }

  async function handleSaveDoctor(e) {
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

    // Validate start time is before end time
    for (const [idx, s] of formData.schedules.entries()) {
      if (s.startTime >= s.endTime) {
        setModalError(`Schedule row #${idx + 1}: Start time (${s.startTime}) must be earlier than End time (${s.endTime}).`);
        return;
      }
    }

    // Validate no overlapping schedules
    const { conflictMessages } = findScheduleConflicts(formData.schedules);
    if (conflictMessages.length > 0) {
      setModalError(conflictMessages[0]);
      return;
    }

    const formattedName = cleanFirst.toLowerCase().startsWith("dr.") || cleanFirst.toLowerCase().startsWith("dr ")
      ? `${cleanFirst} ${cleanLast}`.trim()
      : `Dr. ${cleanFirst} ${cleanLast}`.trim();

    const payload = {
      name: formattedName,
      age: parseInt(formData.age, 10),
      contact: formData.contact,
      specializationId: 1, // Default general clinical practice
      salary: 0,
      schedules: formData.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
        endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
      })),
    };

    try {
      setSubmitting(true);
      setModalError(null);
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, payload);
      } else {
        await registerDoctor(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to save doctor");
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

  // Flatten and sort all doctor schedules for Table 2
  const allSchedulesList = [];
  doctors.forEach((doc) => {
    if (doc.schedules && doc.schedules.length > 0) {
      doc.schedules.forEach((s, sIdx) => {
        allSchedulesList.push({
          doctor: doc,
          schedule: s,
          scheduleIndex: sIdx,
        });
      });
    } else {
      allSchedulesList.push({
        doctor: doc,
        schedule: null,
        scheduleIndex: 0,
      });
    }
  });

  allSchedulesList.sort((a, b) => {
    if (a.doctor.name !== b.doctor.name) {
      return a.doctor.name.localeCompare(b.doctor.name);
    }
    const orderA = a.schedule ? (DAY_ORDER[a.schedule.dayOfWeek] || 99) : 99;
    const orderB = b.schedule ? (DAY_ORDER[b.schedule.dayOfWeek] || 99) : 99;
    return orderA - orderB;
  });

  const filteredSchedulesList = allSchedulesList.filter((item) => {
    if (selectedDayFilter === "ALL") return true;
    return item.schedule?.dayOfWeek === selectedDayFilter;
  });

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Doctors Directory</h2>
          <p className="section-subtext">Manage registered doctors, consultation hours, and weekly duty schedules.</p>
        </div>
        <button className="primary-btn" onClick={handleOpenRegisterModal}>
          + Register Doctor
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ========================================================================= */}
      {/* TABLE 1: DOCTORS LIST (TOP)                                              */}
      {/* ========================================================================= */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-header-left">
            <h3 className="dash-card-title">Doctors List</h3>
            <span className="section-subtext">Registered clinical practitioners and contact details</span>
          </div>
          <div className="dash-card-header-actions">
            <button
              type="button"
              className={`edit-toggle-btn ${isEditingDoctors ? "active" : ""}`}
              onClick={() => setIsEditingDoctors(!isEditingDoctors)}
              title="Toggle edit mode to update doctor details or remove doctors"
            >
              {isEditingDoctors ? "✓ Done Editing" : "✎ Edit Doctors"}
            </button>
          </div>
        </div>

        {isEditingDoctors && (
          <div className="edit-mode-banner">
            <span><strong>Edit Mode Active:</strong> Click <em>Edit</em> on any doctor below to update their name, age, or contact information.</span>
            <button
              type="button"
              className="secondary-btn-sm"
              onClick={() => setIsEditingDoctors(false)}
            >
              Close Edit Mode
            </button>
          </div>
        )}

        {doctors.length === 0 ? (
          <p className="empty-notice">No doctors registered yet. Click "+ Register Doctor" to add one.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: isEditingDoctors ? "20%" : "32%" }} />
                {isEditingDoctors && <col style={{ width: "12%" }} />}
              </colgroup>
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Age</th>
                  <th>Contact Number</th>
                  <th>Duty Schedule Summary</th>
                  {isEditingDoctors && <th className="th-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => {
                  const scheduleCount = d.schedules ? d.schedules.length : 0;
                  const daysList = d.schedules && d.schedules.length > 0
                    ? Array.from(new Set(d.schedules.map((s) => s.dayOfWeek?.substring(0, 3)))).join(", ")
                    : "No active days";

                  return (
                    <tr key={d.id}>
                      <td className="cell-doctor-name">{d.name}</td>
                      <td>{d.age} yrs old</td>
                      <td>{d.contact}</td>
                      <td>
                        {scheduleCount > 0 ? (
                          <span>
                            <strong>{scheduleCount} shift{scheduleCount > 1 ? "s" : ""}</strong>{" "}
                            <span className="text-muted">({daysList})</span>
                          </span>
                        ) : (
                          <span className="text-muted">No schedule configured</span>
                        )}
                      </td>
                      {isEditingDoctors && (
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="secondary-btn-sm"
                            onClick={() => handleOpenEditDoctorModal(d)}
                            title="Edit Doctor Details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-btn-sm"
                            onClick={() => handleDelete(d.id)}
                            title="Delete Doctor"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TABLE 2: DOCTOR SCHEDULES & AVAILABILITY (BOTTOM)                        */}
      {/* ========================================================================= */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-header-left">
            <h3 className="dash-card-title">Doctor Schedules &amp; Availability</h3>
            <span className="section-subtext">Weekly consultation shifts, duty hours, and real-time availability status</span>
          </div>
          <div className="dash-card-header-actions">
            <div className="schedule-filter-dropdown-wrap">
              <label className="schedule-filter-label">Day:</label>
              <select
                className="schedule-filter-select"
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value)}
              >
                <option value={currentDayName}>
                  {currentDayName.charAt(0) + currentDayName.slice(1).toLowerCase()} (Today)
                </option>
                <option value="ALL">🗓 All Days (Mon–Sun)</option>
                {DAYS_OF_WEEK.filter((d) => d !== currentDayName).map((day) => (
                  <option key={day} value={day}>
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={`edit-toggle-btn ${isEditingSchedules ? "active" : ""}`}
              onClick={() => setIsEditingSchedules(!isEditingSchedules)}
              title="Toggle edit mode to adjust doctor schedules and duty shifts"
            >
              {isEditingSchedules ? "✓ Done Editing" : "✎ Edit Schedules"}
            </button>
          </div>
        </div>

        {isEditingSchedules && (
          <div className="edit-mode-banner">
            <span><strong>Edit Mode Active:</strong> Click <em>Adjust Schedule</em> on any doctor below to add/remove duty days or modify consultation hours.</span>
            <button
              type="button"
              className="secondary-btn-sm"
              onClick={() => setIsEditingSchedules(false)}
            >
              Close Edit Mode
            </button>
          </div>
        )}

        {doctors.length === 0 ? (
          <p className="empty-notice">No doctor schedules found. Register a doctor to create schedules.</p>
        ) : filteredSchedulesList.length === 0 ? (
          <p className="empty-notice">
            No doctor duty shifts configured for{" "}
            <strong>
              {selectedDayFilter === "ALL"
                ? "any day"
                : selectedDayFilter.charAt(0) + selectedDayFilter.slice(1).toLowerCase() + (selectedDayFilter === currentDayName ? " (Today)" : "")}
            </strong>
            . Select <em>"All Days"</em> or another day from the dropdown above to view other duty shifts.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: isEditingSchedules ? "18%" : "32%" }} />
                {isEditingSchedules && <col style={{ width: "14%" }} />}
              </colgroup>
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Day of Week</th>
                  <th>Duty Hours</th>
                  <th>Availability Status</th>
                  {isEditingSchedules && <th className="th-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSchedulesList.map((item, idx) => {
                  const { doctor, schedule, scheduleIndex } = item;
                  const currentStatus = schedule ? getDoctorScheduleStatus(doctor, schedule, scheduleIndex) : "";
                  const slug = statusToSlug(currentStatus);

                  return (
                    <tr key={`${doctor.id}-${schedule?.id || idx}`}>
                      <td className="cell-doctor-name">{doctor.name}</td>
                      <td>
                        {schedule ? (
                          <span className="day-badge">
                            {schedule.dayOfWeek}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {schedule ? (
                          <span className="time-range-badge">
                            🕒 {schedule.startTime?.substring(0, 5)} – {schedule.endTime?.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-muted">No schedule set</span>
                        )}
                      </td>
                      <td>
                        {schedule ? (
                          <select
                            className={`status-select status-select-${slug}`}
                            value={currentStatus}
                            onChange={(e) => {
                              setDoctorScheduleStatus(doctor.id, schedule, scheduleIndex, e.target.value);
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
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      {isEditingSchedules && (
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="secondary-btn-sm"
                            onClick={() => handleOpenEditScheduleModal(doctor)}
                            title="Adjust weekly schedule for this doctor"
                          >
                            Adjust Schedule
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTER / EDIT DOCTOR / ADJUST SCHEDULES                          */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>
                {modalMode === "REGISTER"
                  ? "Register New Doctor"
                  : modalMode === "EDIT_SCHEDULE"
                  ? `Adjust ${editingDoctor?.name}'s Schedules`
                  : `Edit ${editingDoctor?.name}'s Profile`}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {modalError && <ErrorBanner message={modalError} />}

            <form onSubmit={handleSaveDoctor} className="form-layout">
              {/* Profile fields (shown in Register and Edit Doctor mode) */}
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

              {/* Adjustable Weekly Schedules Section */}
              <div className="form-group">
                <div className="schedule-header-row">
                  <label>Weekly Duty Schedules (Adjustable) *</label>
                  <button
                    type="button"
                    className="secondary-btn-sm"
                    onClick={handleAddScheduleRow}
                  >
                    + Add Day
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
                  {submitting ? "Saving..." : editingDoctor ? "Save Changes" : "Register Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

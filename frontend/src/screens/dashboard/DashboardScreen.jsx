import { useEffect, useState } from "react";
import { getAppointments, completeAppointment, cancelAppointment } from "../../api/appointments.js";
import { getPatients } from "../../api/patients.js";
import { getDoctors } from "../../api/doctors.js";
import { getDoctorScheduleStatus, setDoctorScheduleStatus, statusToSlug, STATUS_OPTIONS } from "../../utils/doctorStatus.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Day names matching Java's DayOfWeek enum (Sunday = index 0)
const JAVA_DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

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

/** Format a date string "YYYY-MM-DD" to "MMM D, YYYY" */
function formatDate(dateStr) {
  if (!dateStr) return "--";
  const [year, month, day] = dateStr.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1].slice(0, 3)} ${parseInt(day, 10)}, ${year}`;
}

/** Build a YYYY-MM-DD string from year/month/day (all numbers) */
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DashboardScreen() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [, setStatusVersion] = useState(0);

  // Calendar state — default to today
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [calSelectedDate, setCalSelectedDate] = useState(
    toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  );

  // Sync with doctor availability changes across components
  useEffect(() => {
    function onStatusChange() {
      setStatusVersion((v) => v + 1);
    }
    window.addEventListener("clinica-doctor-status-change", onStatusChange);
    return () => window.removeEventListener("clinica-doctor-status-change", onStatusChange);
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [apptsRes, patientsRes, docsRes] = await Promise.all([
        getAppointments().catch(() => []),
        getPatients().catch(() => []),
        getDoctors().catch(() => []),
      ]);

      setAppointments(Array.isArray(apptsRes) ? apptsRes : []);
      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
      setDoctors(Array.isArray(docsRes) ? docsRes : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (newStatus === "COMPLETED") {
      setActioningId(appointmentId);
      try {
        await completeAppointment(appointmentId);
        await loadData();
      } catch (err) {
        setError(err.message);
      } finally {
        setActioningId(null);
      }
    } else if (newStatus === "CANCEL") {
      if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
      setActioningId(appointmentId);
      try {
        await cancelAppointment(appointmentId);
        await loadData();
      } catch (err) {
        setError(err.message);
      } finally {
        setActioningId(null);
      }
    }
  };

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  // Today's metrics — filter by today's date only
  const now = new Date();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDayName = JAVA_DAY_NAMES[now.getDay()];
  const formattedTodayDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const totalVisits = todayAppointments.length;
  const completedOrPaid = todayAppointments.filter((a) => a.status === "COMPLETED" || a.status === "PAID").length;

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const appointmentDates = new Set((appointments || []).map((a) => a.appointmentDate));
  const calDayAppointments = (appointments || []).filter((a) => a.appointmentDate === calSelectedDate);
  const sortedDayAppointments = [...calDayAppointments].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  );

  const goToPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const goToNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };
  const goToToday = () => {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
    setCalSelectedDate(toDateStr(n.getFullYear(), n.getMonth(), n.getDate()));
  };

  // Build calendar cells
  const calCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const selectedDayName = calSelectedDate
    ? DAYS_NAMES[new Date(calSelectedDate + "T00:00:00").getDay()]
    : "";
  const selectedFormattedDate = formatDate(calSelectedDate);

  // Filter doctors with shifts scheduled for today
  const todayDoctorsList = [];
  doctors.forEach((doc) => {
    if (doc.schedules && doc.schedules.length > 0) {
      doc.schedules.forEach((s, sIdx) => {
        if (s.dayOfWeek === todayDayName) {
          todayDoctorsList.push({
            doctor: doc,
            schedule: s,
            scheduleIndex: sIdx,
          });
        }
      });
    }
  });

  // Sort by doctor name then start time
  todayDoctorsList.sort((a, b) => {
    if (a.doctor.name !== b.doctor.name) {
      return a.doctor.name.localeCompare(b.doctor.name);
    }
    return (a.schedule.startTime || "").localeCompare(b.schedule.startTime || "");
  });

  if (loading) {
    return (
      <div className="dashboard-view">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {error && <ErrorBanner message={error} />}

      {/* 1. Appointments Overview Container + Calendar side-by-side */}
      <div className="appt-overview-layout">
        {/* Appointments Overview Table Panel */}
        <section className="dash-card appt-table-panel">
          <div className="section-header-row">
            <div>
              <h2 className="dash-card-title">Appointments Overview</h2>
              <p className="section-subtext" style={{ marginTop: "0.2rem" }}>
                Showing appointments for{" "}
                <strong>{selectedDayName}, {selectedFormattedDate}</strong>
                {calSelectedDate === todayStr && <span style={{ color: "var(--sidebar-bg)", fontWeight: 700 }}> (Today)</span>}
              </p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="appt-empty-state">
              <p className="empty-notice">No appointments found in the database. You can book an appointment under the Appointments tab.</p>
            </div>
          ) : sortedDayAppointments.length === 0 ? (
            <div className="appt-empty-state">
              <p className="empty-notice">
                No appointments scheduled for <strong>{selectedDayName}, {selectedFormattedDate}</strong>. Select a date with a dot (•) on the calendar to view its appointments.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dash-table">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>Ailment</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDayAppointments.map((appt, idx) => {
                    const patient = patientMap.get(appt.patient?.id);
                    const status = appt.status || "SCHEDULED";
                    const isScheduled = status === "SCHEDULED";
                    const isCompleted = status === "COMPLETED";

                    return (
                      <tr key={appt.id || idx}>
                        <td className="cell-patient-name">{appt.patient?.name || "N/A"}</td>
                        <td>{patient?.age ?? "—"}</td>
                        <td>{appt.ailment || "General Consultation"}</td>
                        <td>{appt.doctor?.name || "N/A"}</td>
                        <td>{formatDate(appt.appointmentDate)}</td>
                        <td>{formatTimeTo12h(appt.startTime)}</td>
                        <td>
                          {isScheduled ? (
                            <select
                              className="status-dropdown-select status-scheduled"
                              value="SCHEDULED"
                              disabled={actioningId === appt.id}
                              onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                              title="Change status or cancel appointment"
                            >
                              <option value="SCHEDULED">Scheduled</option>
                              <option value="COMPLETED">Mark Completed</option>
                              <option value="CANCEL">✕ Cancel</option>
                            </select>
                          ) : isCompleted ? (
                            <select
                              className="status-dropdown-select status-completed"
                              value="COMPLETED"
                              disabled={actioningId === appt.id}
                              onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                              title="Completed — ready for payment in Payments tab"
                            >
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCEL">✕ Cancel</option>
                            </select>
                          ) : (
                            <span className="status-paid" title="Payment settled">
                              Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Calendar Widget Panel */}
        <div className="appt-calendar-panel">
          <div className="cal-widget">
            <div className="cal-header">
              <button className="cal-nav-btn" onClick={goToPrevMonth} title="Previous month">‹</button>
              <div className="cal-month-year">
                <span className="cal-month-name">{MONTH_NAMES[calMonth]}</span>
                <span className="cal-year">{calYear}</span>
              </div>
              <button className="cal-nav-btn" onClick={goToNextMonth} title="Next month">›</button>
            </div>

            <div className="cal-today-row">
              <button className="cal-today-btn" onClick={goToToday}>Today</button>
            </div>

            <div className="cal-dow-row">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="cal-dow-label">{d}</span>
              ))}
            </div>

            <div className="cal-grid">
              {calCells.map((day, idx) => {
                if (!day) return <span key={`empty-${idx}`} className="cal-cell cal-cell-empty" />;
                const dateStr = toDateStr(calYear, calMonth, day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === calSelectedDate;
                const hasAppts = appointmentDates.has(dateStr);
                const apptCount = (appointments || []).filter((a) => a.appointmentDate === dateStr).length;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    className={[
                      "cal-cell",
                      isToday ? "cal-cell-today" : "",
                      isSelected ? "cal-cell-selected" : "",
                      hasAppts && !isSelected ? "cal-cell-has-appts" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => setCalSelectedDate(dateStr)}
                    title={hasAppts ? `${apptCount} appointment${apptCount > 1 ? "s" : ""}` : ""}
                  >
                    {day}
                    {hasAppts && <span className="cal-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Today's Metrics Section */}
      <section className="dash-section">
        <h2 className="dash-section-title">Today's Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Total Appointments Today</span>
            <div className="metric-value">{totalVisits}</div>
            <span className="metric-desc">Scheduled for today ({todayStr})</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Completed / Settled</span>
            <div className="metric-value">{completedOrPaid}</div>
            <span className="metric-desc">Consultations done or paid today</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Total Registered Doctors</span>
            <div className="metric-value">{doctors.length}</div>
            <span className="metric-desc">Active Clinical Staff</span>
          </div>
        </div>
      </section>

      {/* 3. Daily Doctor Availability (Filtered for Today's Shifts) */}
      <section className="dash-card">
        <div className="section-header-row">
          <div>
            <h2 className="dash-card-title">Daily Doctor Availability</h2>
            <p className="section-subtext" style={{ marginTop: "0.2rem" }}>
              Doctors scheduled for duty today (<strong>{formattedTodayDate}</strong>) &amp; real-time availability status
            </p>
          </div>
        </div>

        {doctors.length === 0 ? (
          <p className="empty-notice">No doctors registered yet.</p>
        ) : todayDoctorsList.length === 0 ? (
          <p className="empty-notice">
            No doctors are scheduled for duty today (<strong>{todayDayName.charAt(0) + todayDayName.slice(1).toLowerCase()}</strong>). Visit the <strong>Doctors Directory</strong> to view full weekly schedules.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "30%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Today's Shift Hours</th>
                  <th>Availability Status</th>
                </tr>
              </thead>
              <tbody>
                {todayDoctorsList.map((item, idx) => {
                  const { doctor, schedule, scheduleIndex } = item;
                  const currentStatus = getDoctorScheduleStatus(doctor, schedule, scheduleIndex);
                  const slug = statusToSlug(currentStatus);

                  return (
                    <tr key={`${doctor.id}-${schedule?.id || idx}`}>
                      <td className="cell-doctor-name">
                        <strong>{doctor.name}</strong>
                      </td>
                      <td>
                        <span className="time-range-badge">
                          🕒 {schedule.startTime?.substring(0, 5)} – {schedule.endTime?.substring(0, 5)}
                        </span>
                      </td>
                      <td>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

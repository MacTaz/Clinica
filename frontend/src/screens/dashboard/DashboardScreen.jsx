import { useEffect, useState } from "react";
import { getAppointments, completeAppointment, cancelAppointment } from "../../api/appointments.js";
import { getPatients } from "../../api/patients.js";
import { getDoctors } from "../../api/doctors.js";
import { getDoctorScheduleStatus, setDoctorScheduleStatus, statusToSlug, STATUS_OPTIONS } from "../../utils/doctorStatus.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

// Day names matching Java's DayOfWeek enum (Sunday = index 0)
const JAVA_DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function DashboardScreen() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [, setStatusVersion] = useState(0);

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
  const todayStr = now.toISOString().split("T")[0];
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

      {/* 1. Scheduled Appointments Table */}
      <section className="dash-card">
        <div className="section-header-row">
          <div>
            <h2 className="dash-card-title">Appointments Overview</h2>
            <p className="section-subtext" style={{ marginTop: "0.2rem" }}>
              3 Stages: <strong style={{ color: "#1d4ed8" }}>Scheduled</strong> → <strong style={{ color: "#b45309" }}>Completed</strong> → <strong style={{ color: "#047857" }}>Paid</strong>
            </p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <p className="empty-notice">No appointments found in the database. You can book an appointment under the Appointments tab.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Ailment</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, idx) => {
                  const patient = patientMap.get(appt.patient?.id);
                  const startTime = appt.startTime ? appt.startTime.substring(0, 5) : "--:--";
                  const status = appt.status || "SCHEDULED";
                  const isScheduled = status === "SCHEDULED";
                  const isCompleted = status === "COMPLETED";

                  return (
                    <tr key={appt.id || idx}>
                      <td className="cell-patient-name">{appt.patient?.name || "N/A"}</td>
                      <td>{patient?.age ?? "—"}</td>
                      <td>{appt.ailment || "General Consultation"}</td>
                      <td>{appt.doctor?.name || "N/A"}</td>
                      <td>{appt.appointmentDate} @ {startTime}</td>
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

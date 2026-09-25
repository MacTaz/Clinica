import { useEffect, useState } from "react";
import { getAppointments } from "../../api/appointments.js";
import { getPatients } from "../../api/patients.js";
import { getDoctors } from "../../api/doctors.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

function formatStatusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("confirm") || s.includes("in")) return "status-confirmed";
  if (s.includes("cancel")) return "status-canceled";
  if (s.includes("ongoing")) return "status-ongoing";
  if (s.includes("late")) return "status-late";
  return "status-neutral";
}

// Day names matching Java's DayOfWeek enum (Sunday = index 0)
const JAVA_DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function getDoctorScheduleSummary(schedules) {
  if (!schedules || schedules.length === 0) return "No schedule set";
  return schedules
    .map((s) => `${s.dayOfWeek?.substring(0, 3)} ${(s.startTime || "").substring(0, 5)}-${(s.endTime || "").substring(0, 5)}`)
    .join(", ");
}

/**
 * Returns "On Duty" if the doctor has a schedule block for today that
 * spans the current local time, otherwise "Off Duty".
 */
function getDoctorDutyStatus(schedules) {
  if (!schedules || schedules.length === 0) return "Off Duty";
  const now = new Date();
  const todayName = JAVA_DAY_NAMES[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isOnDuty = schedules.some((s) => {
    if (s.dayOfWeek !== todayName) return false;
    const start = (s.startTime || "").substring(0, 5);
    const end = (s.endTime || "").substring(0, 5);
    return currentTime >= start && currentTime < end;
  });
  return isOnDuty ? "On Duty" : "Off Duty";
}

export default function DashboardScreen() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [apptsRes, patientsRes, docsRes] = await Promise.all([
          getAppointments().catch(() => []),
          getPatients().catch(() => []),
          getDoctors().catch(() => []),
        ]);

        if (!isMounted) return;

        setAppointments(Array.isArray(apptsRes) ? apptsRes : []);
        setPatients(Array.isArray(patientsRes) ? patientsRes : []);
        setDoctors(Array.isArray(docsRes) ? docsRes : []);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load dashboard data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  // Today's metrics — filter by today's date only
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const totalVisits = todayAppointments.length;
  const successfulAppts = todayAppointments.length; // All existing appointments are confirmed
  // canceledAppts is always 0 because canceling an appointment deletes it from the DB
  const canceledAppts = 0;

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
        <h2 className="dash-card-title">Scheduled appointments</h2>
        {appointments.length === 0 ? (
          <p className="empty-notice">No scheduled appointments found in the database. You can book an appointment under the Appointments tab.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Ailment</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th className="th-status">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, idx) => {
                  const patient = patientMap.get(appt.patient?.id);
                  const startTime = appt.startTime ? appt.startTime.substring(0, 5) : "--:--";

                  return (
                    <tr key={appt.id || idx}>
                      <td className="cell-patient-name">{appt.patient?.name || "N/A"}</td>
                      <td>{patient?.age ?? "—"}</td>
                      <td>{patient?.ailment || "General Consultation"}</td>
                      <td>{appt.doctor?.name || "N/A"}</td>
                      <td>{appt.appointmentDate} @ {startTime}</td>
                      <td className="cell-status status-confirmed">Confirmed</td>
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
            <span className="metric-label">Patient Visits</span>
            <div className="metric-value">{totalVisits}</div>
            <span className="metric-desc">Current Visits for today's clinical appointment</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Successful Appointments</span>
            <div className="metric-value">{successfulAppts}</div>
            <span className="metric-desc">Current Successful Appointments for today</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Canceled Appointments</span>
            <div className="metric-value">{canceledAppts}</div>
            <span className="metric-desc">Current Canceled Appointments for today</span>
          </div>
        </div>
      </section>

      {/* 3. Doctor Schedule Status */}
      <section className="dash-card">
        <h2 className="dash-card-title">Doctor Schedule Status</h2>
        {doctors.length === 0 ? (
          <p className="empty-notice">No doctors registered yet. Register doctors under the Doctors tab.</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Scheduled Appointments</th>
                  <th className="th-status">Current Status</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => {
                  const dutyStatus = getDoctorDutyStatus(doc.schedules);
                  const isOnDuty = dutyStatus === "On Duty";
                  return (
                    <tr key={doc.id}>
                      <td className="cell-doctor-name">{doc.name}</td>
                      <td>{doc.contact || "—"}</td>
                      <td>{getDoctorScheduleSummary(doc.schedules)}</td>
                      <td className={`cell-status ${isOnDuty ? "status-confirmed" : "status-neutral"}`}>
                        {dutyStatus}
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

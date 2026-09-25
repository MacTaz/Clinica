const STORAGE_KEY = "clinica_doctor_schedule_statuses";

export const STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Not Available", label: "Not Available" },
  { value: "Running Late", label: "Running Late" },
];

/**
 * Generates a stable unique key for a doctor's specific schedule block.
 */
export function getScheduleKey(doctorId, schedule, idx = 0) {
  if (!schedule) return `${doctorId}_default`;
  if (schedule.id) return `${doctorId}_sched_${schedule.id}`;
  const day = (schedule.dayOfWeek || "").toUpperCase();
  const start = (schedule.startTime || "").substring(0, 5);
  const end = (schedule.endTime || "").substring(0, 5);
  return `${doctorId}_${day}_${start}_${end}_${idx}`;
}

/**
 * Gets a specific schedule block's status for a doctor.
 * Returns empty string "" if not yet selected (starts as white dropdown).
 */
export function getDoctorScheduleStatus(doctor, schedule, idx = 0) {
  if (!doctor || !doctor.id) return "";
  const key = getScheduleKey(doctor.id, schedule, idx);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored[key] !== undefined) {
        return stored[key];
      }
    }
  } catch (err) {
    console.error("Failed to read doctor status from storage", err);
  }

  return "";
}

/**
 * Sets a doctor's availability status for a specific schedule block
 * and broadcasts the change across components.
 */
export function setDoctorScheduleStatus(doctorId, schedule, idx, status) {
  const key = getScheduleKey(doctorId, schedule, idx);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[key] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    window.dispatchEvent(
      new CustomEvent("clinica-doctor-status-change", {
        detail: { doctorId, scheduleKey: key, status },
      })
    );
  } catch (err) {
    console.error("Failed to set doctor schedule status", err);
  }
}

/**
 * Converts status string to CSS class slug.
 */
export function statusToSlug(status) {
  if (!status) return "unselected";
  const s = status.toLowerCase();
  if (s.includes("not") || s.includes("unavail") || s.includes("cancel")) return "unavailable";
  if (s.includes("late")) return "late";
  if (s.includes("avail") || s.includes("in")) return "available";
  return "unselected";
}

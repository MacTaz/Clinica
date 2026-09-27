import { api } from "./client.js";

export function getAvailability(date) {
  return api.get(`/appointments/availability?date=${date}`);
}

export function bookAppointment(appointment) {
  return api.post("/appointments", appointment);
}

export function getAppointments() {
  return api.get("/appointments");
}

export function completeAppointment(appointmentId) {
  return api.patch(`/appointments/${appointmentId}/complete`);
}

export function cancelAppointment(appointmentId) {
  return api.del(`/appointments/${appointmentId}`);
}

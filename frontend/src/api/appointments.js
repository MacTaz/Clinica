import { api } from "./client.js";

export function getAvailability(date, specializationId) {
  const query = specializationId ? `date=${date}&specializationId=${specializationId}` : `date=${date}`;
  return api.get(`/appointments/availability?${query}`);
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

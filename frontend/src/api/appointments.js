import { api } from "./client.js";

export function getAvailability(specializationId, date) {
  return api.get(`/appointments/availability?specializationId=${specializationId}&date=${date}`);
}

export function bookAppointment(appointment) {
  return api.post("/appointments", appointment);
}

export function getAppointments() {
  return api.get("/appointments");
}

export function cancelAppointment(appointmentId) {
  return api.del(`/appointments/${appointmentId}`);
}

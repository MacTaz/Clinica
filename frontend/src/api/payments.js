import { api } from "./client.js";

export function recordPayment(appointmentId, payment) {
  return api.post(`/appointments/${appointmentId}/payment`, payment);
}

export function getPayments() {
  return api.get("/payments");
}

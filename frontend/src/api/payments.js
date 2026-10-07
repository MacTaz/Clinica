import { api } from "./client.js";

export function recordPayment(appointmentId, payment) {
  return api.post(`/appointments/${appointmentId}/payment`, payment);
}

export function getPayments() {
  return api.get("/payments");
}

/** Creates a PayMongo Checkout Session for the given appointment.
 *  Resolves to { checkoutUrl: "https://test-checkout.paymongo.com/..." } */
export function createOnlineCheckout(appointmentId) {
  return api.post(`/appointments/${appointmentId}/paymongo-checkout`);
}

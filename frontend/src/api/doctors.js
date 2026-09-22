import { api } from "./client.js";

export function registerDoctor(doctor) {
  return api.post("/doctors", doctor);
}

export function getDoctors() {
  return api.get("/doctors");
}

export function deleteDoctor(doctorId) {
  return api.del(`/doctors/${doctorId}`);
}

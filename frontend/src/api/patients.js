import { api } from "./client.js";

export function registerPatient(patient) {
  return api.post("/patients", patient);
}

export function getPatients() {
  return api.get("/patients");
}

export function addMedicalHistory(patientId, entry) {
  return api.post(`/patients/${patientId}/history`, { entry });
}

export function updatePatient(patientId, patient) {
  return api.put(`/patients/${patientId}`, patient);
}

export function deletePatient(patientId) {
  return api.del(`/patients/${patientId}`);
}


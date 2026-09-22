import { api } from "./client.js";

// Fully wired — use as the pattern for the other api/*.js files.
export function getSpecializations() {
  return api.get("/specializations");
}

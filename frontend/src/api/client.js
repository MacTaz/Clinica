const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

/**
 * Thin fetch wrapper — every screen goes through this (via the api/*.js
 * files), never through a raw fetch() call, so the base URL and error
 * handling stay in one place. Throws an Error with the backend's message
 * (see the Errors section of docs/API_CONTRACT.md) on non-2xx responses.
 */
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};

import { useEffect, useState } from "react";
import { getPatients } from "../../api/patients.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

// Fully wired end-to-end — use as the pattern for the other screens.
export default function PatientDirectory() {
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!patients) return <LoadingSpinner />;

  return (
    <section>
      <h1>Patients</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Contact</th>
            <th>Ailment</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.age}</td>
              <td>{p.contact}</td>
              <td>{p.ailment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

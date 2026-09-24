import { useEffect, useState } from "react";
import { getPatients, registerPatient, deletePatient } from "../../api/patients.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

export default function PatientDirectory() {
  const [patients, setPatients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", age: "", contact: "", ailment: "" });
  const [submitting, setSubmitting] = useState(false);

  function loadPatients() {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await registerPatient({
        name: formData.name,
        age: parseInt(formData.age, 10),
        contact: formData.contact,
        ailment: formData.ailment || "None",
      });
      setShowModal(false);
      setFormData({ name: "", age: "", contact: "", ailment: "" });
      loadPatients();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await deletePatient(id);
      loadPatients();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !patients) return <ErrorBanner message={error} />;
  if (!patients) return <LoadingSpinner />;

  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.contact && p.contact.toLowerCase().includes(q)) ||
      (p.ailment && p.ailment.toLowerCase().includes(q))
    );
  });

  return (
    <section className="section-container">
      <div className="section-header-row">
        <div>
          <h2>Patients Directory</h2>
          <p className="section-subtext">Register patients first, then search & book their appointments with specific ailments.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Register Patient
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="dash-card">
        {/* Search Bar for Patients */}
        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient by name, contact, or ailment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕ Clear
            </button>
          )}
        </div>

        {patients.length === 0 ? (
          <p className="empty-notice">No patients registered yet. Click "+ Register Patient" to add one.</p>
        ) : filteredPatients.length === 0 ? (
          <p className="empty-notice">No registered patients found matching "{searchTerm}".</p>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Current / Last Ailment</th>
                  <th className="th-status">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-patient-name">{p.name}</td>
                    <td>{p.age}</td>
                    <td>{p.contact}</td>
                    <td>{p.ailment || "None"}</td>
                    <td className="cell-actions">
                      <button className="danger-btn-sm" onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegister} className="form-layout">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Jane Cruz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="150"
                  placeholder="e.g. 34"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 09171234567"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

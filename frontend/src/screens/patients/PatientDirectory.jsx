import { useEffect, useState } from "react";
import { getPatients, registerPatient, deletePatient } from "../../api/patients.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";

export default function PatientDirectory() {
  const [patients, setPatients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const INITIAL_FORM_STATE = { firstName: "", lastName: "", age: "", contact: "", ailment: "" };
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  function loadPatients() {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadPatients();
  }, []);

  function handleCloseModal() {
    setShowModal(false);
    setFormData(INITIAL_FORM_STATE);
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      await registerPatient({
        name: fullName,
        age: parseInt(formData.age, 10),
        contact: formData.contact.trim(),
        ailment: formData.ailment || "None",
      });
      handleCloseModal();
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
              <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleRegister} className="form-layout">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Jane"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Cruz"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
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
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 09171234567"
                  value={formData.contact}
                  onKeyDown={(e) => {
                    if (
                      e.key.length === 1 &&
                      !/[0-9]/.test(e.key) &&
                      !(e.ctrlKey || e.metaKey)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, contact: digits });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Ailment / Chief Complaint <span className="optional-label">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Diabetes, Skin rash"
                  value={formData.ailment}
                  onChange={(e) => setFormData({ ...formData, ailment: e.target.value })}
                />
                <small className="section-subtext">Can also be set or updated when booking an appointment.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={handleCloseModal}>
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

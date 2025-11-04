// CredentialForm.jsx
// Form for creating/updating credentials:
// - Handles division selection and credential details
// - Validates input fields (non-empty, password length)
// - Submits to API with token for authentication
import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const CredentialForm = ({
  credential,
  divisions = [],
  onSuccess,
  onCancel,
  readOnly = false,
}) => {
  const isEdit = !!credential && !readOnly;

  const [form, setForm] = useState({
    destinationId: "",
    credentialName: "",
    username: "",
    password: "",
    notes: "",
  });

  // Sync form when credential or divisions change
  useEffect(() => {
    if (!credential) {
      setForm({
        destinationId: "",
        credentialName: "",
        username: "",
        password: "",
        notes: "",
      });
      return;
    }

    const credDivId = credential.divisionId?._id || credential.divisionId;
    const matchingDiv = divisions.find(
      (d) => d._id.toString() === credDivId?.toString()
    );
    const destinationId = matchingDiv?._id || "";

    setForm({
      destinationId,
      credentialName: credential.credentialName || "",
      username: credential.username || "",
      password: credential.password || "", // Plaintext from DB
      notes: credential.notes || "",
    });
  }, [credential, divisions]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    const token = localStorage.getItem("token");

    // Find selected division
    const selectedDiv = divisions.find((d) => d._id === form.destinationId);
    if (!selectedDiv) return alert("Please select a valid division");

    const payload = {
      ouId: selectedDiv.ouId?._id || selectedDiv.ouId,
      divisionId: selectedDiv._id,
      credentialName: form.credentialName,
      username: form.username,
      password: form.password,
      notes: form.notes,
    };

    // Only include password if non-empty (for updates)
    if (isEdit && form.password.trim() !== "") {
      payload.password = form.password;
    } else if (!isEdit) {
      payload.password = form.password; // creating new, password required
    }

    try {
      if (isEdit) {
        await axios.put(`${API}/credentials/${credential._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/credentials/addcred`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess(); // notify parent to refresh list / close form
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const isLoaded = divisions.length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        {/* Division */}
        <div className="col-md-6">
          <label className="form-label">Division</label>
          {readOnly ? (
            <input
              className="form-control"
              value={`${credential?.divisionId?.ouId?.name || "Unknown"} - ${
                credential?.divisionId?.name || "Unknown"
              }`}
              readOnly
            />
          ) : !isLoaded ? (
            <div className="form-control text-muted">Loading divisions...</div>
          ) : (
            <select
              name="destinationId"
              className="form-select"
              value={form.destinationId}
              onChange={handleChange}
              required
            >
              <option value="">-- select --</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.ouId?.name || "No OU"} - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Credential Name */}
        <div className="col-md-6">
          <label className="form-label">Credential Name</label>
          <input
            name="credentialName"
            className="form-control"
            value={form.credentialName}
            onChange={handleChange}
            required
            readOnly={readOnly}
          />
        </div>

        {/* Username */}
        <div className="col-md-6">
          <label className="form-label">Username</label>
          <input
            name="username"
            className="form-control"
            value={form.username}
            onChange={handleChange}
            required
            readOnly={readOnly}
          />
        </div>

        {/* Password */}
        <div className="col-md-6">
          <label className="form-label">
            {readOnly
              ? "Password"
              : isEdit
              ? "New Password (optional)"
              : "Password"}
          </label>
          <input
            type={readOnly ? "text" : "password"}
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required={!isEdit && !readOnly}
            readOnly={readOnly}
            placeholder={isEdit ? "Leave blank to keep current" : ""}
            style={readOnly ? { backgroundColor: "#f8f9fa" } : {}}
          />
        </div>

        {/* Notes */}
        <div className="col-12">
          <label className="form-label">Notes (optional)</label>
          <textarea
            name="notes"
            className="form-control"
            rows="2"
            value={form.notes}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>

        {/* Buttons */}
        <div className="col-12 d-flex gap-2">
          {!readOnly && (
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Update" : "Create"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CredentialForm;

// CredentialList.jsx
// List of stored credentials:
// - Displays username, division, and credential name
// - Allows editing or deleting credentials
// - Shows view card for selected credential
import { useState } from "react";
import CredentialForm from "./CredentialForm";

const CredentialList = ({ credentials, divisions, canEdit, onEdit }) => {
  const [viewing, setViewing] = useState(null);

  return (
    <div>
      {/* View Card */}
      {/* Displays a read-only form for a selected credential */}
      {viewing && (
        <div className="card mb-4 border-primary">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">View Credential</h5>
            <button
              className="btn-close"
              onClick={() => setViewing(null)}
              aria-label="Close"
            />
          </div>
          <div className="card-body">
            <CredentialForm
              credential={viewing} // Pass selected credential
              divisions={divisions} // Required for displaying division names
              readOnly={true} // Force read-only mode
              onCancel={() => setViewing(null)}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="card">
        <div className="card-header">Stored Credentials</div>
        <ul className="list-group list-group-flush">
          {/* Display message if no credentials exist */}
          {credentials.length === 0 ? (
            <li className="list-group-item text-center text-muted">
              No credentials yet.
            </li>
          ) : (
            // Map over each credential to render list items
            credentials.map((c) => (
              <li
                key={c._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {/* Credential info */}
                <div>
                  <strong>{c.username}</strong>
                  <span className="text-primary ms-2">
                    {c.divisionId?.ouId?.name} - {c.divisionId?.name}
                  </span>
                  {c.credentialName && (
                    <small className="text-muted ms-2">
                      – {c.credentialName}
                    </small>
                  )}
                </div>

                {/* Action buttons */}
                <div className="btn-group btn-group-sm">
                  {/* View button opens the read-only view card */}
                  <button
                    className="btn btn-outline-info"
                    onClick={() => setViewing(c)}
                  >
                    View
                  </button>
                  {/* Edit button only appears if user can edit */}
                  {canEdit && (
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => onEdit(c)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default CredentialList;

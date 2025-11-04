// Dashboard component for user credential management
// Display credential list
// Add / edit credentials
// Admin user management panel
// Logout
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CredentialList from "../components/CredentialList";
import CredentialForm from "../components/CredentialForm";
import UserManagement from "../components/UserManagement";

const API = "http://localhost:5000/api";

const Dashboard = () => {
  const navigate = useNavigate();

  // Local state user, credentials, divisions
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [divisions, setDivisions] = useState([]); // ← NEW
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current user
  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load divisions for dropdown
  const loadDivisions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/divisions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDivisions(res.data.divisions || []);
    } catch (err) {
      console.error("Failed to load divisions", err);
    }
  }, []);

  // Load credentials
  const loadCredentials = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCredentials(res.data.credentials || []);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // Effects
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadDivisions();
      loadCredentials();
    }
  }, [user, loadDivisions, loadCredentials]);

  // Form helpers
  const startAdd = () => {
    setEditingCred(null);
    setShowAddForm(true);
  };
  const startEdit = (cred) => {
    setEditingCred(cred);
    setShowAddForm(true);
  };
  const closeForm = () => {
    setShowAddForm(false);
    setEditingCred(null);
  };
  const afterSubmit = () => {
    closeForm();
    loadCredentials();
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) return <div className="text-center py-5">Loading…</div>;

  const isAdmin = user?.role?.includes("admin");
  const isManager = user?.role?.includes("manager");

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          Dashboard <small className="text-muted">({user?.email})</small>
        </h1>
        <button className="btn btn-outline-danger" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 d-flex gap-2 flex-wrap">
        <button className="btn btn-success" onClick={startAdd}>
          Add Credential
        </button>

        {isAdmin && (
          <button
            className="btn btn-warning"
            data-bs-toggle="collapse"
            data-bs-target="#userManagement"
          >
            User Management
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card mb-4 p-3">
          <CredentialForm
            credential={editingCred}
            divisions={divisions}
            onSuccess={afterSubmit}
            onCancel={closeForm}
          />
        </div>
      )}

      {/* Credential List */}
      <CredentialList
        credentials={credentials}
        divisions={divisions}
        canEdit={isManager || isAdmin}
        onEdit={startEdit}
      />

      {/* Admin Panel */}
      {isAdmin && (
        <div className="collapse mt-5" id="userManagement">
          <div className="card card-body">
            <UserManagement />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

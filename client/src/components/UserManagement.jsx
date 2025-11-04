// UserManagement.jsx
// Admin user management panel:
// - Assign roles (user/manager/admin)
// - Manage division memberships and OU manager/member links
// - Uses Bootstrap Toasts for non-blocking success/error notifications
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import API from "../api/axiosConfig";
import { Toast } from "bootstrap";

const UserManagement = () => {
  // Local state
  const [users, setUsers] = useState([]); // List of users
  const [ous, setOus] = useState([]); // List of OUs
  const [divs, setDivs] = useState([]); // List of divisions
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error messages

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // POPUP (Toast) UI
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // success | warning | danger
  const toastRef = useRef(null);

  // Show a toast popup
  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    // Defer to ensure ref is rendered before instantiating Toast
    setTimeout(() => {
      if (toastRef.current) {
        const toast = new Toast(toastRef.current, {
          delay: 2500,
          autohide: true,
        });
        toast.show();
      }
    }, 0);
  };

  // Fetch all users, OUs, divisions
  const fetchData = async () => {
    try {
      const [uRes, ouRes, dRes] = await Promise.all([
        API.get("/users", { headers }),
        API.get("/ous", { headers }),
        API.get("/divisions", { headers }),
      ]);

      setUsers(uRes.data.users || []);
      setOus(ouRes.data || []);
      setDivs(dRes.data.divisions || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ROLE
  const setRole = async (userId, newRole) => {
    if (!window.confirm(`Set role to ${newRole}?`)) return;
    try {
      await API.put("/users/role", { userId, role: newRole }, { headers });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: [newRole] } : u))
      );
    } catch (err) {
      alert("Failed to update role");
    }
  };

  // DIVISION MEMBERSHIP
  // Add user to division
  const addToDivision = async (userId, divisionId) => {
    if (!divisionId) return;

    const user = users.find((u) => u._id === userId);
    const division = divs.find((d) => d._id === divisionId);

    try {
      const response = await API.post(
        "/membership/division/add",
        { userId, divisionId },
        { headers }
      );

      // Use the membership object returned from the backend
      const newMembership = response.data.membership;

      // Update local user state
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                memberships: [
                  // Keep existing memberships that are NOT for this division
                  ...u.memberships.filter(
                    (m) => m.divisionId?._id !== divisionId
                  ),
                  // Add the new membership with proper structure
                  newMembership,
                ],
              }
            : u
        )
      );

      // Success notification and refresh data (popup)
      showPopup(
        `Added ${user?.firstname} ${user?.lastname} to ${division?.name} division`,
        "success"
      );
      await fetchData(); // Refresh all data to ensure consistency
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to add user to division";
      if (err.response?.data?.error === "DUPLICATE_MEMBERSHIP") {
        showPopup(
          `${user?.firstname} ${user?.lastname} is already assigned to ${division?.name} division`,
          "warning"
        );
      } else {
        showPopup(errorMessage, "danger");
      }
    }
  };

  // Remove user from division membership
  const removeFromDivision = async (userId, divisionId) => {
    const user = users.find((u) => u._id === userId);
    const division = divs.find((d) => d._id === divisionId);

    try {
      await API.post(
        "/membership/division/remove",
        { userId, divisionId },
        { headers }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                memberships: u.memberships.filter(
                  (m) => m.divisionId?._id !== divisionId
                ),
              }
            : u
        )
      );

      // Success notification and refresh data (popup)
      showPopup(
        `Removed ${user?.firstname} ${user?.lastname} from ${division?.name} division`,
        "success"
      );
      await fetchData(); // Refresh all data to ensure consistency
    } catch (err) {
      showPopup(
        err.response?.data?.message || "Failed to remove user from division",
        "danger"
      );
    }
  };

  // OU MANAGER ASSIGNMENT
  // Add user to OU
  const addToOU = async (userId, ouId) => {
    try {
      await API.post("/membership/ou/add", { userId, ouId }, { headers });

      const newOU = ous.find((o) => o._id === ouId);
      if (!newOU) return showPopup("Selected OU not found", "danger");

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId && !u.managedOus?.some((o) => o._id === ouId)
            ? { ...u, managedOus: [...(u.managedOus || []), newOU] }
            : u
        )
      );

      showPopup("Added OU manager assignment", "success");
    } catch (err) {
      showPopup(err.response?.data?.message || "Failed to add OU", "danger");
    }
  };

  // Remove user from OU
  const removeFromOU = async (userId, ouId) => {
    try {
      await API.post("/membership/ou/remove", { userId, ouId }, { headers });
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          managedOus: u.managedOus.filter((o) => o._id !== ouId),
        }))
      );
      showPopup("Removed OU manager assignment", "success");
    } catch (err) {
      showPopup("Failed to remove OU", "danger");
    }
  };

  // OU MEMBER ASSIGNMENT
  // Add user to OU member
  const addToOUMember = async (userId, ouId) => {
    try {
      await API.post(
        "/membership/ou/member/add",
        { userId, ouId },
        { headers }
      );

      const normalizedOU = ous.find((o) => o._id === ouId);
      if (!normalizedOU) return showPopup("Selected OU not found", "danger");

      const newMembership = {
        _id: `oumember-${userId}-${ouId}`, // synthetic key for rendering
        userId,
        ouId: normalizedOU,
        divisionId: null,
      };

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId &&
          !u.memberships.some((m) => m.ouId?._id === ouId && !m.divisionId)
            ? {
                ...u,
                memberships: [...u.memberships, newMembership],
              }
            : u
        )
      );

      showPopup("Added OU membership", "success");
    } catch (err) {
      showPopup(
        err.response?.data?.message || "Failed to add OU member",
        "danger"
      );
    }
  };

  // Remove user from OU member
  const removeFromOUMember = async (userId, ouId) => {
    try {
      await API.post(
        "/membership/ou/member/remove",
        { userId, ouId },
        { headers }
      );
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          memberships: u.memberships.filter(
            (m) => m.ouId?._id !== ouId || m.divisionId
          ),
        }))
      );
      showPopup("Removed OU membership", "success");
    } catch (err) {
      showPopup("Failed to remove OU member", "danger");
    }
  };

  // RENDER
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container-fluid">
      {/* Toast popup container */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
        <div
          ref={toastRef}
          className={`toast text-bg-${popupType}`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">{popupMessage}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
      <h3>User Management</h3>
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Divisions</th>
              <th>OUs (Manager)</th>
              <th>OUs (Member)</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const ouMemberships =
                  u.memberships?.filter((m) => m.ouId && !m.divisionId) || [];
                return (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {["user", "manager", "admin"].map((r) => (
                          <button
                            key={r}
                            className={`btn ${
                              u.role.includes(r)
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => setRole(u._id, r)}
                            disabled={u.role.includes(r)}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm mb-1"
                        onChange={(e) => addToDivision(u._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Add Division
                        </option>
                        {divs.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.ouId?.name || "Unknown"} - {d.name}
                          </option>
                        ))}
                      </select>
                      <div>
                        {u.memberships
                          ?.filter((m) => m.divisionId)
                          .map((m) => (
                            <span
                              key={m._id}
                              className="badge bg-success me-1 mb-1"
                            >
                              {m.divisionId?.ouId?.name || "Unknown"} -{" "}
                              {m.divisionId?.name}
                              <button
                                className="btn-close btn-close-white ms-1"
                                style={{ fontSize: "0.6rem" }}
                                onClick={() =>
                                  removeFromDivision(u._id, m.divisionId._id)
                                }
                              />
                            </span>
                          ))}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm mb-1"
                        onChange={(e) => addToOU(u._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Add as Manager
                        </option>
                        {ous.map((o) => (
                          <option key={o._id} value={o._id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <div>
                        {u.managedOus?.map((ou) => (
                          <span
                            key={ou._id}
                            className="badge bg-info me-1 mb-1"
                          >
                            {ou.name}
                            <button
                              className="btn-close btn-close-white ms-1"
                              style={{ fontSize: "0.6rem" }}
                              onClick={() => removeFromOU(u._id, ou._id)}
                            />
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm mb-1"
                        onChange={(e) => addToOUMember(u._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Add as Member
                        </option>
                        {ous.map((o) => (
                          <option key={o._id} value={o._id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <div>
                        {ouMemberships.map((m) => (
                          <span
                            key={m._id}
                            className="badge bg-secondary me-1 mb-1"
                          >
                            {m.ouId?.name}
                            <button
                              className="btn-close btn-close-white ms-1"
                              style={{ fontSize: "0.6rem" }}
                              onClick={() =>
                                removeFromOUMember(u._id, m.ouId._id)
                              }
                            />
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

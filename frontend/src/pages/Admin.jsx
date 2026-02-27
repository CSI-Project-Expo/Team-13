import { useState, useEffect } from "react";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}

function UserRow({ user, onRoleChange, updating }) {
  const [newRole, setNewRole] = useState(user.role);

  const handleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleSave = () => {
    if (newRole !== user.role) onRoleChange(user.id, newRole);
  };

  return (
    <tr className="admin-table__row">
      <td className="admin-table__cell">{user.name}</td>
      <td className="admin-table__cell">
        <span className="badge badge--default">{user.role}</span>
      </td>
      <td className="admin-table__cell">
        {new Date(user.created_at).toLocaleDateString("en-IN")}
      </td>
      <td className="admin-table__cell">
        <div className="admin-table__actions">
          <select
            className="form-input form-input--sm"
            value={newRole}
            onChange={handleChange}
            disabled={updating}
          >
            <option value="user">user</option>
            <option value="genie">genie</option>
            <option value="admin">admin</option>
          </select>
          <button
            className="btn btn--sm btn--primary"
            onClick={handleSave}
            disabled={updating || newRole === user.role}
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [dash, usersData, jobsData] = await Promise.all([
          api.get("/api/v1/admin/dashboard"),
          api.get("/api/v1/admin/users"),
          api.get("/api/v1/admin/jobs"),
        ]);
        setDashboard(dash);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (err) {
        showToast(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(true);
    try {
      await api.put(
        `/api/v1/admin/users/${userId}/role?new_role=${newRole}`,
        {},
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showToast(`Role updated to "${newRole}".`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const jobsByStatus = dashboard?.jobs_by_status || {};
  const usersByRole = dashboard?.users_by_role || {};

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <div className="page__header">
          <div>
            <h1 className="page__title">Admin Panel</h1>
            <p className="page__subtitle">Platform overview and controls</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          {["overview", "users", "jobs"].map((t) => (
            <button
              key={t}
              className={`filter-tab${activeTab === t ? " filter-tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader fullScreen />
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <>
                <h2 className="section-title">Users by Role</h2>
                <div className="stats-grid">
                  {Object.entries(usersByRole).map(([r, count]) => (
                    <StatCard key={r} label={r.toUpperCase()} value={count} />
                  ))}
                </div>

                <h2 className="section-title">Jobs by Status</h2>
                <div className="stats-grid">
                  {Object.entries(jobsByStatus).map(([s, count]) => (
                    <StatCard key={s} label={s} value={count} />
                  ))}
                </div>

                <h2 className="section-title">Recent Jobs</h2>
                {dashboard?.recent_jobs?.length > 0 ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>User</th>
                          <th>Genie</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recent_jobs.map((j) => (
                          <tr key={j.id} className="admin-table__row">
                            <td className="admin-table__cell">{j.title}</td>
                            <td className="admin-table__cell">
                              <StatusBadge status={j.status} />
                            </td>
                            <td className="admin-table__cell">
                              {j.user || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {j.genie || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {new Date(j.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState icon="📋" title="No jobs yet" />
                )}
              </>
            )}

            {/* ── USERS ── */}
            {activeTab === "users" && (
              <>
                <h2 className="section-title">All Users ({users.length})</h2>
                {users.length === 0 ? (
                  <EmptyState icon="👤" title="No users found" />
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Change Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <UserRow
                            key={u.id}
                            user={u}
                            onRoleChange={handleRoleChange}
                            updating={updating}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── JOBS ── */}
            {activeTab === "jobs" && (
              <>
                <h2 className="section-title">All Jobs ({jobs.length})</h2>
                {jobs.length === 0 ? (
                  <EmptyState icon="📋" title="No jobs found" />
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Price</th>
                          <th>Location</th>
                          <th>Posted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((j) => (
                          <tr key={j.id} className="admin-table__row">
                            <td className="admin-table__cell">{j.title}</td>
                            <td className="admin-table__cell">
                              <StatusBadge status={j.status} />
                            </td>
                            <td className="admin-table__cell">
                              {j.price != null
                                ? `₹${Number(j.price).toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="admin-table__cell">
                              {j.location || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {new Date(j.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

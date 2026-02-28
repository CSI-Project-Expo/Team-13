import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./NotificationBell";
import logo from "../assets/your-logo.png";

const NAV_LINKS = {
  user: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/create-job", label: "+ Post Job" },
    { to: "/wallet", label: "Wallet" },
    { to: "/profile", label: "Profile" },
  ],
  genie: [
    { to: "/genie-dashboard", label: "Dashboard" },
    { to: "/wallet", label: "Wallet" },
    { to: "/profile", label: "Profile" },
  ],
  admin: [
    { to: "/admin", label: "Admin" },
    { to: "/profile", label: "Profile" },
  ],
};

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const links = (role && NAV_LINKS[role]) || [];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Brand */}
        <Link to="/" className="navbar__brand">
          <img src={logo} alt="Do4U" className="navbar__brand-icon" />
        </Link>

        {/* Links */}
        <nav className="navbar__links">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar__link${pathname === l.to ? " navbar__link--active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="navbar__actions">
          {user && (
            <>
              <NotificationBell />
              <Link
                to="/profile"
                className="navbar__user"
                style={{ textDecoration: "none" }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--neo-yellow)",
                    border: "2px solid var(--border)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text)",
                    flexShrink: 0,
                  }}
                >
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
                {user.name || user.email || "User"}
                <span className="navbar__role-chip">{role}</span>
                {user.reward_points !== undefined && role !== "admin" && (
                  <span className="navbar__points-chip" title="Reward Points">
                    ✨ {user.reward_points}
                  </span>
                )}
                {role === "genie" && user?.is_verified && (
                  <span
                    className="navbar__points-chip"
                    title="Verified Genie"
                    style={{ background: "var(--neo-green)" }}
                  >
                    ✅ Verified
                  </span>
                )}
              </Link>
              <button className="btn btn--sm btn--ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

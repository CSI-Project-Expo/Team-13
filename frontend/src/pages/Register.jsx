import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import ButtonSpinner from "../components/ButtonSpinner";
import logo from "../assets/your-logo.png";

export default function Register() {
  const { user, role, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRole = searchParams.get("role") || "user";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect
  useEffect(() => {
    if (!user) return;
    if (role === "user") navigate("/dashboard", { replace: true });
    if (role === "genie") navigate("/genie-dashboard", { replace: true });
    if (role === "admin") navigate("/admin", { replace: true });
  }, [user, role, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create account via our backend (Supabase Admin API + DB insert)
      await api.post("/api/v1/users/register", {
        name,
        email,
        password,
        role: selectedRole,
      });

      // 2. Sign in with Supabase to get a session token
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (sbError) throw sbError;

      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Login after registration failed.");

      // 3. Hydrate auth context and redirect
      const me = await fetchMe(accessToken);
      if (!me) throw new Error("Failed to load user profile.");

      if (me.role === "user") navigate("/dashboard", { replace: true });
      else if (me.role === "genie")
        navigate("/genie-dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = selectedRole === "genie" ? "Genie" : "User";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src={logo} alt="Do4U" className="navbar__brand-icon" />
        </div>

        <h2 className="auth-card__title">Create account</h2>
        <p className="auth-card__sub">
          Signing up as a <strong>{roleLabel}</strong>
        </p>

        <form className="auth-form" onSubmit={handleRegister} noValidate>
          <label className="form-label">
            Full Name
            <input
              id="register-name"
              className="form-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Jane Smith"
            />
          </label>

          <label className="form-label">
            Email
            <input
              id="register-email"
              className="form-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="you@example.com"
            />
          </label>

          <label className="form-label">
            Password
            <input
              id="register-password"
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Min. 6 characters"
            />
          </label>

          <label className="form-label">
            Confirm Password
            <input
              id="register-confirm"
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            id="register-submit"
            className="btn btn--primary btn--full"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <ButtonSpinner />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <Link to={`/login?role=${selectedRole}`} className="link">
            Sign in
          </Link>
        </p>
        <p className="auth-card__footer">
          <Link to="/" className="link">
            ← Choose a different role
          </Link>
        </p>
      </div>
    </div>
  );
}

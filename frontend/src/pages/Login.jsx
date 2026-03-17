import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import ButtonSpinner from "../components/ButtonSpinner";
import LoginRetroCharacters from "../components/LoginRetroCharacters";
import logo from "../assets/your-logo.png";
import "../styles/LoginRetro.css";

export default function Login() {
  const { user, role, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "user";

  // Prevents the redirect-on-login effect from firing during signup
  const skipRedirectRef = useRef(false);

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in — redirect (suppressed during signup)
  useEffect(() => {
    if (!user || skipRedirectRef.current) return;
    if (role === "user") navigate("/dashboard", { replace: true });
    if (role === "genie") navigate("/genie-dashboard", { replace: true });
    if (role === "admin") navigate("/admin", { replace: true });
  }, [user, role, navigate]);

  const redirectAfterAuth = (userRole) => {
    if (userRole === "user") navigate("/dashboard", { replace: true });
    else if (userRole === "genie")
      navigate("/genie-dashboard", { replace: true });
    else if (userRole === "admin") navigate("/admin", { replace: true });
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (sbError) throw sbError;

      const accessToken = data.session?.access_token;
      if (!accessToken)
        throw new Error("No access token returned from Supabase.");

      const me = await fetchMe(accessToken);
      if (!me) throw new Error("Failed to load user profile.");

      redirectAfterAuth(me.role);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login?role=${roleParam}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (sbError) throw sbError;
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    skipRedirectRef.current = true; // block auto-redirect during signup
    try {
      const { data, error: sbError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim(), role: roleParam } },
      });
      if (sbError) throw sbError;

      // Sign out immediately — supabase auto-signs the user in when email
      // confirmation is off. We clear that session so onAuthStateChange
      // doesn't redirect to the dashboard before the user sees the success message.
      await supabase.auth.signOut();
      localStorage.removeItem("access_token");

      // Duplicate email: Supabase returns 200 with identities=[]
      const sbUser = data?.user;
      if (sbUser?.identities?.length === 0) {
        throw new Error("An account with this email already exists.");
      }

      setSuccess("Account created! Please sign in with your new credentials.");
      setMode("login");
      setName("");
      setPassword("");
      setConfirm("");
      // Keep email pre-filled for convenience
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
      skipRedirectRef.current = false;
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
    setSuccess("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setActiveField("");
    setShowPassword(false);
  };

  const isSignUp = mode === "signup";
  const isWrongPassword = /invalid login credentials|wrong password|invalid password/i.test(
    error
  );

  return (
    <div className="retro-login-page">
      <div className="retro-login-shell">
        <section className="retro-login-art">
          <LoginRetroCharacters
            activeField={activeField}
            isPasswordVisible={showPassword}
            mood={isWrongPassword ? "sad" : "happy"}
          />
        </section>

        <section className="retro-login-card-wrap">
          <div className="retro-login-card">
            <div className="retro-login-brand">
              <img src={logo} alt="Do4U" className="retro-login-brand__icon" />
            </div>

            <h2 className="retro-login-title">SIGN IN</h2>
            <p className="retro-login-subtitle">Welcome back!</p>

            <form
              className="retro-login-form"
              onSubmit={isSignUp ? handleSignUp : handleLogin}
              noValidate
            >
              {/* Name — signup only */}
              {isSignUp && (
                <label className="retro-form-label">
                  Full Name
                  <input
                    id="auth-name"
                    className="retro-form-input"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onFocus={() => setActiveField("name")}
                    onBlur={() => setActiveField("")}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Jane Smith"
                  />
                </label>
              )}

              <label className="retro-form-label">
                Email
                <input
                  id="auth-email"
                  className="retro-form-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onFocus={() => setActiveField("email")}
                  onBlur={() => setActiveField("")}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="you@example.com"
                />
              </label>

              <label className="retro-form-label">
                Password
                <div className="retro-password-wrap">
                  <input
                    id="auth-password"
                    className="retro-form-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onFocus={() => setActiveField("password")}
                    onBlur={() => setActiveField("")}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={isSignUp ? "Min. 6 characters" : "••••••••"}
                  />
                  <button
                    type="button"
                    className="retro-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {/* Confirm password — signup only */}
              {isSignUp && (
                <label className="retro-form-label">
                  Confirm Password
                  <input
                    id="auth-confirm"
                    className="retro-form-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onFocus={() => setActiveField("password")}
                    onBlur={() => setActiveField("")}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                  />
                </label>
              )}

              {error && <p className="retro-form-error">{error}</p>}
              {success && <p className="retro-form-success">{success}</p>}

              <button
                id="auth-submit"
                className="retro-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    {isSignUp ? "Creating..." : "Signing in..."}
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="retro-divider">
              <span>OR</span>
            </div>

            <button
              className="retro-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="retro-footer-line">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button className="retro-link-btn" onClick={toggleMode} disabled={loading}>
                {isSignUp ? "Sign in" : "Create account"}
              </button>
            </p>

            <p className="retro-footer-line">
              <Link to="/" className="retro-link-anchor">
                ← Choose a different role
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

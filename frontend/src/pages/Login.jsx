import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';
import ParallaxBg from '../components/ParallaxBg';

export default function Login() {
    const { user, role, fetchMe } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role') || 'user';

    // Prevents the redirect-on-login effect from firing during signup
    const skipRedirectRef = useRef(false);

    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Already logged in — redirect (suppressed during signup)
    useEffect(() => {
        if (!user || skipRedirectRef.current) return;
        if (role === 'user') navigate('/dashboard', { replace: true });
        if (role === 'genie') navigate('/genie-dashboard', { replace: true });
        if (role === 'admin') navigate('/admin', { replace: true });
    }, [user, role, navigate]);

    const redirectAfterAuth = (userRole) => {
        if (userRole === 'user') navigate('/dashboard', { replace: true });
        else if (userRole === 'genie') navigate('/genie-dashboard', { replace: true });
        else if (userRole === 'admin') navigate('/admin', { replace: true });
    };

    // ── Login ────────────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
            if (sbError) throw sbError;

            const accessToken = data.session?.access_token;
            if (!accessToken) throw new Error('No access token returned from Supabase.');

            const me = await fetchMe(accessToken);
            if (!me) throw new Error('Failed to load user profile.');

            redirectAfterAuth(me.role);
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Sign Up ───────────────────────────────────────────────────────────────
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('Please enter your name.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }

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
            localStorage.removeItem('access_token');

            // Duplicate email: Supabase returns 200 with identities=[]
            const sbUser = data?.user;
            if (sbUser?.identities?.length === 0) {
                throw new Error('An account with this email already exists.');
            }

            setSuccess('Account created! Please sign in with your new credentials.');
            setMode('login');
            setName(''); setPassword(''); setConfirm('');
            // Keep email pre-filled for convenience
        } catch (err) {
            setError(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
            skipRedirectRef.current = false;
        }
    };

    const toggleMode = () => {
        setMode(m => m === 'login' ? 'signup' : 'login');
        setError('');
        setSuccess('');
        setName(''); setEmail(''); setPassword(''); setConfirm('');
    };

    const isSignUp = mode === 'signup';
    const roleLabel = roleParam === 'genie' ? 'Genie' : roleParam.charAt(0).toUpperCase() + roleParam.slice(1);

    return (
        <div className="auth-page">
            <ParallaxBg />
            <div className="auth-card">
                <div className="auth-card__brand">
                    <span className="navbar__brand-icon">🚀</span>
                    <span className="auth-card__brand-name">Do4U</span>
                </div>

                <h2 className="auth-card__title">{isSignUp ? 'Create account' : 'Sign in'}</h2>
                <p className="auth-card__sub">
                    {isSignUp
                        ? <>Joining as a <strong>{roleLabel}</strong></>
                        : searchParams.get('role') ? `Signing in as ${roleLabel}` : 'Welcome back!'}
                </p>

                <form className="auth-form" onSubmit={isSignUp ? handleSignUp : handleLogin} noValidate>
                    {/* Name — signup only */}
                    {isSignUp && (
                        <label className="form-label">
                            Full Name
                            <input
                                id="auth-name"
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
                    )}

                    <label className="form-label">
                        Email
                        <input
                            id="auth-email"
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
                            id="auth-password"
                            className="form-input"
                            type="password"
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder={isSignUp ? 'Min. 6 characters' : '••••••••'}
                        />
                    </label>

                    {/* Confirm password — signup only */}
                    {isSignUp && (
                        <label className="form-label">
                            Confirm Password
                            <input
                                id="auth-confirm"
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
                    )}

                    {error && <p className="form-error">{error}</p>}
                    {success && <p className="form-success" style={{ color: 'var(--color-success, #22c55e)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{success}</p>}

                    <button
                        id="auth-submit"
                        className="btn btn--primary btn--full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <Loader /> : isSignUp ? 'Create Account' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-card__footer">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        className="link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                        onClick={toggleMode}
                        disabled={loading}
                    >
                        {isSignUp ? 'Sign in' : 'Create account'}
                    </button>
                </p>
                <p className="auth-card__footer">
                    <Link to="/" className="link">← Choose a different role</Link>
                </p>
            </div>
        </div>
    );
}

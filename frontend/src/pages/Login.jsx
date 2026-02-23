import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';

export default function Login() {
    const { user, role, fetchMe } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Already logged in — redirect
    useEffect(() => {
        if (!user) return;
        if (role === 'user') navigate('/dashboard', { replace: true });
        if (role === 'genie') navigate('/genie-dashboard', { replace: true });
        if (role === 'admin') navigate('/admin', { replace: true });
    }, [user, role, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: sbError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (sbError) throw sbError;

            const accessToken = data.session?.access_token;
            if (!accessToken) throw new Error('No access token returned from Supabase.');

            const me = await fetchMe(accessToken);
            if (!me) throw new Error('Failed to load user profile.');

            if (me.role === 'user') navigate('/dashboard', { replace: true });
            if (me.role === 'genie') navigate('/genie-dashboard', { replace: true });
            if (me.role === 'admin') navigate('/admin', { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__brand">
                    <span className="navbar__brand-icon">🚀</span>
                    <span className="auth-card__brand-name">Do4U</span>
                </div>

                <h2 className="auth-card__title">Sign in</h2>
                <p className="auth-card__sub">
                    {searchParams.get('role')
                        ? `Signing in as ${searchParams.get('role')}`
                        : 'Welcome back!'}
                </p>

                <form className="auth-form" onSubmit={handleLogin} noValidate>
                    <label className="form-label">
                        Email
                        <input
                            id="login-email"
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
                            id="login-password"
                            className="form-input"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="••••••••"
                        />
                    </label>

                    {error && <p className="form-error">{error}</p>}

                    <button
                        id="login-submit"
                        className="btn btn--primary btn--full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <Loader /> : 'Sign in'}
                    </button>
                </form>

                <p className="auth-card__footer">
                    <Link to="/" className="link">← Choose a different role</Link>
                </p>
            </div>
        </div>
    );
}

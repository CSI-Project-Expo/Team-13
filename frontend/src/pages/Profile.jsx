import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

/* ── Avatar with initials ────────────────────────────────────────────────── */
function Avatar({ name, size = 80 }) {
    const initials = (name || 'U')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 700, color: '#fff',
            flexShrink: 0, boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            letterSpacing: '-0.02em',
        }}>
            {initials}
        </div>
    );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, icon, children }) {
    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{icon}</span>{title}
            </h2>
            {children}
        </div>
    );
}

/* ── Stat pill ───────────────────────────────────────────────────────────── */
function StatPill({ label, value, accent }) {
    return (
        <div style={{
            flex: '1 1 120px', minWidth: 110,
            background: accent ? 'var(--accent-light)' : 'var(--surface-2)',
            border: `1px solid ${accent ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            textAlign: 'center',
        }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{label}</p>
        </div>
    );
}

export default function Profile() {
    const { user, role, logout, fetchMe, token } = useAuth();
    const navigate = useNavigate();

    /* ── State ──────────────────────────────────────────────────────────── */
    const [email, setEmail]       = useState('');
    const [name, setName]         = useState(user?.name || '');
    const [saving, setSaving]     = useState(false);
    const [wallet, setWallet]     = useState(null);
    const [stats, setStats]       = useState({ total: 0, completed: 0, active: 0 });
    const [loadingData, setLoadingData] = useState(true);

    // Password change
    const [pwSection, setPwSection]   = useState(false);
    const [newPw, setNewPw]           = useState('');
    const [confirmPw, setConfirmPw]   = useState('');
    const [pwSaving, setPwSaving]     = useState(false);

    const [toast, setToast]   = useState('');
    const [toastType, setToastType] = useState('info'); // 'info' | 'error'

    const showToast = (msg, type = 'info') => {
        setToast(msg);
        setToastType(type);
        setTimeout(() => setToast(''), 3800);
    };

    /* ── Load data on mount ──────────────────────────────────────────────── */
    useEffect(() => {
        const init = async () => {
            setLoadingData(true);
            try {
                // Get email from Supabase session
                const { data: { session } } = await supabase.auth.getSession();
                setEmail(session?.user?.email || '');
                setName(user?.name || '');

                // Wallet balance
                try {
                    const w = await api.get('/api/v1/wallet/');
                    setWallet(w);
                } catch { /* wallet may not exist yet */ }

                // Job stats
                try {
                    const endpoint = role === 'genie' ? '/api/v1/jobs/available' : '/api/v1/jobs/my-jobs';
                    const jobs = await api.get(endpoint);
                    if (Array.isArray(jobs)) {
                        const myJobs = role === 'genie'
                            ? [/* genie stats come from offers */]
                            : jobs;
                        setStats({
                            total: myJobs.length,
                            completed: myJobs.filter(j => j.status === 'COMPLETED').length,
                            active: myJobs.filter(j => ['ACCEPTED','IN_PROGRESS'].includes(j.status)).length,
                        });
                    }
                } catch { /* ignore */ }
            } finally {
                setLoadingData(false);
            }
        };
        if (user) init();
    }, [user, role]);

    /* ── Save profile name ───────────────────────────────────────────────── */
    const handleSaveName = async (e) => {
        e.preventDefault();
        if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
        setSaving(true);
        try {
            // 1. Persist to our DB
            await api.patch('/api/v1/users/me', { name: name.trim() });

            // 2. Keep Supabase metadata in sync
            await supabase.auth.updateUser({ data: { name: name.trim() } });

            // 3. Refresh AuthContext so hero header + navbar update immediately
            if (token) await fetchMe(token);

            showToast('Name updated successfully! ✓');
        } catch (err) {
            showToast(err.message || 'Failed to update name.', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Change password ─────────────────────────────────────────────────── */
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPw.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
        if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return; }
        setPwSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) throw error;
            showToast('Password changed successfully! ✓');
            setNewPw(''); setConfirmPw(''); setPwSection(false);
        } catch (err) {
            showToast(err.message || 'Failed to change password.', 'error');
        } finally {
            setPwSaving(false);
        }
    };

    /* ── Logout ──────────────────────────────────────────────────────────── */
    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : null;

    const roleLabel = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : '';

    if (loadingData) return (
        <div className="page">
            <Navbar />
            <Loader fullScreen />
        </div>
    );

    return (
        <div className="page">
            <Navbar />
            <main className="page__content page__content--narrow" style={{ maxWidth: 680 }}>

                {/* ── Hero header ───────────────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                    borderRadius: 'var(--radius-xl)', padding: '36px 32px',
                    marginBottom: 28, color: '#fff', position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative blob */}
                    <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220,
                        background:'rgba(255,255,255,0.08)', borderRadius:'50%', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160,
                        background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
                        <Avatar name={user?.name} size={80} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                                {user?.name || 'Your Profile'}
                            </h1>
                            <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>{email}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:999,
                                    padding:'3px 12px', fontSize:12, fontWeight:600, letterSpacing:'0.04em' }}>
                                    {roleLabel}
                                </span>
                                {memberSince && (
                                    <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:999,
                                        padding:'3px 12px', fontSize:12, opacity:0.9 }}>
                                        Member since {memberSince}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats row ─────────────────────────────────────────── */}
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
                    <StatPill label="Wallet Balance" value={`₹${Number(wallet?.balance ?? 0).toFixed(2)}`} accent />
                    {role === 'user' && <>
                        <StatPill label="Jobs Posted"    value={stats.total} />
                        <StatPill label="In Progress"    value={stats.active} />
                        <StatPill label="Completed"      value={stats.completed} />
                    </>}
                    {role === 'genie' && <>
                        <StatPill label="Escrow Held" value={`₹${Number(wallet?.escrow_balance ?? 0).toFixed(2)}`} />
                    </>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── Personal info ───────────────────────────────── */}
                    <Section title="Personal Information" icon="👤">
                        <form onSubmit={handleSaveName} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                            <label className="form-label">
                                Full Name
                                <input
                                    id="profile-name"
                                    className="form-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={saving}
                                    placeholder="Your name"
                                />
                            </label>
                            <label className="form-label">
                                Email Address
                                <input
                                    id="profile-email"
                                    className="form-input"
                                    value={email}
                                    readOnly
                                    style={{ opacity: 0.65 }}
                                    title="Email is managed by Supabase and cannot be changed here"
                                />
                                <span style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                                    Email is linked to your sign-in account.
                                </span>
                            </label>
                            <label className="form-label">
                                Role
                                <input className="form-input" value={roleLabel} readOnly style={{ opacity: 0.65 }} />
                            </label>
                            <div style={{ display:'flex', justifyContent:'flex-end' }}>
                                <button
                                    id="profile-save"
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={saving}
                                    style={{ minWidth: 140 }}
                                >
                                    {saving ? <Loader /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </Section>

                    {/* ── Security ────────────────────────────────────── */}
                    <Section title="Security" icon="🔒">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:'14px 0', borderBottom: pwSection ? '1px solid var(--border)' : 'none' }}>
                            <div>
                                <p style={{ fontWeight:500, color:'var(--text)', marginBottom:3 }}>Password</p>
                                <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                                    {pwSection ? 'Enter your new password below.' : 'Change your account password.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => { setPwSection(v=>!v); setNewPw(''); setConfirmPw(''); }}
                            >
                                {pwSection ? 'Cancel' : 'Change'}
                            </button>
                        </div>

                        {pwSection && (
                            <form onSubmit={handleChangePassword}
                                style={{ display:'flex', flexDirection:'column', gap:14, paddingTop:18 }}>
                                <label className="form-label">
                                    New Password
                                    <input
                                        id="profile-new-pw"
                                        className="form-input"
                                        type="password"
                                        autoComplete="new-password"
                                        value={newPw}
                                        onChange={(e) => setNewPw(e.target.value)}
                                        disabled={pwSaving}
                                        placeholder="Min. 6 characters"
                                    />
                                </label>
                                <label className="form-label">
                                    Confirm New Password
                                    <input
                                        id="profile-confirm-pw"
                                        className="form-input"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPw}
                                        onChange={(e) => setConfirmPw(e.target.value)}
                                        disabled={pwSaving}
                                        placeholder="Repeat password"
                                    />
                                </label>
                                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                                    <button
                                        id="profile-pw-save"
                                        type="submit"
                                        className="btn btn--primary"
                                        disabled={pwSaving}
                                        style={{ minWidth: 160 }}
                                    >
                                        {pwSaving ? <Loader /> : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </Section>

                    {/* ── Account actions ─────────────────────────────── */}
                    <Section title="Account" icon="⚙️">
                        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                            {/* Quick links */}
                            {[
                                { label: '💳  Wallet',    desc: 'View balance & transactions',  onClick: () => navigate('/wallet') },
                                { label: role === 'genie' ? '🧞  My Dashboard' : '📋  My Jobs',
                                  desc: role === 'genie' ? 'Browse available jobs' : 'Manage your posted jobs',
                                  onClick: () => navigate(role === 'genie' ? '/genie-dashboard' : '/dashboard') },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={item.onClick}
                                    type="button"
                                    style={{
                                        display:'flex', alignItems:'center', justifyContent:'space-between',
                                        width:'100%', padding:'14px 0',
                                        borderBottom:'1px solid var(--border)', background:'none', border:'none',
                                        borderBottom:'1px solid var(--border)',
                                        textAlign:'left', color:'var(--text)',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight:500, marginBottom:2 }}>{item.label}</p>
                                        <p style={{ fontSize:13, color:'var(--text-muted)' }}>{item.desc}</p>
                                    </div>
                                    <span style={{ color:'var(--text-muted)', fontSize:18 }}>›</span>
                                </button>
                            ))}

                            {/* Logout */}
                            <div style={{ paddingTop: 16 }}>
                                <button
                                    id="profile-logout"
                                    type="button"
                                    className="btn btn--ghost btn--full"
                                    onClick={handleLogout}
                                    style={{ color:'var(--red)', borderColor:'var(--red)', opacity:0.85 }}
                                >
                                    🚪 Sign Out
                                </button>
                            </div>
                        </div>
                    </Section>

                </div>
            </main>

            {toast && (
                <div className="toast" style={{
                    background: toastType === 'error' ? 'var(--red)' : 'var(--text)',
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}

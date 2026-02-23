import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = {
    user: [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/create-job', label: '+ Post Job' },
        { to: '/wallet', label: 'Wallet' },
    ],
    genie: [
        { to: '/genie-dashboard', label: 'Dashboard' },
        { to: '/wallet', label: 'Wallet' },
    ],
    admin: [
        { to: '/admin', label: 'Admin' },
        { to: '/wallet', label: 'Wallet' },
    ],
};

export default function Navbar() {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const links = (role && NAV_LINKS[role]) || [];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <div className="navbar__inner">
                {/* Brand */}
                <Link to="/" className="navbar__brand">
                    <span className="navbar__brand-icon">🚀</span>
                    <span className="navbar__brand-name">Do4U</span>
                </Link>

                {/* Links */}
                <nav className="navbar__links">
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`navbar__link${pathname === l.to ? ' navbar__link--active' : ''}`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="navbar__actions">
                    <ThemeToggle />
                    {user && (
                        <>
                            <span className="navbar__user">
                                {user.name || user.email || 'User'}
                                <span className="navbar__role-chip">{role}</span>
                            </span>
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

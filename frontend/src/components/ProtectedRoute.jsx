import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from './Loader';

/**
 * Wraps a route so only authenticated users with an allowed role can access it.
 *
 * Props:
 *   children   — the page element to render
 *   roles      — array of allowed roles, e.g. ['user', 'admin']
 *                if omitted, any authenticated user is allowed
 */
export default function ProtectedRoute({ children, roles }) {
    const { user, role, loading } = useAuth();

    if (loading) return <Loader fullScreen />;

    if (!user) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(role)) {
        // Redirect to their own home
        if (role === 'user') return <Navigate to="/dashboard" replace />;
        if (role === 'genie') return <Navigate to="/genie-dashboard" replace />;
        if (role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
}

import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider, useUser } from './context/UserContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import UserDashboard from './pages/UserDashboard';
import GenieDashboard from './pages/GenieDashboard';
import AdminDashboard from './pages/AdminDashboard';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import { LogOut, User, Briefcase } from 'lucide-react';
import { logoutUser } from './services/auth';

// Navigation component
const Navigation = () => {
  const { currentUser } = useAuth();
  const { userProfile } = useUser();

  const handleLogout = async () => {
    await logoutUser();
  };

  if (!currentUser) return null;

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Do4U</h1>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-all"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{userProfile?.name || 'Profile'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Dashboard router component
const DashboardRouter = () => {
  const { userProfile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (userProfile?.role === 'admin') {
    return <AdminDashboard />;
  } else if (userProfile?.role === 'genie') {
    return <GenieDashboard />;
  } else {
    return <UserDashboard />;
  }
};

// App content that uses the contexts
const AppContent = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <>
                <Navigation />
                <DashboardRouter />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <>
                <Navigation />
                <JobDetails />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <>
                <Navigation />
                <Profile />
              </>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import RoleSelect from './pages/RoleSelect';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GenieDashboard from './pages/GenieDashboard';
import CreateJob from './pages/CreateJob';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import CustomCursor from './components/CustomCursor';

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RoleSelect />} />
          <Route path="/login" element={<Login />} />

          {/* USER only */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['user', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-job"
            element={
              <ProtectedRoute roles={['user', 'admin']}>
                <CreateJob />
              </ProtectedRoute>
            }
          />

          {/* GENIE only */}
          <Route
            path="/genie-dashboard"
            element={
              <ProtectedRoute roles={['genie', 'admin']}>
                <GenieDashboard />
              </ProtectedRoute>
            }
          />

          {/* All authenticated roles */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute roles={['user', 'genie', 'admin']}>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['user', 'genie', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ADMIN only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

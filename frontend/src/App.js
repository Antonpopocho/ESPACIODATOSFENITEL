import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import MyContract from './pages/MyContract';
import MyDatasets from './pages/MyDatasets';
import MyEvidence from './pages/MyEvidence';
import Datasets from './pages/Datasets';
import Governance from './pages/Governance';
import Audit from './pages/Audit';
import Documentation from './pages/Documentation';
import { Loader2 } from 'lucide-react';

// Protected Route Component
function ProtectedRoute({ children, requirePromotor = false }) {
  const { isAuthenticated, loading, isPromotor } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePromotor && !isPromotor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected Routes - All Users */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/my-contract" element={<ProtectedRoute><MyContract /></ProtectedRoute>} />
      <Route path="/my-datasets" element={<ProtectedRoute><MyDatasets /></ProtectedRoute>} />
      <Route path="/my-evidence" element={<ProtectedRoute><MyEvidence /></ProtectedRoute>} />
      <Route path="/catalog" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />

      {/* Protected Routes - Promotor Only */}
      <Route path="/members" element={<ProtectedRoute requirePromotor><Members /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute requirePromotor><Payments /></ProtectedRoute>} />
      <Route path="/datasets" element={<ProtectedRoute requirePromotor><Datasets /></ProtectedRoute>} />
      <Route path="/governance" element={<ProtectedRoute requirePromotor><Governance /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute requirePromotor><Audit /></ProtectedRoute>} />
      <Route path="/documentation" element={<ProtectedRoute requirePromotor><Documentation /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              fontFamily: 'Public Sans, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

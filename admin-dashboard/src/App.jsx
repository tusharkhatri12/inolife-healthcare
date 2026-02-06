import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MRPerformance from './pages/MRPerformance';
import DoctorAnalytics from './pages/DoctorAnalytics';
import ProductAnalytics from './pages/ProductAnalytics';
import MRTrackingMap from './pages/MRTrackingMap';
import CSVUpload from './pages/CSVUpload';
import CoverageDashboard from './pages/CoverageDashboard';
import CoverageForm from './pages/CoverageForm';
import PendingDoctorApprovals from './pages/PendingDoctorApprovals';
import SalesDashboard from './pages/SalesDashboard';
import Stockists from './pages/Stockists';
import SalesOverview from './pages/SalesOverview';
import Schemes from './pages/Schemes';
import MRUsers from './pages/MRUsers';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mr-performance"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <MRPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-analytics"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <DoctorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-analytics"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <ProductAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mr-tracking"
        element={
          <ProtectedRoute allowedRoles={['Owner']}>
            <MRTrackingMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/csv-upload"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <CSVUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coverage"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <CoverageDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coverage/new"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <CoverageForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coverage/edit"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <CoverageForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-doctor-approvals"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <PendingDoctorApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mr-users"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <MRUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <SalesOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockists"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <Stockists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schemes"
        element={
          <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
            <Schemes />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

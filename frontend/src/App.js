import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Tickets from './pages/Tickets';
import Users from './pages/Users';
import Tenants from './pages/Tenants';
import Groups from './pages/Groups';
import ApprovalWorkflows from './pages/ApprovalWorkflows';
import TenantSettings from './pages/TenantSettings';
import Subscription from './pages/Subscription';
import TierManagement from './pages/TierManagement';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Departments from './pages/Departments';
import Profile from './pages/Profile';
import Locations from './pages/Locations';
import Licenses from './pages/Licenses';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import ActivityFeed from './pages/ActivityFeed';
import Reservations from './pages/Reservations';
import InviteAccept from './pages/InviteAccept';
import NotFound from './pages/NotFound';
import './index.css';

function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check for session_id during render (not useEffect) to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/assets/:assetId"
              element={
                <ProtectedRoute>
                  <AssetDetail />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/groups"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}>
                  <Groups />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/workflows"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}>
                  <ApprovalWorkflows />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tenants"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Tenants />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tenant-settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}>
                  <TenantSettings />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/subscription"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tier-management"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <TierManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <Departments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <Locations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/licenses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <Licenses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <Vendors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/activity"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'asset_manager']}>
                  <ActivityFeed />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Reservations />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
      );
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
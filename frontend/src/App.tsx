import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute, VerificationPending } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { PMDashboard } from '@/pages/pm/Dashboard';
import { TestList } from '@/pages/pm/TestList';
import { UserManagement } from '@/pages/pm/Users';
import { QAAssignments } from '@/pages/qa/Assignments';
import { ReportBug } from '@/pages/qa/ReportBug';
import { GlobalFeed } from '@/pages/engineering/GlobalFeed';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verification-pending" element={<VerificationPending />} />

          {/* Protected routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* PM Routes */}
            <Route
              path="/pm"
              element={
                <ProtectedRoute allowedRoles={['PM']}>
                  <PMDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pm/tests"
              element={
                <ProtectedRoute allowedRoles={['PM']}>
                  <TestList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pm/users"
              element={
                <ProtectedRoute allowedRoles={['PM']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* QA Routes */}
            <Route
              path="/qa"
              element={
                <ProtectedRoute allowedRoles={['QA']}>
                  <QAAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qa/report-bug"
              element={
                <ProtectedRoute allowedRoles={['QA']}>
                  <ReportBug />
                </ProtectedRoute>
              }
            />

            {/* Engineering Routes */}
            <Route
              path="/engineering"
              element={
                <ProtectedRoute allowedRoles={['ENG']}>
                  <GlobalFeed />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

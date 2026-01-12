import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireVerified?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireVerified = true
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User not verified - redirect to verification pending page
  if (requireVerified && !user.is_verified) {
    return <Navigate to="/verification-pending" replace />;
  }

  // User doesn't have required role - redirect to their default dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoutes: Record<UserRole, string> = {
      PM: '/pm',
      QA: '/qa',
      ENG: '/engineering',
    };
    return <Navigate to={defaultRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}

// Component for the verification pending page
export function VerificationPending() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-card rounded-lg border p-8 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Verification Pending</h2>
          <p className="text-muted-foreground mb-6">
            Your account is pending verification by an administrator. You'll receive an email once your account has been approved.
          </p>
          <button
            onClick={logout}
            className="text-sm text-primary hover:underline"
          >
            Sign out and try a different account
          </button>
        </div>
      </div>
    </div>
  );
}

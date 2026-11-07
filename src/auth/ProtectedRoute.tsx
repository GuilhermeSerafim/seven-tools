import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isApproved, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (!isApproved) return <Navigate to="/aguardando-validacao" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isApproved } = useAuth();

  if (isAuthenticated && isApproved) return <Navigate to="/hub" replace />;
  if (isAuthenticated && !isApproved) return <Navigate to="/aguardando-validacao" replace />;

  return <Outlet />;
}

export function PendingReviewRoute() {
  const { isAuthenticated, isApproved } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isApproved) return <Navigate to="/hub" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, isApproved, isAdmin, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (!isApproved) return <Navigate to="/aguardando-validacao" replace />;
  if (!isAdmin) return <Navigate to="/hub" replace />;

  return <Outlet />;
}

export function ForcePasswordChangeRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.mustChangePassword) return <Navigate to="/hub" replace />;

  return <Outlet />;
}

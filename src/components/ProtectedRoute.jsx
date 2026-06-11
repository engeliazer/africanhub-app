import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getTokenLocal } from '../services/utils/authorization';
import { selectCurrentRole, selectPermissions } from '../state/rbacSlice';

const UNAUTHORIZED_PATH = '/unauthorized';

/**
 * Protects routes by auth (token + userInfo), optional permissions, and optional roles.
 * - permissions: user must have at least one (or 'all')
 * - roles: current role must be one of these
 * - redirectTo: where to send unauthorized users (default: /unauthorized)
 */
const ProtectedRoute = ({
  children,
  permissions = [],
  roles = [],
  redirectTo
}) => {
  const location = useLocation();
  const token = getTokenLocal();
  const userInfo = localStorage.getItem('user_info');
  const currentRole = useSelector(selectCurrentRole);
  const userPermissions = useSelector(selectPermissions);

  // 1. Auth check
  if (!token || !userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Permission check (if required)
  if (permissions && permissions.length > 0) {
    const hasPermission =
      userPermissions?.includes('all') ||
      permissions.some((p) => userPermissions?.includes(p));
    if (!hasPermission) {
      const to = redirectTo ?? UNAUTHORIZED_PATH;
      return <Navigate to={to} state={{ from: location, accessDenied: true }} replace />;
    }
  }

  // 3. Role check (if required)
  if (roles && roles.length > 0) {
    const hasRole = currentRole && roles.includes(currentRole);
    if (!hasRole) {
      const to = redirectTo ?? UNAUTHORIZED_PATH;
      return <Navigate to={to} state={{ from: location, accessDenied: true }} replace />;
    }
  }

  return children;
};

export { UNAUTHORIZED_PATH };

export default ProtectedRoute;

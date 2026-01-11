import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getTokenLocal } from '../services/utils/authorization';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = getTokenLocal();
  const userInfo = localStorage.getItem('user_info');

  if (!token || !userInfo) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 
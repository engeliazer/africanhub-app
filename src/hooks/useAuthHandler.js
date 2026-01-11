import { useEffect } from 'react';
import { message } from 'antd';
import { removeTokenLocal } from '../services/utils/authorization';

const useAuthHandler = () => {
  useEffect(() => {
    // Handler for auth error events
    const handleAuthError = (event) => {
      const { message: errorMessage, status, type } = event.detail;

      // Remove token and user info
      removeTokenLocal();
      localStorage.removeItem('user_info');

      // Show error message
      message.error(errorMessage);

      // Get current path for redirect after login
      const currentPath = window.location.pathname;
      
      // Don't include return URL if already on login or auth-related pages
      const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
        path => currentPath.startsWith(path)
      );

      // Use window.location for navigation
      if (!isAuthPage) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
      } else {
        window.location.href = '/login';
      }
    };

    // Add event listener
    window.addEventListener('auth_error', handleAuthError);

    // Cleanup
    return () => {
      window.removeEventListener('auth_error', handleAuthError);
    };
  }, []);
};

export default useAuthHandler; 
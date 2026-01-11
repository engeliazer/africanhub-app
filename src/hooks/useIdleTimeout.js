import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { message } from 'antd';
import authService from '../services/auth';
import { onClear } from '../state/accessSlice';
import { SECURITY_CONFIG } from '../config';

/**
 * Custom hook to handle user idle timeout
 * @param {number} timeout - Timeout duration in milliseconds (default: 5 minutes)
 */
const useIdleTimeout = (timeout = SECURITY_CONFIG.idleTimeout) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const timeoutId = useRef(null);
  const warningTimeoutId = useRef(null);
  const isWarningShown = useRef(false);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch(onClear());
      localStorage.removeItem('user_info');
      navigate('/login');
      message.warning('You have been logged out due to inactivity');
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(onClear());
      localStorage.removeItem('user_info');
      navigate('/login');
      message.warning('You have been logged out due to inactivity');
    }
  }, [navigate, dispatch]);

  // Show warning before logout
  const showWarning = useCallback(() => {
    if (!isWarningShown.current) {
      isWarningShown.current = true;
      const warningMinutes = Math.ceil(SECURITY_CONFIG.idleWarningTime / 60000);
      message.warning({
        content: `You will be logged out in ${warningMinutes} minute${warningMinutes > 1 ? 's' : ''} due to inactivity`,
        duration: 10,
        key: 'idle-warning'
      });
    }
  }, []);

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    // Clear existing timeouts
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (warningTimeoutId.current) {
      clearTimeout(warningTimeoutId.current);
    }

    // Reset warning flag
    isWarningShown.current = false;
    message.destroy('idle-warning');

    // Set warning timeout (configurable time before actual logout)
    const warningTime = timeout - SECURITY_CONFIG.idleWarningTime;
    if (warningTime > 0) {
      warningTimeoutId.current = setTimeout(() => {
        showWarning();
      }, warningTime);
    }

    // Set logout timeout
    timeoutId.current = setTimeout(() => {
      logout();
    }, timeout);
  }, [timeout, logout, showWarning]);

  useEffect(() => {
    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      // Clear timeouts
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (warningTimeoutId.current) {
        clearTimeout(warningTimeoutId.current);
      }

      // Destroy any warning messages
      message.destroy('idle-warning');
    };
  }, [resetTimer]);

  return { resetTimer };
};

export default useIdleTimeout;


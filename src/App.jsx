import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { store } from './state/store.jsx';
import { router } from './routes';
import useAuthHandler from './hooks/useAuthHandler';
import { AuthProvider } from './contexts/AuthContext';

// Application-level protection component
const AppProtection = ({ children }) => {
  const [protectedSessions, setProtectedSessions] = useState([]);
  
  // Global protection state management
  useEffect(() => {
    // Listen for protected session events from child components
    const handleProtectedSessionStart = (event) => {
      const { sessionId, isProtected } = event.detail;
      if (isProtected) {
        setProtectedSessions(prev => [...prev.filter(s => s.id !== sessionId), { id: sessionId, isProtected: true }]);
      }
    };

    const handleProtectedSessionEnd = (event) => {
      const { sessionId } = event.detail;
      setProtectedSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    window.addEventListener('protected-session-start', handleProtectedSessionStart);
    window.addEventListener('protected-session-end', handleProtectedSessionEnd);

    return () => {
      window.removeEventListener('protected-session-start', handleProtectedSessionStart);
      window.removeEventListener('protected-session-end', handleProtectedSessionEnd);
    };
  }, []);

  const isAnyContentProtected = protectedSessions.length > 0;

  // Global protection event listeners
  useEffect(() => {
    if (!isAnyContentProtected) return;

    // Prevent right-click globally
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent common shortcuts
    const handleKeyDown = (e) => {
      if (isAnyContentProtected) {
        // Block developer tools
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U') ||
            (e.ctrlKey && e.key === 'S')) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Prevent drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [isAnyContentProtected]);

  return children;
};

// Wrapper component that includes auth event handling
const AppContent = () => {
  useAuthHandler();
  return (
    <AppProtection>
      <RouterProvider router={createBrowserRouter(router)} />
    </AppProtection>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ConfigProvider>
          <AppContent />
        </ConfigProvider>
      </AuthProvider>
    </Provider>
  );
};

export default App;
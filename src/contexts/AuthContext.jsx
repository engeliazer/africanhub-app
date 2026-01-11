import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('server-token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a token in localStorage
    const storedToken = localStorage.getItem('server-token');
    if (storedToken) {
      setToken(storedToken);
      // You can also fetch user data here if needed
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('server-token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('server-token');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 
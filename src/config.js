// API Configuration - Force HTTPS
export const BASE_URL = 'https://api.online.dcrc.ac.tz';
export const API_URL = `${BASE_URL}/api`;

// Debug logging
console.log('Environment Variables Debug:');
console.log('VITE_SERVER_API_URL:', import.meta.env.VITE_SERVER_API_URL);
console.log('BASE_URL (forced):', BASE_URL);
console.log('API_URL (forced):', API_URL);

// Environment Configuration
export const ENV = process.env.NODE_ENV || 'development';

// App Configuration
export const APP_CONFIG = {
  name: 'HRMS',
  version: '1.0.0',
  description: 'Human Resource Management System'
};

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    changePassword: '/auth/change-password',
    resetPassword: '/auth/reset-password',
    logout: '/auth/logout',
    user: '/auth/user'
  },
  employees: {
    list: '/employees',
    create: '/employees',
    update: (id) => `/employees/${id}`,
    delete: (id) => `/employees/${id}`,
    profile: (id) => `/employees/${id}/profile`
  },
  roles: {
    list: '/roles',
    create: '/roles',
    update: (id) => `/roles/${id}`,
    delete: (id) => `/roles/${id}`,
    users: '/users/roles'
  },
  chat: {
    all: '/chat/all',
    send: '/chat/message',
    history: (id) => `/chat/history/${id}`,
    reply: (id) => `/chat/${id}/reply`
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  token: 'hrms_token',
  user: 'hrms_user'
};

// Security Configuration
export const SECURITY_CONFIG = {
  // Idle timeout in milliseconds (default: 5 minutes)
  idleTimeout: 5 * 60 * 1000,
  // Warning time before logout in milliseconds (default: 1 minute)
  idleWarningTime: 1 * 60 * 1000
}; 
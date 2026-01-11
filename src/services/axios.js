import axios from 'axios';
import { getTokenLocal } from './utils/authorization';
import { BASE_URL } from '../config';

// Custom event for auth errors
export const AUTH_ERROR_EVENT = 'auth_error';

// Create axios instance with base URL
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 3600000, // 1 hour
});

// Add token to requests if available
instance.interceptors.request.use(
  (config) => {
    const token = getTokenLocal();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses and token expiration
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for unauthorized errors
    if (error.response && error.response.status === 401) {
      // Check if the error contains a token expiration message
      const isTokenExpired = 
        error.response.data && 
        (error.response.data.msg === 'Token has expired' || 
         error.response.data.message === 'Token has expired' ||
         error.response.data.error === 'Token has expired');
      
      if (isTokenExpired) {
        // Dispatch custom event for token expiration
        window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, { 
          detail: { message: 'Your session has expired. Please log in again.' } 
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 
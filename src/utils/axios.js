import axios from 'axios';
import { removeTokenLocal, getTokenLocal } from '../services/utils/authorization';
import { API_URL, STORAGE_KEYS } from '../config';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 3600000, // 1 hour
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // This is important for CORS with credentials
});

// Debug logging
console.log('Axios Configuration Debug:');
console.log('API_URL:', API_URL);
console.log('Base URL being used:', axiosInstance.defaults.baseURL);

// Request interceptor to add token to requests
axiosInstance.interceptors.request.use(
    config => {
        const token = getTokenLocal();
        if (token) {
            // Ensure the token is properly formatted
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            config.headers.Authorization = formattedToken;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle new tokens and expiration
axiosInstance.interceptors.response.use(
    response => {
        // Try different case variations for the header
        const newToken = response.headers['New-Token'] || 
                        response.headers['new-token'] || 
                        response.headers.get?.('New-Token') ||
                        response.headers.get?.('new-token');

        if (newToken) {
            // Store the new token
            localStorage.setItem(STORAGE_KEYS.token, newToken);
            // Update Authorization header for future requests
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        }
        
        return response;
    },
    async error => {
        // Handle token expiration
        if (error.response?.status === 401) {
            const isTokenExpired = 
                error.response.data && 
                (error.response.data.msg === 'Token has expired' || 
                 error.response.data.message === 'Token has expired' ||
                 error.response.data.error === 'Token has expired');

            // Clear token and user info
            removeTokenLocal();
            localStorage.removeItem('user_info');
            
            // Get current path for redirect after login
            const currentPath = window.location.pathname;
            
            // Don't include return URL if already on login or auth-related pages
            const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
                path => currentPath.startsWith(path)
            );

            // Redirect to login with return URL
            if (!isAuthPage) {
                window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
            } else {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance; 
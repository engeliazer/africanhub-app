import axios from '../utils/axios';
import { API_URL, API_ENDPOINTS } from '../config';
import { saveTokenLocal, getTokenLocal, removeTokenLocal } from './utils/authorization';

const authService = {
  // ... existing code ...

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/self-registration`, {
        ...userData,
        registration_mode: "SELF",
        role_id: 1  // Assign admin role for self registration
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.auth.login}`, {
        login: credentials.login,
        password: credentials.password
      });
      
      // Store token if it's returned in the response
      if (response.data?.data?.token) {
        saveTokenLocal(response.data.data.token);
      }

      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  changePassword: async (email, oldPassword, newPassword, confirmPassword, token) => {
    try {
      const response = await axios.post(
        `${API_URL}${API_ENDPOINTS.auth.changePassword}`,
        {
          email,
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to change password');
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.auth.logout}`, {});
      removeTokenLocal();
      localStorage.removeItem('user_info');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.auth.resetPassword}`, {
        email
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default authService; 
import axios from 'axios';
import { API_URL } from '../config';
import { getTokenLocal } from './utils/authorization';

const userDevicesService = {
  getUserDevices: async (userId) => {
    try {
      const token = getTokenLocal();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/user-devices/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user devices:', error);
      throw error.response?.data?.message || error.message;
    }
  },

  makeDevicePrimary: async (deviceId) => {
    try {
      const token = getTokenLocal();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_URL}/user-devices/${deviceId}/set-primary`, null, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error making device primary:', error);
      throw error.response?.data?.message || error.message;
    }
  }
};

export default userDevicesService; 
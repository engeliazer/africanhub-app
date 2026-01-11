import axios from './axios';
import { USERS_RESOURCE } from './constants/endpoints';

const usersService = {
  getUsers: async () => {
    try {
      const response = await axios.get(USERS_RESOURCE);
      // Return the response data directly since it already has the correct structure
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUser: async (userId) => {
    try {
      const response = await axios.get(`${USERS_RESOURCE}/${userId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default usersService; 
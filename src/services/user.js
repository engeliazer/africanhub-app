import axios from './axios';
import { USER_RESOURCE } from './constants/endpoints';

const userService = {
  getUserData: async () => {
    try {
      const response = await axios.get(USER_RESOURCE);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userService; 
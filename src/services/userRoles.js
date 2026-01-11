import axios from '../utils/axios';
import { API_URL } from '../config';
import { getTokenLocal } from './utils/authorization';

const userRolesService = {
  // Assign a role to a user
  assignRole: async (userId, roleId) => {
    try {
      const token = getTokenLocal();
      const response = await axios.post(
        `${API_URL}/user-roles`,
        {
          user_id: userId,
          role_id: roleId,
          is_default: false,
          is_active: true,
          created_by: 1, // TODO: Get actual user ID from context
          updated_by: 1  // TODO: Get actual user ID from context
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove a role from a user
  removeRole: async (userId, userRoleId) => {
    try {
      const token = getTokenLocal();
      const response = await axios.delete(
        `${API_URL}/user-roles/${userRoleId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Set a role as default for a user
  setDefaultRole: async (userId, roleId) => {
    try {
      const token = getTokenLocal();
      const response = await axios.put(
        `${API_URL}/users/${userId}/roles/${roleId}/default`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userRolesService; 
import { createSlice } from '@reduxjs/toolkit';
import { rolePermissions } from '../config/roleConfig';

const initialState = {
  currentRole: null,
  assignedRoles: [],
  permissions: [],
  isLoading: false,
  error: null
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    setAssignedRoles: (state, action) => {
      console.log('setAssignedRoles reducer called with:', action.payload);
      // Ensure we're getting an array
      const roles = Array.isArray(action.payload) ? action.payload : [];
      console.log('Processed roles:', roles);
      
      // Update state
      state.assignedRoles = roles;
      
      // If no current role is set and we have roles, set the first one
      if (!state.currentRole && roles.length > 0) {
        state.currentRole = roles[0].code;
        // Set permissions based on the current role
        if (state.currentRole === 'SYSADMIN') {
          state.permissions = ['all'];
        } else {
          state.permissions = rolePermissions[state.currentRole] || [];
        }
      }
      
      console.log('State after setAssignedRoles:', JSON.stringify(state, null, 2));
    },
    setCurrentRole: (state, action) => {
      console.log('setCurrentRole reducer called with:', action.payload);
      
      // Only set the role if it's in the assigned roles or if there are no assigned roles yet
      const isAssigned = state.assignedRoles.length === 0 || 
                        state.assignedRoles.some(role => role.code === action.payload);
                        
      console.log('Role is assigned:', isAssigned);
      
      if (isAssigned) {
        state.currentRole = action.payload;
        // Update permissions based on the new role
        if (action.payload === 'SYSADMIN') {
          state.permissions = ['all'];
        } else {
          state.permissions = rolePermissions[action.payload] || [];
        }
      }
      
      console.log('State after setCurrentRole:', JSON.stringify(state, null, 2));
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    clearRoleAndPermissions: (state) => {
      state.currentRole = null;
      state.assignedRoles = [];
      state.permissions = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setAssignedRoles,
  setCurrentRole,
  setPermissions,
  clearRoleAndPermissions,
  setLoading,
  setError
} = rbacSlice.actions;

// Selectors
export const selectCurrentRole = (state) => state.rbac.currentRole;
export const selectAssignedRoles = (state) => state.rbac.assignedRoles;
export const selectPermissions = (state) => state.rbac.permissions;
export const selectIsLoading = (state) => state.rbac.isLoading;
export const selectError = (state) => state.rbac.error;

// Helper function to check if user has permission
export const hasPermission = (state, requiredPermission) => {
  const permissions = selectPermissions(state);
  return permissions.includes('all') || permissions.includes(requiredPermission);
};

// Helper function to check if user has any of the required permissions
export const hasAnyPermission = (state, requiredPermissions) => {
  const permissions = selectPermissions(state);
  if (permissions.includes('all')) return true;
  return requiredPermissions.some(permission => permissions.includes(permission));
};

export default rbacSlice.reducer; 
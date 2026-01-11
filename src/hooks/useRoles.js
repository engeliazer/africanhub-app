import { useState, useCallback } from 'react';
import { message } from 'antd';
import rolesService from '../services/roles';

export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const response = await rolesService.getRoles();
      if (response && response.data && Array.isArray(response.data.roles)) {
        const rolesArray = response.data.roles;
        setRoles(rolesArray.map(role => ({
          value: role.id,
          label: `${role.name} (${role.code})`
        })));
      } else {
        console.error('Invalid response format:', response);
        message.error('Failed to fetch roles: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to fetch roles');
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  return {
    roles,
    isLoadingRoles,
    fetchRoles,
  };
}; 
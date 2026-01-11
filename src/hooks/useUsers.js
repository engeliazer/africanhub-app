import { useState, useCallback } from 'react';
import { message } from 'antd';
import usersService from '../services/users';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 10,
  });

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await usersService.getUsers(params);
      setUsers(response.data.users);
      setPagination({
        ...pagination,
        total: response.data.total || response.data.users.length,
        current: params.page || 1,
        pageSize: params.pageSize || 10,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    pagination,
    fetchUsers,
  };
}; 
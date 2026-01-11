import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Select, message, Space, Tag, Tooltip, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import userRolesService from '../../services/userRoles';
import rolesService from '../../services/roles';
import { selectPermissions, setAssignedRoles, setCurrentRole } from '../../state/rbacSlice';

const { Search } = Input;
const { confirm } = Modal;

const UserRoles = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [hasRolesError, setHasRolesError] = useState(false);
  const userPermissions = useSelector(selectPermissions);

  // Function to update current user's roles in Redux and localStorage
  const updateCurrentUserRoles = (updatedUser) => {
    const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    
    // Only update if the modified user is the current user
    if (currentUserInfo.id === updatedUser.id) {
      // Update user info in localStorage
      const updatedUserInfo = {
        ...currentUserInfo,
        assignedRoles: updatedUser.roles,
        currentRole: updatedUser.roles.find(role => role.is_default)?.code || updatedUser.roles[0]?.code
      };
      localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));

      // Update Redux state
      dispatch(setAssignedRoles(updatedUser.roles));
      dispatch(setCurrentRole(updatedUserInfo.currentRole));
    }
  };

  // Check if user has required permissions
  const hasRequiredPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('all')) return true;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Fetch available roles when modal is opened
  useEffect(() => {
    let isMounted = true;
    
    const fetchRoles = async () => {
      if (!isModalVisible || !selectedUser) return;
      
      setIsLoadingRoles(true);
      setHasRolesError(false);
      
      try {
        const response = await rolesService.getRoles();
        if (!isMounted) return;

        // Check if response has the expected nested structure
        if (response && response.data && Array.isArray(response.data.roles)) {
          // Extract roles from the nested structure
          const rolesArray = response.data.roles;
          
          // Filter out roles that are already assigned to the selected user
          const available = rolesArray.filter(
            role => !selectedUser.roles?.some(userRole => userRole.code === role.code)
          );
          setAvailableRoles(available.map(role => ({
            value: role.code,
            label: `${role.name} (${role.code})`
          })));
        } else {
          console.error('Invalid response format:', response);
          setHasRolesError(true);
          message.error('Failed to fetch available roles: Invalid response format');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching roles:', error);
        setHasRolesError(true);
        message.error('Failed to fetch available roles');
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, [isModalVisible, selectedUser]);

  // Reset roles error state when modal is closed
  useEffect(() => {
    if (!isModalVisible) {
      setHasRolesError(false);
      setAvailableRoles([]);
    }
  }, [isModalVisible]);

  // Fetch users and their roles
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await rolesService.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        message.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const showAssignConfirm = () => {
    if (!selectedRole) {
      message.warning('Please select a role');
      return;
    }

    // Prevent self-role assignment
    const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (selectedUser.id === currentUserInfo.id) {
      message.error('You cannot modify your own roles for security reasons');
      return;
    }

    const selectedRoleInfo = availableRoles.find(role => role.value === selectedRole);
    
    confirm({
      title: 'Assign Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to assign the role "${selectedRoleInfo?.label}" to ${selectedUser?.name}?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        await handleAssignRole();
      },
    });
  };

  const showRemoveConfirm = (userId, userRoleId, roleName) => {
    // Prevent self-role removal
    const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (userId === currentUserInfo.id) {
      message.error('You cannot modify your own roles for security reasons');
      return;
    }

    const userName = users.find(user => user.id === userId)?.name;
    
    confirm({
      title: 'Remove Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to remove the role "${roleName}" from ${userName}?`,
      okText: 'Yes',
      cancelText: 'No',
      okType: 'danger',
      onOk: async () => {
        await handleRemoveRole(userId, userRoleId);
      },
    });
  };

  const showSetDefaultConfirm = (userId, roleId, roleName) => {
    const userName = users.find(user => user.id === userId)?.name;
    
    confirm({
      title: 'Set Default Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to set "${roleName}" as the default role for ${userName}?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        await handleSetDefaultRole(userId, roleId);
      },
    });
  };

  const handleAssignRole = async () => {
    setLoading(true);
    try {
      await userRolesService.assignRole(selectedUser.id, selectedRole);
      message.success('Role assigned successfully');
      setIsModalVisible(false);
      setSelectedRole(null);
      
      // Fetch updated user roles instead of full page refresh
      const response = await rolesService.getUsers();
      if (response?.data) {
        setUsers(response.data);
        // Update the selected user if in profile view
        const updatedUser = response.data.find(user => user.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      message.error(error.message || 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (userId, userRoleId) => {
    setLoading(true);
    try {
      await userRolesService.removeRole(userId, userRoleId);
      message.success('Role removed successfully');
      
      // Refresh users list
      const response = await rolesService.getUsers();
      setUsers(response.data);
      
      // Find the updated user in the response
      const updatedUser = response.data.find(user => user.id === userId);
      if (updatedUser) {
        updateCurrentUserRoles(updatedUser);
      }
    } catch (error) {
      console.error('Error removing role:', error);
      message.error(error.message || 'Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultRole = async (userId, roleId) => {
    setLoading(true);
    try {
      await userRolesService.setDefaultRole(userId, roleId);
      message.success('Default role updated successfully');
      
      // Refresh users list
      const response = await rolesService.getUsers();
      setUsers(response.data);
      
      // Find the updated user in the response
      const updatedUser = response.data.find(user => user.id === userId);
      if (updatedUser) {
        updateCurrentUserRoles(updatedUser);
      }
    } catch (error) {
      console.error('Error setting default role:', error);
      message.error(error.message || 'Failed to set default role');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <Space wrap>
          {record.roles?.map(role => (
            <Tag 
              key={role.id}
              color={role.is_default ? 'blue' : 'default'}
            >
              {role.name}
              {role.is_default && (
                <Tooltip title="Default Role">
                  <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />
                </Tooltip>
              )}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setIsModalVisible(true);
            }}
            disabled={loading}
          >
            Assign Role
          </Button>
          {record.roles?.map(role => (
            <Space key={role.id}>
              {!role.is_default && (
                <Tooltip title="Set as Default">
                  <Button
                    type="text"
                    icon={<StarOutlined />}
                    onClick={() => showSetDefaultConfirm(record.id, role.code, role.name)}
                    disabled={loading}
                  />
                </Tooltip>
              )}
              <Tooltip title="Remove Role">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => showRemoveConfirm(record.id, role.id, role.name)}
                  disabled={loading}
                />
              </Tooltip>
            </Space>
          ))}
        </Space>
      ),
    },
  ];

  // Filter users based on search text
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card title="User Roles Management">
        <div className="mb-4">
          <Search
            placeholder="Search users..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={setSearchText}
            style={{ width: 300 }}
          />
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`
          }}
        />

        <Modal
          title="Assign New Role"
          open={isModalVisible}
          onOk={() => showAssignConfirm()}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedUser(null);
            setSelectedRole(null);
            setAvailableRoles([]);
            setHasRolesError(false);
          }}
          confirmLoading={loading}
        >
          <div className="mb-4">
            <p><strong>User:</strong> {selectedUser?.name}</p>
            <p><strong>Email:</strong> {selectedUser?.email}</p>
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder={hasRolesError ? "Failed to load roles" : "Select a role"}
            onChange={setSelectedRole}
            loading={isLoadingRoles}
            options={availableRoles}
            disabled={hasRolesError}
          />
          {hasRolesError && (
            <div className="mt-2">
              <Button 
                type="link" 
                onClick={() => {
                  setHasRolesError(false); // This will trigger a re-fetch
                }}
              >
                Retry loading roles
              </Button>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default UserRoles; 
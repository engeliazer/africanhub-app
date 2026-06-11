import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Space, Tag, Tooltip, Input, Drawer, Tabs, message, Select } from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined, StarOutlined, StarFilled, SearchOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import userRolesService from '../../services/userRoles';
import rolesService from '../../services/roles';
import usersService from '../../services/users';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import userService from '../../services/user';
import accountingService from '../../services/accounting';
import { formatDate } from '../../utils/dateUtils';

const { Search } = Input;
const { TabPane } = Tabs;

const UsersList = () => {
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { roles: availableRoles, isLoadingRoles, fetchRoles } = useRoles();
  const [searchText, setSearchText] = useState('');
  const [tablePagination, setTablePagination] = useState({ current: 1, pageSize: 10 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isProfileDrawerVisible, setIsProfileDrawerVisible] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    setTablePagination((p) => ({ ...p, current: 1 }));
  }, [searchText]);

  const showUserProfile = async (user) => {
    try {
      const response = await usersService.getUser(user.id);
      setSelectedUserProfile(response.data);
      setIsProfileDrawerVisible(true);
      // Fetch payment history when opening the profile
      fetchPaymentHistory(user.id);
    } catch (error) {
      console.error('Error fetching user details:', error);
      message.error('Failed to load user details');
    }
  };

  const fetchPaymentHistory = async (userId) => {
    try {
      setLoadingPaymentHistory(true);
      const history = await accountingService.getPaymentHistory(userId);
      setPaymentHistory(history);
    } catch (error) {
      message.error('Failed to load payment history');
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const updateUserAndProfile = async () => {
    try {
      await fetchUsers();
      
      // Update the selected user profile if one is open
      if (selectedUserProfile) {
        const updatedUser = users.find(user => user.id === selectedUserProfile.id);
        if (updatedUser) {
          setSelectedUserProfile(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    }
  };

  const handleAssignRole = async () => {
    setIsAssigningRole(true);
    try {
      await userRolesService.assignRole(selectedUser.id, selectedRole);
      message.success('Role assigned successfully');
      setIsRoleModalVisible(false);
      setSelectedRole(null);
      await updateUserAndProfile();
    } catch (error) {
      console.error('Error assigning role:', error);
      message.error(error.message || 'Failed to assign role');
      throw error; // Re-throw to be caught by the Modal's onOk
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    setIsAssigningRole(true);
    try {
      await userRolesService.removeRole(userId, roleId);
      message.success('Role removed successfully');
      await updateUserAndProfile();
    } catch (error) {
      console.error('Error removing role:', error);
      message.error(error.message || 'Failed to remove role');
      throw error;
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleSetDefaultRole = async (userId, roleId) => {
    setIsAssigningRole(true);
    try {
      await userRolesService.setDefaultRole(userId, roleId);
      message.success('Default role updated successfully');
      await updateUserAndProfile();
    } catch (error) {
      console.error('Error setting default role:', error);
      message.error(error.message || 'Failed to set default role');
      throw error;
    } finally {
      setIsAssigningRole(false);
    }
  };

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
    
    Modal.confirm({
      title: 'Assign Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to assign the role "${selectedRoleInfo?.label}" to ${selectedUser?.first_name} ${selectedUser?.last_name}?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setIsAssigningRole(true);
        try {
        await handleAssignRole();
        } catch (error) {
          console.error('Error in role assignment:', error);
          message.error('Failed to assign role. Please try again.');
        } finally {
          setIsAssigningRole(false);
        }
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
    
    Modal.confirm({
      title: 'Remove Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to remove the role "${roleName}" from ${userName}?`,
      okText: 'Yes',
      cancelText: 'No',
      okType: 'danger',
      onOk: async () => {
        setIsAssigningRole(true);
        try {
        await handleRemoveRole(userId, userRoleId);
        } catch (error) {
          console.error('Error in role removal:', error);
          message.error('Failed to remove role. Please try again.');
        } finally {
          setIsAssigningRole(false);
        }
      },
    });
  };

  const columns = [
    {
      title: '#',
      key: 'sn',
      width: 56,
      align: 'center',
      render: (_, __, index) =>
        (tablePagination.current - 1) * tablePagination.pageSize + index + 1,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.middle_name || ''} ${record.last_name}`.trim(),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.roles?.map(role => (
            <Tag 
              key={role.id} 
              color="blue"
              className="mb-1"
            >
              {role.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showUserProfile(record)}
        >
          View Profile
        </Button>
      ),
    },
  ];

  // Filter users based on search text
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchText.toLowerCase())
  ) : [];

  const paymentHistoryColumns = [
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `KES ${amount.toLocaleString()}`,
    },
    {
      title: 'Reference',
      dataIndex: 'reference_number',
      key: 'reference_number',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'VERIFIED' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  // Define tab items
  const tabItems = [
    {
      key: 'profile',
      label: 'Profile Information',
      children: selectedUserProfile && (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <UserOutlined style={{ fontSize: '2rem' }} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="text-lg">{`${selectedUserProfile.first_name} ${selectedUserProfile.middle_name || ''} ${selectedUserProfile.last_name}`.trim()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg">{selectedUserProfile.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-lg">{selectedUserProfile.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Tag color={selectedUserProfile.status === 'ACTIVE' ? 'green' : 'red'}>
              {selectedUserProfile.status}
            </Tag>
          </div>
          <div>
            <p className="text-sm text-gray-500">Registration Mode</p>
            <p className="text-lg">{selectedUserProfile.registration_mode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="text-lg">{selectedUserProfile.created_at}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Role Management',
      children: selectedUserProfile && (
        <div className="space-y-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedUser(selectedUserProfile);
              setIsRoleModalVisible(true);
            }}
          >
            Assign New Role
          </Button>
          <div className="mt-4">
            {selectedUserProfile.roles?.map(role => (
              <Card key={role.id} size="small" className="mb-2">
                <div className="flex justify-between items-center">
                  <Space>
                    <Tag color="blue">
                      {role.name}
                    </Tag>
                    <span className="text-gray-500">({role.code})</span>
                  </Space>
                  <Space>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => showRemoveConfirm(selectedUserProfile.id, role.id, role.name)}
                    >
                      Remove
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'payments',
      label: 'Payment History',
      children: (
        <div className="space-y-4">
          <Table
            dataSource={paymentHistory}
            columns={paymentHistoryColumns}
            rowKey="id"
            loading={loadingPaymentHistory}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} payments`
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Users Management">
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
          loading={usersLoading}
          pagination={{
            current: tablePagination.current,
            pageSize: tablePagination.pageSize,
            total: filteredUsers.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} users`
          }}
          onChange={(pagination) => {
            setTablePagination({
              current: pagination?.current ?? 1,
              pageSize: pagination?.pageSize ?? 10
            });
          }}
        />

        {/* Role Assignment Modal */}
        <Modal
          title="Assign New Role"
          open={isRoleModalVisible}
          onOk={showAssignConfirm}
          onCancel={() => {
            setIsRoleModalVisible(false);
            setSelectedUser(null);
            setSelectedRole(null);
            setAvailableRoles([]);
          }}
          confirmLoading={isAssigningRole}
        >
          <div className="mb-4">
            <p><strong>User:</strong> {`${selectedUser?.first_name} ${selectedUser?.last_name}`}</p>
            <p><strong>Email:</strong> {selectedUser?.email}</p>
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a role"
            onChange={setSelectedRole}
            loading={isLoadingRoles}
            options={availableRoles}
          />
        </Modal>

        {/* User Profile Drawer */}
        <Drawer
          title="User Profile"
          placement="right"
          width={600}
          onClose={() => setIsProfileDrawerVisible(false)}
          open={isProfileDrawerVisible}
        >
          {selectedUserProfile && (
            <Tabs defaultActiveKey="profile" items={tabItems} />
          )}
        </Drawer>
      </Card>
    </div>
  );
};

export default UsersList; 
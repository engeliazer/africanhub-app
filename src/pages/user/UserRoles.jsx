import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Select, message, Space, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import userRolesService from '../../services/userRoles';
import rolesService from '../../services/roles';

const UserRoles = ({ userId, currentRoles, onRolesUpdate }) => {
  return (
    <App>
      <UserRolesContent userId={userId} currentRoles={currentRoles} onRolesUpdate={onRolesUpdate} />
    </App>
  );
};

const UserRolesContent = ({ userId, currentRoles, onRolesUpdate }) => {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const response = await rolesService.getRoles();
        console.log('Server response:', response); // Debug log
        
        // Check if response has the expected nested structure
        if (response && response.data && Array.isArray(response.data.roles)) {
          // Extract roles from the nested structure
          const rolesArray = response.data.roles;
          
          // Filter out roles that are already assigned
          const available = rolesArray.filter(
            role => !currentRoles?.some(currentRole => currentRole.code === role.code)
          );
          console.log('Available roles after filter:', available); // Debug log
          console.log('Current roles:', currentRoles); // Debug log
          setAvailableRoles(available);
        } else {
          console.error('Invalid response format:', response);
          message.error('Failed to fetch available roles: Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        message.error('Failed to fetch available roles');
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [currentRoles]);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      message.warning('Please select a role');
      return;
    }

    // Prevent self-role assignment in profile
    message.error('For security reasons, roles cannot be modified from your own profile. Please contact an administrator.');
    return;
  };

  const handleRemoveRole = async (roleId) => {
    // Prevent self-role removal in profile
    message.error('For security reasons, roles cannot be modified from your own profile. Please contact an administrator.');
    return;
  };

  const handleSetDefaultRole = async (roleId) => {
    // Prevent self-role default changes in profile
    message.error('For security reasons, roles cannot be modified from your own profile. Please contact an administrator.');
    return;
  };

  const columns = [
    {
      title: 'Role Code',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <Space>
          <span>{code}</span>
          {record.is_default && (
            <Tooltip title="Default Role">
              <StarFilled style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!record.is_default && (
            <Tooltip title="Set as Default">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => handleSetDefaultRole(record.id)}
                disabled={loading}
              />
            </Tooltip>
          )}
          <Tooltip title="Remove Role">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveRole(record.id)}
              disabled={loading}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card title="User Roles Management">
      <div className="mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          disabled={loading}
        >
          Assign New Role
        </Button>
      </div>

      <Table
        dataSource={currentRoles}
        columns={columns}
        rowKey="id"
        pagination={false}
        loading={loading}
      />

      <Modal
        title="Assign New Role"
        open={isModalVisible}
        onOk={handleAssignRole}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedRole(null);
        }}
        confirmLoading={loading}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select a role"
          onChange={setSelectedRole}
          loading={isLoadingRoles}
          options={availableRoles.map(role => ({
            value: role.id,
            label: `${role.name} (${role.code})`
          }))}
        />
      </Modal>
    </Card>
  );
};

export default UserRoles; 
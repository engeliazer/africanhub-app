import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Typography, Avatar, Table, Divider, Empty, Button, message } from 'antd';
import { UserOutlined, SwapOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentRole, selectAssignedRoles, setCurrentRole } from '../../state/rbacSlice';
import { useNavigate } from 'react-router-dom';
import UserRoles from './UserRoles';

const { Title } = Typography;

const Profile = () => {
  const currentRole = useSelector(selectCurrentRole);
  const assignedRoles = useSelector(selectAssignedRoles);
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    // Log incoming roles data
    console.log('Assigned roles from Redux:', assignedRoles);
    
    // Transform assignedRoles to include is_default flag
    const transformedRoles = assignedRoles.map(role => ({
      ...role,
      id: role.code, // Using code as id since that's what we have
      is_default: role.code === currentRole
    }));
    
    // Log transformed roles
    console.log('Transformed roles:', transformedRoles);
    
    setRoles(transformedRoles);
  }, [currentRole, assignedRoles]);

  const handleRoleSwitch = (newRole) => {
    dispatch(setCurrentRole(newRole));
    const roleName = assignedRoles.find(r => r.code === newRole)?.name || newRole;
    message.success(`Switched to ${roleName} role`);
    navigate('/user/profile');
  };

  const handleRolesUpdate = () => {
    // Refresh the page to get updated roles
    window.location.reload();
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center mb-6">
          <Avatar size={64} icon={<UserOutlined />} className="mr-4" />
          <div>
            <Title level={3} className="m-0">{userInfo.name || 'User'}</Title>
            {currentRole && <Tag color="blue">{currentRole}</Tag>}
          </div>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Email" span={2}>
            {userInfo.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone" span={2}>
            {userInfo.phone || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={2}>
            <Tag color={userInfo.status === 'ACTIVE' ? 'green' : 'red'}>
              {userInfo.status || 'UNKNOWN'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Assigned Roles" span={2}>
            {assignedRoles.length > 0 ? (
              assignedRoles.map(role => (
                <Tag key={role.code} color={role.code === currentRole ? 'blue' : 'default'}>
                  {role.name}
                </Tag>
              ))
            ) : (
              <span>No roles assigned</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        
        <Title level={5}>Your Roles</Title>
        {assignedRoles.length > 0 ? (
          <Table
            dataSource={assignedRoles}
            columns={[
              {
                title: 'Role Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Code',
                dataIndex: 'code',
                key: 'code',
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <Tag color={record.code === currentRole ? 'blue' : 'default'}>
                    {record.code === currentRole ? 'Current' : 'Available'}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  record.code !== currentRole && (
                    <Button
                      icon={<SwapOutlined />}
                      onClick={() => handleRoleSwitch(record.code)}
                    >
                      Switch to this role
                    </Button>
                  )
                ),
              },
            ]}
            rowKey="code"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="No roles assigned" />
        )}
      </Card>
    </div>
  );
};

export default Profile; 
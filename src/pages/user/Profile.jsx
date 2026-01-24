import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Typography, Avatar, Table, Divider, Empty, Button, message, Space } from 'antd';
import { UserOutlined, SwapOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentRole, selectAssignedRoles, setCurrentRole } from '../../state/rbacSlice';
import { useNavigate } from 'react-router-dom';
import UserRoles from './UserRoles';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

const Profile = () => {
  const { colors } = useTheme();
  const currentRole = useSelector(selectCurrentRole);
  const assignedRoles = useSelector(selectAssignedRoles);
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    // Transform assignedRoles to include is_default flag
    const transformedRoles = assignedRoles.map(role => ({
      ...role,
      id: role.code,
      is_default: role.code === currentRole
    }));
    
    setRoles(transformedRoles);
  }, [currentRole, assignedRoles]);

  const handleRoleSwitch = (newRole) => {
    dispatch(setCurrentRole(newRole));
    const roleName = assignedRoles.find(r => r.code === newRole)?.name || newRole;
    message.success(`Switched to ${roleName} role`);
    navigate('/user/profile');
  };

  const handleRolesUpdate = () => {
    window.location.reload();
  };

  const fullName = `${userInfo.first_name || ''} ${userInfo.middle_name || ''} ${userInfo.last_name || ''}`.trim() || userInfo.name || 'User';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <Card
        style={{
          background: `linear-gradient(135deg, ${colors.border} 0%, ${colors.card} 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <Avatar 
            size={96} 
            icon={<UserOutlined />} 
            style={{
              background: `linear-gradient(135deg, ${colors.cardDepth} 0%, ${colors.border} 100%)`,
              border: `4px solid ${colors.border}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              marginRight: '24px'
            }}
          />
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ color: colors.textPrimary, margin: 0, marginBottom: '8px', fontWeight: 600 }}>
              {fullName}
            </Title>
            <Space wrap style={{ marginTop: '8px' }}>
              {currentRole && (
                <Tag 
                  style={{
                    background: colors.primaryAccent,
                    color: colors.background,
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '13px'
                  }}
                >
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  {assignedRoles.find(r => r.code === currentRole)?.name || currentRole}
                </Tag>
              )}
              <Tag 
                style={{
                  background: userInfo.status === 'ACTIVE' ? colors.primaryAccent : colors.red,
                  color: userInfo.status === 'ACTIVE' ? colors.background : colors.textPrimary,
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: '13px'
                }}
              >
                {userInfo.status || 'UNKNOWN'}
              </Tag>
            </Space>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginTop: '24px'
        }}>
          <div style={{
            background: colors.cardDepth,
            padding: '16px 20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <Space>
              <MailOutlined style={{ color: colors.textMuted, fontSize: '18px' }} />
              <div>
                <Text style={{ color: colors.textMuted, fontSize: '12px', display: 'block', marginBottom: '4px' }}>Email</Text>
                <Text style={{ color: colors.textPrimary, fontSize: '14px', fontWeight: 500 }}>
                  {userInfo.email || 'N/A'}
                </Text>
              </div>
            </Space>
          </div>
          <div style={{
            background: colors.cardDepth,
            padding: '16px 20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <Space>
              <PhoneOutlined style={{ color: colors.textMuted, fontSize: '18px' }} />
              <div>
                <Text style={{ color: colors.textMuted, fontSize: '12px', display: 'block', marginBottom: '4px' }}>Phone</Text>
                <Text style={{ color: colors.textPrimary, fontSize: '14px', fontWeight: 500 }}>
                  {userInfo.phone || 'N/A'}
                </Text>
              </div>
            </Space>
          </div>
        </div>
      </Card>

      {/* Assigned Roles Section */}
      <Card
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Title level={4} style={{ color: colors.textPrimary, marginBottom: '24px', fontWeight: 600 }}>
          Your Roles
        </Title>
        
        {assignedRoles.length > 0 ? (
          <div style={{ background: colors.cardDepth, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <Table
              dataSource={assignedRoles}
              columns={[
                {
                  title: 'Role Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <Text style={{ color: colors.textPrimary, fontWeight: record.code === currentRole ? 600 : 400 }}>
                      {text}
                    </Text>
                  )
                },
                {
                  title: 'Code',
                  dataIndex: 'code',
                  key: 'code',
                  render: (text) => (
                    <Text style={{ color: colors.textMuted, fontFamily: 'monospace' }}>{text}</Text>
                  )
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, record) => (
                    <Tag 
                      style={{
                        background: record.code === currentRole ? colors.primaryAccent : colors.border,
                        color: record.code === currentRole ? colors.background : colors.textSecondary,
                        border: record.code === currentRole ? 'none' : `1px solid ${colors.border}`,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontWeight: 500
                      }}
                    >
                      {record.code === currentRole ? 'Current' : 'Available'}
                    </Tag>
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    record.code !== currentRole ? (
                      <Button
                        type="text"
                        icon={<SwapOutlined />}
                        onClick={() => handleRoleSwitch(record.code)}
                        style={{
                          color: colors.textPrimary,
                          border: `1px solid ${colors.cardDepth}`,
                          borderRadius: '6px',
                          fontWeight: 500,
                          background: colors.border
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.cardDepth;
                          e.currentTarget.style.borderColor = colors.cardDepth;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.border;
                          e.currentTarget.style.borderColor = colors.cardDepth;
                        }}
                      >
                        Switch Role
                      </Button>
                    ) : (
                      <Text style={{ color: colors.textMuted }}>-</Text>
                    )
                  ),
                },
              ]}
              rowKey="code"
              pagination={false}
              style={{
                background: 'transparent'
              }}
              className="profile-roles-table"
            />
          </div>
        ) : (
          <Empty 
            description={<Text style={{ color: colors.textMuted }}>No roles assigned</Text>}
            style={{ padding: '40px 0' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Profile; 
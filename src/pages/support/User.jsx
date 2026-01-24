import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Input, message, Drawer, Tabs, Typography, Spin } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined, DesktopOutlined } from '@ant-design/icons';
import usersService from '../../services/users';
import userDevicesService from '../../services/userDevices';
import accountingService from '../../services/accounting';
import { formatDate } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';

const { Search } = Input;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

const User = () => {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileDrawerVisible, setIsProfileDrawerVisible] = useState(false);
  const [userDevices, setUserDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersService.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDevices = async (userId) => {
    setLoadingDevices(true);
    try {
      const response = await userDevicesService.getUserDevices(userId);
      setUserDevices(response.data.devices || []);
    } catch (error) {
      console.error('Error fetching user devices:', error);
      // Don't show error message for user devices
      setUserDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchPaymentHistory = async (userId) => {
    setLoadingPaymentHistory(true);
    try {
      const response = await accountingService.getPaymentHistory(userId);
      if (response?.data?.data?.applications) {
        setPaymentHistory(response.data.data.applications);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Don't show error message for payment history
      setPaymentHistory([]);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const showUserProfile = (user) => {
    setSelectedUser(user);
    setIsProfileDrawerVisible(true);
    fetchUserDevices(user.id);
    fetchPaymentHistory(user.id);
  };

  const handleMakePrimary = async (deviceId) => {
    try {
      await userDevicesService.makeDevicePrimary(deviceId);
      message.success('Device set as primary successfully');
      // Refresh the devices list
      fetchUserDevices(selectedUser.id);
    } catch (error) {
      console.error('Error making device primary:', error);
      message.error('Failed to set device as primary');
    }
  };

  const deviceColumns = [
    {
      title: 'Device ID & Status',
      key: 'device_id_status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <span style={{ color: colors.textMuted }}>Visitor ID: </span>
            <Tag color="purple">{record.visitor_id}</Tag>
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Status: </span>
            <Tag color={record.is_primary ? 'green' : 'blue'}>
              {record.is_primary ? 'Primary' : 'Secondary'}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Device Info',
      key: 'device_info',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <span style={{ color: colors.textMuted }}>Browser: </span>
            <span style={{ color: colors.textPrimary }}>{record.browser_name}</span>
            {record.browser_version && (
              <span style={{ color: colors.textMuted, marginLeft: '8px' }}>({record.browser_version})</span>
            )}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>OS: </span>
            <span style={{ color: colors.textPrimary }}>{record.os_name}</span>
            {record.os_version && (
              <span style={{ color: colors.textMuted, marginLeft: '8px' }}>({record.os_version})</span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <span style={{ color: colors.textMuted }}>Created at: </span>
            <span style={{ color: colors.textPrimary }}>{new Date(record.created_at).toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Last used at: </span>
            <span style={{ color: colors.textPrimary }}>{new Date(record.last_used).toLocaleString()}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        !record.is_primary && (
          <Button
            type="primary"
            size="small"
            onClick={() => handleMakePrimary(record.id)}
            style={{
              background: colors.primaryAccent,
              borderColor: colors.primaryAccent,
            }}
            icon={<DesktopOutlined />}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.secondaryAccent;
              e.currentTarget.style.borderColor = colors.secondaryAccent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primaryAccent;
              e.currentTarget.style.borderColor = colors.primaryAccent;
            }}
          >
            Set as Primary
          </Button>
        )
      ),
    },
  ];

  const paymentHistoryColumns = [
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Subjects',
      key: 'subjects',
      render: (_, record) => (
        <div>
          {record.application?.subjects?.map(subject => (
            <div key={subject.id}>
              {subject.code} - {subject.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Reference',
      key: 'reference',
      render: (_, record) => (
        <div>
          <div><strong>Transaction ID:</strong> {record.transaction_id}</div>
          <div><strong>Bank Ref:</strong> {record.bank_reference}</div>
        </div>
      ),
    },
    {
      title: 'Amount & Status',
      key: 'amount_status',
      render: (_, record) => (
        <div>
          <div className="mb-1">TZS {record.amount.toLocaleString()}</div>
          <Tag color={record.status === 'approved' ? 'green' : record.status === 'pending' ? 'orange' : 'red'}>
            {record.status?.toUpperCase()}
          </Tag>
        </div>
      ),
    },
  ];

  const columns = [
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
      title: 'Registration Mode',
      dataIndex: 'registration_mode',
      key: 'registration_mode',
      render: (mode) => (
        <Tag color="blue">
          {mode}
        </Tag>
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
          View Details
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

  return (
    <div className="p-6">
      <Card title="Support Users Management">
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

        {/* User Profile Drawer */}
        <Drawer
          title="User Profile"
          placement="right"
          width={800}
          onClose={() => setIsProfileDrawerVisible(false)}
          open={isProfileDrawerVisible}
        >
          {selectedUser && (
            <Tabs defaultActiveKey="profile">
              <TabPane tab="Profile Information" key="profile">
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-6">
                    <div 
                      style={{
                        width: '96px',
                        height: '96px',
                        background: colors.cardDepth,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <UserOutlined style={{ fontSize: '2rem', color: colors.textPrimary }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Full Name</p>
                    <p style={{ fontSize: '18px', color: colors.textPrimary }}>{`${selectedUser.first_name} ${selectedUser.middle_name || ''} ${selectedUser.last_name}`.trim()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Email</p>
                    <p style={{ fontSize: '18px', color: colors.textPrimary }}>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Phone</p>
                    <p style={{ fontSize: '18px', color: colors.textPrimary }}>{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Status</p>
                    <Tag color={selectedUser.status === 'ACTIVE' ? 'green' : 'red'}>
                      {selectedUser.status}
                    </Tag>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Registration Mode</p>
                    <p style={{ fontSize: '18px', color: colors.textPrimary }}>{selectedUser.registration_mode}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>Created At</p>
                    <p style={{ fontSize: '18px', color: colors.textPrimary }}>{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </TabPane>
              <TabPane tab="Devices" key="devices">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <DesktopOutlined />
                    <Title level={5} className="m-0">User Devices</Title>
                  </div>
                  <Table
                    dataSource={userDevices}
                    columns={deviceColumns}
                    rowKey="id"
                    loading={loadingDevices}
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} devices`
                    }}
                  />
                </div>
              </TabPane>
              <TabPane tab="Payment History" key="payments">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Title level={5} className="m-0">Payment History</Title>
                  </div>
                  {loadingPaymentHistory ? (
                    <div className="flex justify-center items-center h-32">
                      <Spin size="large" />
                    </div>
                  ) : paymentHistory.length > 0 ? (
                    <Table
                      dataSource={paymentHistory}
                      columns={paymentHistoryColumns}
                      rowKey="id"
                      pagination={{
                        pageSize: 5,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} payments`
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        textAlign: 'center',
                        padding: '32px',
                        background: colors.cardDepth,
                        borderRadius: '8px'
                      }}
                    >
                      <Text style={{ color: colors.textSecondary }}>No payment history available for this user</Text>
                    </div>
                  )}
                </div>
              </TabPane>
            </Tabs>
          )}
        </Drawer>
      </Card>
    </div>
  );
};

export default User; 
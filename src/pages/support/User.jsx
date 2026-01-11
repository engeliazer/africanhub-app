import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Input, message, Drawer, Tabs, Typography, Spin } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined, DesktopOutlined } from '@ant-design/icons';
import usersService from '../../services/users';
import userDevicesService from '../../services/userDevices';
import accountingService from '../../services/accounting';
import { formatDate } from '../../utils/dateUtils';

const { Search } = Input;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

const User = () => {
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
            <span className="text-gray-500">Visitor ID: </span>
            <Tag color="purple">{record.visitor_id}</Tag>
          </div>
          <div>
            <span className="text-gray-500">Status: </span>
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
            <span className="text-gray-500">Browser: </span>
            <span>{record.browser_name}</span>
            {record.browser_version && (
              <span className="text-gray-500 ml-2">({record.browser_version})</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">OS: </span>
            <span>{record.os_name}</span>
            {record.os_version && (
              <span className="text-gray-500 ml-2">({record.os_version})</span>
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
            <span className="text-gray-500">Created at: </span>
            <span>{new Date(record.created_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Last used at: </span>
            <span>{new Date(record.last_used).toLocaleString()}</span>
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
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
            icon={<DesktopOutlined />}
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
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserOutlined style={{ fontSize: '2rem' }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-lg">{`${selectedUser.first_name} ${selectedUser.middle_name || ''} ${selectedUser.last_name}`.trim()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-lg">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Tag color={selectedUser.status === 'ACTIVE' ? 'green' : 'red'}>
                      {selectedUser.status}
                    </Tag>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Mode</p>
                    <p className="text-lg">{selectedUser.registration_mode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="text-lg">{new Date(selectedUser.created_at).toLocaleString()}</p>
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
                    <div className="text-center p-8 bg-gray-50 rounded">
                      <Text type="secondary">No payment history available for this user</Text>
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
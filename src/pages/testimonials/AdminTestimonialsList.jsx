import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  message, 
  Popconfirm, 
  Switch, 
  Upload, 
  Avatar,
  Tag,
  Tooltip,
  Drawer,
  Descriptions,
  Image,
  Row,
  Col,
  Rate,
  Alert,
  Tabs,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
  StarOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import testimonialsService from '../../services/testimonials';

const { TextArea } = Input;
const { TabPane } = Tabs;

const AdminTestimonialsList = () => {
  const [allTestimonials, setAllTestimonials] = useState([]);
  const [pendingTestimonials, setPendingTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Get current user from localStorage (same as other components)
  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  useEffect(() => {
    fetchAllTestimonials();
    fetchPendingTestimonials();
  }, []);

  const fetchAllTestimonials = async () => {
    try {
      setLoading(true);
      const response = await testimonialsService.getTestimonials();
      if (response.status === 'success') {
        setAllTestimonials(response.data);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      message.error('Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTestimonials = async () => {
    try {
      const response = await testimonialsService.getPendingTestimonials();
      if (response.status === 'success') {
        setPendingTestimonials(response.data);
      }
    } catch (error) {
      console.error('Error fetching pending testimonials:', error);
      message.error('Failed to fetch pending testimonials');
    }
  };

  const handleView = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setViewDrawerVisible(true);
  };

  const handleApprove = async (id) => {
    try {
      await testimonialsService.reviewTestimonial(id, {
        is_approved: true,
        reviewed_by: currentUser?.id,
        updated_by: currentUser?.id
      });
      message.success('Testimonial approved successfully');
      fetchAllTestimonials();
      fetchPendingTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      message.error('Failed to approve testimonial');
    }
  };

  const handleReject = async (id) => {
    try {
      await testimonialsService.reviewTestimonial(id, {
        is_approved: false,
        reviewed_by: currentUser?.id,
        updated_by: currentUser?.id
      });
      message.success('Testimonial rejected');
      fetchAllTestimonials();
      fetchPendingTestimonials();
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      message.error('Failed to reject testimonial');
    }
  };

  const handleDelete = async (id) => {
    try {
      await testimonialsService.deleteTestimonial(id);
      message.success('Testimonial deleted successfully');
      fetchAllTestimonials();
      fetchPendingTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      message.error('Failed to delete testimonial');
    }
  };

  const filteredAllTestimonials = allTestimonials.filter(testimonial =>
    testimonial.role?.toLowerCase().includes(searchText.toLowerCase()) ||
    testimonial.text?.toLowerCase().includes(searchText.toLowerCase()) ||
    testimonial.full_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredPendingTestimonials = pendingTestimonials.filter(testimonial =>
    testimonial.role?.toLowerCase().includes(searchText.toLowerCase()) ||
    testimonial.text?.toLowerCase().includes(searchText.toLowerCase()) ||
    testimonial.full_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const allColumns = [
    {
      title: 'Photo',
      dataIndex: 'photo',
      key: 'photo',
      width: 80,
      render: (photo, record) => (
        <Avatar
          size={40}
          src={photo}
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
          onClick={() => handleView(record)}
        />
      ),
    },
    {
      title: 'User',
      dataIndex: 'full_name',
      key: 'user_name',
      sorter: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''),
      sortDirections: ['ascend', 'descend'],
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          {text || 'Unknown User'}
        </Button>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      align: 'center',
      render: (rating) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <Rate disabled value={rating} style={{ fontSize: '12px', lineHeight: '1' }} />
        </div>
      ),
    },
    {
      title: 'Testimonial',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      render: (text) => (
        <div style={{ 
          wordWrap: 'break-word', 
          whiteSpace: 'normal',
          maxWidth: '300px'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_approved',
      key: 'is_approved',
      width: 120,
      render: (isApproved) => (
        <Tag color={isApproved ? 'green' : 'orange'}>
          {isApproved ? 'Approved' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {!record.is_approved && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record.id)}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record.id)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title="Are you sure you want to delete this testimonial?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pendingColumns = [
    {
      title: 'Photo',
      dataIndex: 'photo',
      key: 'photo',
      width: 80,
      render: (photo, record) => (
        <Avatar
          size={40}
          src={photo}
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
          onClick={() => handleView(record)}
        />
      ),
    },
    {
      title: 'User',
      dataIndex: 'full_name',
      key: 'user_name',
      sorter: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''),
      sortDirections: ['ascend', 'descend'],
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          {text || 'Unknown User'}
        </Button>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      align: 'center',
      render: (rating) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <Rate disabled value={rating} style={{ fontSize: '12px', lineHeight: '1' }} />
        </div>
      ),
    },
    {
      title: 'Testimonial',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      render: (text) => (
        <div style={{ 
          wordWrap: 'break-word', 
          whiteSpace: 'normal',
          maxWidth: '300px'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Approve">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Reject">
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(record.id)}
            >
              Reject
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Testimonials Management"
        extra={
          <Space>
            <Input
              placeholder="Search testimonials..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                All Testimonials
                <Badge count={allTestimonials.length} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="all"
          >
            <Table
              columns={allColumns}
              dataSource={filteredAllTestimonials}
              rowKey="id"
              loading={loading}
              pagination={{
                total: filteredAllTestimonials.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} testimonials`,
              }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Pending Review
                <Badge count={pendingTestimonials.length} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="pending"
          >
            <Alert
              message="Pending Testimonials"
              description="These testimonials are waiting for your review and approval before they can appear on the public website."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={pendingColumns}
              dataSource={filteredPendingTestimonials}
              rowKey="id"
              loading={loading}
              pagination={{
                total: filteredPendingTestimonials.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} pending testimonials`,
              }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* View Drawer */}
      <Drawer
        title="Testimonial Details"
        placement="right"
        width={500}
        open={viewDrawerVisible}
        onClose={() => setViewDrawerVisible(false)}
      >
        {selectedTestimonial && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={120}
                src={selectedTestimonial.photo}
                icon={<UserOutlined />}
              />
            </div>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="User">
                {selectedTestimonial.full_name || 'Unknown User'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedTestimonial.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {selectedTestimonial.role}
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                <Rate disabled value={selectedTestimonial.rating} />
              </Descriptions.Item>
              <Descriptions.Item label="Testimonial">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedTestimonial.text}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedTestimonial.is_approved ? 'green' : 'orange'}>
                  {selectedTestimonial.is_approved ? 'Approved' : 'Pending Review'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {new Date(selectedTestimonial.created_at).toLocaleString()}
              </Descriptions.Item>
              {selectedTestimonial.reviewed_at && (
                <Descriptions.Item label="Reviewed At">
                  {new Date(selectedTestimonial.reviewed_at).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedTestimonial.reviewed_by && (
                <Descriptions.Item label="Reviewed By">
                  {selectedTestimonial.reviewer_name || 'Unknown'}
                </Descriptions.Item>
              )}
            </Descriptions>

            {!selectedTestimonial.is_approved && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      handleApprove(selectedTestimonial.id);
                      setViewDrawerVisible(false);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      handleReject(selectedTestimonial.id);
                      setViewDrawerVisible(false);
                    }}
                  >
                    Reject
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminTestimonialsList;

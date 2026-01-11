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
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
  StarOutlined
} from '@ant-design/icons';
import testimonialsService from '../../services/testimonials';

const { TextArea } = Input;

const TestimonialsList = () => {
  const [testimonials, setTestimonials] = useState([]);
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
  const [submitting, setSubmitting] = useState(false);
  
  // Get current user from localStorage (same as other components)
  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // For students, we'll show their own testimonials
      const response = await testimonialsService.getTestimonials();
      if (response.status === 'success') {
        // Filter to show only current user's testimonials
        const userTestimonials = response.data.filter(testimonial => 
          testimonial.user_id === currentUser?.id
        );
        setTestimonials(userTestimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      message.error('Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setSelectedTestimonial(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (testimonial) => {
    setEditingId(testimonial.id);
    setSelectedTestimonial(testimonial);
    setPhotoFile(null);
    setPhotoPreview(testimonial.photo);
    form.setFieldsValue({
      role: testimonial.role,
      text: testimonial.text,
      rating: testimonial.rating,
      is_active: testimonial.is_active
    });
    setModalVisible(true);
  };

  const handleView = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setViewDrawerVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingId) {
        await testimonialsService.updateTestimonial(editingId, values, photoFile);
        message.success('Testimonial updated successfully');
      } else {
        // Add current user ID for new testimonials
        const testimonialData = {
          ...values,
          user_id: currentUser?.id
        };
        
        // Debug logging
        console.log('Current user:', currentUser);
        console.log('Testimonial data:', testimonialData);
        
        if (!currentUser?.id) {
          message.error('User not found. Please log in again.');
          return;
        }
        
        await testimonialsService.createTestimonial(testimonialData, photoFile);
        message.success('Testimonial submitted successfully! It will be reviewed before going public.');
      }
      setModalVisible(false);
      form.resetFields();
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      message.error('Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await testimonialsService.deleteTestimonial(id);
      message.success('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      message.error('Failed to delete testimonial');
    }
  };

  const handlePhotoChange = (info) => {
    if (info.file) {
      setPhotoFile(info.file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(info.file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoUpload = async (file, testimonialId) => {
    try {
      setUploading(true);
      await testimonialsService.uploadPhoto(file, testimonialId);
      message.success('Photo uploaded successfully');
      fetchTestimonials();
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.role?.toLowerCase().includes(searchText.toLowerCase()) ||
    testimonial.text?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
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
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
      sortDirections: ['ascend', 'descend'],
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          {text}
        </Button>
      ),
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Testimonial
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredTestimonials}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredTestimonials.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} testimonials`,
          }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? 'Edit Testimonial' : 'Add Testimonial'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setPhotoFile(null);
          setPhotoPreview(null);
          setSubmitting(false);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Alert
            message="Testimonial Submission"
            description="Give us your feedback and let us know what you think about our services and courses."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="role"
            label="Your Role/Position"
            rules={[{ required: true, message: 'Please enter your role or position' }]}
          >
            <Input placeholder="e.g., CPA Graduate, 2024" />
          </Form.Item>

          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please provide a rating' }]}
            initialValue={5}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="text"
            label="Testimonial Text"
            rules={[{ required: true, message: 'Please enter testimonial text' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter testimonial text"
            />
          </Form.Item>

          <Form.Item label="Photo">
            <Upload
              beforeUpload={() => false} // Prevent auto upload
              onChange={handlePhotoChange}
              onRemove={handlePhotoRemove}
              showUploadList={false}
              accept="image/*"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                {photoFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </Upload>
            {photoPreview && (
              <div style={{ marginTop: 10 }}>
                <Image
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Supported formats: JPG, PNG, GIF. Max size: 5MB. Recommended: 300x300px
            </div>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                disabled={submitting}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setSubmitting(false);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
              {selectedTestimonial.reviewed_at && (
                <Descriptions.Item label="Reviewed At">
                  {new Date(selectedTestimonial.reviewed_at).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TestimonialsList;

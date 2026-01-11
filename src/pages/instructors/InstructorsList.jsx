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
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  UserOutlined,
  UploadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import instructorsService from '../../services/instructors';

const { Search } = Input;
const { TextArea } = Input;

const InstructorsList = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await instructorsService.getInstructors();
      if (response.status === 'success') {
        setInstructors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      message.error('Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setSelectedInstructor(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (instructor) => {
    setEditingId(instructor.id);
    setSelectedInstructor(instructor);
    setPhotoFile(null);
    setPhotoPreview(instructor.photo);
    form.setFieldsValue({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio,
      is_active: instructor.is_active
    });
    setModalVisible(true);
  };

  const handleView = (instructor) => {
    setSelectedInstructor(instructor);
    setViewDrawerVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingId) {
        await instructorsService.updateInstructor(editingId, values, photoFile);
        message.success('Instructor updated successfully');
      } else {
        await instructorsService.createInstructor(values, photoFile);
        message.success('Instructor created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchInstructors();
    } catch (error) {
      console.error('Error saving instructor:', error);
      message.error('Failed to save instructor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await instructorsService.deleteInstructor(id);
      message.success('Instructor deleted successfully');
      fetchInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      message.error('Failed to delete instructor');
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

  const handlePhotoUpload = async (file, instructorId) => {
    try {
      setUploading(true);
      await instructorsService.uploadPhoto(file, instructorId);
      message.success('Photo uploaded successfully');
      fetchInstructors();
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchText.toLowerCase()) ||
    instructor.title?.toLowerCase().includes(searchText.toLowerCase())
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.title}</div>
        </div>
      ),
    },
    {
      title: 'Bio',
      dataIndex: 'bio',
      key: 'bio',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
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
            title="Are you sure you want to delete this instructor?"
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
    <div className="p-6">
      <Card 
        title="Instructors Management"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            Add Instructor
          </Button>
        }
      >
        <div className="mb-4">
          <Search
            placeholder="Search instructors..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={setSearchText}
            style={{ width: 300 }}
          />
        </div>

        <Table
          dataSource={filteredInstructors}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} instructors`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? 'Edit Instructor' : 'Add Instructor'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter instructor name' }]}
              >
                <Input placeholder="Enter instructor name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title/Qualifications"
                rules={[{ required: true, message: 'Please enter instructor title' }]}
              >
                <Input placeholder="e.g., CPA, PhD in Accounting" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bio"
            label="Biography"
            rules={[{ required: true, message: 'Please enter instructor bio' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter instructor biography and experience"
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
        title="Instructor Details"
        placement="right"
        width={600}
        onClose={() => setViewDrawerVisible(false)}
        open={viewDrawerVisible}
      >
        {selectedInstructor && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={120}
                src={selectedInstructor.photo}
                icon={<UserOutlined />}
              />
              <div style={{ marginTop: 10 }}>
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handlePhotoUpload(file, selectedInstructor.id);
                    return false;
                  }}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                    size="small"
                  >
                    Change Photo
                  </Button>
                </Upload>
              </div>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Name">
                {selectedInstructor.name}
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                {selectedInstructor.title}
              </Descriptions.Item>
              <Descriptions.Item label="Biography">
                {selectedInstructor.bio}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedInstructor.is_active ? 'green' : 'red'}>
                  {selectedInstructor.is_active ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(selectedInstructor.created_at).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => {
                    setViewDrawerVisible(false);
                    handleEdit(selectedInstructor);
                  }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Are you sure you want to delete this instructor?"
                  onConfirm={() => {
                    handleDelete(selectedInstructor.id);
                    setViewDrawerVisible(false);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default InstructorsList;

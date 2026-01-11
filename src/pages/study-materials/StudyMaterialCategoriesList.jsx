import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import studyMaterialCategoriesService from '../../services/studyMaterialCategories';

const StudyMaterialCategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch categories
  const fetchCategories = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      console.log('Fetching categories...');
      const response = await studyMaterialCategoriesService.getStudyMaterialCategories(page, perPage);
      console.log('API Response:', response);
      
      if (response.status === 'success') {
        console.log('Setting categories:', response.data);
        setCategories(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.length,
          pageSize: perPage
        });
      } else {
        console.error('API returned non-success status:', response);
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error response:', error.response);
      message.error(error.message || 'Failed to fetch categories');
      setCategories([]);
      setPagination({
        ...pagination,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(pagination.current, pagination.pageSize);
  }, []);

  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        ...category
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        created_by: 1,
        updated_by: 1
      };

      if (editingCategory) {
        await studyMaterialCategoriesService.updateStudyMaterialCategory(editingCategory.id, formattedValues);
        message.success('Category updated successfully');
      } else {
        await studyMaterialCategoriesService.createStudyMaterialCategory(formattedValues);
        message.success('Category created successfully');
      }

      handleCancel();
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving category:', error);
      message.error(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await studyMaterialCategoriesService.deleteStudyMaterialCategory(id);
      message.success('Category deleted successfully');
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error(error.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchCategories(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => record.name
    },
    {
      title: 'Code',
      key: 'code',
      render: (_, record) => record.code
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, record) => record.description
    },
    {
      title: 'Status',
      key: 'is_protected',
      render: (_, record) => (
        <Tag color={record.is_protected ? 'red' : 'green'}>
          {record.is_protected ? 'Protected' : 'Public'}
        </Tag>
      )
    },
    {
      title: 'Created At',
      key: 'created_at',
      render: (_, record) => new Date(record.created_at).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Study Material Categories">
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Category
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter category name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="code"
              label="Code"
              rules={[{ required: true, message: 'Please enter category code' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="is_protected"
              label="Protected"
              valuePropName="checked"
              initialValue={false}
            >
              <Input type="checkbox" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default StudyMaterialCategoriesList; 
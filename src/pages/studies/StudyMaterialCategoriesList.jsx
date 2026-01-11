import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message } from 'antd';
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

  const fetchCategories = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = await studyMaterialCategoriesService.getStudyMaterialCategories(page, perPage);
      console.log('API Response:', response); // Debug log
      
      // Handle the actual API response structure
      if (response.status === 'success') {
        const categoriesData = response.data || [];
        console.log('Processed Categories:', categoriesData); // Debug log
        
        setCategories(categoriesData);
        setPagination({
          ...pagination,
          current: page,
          total: categoriesData.length // Since the API doesn't return total count, we'll use the length
        });
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleTableChange = (pagination) => {
    fetchCategories(pagination.current, pagination.pageSize);
  };

  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue(category);
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

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Protected',
      dataIndex: 'is_protected',
      key: 'is_protected',
      render: (isProtected) => (
        <Switch checked={isProtected} disabled />
      ),
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
            disabled={record.is_protected}
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
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Category
          </Button>
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
              rules={[{ required: true, message: 'Please enter category description' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="is_protected"
              label="Protected"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default StudyMaterialCategoriesList; 
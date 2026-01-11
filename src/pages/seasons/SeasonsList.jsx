import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import seasonsService from '../../services/seasons';
import dayjs from 'dayjs';

const SeasonsList = () => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch seasons
  const fetchSeasons = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = await seasonsService.getSeasons(page, perPage);
      const seasonsData = response.data || [];
      setSeasons(seasonsData);
      setPagination({
        ...pagination,
        current: page,
        total: seasonsData.length
      });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      message.error('Failed to fetch seasons');
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination) => {
    fetchSeasons(pagination.current, pagination.pageSize);
  };

  const showModal = (season = null) => {
    setEditingSeason(season);
    if (season) {
      form.setFieldsValue({
        ...season,
        start_date: dayjs(season.start_date),
        end_date: dayjs(season.end_date)
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSeason(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        created_by: 1,
        updated_by: 1
      };

      if (editingSeason) {
        await seasonsService.updateSeason(editingSeason.id, formattedValues);
        message.success('Season updated successfully');
      } else {
        await seasonsService.createSeason(formattedValues);
        message.success('Season created successfully');
      }

      handleCancel();
      fetchSeasons(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving season:', error);
      message.error(error.message || 'Failed to save season');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await seasonsService.deleteSeason(id);
      message.success('Season deleted successfully');
      fetchSeasons(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting season:', error);
      message.error(error.message || 'Failed to delete season');
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
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Switch checked={isActive} disabled />
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
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Seasons">
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Season
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={seasons}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={editingSeason ? 'Edit Season' : 'Add Season'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter season name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="code"
              label="Code"
              rules={[{ required: true, message: 'Please enter season code' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="start_date"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="end_date"
              label="End Date"
              rules={[{ required: true, message: 'Please select end date' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default SeasonsList; 
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import seasonSubjectsService from '../../services/seasonSubjects';
import seasonsService from '../../services/seasons';
import subjectsService from '../../services/subjects';

const SeasonSubjects = () => {
  const [seasonSubjects, setSeasonSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSeasonSubject, setEditingSeasonSubject] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch seasons for dropdown
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await seasonsService.getSeasons(1, 100);
        if (response.status === 'success') {
          setSeasons(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        message.error('Failed to fetch seasons');
      }
    };
    fetchSeasons();
  }, []);

  // Fetch subjects for dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectsService.getSubjects(1, 100);
        if (response.status === 'success') {
          setSubjects(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        message.error('Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, []);

  // Fetch season subjects
  const fetchSeasonSubjects = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = selectedSeason
        ? await seasonSubjectsService.getSeasonSubjectsBySeason(selectedSeason, page, perPage)
        : await seasonSubjectsService.getSeasonSubjects(page, perPage);
      
      if (response.status === 'success') {
        setSeasonSubjects(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.length
        });
      } else {
        throw new Error('Failed to fetch season subjects');
      }
    } catch (error) {
      console.error('Error fetching season subjects:', error);
      message.error(error.message || 'Failed to fetch season subjects');
      setSeasonSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonSubjects(pagination.current, pagination.pageSize);
  }, [selectedSeason]);

  const handleTableChange = (pagination) => {
    fetchSeasonSubjects(pagination.current, pagination.pageSize);
  };

  const showModal = (seasonSubject = null) => {
    setEditingSeasonSubject(seasonSubject);
    if (seasonSubject) {
      form.setFieldsValue({
        ...seasonSubject,
        season_id: seasonSubject.season_id?.toString(),
        subject_id: seasonSubject.subject_id?.toString()
      });
    } else {
      form.resetFields();
      if (selectedSeason) {
        form.setFieldsValue({ season_id: selectedSeason.toString() });
      }
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSeasonSubject(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        season_id: parseInt(values.season_id),
        subject_id: parseInt(values.subject_id),
        created_by: 1,
        updated_by: 1
      };

      if (editingSeasonSubject) {
        await seasonSubjectsService.updateSeasonSubject(editingSeasonSubject.id, formattedValues);
        message.success('Season subject updated successfully');
      } else {
        await seasonSubjectsService.createSeasonSubject(formattedValues);
        message.success('Season subject created successfully');
      }

      handleCancel();
      fetchSeasonSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving season subject:', error);
      message.error(error.message || 'Failed to save season subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await seasonSubjectsService.deleteSeasonSubject(id);
      message.success('Season subject deleted successfully');
      fetchSeasonSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting season subject:', error);
      message.error(error.message || 'Failed to delete season subject');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Season',
      dataIndex: 'season_id',
      key: 'season',
      render: (seasonId) => {
        const season = seasons.find(s => s.id === seasonId);
        return season ? season.name : 'N/A';
      }
    },
    {
      title: 'Subject',
      dataIndex: 'subject_id',
      key: 'subject',
      render: (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : 'N/A';
      }
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
      <Card title="Season Subjects">
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="Filter by Season"
              allowClear
              value={selectedSeason}
              onChange={(value) => {
                setSelectedSeason(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              options={seasons.map(season => ({
                value: season.id,
                label: season.name
              }))}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Season Subject
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={seasonSubjects}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={editingSeasonSubject ? 'Edit Season Subject' : 'Add Season Subject'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="season_id"
              label="Season"
              rules={[{ required: true, message: 'Please select a season' }]}
            >
              <Select
                placeholder="Select a season"
                options={seasons.map(season => ({
                  value: season.id.toString(),
                  label: season.name
                }))}
              />
            </Form.Item>

            <Form.Item
              name="subject_id"
              label="Subject"
              rules={[{ required: true, message: 'Please select a subject' }]}
            >
              <Select
                placeholder="Select a subject"
                options={subjects.map(subject => ({
                  value: subject.id.toString(),
                  label: subject.name
                }))}
              />
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

export default SeasonSubjects; 
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, Select, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import topicsService from '../../services/topics';
import subtopicsService from '../../services/subtopics';
import subjectsService from '../../services/subjects';

const TopicsList = () => {
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [formData, setFormData] = useState({
    topic: null,
    subtopic: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Forms for each tab
  const [topicForm] = Form.useForm();
  const [subtopicForm] = Form.useForm();

  // Fetch subjects for the dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectsService.getSubjects(1, 100); // Get all subjects
        if (response.status === 'success') {
          // Extract the subjects array from the nested data structure
          const subjectsData = response.data?.subjects || [];
          setSubjects(subjectsData);
        } else {
          throw new Error('Failed to fetch subjects');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        message.error('Failed to fetch subjects');
        setSubjects([]); // Set empty array on error
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics
  const fetchTopics = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = selectedSubject
        ? await topicsService.getTopicsBySubject(selectedSubject, page, perPage)
        : await topicsService.getTopics(page, perPage);
      
      // Handle the response data structure correctly
      let topicsData = [];
      if (response.status === 'success') {
        // Extract topics from the nested data structure
        topicsData = response.data?.topics || [];
      } else if (response.data?.topics) {
        // Handle case where topics are directly in data.topics
        topicsData = response.data.topics;
      } else if (Array.isArray(response.data)) {
        // Handle case where data is directly an array
        topicsData = response.data;
      }
      
      setTopics(topicsData);
      setFilteredTopics(topicsData);
      
      // Extract total from pagination object in API response
      const apiTotal = response.data?.pagination?.total || response.total || topicsData.length;
      
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: perPage,
        total: apiTotal
      }));
    } catch (error) {
      console.error('Error fetching topics:', error);
      message.error('Failed to fetch topics');
      setTopics([]); // Set empty array on error
      setFilteredTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics(1, pagination.pageSize); // Reset to first page when subject changes
  }, [selectedSubject]);

  // Filter topics based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredTopics(topics);
    } else {
      const filtered = topics.filter(topic => 
        topic.name.toLowerCase().includes(searchText.toLowerCase()) ||
        topic.code.toLowerCase().includes(searchText.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredTopics(filtered);
    }
  }, [searchText, topics]);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    // Update pagination state with new pageSize
    setPagination({
      ...pagination,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    });
    // Fetch topics with new pagination settings
    fetchTopics(paginationConfig.current, paginationConfig.pageSize);
  };

  const showModal = (topic = null) => {
    setEditingTopic(topic);
    setActiveTab('1');
    if (topic) {
      topicForm.setFieldsValue({
        ...topic,
        subject_id: topic.subject_id?.toString()
      });
    } else {
      topicForm.resetFields();
      subtopicForm.resetFields();
      if (selectedSubject) {
        topicForm.setFieldsValue({ subject_id: selectedSubject.toString() });
      }
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTopic(null);
    topicForm.resetFields();
    subtopicForm.resetFields();
    setActiveTab('1');
    setFormData({
      topic: null,
      subtopic: null
    });
  };

  const handleNext = async () => {
    try {
      const values = await topicForm.validateFields();
      // Store the topic data in formData state
      setFormData(prev => ({
        ...prev,
        topic: values
      }));
      // Move to subtopic tab
      setActiveTab('2');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSubmitAll = async () => {
    try {
      // For edit mode, we only need the topic data
      if (editingTopic) {
        const topicValues = await topicForm.validateFields();
        setLoading(true);
        
        await topicsService.updateTopic(editingTopic.id, {
          ...topicValues,
          subject_id: parseInt(topicValues.subject_id),
          updated_by: 1
        });
        
        message.success('Topic updated successfully');
        handleCancel();
        fetchTopics(pagination.current, pagination.pageSize);
        return;
      }
      
      // For create mode, we need both topic and subtopic
      const subtopicValues = await subtopicForm.validateFields();
      
      // First validate and get the current topic data if not already stored
      let topicData = formData.topic;
      if (!topicData) {
        try {
          // Try to get topic data from the form
          topicData = await topicForm.validateFields();
        } catch (error) {
          // If validation fails, show error message
          message.error('Please fill in topic details first');
          setActiveTab('1'); // Switch back to topic tab
          return;
        }
      }

      setLoading(true);

      const payload = {
        topic: {
          subject_id: parseInt(topicData.subject_id),
          name: topicData.name,
          code: topicData.code,
          description: topicData.description || '',
          is_active: topicData.is_active ?? true,
          created_by: 1,
          updated_by: 1
        },
        subtopic: {
          name: subtopicValues.name,
          code: subtopicValues.code,
          description: subtopicValues.description || '',
          is_active: subtopicValues.is_active ?? true,
          created_by: 1,
          updated_by: 1
        }
      };

      // Send the complete payload to create topic with subtopic
      const response = await topicsService.createTopic(payload);
      
      message.success('Topic and Subtopic created successfully');
      handleCancel();
      fetchTopics(pagination.current, pagination.pageSize);

    } catch (error) {
      console.error('Error saving data:', error);
      message.error(error.message || 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await topicsService.deleteTopic(id);
      message.success('Topic deleted successfully');
      fetchTopics(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting topic:', error);
      message.error(error.message || 'Failed to delete topic');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (_, record) => {
        const subject = subjects.find(s => s.id === record.subject_id);
        return subject ? subject.name : 'N/A';
      },
      sorter: (a, b) => {
        const subjectA = subjects.find(s => s.id === a.subject_id);
        const subjectB = subjects.find(s => s.id === b.subject_id);
        const nameA = subjectA ? subjectA.name : '';
        const nameB = subjectB ? subjectB.name : '';
        return nameA.localeCompare(nameB);
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Switch checked={isActive} disabled />
      ),
      sorter: (a, b) => (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1,
      sortDirections: ['ascend', 'descend'],
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
          <Popconfirm
            title="Delete the topic"
            description="Are you sure you want to delete this topic? This action cannot be undone."
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: '1',
      label: 'Topic Details',
      children: (
        <Form form={topicForm} layout="vertical">
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
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter topic name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter topic code' }]}
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
            name="is_active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" onClick={handleNext} loading={loading}>
              Next
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: '2',
      label: 'Subtopic Details',
      children: (
        <Form form={subtopicForm} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter subtopic name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter subtopic code' }]}
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
            name="is_active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setActiveTab('1')}>
              Previous
            </Button>
            <Button type="primary" onClick={handleSubmitAll} loading={loading}>
              Submit All
            </Button>
          </div>
        </Form>
      ),
    },
  ];

  // Generate the appropriate form items based on whether we're editing or creating
  const getTabItems = () => {
    // If editing, only show the topic tab
    if (editingTopic) {
      return [
        {
          key: '1',
          label: 'Topic Details',
          children: (
            <Form form={topicForm} layout="vertical">
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
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter topic name' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Please enter topic code' }]}
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
                name="is_active"
                label="Active"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
              <div className="flex justify-end">
                <Button type="primary" onClick={handleSubmitAll} loading={loading}>
                  Update Topic
                </Button>
              </div>
            </Form>
          ),
        }
      ];
    }
    
    // If creating, show both tabs
    return items;
  };

  return (
    <div className="p-6">
      <Card title="Topics">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <Space>
              <Select
                style={{ width: 200 }}
                placeholder="Filter by Subject"
                allowClear
                value={selectedSubject}
                onChange={(value) => {
                  setSelectedSubject(value);
                  setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
                }}
                options={subjects.map(subject => ({
                  value: subject.id,
                  label: subject.name
                }))}
              />
              <Input
                placeholder="Search topics by name or code..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearch}
                style={{ width: 300 }}
                allowClear
              />
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Topic
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTopics}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} topics`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />

        <Modal
          title={editingTopic ? 'Edit Topic' : 'Add Topic'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={getTabItems()}
          />
        </Modal>
      </Card>
    </div>
  );
};

export default TopicsList; 
import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import subtopicsService from '../../services/subtopics';
import topicsService from '../../services/topics';
import subjectsService from '../../services/subjects';

const SubtopicsList = () => {
  const [subtopics, setSubtopics] = useState([]);
  const [filteredSubtopics, setFilteredSubtopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const formPopulatedRef = useRef(false);
  const [pendingFormValues, setPendingFormValues] = useState(null);

  // Fetch all subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectsService.getSubjects(1, 100);
        // Extract subjects from the nested data structure
        let subjectsData = [];
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            subjectsData = response.data;
          } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
            subjectsData = response.data.subjects;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            subjectsData = response.data.data;
          }
        }
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        message.error('Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics when subject is selected
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) {
        setTopics([]);
        return;
      }
      try {
        setLoading(true);
        const response = await topicsService.getTopicsBySubject(selectedSubject);
        // Handle the nested data structure
        const topicsData = response.data?.topics || [];
        setTopics(topicsData);
        // Reset topic selection when subject changes
        setSelectedTopic(null);
      } catch (error) {
        console.error('Error fetching topics:', error);
        message.error('Failed to fetch topics');
        // Set empty array on error to prevent the table from breaking
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [selectedSubject]);

  // Fetch subtopics
  const fetchSubtopics = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = selectedTopic
        ? await subtopicsService.getSubtopicsByTopic(selectedTopic, page, perPage)
        : await subtopicsService.getSubtopics(page, perPage);
      
      // Handle the response data structure correctly
      let subtopicsData = [];
      if (response.status === 'success') {
        // Extract subtopics from the nested data structure
        subtopicsData = response.data?.subtopics || [];
      } else if (response.data?.subtopics) {
        // Handle case where subtopics are directly in data.subtopics
        subtopicsData = response.data.subtopics;
      } else if (Array.isArray(response.data)) {
        // Handle case where data is directly an array
        subtopicsData = response.data;
      }
        
        setSubtopics(subtopicsData);
        setFilteredSubtopics(subtopicsData);
        
        // Extract total from pagination object in API response
        const apiTotal = response.data?.pagination?.total || response.total || subtopicsData.length;
        
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: perPage,
          total: apiTotal
        }));
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      message.error('Failed to fetch subtopics');
      setSubtopics([]); // Set empty array on error
      setFilteredSubtopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtopics(pagination.current, pagination.pageSize);
  }, [selectedTopic]);

  // Effect to populate form values after options are loaded
  useEffect(() => {
    const populateForm = async () => {
      if (isModalVisible && editingSubtopic && pendingFormValues && !formPopulatedRef.current) {
        // Check if options are available
        const needsSubjectOptions = pendingFormValues.subject_id;
        const needsTopicOptions = pendingFormValues.topic_id;
        const hasSubjectOptions = needsSubjectOptions ? subjects.length > 0 : true;
        const hasTopicOptions = needsTopicOptions ? topics.length > 0 : true;
        
        if (hasSubjectOptions && hasTopicOptions) {
          // Wait a bit more to ensure React has rendered the Select components
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // All options are loaded, set form values
          form.setFieldsValue(pendingFormValues);
          formPopulatedRef.current = true;
          setPendingFormValues(null);
        }
      }
    };
    
    populateForm();
  }, [isModalVisible, editingSubtopic, pendingFormValues, subjects, topics, form]);

  // Filter subtopics based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredSubtopics(subtopics);
    } else {
      const filtered = subtopics.filter(subtopic => 
        subtopic.name.toLowerCase().includes(searchText.toLowerCase()) ||
        subtopic.code.toLowerCase().includes(searchText.toLowerCase()) ||
        (subtopic.description && subtopic.description.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredSubtopics(filtered);
    }
  }, [searchText, subtopics]);

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
    // Fetch subtopics with new pagination settings
    fetchSubtopics(paginationConfig.current, paginationConfig.pageSize);
  };

  const showModal = async (subtopic = null) => {
    setEditingSubtopic(subtopic);
    formPopulatedRef.current = false;
    setPendingFormValues(null);
    setIsModalVisible(true);
    
    if (subtopic) {
      // Reset form first
      form.resetFields();
      
      const topic = topics.find(t => t.id === subtopic.topic_id);
      if (topic) {
        const subjectId = topic.subject_id;
        setSelectedSubject(subjectId);
        setSelectedTopic(topic.id);
        
        // Fetch topics for the subject
        if (subjectId) {
          try {
            const topicsResponse = await topicsService.getTopicsBySubject(subjectId);
            const subjectTopics = topicsResponse.data?.topics || [];
            setTopics(subjectTopics);
          } catch (err) {
            console.error('Error fetching topics:', err);
          }
        }
        
        // Prepare form values - ensure numeric IDs
        const formValues = {
          code: subtopic.code,
          name: subtopic.name,
          description: subtopic.description || '',
          is_active: subtopic.is_active !== undefined ? subtopic.is_active : true,
          subject_id: subjectId ? Number(subjectId) : undefined,
          topic_id: subtopic.topic_id ? Number(subtopic.topic_id) : undefined
        };
        
        // Wait for state updates and React to render the Select components
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Set form values directly - the options should be loaded by now
        form.setFieldsValue(formValues);
        formPopulatedRef.current = true;
        
        // Also store as pending in case the direct set didn't work
        setPendingFormValues(formValues);
      } else {
        // Fallback: at least populate the basic fields
        form.setFieldsValue({
          code: subtopic.code,
          name: subtopic.name,
          description: subtopic.description || '',
          is_active: subtopic.is_active !== undefined ? subtopic.is_active : true
        });
      }
    } else {
      form.resetFields();
      if (selectedTopic) {
        form.setFieldsValue({ topic_id: selectedTopic });
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSubtopic(null);
    form.resetFields();
    formPopulatedRef.current = false;
    setPendingFormValues(null);
  };

  const handleSubjectChangeInForm = async (value) => {
    // Clear dependent field
    form.setFieldValue('topic_id', undefined);
    
    // Fetch topics for the selected subject
    if (value) {
      try {
        const response = await topicsService.getTopicsBySubject(value);
        const topicsData = response.data?.topics || [];
        setTopics(topicsData);
      } catch (error) {
        console.error('Error fetching topics:', error);
        message.error('Failed to fetch topics');
        setTopics([]);
      }
    } else {
      setTopics([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        topic_id: parseInt(values.topic_id),
        created_by: 1,
        updated_by: 1
      };

      if (editingSubtopic) {
        await subtopicsService.updateSubtopic(editingSubtopic.id, formattedValues);
        message.success('Subtopic updated successfully');
      } else {
        await subtopicsService.createSubtopic(formattedValues);
        message.success('Subtopic created successfully');
      }

      handleCancel();
      fetchSubtopics(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving subtopic:', error);
      message.error(error.message || 'Failed to save subtopic');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await subtopicsService.deleteSubtopic(id);
      message.success('Subtopic deleted successfully');
      fetchSubtopics(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting subtopic:', error);
      message.error(error.message || 'Failed to delete subtopic');
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
      title: 'Topic',
      dataIndex: 'topic_id',
      key: 'topic',
      render: (topicId) => {
        const topic = topics.find(t => t.id === topicId);
        return topic ? topic.name : 'N/A';
      },
      sorter: (a, b) => {
        const topicA = topics.find(t => t.id === a.topic_id);
        const topicB = topics.find(t => t.id === b.topic_id);
        const nameA = topicA ? topicA.name : '';
        const nameB = topicB ? topicB.name : '';
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
      <Card title="Subtopics">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <Space wrap>
              <Select
                style={{ width: 200 }}
                placeholder="Filter by Subject"
                allowClear
                value={selectedSubject}
                onChange={(value) => {
                  setSelectedSubject(value);
                  setSelectedTopic(null);
                }}
                options={subjects.map(subject => ({
                  value: subject.id,
                  label: subject.name
                }))}
              />
              <Select
                style={{ width: 200 }}
                placeholder="Filter by Topic"
                allowClear
                disabled={!selectedSubject}
                value={selectedTopic}
                onChange={setSelectedTopic}
                options={topics.map(topic => ({
                  value: topic.id,
                  label: topic.name
                }))}
              />
              <Input
                placeholder="Search subtopics by name or code..."
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
              Add Subtopic
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredSubtopics}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} subtopics`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />

        <Modal
          title={editingSubtopic ? 'Edit Subtopic' : 'Add Subtopic'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="subject_id"
              label="Subject"
              rules={[{ required: true, message: 'Please select a subject' }]}
            >
              <Select
                placeholder="Select a subject"
                onChange={handleSubjectChangeInForm}
                options={subjects.map(subject => ({
                  value: subject.id,
                  label: subject.name
                }))}
              />
            </Form.Item>

            <Form.Item
              name="topic_id"
              label="Topic"
              rules={[{ required: true, message: 'Please select a topic' }]}
            >
              <Select
                placeholder="Select a topic"
                disabled={!form.getFieldValue('subject_id')}
                options={topics.map(topic => ({
                  value: topic.id,
                  label: topic.name
                }))}
              />
            </Form.Item>

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
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default SubtopicsList; 
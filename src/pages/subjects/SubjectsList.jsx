import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, Select, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import subjectsService from '../../services/subjects';
import topicsService from '../../services/topics';
import subtopicsService from '../../services/subtopics';
import coursesService from '../../services/courses';

const SubjectsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const courseIdFromQuery = queryParams.get('courseId');
  const courseNameFromQuery = queryParams.get('courseName');
  
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdFromQuery ? parseInt(courseIdFromQuery, 10) : null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Forms for each tab
  const [subjectForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [subtopicForm] = Form.useForm();

  const [formData, setFormData] = useState({
    subject: null,
    topic: null,
    subtopic: null
  });

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await coursesService.getCourses();
      setCourses(response || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Failed to fetch courses');
    }
  };

  // Fetch subjects
  const fetchSubjects = async (page = 1, perPage = 10, courseIdParam = selectedCourseId) => {
    setLoading(true);
    try {
      console.log('Fetching subjects with course filter:', courseIdParam);
      const response = await subjectsService.getSubjects(page, perPage, courseIdParam);
      console.log('API response:', response);
      
      // Ensure we have an array of subjects
      let subjectsData = [];
      
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          subjectsData = response.data;
        } 
        // If response.data is an object with a data property that's an array
        else if (response.data.data && Array.isArray(response.data.data)) {
          subjectsData = response.data.data;
        }
        // If response.data is an object with a subjects property that's an array
        else if (response.data.subjects && Array.isArray(response.data.subjects)) {
          subjectsData = response.data.subjects;
        }
      }
      
      // Apply client-side filtering if a course is selected and the API doesn't filter correctly
      if (courseIdParam && subjectsData.some(subject => subject.course_id !== courseIdParam)) {
        console.log('Applying client-side filtering for course_id:', courseIdParam);
        subjectsData = subjectsData.filter(subject => subject.course_id === courseIdParam);
      }
      
      setSubjects(subjectsData);
      setPagination({
        ...pagination,
        current: page,
        total: response.total || subjectsData.length
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      message.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(pagination.current, pagination.pageSize);
    fetchCourses();
    
    // If courseId is provided in the URL, automatically open the add subject modal
    if (courseIdFromQuery) {
      // Wait a bit for courses to load
      setTimeout(() => {
        showModalWithPreselectedCourse(parseInt(courseIdFromQuery, 10));
      }, 500);
      
      // Clear the URL parameters after handling them
      navigate('/subjects', { replace: true });
    }
  }, []);

  const handleTableChange = (pagination) => {
    fetchSubjects(pagination.current, pagination.pageSize);
  };

  const handleCourseFilterChange = (courseId) => {
    console.log('Filter changed to course ID:', courseId);
    setSelectedCourseId(courseId);
    setPagination({
      ...pagination,
      current: 1 // Reset to first page when filter changes
    });
    // Immediately fetch subjects with the new filter
    fetchSubjects(1, pagination.pageSize, courseId);
  };

  const handleClearFilter = () => {
    console.log('Filter cleared');
    setSelectedCourseId(null);
    setPagination({
      ...pagination,
      current: 1 // Reset to first page when filter is cleared
    });
    // Immediately fetch all subjects when filter is cleared
    fetchSubjects(1, pagination.pageSize, null);
  };

  const showModalWithPreselectedCourse = (courseId) => {
    setEditingSubject(null);
    setCurrentSubject(null);
    setCurrentTopic(null);
    setActiveTab('1');
    
    subjectForm.resetFields();
    topicForm.resetFields();
    subtopicForm.resetFields();
    
    // Pre-select the course
    subjectForm.setFieldsValue({
      course_id: courseId,
      is_active: true
    });
    
    setIsModalVisible(true);
    
    // Show a message indicating which course is pre-selected
    if (courseNameFromQuery) {
      message.info(`Adding a new subject for course: ${courseNameFromQuery}`);
    }
  };

  const showModal = (subject = null) => {
    setEditingSubject(subject);
    setCurrentSubject(null);
    setCurrentTopic(null);
    setActiveTab('1');
    
    if (subject) {
      subjectForm.setFieldsValue({
        course_id: subject.course_id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        is_active: subject.is_active
      });
    } else {
      subjectForm.resetFields();
      topicForm.resetFields();
      subtopicForm.resetFields();
    }
    
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSubject(null);
    setCurrentSubject(null);
    setCurrentTopic(null);
    subjectForm.resetFields();
    topicForm.resetFields();
    subtopicForm.resetFields();
    setActiveTab('1');
  };

  const handleNext = async (step) => {
    try {
      let values;
      switch (step) {
        case '1':
          values = await subjectForm.validateFields();
          setFormData(prev => ({
            ...prev,
            subject: values
          }));
          setActiveTab('2');
          break;
        case '2':
          values = await topicForm.validateFields();
          setFormData(prev => ({
            ...prev,
            topic: values
          }));
          setActiveTab('3');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSubmitAll = async () => {
    try {
      // For edit mode, we only need the subject data
      if (editingSubject) {
        const subjectValues = await subjectForm.validateFields();
        setLoading(true);
        
        await subjectsService.updateSubject(editingSubject.id, {
          ...subjectValues,
          updated_by: 1
        });
        
        message.success('Subject updated successfully');
        handleCancel();
        fetchSubjects(pagination.current, pagination.pageSize);
        return;
      }
      
      // For create mode, we need all three forms
      const subjectValues = await subjectForm.validateFields();
      const topicValues = await topicForm.validateFields();
      const subtopicValues = await subtopicForm.validateFields();

      setLoading(true);
      
      // Structure the data according to the API expectations
      const payload = {
        subject: {
          name: subjectValues.name,
          description: subjectValues.description,
          course_id: subjectValues.course_id,
          code: subjectValues.code,
          current_price: subjectValues.current_price,
          is_active: subjectValues.is_active,
          created_by: 1,
          updated_by: 1
        },
        topic: {
          name: topicValues.name,
          description: topicValues.description,
          code: topicValues.code,
          is_active: topicValues.is_active,
          created_by: 1,
          updated_by: 1
        },
        subtopic: {
          name: subtopicValues.name,
          description: subtopicValues.description,
          code: subtopicValues.code,
          is_active: subtopicValues.is_active,
          created_by: 1,
          updated_by: 1
        }
      };

      await subjectsService.createSubject(payload);
      
      message.success('Subject created successfully');
      handleCancel();
      fetchSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await subjectsService.deleteSubject(id);
      message.success('Subject deleted successfully');
      fetchSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting subject:', error);
      message.error(error.message || 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      render: (_, record) => {
        const course = courses.find(c => c.id === record.course_id);
        return course ? course.name : '-';
      },
      sorter: (a, b) => {
        const courseA = courses.find(c => c.id === a.course_id);
        const courseB = courses.find(c => c.id === b.course_id);
        const nameA = courseA ? courseA.name : '';
        const nameB = courseB ? courseB.name : '';
        return nameA.localeCompare(nameB);
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: false,
      width: 300,
      render: (text) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {text}
        </div>
      )
    },
    {
      title: 'Current Price',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (price) => (
        <span>{price ? `TZS ${price.toLocaleString()}` : '-'}</span>
      ),
      sorter: (a, b) => (a.current_price || 0) - (b.current_price || 0),
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
            
          </Button>
          <Popconfirm
            title="Delete the subject"
            description="Are you sure you want to delete this subject? This action cannot be undone."
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
            
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: '1',
      label: 'Subject Details',
      children: (
        <Form form={subjectForm} layout="vertical">
          <Form.Item
            name="course_id"
            label="Course"
            rules={[{ required: true, message: 'Please select a course' }]}
          >
            <Select
              placeholder="Select a course"
              options={courses.map(course => ({
                value: course.id,
                label: course.name
              }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter subject name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter subject code' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="current_price"
            label="Current Price"
            rules={[{ required: true, message: 'Please enter current price' }]}
          >
            <Input type="number" min={0} />
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
            <Button type="primary" onClick={() => handleNext('1')} loading={loading}>
              Next
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: '2',
      label: 'Topic Details',
      children: (
        <Form form={topicForm} layout="vertical">
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
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setActiveTab('1')}>
              Previous
            </Button>
            <Button type="primary" onClick={() => handleNext('2')} loading={loading}>
              Next
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: '3',
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
            <Button onClick={() => setActiveTab('2')}>
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
    // If editing, only show the subject tab
    if (editingSubject) {
      return [
        {
          key: '1',
          label: 'Subject Details',
          children: (
            <Form form={subjectForm} layout="vertical">
              <Form.Item
                name="course_id"
                label="Course"
                rules={[{ required: true, message: 'Please select a course' }]}
              >
                <Select
                  placeholder="Select a course"
                  options={courses.map(course => ({
                    value: course.id,
                    label: course.name
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter subject name' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Please enter subject code' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="current_price"
                label="Current Price"
                rules={[{ required: true, message: 'Please enter current price' }]}
              >
                <Input type="number" min={0} />
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
                  Update Subject
                </Button>
              </div>
            </Form>
          ),
        }
      ];
    }
    
    // If creating, show all three tabs
    return items;
  };

  return (
    <div className="p-6">
      <Card title="Subjects">
        <div className="mb-4 flex justify-between">
          <div className="flex items-center">
            <span className="mr-2">Filter by Course:</span>
            <Select
              placeholder="Select Course"
              allowClear
              style={{ width: 200 }}
              onChange={handleCourseFilterChange}
              onClear={handleClearFilter}
              value={selectedCourseId}
              options={courses.map(course => ({
                value: course.id,
                label: course.name
              }))}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Subject
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={subjects}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={editingSubject ? 'Edit Subject' : 'Add Subject'}
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

export default SubjectsList; 
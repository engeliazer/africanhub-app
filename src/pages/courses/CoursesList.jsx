import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Empty, Popconfirm, Select, Tabs, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import coursesService from '../../services/courses';
import subjectsService from '../../services/subjects';
import topicsService from '../../services/topics';
import subtopicsService from '../../services/subtopics';

const CoursesList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectsModalVisible, setSubjectsModalVisible] = useState(false);
  const [addSubjectModalVisible, setAddSubjectModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  
  // Forms for subject creation
  const [subjectForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [subtopicForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  
  // Form data state
  const [formData, setFormData] = useState({
    subject: null,
    topic: null,
    subtopic: null
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesService.getCourses();
      setCourses(response || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsByCourse = async (courseId) => {
    try {
      setSubjectsLoading(true);
      console.log('Fetching subjects for course ID:', courseId);
      // Clear previous subjects before fetching new ones
      setSubjects([]);
      
      const response = await subjectsService.getSubjects(1, 100, courseId);
      console.log('Subjects API response:', response);
      
      if (response.status === 'success' && response.data?.subjects) {
        // Filter subjects by course_id
        const filteredSubjects = response.data.subjects.filter(subject => subject.course_id === courseId);
        console.log('Filtered subjects:', filteredSubjects);
        setSubjects(filteredSubjects || []);
      } else {
        message.error('Invalid response format from subjects API');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      message.error('Failed to fetch subjects for this course');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleViewSubjects = (course) => {
    // Reset subjects array before showing the modal
    setSubjects([]);
    setSelectedCourse(course);
    fetchSubjectsByCourse(course.id);
    setSubjectsModalVisible(true);
  };

  const handleAddSubject = (course) => {
    setSelectedCourse(course);
    
    // Reset forms and state
    subjectForm.resetFields();
    topicForm.resetFields();
    subtopicForm.resetFields();
    setFormData({
      subject: null,
      topic: null,
      subtopic: null
    });
    
    // Pre-select the course
    subjectForm.setFieldsValue({
      course_id: course.id,
      is_active: true
    });
    
    setAddSubjectModalVisible(true);
    setActiveTab('1');
  };

  const handleCancelAddSubject = () => {
    setAddSubjectModalVisible(false);
    subjectForm.resetFields();
    topicForm.resetFields();
    subtopicForm.resetFields();
    setFormData({
      subject: null,
      topic: null,
      subtopic: null
    });
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

  const handleSubmitSubject = async () => {
    try {
      const subtopicValues = await subtopicForm.validateFields();
      setFormData(prev => ({
        ...prev,
        subtopic: subtopicValues
      }));

      setLoading(true);

      const payload = {
        subject: {
          ...formData.subject,
          created_by: 1,
          updated_by: 1
        },
        topic: {
          ...formData.topic,
          created_by: 1,
          updated_by: 1
        },
        subtopic: {
          ...subtopicValues,
          created_by: 1,
          updated_by: 1
        }
      };

      // Send the complete payload to create subject with topic and subtopic
      await subjectsService.createSubject(payload);
      
      message.success('Subject, Topic, and Subtopic created successfully');
      setAddSubjectModalVisible(false);
      
      // Refresh the subjects list if the subjects modal is open
      if (subjectsModalVisible && selectedCourse) {
        fetchSubjectsByCourse(selectedCourse.id);
      }
      
    } catch (error) {
      console.error('Error creating subject:', error);
      message.error('Failed to create subject: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await coursesService.deleteCourse(id);
      message.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to delete course');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await coursesService.updateCourse(editingId, values);
        message.success('Course updated successfully');
      } else {
        await coursesService.createCourse(values);
        message.success('Course created successfully');
      }
      setModalVisible(false);
      fetchCourses();
    } catch (error) {
      message.error('Failed to save course');
    }
  };

  const subjectsColumns = [
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
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        isActive ? 'Active' : 'Inactive'
      ),
    }
  ];

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            style={{ backgroundColor: '#8c8c8c', borderColor: '#8c8c8c' }}
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewSubjects(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddSubject(record)}
          >
            Add
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete the course"
            description="Are you sure you want to delete this course? This action cannot be undone."
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
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

  // Define tabs for the subject creation modal
  const subjectTabItems = [
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
              disabled // Disable the selector since we're pre-selecting the course
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
            <Switch defaultChecked />
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
            <Switch defaultChecked />
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
            <Switch defaultChecked />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setActiveTab('2')}>
              Previous
            </Button>
            <Button type="primary" onClick={handleSubmitSubject} loading={loading}>
              Submit All
            </Button>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Course
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={courses}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingId ? 'Edit Course' : 'Add Course'}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please input course code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input course name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedCourse ? `Subjects for ${selectedCourse.name}` : 'Course Subjects'}
        open={subjectsModalVisible}
        onCancel={() => setSubjectsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSubjectsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {subjectsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading subjects...</div>
        ) : subjects.length > 0 ? (
          <Table
            columns={subjectsColumns}
            dataSource={subjects}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="No subjects found for this course" />
        )}
      </Modal>

      <Modal
        title={selectedCourse ? `Add Subject for ${selectedCourse.name}` : 'Add Subject'}
        open={addSubjectModalVisible}
        onCancel={handleCancelAddSubject}
        footer={null}
        width={800}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={subjectTabItems}
        />
      </Modal>
    </div>
  );
};

export default CoursesList; 
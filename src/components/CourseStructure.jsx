import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Spin, 
  Empty, 
  Alert, 
  Tag, 
  Badge, 
  Button,
  Space,
  Input,
  Row,
  Col,
  Tooltip,
  message,
  Modal,
  Divider
} from 'antd';
import { 
  BookOutlined, 
  ReadOutlined, 
  FileTextOutlined, 
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  LoginOutlined
} from '@ant-design/icons';
import axios from '../utils/axios';
import { getTokenLocal } from '../services/utils/authorization';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0
  }).format(amount);
};

const CourseStructure = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [currentView, setCurrentView] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCourseStructure();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchText, courses, subjects, selectedCourse, currentView]);

  const fetchCourseStructure = async () => {
    setLoading(true);
    try {
      // Get the authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setLoading(false);
        return;
      }
      
      // Fetch courses and subjects from API
      const [coursesResponse, subjectsResponse] = await Promise.all([
        axios.get('/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        axios.get('/subjects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      console.log('Courses Response:', coursesResponse.data);
      console.log('Subjects Response:', subjectsResponse.data);
      
      if (coursesResponse.data && coursesResponse.data.status === 'success') {
        setCourses(coursesResponse.data.data || []);
      }
      
      if (subjectsResponse.data && subjectsResponse.data.status === 'success') {
        // Handle nested subjects structure
        const subjectsData = subjectsResponse.data.data;
        if (subjectsData && subjectsData.subjects) {
          setSubjects(subjectsData.subjects);
        } else if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData);
        } else {
          setSubjects([]);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching course structure:', err);
      
      if (err.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        setError('Failed to load course structure. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (currentView === 'courses') {
      const filtered = courses.filter(course => 
        course.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else if (currentView === 'subjects' && selectedCourse && Array.isArray(subjects)) {
      // Filter subjects by selected course AND search text
      const filtered = subjects.filter(subject => 
        subject.course_id === selectedCourse.id &&
        (subject.name?.toLowerCase().includes(searchText.toLowerCase()) ||
         subject.code?.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredSubjects(filtered);
    }
  };
  
  const handleViewSubjects = (course) => {
    console.log('Selected course:', course);
    console.log('All subjects:', subjects);
    console.log('Subjects type:', typeof subjects);
    console.log('Is subjects array:', Array.isArray(subjects));
    
    if (Array.isArray(subjects)) {
      const courseSubjects = subjects.filter(subject => subject.course_id === course.id);
      console.log('Subjects for this course:', courseSubjects);
    } else {
      console.log('Subjects is not an array:', subjects);
    }
    
    setSelectedCourse(course);
    setCurrentView('subjects');
    setSearchText('');
  };

  const handleBackToCourses = () => {
    setCurrentView('courses');
    setSelectedCourse(null);
    setSearchText('');
  };
  
  // Define table columns
  const coursesColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: '15%',
      sorter: (a, b) => a.code?.localeCompare(b.code),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
      sorter: (a, b) => a.name?.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '50%',
      render: (text) => (
        <div style={{ 
          wordWrap: 'break-word', 
          whiteSpace: 'normal',
          maxWidth: '400px'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => handleViewSubjects(record)}
        >
          View Subjects
        </Button>
      ),
    },
  ];

  const subjectsColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: '15%',
      sorter: (a, b) => a.code?.localeCompare(b.code),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      sorter: (a, b) => a.name?.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '40%',
      render: (text) => (
        <div style={{ 
          wordWrap: 'break-word', 
          whiteSpace: 'normal',
          maxWidth: '400px'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'current_price',
      key: 'current_price',
      width: '20%',
      render: (price) => (
        <Tag color="green" style={{ fontSize: '12px' }}>
          {formatCurrency(price || 0)}
        </Tag>
      ),
      sorter: (a, b) => (a.current_price || 0) - (b.current_price || 0),
      sortDirections: ['ascend', 'descend'],
    },
  ];

  // Handle login button click
  const handleLogin = () => {
    setAuthModalVisible(false);
    navigate('/login');
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setAuthModalVisible(false);
  };

  return (
    <div style={{ padding: '0 12px' }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Modal
        title="Authentication Required"
        open={authModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="login" 
            type="primary" 
            icon={<LoginOutlined />} 
            onClick={handleLogin}
          >
            Login
          </Button>,
        ]}
      >
        <p>Authentication failed. Please log in again to access this content.</p>
      </Modal>
      
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {currentView === 'courses' ? 'Course Levels' : `${selectedCourse?.name} - Subjects`}
              </Title>
              {currentView === 'subjects' && (
                <Button 
                  type="link" 
                  icon={<BookOutlined />} 
                  onClick={handleBackToCourses}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Back to Course Levels
                </Button>
              )}
            </div>
            <Input
              placeholder={`Search ${currentView}...`}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
        }
        bordered={false}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Loading course structure...</div>
          </div>
        ) : currentView === 'courses' ? (
          filteredCourses.length === 0 ? (
            <Empty description="No course levels found" />
          ) : (
            <Table
              columns={coursesColumns}
              dataSource={filteredCourses}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} course levels`,
              }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          )
        ) : (
          filteredSubjects.length === 0 ? (
            <Empty description="No subjects found for this course" />
          ) : (
            <Table
              columns={subjectsColumns}
              dataSource={filteredSubjects}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} subjects`,
              }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          )
        )}
      </Card>
    </div>
  );
};

export default CourseStructure; 
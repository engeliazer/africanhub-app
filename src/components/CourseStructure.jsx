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
  LoginOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import axios from '../utils/axios';
import { getTokenLocal } from '../services/utils/authorization';
import subjectsService from '../services/subjects';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [currentView, setCurrentView] = useState('subjects');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
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
      
      // Fetch subjects using the subjects service
      const subjectsResponse = await subjectsService.getSubjects(1, 100); // Get all subjects without pagination

      console.log('Subjects Response:', subjectsResponse);
      console.log('Response status:', subjectsResponse?.status);
      console.log('Response data:', subjectsResponse?.data);

      // Courses are no longer used - set empty array
      setCourses([]);

      if (subjectsResponse && subjectsResponse.status === 'success') {
        // Handle new subjects structure
        const subjectsData = subjectsResponse.data;
        console.log('Subjects data:', subjectsData);

        if (subjectsData && subjectsData.subjects && Array.isArray(subjectsData.subjects)) {
          console.log('Found subjects array:', subjectsData.subjects);
          setSubjects(subjectsData.subjects);
        } else if (subjectsData && Array.isArray(subjectsData)) {
          console.log('Subjects data is array:', subjectsData);
          // Fallback for array format
          setSubjects(subjectsData);
        } else {
          console.log('No subjects found in response');
          setSubjects([]);
        }
      } else {
        console.log('Response status not success or response missing');
        setSubjects([]);
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
    } else if (currentView === 'subjects' && Array.isArray(subjects)) {
      // Filter subjects by search text only (no course filtering since courses are not used)
      console.log('Filtering subjects:', subjects.length, 'subjects found');
      const filtered = subjects.filter(subject =>
        subject.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchText.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      console.log('Filtered subjects:', filtered.length, 'subjects after filtering');
      setFilteredSubjects(filtered);
    }
  };
  
  const handleViewSubjects = (course) => {
    console.log('Selected course:', course);
    console.log('All subjects:', subjects);
    // Since courses are no longer used, just show all subjects directly
    console.log('Showing all subjects since courses are no longer used');
    setCurrentView('subjects');
    setSearchText('');
  };

  const handleBackToCourses = () => {
    setCurrentView('courses');
    setSelectedCourse(null);
    setSearchText('');
  };

  const handleToggleSubjectExpansion = (subjectId) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
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
                Available Subjects
              </Title>
            </div>
            <Input
              placeholder="Search subjects..."
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
            <div style={{ marginTop: 16, color: colors.textSecondary }}>Loading course structure...</div>
          </div>
        ) : (
          filteredSubjects.length === 0 ? (
            <Empty description="No subjects found" />
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
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px', background: colors.background, borderRadius: '6px' }}>
                    <Text strong style={{ color: colors.textPrimary, marginBottom: '12px', display: 'block' }}>
                      Topics in {record.name}
                    </Text>
                    {record.topics && record.topics.length > 0 ? (
                      <div style={{ paddingLeft: '20px' }}>
                        {record.topics.map((topic, index) => (
                          <div key={topic.id} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Text style={{ color: colors.primaryAccent, fontSize: '12px', minWidth: '16px' }}>
                              {index + 1}.
                            </Text>
                            <div style={{ flex: 1 }}>
                              <Text style={{ color: colors.textPrimary, fontSize: '14px' }}>
                                <Text style={{ color: colors.textSecondary }}>
                                  {topic.code}
                                </Text>
                                <Text strong style={{ marginLeft: '4px' }}>
                                  : {topic.name}
                                </Text>
                                {topic.description && (
                                  <Text style={{ color: colors.textMuted, marginLeft: '8px' }}>
                                    • {topic.description}
                                  </Text>
                                )}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text style={{ color: colors.textSecondary, fontStyle: 'italic', paddingLeft: '20px' }}>
                        No topics available for this subject
                      </Text>
                    )}
                  </div>
                ),
                expandedRowKeys: Array.from(expandedSubjects),
                onExpand: (expanded, record) => {
                  handleToggleSubjectExpansion(record.id);
                },
                expandIcon: ({ expanded, onExpand, record }) => (
                  <Button
                    type="text"
                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                    onClick={(e) => onExpand(record, e)}
                    size="small"
                    style={{ color: colors.primaryAccent }}
                  />
                ),
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
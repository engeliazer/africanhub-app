import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Select, 
  Form, 
  Alert, 
  Divider, 
  Typography, 
  Tooltip, 
  Badge,
  Modal, 
  message,
  Space,
  Empty,
  Spin,
  Row,
  Col
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined, 
  BookOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

// Import dummy data
import { 
  courses, 
  subjects, 
  seasons, 
  seasonSubjects, 
  currentStudent, 
  studentApplications 
} from '../data/dummyData';

// Import CourseStructure component
import CourseStructure from '../components/CourseStructure';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Application = () => {
  // States
  const [activeKey, setActiveKey] = useState('1');
  const [loading, setLoading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [activeSeasons, setActiveSeasons] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [courseSubjects, setCourseSubjects] = useState([]);
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [formError, setFormError] = useState(null);
  const [nextApplicationId, setNextApplicationId] = useState(1007); // For simulating new applications
  
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // Load data on component mount
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Load student applications with full details
      const applications = studentApplications.map(app => {
        const season = seasons.find(s => s.id === app.seasonId);
        const subject = subjects.find(s => s.id === app.subjectId);
        const course = courses.find(c => c.id === subject.courseId);
        
        return {
          ...app,
          seasonName: season.name,
          seasonDates: `${season.startDate} to ${season.endDate}`,
          subjectName: subject.name,
          courseName: course.name,
          creditHours: subject.creditHours
        };
      });
      
      // Get active seasons
      const active = seasons.filter(season => season.isActive);
      
      setMyApplications(applications);
      setActiveSeasons(active);
      setLoading(false);
      
      // Set first active season as default if exists
      if (active.length > 0) {
        setSelectedSeason(active[0].id);
      }
    }, 800);
  }, []);
  
  // When selected season changes, update available subjects
  useEffect(() => {
    if (selectedSeason) {
      // Get subjects for this season
      const seasonSubjectsData = seasonSubjects.filter(ss => ss.seasonId === selectedSeason);
      
      // Check which subjects student is already enrolled in for this season
      const alreadyAppliedSubjectIds = myApplications
        .filter(app => app.seasonId === selectedSeason)
        .map(app => app.subjectId);
      
      // Filter out subjects already applied for
      const available = seasonSubjectsData
        .filter(ss => !alreadyAppliedSubjectIds.includes(ss.subjectId))
        .map(ss => {
          const subject = subjects.find(s => s.id === ss.subjectId);
          const course = courses.find(c => c.id === subject.courseId);
          const spotsLeft = ss.capacity - ss.enrolled;
          
          return {
            ...ss,
            subjectName: subject.name,
            courseName: course.name,
            courseId: course.id,
            creditHours: subject.creditHours,
            spotsLeft,
            isFull: spotsLeft <= 0
          };
        });
      
      setAvailableSubjects(available);
      setSelectedCourse(null);
      setSelectedSubject(null);
      setCourseSubjects([]);
    }
  }, [selectedSeason, myApplications]);
  
  // When selected course changes, update subject list
  useEffect(() => {
    if (selectedCourse) {
      const filtered = availableSubjects.filter(s => s.courseId === selectedCourse);
      setCourseSubjects(filtered);
      setSelectedSubject(null);
    } else {
      setCourseSubjects([]);
    }
  }, [selectedCourse, availableSubjects]);
  
  // Helper to get status tag
  const getStatusTag = (status) => {
    switch(status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'in-progress':
        return <Tag icon={<ClockCircleOutlined />} color="processing">In Progress</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  
  // Handle apply button click
  const handleApply = () => {
    // Check if a subject is selected
    if (!selectedSubject) {
      setFormError('Please select a subject to apply for');
      return;
    }
    
    // Show confirmation modal
    setApplicationModalVisible(false);
    setConfirmationVisible(true);
  };
  
  // Handle final confirmation
  const handleConfirmApplication = () => {
    setLoading(true);
    
    // Get selected subject data
    const subjectToApply = availableSubjects.find(s => s.subjectId === selectedSubject);
    
    // Create new application
    const newApplication = {
      id: nextApplicationId,
      studentId: currentStudent.id,
      seasonId: selectedSeason,
      subjectId: selectedSubject,
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      grade: null,
      
      // Additional display data
      seasonName: seasons.find(s => s.id === selectedSeason).name,
      seasonDates: `${seasons.find(s => s.id === selectedSeason).startDate} to ${seasons.find(s => s.id === selectedSeason).endDate}`,
      subjectName: subjects.find(s => s.id === selectedSubject).name,
      courseName: courses.find(c => c.id === subjectToApply.courseId).name,
      creditHours: subjects.find(s => s.id === selectedSubject).creditHours
    };
    
    // Simulate API call delay
    setTimeout(() => {
      // Update applications list
      setMyApplications([...myApplications, newApplication]);
      
      // Update next ID counter
      setNextApplicationId(nextApplicationId + 1);
      
      // Reset states
      setSelectedCourse(null);
      setSelectedSubject(null);
      setConfirmationVisible(false);
      setLoading(false);
      
      // Show success message
      message.success('Application submitted successfully!');
      
      // Reset form
      form.resetFields();
      
      // Switch to My Applications tab
      setActiveKey('1');
    }, 1000);
  };
  
  // Application history columns
  const applicationColumns = [
    {
      title: 'Season',
      dataIndex: 'seasonName',
      key: 'seasonName',
      render: (text, record) => (
        <span>
          <CalendarOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
      sorter: (a, b) => a.seasonName.localeCompare(b.seasonName)
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName'
    },
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (text, record) => (
        <span>
          <BookOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      )
    },
    {
      title: 'Credit Hours',
      dataIndex: 'creditHours',
      key: 'creditHours',
      align: 'center'
    },
    {
      title: 'Application Date',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      sorter: (a, b) => new Date(a.applicationDate) - new Date(b.applicationDate)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => getStatusTag(text),
      filters: [
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      align: 'center',
      render: (text) => text ? <Text strong>{text}</Text> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<FileTextOutlined />}
              onClick={() => message.info(`Details for ${record.subjectName} would open here`)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];
  
  // Available subjects columns
  const availableSubjectsColumns = [
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName'
    },
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName'
    },
    {
      title: 'Credit Hours',
      dataIndex: 'creditHours',
      key: 'creditHours',
      align: 'center'
    },
    {
      title: 'Availability',
      key: 'availability',
      render: (_, record) => (
        record.isFull ? 
          <Tag color="error">Full</Tag> : 
          <Tag color="success">{record.spotsLeft} spots left</Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          icon={<PlusOutlined />}
          disabled={record.isFull}
          onClick={() => {
            setSelectedCourse(record.courseId);
            setSelectedSubject(record.subjectId);
            setApplicationModalVisible(true);
          }}
        >
          Apply
        </Button>
      )
    }
  ];
  
  return (
    <div className="application-page" style={{ padding: '24px' }}>
      <Card bordered={false}>
        <Title level={2}>Course Applications</Title>
        <Text type="secondary">
          Apply for courses or view your current and past applications
        </Text>
        
        <Divider />
        
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                My Applications
              </span>
            } 
            key="1"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>Loading your applications...</div>
              </div>
            ) : (
              <>
                {myApplications.length === 0 ? (
                  <Empty 
                    description="You haven't applied for any courses yet" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      onClick={() => setActiveKey('2')}
                    >
                      Apply for Courses
                    </Button>
                  </Empty>
                ) : (
                  <Table 
                    columns={applicationColumns} 
                    dataSource={myApplications} 
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                )}
              </>
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <PlusOutlined />
                Apply for Courses
              </span>
            } 
            key="2"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>Loading available courses...</div>
              </div>
            ) : (
              <div>
                <Alert
                  message="How to Apply"
                  description={
                    <ul>
                      <li>Select an active training season</li>
                      <li>Browse available subjects or filter by course</li>
                      <li>Click "Apply" on the subject you want to enroll in</li>
                      <li>You cannot apply for the same subject twice in one season</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: '20px' }}
                />
                
                {activeSeasons.length === 0 ? (
                  <Empty 
                    description="No active seasons are currently available for applications" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <>
                    <Form form={form} layout="vertical">
                      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <Form.Item 
                          label="Select Season" 
                          style={{ width: '300px' }}
                          required
                        >
                          <Select
                            value={selectedSeason}
                            onChange={setSelectedSeason}
                            placeholder="Select training season"
                            style={{ width: '100%' }}
                          >
                            {activeSeasons.map(season => (
                              <Option key={season.id} value={season.id}>
                                {season.name} ({season.startDate} - {season.endDate})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item 
                          label="Filter by Course (Optional)" 
                          style={{ width: '300px' }}
                        >
                          <Select
                            value={selectedCourse}
                            onChange={setSelectedCourse}
                            placeholder="Filter by course"
                            style={{ width: '100%' }}
                            allowClear
                          >
                            {courses.map(course => (
                              <Option key={course.id} value={course.id}>
                                {course.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                    </Form>
                    
                    {selectedSeason && (
                      <>
                        {availableSubjects.length === 0 ? (
                          <Alert
                            message="No Available Subjects"
                            description="There are no available subjects for this season that you haven't already applied for."
                            type="warning"
                            showIcon
                          />
                        ) : (
                          <Table 
                            columns={availableSubjectsColumns} 
                            dataSource={
                              selectedCourse ? courseSubjects : availableSubjects
                            } 
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                Course Structure
              </span>
            }
            key="3"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Course Hierarchy"
                  description="Below is the hierarchical structure of all courses, subjects, topics, and subtopics offered in our training programs."
                  type="info"
                  showIcon
                  style={{ marginBottom: '20px' }}
                />
              </Col>
              <Col span={24}>
                <CourseStructure />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Application Modal */}
      <Modal
        title="Apply for Subject"
        open={applicationModalVisible}
        onCancel={() => setApplicationModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApplicationModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="apply" 
            type="primary" 
            onClick={handleApply}
          >
            Apply
          </Button>,
        ]}
      >
        {selectedSubject && (
          <div>
            <Alert
              message="You're about to apply for:"
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Season:</strong> {activeSeasons.find(s => s.id === selectedSeason)?.name}</p>
              <p><strong>Course:</strong> {courses.find(c => c.id === selectedCourse)?.name}</p>
              <p><strong>Subject:</strong> {subjects.find(s => s.id === selectedSubject)?.name}</p>
              <p><strong>Credit Hours:</strong> {subjects.find(s => s.id === selectedSubject)?.creditHours}</p>
            </div>
            
            {formError && (
              <Alert
                message="Error"
                description={formError}
                type="error"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}
          </div>
        )}
      </Modal>
      
      {/* Confirmation Modal */}
      <Modal
        title="Confirm Application"
        open={confirmationVisible}
        onCancel={() => setConfirmationVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmationVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleConfirmApplication}
            loading={loading}
          >
            Confirm Application
          </Button>
        ]}
      >
        <div>
          <Alert
            message="Please confirm your application"
            description="Once submitted, you cannot withdraw your application. Please ensure you have selected the correct subject."
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          
          {selectedSubject && (
            <div>
              <p><strong>Season:</strong> {activeSeasons.find(s => s.id === selectedSeason)?.name}</p>
              <p><strong>Course:</strong> {courses.find(c => c.id === selectedCourse)?.name}</p>
              <p><strong>Subject:</strong> {subjects.find(s => s.id === selectedSubject)?.name}</p>
              <p><strong>Credit Hours:</strong> {subjects.find(s => s.id === selectedSubject)?.creditHours}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Application; 
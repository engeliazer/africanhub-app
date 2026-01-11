import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Tag, 
  Card, 
  Divider, 
  Button, 
  Space, 
  Tooltip,
  Empty,
  Spin,
  Tabs,
  Modal,
  Descriptions,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined, 
  BookOutlined,
  FileTextOutlined,
  DollarOutlined,
  CreditCardOutlined,
  PhoneOutlined,
  LoginOutlined,
  QuestionCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import services 
import seasonApplicantsService from '../../services/seasonApplicants';
import subjectsService from '../../services/subjects';
import coursesService from '../../services/courses';
import { getTokenLocal } from '../../services/utils/authorization';
import { AUTH_ERROR_EVENT } from '../../services/axios';
import seasonsService from '../../services/seasons';
import Chat from '../../components/Chat';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0
  }).format(amount);
};

const MyApplications = () => {
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState([]);
  const [completedApplications, setCompletedApplications] = useState([]);
  const [currentApplications, setCurrentApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Custom styles
  const tabsContainerStyle = {
    marginBottom: 24
  };
  
  const tabStyle = {
    fontWeight: 500
  };
  
  const tabTagStyle = {
    marginLeft: 8
  };
  
  // Auth modal state
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('Your session has expired or you are not authenticated. Please log in again to continue.');
  const navigate = useNavigate();
  
  // Handle auth error event
  const handleAuthError = (event) => {
    console.log('Auth error event received:', event.detail?.message);
    
    // Update error message if provided
    if (event.detail?.message) {
      setAuthErrorMessage(event.detail.message);
    }
    
    setAuthModalVisible(true);
    setLoading(false);
  };
  
  // Load data on component mount and set up event listener for auth errors
  useEffect(() => {
    fetchApplications();
    
    // Set up event listener
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
  }, []);
  
  // Fetch applications from the server
  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setLoading(false);
        return;
      }
      
      console.log('Fetching courses...');
      // Fetch courses
      const coursesData = await coursesService.getCourses();
      console.log('Courses data:', coursesData);
      setCourses(coursesData);
      
      console.log('Fetching seasons...');
      // Fetch seasons
      const seasonsResponse = await seasonsService.getSeasons();
      console.log('Seasons response:', seasonsResponse);
      
      if (seasonsResponse.status !== 'success') {
        throw new Error('Failed to fetch seasons');
      }
      
      const seasonsData = seasonsResponse.data || [];
      console.log('Seasons data:', seasonsData);
      
      // Create a mapping of season IDs to their names and dates
      const seasonMap = {};
      seasonsData.forEach(season => {
        console.log('Processing season:', season);
        if (season.id) {
          seasonMap[season.id] = {
            name: season.name || 'Unknown Season',
            startDate: season.start_date,
            endDate: season.end_date,
            code: season.code,
            description: season.description,
            isActive: season.is_active
          };
        } else {
          console.log('Season missing id:', season);
        }
      });
      console.log('Season mapping:', seasonMap);
      
      console.log('Fetching subjects...');
      // First, let's fetch all subjects to have their relationship data
      const subjectsResponse = await subjectsService.getSubjects(1, 100);
      console.log('Subjects response:', subjectsResponse);
      
      // Extract subjects data from the response, handling different possible structures
      let subjectsData = [];
      if (subjectsResponse.data) {
        // If data is an array, use it directly
        if (Array.isArray(subjectsResponse.data)) {
          subjectsData = subjectsResponse.data;
        } 
        // If data is an object with a subjects property that's an array
        else if (subjectsResponse.data.subjects && Array.isArray(subjectsResponse.data.subjects)) {
          subjectsData = subjectsResponse.data.subjects;
        }
        // If data is an object with a data property that's an array
        else if (subjectsResponse.data.data && Array.isArray(subjectsResponse.data.data)) {
          subjectsData = subjectsResponse.data.data;
        }
      }
      
      console.log('Subjects data:', subjectsData);
      
      // Create a mapping of subject IDs to their course IDs and names
      const subjectToCourseMap = {};
      subjectsData.forEach(subject => {
        console.log('Processing subject:', subject);
        if (subject.id && subject.course_id) {
          console.log('Looking for course with ID:', subject.course_id);
          console.log('Available courses:', coursesData);
          const course = coursesData.find(c => c.id === subject.course_id);
          console.log('Found course:', course);
          subjectToCourseMap[subject.id] = {
            courseId: subject.course_id,
            courseName: course?.name || 'Unknown Course'
          };
        } else {
          console.log('Subject missing id or course_id:', subject);
        }
      });
      console.log('Subject to course mapping:', subjectToCourseMap);
      
      console.log('Fetching applications...');
      // Fetch applications for the current authenticated user
      const response = await seasonApplicantsService.getSeasonApplicants();
      console.log('Applications response:', response);
      
      if (response.status === 'success') {
        // Extract applications data from the response, handling different possible structures
        let applicationsData = [];
        
        if (response.data) {
          // If data has an applications property that's an array
          if (response.data.applications && Array.isArray(response.data.applications)) {
            applicationsData = response.data.applications;
          }
          // If data is an array of applications
          else if (Array.isArray(response.data)) {
            applicationsData = response.data;
          }
          // If data has a seasons property that contains applications
          else if (response.data.seasons && Array.isArray(response.data.seasons)) {
            // Flatten applications from all seasons
            response.data.seasons.forEach(season => {
              if (season.applications && Array.isArray(season.applications)) {
                applicationsData = applicationsData.concat(season.applications);
              }
            });
          }
        }
        
        console.log('Applications data:', applicationsData);
        const allApplications = [];
        
        // Process each application
        applicationsData.forEach(app => {
          console.log('Processing application:', app);
          
          // Check if app has details array
          if (app.details && Array.isArray(app.details)) {
            // Process each detail in the application
            app.details.forEach(detail => {
              console.log('Processing detail:', detail);
              console.log('Looking for subject with ID:', detail.subject_id);
              console.log('Available subjects:', subjectsData);
              const subject = subjectsData.find(s => s.id === detail.subject_id);
              console.log('Found subject:', subject);
              
              const courseInfo = subjectToCourseMap[detail.subject_id] || { 
                courseId: null, 
                courseName: 'Unknown Course' 
              };
              console.log('Course info:', courseInfo);
              
              const seasonInfo = seasonMap[detail.season_id] || {
                name: 'Unknown Season',
                startDate: 'N/A',
                endDate: 'N/A'
              };
              console.log('Season info:', seasonInfo);
              
              allApplications.push({
                id: `${app.id}_${detail.id}`, // Create a unique ID
                applicationId: app.id,
                subjectId: detail.subject_id,
                seasonId: detail.season_id,
                status: app.status,
                subjectStatus: detail.status,
                applicationDate: app.created_at,
                paymentStatus: app.payment_status,
                subjectName: subject?.name || 'Unknown Subject',
                courseName: courseInfo.courseName,
                seasonName: seasonInfo.name,
                seasonDates: `${seasonInfo.startDate || 'N/A'} to ${seasonInfo.endDate || 'N/A'}`,
                price: detail.fee || 0,
                transactionId: app.transaction_id || 'Not Available',
                paymentMethod: app.payment_method || 'Not Available',
                paymentDate: app.updated_at,
                mobileNumber: app.user_details?.phone || 'Not Available',
                grade: detail.grade || 'N/A',
                userDetails: app.user_details || {}
              });
            });
          } else if (app.subjects && Array.isArray(app.subjects)) {
            // Handle alternative structure where subjects are directly in the app
            app.subjects.forEach(subject => {
              console.log('Processing subject:', subject);
              
              const courseInfo = subjectToCourseMap[subject.id] || { 
                courseId: null, 
                courseName: 'Unknown Course' 
              };
              
              const seasonInfo = seasonMap[app.season_id] || {
                name: 'Unknown Season',
                startDate: 'N/A',
                endDate: 'N/A'
              };
              
              allApplications.push({
                id: `${app.id}_${subject.id}`,
                applicationId: app.id,
                subjectId: subject.id,
                seasonId: app.season_id,
                status: app.status,
                subjectStatus: subject.status || 'N/A',
                applicationDate: app.created_at,
                paymentStatus: app.payment_status,
                subjectName: subject.name || 'Unknown Subject',
                courseName: courseInfo.courseName,
                seasonName: seasonInfo.name,
                seasonDates: `${seasonInfo.startDate || 'N/A'} to ${seasonInfo.endDate || 'N/A'}`,
                price: subject.fee || 0,
                transactionId: app.transaction_id || 'Not Available',
                paymentMethod: app.payment_method || 'Not Available',
                paymentDate: app.updated_at,
                mobileNumber: app.user_details?.phone || 'Not Available',
                grade: subject.grade || 'N/A',
                userDetails: app.user_details || {}
              });
            });
          } else {
            console.warn('Application missing details or subjects array:', app);
          }
        });
        
        console.log('Processed applications:', allApplications);
        
        // Sort by application date (newest first)
        allApplications.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
        
        // Set all applications to the "All" tab
        setMyApplications(allApplications);
        
        // Current applications include both approved and pending
        const current = allApplications.filter(app => 
          app.status === 'approved' || app.status === 'pending'
        );
        console.log('Current applications:', current);
        setCurrentApplications(current);
        
        // Completed applications should only have status "completed"
        const completed = allApplications.filter(app => app.status === 'completed');
        console.log('Completed applications:', completed);
        setCompletedApplications(completed);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination.page,
          total: response.data.pagination.total
        }));
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        message.error('Failed to load your applications. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to get status tag
  const getStatusTag = (status, paymentStatus) => {
    // Simply display the status as it comes from the server
    return (
      <Tag className={`${status === 'approved' ? 'bg-brandGreen text-brandWhite' : 'bg-brandYellow text-brandWhite'}`}>
        {status}
      </Tag>
    );
  };
  
  // Helper to get payment method icon and text
  const getPaymentMethod = (method) => {
    if (!method || method === 'Not Available') {
      return <Text type="secondary">Not Available</Text>;
    }
    
    switch(method.toLowerCase()) {
      case 'mpesa':
      case 'm-pesa':
        return (
          <span>
            <PhoneOutlined style={{ marginRight: 8, color: '#4CAF50' }} />
            M-Pesa
          </span>
        );
      case 'airtel':
      case 'airtel money':
        return (
          <span>
            <PhoneOutlined style={{ marginRight: 8, color: '#E53935' }} />
            Airtel Money
          </span>
        );
      case 'mixx':
      case 'mixx by yas':
        return (
          <span>
            <PhoneOutlined style={{ marginRight: 8, color: '#FF9800' }} />
            Mixx by Yas
          </span>
        );
      default:
        return (
          <span>
            <CreditCardOutlined style={{ marginRight: 8 }} />
            {method}
          </span>
        );
    }
  };
  
  // View application details
  const viewApplicationDetails = (record) => {
    setSelectedApplication(record);
    setDetailsVisible(true);
  };
  
  // Handle login button click
  const handleLogin = () => {
    setAuthModalVisible(false);
    navigate('/login');
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setAuthModalVisible(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Handle payment button click
  const handleMakePayment = (applicationId) => {
    // Navigate to the payment page with the application ID
    navigate(`/applications/payment/${applicationId}`);
  };
  
  // Handle navigate to study materials
  const handleStudyMaterials = (subjectId) => {
    // Navigate to study materials page with the subject ID
    navigate(`/applications/study/${subjectId}`);
  };

  // Handle cancel application
  const handleCancelApplication = async (applicationId, subjectName) => {
    try {
      // Show confirmation modal
      Modal.confirm({
        title: 'Cancel Application',
        content: `Are you sure you want to cancel your application for "${subjectName}"? This action cannot be undone.`,
        okText: 'Yes, Cancel',
        cancelText: 'No, Keep Application',
        okType: 'danger',
        onOk: async () => {
          try {
            setLoading(true);
            await seasonApplicantsService.cancelApplication(applicationId);
            message.success('Application cancelled successfully');
            // Refresh the applications list
            await fetchApplications();
          } catch (error) {
            console.error('Error cancelling application:', error);
            message.error('Failed to cancel application. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error showing cancel confirmation:', error);
    }
  };
  
  // Application history columns
  const applicationColumns = [
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {record.seasonName}
          </div>
        </div>
      )
    },
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (text, record) => (
        <div>
          <div>
            <BookOutlined style={{ marginRight: 8 }} />
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            {formatCurrency(record.price)}
          </div>
        </div>
      )
    },
    {
      title: 'Application Date',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.applicationDate) - new Date(b.applicationDate)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <div>
            <Tag className={`${status === 'approved' ? 'bg-brandWhite text-brandYellow' : 'bg-brandYellow text-brandWhite'}`}>
              {status === 'approved' ? <CheckCircleOutlined style={{ marginRight: 4 }} /> : <ClockCircleOutlined style={{ marginRight: 4 }} />}
              {status}
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {record.paymentStatus === 'pending_payment' ? (
              <Tag color="warning" style={{ fontSize: '12px' }}>
                <CreditCardOutlined style={{ marginRight: 4 }} />
                Payment Required
              </Tag>
            ) : record.paymentStatus === 'paid' ? (
              <Tag color="success" style={{ fontSize: '12px' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Paid
              </Tag>
            ) : (
              <Tag color="default" style={{ fontSize: '12px' }}>
                <QuestionCircleOutlined style={{ marginRight: 4 }} />
                {record.paymentStatus || 'N/A'}
              </Tag>
            )}
          </div>
        </div>
      ),
      filters: [
        { text: 'approved', value: 'approved' },
        { text: 'pending', value: 'pending' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 120
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
              onClick={() => viewApplicationDetails(record)}
            />
          </Tooltip>
          {record.status === 'approved' && record.paymentStatus === 'paid' && (
            <Tooltip title="Access Study Materials">
              <Button
                type="primary"
                size="small"
                icon={<BookOutlined />}
                onClick={() => handleStudyMaterials(record.subjectId)}
              >
                Study
              </Button>
            </Tooltip>
          )}
          {record.paymentStatus === 'pending_payment' && (
            <Tooltip title="Make Payment">
              <Button
                type="primary"
                size="small"
                onClick={() => handleMakePayment(record.applicationId)}
              >
                Pay Now
              </Button>
            </Tooltip>
          )}
          
        </Space>
      )
    }
  ];
  
  // Modal content
  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;
    
    return (
      <div>
        <Descriptions title="Application Summary" bordered column={2}>
          <Descriptions.Item label="Application ID">
            <Text strong>{selectedApplication.applicationId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Actions">
            <Space>
              {selectedApplication.status === 'approved' && selectedApplication.paymentStatus === 'paid' ? (
                <Tooltip title="Access study materials for this subject">
                  <Button 
                    type="primary" 
                    icon={<BookOutlined />}
                    onClick={() => handleStudyMaterials(selectedApplication.subjectId)}
                    style={{ padding: '0 15px' }}
                  >
                    Study
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title={selectedApplication.paymentStatus !== 'paid' ? 
                  "Complete payment to access study materials" : 
                  selectedApplication.status !== 'approved' ?
                  "Only approved applications can access study materials" :
                  "This application does not have study materials available"}>
                  <Button 
                    disabled
                    icon={<BookOutlined />}
                    style={{ padding: '0 15px' }}
                  >
                    Study
                  </Button>
                </Tooltip>
              )}
              {selectedApplication.status === 'pending' && (
                <Tooltip title="Cancel this application">
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleCancelApplication(selectedApplication.applicationId, selectedApplication.subjectName)}
                    style={{ padding: '0 15px' }}
                  >
                    Cancel Application
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={2}>
            <Space size="middle">
              <Tag className={`${selectedApplication.status === 'approved' ? 'bg-brandGreen text-brandWhite' : 'bg-brandYellow text-brandWhite'}`} style={{ padding: '4px 8px', fontSize: '14px' }}>
                {selectedApplication.status}
              </Tag>
              {selectedApplication.paymentStatus === 'pending_payment' ? (
                <Tag color="warning" style={{ padding: '4px 8px', fontSize: '14px' }}>Payment Required</Tag>
              ) : selectedApplication.paymentStatus === 'paid' ? (
                <Tag color="success" style={{ padding: '4px 8px', fontSize: '14px' }}>Paid</Tag>
              ) : (
                <Tag color="default" style={{ padding: '4px 8px', fontSize: '14px' }}>{selectedApplication.paymentStatus || 'N/A'}</Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Application Date">
            {formatDate(selectedApplication.applicationDate)}
          </Descriptions.Item>
          {selectedApplication.paymentDate && selectedApplication.paymentStatus === 'paid' && (
            <Descriptions.Item label="Payment Date">
              {formatDate(selectedApplication.paymentDate)}
            </Descriptions.Item>
          )}
        </Descriptions>
        
        <Divider />
        
        <Descriptions title="Course Information" bordered column={2}>
          <Descriptions.Item label="Season" span={2}>
            <Text strong>{selectedApplication.seasonName}</Text>
            <div>
              <Text type="secondary">{selectedApplication.seasonDates}</Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Course">
            {selectedApplication.courseName}
          </Descriptions.Item>
          <Descriptions.Item label="Subject">
            {selectedApplication.subjectName}
          </Descriptions.Item>
          <Descriptions.Item label="Price">
            <Text strong style={{ color: '#1890ff' }}>{formatCurrency(selectedApplication.price)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Subject Status">
            <Tag className={`${selectedApplication.subjectStatus === 'approved' ? 'bg-brandGreen text-brandWhite' : 'bg-brandYellow text-brandWhite'}`}>
              {selectedApplication.subjectStatus}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Descriptions title="Applicant Information" bordered column={2}>
          <Descriptions.Item label="Name" span={2}>
            <Text strong>
              {selectedApplication.userDetails?.first_name || ''} {selectedApplication.userDetails?.last_name || ''}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {selectedApplication.userDetails?.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {selectedApplication.userDetails?.phone || selectedApplication.mobileNumber || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Descriptions title="Payment Information" bordered column={2}>
          <Descriptions.Item label="Payment Status" span={2}>
            {selectedApplication.paymentStatus === 'pending_payment' ? (
              <>
                <Tag color="warning" style={{ padding: '4px 8px', fontSize: '14px' }}>Payment Required</Tag>
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">
                    This application requires payment to proceed. Please complete the payment process to finalize your application.
                  </Text>
                  <div style={{ marginTop: 16 }}>
                    <Button 
                      type="primary" 
                      onClick={() => handleMakePayment(selectedApplication.applicationId)}
                      size="middle"
                      style={{ paddingLeft: 20, paddingRight: 20 }}
                    >
                      Make Payment
                    </Button>
                  </div>
                </div>
              </>
            ) : selectedApplication.paymentStatus === 'paid' ? (
              <>
                <Tag color="success" style={{ padding: '4px 8px', fontSize: '14px' }}>Paid</Tag>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Payment has been successfully processed for this application.
                  </Text>
                </div>
              </>
            ) : (
              <Tag color="default">{selectedApplication.paymentStatus || 'N/A'}</Tag>
            )}
          </Descriptions.Item>
          {selectedApplication.transactionId && selectedApplication.transactionId !== 'Not Available' && (
            <Descriptions.Item label="Transaction ID" span={2}>
              <Text copyable>{selectedApplication.transactionId}</Text>
            </Descriptions.Item>
          )}
          {selectedApplication.paymentMethod && selectedApplication.paymentMethod !== 'Not Available' && (
            <Descriptions.Item label="Payment Method">
              {getPaymentMethod(selectedApplication.paymentMethod)}
            </Descriptions.Item>
          )}
          {selectedApplication.paymentStatus === 'paid' && (
            <Descriptions.Item label="Amount Paid">
              <Text strong style={{ color: '#52c41a' }}>{formatCurrency(selectedApplication.price)}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
        
        {(selectedApplication.status === 'completed' || 
         selectedApplication.grade && selectedApplication.grade !== 'N/A' || 
         selectedApplication.certificate_url) && (
          <>
            <Divider />
            <Descriptions title="Academic Information" bordered>
              {selectedApplication.grade && selectedApplication.grade !== 'N/A' && (
                <Descriptions.Item label="Grade">
                  <Text strong style={{ fontSize: '16px' }}>{selectedApplication.grade}</Text>
                </Descriptions.Item>
              )}
              {selectedApplication.certificate_url && (
                <Descriptions.Item label="Certificate">
                  <Button type="primary" size="middle" href={selectedApplication.certificate_url} target="_blank" icon={<FileTextOutlined />}>
                    Download Certificate
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </div>
    );
  };
  
  // Handle table change
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };
  
  return (
    <div className="my-applications-page" style={{ padding: '24px' }}>
      <Typography>
        <Title level={2}>My Applications</Title>
        <Paragraph>
          View your current and past course applications, track your progress and grades.
        </Paragraph>
      </Typography>
      
      <Divider />
      
      {/* Authentication Modal */}
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
        <p>{authErrorMessage}</p>
      </Modal>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px' }}>Loading your applications...</div>
        </div>
      ) : (
        <>
          {myApplications.length === 0 ? (
            <Card>
              <Empty 
                description="You haven't applied for any courses yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  onClick={() => navigate('/applications/apply')}
                >
                  Apply for Courses
                </Button>
              </Empty>
            </Card>
          ) : (
            <Card>
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                type="card"
                className="custom-tabs"
                style={tabsContainerStyle}
              >
                <TabPane 
                  tab={
                    <span style={tabStyle}>
                      Current Applications <Tag color="processing" style={tabTagStyle}>{currentApplications.length}</Tag>
                    </span>
                  } 
                  key="current"
                >
                  <div style={{ marginBottom: 16, backgroundColor: '#e6f7ff', padding: 12, borderRadius: 4 }}>
                    <Text type="secondary">
                      Showing applications with status "approved" or "pending".
                    </Text>
                  </div>
                  <Table 
                    columns={applicationColumns} 
                    dataSource={currentApplications} 
                    rowKey="id"
                    pagination={pagination}
                    onChange={handleTableChange}
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span style={tabStyle}>
                      Completed Applications <Tag color="success" style={tabTagStyle}>{completedApplications.length}</Tag>
                    </span>
                  } 
                  key="completed"
                >
                  <div style={{ marginBottom: 16, backgroundColor: '#f6ffed', padding: 12, borderRadius: 4 }}>
                    <Text type="secondary">
                      Showing only applications with status "completed".
                    </Text>
                    {completedApplications.length === 0 && (
                      <div style={{ marginTop: 12, padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
                        <Text type="secondary">
                          No completed applications found. Applications appear here when their status is set to "completed".
                        </Text>
                      </div>
                    )}
                  </div>
                  <Table 
                    columns={applicationColumns} 
                    dataSource={completedApplications} 
                    rowKey="id"
                    pagination={pagination}
                    onChange={handleTableChange}
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span style={tabStyle}>
                      All Applications <Tag style={tabTagStyle}>{myApplications.length}</Tag>
                    </span>
                  } 
                  key="all"
                >
                  <div style={{ marginBottom: 16, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                    <Text type="secondary">
                      Showing all applications regardless of status.
                    </Text>
                  </div>
                  <Table 
                    columns={applicationColumns} 
                    dataSource={myApplications} 
                    rowKey="id"
                    pagination={pagination}
                    onChange={handleTableChange}
                  />
                </TabPane>
              </Tabs>
            </Card>
          )}
        </>
      )}
      
      {/* Application Details Modal */}
      <Modal
        title={
          selectedApplication ? (
            <div className="flex items-center">
              <FileTextOutlined className="text-[18px] mr-2.5 text-brandYellow" />
              <span>Application Details - {selectedApplication.subjectName}</span>
              <Tag className={`ml-3 ${selectedApplication.status === 'approved' ? 'bg-brandYellow text-brandWhite' : 'bg-brandGreen text-brandWhite'}`}>
                {selectedApplication.status}
              </Tag>
            </div>
          ) : 'Application Details'
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto', padding: '24px' }}
        centered
      >
        {renderApplicationDetails()}
      </Modal>

      {/* Chat Component */}
      <Chat />
    </div>
  );
};

export default MyApplications; 
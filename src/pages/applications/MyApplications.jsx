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
  message,
  Row,
  Col
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
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// Import services 
import seasonApplicantsService from '../../services/seasonApplicants';
import subjectsService from '../../services/subjects';
import { getTokenLocal } from '../../services/utils/authorization';
import { AUTH_ERROR_EVENT } from '../../services/axios';
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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState([]);
  const [completedApplications, setCompletedApplications] = useState([]);
  const [currentApplications, setCurrentApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
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
                seasonName: 'N/A', // No seasons used
                seasonDates: 'N/A', // No seasons used
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
                seasonName: 'N/A', // No seasons used
                seasonDates: 'N/A', // No seasons used
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
      title: 'Application',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (text, record) => (
        <div>
          <div>
            <BookOutlined style={{ marginRight: 8 }} />
            {text}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            Applied: {new Date(record.applicationDate).toLocaleDateString()}
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
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
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
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: 4 }}>
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
      <div style={{ padding: '16px 0' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <Text strong style={{ fontSize: '18px', color: colors.textPrimary }}>
                {selectedApplication.subjectName}
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Application #{selectedApplication.applicationId}
                </Text>
              </div>
            </div>
            <Space>
              {selectedApplication.status === 'approved' && selectedApplication.paymentStatus === 'paid' ? (
                <Button
                  type="primary"
                  icon={<BookOutlined />}
                  onClick={() => handleStudyMaterials(selectedApplication.subjectId)}
                >
                  Study
                </Button>
              ) : null}
              {selectedApplication.status === 'pending' && (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleCancelApplication(selectedApplication.applicationId, selectedApplication.subjectName)}
                >
                  Cancel
                </Button>
              )}
            </Space>
          </div>

          {/* Status and Payment */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <Tag
              className={`${selectedApplication.status === 'approved' ? 'bg-brandGreen text-brandWhite' : 'bg-brandYellow text-brandWhite'}`}
              style={{ padding: '4px 12px', fontSize: '14px' }}
            >
              {selectedApplication.status}
            </Tag>
            {selectedApplication.paymentStatus === 'pending_payment' ? (
              <Tag color="warning" style={{ padding: '4px 12px', fontSize: '14px' }}>Payment Required</Tag>
            ) : selectedApplication.paymentStatus === 'paid' ? (
              <Tag color="success" style={{ padding: '4px 12px', fontSize: '14px' }}>Paid</Tag>
            ) : (
              <Tag color="default" style={{ padding: '4px 12px', fontSize: '14px' }}>{selectedApplication.paymentStatus || 'N/A'}</Tag>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <div style={{ padding: '16px', background: colors.card, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <Text strong style={{ color: colors.textPrimary, marginBottom: '8px', display: 'block' }}>
                Application Details
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Applied On</Text>
                  <div><Text strong>{formatDate(selectedApplication.applicationDate)}</Text></div>
                </div>
                {selectedApplication.paymentDate && selectedApplication.paymentStatus === 'paid' && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Paid On</Text>
                    <div><Text strong>{formatDate(selectedApplication.paymentDate)}</Text></div>
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col span={12}>
            <div style={{ padding: '16px', background: colors.card, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <Text strong style={{ color: colors.textPrimary, marginBottom: '8px', display: 'block' }}>
                Course Details
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Price</Text>
                  <div><Text strong style={{ color: colors.primaryAccent, fontSize: '16px' }}>{formatCurrency(selectedApplication.price)}</Text></div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Subject Status</Text>
                  <div>
                    <Tag className={`${selectedApplication.subjectStatus === 'approved' ? 'bg-brandGreen text-brandWhite' : 'bg-brandYellow text-brandWhite'}`}>
                      {selectedApplication.subjectStatus}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Payment Section - only show if payment is required */}
        {selectedApplication.paymentStatus === 'pending_payment' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: colors.card,
            borderRadius: '8px',
            border: `2px solid ${colors.primaryAccent}`,
            textAlign: 'center'
          }}>
            <Text strong style={{ color: colors.textPrimary, marginBottom: '8px', display: 'block' }}>
              Payment Required
            </Text>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
              Complete your payment to finalize this application and access study materials.
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={() => handleMakePayment(selectedApplication.applicationId)}
              style={{ background: colors.primaryAccent, borderColor: colors.primaryAccent }}
            >
              Make Payment
            </Button>
          </div>
        )}

        {selectedApplication.paymentStatus === 'paid' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(82, 196, 26, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(82, 196, 26, 0.3)',
            textAlign: 'center'
          }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }} />
            <Text strong style={{ color: '#52c41a' }}>
              Payment completed successfully
            </Text>
          </div>
        )}

        {/* Academic Information - only show if completed or has grade/certificate */}
        {(selectedApplication.status === 'completed' ||
         (selectedApplication.grade && selectedApplication.grade !== 'N/A') ||
         selectedApplication.certificate_url) && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: colors.card,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <Text strong style={{ color: colors.textPrimary, marginBottom: '12px', display: 'block' }}>
              Academic Information
            </Text>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {selectedApplication.grade && selectedApplication.grade !== 'N/A' && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Grade</Text>
                  <div><Text strong style={{ fontSize: '16px' }}>{selectedApplication.grade}</Text></div>
                </div>
              )}
              {selectedApplication.certificate_url && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  href={selectedApplication.certificate_url}
                  target="_blank"
                >
                  Download Certificate
                </Button>
              )}
            </div>
          </div>
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
            <Card
              style={{
                boxShadow: `0 4px 12px rgba(46, 38, 18, 0.25)`
              }}
            >
              <Empty 
                description={<Text style={{ color: colors.textSecondary }}>You haven't applied for any courses yet</Text>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  onClick={() => navigate('/applications/apply')}
                  style={{
                    background: colors.primaryAccent,
                    borderColor: colors.primaryAccent,
                    color: colors.background
                  }}
                >
                  Apply for Courses
                </Button>
              </Empty>
            </Card>
          ) : (
            <Card
              style={{
                boxShadow: `0 4px 12px rgba(227, 184, 87, 0.25)`
              }}
            >
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
                  <div style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <InfoCircleOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '18px' }} />
                    <Text style={{ color: colors.textPrimary }}>
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
                  <div style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <CheckCircleOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '18px' }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary }}>
                        Showing only applications with status "completed".
                      </Text>
                      {completedApplications.length === 0 && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px',
                          background: colors.background,
                          border: `1px dashed ${colors.border}`,
                          borderRadius: '8px'
                        }}>
                          <Text style={{ color: colors.textSecondary }}>
                            No completed applications found. Applications appear here when their status is set to "completed".
                          </Text>
                        </div>
                      )}
                    </div>
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
                  <div style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <InfoCircleOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '18px' }} />
                    <Text style={{ color: colors.textPrimary }}>
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
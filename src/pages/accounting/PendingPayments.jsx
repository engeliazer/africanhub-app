import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Space, 
  Tooltip, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  message,
  Badge,
  Divider,
  Row,
  Col,
  Alert,
  Collapse
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { getTokenLocal } from '../../services/utils/authorization';
import { formatCurrency, formatDate } from '../../utils/formatters';
import accountingService from '../../services/accounting';
import PaymentDetailsModal from '../../components/accounting/PaymentDetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { selectCurrentRole } from '../../state/rbacSlice';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Fetch pending payments for the table
const fetchPendingPayments = async (filters = {}) => {
  try {
    return await accountingService.getPendingPayments(filters);
  } catch (error) {
    console.error('Failed to fetch pending payments:', error);
    throw error;
  }
};

// Fetch detailed payment information for the modal
const fetchPaymentDetails = async (paymentId) => {
  try {
    return await accountingService.getPaymentDetails(paymentId);
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    throw error;
  }
};

// Verify a payment
const verifyPayment = async (paymentId) => {
  try {
    return await accountingService.verifyPayment(paymentId);
  } catch (error) {
    console.error('Failed to verify payment:', error);
    throw error;
  }
};

// Reject a payment
const rejectPayment = async (paymentId, reason) => {
  try {
    return await accountingService.rejectPayment(paymentId, reason);
  } catch (error) {
    console.error('Failed to reject payment:', error);
    throw error;
  }
};

const PendingPayments = () => {
  const [loading, setLoading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reconciliationStatus, setReconciliationStatus] = useState('pending');
  const [reconciliationData, setReconciliationData] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [form] = Form.useForm();
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const { user } = useAuth();
  const [reconciliationId, setReconciliationId] = useState(null);
  const currentRole = useSelector(selectCurrentRole);

  // Add debug logs for role
  useEffect(() => {
    console.log('Current role from Redux:', currentRole);
  }, [currentRole]);

  // Fetch pending payments on component mount
  useEffect(() => {
    fetchPayments();
  }, []);

  // Fetch payments from API
  const fetchPayments = async () => {
    setLoading(true);
    try {
      // Pass the current role to the getPendingPayments method
      const response = await accountingService.getPendingPayments({}, currentRole);
      // Extract the data array from the response
      const payments = response.data || [];
      setPendingPayments(payments);
      setFilteredPayments(payments);
    } catch (error) {
      // Handle error (show notification, etc.)
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let result = [...pendingPayments];
    
    // Filter by search text
    if (searchText) {
      result = result.filter(payment => 
        `${payment.student?.first_name || ''} ${payment.student?.last_name || ''}`.toLowerCase().includes(searchText.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        payment.application?.subjects?.some(subject => 
          subject?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          subject?.course?.name?.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
    // Filter by course
    if (selectedCourse) {
      result = result.filter(payment => 
        payment.application?.subjects?.some(subject => subject?.course?.id === selectedCourse)
      );
    }
    
    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();
      
      result = result.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).getTime();
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }
    
    setFilteredPayments(result);
  }, [pendingPayments, searchText, selectedCourse, dateRange]);

  // Get unique courses for filter dropdown
  const getUniqueCourses = () => {
    const courses = new Map();
    pendingPayments.forEach(payment => {
      // Add null checks for application and subjects
      if (payment?.application?.subjects) {
        payment.application.subjects.forEach(subject => {
          if (subject?.course) {
            const course = subject.course;
            if (!courses.has(course.id)) {
              courses.set(course.id, course);
            }
          }
        });
      }
    });
    return Array.from(courses.values());
  };

  // Handle view payment details
  const handleViewDetails = async (payment) => {
    // Set loading state and show modal
    setDetailsLoading(true);
    setDetailsModalVisible(true);
    
    try {
      // Use id instead of transaction_id
      const response = await accountingService.getPaymentDetails(payment.id);
      
      // Check if the response has the expected structure
      if (response && response.data) {
        // Update the selected payment with the detailed information
        setSelectedPayment(response.data);
        
        // Set reconciliation data if available
        if (response.data.reconciliation) {
          // Use the exact status from the API response
          setReconciliationData({
            status: response.data.reconciliation.status,
            payerReference: response.data.reconciliation.payer_reference,
            bankReference: response.data.reconciliation.bank_reference
          });
          // Store the reconciliation ID for later use
          setReconciliationId(response.data.reconciliation.id);
        } else {
          // If no reconciliation data is available, set default values
          setReconciliationData({
            status: 'pending',
            payerReference: response.data.transaction_id,
            bankReference: null
          });
          setReconciliationId(null);
        }
      } else {
        message.error('Invalid response format from server');
        setDetailsModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      message.error('Failed to fetch payment details');
      setDetailsModalVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle verify payment
  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;
    
    setLoading(true);
    try {
      await verifyPayment(selectedPayment.id);
      // Refresh payments list
      fetchPayments();
      setViewModalVisible(false);
    } catch (error) {
      console.error('Failed to verify payment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle review payment based on user role and reconciliation status
  const handleReviewPayment = async () => {
    if (!reconciliationId || !reconciliationData) {
      message.error('Reconciliation information is missing');
      return;
    }

    setLoading(true);
    try {
      // Determine which API to call based on user role
      if (currentRole === 'ACCOUNTANT') {
        // ACCOUNTANT can only verify matched payments
        if (reconciliationData.status !== 'matched') {
          message.error('Can only verify payments with matched reconciliation status');
          return;
        }
        const response = await accountingService.verifyReconciliation(reconciliationId);
        if (response.status === 'success') {
          message.success('Payment verified successfully');
          
          // Reload the payment details to see the updated status
          const updatedDetails = await accountingService.getPaymentDetails(selectedPayment.id);
          if (updatedDetails?.data) {
            setSelectedPayment(updatedDetails.data);
            if (updatedDetails.data.reconciliation) {
              setReconciliationData(updatedDetails.data.reconciliation);
            }
          }
        }
      } else if (currentRole === 'MANAGER') {
        // MANAGER can only approve verified payments
        if (reconciliationData.status !== 'verified') {
          message.error('Can only approve payments that have been verified');
          return;
        }
        const response = await accountingService.approveReconciliation(reconciliationId);
        if (response.status === 'success') {
          message.success('Payment approved successfully');
          
          // Reload the payment details to see the updated status
          const updatedDetails = await accountingService.getPaymentDetails(selectedPayment.id);
          if (updatedDetails?.data) {
            setSelectedPayment(updatedDetails.data);
            if (updatedDetails.data.reconciliation) {
              setReconciliationData(updatedDetails.data.reconciliation);
            }
          }
        }
      }
      
      // Refresh the payments list
      fetchPayments();
    } catch (error) {
      console.error('Failed to review payment:', error);
      message.error('Failed to review payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject payment
  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectReason) return;
    
    setLoading(true);
    try {
      // Use reconciliation ID if available, otherwise fall back to payment ID
      const idToUse = reconciliationId || selectedPayment.id;
      await accountingService.rejectReconciliation(idToUse, rejectReason);
      // Refresh payments list
      fetchPayments();
      setRejectModalVisible(false);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject payment:', error);
      message.error('Failed to reject payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCourse(null);
    setDateRange(null);
    form.resetFields();
    setFilteredPayments(pendingPayments);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    form.submit();
  };

  // Table columns
  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      sorter: (a, b) => a.transaction_id.localeCompare(b.transaction_id),
      render: (text) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Student',
      dataIndex: 'payment_details',
      key: 'student',
      render: (paymentDetails) => {
        // Get the first payment detail (assuming one student per payment)
        const detail = paymentDetails && paymentDetails.length > 0 ? paymentDetails[0] : null;
        const student = detail?.student || {};
        
        return (
          <div>
            <div>{student.name || 'Unknown Student'}</div>
            <div className="text-gray-500 text-sm">{student.email || 'No email available'}</div>
          </div>
        );
      },
      sorter: (a, b) => {
        const studentA = a.payment_details && a.payment_details.length > 0 ? a.payment_details[0].student : {};
        const studentB = b.payment_details && b.payment_details.length > 0 ? b.payment_details[0].student : {};
        return (studentA.name || '').localeCompare(studentB.name || '');
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `TZS ${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: 'Payment Details',
      key: 'payment_details',
      render: (_, record) => (
        <div>
          <div>{record.payment_method}</div>
          <div className="text-gray-500 text-sm">{new Date(record.payment_date).toLocaleDateString()}</div>
        </div>
      ),
      filters: [
        { text: 'Bank', value: 'Bank' },
        { text: 'Mixx by Yas', value: 'Mixx by Yas' },
      ],
      onFilter: (value, record) => record.payment_method === value,
      sorter: (a, b) => new Date(a.payment_date) - new Date(b.payment_date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <style jsx>{`
        .info-row {
          margin-bottom: 4px;
          line-height: 1.4;
        }
      `}</style>
      
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Pending Payments</Title>
          <div className="flex space-x-2">
            
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchPayments}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Search by student name, payment ID, course, or subject"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              setSelectedCourse(values.course);
              setDateRange(values.dateRange);
            }}
            className="mb-4"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="dateRange" label="Payment Date">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item name="course" label="Course">
                  <Select 
                    placeholder="Select course" 
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {getUniqueCourses().map(course => (
                      <Option key={course.id} value={course.id}>{course.name} ({course.code})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item className="mb-0 mt-7" >
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
                      Apply Filters
                    </Button>
                    <Button onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: false }}
        />
      </Card>
      
      {/* Payment Details Modal */}
      <PaymentDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        onVerify={handleReviewPayment}
        onReject={() => {
          setDetailsModalVisible(false);
          setRejectModalVisible(true);
        }}
        payment={selectedPayment}
        reconciliation={reconciliationData}
        loading={detailsLoading}
        userRole={currentRole}
      />
      
      {/* Reject Payment Modal */}
      <Modal
        title="Reject Payment"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="reject" 
            danger 
            onClick={handleRejectPayment}
            loading={loading}
            disabled={!rejectReason}
          >
            Reject Payment
          </Button>
        ]}
      >
        <div>
          <p>Please provide a reason for rejecting this payment:</p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default PendingPayments; 
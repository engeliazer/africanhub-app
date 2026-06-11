import React from 'react';
import { 
  Modal, 
  Typography, 
  Tag, 
  Button, 
  Divider, 
  Row, 
  Col, 
  Collapse,
  Spin
} from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

const { Title } = Typography;

/**
 * A reusable payment details modal component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onVerify - Function to call when the payment is verified
 * @param {Function} props.onReject - Function to call when the payment is rejected
 * @param {Object} props.payment - The payment data object
 * @param {Object} props.payment.student - Student information
 * @param {Object} props.payment.application - Application information with subjects
 * @param {string} props.payment.transaction_id - Transaction ID
 * @param {number} props.payment.amount - Payment amount
 * @param {string} props.payment.payment_method - Payment method
 * @param {string} props.payment.payment_date - Payment date
 * @param {string} props.payment.payment_status - Payment status
 * @param {Object} [props.reconciliation] - Optional reconciliation information
 * @param {string} [props.reconciliation.status] - Reconciliation status
 * @param {string} [props.reconciliation.payer_reference] - Payer's reference
 * @param {string} [props.reconciliation.bank_reference] - Bank reference
 * @param {boolean} [props.loading] - Whether the payment details are loading
 * @param {string} [props.userRole] - The current user's role
 */
const PaymentDetailsModal = ({ 
  visible, 
  onClose, 
  onVerify, 
  onReject, 
  payment,
  reconciliation,
  loading = false,
  userRole = null
}) => {
  if (!payment) return null;

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'TZS'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group subjects by course
  const subjectsByCourse = payment?.application?.subjects?.reduce((acc, subject) => {
    // Skip subjects without course information
    if (!subject.course || !subject.course.id) {
      return acc;
    }

    const courseId = subject.course.id;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: subject.course,
        subjects: []
      };
    }
    acc[courseId].subjects.push(subject);
    return acc;
  }, {}) || {};

  // Determine the button text based on user role
  const getVerifyButtonText = () => {
    if (userRole === 'ACCOUNTANT') {
      return 'Verify Payment';
    } else if (userRole === 'MANAGER') {
      return 'Approve Payment';
    } else {
      return 'Verify Payment';
    }
  };

  // Determine if the user can review the payment
  const canReviewPayment = () => {
    // Check if reconciliation exists
    if (!reconciliation) {
      return false;
    }
    
    // Check if user has the appropriate role (case-insensitive)
    const userRoleUpper = (userRole || '').toUpperCase();
    
    // ACCOUNTANT can verify matched payments
    if (userRoleUpper === 'ACCOUNTANT') {
      return reconciliation.status?.toLowerCase() === 'matched';
    }
    
    // MANAGER can approve verified payments
    if (userRoleUpper === 'MANAGER') {
      return reconciliation.status?.toLowerCase() === 'verified';
    }
    
    return false;
  };

  // Determine if the user can reject the payment
  const canRejectPayment = () => {
    // Check if reconciliation exists
    if (!reconciliation) {
      return false;
    }
    
    // Check if user has the appropriate role (case-insensitive)
    const userRoleUpper = (userRole || '').toUpperCase();
    
    // ACCOUNTANT can reject matched payments
    if (userRoleUpper === 'ACCOUNTANT') {
      return reconciliation.status?.toLowerCase() === 'matched';
    }
    
    // MANAGER can reject verified payments
    if (userRoleUpper === 'MANAGER') {
      return reconciliation.status?.toLowerCase() === 'verified';
    }
    
    return false;
  };

  return (
    <Modal
      title="Payment Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Divider />
      <style jsx>{`
        .info-row {
          margin-bottom: 4px;
          line-height: 1.4;
        }
      `}</style>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
        </div>
      ) : payment ? (
        <div>
          <Row gutter={[16, 4]}>
            <Col span={12}>
              <Title level={5} className="mb-1">Payment Information</Title>
              <div className="info-row">
                <strong>Transaction ID:</strong> {payment.transaction_id}
              </div>
              <div className="info-row">
                <strong>Amount:</strong> {formatCurrency(payment.amount)}
              </div>
              <div className="info-row">
                <strong>Payment Method:</strong> {payment.payment_method}
              </div>
              <div className="info-row">
                <strong>Payment Date:</strong> {formatDate(payment.payment_date)}
              </div>
              <div className="info-row">
                <strong>Status:</strong> {payment.payment_status}
              </div>
            </Col>
            <Col span={12}>
              <Title level={5} className="mb-1">Student Information</Title>
              <div className="info-row">
                <strong>Name:</strong> {`${payment.student.first_name} ${payment.student.last_name}`}
              </div>
              <div className="info-row">
                <strong>Email:</strong> {payment.student.email}
              </div>
              <div className="info-row">
                <strong>Phone:</strong> {payment.student.phone}
              </div>
            </Col>
          </Row>

          <Divider className="my-2" />

          <Collapse 
            defaultActiveKey={[]} 
            className="mb-1"
            expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
            items={[
              {
                key: '1',
                label: (
                  <div className="flex justify-between items-center">
                    <Title level={5} className="mb-0">Course Information</Title>
                    <Tag color="blue">{Object.keys(subjectsByCourse).length} {Object.keys(subjectsByCourse).length === 1 ? 'Course' : 'Courses'}</Tag>
                  </div>
                ),
                children: (
                  <div>
                    {Object.values(subjectsByCourse).map((courseGroup) => (
                      <div key={courseGroup.course.id} className="mb-1 p-2 border rounded">
                        <div className="font-medium">{courseGroup.course.name} ({courseGroup.course.code})</div>
                        <div className="text-gray-600">
                          {courseGroup.subjects.map((subject) => (
                            <div key={subject.id}>{subject.name} ({subject.code}) - {formatCurrency(subject.fee)}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            ]}
          />

          {reconciliation && (
            <>
              <Divider className="my-2" />
              <Collapse 
                defaultActiveKey={[]} 
                className="mb-1"
                expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
                items={[
                  {
                    key: '1',
                    label: (
                      <div className="flex justify-between items-center">
                        <Title level={5} className="mb-0">Reconciliation Information</Title>
                        <Tag color={
                          reconciliation.status === 'matched' ? 'green' : 
                          reconciliation.status === 'unmatched' ? 'red' : 
                          reconciliation.status === 'verified' ? 'blue' :
                          reconciliation.status === 'approved' ? 'purple' :
                          'orange'
                        }>
                          {reconciliation.status === 'matched' ? 'Matched' : 
                           reconciliation.status === 'unmatched' ? 'Unmatched' : 
                           reconciliation.status === 'verified' ? 'Verified' :
                           reconciliation.status === 'approved' ? 'Approved' :
                           'Pending'}
                        </Tag>
                      </div>
                    ),
                    children: (
                      <div>
                        <div className="info-row">
                          <strong>Payer Reference:</strong> {reconciliation.payerReference || reconciliation.payer_reference || 'Not provided'}
                        </div>
                        <div className="info-row">
                          <strong>Bank Reference:</strong> {reconciliation.bankReference || reconciliation.bank_reference || 'Not available yet'}
                        </div>
                        
                        {reconciliation.status === 'unmatched' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            <strong>Warning:</strong> The payer reference and bank reference do not match.
                          </div>
                        )}
                        
                        {reconciliation.status === 'pending' && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                            <strong>Note:</strong> Bank reference is not yet available. You can verify this payment based on the payer's reference.
                          </div>
                        )}
                        
                        {reconciliation.status === 'verified' && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                            <strong>Note:</strong> This payment has been verified by an accountant.
                          </div>
                        )}
                        
                        {reconciliation.status === 'approved' && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-700">
                            <strong>Note:</strong> This payment has been approved by a manager.
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </>
          )}

          <Divider className="my-2" />

          <div className="flex justify-end gap-2 mt-1">
            <Button onClick={onClose}>
              Close
            </Button>
            {canRejectPayment() && (
            <Button 
              danger 
              onClick={() => onReject(payment)}
            >
              Reject Payment
            </Button>
            )}
            {canReviewPayment() && (
              <Button 
                type="primary"
                onClick={() => onVerify(payment)}
              >
                {getVerifyButtonText()}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-4">
          <p>No payment data available</p>
          <Button onClick={onClose} className="mt-2">
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default PaymentDetailsModal; 
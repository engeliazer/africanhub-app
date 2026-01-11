import React, { useState, useEffect } from 'react';
import { Modal, Table, Typography, Spin, Alert, Tag, Button, Space, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import accountingService from '../../services/accounting';
import moment from 'moment';

const { Text, Title } = Typography;

const MatchedPaymentRecords = ({ 
  visible, 
  onClose, 
  title, 
  applicationId,
  paymentId,
  onMatchSuccess,
  onMatchFailure
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (visible && applicationId && paymentId) {
      fetchDetails();
    }
  }, [visible, applicationId, paymentId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // This would be a new API endpoint to get details for both application and payment
      const response = await accountingService.getMatchedPaymentDetails(applicationId, paymentId);
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch matched payment details. Please try again later.');
      console.error('Error fetching matched payment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'green';
      case 'approved':
        return 'blue';
      case 'pending':
        return 'orange';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
  };

  const handleConfirmMatch = async () => {
    setMatching(true);
    try {
      await accountingService.confirmPaymentMatch(applicationId, paymentId);
      if (onMatchSuccess) {
        onMatchSuccess();
      }
      onClose();
    } catch (err) {
      setError('Failed to confirm payment match. Please try again later.');
      console.error('Error confirming payment match:', err);
    } finally {
      setMatching(false);
    }
  };

  const handleRejectMatch = async () => {
    setMatching(true);
    try {
      await accountingService.rejectPaymentMatch(applicationId, paymentId);
      if (onMatchFailure) {
        onMatchFailure();
      }
      onClose();
    } catch (err) {
      setError('Failed to reject payment match. Please try again later.');
      console.error('Error rejecting payment match:', err);
    } finally {
      setMatching(false);
    }
  };

  const renderComparisonTable = () => {
    if (!data) return null;

    const columns = [
      {
        title: 'Field',
        dataIndex: 'field',
        key: 'field',
        width: 150,
      },
      {
        title: 'Application Data',
        dataIndex: 'applicationValue',
        key: 'applicationValue',
        render: (text, record) => (
          <div>
            {record.isMatch ? (
              <Text type="success">{text}</Text>
            ) : (
              <Text type="danger">{text}</Text>
            )}
          </div>
        ),
      },
      {
        title: 'Payment Data',
        dataIndex: 'paymentValue',
        key: 'paymentValue',
        render: (text, record) => (
          <div>
            {record.isMatch ? (
              <Text type="success">{text}</Text>
            ) : (
              <Text type="danger">{text}</Text>
            )}
          </div>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        render: (_, record) => (
          record.isMatch ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>Match</Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>Mismatch</Tag>
          )
        ),
      },
    ];

    // Create comparison data
    const comparisonData = [
      {
        key: '1',
        field: 'Amount',
        applicationValue: formatCurrency(data.application?.total_fee || 0),
        paymentValue: formatCurrency(data.payment?.amount || 0),
        isMatch: data.application?.total_fee === data.payment?.amount,
      },
      {
        key: '2',
        field: 'Applicant Name',
        applicationValue: data.application?.applicant?.name || 'N/A',
        paymentValue: data.payment?.applicant_name || 'N/A',
        isMatch: data.application?.applicant?.name === data.payment?.applicant_name,
      },
      {
        key: '3',
        field: 'Mobile Number',
        applicationValue: data.application?.applicant?.phone || 'N/A',
        paymentValue: data.payment?.mobile_number || 'N/A',
        isMatch: data.application?.applicant?.phone === data.payment?.mobile_number,
      },
      {
        key: '4',
        field: 'Course',
        applicationValue: data.application?.course?.name || 'N/A',
        paymentValue: data.payment?.course_name || 'N/A',
        isMatch: data.application?.course?.name === data.payment?.course_name,
      },
      {
        key: '5',
        field: 'Subject',
        applicationValue: data.application?.subject?.name || 'N/A',
        paymentValue: data.payment?.subject_name || 'N/A',
        isMatch: data.application?.subject?.name === data.payment?.subject_name,
      },
    ];

    return (
      <Table 
        columns={columns} 
        dataSource={comparisonData} 
        pagination={false}
        size="small"
      />
    );
  };

  const renderApplicationDetails = () => {
    if (!data?.application) return null;

    return (
      <div className="mb-4">
        <Title level={5}>Application Details</Title>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text strong>Application ID: </Text>
            <Text>{data.application.id}</Text>
          </div>
          <div>
            <Text strong>Status: </Text>
            <Tag color={getStatusColor(data.application.status)}>
              {data.application.status.toUpperCase()}
            </Tag>
          </div>
          <div>
            <Text strong>Applicant: </Text>
            <Text>{data.application.applicant?.name}</Text>
          </div>
          <div>
            <Text strong>Email: </Text>
            <Text>{data.application.applicant?.email}</Text>
          </div>
          <div>
            <Text strong>Phone: </Text>
            <Text>{data.application.applicant?.phone}</Text>
          </div>
          <div>
            <Text strong>Course: </Text>
            <Text>{data.application.course?.name} ({data.application.course?.code})</Text>
          </div>
          <div>
            <Text strong>Subject: </Text>
            <Text>{data.application.subject?.name} ({data.application.subject?.code})</Text>
          </div>
          <div>
            <Text strong>Total Fee: </Text>
            <Text>{formatCurrency(data.application.total_fee)}</Text>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentDetails = () => {
    if (!data?.payment) return null;

    return (
      <div className="mb-4">
        <Title level={5}>Payment Details</Title>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text strong>Payment ID: </Text>
            <Text>{data.payment.id}</Text>
          </div>
          <div>
            <Text strong>Status: </Text>
            <Tag color={data.payment.payment_status === 'paid' ? 'green' : 'orange'}>
              {data.payment.payment_status.toUpperCase()}
            </Tag>
          </div>
          <div>
            <Text strong>Amount: </Text>
            <Text>{formatCurrency(data.payment.amount)}</Text>
          </div>
          <div>
            <Text strong>Method: </Text>
            <Text>{data.payment.payment_method}</Text>
          </div>
          <div>
            <Text strong>Mobile: </Text>
            <Text>{data.payment.mobile_number}</Text>
          </div>
          <div>
            <Text strong>Date: </Text>
            <Text>{moment(data.payment.payment_date).format('YYYY-MM-DD HH:mm:ss')}</Text>
          </div>
          <div>
            <Text strong>Transaction ID: </Text>
            <Text copyable>{data.payment.transaction_id}</Text>
          </div>
          <div>
            <Text strong>Bank Reference: </Text>
            <Text copyable>{data.payment.bank_reference}</Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={title || "Matched Payment Records"}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="reject" 
          danger 
          onClick={handleRejectMatch}
          loading={matching}
        >
          Reject Match
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          onClick={handleConfirmMatch}
          loading={matching}
        >
          Confirm Match
        </Button>
      ]}
    >
      {error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Spin size="large" />
          <Text className="mt-4">Loading matched payment details...</Text>
        </div>
      ) : data ? (
        <div>
          {renderApplicationDetails()}
          {renderPaymentDetails()}
          
          <Title level={5}>Comparison</Title>
          {renderComparisonTable()}
          
          <div className="mt-4">
            <Alert
              message="Match Verification"
              description={
                <div>
                  <p>Please verify that the application and payment records match correctly.</p>
                  <p>If the data matches, click "Confirm Match" to proceed.</p>
                  <p>If there are discrepancies, click "Reject Match" to mark this as a mismatch.</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default MatchedPaymentRecords; 
import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Typography, Spin, Alert, Tooltip, Descriptions, Button, Space, Divider, Row, Col, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import accountingService from '../../services/accounting';

const { Title, Text } = Typography;

const MatchedPaymentDetails = ({ 
  visible, 
  onClose, 
  title, 
  applicationId, 
  paymentId,
  category,
  startDate,
  endDate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [apiResponse, setApiResponse] = useState(null); // Cache for API response

  useEffect(() => {
    if (visible) {
      if (category) {
        // If category is provided, we're in list mode
        setViewMode('list');
        fetchRecords();
      } else if (applicationId && paymentId) {
        // If applicationId and paymentId are provided, we're in detail mode
        setViewMode('detail');
        fetchDetails();
      }
    }
  }, [visible, applicationId, paymentId, category, startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching matched payment records for category:', category);
      // Use the correct API endpoint format
      const response = await accountingService.getReconciliationSummaryDetails(category, {
        start_date: startDate,
        end_date: endDate
      });
      
      console.log('API Response:', response);
      
      // Cache the API response
      setApiResponse(response);
      
      if (response?.data?.data) {
        setRecords(response.data.data.records || []);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching matched payment records:', err);
      setError(err.message || 'Failed to fetch matched payment records');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching details for application:', applicationId, 'payment:', paymentId);
      
      // If we already have the API response cached, use it
      if (apiResponse?.data?.data) {
        const record = apiResponse.data.data.records.find(r => r.id === paymentId && r.application.id === applicationId);
        if (record) {
          setSelectedRecord(record);
          setData(record);
          setLoading(false);
          return;
        }
      }
      
      // Find the record from the list if we have records
      if (records.length > 0) {
        const record = records.find(r => r.id === paymentId && r.application.id === applicationId);
        if (record) {
          setSelectedRecord(record);
          setData(record);
          setLoading(false);
          return;
        }
      }
      
      // If we don't have the record in our list, fetch it directly
      // IMPORTANT: Only use the category that was provided
      if (!category) {
        setError('Category is required to fetch details');
        setLoading(false);
        return;
      }
      
      // Fetch with the provided category only
      console.log('Fetching details with category:', category);
      const response = await accountingService.getReconciliationSummaryDetails(category, {
        start_date: startDate,
        end_date: endDate
      });
      
      // Cache the response
      setApiResponse(response);
      
      console.log('API Response for details:', response);
      
      if (response?.data?.data) {
        const record = response.data.data.records.find(r => r.id === paymentId && r.application.id === applicationId);
        if (record) {
          setSelectedRecord(record);
          setData(record);
        } else {
          setError('Record not found');
        }
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching matched payment details:', err);
      setError(err.message || 'Failed to fetch matched payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setViewMode('detail');
    setData(record);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRecord(null);
    setData(null);
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      console.log('Confirming payment match for application:', applicationId, 'payment:', paymentId);
      await accountingService.confirmPaymentMatch(applicationId, paymentId);
      // Refresh data after confirmation
      fetchRecords();
      setViewMode('list');
      setSelectedRecord(null);
      setData(null);
    } catch (err) {
      console.error('Error confirming payment match:', err);
      setError(err.message || 'Failed to confirm payment match');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectLoading(true);
    try {
      console.log('Rejecting payment match for application:', applicationId, 'payment:', paymentId);
      await accountingService.rejectPaymentMatch(applicationId, paymentId);
      // Refresh data after rejection
      fetchRecords();
      setViewMode('list');
      setSelectedRecord(null);
      setData(null);
    } catch (err) {
      console.error('Error rejecting payment match:', err);
      setError(err.message || 'Failed to reject payment match');
    } finally {
      setRejectLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'success';
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'matched':
        return 'processing';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  const renderComparisonTable = () => {
    if (!data) return null;

    const bankTransaction = data.bank_reconciliations?.[0]?.bank_transaction;

    const columns = [
      {
        title: 'Field',
        dataIndex: 'field',
        key: 'field',
        width: 150,
      },
      {
        title: 'Application Value',
        dataIndex: 'applicationValue',
        key: 'applicationValue',
        width: 200,
        render: (text, record) => (
          <Text style={{ color: record.matches ? 'inherit' : '#ff4d4f' }}>
            {text}
          </Text>
        ),
      },
      {
        title: 'Payment Value',
        dataIndex: 'paymentValue',
        key: 'paymentValue',
        width: 200,
        render: (text, record) => (
          <Text style={{ color: record.matches ? 'inherit' : '#ff4d4f' }}>
            {text}
          </Text>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'matches',
        key: 'matches',
        width: 100,
        render: (matches) => (
          matches ? 
            <Tag color="success" icon={<CheckCircleOutlined />}>Matches</Tag> : 
            <Tag color="error" icon={<CloseCircleOutlined />}>Mismatch</Tag>
        ),
      },
    ];

    const comparisonData = [
      {
        key: '1',
        field: 'Amount',
        applicationValue: formatCurrency(data.application?.total_fee || 0),
        paymentValue: formatCurrency(data.amount || 0),
        matches: data.application?.total_fee === data.amount,
      },
      {
        key: '2',
        field: 'Reference Number',
        applicationValue: data.reference || 'N/A',
        paymentValue: bankTransaction?.reference_number || 'N/A',
        matches: data.reference === bankTransaction?.reference_number,
      },
      {
        key: '3',
        field: 'Payment Date',
        applicationValue: moment(data.payment_date).format('DD/MM/YYYY HH:mm'),
        paymentValue: bankTransaction ? moment(bankTransaction.payment_date).format('DD/MM/YYYY') : 'N/A',
        matches: true,
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

  const renderRecordsList = () => {
    const columns = [
      {
        title: 'Application ID',
        dataIndex: ['application', 'id'],
        key: 'application_id',
        width: 120,
      },
      {
        title: 'Applicant',
        dataIndex: ['application', 'applicant', 'name'],
        key: 'applicant',
        width: 200,
        render: (text, record) => (
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.application.applicant.email}
            </Text>
          </div>
        ),
      },
      {
        title: 'Course',
        dataIndex: ['application', 'course', 'name'],
        key: 'course',
        width: 200,
        render: (text, record) => (
          <Tooltip title={`${record.application.course.code} - ${text}`}>
            {text}
          </Tooltip>
        ),
      },
      {
        title: 'Subject',
        dataIndex: ['application', 'subject', 'name'],
        key: 'subject',
        width: 150,
        render: (text, record) => (
          <Tooltip title={`${record.application.subject.code} - ${text}`}>
            {text}
          </Tooltip>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        align: 'right',
        render: (amount) => formatCurrency(amount),
      },
      {
        title: 'Payment Date',
        dataIndex: 'payment_date',
        key: 'payment_date',
        width: 150,
        render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      },
      {
        title: 'Reference',
        dataIndex: 'reference',
        key: 'reference',
        width: 150,
        render: (reference) => (
          <Text copyable>{reference}</Text>
        ),
      },
      {
        title: 'Bank Transaction',
        key: 'bank_transaction',
        width: 150,
        render: (_, record) => {
          const bankReconciliation = record.bank_reconciliations?.[0];
          if (!bankReconciliation) return 'N/A';
          
          return (
            <Tooltip title={
              <div>
                <div>Account: {bankReconciliation.bank_transaction.account_number}</div>
                <div>Amount: {formatCurrency(bankReconciliation.bank_transaction.amount)}</div>
                <div>Date: {moment(bankReconciliation.bank_transaction.payment_date).format('DD/MM/YYYY')}</div>
                <div>Ref: {bankReconciliation.bank_transaction.reference_number}</div>
                <div>Status: {bankReconciliation.status?.toUpperCase()}</div>
              </div>
            }>
              <Tag color={getStatusColor(bankReconciliation.status)}>
                {bankReconciliation.status?.toUpperCase()}
              </Tag>
            </Tooltip>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'payment_status',
        key: 'status',
        width: 100,
        render: (status) => (
          <Tag color={getStatusColor(status)}>
            {status?.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Tooltip title="View Details">
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewDetails(record)}
            >
              <EyeOutlined /> View
            </Tag>
          </Tooltip>
        ),
      },
    ];

    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <Text strong>Total Records: </Text>
            <Text>{records.length}</Text>
          </div>
          <div>
            <Text strong>Total Amount: </Text>
            <Text>
              {formatCurrency(
                records.reduce((sum, record) => sum + (record.amount || 0), 0)
              )}
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={records}
          rowKey={(record) => `${record.application.id}-${record.id}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          scroll={{ x: 1500 }}
        />
      </div>
    );
  };

  const renderDetailView = () => {
    if (!data) return null;
    
    const bankTransaction = data.bank_reconciliations?.[0]?.bank_transaction;
    const bankReconciliation = data.bank_reconciliations?.[0];
    
    return (
      <div>
        <div className="mb-4">
          <Button onClick={handleBackToList} className="mb-4">
            Back to List
          </Button>
          <Tag color={getStatusColor(data.payment_status)} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {data.payment_status?.toUpperCase()}
          </Tag>
          {bankReconciliation?.status === 'matched' && (
            <Tag color="processing" style={{ fontSize: '14px', padding: '4px 8px', marginLeft: '8px' }}>
              MATCHED WITH BANK TRANSACTION
            </Tag>
          )}
          {category === 'reconciliation_matched_not_verified' && (
            <Tag color="warning" style={{ fontSize: '14px', padding: '4px 8px', marginLeft: '8px' }}>
              NOT VERIFIED
            </Tag>
          )}
        </div>

        <Divider orientation="left">Application Details</Divider>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Application ID" span={1}>
            {data.application?.id}
          </Descriptions.Item>
          <Descriptions.Item label="Applicant" span={1}>
            {data.application?.applicant?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>
            {data.application?.applicant?.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone" span={1}>
            {data.application?.applicant?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Course" span={1}>
            {data.application?.course?.code} - {data.application?.course?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Subject" span={1}>
            {data.application?.subject?.code} - {data.application?.subject?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Total Fee" span={1}>
            {formatCurrency(data.application?.total_fee || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Application Status" span={1}>
            <Tag color={getStatusColor(data.application?.status)}>
              {data.application?.status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Payment Details</Divider>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Payment ID" span={1}>
            {data.id}
          </Descriptions.Item>
          <Descriptions.Item label="Amount" span={1}>
            {formatCurrency(data.amount || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Date" span={1}>
            {moment(data.payment_date).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Reference" span={1}>
            <Text copyable>{data.reference}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status" span={1}>
            <Tag color={getStatusColor(data.payment_status)}>
              {data.payment_status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {bankTransaction && (
          <>
            <Divider orientation="left">Bank Transaction Details</Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Transaction ID" span={1}>
                <Text copyable>{bankTransaction.transaction_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Amount" span={1}>
                {formatCurrency(bankTransaction.amount || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date" span={1}>
                {moment(bankTransaction.payment_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Account Number" span={1}>
                {bankTransaction.account_number}
              </Descriptions.Item>
              <Descriptions.Item label="Reference Number" span={1}>
                <Text copyable>{bankTransaction.reference_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                <Tag color={getStatusColor(bankReconciliation?.status)}>
                  {bankReconciliation?.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={viewMode === 'detail' ? [
        <Button key="cancel" onClick={onClose}>
          Close
        </Button>
      ] : null}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      ) : viewMode === 'list' ? (
        renderRecordsList()
      ) : (
        renderDetailView()
      )}
    </Modal>
  );
};

export default MatchedPaymentDetails; 
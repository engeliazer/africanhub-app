import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Typography, Spin, Alert, Tooltip, Descriptions, Button, Space, Divider, Row, Col, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import accountingService from '../../services/accounting';

const { Title, Text } = Typography;

const ReconciliationDetails = ({ 
  visible, 
  onClose, 
  title, 
  category,
  startDate,
  endDate,
  onMatchedPaymentClick
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    if (visible && category) {
      fetchRecords();
    }
  }, [visible, category, startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching records for category:', category);
      const response = await accountingService.getReconciliationSummaryDetails(category, {
        start_date: startDate,
        end_date: endDate
      });
      
      console.log('API Response:', response);
      
      if (response?.data?.data) {
        setRecords(response.data.data.records || []);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching reconciliation details:', err);
      setError(err.message || 'Failed to fetch reconciliation details');
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
      case 'pending_payment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getColumns = () => {
    const baseColumns = [
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
        dataIndex: ['application', 'total_fee'],
        key: 'amount',
        width: 120,
        align: 'right',
        render: (amount) => formatCurrency(amount),
      },
      {
        title: 'Status',
        dataIndex: ['application', 'payment_status'],
        key: 'status',
        width: 100,
        render: (status) => (
          <Tag color={getStatusColor(status)}>
            {status?.toUpperCase()}
          </Tag>
        ),
      },
    ];

    // Add Actions column for matched payment records
    if (category && category.startsWith('reconciliation_matched')) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Tooltip title="View Details">
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }}
              onClick={() => onMatchedPaymentClick(record.application.id, record.id)}
            >
              <EyeOutlined /> View
            </Tag>
          </Tooltip>
        ),
      });
    }

    return baseColumns;
  };

  const renderRecordsList = () => {
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
                records.reduce((sum, record) => sum + (record.application?.total_fee || 0), 0)
              )}
            </Text>
          </div>
        </div>

        <Table
          columns={getColumns()}
          dataSource={records}
          rowKey={(record) => record.application.id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    );
  };

  const renderDetailView = () => {
    if (!data) return null;
    
    return (
      <div>
        <div className="mb-4">
          <Button onClick={handleBackToList} className="mb-4">
            Back to List
          </Button>
          <Tag color={getStatusColor(data.application?.payment_status)} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {data.application?.payment_status?.toUpperCase()}
          </Tag>
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
          <Descriptions.Item label="Payment Status" span={1}>
            <Tag color={getStatusColor(data.application?.payment_status)}>
              {data.application?.payment_status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
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

export default ReconciliationDetails; 
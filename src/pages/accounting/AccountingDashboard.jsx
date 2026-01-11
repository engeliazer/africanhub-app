import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin, Alert, Divider, Typography, Progress, message } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  DollarOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CheckOutlined,
  StopOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import accountingService from '../../services/accounting';
import moment from 'moment';
import './AccountingDashboard.css';
import ReconciliationDetails from '../../components/accounting/ReconciliationDetails';
import MatchedPaymentDetails from '../../components/accounting/MatchedPaymentDetails';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AccountingDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [datesSelected, setDatesSelected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [matchedPaymentModalVisible, setMatchedPaymentModalVisible] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  useEffect(() => {
    if (dateRange) {
      fetchReconciliationSummary();
    }
  }, [dateRange]);

  const fetchReconciliationSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const response = await accountingService.getReconciliationSummary(startDate, endDate);
      setSummaryData(response.data);
    } catch (err) {
      setError('Failed to fetch reconciliation data. Please try again later.');
      console.error('Error fetching reconciliation summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      setDatesSelected(true);
    } else {
      setDateRange(null);
      setDatesSelected(false);
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

  const handleCardClick = (category) => {
    // Check if this is a matched payment record category
    if (category.startsWith('reconciliation_matched')) {
      // For matched payment records, we'll handle this differently
      // We'll need to fetch the first record and open the MatchedPaymentDetails modal
      fetchMatchedPaymentRecord(category);
    } else {
      // For other categories, open the ReconciliationDetails modal
      setSelectedCategory(category);
      setDetailsModalVisible(true);
    }
  };

  const fetchMatchedPaymentRecord = async (category) => {
    setLoading(true);
    try {
      // Set the selected category first
      setSelectedCategory(category);
      
      const response = await accountingService.getReconciliationSummaryDetails(category, {
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD')
      });
      
      console.log('Matched payment response:', response);
      
      if (response?.data?.data?.records?.length > 0) {
        const record = response.data.data.records[0];
        setSelectedApplicationId(record.application.id);
        setSelectedPaymentId(record.id);
        setMatchedPaymentModalVisible(true);
      } else {
        // If no records found, show a message
        message.info('No matched payment records found for this category.');
      }
    } catch (err) {
      console.error('Error fetching matched payment record:', err);
      message.error('Failed to fetch matched payment record. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsModalClose = () => {
    setDetailsModalVisible(false);
    setSelectedCategory(null);
  };

  const handleMatchedPaymentClick = (applicationId, paymentId) => {
    setSelectedApplicationId(applicationId);
    setSelectedPaymentId(paymentId);
    setMatchedPaymentModalVisible(true);
  };

  const handleMatchedPaymentModalClose = () => {
    setMatchedPaymentModalVisible(false);
    setSelectedApplicationId(null);
    setSelectedPaymentId(null);
  };

  const handleMatchSuccess = () => {
    // Refresh the data after a successful match
    fetchReconciliationSummary();
  };

  const handleMatchFailure = () => {
    // Refresh the data after a failed match
    fetchReconciliationSummary();
  };

  const renderPaymentStatusSection = () => {
    if (!summaryData?.payment_status_summary) return null;
    
    const { paid, pending, failed } = summaryData.payment_status_summary;
    const totalCount = paid.count + pending.count + failed.count;
    
    return (
      <div className="mb-8">
        <Title level={4} className="mb-4">{summaryData.payment_status_summary.title}</Title>
        <Divider className="mb-4" />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card 
              className="h-full shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCardClick('payment_status_paid')}
            >
              <div className="flex items-center mb-2">
                <CheckCircleOutlined className="text-green-500 text-xl mr-2" />
                <Text strong>Successfully Paid</Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-end">
                <div>
                  <Statistic 
                    value={paid.count} 
                    suffix={`/ ${totalCount}`}
                    className="mb-1"
                  />
                  <Text type="secondary" className="text-sm">
                    {formatCurrency(paid.total_amount)}
                  </Text>
                </div>
                <Progress 
                  type="circle" 
                  percent={totalCount > 0 ? Math.round((paid.count / totalCount) * 100) : 0} 
                  width={60}
                  strokeColor="#52c41a"
                  format={() => `${Math.round((paid.count / totalCount) * 100)}%`}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              className="h-full shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCardClick('payment_status_pending')}
            >
              <div className="flex items-center mb-2">
                <ClockCircleOutlined className="text-blue-500 text-xl mr-2" />
                <Text strong>Awaiting Payment</Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-end">
                <div>
                  <Statistic 
                    value={pending.count} 
                    suffix={`/ ${totalCount}`}
                    className="mb-1"
                  />
                  <Text type="secondary" className="text-sm">
                    {formatCurrency(pending.total_amount)}
                  </Text>
                </div>
                <Progress 
                  type="circle" 
                  percent={totalCount > 0 ? Math.round((pending.count / totalCount) * 100) : 0} 
                  width={60}
                  strokeColor="#1890ff"
                  format={() => `${Math.round((pending.count / totalCount) * 100)}%`}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              className="h-full shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCardClick('payment_status_failed')}
            >
              <div className="flex items-center mb-2">
                <CloseCircleOutlined className="text-red-500 text-xl mr-2" />
                <Text strong>Failed Payments</Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-end">
                <div>
                  <Statistic 
                    value={failed.count} 
                    suffix={`/ ${totalCount}`}
                    className="mb-1"
                  />
                  <Text type="secondary" className="text-sm">
                    {formatCurrency(failed.total_amount)}
                  </Text>
                </div>
                <Progress 
                  type="circle" 
                  percent={totalCount > 0 ? Math.round((failed.count / totalCount) * 100) : 0} 
                  width={60}
                  strokeColor="#f5222d"
                  format={() => `${Math.round((failed.count / totalCount) * 100)}%`}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderReconciliationSection = () => {
    if (!summaryData?.reconciliation_summary) return null;
    
    const { matched_records, unmatched_records } = summaryData.reconciliation_summary;
    
    return (
      <div className="mb-8">
        <Title level={4} className="mb-4">{summaryData.reconciliation_summary.title}</Title>
        <Divider className="mb-4" />
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300">
              <Title level={5} className="mb-4 text-base">{summaryData.reconciliation_summary.matched_records.title}</Title>
              <Divider className="my-2" />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    className="h-full border-l-4 border-l-green-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_matched_verified')}
                  >
                    <div className="flex items-center mb-2">
                      <CheckOutlined className="text-green-500 mr-2" />
                      <Text strong className="text-sm">Verified by Accountant</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={matched_records.matched_verified.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(matched_records.matched_verified.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    className="h-full border-l-4 border-l-blue-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_matched_approved')}
                  >
                    <div className="flex items-center mb-2">
                      <CheckOutlined className="text-blue-500 mr-2" />
                      <Text strong className="text-sm">Approved by Manager</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={matched_records.matched_approved.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(matched_records.matched_approved.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    className="h-full border-l-4 border-l-yellow-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_matched_not_verified')}
                  >
                    <div className="flex items-center mb-2">
                      <SyncOutlined className="text-yellow-500 mr-2" />
                      <Text strong className="text-sm">Not Verified</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={matched_records.matched_not_verified.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(matched_records.matched_not_verified.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    className="h-full border-l-4 border-l-red-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_matched_rejected')}
                  >
                    <div className="flex items-center mb-2">
                      <StopOutlined className="text-red-500 mr-2" />
                      <Text strong className="text-sm">Rejected</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={matched_records.matched_rejected.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(matched_records.matched_rejected.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300">
              <Title level={5} className="mb-4 text-base">{summaryData.reconciliation_summary.unmatched_records.title}</Title>
              <Divider className="my-2" />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card 
                    className="h-full border-l-4 border-l-yellow-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_unmatched_paid_no_bank')}
                  >
                    <div className="flex items-center mb-2">
                      <WarningOutlined className="text-yellow-500 mr-2" />
                      <Text strong className="text-sm">Payments Without Bank Transactions</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={unmatched_records.paid_no_bank_transaction.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(unmatched_records.paid_no_bank_transaction.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card 
                    className="h-full border-l-4 border-l-red-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => handleCardClick('reconciliation_unmatched_bank_no_payment')}
                  >
                    <div className="flex items-center mb-2">
                      <ExclamationCircleOutlined className="text-red-500 mr-2" />
                      <Text strong className="text-sm">Bank Transactions Without Payments</Text>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center">
                      <Statistic
                        value={unmatched_records.bank_transaction_no_payment.count}
                        className="mb-0"
                      />
                      <Text type="secondary" className="text-sm">
                        {formatCurrency(unmatched_records.bank_transaction_no_payment.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSpecialCasesSection = () => {
    if (!summaryData?.special_cases) return null;
    
    const { multiple_matches, expired_matches } = summaryData.special_cases;
    
    return (
      <div className="mb-8">
        <Title level={4} className="mb-4">{summaryData.special_cases.title}</Title>
        <Divider className="mb-4" />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-2">
                <ExclamationCircleOutlined className="text-yellow-500 mr-2" />
                <Text strong className="text-sm">Multiple Bank Transactions Matching One Payment</Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-center">
                <Statistic
                  value={multiple_matches.count}
                  className="mb-0"
                />
                <Text type="secondary" className="text-sm">
                  {formatCurrency(multiple_matches.total_amount)}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-2">
                <WarningOutlined className="text-red-500 mr-2" />
                <Text strong className="text-sm">Matches Pending Verification for Too Long</Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-center">
                <Statistic
                  value={expired_matches.count}
                  className="mb-0"
                />
                <Text type="secondary" className="text-sm">
                  {formatCurrency(expired_matches.total_amount)}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <Title level={2} className="mb-4 md:mb-0 md:w-3/5">Accounting Dashboard</Title>
        <div className="md:w-2/5">
          <RangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      
      {!datesSelected ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <Alert
            message="Date Range Required"
            description={
              <div className="py-2">
                <p className="mb-2">Please select a date range to view the accounting dashboard data.</p>
                <p className="text-gray-600">
                  The dashboard will display payment status, bank reconciliation, and special cases based on the selected date range.
                </p>
              </div>
            }
            type="warning"
            showIcon
            className="mb-4 border-l-4 border-l-yellow-500"
            icon={<CalendarOutlined className="text-yellow-500 text-xl" />}
          />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Spin size="large" />
          <Text className="mt-4">Loading reconciliation data...</Text>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {renderPaymentStatusSection()}
          <Divider />
          {renderReconciliationSection()}
          <Divider />
          {renderSpecialCasesSection()}
        </div>
      )}

      <ReconciliationDetails
        visible={detailsModalVisible}
        onClose={handleDetailsModalClose}
        title={`${selectedCategory?.toUpperCase()} Details`}
        category={selectedCategory}
        startDate={dateRange?.[0]?.format('YYYY-MM-DD')}
        endDate={dateRange?.[1]?.format('YYYY-MM-DD')}
        onMatchedPaymentClick={handleMatchedPaymentClick}
      />

      <MatchedPaymentDetails
        visible={matchedPaymentModalVisible}
        onClose={handleMatchedPaymentModalClose}
        title="Matched Payment Details"
        applicationId={selectedApplicationId}
        paymentId={selectedPaymentId}
        category={selectedCategory}
        startDate={dateRange?.[0]?.format('YYYY-MM-DD')}
        endDate={dateRange?.[1]?.format('YYYY-MM-DD')}
      />
    </div>
  );
};

export default AccountingDashboard; 
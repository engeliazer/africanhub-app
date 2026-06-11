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
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AccountingDashboard = () => {
  const { colors } = useTheme();
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
      <div style={{ marginBottom: '32px' }}>
        <Title level={4} style={{ color: colors.textPrimary, marginBottom: '16px' }}>{summaryData.payment_status_summary.title}</Title>
        <Divider style={{ marginBottom: '16px' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                height: '100%',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 2px 8px ${colors.boxShadow}`,
                cursor: 'pointer'
              }}
              onClick={() => handleCardClick('payment_status_paid')}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '8px' }} />
                <Text strong style={{ color: colors.textPrimary }}>Successfully Paid</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <Statistic
                    value={paid.count}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ color: colors.textPrimary }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: '14px', display: 'block', marginTop: '4px' }}>
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
              style={{
                height: '100%',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 2px 8px ${colors.boxShadow}`,
                cursor: 'pointer'
              }}
              onClick={() => handleCardClick('payment_status_pending')}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '20px', marginRight: '8px' }} />
                <Text strong style={{ color: colors.textPrimary }}>Awaiting Payment</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <Statistic
                    value={pending.count}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ color: colors.textPrimary }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: '14px', display: 'block', marginTop: '4px' }}>
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
              style={{
                height: '100%',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 2px 8px ${colors.boxShadow}`,
                cursor: 'pointer'
              }}
              onClick={() => handleCardClick('payment_status_failed')}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <CloseCircleOutlined style={{ color: '#f5222d', fontSize: '20px', marginRight: '8px' }} />
                <Text strong style={{ color: colors.textPrimary }}>Failed Payments</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <Statistic
                    value={failed.count}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ color: colors.textPrimary }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: '14px', display: 'block', marginTop: '4px' }}>
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
      <div style={{ marginBottom: '32px' }}>
        <Title level={4} style={{ color: colors.textPrimary, marginBottom: '16px' }}>{summaryData.reconciliation_summary.title}</Title>
        <Divider style={{ marginBottom: '16px' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card style={{
              height: '100%',
              background: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.boxShadow}`
            }}>
              <Title level={5} style={{ color: colors.textPrimary, marginBottom: '16px', fontSize: '16px' }}>{summaryData.reconciliation_summary.matched_records.title}</Title>
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #52c41a',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_matched_verified')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Verified by Accountant</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={matched_records.matched_verified.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        {formatCurrency(matched_records.matched_verified.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #1890ff',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_matched_approved')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <CheckOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Approved by Manager</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={matched_records.matched_approved.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        {formatCurrency(matched_records.matched_approved.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #faad14',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_matched_not_verified')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <SyncOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Not Verified</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={matched_records.matched_not_verified.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        {formatCurrency(matched_records.matched_not_verified.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #f5222d',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_matched_rejected')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <StopOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Rejected</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={matched_records.matched_rejected.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        {formatCurrency(matched_records.matched_rejected.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24}>
            <Card style={{
              height: '100%',
              background: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.boxShadow}`
            }}>
              <Title level={5} style={{ color: colors.textPrimary, marginBottom: '16px', fontSize: '16px' }}>{summaryData.reconciliation_summary.unmatched_records.title}</Title>
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #faad14',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_unmatched_paid_no_bank')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Payments Without Bank Transactions</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={unmatched_records.paid_no_bank_transaction.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        {formatCurrency(unmatched_records.paid_no_bank_transaction.total_amount)}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card
                    style={{
                      height: '100%',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: '4px solid #f5222d',
                      boxShadow: `0 2px 8px ${colors.boxShadow}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick('reconciliation_unmatched_bank_no_payment')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <ExclamationCircleOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
                      <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Bank Transactions Without Payments</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={unmatched_records.bank_transaction_no_payment.count}
                        valueStyle={{ color: colors.textPrimary }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
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
      <div style={{ marginBottom: '32px' }}>
        <Title level={4} style={{ color: colors.textPrimary, marginBottom: '16px' }}>{summaryData.special_cases.title}</Title>
        <Divider style={{ marginBottom: '16px' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card style={{
              height: '100%',
              background: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.boxShadow}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Multiple Bank Transactions Matching One Payment</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  value={multiple_matches.count}
                  valueStyle={{ color: colors.textPrimary }}
                />
                <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  {formatCurrency(multiple_matches.total_amount)}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card style={{
              height: '100%',
              background: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.boxShadow}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <WarningOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
                <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Matches Pending Verification for Too Long</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  value={expired_matches.count}
                  valueStyle={{ color: colors.textPrimary }}
                />
                <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
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
    <div style={{ padding: '24px', background: colors.background, minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
          <Title level={2} style={{ color: colors.textPrimary, margin: 0 }}>Accounting Dashboard</Title>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {!datesSelected ? (
        <div style={{
          background: colors.card,
          padding: '24px',
          borderRadius: '8px',
          boxShadow: `0 2px 8px ${colors.boxShadow}`,
          textAlign: 'center',
          border: `1px solid ${colors.border}`
        }}>
          <Alert
            message="Please select a date range to view the accounting dashboard"
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            icon={<CalendarOutlined style={{ fontSize: '20px' }} />}
          />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      ) : loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }}>
          <Spin size="large" />
          <Text style={{ marginTop: '16px', color: colors.textSecondary }}>Loading reconciliation data...</Text>
        </div>
      ) : (
        <div style={{
          background: colors.card,
          padding: '24px',
          borderRadius: '8px',
          boxShadow: `0 2px 8px ${colors.boxShadow}`,
          border: `1px solid ${colors.border}`
        }}>
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
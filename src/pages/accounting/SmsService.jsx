import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Tabs,
  Form,
  message,
  Tag,
  Tooltip
} from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, SendOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import moment from 'moment';
import smsService from '../../services/sms';
import { formatDate } from '../../utils/dateUtils';
import { parseExcelToRecipients, downloadSampleExcel } from '../../utils/smsExcelUtils';
import { useTheme } from '../../contexts/ThemeContext';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const { Title, Text } = Typography;

const PLACEHOLDER_HELP = '[FULLNAME] → first + last name; [SINGLENAME] → first name only';

const CATEGORY_OPTIONS = [
  { value: 'all_users', label: 'All users (not deleted, with phone)' },
  { value: 'active_subscribers', label: 'Active subscribers (≥1 approved application)' },
  { value: 'inactive_no_application', label: 'Inactive (no applications)' }
];

const PROCESS_OPTIONS = [
  { value: '', label: 'All processes' },
  { value: 'registration', label: 'Registration' },
  { value: 'payment_approved', label: 'Payment Approved' },
  { value: 'api_send', label: 'API Send' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' }
];

const SmsService = () => {
  const { colors } = useTheme();
  const fileInputRef = useRef(null);
  const [broadcastForm] = Form.useForm();
  const [customForm] = Form.useForm();
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [customRecipients, setCustomRecipients] = useState([]);
  const [customFileName, setCustomFileName] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });
  const [filters, setFilters] = useState({
    process_name: '',
    status: '',
    recipient: '',
    from_date: '',
    to_date: ''
  });
  const [dateRange, setDateRange] = useState(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await smsService.getLogs({
        page: pagination.page,
        per_page: pagination.per_page,
        ...(filters.process_name && { process_name: filters.process_name }),
        ...(filters.status && { status: filters.status }),
        ...(filters.recipient && { recipient: filters.recipient }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date })
      });
      const data = res?.data ?? res;
      const list = Array.isArray(data?.logs) ? data.logs : [];
      const pag = data?.pagination ?? {};
      setLogs(list);
      setPagination((prev) => ({
        ...prev,
        total: pag.total ?? 0,
        total_pages: pag.total_pages ?? 0
      }));
    } catch (err) {
      message.error(err?.message || err?.data?.message || 'Failed to fetch SMS logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, filters.process_name, filters.status, filters.recipient, filters.from_date, filters.to_date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleApplyFilters = () => {
    setFilters((f) => ({ ...f, recipient: recipientInput.trim() }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleProcessChange = (value) => {
    setFilters((f) => ({ ...f, process_name: value || '' }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleStatusChange = (value) => {
    setFilters((f) => ({ ...f, status: value || '' }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setFilters((f) => ({
        ...f,
        from_date: dates[0].format('YYYY-MM-DD'),
        to_date: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setDateRange(null);
      setFilters((f) => ({ ...f, from_date: '', to_date: '' }));
    }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openMessageModal = (record) => {
    setSelectedLog(record);
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setMessageModalOpen(false);
    setSelectedLog(null);
  };

  const handleTableChange = (tablePag) => {
    setPagination((prev) => ({
      ...prev,
      page: tablePag?.current ?? 1,
      per_page: Math.min(tablePag?.pageSize ?? 20, 100)
    }));
  };

  const handleBroadcast = async () => {
    try {
      const values = await broadcastForm.validateFields();
      setBroadcastLoading(true);
      await smsService.sendBroadcast({ category: values.category, message: values.message });
      message.success('Broadcast SMS sent.');
      broadcastForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || e?.message || 'Failed to send broadcast');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleCustom = async () => {
    try {
      const values = await customForm.validateFields();
      if (!customRecipients.length) {
        message.error('Upload an Excel file with recipient phone numbers.');
        return;
      }
      setCustomLoading(true);
      await smsService.sendCustom({ message: values.message, recipients: customRecipients });
      message.success(`Custom SMS sent to ${customRecipients.length} recipient(s).`);
      customForm.resetFields();
      setCustomRecipients([]);
      setCustomFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || e?.message || 'Failed to send custom SMS');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleExcelSelect = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    try {
      const recipients = await parseExcelToRecipients(file);
      setCustomRecipients(recipients);
      setCustomFileName(file.name);
    } catch (err) {
      message.error('Could not parse Excel. Use the sample format.');
      setCustomRecipients([]);
      setCustomFileName(null);
    }
    e.target.value = '';
  };

  const clearCustomFile = () => {
    setCustomRecipients([]);
    setCustomFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const columns = [
    {
      title: '#',
      key: 'sn',
      width: 56,
      align: 'center',
      render: (_, __, index) =>
        (pagination.page - 1) * pagination.per_page + index + 1
    },
    {
      title: 'Sender ID',
      dataIndex: 'sender_id',
      key: 'sender_id',
      render: (val) => <Text strong style={{ color: colors.textPrimary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (val) => (
        <Text style={{ color: colors.textSecondary }} title={val ?? ''}>
          {val ?? '—'}
        </Text>
      )
    },
    {
      title: 'Count',
      dataIndex: 'sms_count',
      key: 'sms_count',
      width: 88,
      align: 'center',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Process',
      dataIndex: 'process_name',
      key: 'process_name',
      render: (val) => (
        <Tag color="blue">{val ?? '—'}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      align: 'center',
      render: (val) =>
        val === 'sent' ? (
          <Tag color="green">Sent</Tag>
        ) : val === 'failed' ? (
          <Tag color="red">Failed</Tag>
        ) : (
          <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
        )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => (
        <Text style={{ color: colors.textSecondary }}>{formatDate(val) || '—'}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View full message">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openMessageModal(record)}
          />
        </Tooltip>
      )
    }
  ];

  const cardStyle = {
    background: colors.card,
    padding: '24px',
    borderRadius: '8px',
    boxShadow: `0 2px 8px ${colors.boxShadow || 'rgba(0,0,0,0.15)'}`,
    border: `1px solid ${colors.border}`
  };

  const sendSmsTabItems = [
    {
      key: 'broadcast',
      label: 'Broadcast',
      children: (
        <div style={cardStyle}>
          <Form
            form={broadcastForm}
            layout="vertical"
            onFinish={handleBroadcast}
            style={{ maxWidth: 560 }}
          >
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Select category' }]}
            >
              <Select placeholder="Select recipient category" options={CATEGORY_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item
              name="message"
              label="Message"
              extra={PLACEHOLDER_HELP}
              rules={[{ required: true, message: 'Enter message' }]}
            >
              <TextArea rows={5} placeholder="e.g. Hi [FULLNAME], welcome! Or Hi [SINGLENAME]." allowClear />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={broadcastLoading}>
                Send broadcast
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: 'custom',
      label: 'Custom',
      children: (
        <div style={cardStyle}>
          <Form
            form={customForm}
            layout="vertical"
            onFinish={handleCustom}
            style={{ maxWidth: 560 }}
          >
            <Form.Item
              name="message"
              label="Message"
              extra={PLACEHOLDER_HELP}
              rules={[{ required: true, message: 'Enter message' }]}
            >
              <TextArea rows={5} placeholder="e.g. Hi [FULLNAME], your code is 123." allowClear />
            </Form.Item>
            <Form.Item label="Recipients (Excel)" required>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space wrap>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleExcelSelect}
                  />
                  <Button icon={<FileExcelOutlined />} onClick={() => fileInputRef.current?.click()}>
                    Choose Excel
                  </Button>
                  <Button type="link" icon={<DownloadOutlined />} onClick={downloadSampleExcel} style={{ padding: 0 }}>
                    Download sample
                  </Button>
                </Space>
                {customFileName && customRecipients.length > 0 && (
                  <Text type="secondary">
                    {customRecipients.length} recipient(s) from {customFileName}.{' '}
                    <Button type="link" size="small" onClick={clearCustomFile} style={{ padding: 0 }}>
                      Clear
                    </Button>
                  </Text>
                )}
              </Space>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={customLoading}>
                Send custom SMS
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  ];

  const tabItems = [
    {
      key: 'send-sms',
      label: 'Send SMS',
      children: <Tabs defaultActiveKey="broadcast" items={sendSmsTabItems} />
    },
    {
      key: 'sms-logs',
      label: 'SMS Logs',
      children: (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <RangePicker
              placeholder={['From date', 'To date']}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              allowClear
              style={{ minWidth: 240 }}
            />
            <Select
              placeholder="Process"
              options={PROCESS_OPTIONS}
              value={filters.process_name || undefined}
              onChange={handleProcessChange}
              style={{ minWidth: 160 }}
              allowClear
            />
            <Select
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={filters.status || undefined}
              onChange={handleStatusChange}
              style={{ minWidth: 140 }}
              allowClear
            />
            <Input
              placeholder="Recipient (substring)"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onPressEnter={handleApplyFilters}
              style={{ width: 200 }}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleApplyFilters}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              Refresh
            </Button>
          </div>

          <div style={cardStyle}>
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.page,
                pageSize: pagination.per_page,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `Total ${total} SMS logs`
              }}
              onChange={handleTableChange}
              locale={{ emptyText: 'No SMS logs yet.' }}
            />
          </div>
        </>
      )
    }
  ];

  return (
    <div
      style={{
        padding: '24px',
        background: colors.background,
        minHeight: '100vh'
      }}
    >
      <Title level={2} style={{ color: colors.textPrimary, margin: '0 0 24px 0' }}>
        SMS Service
      </Title>

      <Tabs defaultActiveKey="sms-logs" items={tabItems} />

      <Modal
        title="Full message"
        open={messageModalOpen}
        onCancel={closeMessageModal}
        footer={[
          <Button key="close" onClick={closeMessageModal}>
            Close
          </Button>
        ]}
        width={480}
        destroyOnClose
      >
        {selectedLog && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 12, fontSize: 13, color: colors.textMuted }}>
              {selectedLog.recipient && (
                <div>To: {selectedLog.recipient}</div>
              )}
              {selectedLog.created_at && (
                <div>{formatDate(selectedLog.created_at)}</div>
              )}
            </div>
            <div
              style={{
                padding: 12,
                background: colors.background,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 320,
                overflowY: 'auto'
              }}
            >
              {selectedLog.message ?? '—'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SmsService;

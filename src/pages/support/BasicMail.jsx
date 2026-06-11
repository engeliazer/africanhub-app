import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tag,
  Steps,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  EyeOutlined,
  SendOutlined,
  PaperClipOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import mailService from '../../services/mail';
import { formatDate } from '../../utils/dateUtils';
import { parseExcelToMailRecipients, downloadMailSampleExcel } from '../../utils/mailExcelUtils';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PLACEHOLDER_HELP = '[NAME] → recipient full name';

const MAIL_BATCH_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed'
};

const normalizeMailStatus = (status) => {
  if (status == null || status === '') return status;
  return String(status).toLowerCase();
};

const normalizeBatchRecord = (batch) => {
  if (!batch || typeof batch !== 'object') return batch;
  return {
    ...batch,
    status: batch.status != null ? normalizeMailStatus(batch.status) : batch.status,
    recipients: Array.isArray(batch.recipients)
      ? batch.recipients.map((recipient) => ({
          ...recipient,
          status:
            recipient.status != null ? normalizeMailStatus(recipient.status) : recipient.status
        }))
      : batch.recipients
  };
};

const normalizeBatches = (res) => {
  let list = [];
  if (Array.isArray(res)) list = res;
  else if (Array.isArray(res?.data)) list = res.data;
  else if (Array.isArray(res?.data?.batches)) list = res.data.batches;
  else if (Array.isArray(res?.batches)) list = res.batches;
  return list.map(normalizeBatchRecord);
};

const normalizeBatchDetail = (res) => {
  let batch = res;
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    batch = res.data.batch ?? res.data;
  } else {
    batch = res?.batch ?? res;
  }
  return normalizeBatchRecord(batch);
};

const isPendingStatus = (status) => normalizeMailStatus(status) === MAIL_BATCH_STATUS.PENDING;

const statusTagColor = (status) => {
  const val = normalizeMailStatus(status);
  if (val === MAIL_BATCH_STATUS.COMPLETED || val === 'processed') return 'green';
  if (val === 'failed') return 'red';
  if (val === MAIL_BATCH_STATUS.PROCESSING) return 'processing';
  if (val === MAIL_BATCH_STATUS.PENDING) return 'blue';
  return 'default';
};

const formatStatusLabel = (status) => {
  const val = normalizeMailStatus(status);
  if (!val) return '—';
  return val.charAt(0).toUpperCase() + val.slice(1);
};

const renderStatusTag = (status) => {
  if (!status) return <Text type="secondary">—</Text>;
  return <Tag color={statusTagColor(status)}>{formatStatusLabel(status)}</Tag>;
};

const safeTrim = (value) => (value != null ? String(value).trim() : '');

const BasicMail = () => {
  const { colors } = useTheme();
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [form] = Form.useForm();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [startLoadingId, setStartLoadingId] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [removeAttachmentLoading, setRemoveAttachmentLoading] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mailService.getBatches();
      setBatches(normalizeBatches(res));
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to fetch mail batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const resetModal = () => {
    setModalStep(0);
    setRecipients([]);
    setFileName(null);
    setBatchDetails(null);
    form.resetFields();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    resetModal();
    form.setFieldsValue({
      source_email: 'trainings@africanhub.ac.tz',
      interval_seconds: 300,
      interval_limit: 10
    });
    setModalOpen(true);
  };

  const closeCreateModal = () => {
    setModalOpen(false);
    resetModal();
  };

  const handleNext = async () => {
    if (modalStep === 0) {
      try {
        const values = await form.validateFields([
          'source_email',
          'subject',
          'message_body',
          'interval_seconds',
          'interval_limit'
        ]);
        setBatchDetails(values);
        setModalStep(1);
      } catch {
        // validation errors shown by form
      }
      return;
    }

    if (modalStep === 1) {
      if (!recipients.length) {
        message.error('Upload an Excel file with recipient emails.');
        return;
      }
      setModalStep(2);
    }
  };

  const handleBack = () => {
    setModalStep((s) => {
      const next = Math.max(0, s - 1);
      if (next === 0 && batchDetails) {
        form.setFieldsValue(batchDetails);
      }
      return next;
    });
  };

  const handleExcelSelect = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelToMailRecipients(file);
      if (!parsed.length) {
        message.error('No valid recipients found in the Excel file.');
        setRecipients([]);
        setFileName(null);
        return;
      }
      setRecipients(parsed);
      setFileName(file.name);
      message.success(`${parsed.length} recipient(s) loaded.`);
    } catch (err) {
      message.error(err?.message || 'Could not parse Excel. Use the sample format.');
      setRecipients([]);
      setFileName(null);
    }
    e.target.value = '';
  };

  const clearRecipientsFile = () => {
    setRecipients([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveBatch = async () => {
    try {
      if (!batchDetails) {
        message.error('Batch details are missing. Go back and complete the form.');
        setModalStep(0);
        return;
      }
      if (!recipients.length) {
        message.error('Upload an Excel file with recipient emails.');
        setModalStep(1);
        return;
      }

      const payload = {
        source_email: safeTrim(batchDetails.source_email),
        subject: safeTrim(batchDetails.subject),
        message_body: batchDetails.message_body ?? '',
        interval_seconds: batchDetails.interval_seconds,
        interval_limit: batchDetails.interval_limit,
        recipients
      };

      setSubmitLoading(true);
      await mailService.createBatch(payload);
      message.success(`Mail batch created with ${recipients.length} recipient(s).`);
      closeCreateModal();
      await fetchBatches();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || err?.message || 'Failed to create mail batch');
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchBatchDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await mailService.getBatch(id);
      setSelectedBatch(normalizeBatchDetail(res));
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to fetch batch details');
      setDetailModalOpen(false);
      setSelectedBatch(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetailModal = (record) => {
    if (!record?.id) {
      setSelectedBatch(record);
      setDetailModalOpen(true);
      return;
    }
    setSelectedBatch(record);
    setDetailModalOpen(true);
    fetchBatchDetail(record.id);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedBatch(null);
    setDetailLoading(false);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleAttachmentSelect = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !selectedBatch?.id) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      message.error('Only PDF attachments are allowed.');
      e.target.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      message.error('PDF attachment must be 2MB or smaller.');
      e.target.value = '';
      return;
    }

    setAttachmentLoading(true);
    try {
      const res = await mailService.uploadAttachment(selectedBatch.id, file);
      const updated = normalizeBatchDetail(res?.data ? { data: res.data } : res);
      setSelectedBatch((prev) => ({ ...prev, ...updated }));
      message.success('Attachment uploaded.');
      await fetchBatches();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to upload attachment');
    } finally {
      setAttachmentLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async () => {
    if (!selectedBatch?.id) return;

    setRemoveAttachmentLoading(true);
    try {
      const res = await mailService.removeAttachment(selectedBatch.id);
      const updated = normalizeBatchDetail(res?.data ? { data: res.data } : res);
      setSelectedBatch((prev) => ({ ...prev, ...updated, has_attachment: false, attachment_filename: null }));
      message.success('Attachment removed.');
      await fetchBatches();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to remove attachment');
    } finally {
      setRemoveAttachmentLoading(false);
    }
  };

  const handleDownloadAttachment = async () => {
    if (!selectedBatch?.id) return;

    try {
      const response = await mailService.downloadAttachment(selectedBatch.id);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedBatch.attachment_filename || 'attachment.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to download attachment');
    }
  };

  const handleStartBatch = async (record, { closeDetail = false } = {}) => {
    if (!record?.id || !isPendingStatus(record.status)) return;

    setStartLoadingId(record.id);
    try {
      await mailService.startBatch(record.id);
      message.success('Mail batch started.');
      if (closeDetail) closeDetailModal();
      await fetchBatches();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to start mail batch');
    } finally {
      setStartLoadingId(null);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'sn',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Source Email',
      dataIndex: 'source_email',
      key: 'source_email',
      render: (val) => <Text strong style={{ color: colors.textPrimary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Recipients',
      key: 'recipients_count',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const count =
          record.recipients_count ??
          record.recipient_count ??
          (Array.isArray(record.recipients) ? record.recipients.length : null);
        return <Text style={{ color: colors.textSecondary }}>{count ?? '—'}</Text>;
      }
    },
    {
      title: 'Interval (s)',
      dataIndex: 'interval_seconds',
      key: 'interval_seconds',
      width: 110,
      align: 'center',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Limit',
      dataIndex: 'interval_limit',
      key: 'interval_limit',
      width: 80,
      align: 'center',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (val) => renderStatusTag(val)
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
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
            />
          </Tooltip>
          {isPendingStatus(record.status) && (
            <Tooltip title="Start sending">
              <Button
                type="text"
                size="small"
                icon={<SendOutlined />}
                loading={startLoadingId === record.id}
                onClick={() => handleStartBatch(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const recipientColumns = [
    {
      title: '#',
      key: 'sn',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (val) => val || '—'
    }
  ];

  const recipientStatusColumns = [
    ...recipientColumns,
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val) => renderStatusTag(val)
    }
  ];

  const cardStyle = {
    background: colors.card,
    padding: '24px',
    borderRadius: '8px',
    boxShadow: `0 2px 8px ${colors.boxShadow || 'rgba(0,0,0,0.15)'}`,
    border: `1px solid ${colors.border}`
  };

  const renderStepContent = () => {
    if (modalStep === 0) {
      return (
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="source_email"
            label="Source Email"
            rules={[
              { required: true, message: 'Enter source email' },
              { type: 'email', message: 'Enter a valid email address' }
            ]}
          >
            <Input placeholder="trainings@africanhub.ac.tz" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Enter email subject' }]}
          >
            <Input placeholder="Training Update" />
          </Form.Item>
          <Form.Item
            name="message_body"
            label="Message Body"
            extra={PLACEHOLDER_HELP}
            rules={[{ required: true, message: 'Enter message body' }]}
          >
            <TextArea
              rows={6}
              placeholder={'Dear [NAME],\n\nYour session is confirmed.'}
            />
          </Form.Item>
          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              name="interval_seconds"
              label="Interval (seconds)"
              rules={[{ required: true, message: 'Enter interval' }]}
              style={{ minWidth: 180 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="300" />
            </Form.Item>
            <Form.Item
              name="interval_limit"
              label="Interval Limit"
              rules={[{ required: true, message: 'Enter interval limit' }]}
              style={{ minWidth: 180 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="10" />
            </Form.Item>
          </Space>
        </Form>
      );
    }

    if (modalStep === 1) {
      return (
        <div>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Upload an Excel file with <Text code>email</Text> and <Text code>full_name</Text> columns.
          </Paragraph>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={downloadMailSampleExcel}
                style={{ padding: 0 }}
              >
                Download sample
              </Button>
            </Space>
            {fileName && recipients.length > 0 && (
              <Text type="secondary">
                {recipients.length} recipient(s) from {fileName}.{' '}
                <Button type="link" size="small" onClick={clearRecipientsFile} style={{ padding: 0 }}>
                  Clear
                </Button>
              </Text>
            )}
          </Space>
        </div>
      );
    }

    return (
      <div>
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.background
          }}
        >
          <Paragraph style={{ marginBottom: 4 }}>
            <Text strong>From:</Text> {batchDetails?.source_email ?? '—'}
          </Paragraph>
          <Paragraph style={{ marginBottom: 4 }}>
            <Text strong>Subject:</Text> {batchDetails?.subject ?? '—'}
          </Paragraph>
          <Paragraph style={{ marginBottom: 4 }}>
            <Text strong>Interval:</Text> {batchDetails?.interval_seconds ?? '—'}s, limit{' '}
            {batchDetails?.interval_limit ?? '—'}
          </Paragraph>
          <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
            <Text strong>Message:</Text>
            <br />
            {batchDetails?.message_body ?? '—'}
          </Paragraph>
        </div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Recipients ({recipients.length})
        </Title>
        <Table
          columns={recipientColumns}
          dataSource={recipients}
          rowKey={(row, index) => `${row.email}-${index}`}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ y: 280 }}
        />
      </div>
    );
  };

  const modalFooter = () => {
    if (modalStep === 0) {
      return [
        <Button key="cancel" onClick={closeCreateModal}>
          Cancel
        </Button>,
        <Button key="next" type="primary" onClick={handleNext}>
          Next
        </Button>
      ];
    }

    if (modalStep === 1) {
      return [
        <Button key="cancel" onClick={closeCreateModal}>
          Cancel
        </Button>,
        <Button key="back" onClick={handleBack}>
          Back
        </Button>,
        <Button key="next" type="primary" onClick={handleNext}>
          Review
        </Button>
      ];
    }

    return [
      <Button key="cancel" onClick={closeCreateModal}>
        Cancel
      </Button>,
      <Button key="back" onClick={handleBack}>
        Back
      </Button>,
      <Button key="save" type="primary" loading={submitLoading} onClick={handleSaveBatch}>
        Save Batch
      </Button>
    ];
  };

  return (
    <>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}
      >
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBatches} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Create Batch
          </Button>
        </Space>
      </div>

      <div style={cardStyle}>
        <Table
          columns={columns}
          dataSource={batches}
          rowKey={(row) => row.id ?? `${row.source_email}-${row.subject}-${row.created_at}`}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} batches`
          }}
          locale={{ emptyText: 'No mail batches yet.' }}
        />
      </div>

      <Modal
        title="Create Mail Batch"
        open={modalOpen}
        onCancel={closeCreateModal}
        footer={modalFooter()}
        width={modalStep === 2 ? 640 : 560}
        destroyOnClose
      >
        <Steps
          current={modalStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Batch Details' },
            { title: 'Upload Recipients' },
            { title: 'Confirm & Save' }
          ]}
        />
        {renderStepContent()}
      </Modal>

      <Modal
        title="Batch Details"
        open={detailModalOpen}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            Close
          </Button>,
          selectedBatch && isPendingStatus(selectedBatch.status) && (
            <>
              <input
                key="attachment-input"
                ref={attachmentInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handleAttachmentSelect}
              />
              <Button
                key="attachment"
                icon={<PaperClipOutlined />}
                loading={attachmentLoading}
                onClick={() => attachmentInputRef.current?.click()}
              >
                {selectedBatch.has_attachment || selectedBatch.attachment_filename
                  ? 'Replace Attachment'
                  : 'Add Attachment'}
              </Button>
              <Button
                key="start"
                type="primary"
                icon={<SendOutlined />}
                loading={startLoadingId === selectedBatch.id}
                onClick={() => handleStartBatch(selectedBatch, { closeDetail: true })}
              >
                Start Sending
              </Button>
            </>
          )
        ].filter(Boolean)}
        width={640}
        destroyOnClose
      >
        {selectedBatch && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.background
              }}
            >
              <Paragraph style={{ marginBottom: 4 }}>
                <Text strong>From:</Text> {selectedBatch.source_email ?? '—'}
              </Paragraph>
              <Paragraph style={{ marginBottom: 4 }}>
                <Text strong>Subject:</Text> {selectedBatch.subject ?? '—'}
              </Paragraph>
              <Paragraph style={{ marginBottom: 4 }}>
                <Text strong>Interval:</Text>{' '}
                {selectedBatch.interval_seconds ?? '—'}s, limit {selectedBatch.interval_limit ?? '—'}
              </Paragraph>
              {selectedBatch.status && (
                <Paragraph style={{ marginBottom: 4 }}>
                  <Text strong>Status:</Text> {renderStatusTag(selectedBatch.status)}
                </Paragraph>
              )}
              {selectedBatch.created_at && (
                <Paragraph style={{ marginBottom: 4 }}>
                  <Text strong>Created:</Text> {formatDate(selectedBatch.created_at)}
                </Paragraph>
              )}
              <Paragraph style={{ marginBottom: 4 }}>
                <Text strong>Attachment:</Text>{' '}
                {selectedBatch.has_attachment || selectedBatch.attachment_filename ? (
                  <Space size="small" wrap>
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadAttachment}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      {selectedBatch.attachment_filename || 'attachment.pdf'}
                    </Button>
                    {isPendingStatus(selectedBatch.status) && (
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={removeAttachmentLoading}
                        onClick={handleRemoveAttachment}
                        style={{ padding: 0, height: 'auto' }}
                      >
                        Remove
                      </Button>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary">None</Text>
                )}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                <Text strong>Message:</Text>
                <br />
                {selectedBatch.message_body ?? '—'}
              </Paragraph>
            </div>
            {Array.isArray(selectedBatch.recipients) && selectedBatch.recipients.length > 0 && (
              <>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Recipients ({selectedBatch.recipients.length})
                </Title>
                <Table
                  columns={recipientStatusColumns}
                  dataSource={selectedBatch.recipients}
                  rowKey={(row, index) => row.id ?? `${row.email}-${index}`}
                  size="small"
                  loading={detailLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ y: 240 }}
                />
              </>
            )}
            {detailLoading && (!selectedBatch.recipients || !selectedBatch.recipients.length) && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Text type="secondary">Loading recipient statuses…</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default BasicMail;

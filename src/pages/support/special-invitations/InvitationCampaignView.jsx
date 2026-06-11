import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Button,
  Space,
  Tabs,
  Steps,
  Form,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  Select,
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Modal,
  message,
  Divider,
  Alert,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  EyeOutlined,
  SendOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import invitationsService from '../../../services/invitations';
import { parseExcelToInvitees, downloadInviteeSampleExcel } from '../../../utils/invitationExcelUtils';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  unwrapData,
  isEditableInvitation,
  renderStatusTag,
  validationStatusColor,
  sendStatusColor,
  downloadBlob,
  INVITATION_STATUS
} from './invitationHelpers.jsx';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PLACEHOLDER_HELP = '[NAME] → invitee full name';

const stepItems = [
  { title: 'Details' },
  { title: 'Invitees' },
  { title: 'Preview' },
  { title: 'Send' }
];

const InvitationCampaignView = ({ invitationId, onBack, onChanged }) => {
  const { colors } = useTheme();
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);
  const templateInputRef = useRef(null);

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [trainers, setTrainers] = useState([]);
  const [trainerIds, setTrainerIds] = useState([]);

  const [parsedInvitees, setParsedInvitees] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [validationFilter, setValidationFilter] = useState('ALL');
  const [inviteesLoading, setInviteesLoading] = useState(false);
  const [fileName, setFileName] = useState(null);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewInviteeId, setPreviewInviteeId] = useState(null);
  const [validInvitees, setValidInvitees] = useState([]);

  const [testEmail, setTestEmail] = useState('');
  const [scheduleAt, setScheduleAt] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);

  const [summary, setSummary] = useState(null);
  const [failedInvitees, setFailedInvitees] = useState([]);

  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [trainerForm] = Form.useForm();
  const [trainerSaving, setTrainerSaving] = useState(false);

  const isNew = !invitationId;
  const editable = isNew || (invitation && isEditableInvitation(invitation.status));
  const currentId = invitation?.id ?? invitationId;

  const cardStyle = {
    background: colors.card,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '16px'
  };

  const loadTrainers = useCallback(async () => {
    try {
      const res = await invitationsService.getTrainers(true);
      setTrainers(unwrapData(res) ?? []);
    } catch {
      setTrainers([]);
    }
  }, []);

  const loadInvitation = useCallback(async () => {
    if (!invitationId) return;
    setLoading(true);
    try {
      const res = await invitationsService.getInvitation(invitationId, false);
      const data = unwrapData(res);
      setInvitation(data);
      setTrainerIds((data.trainers ?? []).map((t) => t.id));
      setSummary(data.invitee_counts ?? null);
      form.setFieldsValue({
        title: data.title,
        course_title: data.course_title,
        course_description: data.course_description,
        venue: data.venue,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        end_date: data.end_date ? dayjs(data.end_date) : null,
        start_time: data.start_time ? dayjs(data.start_time, 'HH:mm:ss') : null,
        end_time: data.end_time ? dayjs(data.end_time, 'HH:mm:ss') : null,
        learning_outcomes: data.learning_outcomes,
        source_email: data.source_email,
        email_subject: data.email_subject,
        email_message: data.email_message,
        course_fee: data.course_fee,
        deposit_amount: data.deposit_amount,
        reservation_deadline: data.reservation_deadline ? dayjs(data.reservation_deadline) : null,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number,
        bank_name: data.bank_name,
        interval_seconds: data.interval_seconds ?? 10,
        interval_limit: data.interval_limit ?? 5
      });
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load invitation');
      onBack?.();
    } finally {
      setLoading(false);
    }
  }, [invitationId, form, onBack]);

  const loadValidInvitees = useCallback(async () => {
    if (!currentId) return;
    try {
      const res = await invitationsService.getInvitees(currentId, {
        validation_status: 'VALID',
        per_page: 200
      });
      const data = unwrapData(res);
      setValidInvitees(data?.invitees ?? []);
      if (!previewInviteeId && data?.invitees?.length) {
        setPreviewInviteeId(data.invitees[0].id);
      }
    } catch {
      setValidInvitees([]);
    }
  }, [currentId, previewInviteeId]);

  const loadSummary = useCallback(async () => {
    if (!currentId) return;
    try {
      const res = await invitationsService.getInviteeSummary(currentId);
      const data = unwrapData(res);
      setSummary(data?.summary ?? data?.invitee_counts ?? null);
      if (data?.invitation_status) {
        setInvitation((prev) => (prev ? { ...prev, status: data.invitation_status } : prev));
      }
    } catch {
      // ignore polling errors
    }
  }, [currentId]);

  const loadFailedInvitees = useCallback(async () => {
    if (!currentId) return;
    try {
      const res = await invitationsService.getInvitees(currentId, {
        send_status: 'FAILED',
        per_page: 50
      });
      setFailedInvitees(unwrapData(res)?.invitees ?? []);
    } catch {
      setFailedInvitees([]);
    }
  }, [currentId]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  useEffect(() => {
    if (invitationId) loadInvitation();
    else {
      form.setFieldsValue({
        source_email: 'trainings@africanhub.ac.tz',
        interval_seconds: 10,
        interval_limit: 5
      });
    }
  }, [invitationId, loadInvitation, form]);

  useEffect(() => {
    if (currentId) loadValidInvitees();
  }, [currentId, loadValidInvitees]);

  useEffect(() => {
    if (!currentId || invitation?.status !== INVITATION_STATUS.PROCESSING) return undefined;
    const interval = setInterval(() => {
      loadSummary();
      loadInvitation();
      loadFailedInvitees();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentId, invitation?.status, loadSummary, loadInvitation, loadFailedInvitees]);

  const buildPayload = (values) => ({
    title: values.title?.trim(),
    course_title: values.course_title?.trim(),
    course_description: values.course_description,
    venue: values.venue?.trim(),
    start_date: values.start_date?.format('YYYY-MM-DD'),
    end_date: values.end_date?.format('YYYY-MM-DD'),
    start_time: values.start_time?.format('HH:mm'),
    end_time: values.end_time?.format('HH:mm'),
    learning_outcomes: values.learning_outcomes,
    source_email: values.source_email?.trim(),
    email_subject: values.email_subject?.trim(),
    email_message: values.email_message,
    course_fee: values.course_fee,
    deposit_amount: values.deposit_amount,
    reservation_deadline: values.reservation_deadline?.format('YYYY-MM-DD'),
    bank_account_name: values.bank_account_name,
    bank_account_number: values.bank_account_number,
    bank_name: values.bank_name,
    interval_seconds: values.interval_seconds,
    interval_limit: values.interval_limit,
    trainer_ids: trainerIds
  });

  const handleSaveDetails = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = buildPayload(values);

      if (isNew) {
        const res = await invitationsService.createInvitation(payload);
        const created = unwrapData(res);
        setInvitation(created);
        message.success('Invitation created');
        onChanged?.();
        setActiveTab('invitees');
      } else {
        const res = await invitationsService.updateInvitation(currentId, payload);
        await invitationsService.assignTrainers(currentId, trainerIds);
        const updated = unwrapData(res);
        setInvitation(updated);
        setTrainerIds((updated.trainers ?? []).map((t) => t.id));
        message.success('Invitation updated');
        onChanged?.();
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || 'Failed to save invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleExcelSelect = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !currentId) return;
    try {
      const rows = await parseExcelToInvitees(file);
      if (!rows.length) {
        message.error('No invitees found in the Excel file.');
        return;
      }
      if (rows.length > 5000) {
        message.error('Maximum 5,000 invitees per upload.');
        return;
      }
      setParsedInvitees(rows);
      setFileName(file.name);
      setInviteesLoading(true);
      const res = await invitationsService.validateInvitees(currentId, rows);
      setValidationResult(unwrapData(res));
      message.success(`Validated ${rows.length} row(s).`);
    } catch (err) {
      message.error(err?.message || err?.response?.data?.message || 'Failed to parse Excel');
      setParsedInvitees([]);
      setValidationResult(null);
      setFileName(null);
    } finally {
      setInviteesLoading(false);
      e.target.value = '';
    }
  };

  const handleSaveInvitees = async () => {
    if (!currentId || !parsedInvitees.length) {
      message.error('Upload and validate invitees first.');
      return;
    }
    if ((validationResult?.summary?.valid ?? 0) === 0) {
      message.error('No valid invitees to save.');
      return;
    }
    setInviteesLoading(true);
    try {
      const res = await invitationsService.saveInvitees(currentId, parsedInvitees, true);
      const data = unwrapData(res);
      setValidationResult(data);
      setSummary(data.summary);
      setInvitation((prev) => ({ ...prev, status: data.invitation_status, invitee_counts: data.summary }));
      message.success('Invitees saved.');
      onChanged?.();
      loadValidInvitees();
      setActiveTab('preview');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save invitees');
    } finally {
      setInviteesLoading(false);
    }
  };

  const handleLoadPreview = async () => {
    if (!currentId) return;
    setPreviewLoading(true);
    try {
      const params = previewInviteeId
        ? { invitee_id: previewInviteeId, format: 'html' }
        : { sample: true, format: 'html' };
      const html = await invitationsService.getPreviewHtmlRaw(currentId, params);
      setPreviewHtml(html);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load preview');
      setPreviewHtml('');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'preview' && currentId) handleLoadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentId, previewInviteeId]);

  useEffect(() => {
    if (activeTab === 'progress' && currentId) {
      loadSummary();
      loadFailedInvitees();
    }
  }, [activeTab, currentId, loadSummary, loadFailedInvitees]);

  const handleDownloadPdf = async () => {
    if (!currentId) return;
    try {
      const params = previewInviteeId ? { invitee_id: previewInviteeId } : { sample: true };
      const res = await invitationsService.downloadPreviewPdf(currentId, params);
      downloadBlob(res.data, `invitation_preview.pdf`);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleTemplateUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !currentId) return;
    try {
      await invitationsService.uploadTemplate(currentId, file);
      message.success('Template uploaded.');
      loadInvitation();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to upload template');
    }
    e.target.value = '';
  };

  const handleRemoveTemplate = async () => {
    if (!currentId) return;
    try {
      await invitationsService.removeTemplate(currentId);
      message.success('Template removed.');
      loadInvitation();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to remove template');
    }
  };

  const handleSendTest = async () => {
    if (!currentId || !testEmail.trim()) {
      message.error('Enter a test email address.');
      return;
    }
    setSendLoading(true);
    try {
      const payload = { email: testEmail.trim() };
      if (previewInviteeId) payload.invitee_id = previewInviteeId;
      await invitationsService.sendTest(currentId, payload);
      message.success(`Test email sent to ${testEmail.trim()}`);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!currentId || !scheduleAt) {
      message.error('Select a future date and time.');
      return;
    }
    setSendLoading(true);
    try {
      const res = await invitationsService.scheduleSend(
        currentId,
        scheduleAt.format('YYYY-MM-DDTHH:mm:ss')
      );
      setInvitation((prev) => ({ ...prev, ...unwrapData(res) }));
      message.success('Send scheduled.');
      onChanged?.();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to schedule send');
    } finally {
      setSendLoading(false);
    }
  };

  const handleStartSend = async (options = {}) => {
    if (!currentId) return;
    setSendLoading(true);
    try {
      const res = await invitationsService.startSend(currentId, options);
      const data = unwrapData(res);
      setInvitation((prev) => ({ ...prev, status: data.status ?? INVITATION_STATUS.PROCESSING }));
      message.success('Batch send started.');
      onChanged?.();
      setActiveTab('progress');
      loadSummary();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to start send');
    } finally {
      setSendLoading(false);
    }
  };

  const handleCreateTrainer = async () => {
    try {
      const values = await trainerForm.validateFields();
      setTrainerSaving(true);
      const res = await invitationsService.createTrainer({
        full_name: values.full_name.trim(),
        designation: values.designation,
        bio: values.bio,
        qualifications: values.qualifications
      });
      const created = unwrapData(res);
      message.success('Trainer created.');
      setTrainerModalOpen(false);
      trainerForm.resetFields();
      await loadTrainers();
      if (created?.id) setTrainerIds((prev) => [...prev, created.id]);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || 'Failed to create trainer');
    } finally {
      setTrainerSaving(false);
    }
  };

  const currentStep = () => {
    if (!currentId) return 0;
    if (invitation?.status === INVITATION_STATUS.DRAFT) return 1;
    if (activeTab === 'preview') return 2;
    if (activeTab === 'send' || activeTab === 'progress') return 3;
    if ((summary?.valid ?? invitation?.invitee_counts?.valid ?? 0) > 0) return 2;
    return 1;
  };

  const validationRows = (validationResult?.invitees ?? []).filter((row) => {
    if (validationFilter === 'ALL') return true;
    return row.validation_status === validationFilter;
  });

  const validationColumns = [
    {
      title: 'Row',
      key: 'row',
      width: 60,
      render: (_, r) => (r.row_index != null ? r.row_index + 1 : '—')
    },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name', ellipsis: true },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'validation_status',
      key: 'validation_status',
      width: 110,
      render: (val) => renderStatusTag(val, validationStatusColor)
    },
    {
      title: 'Message',
      dataIndex: 'validation_message',
      key: 'validation_message',
      ellipsis: true,
      render: (val) => val || '—'
    }
  ];

  const detailsTab = (
    <Form form={form} layout="vertical" disabled={!editable && !isNew}>
      <Card size="small" title="Campaign" style={{ marginBottom: 16 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="June 2025 Tax Workshop" />
        </Form.Item>
      </Card>

      <Card size="small" title="Course" style={{ marginBottom: 16 }}>
        <Form.Item name="course_title" label="Course Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="course_description" label="Course Description" rules={[{ required: true }]}>
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="venue" label="Venue" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="end_date" label="End Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="end_time" label="End Time" rules={[{ required: true }]}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="learning_outcomes" label="Learning Outcomes">
          <TextArea rows={3} placeholder="One outcome per line" />
        </Form.Item>
      </Card>

      <Card size="small" title="Trainers" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            mode="multiple"
            placeholder="Select trainers (order = PDF display order)"
            value={trainerIds}
            onChange={setTrainerIds}
            disabled={!editable && !isNew}
            style={{ width: '100%' }}
            options={trainers.map((t) => ({ value: t.id, label: t.full_name }))}
          />
          <Button type="link" onClick={() => setTrainerModalOpen(true)} style={{ padding: 0 }}>
            + Create trainer
          </Button>
        </Space>
      </Card>

      <Card size="small" title="Payment" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="course_fee" label="Course Fee">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="deposit_amount" label="Deposit Amount">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="reservation_deadline" label="Reservation Deadline">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="bank_account_name" label="Bank Account Name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="bank_account_number" label="Account Number">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="bank_name" label="Bank Name">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="Email" style={{ marginBottom: 16 }}>
        <Form.Item
          name="source_email"
          label="Source Email"
          rules={[{ required: true }, { type: 'email' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="email_subject" label="Subject" rules={[{ required: true }]}>
          <Input placeholder="Invitation: [NAME]" />
        </Form.Item>
        <Form.Item
          name="email_message"
          label="Message"
          extra={PLACEHOLDER_HELP}
          rules={[{ required: true }]}
        >
          <TextArea rows={5} placeholder={'Dear [NAME],\n\nWe are pleased to invite you…'} />
        </Form.Item>
      </Card>

      <Card size="small" title="Rate Limits" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="interval_seconds" label="Interval (seconds)">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="interval_limit" label="Emails per burst">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {(editable || isNew) && (
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveDetails}>
          {isNew ? 'Create & Continue' : 'Save Changes'}
        </Button>
      )}
    </Form>
  );

  const inviteesTab = (
    <div>
      {!currentId ? (
        <Alert type="info" message="Save invitation details first." showIcon />
      ) : (
        <>
          <Paragraph type="secondary">
            Upload Excel with columns: <Text code>Full Name</Text>, <Text code>Email</Text>,{' '}
            <Text code>Address</Text> (optional), <Text code>Organization</Text> (optional).
          </Paragraph>
          <Space wrap style={{ marginBottom: 16 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleExcelSelect}
              disabled={!editable}
            />
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={!editable}
            >
              Choose Excel
            </Button>
            <Button type="link" icon={<DownloadOutlined />} onClick={downloadInviteeSampleExcel}>
              Download sample
            </Button>
            {fileName && <Text type="secondary">{fileName}</Text>}
          </Space>

          {validationResult?.summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              {['total', 'valid', 'invalid', 'duplicate'].map((key) => (
                <Col xs={12} sm={6} key={key}>
                  <Card size="small">
                    <Statistic
                      title={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={validationResult.summary[key] ?? 0}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {validationResult?.invitees?.length > 0 && (
            <>
              <Tabs
                size="small"
                activeKey={validationFilter}
                onChange={setValidationFilter}
                style={{ marginBottom: 12 }}
                items={['ALL', 'VALID', 'INVALID', 'DUPLICATE'].map((k) => ({
                  key: k,
                  label: k === 'ALL' ? 'All' : k.charAt(0) + k.slice(1).toLowerCase()
                }))}
              />
              <Table
                columns={validationColumns}
                dataSource={validationRows}
                rowKey={(r, i) => `${r.email}-${r.row_index ?? i}`}
                size="small"
                loading={inviteesLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ y: 280 }}
              />
              {editable && (
                <Button
                  type="primary"
                  style={{ marginTop: 16 }}
                  loading={inviteesLoading}
                  disabled={(validationResult?.summary?.valid ?? 0) === 0}
                  onClick={handleSaveInvitees}
                >
                  Confirm & Save Invitees
                </Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  const previewTab = (
    <div>
      {!currentId ? (
        <Alert type="info" message="Create the invitation first." showIcon />
      ) : (
        <>
          <Space wrap style={{ marginBottom: 16 }}>
            <Select
              placeholder="Preview for invitee"
              style={{ minWidth: 220 }}
              value={previewInviteeId}
              onChange={setPreviewInviteeId}
              allowClear
              options={validInvitees.map((inv) => ({
                value: inv.id,
                label: `${inv.full_name} (${inv.email})`
              }))}
            />
            <Button icon={<EyeOutlined />} loading={previewLoading} onClick={handleLoadPreview}>
              Refresh Preview
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadPdf}>
              Download PDF
            </Button>
          </Space>

          {invitation?.has_template && (
            <Alert
              type="success"
              style={{ marginBottom: 12 }}
              message={`Custom template: ${invitation.invitation_template_filename}`}
              action={
                editable && (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={handleRemoveTemplate}>
                    Remove
                  </Button>
                )
              }
            />
          )}

          {editable && (
            <Space style={{ marginBottom: 16 }}>
              <input
                ref={templateInputRef}
                type="file"
                accept=".html,.htm"
                style={{ display: 'none' }}
                onChange={handleTemplateUpload}
              />
              <Button icon={<UploadOutlined />} onClick={() => templateInputRef.current?.click()}>
                Upload HTML Template
              </Button>
            </Space>
          )}

          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              minHeight: 400,
              background: '#fff'
            }}
          >
            {previewLoading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Text type="secondary">Loading preview…</Text>
              </div>
            ) : previewHtml ? (
              <iframe
                title="Invitation preview"
                srcDoc={previewHtml}
                style={{ width: '100%', height: 500, border: 'none' }}
              />
            ) : (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Text type="secondary">No preview loaded.</Text>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const sendTab = (
    <div>
      {!currentId ? (
        <Alert type="info" message="Create the invitation first." showIcon />
      ) : (
        <>
          <Card size="small" title="Send Test Email" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ width: 280 }}
              />
              <Button loading={sendLoading} onClick={handleSendTest}>
                Send Test
              </Button>
            </Space>
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              Sends one email with PDF. Does not update invitee send status.
            </Paragraph>
          </Card>

          <Card size="small" title="Schedule Send" style={{ marginBottom: 16 }}>
            <Space wrap>
              <DatePicker
                showTime
                value={scheduleAt}
                onChange={setScheduleAt}
                disabled={!editable || invitation?.status === INVITATION_STATUS.PROCESSING}
              />
              <Button
                loading={sendLoading}
                disabled={!editable}
                onClick={handleSchedule}
              >
                Schedule
              </Button>
            </Space>
          </Card>

          <Card size="small" title="Batch Send">
            <Space wrap>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sendLoading}
                disabled={
                  invitation?.status === INVITATION_STATUS.DRAFT ||
                  invitation?.status === INVITATION_STATUS.PROCESSING ||
                  invitation?.status === INVITATION_STATUS.COMPLETED ||
                  invitation?.status === INVITATION_STATUS.CANCELLED ||
                  (summary?.valid ?? invitation?.invitee_counts?.valid ?? 0) === 0
                }
                onClick={() => handleStartSend({ force: false })}
              >
                Send Now
              </Button>
              {invitation?.status === INVITATION_STATUS.SCHEDULED && (
                <Button loading={sendLoading} onClick={() => handleStartSend({ force: true })}>
                  Send Early (force)
                </Button>
              )}
              {(summary?.failed ?? 0) > 0 && (
                <Button loading={sendLoading} onClick={() => handleStartSend({ retry_failed: true })}>
                  Retry Failed
                </Button>
              )}
            </Space>
            {invitation?.status === INVITATION_STATUS.DRAFT && (
              <Alert
                type="warning"
                style={{ marginTop: 12 }}
                message="Upload and save valid invitees before sending."
                showIcon
              />
            )}
          </Card>
        </>
      )}
    </div>
  );

  const progressTab = (
    <div>
      {summary && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {[
              ['total', 'Total'],
              ['valid', 'Valid'],
              ['sent', 'Sent'],
              ['failed', 'Failed'],
              ['pending_send', 'Pending']
            ].map(([key, label]) => (
              <Col xs={12} sm={8} md={4} key={key}>
                <Card size="small">
                  <Statistic title={label} value={summary[key] ?? 0} />
                </Card>
              </Col>
            ))}
          </Row>
          {(summary.valid ?? 0) > 0 && (
            <Progress
              percent={Math.round(((summary.sent ?? 0) / summary.valid) * 100)}
              status={invitation?.status === INVITATION_STATUS.PROCESSING ? 'active' : 'normal'}
              style={{ marginBottom: 16 }}
            />
          )}
        </>
      )}
      {invitation?.status === INVITATION_STATUS.PROCESSING && (
        <Alert type="info" message="Sending in progress. This view refreshes automatically." showIcon />
      )}
      {failedInvitees.length > 0 && (
        <>
          <Title level={5}>Failed Sends</Title>
          <Table
            size="small"
            dataSource={failedInvitees}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Name', dataIndex: 'full_name' },
              { title: 'Email', dataIndex: 'email' },
              {
                title: 'Status',
                dataIndex: 'send_status',
                render: (val) => renderStatusTag(val, sendStatusColor)
              },
              { title: 'Error', dataIndex: 'error_message', ellipsis: true }
            ]}
          />
        </>
      )}
      <Button icon={<ReloadOutlined />} onClick={() => { loadSummary(); loadFailedInvitees(); }} style={{ marginTop: 16 }}>
        Refresh
      </Button>
    </div>
  );

  const tabItems = [
    { key: 'details', label: '1. Details', children: detailsTab, disabled: false },
    { key: 'invitees', label: '2. Invitees', children: inviteesTab, disabled: !currentId },
    {
      key: 'preview',
      label: '3. Preview',
      children: previewTab,
      disabled: !currentId
    },
    {
      key: 'send',
      label: '4. Send',
      children: sendTab,
      disabled: !currentId || invitation?.status === INVITATION_STATUS.DRAFT
    },
    {
      key: 'progress',
      label: 'Progress',
      children: progressTab,
      disabled: !currentId
    }
  ];

  return (
    <Spin spinning={loading && !isNew}>
    <div>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back to list
        </Button>
        <Title level={4} style={{ margin: 0, color: colors.textPrimary }}>
          {isNew ? 'New Invitation Campaign' : invitation?.title ?? 'Invitation'}
        </Title>
        {invitation?.status && renderStatusTag(invitation.status)}
      </div>

      <Steps current={currentStep()} items={stepItems} style={{ marginBottom: 24 }} />

      <div style={cardStyle}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      <Modal
        title="Create Trainer"
        open={trainerModalOpen}
        onCancel={() => setTrainerModalOpen(false)}
        onOk={handleCreateTrainer}
        confirmLoading={trainerSaving}
        destroyOnClose
      >
        <Form form={trainerForm} layout="vertical" preserve={false}>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="designation" label="Designation">
            <Input />
          </Form.Item>
          <Form.Item name="qualifications" label="Qualifications">
            <Input />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </Spin>
  );
};

export default InvitationCampaignView;

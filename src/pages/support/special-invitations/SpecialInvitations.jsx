import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Select,
  message,
  Popconfirm
} from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons';
import invitationsService from '../../../services/invitations';
import { formatDate } from '../../../utils/dateUtils';
import { useTheme } from '../../../contexts/ThemeContext';
import InvitationCampaignView from './InvitationCampaignView';
import {
  normalizeInvitationList,
  renderStatusTag,
  INVITATION_STATUS
} from './invitationHelpers.jsx';

const { Text } = Typography;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: INVITATION_STATUS.DRAFT, label: 'Draft' },
  { value: INVITATION_STATUS.VALIDATED, label: 'Validated' },
  { value: INVITATION_STATUS.SCHEDULED, label: 'Scheduled' },
  { value: INVITATION_STATUS.PROCESSING, label: 'Processing' },
  { value: INVITATION_STATUS.COMPLETED, label: 'Completed' },
  { value: INVITATION_STATUS.CANCELLED, label: 'Cancelled' }
];

const SpecialInvitations = () => {
  const { colors } = useTheme();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0 });
  const [activeInvitationId, setActiveInvitationId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invitationsService.getInvitations({
        page: pagination.page,
        per_page: pagination.per_page,
        ...(statusFilter && { status: statusFilter })
      });
      const { invitations: list, pagination: pag } = normalizeInvitationList(res);
      setInvitations(list);
      setPagination((prev) => ({
        ...prev,
        total: pag.total ?? list.length,
        page: pag.page ?? prev.page,
        per_page: pag.per_page ?? prev.per_page
      }));
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to fetch invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, statusFilter]);

  useEffect(() => {
    if (!activeInvitationId && !isCreating) fetchInvitations();
  }, [fetchInvitations, activeInvitationId, isCreating]);

  const handleCancel = async (id) => {
    try {
      await invitationsService.cancelInvitation(id);
      message.success('Invitation cancelled.');
      fetchInvitations();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const openCreate = () => {
    setIsCreating(true);
    setActiveInvitationId(null);
  };

  const openDetail = (id) => {
    setIsCreating(false);
    setActiveInvitationId(id);
  };

  const handleBack = () => {
    setActiveInvitationId(null);
    setIsCreating(false);
    fetchInvitations();
  };

  if (isCreating || activeInvitationId) {
    return (
      <InvitationCampaignView
        invitationId={isCreating ? null : activeInvitationId}
        onBack={handleBack}
        onChanged={fetchInvitations}
      />
    );
  }

  const cardStyle = {
    background: colors.card,
    padding: '24px',
    borderRadius: '8px',
    boxShadow: `0 2px 8px ${colors.boxShadow || 'rgba(0,0,0,0.15)'}`,
    border: `1px solid ${colors.border}`
  };

  const columns = [
    {
      title: '#',
      key: 'sn',
      width: 56,
      align: 'center',
      render: (_, __, index) => (pagination.page - 1) * pagination.per_page + index + 1
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (val) => <Text strong style={{ color: colors.textPrimary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Course',
      dataIndex: 'course_title',
      key: 'course_title',
      ellipsis: true,
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (val) => renderStatusTag(val)
    },
    {
      title: 'Invitees',
      key: 'invitees',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const counts = record.invitee_counts ?? {};
        return (
          <Text style={{ color: colors.textSecondary }}>
            {counts.valid != null ? `${counts.valid}/${counts.total ?? 0}` : '—'}
          </Text>
        );
      }
    },
    {
      title: 'Sent',
      key: 'sent',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Text style={{ color: colors.textSecondary }}>
          {record.invitee_counts?.sent ?? '—'}
        </Text>
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
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record.id)}
          />
          {record.status !== INVITATION_STATUS.PROCESSING &&
            record.status !== INVITATION_STATUS.CANCELLED &&
            record.status !== INVITATION_STATUS.COMPLETED && (
              <Popconfirm
                title="Cancel this invitation?"
                onConfirm={() => handleCancel(record.id)}
              >
                <Button type="text" size="small" danger icon={<StopOutlined />} />
              </Popconfirm>
            )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <Select
          placeholder="Filter by status"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter || undefined}
          onChange={(val) => {
            setStatusFilter(val || '');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          style={{ minWidth: 160 }}
          allowClear
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchInvitations} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Campaign
          </Button>
        </Space>
      </div>

      <div style={cardStyle}>
        <Table
          columns={columns}
          dataSource={invitations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, page, per_page: pageSize }));
            },
            showTotal: (total) => `Total ${total} campaigns`
          }}
          locale={{ emptyText: 'No invitation campaigns yet.' }}
        />
      </div>
    </div>
  );
};

export default SpecialInvitations;

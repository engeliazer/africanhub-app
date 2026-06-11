import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Tag,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  StarOutlined
} from '@ant-design/icons';
import accountingService from '../../services/accounting';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

const BANK_DETAILS_FIELDS = [
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'account_name', label: 'Account Name' },
  { key: 'account_number', label: 'Account Number' },
  { key: 'branch_code', label: 'Branch Code' },
  { key: 'swift_code', label: 'Swift Code' }
];

const BankDetails = () => {
  const { colors } = useTheme();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [setDefaultLoading, setSetDefaultLoading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getBankDetailsList();
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.data?.results ?? [];
      setList(data);
    } catch (err) {
      message.error(err?.message || 'Failed to fetch bank details');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleModalAfterOpenChange = (open) => {
    if (!open) return;
    if (editingRecord) {
      form.setFieldsValue({
        bank_name: editingRecord.bank_name ?? '',
        account_name: editingRecord.account_name ?? '',
        account_number: editingRecord.account_number ?? '',
        branch_code: editingRecord.branch_code ?? '',
        swift_code: editingRecord.swift_code ?? '',
        is_default: !!editingRecord.is_default
      });
    } else {
      form.setFieldsValue({ is_default: false });
    }
  };

  const handleSetDefault = async (record) => {
    if (record.is_default) return;
    setSetDefaultLoading(record.id);
    try {
      await accountingService.updateBankDetails(record.id, { is_default: true });
      message.success('Operating account updated');
      await fetchList();
    } catch (err) {
      message.error(err?.message || 'Failed to set operating account');
    } finally {
      setSetDefaultLoading(null);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        bank_name: values.bank_name,
        account_name: values.account_name,
        account_number: values.account_number,
        branch_code: values.branch_code,
        swift_code: values.swift_code ?? '',
        is_default: !!values.is_default
      };
      setSubmitLoading(true);
      if (editingId) {
        await accountingService.updateBankDetails(editingId, payload);
        message.success('Bank details updated');
      } else {
        await accountingService.createBankDetails(payload);
        message.success('Bank details created');
      }
      handleModalCancel();
      await fetchList();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to save bank details');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'Bank Name',
      dataIndex: 'bank_name',
      key: 'bank_name',
      render: (val) => <Text strong style={{ color: colors.textPrimary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Account Name',
      dataIndex: 'account_name',
      key: 'account_name',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Account Number',
      dataIndex: 'account_number',
      key: 'account_number',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Branch Code',
      dataIndex: 'branch_code',
      key: 'branch_code',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Swift Code',
      dataIndex: 'swift_code',
      key: 'swift_code',
      render: (val) => <Text style={{ color: colors.textSecondary }}>{val ?? '—'}</Text>
    },
    {
      title: 'Operating',
      dataIndex: 'is_default',
      key: 'is_default',
      align: 'center',
      render: (isDefault) =>
        isDefault ? (
          <Tag color="blue">Operating</Tag>
        ) : (
          <Text style={{ color: colors.textSecondary }}>—</Text>
        )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          {!record.is_default && (
            <Tooltip title="Set as operating account">
              <Button
                type="text"
                size="small"
                icon={<StarOutlined />}
                loading={setDefaultLoading === record.id}
                onClick={() => handleSetDefault(record)}
              />
            </Tooltip>
          )}
        </Space>
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

  return (
    <div
      style={{
        padding: '24px',
        background: colors.background,
        minHeight: '100vh'
      }}
    >
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <Title level={2} style={{ color: colors.textPrimary, margin: 0 }}>
            Bank Details
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchList} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Bank Details
            </Button>
          </Space>
        </div>
      </div>

      <div style={cardStyle}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bank accounts`
          }}
          locale={{ emptyText: 'No bank details yet. Add one to get started.' }}
        />
      </div>

      <Modal
        title={editingId ? 'Edit Bank Details' : 'Add Bank Details'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleModalCancel}
        afterOpenChange={handleModalAfterOpenChange}
        confirmLoading={submitLoading}
        okText={editingId ? 'Update' : 'Create'}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {BANK_DETAILS_FIELDS.map(({ key, label }) => (
            <Form.Item
              key={key}
              name={key}
              label={label}
              rules={[
                {
                  required: key !== 'swift_code',
                  message: `Please enter ${label.toLowerCase()}`
                }
              ]}
            >
              <Input placeholder={label} />
            </Form.Item>
          ))}
          <Form.Item
            name="is_default"
            label="Operating account"
            valuePropName="checked"
            extra="Only one account can be the operating account. Used for reconciliation and statements."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BankDetails;

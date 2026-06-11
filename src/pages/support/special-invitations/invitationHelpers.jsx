import React from 'react';
import { Tag, Typography } from 'antd';

const { Text } = Typography;

export const INVITATION_STATUS = {
  DRAFT: 'DRAFT',
  VALIDATED: 'VALIDATED',
  SCHEDULED: 'SCHEDULED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const EDITABLE_STATUSES = [
  INVITATION_STATUS.DRAFT,
  INVITATION_STATUS.VALIDATED,
  INVITATION_STATUS.SCHEDULED
];

export const isEditableInvitation = (status) => EDITABLE_STATUSES.includes(status);

export const unwrapData = (res) => res?.data ?? res;

export const normalizeInvitationList = (res) => {
  const data = unwrapData(res);
  if (Array.isArray(data?.invitations)) {
    return {
      invitations: data.invitations,
      pagination: data.pagination ?? {}
    };
  }
  if (Array.isArray(data)) return { invitations: data, pagination: {} };
  return { invitations: [], pagination: {} };
};

export const invitationStatusColor = (status) => {
  switch (status) {
    case INVITATION_STATUS.VALIDATED:
      return 'blue';
    case INVITATION_STATUS.SCHEDULED:
      return 'orange';
    case INVITATION_STATUS.PROCESSING:
      return 'processing';
    case INVITATION_STATUS.COMPLETED:
      return 'green';
    case INVITATION_STATUS.CANCELLED:
      return 'red';
    default:
      return 'default';
  }
};

export const validationStatusColor = (status) => {
  switch (status) {
    case 'VALID':
      return 'green';
    case 'INVALID':
      return 'red';
    case 'DUPLICATE':
      return 'orange';
    default:
      return 'default';
  }
};

export const sendStatusColor = (status) => {
  switch (status) {
    case 'SENT':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'SENDING':
      return 'processing';
    default:
      return 'blue';
  }
};

export const renderStatusTag = (status, colorFn = invitationStatusColor) => {
  if (!status) return <Text type="secondary">—</Text>;
  return <Tag color={colorFn(status)}>{status}</Tag>;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

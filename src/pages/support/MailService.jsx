import React from 'react';
import { Typography, Tabs } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import BasicMail from './BasicMail';
import SpecialInvitations from './special-invitations/SpecialInvitations';

const { Title } = Typography;

const MailService = () => {
  const { colors } = useTheme();

  const tabItems = [
    {
      key: 'basic-mail',
      label: 'Basic Mail',
      children: <BasicMail />
    },
    {
      key: 'special-invitations',
      label: 'Special Invitations',
      children: <SpecialInvitations />
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
        Mail Service
      </Title>

      <Tabs defaultActiveKey="basic-mail" items={tabItems} />
    </div>
  );
};

export default MailService;

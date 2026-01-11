import React from 'react';
import { Card, Typography } from 'antd';
import AdminChat from '../../components/AdminChat';

const { Title } = Typography;

const ChatManagement = () => {
  return (
    <div>
      <Title level={2}>Chat Management</Title>
      <Card>
        <AdminChat isFullPage={true} />
      </Card>
    </div>
  );
};

export default ChatManagement; 
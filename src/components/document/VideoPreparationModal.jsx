import React from 'react';
import { Modal, Progress, Typography, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

const { Text } = Typography;

const VideoPreparationModal = ({ visible, progress, fileName }) => {
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title={
        <Space>
          <VideoCameraOutlined />
          <span>Preparing Video</span>
        </Space>
      }
      open={visible}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center' }}>
        <Text strong style={{ display: 'block', marginBottom: 16 }}>
          {fileName}
        </Text>
        <Progress 
          percent={Math.round(progress.percent)} 
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <Space direction="vertical" style={{ marginTop: 16 }}>
          <Text>
            Processed: {formatBytes(progress.loaded)}
          </Text>
          <Text>
            Total: {formatBytes(progress.total)}
          </Text>
        </Space>
      </div>
    </Modal>
  );
};

export default VideoPreparationModal; 
import React from 'react';
import { Modal, Progress, Typography, Space } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined, VideoCameraOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LoadingProgressModal = ({ visible, progress, fileName, title, mode = 'upload' }) => {
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getModalConfig = () => {
    switch (mode) {
      case 'download':
        return {
          icon: <CloudDownloadOutlined />,
          title: 'Downloading Video',
          progressText: 'Downloaded'
        };
      case 'prepare':
        return {
          icon: <VideoCameraOutlined />,
          title: 'Preparing Video',
          progressText: 'Processed'
        };
      case 'upload':
      default:
        return {
          icon: <CloudUploadOutlined />,
          title: 'Uploading Video',
          progressText: 'Uploaded'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      title={
        <Space>
          {config.icon}
          <span>{config.title}</span>
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
            {config.progressText}: {formatBytes(progress.loaded)}
          </Text>
          <Text>
            Total: {formatBytes(progress.total)}
          </Text>
        </Space>
      </div>
    </Modal>
  );
};

export default LoadingProgressModal; 
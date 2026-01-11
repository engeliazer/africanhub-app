import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, Progress, message, Space, Alert } from 'antd';
import { UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import subtopicMaterialsService from '../../services/subtopicMaterials';

const HlsVideoUpload = ({ visible, onCancel, onSuccess, subtopicId, categoryId }) => {
  const [form] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (info) => {
    console.log('File change info:', info);
    
    if (info.file.status === 'removed') {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Get the file from fileList
    if (info.fileList && info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      console.log('Setting file from fileList:', file);
      setSelectedFile(file);
      
      // Create a preview URL for the video
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Add effect to log state changes
  useEffect(() => {
    console.log('Selected file state:', selectedFile);
    console.log('Uploading state:', uploading);
  }, [selectedFile, uploading]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Selected file in submit:', selectedFile);
      
      if (!selectedFile) {
        message.error('Please select a video file');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('subtopic_id', subtopicId);
      formData.append('material_category_id', categoryId);
      formData.append('name', values.name);
      formData.append('file', selectedFile);
      formData.append('created_by', 1);
      formData.append('updated_by', 1);

      // Get video duration
      const videoDuration = await getVideoDuration(selectedFile);
      formData.append('video_duration', videoDuration);

      // Log the form data contents
      console.log('Form data contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      // Upload to VdoCipher for DRM protection
      const response = await subtopicMaterialsService.createVdoCipherMaterial(formData, (progress) => {
        if (progress.percent >= 100) {
          // When upload is complete, show processing state
          setUploadProgress(100);
          setProcessing(true);
        } else {
          setUploadProgress(progress.percent);
        }
      });

      message.success('Video uploaded! Processing will take a few minutes.');
      onSuccess(response);
      handleCancel();
    } catch (error) {
      console.error('Error uploading video:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        message.error(error.response.data.error || error.response.data.message || 'Failed to upload video');
      } else {
        message.error(error.message || 'Failed to upload video');
      }
    } finally {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        // Format duration as HH:MM:SS
        const hours = Math.floor(video.duration / 3600);
        const minutes = Math.floor((video.duration % 3600) / 60);
        const seconds = Math.floor(video.duration % 60);
        const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        resolve(formattedDuration);
      };
      video.onerror = () => {
        reject(new Error('Error loading video file'));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    form.resetFields();
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <VideoCameraOutlined />
          <span>Upload Video</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={uploading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={uploading}
          onClick={handleSubmit}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (processing ? 'Processing...' : 'Uploading...') : 'Upload'}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Video Name"
          rules={[{ required: true, message: 'Please enter video name' }]}
        >
          <Input placeholder="Enter video name" />
        </Form.Item>

        <Form.Item
          label="Video File"
          required
        >
          <Upload
            accept="video/mp4"
            maxCount={1}
            beforeUpload={() => false}
            onChange={handleFileChange}
            onRemove={() => {
              setSelectedFile(null);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>Select Video</Button>
          </Upload>
        </Form.Item>

        {previewUrl && (
          <div style={{ marginBottom: 16 }}>
            <video 
              controls 
              style={{ width: '100%', maxHeight: '200px' }}
              src={previewUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {uploadProgress > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Progress 
              percent={uploadProgress} 
              status={processing ? "active" : (uploadProgress >= 100 ? "success" : "active")} 
              format={(percent) => processing ? 'Processing...' : `${percent}%`}
            />
            {processing && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Alert
                  message="Uploading..."
                  description="Your video is being uploaded. This may take some time depending on the video size."
                  type="warning"
                  showIcon
                />
              </div>
            )}
          </div>
        )}

        <Alert
          message="Video Upload"
          description="Videos are uploaded. After upload, The system will process your video (5-15 minutes). The video will be protected against screen recording and unauthorized downloads."
          type="info"
          showIcon
        />
      </Form>
    </Modal>
  );
};

export default HlsVideoUpload; 
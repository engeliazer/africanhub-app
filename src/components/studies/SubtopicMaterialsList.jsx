import React, { useState, useEffect, useCallback, useRef } from 'react';
import { List, Card, Button, Modal, message, Spin, Alert, Tag, Empty, Space } from 'antd';
import { PlayCircleOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileUnknownOutlined } from '@ant-design/icons';
import subtopicMaterialsService from '../../services/subtopicMaterials';
import { getTokenLocal } from '../../services/utils/authorization';

const SubtopicMaterialsList = ({ subtopicId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviceVerification, setDeviceVerification] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchMaterials = useCallback(async () => {
    if (!subtopicId || !isMountedRef.current) {
      console.log('Skipping fetch - no subtopicId or component unmounted');
      return;
    }

    try {
      console.log('Starting to fetch materials for subtopic:', subtopicId);
      setLoading(true);
      setError(null);

      const response = await subtopicMaterialsService.getMaterials(subtopicId);

      if (!isMountedRef.current) return;

      console.log('API response:', response);
      
      // Store device verification info
      if (response.device_verification) {
        setDeviceVerification(response.device_verification);
      }
      
      // Check if we have a valid response with items
      if (response?.data?.items && Array.isArray(response.data.items)) {
        console.log('Found items array:', response.data.items);
        setMaterials(response.data.items);
      } else {
        console.log('No valid items array found in response');
        setMaterials([]);
      }
      
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching materials:', error);
        let errorMessage = 'Failed to load materials';
        
        // Handle specific error cases
        if (error.message.includes('fingerprint')) {
          errorMessage = 'Unable to generate device fingerprint. Please try again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        }
        
        setError(errorMessage);
        setMaterials([]);
      }
    } finally {
      if (isMountedRef.current) {
        console.log('Setting loading to false');
        setLoading(false);
      }
    }
  }, [subtopicId]);

  useEffect(() => {
    console.log('Effect triggered with subtopicId:', subtopicId);
    fetchMaterials();
  }, [fetchMaterials]);

  const getFileIcon = (extension) => {
    switch (extension?.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined className="text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined className="text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <PlayCircleOutlined className="text-blue-500" />;
      default:
        return <FileUnknownOutlined className="text-gray-500" />;
    }
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    setIsModalVisible(true);
  };

  const handleDownload = async (file) => {
    try {
      const token = getTokenLocal();
      if (!token) {
        throw new Error('Authorization token not found. Please log in again.');
      }

      const response = await fetch(file.material_path, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Failed to download file');
    }
  };

  if (deviceVerification && !deviceVerification.is_authorized) {
    return (
      <Alert
        message={deviceVerification.message}
        type="warning"
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-8">
        <Empty
          description="No materials available for this subtopic"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => (
          <Card
            key={material.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => handleMaterialClick(material)}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {getFileIcon(material.extension_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {material.name}
                </div>
                <div className="text-xs text-gray-500">
                  {material.extension_type?.toUpperCase()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        title="Resource Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => handleDownload(selectedMaterial)}
          >
            Download
          </Button>
        ]}
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedMaterial.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedMaterial.extension_type?.toUpperCase()}</p>
            </div>
            {selectedMaterial.file_size && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Size</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {(selectedMaterial.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            {selectedMaterial.video_duration && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {Math.floor(selectedMaterial.video_duration / 60)}:{(selectedMaterial.video_duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubtopicMaterialsList; 
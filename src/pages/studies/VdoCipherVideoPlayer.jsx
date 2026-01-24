import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import VdoCipherPlayer from '../../components/document/VdoCipherPlayer';

/**
 * Dedicated page for VdoCipher video playback
 * Opens in a new tab for testing purposes
 */
const VdoCipherVideoPlayer = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const materialName = new URLSearchParams(window.location.search).get('name') || 'Video';
  const [videoData, setVideoData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [watermarkText, setWatermarkText] = useState('');

  // Get user info for watermark
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User';
      const userEmail = userInfo.email || 'Unknown';
      const userId = userInfo.id || 'Unknown';
      const timestamp = new Date().toLocaleString();
      setWatermarkText(`${userName} (${userEmail}) - ID: ${userId} - ${timestamp}`);
    } catch (err) {
      console.error('Error getting user info:', err);
      setWatermarkText('User - Unknown');
    }
  }, []);

  // Track window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Callback to receive videoData from VdoCipherPlayer
  const handleVideoDataLoaded = (data) => {
    setVideoData(data);
  };

  // No need to load script here - VdoCipherPlayer component handles it

  const handleVideoEnd = () => {
    console.log('Video playback completed');
  };

  const handleError = (error) => {
    console.error('Video player error:', error);
  };

  const handleBack = () => {
    // Prefer explicit "from" route if provided via navigation state
    const from = location.state?.from;

    if (from) {
      navigate(from);
      return;
    }

    // Fallback: use browser history
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    // If opened in a standalone tab without history, try to close it
    window.close();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000',
      padding: 0
    }}>
      {/* Header */}
      <div style={{ 
        background: '#141414', 
        padding: isMobile ? '8px 12px' : '12px 24px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <Space>
          <Button 
            type="text"
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            style={{ 
              color: '#fff',
              padding: '0 12px',
              height: 32
            }}
          >
            Back
          </Button>
        </Space>
        
        {/* Video Title, Duration, and User Identity - Right Side */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: '4px',
          flex: 1,
          minWidth: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'flex-start' : 'flex-end'
          }}>
            <div style={{ 
              color: '#fff', 
              fontSize: isMobile ? '14px' : '16px', 
              fontWeight: 500,
              wordBreak: 'break-word',
              textAlign: isMobile ? 'left' : 'right'
            }}>
              {materialName || videoData?.name || 'Video'}
            </div>
            {videoData?.duration && (
              <div style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                color: '#999',
                whiteSpace: 'nowrap'
              }}>
                {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')} min
              </div>
            )}
          </div>
          {watermarkText && (
            <div style={{ 
              fontSize: isMobile ? '9px' : '10px', 
              color: '#999',
              textAlign: isMobile ? 'left' : 'right',
              wordBreak: 'break-word',
              lineHeight: '1.2'
            }}>
              {watermarkText}
            </div>
          )}
        </div>
      </div>

      {/* Player Container */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '24px'
      }}>
        <Card 
          style={{ 
            background: '#000',
            border: 'none'
          }}
          bodyStyle={{ padding: 0 }}
        >
          <VdoCipherPlayer
            materialId={materialId}
            materialName={materialName}
            onVideoEnd={handleVideoEnd}
            onError={handleError}
            onVideoDataLoaded={handleVideoDataLoaded}
          />
        </Card>

        {/* Info Section */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#141414',
          borderRadius: 8,
          color: '#fff'
        }}>
          <h3 style={{ color: '#fff', marginTop: 0 }}>🔒 African Hub</h3>
         
        </div>
      </div>
    </div>
  );
};

export default VdoCipherVideoPlayer;


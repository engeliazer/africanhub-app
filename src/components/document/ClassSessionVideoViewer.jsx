import React, { useEffect, useRef, useState } from 'react';
import { Card, Space, Select, Button, message } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const ClassSessionVideoViewer = ({ 
  currentFileUrl, 
  currentFileName, 
  currentCategoryId,
  categories,
  resolutions = ['240p', '360p', '480p', '720p', '1080p']
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState('720p');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  // Check if the video is protected based on category
  const isProtected = currentCategoryId && categories ? 
    Boolean(categories.find(c => c.id === currentCategoryId)?.is_protected) : false;

  // Get the actual video URL
  const getVideoUrl = () => {
    console.log('getVideoUrl input:', currentFileUrl);
    
    if (typeof currentFileUrl === 'string') {
      console.log('Direct URL:', currentFileUrl);
      return currentFileUrl;
    }
    
    // If currentFileUrl is an object from ClassSession.jsx
    if (currentFileUrl?.files?.[0]?.path) {
      console.log('Nested path:', currentFileUrl.files[0].path);
      return currentFileUrl.files[0].path;
    }
    
    // If currentFileUrl is an object from SubtopicMaterialsList.jsx
    if (currentFileUrl?.material_path) {
      console.log('Flat path:', currentFileUrl.material_path);
      return currentFileUrl.material_path;
    }
    
    console.log('No valid URL found in:', currentFileUrl);
    return null;
  };

  // Fetch video and create blob URL
  const fetchVideo = async (path) => {
    try {
      console.log('Fetching video from path:', path);
      const response = await axios.get(path, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);
      return url;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  };

  useEffect(() => {
    const setupVideo = async () => {
      try {
        const path = getVideoUrl();
        if (!path) {
          setError('No valid video URL found');
          return;
        }

        console.log('Setting up video with path:', path);
        const url = await fetchVideo(path);
        setVideoUrl(url);

        if (videoRef.current) {
          const video = videoRef.current;
          
          // Add event listeners
          video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded:', {
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              src: video.src,
              currentSrc: video.currentSrc
            });
            setDuration(video.duration);
            setIsLoading(false);
            setError(null);
          });

          video.addEventListener('timeupdate', () => {
            setCurrentTime(video.currentTime);
          });

          video.addEventListener('error', (e) => {
            const errorDetails = {
              error: video.error,
              networkState: video.networkState,
              readyState: video.readyState,
              src: video.src,
              currentSrc: video.currentSrc
            };
            console.error('Video Error Details:', errorDetails);
            
            let errorMessage = 'Error loading video. Please try again.';
            if (video.error) {
              switch (video.error.code) {
                case 1:
                  errorMessage = 'Video loading was aborted.';
                  break;
                case 2:
                  errorMessage = 'Network error occurred while loading the video.';
                  break;
                case 3:
                  errorMessage = 'Video decoding failed. The video format may not be supported.';
                  break;
                case 4:
                  errorMessage = 'Video source is not supported. Please try a different format.';
                  break;
                default:
                  errorMessage = `Error loading video: ${video.error.message}`;
              }
            }
            
            setError(errorMessage);
            message.error(errorMessage);
          });

          // Set video source
          console.log('Setting video source:', url);
          video.src = url;
        }
      } catch (error) {
        console.error('Error in setupVideo:', error);
        setError('Failed to load video. Please try again.');
        message.error('Failed to load video. Please try again.');
      }
    };

    setupVideo();

    return () => {
      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.src = '';
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [currentFileUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing video:', error);
            message.error('Error playing video. Please try again.');
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleResolutionChange = (value) => {
    setSelectedResolution(value);
    console.log('Resolution changed to:', value);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#ff4d4f', margin: 0 }}>{error}</p>
          </div>
        )}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            backgroundColor: '#000',
            borderRadius: '4px'
          }}
          controls
          playsInline
          preload="auto"
        >
          Your browser does not support the video tag.
        </video>

        <div style={{ marginTop: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </Space>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  color: '#00ff00', 
                  fontSize: '14px', 
                  marginBottom: '4px',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '2px solid #00ff00'
                }}>
                  🏫 CLASS-QUALITY 🏫
                </div>
                <Select
                  value={selectedResolution}
                  onChange={handleResolutionChange}
                  options={resolutions.map(res => ({ value: res, label: res }))}
                  style={{ width: 120 }}
                />
              </div>
            </div>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ClassSessionVideoViewer; 
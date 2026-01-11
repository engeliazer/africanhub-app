import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Spin, Alert, message } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  
  /* Make it harder to screen record */
  -webkit-filter: contrast(1.001);
  filter: contrast(1.001);
  
  /* Add a subtle pattern that's hard to record */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.01) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(255,255,255,0.01) 25%, transparent 25%);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 1;
  }
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
  
  /* Additional protection against screen recording */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  /* Disable right-click */
  -webkit-context-menu: none;
  -moz-context-menu: none;
  -ms-context-menu: none;
  context-menu: none;
`;

const VideoViewer = ({ videoUrl, title, onTimeUpdate, onEnded, onError }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Function to handle screen recording detection
    const handleScreenRecording = async () => {
      try {
        // Check if screen is being shared
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (stream) {
          setIsScreenRecording(true);
          video.pause();
          message.error('Screen recording is not allowed while watching this video');
          
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.log('Screen recording check failed:', err);
      }
    };

    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        video.pause();
        setIsPlaying(false);
        message.warning('Video paused: Tab must be visible to play');
      }
    };

    // Function to handle fullscreen change
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPlaying) {
        video.pause();
        setIsPlaying(false);
        message.warning('Video paused: Must be in fullscreen to play');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Check for screen recording periodically
    const recordingCheckInterval = setInterval(handleScreenRecording, 1000);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(recordingCheckInterval);
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Check if we're in fullscreen
      if (!document.fullscreenElement) {
        message.warning('Please enter fullscreen mode to play the video');
        return;
      }
      
      // Check if tab is visible
      if (document.hidden) {
        message.warning('Tab must be visible to play the video');
        return;
      }

      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        await video.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      message.error('Failed to toggle fullscreen mode');
    }
  };

  return (
    <Card>
      <Title level={4}>🛡️ PROTECTED-VIDEO: {title} 🛡️</Title>
      <VideoContainer>
        <Video
          ref={videoRef}
          src={videoUrl}
          controls={false}
          onTimeUpdate={() => onTimeUpdate?.(videoRef.current?.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
          onError={(e) => {
            setError('Error loading video');
            onError?.(e);
          }}
          onLoadedData={() => setIsLoading(false)}
          onClick={handlePlayPause}
          onDoubleClick={handleFullscreen}
        />
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        )}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </VideoContainer>
    </Card>
  );
};

export default VideoViewer; 
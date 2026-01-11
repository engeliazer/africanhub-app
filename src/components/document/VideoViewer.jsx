import React, { useState, useRef, useEffect } from 'react';
import { Slider, Select, Button, Space, Tooltip, message, Progress } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  FullscreenOutlined, 
  SoundOutlined, 
  DownloadOutlined, 
  ExpandOutlined, 
  LockOutlined
} from '@ant-design/icons';

const { Option } = Select;

const VideoViewer = ({ 
  currentFileUrl, 
  currentFileName, 
  currentCategoryId, 
  categories, 
  resolution = 'auto',  // Default resolution
  resolutions = []      // Available resolutions for this video
}) => {
  // Add detailed console logging of all parameters
  console.log('VideoViewer Received Parameters:', {
    currentFileUrl,
    currentFileName,
    currentCategoryId,
    categories,
    resolution,
    resolutions,
    isProtected: currentCategoryId && categories ? 
      categories.find(c => c.id === currentCategoryId)?.is_protected : false
  });

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState(resolution);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    total: 0,
    loaded: 0,
    buffered: 0
  });
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoSize, setVideoSize] = useState(0);
  
  // Log video element state when it changes
  useEffect(() => {
    if (videoRef.current) {
      console.log('Video Element State:', {
        src: videoRef.current.src,
        currentSrc: videoRef.current.currentSrc,
        readyState: videoRef.current.readyState,
        error: videoRef.current.error,
        networkState: videoRef.current.networkState,
        paused: videoRef.current.paused,
        ended: videoRef.current.ended,
        seeking: videoRef.current.seeking,
        duration: videoRef.current.duration,
        currentTime: videoRef.current.currentTime,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight
      });
    }
  }, [currentFileUrl]);

  // Add more detailed logging for video source
  useEffect(() => {
    console.log('Video Source Details:', {
      currentFileUrl,
      videoElement: videoRef.current,
      isVideoLoaded: videoRef.current?.readyState === 4,
      videoError: videoRef.current?.error,
      videoNetworkState: videoRef.current?.networkState,
      videoSrc: videoRef.current?.src,
      videoCurrentSrc: videoRef.current?.currentSrc
    });
  }, [currentFileUrl]);

  // Add more detailed logging for categories
  useEffect(() => {
    console.log('Categories Debug:', {
      categories,
      categoriesLength: categories?.length,
      categoriesType: typeof categories,
      isArray: Array.isArray(categories),
      currentCategoryId,
      currentCategoryIdType: typeof currentCategoryId,
      foundCategory: categories?.find(c => c.id === currentCategoryId),
      allCategories: categories?.map(c => ({
        id: c.id,
        name: c.name,
        is_protected: c.is_protected,
        type: typeof c.is_protected
      }))
    });
  }, [categories, currentCategoryId]);

  // Determine if the video is protected based on category
  const isProtected = currentCategoryId && categories ? 
    Boolean(categories.find(c => c.id === currentCategoryId)?.is_protected) : false;

  // Add more detailed logging
  useEffect(() => {
    console.log('VideoViewer Category Details:', {
      currentCategoryId,
      categories,
      foundCategory: categories?.find(c => c.id === currentCategoryId),
      isProtected,
      rawIsProtected: categories?.find(c => c.id === currentCategoryId)?.is_protected
    });
  }, [currentCategoryId, categories]);

  // Control timer for hiding controls
  const controlsTimerRef = useRef(null);

  // Add event listeners to the video element
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handlePlay = () => {
      console.log('Video Play Event');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('Video Pause Event');
      setIsPlaying(false);
    };
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleLoadedMetadata = () => {
      console.log('Video Metadata Loaded:', {
        duration: videoElement.duration,
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        readyState: videoElement.readyState
      });
      setDuration(videoElement.duration);
      // Try autoplay
      videoElement.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
    };
    const handleError = (e) => {
      console.error('Video Error:', {
        error: videoElement.error,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState
      });
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
    };
  }, [currentFileUrl]);

  // Add control visibility handlers
  useEffect(() => {
    const hideControls = () => {
      if (!videoRef.current?.paused) {
        setShowControls(false);
      }
    };

    const container = videoContainerRef.current;
    
    if (container) {
      container.addEventListener('mousemove', () => {
        setShowControls(true);
        
        // Reset timer
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        
        // Hide controls after 3 seconds of inactivity
        if (!videoRef.current?.paused) {
          controlsTimerRef.current = setTimeout(hideControls, 3000);
        }
      });
      
      container.addEventListener('mouseleave', () => {
        if (!videoRef.current?.paused) {
          hideControls();
        }
      });
    }
    
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      
      if (container) {
        container.removeEventListener('mousemove', () => {});
        container.removeEventListener('mouseleave', () => {});
      }
    };
  }, []);

  // Add keyboard shortcuts for video control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;
      
      // Skip if user is typing in an input field
      if (e.target.tagName.toLowerCase() === 'input' || 
          e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }
      
      switch (e.key) {
        case ' ':  // Space bar - play/pause
          togglePlay();
          e.preventDefault();
          break;
        case 'ArrowRight':  // Right arrow - forward 5 seconds
          videoRef.current.currentTime += 5;
          e.preventDefault();
          break;
        case 'ArrowLeft':  // Left arrow - back 5 seconds
          videoRef.current.currentTime -= 5;
          e.preventDefault();
          break;
        case 'f':  // F key - fullscreen
          toggleFullscreen();
          e.preventDefault();
          break;
        case 'm':  // M key - mute/unmute
          videoRef.current.muted = !videoRef.current.muted;
          setVolume(videoRef.current.muted ? 0 : 1);
          e.preventDefault();
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Set up video protection for protected videos
  useEffect(() => {
    if (isProtected) {
      const preventContextMenu = (e) => e.preventDefault();
      const preventKeyboardShortcuts = (e) => {
        if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
          e.preventDefault();
          return false;
        }
      };
      
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('keydown', preventKeyboardShortcuts);
      
      return () => {
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('keydown', preventKeyboardShortcuts);
      };
    }
  }, [isProtected]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleTimeChange = (value) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = value;
    videoRef.current.muted = value === 0;
    setVolume(value);
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    
    if (!container) return;
    
    if (!document.fullscreenElement) {
      // Try different fullscreen methods for browser compatibility
      const requestFullscreen = container.requestFullscreen || 
                                container.webkitRequestFullscreen || 
                                container.mozRequestFullScreen || 
                                container.msRequestFullscreen;
      
      if (requestFullscreen) {
        requestFullscreen.call(container).catch(err => {
          console.error('Fullscreen error:', err);
          message.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        message.error('Fullscreen is not supported in this browser');
      }
    } else {
      // Try different exit fullscreen methods
      const exitFullscreen = document.exitFullscreen || 
                            document.webkitExitFullscreen || 
                            document.mozCancelFullScreen || 
                            document.msExitFullscreen;
      
      if (exitFullscreen) {
        exitFullscreen.call(document);
      }
    }
  };

  const handleDownload = () => {
    if (isProtected) {
      message.warning('This video is protected and cannot be downloaded');
      return;
    }
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = currentFileUrl;
    link.download = currentFileName || 'video';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const changeResolution = (newResolution) => {
    setLoading(true);
    setSelectedResolution(newResolution);
    
    // In a real implementation, you would:
    // 1. Save the current playback position
    // 2. Load the new resolution video
    // 3. Restore the playback position
    // 4. Resume playback if it was playing
    
    // For this example, we'll simulate this with a timeout
    setTimeout(() => {
      setLoading(false);
      message.success(`Resolution changed to ${newResolution}`);
    }, 1000);
  };

  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Detect video format from URL or file
  const detectVideoFormat = () => {
    if (!currentFileUrl) return 'unknown';
    
    // Check for common video extensions
    const url = currentFileUrl.toLowerCase();
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    if (url.includes('.ogg')) return 'ogg';
    if (url.includes('.mov')) return 'mov';
    if (url.includes('.avi')) return 'avi';
    if (url.includes('.mkv')) return 'mkv';
    
    // If extension isn't in URL, try to get it from the filename
    if (currentFileName) {
      const fileName = currentFileName.toLowerCase();
      if (fileName.endsWith('.mp4')) return 'mp4';
      if (fileName.endsWith('.webm')) return 'webm';
      if (fileName.endsWith('.ogg')) return 'ogg';
      if (fileName.endsWith('.mov')) return 'mov';
      if (fileName.endsWith('.avi')) return 'avi';
      if (fileName.endsWith('.mkv')) return 'mkv';
    }
    
    return 'unknown';
  };

  // Get available resolutions based on video format
  const getAvailableResolutions = () => {
    // If resolutions are provided via props, use those
    if (resolutions && resolutions.length > 0) {
      return resolutions;
    }
    
    // Otherwise suggest common resolutions based on video format
    const videoFormat = detectVideoFormat();
    
    // Most streaming platforms offer these resolutions for MP4 and WebM
    if (videoFormat === 'mp4' || videoFormat === 'webm') {
      return ['240p', '360p', '480p', '720p', '1080p'];
    }
    
    // For older formats, fewer resolutions might be available
    if (videoFormat === 'avi' || videoFormat === 'mov') {
      return ['360p', '480p', '720p'];
    }
    
    // Return a default set for unknown formats
    return ['360p', '480p', '720p'];
  };
  
  // Get actual available resolutions
  const availableResolutions = getAvailableResolutions();

  // Add progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = (event) => {
      if (event.lengthComputable) {
        setLoadingProgress(prev => ({
          ...prev,
          total: event.total,
          loaded: event.loaded
        }));
      }
    };

    const handleTimeUpdate = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        setLoadingProgress(prev => ({
          ...prev,
          buffered: (bufferedEnd / duration) * 100
        }));
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('progress', handleProgress);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    // Get video size
    fetch(currentFileUrl, { method: 'HEAD' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          setVideoSize(parseInt(contentLength, 10));
        }
      })
      .catch(error => console.error('Error fetching video size:', error));

    return () => {
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [currentFileUrl]);

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div 
      ref={videoContainerRef}
      className={`video-viewer ${isProtected ? 'protected-video' : ''}`}
      style={{ width: '100%', height: '85vh', position: 'relative', backgroundColor: '#000' }}
    >
      {/* Protection overlay for protected videos */}
      {isProtected && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { display: none !important; }
            body:after {
              content: "Printing is not allowed for protected videos";
              display: block !important;
            }
          }
          .protected-video {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }
        `}} />
      )}
      
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentFileUrl}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          opacity: loading ? 0.5 : 1
        }}
        controlsList="nodownload"
        disablePictureInPicture={isProtected}
        onClick={togglePlay}
      />
      
      {/* Watermark Overlay for Protected Videos */}
      {isProtected && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          opacity: 0.3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          overflow: 'hidden'
        }}>
          {/* Generate multiple watermark rows diagonally */}
          {Array(5).fill().map((_, i) => (
            <div 
              key={i}
              style={{
                transform: 'rotate(-30deg)',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: i % 2 === 0 ? '40px' : '0px',
                whiteSpace: 'nowrap'
              }}
            >
              {Array(3).fill().map((_, j) => (
                <span key={j}>DCRC </span>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {/* Enhanced Loading Indicator */}
      {(loading || isBuffering) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '8px',
          width: '300px',
          color: 'white'
        }}>
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            {loading ? 'Loading video...' : 'Buffering...'}
          </div>
          
          {/* Download Progress */}
          {loading && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Downloading:</span>
                <span>{formatBytes(loadingProgress.loaded)} / {formatBytes(loadingProgress.total)}</span>
              </div>
              <Progress 
                percent={Math.round((loadingProgress.loaded / loadingProgress.total) * 100)} 
                size="small"
                status="active"
              />
            </div>
          )}

          {/* Buffer Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Buffered:</span>
              <span>{Math.round(loadingProgress.buffered)}%</span>
            </div>
            <Progress 
              percent={loadingProgress.buffered} 
              size="small"
              status={isBuffering ? "active" : "normal"}
            />
          </div>

          {/* Video Size */}
          {videoSize > 0 && (
            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px' }}>
              Total Size: {formatBytes(videoSize)}
            </div>
          )}
        </div>
      )}
      
      {/* Custom Controls */}
      <div 
        className="video-controls"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          display: showControls ? 'block' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      >
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <Slider 
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleTimeChange}
            tooltip={{ formatter: formatTime }}
            style={{ marginBottom: 0 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button 
              type="text" 
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={togglePlay}
              style={{ color: 'white' }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', width: '100px' }}>
              <SoundOutlined style={{ color: 'white', marginRight: '8px' }} />
              <Slider 
                value={volume} 
                min={0} 
                max={1} 
                step={0.1} 
                onChange={handleVolumeChange}
                style={{ width: '60px' }}
                tooltip={{ formatter: value => `${Math.round(value * 100)}%` }}
              />
            </div>
          </Space>
          
          <Space>
            {/* Resolution selector */}
            {availableResolutions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ 
                  color: 'white', 
                  fontSize: '12px', 
                  marginBottom: '4px',
                  fontWeight: 'bold'
                }}>
                  🎥 REGULAR-QUALITY 🎥
                </span>
                <Select 
                  value={selectedResolution} 
                  onChange={changeResolution}
                  style={{ width: '100px' }}
                  popupMatchSelectWidth={false}
                  placeholder="Quality"
                  title="Video Quality Selector - Resolution Options"
                >
                <Option value="auto">Auto</Option>
                {availableResolutions.map(res => (
                  <Option key={res} value={res}>{res}</Option>
                ))}
              </Select>
              </div>
            )}
            
            {/* Video format indicator */}
            <Tooltip title={`Video format: ${detectVideoFormat().toUpperCase()}`}>
              <div style={{ 
                color: 'white', 
                fontSize: '12px',
                padding: '0 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                marginRight: '8px'
              }}>
                {detectVideoFormat().toUpperCase()}
              </div>
            </Tooltip>
            
            {/* Download button (disabled for protected videos) */}
            {isProtected ? (
              <Tooltip title="This video is protected">
                <Button
                  type="text"
                  icon={<LockOutlined />}
                  style={{ color: 'white' }}
                  disabled
                />
              </Tooltip>
            ) : (
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ color: 'white' }}
              />
            )}
            
            {/* Fullscreen button */}
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={toggleFullscreen}
              style={{ color: 'white' }}
            />
          </Space>
        </div>
      </div>
    </div>
  );
};

export default VideoViewer; 
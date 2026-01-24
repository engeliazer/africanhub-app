import React, { useState, useRef, useEffect } from 'react';
import { Slider, Select, Button, Tooltip, message, Progress, Spin, Switch } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  FullscreenOutlined, 
  SoundOutlined, 
  DownloadOutlined, 
  ExpandOutlined, 
  LockOutlined,
  LoadingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import Hls from 'hls.js';
import { getTokenLocal } from '../../services/utils/authorization';

const { Option } = Select;

const HLSVideoViewer = ({ 
  currentFileUrl, 
  currentFileName, 
  currentCategoryId, 
  categories, 
  resolution = 'auto',  // Default resolution
  resolutions = [],      // Available resolutions for this video
  onError
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
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
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [isScreenCaptured, setIsScreenCaptured] = useState(false);
  const captureCheckRef = useRef(null);
  const lastVisibilityTime = useRef(Date.now());
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparing your video...');
  const [segmentOrder, setSegmentOrder] = useState('normal'); // 'normal', 'reverse', 'custom'
  const [customSegmentOrder, setCustomSegmentOrder] = useState([]);
  
  // Determine if the video is protected based on category
  const isProtected = currentCategoryId && categories ? 
    Boolean(categories.find(c => c.id === currentCategoryId)?.is_protected) : false;

  // Auto-enable screenshot protection for protected videos
  const screenshotProtectionEnabled = isProtected;

  // Prevent right-click
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Prevent keyboard shortcuts and other download attempts
  const handleKeyDown = (e) => {
    if (!screenshotProtectionEnabled) return;
    // Prevent common keyboard shortcuts
    if (
      (e.ctrlKey || e.metaKey) && (
        e.key === 's' || // Save
        e.key === 'c' || // Copy
        e.key === 'v' || // Paste
        e.key === 'u'    // View source
      )
    ) {
      e.preventDefault();
      return false;
    }

    // Prevent screenshot shortcuts
    if (
      (e.key === 'PrintScreen') || // Print Screen key
      (e.metaKey && e.shiftKey && e.key === '3') || // Mac screenshot
      (e.metaKey && e.shiftKey && e.key === '4') || // Mac screenshot selection
      (e.altKey && e.key === 'PrintScreen') // Alt + Print Screen
    ) {
      e.preventDefault();
      setIsScreenCaptured(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      // Reset after a short delay
      setTimeout(() => {
        setIsScreenCaptured(false);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 2000);
      return false;
    }
  };

  // Prevent drag and drop
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  // Advanced screen capture detection
  useEffect(() => {
    if (!screenshotProtectionEnabled) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvasRef.current = canvas;
    document.body.appendChild(canvas);

    // 1. Canvas fingerprinting detection
    const originalToDataURL = canvas.toDataURL;
    canvas.toDataURL = function() {
      console.warn('Canvas screenshot attempt detected');
      setIsScreenCaptured(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setTimeout(() => {
        setIsScreenCaptured(false);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 2000);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    };

    // 2. WebRTC screen capture detection
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia = () => {
      console.warn('Screen sharing attempt detected');
      setIsScreenCaptured(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setTimeout(() => {
        setIsScreenCaptured(false);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 2000);
      return Promise.reject(new Error('Screen capture blocked for protected content'));
    };

    // 3. DOM mutation monitoring
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' &&
            mutation.target.style.filter === 'brightness(0)') {
          console.warn('DOM screenshot attempt detected');
          setIsScreenCaptured(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
          setTimeout(() => {
            setIsScreenCaptured(false);
            if (videoRef.current) {
              videoRef.current.play();
            }
          }, 2000);
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });

    // 4. Enhanced CSS protection
    const style = document.createElement('style');
    style.textContent = `
      @media screen and (display-mode: fullscreen) and (forced-colors: active) {
        .video-container video {
          filter: brightness(0) !important;
        }
      }
      @media print {
        .video-container video {
          filter: brightness(0) !important;
        }
      }
    `;
    document.head.appendChild(style);

    // 5. Create protection overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    `;
    overlayRef.current = overlay;
    document.body.appendChild(overlay);

    return () => {
      document.body.removeChild(canvas);
      document.body.removeChild(overlay);
      document.head.removeChild(style);
      observer.disconnect();
      navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
    };
  }, [screenshotProtectionEnabled]);

  // Handle screen capture detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!screenshotProtectionEnabled) return;
      const now = Date.now();
      // Only check if the modal is visible
      if (modalRef.current && modalRef.current.offsetParent !== null) {
        if (document.hidden && (now - lastVisibilityTime.current) < 100) {
          setIsScreenCaptured(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
          // Reset after a short delay
          setTimeout(() => {
            setIsScreenCaptured(false);
            if (videoRef.current) {
              videoRef.current.play();
            }
          }, 2000);
        }
        lastVisibilityTime.current = now;
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add screen capture detection using CSS
    const style = document.createElement('style');
    style.textContent = `
      @media screen and (display-mode: fullscreen) and (forced-colors: active) {
        .video-container video {
          filter: brightness(0) !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners for fullscreen changes
    const handleFullscreenChange = () => {
      if (!screenshotProtectionEnabled) return;
      // Only check if the modal is visible
      if (modalRef.current && modalRef.current.offsetParent !== null) {
        if (document.fullscreenElement && document.fullscreenElement === videoRef.current) {
          setIsScreenCaptured(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        } else {
          setIsScreenCaptured(false);
          if (videoRef.current) {
            videoRef.current.play();
          }
        }
      }
    };

    // Add blur detection for screenshot tools
    const handleBlur = () => {
      if (!screenshotProtectionEnabled) return;
      // Only check if the modal is visible
      if (modalRef.current && modalRef.current.offsetParent !== null) {
        const now = Date.now();
        if (now - lastVisibilityTime.current < 100) {
          setIsScreenCaptured(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
          // Reset after a short delay
          setTimeout(() => {
            setIsScreenCaptured(false);
            if (videoRef.current) {
              videoRef.current.play();
            }
          }, 2000);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      document.head.removeChild(style);
    };
  }, []);

  // Initialize HLS
  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const token = getTokenLocal();
      if (!token) {
        message.error('Authorization token not found. Please log in again.');
        return;
      }

      setIsLoading(true);
      setLoadingMessage('Initializing video player...');

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        lowLatencyMode: true,
        backBufferLength: 90,
        debug: true, // Enable debug mode temporarily
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        },
        // Custom manifest loading for segment order control
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6
      });

      hlsRef.current = hls;

      hls.loadSource(currentFileUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('HLS Manifest parsed:', data);
        setLoadingMessage('Loading video content...');
        
        // Log segment information for debugging
        console.log('Manifest data:', {
          levels: data.levels,
          audioTracks: data.audioTracks,
          subtitles: data.subtitles,
          url: data.url
        });
        
        // Get available quality levels
        const levels = hls.levels;
        console.log('Available levels:', levels);
        console.log('Levels count:', levels.length);
        console.log('Level details:', levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
          width: level.width,
          url: level.url
        })));
        
        if (levels.length === 0) {
          console.warn('No quality levels found in HLS manifest');
          // Set default quality options if no levels are available
          const defaultQualityOptions = [
            { label: 'Auto', value: 'auto' },
            { label: 'Source Quality', value: '0' }
          ];
          setAvailableQualities(defaultQualityOptions);
          setCurrentQuality('auto');
        } else {
          // Filter out levels with no useful data and create meaningful options
          const validLevels = levels.filter(level => 
            level.height > 0 || level.bitrate > 0 || level.width > 0
          );
          
          console.log('Valid levels:', validLevels.length, 'out of', levels.length);
          
          let qualityOptions;
          
          if (validLevels.length === 0) {
            // All levels have no useful data - create generic options
            console.warn('All levels have no height/bitrate data, creating generic options');
            qualityOptions = levels.map((level, index) => ({
              label: `Stream ${index + 1}`,
              value: index.toString()
            }));
          } else {
            // Use valid levels
            qualityOptions = validLevels.map((level, index) => {
              const originalIndex = levels.indexOf(level);
              const height = level.height || 0;
              const bitrate = level.bitrate || 0;
              const width = level.width || 0;
              
              // Handle cases where height is 0 or undefined
              let label;
              if (height > 0) {
                label = `${height}p (${Math.round(bitrate / 1000)} kbps)`;
              } else if (width > 0) {
                // Use width if height is not available
                const aspectRatio = width / height || 16/9;
                const estimatedHeight = Math.round(width / aspectRatio);
                label = `~${estimatedHeight}p (${Math.round(bitrate / 1000)} kbps)`;
              } else if (bitrate > 0) {
                // If no height but we have bitrate, use bitrate-based naming
                if (bitrate >= 2000000) {
                  label = `High (${Math.round(bitrate / 1000)} kbps)`;
                } else if (bitrate >= 1000000) {
                  label = `Medium (${Math.round(bitrate / 1000)} kbps)`;
                } else {
                  label = `Low (${Math.round(bitrate / 1000)} kbps)`;
                }
              } else {
                // Fallback to quality level number
                label = `Quality ${originalIndex + 1}`;
              }
              
              return {
                label: label,
                value: originalIndex.toString()
              };
            });
          }

          // Add auto option
          qualityOptions.unshift({
            label: 'Auto',
            value: 'auto'
          });

          console.log('Final quality options:', qualityOptions);
          setAvailableQualities(qualityOptions);
          setCurrentQuality('auto');
        }

        // Start playing
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          if (onError) {
            onError(error);
          }
        });

        // Simple fallback: Replace with user-friendly options
        setTimeout(() => {
          console.log('Setting simple quality options after timeout');
          const simpleOptions = [
            { label: 'Auto', value: 'auto' },
            { label: 'Source Quality', value: '0' }
          ];
          setAvailableQualities(simpleOptions);
        }, 1000);
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('Level loaded:', data);
        console.log('Loaded level details:', {
          level: data.level,
          height: data.details?.height,
          bitrate: data.details?.bitrate,
          width: data.details?.width,
          duration: data.details?.duration
        });

        // Update quality options with actual video metadata if we have better data
        console.log('Checking for video metadata update:', {
          hasDetails: !!data.details,
          hasWidth: !!(data.details && data.details.width),
          hasHeight: !!(data.details && data.details.height),
          details: data.details
        });

        if (data.details && (data.details.width || data.details.height)) {
          const currentLevels = hls.levels;
          console.log('Current levels for update:', currentLevels);
          
          if (currentLevels && currentLevels.length > 0) {
            const level = currentLevels[data.level];
            console.log('Level to update:', {
              level: data.level,
              currentHeight: level?.height,
              currentWidth: level?.width,
              needsUpdate: level && (!level.height || level.height === 0)
            });
            
            if (level && (!level.height || level.height === 0)) {
              // Update the level with actual dimensions
              level.height = data.details.height || Math.round(data.details.width * 9/16);
              level.width = data.details.width;
              
              console.log('Updated level with actual video dimensions:', level);
              
              // Recreate quality options with the updated data
              const updatedQualityOptions = currentLevels.map((level, index) => {
                const height = level.height || 0;
                const bitrate = level.bitrate || 0;
                const width = level.width || 0;
                
                let label;
                if (height > 0) {
                  label = `${height}p`;
                  if (bitrate > 0) {
                    label += ` (${Math.round(bitrate / 1000)} kbps)`;
                  }
                } else if (width > 0) {
                  const estimatedHeight = Math.round(width * 9/16);
                  label = `~${estimatedHeight}p`;
                } else {
                  label = `Quality ${index + 1}`;
                }
                
                return {
                  label: label,
                  value: index.toString()
                };
              });

              // Add auto option
              updatedQualityOptions.unshift({
                label: 'Auto',
                value: 'auto'
              });

              console.log('Updated quality options with actual video data:', updatedQualityOptions);
              setAvailableQualities(updatedQualityOptions);
            } else {
              console.log('Level does not need update or level not found');
            }
          } else {
            console.log('No levels found for update');
          }
        } else {
          console.log('No video metadata available for update');
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log('Level switched:', data);
        const newLevel = hls.levels[data.level];
        if (newLevel) {
          const height = newLevel.height || 0;
          const bitrate = newLevel.bitrate || 0;
          
          // Use the same logic as quality options generation
          let label;
          if (height > 0) {
            label = `${height}p (${Math.round(bitrate / 1000)} kbps)`;
          } else if (bitrate > 0) {
            if (bitrate >= 2000000) {
              label = `High (${Math.round(bitrate / 1000)} kbps)`;
            } else if (bitrate >= 1000000) {
              label = `Medium (${Math.round(bitrate / 1000)} kbps)`;
            } else {
              label = `Low (${Math.round(bitrate / 1000)} kbps)`;
            }
          } else {
            label = `Quality ${data.level + 1}`;
          }
          
          setCurrentQuality({
            label: label,
            value: data.level.toString()
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          console.error('Fatal error:', data);
          hls.destroy();
          setLoadingMessage('Error loading video. Please try again.');
          setIsLoading(false);
          if (onError) {
            onError(data);
          }
        } else {
          console.warn('Non-fatal HLS error:', data);
        }
      });

      hls.on(Hls.Events.BUFFER_CREATED, () => {
        setLoadingMessage('Buffering video...');
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsLoading(false);
      });

      // Listen for BUFFER_CODECS event to get video metadata
      hls.on(Hls.Events.BUFFER_CODECS, (event, data) => {
        console.log('Buffer codecs event:', data);
        
        // Look for video track metadata
        if (data && data.tracks) {
          const videoTrack = data.tracks.video;
          if (videoTrack && videoTrack.metadata) {
            const { width, height } = videoTrack.metadata;
            console.log('Found video metadata in buffer codecs:', { width, height });
            
            if (width && height) {
              // Update quality options with actual video dimensions
              const currentLevels = hls.levels;
              if (currentLevels && currentLevels.length > 0) {
                const level = currentLevels[0]; // Use first level
                if (level && (!level.height || level.height === 0)) {
                  // Update the level with actual dimensions
                  level.height = height;
                  level.width = width;
                  
                  console.log('Updated level with video metadata from buffer codecs:', level);
                  
                  // Recreate quality options with the updated data
                  const updatedQualityOptions = currentLevels.map((level, index) => {
                    const height = level.height || 0;
                    const bitrate = level.bitrate || 0;
                    const width = level.width || 0;
                    
                    let label;
                    if (height > 0) {
                      label = `${height}p`;
                      if (bitrate > 0) {
                        label += ` (${Math.round(bitrate / 1000)} kbps)`;
                      }
                    } else if (width > 0) {
                      const estimatedHeight = Math.round(width * 9/16);
                      label = `~${estimatedHeight}p`;
                    } else {
                      label = `Quality ${index + 1}`;
                    }
                    
                    return {
                      label: label,
                      value: index.toString()
                    };
                  });

                  // Add auto option
                  updatedQualityOptions.unshift({
                    label: 'Auto',
                    value: 'auto'
                  });

                  console.log('Updated quality options from buffer codecs:', updatedQualityOptions);
                  setAvailableQualities(updatedQualityOptions);
                }
              }
            }
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      videoRef.current.src = currentFileUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          if (onError) {
            onError(error);
          }
        });
      });
    }
  }, [currentFileUrl, onError]);

  // Add event listeners to the video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      
      // Try to update quality options when video starts playing
      setTimeout(() => {
        if (video.videoWidth && video.videoHeight) {
          console.log('Video started playing, checking metadata:', {
            width: video.videoWidth,
            height: video.videoHeight
          });

          const currentLevels = hlsRef.current?.levels;
          if (currentLevels && currentLevels.length > 0) {
            const level = currentLevels[0];
            if (level && (!level.height || level.height === 0)) {
              // Update the level with actual dimensions from video element
              level.height = video.videoHeight;
              level.width = video.videoWidth;
              
              console.log('Updated level when video started playing:', level);
              
              // Recreate quality options with the updated data
              const updatedQualityOptions = currentLevels.map((level, index) => {
                const height = level.height || 0;
                const bitrate = level.bitrate || 0;
                const width = level.width || 0;
                
                let label;
                if (height > 0) {
                  label = `${height}p`;
                  if (bitrate > 0) {
                    label += ` (${Math.round(bitrate / 1000)} kbps)`;
                  }
                } else if (width > 0) {
                  const estimatedHeight = Math.round(width * 9/16);
                  label = `~${estimatedHeight}p`;
                } else {
                  label = `Quality ${index + 1}`;
                }
                
                return {
                  label: label,
                  value: index.toString()
                };
              });

              // Add auto option
              updatedQualityOptions.unshift({
                label: 'Auto',
                value: 'auto'
              });

              console.log('Updated quality options when video started playing:', updatedQualityOptions);
              setAvailableQualities(updatedQualityOptions);
            }
          }
        }
      }, 1000); // Wait 1 second after play starts
    };
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });

      // Update quality options with video element metadata
      if (video.videoWidth && video.videoHeight) {
        console.log('Updating quality options from video element metadata:', {
          width: video.videoWidth,
          height: video.videoHeight
        });

        const currentLevels = hlsRef.current?.levels;
        if (currentLevels && currentLevels.length > 0) {
          const level = currentLevels[0];
          if (level && (!level.height || level.height === 0)) {
            // Update the level with actual dimensions from video element
            level.height = video.videoHeight;
            level.width = video.videoWidth;
            
            console.log('Updated level with video element metadata:', level);
            
            // Recreate quality options with the updated data
            const updatedQualityOptions = currentLevels.map((level, index) => {
              const height = level.height || 0;
              const bitrate = level.bitrate || 0;
              const width = level.width || 0;
              
              let label;
              if (height > 0) {
                label = `${height}p`;
                if (bitrate > 0) {
                  label += ` (${Math.round(bitrate / 1000)} kbps)`;
                }
              } else if (width > 0) {
                const estimatedHeight = Math.round(width * 9/16);
                label = `~${estimatedHeight}p`;
              } else {
                label = `Quality ${index + 1}`;
              }
              
              return {
                label: label,
                value: index.toString()
              };
            });

            // Add auto option
            updatedQualityOptions.unshift({
              label: 'Auto',
              value: 'auto'
            });

            console.log('Updated quality options from video element:', updatedQualityOptions);
            setAvailableQualities(updatedQualityOptions);
          }
        }
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Control timer for hiding controls
  const controlsTimerRef = useRef(null);

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
        
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        
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
    };
  }, []);

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

  const restartVideo = () => {
    if (!videoRef.current) return;
    
    console.log('Restart button clicked - restarting video');
    
    // Reset video to beginning
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    
    // If video is paused, start playing from beginning
    if (videoRef.current.paused) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video after restart:', error);
      });
    }
    
    // Show feedback to user
    message.success('Video restarted from beginning');
  };

  // Segment order management functions
  const handleSegmentOrderChange = (order) => {
    setSegmentOrder(order);
    console.log('Segment order changed to:', order);
    
    if (order === 'reverse' && hlsRef.current) {
      // Note: This is a conceptual implementation
      // Actual segment reordering would require server-side manifest modification
      console.log('Reverse segment order requested - requires server-side implementation');
      message.info('Segment reordering requires server-side manifest modification');
    } else if (order === 'custom') {
      console.log('Custom segment order requested');
      message.info('Custom segment ordering requires server-side implementation');
    }
  };

  const getSegmentInfo = () => {
    if (hlsRef.current && hlsRef.current.levels) {
      const currentLevel = hlsRef.current.levels[hlsRef.current.currentLevel];
      if (currentLevel && currentLevel.details) {
        console.log('Current segment info:', {
          level: hlsRef.current.currentLevel,
          segments: currentLevel.details.segments,
          totalSegments: currentLevel.details.segments?.length || 0,
          duration: currentLevel.details.totalduration
        });
        return currentLevel.details.segments || [];
      }
    }
    return [];
  };

  // Handle quality change
  const handleQualityChange = (value) => {
    console.log('Changing quality to:', value);
    if (hlsRef.current) {
      if (value === 'auto') {
        hlsRef.current.currentLevel = -1; // Auto quality
      } else {
        hlsRef.current.currentLevel = parseInt(value);
      }
      setCurrentQuality(value);
    }
  };

  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format bitrate to Mbps
  const formatBitrate = (bitrate) => {
    return `${(bitrate / 1000000).toFixed(2)} Mbps`;
  };

  return (
    <div 
      ref={videoContainerRef}
      className="video-container"
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000'
      }}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-50">
          <div className="text-center p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to The African Hub</h2>
            <p className="text-gray-300 mb-6">{loadingMessage}</p>
            <Spin 
              indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} 
              size="large"
            />
          </div>
        </div>
      )}
      
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
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          opacity: loading ? 0.5 : 1,
          filter: (screenshotProtectionEnabled && isScreenCaptured) ? 'brightness(0) contrast(0)' : 'none',
          transition: 'filter 0.1s ease-in-out',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          pointerEvents: 'none'
        }}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture={isProtected}
        onClick={togglePlay}
      />
      
      {/* Screen Capture Protection Overlay */}
      {isScreenCaptured && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
            <div>Content Protected</div>
            <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
              Screen capture detected
            </div>
          </div>
        </div>
      )}
      
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
                <span key={j}>The African Hub </span>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {/* Loading Indicator */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              type="text" 
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={togglePlay}
              style={{ 
                color: 'white',
                fontSize: '16px',
                padding: '4px 8px',
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            
            <Tooltip title="Restart video from beginning">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={restartVideo}
                style={{ 
                  color: 'white',
                  fontSize: '18px',
                  padding: '6px 10px',
                  minWidth: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              />
            </Tooltip>
            
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
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quality selector */}
            {availableQualities.length > 0 && (
              <Select 
                value={currentQuality} 
                onChange={handleQualityChange}
                style={{ width: '120px' }}
                popupMatchSelectWidth={false}
                placeholder="Quality"
                title="Video Quality Selector - HLS Stream Quality Options"
              >
                {availableQualities.map((quality) => (
                  <Option key={quality.value} value={quality.value}>
                    {quality.label}
                  </Option>
                ))}
              </Select>
            )}
            
            {/* Screenshot protection indicator */}
            {screenshotProtectionEnabled && (
              <Tooltip title="Screenshot protection is active for this protected video">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'white', 
                  gap: '6px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <LockOutlined style={{ fontSize: '12px' }} />
                  <span style={{ fontSize: '12px' }}>Protected</span>
                </div>
              </Tooltip>
            )}

            {/* Segment Order Selector */}
            <Select 
              value={segmentOrder} 
              onChange={handleSegmentOrderChange}
              style={{ width: '100px' }}
              popupMatchSelectWidth={false}
              placeholder="Order"
              title="Segment Playback Order"
            >
              <Option value="normal">Normal</Option>
              <Option value="reverse">Reverse</Option>
              <Option value="custom">Custom</Option>
            </Select>
            
            {/* HLS indicator - Hidden for more space */}
            {/* <Tooltip title="HLS Streaming">
              <div style={{ 
                color: 'white', 
                fontSize: '12px',
                padding: '0 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                marginRight: '8px'
              }}>
                HLS
              </div>
            </Tooltip> */}
            
            {/* Fullscreen button */}
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={toggleFullscreen}
              style={{ color: 'white' }}
            />
          </div>
        </div>
      </div>
      
      {isScreenCaptured && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '24px',
            textAlign: 'center',
            zIndex: 1000
          }}
        >
          Screen capture detected. Video playback paused.
        </div>
      )}
    </div>
  );
};

export default HLSVideoViewer; 
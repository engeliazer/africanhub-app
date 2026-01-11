import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Alert, message } from 'antd';
import axios from '../../utils/axios';

/**
 * VdoCipher DRM Video Player Component
 * 
 * This component plays DRM-protected videos using VdoCipher's embed player
 * It fetches OTP (One Time Password) from the backend and initializes the player
 * 
 * @param {string} materialId - The material ID to fetch OTP for
 * @param {string} materialName - Name of the material (for display)
 * @param {function} onVideoEnd - Callback when video ends
 * @param {function} onError - Callback for errors
 */
const VdoCipherPlayer = ({ materialId, materialName, onVideoEnd, onError, onVideoDataLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otp, setOtp] = useState(null);
  const [playbackInfo, setPlaybackInfo] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const playerContainerRef = useRef(null);
  const fullscreenOverlayRef = useRef(null);

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

  useEffect(() => {
    // Fetch OTP when component mounts
    fetchVideoOTP();
  }, [materialId]);

  useEffect(() => {
    // Initialize player when OTP is available
    if (otp && playbackInfo && playerContainerRef.current) {
      initializePlayer();
    }
  }, [otp, playbackInfo]);

  // Prevent right-click and keyboard shortcuts on the video player
  useEffect(() => {
    const container = playerContainerRef.current;

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleKeyDown = (e) => {
      // Check if the event target is within the player container
      const currentContainer = playerContainerRef.current;
      const isPlayerArea = currentContainer && (
        currentContainer.contains(e.target) || 
        e.target.closest('.vdocipher-player-container') ||
        e.target.closest('[class*="vdocipher"]')
      );

      // Only prevent shortcuts when interacting with the player area
      if (isPlayerArea) {
        // Prevent common keyboard shortcuts
        // Ctrl+S (Save), Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+U (View Source)
        // F12 (DevTools), Ctrl+Shift+C (Inspect Element)
        if (
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && (e.key === 'S' || e.key === 'U')) ||
          e.key === 'F12' ||
          (e.ctrlKey && e.key === 'p') // Print
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e) => {
      // Prevent text selection on the player area
      if (e.target.closest('.vdocipher-player-container') || 
          e.target.closest('[class*="vdocipher"]')) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners to the player container
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('dragstart', handleDragStart);
      container.addEventListener('selectstart', handleSelectStart);
    }

    // Also add to document for keyboard shortcuts (only when player area is focused)
    const documentKeyDownHandler = (e) => {
      const currentContainer = playerContainerRef.current;
      if (currentContainer && (
        currentContainer.contains(e.target) || 
        e.target.closest('.vdocipher-player-container') ||
        e.target.closest('[class*="vdocipher"]')
      )) {
        handleKeyDown(e);
      }
    };
    document.addEventListener('keydown', documentKeyDownHandler);

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
        container.removeEventListener('keydown', handleKeyDown);
        container.removeEventListener('dragstart', handleDragStart);
        container.removeEventListener('selectstart', handleSelectStart);
      }
      document.removeEventListener('keydown', documentKeyDownHandler);
    };
  }, []);

  const removeFullscreenOverlay = useCallback(() => {
    // Clear any intervals
    if (fullscreenOverlayRef.current) {
      const intervalId = fullscreenOverlayRef.current.dataset?.intervalId;
      if (intervalId) {
        clearInterval(parseInt(intervalId));
      }
    }
    
    if (fullscreenOverlayRef.current && fullscreenOverlayRef.current.parentNode) {
      fullscreenOverlayRef.current.parentNode.removeChild(fullscreenOverlayRef.current);
      fullscreenOverlayRef.current = null;
    } else {
      // Also try to remove by ID in case ref is lost
      const existing = document.getElementById('vdocipher-fullscreen-overlay');
      if (existing) {
        const intervalId = existing.dataset?.intervalId;
        if (intervalId) {
          clearInterval(parseInt(intervalId));
        }
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }
    }
  }, []);

  const createFullscreenOverlay = useCallback(() => {
    // Remove existing overlay if any
    removeFullscreenOverlay();

    // Try to get the fullscreen element, fallback to body
    const fullscreenElement = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement;
    
    // Use fullscreen element if available, otherwise use body
    const targetElement = fullscreenElement || document.body;

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'vdocipher-fullscreen-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
      visibility: visible !important;
    `;

    // DCRC Logo - centered, smaller and circular
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.15;
      z-index: 2147483647;
    `;
    const logoImg = document.createElement('img');
    logoImg.src = '/dcrc.jpg';
    logoImg.alt = 'DCRC Logo';
    logoImg.style.cssText = `
      width: 150px;
      height: 150px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;
    logoImg.onerror = () => {
      logoImg.src = '/dcrc.png';
    };
    logoContainer.appendChild(logoImg);
    overlay.appendChild(logoContainer);

    // DCRC Text watermark overlay
    const textOverlay = document.createElement('div');
    textOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.3;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
      overflow: hidden;
      z-index: 2147483646;
    `;
    
    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.style.cssText = `
        transform: rotate(-30deg);
        display: flex;
        justify-content: space-around;
        font-size: 24px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.5);
        margin-top: ${i % 2 === 0 ? '40px' : '0px'};
        white-space: nowrap;
      `;
      for (let j = 0; j < 3; j++) {
        const span = document.createElement('span');
        span.textContent = 'DCRC ';
        row.appendChild(span);
      }
      textOverlay.appendChild(row);
    }
    overlay.appendChild(textOverlay);

    // Append to target element
    targetElement.appendChild(overlay);
    fullscreenOverlayRef.current = overlay;
    
    console.log('Fullscreen overlay created and appended to:', targetElement);
    
    // Continuously ensure overlay stays on top (for iframe fullscreen)
    // Check every 500ms to ensure overlay stays visible
    const visibilityCheckInterval = setInterval(() => {
      if (!(document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement)) {
        clearInterval(visibilityCheckInterval);
        return;
      }
      
      if (!fullscreenOverlayRef.current) return;
      
      const overlay = fullscreenOverlayRef.current;
      const computedStyle = window.getComputedStyle(overlay);
      
      // If overlay is not visible or z-index is too low, force it to be visible
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden') {
        overlay.style.display = 'block';
        overlay.style.visibility = 'visible';
        overlay.style.zIndex = '2147483647';
      }
    }, 500);
    
    // Store interval for cleanup
    overlay.dataset.intervalId = visibilityCheckInterval;
  }, [watermarkText, removeFullscreenOverlay]);

  // Add global style for fullscreen overlay
  useEffect(() => {
    const styleId = 'vdocipher-fullscreen-overlay-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #vdocipher-fullscreen-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: none !important;
          z-index: 2147483647 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Detect fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Small delay to ensure fullscreen element is set
      setTimeout(() => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
        setIsFullscreen(isCurrentlyFullscreen);
        
        // Create or remove fullscreen overlay
        if (isCurrentlyFullscreen) {
          console.log('Fullscreen detected, creating overlay...');
          // Try multiple times with increasing delays to ensure it's created
          // This helps with iframe fullscreen which may take time to initialize
          createFullscreenOverlay();
          setTimeout(() => createFullscreenOverlay(), 100);
          setTimeout(() => createFullscreenOverlay(), 300);
          setTimeout(() => createFullscreenOverlay(), 600);
          setTimeout(() => createFullscreenOverlay(), 1000);
          
          // Also use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
            createFullscreenOverlay();
          });
        } else {
          console.log('Exiting fullscreen, removing overlay...');
          removeFullscreenOverlay();
        }
      }, 50);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      removeFullscreenOverlay();
    };
  }, [watermarkText, createFullscreenOverlay, removeFullscreenOverlay]);

  const fetchVideoOTP = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching OTP for material:', materialId);

      // Note: axios already has /api as baseURL, so don't include it here
      // Frontend-only watermarking - no watermark payload sent to backend
      const response = await axios.post(`/videos/${materialId}/otp`);

      console.log('OTP Response:', response.data);

      if (response.data.status === 'success') {
        setOtp(response.data.data.otp);
        setPlaybackInfo(response.data.data.playbackInfo);
        const video = response.data.data.video;
        setVideoData(video);
        // Pass videoData to parent component if callback provided
        if (onVideoDataLoaded) {
          onVideoDataLoaded(video);
        }
      } else {
        throw new Error('Failed to get video credentials');
      }
    } catch (err) {
      console.error('Error fetching video OTP:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load video';
      setError(errorMessage);
      message.error(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = () => {
    try {
      console.log('Initializing player...');
      console.log('OTP:', otp);
      console.log('PlaybackInfo:', playbackInfo);
      
      if (!playerContainerRef.current) {
        console.error('Player container not found');
        return;
      }

      // Clear previous player if exists
      playerContainerRef.current.innerHTML = '';

      // Create iframe element for VdoCipher embed (simple iframe method)
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`;
      iframe.style.border = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '500px';
      iframe.allowFullscreen = true;
      iframe.allow = 'encrypted-media';
      iframe.loading = 'eager';
      
      // Add onload handler
      iframe.onload = () => {
        console.log('✅ VdoCipher player iframe loaded successfully');
        setLoading(false);
      };
      
      iframe.onerror = (err) => {
        console.error('❌ VdoCipher player iframe failed to load:', err);
        setError('Failed to load video player');
        setLoading(false);
      };
      
      playerContainerRef.current.appendChild(iframe);
      
      console.log('VdoCipher player iframe created');
      
      // Listen for messages from iframe (for events like ended, play, pause)
      const handleMessage = (event) => {
        // VdoCipher sends messages from their domain
        if (event.origin === 'https://player.vdocipher.com') {
          console.log('VdoCipher player message:', event.data);
          
          if (event.data && event.data.event === 'ended') {
            console.log('Video ended');
            message.success('Video completed!');
            if (onVideoEnd) {
              onVideoEnd();
            }
          }
          
          if (event.data && event.data.event === 'error') {
            console.error('Player error:', event.data);
            message.error('Video playback error occurred');
            if (onError) {
              onError(event.data);
            }
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Store cleanup function
      return () => {
        window.removeEventListener('message', handleMessage);
      };
      
    } catch (err) {
      console.error('Error in initializePlayer:', err);
      setError('Failed to initialize video player');
      message.error('Failed to initialize video player');
      setLoading(false);
      
      if (onError) {
        onError(err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: '#000' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#fff' }}>Loading secure video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Video"
        description={error}
        type="error"
        showIcon
        style={{ margin: 20 }}
      />
    );
  }

  return (
    <div className="vdocipher-player-wrapper">
      <div 
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: '100%',
          minHeight: '400px',
          background: '#000',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <div 
          ref={playerContainerRef} 
          className="vdocipher-player-container"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: '100%',
            minHeight: '400px',
            background: '#000',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        />

        {/* DCRC Logo Watermark - Centered, Smaller and Circular */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 15,
          opacity: 0.15
        }}>
          <img 
            src="/dcrc.jpg" 
            alt="DCRC Logo" 
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
            onError={(e) => {
              // Fallback to PNG if JPG doesn't load
              e.target.src = '/dcrc.png';
            }}
          />
        </div>

        {/* DCRC Text Watermark Overlay */}
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
          overflow: 'hidden',
          zIndex: 10
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
                <span key={j}>DCRC </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .vdocipher-player-wrapper {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .vdocipher-player-container {
          aspect-ratio: 16/9;
        }
        
        @media (max-width: 768px) {
          .vdocipher-player-wrapper {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VdoCipherPlayer;


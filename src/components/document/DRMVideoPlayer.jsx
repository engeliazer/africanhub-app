import React, { useEffect, useRef } from 'react';
import shaka from 'shaka-player';

const DRMVideoPlayer = ({
  dashUrl,
  hlsUrl,
  licenseServers = {},
  authToken,
  onError
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isSafari = typeof navigator !== 'undefined' && /safari/i.test(navigator.userAgent) && !/chrome|android/i.test(navigator.userAgent);

    // Safari: prefer native HLS (FairPlay handled by platform/commercial player)
    if (isSafari && hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return () => {};
    }

    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      if (onError) onError(new Error('Browser not supported for EME/DRM playback'));
      return () => {};
    }

    const player = new shaka.Player(video);
    playerRef.current = player;

    // Attach Authorization header to license/segment/manifest requests
    player.getNetworkingEngine().registerRequestFilter((type, request) => {
      const RequestType = shaka.net.NetworkingEngine.RequestType;
      if (
        authToken &&
        (type === RequestType.LICENSE || type === RequestType.SEGMENT || type === RequestType.MANIFEST)
      ) {
        request.headers['Authorization'] = `Bearer ${authToken}`;
      }
    });

    player.configure({
      drm: {
        servers: licenseServers
      },
      streaming: {
        lowLatencyMode: true,
        rebufferingGoal: 1,
        bufferingGoal: 10
      }
    });

    player.load(dashUrl).catch((e) => {
      if (onError) onError(e);
    });

    return () => {
      player.destroy().catch(() => {});
    };
  }, [dashUrl, hlsUrl, licenseServers, authToken, onError]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  );
};

export default DRMVideoPlayer;



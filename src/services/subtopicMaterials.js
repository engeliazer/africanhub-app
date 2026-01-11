import axios from '../services/utils/axios';
import { SUBTOPIC_MATERIALS_RESOURCE } from './constants/endpoints';
import { getTokenLocal } from './utils/authorization';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Cache for the fingerprint instance
let fpPromise = null;

// Initialize FingerprintJS with stable components
const getFingerprint = async () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load({
      // Use only stable components
      preprocessor: (key, value) => {
        // Remove any components that might change frequently
        if (key === 'canvas' || key === 'audio' || key === 'webgl') {
          return null;
        }
        return value;
      }
    });
  }
  return fpPromise;
};

const subtopicMaterialsService = {
  getLocalPendingVideos: async (page = 1, perPage = 20) => {
    try {
      const response = await axios.get('/study-materials/subtopic-materials/local-materials', {
        params: {
          only_completed: true,
          only_videos: true,
          page,
          per_page: perPage
        }
      });

      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error in getLocalPendingVideos:', error);
      throw error;
    }
  },
  migrateToB2: async (materialId) => {
    try {
      const response = await axios.post(`/study-materials/subtopic-materials/${materialId}/migrate-to-b2`);
      return response.data;
    } catch (error) {
      console.error('Error in migrateToB2:', error);
      throw error;
    }
  },
  getMaterial: async (materialId) => {
    try {
      const response = await axios.get(`/study-materials/subtopic-materials/${materialId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getMaterial:', error);
      throw error;
    }
  },
  getMaterials: async (subtopicId) => {
    try {
      const token = getTokenLocal();
      if (!token) {
        throw new Error('No authorization token found');
      }

      // Try to get existing visitor ID from localStorage
      let visitorId = localStorage.getItem('visitor_id');
      let components = JSON.parse(localStorage.getItem('visitor_components') || '{}');

      // If no visitor ID exists or it's expired (older than 30 days), generate a new one
      const lastGenerated = localStorage.getItem('visitor_id_timestamp');
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      
      if (!visitorId || !lastGenerated || (Date.now() - parseInt(lastGenerated)) > thirtyDaysInMs) {
        try {
          const fp = await getFingerprint();
          const result = await fp.get();
          visitorId = result.visitorId;
          components = result.components;

          // Store the new visitor ID and timestamp
          localStorage.setItem('visitor_id', visitorId);
          localStorage.setItem('visitor_components', JSON.stringify(components));
          localStorage.setItem('visitor_id_timestamp', Date.now().toString());
        } catch (error) {
          console.error('Error generating fingerprint:', error);
          // If fingerprinting fails, use a fallback ID based on stable browser features
          visitorId = generateFallbackId();
          components = getFallbackComponents();
        }
      }

      // Extract browser and OS information
      const userAgent = navigator.userAgent;
      let browserName = 'Unknown';
      let browserVersion = 'Unknown';
      let osName = navigator.platform;
      let osVersion = 'Unknown';

      // Parse browser name and version with safe splitting
      try {
        if (userAgent.includes('Chrome/') && !userAgent.includes('Edge/')) {
          browserName = 'Chrome';
          const chromeMatch = userAgent.match(/Chrome\/(\S+)/);
          browserVersion = chromeMatch ? chromeMatch[1].split(' ')[0] : 'Unknown';
        } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
          browserName = 'Safari';
          const versionMatch = userAgent.match(/Version\/(\S+)/);
          browserVersion = versionMatch ? versionMatch[1].split(' ')[0] : 'Unknown';
        } else if (userAgent.includes('Firefox/')) {
          browserName = 'Firefox';
          const firefoxMatch = userAgent.match(/Firefox\/(\S+)/);
          browserVersion = firefoxMatch ? firefoxMatch[1].split(' ')[0] : 'Unknown';
        } else if (userAgent.includes('Edge/') || userAgent.includes('Edg/')) {
          browserName = 'Edge';
          const edgeMatch = userAgent.match(/(?:Edge|Edg)\/(\S+)/);
          browserVersion = edgeMatch ? edgeMatch[1].split(' ')[0] : 'Unknown';
        }
      } catch (error) {
        console.error('Error parsing browser info:', error);
      }

      // Parse OS version with safe splitting
      try {
        if (userAgent.includes('iPhone')) {
          osName = 'iOS';
          const iOSMatch = userAgent.match(/iPhone OS (\S+)/);
          osVersion = iOSMatch ? iOSMatch[1].replace(/_/g, '.') : 'Unknown';
        } else if (userAgent.includes('iPad')) {
          osName = 'iPadOS';
          const iPadMatch = userAgent.match(/CPU OS (\S+)/);
          osVersion = iPadMatch ? iPadMatch[1].replace(/_/g, '.') : 'Unknown';
        } else if (userAgent.includes('Mac OS X')) {
          osName = 'macOS';
          const macMatch = userAgent.match(/Mac OS X ([^)]+)/);
          osVersion = macMatch ? macMatch[1].replace(/_/g, '.') : 'Unknown';
        } else if (userAgent.includes('Windows NT')) {
          osName = 'Windows';
          const winMatch = userAgent.match(/Windows NT ([^;)]+)/);
          osVersion = winMatch ? winMatch[1] : 'Unknown';
        } else if (userAgent.includes('Android')) {
          osName = 'Android';
          const androidMatch = userAgent.match(/Android ([^;)]+)/);
          osVersion = androidMatch ? androidMatch[1] : 'Unknown';
        } else if (userAgent.includes('Linux')) {
          osName = 'Linux';
          osVersion = 'Unknown';
        }
      } catch (error) {
        console.error('Error parsing OS info:', error);
        osName = navigator.platform || 'Unknown';
        osVersion = 'Unknown';
      }

      // Prepare the request data
      const requestData = {
        device_fingerprint: {
          visitorId,
          components: {
            ...components,
            browser_info: {
              name: browserName,
              version: browserVersion
            },
            os_info: {
              name: osName,
              version: osVersion
            },
            hardware_info: {
              screenResolution: `${window.screen.width}x${window.screen.height}`,
              colorDepth: window.screen.colorDepth,
              pixelRatio: window.devicePixelRatio,
              hardwareConcurrency: navigator.hardwareConcurrency,
              deviceMemory: navigator.deviceMemory
            }
          }
        }
      };

      console.log('Sending request with fingerprint data:', requestData);

      const response = await axios.post('/study-materials/subtopic-materials', requestData, {
        params: { subtopic_id: subtopicId }
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.status === 'success') {
        return {
          data: {
            items: response.data.data.items,
            page: response.data.data.page,
            total: response.data.data.total,
            per_page: response.data.data.per_page,
            pages: response.data.data.pages
          },
          device_verification: response.data.device_verification
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error in getMaterials:', error);
      throw error;
    }
  },

  createMaterial: async (formData, onProgress) => {
    try {
      const response = await axios.post('/study-materials/subtopic-materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload video to VdoCipher with DRM protection
  createVdoCipherMaterial: async (formData, onProgress) => {
    try {
      // Prepare FormData for VdoCipher upload
      const vdocipherFormData = new FormData();
      vdocipherFormData.append('video', formData.get('file'));
      vdocipherFormData.append('subtopic_id', formData.get('subtopic_id'));
      vdocipherFormData.append('material_category_id', formData.get('material_category_id'));
      vdocipherFormData.append('name', formData.get('name'));
      
      const response = await axios.post('/study-materials/subtopic-materials/upload-vdocipher', vdocipherFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Link an existing VdoCipher video to a subtopic/material category
  linkVdoCipherMaterial: async ({ video_id, subtopic_id, material_category_id, name }) => {
    try {
      const payload = {
        video_id,
        subtopic_id,
        material_category_id,
        // Only include name if provided to keep payload clean
        ...(name ? { name } : {})
      };

      const response = await axios.post('/study-materials/subtopic-materials/link-vdocipher', payload);
      return response.data;
    } catch (error) {
      console.error('Error in linkVdoCipherMaterial:', error);
      throw error.response?.data || error;
    }
  },

  createDocumentMaterial: async (formData, onProgress) => {
    try {
      const response = await axios.post('/study-materials/subtopic-materials/upload-docs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createHlsMaterial: async (formData, onProgress) => {
    try {
      console.log('Sending HLS upload request with form data:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      const response = await axios.post('/study-materials/subtopic-materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('HLS upload error:', error.response?.data || error);
      throw error;
    }
  },

  updateMaterial: async (id, data) => {
    try {
      const response = await axios.put(`${SUBTOPIC_MATERIALS_RESOURCE}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await axios.delete(`/study-materials/subtopic-materials/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAccessToken: async (filename) => {
    try {
      const response = await axios.post(`/materials/access-token/${filename}?access=view`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  viewMaterial: async (materialId, onProgress) => {
    try {
      const response = await axios.get(`/study-materials/subtopic-materials/${materialId}/view`, {
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });

      // Return the full response data for HLS videos
      if (response.data && response.data.type === 'hls') {
        return response.data;
      }

      // For regular files, return the URL
      return response.data;
    } catch (error) {
      console.error('Error viewing material:', error);
      throw error;
    }
  },

  downloadMaterial: async (materialId, onProgress) => {
    try {
      const response = await axios.get(`/study-materials/subtopic-materials/${materialId}/download`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  viewDocument: async (materialId, onProgress) => {
    try {
      const response = await axios.get(`/study-materials/subtopic-materials/${materialId}/view-document`, {
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            });
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error viewing document:', error);
      throw error;
    }
  },

  // Note: all monitoring-related service methods have been removed

  // Fix material path for videos with temp paths
  fixPath: async (materialId) => {
    try {
      const response = await axios.post(`/study-materials/subtopic-materials/${materialId}/fix-path`);
      return response.data;
    } catch (error) {
      console.error('Error fixing material path:', error);
      throw error;
    }
  },

  // Retry processing for failed materials
  retryMaterial: async (materialId) => {
    try {
      const response = await axios.post(`/study-materials/subtopic-materials/${materialId}/retry`);
      return response.data;
    } catch (error) {
      console.error('Error retrying material processing:', error);
      throw error;
    }
  }
};

// Fallback ID generation using stable browser features
const generateFallbackId = () => {
  const stableFeatures = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    navigator.hardwareConcurrency,
    navigator.deviceMemory
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < stableFeatures.length; i++) {
    const char = stableFeatures.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Get fallback components when fingerprinting fails
const getFallbackComponents = () => {
  return {
    browser_info: {
      name: navigator.appName,
      version: navigator.appVersion
    },
    os_info: {
      name: navigator.platform,
      version: 'Unknown'
    },
    hardware_info: {
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory
    }
  };
};

export default subtopicMaterialsService; 
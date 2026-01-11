import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, message, Select, Tabs, Upload, Tag, Alert, Tooltip, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, DownloadOutlined, VideoCameraOutlined, FileOutlined, PlayCircleOutlined, FilePdfOutlined, ClockCircleOutlined, ReloadOutlined, RedoOutlined, LinkOutlined } from '@ant-design/icons';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { searchPlugin } from '@react-pdf-viewer/search';
import { selectionModePlugin } from '@react-pdf-viewer/selection-mode';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useNavigate } from 'react-router-dom';
import subtopicMaterialsService from '../../services/subtopicMaterials';
import studyMaterialCategoriesService from '../../services/studyMaterialCategories';
import subjectsService from '../../services/subjects';
import subtopicsService from '../../services/subtopics';
import topicsService from '../../services/topics';
import coursesService from '../../services/courses';
import DocumentViewer from '../../components/document/DocumentViewer';
import VideoViewer from '../../components/document/VideoViewer';
import HlsVideoViewer from '../../components/document/HlsVideoViewer';
import DRMVideoPlayer from '../../components/document/DRMVideoPlayer';
import CategoryMaterialsList from '../../components/studies/CategoryMaterialsList';
import LoadingProgressModal from '../../components/document/LoadingProgressModal';
import VideoPreparationModal from '../../components/document/VideoPreparationModal';
import HlsVideoUpload from '../../components/document/HlsVideoUpload';
import { BASE_URL } from '../../config';
import axios from '../../utils/axios';

const SubtopicMaterialsList = ({ subtopicId, selectedCourse, selectedSubject, selectedTopic }) => {
  const FILTER_STORAGE_KEY = 'subtopicMaterialsFilters';

  // Read any previously saved filters from localStorage (once per mount)
  let initialFilters = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(FILTER_STORAGE_KEY) : null;
    if (raw) {
      initialFilters = JSON.parse(raw) || {};
    }
  } catch (err) {
    console.error('Error parsing saved subtopic materials filters:', err);
    initialFilters = {};
  }

  const navigate = useNavigate();
  const [materials, setMaterials] = useState({});  // Materials organized by category
  const [categories, setCategories] = useState(initialFilters.categories || []);
  const [courses, setCourses] = useState(initialFilters.courses || []);
  const [subjects, setSubjects] = useState(initialFilters.subjects || []);
  const [topics, setTopics] = useState(initialFilters.topics || []);
  const [subtopics, setSubtopics] = useState(initialFilters.subtopics || []);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Prefer parent-driven props first, then saved filters, then null
  const [currentSelectedCourse, setCurrentSelectedCourse] = useState(
    selectedCourse || initialFilters.courseId || null
  );
  const [currentSelectedSubject, setCurrentSelectedSubject] = useState(
    selectedSubject || initialFilters.subjectId || null
  );
  const [currentSelectedTopic, setCurrentSelectedTopic] = useState(
    selectedTopic || initialFilters.topicId || null
  );
  const [selectedSubtopic, setSelectedSubtopic] = useState(
    subtopicId || initialFilters.subtopicId || null
  );
  const [activeCategory, setActiveCategory] = useState(
    initialFilters.categoryId || null
  );
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({});  // Pagination for each category
  const [isViewerModalVisible, setIsViewerModalVisible] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [currentMaterialId, setCurrentMaterialId] = useState(null);
  const [deviceVerification, setDeviceVerification] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    percent: 0
  });
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isPrepareModalVisible, setIsPrepareModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ loaded: 0, total: 0, percent: 0 });
  const [prepareProgress, setPrepareProgress] = useState({ loaded: 0, total: 0, percent: 0 });
  const [isHlsUploadModalVisible, setIsHlsUploadModalVisible] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [localPending, setLocalPending] = useState([]);
  const [localPendingPagination, setLocalPendingPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [localPendingLoading, setLocalPendingLoading] = useState(false);

  // Link existing VdoCipher video modal state
  const [isLinkVideoModalVisible, setIsLinkVideoModalVisible] = useState(false);
  const [isLinkingVideo, setIsLinkingVideo] = useState(false);
  const [linkVideoForm] = Form.useForm();

  // Fetch categories for tabs
  const fetchCategories = async () => {
    try {
      const response = await studyMaterialCategoriesService.getStudyMaterialCategories(1, 100);
      console.log('Categories API Response:', response);
      if (response.status === 'success') {
        const categoriesData = response.data || [];
        console.log('Fetched categories:', categoriesData);
        setCategories(categoriesData);

        // Persist categories to localStorage along with filters
        try {
          const raw = localStorage.getItem(FILTER_STORAGE_KEY);
          const existing = raw ? JSON.parse(raw) || {} : {};
          localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify({ ...existing, categories: categoriesData })
          );
        } catch (err) {
          console.error('Error caching categories for subtopic materials:', err);
        }
        
        if (categoriesData.length > 0) {
          const firstCategoryId = categoriesData[0].id;
          console.log('Setting initial category:', firstCategoryId);

          // Only set default category if none is already selected (e.g. from saved filters)
          setActiveCategory((prev) => prev || firstCategoryId);

          // If we already have a selected subtopic and category, data loading is handled
          // by the [selectedSubtopic, activeCategory] effect below.
        }
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories');
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const response = await coursesService.getCourses();
      // The response is an array directly, not nested in data.courses
      const coursesData = response || [];
      setCourses(coursesData);
      console.log('Fetched courses:', coursesData); // Debug log

      // Persist courses to localStorage along with filters
      try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) || {} : {};
        localStorage.setItem(
          FILTER_STORAGE_KEY,
          JSON.stringify({ ...existing, courses: coursesData })
        );
      } catch (err) {
        console.error('Error caching courses for subtopic materials:', err);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Failed to fetch courses');
    }
  };

  // Fetch subjects based on selected course
  const fetchSubjects = async (courseId) => {
    if (!courseId) {
      setSubjects([]);
      return;
    }
    try {
      const response = await subjectsService.getSubjects(1, 100, courseId);
      console.log('Subjects API Response:', response);
      if (response.status === 'success') {
        // Extract the subjects array from the nested data structure
        const subjectsData = response.data.subjects || [];
        setSubjects(subjectsData);

        // Persist subjects for the current course
        try {
          const raw = localStorage.getItem(FILTER_STORAGE_KEY);
          const existing = raw ? JSON.parse(raw) || {} : {};
          localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify({ ...existing, subjects: subjectsData })
          );
        } catch (err) {
          console.error('Error caching subjects for subtopic materials:', err);
        }
      } else {
        throw new Error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      message.error('Failed to fetch subjects');
      setSubjects([]);
    }
  };

  // Fetch topics based on selected subject
  const fetchTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      const response = await topicsService.getTopicsBySubject(subjectId);
      const topicsData = response.data.topics || [];
      setTopics(topicsData);

      // Persist topics for the current subject
      try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) || {} : {};
        localStorage.setItem(
          FILTER_STORAGE_KEY,
          JSON.stringify({ ...existing, topics: topicsData })
        );
      } catch (err) {
        console.error('Error caching topics for subtopic materials:', err);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      message.error('Failed to fetch topics');
    }
  };

  // Fetch subtopics based on selected topic
  const fetchSubtopics = async (topicId) => {
    if (!topicId) {
      setSubtopics([]);
      return;
    }
    try {
      const response = await subtopicsService.getSubtopicsByTopic(topicId);
      const subtopicsData = response.data.subtopics || [];
      setSubtopics(subtopicsData);

      // Persist subtopics for the current topic
      try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) || {} : {};
        localStorage.setItem(
          FILTER_STORAGE_KEY,
          JSON.stringify({ ...existing, subtopics: subtopicsData })
        );
      } catch (err) {
        console.error('Error caching subtopics for subtopic materials:', err);
      }
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      message.error('Failed to fetch subtopics');
    }
  };

  // Fetch materials for a specific subtopic and category
  const fetchMaterials = async (subtopicId, categoryId, page = 1) => {
    console.log('fetchMaterials called with:', { subtopicId, categoryId, page });
    if (!subtopicId || !categoryId) {
      console.log('Missing required parameters:', { subtopicId, categoryId });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Making API call to get materials');
      const response = await subtopicMaterialsService.getMaterials(subtopicId, page, 10); // Fixed page size
      console.log('API response:', response);
      
      // Check if response exists
      if (!response) {
        throw new Error('No response received from API');
      }

      // Handle the response format
      if (response.data && response.data.items) {
        const materialsData = response.data.items;
        console.log('All materials data:', materialsData);
        
        // Filter materials for the current category
        const categoryMaterials = materialsData.filter(m => m.material_category_id === categoryId);
        console.log('Filtered materials for category:', categoryId, categoryMaterials);
        
        // Update materials state with the filtered data
        setMaterials(prev => ({
          ...prev,
          [categoryId]: categoryMaterials
        }));

        // Update pagination for this specific category
        setPagination(prev => ({
          ...prev,
          [categoryId]: {
            current: response.data.page || 1,
            pageSize: 10,
            total: response.data.total || 0
          }
        }));

        // Store device verification info
        if (response.device_verification) {
          setDeviceVerification(response.device_verification);
          
          // Show device verification status
          if (!response.device_verification.is_authorized) {
            message.warning(response.device_verification.message || 'Device not authorized to access materials');
          }
        }

        // Log the final state update
        console.log('Updated materials state:', {
          categoryId,
          materialsCount: categoryMaterials.length,
          pagination: {
            current: response.data.page || 1,
            total: response.data.total || 0
          }
        });
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format - missing items property');
      }

    } catch (error) {
      console.error('Error in fetchMaterials:', error);
      let errorMessage = `Failed to fetch materials: ${error.message}`;
      
      // Handle specific error cases
      if (error.message.includes('fingerprint')) {
        errorMessage = 'Unable to generate device fingerprint. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change for a specific category
  const handleTableChange = (newPagination, categoryId) => {
    console.log('Table change for category:', categoryId, 'new pagination:', newPagination);
    
    // Update pagination for this category
    setPagination(prev => ({
      ...prev,
      [categoryId]: newPagination
    }));
    
    // Fetch materials for this category with the new page
    if (selectedSubtopic) {
      fetchMaterials(selectedSubtopic, categoryId, newPagination.current);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  // Ensure dependent options are loaded when we have saved selections but empty arrays
  useEffect(() => {
    if (currentSelectedCourse && subjects.length === 0) {
      fetchSubjects(currentSelectedCourse);
    }
  }, [currentSelectedCourse]);

  useEffect(() => {
    if (currentSelectedSubject && topics.length === 0) {
      fetchTopics(currentSelectedSubject);
    }
  }, [currentSelectedSubject]);

  useEffect(() => {
    if (currentSelectedTopic && subtopics.length === 0) {
      fetchSubtopics(currentSelectedTopic);
    }
  }, [currentSelectedTopic]);

  // Persist current selection to localStorage
  useEffect(() => {
    try {
      const data = {
        courseId: currentSelectedCourse,
        subjectId: currentSelectedSubject,
        topicId: currentSelectedTopic,
        subtopicId: selectedSubtopic,
        categoryId: activeCategory,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving subtopic materials filters:', err);
    }
  }, [currentSelectedCourse, currentSelectedSubject, currentSelectedTopic, selectedSubtopic, activeCategory]);

  useEffect(() => {
    if (selectedCourse) {
      fetchSubjects(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopic) {
      fetchSubtopics(selectedTopic);
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (selectedSubtopic && activeCategory) {
      console.log('useEffect triggered for materials fetch:', {
        selectedSubtopic,
        activeCategory
      });
      fetchMaterials(selectedSubtopic, activeCategory);
    }
  }, [selectedSubtopic, activeCategory]);

  // Fetch local pending (completed local videos) list
  const fetchLocalPending = async (page = 1) => {
    setLocalPendingLoading(true);
    try {
      const response = await subtopicMaterialsService.getLocalPendingVideos(page, localPendingPagination.pageSize);
      // response example shape: { status: 'success', data: { items, page, pages, per_page, total } }
      const data = response.data || {};
      setLocalPending(data.items || []);
      setLocalPendingPagination({
        current: data.page || 1,
        pageSize: data.per_page || 20,
        total: data.total || 0
      });
    } catch (error) {
      console.error('Error fetching local pending videos:', error);
      message.error('Failed to fetch local pending materials');
    } finally {
      setLocalPendingLoading(false);
    }
  };

  const handleLocalTableChange = (newPagination) => {
    setLocalPendingPagination(newPagination);
    fetchLocalPending(newPagination.current);
  };

  useEffect(() => {
    if (selectedCourse) {
      setCurrentSelectedCourse(selectedCourse);
      fetchSubjects(selectedCourse);
    }
    if (selectedSubject) {
      setCurrentSelectedSubject(selectedSubject);
      fetchTopics(selectedSubject);
    }
    if (selectedTopic) {
      setCurrentSelectedTopic(selectedTopic);
      fetchSubtopics(selectedTopic);
    }
    if (subtopicId) {
      setSelectedSubtopic(subtopicId);
      if (categories.length > 0 && activeCategory) {
        fetchMaterials(subtopicId, activeCategory);
      }
    }
  }, [selectedCourse, selectedSubject, selectedTopic, subtopicId]);

  const handleCourseChange = (value) => {
    setCurrentSelectedCourse(value);
    // Reset dependent selections when course changes
    setCurrentSelectedSubject(null);
    setCurrentSelectedTopic(null);
    setSelectedSubtopic(null);
    setSubjects([]);
    setTopics([]);
    setSubtopics([]);
    setMaterials({});
    fetchSubjects(value);
  };

  const handleSubjectChange = (value) => {
    setCurrentSelectedSubject(value);
    // Reset dependent selections when subject changes
    setCurrentSelectedTopic(null);
    setSelectedSubtopic(null);
    setTopics([]);
    setSubtopics([]);
    setMaterials({});
    fetchTopics(value);
  };

  const handleTopicChange = (value) => {
    setCurrentSelectedTopic(value);
    // Reset dependent selections when topic changes
    setSelectedSubtopic(null);
    setSubtopics([]);
    setMaterials({});
    fetchSubtopics(value);
  };

  const handleSubtopicChange = (value) => {
    console.log('handleSubtopicChange called with value:', value);
    setSelectedSubtopic(value);
    
    // Reset materials state when subtopic changes
    setMaterials({});
    
    // If we have categories, fetch materials for the active category
    if (categories.length > 0 && activeCategory) {
      console.log('Fetching materials for new subtopic:', {
        subtopicId: value,
        categoryId: activeCategory
      });
      fetchMaterials(value, activeCategory);
    } else {
      console.log('No active category or categories not loaded yet');
    }
  };

  const showModal = () => {
    const currentCategory = categories.find(c => c.id === activeCategory);
    if (currentCategory?.code === 'VIDEOS') {
      setIsHlsUploadModalVisible(true);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      console.log('Starting handleSubmit');
      const values = await form.validateFields();
      console.log('Form values:', values);
      
      // Show upload progress
      console.log('Showing upload progress');
      setLoading(true);
      setIsUploadModalVisible(true);
      setCurrentFileName(values.name);

      const formData = new FormData();
      formData.append('subtopic_id', selectedSubtopic);
      formData.append('material_category_id', activeCategory);
      formData.append('name', values.name);
      formData.append('file', values.material_path.file);
      formData.append('created_by', 1);
      formData.append('updated_by', 1);

      // Get the current category
      const currentCategory = categories.find(c => c.id === activeCategory);
      
      // If it's a video category, get the duration
      if (currentCategory?.code === 'VIDEOS') {
        console.log('Getting video duration');
        const videoFile = values.material_path.file;
        const videoDuration = await getVideoDuration(videoFile);
        formData.append('video_duration', videoDuration);
      }

      console.log('Starting file upload');
      
      // Use appropriate upload method based on category
      if (currentCategory?.code === 'VIDEOS') {
        // Use VdoCipher upload endpoint for videos (DRM protected)
        console.log('Uploading video...');
        await subtopicMaterialsService.createVdoCipherMaterial(formData, (progress) => {
          console.log('Upload progress:', progress);
          setUploadProgress({
            loaded: progress.loaded,
            total: progress.total,
            percent: progress.percent
          });
        });
        message.success('Video uploaded! Processing will take a few minutes.');
      } else {
        // Use document upload endpoint for documents
        await subtopicMaterialsService.createDocumentMaterial(formData, (progress) => {
          console.log('Upload progress:', progress);
          setUploadProgress({
            loaded: progress.loaded,
            total: progress.total,
            percent: progress.percent
          });
        });
      }
      
      console.log('Upload completed');
      message.success('Material added successfully');
      setIsModalVisible(false);
      handleCancel();
      fetchMaterials(selectedSubtopic, activeCategory);
    } catch (error) {
      console.error('Error saving material:', error);
      message.error(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
      setIsUploadModalVisible(false);
      setUploadProgress({ loaded: 0, total: 0, percent: 0 });
    }
  };

  // Function to get video duration
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

  // Update the Upload component's beforeUpload function
  const beforeUpload = (file) => {
    // Get the current category
    const currentCategory = categories.find(c => c.id === activeCategory);
    
    // Check if the category code is VIDEOS
    if (currentCategory?.code === 'VIDEOS') {
      // For VIDEOS category, only accept video files
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('You can only upload video files for this category!');
        return false;
      }
    } else {
      // For other categories, only accept PDF files
      const isPdf = file.type === 'application/pdf';
      if (!isPdf) {
        message.error('You can only upload PDF files for this category!');
        return false;
      }
    }
    return false; // Return false to prevent auto upload
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await subtopicMaterialsService.deleteMaterial(id);
      message.success('Material deleted successfully');
      fetchMaterials(selectedSubtopic, activeCategory);
    } catch (error) {
      console.error('Error deleting material:', error);
      message.error(error.message || 'Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterial = async (materialId, fileName, categoryId) => {
    try {
      console.log(`Viewing material: ${materialId}, category: ${categoryId}`);
      
      // Get the current category
      const currentCategory = categories.find(c => c.id === categoryId);
      
      // Check if this is a VdoCipher video (for testing, open in new tab)
      const material = materials[categoryId]?.find(m => m.id === materialId);
      console.log('Material details:', material);
      console.log('Current category:', currentCategory);
      console.log('Has VdoCipher video ID:', material?.vdocipher_video_id);
      
      if (currentCategory?.code === 'VIDEOS' && material?.vdocipher_video_id) {
        console.log('✅ VdoCipher video detected! Opening in new tab...');
        console.log('Video ID:', material.vdocipher_video_id);
        
        // Navigate to VdoCipher player page using vdocipher_video_id
        const videoUrl = `/review-class/${material.vdocipher_video_id}?name=${encodeURIComponent(fileName)}`;
        console.log('Navigating to:', videoUrl);
        navigate(videoUrl, {
          state: {
            from: window.location.pathname + window.location.search
          }
        });
        return;
      }
      
      console.log('📹 Not a VdoCipher video, using existing video player logic');
      
      // For non-VdoCipher videos, continue with existing logic
      setLoading(true);
      setIsPrepareModalVisible(true);
      
      // Show mobile protection warning for protected content
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isMobile && currentCategory?.is_protected) {
        Modal.info({
          title: '📱 Mobile Device - Protected Content',
          content: (
            <div>
              <p><strong>You are viewing protected educational content.</strong></p>
              <p style={{ marginTop: 8 }}>For security purposes:</p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                <li>Screenshots and screen recordings are <strong>strictly prohibited</strong></li>
                {isIOS && (
                  <li><strong>Do NOT swipe from top-right to open Control Center</strong> - This will close the video immediately (screen recording button is there)</li>
                )}
                <li>Switching apps or tabs will close the video instantly</li>
                <li>Your viewing session is watermarked with your name and ID</li>
                <li>All capture attempts are logged and may result in account suspension</li>
              </ul>
              <p style={{ marginTop: 12, padding: 8, background: '#fff7e6', border: '1px solid #ffa940', borderRadius: 4 }}>
                <strong>⚠️ Important:</strong> You can freely rotate your device to landscape/portrait mode for comfortable viewing.
              </p>
              <p style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                This helps protect intellectual property and ensures fair use for all students.
              </p>
            </div>
          ),
          okText: 'I Understand',
          width: 450,
          centered: true
        });
      }
      
      if (currentCategory?.code === 'VIDEOS') {
        // Handle video viewing
        const response = await subtopicMaterialsService.viewMaterial(materialId, (progress) => {
          setPrepareProgress(progress);
        });

        // Check if this is an HLS video
        if (response.type === 'hls' && response.redirect) {
          // For HLS videos, use the stream URL directly
          const streamUrl = response.redirect;
          console.log('HLS Stream URL:', streamUrl);
          // Convert relative URL to absolute URL using the configured base URL
          const absoluteUrl = streamUrl.startsWith('http') ? streamUrl : `${BASE_URL}${streamUrl}`;
          console.log('Absolute HLS Stream URL:', absoluteUrl);
          setCurrentFileUrl(absoluteUrl);
          setIsStreaming(true);
        } else {
          // For regular videos, use the direct URL
          console.log('Regular file URL:', response);
          setCurrentFileUrl(response);
          setIsStreaming(true);
        }
      } else {
        // Handle document viewing
        const response = await subtopicMaterialsService.viewDocument(materialId, (progress) => {
          setPrepareProgress(progress);
        });
        
        // Convert relative document URL to absolute URL
        const documentUrl = response.data.document_url;
        console.log('Document URL from API:', documentUrl);
        const absoluteUrl = documentUrl.startsWith('http') ? documentUrl : `${BASE_URL}${documentUrl}`;
        console.log('Absolute Document URL:', absoluteUrl);
        
        setCurrentFileUrl(absoluteUrl);
      }

      setCurrentFileName(fileName);
      setCurrentCategoryId(categoryId);
      setCurrentMaterialId(materialId);
      setIsViewerModalVisible(true);
    } catch (error) {
      console.error('Error viewing material:', error);
      message.error('Failed to access the file. Please try again.');
    } finally {
      setLoading(false);
      setIsPrepareModalVisible(false);
    }
  };

  const handleDownloadMaterial = async (materialId) => {
    try {
      const fileUrl = await subtopicMaterialsService.downloadMaterial(materialId);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      
      // Get the material details to set the correct filename
      const material = materials[activeCategory]?.find(m => m.id === materialId);
      if (material) {
        // Get the file extension based on the file type
        const extension = material.file_type === 'video' ? '.mp4' : '.pdf';
        link.download = `${material.name}${extension}`;
      } else {
        link.download = ''; // Let the server set the filename via Content-Disposition
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading material:', error);
      message.error('Failed to download the file. Please try again.');
    }
  };

  const handleFixPath = async (materialId) => {
    try {
      setLoading(true);
      await subtopicMaterialsService.fixPath(materialId);
      message.success('Material path fixed successfully');
      // Refresh the materials list
      fetchMaterials(selectedSubtopic, activeCategory);
    } catch (error) {
      console.error('Error fixing material path:', error);
      message.error('Failed to fix material path');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (materialId) => {
    try {
      setLoading(true);
      await subtopicMaterialsService.retryMaterial(materialId);
      message.success('Material processing retry initiated successfully');
      // Refresh the materials list
      fetchMaterials(selectedSubtopic, activeCategory);
    } catch (error) {
      console.error('Error retrying material processing:', error);
      message.error('Failed to retry material processing');
    } finally {
      setLoading(false);
    }
  };

  const handleViewerModalClose = () => {
    setIsViewerModalVisible(false);
    setCurrentFileUrl(null);
    setCurrentFileName('');
    setCurrentCategoryId(null);
    setCurrentMaterialId(null);
    setIsStreaming(false);
  };

  // Enhanced Modal protection for protected content
  const [isContentProtected, setIsContentProtected] = useState(false);
  const lastVisibilityChangeRef = useRef(Date.now());
  const visibilitySpikeCountRef = useRef(0);
  const screenshotAttemptsRef = useRef(0);
  const lastBlurTimeRef = useRef(0);
  const lastVisibilityTime = useRef(Date.now());
  const [showProtectionWarning, setShowProtectionWarning] = useState(false);

  // Unified security notice modal
  const showSecurityNotice = (subtitle) => {
    try {
      Modal.warning({
        title: 'Action not allowed',
        width: 720,
        centered: true,
        okText: 'I understand',
        content: (
          <div style={{ lineHeight: 1.6 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              {subtitle || 'This content is protected. Screen capture or restricted actions are not permitted.'}
            </div>
            <div style={{ color: '#666' }}>
              <p style={{ marginBottom: 8 }}>
                To safeguard learning materials and comply with our usage policy, certain actions are blocked while viewing protected videos. This helps prevent unauthorized copying, recording, or sharing.
              </p>
              <ul style={{ paddingLeft: 18, marginBottom: 8 }}>
                <li>Screenshot and screen-recording shortcuts are restricted where possible.</li>
                <li>Rapid tab switches, fullscreen exits, and developer tools may close playback.</li>
                <li>Your access may be monitored to ensure a fair and secure experience.</li>
              </ul>
              <p style={{ marginBottom: 0 }}>
                If you believe you need access for accessibility or legitimate educational purposes, please contact support or your administrator.
              </p>
            </div>
          </div>
        )
      });
    } catch (_) {}
  };

  // Check if current content is protected
  useEffect(() => {
    if (currentCategoryId && categories.length > 0) {
      const category = categories.find(c => c.id === currentCategoryId);
      const isProtected = category?.is_protected || false;
      setIsContentProtected(isProtected);
    }
  }, [currentCategoryId, categories]);

  // Modal close handler (always allows closing)
  const handleProtectedModalClose = () => {
    handleViewerModalClose();
  };

  // Add watermark overlay for protected content
  const [watermarkText, setWatermarkText] = useState('');
  
  useEffect(() => {
    if (isContentProtected && isViewerModalVisible) {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User';
      const userId = userInfo.id || 'Unknown';
      const timestamp = new Date().toLocaleString();
      setWatermarkText(`${userName} (ID: ${userId}) - ${timestamp}`);
    }
  }, [isContentProtected, isViewerModalVisible]);

  // Screen capture detection at modal level (Enhanced for Mobile)
  useEffect(() => {
    if (!isContentProtected || !isViewerModalVisible) return;
    
    const handleVisibilityChange = () => {
      const now = Date.now();
      const delta = now - lastVisibilityChangeRef.current;
      lastVisibilityChangeRef.current = now;
      
      if (delta < 200) {
        visibilitySpikeCountRef.current += 1;
      } else {
        visibilitySpikeCountRef.current = 0;
      }

      // Enhanced mobile detection: Check for rapid visibility changes (screenshot indicator)
      if (document.hidden && isContentProtected) {
        const timeSinceLastBlur = now - lastBlurTimeRef.current;
        
        // On mobile, screenshots cause a very brief visibility change (~50-200ms)
        if (timeSinceLastBlur < 300) {
          screenshotAttemptsRef.current += 1;
          
          // If multiple rapid visibility changes detected
          if (screenshotAttemptsRef.current >= 2) {
            setIsViewerModalVisible(false);
            setCurrentFileUrl(null);
            setCurrentFileName('');
            setCurrentCategoryId(null);
            setCurrentMaterialId(null);
            setIsStreaming(false);
            message.error('Screenshot attempt detected! Modal closed for security.');
            setTimeout(() => { 
              showSecurityNotice('We detected a potential screenshot attempt. Screenshots of protected content are not permitted.'); 
            }, 120);
            screenshotAttemptsRef.current = 0;
            return;
          }
        }
        
        // Close modal on any tab switch or app switch
        setIsViewerModalVisible(false);
        setCurrentFileUrl(null);
        setCurrentFileName('');
        setCurrentCategoryId(null);
        setCurrentMaterialId(null);
        setIsStreaming(false);
        message.error('App/Tab switch detected! Modal closed for security.');
        setTimeout(() => { showSecurityNotice('We detected you left the app while viewing protected content.'); }, 120);
        return;
      }

      if (!document.hidden && visibilitySpikeCountRef.current >= 2) {
        setIsViewerModalVisible(false);
        setCurrentFileUrl(null);
        setCurrentFileName('');
        setCurrentCategoryId(null);
        setCurrentMaterialId(null);
        setIsStreaming(false);
        message.error('Suspicious visibility changes! Modal closed for security.');
        setTimeout(() => { showSecurityNotice('We detected suspicious visibility changes while viewing protected content.'); }, 120);
      }
      
      // Reset screenshot attempts counter after 2 seconds of normal activity
      setTimeout(() => {
        screenshotAttemptsRef.current = 0;
      }, 2000);
    };

    const handleBlur = () => {
      if (isContentProtected) {
        const now = Date.now();
        lastBlurTimeRef.current = now;
        
        // Detect iOS Control Center or other system panels
        // On iOS, opening Control Center (swipe from top-right) causes blur + visibility change
        setTimeout(() => {
          if (document.hidden) {
            // User opened Control Center, Notification Center, or switched apps
            setIsViewerModalVisible(false);
            setCurrentFileUrl(null);
            setCurrentFileName('');
            setCurrentCategoryId(null);
            setCurrentMaterialId(null);
            setIsStreaming(false);
            
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              message.error('Control Center/App Switch detected! Video closed.');
              setTimeout(() => { 
                showSecurityNotice('Opening Control Center (swipe from top-right) or switching apps during protected playback is not allowed. This is where screen recording can be started.'); 
              }, 120);
            } else {
              message.error('App interaction detected! Modal closed for security.');
              setTimeout(() => { 
                showSecurityNotice('We detected you opened another app or control panel. For security, protected content has been closed.'); 
              }, 120);
            }
          }
        }, 100);
      }
    };

    // NOTE: We intentionally no longer close on fullscreen exit per request.

    const devtoolsHeuristic = () => {
      try {
        const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
        const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
        if ((widthDelta > 160 || heightDelta > 160) && isContentProtected) {
          setIsViewerModalVisible(false);
          setCurrentFileUrl(null);
          setCurrentFileName('');
          setCurrentCategoryId(null);
          setCurrentMaterialId(null);
          setIsStreaming(false);
          message.error('Developer tools detected! Modal closed for security.');
          setTimeout(() => { showSecurityNotice('Developer tools usage is restricted during protected playback.'); }, 120);
        }
      } catch {}
    };

    const handleKeyDown = (e) => {
      if (isContentProtected) {
        // Prevent common shortcuts
        if (e.key === 'Escape' || e.key === 'F11' || e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        
        // Close on common dev/save/source combos
        const key = (e.key || '').toLowerCase();
        const isCmdOrCtrl = e.metaKey || e.ctrlKey;
        if (
          (isCmdOrCtrl && key === 's') || // Save
          (isCmdOrCtrl && key === 'u') || // View Source
          (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'c')) || // DevTools / Inspect
          (isCmdOrCtrl && e.shiftKey) // Any Cmd/Ctrl + Shift combo
        ) {
          e.preventDefault();
          setIsViewerModalVisible(false);
          setCurrentFileUrl(null);
          setCurrentFileName('');
          setCurrentCategoryId(null);
          setCurrentMaterialId(null);
          setIsStreaming(false);
          message.error('Restricted key combination detected! Modal closed for security.');
          setTimeout(() => { showSecurityNotice('This key combination is restricted while viewing protected content.'); }, 120);
          return false;
        }

        // Detect macOS screenshot shortcuts - immediately close modal
        if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
          console.warn('Screenshot shortcut detected:', e.key);
          
          // Immediately close the modal
          setIsViewerModalVisible(false);
          setCurrentFileUrl(null);
          setCurrentFileName('');
          setCurrentCategoryId(null);
          setCurrentMaterialId(null);
          setIsStreaming(false);
          
          // Show warning message (after state applied)
          message.error('Screenshot attempt detected! Modal closed for security.');
          setTimeout(() => { showSecurityNotice('Screenshots of protected content are not permitted.'); }, 120);
          
          // Optional: Show additional warning after a delay
          setTimeout(() => {
            message.warning('Protected content requires special access. Please contact administrator if you need to take screenshots.');
          }, 2000);
        }
      }
    };

    // Enhanced detection for macOS
    const handleFocus = () => {
      // Check if window lost focus and regained it quickly (possible screenshot)
      const now = Date.now();
      if (now - lastVisibilityTime.current < 100) {
        setShowProtectionWarning(true);
        setTimeout(() => setShowProtectionWarning(false), 2000);
      }
      lastVisibilityTime.current = now;
    };

    // Monitor for rapid focus changes (screenshot indicator)
    let focusTimeout;
    const handleWindowFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (document.hidden) {
          setShowProtectionWarning(true);
          setTimeout(() => setShowProtectionWarning(false), 2000);
        }
      }, 100);
    };

    // Mobile-specific: Detect screen recording start
    const handleMediaDeviceChange = () => {
      if (isContentProtected && navigator.mediaDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const screenCapture = devices.find(d => 
            d.label.toLowerCase().includes('screen') || 
            d.label.toLowerCase().includes('display')
          );
          
          if (screenCapture) {
            setIsViewerModalVisible(false);
            setCurrentFileUrl(null);
            setCurrentFileName('');
            setCurrentCategoryId(null);
            setCurrentMaterialId(null);
            setIsStreaming(false);
            message.error('Screen recording detected! Modal closed for security.');
            setTimeout(() => { 
              showSecurityNotice('Screen recording of protected content is not permitted.'); 
            }, 120);
          }
        }).catch(() => {});
      }
    };

    // Detect when user returns from background (possible screen recording setup)
    const handlePageShow = (event) => {
      if (event.persisted && isContentProtected) {
        // Page was loaded from cache (user returned from background)
        message.warning('Playback was paused while you were away.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', devtoolsHeuristic);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pageshow', handlePageShow);
    
    // Monitor for media device changes (screen recording)
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleMediaDeviceChange);
    }

    // Periodic check for screen recording on mobile (iOS/Android)
    const recordingCheckInterval = setInterval(() => {
      if (isContentProtected && isViewerModalVisible) {
        // Check if page is in background (possible recording)
        if (document.hidden) {
          clearInterval(recordingCheckInterval);
          setIsViewerModalVisible(false);
          setCurrentFileUrl(null);
          setCurrentFileName('');
          setCurrentCategoryId(null);
          setCurrentMaterialId(null);
          setIsStreaming(false);
          message.error('Background activity detected! Modal closed for security.');
        }
      }
    }, 500);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', devtoolsHeuristic);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pageshow', handlePageShow);
      
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleMediaDeviceChange);
      }
      
      clearInterval(recordingCheckInterval);
    };
  }, [isContentProtected, isViewerModalVisible]);

  // Create plugins with proper configuration
  const getPlugins = (isProtected) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
      sidebarTabs: (defaultTabs) => [],
      toolbarPlugin: {
        fullScreenPlugin: {
          // Disable fullscreen for protected documents
          enableShortcuts: !isProtected,
        },
        downloadPlugin: {
          // Disable download for protected documents
          enableShortcuts: !isProtected,
          getFileNameFromUrl: (url) => url.substring(url.lastIndexOf('/') + 1),
          // Hide download button for protected documents
          renderDownloadButton: (props) => isProtected ? <></> : props.onClick ? 
            <Button type="primary" icon={<DownloadOutlined />} onClick={props.onClick}>Download</Button> : null,
        },
        printPlugin: {
          // Disable print for protected documents
          enableShortcuts: !isProtected,
          // Hide print button for protected documents
          renderPrintButton: (props) => isProtected ? <></> : props.onClick ? 
            <Button onClick={props.onClick}>Print</Button> : null,
        },
      },
    });

    const zoomPluginInstance = zoomPlugin();
    const scrollModePluginInstance = scrollModePlugin();
    const searchPluginInstance = searchPlugin();
    const selectionModePluginInstance = selectionModePlugin({
      // Disable text selection for protected documents
      enableSelection: !isProtected,
    });

    return [
      defaultLayoutPluginInstance,
      zoomPluginInstance,
      scrollModePluginInstance,
      searchPluginInstance,
      selectionModePluginInstance,
    ];
  };

  const renderMaterialActions = (material) => {
    // Check if material_path starts with 'temp' - if so, show refresh button instead of view
    const hasTempPath = material.material_path && material.material_path.startsWith('temp');
    const isMobile = window.innerWidth < 768;
    
    // Always show View button for VdoCipher and other videos
    return (
      <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'} wrap>
        {/* ALWAYS show View button */}
        <Button
          type="primary"
          size={isMobile ? 'small' : 'middle'}
          icon={<EyeOutlined />}
          onClick={() => handleViewMaterial(material.id, material.name, material.material_category_id)}
        >
          {isMobile ? '' : 'View'}
        </Button>
        
        {/* Show additional buttons based on status */}
        {material.processing_status === 'processing' && (
          <Tag color="processing" icon={<Spin size="small" />}>
            {isMobile ? '...' : 'Processing'}
          </Tag>
        )}
        
        {material.processing_status === 'failed' && (
          <Button
            type="primary"
            size={isMobile ? 'small' : 'middle'}
            icon={<RedoOutlined />}
            onClick={() => handleRetry(material.id)}
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            {isMobile ? '' : 'Retry'}
          </Button>
        )}
        
        {hasTempPath && (
          <Button
            type="primary"
            size={isMobile ? 'small' : 'middle'}
            icon={<ReloadOutlined />}
            onClick={() => handleFixPath(material.id)}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            {isMobile ? '' : 'Refresh'}
          </Button>
        )}
        
        {/* Delete button */}
        <Button
          type="primary"
          danger
          size={isMobile ? 'small' : 'middle'}
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(material.id)}
        >
          {isMobile ? '' : 'Delete'}
        </Button>
      </Space>
    );
  };

  const [archivingIds, setArchivingIds] = useState({});

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (name, record) => {
        // Determine if this is a video based on multiple criteria
        const isVideo = record.extension_type === 'm3u8' || 
                       record.file_type === 'video' || 
                       (record.material_category_id && categories.find(c => c.id === record.material_category_id)?.code === 'VIDEOS');
        
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {isVideo ? (
                <PlayCircleOutlined style={{ marginRight: 4 }} />
              ) : (
                <FilePdfOutlined style={{ marginRight: 4 }} />
              )}
              {isVideo ? 'Video' : 'PDF'}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      responsive: ['md'],
      render: (size, record) => (
        <div>
          <div>{(size / 1024 / 1024).toFixed(2)} MB</div>
          {record.video_duration && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {record.video_duration}s
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'processing_status',
      key: 'processing_status',
      width: 120,
      render: (status, record) => {
        switch (status) {
          case 'pending':
            return (
              <Tag color="processing">
                {status}
              </Tag>
            );
          case 'failed':
            return (
              <div>
                <Tag color="error">{status}</Tag>
                {record.processing_error && (
                  <Tooltip title={record.processing_error}>
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                      {record.processing_error}
                    </div>
                  </Tooltip>
                )}
              </div>
            );
          case 'completed':
            return <Tag color="success">{status}</Tag>;
          default:
            return <Tag color="default">{status || 'unknown'}</Tag>;
        }
      }
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      responsive: ['lg'],
      render: (date) => {
        const dateObj = new Date(date);
        return (
          <div>
            <div>{dateObj.toLocaleDateString()}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {dateObj.toLocaleTimeString()}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => renderMaterialActions(record)
    }
  ];

  const handleHlsUploadSuccess = () => {
    fetchMaterials(selectedSubtopic, activeCategory);
  };

  const items = categories.map(category => ({
    key: category.id.toString(),
    label: category.name,
    children: (
      <div>
        <div style={{ marginBottom: 16 }}>
          {category.code === 'VIDEOS' ? (
            <Space>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={() => {
                  setActiveCategory(category.id);
                  setIsHlsUploadModalVisible(true);
                }}
                disabled={!selectedSubtopic}
              >
                Add Video
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  setActiveCategory(category.id);
                  linkVideoForm.resetFields();
                  setIsLinkVideoModalVisible(true);
                }}
                disabled={!selectedSubtopic}
              >
                Link Video
              </Button>
            </Space>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setActiveCategory(category.id);
                setIsModalVisible(true);
              }}
              disabled={!selectedSubtopic}
            >
              Add {category.name}
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={materials[category.id] || []}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination[category.id] || { current: 1, pageSize: 10, total: 0 },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          onChange={(newPagination) => handleTableChange(newPagination, category.id)}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </div>
    )
  }));

  // Add polling effect for materials
  useEffect(() => {
    if (!selectedSubtopic || !activeCategory) return;
    if (isStreaming) return;

    const pollMaterials = async () => {
      try {
        console.log('Polling materials for subtopic:', selectedSubtopic);
        const response = await subtopicMaterialsService.getMaterials(selectedSubtopic, 1, 10); // Always poll page 1
        
        if (response.data?.items) {
          // Filter materials for the current category
          const categoryMaterials = response.data.items.filter(m => m.material_category_id === activeCategory);
          
          // Update materials state with the filtered data
          setMaterials(prev => ({
            ...prev,
            [activeCategory]: categoryMaterials
          }));

          // Update pagination for the active category
          setPagination(prev => ({
            ...prev,
            [activeCategory]: {
              current: 1,
              pageSize: 10,
              total: response.data.total || 0
            }
          }));

          // Store device verification info
          if (response.device_verification) {
            setDeviceVerification(response.device_verification);
          }
        }
      } catch (error) {
        console.error('Error polling materials:', error);
      }
    };

    // Initial poll
    pollMaterials();

    // Set up polling interval
    const pollInterval = setInterval(pollMaterials, 30000); // Poll every 30 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedSubtopic, activeCategory, isStreaming]);

  // Cleanup monitoring interval on component unmount (no-op now that monitoring is removed)

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        {deviceVerification && (
          <Alert
            message={deviceVerification.message}
            type={deviceVerification.is_authorized ? "success" : "warning"}
            style={{ marginBottom: 16 }}
          />
        )}
        
        <div>
          <Form layout="vertical" style={{ marginBottom: 16 }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              <Form.Item label="Course" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Select Course"
                  value={currentSelectedCourse}
                  onChange={handleCourseChange}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={courses.map(course => ({
                    value: course.id,
                    label: course.name
                  }))}
                  size={window.innerWidth < 768 ? 'small' : 'middle'}
                />
              </Form.Item>
              <Form.Item label="Subject" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Select Subject"
                  disabled={!currentSelectedCourse}
                  value={currentSelectedSubject}
                  onChange={handleSubjectChange}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={subjects.map(subject => ({
                    value: subject.id,
                    label: subject.name
                  }))}
                  size={window.innerWidth < 768 ? 'small' : 'middle'}
                />
              </Form.Item>
              <Form.Item label="Topic" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Select Topic"
                  disabled={!currentSelectedSubject}
                  value={currentSelectedTopic}
                  onChange={handleTopicChange}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={topics.map(topic => ({
                    value: topic.id,
                    label: topic.name
                  }))}
                  size={window.innerWidth < 768 ? 'small' : 'middle'}
                />
              </Form.Item>
              <Form.Item label="Subtopic" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Select Subtopic"
                  disabled={!currentSelectedTopic}
                  value={selectedSubtopic}
                  onChange={handleSubtopicChange}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={subtopics.map(subtopic => ({
                    value: subtopic.id,
                    label: subtopic.name
                  }))}
                  size={window.innerWidth < 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </div>
          </Form>

          {selectedSubtopic && (
            <Tabs
              activeKey={activeCategory?.toString()}
              onChange={(key) => {
                const categoryId = parseInt(key);
                setActiveCategory(categoryId);
                if (selectedSubtopic) {
                  fetchMaterials(selectedSubtopic, categoryId);
                }
              }}
              items={items}
            />
          )}
        </div>

        <Modal
          title="Add Material"
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter material name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="material_path"
              label="Material File"
              rules={[{ required: true, message: 'Please upload a file' }]}
            >
              <Upload
                maxCount={1}
                beforeUpload={beforeUpload}
                accept={categories.find(c => c.id === activeCategory)?.code === 'VIDEOS' 
                  ? 'video/*' 
                  : 'application/pdf'}
              >
                <Button icon={<UploadOutlined />}>
                  {categories.find(c => c.id === activeCategory)?.code === 'VIDEOS' 
                    ? 'Select Video File' 
                    : 'Select PDF File'}
                </Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        {/* Link existing VdoCipher video */}
        <Modal
          title="Link Existing VdoCipher Video"
          open={isLinkVideoModalVisible}
          confirmLoading={isLinkingVideo}
          onOk={async () => {
            try {
              if (!selectedSubtopic || !activeCategory) {
                message.error('Please select a subtopic and category before linking a video.');
                return;
              }

              const values = await linkVideoForm.validateFields();
              const payload = {
                video_id: values.video_id,
                subtopic_id: selectedSubtopic,
                material_category_id: activeCategory,
                name: values.name
              };

              setIsLinkingVideo(true);
              await subtopicMaterialsService.linkVdoCipherMaterial(payload);
              message.success('Video linked successfully');
              setIsLinkVideoModalVisible(false);
              linkVideoForm.resetFields();

              // Refresh materials list for the current category
              fetchMaterials(selectedSubtopic, activeCategory);
            } catch (error) {
              if (error?.errorFields) {
                // Validation error, just return
                return;
              }

              console.error('Error linking VdoCipher video:', error);

              // Prefer structured backend error details when available.
              // The service may throw either the full Axios error or just response.data,
              // so support both shapes here.
              const data = error?.response?.data ?? error;
              let backendMessage = null;

              // 1) Try to extract the most specific VdoCipher message from `details`
              if (data?.details && typeof data.details === 'string') {
                // Example: 'VdoCipher API error: {"message":"Invalid videoId found"}'
                const jsonMatch = data.details.match(/\{.*\}$/);
                if (jsonMatch) {
                  try {
                    const inner = JSON.parse(jsonMatch[0]);
                    if (inner?.message) {
                      // Normalize common VdoCipher messages for better UX
                      if (inner.message.includes('Invalid videoId')) {
                        backendMessage = 'Invalid video ID';
                      } else {
                        backendMessage = inner.message;
                      }
                    }
                  } catch (e) {
                    // Ignore JSON parse errors and fall back to raw details
                  }
                }

                if (!backendMessage) {
                  backendMessage = data.details;
                }
              }

              // 2) Fall back to top-level error/message fields
              if (!backendMessage) {
                if (typeof data === 'string') {
                  backendMessage = data;
                } else {
                  backendMessage = data?.message || data?.error || null;
                }
              }

              const fallbackMessage = error?.message || 'Failed to link video. Please try again.';

              message.error(backendMessage || fallbackMessage);
            } finally {
              setIsLinkingVideo(false);
            }
          }}
          onCancel={() => {
            setIsLinkVideoModalVisible(false);
            linkVideoForm.resetFields();
          }}
        >
          <Form form={linkVideoForm} layout="vertical">
            <Form.Item
              name="video_id"
              label="VdoCipher Video ID"
              rules={[{ required: true, message: 'Please enter the VdoCipher video ID' }]}
            >
              <Input placeholder="Enter VdoCipher video ID (e.g. 80194d2edc114b8f9d36a9b4115fa16b)" />
            </Form.Item>
            <Form.Item
              name="name"
              label="Material Name"
              rules={[{ required: true, message: 'Please enter a material name' }]}
            >
              <Input placeholder="Enter a display name for this video" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Upload Progress Modal */}
        <LoadingProgressModal
          visible={isUploadModalVisible}
          progress={uploadProgress}
          fileName={currentFileName}
        />

        {/* Video Preparation Modal */}
        <VideoPreparationModal
          visible={isPrepareModalVisible}
          progress={prepareProgress}
          fileName={currentFileName}
        />

        {/* Document Viewer Modal */}
        <Modal
          title={
            <div>
              <div>View {categories.find(c => c.id === currentCategoryId)?.code === 'VIDEOS' ? 'Video' : 'Document'}: {currentFileName}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Protection Status: {currentCategoryId ? (categories.find(c => c.id === currentCategoryId)?.is_protected ? 'Protected' : 'Not Protected') : 'Unknown'}
              </div>
            </div>
          }
          open={isViewerModalVisible}
          onCancel={handleProtectedModalClose}
          maskClosable={!isContentProtected}
          closable={!isContentProtected}
          keyboard={!isContentProtected}
          width={1200}
          style={{ top: 20 }}
          bodyStyle={{ padding: '12px', position: 'relative' }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {!(currentCategoryId && categories.find(c => c.id === currentCategoryId)?.is_protected) && (
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      if (currentMaterialId) {
                        handleDownloadMaterial(currentMaterialId);
                      } else {
                        message.error('Could not identify the material to download');
                      }
                    }}
                  >
                    Download
                  </Button>
                )}
              </div>
              <Button onClick={handleProtectedModalClose}>Close</Button>
            </div>
          }
          destroyOnClose
        >
          {/* Watermark Overlay for Protected Content */}
          {isContentProtected && watermarkText && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.3)',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 9999,
                whiteSpace: 'nowrap',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              {watermarkText}
            </div>
          )}
          
          {/* Additional corner watermarks for mobile */}
          {isContentProtected && watermarkText && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                pointerEvents: 'none',
                zIndex: 9999,
                userSelect: 'none',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {watermarkText}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                pointerEvents: 'none',
                zIndex: 9999,
                userSelect: 'none',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {watermarkText}
              </div>
            </>
          )}
          
          {/* Conditionally render video player or document viewer based on category code */}
          <div className={isContentProtected ? 'protected-content' : ''}>
            {currentFileUrl && (
              categories.find(c => c.id === currentCategoryId)?.code === 'VIDEOS' ? (
                <>
                  {(/\.mpd($|\?)/.test(currentFileUrl) && window.__DRM_CONFIG__?.licenseServers) ? (
                    <DRMVideoPlayer
                      key={`drm-${currentFileUrl}`}
                      dashUrl={currentFileUrl}
                      hlsUrl={null}
                      licenseServers={window.__DRM_CONFIG__?.licenseServers || {}}
                      authToken={window.__DRM_CONFIG__?.authToken}
                      onError={(e) => {
                        console.error('DRM Playback Error:', e);
                        message.error('Failed to start DRM playback.');
                      }}
                    />
                  ) : (currentFileUrl.includes('.m3u8') || currentFileUrl.includes('/stream')) ? (
                    <div style={{ position: 'relative' }}>
                      <HlsVideoViewer 
                        key={`hls-${currentFileUrl}`}
                        currentFileUrl={currentFileUrl}
                        currentFileName={currentFileName}
                        currentCategoryId={currentCategoryId}
                        categories={categories}
                        onError={(error) => {
                          console.error('HLS Video Error:', error);
                          message.error('Failed to play HLS video. Please try again.');
                        }}
                      />
                    </div>
                  ) : (
                    <VideoViewer 
                      key={`video-${currentFileUrl}`}
                      currentFileUrl={currentFileUrl}
                      currentFileName={currentFileName}
                      currentCategoryId={currentCategoryId}
                      categories={categories}
                      resolutions={['240p', '360p', '480p', '720p', '1080p']}
                    />
                  )}
                </>
              ) : (
                <DocumentViewer 
                  currentCategoryId={currentCategoryId} 
                  categories={categories} 
                  currentFileUrl={currentFileUrl}
                  currentFileName={currentFileName}
                />
              )
            )}
          </div>
        </Modal>

        {/* HLS Video Upload Modal */}
        <HlsVideoUpload
          visible={isHlsUploadModalVisible}
          onCancel={() => setIsHlsUploadModalVisible(false)}
          onSuccess={handleHlsUploadSuccess}
          subtopicId={selectedSubtopic}
          categoryId={activeCategory}
        />
      </Space>
    </Card>
  );
};

export default SubtopicMaterialsList; 
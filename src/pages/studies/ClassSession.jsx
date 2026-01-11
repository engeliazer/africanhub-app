import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Avatar, 
  Divider, 
  Breadcrumb, 
  List, 
  Tag, 
  Button, 
  Empty, 
  Space,
  Tooltip,
  Modal,
  Spin,
  Alert,
  message,
  Table,
  Tree,
  Tabs,
  Input
} from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  ReadOutlined, 
  FilePdfOutlined, 
  HomeOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined,
  LaptopOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  ExpandOutlined,
  CompressOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import coursesService from '../../services/courses';
import userService from '../../services/user';
import DocumentViewer from '../../components/document/DocumentViewer';
import HlsVideoViewer from '../../components/document/HlsVideoViewer';
import DRMVideoPlayer from '../../components/document/DRMVideoPlayer';
import subtopicMaterialsService from '../../services/subtopicMaterials';
import studyMaterialCategoriesService from '../../services/studyMaterialCategories';
import { getTokenLocal } from '../../services/utils/authorization';
import CategoryMaterialsList from '../../components/studies/CategoryMaterialsList';
import api from '../../services/axios';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ClassSession = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { token: authContextToken } = useAuth();
  const localToken = getTokenLocal();
  
  // State
  const [userData, setUserData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [materials, setMaterials] = useState({});
  const [materialsResponse, setMaterialsResponse] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [activeCategory, setActiveCategory] = useState(null);
  const [isViewerModalVisible, setIsViewerModalVisible] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [currentMaterialId, setCurrentMaterialId] = useState(null);

  // View mode state: 'courses' | 'topics' | 'subtopics' | 'materials'
  const [viewMode, setViewMode] = useState('courses');
  const [currentView, setCurrentView] = useState('courses');
  const [searchText, setSearchText] = useState('');
  
  // Check for token and redirect if not found
  useEffect(() => {
    if (!localToken && !authContextToken) {
      message.error('Please log in to access this page');
      navigate('/login', { 
        state: { 
          from: { pathname: window.location.pathname },
          message: 'Please log in to access the learning portal'
        }
      });
      return;
    }
  }, [localToken, authContextToken, navigate]);

  // Fetch approved courses
  const fetchApprovedCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesService.getApprovedCourses();
      
      if (response.status === 'success' && response.data?.courses) {
        setCourses(response.data.courses);
        // Set first course as default if exists
        if (response.data.courses.length > 0) {
          setSelectedCourse(response.data.courses[0]);
        }
      } else {
        message.error('Failed to load approved courses');
      }
    } catch (error) {
      console.error('Error fetching approved courses:', error);
      message.error('Failed to load approved courses');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    if (!localToken && !authContextToken) {
      setError('Authorization token not found. Please log in again.');
      setLoading(false);
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const data = await userService.getUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          message.error('Your session has expired. Please log in again.');
          navigate('/login', { 
            state: { 
              from: { pathname: window.location.pathname },
              message: 'Your session has expired. Please log in again.'
            }
          });
        }
      }
    };

    // Fetch approved courses and handle subject selection
    const initializeData = async () => {
      try {
        setLoading(true);
        const response = await coursesService.getApprovedCourses();
        
        if (response.status === 'success' && response.data?.courses) {
          console.log('All courses:', response.data.courses);
          setCourses(response.data.courses);
          
          // Only auto-select items if we have a subjectId from URL
          if (subjectId) {
            // Find the subject in any of the courses
            for (const course of response.data.courses) {
              console.log('Checking course:', course.name, 'subjects:', course.subjects);
              const subject = course.subjects?.find(s => s.id === parseInt(subjectId));
              if (subject) {
                console.log('Found subject:', subject.name);
                setSelectedCourse(course);
                setSelectedSubject(subject);
                // Find and set the first topic and subtopic if available
                if (subject.topics && subject.topics.length > 0) {
                  const firstTopic = subject.topics[0];
                  setSelectedTopic(firstTopic);
                  if (firstTopic.subtopics && firstTopic.subtopics.length > 0) {
                    setSelectedSubtopic(firstTopic.subtopics[0]);
                  }
                }
                break;
              }
            }
          }
        } else {
          message.error('Failed to load approved courses');
        }
      } catch (error) {
        console.error('Error fetching approved courses:', error);
        if (error.response?.status === 401) {
          message.error('Your session has expired. Please log in again.');
          navigate('/login', { 
            state: { 
              from: { pathname: window.location.pathname },
              message: 'Your session has expired. Please log in again.'
            }
          });
        } else {
          message.error('Failed to load approved courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    initializeData();
  }, [localToken, authContextToken, subjectId, navigate]);
  
  // When selected subtopic changes, update material categories and materials
  useEffect(() => {
    const fetchSubtopicMaterials = async () => {
      if (selectedSubtopic?.id) {
        try {
          setLoading(true);
          
          // First fetch categories
          const categoriesResponse = await studyMaterialCategoriesService.getStudyMaterialCategories(1, 100);
          console.log('Categories API Response:', categoriesResponse);
          
          if (categoriesResponse.status === 'success') {
            const categoriesData = categoriesResponse.data || [];
            console.log('Fetched categories:', categoriesData);
            setMaterialCategories(categoriesData);
            
            if (categoriesData.length > 0) {
              // Then fetch materials for the selected subtopic
              const materialsResponse = await subtopicMaterialsService.getMaterials(selectedSubtopic.id);
              console.log('Materials response:', materialsResponse);
              
              // Store the materials response
              setMaterialsResponse(materialsResponse);
              
              // Check device verification first
              if (materialsResponse.device_verification && !materialsResponse.device_verification.is_authorized) {
                setMaterialCategories([]);
                setMaterials({});
                setActiveCategory(null);
                return;
              }
              
              // Check if materials are in the data property
              const materialsData = materialsResponse.data?.items || materialsResponse.items;
              
              if (materialsData && materialsData.length > 0) {
                // Group materials by category
                const materialsByCategory = materialsData.reduce((acc, material) => {
                  const categoryId = material.material_category_id;
                  if (!acc[categoryId]) {
                    acc[categoryId] = [];
                  }
                  acc[categoryId].push(material);
                  return acc;
                }, {});

                console.log('Materials grouped by category:', materialsByCategory);
                // Store all materials grouped by category
                setMaterials(materialsByCategory);

                // Find the first category that has materials
                const firstCategoryWithMaterials = categoriesData.find(category => 
                  materialsByCategory[category.id]?.length > 0
                );

                if (firstCategoryWithMaterials) {
                  console.log('Setting initial category:', firstCategoryWithMaterials.id);
                  setActiveCategory(firstCategoryWithMaterials.id);
                }

                // Update pagination
                const paginationData = materialsResponse.data || materialsResponse;
                if (paginationData.page && paginationData.total) {
                  setPagination(prev => ({
                    ...prev,
                    current: paginationData.page,
                    total: paginationData.total
                  }));
                }
              } else {
                console.log('No materials found in response');
                setMaterials({});
                message.info('No materials available for this subtopic');
              }
            }
          } else {
            throw new Error('Failed to fetch categories');
          }
        } catch (error) {
          console.error('Error fetching materials:', error);
          message.error('Failed to load materials');
          setMaterialCategories([]);
          setMaterials({});
          setActiveCategory(null);
        } finally {
          setLoading(false);
        }
      } else {
        setMaterialCategories([]);
        setMaterials({});
        setActiveCategory(null);
      }
    };

    fetchSubtopicMaterials();
  }, [selectedSubtopic]);
  
  // Handle resource click
  const handleResourceClick = async (material, download = false) => {
    try {
      setLoading(true);
      console.log('Viewing material:', material);
      
      if (download) {
        const fileUrl = await subtopicMaterialsService.downloadMaterial(material.id);
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        
        // Get the file extension based on the file type
        const extension = material.file_type === 'video' ? '.mp4' : '.pdf';
        link.download = `${material.name}${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Get the current category
        const currentCategory = materialCategories.find(c => c.id === material.material_category_id);
        console.log('Current category:', currentCategory);
        console.log('Has VdoCipher video ID:', material?.vdocipher_video_id);
        
        // Check if this is a VdoCipher video (for testing, open in new tab)
        if (currentCategory?.code === 'VIDEOS' && material?.vdocipher_video_id) {
          console.log('✅ VdoCipher video detected! Opening in new tab...');
          console.log('Video ID:', material.vdocipher_video_id);
          
          // Navigate to VdoCipher player page using vdocipher_video_id
          const videoUrl = `/review-class/${material.vdocipher_video_id}?name=${encodeURIComponent(material.name)}`;
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
        const response = await subtopicMaterialsService.viewMaterial(material.id);
        console.log('View material response:', response);

        // Check if this is an HLS video
        if (response.type === 'hls' && response.redirect) {
          // For HLS videos, use the stream URL directly
          const streamUrl = response.redirect;
          console.log('HLS Stream URL:', streamUrl);
          // Convert relative URL to absolute URL using configured axios baseURL
          const baseUrl = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
          const absoluteUrl = streamUrl.startsWith('http') ? streamUrl : `${baseUrl}${streamUrl}`;
          console.log('Absolute HLS Stream URL:', absoluteUrl);
          setCurrentFileUrl(absoluteUrl);
        } else {
          // For regular videos and documents, use the direct URL
          console.log('Regular file URL:', response);
          setCurrentFileUrl(response);
        }
        
        setCurrentFileName(material.name);
        setCurrentCategoryId(material.material_category_id);
        setCurrentMaterialId(material.id);
        setIsViewerModalVisible(true);
      }
    } catch (error) {
      console.error('Error handling material:', error);
      message.error('Failed to access the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add handler for viewer modal close
  const handleViewerModalClose = () => {
    setIsViewerModalVisible(false);
    setCurrentFileUrl(null);
    setCurrentFileName('');
    setCurrentCategoryId(null);
    setCurrentMaterialId(null);
  };

  // Enhanced Modal protection for protected content
  const [isContentProtected, setIsContentProtected] = useState(false);
  const lastVisibilityChangeRef = useRef(Date.now());
  const visibilitySpikeCountRef = useRef(0);

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
    if (currentCategoryId && materialCategories.length > 0) {
      const category = materialCategories.find(c => c.id === currentCategoryId);
      const isProtected = category?.is_protected || false;
      setIsContentProtected(isProtected);
    }
  }, [currentCategoryId, materialCategories]);

  // Modal close handler (always allows closing)
  const handleProtectedModalClose = () => {
    handleViewerModalClose();
  };

  // Screen capture detection at modal level
  useEffect(() => {
    if (!isContentProtected || !isViewerModalVisible) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      const delta = now - lastVisibilityChangeRef.current;
      lastVisibilityChangeRef.current = now;
      if (delta < 200) {
        // Rapid visibility flip (spike)
        visibilitySpikeCountRef.current += 1;
      } else {
        visibilitySpikeCountRef.current = 0;
      }

      if (document.hidden && isContentProtected) {
        // Close modal if user switches tabs during protected content
        setIsViewerModalVisible(false);
        setCurrentFileUrl(null);
        setCurrentFileName('');
        setCurrentCategoryId(null);
        setCurrentMaterialId(null);
        message.error('Tab switching detected! Modal closed for security.');
        setTimeout(() => { showSecurityNotice('We detected a tab switch while viewing protected content.'); }, 120);
        return;
      }

      // If we see rapid visibility spikes while visible, close as well
      if (!document.hidden && visibilitySpikeCountRef.current >= 2) {
        setIsViewerModalVisible(false);
        setCurrentFileUrl(null);
        setCurrentFileName('');
        setCurrentCategoryId(null);
        setCurrentMaterialId(null);
        message.error('Suspicious visibility changes! Modal closed for security.');
        setTimeout(() => { showSecurityNotice('We detected suspicious visibility changes while viewing protected content.'); }, 120);
      }
    };

    const handleBlur = () => {
      if (isContentProtected) {
        // Close modal if window loses focus during protected content
        setIsViewerModalVisible(false);
        setCurrentFileUrl(null);
        setCurrentFileName('');
        setCurrentCategoryId(null);
        setCurrentMaterialId(null);
        message.error('Window focus lost! Modal closed for security.');
        setTimeout(() => { showSecurityNotice('We detected the window lost focus during protected playback.'); }, 120);
      }
    };

    // NOTE: We intentionally no longer close on fullscreen exit per request.

    // Heuristic: devtools open (window size delta large)
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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', devtoolsHeuristic);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', devtoolsHeuristic);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContentProtected, isViewerModalVisible]);
  
  // Define columns for the materials table
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.file_type === 'video' ? (
              <PlayCircleOutlined style={{ marginRight: 4 }} />
            ) : (
              <FilePdfOutlined style={{ marginRight: 4 }} />
            )}
            {record.file_type.charAt(0).toUpperCase() + record.file_type.slice(1)}
          </div>
        </div>
      )
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size, record) => (
        <div>
          <div>{(size / 1024 / 1024).toFixed(2)} MB</div>
          {record.video_duration && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {record.video_duration} seconds
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
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
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleResourceClick(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            danger
            icon={<DownloadOutlined />}
            onClick={() => handleResourceClick(record, true)}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];
  
  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      {
        title: (
          <span>
            <BookOutlined /> Courses
          </span>
        ),
        onClick: () => {
          setSelectedCourse(null);
          setSelectedSubject(null);
          setSelectedTopic(null);
          setSelectedSubtopic(null);
        }
      }
    ];
    
    if (selectedCourse) {
      items.push({
        title: selectedCourse.name,
        onClick: () => {
          setSelectedSubject(null);
          setSelectedTopic(null);
          setSelectedSubtopic(null);
        }
      });
    }
    
    if (selectedSubject) {
      items.push({
        title: selectedSubject.name,
        onClick: () => {
          setSelectedTopic(null);
          setSelectedSubtopic(null);
        }
      });
    }
    
    if (selectedTopic) {
      items.push({
        title: selectedTopic.name,
        onClick: () => {
          setSelectedSubtopic(null);
        }
      });
    }
    
    if (selectedSubtopic) {
      items.push({
        title: selectedSubtopic.name
      });
    }
    
    return items;
  };
  
  // Handle view subject topics
  const handleViewSubjectTopics = (subject, course) => {
    setSelectedCourse(course);
    setSelectedSubject(subject);
    setCurrentView('topics');
  };

  // Handle view topic subtopics
  const handleViewTopicSubtopics = (topic, subject, course) => {
    setSelectedCourse(course);
    setSelectedSubject(subject);
    setSelectedTopic(topic);
    setCurrentView('subtopics');
  };

  // Handle view subtopic materials
  const handleViewSubtopicMaterials = (subtopic) => {
    setSelectedSubtopic(subtopic);
    setCurrentView('materials');
  };

  // Handle back navigation
  const handleBackToCourses = () => {
    setCurrentView('courses');
    setSelectedSubject(null);
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setSearchText(''); // Clear search when going back
  };
    
  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setSearchText(''); // Clear search when going back
  };

  const handleBackToSubtopics = () => {
    setCurrentView('subtopics');
    setSelectedSubtopic(null);
    setSearchText(''); // Clear search when going back
  };
              
  // Render courses and subjects table
  const renderCoursesView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <Empty
          description="No approved courses available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
              }

    return (
      <div>
        <Card 
          title={<span><BookOutlined /> My Courses & Subjects</span>}
          extra={
            <Input
              placeholder="Search subjects by code or name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          }
        >
          {courses.map((course) => {
            // Filter subjects based on search text
            const filteredSubjects = (course.subjects || []).filter(subject =>
              !searchText || 
              subject.code.toLowerCase().includes(searchText.toLowerCase()) ||
              subject.name.toLowerCase().includes(searchText.toLowerCase())
            );

            // Don't render course if no subjects match search
            if (searchText && filteredSubjects.length === 0) return null;

            return (
              <div key={course.id} style={{ marginBottom: 24 }}>
                {/* Course Header Row */}
                <div className="course-header">
                  {course.code}: {course.name}
                </div>
                
                {/* Subjects Table */}
                <Table
                  dataSource={filteredSubjects}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                  columns={[
                    {
                      title: 'Code',
                      dataIndex: 'code',
                      key: 'code',
                      width: '20%',
                      sorter: (a, b) => a.code.localeCompare(b.code),
                      sortDirections: ['ascend', 'descend'],
                      defaultSortOrder: 'ascend',
                      render: (text) => (
                        <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {text}
                        </div>
                      ),
                    },
                    {
                      title: 'Subject Name',
                      dataIndex: 'name',
                      key: 'name',
                      width: '60%',
                      sorter: (a, b) => a.name.localeCompare(b.name),
                      sortDirections: ['ascend', 'descend'],
                      render: (text) => (
                        <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {text}
                        </div>
                      ),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: '20%',
                      render: (_, subject) => (
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewSubjectTopics(subject, course)}
                          size="small"
                        >
                          View
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            );
          })}
        </Card>
      </div>
    );
  };

  // Render topics table for selected subject
  const renderTopicsView = () => {
    if (!selectedSubject) return null;

    // Filter topics based on search
    const filteredTopics = searchText 
      ? (selectedSubject.topics || []).filter(topic =>
          topic.code.toLowerCase().includes(searchText.toLowerCase()) ||
          topic.name.toLowerCase().includes(searchText.toLowerCase())
        )
      : (selectedSubject.topics || []);

    return (
      <Card 
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToCourses}
              style={{ 
                color: '#277186', 
                borderColor: '#277186',
                fontWeight: 500
              }}
            >
              Back to Courses
            </Button>
            <Divider type="vertical" />
            <span><BookOutlined /> {selectedCourse?.name} - {selectedSubject?.name}</span>
          </Space>
        }
        extra={
          <Input
            placeholder="Search topics..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        }
      >
        <Table
          dataSource={filteredTopics}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          columns={[
            {
              title: 'Code',
              dataIndex: 'code',
              key: 'code',
              width: '20%',
              sorter: (a, b) => a.code.localeCompare(b.code),
              sortDirections: ['ascend', 'descend'],
              defaultSortOrder: 'ascend',
              render: (text) => (
                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                  {text}
                </div>
              ),
            },
            {
              title: 'Topic Name',
              dataIndex: 'name',
              key: 'name',
              width: '60%',
              sorter: (a, b) => a.name.localeCompare(b.name),
              sortDirections: ['ascend', 'descend'],
              render: (text) => (
                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                  <ReadOutlined style={{ marginRight: 8 }} />
                  {text}
                </div>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: '20%',
              render: (_, topic) => (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewTopicSubtopics(topic, selectedSubject, selectedCourse)}
                  size="small"
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </Card>
    );
  };

  // Render subtopics table for selected topic
  const renderSubtopicsView = () => {
    if (!selectedTopic) return null;

    // Filter subtopics based on search
    const filteredSubtopics = searchText 
      ? (selectedTopic.subtopics || []).filter(subtopic =>
          subtopic.code.toLowerCase().includes(searchText.toLowerCase()) ||
          subtopic.name.toLowerCase().includes(searchText.toLowerCase())
        )
      : (selectedTopic.subtopics || []);

    return (
      <Card 
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToTopics}
              style={{ 
                color: '#277186', 
                borderColor: '#277186',
                fontWeight: 500
              }}
            >
              Back to Topics
            </Button>
            <Divider type="vertical" />
            <span><ReadOutlined /> {selectedCourse?.name} - {selectedSubject?.name} - {selectedTopic?.name}</span>
          </Space>
        }
        extra={
          <Input
            placeholder="Search subtopics..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        }
      >
        <Table
          dataSource={filteredSubtopics}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          columns={[
            {
              title: 'Code',
              dataIndex: 'code',
              key: 'code',
              width: '20%',
              sorter: (a, b) => a.code.localeCompare(b.code),
              sortDirections: ['ascend', 'descend'],
              defaultSortOrder: 'ascend',
              render: (text) => (
                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                  {text}
                </div>
              ),
            },
            {
              title: 'Subtopic Name',
              dataIndex: 'name',
              key: 'name',
              width: '55%',
              sorter: (a, b) => a.name.localeCompare(b.name),
              sortDirections: ['ascend', 'descend'],
              render: (text) => (
                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  {text}
                </div>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: '25%',
              render: (_, subtopic) => (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewSubtopicMaterials(subtopic)}
                  size="small"
                  block
                >
                  View Materials
                </Button>
              ),
            },
          ]}
        />
      </Card>
    );
  };
  
  // Render materials view
  const renderMaterialsView = () => {
    if (!selectedSubtopic) {
      return (
        <Empty
          description="Please select a subtopic to view materials"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Card
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToSubtopics}
              style={{ 
                color: '#277186', 
                borderColor: '#277186',
                fontWeight: 500
              }}
            >
              Back to Subtopics
            </Button>
            <Divider type="vertical" />
            <span>
              <FileTextOutlined /> {selectedCourse?.name} - {selectedSubject?.name} - {selectedTopic?.name} - {selectedSubtopic?.name}
            </span>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Device Verification Message */}
          {materialsResponse?.device_verification && (
            <Alert
              message={materialsResponse.device_verification.message}
              type={materialsResponse.device_verification.is_authorized ? "success" : "warning"}
              showIcon
            />
          )}

            <Tabs
              activeKey={activeCategory?.toString()}
              onChange={(key) => {
                setActiveCategory(parseInt(key));
              }}
              items={CategoryMaterialsList({
                categories: materialCategories,
                materials: materials,
                loading,
                pagination,
                onTableChange: () => {}, // No pagination needed for this view
                onAddClick: () => {}, // No add functionality needed for this view
                selectedSubtopic,
                columns,
                isEditable: false
              })}
            />

        </Space>
      </Card>
    );
  };

  // Main render function based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'courses':
        return renderCoursesView();
      case 'topics':
        return renderTopicsView();
      case 'subtopics':
        return renderSubtopicsView();
      case 'materials':
        return renderMaterialsView();
      default:
        return renderCoursesView();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
        {/* Guide Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <InfoCircleOutlined className="text-brandYellow mt-1" />
            <div>
              <h4 className="text-sm font-medium text-brandGreen mb-1">How to Access Materials</h4>
              <ol className="text-sm text-brandGreen space-y-1">
                <li>1. Browse through <b>My Courses</b> below</li>
                <li>2. Click <b>View</b> next to any subject to see its topics</li>
                <li>3. Click <b>View</b> next to any topic to see its subtopics</li>
                <li>4. Click <b>View Materials</b> for any subtopic to access content</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
            />
          </div>
        ) : (
          renderMainContent()
          )}

          {/* Document Viewer Modal */}
          <Modal
            title={
              <div>
                <div>View {materialCategories.find(c => c.id === currentCategoryId)?.code === 'VIDEOS' ? 'Video' : 'Document'}: {currentFileName}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Protection Status: {currentCategoryId ? (materialCategories.find(c => c.id === currentCategoryId)?.is_protected ? 'Protected' : 'Not Protected') : 'Unknown'}
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
            bodyStyle={{ padding: '12px' }}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {!(currentCategoryId && materialCategories.find(c => c.id === currentCategoryId)?.is_protected) && (
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        if (currentMaterialId) {
                          handleResourceClick(materials[currentCategoryId]?.find(m => m.id === currentMaterialId), true);
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
            
            {currentFileUrl && (
              materialCategories.find(c => c.id === currentCategoryId)?.code === 'VIDEOS' ? (
                // Use DRM player if a DASH URL is detected and license servers are configured
                (/\.mpd($|\?)/.test(currentFileUrl) && window.__DRM_CONFIG__?.licenseServers) ? (
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
                ) : (
                <HlsVideoViewer 
                  key={`hls-${currentFileUrl}`}
                  currentFileUrl={currentFileUrl}
                  currentFileName={currentFileName}
                  currentCategoryId={currentCategoryId}
                  categories={materialCategories}
                  onError={(error) => {
                    console.error('HLS Video Error:', error);
                    message.error('Failed to play video. Please try again.');
                  }}
                />
                )
              ) : (
                <DocumentViewer 
                  currentCategoryId={currentCategoryId} 
                  categories={materialCategories}
                  currentFileUrl={currentFileUrl}
                  currentFileName={currentFileName}
                />
              )
            )}
          </Modal>
      </div>
    </div>
  );
};

export default ClassSession; 
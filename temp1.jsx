import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Form, 
  Select, 
  Card, 
  Button, 
  Divider, 
  Table, 
  Tag, 
  Alert,
  Space,
  Modal,
  message,
  Spin,
  Checkbox,
  Input,
  Steps,
  Radio,
  Result,
  Row,
  Col,
  Descriptions
} from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined, 
  CheckCircleFilled, 
  DollarOutlined, 
  CreditCardOutlined,
  PhoneOutlined,
  LoadingOutlined,
  CheckOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import services
import coursesService from '../../services/courses';
import subjectsService from '../../services/subjects';
import seasonsService from '../../services/seasons';
import seasonSubjectsService from '../../services/seasonSubjects';
import seasonApplicantsService from '../../services/seasonApplicants';
import { getTokenLocal } from '../../services/utils/authorization';
import { AUTH_ERROR_EVENT } from '../../services/axios';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0
  }).format(amount);
};

const ApplyCourse = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [activeSeasons, setActiveSeasons] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSubjects, setCourseSubjects] = useState([]);
  const [formError, setFormError] = useState(null);
  const [courses, setCourses] = useState([]);
  
  // New states for the enhanced application process
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('255');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  
  // New state for pending applications
  const [pendingApplications, setPendingApplications] = useState([]);
  const [hasPendingApplications, setHasPendingApplications] = useState(false);
  const [pendingPaymentModalVisible, setPendingPaymentModalVisible] = useState(false);
  
  // New states for payment verification
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [verificationTimeout, setVerificationTimeout] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState(null);
  const verificationTimerRef = useRef(null);
  const verificationIntervalRef = useRef(null);
  
  const [form] = Form.useForm();
  
  // Auth modal state
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('Your session has expired or you are not authenticated. Please log in again to continue with your application.');
  const navigate = useNavigate();
  
  // Handle auth error event
  const handleAuthError = (event) => {
    console.log('Auth error event received:', event.detail?.message);
    
    // Update error message if provided
    if (event.detail?.message) {
      setAuthErrorMessage(event.detail.message);
    }
    
    setAuthModalVisible(true);
    
    // Close any open modals
    setPaymentModalVisible(false);
    setPendingPaymentModalVisible(false);
    
    // Reset processing states
    setProcessingPayment(false);
    setLoading(false);
  };
  
  // Load data on component mount and set up event listener for auth errors
  useEffect(() => {
    fetchData();
    
    // Set up event listener
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setLoading(false);
        return;
      }
      
      // Fetch courses
      const coursesResponse = await coursesService.getCourses();
      setCourses(coursesResponse.data.courses || []);
      
      // Fetch active seasons
      const seasonsResponse = await seasonsService.getSeasons();
      const activeSeasons = (seasonsResponse.data.seasons || []).filter(season => 
        season.status === 'active' || season.is_active
      );
      setActiveSeasons(activeSeasons);
      
      // Set first active season as default if exists
      if (activeSeasons.length > 0) {
        setSelectedSeason(activeSeasons[0].id);
      }
      
      // Fetch student's current applications
      await fetchMyApplications();
      
      // Check for any pending payment applications
      checkPendingApplications();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        message.error('Failed to load data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch the student's applications
  const fetchMyApplications = async () => {
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        return;
      }

      // First, let's fetch all subjects and courses to have their relationship data
      const subjectsResponse = await subjectsService.getSubjects(1, 100);
      const subjectsData = subjectsResponse.data.subjects || [];
      
      // Create a mapping of subject IDs to their course IDs and names
      const subjectToCourseMap = {};
      subjectsData.forEach(subject => {
        if (subject.id && subject.course_id) {
          subjectToCourseMap[subject.id] = {
            courseId: subject.course_id,
            courseName: courses.find(c => c.id === subject.course_id)?.name || 'Unknown Course'
          };
        }
      });
      
      console.log('Subject to course mapping:', subjectToCourseMap);
      
      // Fetch applications for the current authenticated user
      const response = await seasonApplicantsService.getSeasonApplicants();
      
      console.log('API Response:', response.data);
      
      // Process the applications from the new nested structure
      const allApplications = [];
      
      // Extract applications from each season
      if (response.data.seasons && Array.isArray(response.data.seasons)) {
        response.data.seasons.forEach(season => {
          if (season.applications && Array.isArray(season.applications)) {
            season.applications.forEach(app => {
              console.log('Processing application:', app);
              
              // Check if the application has subjects array
              if (app.subjects && Array.isArray(app.subjects)) {
                // Create an application entry for each subject
                app.subjects.forEach(subject => {
                  // Find course info from our map
                  const courseInfo = subjectToCourseMap[subject.id] || { 
                    courseId: null, 
                    courseName: 'Unknown Course' 
                  };
                  
                  console.log(`Subject ID ${subject.id} maps to course:`, courseInfo);
                  
                  allApplications.push({
                    id: app.application_id,
                    applicationId: app.application_id,
                    subjectId: subject.id,
                    seasonId: season.season_id,
                    status: app.status,
                    appliedDate: app.created_at,
                    paymentStatus: app.payment_status,
                    seasonName: season.season_name || 'Unknown Season',
                    subjectName: subject.name,
                    courseName: courseInfo.courseName,
                    fee: subject.fee || 0,
                    paymentMethod: app.payment_method,
                    mobileNumber: app.mobile_number,
                    transactionId: app.transaction_id
                  });
                });
              } else {
                // Fallback for old format - should not be reached with new API
                console.warn('Application missing subjects array:', app);
              }
            });
          }
        });
      }
      
      setMyApplications(allApplications);
      
      // Identify pending applications - any application with status "pending"
      // This includes both pending_payment and paid applications that haven't been processed
      const pendingApps = allApplications.filter(app => 
        app.status === 'pending' && app.paymentStatus === 'pending_payment'
      );
      
      console.log('Pending applications:', pendingApps);
      
      setPendingApplications(pendingApps);
      setHasPendingApplications(pendingApps.length > 0);
    } catch (error) {
      console.error('Error fetching my applications:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        message.error('Failed to load your applications. Please try again later.');
      }
    }
  };
  
  // Helper function to get course name for a subject
  const getCourseNameForSubject = (subjectId) => {
    // Check if the subject exists in our available subjects
    const subject = availableSubjects.find(s => s.subjectId === subjectId);
    if (subject) return subject.courseName;
    
    // Try to find in course subjects if not in available subjects
    for (const course of courses) {
      const foundSubject = courseSubjects.find(s => s.subjectId === subjectId);
      if (foundSubject) return course.name;
    }
    
    // As a last resort, try to find the course in the API's full subject list
    // This is necessary for applications with subjects that aren't in the current available list
    const myApp = myApplications.find(app => app.subjectId === subjectId);
    if (myApp && myApp.courseName) return myApp.courseName;
    
    return 'Unknown Course';
  };
  
  // Check for pending applications and prompt user
  const checkPendingApplications = () => {
    // Check if there are pending applications in session storage
    const storedAppIds = sessionStorage.getItem('pendingApplicationIds');
    
    if (storedAppIds && pendingApplications.length > 0) {
      setPendingPaymentModalVisible(true);
    }
  };
  
  // Resume pending applications
  const resumePendingApplications = () => {
    if (pendingApplications.length === 0) return;
    
    // Calculate total amount from pending applications
    const total = pendingApplications.reduce((sum, app) => sum + app.fee, 0);
    setTotalAmount(total);
    
    // Set selected season and course based on pending applications
    if (pendingApplications[0].seasonId) {
      setSelectedSeason(pendingApplications[0].seasonId);
    }
    
    // Store the application IDs for later update
    // Get unique application IDs since multiple subjects can be part of the same application
    const uniqueAppIds = [...new Set(pendingApplications.map(app => app.applicationId))];
    sessionStorage.setItem('pendingApplicationIds', JSON.stringify(uniqueAppIds));

    // Set selected subjects based on pending applications
    const subjectIds = pendingApplications.map(app => app.subjectId);
    setSelectedSubjects(subjectIds);
    
    // Reset payment fields
    setPaymentMethod('');
    setMobileNumber('255');
    
    // Close the prompt modal and open the payment modal at the payment method step
    setPendingPaymentModalVisible(false);
    setPaymentModalVisible(true);
    setCurrentStep(1); // Skip to payment step since we already have the applications
  };
  
  // Dismiss pending applications
  const dismissPendingApplications = async () => {
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        return;
      }
      
      // Clear session storage
      sessionStorage.removeItem('pendingApplicationIds');
      
      // Optionally, you could delete the pending applications from the database here
      // const deletePromises = pendingApplications.map(app => 
      //   seasonApplicantsService.deleteSeasonApplicant(app.id)
      // );
      // await Promise.all(deletePromises);
      
      setPendingPaymentModalVisible(false);
      setPendingApplications([]);
      setHasPendingApplications(false);
      
      // Refresh applications list
      await fetchMyApplications();
    } catch (error) {
      console.error('Error dismissing pending applications:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        message.error('Failed to clear pending applications');
      }
    }
  };
  
  // When selected season changes, update available subjects
  useEffect(() => {
    if (selectedSeason) {
      fetchAvailableSubjects();
      // Reset course selection when season changes
      setSelectedCourse(null);
      setCourseSubjects([]);
      setSelectedSubjects([]);
      setTotalAmount(0);
    }
  }, [selectedSeason, myApplications]);
  
  // Fetch available subjects for the selected season
  const fetchAvailableSubjects = async () => {
    setLoading(true);
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setLoading(false);
        return;
      }
      
      // Get subjects for this season
      const seasonSubjectsResponse = await seasonSubjectsService.getSeasonSubjectsBySeason(selectedSeason);
      const seasonSubjectsData = seasonSubjectsResponse.data.season_subjects || [];
      
      // Get already applied subjects for this season
      const mySeasonApplications = await seasonApplicantsService.getSeasonApplicantsBySeason(selectedSeason);
      
      // Extract applications from the season in the response
      let alreadyAppliedSubjectIds = [];
      if (mySeasonApplications.data.seasons && Array.isArray(mySeasonApplications.data.seasons)) {
        mySeasonApplications.data.seasons.forEach(season => {
          if (season.applications && Array.isArray(season.applications)) {
            const subjectIds = season.applications.map(app => app.subject_id);
            alreadyAppliedSubjectIds.push(...subjectIds);
          }
        });
      }
      
      // Get detailed subject information
      const subjectsResponse = await subjectsService.getSubjects(1, 100); // Get all subjects
      const subjectsData = subjectsResponse.data.subjects || [];
      
      // Filter out subjects already applied for
      const available = seasonSubjectsData
        .filter(ss => !alreadyAppliedSubjectIds.includes(ss.subject_id))
        .map(ss => {
          const subject = subjectsData.find(s => s.id === ss.subject_id);
          const course = courses.find(c => c.id === subject?.course_id);
          const spotsLeft = ss.capacity - (ss.enrolled || 0);
          
          return {
            seasonSubjectId: ss.id,
            subjectId: ss.subject_id,
            subjectName: subject?.name || 'Unknown Subject',
            courseId: subject?.course_id,
            courseName: course?.name || 'Unknown Course',
            price: subject?.price || 0,
            spotsLeft,
            isFull: spotsLeft <= 0,
            capacity: ss.capacity,
            enrolled: ss.enrolled || 0
          };
        });
      
      setAvailableSubjects(available);
      setSelectedSubjects([]);
      setTotalAmount(0);
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
      } else {
        message.error('Failed to load available subjects. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // When selected course changes, update subject list
  useEffect(() => {
    if (selectedCourse) {
      const filtered = availableSubjects.filter(s => s.courseId === selectedCourse);
      setCourseSubjects(filtered);
    } else {
      setCourseSubjects([]);
    }
  }, [selectedCourse, availableSubjects]);
  
  // Calculate total amount when selected subjects change
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const total = selectedSubjects.reduce((sum, subjectId) => {
        const subject = availableSubjects.find(s => s.subjectId === subjectId);
        return sum + (subject?.price || 0);
      }, 0);
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [selectedSubjects, availableSubjects]);
  
  // Handle checkbox change
  const handleSubjectSelection = (subjectId, checked) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    } else {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
      setSelectAll(false);
    }
  };
  
  // Handle select all checkbox
  const handleSelectAllChange = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      // Get all available subject IDs that aren't full
      const allSubjectIds = (selectedCourse ? courseSubjects : availableSubjects)
        .filter(subject => !subject.isFull)
        .map(subject => subject.subjectId);
      setSelectedSubjects(allSubjectIds);
    } else {
      setSelectedSubjects([]);
    }
  };
  
  // Proceed to payment
  const handleProceedToPayment = () => {
    if (selectedSubjects.length === 0) {
      message.error('Please select at least one subject to proceed');
      return;
    }
    
    setPaymentModalVisible(true);
    setCurrentStep(0);
  };
  
  // Move to next step in payment process
  const nextStep = () => {
    if (currentStep === 1 && !paymentMethod) {
      message.error('Please select a payment method');
      return;
    }
    
    if (currentStep === 1 && !isValidMobileNumber(mobileNumber)) {
      message.error('Please enter a valid mobile number starting with 255');
      return;
    }
    
    if (currentStep === 0) {
      // Create pending applications when moving to payment step
      createPendingApplications();
    }
    
    setCurrentStep(currentStep + 1);
  };
  
  // Move to previous step in payment process
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Create pending applications before payment
  const createPendingApplications = async () => {
    try {
      setLoading(true);
      
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setLoading(false);
        return;
      }
      
      const userId = 1; // This should come from authentication context
      
      // Use the batch API to create applications for all selected subjects at once
      const result = await seasonApplicantsService.createBatchApplications(
        selectedSeason,
        userId,
        selectedSubjects,
        'pending_payment'
      );
      
      // Store the application IDs for later update
      // The response should include the application_id 
      if (result.data?.application_id) {
        // Single application with multiple subjects case
        sessionStorage.setItem('pendingApplicationIds', JSON.stringify([result.data.application_id]));
      } else if (result.data?.application_ids && Array.isArray(result.data.application_ids)) {
        // Multiple applications case
        sessionStorage.setItem('pendingApplicationIds', JSON.stringify(result.data.application_ids));
      } else {
        console.error('No application IDs returned from API');
        message.error('Failed to create applications. Please try again.');
        return;
      }
      
      // If a transaction ID is returned from the batch creation, store it
      if (result.data?.transaction_id) {
        sessionStorage.setItem('pendingTransactionId', result.data.transaction_id);
      }
      
      message.success('Your selections have been saved');
    } catch (error) {
      console.error('Error creating pending applications:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
        setPaymentModalVisible(false);
      } else {
        message.error('Failed to save your selections. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Process payment
  const processPayment = async () => {
    // Start payment submission
    setProcessingPayment(true);
    
    try {
      // Check for authentication token
      const token = getTokenLocal();
      
      if (!token) {
        console.error('No authentication token found');
        setAuthModalVisible(true);
        setProcessingPayment(false);
        return;
      }
      
      // If we have pending applications, use their application_id
      if (pendingApplications.length > 0) {
        // Get unique application IDs (since multiple subjects might be from the same application)
        const uniqueAppIds = [...new Set(pendingApplications.map(app => app.applicationId))];
        
        // Store the first application ID for status checking
        if (uniqueAppIds.length > 0) {
          setCurrentApplicationId(uniqueAppIds[0]);
        }
        
        // Prepare simplified payment data
        const paymentData = {
          application_ids: uniqueAppIds,
          payment_method: paymentMethod,
          mobile_number: mobileNumber,
          amount: totalAmount
        };
        
        console.log('Submitting payment data:', paymentData);
        
        // Submit payment to server
        const response = await seasonApplicantsService.submitPayment(paymentData);
        
        console.log('Payment API response:', response);
        
        // Check if payment was successful - either a success field or a 201 status
        if (response.data?.status === 'success' || response.status === 201) {
          // Set transaction ID from response
          let txnId = '';
          if (response.data?.payment?.transaction_id) {
            txnId = response.data.payment.transaction_id;
          } else if (response.data?.transaction_id) {
            txnId = response.data.transaction_id;
          } else {
            // Fallback to generate a transaction ID if not provided by backend
            const randomId = Math.floor(100000000 + Math.random() * 900000000);
            txnId = `TXN${randomId}`;
          }
          
          console.log('Setting transaction ID:', txnId);
          setTransactionId(txnId);
          
          // Payment successful
          setProcessingPayment(false);
          setPaymentConfirmed(true);
          
          // Move to final step
          setCurrentStep(currentStep + 1);
          
          // Clean up stored data
          sessionStorage.removeItem('pendingApplicationIds');
          sessionStorage.removeItem('pendingTransactionId');
          
          // Refetch applications to update the list
          await fetchMyApplications();
          
          message.success(response.data?.message || 'Payment processed successfully');
          
          // Start payment verification
          startPaymentVerification(uniqueAppIds[0]);
        } else {
          throw new Error(response.data?.message || 'Payment processing failed');
        }
      } else {
        // For newly created applications, get the IDs from session storage
        const applicationIds = JSON.parse(sessionStorage.getItem('pendingApplicationIds') || '[]');
        
        if (applicationIds.length === 0) {
          throw new Error('No pending application IDs found');
        }
        
        // Store the first application ID for status checking
        if (applicationIds.length > 0) {
          setCurrentApplicationId(applicationIds[0]);
        }
        
        // Prepare simplified payment data
        const paymentData = {
          application_ids: applicationIds,
          payment_method: paymentMethod,
          mobile_number: mobileNumber,
          amount: totalAmount
        };
        
        console.log('Submitting payment data:', paymentData);
        
        // Submit payment to server
        const response = await seasonApplicantsService.submitPayment(paymentData);
        
        console.log('Payment API response:', response);
        
        // Check if payment was successful - either a success field or a 201 status
        if (response.data?.status === 'success' || response.status === 201) {
          // Set transaction ID from response
          let txnId = '';
          if (response.data?.payment?.transaction_id) {
            txnId = response.data.payment.transaction_id;
          } else if (response.data?.transaction_id) {
            txnId = response.data.transaction_id;
          } else {
            // Fallback to generate a transaction ID if not provided by backend
            const randomId = Math.floor(100000000 + Math.random() * 900000000);
            txnId = `TXN${randomId}`;
          }
          
          console.log('Setting transaction ID:', txnId);
          setTransactionId(txnId);
          
          // Payment successful
          setProcessingPayment(false);
          setPaymentConfirmed(true);
          
          // Move to final step
          setCurrentStep(currentStep + 1);
          
          // Clean up stored data
          sessionStorage.removeItem('pendingApplicationIds');
          sessionStorage.removeItem('pendingTransactionId');
          
          // Refetch applications to update the list
          await fetchMyApplications();
          
          message.success(response.data?.message || 'Payment processed successfully');
          
          // Start payment verification
          startPaymentVerification(applicationIds[0]);
        } else {
          throw new Error(response.data?.message || 'Payment processing failed');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
        setPaymentModalVisible(false);
      } else {
        message.error('Payment processing failed. Please try again or contact support.');
      }
      
      setProcessingPayment(false);
    }
  };
  
  // Start verifying payment status
  const startPaymentVerification = (applicationId) => {
    if (!applicationId) return;
    
    console.log('Starting payment verification for application:', applicationId);
    setVerifyingPayment(true);
    setPaymentVerified(false);
    setVerificationTimeout(false);
    
    // Set a timeout to stop checking after 60 seconds
    verificationTimerRef.current = setTimeout(() => {
      console.log('Payment verification timeout reached');
      setVerificationTimeout(true);
      setVerifyingPayment(false);
      
      // Clear the interval if it's still running
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
    }, 60000); // 60 seconds
    
    // Check status every 5 seconds
    verificationIntervalRef.current = setInterval(() => {
      checkPaymentStatus(applicationId);
    }, 5000); // Every 5 seconds
    
    // Do an immediate check
    checkPaymentStatus(applicationId);
  };
  
  // Check the payment status
  const checkPaymentStatus = async (applicationId) => {
    try {
      const response = await seasonApplicantsService.checkPaymentStatus(applicationId);
      
      console.log('Payment status check result:', response);
      
      // If payment is verified
      if (response.data?.payment_status === 'paid') {
        // Stop the verification process
        clearInterval(verificationIntervalRef.current);
        clearTimeout(verificationTimerRef.current);
        verificationIntervalRef.current = null;
        verificationTimerRef.current = null;
        
        // Update the UI
        setVerifyingPayment(false);
        setPaymentVerified(true);
        setPaymentDetails(response.data);
        
        // Show success message
        message.success('Payment has been verified successfully!');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };
  
  // Handle manual verification button click
  const handleManualVerification = () => {
    if (currentApplicationId) {
      setVerifyingPayment(true);
      checkPaymentStatus(currentApplicationId);
    }
  };
  
  // Handle modal close
  const handleClosePaymentModal = () => {
    // Only allow closing if not in the processing state
    if (!processingPayment) {
      setPaymentModalVisible(false);
      setCurrentStep(0);
      setPaymentMethod('');
      setPaymentConfirmed(false);
      setTransactionId('');
      setMobileNumber('255');
      
      // Clear verification state
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
        verificationTimerRef.current = null;
      }
    }
  };
  
  // Clean up intervals and timers when component unmounts
  useEffect(() => {
    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }
    };
  }, []);
  
  // Handle completion and clean up resources
  const handleFinish = () => {
    // Clear any active timers or intervals
    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current);
    }
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
    }
    
    // Reset states
    setPaymentModalVisible(false);
    setCurrentStep(0);
    setPaymentMethod('');
    setPaymentConfirmed(false);
    setTransactionId('');
    setMobileNumber('255');
    setSelectedSubjects([]);
    setTotalAmount(0);
    setSelectAll(false);
    setVerifyingPayment(false);
    setPaymentVerified(false);
    setPaymentDetails(null);
    setVerificationTimeout(false);
    setCurrentApplicationId(null);
  };
  
  const steps = [
    {
      title: 'Review',
      content: (
        <div>
          <Title level={5}>Selected Subjects</Title>
          <Table
            dataSource={
              pendingApplications.length > 0 && currentStep > 0 ? 
                // If we're resuming payment for pending applications
                pendingApplications.map(app => ({
                  key: app.id,
                  subjectName: app.subjectName,
                  courseName: app.courseName,
                  price: app.fee
                })) :
                // Normal flow - newly selected subjects
                selectedSubjects.map(subjectId => {
                  const subject = availableSubjects.find(s => s.subjectId === subjectId);
                  return {
                    key: subject.subjectId,
                    subjectName: subject.subjectName,
                    courseName: subject.courseName,
                    price: subject.price
                  };
                })
            }
            columns={[
              {
                title: 'Subject',
                dataIndex: 'subjectName',
                key: 'subjectName'
              },
              {
                title: 'Course',
                dataIndex: 'courseName',
                key: 'courseName'
              },
              {
                title: 'Price',
                dataIndex: 'price',
                key: 'price',
                render: price => formatCurrency(price)
              }
            ]}
            pagination={false}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Total Amount</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong type="success">{formatCurrency(totalAmount)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      )
    },
    {
      title: 'Payment',
      content: (
        <div>
          <Title level={5}>Select Payment Method</Title>
          <Radio.Group 
            onChange={e => setPaymentMethod(e.target.value)}
            value={paymentMethod}
            size="large"
            style={{ marginBottom: 24 }}
          >
            <Space direction="vertical">
              <Radio value="M-Pesa">
                <Space>
                  <img 
                    src="/images/mpesa.png" 
                    alt="M-Pesa" 
                    style={{ width: 30, height: 30, objectFit: 'contain' }}
                  />
                  M-Pesa
                </Space>
              </Radio>
              <Radio value="Airtel Money">
                <Space>
                  <img 
                    src="/images/airtel.png" 
                    alt="Airtel Money" 
                    style={{ width: 30, height: 30, objectFit: 'contain' }}
                  />
                  Airtel Money
                </Space>
              </Radio>
              <Radio value="Mixx by Yas">
                <Space>
                  <img 
                    src="/images/mixx.png" 
                    alt="Mixx by Yas" 
                    style={{ width: 30, height: 30, objectFit: 'contain' }}
                  />
                  Mixx by Yas
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
          
          <Title level={5}>Enter Mobile Number</Title>
          <Paragraph type="secondary">
            Please enter your mobile number starting with 255
          </Paragraph>
          <Input
            prefix={<PhoneOutlined className="site-form-item-icon" />}
            placeholder="255XXXXXXXXX"
            value={mobileNumber}
            onChange={handleMobileNumberChange}
            style={{ maxWidth: 300 }}
            status={mobileNumber && !isValidMobileNumber(mobileNumber) ? 'error' : ''}
          />
          {mobileNumber && !isValidMobileNumber(mobileNumber) && (
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
              Invalid mobile number format. Must start with 255 followed by 9 digits.
            </div>
          )}
          
          <div style={{ marginTop: 24 }}>
            <Alert
              message="Payment Instructions"
              description={
                <div>
                  <p>Once you proceed, you will be redirected to complete the payment of <b>{formatCurrency(totalAmount)}</b> using your selected payment method.</p>
                  <p>Ensure that you have sufficient funds in your account to complete this transaction.</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        </div>
      )
    },
    {
      title: 'Complete Payment',
      content: (
        <div>
          {processingPayment ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} 
                size="large"
              />
              <div style={{ marginTop: 24 }}>
                <Title level={4}>Processing Your Payment</Title>
                <Paragraph>
                  Please wait while we process your payment of {formatCurrency(totalAmount)}
                </Paragraph>
                <Paragraph type="secondary">
                  Your application details and payment information are being submitted to the server...
                </Paragraph>
              </div>
            </div>
          ) : (
            <div>
              <Title level={5}>Payment Summary</Title>
              <Card style={{ marginBottom: 24 }}>
                <Descriptions 
                  bordered 
                  column={1}
                  size="small"
                  style={{ fontSize: '14px' }}
                >
                  <Descriptions.Item label="Payment Method">
                    <Space>
                      {paymentMethod === 'M-Pesa' && (
                        <img src="/images/mpesa.png" alt="M-Pesa" width={20} height={20} />
                      )}
                      {paymentMethod === 'Airtel Money' && (
                        <img src="/images/airtel.png" alt="Airtel Money" width={20} height={20} />
                      )}
                      {paymentMethod === 'Mixx by Yas' && (
                        <img src="/images/mixx.png" alt="Mixx by Yas" width={20} height={20} />
                      )}
                      {paymentMethod}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mobile Number">{mobileNumber}</Descriptions.Item>
                  <Descriptions.Item label="Total Amount">
                    <Text strong type="success">{formatCurrency(totalAmount)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Selected Subjects">{
                    pendingApplications.length > 0 ? 
                    pendingApplications.length : 
                    selectedSubjects.length
                  }</Descriptions.Item>
                </Descriptions>
              </Card>
              
              <Alert
                message="Application Submission"
                description={
                  <div>
                    <p>When you click "Complete Payment", your application and payment details will be sent to our server.</p>
                    <p>The system will automatically process your payment and provide you with a transaction ID upon completion.</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CreditCardOutlined />}
                  onClick={processPayment}
                >
                  Complete Payment
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Confirmation',
      content: (
        <div>
          {verifyingPayment ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} 
                size="large"
              />
              <div style={{ marginTop: 24 }}>
                <Title level={4}>Verifying Your Payment</Title>
                <Paragraph>
                  Please wait while we verify your payment with the provider.
                </Paragraph>
                <Paragraph type="secondary">
                  This may take a few moments...
                </Paragraph>
              </div>
            </div>
          ) : verificationTimeout ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Alert
                message="Verification Timeout"
                description="We couldn't automatically verify your payment within the time limit. Please click the button below to check again."
                type="warning"
                showIcon
                style={{ marginBottom: 20 }}
              />
              <Button 
                type="primary" 
                onClick={handleManualVerification}
                icon={<LoadingOutlined />}
                style={{ marginBottom: 20 }}
              >
                Check Payment Status
              </Button>
              <Paragraph type="secondary">
                Note: If you've just made the payment, it might take a few moments to process.
              </Paragraph>
            </div>
          ) : (
            <Result
              status="success"
              title="Payment Completed Successfully!"
              subTitle={
                <div style={{ fontSize: '16px', margin: '8px 0' }}>
                  Transaction ID: <Text style={{ fontWeight: 'bold' }}>{transactionId}</Text>
                </div>
              }
              extra={[
                <Button 
                  type="primary" 
                  onClick={handleFinish}
                  key="finish"
                >
                  Done
                </Button>
              ]}
            >
              <div className="desc">
                <Paragraph>
                  <Text
                    strong

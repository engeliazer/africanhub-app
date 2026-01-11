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
  Descriptions,
  Tooltip
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
  LoginOutlined,
  BankOutlined,
  PrinterOutlined
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
import accountingService from '../../services/accounting';
import paymentService from '../../services/payment';

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
  const [availableCourses, setAvailableCourses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsError, setPaymentMethodsError] = useState(null);
  
  // New states for the enhanced application process
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('255');
  const [bankReference, setBankReference] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  
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
  
  // New state for seasons with available subjects
  const [seasonsWithSubjects, setSeasonsWithSubjects] = useState([]);
  
  // New state for bank details
  const [bankDetails, setBankDetails] = useState(null);
  
  // Bank payment handlers
  const handleBankPayment = () => {
    setShowBankDetails(true);
  };

  const handleBankReferenceChange = (e) => {
    setBankReference(e.target.value);
  };

  const handlePrintInvoice = () => {
    window.print();
  };
  
  // Handle mobile number change
  const handleMobileNumberChange = (e) => {
    let number = e.target.value;
    // Ensure it starts with 255
    if (!number.startsWith('255')) {
      number = '255' + number.replace(/^255/, '');
    }
    setMobileNumber(number);
  };
  
  // Validate mobile number
  const isValidMobileNumber = (number) => {
    return /^255[1-9]\d{8}$/.test(number);
  };
  
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
  
  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      console.log('Starting to fetch payment methods...');
      const response = await paymentService.getPaymentMethods();
      console.log('Payment methods response in component:', response);
      
      if (response.status === 'success' && Array.isArray(response.payment_methods)) {
        console.log('Setting payment methods:', response.payment_methods);
        setPaymentMethods(response.payment_methods);
        setPaymentMethodsError(null);
      } else {
        console.error('Invalid payment methods response:', response);
        setPaymentMethodsError('Invalid response format from server');
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      let errorMessage = 'Failed to load payment methods';
      
      if (error.response) {
        console.error('Error response:', error.response);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentMethodsError(errorMessage);
      setPaymentMethods([]);
    }
  };
  
  // Load data on component mount and set up event listener for auth errors
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check for authentication token
        const token = getTokenLocal();
        
        if (!token) {
          console.error('No authentication token found');
          setAuthModalVisible(true);
          setLoading(false);
          return;
        }
        
        // Fetch seasons with available subjects
        const seasonsResponse = await seasonsService.getAvailableSeasons();
        console.log('Available seasons:', seasonsResponse);
        
        if (seasonsResponse.status !== 'success') {
          throw new Error('Failed to fetch seasons');
        }
        
        setSeasonsWithSubjects(seasonsResponse.data || []);
        
        // Fetch student's current applications
        await fetchMyApplications();
        
        // Check for any pending payment applications
        checkPendingApplications();

        // Fetch payment methods
        await fetchPaymentMethods();
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

    fetchData();
    
    // Set up event listener
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
  }, []);
  
  // When selected season changes, update available courses
  useEffect(() => {
    if (selectedSeason) {
      console.log('Selected season changed to:', selectedSeason);
      fetchAvailableCourses();
      // Reset course selection when season changes
      setSelectedCourse(null);
      setCourseSubjects([]);
      setSelectedSubjects([]);
      setTotalAmount(0);
    }
  }, [selectedSeason]);
  
  // Fetch available courses for the selected season
  const fetchAvailableCourses = async () => {
    setLoading(true);
    try {
      console.log('Fetching available courses for season:', selectedSeason);
      // Get courses with available subjects for this season
      const coursesResponse = await seasonsService.getSeasonAvailableCourses(selectedSeason);
      console.log('Available courses response:', coursesResponse);
      
      if (coursesResponse.status !== 'success') {
        throw new Error('Failed to fetch available courses');
      }
      
      const courses = coursesResponse.data || [];
      console.log('Setting available courses:', courses);
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      message.error('Failed to load available courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // When selected course changes, update subject list
  useEffect(() => {
    if (selectedCourse) {
      fetchAvailableSubjects();
    } else {
      setCourseSubjects([]);
    }
  }, [selectedCourse]);
  
  // Fetch available subjects for the selected course
  const fetchAvailableSubjects = async () => {
    setLoading(true);
    try {
      // Get available subjects for this course in the selected season
      const subjectsResponse = await seasonsService.getSeasonCourseAvailableSubjects(selectedSeason, selectedCourse);
      console.log('Available subjects for course:', subjectsResponse);
      
      if (subjectsResponse.status !== 'success') {
        throw new Error('Failed to fetch available subjects');
      }
      
      // Transform the subjects data to include necessary information
      const transformedSubjects = subjectsResponse.data.map(subject => ({
        seasonSubjectId: subject.id,
        subjectId: subject.subject_id,
        subjectName: subject.name,
        courseId: subject.course_id,
        courseName: subject.course_name,
        price: subject.price,
        spotsLeft: subject.capacity - subject.enrolled,
        isFull: subject.capacity <= subject.enrolled,
        capacity: subject.capacity,
        enrolled: subject.enrolled
      }));
      
      setCourseSubjects(transformedSubjects);
      setSelectedSubjects([]);
      setTotalAmount(0);
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      message.error('Failed to load available subjects. Please try again later.');
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
      console.log('Subjects response:', subjectsResponse);
      
      // Extract the subjects array from the response data structure
      const subjectsData = subjectsResponse.data?.subjects || [];
      
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
      console.log('Applications API Response:', response);
      
      // Process the applications from the new nested structure
      const allApplications = [];
      
      // Extract applications from the response
      if (response.data?.applications) {
        response.data.applications.forEach(app => {
          console.log('Processing application:', app);
          
          // Process each detail in the application
          if (app.details && Array.isArray(app.details)) {
            app.details.forEach(detail => {
              console.log('Processing detail:', detail);
              
              // Find subject info
              const subject = subjectsData.find(s => s.id === detail.subject_id);
              console.log('Found subject:', subject);
              
              // Find course info from our map
              const courseInfo = subjectToCourseMap[detail.subject_id] || { 
                courseId: null, 
                courseName: 'Unknown Course' 
              };
              console.log('Course info:', courseInfo);
              
              allApplications.push({
                id: `${app.id}_${detail.id}`,
                applicationId: app.id,
                subjectId: detail.subject_id,
                seasonId: app.season_id,
                status: app.status,
                appliedDate: app.created_at,
                paymentStatus: app.payment_status,
                seasonName: activeSeasons.find(s => s.id === app.season_id)?.name || 'Unknown Season',
                subjectName: subject?.name || 'Unknown Subject',
                courseName: courseInfo.courseName,
                fee: detail.fee || 0,
                paymentMethod: app.payment_method,
                mobileNumber: app.mobile_number,
                transactionId: app.transaction_id
              });
            });
          }
        });
      }
      
      console.log('Processed applications:', allApplications);
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
      const foundSubject = courseSubjects.find(s => s.seasonSubjectId === subjectId);
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
  const resumePendingApplications = async () => {
    if (pendingApplications.length === 0) return;
    
    setLoading(true);
    try {
      // Fetch bank details
      const bankResponse = await accountingService.getBankDetails();
      if (bankResponse && bankResponse.data) {
        setBankDetails(bankResponse.data);
      }
      
      // Fetch payment methods
      const paymentMethodsResponse = await accountingService.getPaymentMethods();
      if (paymentMethodsResponse && paymentMethodsResponse.data && paymentMethodsResponse.data.payment_methods) {
        setPaymentMethods(paymentMethodsResponse.data.payment_methods);
      }
      
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
    } catch (error) {
      console.error('Error fetching payment data:', error);
      message.error('Failed to load payment options. Please try again.');
    } finally {
      setLoading(false);
    }
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
      
      // Show confirmation modal
      Modal.confirm({
        title: 'Cancel Pending Applications',
        content: `Are you sure you want to cancel all ${pendingApplications.length} pending application(s)? This action cannot be undone.`,
        okText: 'Yes, Cancel All',
        cancelText: 'No, Keep Applications',
        okType: 'danger',
        onOk: async () => {
          try {
            setLoading(true);
            
            // Get unique application IDs to cancel
            const uniqueAppIds = [...new Set(pendingApplications.map(app => app.applicationId))];
            console.log('Cancelling applications:', uniqueAppIds);
            
            // Cancel each application via API
            const cancelPromises = uniqueAppIds.map(appId => 
              seasonApplicantsService.cancelApplication(appId)
            );
            
            await Promise.all(cancelPromises);
            
            // Clear session storage
            sessionStorage.removeItem('pendingApplicationIds');
            
            setPendingPaymentModalVisible(false);
            setPendingApplications([]);
            setHasPendingApplications(false);
            
            message.success(`Successfully cancelled ${uniqueAppIds.length} application(s)`);
            
            // Refresh applications list
            await fetchMyApplications();
          } catch (error) {
            console.error('Error cancelling pending applications:', error);
            message.error('Failed to cancel some applications. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error showing cancel confirmation:', error);
    }
  };
  
  // Handle subject selection
  const handleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev => {
      const isSelected = prev.includes(subjectId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId];
      
      // Calculate total amount for selected subjects
      const total = newSelection.reduce((sum, id) => {
        const subject = courseSubjects.find(s => s.seasonSubjectId === id);
        return sum + (subject?.price || 0);
      }, 0);
      setTotalAmount(total);
      
      // Update select all state
      setSelectAllChecked(newSelection.length === courseSubjects.length);
      
      return newSelection;
    });
  };

  // Handle select all subjects
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    
    if (!courseSubjects || courseSubjects.length === 0) {
      return;
    }

    if (checked) {
      // Select all subjects
      const allSubjectIds = courseSubjects.map(subject => subject.seasonSubjectId);
      setSelectedSubjects(allSubjectIds);
      setSelectAllChecked(true);
      
      // Calculate total amount for all subjects
      const total = allSubjectIds.reduce((sum, subjectId) => {
        const subject = courseSubjects.find(s => s.seasonSubjectId === subjectId);
        return sum + (subject?.price || 0);
      }, 0);
      setTotalAmount(total);
    } else {
      // Deselect all subjects
      setSelectedSubjects([]);
      setSelectAllChecked(false);
      setTotalAmount(0);
    }
  };
  
  // Handle proceed to payment button click
  const handleProceedToPayment = async () => {
    if (selectedSubjects.length === 0) {
      message.error('Please select at least one subject to proceed');
      return;
    }
    
    setLoading(true);
    try {
      // Fetch bank details and payment methods
      const [bankDetailsResponse, paymentMethodsResponse] = await Promise.all([
        accountingService.getBankDetails(),
        accountingService.getPaymentMethods()
      ]);
      
      setBankDetails(bankDetailsResponse.data);
      
      // Check if payment methods are available in the response
      if (paymentMethodsResponse?.payment_methods && Array.isArray(paymentMethodsResponse.payment_methods)) {
        console.log('Setting payment methods:', paymentMethodsResponse.payment_methods);
        setPaymentMethods(paymentMethodsResponse.payment_methods);
      } else {
        console.error('Invalid payment methods response:', paymentMethodsResponse);
        message.error('No payment methods available. Please try again later.');
        return;
      }
      
      // Open payment modal
      setPaymentModalVisible(true);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      message.error('Failed to load payment information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create pending applications
  const createPendingApplications = async () => {
    if (selectedSubjects.length === 0) {
      message.error('Please select at least one subject');
      return false;
    }

    setLoading(true);
    try {
      // Create application for each selected subject
      const applicationPromises = selectedSubjects.map(subjectId => {
        const subject = courseSubjects.find(s => s.seasonSubjectId === subjectId);
        if (!subject) return null;

        return seasonApplicantsService.createSeasonApplicant({
          season_id: selectedSeason,
          subject_id: subject.subjectId,
          course_id: selectedCourse,
          fee: subject.price
        });
      });

      const results = await Promise.all(applicationPromises.filter(Boolean));
      
      // Extract application IDs from successful responses
      const applicationIds = results
        .filter(result => result?.data?.id)
        .map(result => result.data.id);

      if (applicationIds.length === 0) {
        throw new Error('Failed to create applications');
      }

      // Store application IDs in session storage
      sessionStorage.setItem('pendingApplicationIds', JSON.stringify(applicationIds));
      
      return true;
    } catch (error) {
      console.error('Error creating pending applications:', error);
      message.error('Failed to create applications. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Move to next step in payment process
  const nextStep = () => {
    if (currentStep === 1 && !paymentMethod) {
      message.error('Please select a payment method');
      return;
    }
    
    if (currentStep === 1) {
      if (paymentMethod === 'Bank') {
        if (!bankReference) {
          message.error('Please enter the bank reference number');
          return;
        }
        if (!isValidMobileNumber(mobileNumber)) {
          message.error('Please enter a valid mobile number starting with 255');
          return;
        }
      } else if (!isValidMobileNumber(mobileNumber)) {
        message.error('Please enter a valid mobile number starting with 255');
        return;
      }
    }
    
    if (currentStep === 0) {
      // Create pending applications when moving to payment step
      createPendingApplications().then(success => {
        if (success) {
          setCurrentStep(currentStep + 1);
    }
      });
    } else {
    setCurrentStep(currentStep + 1);
    }
  };
  
  // Move to previous step in payment process
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
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
        
        console.log('Processing payment for pending applications with IDs:', uniqueAppIds);
        
        // Store the first application ID for status checking
        if (uniqueAppIds.length > 0) {
          setCurrentApplicationId(uniqueAppIds[0]);
        }
        
        // Prepare simplified payment data
        const paymentData = {
          application_ids: uniqueAppIds,
          payment_method: paymentMethod === 'bank' ? 'Bank' : paymentMethod,
          mobile_number: mobileNumber,
          amount: totalAmount
        };
        
        // Add bank reference if payment method is Bank
        if (paymentMethod === 'bank' && bankReference) {
          paymentData.bank_reference = bankReference;
        }
        
        console.log('Submitting payment data:', paymentData);
        
        try {
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
        } catch (error) {
          console.error('API call error:', error);
          if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
          }
          throw error;
        }
      } else {
        // For newly created applications, get the IDs from session storage
        const applicationIdsJson = sessionStorage.getItem('pendingApplicationIds');
        console.log('Retrieved pendingApplicationIds from session storage:', applicationIdsJson);
        
        if (!applicationIdsJson) {
          console.error('No pendingApplicationIds found in session storage');
          
          // If no IDs found, try to create the applications again
          message.warning('Application data not found. Creating applications again...');
          const result = await createPendingApplications();
          
          if (!result) {
            throw new Error('Failed to create applications. Please try again.');
          }
          
          // Try again with the newly created applications
          const newIdsJson = sessionStorage.getItem('pendingApplicationIds');
          if (!newIdsJson) {
            throw new Error('Application creation failed. Please try again.');
          }
          
          const applicationIds = JSON.parse(newIdsJson);
          console.log('Created new applications with IDs:', applicationIds);
          
          if (!applicationIds || applicationIds.length === 0) {
            throw new Error('No pending application IDs found after creation');
          }
          
          // Continue with the payment process using the new application IDs
          // Store the first application ID for status checking
          if (applicationIds.length > 0) {
            setCurrentApplicationId(applicationIds[0]);
          }
          
          // Prepare simplified payment data
          const paymentData = {
            application_ids: applicationIds,
            payment_method: paymentMethod === 'bank' ? 'Bank' : paymentMethod,
            mobile_number: mobileNumber,
            amount: totalAmount
          };
          
          // Add bank reference if payment method is Bank
          if (paymentMethod === 'bank' && bankReference) {
            paymentData.bank_reference = bankReference;
          }
          
          console.log('Submitting payment data with newly created applications:', paymentData);
          
          // Submit payment to server
          const response = await seasonApplicantsService.submitPayment(paymentData);
          
          console.log('Payment API response:', response);
          
          // Process response... (same code as below)
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
          
          return; // Exit early since we've processed the payment
        }
        
        const applicationIds = JSON.parse(applicationIdsJson);
        
        console.log('Processing payment for newly created applications with IDs:', applicationIds);
        
        if (!applicationIds || applicationIds.length === 0) {
          throw new Error('No pending application IDs found');
        }
        
        // Store the first application ID for status checking
        if (applicationIds.length > 0) {
          setCurrentApplicationId(applicationIds[0]);
        }
        
        // Prepare simplified payment data
        const paymentData = {
          application_ids: applicationIds,
          payment_method: paymentMethod === 'bank' ? 'Bank' : paymentMethod,
          mobile_number: mobileNumber,
          amount: totalAmount
        };
        
        // Add bank reference if payment method is Bank
        if (paymentMethod === 'bank' && bankReference) {
          paymentData.bank_reference = bankReference;
        }
        
        console.log('Submitting payment data:', paymentData);
        
        try {
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
        } catch (error) {
          console.error('API call error:', error);
          if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      // Check if unauthorized
      if (error.response?.status === 401) {
        setAuthModalVisible(true);
        setPaymentModalVisible(false);
      } else {
        message.error(`Payment processing failed: ${error.message}. Please try again or contact support.`);
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
    
    // Initialize attempt counter
    let attempts = 0;
    const maxAttempts = 10;
    
    // Check status every 5 seconds with a maximum of 10 attempts
    verificationIntervalRef.current = setInterval(() => {
      attempts++;
      console.log(`Payment status check attempt ${attempts} of ${maxAttempts}`);
      
      checkPaymentStatus(applicationId).then(isVerified => {
        if (isVerified || attempts >= maxAttempts) {
          // Stop checking if payment is verified or we've reached max attempts
          clearInterval(verificationIntervalRef.current);
          clearTimeout(verificationTimerRef.current);
          verificationIntervalRef.current = null;
          verificationTimerRef.current = null;
          
          if (!isVerified && attempts >= maxAttempts) {
            console.log('Reached maximum verification attempts');
            setVerificationTimeout(true);
            setVerifyingPayment(false);
            message.info('We could not verify your payment automatically. If you have completed the payment, please click "Verify Manually" or contact support.');
          }
        }
      });
    }, 5000); // Every 5 seconds
    
    // Do an immediate check
    checkPaymentStatus(applicationId);
  };
  
  // Check the payment status
  const checkPaymentStatus = async (applicationId) => {
    try {
      const response = await seasonApplicantsService.checkPaymentStatus(applicationId);
      
      console.log('Payment status check result:', response);
      
      // If payment is verified (check various possible response formats)
      if (response.data?.payment_status === 'paid' || 
          response.data?.status === 'paid' || 
          response.data?.status === 'success' ||
          response.status === 200 && response.data?.message?.toLowerCase().includes('success')) {
        
        // Update the UI
        setVerifyingPayment(false);
        setPaymentVerified(true);
        setPaymentDetails(response.data);
        
        // Show success message
        message.success('Payment completed successfully! Your application is pending approval.');
        return true;
      }
      
      // If API returns a specific message, show it
      if (response.data?.message) {
        message.info(response.data.message);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      }
      return false;
    }
  };
  
  // Handle manual verification button click
  const handleManualVerification = () => {
    if (currentApplicationId) {
      setVerifyingPayment(true);
      checkPaymentStatus(currentApplicationId).then(isVerified => {
        if (!isVerified) {
          setVerifyingPayment(false);
        }
      });
    } else {
      message.error('No application ID found for verification');
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
      
      // Clear any pending application IDs when unmounting
      sessionStorage.removeItem('pendingApplicationIds');
      sessionStorage.removeItem('pendingTransactionId');
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
    setSelectAllChecked(false);
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
                  const subject = courseSubjects.find(s => s.seasonSubjectId === subjectId);
                  if (!subject) return null;
                  return {
                    key: subjectId,
                    subjectName: subject.subjectName,
                    courseName: subject.courseName,
                    price: subject.price
                  };
                }).filter(Boolean)
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
              <div style={{ marginTop: 16 }}>Loading payment methods...</div>
            </div>
          ) : paymentMethodsError ? (
            <Alert
              message="Error Loading Payment Methods"
              description={paymentMethodsError}
              type="error"
              showIcon
            />
          ) : paymentMethods && paymentMethods.length > 0 ? (
          <Radio.Group 
            onChange={e => {
              setPaymentMethod(e.target.value);
              const selectedMethod = paymentMethods.find(m => m.code === e.target.value);
              if (selectedMethod?.code === 'bank') {
                handleBankPayment();
              } else {
                setShowBankDetails(false);
              }
            }}
            value={paymentMethod}
            size="large"
              style={{ marginBottom: 12 }}
          >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '6px'
              }}>
                {paymentMethods.map(method => {
                  const getIconPath = (code) => {
                    switch (code) {
                      case 'mpesa':
                        return '/mnos/m-pesa.png';
                      case 'mixx':
                        return '/mnos/mixx-yas.png';
                      case 'airtel':
                        return '/mnos/airtel-money.png';
                      case 'bank':
                        return '/mnos/bank.png';
                      default:
                        return method.icon;
                    }
                  };

                  return (
                  <Radio.Button 
                    key={method.id} 
                    value={method.code} 
                      style={{ 
                        height: 'auto',
                        padding: '6px',
                        width: '100%',
                        textAlign: 'center'
                      }}
                  >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '4px'
                      }}>
                        <img 
                          src={getIconPath(method.code)} 
                          alt={method.name} 
                          width={24} 
                          height={24}
                          style={{ objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '13px' }}>{method.name}</span>
                        <small style={{ color: '#666', fontSize: '11px' }}>{method.description}</small>
                    </div>
                  </Radio.Button>
                  );
                })}
            </div>
          </Radio.Group>
          ) : (
            <Alert
              message="No Payment Methods Available"
              description="There are currently no payment methods available. Please try again later or contact support."
              type="warning"
              showIcon
            />
          )}
          
          {paymentMethod === 'bank' && (
            <div>
              <Card title="Bank Payment Details" style={{ marginBottom: 12 }}>
                <Descriptions bordered column={1} size="small" style={{ fontSize: '12px' }}>
                  <Descriptions.Item label="Bank Name" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {bankDetails?.bank_name || 'Loading...'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Number" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {bankDetails?.account_number || 'Loading...'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Name" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {bankDetails?.account_name || 'Loading...'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Branch Code" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {bankDetails?.branch_code || 'Loading...'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Swift Code" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {bankDetails?.swift_code || 'Loading...'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {formatCurrency(totalAmount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference" labelStyle={{ padding: '4px 8px' }} contentStyle={{ padding: '4px 8px' }}>
                    {(() => {
                      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
                      const userId = userInfo.id || '';
                      const fullName = `${userInfo.first_name || ''} ${userInfo.middle_name || ''} ${userInfo.last_name || ''}`.trim();
                      return `${userId}:${fullName}`;
                    })()}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 10 }}>
                  <Button type="primary" size="small" onClick={handlePrintInvoice}>
                    <PrinterOutlined /> Print Invoice
                  </Button>
                </div>
              </Card>

              <Title level={5}>Enter Mobile Number</Title>
              <Paragraph type="secondary">
                Please enter your mobile number starting with 255
              </Paragraph>
              <Input
                prefix={<PhoneOutlined className="site-form-item-icon" />}
                placeholder="255XXXXXXXXX"
                value={mobileNumber}
                onChange={handleMobileNumberChange}
                style={{ maxWidth: 300, marginBottom: 24 }}
                status={mobileNumber && !isValidMobileNumber(mobileNumber) ? 'error' : ''}
              />
              {mobileNumber && !isValidMobileNumber(mobileNumber) && (
                <div style={{ color: '#ff4d4f', marginTop: 8, marginBottom: 24 }}>
                  Invalid mobile number format. Must start with 255 followed by 9 digits.
                </div>
              )}

              <Form.Item
                label="Bank Reference Number"
                required
                tooltip="Enter the reference number provided by your bank after making the payment"
              >
                <Input
                  placeholder="Enter bank reference number"
                  value={bankReference}
                  onChange={handleBankReferenceChange}
                  style={{ maxWidth: 300 }}
                />
              </Form.Item>
            </div>
          )}
          
          {paymentMethod && paymentMethod !== 'bank' && (
            <>
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
            </>
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
                      {paymentMethod && paymentMethods.length > 0 && (
                        <>
                          <img 
                            src={paymentMethods.find(m => m.code === paymentMethod)?.icon || ''} 
                            alt={paymentMethods.find(m => m.code === paymentMethod)?.name || paymentMethod} 
                            width={20} 
                            height={20} 
                          />
                          {paymentMethods.find(m => m.code === paymentMethod)?.name || paymentMethod}
                        </>
                      )}
                    </Space>
                  </Descriptions.Item>
                  {paymentMethod !== 'Bank' && (
                    <Descriptions.Item label="Mobile Number">{mobileNumber}</Descriptions.Item>
                  )}
                  {paymentMethod === 'Bank' && bankReference && (
                    <Descriptions.Item label="Bank Reference">{bankReference}</Descriptions.Item>
                  )}
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
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Result
            status={paymentVerified ? "success" : "info"}
            title={paymentVerified ? "Payment Completed Successfully!" : "Application Submitted Successfully"}
            subTitle={
              <div>
                {paymentVerified ? (
                  <p>Your payment has been completed and your application is now pending approval.</p>
                ) : (
                  <p>Your application has been submitted and your payment is being processed.</p>
                )}
                <p><Text strong>Transaction ID:</Text> {transactionId}</p>
              </div>
            }
            extra={[
              <Button 
                key="dashboard" 
                type="primary" 
                onClick={handleFinish}
              >
                Go to Dashboard
              </Button>
            ]}
          />
          
          <Divider />
          
          <Title level={4}>Payment Details</Title>
          
          {verifyingPayment && (
            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <Spin spinning={true} />
              <div style={{ marginTop: 16 }}>
                <Text>Verifying payment status... 
                  <Tooltip title="We're checking the status of your payment with the payment provider">
                    <InfoCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </Text>
              </div>
            </div>
          )}
          
          {verificationTimeout && !paymentVerified && (
            <Alert
              message="Verification Timeout"
              description={
                <div>
                  <p>We couldn't automatically verify your payment status.</p>
                  <p>If you've completed the payment, it may take some time to process. You can check your status later from the dashboard or click below to try verifying again.</p>
                  <Button 
                    type="primary" 
                    onClick={handleManualVerification}
                    loading={verifyingPayment}
                  >
                    Verify Manually
                  </Button>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 24, textAlign: 'left' }}
            />
          )}
          
          {paymentVerified && (
            <Alert
              message="Payment Completed"
              description={
                paymentDetails?.message ? 
                paymentDetails.message : 
                "Payment completed successfully. Your application is now pending approval."
              }
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Card>
            <div style={{ textAlign: 'left' }}>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Transaction ID: <Text strong>{transactionId}</Text>
              </Paragraph>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Total Amount: <Text strong>{formatCurrency(totalAmount)}</Text>
              </Paragraph>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Payment Method: <Text strong>{paymentMethod}</Text>
              </Paragraph>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Mobile Number: <Text strong>{mobileNumber}</Text>
              </Paragraph>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Date: <Text strong>{new Date().toLocaleString()}</Text>
              </Paragraph>
              <Paragraph>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                Status: <Text strong type={paymentVerified ? "success" : "warning"}>
                  {paymentVerified ? (paymentDetails?.status || "Payment Completed") : "Pending"}
                </Text>
              </Paragraph>
              {paymentDetails && (
                <>
                  {paymentDetails.payment_date && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Payment Date: <Text strong>{new Date(paymentDetails.payment_date).toLocaleString()}</Text>
                    </Paragraph>
                  )}
                  {paymentDetails.payment_reference && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Payment Reference: <Text strong>{paymentDetails.payment_reference}</Text>
                    </Paragraph>
                  )}
                  {paymentDetails.receipt_number && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Receipt Number: <Text strong>{paymentDetails.receipt_number}</Text>
                    </Paragraph>
                  )}
                  {/* Display any additional payment details returned by the API */}
                  {paymentDetails.payment_method && !paymentMethod && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Payment Method: <Text strong>{paymentDetails.payment_method}</Text>
                    </Paragraph>
                  )}
                  {paymentDetails.amount && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Paid Amount: <Text strong>{formatCurrency(paymentDetails.amount)}</Text>
                    </Paragraph>
                  )}
                  {paymentDetails.payment_id && (
                    <Paragraph>
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      Payment ID: <Text strong>{paymentDetails.payment_id}</Text>
                    </Paragraph>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )
    }
  ];
  
  const renderStepContent = () => {
    return steps[currentStep].content;
  };
  
  // Columns for the table
  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName',
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: price => formatCurrency(price),
    },
    {
      title: 'Select',
      key: 'action',
      render: (_, record) => {
        const isSelected = selectedSubjects.includes(record.seasonSubjectId);
        return (
          <Checkbox
            checked={isSelected}
            onChange={() => handleSubjectSelection(record.seasonSubjectId)}
          />
        );
      },
    },
  ];
  
  // Handle login button click
  const handleLogin = () => {
    setAuthModalVisible(false);
    navigate('/login');
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setAuthModalVisible(false);
  };
  
  return (
    <div>
      <Card title={<Title level={4}>Apply for Courses</Title>} bordered={false}>
        {formError && (
          <Alert 
            message="Error" 
            description={formError} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        
        {/* Authentication Modal */}
        <Modal
          title="Authentication Required"
          open={authModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button 
              key="login" 
              type="primary" 
              icon={<LoginOutlined />} 
              onClick={handleLogin}
            >
              Login
            </Button>,
          ]}
        >
          <p>{authErrorMessage}</p>
        </Modal>
        
        {hasPendingApplications && (
          <Alert
            message="Incomplete Applications"
            description={
              <div>
                <p>You have {pendingApplications.length} unfinished application(s) that require payment. Would you like to complete them now?</p>
                <Button 
                  type="primary" 
                  onClick={() => setPendingPaymentModalVisible(true)}
                  style={{ marginRight: 8 }}
                >
                  Complete Payment
                </Button>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setHasPendingApplications(false)}
          />
        )}
        
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Select Season" 
                required
                help="Choose the academic season you wish to apply for"
              >
                <Select
                  placeholder="Select a level"
                  value={selectedSeason}
                  onChange={value => setSelectedSeason(value)}
                  loading={loading}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {seasonsWithSubjects.length > 0 ? (
                    seasonsWithSubjects.map(season => (
                      <Option key={season.id} value={season.id}>
                        {season.name} ({season.start_date} to {season.end_date})
                      </Option>
                    ))
                  ) : (
                    <Option disabled value="" key="no-seasons">No seasons with available subjects</Option>
                  )}
                </Select>
              </Form.Item>
              {activeSeasons.length > 0 && seasonsWithSubjects.length === 0 && !loading && (
                <Alert
                  message="No Available Subjects"
                  description="There are no available subjects to apply for in any of the active seasons."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Select Level" 
                required
                help="Select a course to view available subjects"
              >
                <Select
                  placeholder="Select a course"
                  value={selectedCourse}
                  onChange={value => setSelectedCourse(value)}
                  loading={loading}
                  disabled={loading || !selectedSeason}
                  style={{ width: '100%' }}
                >
                  {!selectedSeason ? (
                    <Option disabled value="" key="no-season">Please select a season first</Option>
                  ) : availableCourses.length > 0 ? (
                    availableCourses.map(course => (
                      <Option key={course.id} value={course.id}>
                        {course.name}
                      </Option>
                    ))
                  ) : (
                    <Option disabled value="" key="no-courses">No courses available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        
        <Divider />
        
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Available Subjects</Title>
          {selectedSeason ? (
            selectedCourse ? (
              <div>
                {courseSubjects.length > 0 ? (
                  <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Checkbox 
                        onChange={handleSelectAll}
                        checked={selectAllChecked}
                        indeterminate={selectedSubjects.length > 0 && selectedSubjects.length < courseSubjects.filter(s => s.spotsLeft > 0).length}
                      >
                        Select All
                      </Checkbox>
                      
                      <div>
                        <Text style={{ marginRight: 16 }}>
                          <Text strong>Total Amount:</Text> {formatCurrency(totalAmount)}
                        </Text>
                        
                        <Button
                          type="primary"
                          icon={<DollarOutlined />}
                          onClick={handleProceedToPayment}
                          disabled={selectedSubjects.length === 0}
                        >
                          Proceed to Payment
                        </Button>
                      </div>
                    </div>
                    
                    <Table
                      dataSource={courseSubjects}
                      columns={columns}
                      rowKey="seasonSubjectId"
                      loading={loading}
                      pagination={false}
                    />
                  </div>
                ) : (
                  <Alert
                    message="No subjects available"
                    description={
                      loading
                        ? "Loading available subjects..."
                        : "There are no subjects available for the selected course in this season or you've already applied to all available subjects."
                    }
                    type="info"
                    showIcon
                  />
                )}
              </div>
            ) : (
              <Alert
                message="Select a course"
                description="Please select a course to view available subjects."
                type="info"
                showIcon
              />
            )
          ) : (
            <Alert
              message="Select a season"
              description="Please select an active season to view available courses."
              type="info"
              showIcon
            />
          )}
        </div>
      </Card>
      
      <Modal
        title={`Application Process - ${steps[currentStep].title}`}
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={null}
        width={700}
        maskClosable={!processingPayment}
        closable={!processingPayment}
        keyboard={!processingPayment}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <div className="steps-content">
          {renderStepContent()}
        </div>
        
        <div className="steps-action" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && currentStep !== 3 && !processingPayment && (
              <Button 
                onClick={prevStep}
              >
                Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 && currentStep !== 2 && (
              <Button 
                type="primary" 
                onClick={nextStep}
                disabled={processingPayment}
              >
                {currentStep === 0 ? 'Proceed to Payment' : 
                  currentStep === 1 ? 'Review & Confirm' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Modal for handling pending applications */}
      <Modal
        title="Complete Your Pending Applications"
        open={pendingPaymentModalVisible}
        onCancel={() => setPendingPaymentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={dismissPendingApplications}>
            Cancel These Applications
          </Button>,
          <Button key="resume" type="primary" onClick={resumePendingApplications}>
            Continue to Payment
          </Button>
        ]}
      >
        <div>
          <Alert
            message="Incomplete Application Process"
            description="You previously started the application process but didn't complete the payment."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Title level={5}>Pending Applications</Title>
          <Table
            dataSource={pendingApplications}
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
                dataIndex: 'fee',
                key: 'fee',
                render: fee => formatCurrency(fee)
              },
              {
                title: 'Date Applied',
                dataIndex: 'appliedDate',
                key: 'appliedDate',
                render: date => new Date(date).toLocaleDateString()
              }
            ]}
            pagination={false}
            rowKey="subjectId"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Total Amount</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong type="success">
                      {formatCurrency(pendingApplications.reduce((sum, app) => sum + app.fee, 0))}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
            size="small"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ApplyCourse; 
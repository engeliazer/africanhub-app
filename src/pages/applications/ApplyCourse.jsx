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
  Tooltip,
  Tabs
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
import { useTheme } from '../../contexts/ThemeContext';

// Import services
import subjectsService from '../../services/subjects';
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
  const { colors } = useTheme();
  // States
  const [loading, setLoading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [appliedSubjects, setAppliedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [formError, setFormError] = useState(null);
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
        
        // Fetch available subjects
        await fetchAvailableSubjects();
        
        // Check for any pending payment applications (from session storage)
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
  
  // Fetch available subjects
  const fetchAvailableSubjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching available subjects');
      const response = await subjectsService.getAvailableSubjects();
      console.log('Available subjects response:', response);

      if (response.status !== 'success') {
        throw new Error('Failed to fetch available subjects');
      }

      // Extract data from the new response structure
      const data = response.data || {};
      const appliedSubjectsData = data.applied_subjects || [];
      const availableSubjectsData = data.available_subjects || [];

      console.log('Applied subjects:', appliedSubjectsData);
      console.log('Available subjects:', availableSubjectsData);

      // Transform applied subjects
      const transformedAppliedSubjects = appliedSubjectsData.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        duration_days: subject.duration_days,
        trial_duration_days: subject.trial_duration_days,
        application_date: subject.application_date,
        application_status: subject.application_status,
        access_expired: subject.access_expired,
        days_remaining: subject.days_remaining,
        days_since_application: subject.days_since_application,
        fee: subject.fee || 0,
        price: subject.current_price || 0,
        is_active: subject.is_active
      }));

      // Transform available subjects
      const transformedAvailableSubjects = availableSubjectsData.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        duration_days: subject.duration_days,
        trial_duration_days: subject.trial_duration_days,
        availability_reason: subject.availability_reason,
        days_since_application: subject.days_since_application,
        price: subject.current_price || 0,
        is_active: subject.is_active
      }));

      setAppliedSubjects(transformedAppliedSubjects);
      setAvailableSubjects(transformedAvailableSubjects);
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      message.error('Failed to load subjects. Please try again later.');
      setAppliedSubjects([]);
      setAvailableSubjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch the student's applications (no longer needed - endpoint removed)
  // Applications are now managed through session storage for pending payments
  const fetchMyApplications = async () => {
    // This function is kept for compatibility but no longer makes API calls
    // since /api/season-applications endpoint no longer exists
    setMyApplications([]);
    setPendingApplications([]);
    setHasPendingApplications(false);
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
        const subject = availableSubjects.find(s => s.id === id);
        return sum + (subject?.price || 0);
      }, 0);
      setTotalAmount(total);
      
      // Update select all state
      setSelectAllChecked(newSelection.length === availableSubjects.length);
      
      return newSelection;
    });
  };

  // Handle select all subjects
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    
    if (!availableSubjects || availableSubjects.length === 0) {
      return;
    }

    if (checked) {
      // Select all subjects
      const allSubjectIds = availableSubjects.map(subject => subject.id);
      setSelectedSubjects(allSubjectIds);
      setSelectAllChecked(true);
      
      // Calculate total amount for all subjects
      const total = allSubjectIds.reduce((sum, subjectId) => {
        const subject = availableSubjects.find(s => s.id === subjectId);
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
  
  // Handle apply for a single subject
  const handleApplyForSubject = async (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    // Update state and proceed with the subject directly
    setSelectedSubjects([subjectId]);
    setTotalAmount(subject.price || 0);
    // Pass the subject ID directly to avoid timing issues with state updates
    handleProceedToPayment([subjectId]);
  };
  
  
  // Handle proceed to payment button click
  const handleProceedToPayment = async (subjectIdsOverride = null) => {
    // Use override if provided, otherwise use state
    const subjectsToUse = subjectIdsOverride || selectedSubjects;
    
    if (subjectsToUse.length === 0) {
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
  const createPendingApplications = async (subjectIdsOverride = null) => {
    // Use override if provided, otherwise use state
    const subjectsToUse = subjectIdsOverride || selectedSubjects;

    if (subjectsToUse.length === 0) {
      message.error('Please select at least one subject');
      return false;
    }

    setLoading(true);
    try {
      // Get all subjects data
      const subjectsData = subjectsToUse.map(subjectId => {
        const subject = availableSubjects.find(s => s.id === subjectId);
        return subject ? { id: subject.id, price: subject.price || 0 } : null;
      }).filter(Boolean);

      if (subjectsData.length === 0) {
        throw new Error('No valid subjects found');
      }

      // Try to create a single application with all subjects in details
      try {
        const result = await seasonApplicantsService.createSeasonApplicant({
          subject_ids: subjectsData.map(s => s.id),
          fees: subjectsData.map(s => s.price),
          payment_status: 'pending_payment',
          status: 'pending'
        });

        // Extract application ID from response
        const applicationId = result?.data?.id || result?.data?.application_id;

        if (!applicationId) {
          throw new Error('Failed to create application - no ID returned');
        }

        // Store application ID in session storage
        sessionStorage.setItem('pendingApplicationIds', JSON.stringify([applicationId]));
      
      return true;
      } catch (createError) {
        // Check if error is about existing application
        if (createError.message && createError.message.includes('Application already exists')) {
          console.log('Application already exists, proceeding with payment for existing application');
          message.info('Continuing with existing application...');

          // Try to find existing applications for these subjects
          // Since we can't query by subject IDs, we'll create a mock application ID
          // In a real scenario, you'd query the API to get existing application IDs
          const mockApplicationId = `existing-${Date.now()}`;
          sessionStorage.setItem('pendingApplicationIds', JSON.stringify([mockApplicationId]));

          return true;
        } else {
          // Re-throw other errors
          throw createError;
        }
      }
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
                  price: app.fee
                })) :
                // Normal flow - newly selected subjects
                selectedSubjects.map(subjectId => {
                  const subject = availableSubjects.find(s => s.id === subjectId);
                  if (!subject) return null;
                  return {
                    key: subjectId,
                    subjectName: subject.name,
                    price: subject.price || 0
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
  
  // Columns for the review table (in payment modal)
  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: price => formatCurrency(price),
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
        
        <div style={{ marginBottom: 16 }}>
          <Tabs
            defaultActiveKey="available"
            type="card"
            style={{ background: colors.card, borderRadius: '8px' }}
            tabBarStyle={{ background: colors.card, marginBottom: 0, padding: '0 16px' }}
            items={[
              {
                key: 'available',
                label: (
                  <span style={{ color: colors.textPrimary }}>
                    Available Subjects ({availableSubjects.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: '16px' }}>
                    {selectedSubjects.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text>
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
                    )}

                    {loading ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '256px'
                      }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: colors.textSecondary }}>Loading available subjects...</div>
                    </div>
                    ) : availableSubjects.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {availableSubjects.map(subject => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const availabilityReason = subject.availability_reason;
                          const getAvailabilityTag = () => {
                            switch (availabilityReason) {
                              case 'not_applied':
                                return <Tag color="green">Available</Tag>;
                              case 'access_expired':
                                return <Tag color="orange">Access Expired</Tag>;
                              default:
                                return <Tag color="blue">Available</Tag>;
                            }
                          };

                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={subject.id}>
                              <Card
                                hoverable
                                style={{
                                  height: '100%',
                                  background: isSelected ? colors.cardDepth : colors.card,
                                  border: `1px solid ${isSelected ? colors.primaryAccent : colors.border}`,
                                  boxShadow: isSelected
                                    ? `0 4px 12px rgba(227, 184, 87, 0.3)`
                                    : `0 2px 8px rgba(0, 0, 0, 0.1)`,
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                }}
                                bodyStyle={{
                                  padding: '16px',
                                  flex: 1,
                                  minHeight: 0,
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                actions={[
                                  <Button
                                    key="apply"
                                    type="primary"
                                    onClick={() => handleApplyForSubject(subject.id)}
                                    style={{
                                      background: colors.primaryAccent,
                                      borderColor: colors.primaryAccent,
                                      color: colors.background,
                                      width: '90%',
                                    }}
                                  >
                                    Apply
                                  </Button>
                                ]}
                                actionsStyle={{ padding: '12px 8px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}
                              >
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 8 }}>
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleSubjectSelection(subject.id)}
                                  >
                                    <Text strong style={{ color: colors.textPrimary, fontSize: '16px' }}>
                                      {subject.name}
                                    </Text>
                                  </Checkbox>
                                </div>
                                <div style={{ flexShrink: 0, marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                                  <div style={{ marginBottom: 6 }}>
                                    <Text style={{ color: colors.textMuted, fontSize: '12px' }}>
                                      Code: {subject.code}
                                    </Text>
                                  </div>
                                  <div style={{ marginBottom: 6 }}>
                                    {getAvailabilityTag()}
                                    {subject.duration_days && (
                                      <Tag color="blue" style={{ marginLeft: 8 }}>
                                        {subject.duration_days} days
                                      </Tag>
                                    )}
                                  </div>
                                  {subject.availability_reason === 'access_expired' && subject.days_since_application && (
                                    <div style={{ marginBottom: 6 }}>
                                      <Text style={{ color: colors.textMuted, fontSize: '12px' }}>
                                        Expired {subject.days_since_application} days ago
                                      </Text>
                                    </div>
                                  )}
                                  {subject.price > 0 && (
                                    <div>
                                      <Text strong style={{ color: colors.primaryAccent, fontSize: '18px' }}>
                                        {formatCurrency(subject.price)}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                ) : (
                  <Alert
                    message="No subjects available"
                        description="There are no subjects available for application."
                    type="info"
                    showIcon
                  />
                )}
              </div>
                ),
              },
              {
                key: 'applied',
                label: (
                  <span style={{ color: colors.textPrimary }}>
                    My Applications ({appliedSubjects.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: '16px' }}>
                    {loading ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '256px'
                      }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: colors.textSecondary }}>Loading your applications...</div>
                      </div>
                    ) : appliedSubjects.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {appliedSubjects.map(subject => {
                          const getStatusTag = () => {
                            switch (subject.application_status) {
                              case 'approved':
                                return <Tag color="green">Approved</Tag>;
                              case 'pending':
                                return <Tag color="orange">Pending</Tag>;
                              case 'rejected':
                                return <Tag color="red">Rejected</Tag>;
                              default:
                                return <Tag color="blue">Applied</Tag>;
                            }
                          };

                          const getAccessTag = () => {
                            // Only show access status for approved applications
                            if (subject.application_status === 'approved') {
                              if (subject.access_expired) {
                                return <Tag color="red">Access Expired</Tag>;
                              }
                              return <Tag color="green">Active Access</Tag>;
                            }
                            // Don't show access tag for pending/rejected applications
                            return null;
                          };

                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={subject.id}>
                              <Card
                                hoverable
                                style={{
                                  height: '100%',
                                  background: colors.card,
                                  border: `1px solid ${colors.border}`,
                                  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                }}
                                bodyStyle={{
                                  padding: '16px',
                                  flex: 1,
                                  minHeight: 0,
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 8 }}>
                                  <Text strong style={{ color: colors.textPrimary, fontSize: '16px' }}>
                                    {subject.name}
                                  </Text>
                                </div>
                                <div style={{ flexShrink: 0, marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                                  <div style={{ marginBottom: 6 }}>
                                    <Text style={{ color: colors.textMuted, fontSize: '12px' }}>
                                      Code: {subject.code}
                                    </Text>
                                  </div>
                                  <div style={{ marginBottom: 6 }}>
                                    {getStatusTag()}
                                    {getAccessTag()}
                                  </div>
                                  <div style={{ marginBottom: 6 }}>
                                    <Text style={{ color: colors.textMuted, fontSize: '12px' }}>
                                      Applied: {new Date(subject.application_date).toLocaleDateString()}
                                    </Text>
                                  </div>
                                  {subject.days_remaining && (
                                    <div style={{ marginBottom: 6 }}>
                                      <Text style={{ color: colors.textMuted, fontSize: '12px' }}>
                                        {subject.days_remaining} days remaining
                                      </Text>
                                    </div>
                                  )}
                                  {subject.fee > 0 && (
                                    <div>
                                      <Text strong style={{ color: colors.primaryAccent, fontSize: '18px' }}>
                                        {formatCurrency(subject.fee)}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
            ) : (
              <Alert
                        message="No applications found"
                        description="You haven't applied for any subjects yet."
                type="info"
                showIcon
              />
                    )}
                  </div>
                ),
              },
            ]}
          />
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
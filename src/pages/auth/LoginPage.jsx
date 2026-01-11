import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Alert, Divider, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authService from '../../services/auth';
import { Logo } from '../../library/atoms';
import { setAssignedRoles, setCurrentRole } from '../../state/rbacSlice';
import { getTokenLocal, saveTokenLocal, removeTokenLocal } from '../../services/utils/authorization';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getTokenLocal();
        const userInfo = localStorage.getItem('user_info');
        
        if (!token || !userInfo) {
          // No token or user info, no need to redirect
          return;
        }

        try {
          // Parse user info to ensure it's valid JSON
          const parsedUserInfo = JSON.parse(userInfo);
          
          if (!parsedUserInfo || !parsedUserInfo.id) {
            // Invalid user info, clear it
            localStorage.removeItem('user_info');
            removeTokenLocal();
            return;
          }

          // Get return URL from query params
          const returnUrl = searchParams.get('returnUrl');
          
          // If user is already logged in and has valid data, redirect
          navigate(returnUrl || '/user/profile', { replace: true });
        } catch (error) {
          console.error('Error parsing user info:', error);
          // Invalid JSON or other error, clear auth data
          localStorage.removeItem('user_info');
          removeTokenLocal();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear auth data on error
        localStorage.removeItem('user_info');
        removeTokenLocal();
      }
    };

    // Execute the auth check
    checkAuth();
  }, [navigate, searchParams]);

  const onFinish = async (values) => {
    try {
      setError(null);
      setLoading(true);
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });
      
      // Race between the login request and the timeout
      const response = await Promise.race([
        authService.login({
          login: values.login,
          password: values.password
        }),
        timeoutPromise
      ]);

      console.log('Login response:', response); // Debug log

      // Check if password reset is required from the response data
      if (response.data?.user?.reset_password === true) {
        message.info('Please change your password to continue');
        // Store the token before navigating
        if (response.data?.token) {
          saveTokenLocal(response.data.token);
        }
        navigate('/change-password', {
          state: {
            email: values.login,
            plain_password: values.password,
            token: response.data?.token
          }
        });
        return;
      }

      // If no password reset required, proceed with normal login
      const userData = response.data?.data?.user || response.data?.user;
      
      if (!userData) {
        throw new Error('Invalid user data received');
      }

      // Store user info in localStorage
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      // Store token if it's returned in the response
      const token = response.data?.data?.token || response.data?.token;
      if (token) {
        saveTokenLocal(token);
      }
      
      // Extract roles from the response
      const roles = userData.assignedRoles || [];
      
      if (roles.length > 0) {
        // Set roles in Redux
        dispatch(setAssignedRoles(roles));
        
        // Set current role
        const roleToSet = userData.currentRole || roles[0].code;
        dispatch(setCurrentRole(roleToSet));
        
        message.success('Login successful');
        
        // Get return URL from query params
        const returnUrl = searchParams.get('returnUrl');
        
        // Navigate to the return URL, intended page, or profile
        const redirectTo = returnUrl || location.state?.from?.pathname || '/user/profile';
        navigate(redirectTo, { replace: true });
      } else {
        throw new Error('No roles assigned to user');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      setResetLoading(true);
      const response = await authService.resetPassword(values.email);

      if (response.status === 'success' || response.data?.status === 'success') {
        message.success('Password reset instructions have been sent to your email');
        setIsResetModalVisible(false);
        resetForm.resetFields();
      } else {
        message.error(response.message || response.data?.message || 'Failed to send reset instructions');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.message || 'An error occurred while processing your request');
    } finally {
      setResetLoading(false);
    }
  };

  const validateLogin = (_, value) => {
    if (!value) {
      return Promise.reject('Please input your email or phone number!');
    }
    
    // Check if it's a valid email or phone number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    if (!emailRegex.test(value) && !phoneRegex.test(value)) {
      return Promise.reject('Please enter a valid email or phone number!');
    }
    
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 -mt-12">
        <div className="text-center mb-8 -mt-2 bg-brandGray/20 px-2 text-white p-2 rounded-lg -ml-2 -mr-2">
        <div className="flex justify-center mb-10">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Online CPA Review Classes
          </h1>
          <Divider className='mt-1 mb-0'/>
          <Title level={5}>Sign in to your account</Title>
        </div>
       

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <div className="px-10">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            className="space-y-2"
          >
            <Form.Item
              name="login"
              label="Email or Phone Number"
              rules={[{ validator: validateLogin }, { required: true, message: 'Please input your email or phone number!' }]}
              className="mb-1"
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your email or phone number"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 5, message: 'Password must be at least 5 characters!' }
              ]}
              className="mb-1"
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item className="mb-1">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Sign in
              </Button>
            </Form.Item>
            
            <div className="text-center mt-1">
              <Button 
                type="link" 
                className="text-primary p-0" 
                onClick={() => setIsResetModalVisible(true)}
              >
                Forgot Password?
              </Button>
            </div>
            
            <div className="text-center mt-1 text-[10px] text-gray-500">
              By signing in, you agree to our <a href="https://www.ocpac.dcrc.ac.tz/terms.html" target="_blank" rel="noopener noreferrer" className="text-primary"><u>Terms and Conditions</u></a> and <a href="https://www.ocpac.dcrc.ac.tz/privacy.html" target="_blank" rel="noopener noreferrer" className="text-primary"><u>Privacy Policy</u></a>
            </div>
            
            <div className="text-center mt-2">
              <Text type="secondary">
                Don't have an account? <Link to="/register" className="text-primary">Sign up</Link>
              </Text>
            </div>
          </Form>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        title="Reset Password"
        open={isResetModalVisible}
        onCancel={() => setIsResetModalVisible(false)}
        footer={null}
      >
        <Form
          form={resetForm}
          name="resetPassword"
          onFinish={handleResetPassword}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email address"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={resetLoading}
              block
            >
              Send Reset Instructions
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;
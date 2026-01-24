import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Alert, Divider, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authService from '../../services/auth';
import { Logo } from '../../library/atoms';
import { setAssignedRoles, setCurrentRole } from '../../state/rbacSlice';
import { getTokenLocal, saveTokenLocal, removeTokenLocal } from '../../services/utils/authorization';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../../library/components/ThemeSwitcher';

const { Title, Text } = Typography;

const LoginPage = () => {
  const { colors, theme, toggleTheme } = useTheme();
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
        // The module selection modal will be shown in SecondaryLayout if needed
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
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.card} 50%, ${colors.background} 100%)`,
        position: 'relative',
      }}
    >
      {/* Theme Switcher - Top Right Corner */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
        }}
      >
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{
            color: colors.textPrimary,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.cardDepth;
            e.currentTarget.style.color = colors.primaryAccent;
            e.currentTarget.style.borderColor = colors.primaryAccent;
            e.currentTarget.style.boxShadow = `0 4px 12px rgba(227, 184, 87, 0.3)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.card;
            e.currentTarget.style.color = colors.textPrimary;
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.15)`;
          }}
        />
      </div>

      {/* Decorative background elements */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(227, 184, 87, 0.1) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(227, 184, 87, 0.08) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />
      
      <Card 
        className="max-w-md w-full"
        style={{
          background: `linear-gradient(135deg, ${colors.card} 0%, ${colors.cardDepth} 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(227, 184, 87, 0.15)`,
          position: 'relative',
          zIndex: 1,
        }}
        bodyStyle={{
          padding: '28px 24px',
        }}
      >
        {/* Header Section */}
        <div 
          className="text-center mb-6"
          style={{
            paddingBottom: '16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex justify-center mb-3">
            <div
              style={{
                padding: '10px',
                background: `linear-gradient(135deg, ${colors.cardDepth} 0%, ${colors.card} 100%)`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px rgba(227, 184, 87, 0.2)`,
                border: `1px solid ${colors.border}`,
              }}
            >
            <Logo />
            </div>
          </div>
          <Title 
            level={3} 
            style={{ 
              color: colors.textPrimary, 
              marginBottom: '4px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontSize: '20px',
            }}
          >
            THE AFRICAN HUB
          </Title>
          <Text 
            style={{ 
              color: colors.primaryAccent,
              fontSize: '13px',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Building Accounting Skills for the Real World
          </Text>
          <Text 
            style={{ 
              color: colors.textSecondary,
              fontSize: '12px',
            }}
          >
            Sign in to your account
          </Text>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{
              marginBottom: '24px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${colors.cardDepth} 0%, ${colors.card} 100%)`,
              border: `1px solid ${colors.border}`,
            }}
          />
        )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
          size="large"
          >
            <Form.Item
              name="login"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Email or Phone Number
              </span>
            }
              rules={[{ validator: validateLogin }, { required: true, message: 'Please input your email or phone number!' }]}
            style={{ marginBottom: '12px' }}
            >
              <Input
              prefix={<UserOutlined style={{ color: colors.textMuted }} />}
                placeholder="Enter your email or phone number"
              style={{
                background: colors.cardDepth,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                color: colors.textPrimary,
                height: '40px',
              }}
              />
            </Form.Item>

            <Form.Item
              name="password"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Password
              </span>
            }
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 5, message: 'Password must be at least 5 characters!' }
              ]}
            style={{ marginBottom: '16px' }}
            >
              <Input.Password
              prefix={<LockOutlined style={{ color: colors.textMuted }} />}
                placeholder="Enter your password"
              style={{
                background: colors.cardDepth,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                color: colors.textPrimary,
                height: '40px',
              }}
              />
            </Form.Item>

          <Form.Item style={{ marginBottom: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              style={{
                height: '44px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.primaryAccent} 0%, ${colors.secondaryAccent} 100%)`,
                border: 'none',
                color: colors.background,
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: `0 4px 12px rgba(227, 184, 87, 0.3)`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 6px 16px rgba(227, 184, 87, 0.4)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 12px rgba(227, 184, 87, 0.3)`;
              }}
              >
                Sign in
              </Button>
            </Form.Item>
            
          <div className="text-center" style={{ marginBottom: '16px' }}>
              <Button 
                type="link" 
                onClick={() => setIsResetModalVisible(true)}
              style={{
                color: colors.primaryAccent,
                padding: 0,
                height: 'auto',
                fontWeight: 500,
                fontSize: '13px',
              }}
              >
                Forgot Password?
              </Button>
            </div>
            
          <div 
            className="text-center" 
            style={{ 
              marginBottom: '16px',
              fontSize: '10px',
              color: colors.textMuted,
              lineHeight: '1.5',
            }}
          >
            By signing in, you agree to our{' '}
            <a 
              href="https://www.ocpac.dcrc.ac.tz/terms.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: colors.primaryAccent,
                textDecoration: 'underline',
              }}
            >
              Terms and Conditions
            </a>
            {' '}and{' '}
            <a 
              href="https://www.ocpac.dcrc.ac.tz/privacy.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: colors.primaryAccent,
                textDecoration: 'underline',
              }}
            >
              Privacy Policy
            </a>
            </div>
            
          <div className="text-center">
            <Text style={{ color: colors.textSecondary, fontSize: '13px' }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: colors.primaryAccent,
                  fontWeight: 500,
                }}
              >
                Sign up
              </Link>
              </Text>
            </div>
          </Form>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        title={
          <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
            Reset Password
          </span>
        }
        open={isResetModalVisible}
        onCancel={() => setIsResetModalVisible(false)}
        footer={null}
        style={{
          top: 100,
        }}
      >
        <Form
          form={resetForm}
          name="resetPassword"
          onFinish={handleResetPassword}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Email
              </span>
            }
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
            style={{ marginBottom: '16px' }}
          >
            <Input
              prefix={<MailOutlined style={{ color: colors.textMuted }} />}
              placeholder="Enter your email address"
              style={{
                background: colors.cardDepth,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                color: colors.textPrimary,
                height: '40px',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={resetLoading}
              block
              style={{
                height: '44px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.primaryAccent} 0%, ${colors.secondaryAccent} 100%)`,
                border: 'none',
                color: colors.background,
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: `0 4px 12px rgba(227, 184, 87, 0.3)`,
              }}
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
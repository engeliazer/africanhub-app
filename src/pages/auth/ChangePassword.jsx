import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';
import { getTokenLocal, saveTokenLocal } from '../../services/utils/authorization';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for token and set initial form values
  useEffect(() => {
    const initializeForm = () => {
      try {
        // Get token from navigation state first, then fallback to local storage
        const token = location.state?.token || getTokenLocal();
        
        // If we have registration data in location state, use it
        if (location.state?.email && location.state?.plain_password) {
          form.setFieldsValue({
            email: location.state.email,
            old_password: location.state.plain_password
          });
          setInitializing(false);
          return;
        }

        // If we don't have the necessary state data, redirect to login
        if (!token) {
          message.error('Please login first');
          navigate('/login');
          return;
        }

        setInitializing(false);
      } catch (error) {
        console.error('Error initializing form:', error);
        message.error('Error initializing form. Please try again.');
        setInitializing(false);
      }
    };

    initializeForm();
  }, [navigate, form, location]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const token = location.state?.token || getTokenLocal();
      
      if (!token && !location.state?.email) {
        message.error('Authentication token not found');
        navigate('/login');
        return;
      }

      const response = await authService.changePassword(
        values.email,
        values.old_password,
        values.new_password,
        values.confirm_password,
        token
      );

      console.log('Change password response:', response); // Debug log

      // Check if the password change was successful
      if (response.status === 'success' || response.data?.status === 'success') {
        // If we have a new token in the response, save it
        if (response.token || response.data?.token) {
          saveTokenLocal(response.token || response.data.token);
        }

        message.success(response.message || response.data?.message || 'Password changed successfully. Please login with your new password.');
        navigate('/login');
      } else {
        // Handle unsuccessful password change
        message.error(response.message || response.data?.message || 'Failed to change password. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      // Show detailed error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      message.error(errorMessage);
      console.error('Password change error:', error);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2}>Change Password</Title>
          <Text type="secondary">
            Please change your initial password to continue
          </Text>
        </div>

        <Form
          form={form}
          name="changePassword"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            email: location.state?.email || '',
            old_password: location.state?.plain_password || ''
          }}
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
              placeholder="Enter your email"
              disabled={!!location.state?.email}
            />
          </Form.Item>

          <Form.Item
            name="old_password"
            label="Current Password"
            rules={[
              { required: true, message: 'Please input your current password!' },
              { min: 5, message: 'Password must be at least 5 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your current password"
              disabled={!!location.state?.plain_password}
            />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 5, message: 'Password must be at least 5 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm New Password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<CheckCircleOutlined />}
              placeholder="Confirm your new password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword; 
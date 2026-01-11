import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';
import { Logo } from '../../library/atoms';
import { removeTokenLocal } from '../../services/utils/authorization';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await authService.register({
        first_name: values.firstName,
        middle_name: values.middleName,
        last_name: values.lastName,
        phone: values.phone,
        email: values.email,
        registration_mode: "SELF"
      });
      
      // Clear any existing tokens and user info before redirecting
      localStorage.removeItem('user_info');
      removeTokenLocal();
     
      message.success('Registration successful! Please login with your initial password: ' + response.data.plain_password);
      navigate('/login', { replace: true });
    } catch (error) {
      console.log('Error response:', error);
      message.error(`${error.error}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div className="text-center">
        <div className="text-center mb-8 -mt-2 bg-brandGray/20 px-2 text-white p-2 rounded-lg -ml-2 -mr-2">
        <div className="flex justify-center mb-10">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Online CPA Review Classes
          </h1>
          <Divider className='mt-1 mb-0'/>
          <Title level={5}>Sign Up for your account</Title>
        </div>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          className="px-4"
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please input your first name!' }]}
            className="mb-2"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your first name"
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="middleName"
            label="Middle Name"
            className="mb-2"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your middle name (optional)"
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please input your last name!' }]}
            className="mb-2"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your last name"
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
            ]}
            className="mb-2"
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Enter your phone number"
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
            className="mb-2"
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="termsAgreement"
            valuePropName="checked"
            rules={[
              { 
                type: 'boolean',
                required: true,
                message: 'Please accept the terms and conditions'
              }
            ]}
            className="mb-2"
          >
            <div className="text-center mt-2 text-xs text-gray-500">
            <Checkbox onChange={handleTermsChange}>
              I agree to the <a href="https://www.ocpac.dcrc.ac.tz/terms.html" target="_blank" rel="noopener noreferrer"><u>Terms and Conditions</u></a> and <a href="https://www.ocpac.dcrc.ac.tz/privacy.html" target="_blank" rel="noopener noreferrer"><u>Privacy Policy</u></a>
            </Checkbox>
            </div>
          </Form.Item>

            <Form.Item className="mb-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-8"
              >
                Register
              </Button>
            </Form.Item>
          
          <div className="text-center mt-2">
            <Text type="secondary">
              Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 
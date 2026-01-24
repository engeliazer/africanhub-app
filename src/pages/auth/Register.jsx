import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';
import { Logo } from '../../library/atoms';
import { removeTokenLocal } from '../../services/utils/authorization';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

const Register = () => {
  const { colors, theme, toggleTheme } = useTheme();
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
            Sign up for your account
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="firstName"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                First Name
              </span>
            }
            rules={[{ required: true, message: 'Please input your first name!' }]}
            style={{ marginBottom: '12px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.textMuted }} />}
              placeholder="Enter your first name"
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
            name="middleName"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Middle Name <span style={{ color: colors.textMuted, fontWeight: 400 }}>(optional)</span>
              </span>
            }
            style={{ marginBottom: '12px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.textMuted }} />}
              placeholder="Enter your middle name (optional)"
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
            name="lastName"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Last Name
              </span>
            }
            rules={[{ required: true, message: 'Please input your last name!' }]}
            style={{ marginBottom: '12px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.textMuted }} />}
              placeholder="Enter your last name"
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
            name="phone"
            label={
              <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Phone Number
              </span>
            }
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
            ]}
            style={{ marginBottom: '12px' }}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: colors.textMuted }} />}
              placeholder="Enter your phone number"
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
              placeholder="Enter your email"
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
            name="termsAgreement"
            valuePropName="checked"
            rules={[
              { 
                type: 'boolean',
                required: true,
                message: 'Please accept the terms and conditions'
              }
            ]}
            style={{ marginBottom: '16px' }}
          >
            <div className="text-center">
              <Checkbox 
                onChange={handleTermsChange}
                style={{
                  color: colors.textSecondary,
                }}
              >
                <span style={{ color: colors.textSecondary, fontSize: '11px' }}>
                  I agree to the{' '}
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
                </span>
              </Checkbox>
            </div>
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
              Register
            </Button>
          </Form.Item>
          
          <div className="text-center">
            <Text style={{ color: colors.textSecondary, fontSize: '13px' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: colors.primaryAccent,
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 
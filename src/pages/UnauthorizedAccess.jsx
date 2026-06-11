import React from 'react';
import { Typography, Button, Result } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LockOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { selectCurrentRole } from '../state/rbacSlice';

const { Title, Text } = Typography;

const UnauthorizedAccess = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = useSelector(selectCurrentRole);
  const from = location.state?.from;

  const isStudent = currentRole === 'STUDENT';
  const goToPath = isStudent ? '/applications/my-applications' : '/user/profile';
  const goToLabel = isStudent ? 'Go to My Applications' : 'Go to Profile';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: colors.background
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: colors.card,
          borderRadius: '12px',
          padding: '48px 32px',
          boxShadow: `0 2px 8px ${colors.boxShadow || 'rgba(0,0,0,0.15)'}`,
          border: `1px solid ${colors.border}`,
          textAlign: 'center'
        }}
      >
        <Result
          status="403"
          icon={
            <LockOutlined
              style={{
                fontSize: 72,
                color: colors.textMuted || colors.textSecondary
              }}
            />
          }
          title={
            <Title level={3} style={{ color: colors.textPrimary, margin: 0 }}>
              Access denied
            </Title>
          }
          subTitle={
            <Text style={{ color: colors.textSecondary, fontSize: '16px', display: 'block', marginTop: '8px' }}>
              You don't have permission to access this page.
            </Text>
          }
          extra={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
              {from?.pathname && (
                <Text style={{ color: colors.textMuted || colors.textSecondary, fontSize: '14px' }}>
                  Attempted: {from.pathname}
                </Text>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={isStudent ? <AppstoreOutlined /> : <HomeOutlined />}
                  onClick={() => navigate(goToPath, { replace: true })}
                >
                  {goToLabel}
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default UnauthorizedAccess;

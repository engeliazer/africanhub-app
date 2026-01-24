import React from 'react';
import { Modal, Card, Row, Col, Typography, Space, Badge } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  FormOutlined,
  AccountBookOutlined,
  SettingOutlined,
  AppstoreOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;

const ModuleSelectionModal = ({ 
  open, 
  onSelect, 
  availableModules, 
  selectedModule 
}) => {
  const { colors } = useTheme();
  const moduleIcons = {
    user: UserOutlined,
    facilitation: BookOutlined,
    applications: FormOutlined,
    accounting: AccountBookOutlined,
    support: SettingOutlined,
    reports: AppstoreOutlined
  };

  const getModuleIcon = (moduleKey, isSelected) => {
    const Icon = moduleIcons[moduleKey] || AppstoreOutlined;
    return (
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '16px',
        background: isSelected 
          ? `linear-gradient(135deg, ${colors.cardDepth} 0%, ${colors.border} 100%)` 
          : `linear-gradient(135deg, ${colors.border} 0%, ${colors.card} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected 
          ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.2)',
        transform: isSelected ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        border: isSelected ? `2px solid ${colors.cardDepth}` : `1px solid ${colors.border}`
      }}>
        <Icon style={{ fontSize: 40, color: colors.textPrimary }} />
      </div>
    );
  };

  const handleModuleSelect = (moduleKey) => {
    // Only close modal when a module is actually selected
    if (moduleKey) {
      onSelect(moduleKey);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {}} // Prevent closing - do nothing
      onOk={() => {}} // Prevent closing via OK button
      footer={null}
      closable={false}
      maskClosable={false}
      keyboard={false} // Prevent closing with ESC key
      width={900}
      centered
      styles={{
        body: { 
          padding: '32px',
          background: `linear-gradient(135deg, ${colors.card} 0%, ${colors.background} 100%)`
        },
        content: {
          background: 'transparent',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`
        },
        mask: {
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.75)'
        }
      }}
      className="module-selection-modal"
    >
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Title level={2} style={{ 
          color: colors.textPrimary, 
          marginBottom: 8,
          fontWeight: 600,
          letterSpacing: '-0.5px'
        }}>
          Select a Module
        </Title>
        <Text style={{ 
          color: colors.textMuted, 
          fontSize: '16px',
          fontWeight: 400
        }}>
          Choose the module you want to access
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        {availableModules.map((module) => {
          const Icon = moduleIcons[module.value] || AppstoreOutlined;
          const isSelected = selectedModule === module.value;

          return (
            <Col xs={24} sm={12} md={8} key={module.value}>
              <Card
                hoverable
                onClick={() => handleModuleSelect(module.value)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${colors.cardDepth}` : `1px solid ${colors.border}`,
                  backgroundColor: isSelected ? colors.border : colors.cardDepth,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: isSelected 
                    ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(0)',
                }}
                bodyStyle={{ 
                  padding: '28px 20px',
                  background: isSelected ? colors.border : colors.cardDepth,
                  border: 'none',
                  transition: 'all 0.3s'
                }}
                styles={{
                  body: {
                    background: isSelected ? colors.border : colors.cardDepth,
                    padding: '28px 20px',
                    border: 'none'
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.backgroundColor = colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.backgroundColor = colors.cardDepth;
                  }
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: colors.primaryAccent,
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 8px ${colors.primaryAccent}40`
                  }}>
                    <CheckCircleOutlined style={{ color: colors.background, fontSize: 14 }} />
                  </div>
                )}
                <Space 
                  direction="vertical" 
                  size="large" 
                  style={{ width: '100%' }}
                >
                  <div style={{ transition: 'all 0.3s' }}>
                    {getModuleIcon(module.value, isSelected)}
                  </div>
                  <div>
                    <Title level={5} style={{ 
                      margin: 0, 
                      color: colors.textPrimary,
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: 4
                    }}>
                      {module.label}
                    </Title>
                    {isSelected && (
                      <Text style={{ 
                        color: colors.primaryAccent, 
                        fontWeight: 500,
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircleOutlined style={{ fontSize: 12 }} />
                        Currently Selected
                      </Text>
                    )}
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Modal>
  );
};

export default ModuleSelectionModal;


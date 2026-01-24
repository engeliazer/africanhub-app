import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeSwitcher = ({ collapsed = false }) => {
  const { theme, toggleTheme, colors } = useTheme();

  if (collapsed) {
    return (
      <Tooltip title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'} placement="right">
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{
            width: '100%',
            height: '48px',
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.cardDepth;
            e.currentTarget.style.color = colors.primaryAccent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.textPrimary;
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Button
      type="text"
      icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      style={{
        width: '100%',
        height: '48px',
        color: colors.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        padding: '0 16px',
        justifyContent: 'flex-start',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.cardDepth;
        e.currentTarget.style.color = colors.primaryAccent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = colors.textPrimary;
      }}
    >
      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
    </Button>
  );
};

export default ThemeSwitcher;

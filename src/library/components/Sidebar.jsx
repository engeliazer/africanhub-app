import React from 'react';
import { Layout, Menu, Button, Divider, Select } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { menuConfig } from '../../config/menuConfig';
import { selectCurrentRole, selectPermissions } from '../../state/rbacSlice';
import { UserSwitchOutlined } from '@ant-design/icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useTheme } from '../../contexts/ThemeContext';
import {
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  LineChartOutlined,
  UserAddOutlined,
  BookOutlined,
  FolderOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  BellOutlined,
  AppstoreOutlined,
  CheckSquareOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  ToolOutlined,
  SwapOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ 
  collapsed, 
  selectedModule, 
  isInDrawer = false, 
  onSwitchModule,
  currentRole: propCurrentRole,
  roles = [],
  onRoleChange,
  loading = false
}) => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const reduxCurrentRole = useSelector(selectCurrentRole);
  const userPermissions = useSelector(selectPermissions);
  
  // Use prop if provided, otherwise fall back to Redux
  const currentRole = propCurrentRole || reduxCurrentRole;

  // Check if user has required permissions for a menu item
  const hasRequiredPermissions = (permissions, roles) => {
    // First check permissions
    const hasPermission = (!permissions || permissions.length === 0 || 
                          userPermissions.includes('all') || 
                          permissions.some(permission => userPermissions.includes(permission)));
    
    // If there are no role restrictions, or if permissions are satisfied
    if (!roles || roles.length === 0) {
      return hasPermission;
    }
    
    // If there are role restrictions, check if the current role is included
    return hasPermission && roles.includes(currentRole);
  };

  // Filter menu items based on permissions and selected module
  const filterMenuItems = (items) => {
    const filtered = [];
    
    items.forEach(item => {
      // Check for module matching - only show items for the selected module
      if (item.module && item.module !== selectedModule) {
        return; // Skip items from other modules
      }

      const hasPermission = hasRequiredPermissions(item.permissions, item.roles);
      
      // If it's a parent item with children, flatten it - show only children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuItems(item.children);
        // Instead of showing the parent, add the children directly
        if (hasPermission && filteredChildren.length > 0) {
          filtered.push(...filteredChildren);
        }
      } else if (hasPermission) {
        // If no children, add the item itself
        filtered.push(item);
      }
    });
    
    return filtered;
  };

  // Transform menu items to Ant Design format
  // Note: Since filterMenuItems already flattens the structure (shows only children, not parents),
  // we don't need to handle nested children here - all items passed to this function should be leaf nodes
  const transformMenuItem = (item) => {
    const menuItem = {
      key: item.key,
      icon: item.icon ? React.createElement(item.icon) : null,
      label: item.label,
      onClick: item.path ? () => navigate(item.path) : undefined
    };

    // Don't add children - the structure is already flattened in filterMenuItems
    return menuItem;
  };

  // Get filtered and transformed menu items
  const items = React.useMemo(() => {
    return filterMenuItems(menuConfig).map(transformMenuItem);
  }, [selectedModule, currentRole, userPermissions, location.pathname]);

  // Find the selected keys based on current path
  const findSelectedKeys = (path) => {
    const findKeys = (items, keys = []) => {
      for (const item of items) {
        if (item.path === path) {
          keys.push(item.key);
          return keys;
        }
        if (item.children) {
          const childKeys = findKeys(item.children, [...keys, item.key]);
          if (childKeys.length > 0) return childKeys;
        }
      }
      return [];
    };
    return findKeys(menuConfig);
  };

  const selectedKeys = findSelectedKeys(location.pathname);

  // Get default open keys based on role and selected module
  const getDefaultOpenKeys = () => {
    // For STUDENT role, always expand the applications menu
    if (currentRole === 'STUDENT') {
      return ['applications'];
    }
    // For other roles, use the selected keys logic
    return selectedKeys.slice(0, -1);
  };

  // Get module label
  const moduleLabel = menuConfig.find(item => item.module === selectedModule)?.label || 'Module';

  const isStudent = currentRole === 'STUDENT';

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="bg-card shadow-sm flex flex-col"
      width={250}
      collapsedWidth={100}
      style={{
        overflow: 'auto',
        height: isInDrawer ? 'calc(100vh - 55px)' : '100vh',
        position: isInDrawer ? 'relative' : 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        marginTop: isInDrawer ? 0 : '80px',
        background: colors.card,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${colors.border}`
      }}
    >
      {/* Switch Module Button (hidden for STUDENT) */}
      {onSwitchModule && !isStudent && (
        <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderBottom: `1px solid ${colors.border}`, background: colors.card }}>
          <Button
            type="text"
            icon={<SwapOutlined />}
            onClick={onSwitchModule}
            block={!collapsed}
            size={collapsed ? 'small' : 'middle'}
            className="text-textPrimary hover:bg-cardDepth transition-colors"
            style={{
              width: collapsed ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '8px',
              color: colors.textPrimary,
              marginBottom: '8px'
            }}
          >
            {!collapsed && 'Switch Module'}
          </Button>
        </div>
      )}

      {/* Role Selector (hidden for STUDENT) */}
      {onRoleChange && roles.length > 0 && !isStudent && (
        <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderBottom: `1px solid ${colors.border}`, background: colors.card }}>
          {collapsed ? (
            <Button
              type="text"
              icon={<UserSwitchOutlined />}
              size="small"
              className="text-textPrimary hover:bg-cardDepth transition-colors"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textPrimary
              }}
              title={roles.find(r => r.value === currentRole)?.label || currentRole}
            />
          ) : (
            <Select
              value={currentRole}
              onChange={onRoleChange}
              options={roles}
              loading={loading}
              block
              size="middle"
              style={{
                width: '100%'
              }}
              className="role-selector"
              suffixIcon={<UserSwitchOutlined style={{ color: colors.textPrimary }} />}
              popupClassName="custom-select-dropdown"
              notFoundContent={roles.length === 0 ? <span style={{ color: colors.textMuted }}>No roles available</span> : null}
            />
          )}
        </div>
      )}

      {/* Theme Switcher */}
      <div style={{ padding: collapsed ? '8px' : '8px 16px', borderBottom: `1px solid ${colors.border}`, background: colors.card }}>
        <ThemeSwitcher collapsed={collapsed} />
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, overflow: 'auto', background: colors.card }}>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={getDefaultOpenKeys()}
          items={items}
          className="h-full border-r-0"
          style={{
            background: colors.card,
            color: colors.textPrimary,
            fontSize: '14px',
            lineHeight: '1.6',
            borderRight: 'none'
          }}
          styles={{
            root: {
              background: colors.card,
            },
            item: {
              background: 'transparent',
              color: colors.textPrimary,
            },
            subMenu: {
              background: 'transparent',
            },
            itemSelected: {
              background: colors.border,
              color: colors.textPrimary,
            },
            itemHover: {
              background: colors.cardDepth,
              color: colors.textPrimary,
            },
            subMenuTitle: {
              color: colors.textPrimary,
            },
          }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;

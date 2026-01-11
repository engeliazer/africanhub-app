import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { menuConfig } from '../../config/menuConfig';
import { selectCurrentRole, selectPermissions } from '../../state/rbacSlice';
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
  ToolOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ collapsed, selectedModule, isInDrawer = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = useSelector(selectCurrentRole);
  const userPermissions = useSelector(selectPermissions);

  // Add console logging to debug
  console.log("Sidebar rendering with selectedModule:", selectedModule);

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
    return items.filter(item => {
      // More explicit check for module matching
      if (item.module) {
        console.log(`Checking item ${item.key} with module ${item.module} against selected ${selectedModule}`);
        if (item.module !== selectedModule) {
          return false;
        }
      }

      const hasPermission = hasRequiredPermissions(item.permissions, item.roles);
      
      // If it's a parent item with children, check children permissions too
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children);
        // Show parent only if it has visible children
        return hasPermission && filteredChildren.length > 0;
      }
      
      return hasPermission;
    });
  };

  // Transform menu items to Ant Design format
  const transformMenuItem = (item) => {
    const menuItem = {
      key: item.key,
      icon: item.icon ? React.createElement(item.icon) : null,
      label: item.label,
      onClick: item.path ? () => navigate(item.path) : undefined
    };

    if (item.children) {
      menuItem.children = filterMenuItems(item.children).map(transformMenuItem);
    }

    return menuItem;
  };

  // Get filtered and transformed menu items
  const items = React.useMemo(() => {
    console.log("Recalculating sidebar items for module:", selectedModule);
    return filterMenuItems(menuConfig).map(transformMenuItem);
  }, [selectedModule, currentRole, userPermissions, location.pathname]);
  
  // Add debug logging for filtered items
  console.log("Filtered sidebar items:", items.map(item => ({
    key: item.key,
    label: item.label,
    module: menuConfig.find(m => m.key === item.key)?.module || 'unknown'
  })));

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

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="bg-white shadow-sm"
      width={250}
      collapsedWidth={100}
      style={{
        overflow: 'auto',
        height: isInDrawer ? 'calc(100vh - 55px)' : '100vh',
        position: isInDrawer ? 'relative' : 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        marginTop: isInDrawer ? 0 : '120px',
        background: 'white'
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={items}
        className="h-full border-r-0"
        style={{
          fontSize: '14px',
          lineHeight: '1.8'
        }}
      />
    </Sider>
  );
};

export default Sidebar;

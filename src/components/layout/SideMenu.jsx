import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { menuConfig } from '../../config/menuConfig';
import { selectPermissions } from '../../state/rbacSlice';
import { useTheme } from '../../contexts/ThemeContext';

const SideMenu = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const userPermissions = useSelector(selectPermissions);

  // Check if user has required permissions for a menu item
  const hasRequiredPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('all')) return true;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Filter menu items based on permissions
  const filterMenuItems = (items) => {
    return items.filter(item => {
      const hasPermission = hasRequiredPermissions(item.permissions);
      
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
  const items = filterMenuItems(menuConfig).map(transformMenuItem);

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

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      defaultOpenKeys={selectedKeys.slice(0, -1)}
      items={items}
      className="h-full border-r-0"
      style={{
        background: colors.card,
        color: colors.textPrimary,
        fontSize: '14px',
        lineHeight: '1.6',
      }}
    />
  );
};

export default SideMenu;

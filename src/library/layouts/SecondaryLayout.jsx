import { Logo } from "../atoms";
import { Fragment, useState, useEffect, useMemo } from "react";
import { RenderBasedOnAuthState, AvatarWrapper, ProfileDrawer, Sidebar } from "../components";
import { Layout, Button, Card, Select, message, Tooltip, Drawer, Dropdown, Space, Badge } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, FormOutlined, UserOutlined, LogoutOutlined, UserSwitchOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "../molecules/index.js";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentRole, selectCurrentRole, selectPermissions, selectAssignedRoles } from "../../state/rbacSlice";
import { menuConfig } from "../../config/menuConfig";
import { SECURITY_CONFIG } from "../../config";
import { useTheme } from "../../contexts/ThemeContext";
import Chat from "../../components/Chat";
import AdminChat from '../../components/AdminChat';
import authService from '../../services/auth';
import { onClear } from "../../state/accessSlice";
import useIdleTimeout from "../../hooks/useIdleTimeout";
import ModuleSelectionModal from "../../components/ModuleSelectionModal";

const SecondaryLayout = () => {
  const { colors } = useTheme();
  const { Header, Content } = Layout;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = useSelector(selectCurrentRole);
  const userPermissions = useSelector(selectPermissions);
  const assignedRoles = useSelector(selectAssignedRoles);
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Get selected module from localStorage or default to "user"
  const getInitialModule = () => {
    const stored = localStorage.getItem('selectedModule');
    if (stored) return stored;
    return 'user'; // Default to User Profile module
  };
  
  const [selectedModule, setSelectedModule] = useState(getInitialModule());
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check if this is first login (no module selected yet)
  useEffect(() => {
    if (currentRole === 'STUDENT') {
      setSelectedModule('applications');
      localStorage.setItem('selectedModule', 'applications');
      return;
    }
    const storedModule = localStorage.getItem('selectedModule');
    const hasShownModal = localStorage.getItem('moduleSelectionShown');
    
    // Show modal if no module is selected and modal hasn't been shown, or if flag was cleared (first login)
    if (!storedModule && !hasShownModal) {
      // Set default to "user" (User Profile) module
      setSelectedModule('user');
      localStorage.setItem('selectedModule', 'user');
      setModuleModalOpen(true);
      localStorage.setItem('moduleSelectionShown', 'true');
    }
  }, [currentRole]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileDrawerOpen]);

  const isAdminOrSupport = currentRole === 'SYSADMIN' || currentRole === 'SUPPORT';
  const isStudent = currentRole === 'STUDENT';

  // Initialize idle timeout for security
  useIdleTimeout(SECURITY_CONFIG.idleTimeout);

  // STUDENT: lock to Applications module only; no module/role switching
  useEffect(() => {
    if (!isStudent) return;
    setSelectedModule('applications');
    localStorage.setItem('selectedModule', 'applications');
    setModuleModalOpen(false);
  }, [isStudent]);

  // Check if user has any permissions for a menu item
  const hasRequiredPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('all')) return true;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Get available modules based on user permissions
  const availableModules = useMemo(() => {
    const hasAccessibleItems = (items) => {
      return items.some(item => {
        const hasRole = !item.roles || item.roles.length === 0 || item.roles.includes(currentRole);
        const hasPermission = hasRequiredPermissions(item.permissions);
        
        if (item.module === 'applications' && 
            ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
          return true;
        }
        
        if (item.module === 'accounting' && 
            ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'].includes(currentRole)) {
          return true;
        }
        
        if (item.children) {
          return (hasPermission && hasRole) && hasAccessibleItems(item.children);
        }
        
        return hasPermission && hasRole;
      });
    };

    // Always include "user" (User Profile) module as it's accessible to all users
    const accessibleModules = [...new Set(menuConfig.map(item => item.module))]
      .filter(module => {
        if (!module) return false;
        
        // User module is always accessible
        if (module === 'user') return true;
        
        if (module === 'applications' && ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
          return true;
        }
        
        if (module === 'accounting' && ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'].includes(currentRole)) {
          return true;
        }
        
        const moduleItems = menuConfig.filter(item => item.module === module);
        return hasAccessibleItems(moduleItems);
      })
      .map(module => {
        const menuItem = menuConfig.find(item => item.module === module);
        return {
          value: module,
          label: menuItem ? menuItem.label : (module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, ' '))
        };
      })
      .filter(module => module.label);

    // Ensure "user" module is included and placed first
    if (!accessibleModules.some(module => module.value === 'user')) {
      accessibleModules.unshift({
        value: 'user',
        label: 'My Profile'
      });
    }

    if (!accessibleModules.some(module => module.value === 'applications') && 
        ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
      accessibleModules.push({
        value: 'applications',
        label: 'Applications'
      });
    }
    
    if (!accessibleModules.some(module => module.value === 'accounting') && 
        ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'].includes(currentRole)) {
      accessibleModules.push({
        value: 'accounting',
        label: 'Accounting'
      });
    }

    // Sort modules but keep "user" first
    const userModule = accessibleModules.find(m => m.value === 'user');
    const otherModules = accessibleModules.filter(m => m.value !== 'user').sort((a, b) => a.label.localeCompare(b.label));
    
    return userModule ? [userModule, ...otherModules] : otherModules;
  }, [userPermissions, currentRole]);

  // Format roles for dropdown
  const roles = useMemo(() => {
    return assignedRoles.map(role => ({
      value: role.code,
      label: role.name
    }));
  }, [assignedRoles]);

  // Initialize selectedModule based on current path or default
  useEffect(() => {
    if (currentRole === 'STUDENT') {
      setSelectedModule('applications');
      localStorage.setItem('selectedModule', 'applications');
      return;
    }
    const storedModule = localStorage.getItem('selectedModule');
    if (storedModule && !moduleModalOpen) {
      setSelectedModule(storedModule);
      return;
    }
    
    // If no stored module, try to detect from path
    const path = window.location.pathname;
    let moduleFromPath = "user"; // Default to user module
    
    for (const item of menuConfig) {
      if (item.children) {
        const matchingChild = item.children.find(child => 
          child.path === path || path.startsWith(child.path + '/')
        );
        if (matchingChild) {
          moduleFromPath = item.module || "user";
          break;
        }
      }
    }
    
    if (!storedModule) {
      setSelectedModule(moduleFromPath);
      localStorage.setItem('selectedModule', moduleFromPath);
    }
  }, [currentRole, location.pathname, navigate, moduleModalOpen]);

  const handleModuleChange = (newModule) => {
    setSelectedModule(newModule);
    localStorage.setItem('selectedModule', newModule);
    setModuleModalOpen(false);
    
    // Navigate to first accessible path in the selected module
    const moduleItems = menuConfig.filter(item => item.module === newModule);
    if (moduleItems.length > 0) {
      const findFirstAccessiblePath = (items) => {
        for (const item of items) {
          const hasRole = !item.roles || item.roles.length === 0 || item.roles.includes(currentRole);
          const hasPermission = hasRequiredPermissions(item.permissions);
          
          if (hasPermission && hasRole) {
            if (item.path) return item.path;
            if (item.children) {
              const childPath = findFirstAccessiblePath(item.children);
              if (childPath) return childPath;
            }
          }
        }
        return null;
      };
      
      const firstPath = findFirstAccessiblePath(moduleItems);
      if (firstPath) {
        navigate(firstPath);
      } else {
        // If no accessible path found, navigate to profile
        navigate('/user/profile');
      }
    } else {
      // If no items in module, navigate to profile
      navigate('/user/profile');
    }
  };

  const handleOpenModuleModal = () => {
    if (currentRole === 'STUDENT') return;
    setModuleModalOpen(true);
  };

  const handleRoleChange = (newRole) => {
    dispatch(setCurrentRole(newRole));
    const roleName = assignedRoles.find(r => r.code === newRole)?.name || newRole;
    message.success(`Switched to ${roleName} role`);
    navigate('/user/profile');
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const onLogout = async () => {
    try {
      await authService.logout();
      dispatch(onClear());
      localStorage.removeItem('user_info');
      // Clear module selection information
      localStorage.removeItem('selectedModule');
      localStorage.removeItem('moduleSelectionShown');
      navigate('/login');
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(onClear());
      localStorage.removeItem('user_info');
      // Clear module selection information even on error
      localStorage.removeItem('selectedModule');
      localStorage.removeItem('moduleSelectionShown');
      navigate('/login');
      message.error('Error during logout, but you have been logged out locally');
    }
  };
  
  const isOnProfilePage = location.pathname === '/user/profile';
  
  const userMenuItems = [
    {
      key: '1',
      label: 'My Profile',
      icon: <UserOutlined />,
      onClick: isOnProfilePage ? undefined : () => navigate('/user/profile'),
    },
    {
      key: '2',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: onLogout,
      danger: true,
    },
  ];

  const filteredUserMenuItems = isOnProfilePage 
    ? userMenuItems.filter(item => item.key !== '1') 
    : userMenuItems;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Modern Top Navigation Bar */}
      <Header 
        className="bg-card border-b border-border shadow-lg px-4 md:px-6 flex items-center justify-between z-50"
        style={{ 
          padding: '0 24px',
          background: colors.card,
          borderBottom: `1px solid ${colors.border}`,
          height: '80px',
          minHeight: '80px',
          lineHeight: '80px'
        }}
      >
        {/* Left Section: Logo, Menu Toggle, Brand */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
            className="transition-colors"
            style={{ 
              fontSize: '18px',
              width: 40,
              height: 40,
              color: colors.textPrimary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.cardDepth;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          />
          
          <div className="flex items-center space-x-3 min-w-0" style={{ height: '100%' }}>
            <div style={{ height: '72px', display: 'flex', alignItems: 'center' }}>
              <Logo />
            </div>
            {!isMobile && !collapsed && (
              <div className="flex flex-col min-w-0">
                <span 
                  className="text-xl font-bold leading-tight truncate max-w-[300px]"
                  style={{ color: colors.textPrimary }}
                >
                  THE AFRICAN HUB
                </span>
                <span 
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Building Accounting Skills for the Real World.
                </span>
              </div>
            )}
            {!isMobile && collapsed && (
              <div className="flex flex-col items-center min-w-0">
                <span 
                  className="text-base font-bold leading-tight"
                  style={{ color: colors.textPrimary }}
                >
                  TAH
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Module Selector (hidden for STUDENT) */}
        {!isStudent && (
          <div className="flex items-center space-x-3 flex-1 justify-center hidden lg:flex">
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={handleOpenModuleModal}
              className="transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.textPrimary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.cardDepth;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {availableModules.find(m => m.value === selectedModule)?.label || 'Select Module'}
            </Button>
          </div>
        )}

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          {/* Quick Access Button (hidden for STUDENT - locked to Applications) */}
          {!isMobile && !isStudent && (
            <Tooltip title="Quick Access: Applications">
              <Button 
                type="text" 
                icon={<FormOutlined />} 
                onClick={() => {
                  setSelectedModule("applications");
                  navigate('/applications/my-applications');
                }}
                className="transition-colors"
                style={{
                  color: selectedModule === 'applications' ? colors.primaryAccent : colors.textPrimary,
                  backgroundColor: selectedModule === 'applications' ? colors.cardDepth : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedModule !== 'applications') {
                    e.currentTarget.style.backgroundColor = colors.cardDepth;
                    e.currentTarget.style.color = colors.primaryAccent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModule !== 'applications') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.textPrimary;
                  }
                }}
              />
            </Tooltip>
          )}

          {/* Mobile Module Selector (hidden for STUDENT) */}
          {isMobile && !isStudent && (
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={handleOpenModuleModal}
              size="small"
              className="transition-colors"
              style={{ color: colors.textPrimary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.cardDepth;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          )}

          {/* User Name Display */}
          <div 
            className="hidden md:flex items-center px-3 py-1.5 rounded-lg"
            style={{
              background: colors.cardDepth,
              border: `1px solid ${colors.border}`
            }}
          >
            <span 
              className="text-sm font-medium truncate max-w-[200px]"
              style={{ color: colors.textPrimary }}
            >
              {userInfo.first_name} {userInfo.middle_name} {userInfo.last_name}
            </span>
          </div>

          {/* Avatar & User Menu */}
          <RenderBasedOnAuthState 
            authState={false} 
            compNoAuth={<></>} 
            compAuth={<AvatarWrapper />} 
          />
          
          <Dropdown 
            menu={{ items: filteredUserMenuItems }} 
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<UserOutlined />}
              className="transition-colors"
              style={{ 
                width: 40, 
                height: 40,
                color: colors.textPrimary
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
          </Dropdown>
        </div>
      </Header>

      {/* Main Layout with Sidebar */}
      <Layout className="flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            collapsed={collapsed} 
            selectedModule={selectedModule} 
            onSwitchModule={handleOpenModuleModal}
            currentRole={currentRole}
            roles={roles}
            onRoleChange={handleRoleChange}
            loading={loading}
            key={`sidebar-${selectedModule}`} 
          />
        )}

        {/* Mobile Drawer Sidebar */}
        <Drawer
          title={
            <div className="flex items-center space-x-2" style={{ height: '100%' }}>
              <div style={{ height: '72px', display: 'flex', alignItems: 'center' }}>
                <Logo />
              </div>
              <span 
                className="font-semibold"
                style={{ color: colors.textPrimary }}
              >
                Menu
              </span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={280}
          styles={{ 
            body: { padding: 0, background: colors.card },
            header: { background: colors.card, borderBottom: `1px solid ${colors.border}` }
          }}
        >
          <Sidebar 
            collapsed={false}
            selectedModule={selectedModule} 
            isInDrawer={true}
            onSwitchModule={handleOpenModuleModal}
            currentRole={currentRole}
            roles={roles}
            onRoleChange={handleRoleChange}
            loading={loading}
            key={`sidebar-mobile-${selectedModule}`}
          />
        </Drawer>

        {/* Main Content Area */}
        <Layout 
          style={{ 
            marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
            transition: 'margin-left 0.2s',
            background: 'transparent'
          }} 
          className="flex flex-col"
        >
          {/* Breadcrumb Bar */}
          <div 
            className="px-4 md:px-6 py-3"
            style={{
              background: colors.card,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Breadcrumb />
          </div>

          {/* Content */}
          <Content 
            className="flex-1 overflow-auto p-4 md:p-6"
            style={{ background: colors.background }}
          >
            <div className="max-w-full">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Chat Component */}
      {isAdminOrSupport ? <AdminChat /> : <Chat />}
      
      <ProfileDrawer />
      
      {/* Module Selection Modal */}
      <ModuleSelectionModal
        open={moduleModalOpen}
        onSelect={handleModuleChange}
        availableModules={availableModules}
        selectedModule={selectedModule}
      />
    </div>
  );
};

export default SecondaryLayout;

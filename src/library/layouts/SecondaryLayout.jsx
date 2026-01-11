import { Logo, RedBar, YellowBar } from "../atoms";
import { Fragment, useState, useEffect, useMemo } from "react";
import BrandName from "../atoms/BrandName.jsx";
import { RenderBasedOnAuthState, AvatarWrapper, SupportButton, ProfileDrawer, Sidebar } from "../components";
import { Layout, Button, Card, Divider, Select, message, Tooltip, Drawer } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, FormOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "../molecules/index.js";
import { UserOutlined } from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import AuthenticatorLayout from "./Authenticator.jsx";
import { useDispatch, useSelector, useStore } from "react-redux";
import { setCurrentRole, selectCurrentRole, selectPermissions, selectAssignedRoles, setAssignedRoles } from "../../state/rbacSlice";
import { menuConfig } from "../../config/menuConfig";
import { rolePermissions } from "../../config/roleConfig";
import { SECURITY_CONFIG } from "../../config";
import Chat from "../../components/Chat";
import AdminChat from '../../components/AdminChat';
import authService from '../../services/auth';
import { onClear } from "../../state/accessSlice";
import useIdleTimeout from "../../hooks/useIdleTimeout";

const SecondaryLayout = () => {
  const { Header } = Layout;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const currentRole = useSelector(selectCurrentRole);
  const userPermissions = useSelector(selectPermissions);
  const assignedRoles = useSelector(selectAssignedRoles);
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedModule, setSelectedModule] = useState("applications");
  const [loading, setLoading] = useState(false);

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

  // Initialize idle timeout for security
  useIdleTimeout(SECURITY_CONFIG.idleTimeout);

  // Check if user has any permissions for a menu item
  const hasRequiredPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('all')) return true;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Get available modules based on user permissions
  const availableModules = useMemo(() => {
    // Helper function to check if any menu item in a module is accessible
    const hasAccessibleItems = (items) => {
      return items.some(item => {
        // Check if the item has roles and if the current role is allowed
        const hasRole = !item.roles || item.roles.length === 0 || item.roles.includes(currentRole);
        
        const hasPermission = hasRequiredPermissions(item.permissions);
        
        // For applications module, we always want to include it for certain roles
        if (item.module === 'applications' && 
            ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
          return true;
        }
        
        // For accounting module, we want to include it for certain roles
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

    // Filter modules based on permissions
    const accessibleModules = [...new Set(menuConfig.map(item => item.module))]
      .filter(module => {
        if (!module) return false; // Skip items without a module
        
        // Special case for applications module
        if (module === 'applications' && ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
          return true;
        }
        
        // Special case for accounting module
        if (module === 'accounting' && ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'].includes(currentRole)) {
          return true;
        }
        
        const moduleItems = menuConfig.filter(item => item.module === module);
        return hasAccessibleItems(moduleItems);
      })
      .map(module => {
        // Get the menu item for this module to access its label
        const menuItem = menuConfig.find(item => item.module === module);
        return {
          value: module,
          label: menuItem ? menuItem.label : (module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, ' '))
        };
      })
      .filter(module => module.label) // Remove any empty labels
      .sort((a, b) => a.label.localeCompare(b.label));

    // Log the available modules to check if applications is included
    console.log("Available modules before adding applications:", accessibleModules);
    
    // Ensure Applications module is always included for all users
    if (!accessibleModules.some(module => module.value === 'applications') && 
        ['FACILITATOR', 'SYSADMIN', 'STUDENT'].includes(currentRole)) {
      accessibleModules.push({
        value: 'applications',
        label: 'Applications'
      });
      console.log("Applications module added to available modules");
    }
    
    // Ensure Accounting module is always included for accounting roles
    if (!accessibleModules.some(module => module.value === 'accounting') && 
        ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'].includes(currentRole)) {
      accessibleModules.push({
        value: 'accounting',
        label: 'Accounting'
      });
      console.log("Accounting module added to available modules");
    }

    return accessibleModules;
  }, [userPermissions, currentRole]);

  // Format roles for dropdown
  const roles = useMemo(() => {
    return assignedRoles.map(role => ({
      value: role.code,
      label: role.name
    }));
  }, [assignedRoles]);

  // Initialize selectedModule only once when component mounts
  useEffect(() => {
    // Only set default module on initial component mount
    console.log("Initializing selected module");
    
    // For STUDENT role, always set module to applications
    if (currentRole === 'STUDENT') {
      setSelectedModule("applications");
      // Only navigate to profile on initial load (when path is root)
      if (location.pathname === '/') {
        navigate('/user/profile');
      }
      return;
    }
    
    // For other roles, determine module from path
    const path = window.location.pathname;
    
    // Determine module from path
    let moduleFromPath = "applications"; // Default
    for (const item of menuConfig) {
      if (item.module && (item.path === path || path.startsWith(item.path + '/'))) {
        moduleFromPath = item.module;
        break;
      } else if (item.children) {
        const matchingChild = item.children.find(child => 
          child.path === path || path.startsWith(child.path + '/')
        );
        if (matchingChild) {
          moduleFromPath = item.module;
          break;
        }
      }
    }
    
    setSelectedModule(moduleFromPath);
  }, [currentRole, location.pathname, navigate]);

  const handleModuleChange = (newModule) => {
    // For STUDENT role, prevent module change
    if (currentRole === 'STUDENT') {
      message.info('Students can only access the Applications module');
      return;
    }
    
    console.log(`Module changed to: ${newModule}`);
    setSelectedModule(newModule);
    
    // Navigate to the first page of the selected module
    const moduleItems = menuConfig.filter(item => item.module === newModule);
    if (moduleItems.length > 0) {
      // Find first accessible item in the module
      const findFirstAccessiblePath = (items) => {
        for (const item of items) {
          if (hasRequiredPermissions(item.permissions)) {
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
      }
    }
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
      // Clear Redux state
      dispatch(onClear());
      // Clear any other local storage items
      localStorage.removeItem('user_info');
      // Redirect to login page
      navigate('/login');
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we should still clear local data and redirect
      dispatch(onClear());
      localStorage.removeItem('user_info');
      navigate('/login');
      message.error('Error during logout, but you have been logged out locally');
    }
  };
  
  // Check if user is already on the profile page
  const isOnProfilePage = location.pathname === '/user/profile';
  
  const items = [
    {
      key: '1',
      label: 'My Profile',
      onClick: isOnProfilePage ? undefined : () => navigate('/user/profile'),
    },
    {
      key: '2',
      label: 'Logout',
      onClick: onLogout,
    },
  ];

  // Filter out the profile option if already on profile page
  const filteredItems = isOnProfilePage 
    ? items.filter(item => item.key !== '1') 
    : items;

  return (
    <div className={"relative h-screen max-h-screen overflow-x-hidden bg-mainWhite"}>
      <nav className="sticky top-0 left-0 right-0 z-50 flex-none flex-wrap items-center justify-between transition duration-500 dark:shadow-none dark:bg-transparent overflow-hidden">
        <RedBar className="bg-brandRed">
          <Fragment>
            <div className="relative z-50 flex items-center space-x-3 justify-between">
              <Logo />
              <BrandName 
                brand={isMobile ? "OCRC" : "ONLINE CPA REVIEW CLASSES MANAGEMENT SYSTEM"} 
                companyName="OCRC" 
                className="text-brandWhite hidden md:block" 
              />
            </div>
            <div className="flex justify-between items-center space-x-2">
              <RenderBasedOnAuthState authState={false} compNoAuth={<></>} compAuth={<AvatarWrapper />} />
            </div>
            <div className="flex items-center">
              {/* Quick access button for Applications module */}
              <Tooltip title="Applications">
                <Button 
                  type="text" 
                  icon={<FormOutlined />} 
                  onClick={() => {
                    console.log("Quick access button clicked, setting module to applications");
                    setSelectedModule("applications");
                    navigate('/applications/my-applications');
                  }}
                  className={`text-brandWhite mr-2 ${selectedModule === 'applications' ? 'border border-brandWhite' : ''}`}
                />
              </Tooltip>
              <Dropdown menu={{ items: filteredItems }} placement="bottomRight">
                <Space className="cursor-pointer">
                  <UserOutlined className="text-[25px]" />
                </Space>
              </Dropdown>
            </div>
          </Fragment>
        </RedBar>
        <YellowBar className="bg-brandGreen border-t-4 border-brandRed overflow-x-auto">
          <Fragment>
            <div className="flex justify-right text-base md:text-2xl text-brandWhite ml-1 md:ml-3 px-1 md:px-2 font-bold">
              {currentRole === 'STUDENT' ? (
                <div className="flex items-center">
                  <span className="text-brandWhite mr-2 md:mr-4 text-sm md:text-base truncate">
                    {userInfo.first_name} {userInfo.middle_name} {userInfo.last_name}
                  </span>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedModule}
                    onChange={handleModuleChange}
                    options={availableModules}
                    className="w-[120px] md:w-[200px] font-semibold text-brandWhite hover:text-brandYellow transition-colors"
                    dropdownStyle={{ zIndex: 1000 }}
                    popupClassName="custom-select-dropdown"
                  />
                  <Select
                    value={currentRole}
                    onChange={handleRoleChange}
                    options={roles}
                    loading={loading}
                    className="w-[120px] md:w-[200px] font-extrabold text-brandWhite hover:text-brandYellow transition-colors mr-2 md:mr-4 ml-1 md:ml-2"
                    dropdownStyle={{ zIndex: 1000 }}
                    popupClassName="custom-select-dropdown"
                    notFoundContent={roles.length === 0 ? "No roles available" : null}
                  />
                </>
              )}
            </div>
          </Fragment>
        </YellowBar>
        <ProfileDrawer />
      </nav>
      <Layout hasSider
        className={"bg-transparent h-screen w-full"}
        style={{
          height: "100vh",
          padding: 0,
        }} 
      >
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <Sidebar 
            collapsed={collapsed} 
            selectedModule={selectedModule} 
            key={`sidebar-${selectedModule}`} 
          />
        )}

        {/* Mobile Drawer Sidebar */}
        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={250}
          styles={{ body: { padding: 0 } }}
        >
          <Sidebar 
            collapsed={false}
            selectedModule={selectedModule} 
            isInDrawer={true}
            key={`sidebar-mobile-${selectedModule}`}
          />
        </Drawer>

        <Layout 
          style={{ 
            marginInlineStart: isMobile ? 0 : (collapsed ? 100 : 250),
            backgroundColor: "transparent",
            transition: "margin 0.2s"
          }} 
          className={"pr-2"}
        >
          <Header
            className={"flex items-center space-x-2 bg-mainWhite sticky top-0 z-40"}
            style={{ padding: 0 }}>
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 40,
                height: 40, 
              }}
              className={"bg-white mt-[-8px] shadow-sm"}
            />
            <Breadcrumb />
          </Header>
          <Card
            type={"inner"}
            size={"small"}
            className={isMobile ? "mx-2" : "ml-8"}
          >
            <Outlet />
          </Card>
        </Layout>
      </Layout>

      {/* Chat Component */}
      {isAdminOrSupport ? <AdminChat /> : <Chat />}
    </div>
  );
};

export default SecondaryLayout;

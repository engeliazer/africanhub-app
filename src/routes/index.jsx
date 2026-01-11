import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SecondaryLayout from '../layouts/SecondaryLayout';

// Lazy load components
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Profile = lazy(() => import('../pages/user/Profile'));
const UsersList = lazy(() => import('../pages/users/UsersList'));
const RolesList = lazy(() => import('../pages/settings/RolesList'));
const CoursesList = lazy(() => import('../pages/courses/CoursesList'));

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'courses',
        children: [
          {
            path: 'list',
            element: <CoursesList />,
          }
        ],
      },
      {
        path: 'facilitation',
        children: [
          {
            path: 'seasons',
            element: <div>Seasons</div>,
          },
          // ... other facilitation routes
        ],
      },
      // ... other routes
    ],
  },
  // ... other route configurations
];

export default routes; 
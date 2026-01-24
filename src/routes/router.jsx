import { PrimaryLayout, SecondaryLayout, AuthenticatorLayout } from "../library/layouts";
import { Outlet, Navigate } from "react-router-dom";
import DashboardPage from "../pages/dashboard";
import LoginPage from "../pages/auth/LoginPage";
import Register from "../pages/auth/Register";
import ChangePassword from "../pages/auth/ChangePassword";
import EmployeeList from "../pages/employees/EmployeeList";
import EmployeeProfile from "../pages/employees/EmployeeProfile";
import AddEmployee from "../pages/employees/AddEmployee";
import EditEmployee from "../pages/employees/EditEmployee";
import Profile from "../pages/user/Profile";
import UserRoles from '../pages/settings/UserRoles';
import CompanySettings from '../pages/settings/CompanySettings';
import UserSettings from '../pages/settings/UserSettings';
import UsersList from '../pages/users/UsersList';
import SubjectsList from '../pages/subjects/SubjectsList';
import TopicsList from '../pages/subjects/TopicsList';
import SubtopicsList from '../pages/subjects/SubtopicsList';
import ProtectedRoute from "../components/ProtectedRoute";
import StudyMaterials from '../pages/studies/StudyMaterials';
import InstructorsList from '../pages/instructors/InstructorsList';
import TestimonialsList from '../pages/testimonials/TestimonialsList';
import AdminTestimonialsList from '../pages/testimonials/AdminTestimonialsList';
import ChatManagement from '../pages/support/ChatManagement';
import User from '../pages/support/User';
import PendingPayments from '../pages/accounting/PendingPayments';
import BankReconciliation from '../components/accounting/BankReconciliation';
import AccountingDashboard from '../pages/accounting/AccountingDashboard';
import AccountingReport from '../components/accounting/AccountingReport';

// Import new application module pages
import MyApplications from "../pages/applications/MyApplications";
import ApplyCourse from "../pages/applications/ApplyCourse";
import CourseStructurePage from "../pages/applications/CourseStructure";
import { ClassSession } from "../pages/studies";
import VdoCipherVideoPlayer from "../pages/studies/VdoCipherVideoPlayer";

export const router = [
  {
    path: "/",
    element: (
      <AuthenticatorLayout>
        <Outlet />
      </AuthenticatorLayout>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />
      }
    ],
    errorElement: <div>Page Not Found</div>
  },
  {
    path: "login",
    element: (
      <AuthenticatorLayout>
        <Outlet />
      </AuthenticatorLayout>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />
      }
    ]
  },
  {
    path: "register",
    element: (
      <AuthenticatorLayout>
        <Outlet />
      </AuthenticatorLayout>
    ),
    children: [
      {
        index: true,
        element: <Register />
      }
    ]
  },
  {
    path: "change-password",
    element: <ChangePassword />
  },
  {
    path: "core",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "employees",
        element: <EmployeeList />
      },
      {
        path: "employees/:id",
        element: <EmployeeProfile />
      }
    ]
  },
  {
    path: "user",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "profile",
        element: <Profile />
      }
    ]
  },
  {
    path: "settings",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "company",
        element: <CompanySettings />
      },
      {
        path: "users",
        element: <UserSettings />
      },
      {
        path: "user-roles",
        element: <UserRoles />
      }
    ]
  },
  {
    path: "users",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <UsersList />
      }
    ]
  },
  {
    path: "subjects",
    element: (
      <ProtectedRoute permissions={['facilitation.view']}>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "list",
        element: <SubjectsList />
      },
      {
        path: "topics",
        element: <TopicsList />
      },
      {
        path: "subtopics",
        element: <SubtopicsList />
      }
    ]
  },
  {
    path: "study-materials",
    element: (
      <ProtectedRoute permissions={['facilitation.view']}>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudyMaterials />
      }
    ]
  },
      {
        path: "instructors",
        element: (
          <ProtectedRoute permissions={['facilitation.view']}>
            <SecondaryLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "list",
            element: <InstructorsList />
          }
        ]
      },
      {
        path: "facilitation",
        element: (
          <ProtectedRoute permissions={['facilitation.view']}>
            <SecondaryLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "testimonials",
            element: <AdminTestimonialsList />
          }
        ]
      },
  {
    path: "applications",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <MyApplications />
      },
      {
        path: "my-applications",
        element: <MyApplications />
      },
      {
        path: "apply",
        element: <ApplyCourse />
      },
      {
        path: "structure",
        element: <CourseStructurePage />
      },
      {
        path: "study",
        element: <ClassSession />
      },
      {
        path: "study/:subjectId",
        element: <ClassSession />
      },
      {
        path: "testimonials",
        element: <TestimonialsList />
      }
    ]
  },
  {
    path: "review-class",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/applications" replace />
      },
      {
        path: ":materialId",
        element: <VdoCipherVideoPlayer />
      }
    ]
  },
  {
    path: "support",
    element: (
      <ProtectedRoute>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "company",
        element: <CompanySettings />
      },
      {
        path: "users",
        element: <User />
      },
      {
        path: "user-roles",
        element: <UserRoles />
      },
      {
        path: "chat",
        element: <ChatManagement />
      }
    ]
  },
  {
    path: "accounting",
    element: (
      <ProtectedRoute permissions={['VIEW_ACCOUNTING']}>
        <SecondaryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AccountingDashboard />
      },
      {
        path: "pending-payments",
        element: <PendingPayments />
      },
      {
        path: "reconciliation",
        element: <BankReconciliation />
      },
      {
        path: "reports",
        element: <AccountingReport />
      }
    ]
  },
  {
    path: "*",
    element: <div>Page Not Found</div>
  }
];
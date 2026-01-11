import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  ProfileOutlined,
  BarChartOutlined,
  DollarOutlined,
  BookOutlined,
  FileProtectOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  ReadOutlined,
  FormOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  CalendarOutlined,
  MessageOutlined,
  AccountBookOutlined,
  ClockCircleOutlined,
  ReconciliationOutlined,
  StarOutlined
} from '@ant-design/icons';

// Export permissions mapping
export const permissionModules = {
  support: ['settings.manage', 'roles.manage'],
  profile: ['profile.view'],
  facilitation: ['facilitation.view', 'facilitation.manage'],
  studyMaterials: {
    view: 'study-materials.view',
    manage: 'study-materials.manage'
  },
  applications: ['applications.view'],
  accounting: ['accounting.view']
};

export const menuConfig = [
  {
    key: 'user',
    label: 'My Profile',
    icon: UserOutlined,
    module: 'user',
    permissions: [], // No permissions required - accessible to all
    children: [
      {
        key: 'profile',
        label: 'Profile',
        path: '/user/profile',
        icon: ProfileOutlined,
        permissions: [] // No permissions required - accessible to all
      },
      {
        key: 'users-list',
        label: 'Users List',
        path: '/users',
        icon: TeamOutlined,
        permissions: ['settings.manage', 'roles.manage'] // Same permissions as user roles management
      }
    ]
  },
  {
    key: 'facilitation',
    label: 'Facilitation',
    icon: BookOutlined,
    module: 'facilitation',
    permissions: ['facilitation.view'],
    children: [
      {
        key: 'courses',
        label: 'Courses',
        path: '/courses/list',
        permissions: ['facilitation.courses.view'],
      },
      {
        key: 'subjects',
        label: 'Subjects',
        path: '/subjects/list',
        permissions: ['facilitation.view']
      },
      {
        key: 'topics',
        label: 'Topics',
        path: '/subjects/topics',
        permissions: ['facilitation.view']
      },
      {
        key: 'subtopics',
        label: 'Subtopics',
        path: '/subjects/subtopics',
        permissions: ['facilitation.view']
      },
      {
        key: 'testimonials',
        label: 'Manage Testimonials',
        path: '/facilitation/testimonials',
        icon: StarOutlined,
        permissions: ['facilitation.view']
      }
    ]
  },
  {
    key: 'class-seasons',
    label: 'Class Seasons',
    icon: CalendarOutlined,
    module: 'facilitation',
    permissions: ['facilitation.view'],
    children: [
      {
        key: 'seasons',
        label: 'Seasons',
        path: '/seasons',
        permissions: ['facilitation.view']
      },
      {
        key: 'season-subjects',
        label: 'Season Subjects',
        path: '/seasons/subjects',
        permissions: ['facilitation.view']
      },
      {
        key: 'season-applicants',
        label: 'Season Applicants',
        path: '/seasons/applicants',
        permissions: ['facilitation.view']
      },
    ]
  },
  {
    key: 'study-materials',
    label: 'Study Materials',
    icon: BookOutlined,
    module: 'facilitation',
    roles: ['FACILITATOR', 'SYSADMIN'],
    permissions: ['facilitation.view'],
    children: [
      {
        key: 'material-categories',
        label: 'Material Categories',
        path: '/study-materials/categories',
        roles: ['FACILITATOR', 'SYSADMIN'],
        permissions: ['facilitation.view']
      },
      {
        key: 'subtopic-materials',
        label: 'Subtopic Materials',
        path: '/study-materials/subtopic-materials',
        roles: ['FACILITATOR', 'SYSADMIN'],
        permissions: ['facilitation.view']
      }
    ]
  },
  {
    key: 'instructors',
    label: 'Instructors',
    icon: UserOutlined,
    module: 'facilitation',
    roles: ['FACILITATOR', 'SYSADMIN'],
    permissions: ['facilitation.view'],
    children: [
      {
        key: 'instructors-list',
        label: 'Manage Instructors',
        path: '/instructors/list',
        roles: ['FACILITATOR', 'SYSADMIN'],
        permissions: ['facilitation.view']
      }
    ]
  },
  {
    key: 'applications',
    label: 'Applications',
    icon: FormOutlined,
    module: 'applications',
    permissions: ['applications.view'], // Require applications.view permission
    roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT'], // Explicitly allow these roles
    children: [
      {
        key: 'my-profile',
        label: 'My Profile',
        path: '/user/profile',
        icon: UserOutlined,
        permissions: [], // No permissions required - accessible to all
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      },
      {
        key: 'my-applications',
        label: 'My Applications',
        path: '/applications/my-applications',
        icon: HistoryOutlined,
        permissions: ['applications.view'], // Require applications.view permission
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      },
      {
        key: 'course-structure',
        label: 'Course Structure',
        path: '/applications/structure',
        icon: AppstoreOutlined,
        permissions: ['applications.view'], // Require applications.view permission
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      },
      {
        key: 'apply-course',
        label: 'Apply for Course',
        path: '/applications/apply',
        icon: FormOutlined,
        permissions: ['applications.view'], // Require applications.view permission
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      },
      {
        key: 'study-materials',
        label: 'My Study Materials',
        path: '/applications/study',
        icon: ReadOutlined,
        permissions: ['applications.view'], // Require applications.view permission
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      },
      {
        key: 'testimonials',
        label: 'Testimonials',
        path: '/applications/testimonials',
        icon: StarOutlined,
        permissions: ['applications.view'], // Require applications.view permission
        roles: ['FACILITATOR', 'SYSADMIN', 'STUDENT']
      }
    ]
  },
  {
    key: 'accounting',
    label: 'Accounting',
    icon: AccountBookOutlined,
    module: 'accounting',
    permissions: ['VIEW_ACCOUNTING'],
    roles: ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER'],
    children: [
      {
        key: 'accounting-dashboard',
        label: 'Dashboard',
        path: '/accounting/dashboard',
        icon: DashboardOutlined,
        permissions: ['VIEW_ACCOUNTING'],
        roles: ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER']
      },
      {
        key: 'pending-payments',
        label: 'Pending Payments',
        path: '/accounting/pending-payments',
        icon: ClockCircleOutlined,
        permissions: ['VIEW_PENDING_PAYMENTS'],
        roles: ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER']
      },
      {
        key: 'reconciliation',
        label: 'Reconciliation',
        path: '/accounting/reconciliation',
        icon: ReconciliationOutlined,
        permissions: ['VIEW_RECONCILIATION'],
        roles: ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER']
      },
      {
        key: 'reports',
        label: 'Reports',
        path: '/accounting/reports',
        icon: BarChartOutlined,
        permissions: ['VIEW_REPORTS'],
        roles: ['FACILITATOR', 'SYSADMIN', 'ACCOUNTANT', 'MANAGER']
      }
    ]
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: FileTextOutlined,
    module: 'reports',
    permissions: ['reports.view'],
    children: [
      {
        key: 'reports-accounting',
        label: 'Accounting Reports',
        path: '/reports/accounting',
        permissions: ['reports.view', 'accounting.view']
      }
    ]
  },
  {
    key: 'support',
    label: 'Support',
    icon: SettingOutlined,
    module: 'support',
    permissions: ['settings.manage'],
    children: [
      {
        key: 'user-settings',
        label: 'User Settings',
        path: '/support/users',
        permissions: ['settings.manage']
      },
      {
        key: 'chat-management',
        label: 'Chat Management',
        path: '/support/chat',
        icon: MessageOutlined,
        permissions: ['settings.manage'],
        roles: ['SYSADMIN', 'SUPPORT']
      }
    ]
  }
]; 
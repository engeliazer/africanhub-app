// Role Permissions Configuration
export const rolePermissions = {
  // System Administrator has all permissions
  SYSADMIN: ['all'],
  
  // Facilitator permissions
  FACILITATOR: [
    'dashboard.view',
    'training.view',
    'training.manage',
    'performance.view',
    'performance.manage',
    'facilitation.view',
    'facilitation.manage',
    'facilitation.courses.view',
    'facilitation.courses.manage'
  ],
  
  // Student permissions
  STUDENT: [
    'dashboard.view',
    'training.view',
    'profile.view',
    'applications.view'
  ],
  
  // Accountant permissions
  ACCOUNTANT: [
    'dashboard.view',
    'profile.view',
    'VIEW_ACCOUNTING',
    'VIEW_PENDING_PAYMENTS',
    'VIEW_RECONCILIATION',
    'VIEW_REPORTS',
    'VIEW_PAYMENT_HISTORY'
  ],
  
  // Manager permissions
  MANAGER: [
    'dashboard.view',
    'profile.view',
    'VIEW_ACCOUNTING',
    'VIEW_PENDING_PAYMENTS',
    'VIEW_RECONCILIATION',
    'VIEW_REPORTS',
    'VIEW_PAYMENT_HISTORY'
  ]
};

// Role Descriptions
export const roleDescriptions = {
  SYSADMIN: 'System Administrator with full access',
  FACILITATOR: 'Trainer/Facilitator with access to manage academic content',
  STUDENT: 'Student/Applicant',
  ACCOUNTANT: 'Accountant with access to financial management',
  MANAGER: 'Manager with access to financial oversight'
};

export default rolePermissions; 
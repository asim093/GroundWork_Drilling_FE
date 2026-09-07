export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
  { to: '/admin/users', label: 'Operators', icon: 'users' },
  { to: '/admin/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/admin/scheduling', label: 'Scheduling', icon: 'calendar' },
  { to: '/admin/reports', label: 'Reports', icon: 'reports' }
];

export const OPERATOR_NAV = [
  { to: '/operator', label: 'Dashboard', icon: 'home', end: true },
  { to: '/operator/jobs', label: 'Assigned Jobs', icon: 'jobs' },
  { to: '/operator/submissions', label: 'My Submissions', icon: 'clipboard' }
];

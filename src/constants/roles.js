export const ROLE_LABELS = {
  admin: 'Admin',
  operator: 'Manager'
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;

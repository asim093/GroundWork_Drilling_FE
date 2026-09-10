export const ROLE_LABELS = {
  admin: 'Admin',
  operator: 'Site Manager'
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;

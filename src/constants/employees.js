export const MANAGER_TYPES = ['Project Manager', 'Supervisor', 'Foreman'];

export const MANAGER_TYPE_OPTIONS = MANAGER_TYPES.map((value) => ({ value, label: value }));

export const EMPLOYEE_TYPES = ['Driller', 'Driller Trainee', 'Helper', 'Assistant', '5th Man'];

export const EMPLOYEE_TYPE_OPTIONS = EMPLOYEE_TYPES.map((value) => ({ value, label: value }));

export const EMPLOYEE_CATEGORIES = ['Local', 'Expat'];

export const EMPLOYEE_CATEGORY_OPTIONS = EMPLOYEE_CATEGORIES.map((value) => ({
  value,
  label: value
}));

export const SHIFTS = ['Day', 'Night'];

export const SHIFT_OPTIONS = SHIFTS.map((value) => ({ value, label: value }));

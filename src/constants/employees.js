export const EMPLOYEE_TYPES = [
  'Project Manager',
  'Foreman',
  'Supervisor',
  'Driller',
  'Driller Trainee',
  'Helper',
  '5th Man'
];

export const EMPLOYEE_TYPE_OPTIONS = EMPLOYEE_TYPES.map((value) => ({ value, label: value }));

export const EMPLOYEE_CATEGORIES = ['Local', 'Expat'];

export const EMPLOYEE_CATEGORY_OPTIONS = EMPLOYEE_CATEGORIES.map((value) => ({
  value,
  label: value
}));

export const SHIFTS = ['Day', 'Night'];

export const SHIFT_OPTIONS = SHIFTS.map((value) => ({ value, label: value }));

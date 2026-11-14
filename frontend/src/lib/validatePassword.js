// Same rules as the backend (validate_password_strength in server.py).
export const PASSWORD_HINT = 'At least 12 characters with upper case, lower case and a number';

export function validatePassword(pw) {
  if (!pw || pw.length < 12) return 'Password must be at least 12 characters long';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  return null;
}

/**
 * Validates password strength and complexity.
 * Returns true when valid; otherwise returns a descriptive error string.
 */
export function validatePassword(value: string): true | string {
  if (!value) return "Password is required";

  // Check minimum length
  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(value)) {
    return "Password must contain at least one uppercase letter";
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(value)) {
    return "Password must contain at least one lowercase letter";
  }

  // Check for at least one number
  if (!/\d/.test(value)) {
    return "Password must contain at least one number";
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    return "Password must contain at least one special character";
  }

  // Check against common passwords
  const commonPasswords = [
    "password",
    "password123",
    "12345678",
    "qwerty",
    "abc123",
    "monkey",
    "1234567",
    "letmein",
    "trustno1",
    "dragon",
    "baseball",
    "iloveyou",
    "master",
    "sunshine",
    "ashley",
    "bailey",
    "passw0rd",
    "shadow",
    "123123",
    "654321",
    "superman",
    "qazwsx",
    "michael",
    "football",
  ];

  if (commonPasswords.includes(value.toLowerCase())) {
    return "Password is too common - please choose a more unique password";
  }

  // Check for sequential characters (e.g., "abc", "123", "qwerty")
  const sequentialPatterns = [
    "abcdefgh",
    "qwertyui",
    "asdfghjk",
    "zxcvbnm",
    "12345678",
    "87654321",
  ];

  const lowerValue = value.toLowerCase();
  for (const pattern of sequentialPatterns) {
    if (lowerValue.includes(pattern)) {
      return "Password contains sequential characters - please choose a more secure password";
    }
  }

  // Check for repeated characters (e.g., "aaaa", "1111")
  if (/(.)\1{3,}/.test(value)) {
    return "Password contains too many repeated characters";
  }

  return true;
}


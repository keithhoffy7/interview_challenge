/**
 * Validates phone numbers in international format (E.164).
 * Returns true when valid; otherwise returns a descriptive error string.
 * 
 * E.164 format: +[country code][number] (e.g., +14155552671, +442071234567)
 * - Optional leading +
 * - Country code: 1-3 digits
 * - Subscriber number: 4-14 digits
 * - Total length: 10-15 digits (excluding +)
 */

/**
 * Validates a phone number in international format (E.164).
 * @param value - The phone number to validate
 * @returns true if valid, or an error message string if invalid
 */
export function validatePhoneNumber(value: string): true | string {
  if (!value) return "Phone number is required";

  // Remove common formatting characters (spaces, dashes, parentheses, dots)
  const cleaned = value.replace(/[\s\-\(\)\.]/g, "");

  // Check if it's empty after cleaning
  if (!cleaned) {
    return "Phone number is required";
  }

  // E.164 format: optional +, then 1-3 digit country code, then 4-14 digit subscriber number
  // Total: 10-15 digits (excluding +)
  // Pattern: ^\+?[1-9]\d{4,14}$ or ^\+?[1-9]\d{9,14}$
  // - Optional + at start
  // - First digit after + must be 1-9 (country codes don't start with 0)
  // - Remaining digits: 4-14 more digits (total 5-15 digits after +, or 10-15 if no +)

  // Check for valid E.164 format
  // Format: +[1-9][0-9]{4,14} or [1-9][0-9]{9,14} (without +)
  const e164Pattern = /^\+?[1-9]\d{4,14}$/;

  if (!e164Pattern.test(cleaned)) {
    // More specific error messages
    if (cleaned.startsWith("+") && cleaned.length < 6) {
      return "Phone number with country code must be at least 6 digits (e.g., +14155552671)";
    }
    if (cleaned.startsWith("+") && cleaned.length > 16) {
      return "Phone number with country code must be at most 16 characters (including +)";
    }
    if (!cleaned.startsWith("+") && cleaned.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (!cleaned.startsWith("+") && cleaned.length > 15) {
      return "Phone number must be at most 15 digits";
    }
    if (cleaned.startsWith("0")) {
      return "Phone number cannot start with 0 (use country code format, e.g., +1...)";
    }
    if (!/^\+?\d+$/.test(cleaned)) {
      return "Phone number must contain only digits and optional + prefix";
    }
    return "Invalid phone number format. Use international format (e.g., +14155552671 or 14155552671)";
  }

  // Additional validation: ensure reasonable length
  const digitsOnly = cleaned.replace("+", "");
  if (digitsOnly.length < 10) {
    return "Phone number must be at least 10 digits";
  }
  if (digitsOnly.length > 15) {
    return "Phone number must be at most 15 digits";
  }

  return true;
}

/**
 * Normalizes a phone number to E.164 format (with + prefix).
 * @param value - The phone number to normalize
 * @returns The normalized phone number in E.164 format
 */
export function normalizePhoneNumber(value: string): string {
  // Remove formatting characters
  const cleaned = value.replace(/[\s\-\(\)\.]/g, "");

  // If it doesn't start with +, assume US format and add +1
  if (!cleaned.startsWith("+")) {
    // If it's 10 digits, assume US and add +1
    if (/^\d{10}$/.test(cleaned)) {
      return `+1${cleaned}`;
    }
    // Otherwise, add + prefix
    return `+${cleaned}`;
  }

  return cleaned;
}

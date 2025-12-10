/**
 * Validates US state codes.
 * Returns true when valid; otherwise returns a descriptive error string.
 */

// Valid US state codes (50 states + DC)
const VALID_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', // District of Columbia
]);

/**
 * Validates a US state code.
 * @param value - The state code to validate (case-insensitive)
 * @returns true if valid, or an error message string if invalid
 */
export function validateStateCode(value: string): true | string {
  if (!value) return "State code is required";

  // Normalize to uppercase
  const normalized = value.trim().toUpperCase();

  // Check length
  if (normalized.length !== 2) {
    return "State code must be exactly 2 letters";
  }

  // Check format (2 uppercase letters)
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "State code must contain only letters";
  }

  // Check if it's a valid US state code
  if (!VALID_STATE_CODES.has(normalized)) {
    return `"${normalized}" is not a valid US state code`;
  }

  return true;
}

/**
 * Normalizes a state code to uppercase.
 * @param value - The state code to normalize
 * @returns The normalized state code in uppercase
 */
export function normalizeStateCode(value: string): string {
  return value.trim().toUpperCase();
}

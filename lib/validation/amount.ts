/**
 * Validates and normalizes amount input.
 * Returns true when valid; otherwise returns a descriptive error string.
 */

/**
 * Validates an amount input and normalizes it.
 * @param value - The amount string to validate
 * @returns An object with isValid (true | string) and normalized value
 */
export function validateAmount(value: string): { isValid: true | string; normalized: string } {
  if (!value) {
    return { isValid: "Amount is required", normalized: "" };
  }

  // Remove leading and trailing whitespace
  const trimmed = value.trim();

  if (!trimmed) {
    return { isValid: "Amount is required", normalized: "" };
  }

  // Check for multiple leading zeros before non-zero digits (e.g., "000100.00", "001.50")
  // Pattern: starts with two or more zeros followed by a non-zero digit
  // This excludes "0.50" (single zero before decimal) and "0" (just zero)
  if (/^0{2,}[1-9]/.test(trimmed)) {
    // Normalize by removing leading zeros
    const normalized = trimmed.replace(/^0+/, '');

    return {
      isValid: "Amount cannot have multiple leading zeros. Use format like 100.00 instead of 000100.00",
      normalized: normalized,
    };
  }

  // Check format: digits, optional decimal point, up to 2 decimal places
  if (!/^\d+\.?\d{0,2}$/.test(trimmed)) {
    return { isValid: "Invalid amount format", normalized: trimmed };
  }

  // Parse and validate numeric value
  const num = parseFloat(trimmed);

  if (isNaN(num)) {
    return { isValid: "Amount must be a valid number", normalized: trimmed };
  }

  if (num <= 0) {
    return { isValid: "Amount must be greater than $0.00", normalized: trimmed };
  }

  if (num < 0.01) {
    return { isValid: "Amount must be at least $0.01", normalized: trimmed };
  }

  if (num > 10000) {
    return { isValid: "Amount cannot exceed $10,000", normalized: trimmed };
  }

  // Normalize: remove leading zeros and format consistently
  const normalized = num.toString();

  return { isValid: true, normalized };
}

/**
 * Normalizes an amount string by removing leading zeros.
 * @param value - The amount string to normalize
 * @returns The normalized amount string
 */
export function normalizeAmount(value: string): string {
  if (!value) return "";

  const trimmed = value.trim();

  // Handle zero amounts - normalize all zero representations to "0"
  if (trimmed === "0" || trimmed === "0.0" || trimmed === "0.00" || /^0+$/.test(trimmed) || /^0+\.0+$/.test(trimmed)) {
    return "0";
  }

  // Handle amounts starting with "0." (e.g., "0.50", "0.01") - keep as-is
  if (/^0\./.test(trimmed)) {
    return trimmed; // Keep as-is (single zero before decimal is valid)
  }

  // Remove multiple leading zeros before non-zero digits
  // Pattern: two or more zeros followed by a non-zero digit
  if (/^0{2,}[1-9]/.test(trimmed)) {
    const normalized = trimmed.replace(/^0+/, '');
    return normalized || '0';
  }

  return trimmed;
}

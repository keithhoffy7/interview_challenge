/**
 * Validates credit/debit card number using Luhn algorithm and valid card prefixes.
 * Returns true when valid; otherwise returns a descriptive error string.
 */
export function validateCardNumber(value: string): true | string {
  if (!value) return "Card number is required";

  // Remove any spaces or dashes that users might enter
  const cleaned = value.replace(/[\s-]/g, "");

  // Check that it contains only digits
  if (!/^\d+$/.test(cleaned)) {
    return "Card number must contain only digits";
  }

  // Check length - most cards are 13-19 digits, but common ones are 15-16
  if (cleaned.length < 13 || cleaned.length > 19) {
    return "Card number must be between 13 and 19 digits";
  }

  // Check for valid card prefixes
  const validPrefixes = [
    // Visa
    /^4/,
    // Mastercard
    /^5[1-5]/,
    // American Express
    /^3[47]/,
    // Discover
    /^6(?:011|5)/,
    // Diners Club
    /^3[0689]/,
    // JCB
    /^(?:2131|1800|35)/,
  ];

  const hasValidPrefix = validPrefixes.some((prefix) => prefix.test(cleaned));
  if (!hasValidPrefix) {
    return "Invalid card number - unsupported card type";
  }

  // Validate using Luhn algorithm
  if (!luhnCheck(cleaned)) {
    return "Invalid card number - checksum failed";
  }

  return true;
}

/**
 * Luhn algorithm (mod 10) checksum validation
 * This is the standard algorithm used to validate credit card numbers
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  // Process digits from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}


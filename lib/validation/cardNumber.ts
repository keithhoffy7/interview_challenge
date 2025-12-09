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
    // Visa - starts with 4
    /^4/,
    // Mastercard - 51-55 and 2221-2720 (2-series)
    /^5[1-5]/,
    /^222[1-9]/, // 2221-2229
    /^22[3-9]\d/, // 2230-2299
    /^2[3-6]\d{2}/, // 2300-2699
    /^27[01]\d/, // 2700-2719
    /^2720/, // 2720
    // American Express - 34 or 37
    /^3[47]/,
    // Discover - 6011, 622126-622925, 644-649, 65
    /^6011/,
    /^6221[2-9][6-9]/, // 622126-622199 (62212[6-9], 62213-62219)
    /^622[2-8][0-9][0-9]/, // 622200-622899
    /^6229[0-2][0-5]/, // 622900-622925
    /^64[4-9]/, // 644-649
    /^65/,
    // Diners Club - 300-305, 3095, 36, 38-39
    /^30[0-5]/, // 300-305
    /^3095/, // 3095
    /^36/,
    /^3[89]/, // 38-39
    // JCB - 3528-3589
    /^35(?:2[89]|[3-8][0-9])/, // 3528-3529, 3530-3589
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


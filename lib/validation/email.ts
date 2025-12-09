/**
 * Email validation function
 * Validates email format and detects common typos
 */

export function validateEmail(email: string): string | true {
  if (!email || typeof email !== "string") {
    return "Email is required";
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return "Email is required";
  }

  // Check for invalid characters or patterns first (before regex)
  if (trimmedEmail.startsWith("@") || trimmedEmail.endsWith("@")) {
    return "Invalid email address format";
  }

  // Check for consecutive dots
  if (trimmedEmail.includes("..")) {
    return "Invalid email address format (cannot contain consecutive dots)";
  }

  if (trimmedEmail.startsWith(".") || trimmedEmail.endsWith(".")) {
    return "Invalid email address format (cannot start or end with a dot)";
  }

  // Check for common typos in TLD (only actual typos, not valid TLDs)
  // This check happens after basic format checks but before full validation
  const commonTypos: Record<string, string> = {
    ".con": ".com",
    ".c0m": ".com",
    ".cm": ".com",
    ".om": ".com",
    ".cpm": ".com",
    ".coom": ".com",
    ".comm": ".com",
    ".orgn": ".org",
    ".ogr": ".org",
  };

  // Check for common TLD typos (only check if it's likely a typo, not a valid TLD)
  // Note: .co is a valid TLD (Colombia), so we don't flag it as a typo
  // Note: .net, .edu, .gov are valid TLDs, so we don't flag them
  for (const [typo, correct] of Object.entries(commonTypos)) {
    if (trimmedEmail.toLowerCase().endsWith(typo)) {
      return `Did you mean "${trimmedEmail.slice(0, -typo.length)}${correct}"?`;
    }
  }

  // Basic email format validation (RFC 5322 simplified)
  // More comprehensive than the previous weak pattern
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return "Invalid email address format";
  }

  // Check for valid domain structure
  const parts = trimmedEmail.split("@");
  if (parts.length !== 2) {
    return "Invalid email address format";
  }

  const [localPart, domain] = parts;

  if (localPart.length === 0 || localPart.length > 64) {
    return "Invalid email address format (local part must be 1-64 characters)";
  }

  // Check local part doesn't start or end with dot
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return "Invalid email address format (local part cannot start or end with a dot)";
  }

  if (domain.length === 0 || domain.length > 255) {
    return "Invalid email address format (domain must be 1-255 characters)";
  }

  // Check domain has at least one dot (has TLD)
  if (!domain.includes(".")) {
    return "Invalid email address format (domain must include a top-level domain)";
  }

  // Check domain doesn't start or end with dot or hyphen
  if (domain.startsWith(".") || domain.endsWith(".") || domain.startsWith("-") || domain.endsWith("-")) {
    return "Invalid email address format";
  }

  // Check for valid TLD (at least 2 characters)
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return "Invalid email address format (top-level domain must be at least 2 characters)";
  }

  return true;
}

/**
 * Normalizes email to lowercase and returns it
 * Also returns a warning if the original had uppercase letters
 */
export function normalizeEmail(email: string): { email: string; wasLowercased: boolean } {
  const trimmed = email.trim();
  const lowercased = trimmed.toLowerCase();
  const wasLowercased = trimmed !== lowercased;

  return {
    email: lowercased,
    wasLowercased,
  };
}

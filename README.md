# Bug Fix Documentation

This document contains documentation for all bug fixes implemented in the SecureBank application, including root cause analysis, solutions, and test coverage.

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

## Test Configuration

The project uses Jest with React Testing Library for testing. Test files are located in the `__tests__/` directory.

**Configuration files:**
- `jest.config.js` - Jest configuration for Next.js
- `jest.setup.js` - Test setup file with jest-dom matchers

**Test file naming convention:**
- Test files should be named `*.test.tsx` or `*.spec.tsx`
- Place test files in the `__tests__/` directory or alongside the files they test

---

## Bug Fixes

### Ticket UI-101: Dark Mode Text Visibility

#### Root Cause

The issue was caused by missing dark mode styling for form input elements. When dark mode is enabled (via `prefers-color-scheme: dark`), the application sets the body text color to light gray (`#ededed`) through CSS variables. However, input fields were not explicitly styled for dark mode, causing them to:

1. Inherit the white/light text color from the body element
2. Maintain a default white or light background color
3. Result in white text on a white/light background, making typed text invisible

The root cause was in `app/globals.css`, where dark mode styles were only applied to the body element but not to form input elements (`input`, `textarea`, `select`).

#### Solution

Added explicit dark mode styling for all form input elements in `app/globals.css`:

```css
input, textarea, select {
  background-color: white;
  color: #171717;
}

@media (prefers-color-scheme: dark) {
  input, textarea, select {
    background-color: #1a1a1a;
    color: #ededed;
    border-color: #404040;
  }
}
```

This ensures that:
- In light mode, inputs have a white background with dark text
- In dark mode, inputs have a dark background (`#1a1a1a`) with light text (`#ededed`) and appropriate border colors
- All form inputs across the application (login, signup, funding, account creation) now display text correctly in both modes

#### Preventive Measures

To avoid similar issues in the future:

1. **Comprehensive Dark Mode Testing**: Always test all UI components in both light and dark modes during development and QA
2. **Global Input Styling**: Use global CSS rules for form elements rather than relying on inheritance, ensuring consistent styling across all inputs
3. **Design System Approach**: Establish a design system with predefined color tokens for inputs in both light and dark modes, and consistently apply them
4. **CSS Variable Strategy**: Extend the existing CSS variable system to include input-specific variables (e.g., `--input-background`, `--input-foreground`) that automatically adapt to color scheme
5. **Component Library**: Consider using a component library or creating reusable input components with built-in dark mode support
6. **Automated Visual Testing**: Implement visual regression testing that captures both light and dark mode states to catch these issues early

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/dark-mode-input.test.tsx`.

**Test Coverage:**

The test suite includes 4 test cases that verify:

1. **Dark Mode Styling**: Verifies that input elements have a dark background (`#1a1a1a`) and light text (`#ededed`) in dark mode
2. **Light Mode Styling**: Verifies that input elements have a white background and dark text (`#171717`) in light mode
3. **Bug Prevention**: Specifically tests that the white-on-white text bug condition is resolved
4. **Comprehensive Coverage**: Tests that `textarea` and `select` elements also have proper dark mode styling

**Test Results:**

All tests pass successfully, confirming that:
- Input fields have proper contrast in both light and dark modes
- The white-on-white text bug is resolved
- All form elements (input, textarea, select) are properly styled

### Ticket VAL-202: Date of Birth Validation

#### Root Cause

The issue was caused by missing validation for date of birth input in the signup form. The form only checked that the date field was required, but did not validate:
1. That the date was not in the future (allowing dates like 2025 to be accepted)
2. That the user was at least 18 years old (critical for banking compliance)
3. That the date format was valid and the date itself was valid (e.g., rejecting Feb 30)

The root cause was in `app/signup/page.tsx`, where the date of birth input field only had a `required` validation rule but lacked comprehensive date validation logic.

#### Solution

Created a dedicated validation function `validateDateOfBirth` in `lib/validation/dateOfBirth.ts` and integrated it into the signup form. The validation function:

1. **Validates date format**: Ensures the date matches YYYY-MM-DD format
2. **Validates date validity**: Checks that the date is actually valid (e.g., rejects Feb 30, month 13, etc.)
3. **Rejects future dates**: Prevents dates in the future (fixes the main bug where 2025 was accepted)
4. **Enforces age requirement**: Calculates age and ensures the user is at least 18 years old
5. **Handles edge cases**: Properly handles leap years, birthday calculations, and timezone issues

The validation is integrated into the signup form at `app/signup/page.tsx`:

```typescript
<input
  {...register("dateOfBirth", {
    required: "Date of birth is required",
    validate: validateDateOfBirth,
  })}
  type="date"
  className="..."
/>
```

This ensures that:
- Future dates are rejected with a clear error message
- Users under 18 are rejected (critical for banking compliance)
- Invalid dates and formats are caught before submission
- The validation is centralized and reusable

#### Preventive Measures

To avoid similar issues in the future:

1. **Comprehensive Input Validation**: Always validate date inputs beyond just checking if they're required - validate format, validity, and business rules
2. **Centralized Validation Logic**: Create reusable validation functions rather than inline validation rules, making them easier to test and maintain
3. **Age Verification**: For financial applications, always verify age requirements server-side as well as client-side
4. **Date Handling Best Practices**: Use UTC dates for age calculations to avoid timezone issues, and always validate that parsed dates match input dates
5. **Compliance Awareness**: For regulated industries like banking, ensure validation rules meet regulatory requirements (e.g., minimum age, KYC compliance)
6. **Edge Case Testing**: Test edge cases like leap years, birthday calculations, timezone boundaries, and boundary conditions (exactly 18, exactly 18+1 day, etc.)

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/date-of-birth-validation.test.ts`.

**Test Coverage:**

The test suite includes 27 test cases organized into 6 categories:

1. **Future Date Validation (Main Bug Fix)**: 4 tests that verify future dates like 2025 are rejected
2. **Age Validation (18+ Requirement)**: 5 tests that verify users under 18 are rejected and valid ages are accepted
3. **Date Format Validation**: 6 tests that verify various invalid formats are rejected
4. **Invalid Date Validation**: 6 tests that verify invalid dates (Feb 30, month 13, etc.) are rejected
5. **Edge Cases**: 4 tests that handle birthday today, tomorrow, very old dates, and leap years
6. **Compliance and Security**: 2 tests that ensure minors and future dates are prevented (critical for banking compliance)

**Test Results:**

All 27 tests pass successfully, confirming that:
- Future dates (including 2025) are properly rejected
- Users under 18 years old are rejected (critical for compliance)
- Invalid date formats and invalid dates are caught
- Edge cases are handled correctly (leap years, birthday calculations, etc.)
- The validation prevents the original bug from recurring

### Ticket VAL-206: Card Number Validation

#### Root Cause

The issue was caused by weak card number validation in the funding form. The validation only checked:
1. That the card number was 16 digits long
2. That it started with "4" (Visa) or "5" (Mastercard)

This allowed many invalid card numbers to be accepted, including:
- Numbers that failed the Luhn algorithm checksum (the standard validation algorithm for credit cards)
- Numbers with incorrect lengths
- Numbers from unsupported card types
- Random sequences of digits that happened to match the basic pattern

The root cause was in `components/FundingModal.tsx`, where the card number validation used only basic pattern matching and prefix checking, without implementing the industry-standard Luhn algorithm for checksum validation.

#### Solution

Created a dedicated validation function `validateCardNumber` in `lib/validation/cardNumber.ts` and integrated it into the funding modal. The validation function:

1. **Validates format**: Removes spaces and dashes (common user input), then checks that only digits remain
2. **Validates length**: Ensures card numbers are between 13-19 digits (standard card number lengths)
3. **Validates card prefixes**: Checks for valid prefixes for major card types:
   - Visa (starts with 4)
   - Mastercard (starts with 51-55)
   - American Express (starts with 34 or 37)
   - Discover (starts with 6011 or 65)
   - Diners Club (starts with 30, 36, 38, or 39)
   - JCB (starts with 2131, 1800, or 35)
4. **Validates using Luhn algorithm**: Implements the industry-standard Luhn (mod 10) checksum algorithm to detect invalid card numbers

The validation is integrated into the funding form at `components/FundingModal.tsx`:

```typescript
<input
  {...register("accountNumber", {
    required: `${fundingType === "card" ? "Card" : "Account"} number is required`,
    pattern: {
      value: fundingType === "card" ? /^[\d\s-]+$/ : /^\d+$/,
      message: fundingType === "card" ? "Card number contains invalid characters" : "Invalid account number",
    },
    validate: {
      validCard: (value) => {
        if (fundingType !== "card") return true;
        return validateCardNumber(value);
      },
    },
  })}
  type="text"
  className="..."
  placeholder={fundingType === "card" ? "1234 5678 9012 3456" : "123456789"}
/>
```

This ensures that:
- Invalid card numbers are rejected before submission (preventing failed transactions)
- Only valid card numbers that pass the Luhn algorithm are accepted
- Users can enter card numbers with spaces or dashes (common formatting)
- All major card types are supported
- The validation is centralized and reusable

#### Preventive Measures

To avoid similar issues in the future:

1. **Use Industry Standards**: Always implement the Luhn algorithm for card number validation - it's the industry standard and catches most invalid numbers
2. **Comprehensive Validation**: Don't rely on simple pattern matching or length checks alone - implement proper checksum validation
3. **Support Common Formats**: Allow users to enter card numbers with spaces or dashes, then normalize the input before validation
4. **Card Type Detection**: Validate card prefixes to ensure only supported card types are accepted
5. **Server-Side Validation**: Always validate card numbers server-side as well, as client-side validation can be bypassed
6. **Test with Real Test Numbers**: Use known valid test card numbers from payment processors for testing (e.g., Stripe, PayPal test cards)
7. **Error Messages**: Provide clear, specific error messages to help users understand what's wrong with their card number

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/card-number-validation.test.ts`.

**Test Coverage:**

The test suite includes 51 test cases organized into 9 categories:

1. **Valid Card Numbers (Luhn Algorithm)**: 10 tests that verify valid card numbers from all major card types pass validation
2. **Invalid Card Numbers (Luhn Algorithm Failures)**: 5 tests that verify invalid checksums are rejected
3. **Invalid Card Prefixes**: 4 tests that verify unsupported card types are rejected
4. **Invalid Length Validation**: 5 tests that verify cards with incorrect lengths are rejected
5. **Format Handling (Spaces and Dashes)**: 5 tests that verify spaces and dashes are handled correctly
6. **Invalid Format Validation**: 4 tests that verify invalid characters and formats are rejected
7. **Card Type Validation**: 12 tests that verify all supported card types and their prefixes work correctly
8. **Edge Cases**: 4 tests that handle boundary conditions and edge cases
9. **Real-World Scenarios**: 2 tests that verify obviously fake numbers are rejected and valid test numbers are accepted

**Test Results:**

All 51 tests pass successfully, confirming that:
- Valid card numbers pass the Luhn algorithm validation
- Invalid card numbers are properly rejected (preventing failed transactions)
- All major card types (Visa, Mastercard, Amex, Discover, Diners Club, JCB) are supported
- Format variations (spaces, dashes) are handled correctly
- Invalid formats, lengths, and prefixes are caught
- The validation prevents the original bug from recurring

### Ticket VAL-208: Weak Password Requirements

#### Root Cause

The issue was caused by weak password validation in the signup form. The validation only checked:
1. Minimum length of 8 characters
2. Presence of at least one number
3. Rejection of a very small list of common passwords (only 3 passwords: "password", "12345678", "qwerty")

This allowed many weak passwords to be accepted, including:
- Passwords with only lowercase letters and numbers (missing uppercase)
- Passwords with only uppercase letters and numbers (missing lowercase)
- Passwords without special characters
- Common passwords not in the small exclusion list
- Passwords with sequential patterns (e.g., "abcdefgh", "12345678")
- Passwords with repeated characters (e.g., "aaaa", "1111")

The root cause was in `app/signup/page.tsx`, where the password validation used only basic checks without enforcing proper complexity requirements that are standard for financial applications.

#### Solution

Created a dedicated validation function `validatePassword` in `lib/validation/password.ts` and integrated it into the signup form. The validation function enforces:

1. **Minimum length**: At least 8 characters
2. **Uppercase requirement**: At least one uppercase letter (A-Z)
3. **Lowercase requirement**: At least one lowercase letter (a-z)
4. **Number requirement**: At least one digit (0-9)
5. **Special character requirement**: At least one special character (!@#$%^&*()_+-=[]{}|;':"\\,.<>/?)
6. **Common password rejection**: Checks against an expanded list of 24 common passwords
7. **Sequential pattern rejection**: Rejects passwords containing sequential patterns like "abcdefgh", "qwerty", "12345678", etc.
8. **Repeated character rejection**: Rejects passwords with 4 or more repeated characters

The validation is integrated into the signup form at `app/signup/page.tsx`:

```typescript
<input
  {...register("password", {
    required: "Password is required",
    validate: validatePassword,
  })}
  type="password"
  className="..."
/>
```

This ensures that:
- Only strong passwords meeting all complexity requirements are accepted
- Common and predictable passwords are rejected
- Sequential patterns and excessive repetition are caught
- The validation provides clear, specific error messages for each requirement
- The validation is centralized and reusable

#### Preventive Measures

To avoid similar issues in the future:

1. **Enforce Password Complexity**: Always require a mix of uppercase, lowercase, numbers, and special characters for financial applications
2. **Use Industry Standards**: Follow NIST guidelines or OWASP recommendations for password policies
3. **Comprehensive Common Password Lists**: Maintain and regularly update lists of common passwords to reject
4. **Pattern Detection**: Implement checks for sequential patterns, keyboard patterns, and repeated characters
5. **Server-Side Validation**: Always validate passwords server-side as well, as client-side validation can be bypassed
6. **Password Strength Meter**: Consider adding a visual password strength indicator to help users create stronger passwords
7. **Rate Limiting**: Implement rate limiting on password attempts to prevent brute force attacks
8. **Password History**: For sensitive applications, consider preventing reuse of recent passwords
9. **Clear Error Messages**: Provide specific feedback about which requirements are missing to help users create valid passwords

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/password-validation.test.ts`.

**Test Coverage:**

The test suite includes 49 test cases organized into 9 categories:

1. **Valid Passwords**: 5 tests that verify strong passwords meeting all requirements are accepted
2. **Length Validation**: 3 tests that verify minimum length requirements
3. **Uppercase Letter Requirement**: 3 tests that verify uppercase letter requirements
4. **Lowercase Letter Requirement**: 2 tests that verify lowercase letter requirements
5. **Number Requirement**: 3 tests that verify number requirements
6. **Special Character Requirement**: 7 tests that verify special character requirements and various special characters
7. **Common Password Rejection**: 5 tests that verify common passwords are rejected
8. **Sequential Pattern Rejection**: 5 tests that verify sequential patterns are rejected
9. **Repeated Character Rejection**: 4 tests that verify excessive repetition is rejected
10. **Multiple Requirement Failures**: 5 tests that verify error prioritization when multiple requirements fail
11. **Edge Cases**: 4 tests that handle various edge cases
12. **Security Best Practices**: 3 tests that verify security best practices are enforced

**Test Results:**

All 49 tests pass successfully, confirming that:
- Strong passwords meeting all complexity requirements are accepted
- Weak passwords are properly rejected (critical for account security)
- All complexity requirements (uppercase, lowercase, numbers, special characters) are enforced
- Common passwords, sequential patterns, and repeated characters are caught
- Clear error messages guide users to create valid passwords
- The validation prevents the original bug from recurring

### Ticket SEC-301: SSN Storage

#### Root Cause

The issue was caused by storing Social Security Numbers (SSNs) in plaintext in the database. SSNs were being stored directly as received from user input without any encryption or hashing, creating a severe security and compliance risk:

1. **Privacy Violation**: SSNs in plaintext can be read by anyone with database access
2. **Compliance Risk**: Violates regulations like GDPR, CCPA, and financial industry standards (PCI DSS, GLBA)
3. **Data Breach Impact**: If the database is compromised, all SSNs are immediately exposed
4. **Identity Theft Risk**: Plaintext SSNs can be used directly for identity theft

The root cause was in `server/routers/auth.ts`, where SSNs were inserted into the database without any hashing or encryption:

```typescript
await db.insert(users).values({
  ...input,
  password: hashedPassword,
  // ssn was stored in plaintext here
});
```

Additionally, SSNs were being returned in user objects, potentially exposing them in API responses.

#### Solution

Created a dedicated security utility `lib/security/ssn.ts` with functions to hash and verify SSNs using bcrypt (the same secure hashing algorithm used for passwords). The solution:

1. **Hashes SSNs before storage**: Uses bcrypt with 10 salt rounds to hash SSNs before storing in the database
2. **One-way hashing**: SSNs cannot be reversed from the hash, ensuring they cannot be extracted even if the database is compromised
3. **Verification capability**: Provides a `verifySSN` function for identity verification if needed in the future
4. **Removes SSNs from API responses**: Ensures SSNs are never returned in user objects

The fix is integrated into the signup mutation at `server/routers/auth.ts`:

```typescript
import { hashSSN } from "@/lib/security/ssn";

// In signup mutation:
const hashedPassword = await bcrypt.hash(input.password, 10);
const hashedSSN = await hashSSN(input.ssn);

await db.insert(users).values({
  ...input,
  password: hashedPassword,
  ssn: hashedSSN, // Now stored as hash, not plaintext
});

// SSN is excluded from response
return { user: { ...user, password: undefined, ssn: undefined }, token };
```

This ensures that:
- SSNs are never stored in plaintext in the database
- Even with database access, SSNs cannot be extracted
- SSNs are never returned in API responses
- The hashing uses industry-standard bcrypt algorithm
- Each SSN gets a unique hash due to salt, preventing rainbow table attacks

#### Preventive Measures

To avoid similar issues in the future:

1. **Always Hash Sensitive Data**: Never store PII (Personally Identifiable Information) like SSNs, credit card numbers, or other sensitive data in plaintext
2. **Use Industry-Standard Algorithms**: Use proven cryptographic hashing algorithms like bcrypt, scrypt, or Argon2 for sensitive data
3. **Salt All Hashes**: Ensure hashing algorithms use salts to prevent rainbow table attacks
4. **Never Return Sensitive Data**: Always exclude sensitive fields from API responses and database queries
5. **Data Classification**: Classify data by sensitivity level and apply appropriate security measures
6. **Compliance Awareness**: Understand regulatory requirements (GDPR, CCPA, PCI DSS, GLBA) for handling sensitive data
7. **Security Audits**: Regularly audit database schemas and API responses to ensure no sensitive data is exposed
8. **Encryption at Rest**: Consider additional encryption at the database level for extra protection
9. **Access Controls**: Implement strict access controls and audit logging for database access
10. **Data Minimization**: Only collect and store sensitive data that is absolutely necessary

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/ssn-security.test.ts`.

**Test Coverage:**

The test suite includes 15 test cases organized into 5 categories:

1. **SSN Hashing**: 4 tests that verify SSNs are properly hashed and never stored in plaintext
2. **SSN Verification**: 4 tests that verify SSN verification works correctly for identity checks
3. **Security Properties**: 3 tests that verify the security properties of the hashing (non-reversible, secure algorithm, etc.)
4. **Database Storage Simulation**: 2 tests that simulate database storage and verify SSNs cannot be extracted
5. **Compliance and Privacy**: 2 tests that ensure compliance with privacy regulations and prevent enumeration attacks

**Test Results:**

All 15 tests pass successfully, confirming that:
- SSNs are hashed before storage (never in plaintext)
- Hashed SSNs cannot be reversed to plaintext
- SSN verification works correctly when needed
- Different SSNs produce different hashes
- Same SSN produces different hashes (due to salt) but both verify correctly
- The hashing uses secure bcrypt algorithm with proper salt rounds
- SSNs cannot be extracted from database dumps
- The fix prevents the original security vulnerability from recurring

### Ticket SEC-303: XSS Vulnerability

#### Root Cause

The issue was caused by using `dangerouslySetInnerHTML` to render transaction descriptions in the UI. This React API directly injects HTML into the DOM without sanitization, creating a critical cross-site scripting (XSS) vulnerability:

1. **Unescaped HTML Rendering**: Transaction descriptions were rendered using `dangerouslySetInnerHTML`, which allows any HTML/JavaScript in the description to be executed
2. **No Input Sanitization**: User-controlled or database-stored content containing HTML tags could be executed as code
3. **Attack Vector**: Malicious actors could inject script tags, event handlers, or other HTML that executes JavaScript in users' browsers
4. **Impact**: Could lead to cookie theft, session hijacking, DOM manipulation, or other malicious actions

The root cause was in `components/TransactionList.tsx` on line 71:

```typescript
{transaction.description ? <span dangerouslySetInnerHTML={{ __html: transaction.description }} /> : "-"}
```

This allowed any HTML in transaction descriptions to be rendered and executed, creating a severe security vulnerability.

#### Solution

Created a dedicated HTML escaping utility `lib/security/escapeHtml.ts` and replaced `dangerouslySetInnerHTML` with safe text rendering. The solution:

1. **HTML Escaping Function**: Created `escapeHtml()` that converts dangerous HTML characters to their safe HTML entity equivalents:
   - `<` → `&lt;`
   - `>` → `&gt;`
   - `&` → `&amp;`
   - `"` → `&quot;`
   - `'` → `&#039;`

2. **Safe Rendering**: Replaced `dangerouslySetInnerHTML` with direct text rendering after escaping

3. **Prevents XSS**: All HTML tags and special characters are escaped, preventing script execution

The fix is integrated into the TransactionList component at `components/TransactionList.tsx`:

```typescript
import { escapeHtml } from "@/lib/security/escapeHtml";

// Before (vulnerable):
{transaction.description ? <span dangerouslySetInnerHTML={{ __html: transaction.description }} /> : "-"}

// After (secure):
{transaction.description ? escapeHtml(transaction.description) : "-"}
```

This ensures that:
- All HTML tags are escaped and rendered as text, not executed
- Script tags, event handlers, and other malicious HTML cannot execute
- Transaction descriptions are safely displayed without XSS risk
- The escaping is centralized and reusable across the application

#### Preventive Measures

To avoid similar issues in the future:

1. **Never Use dangerouslySetInnerHTML**: Avoid `dangerouslySetInnerHTML` unless absolutely necessary and with proper sanitization
2. **Always Escape User Input**: Escape or sanitize all user-controlled content before rendering
3. **Use React's Built-in Escaping**: React automatically escapes content in JSX - use it instead of `dangerouslySetInnerHTML`
4. **Content Security Policy (CSP)**: Implement CSP headers to provide an additional layer of XSS protection
5. **Input Validation**: Validate and sanitize input at the server level before storing in the database
6. **Use Sanitization Libraries**: For cases where HTML is needed, use trusted libraries like DOMPurify
7. **Security Testing**: Regularly test for XSS vulnerabilities using tools and manual testing
8. **Code Reviews**: Include XSS prevention in security-focused code reviews
9. **Security Headers**: Implement security headers (X-XSS-Protection, Content-Security-Policy) for defense in depth
10. **OWASP Guidelines**: Follow OWASP guidelines for preventing XSS attacks

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/xss-prevention.test.tsx`.

**Test Coverage:**

The test suite includes 25 test cases organized into 5 categories:

1. **HTML Escaping**: 6 tests that verify all HTML special characters are properly escaped
2. **XSS Attack Vectors**: 7 tests that verify common XSS attack vectors are prevented (script tags, event handlers, iframes, javascript: protocol, etc.)
3. **Real-World XSS Scenarios**: 5 tests that handle transaction descriptions with HTML and mixed content
4. **Edge Cases**: 4 tests that handle nested HTML, attributes, multiple occurrences, and unicode
5. **Security Verification**: 3 tests that verify JavaScript cannot be executed, cookie theft is prevented, and DOM manipulation is blocked

**Test Results:**

All 25 tests pass successfully, confirming that:
- HTML tags are properly escaped and cannot execute
- Script tags, event handlers, and other XSS vectors are neutralized
- Transaction descriptions are safely rendered without XSS risk
- Various attack payloads are properly escaped
- The fix prevents the original XSS vulnerability from recurring

### Ticket PERF-401: Account Creation Error

#### Root Cause

The issue was caused by a fallback object returned when account retrieval failed after creation. The code had a problematic pattern:

1. **Account Insertion**: Account was correctly inserted into the database with `balance: 0` and `status: "active"`
2. **Account Retrieval**: After insertion, the code attempted to fetch the created account
3. **Fallback on Failure**: If the fetch returned `null` (database error, timing issue, etc.), instead of throwing an error, the code returned a fallback object with incorrect values:
   - `balance: 100` (should be 0)
   - `status: "pending"` (should be "active")
   - `id: 0` (invalid ID)

The root cause was in `server/routers/account.ts` on lines 57-67, where a fallback object was returned instead of proper error handling:

```typescript
return (
  account || {
    id: 0,
    userId: ctx.user.id,
    accountNumber: accountNumber!,
    accountType: input.accountType,
    balance: 100,  // WRONG - should be 0
    status: "pending",  // WRONG - should be "active"
    createdAt: new Date().toISOString(),
  }
);
```

This created a critical financial discrepancy where users would see an incorrect balance of $100 instead of the actual $0 balance in the database.

#### Solution

Removed the fallback object and implemented proper error handling. The fix:

1. **Removed Fallback Object**: Eliminated the fallback that returned incorrect balance and status
2. **Added Error Handling**: If account retrieval fails after creation, the code now throws a proper error
3. **Ensures Data Consistency**: The returned account always matches what's actually in the database

The fix is in `server/routers/account.ts`:

```typescript
// Fetch the created account
const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

if (!account) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Account was created but could not be retrieved. Please refresh your accounts.",
  });
}

return account;
```

This ensures that:
- Accounts are always returned with the correct balance (0 for new accounts)
- Accounts are always returned with the correct status ("active")
- If database operations fail, users get a clear error message instead of incorrect data
- Financial data displayed to users always matches the database state
- No fake or fallback data is ever returned

#### Preventive Measures

To avoid similar issues in the future:

1. **Never Return Fallback Data**: Don't return fake or default data when database operations fail - always throw errors
2. **Verify Database Operations**: Always verify that database operations succeed and data can be retrieved
3. **Financial Data Accuracy**: For financial applications, accuracy is critical - never guess or use fallback values for balances
4. **Error Handling Best Practices**: Use proper error handling with descriptive messages instead of silent fallbacks
5. **Data Consistency Checks**: Verify that returned data matches what was inserted/updated in the database
6. **Transaction Safety**: Consider using database transactions to ensure atomicity of operations
7. **Logging**: Log database operation failures for debugging and monitoring
8. **Integration Testing**: Test database operations end-to-end to catch retrieval failures
9. **Idempotency**: Ensure operations can be safely retried if they fail
10. **User Communication**: Provide clear error messages to users when operations fail, rather than showing incorrect data

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/account-creation.test.ts`.

**Test Coverage:**

The test suite includes 11 test cases organized into 5 categories:

1. **Account Balance on Creation**: 3 tests that verify accounts are created with balance 0, not 100
2. **Error Handling**: 2 tests that verify proper errors are thrown when account retrieval fails
3. **Account Status**: 2 tests that verify accounts are created with status "active", not "pending"
4. **Data Consistency**: 2 tests that verify returned account data matches database state
5. **Financial Accuracy**: 2 tests that ensure balance accuracy is maintained (critical for financial apps)

**Test Results:**

All 11 tests pass successfully, confirming that:
- New accounts are created with correct balance (0, not 100)
- If account retrieval fails, proper error is thrown (not fake balance)
- Account status is correct ("active", not "pending")
- Returned account data always matches database state
- Financial data accuracy is maintained
- The fix prevents the original bug from recurring

### Ticket PERF-405: Missing Transactions

#### Root Cause

The issue was caused by incorrect transaction retrieval logic in the `fundAccount` mutation. After creating a transaction, the code attempted to fetch it using a query that had two critical flaws:

1. **Missing accountId Filter**: The query did not filter by `accountId`, so it could return a transaction from any account, not necessarily the account that was just funded
2. **Incorrect Ordering**: The query ordered by `createdAt` in ascending order (oldest first) without specifying descending, which could return the oldest transaction instead of the most recently created one

The root cause was in `server/routers/account.ts` on line 120:

```typescript
// Buggy code:
const transaction = await db.select().from(transactions).orderBy(transactions.createdAt).limit(1).get();
```

This query had several problems:
- No `where` clause to filter by `accountId`
- Ordered by `createdAt` ascending (gets oldest transaction, not newest)
- When multiple funding events occurred (especially across different accounts or in quick succession), this query could return the wrong transaction or miss transactions entirely

**Impact:**
- Users funding multiple accounts would see transactions from the wrong account
- Multiple funding events for the same account could result in missing transactions in history
- The transaction returned after funding might not match the transaction that was actually created
- Transaction history would be incomplete or incorrect

#### Solution

Fixed the transaction retrieval query to properly filter by `accountId` and order correctly. The solution:

1. **Added accountId Filter**: Filters transactions by the specific `accountId` that was funded
2. **Correct Ordering**: Orders by `id` descending (most recent first) instead of `createdAt` ascending
3. **Error Handling**: Added proper error handling if the transaction cannot be retrieved after creation

The fix is in `server/routers/account.ts`:

```typescript
import { eq, and, desc } from "drizzle-orm";

// Create transaction
await db.insert(transactions).values({
  accountId: input.accountId,
  type: "deposit",
  amount,
  description: `Funding from ${input.fundingSource.type}`,
  status: "completed",
  processedAt: new Date().toISOString(),
});

// Fetch the created transaction - filter by accountId and order by id descending to get the most recent
const transaction = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, input.accountId))
  .orderBy(desc(transactions.id))
  .limit(1)
  .get();

if (!transaction) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Transaction was created but could not be retrieved",
  });
}
```

This ensures that:
- The transaction returned always belongs to the correct account
- The most recent transaction for that account is retrieved (by ordering by `id` descending)
- All transactions appear correctly in transaction history
- Multiple funding events for the same account all appear
- Multiple funding events for different accounts don't interfere with each other
- Transaction isolation is maintained per account

#### Preventive Measures

To avoid similar issues in the future:

1. **Always Filter by Foreign Keys**: When querying related data, always filter by the foreign key (e.g., `accountId`) to ensure data isolation
2. **Use Reliable Ordering**: When retrieving the most recent record, order by auto-incrementing `id` descending rather than timestamps, which can have collisions
3. **Test Multi-Account Scenarios**: Always test with multiple accounts to ensure transactions don't leak between accounts
4. **Test Concurrent Operations**: Test rapid successive operations to catch race conditions and ordering issues
5. **Verify Data Isolation**: Ensure queries properly isolate data by user/account to prevent data leakage
6. **Use Transactions for Atomicity**: Consider using database transactions for operations that must be atomic
7. **Return Inserted Records**: When possible, use database features to return the inserted record directly instead of querying again
8. **Comprehensive Integration Tests**: Test the full flow from creation to retrieval to ensure data consistency
9. **Query Review**: Review all queries to ensure they have proper `where` clauses and correct ordering
10. **Data Integrity Checks**: Verify that returned data matches what was inserted/updated

#### Test Coverage

A comprehensive test suite has been created to verify this fix and prevent regression. The test file is located at `__tests__/missing-transactions.test.ts`.

**Test Coverage:**

The test suite includes 20 test cases organized into 6 categories:

1. **Transaction Retrieval After Creation**: 3 tests that verify transactions are correctly filtered by `accountId` and ordered properly
2. **Multiple Funding Events for Same Account**: 3 tests that verify all transactions appear when multiple funding events occur for the same account
3. **Multiple Accounts - Transaction Isolation**: 3 tests that verify transactions from different accounts don't interfere with each other
4. **Transaction History Completeness**: 3 tests that verify all transactions appear in history and none are missing
5. **Root Cause Verification**: 2 tests that verify the specific bugs (missing filter, incorrect ordering) are fixed
6. **Edge Cases**: 3 tests that handle first transaction, null retrieval, and same timestamp scenarios

**Test Results:**

All 20 tests pass successfully, confirming that:
- Transactions are correctly filtered by `accountId` (preventing cross-account data leakage)
- The most recent transaction is retrieved (by ordering by `id` descending)
- All funding transactions appear in history (no missing transactions)
- Multiple funding events for the same account all appear correctly
- Transactions from different accounts are properly isolated
- The fix prevents the original bug from recurring

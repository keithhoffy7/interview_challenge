/**
 * Test for Ticket VAL-201: Email Validation Problems
 * 
 * This test verifies that:
 * - Email validation uses proper format validation (not weak pattern)
 * - Common typos are detected (like .con instead of .com)
 * - Invalid email formats are rejected
 * - Valid email formats are accepted
 */

import { describe, test, expect } from '@jest/globals';
import { validateEmail, normalizeEmail } from '../lib/validation/email';

describe('Email Validation (VAL-201)', () => {
  describe('Valid Email Formats', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@example123.com',
        'a@b.co',
        'user@subdomain.example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });

    test('should accept emails with various TLDs', () => {
      const validEmails = [
        'user@example.com',
        'user@example.org',
        'user@example.net',
        'user@example.edu',
        'user@example.gov',
        'user@example.io',
        'user@example.co.uk',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });

    test('should accept emails with numbers and special characters', () => {
      const validEmails = [
        'user123@example.com',
        'user+tag@example.com',
        'user_name@example.com',
        'user.name@example.com',
        'user-name@example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });
  });

  describe('Invalid Email Formats', () => {
    test('should reject emails without @ symbol', () => {
      const invalidEmails = [
        'userexample.com',
        'user example.com',
        'user@',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject emails with invalid format', () => {
      const invalidEmails = [
        '@example.com',
        'user@',
        'user@@example.com',
        'user@.com',
        'user@example.',
        '.user@example.com',
        'user.@example.com',
        'user@example', // Missing TLD
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject emails with consecutive dots', () => {
      const invalidEmails = [
        'user..name@example.com',
        'user@example..com',
        'user.name..test@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
        if (typeof result === 'string') {
          expect(result).toContain('consecutive dots');
        }
      });
    });

    test('should reject emails without TLD', () => {
      const invalidEmails = [
        'user@example',
        'user@example.',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject emails with TLD less than 2 characters', () => {
      const invalidEmails = [
        'user@example.c',
        'user@example.',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject empty or whitespace-only emails', () => {
      const invalidEmails = [
        '',
        '   ',
        '\t',
        '\n',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
        if (typeof result === 'string') {
          expect(result).toContain('required');
        }
      });
    });
  });

  describe('Common Typo Detection', () => {
    test('should detect .con typo and suggest .com', () => {
      const result = validateEmail('user@example.con');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .c0m typo and suggest .com', () => {
      const result = validateEmail('user@example.c0m');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should not flag .co as typo (valid TLD for Colombia)', () => {
      // .co is a valid TLD, so it should be accepted
      const result = validateEmail('user@example.co');
      expect(result).toBe(true);
    });

    test('should detect .cm typo and suggest .com', () => {
      const result = validateEmail('user@example.cm');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .om typo and suggest .com', () => {
      const result = validateEmail('user@example.om');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .cpm typo and suggest .com', () => {
      const result = validateEmail('user@example.cpm');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .coom typo and suggest .com', () => {
      const result = validateEmail('user@example.coom');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .comm typo and suggest .com', () => {
      const result = validateEmail('user@example.comm');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.com');
      }
    });

    test('should detect .orgn typo and suggest .org', () => {
      const result = validateEmail('user@example.orgn');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.org');
      }
    });

    test('should detect .ogr typo and suggest .org', () => {
      const result = validateEmail('user@example.ogr');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('Did you mean');
        expect(result).toContain('.org');
      }
    });

    test('should provide correct suggestion with original email prefix', () => {
      const result = validateEmail('john.doe@example.con');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toBe('Did you mean "john.doe@example.com"?');
      }
    });
  });

  describe('Weak Pattern Replacement', () => {
    test('should reject emails that weak pattern would accept', () => {
      // Old weak pattern /^\S+@\S+$/i would accept these invalid emails
      const invalidEmails = [
        'user@', // Missing domain
        '@example.com', // Missing local part
        'user@.com', // Invalid domain
        'user@example.', // Missing TLD
        'user@example', // Missing TLD
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should be more strict than the old weak pattern', () => {
      // These would pass the old pattern but should be rejected
      const invalidEmails = [
        'user@example',
        'user@example.',
        '@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Email Normalization', () => {
    test('should normalize email to lowercase', () => {
      const result = normalizeEmail('TEST@EXAMPLE.COM');
      expect(result.email).toBe('test@example.com');
      expect(result.wasLowercased).toBe(true);
    });

    test('should detect when email was lowercased', () => {
      const result1 = normalizeEmail('Test@Example.com');
      expect(result1.wasLowercased).toBe(true);

      const result2 = normalizeEmail('test@example.com');
      expect(result2.wasLowercased).toBe(false);
    });

    test('should trim whitespace', () => {
      const result = normalizeEmail('  test@example.com  ');
      expect(result.email).toBe('test@example.com');
    });

    test('should handle mixed case emails', () => {
      const result = normalizeEmail('TeSt@ExAmPlE.CoM');
      expect(result.email).toBe('test@example.com');
      expect(result.wasLowercased).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long emails', () => {
      const longLocal = 'a'.repeat(64);
      const validEmail = `${longLocal}@example.com`;
      const result = validateEmail(validEmail);
      expect(result).toBe(true);

      const tooLongLocal = 'a'.repeat(65);
      const invalidEmail = `${tooLongLocal}@example.com`;
      const invalidResult = validateEmail(invalidEmail);
      expect(invalidResult).not.toBe(true);
    });

    test('should handle emails with subdomains', () => {
      const validEmails = [
        'user@mail.example.com',
        'user@sub.domain.example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });

    test('should handle special characters in local part', () => {
      const validEmails = [
        'user+tag@example.com',
        'user_name@example.com',
        'user.name@example.com',
        'user-name@example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });
  });

  describe('Root Cause Verification', () => {
    test('should verify weak pattern was replaced', () => {
      // Old pattern: /^\S+@\S+$/i
      // This would accept invalid emails
      const oldPattern = /^\S+@\S+$/i;

      const invalidEmails = [
        'user@example', // Missing TLD - old pattern accepts, new rejects
      ];

      invalidEmails.forEach((email) => {
        // Old pattern would accept these
        const oldResult = oldPattern.test(email);
        // New validation should reject them
        const newResult = validateEmail(email);

        // Note: '@example.com' and 'user@' don't match old pattern either
        // So we test with 'user@example' which old pattern accepts but is invalid
        if (email === 'user@example') {
          expect(oldResult).toBe(true); // Old pattern accepts (bug)
          expect(newResult).not.toBe(true); // New validation rejects (fixed)
        }
      });
    });

    test('should verify typo detection is implemented', () => {
      const typos = [
        'user@example.con',
        'user@example.c0m',
        'user@example.cm',
      ];

      typos.forEach((email) => {
        const result = validateEmail(email);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
        if (typeof result === 'string') {
          expect(result).toContain('Did you mean');
        }
      });
    });
  });
});

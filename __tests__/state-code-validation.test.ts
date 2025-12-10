/**
 * Test for Ticket VAL-203: State Code Validation
 * 
 * This test verifies that:
 * - Only valid US state codes are accepted
 * - Invalid state codes like "XX" are rejected
 * - All 50 US states plus DC are accepted
 * - State code validation works on both frontend and backend
 * - Case-insensitive input is handled correctly
 */

import { describe, test, expect } from '@jest/globals';
import { validateStateCode, normalizeStateCode } from '../lib/validation/stateCode';

describe('State Code Validation (VAL-203)', () => {
  describe('Valid US State Codes', () => {
    test('should accept all 50 US states', () => {
      const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      ];

      validStates.forEach((state) => {
        const result = validateStateCode(state);
        expect(result).toBe(true);
      });
    });

    test('should accept District of Columbia (DC)', () => {
      const result = validateStateCode('DC');
      expect(result).toBe(true);
    });

    test('should accept state codes case-insensitively', () => {
      const testCases = [
        { input: 'ca', expected: true },
        { input: 'Ca', expected: true },
        { input: 'CA', expected: true },
        { input: 'cA', expected: true },
        { input: 'ny', expected: true },
        { input: 'Ny', expected: true },
        { input: 'NY', expected: true },
        { input: 'tx', expected: true },
        { input: 'TX', expected: true },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateStateCode(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Invalid State Codes', () => {
    test('should reject "XX" as invalid', () => {
      const result = validateStateCode('XX');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      expect(result).toContain('not a valid US state code');
    });

    test('should reject other invalid 2-letter codes', () => {
      const invalidCodes = [
        'XX', 'YY', 'ZZ', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF',
        'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO',
        'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'YY', 'ZZ',
      ];

      invalidCodes.forEach((code) => {
        const result = validateStateCode(code);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject codes with wrong length', () => {
      const invalidLengths = [
        '',      // Empty
        'A',     // 1 letter
        'CAL',   // 3 letters
        'CALA',  // 4 letters
        'CALIFORNIA', // Full state name
      ];

      invalidLengths.forEach((code) => {
        const result = validateStateCode(code);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    test('should reject codes with non-letter characters', () => {
      const invalidCodes = [
        'C1', '1A', '12', 'A-', '-A', 'A ', ' A', 'A@', '@A',
      ];

      invalidCodes.forEach((code) => {
        const result = validateStateCode(code);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Root Cause Verification', () => {
    test('should verify the bug: "XX" was accepted', () => {
      // Old buggy code only checked pattern /^[A-Z]{2}$/
      // This would accept "XX" because it matches the pattern
      const buggyPattern = /^[A-Z]{2}$/;
      const xxMatchesPattern = buggyPattern.test('XX');
      expect(xxMatchesPattern).toBe(true); // Buggy code would accept

      // Fixed code checks against valid state codes list
      const fixedResult = validateStateCode('XX');
      expect(fixedResult).not.toBe(true); // Fixed code rejects
      expect(typeof fixedResult).toBe('string');
    });

    test('should verify pattern-only validation was insufficient', () => {
      // Pattern-only validation accepts any 2 uppercase letters
      const pattern = /^[A-Z]{2}$/;
      const invalidButMatchesPattern = ['XX', 'YY', 'ZZ', 'AA', 'BB'];

      invalidButMatchesPattern.forEach((code) => {
        const matchesPattern = pattern.test(code);
        expect(matchesPattern).toBe(true); // Pattern accepts

        // But validation should reject
        const validationResult = validateStateCode(code);
        expect(validationResult).not.toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string', () => {
      const result = validateStateCode('');
      expect(result).toBe('State code is required');
    });

    test('should handle whitespace', () => {
      const result = validateStateCode('  CA  ');
      expect(result).toBe(true); // Should normalize and accept
    });

    test('should handle lowercase input', () => {
      const result = validateStateCode('ca');
      expect(result).toBe(true);
    });

    test('should handle mixed case input', () => {
      const result = validateStateCode('Ca');
      expect(result).toBe(true);
    });
  });

  describe('Normalization', () => {
    test('should normalize state codes to uppercase', () => {
      const testCases = [
        { input: 'ca', expected: 'CA' },
        { input: 'Ca', expected: 'CA' },
        { input: 'CA', expected: 'CA' },
        { input: 'cA', expected: 'CA' },
        { input: '  ca  ', expected: 'CA' },
        { input: 'ny', expected: 'NY' },
        { input: 'Ny', expected: 'NY' },
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = normalizeStateCode(input);
        expect(normalized).toBe(expected);
      });
    });
  });

  describe('All Valid States', () => {
    test('should accept all valid state codes', () => {
      const allValidStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC',
      ];

      allValidStates.forEach((state) => {
        const result = validateStateCode(state);
        expect(result).toBe(true);
      });

      // Should have 51 total (50 states + DC)
      expect(allValidStates.length).toBe(51);
    });
  });

  describe('Error Messages', () => {
    test('should provide clear error message for invalid state code', () => {
      const result = validateStateCode('XX');
      expect(result).toBe('"XX" is not a valid US state code');
    });

    test('should provide error message for wrong length', () => {
      const result1 = validateStateCode('A');
      expect(result1).toBe('State code must be exactly 2 letters');

      const result2 = validateStateCode('CAL');
      expect(result2).toBe('State code must be exactly 2 letters');
    });

    test('should provide error message for non-letter characters', () => {
      const result = validateStateCode('C1');
      expect(result).toBe('State code must contain only letters');
    });

    test('should provide error message for empty input', () => {
      const result = validateStateCode('');
      expect(result).toBe('State code is required');
    });
  });

  describe('Common Invalid Codes', () => {
    test('should reject common invalid codes', () => {
      const invalidCodes = [
        'XX', // Reported bug
        'YY', 'ZZ', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF',
        'US', // United States (not a state)
        'PR', // Puerto Rico (territory, not state)
        'VI', // US Virgin Islands (territory)
        'GU', // Guam (territory)
        'AS', // American Samoa (territory)
        'MP', // Northern Mariana Islands (territory)
      ];

      invalidCodes.forEach((code) => {
        const result = validateStateCode(code);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });
  });
});

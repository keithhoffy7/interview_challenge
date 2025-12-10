/**
 * Test for Ticket VAL-209: Amount Input Issues
 * 
 * This test verifies that:
 * - Amounts with multiple leading zeros are rejected or normalized
 * - Amounts are normalized to remove leading zeros
 * - Transaction records use normalized amounts (no leading zeros)
 * - Confusion in transaction records is prevented
 */

import { describe, test, expect } from '@jest/globals';
import { validateAmount, normalizeAmount } from '../lib/validation/amount';

describe('Amount Input Issues (VAL-209)', () => {
  describe('Multiple Leading Zeros', () => {
    test('should reject amounts with multiple leading zeros', () => {
      const invalidAmounts = [
        '000100.00',
        '001.50',
        '00050.25',
        '00001.00',
        '000000100',
      ];

      invalidAmounts.forEach((amount) => {
        const result = validateAmount(amount);
        expect(result.isValid).not.toBe(true);
        expect(typeof result.isValid).toBe('string');
        expect(result.isValid).toContain('leading zeros');
      });
    });

    test('should accept amounts without leading zeros', () => {
      const validAmounts = [
        '100.00',
        '1.50',
        '50.25',
        '1.00',
        '100',
        '0.01',
      ];

      validAmounts.forEach((amount) => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(true);
      });
    });

    test('should handle single leading zero for amounts less than 1', () => {
      // Single zero before decimal is valid (e.g., "0.50")
      const validAmounts = [
        '0.50',
        '0.01',
        '0.99',
      ];

      validAmounts.forEach((amount) => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Normalization', () => {
    test('should normalize amounts by removing leading zeros', () => {
      const testCases = [
        { input: '000100.00', normalized: '100.00' },
        { input: '001.50', normalized: '1.50' },
        { input: '00050.25', normalized: '50.25' },
        { input: '00001.00', normalized: '1.00' },
        { input: '100.00', normalized: '100.00' }, // No change
        { input: '1.50', normalized: '1.50' }, // No change
      ];

      testCases.forEach(({ input, normalized }) => {
        const normalizedValue = normalizeAmount(input);
        expect(normalizedValue).toBe(normalized);
      });
    });

    test('should normalize zero amounts to "0"', () => {
      const zeroAmounts = ['0', '0.0', '0.00', '00', '000'];

      zeroAmounts.forEach((amount) => {
        const normalized = normalizeAmount(amount);
        // Zero amounts should be normalized to "0" (they'll be rejected by other validation)
        expect(normalized).toBe('0');
      });
    });

    test('should normalize amounts with multiple leading zeros in validation', () => {
      const testCases = [
        { input: '000100.00', shouldReject: true },
        { input: '001.50', shouldReject: true },
        { input: '00050.25', shouldReject: true },
      ];

      testCases.forEach(({ input, shouldReject }) => {
        const result = validateAmount(input);
        if (shouldReject) {
          expect(result.isValid).not.toBe(true);
          // But normalized value should be correct
          const num = parseFloat(result.normalized);
          const expectedNum = parseFloat(input);
          expect(num).toBe(expectedNum); // Numeric value should be same
        }
      });
    });
  });

  describe('Root Cause Verification', () => {
    test('should verify the bug: multiple leading zeros were accepted', () => {
      // Old buggy code: pattern /^\d+\.?\d{0,2}$/ accepts "000100.00"
      const buggyPattern = /^\d+\.?\d{0,2}$/;
      const amountWithLeadingZeros = '000100.00';

      const matchesBuggyPattern = buggyPattern.test(amountWithLeadingZeros);
      expect(matchesBuggyPattern).toBe(true); // Buggy code would accept

      // Fixed code should reject or normalize
      const fixedResult = validateAmount(amountWithLeadingZeros);
      expect(fixedResult.isValid).not.toBe(true); // Fixed code rejects
      expect(fixedResult.isValid).toContain('leading zeros');
    });

    test('should verify pattern-only validation was insufficient', () => {
      // Pattern accepts any digits, including multiple leading zeros
      const pattern = /^\d+\.?\d{0,2}$/;
      const amountsWithLeadingZeros = [
        '000100.00',
        '001.50',
        '00050.25',
      ];

      amountsWithLeadingZeros.forEach((amount) => {
        const matchesPattern = pattern.test(amount);
        expect(matchesPattern).toBe(true); // Pattern accepts

        // But validation should reject or normalize
        const validationResult = validateAmount(amount);
        expect(validationResult.isValid).not.toBe(true);
      });
    });
  });

  describe('Transaction Record Consistency', () => {
    test('should ensure normalized amounts are used in transactions', () => {
      // Amounts with leading zeros should be normalized before processing
      const amountWithZeros = '000100.00';
      const normalized = normalizeAmount(amountWithZeros);
      const numericValue = parseFloat(normalized);

      // Normalized value should be used
      expect(normalized).toBe('100.00');
      expect(numericValue).toBe(100.00);

      // This prevents confusion in transaction records
      expect(normalized).not.toBe(amountWithZeros);
    });

    test('should prevent confusion from different representations of same amount', () => {
      // These all represent the same amount but with different formatting
      const representations = [
        '000100.00',
        '00100.00',
        '0100.00',
        '100.00',
      ];

      // All should normalize to the same value
      const normalizedValues = representations.map(amt => {
        const normalized = normalizeAmount(amt);
        return parseFloat(normalized);
      });

      // All should have the same numeric value
      const firstValue = normalizedValues[0];
      normalizedValues.forEach((value) => {
        expect(value).toBe(firstValue);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle amounts with only zeros', () => {
      const zeroAmounts = ['0', '00', '000', '0.00', '00.00', '000.00'];

      zeroAmounts.forEach((amount) => {
        const result = validateAmount(amount);
        // Should be rejected for being zero (not for leading zeros)
        expect(result.isValid).not.toBe(true);
        expect(result.isValid).toContain('greater than $0.00');
      });
    });

    test('should handle amounts with leading zeros after decimal', () => {
      // Amounts like "1.001" or "1.0001" should be handled
      const amounts = ['1.001', '1.0001'];

      amounts.forEach((amount) => {
        // These might be rejected by format validation (max 2 decimal places)
        const result = validateAmount(amount);
        // Should be rejected for format, not leading zeros
        expect(result.isValid).not.toBe(true);
      });
    });

    test('should handle very large amounts with leading zeros', () => {
      const amount = '00010000.00';
      const result = validateAmount(amount);

      // Should reject for leading zeros
      expect(result.isValid).not.toBe(true);
      expect(result.isValid).toContain('leading zeros');
    });
  });

  describe('Format Validation', () => {
    test('should still validate amount format after normalization', () => {
      const invalidFormats = [
        'abc',
        '100.abc',
        '100.123', // More than 2 decimal places
        '100.1.2', // Multiple decimal points
      ];

      invalidFormats.forEach((amount) => {
        const result = validateAmount(amount);
        expect(result.isValid).not.toBe(true);
      });
    });

    test('should accept valid formats without leading zeros', () => {
      const validAmounts = [
        '100.00',
        '1.50',
        '50.25',
        '100',
        '0.01',
        '9999.99',
      ];

      validAmounts.forEach((amount) => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Normalization Function', () => {
    test('should normalize various leading zero patterns', () => {
      const testCases = [
        { input: '000100.00', expected: '100.00' },
        { input: '001.50', expected: '1.50' },
        { input: '00050.25', expected: '50.25' },
        { input: '00001.00', expected: '1.00' },
        { input: '100.00', expected: '100.00' },
        { input: '1.50', expected: '1.50' },
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = normalizeAmount(input);
        expect(normalized).toBe(expected);
      });
    });

    test('should handle edge cases in normalization', () => {
      const testCases = [
        { input: '0', expected: '0' },
        { input: '00', expected: '0' },
        { input: '000', expected: '0' },
        { input: '0.00', expected: '0' },
        { input: '00.00', expected: '0' },
        { input: '0.50', expected: '0.50' }, // Single zero before decimal is valid
        { input: '0.01', expected: '0.01' }, // Single zero before decimal is valid
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = normalizeAmount(input);
        expect(normalized).toBe(expected);
      });
    });
  });

  describe('Validation Consistency', () => {
    test('should provide consistent validation for same amount in different formats', () => {
      // Same amount, different representations
      const representations = [
        '000100.00',
        '00100.00',
        '0100.00',
        '100.00',
      ];

      // All should normalize to same value
      const normalized = representations.map(amt => normalizeAmount(amt));
      const numericValues = normalized.map(amt => parseFloat(amt));

      // All numeric values should be the same
      const firstValue = numericValues[0];
      numericValues.forEach((value) => {
        expect(value).toBe(firstValue);
      });
    });
  });
});

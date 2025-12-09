/**
 * Test for Ticket VAL-210: Card Type Detection
 * 
 * This test verifies that:
 * - All valid card type prefixes and ranges are properly detected
 * - Previously missing card types are now accepted
 * - Mastercard 2-series (2221-2720) is supported
 * - All Discover ranges are supported (6011, 622126-622925, 644-649, 65)
 * - All Diners Club ranges are supported (300-305, 3095, 36, 38-39)
 * - JCB range 3528-3589 is fully supported
 * - Valid cards that were previously rejected are now accepted
 */

import { describe, test, expect } from '@jest/globals';
import { validateCardNumber } from '../lib/validation/cardNumber';

describe('Card Type Detection (VAL-210)', () => {
  describe('Mastercard 2-Series Support', () => {
    test('should accept Mastercard starting with 2221', () => {
      // Valid Luhn number starting with 2221
      const cardNumber = '2221000000000009'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Mastercard starting with 2225', () => {
      const cardNumber = '2225000000000005'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Mastercard starting with 2300', () => {
      const cardNumber = '2300000000000003'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Mastercard starting with 2500', () => {
      const cardNumber = '2500000000000001'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Mastercard starting with 2700', () => {
      const cardNumber = '2700000000000009'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Mastercard starting with 2720', () => {
      const cardNumber = '2720000000000005'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should reject Mastercard starting with 2220 (below range)', () => {
      const cardNumber = '2220000000000004'; // Below 2221
      const result = validateCardNumber(cardNumber);
      // Should fail either prefix check or Luhn
      expect(result).not.toBe(true);
    });

    test('should reject Mastercard starting with 2721 (above range)', () => {
      const cardNumber = '2721000000000003'; // Above 2720
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });
  });

  describe('Discover Extended Ranges', () => {
    test('should accept Discover starting with 6011', () => {
      const cardNumber = '6011111111111117'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 622126', () => {
      const cardNumber = '6221260000000000'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 622500', () => {
      const cardNumber = '6225000000000006'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 622925', () => {
      const cardNumber = '6229250000000003'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 644', () => {
      const cardNumber = '6440000000000005'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 649', () => {
      const cardNumber = '6490000000000004'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Discover starting with 65', () => {
      const cardNumber = '6500000000000002'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should reject Discover starting with 622125 (below range)', () => {
      const cardNumber = '6221250000000003'; // Below 622126
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check (622125 is below 622126)
      // Note: May fail Luhn instead if prefix matches, but should not be accepted
      expect(result).not.toBe(true);
    });

    test('should reject Discover starting with 622926 (above range)', () => {
      const cardNumber = '6229260000000001'; // Above 622925
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });

    test('should reject Discover starting with 643 (below 644 range)', () => {
      const cardNumber = '6430000000000009'; // Below 644
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });
  });

  describe('Diners Club Extended Ranges', () => {
    test('should accept Diners Club starting with 300', () => {
      const cardNumber = '30000000000004'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Diners Club starting with 305', () => {
      const cardNumber = '30500000000003'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Diners Club starting with 3095', () => {
      const cardNumber = '30950000000000'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Diners Club starting with 36', () => {
      const cardNumber = '36000000000008'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Diners Club starting with 38', () => {
      const cardNumber = '38000000000006'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept Diners Club starting with 39', () => {
      const cardNumber = '39000000000005'; // Valid Luhn checksum (14 digits)
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should reject Diners Club starting with 306 (not in range)', () => {
      const cardNumber = '30600000000002'; // Not in valid range
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });

    test('should reject Diners Club starting with 3094 (not 3095)', () => {
      const cardNumber = '30940000000000'; // Not 3095
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });
  });

  describe('JCB Extended Range', () => {
    test('should accept JCB starting with 3528', () => {
      const cardNumber = '3528000000000007'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept JCB starting with 3555', () => {
      const cardNumber = '3555000000000003'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should accept JCB starting with 3589', () => {
      const cardNumber = '3589000000000003'; // Valid Luhn checksum
      const result = validateCardNumber(cardNumber);
      expect(result).toBe(true);
    });

    test('should reject JCB starting with 3527 (below range)', () => {
      const cardNumber = '3527000000000001'; // Below 3528
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });

    test('should reject JCB starting with 3590 (above range)', () => {
      const cardNumber = '3590000000000009'; // Above 3589
      const result = validateCardNumber(cardNumber);
      // Should fail prefix check
      expect(result).toBe('Invalid card number - unsupported card type');
    });
  });

  describe('Root Cause Verification', () => {
    test('should verify bug: Mastercard 2-series was missing', () => {
      // This card would have been rejected before the fix
      const cardNumber = '2221000000000009'; // Mastercard 2-series
      const result = validateCardNumber(cardNumber);

      // After fix, should be accepted
      expect(result).toBe(true);
    });

    test('should verify bug: Discover 622126-622925 range was missing', () => {
      // This card would have been rejected before the fix
      const cardNumber = '6221260000000000'; // Discover in missing range
      const result = validateCardNumber(cardNumber);

      // After fix, should be accepted
      expect(result).toBe(true);
    });

    test('should verify bug: Discover 644-649 range was missing', () => {
      // This card would have been rejected before the fix
      const cardNumber = '6440000000000005'; // Discover in missing range
      const result = validateCardNumber(cardNumber);

      // After fix, should be accepted
      expect(result).toBe(true);
    });

    test('should verify bug: Diners Club 300-305 range was missing', () => {
      // This card would have been rejected before the fix
      const cardNumber = '30000000000004'; // Diners Club in missing range
      const result = validateCardNumber(cardNumber);

      // After fix, should be accepted
      expect(result).toBe(true);
    });

    test('should verify bug: JCB 3528-3589 range was incomplete', () => {
      // JCB with 35 prefix was accepted, but specific range 3528-3589 wasn't properly validated
      const cardNumber = '3528000000000007'; // JCB in proper range
      const result = validateCardNumber(cardNumber);

      // After fix, should be accepted
      expect(result).toBe(true);
    });
  });

  describe('Previously Rejected Valid Cards', () => {
    test('should accept valid Mastercard 2-series that was previously rejected', () => {
      const testCases = [
        '2221000000000009',
        '2300000000000003',
        '2500000000000001',
        '2700000000000009',
        '2720000000000005',
      ];

      testCases.forEach((cardNumber) => {
        const result = validateCardNumber(cardNumber);
        expect(result).toBe(true);
      });
    });

    test('should accept valid Discover cards that were previously rejected', () => {
      const testCases = [
        '6221260000000000', // Discover 622126-622925 range
        '6225000000000006',
        '6229250000000003',
        '6440000000000005', // Discover 644-649 range
        '6490000000000004',
      ];

      testCases.forEach((cardNumber) => {
        const result = validateCardNumber(cardNumber);
        expect(result).toBe(true);
      });
    });

    test('should accept valid Diners Club cards that were previously rejected', () => {
      const testCases = [
        '30000000000004', // Diners Club 300-305 range
        '30500000000003', // Fixed Luhn
        '30950000000000', // Diners Club 3095
      ];

      testCases.forEach((cardNumber) => {
        const result = validateCardNumber(cardNumber);
        expect(result).toBe(true);
      });
    });

    test('should accept valid JCB cards in proper range', () => {
      const testCases = [
        '3528000000000007', // JCB 3528-3589 range
        '3555000000000003',
        '3589000000000003',
      ];

      testCases.forEach((cardNumber) => {
        const result = validateCardNumber(cardNumber);
        expect(result).toBe(true);
      });
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    test('should handle Mastercard 2-series boundary values', () => {
      // Lower boundary
      const lowerBound = '2221000000000009'; // 2221
      expect(validateCardNumber(lowerBound)).toBe(true);

      // Upper boundary
      const upperBound = '2720000000000005'; // 2720
      expect(validateCardNumber(upperBound)).toBe(true);

      // Just below lower boundary
      const belowLower = '2220000000000004'; // 2220
      const resultBelow = validateCardNumber(belowLower);
      expect(resultBelow).not.toBe(true);

      // Just above upper boundary
      const aboveUpper = '2721000000000003'; // 2721
      const resultAbove = validateCardNumber(aboveUpper);
      expect(resultAbove).toBe('Invalid card number - unsupported card type');
    });

    test('should handle Discover 622126-622925 boundary values', () => {
      // Lower boundary
      const lowerBound = '6221260000000000'; // 622126
      expect(validateCardNumber(lowerBound)).toBe(true);

      // Upper boundary
      const upperBound = '6229250000000003'; // 622925
      expect(validateCardNumber(upperBound)).toBe(true);

      // Just below lower boundary
      const belowLower = '6221250000000003'; // 622125
      const resultBelow = validateCardNumber(belowLower);
      expect(resultBelow).not.toBe(true); // Should be rejected (either prefix or Luhn)

      // Just above upper boundary
      const aboveUpper = '6229260000000009'; // 622926
      const resultAbove = validateCardNumber(aboveUpper);
      expect(resultAbove).toBe('Invalid card number - unsupported card type');
    });

    test('should handle JCB 3528-3589 boundary values', () => {
      // Lower boundary
      const lowerBound = '3528000000000007'; // 3528
      expect(validateCardNumber(lowerBound)).toBe(true);

      // Upper boundary
      const upperBound = '3589000000000003'; // 3589
      expect(validateCardNumber(upperBound)).toBe(true);

      // Just below lower boundary
      const belowLower = '3527000000000001'; // 3527
      const resultBelow = validateCardNumber(belowLower);
      expect(resultBelow).toBe('Invalid card number - unsupported card type');

      // Just above upper boundary
      const aboveUpper = '3590000000000009'; // 3590
      const resultAbove = validateCardNumber(aboveUpper);
      expect(resultAbove).toBe('Invalid card number - unsupported card type');
    });
  });

  describe('Comprehensive Card Type Coverage', () => {
    test('should accept all supported card types', () => {
      const supportedCards = [
        { type: 'Visa', number: '4111111111111111' },
        { type: 'Mastercard 5-series', number: '5105105105105100' },
        { type: 'Mastercard 2-series', number: '2221000000000009' },
        { type: 'American Express', number: '378282246310005' },
        { type: 'Discover 6011', number: '6011111111111117' },
        { type: 'Discover 622126-622925', number: '6221260000000000' },
        { type: 'Discover 644-649', number: '6440000000000005' },
        { type: 'Discover 65', number: '6500000000000002' },
        { type: 'Diners Club 300-305', number: '30000000000004' },
        { type: 'Diners Club 3095', number: '30950000000000' },
        { type: 'Diners Club 36', number: '36000000000008' },
        { type: 'Diners Club 38-39', number: '38000000000006' },
        { type: 'JCB 3528-3589', number: '3528000000000007' },
      ];

      supportedCards.forEach(({ type, number }) => {
        const result = validateCardNumber(number);
        expect(result).toBe(true);
      });
    });
  });
});

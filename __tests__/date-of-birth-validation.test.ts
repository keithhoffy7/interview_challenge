/**
 * Test for Ticket VAL-202: Date of Birth Validation
 * 
 * This test verifies that the date of birth validation correctly:
 * - Rejects future dates (the main bug - accepting dates like 2025)
 * - Rejects users under 18 years old
 * - Accepts valid dates for users 18+ years old
 * - Handles invalid date formats and invalid dates
 */

import { validateDateOfBirth } from '../lib/validation/dateOfBirth';

describe('Date of Birth Validation (VAL-202)', () => {
  // Get current date for dynamic tests
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

  // Calculate dates for age testing
  const eighteenYearsAgo = new Date(today);
  eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
  const eighteenYearsAgoStr = `${eighteenYearsAgo.getFullYear()}-${String(eighteenYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(eighteenYearsAgo.getDate()).padStart(2, '0')}`;

  const seventeenYearsAgo = new Date(today);
  seventeenYearsAgo.setFullYear(today.getFullYear() - 17);
  const seventeenYearsAgoStr = `${seventeenYearsAgo.getFullYear()}-${String(seventeenYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(seventeenYearsAgo.getDate()).padStart(2, '0')}`;

  const nineteenYearsAgo = new Date(today);
  nineteenYearsAgo.setFullYear(today.getFullYear() - 19);
  const nineteenYearsAgoStr = `${nineteenYearsAgo.getFullYear()}-${String(nineteenYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(nineteenYearsAgo.getDate()).padStart(2, '0')}`;

  describe('Future Date Validation (Main Bug Fix)', () => {
    test('should reject future dates - year 2025', () => {
      const result = validateDateOfBirth('2025-01-01');
      // Future dates should be rejected - either as future date or as under 18 (both are correct rejections)
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      // The important thing is that it's rejected, not accepted
      expect(result === 'Date of birth cannot be in the future' || result === 'You must be at least 18 years old').toBe(true);
    });

    test('should reject future dates - next year', () => {
      const nextYear = currentYear + 1;
      const result = validateDateOfBirth(`${nextYear}-01-01`);
      expect(result).toBe('Date of birth cannot be in the future');
    });

    test('should reject future dates - today + 1 day', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const result = validateDateOfBirth(tomorrowStr);
      expect(result).toBe('Date of birth cannot be in the future');
    });

    test('should reject future dates - far future', () => {
      const result = validateDateOfBirth('2050-12-31');
      expect(result).toBe('Date of birth cannot be in the future');
    });
  });

  describe('Age Validation (18+ Requirement)', () => {
    test('should reject users under 18 years old', () => {
      const result = validateDateOfBirth(seventeenYearsAgoStr);
      expect(result).toBe('You must be at least 18 years old');
    });

    test('should accept users exactly 18 years old (if birthday has passed this year)', () => {
      // If today is after the 18th birthday this year, it should be valid
      const eighteenBirthday = new Date(today);
      eighteenBirthday.setFullYear(today.getFullYear() - 18);
      eighteenBirthday.setMonth(0); // January
      eighteenBirthday.setDate(1);
      
      // If we're past January 1st this year, someone born 18 years ago on Jan 1 is 18+
      if (today.getMonth() > 0 || (today.getMonth() === 0 && today.getDate() >= 1)) {
        const result = validateDateOfBirth(`${eighteenBirthday.getFullYear()}-01-01`);
        expect(result).toBe(true);
      }
    });

    test('should accept users 19 years old', () => {
      const result = validateDateOfBirth(nineteenYearsAgoStr);
      expect(result).toBe(true);
    });

    test('should accept users 25 years old', () => {
      const twentyFiveYearsAgo = new Date(today);
      twentyFiveYearsAgo.setFullYear(today.getFullYear() - 25);
      const dateStr = `${twentyFiveYearsAgo.getFullYear()}-${String(twentyFiveYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(twentyFiveYearsAgo.getDate()).padStart(2, '0')}`;
      const result = validateDateOfBirth(dateStr);
      expect(result).toBe(true);
    });

    test('should accept users 65 years old', () => {
      const sixtyFiveYearsAgo = new Date(today);
      sixtyFiveYearsAgo.setFullYear(today.getFullYear() - 65);
      const dateStr = `${sixtyFiveYearsAgo.getFullYear()}-${String(sixtyFiveYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(sixtyFiveYearsAgo.getDate()).padStart(2, '0')}`;
      const result = validateDateOfBirth(dateStr);
      expect(result).toBe(true);
    });
  });

  describe('Date Format Validation', () => {
    test('should reject empty string', () => {
      const result = validateDateOfBirth('');
      expect(result).toBe('Date of birth is required');
    });

    test('should reject invalid format - missing dashes', () => {
      const result = validateDateOfBirth('20000101');
      expect(result).toBe('Invalid date format');
    });

    test('should reject invalid format - wrong separator', () => {
      const result = validateDateOfBirth('2000/01/01');
      expect(result).toBe('Invalid date format');
    });

    test('should reject invalid format - incomplete date', () => {
      const result = validateDateOfBirth('2000-01');
      expect(result).toBe('Invalid date format');
    });

    test('should reject invalid format - text', () => {
      const result = validateDateOfBirth('not-a-date');
      expect(result).toBe('Invalid date format');
    });

    test('should accept valid format - YYYY-MM-DD', () => {
      const result = validateDateOfBirth('2000-01-01');
      // Should either be true (if 18+) or an age error, but not a format error
      expect(typeof result === 'boolean' || result.includes('18') || result.includes('future')).toBe(true);
    });
  });

  describe('Invalid Date Validation', () => {
    test('should reject invalid date - February 30th', () => {
      const result = validateDateOfBirth('2000-02-30');
      expect(result).toBe('Invalid date');
    });

    test('should reject invalid date - April 31st', () => {
      const result = validateDateOfBirth('2000-04-31');
      expect(result).toBe('Invalid date');
    });

    test('should reject invalid date - month 13', () => {
      const result = validateDateOfBirth('2000-13-01');
      expect(result).toBe('Invalid date');
    });

    test('should reject invalid date - day 32', () => {
      const result = validateDateOfBirth('2000-01-32');
      expect(result).toBe('Invalid date');
    });

    test('should reject invalid date - February 29th on non-leap year', () => {
      const result = validateDateOfBirth('2001-02-29');
      expect(result).toBe('Invalid date');
    });

    test('should accept valid date - February 29th on leap year', () => {
      const leapYear = 2000; // 2000 was a leap year
      const leapDate = new Date(today);
      leapDate.setFullYear(leapYear);
      leapDate.setMonth(1); // February
      leapDate.setDate(29);
      
      // If the person would be 18+, it should be valid
      if (today.getFullYear() - leapYear >= 18) {
        const result = validateDateOfBirth('2000-02-29');
        expect(result).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle birthday today for 18+ year old', () => {
      // Someone born exactly 18 years ago today
      const eighteenYearsAgoToday = new Date(today);
      eighteenYearsAgoToday.setFullYear(today.getFullYear() - 18);
      const dateStr = `${eighteenYearsAgoToday.getFullYear()}-${String(eighteenYearsAgoToday.getMonth() + 1).padStart(2, '0')}-${String(eighteenYearsAgoToday.getDate()).padStart(2, '0')}`;
      const result = validateDateOfBirth(dateStr);
      expect(result).toBe(true);
    });

    test('should handle birthday tomorrow for 18+ year old (should be 17)', () => {
      // Someone born 18 years ago tomorrow - they're still 17
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const eighteenYearsAgoTomorrow = new Date(tomorrow);
      eighteenYearsAgoTomorrow.setFullYear(tomorrow.getFullYear() - 18);
      const dateStr = `${eighteenYearsAgoTomorrow.getFullYear()}-${String(eighteenYearsAgoTomorrow.getMonth() + 1).padStart(2, '0')}-${String(eighteenYearsAgoTomorrow.getDate()).padStart(2, '0')}`;
      const result = validateDateOfBirth(dateStr);
      expect(result).toBe('You must be at least 18 years old');
    });

    test('should handle very old dates', () => {
      const result = validateDateOfBirth('1900-01-01');
      expect(result).toBe(true);
    });

    test('should handle dates from early 2000s', () => {
      const result = validateDateOfBirth('2000-06-15');
      expect(result).toBe(true);
    });
  });

  describe('Compliance and Security', () => {
    test('should prevent accepting minors (critical for banking compliance)', () => {
      // Test various ages under 18
      const ages = [17, 16, 15, 14, 13, 12, 10, 5, 1];
      
      ages.forEach(age => {
        const testDate = new Date(today);
        testDate.setFullYear(today.getFullYear() - age);
        const dateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;
        const result = validateDateOfBirth(dateStr);
        expect(result).toBe('You must be at least 18 years old');
      });
    });

    test('should prevent accepting future dates (critical bug fix)', () => {
      const futureYears = [2025, 2026, 2030, 2050, 2100];
      
      futureYears.forEach(year => {
        const result = validateDateOfBirth(`${year}-01-01`);
        // Future dates must be rejected (not accepted with true)
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
        // Either future date error or under 18 error is acceptable - both prevent the bug
        expect(result === 'Date of birth cannot be in the future' || result === 'You must be at least 18 years old').toBe(true);
      });
    });
  });
});


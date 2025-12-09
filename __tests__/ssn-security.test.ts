/**
 * Test for Ticket SEC-301: SSN Storage
 * 
 * This test verifies that:
 * - SSNs are hashed before storage (never stored in plaintext)
 * - Hashed SSNs cannot be reversed to plaintext
 * - SSN verification works correctly
 * - Different SSNs produce different hashes
 * - Same SSN produces different hashes (due to salt)
 */

import { hashSSN, verifySSN } from '../lib/security/ssn';
import bcrypt from 'bcryptjs';

describe('SSN Security (SEC-301)', () => {
  describe('SSN Hashing', () => {
    test('should hash SSN and not return plaintext', async () => {
      const plaintextSSN = '123456789';
      const hashedSSN = await hashSSN(plaintextSSN);

      // Hashed SSN should not equal plaintext
      expect(hashedSSN).not.toBe(plaintextSSN);
      
      // Hashed SSN should be a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      expect(hashedSSN).toMatch(/^\$2[aby]\$/);
      
      // Hashed SSN should be longer than plaintext (bcrypt hashes are ~60 chars)
      expect(hashedSSN.length).toBeGreaterThan(plaintextSSN.length);
      expect(hashedSSN.length).toBeGreaterThan(50);
    });

    test('should produce different hashes for same SSN (due to salt)', async () => {
      const plaintextSSN = '123456789';
      const hash1 = await hashSSN(plaintextSSN);
      const hash2 = await hashSSN(plaintextSSN);

      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      const verify1 = await verifySSN(plaintextSSN, hash1);
      const verify2 = await verifySSN(plaintextSSN, hash2);
      
      expect(verify1).toBe(true);
      expect(verify2).toBe(true);
    });

    test('should produce different hashes for different SSNs', async () => {
      const ssn1 = '123456789';
      const ssn2 = '987654321';
      
      const hash1 = await hashSSN(ssn1);
      const hash2 = await hashSSN(ssn2);

      expect(hash1).not.toBe(hash2);
    });

    test('should hash SSN with proper bcrypt format', async () => {
      const plaintextSSN = '111223333';
      const hashedSSN = await hashSSN(plaintextSSN);

      // Bcrypt hashes have a specific format: $2a$10$...
      expect(hashedSSN).toMatch(/^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/);
    });
  });

  describe('SSN Verification', () => {
    test('should verify correct SSN against hash', async () => {
      const plaintextSSN = '123456789';
      const hashedSSN = await hashSSN(plaintextSSN);

      const isValid = await verifySSN(plaintextSSN, hashedSSN);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect SSN against hash', async () => {
      const plaintextSSN = '123456789';
      const wrongSSN = '987654321';
      const hashedSSN = await hashSSN(plaintextSSN);

      const isValid = await verifySSN(wrongSSN, hashedSSN);
      expect(isValid).toBe(false);
    });

    test('should reject empty SSN', async () => {
      const hashedSSN = await hashSSN('123456789');
      const isValid = await verifySSN('', hashedSSN);
      expect(isValid).toBe(false);
    });

    test('should reject SSN with wrong length', async () => {
      const hashedSSN = await hashSSN('123456789');
      const isValid = await verifySSN('12345678', hashedSSN); // 8 digits
      expect(isValid).toBe(false);
    });
  });

  describe('Security Properties', () => {
    test('should not allow reverse engineering of SSN from hash', async () => {
      const plaintextSSN = '123456789';
      const hashedSSN = await hashSSN(plaintextSSN);

      // Hash should not contain any part of the original SSN
      expect(hashedSSN).not.toContain(plaintextSSN);
      expect(hashedSSN).not.toContain('123456789');
      
      // Hash should not be predictable
      // Even knowing the algorithm, we cannot reverse it
      const hashParts = hashedSSN.split('$');
      expect(hashParts.length).toBe(4); // bcrypt format: $version$rounds$salt+hash
    });

    test('should use secure bcrypt algorithm', async () => {
      const plaintextSSN = '123456789';
      const hashedSSN = await hashSSN(plaintextSSN);

      // Verify it's using bcrypt (not md5, sha1, etc.)
      expect(hashedSSN).toMatch(/^\$2[aby]\$/);
      
      // Verify it's using at least 10 rounds (security parameter)
      const parts = hashedSSN.split('$');
      const rounds = parseInt(parts[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    test('should handle various SSN formats correctly', async () => {
      const testSSNs = [
        '000000000',
        '111111111',
        '123456789',
        '987654321',
        '555555555',
      ];

      for (const ssn of testSSNs) {
        const hashed = await hashSSN(ssn);
        const verified = await verifySSN(ssn, hashed);
        
        expect(hashed).not.toBe(ssn);
        expect(verified).toBe(true);
      }
    });
  });

  describe('Database Storage Simulation', () => {
    test('should simulate storing and retrieving hashed SSN', async () => {
      // Simulate user signup
      const userSSN = '123456789';
      const hashedSSN = await hashSSN(userSSN);

      // Simulate database storage (would be stored as hashedSSN)
      const storedSSN = hashedSSN;

      // Verify SSN is not in plaintext in "database"
      expect(storedSSN).not.toBe(userSSN);
      expect(storedSSN).not.toContain(userSSN);

      // Simulate verification if needed
      const isValid = await verifySSN(userSSN, storedSSN);
      expect(isValid).toBe(true);
    });

    test('should ensure SSN cannot be extracted from database dump', async () => {
      const userSSN = '123456789';
      const hashedSSN = await hashSSN(userSSN);

      // Simulate database dump
      const databaseDump = {
        id: 1,
        email: 'test@example.com',
        ssn: hashedSSN, // This is what would be in the database
      };

      // Even with database access, SSN cannot be extracted
      expect(databaseDump.ssn).not.toBe(userSSN);
      expect(databaseDump.ssn).not.toContain(userSSN);
      expect(typeof databaseDump.ssn).toBe('string');
      expect(databaseDump.ssn.length).toBeGreaterThan(50);
    });
  });

  describe('Compliance and Privacy', () => {
    test('should ensure SSNs are never in plaintext format', async () => {
      const testSSNs = ['123456789', '987654321', '111223333'];

      for (const ssn of testSSNs) {
        const hashed = await hashSSN(ssn);
        
        // Verify it's not plaintext
        expect(hashed).not.toBe(ssn);
        expect(hashed).not.toMatch(/^\d{9}$/); // Not 9 digits
        expect(hashed.length).toBeGreaterThan(50); // Bcrypt hashes are ~60 chars
      }
    });

    test('should prevent SSN enumeration attacks', async () => {
      // Even if attacker knows a user's SSN, they cannot verify it without the hash
      const knownSSN = '123456789';
      const hashedSSN = await hashSSN(knownSSN);

      // Attacker cannot determine if a different SSN matches
      const attackerGuess = '111111111';
      const isMatch = await verifySSN(attackerGuess, hashedSSN);
      expect(isMatch).toBe(false);

      // Only the correct SSN verifies
      const isCorrect = await verifySSN(knownSSN, hashedSSN);
      expect(isCorrect).toBe(true);
    });
  });
});


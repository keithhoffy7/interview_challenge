/**
 * Security utilities for SSN handling
 * SSNs should never be stored in plaintext - always hash them before storage
 */

import bcrypt from "bcryptjs";

/**
 * Hashes an SSN using bcrypt before storage
 * This ensures SSNs are never stored in plaintext in the database
 * 
 * @param ssn - The plaintext SSN (9 digits)
 * @returns The hashed SSN
 */
export async function hashSSN(ssn: string): Promise<string> {
  // Use bcrypt with salt rounds of 10 (same as passwords for consistency)
  return await bcrypt.hash(ssn, 10);
}

/**
 * Verifies an SSN against a hash
 * This can be used for identity verification if needed
 * 
 * @param ssn - The plaintext SSN to verify
 * @param hash - The hashed SSN from the database
 * @returns True if the SSN matches the hash
 */
export async function verifySSN(ssn: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(ssn, hash);
}


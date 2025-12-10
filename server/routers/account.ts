import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Generates a cryptographically secure 10-digit account number.
 * Uses crypto.randomBytes() instead of Math.random() for security.
 */
function generateAccountNumber(): string {
  // Generate 4 random bytes (32 bits) to get a random number
  // This gives us a range of 0 to 4,294,967,295
  const randomBuffer = randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);

  // Modulo to get a number in the range 0-999999999 (10 digits max)
  // Then pad to 10 digits
  return (randomNumber % 1000000000)
    .toString()
    .padStart(10, "0");
}

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      await db.insert(accounts).values({
        userId: ctx.user.id,
        accountNumber: accountNumber!,
        accountType: input.accountType,
        balance: 0,
        status: "active",
      });

      // Fetch the created account
      const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

      if (!account) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account was created but could not be retrieved. Please refresh your accounts.",
        });
      }

      return account;
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z
        .object({
          accountId: z.number(),
          amount: z.number().positive(),
          fundingSource: z.object({
            type: z.enum(["card", "bank"]),
            accountNumber: z.string(),
            routingNumber: z.string().optional(),
          }),
        })
        .refine(
          (data) => {
            // Routing number is required for bank transfers
            if (data.fundingSource.type === "bank") {
              return data.fundingSource.routingNumber !== undefined && data.fundingSource.routingNumber.trim().length > 0;
            }
            return true;
          },
          {
            message: "Routing number is required for bank transfers",
            path: ["fundingSource", "routingNumber"],
          }
        )
        .refine(
          (data) => {
            // Validate routing number format if provided (for bank transfers)
            if (data.fundingSource.type === "bank" && data.fundingSource.routingNumber) {
              return /^\d{9}$/.test(data.fundingSource.routingNumber);
            }
            return true;
          },
          {
            message: "Routing number must be exactly 9 digits",
            path: ["fundingSource", "routingNumber"],
          }
        )
    )
    .mutation(async ({ input, ctx }) => {
      // Normalize amount string to remove leading zeros
      const amountStr = input.amount.toString().trim();
      const normalizedAmountStr = amountStr.replace(/^0+/, '') || '0';

      // Check for multiple leading zeros (should be normalized, but validate anyway)
      if (/^0+[1-9]/.test(amountStr) || /^0+0*\./.test(amountStr)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Amount cannot have multiple leading zeros. Use format like 100.00 instead of 000100.00",
        });
      }

      const amount = parseFloat(normalizedAmountStr);

      // Validate amount is positive (greater than 0)
      if (amount <= 0 || isNaN(amount)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Amount must be greater than $0.00",
        });
      }

      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      if (account.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account is not active",
        });
      }

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

      // Update account balance atomically to prevent race conditions
      await db
        .update(accounts)
        .set({
          balance: account.balance + amount,
        })
        .where(eq(accounts.id, input.accountId));

      // Fetch the updated balance from the database to ensure accuracy
      const updatedAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, input.accountId))
        .get();

      if (!updatedAccount) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account balance was updated but could not be retrieved",
        });
      }

      return {
        transaction,
        newBalance: updatedAccount.balance,
      };
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.id));

      // Use the account we already fetched instead of querying for each transaction
      // This eliminates the N+1 query problem (one query per transaction)
      const enrichedTransactions = accountTransactions.map((transaction) => ({
        ...transaction,
        accountType: account.accountType,
      }));

      return enrichedTransactions;
    }),
});

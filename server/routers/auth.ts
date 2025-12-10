import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashSSN } from "@/lib/security/ssn";
import { validateStateCode, normalizeStateCode } from "@/lib/validation/stateCode";
import { validatePhoneNumber } from "@/lib/validation/phoneNumber";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email().toLowerCase(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z
          .string()
          .refine(
            (val) => {
              const result = validatePhoneNumber(val);
              return result === true;
            },
            {
              message: "Invalid phone number format",
            }
          ),
        dateOfBirth: z.string(),
        ssn: z.string().regex(/^\d{9}$/),
        address: z.string().min(1),
        city: z.string().min(1),
        state: z
          .string()
          .length(2)
          .toUpperCase()
          .refine(
            (val) => {
              const result = validateStateCode(val);
              return result === true;
            },
            {
              message: "Invalid US state code",
            }
          ),
        zipCode: z.string().regex(/^\d{5}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const hashedSSN = await hashSSN(input.ssn);

      await db.insert(users).values({
        ...input,
        password: hashedPassword,
        ssn: hashedSSN,
      });

      // Fetch the created user
      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Invalidate all existing sessions for this user before creating a new one
      // This ensures only one active session per user at a time
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      // Set cookie
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined, ssn: undefined }, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email().toLowerCase(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Invalidate all existing sessions for this user before creating a new one
      // This ensures only one active session per user at a time
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined, ssn: undefined }, token };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Clear cookie regardless of session status (defense in depth)
    // This ensures cookie is cleared even if session deletion fails
    // Use Expires in the past to ensure immediate clearing across all browsers
    const pastDate = new Date(0).toUTCString();
    const clearCookieHeader = `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=${pastDate}`;

    if ("setHeader" in ctx.res) {
      ctx.res.setHeader("Set-Cookie", clearCookieHeader);
    } else {
      (ctx.res as Headers).set("Set-Cookie", clearCookieHeader);
    }

    // If no user is logged in, return success (cookie already cleared)
    if (!ctx.user) {
      return { success: true, message: "No active session" };
    }

    // Get the session token using the same logic as createContext
    let token: string | undefined;

    // Extract cookie header using the same method as createContext
    let cookieHeader = "";
    if (ctx.req.headers?.cookie) {
      // Next.js Pages request
      cookieHeader = ctx.req.headers.cookie;
    } else if (ctx.req.headers?.get) {
      // Fetch request (App Router)
      cookieHeader = ctx.req.headers.get("cookie") || "";
    } else if ("cookies" in ctx.req && (ctx.req as any).cookies) {
      // Direct cookies object
      token = (ctx.req as any).cookies.session;
    }

    // Parse cookies if we have a cookie header
    if (!token && cookieHeader) {
      const cookiesObj = Object.fromEntries(
        cookieHeader
          .split("; ")
          .filter(Boolean)
          .map((c: string) => {
            const [key, ...val] = c.split("=");
            return [key, val.join("=")];
          })
      );
      token = cookiesObj.session;
    }

    // If no token found but user exists, session might already be invalidated
    // Still return success since cookie is cleared
    if (!token) {
      return { success: true, message: "Session token not found, but cookie cleared" };
    }

    // Verify session exists before deletion
    const session = await db.select().from(sessions).where(eq(sessions.token, token)).get();

    if (!session) {
      // Session doesn't exist, but cookie already cleared
      return { success: true, message: "Session already invalidated" };
    }

    // Delete session from database
    await db.delete(sessions).where(eq(sessions.token, token));

    // Verify session was actually deleted
    const deletedSession = await db.select().from(sessions).where(eq(sessions.token, token)).get();

    if (deletedSession) {
      // Session still exists - deletion failed
      // Cookie is already cleared, but we should still report the error
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete session. Please try again.",
      });
    }

    return { success: true, message: "Logged out successfully" };
  }),
});

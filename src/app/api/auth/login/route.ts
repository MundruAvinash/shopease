
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/lib/db";

import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from "@/lib/loginRateLimit";

export async function POST(request: NextRequest) {
 
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check whether login attempts are blocked
    const rateLimit = await checkLoginRateLimit(normalizedEmail);

    if (rateLimit.blocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed login attempts. Try again after 15 minutes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    // 2. Find the user
    const [rows] = await db.execute(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      password_hash: string;
      role: "user" | "admin";
    }[];

    // 3. Record failed attempt for an unknown email
    if (users.length === 0) {
      const result = await recordFailedLogin(normalizedEmail);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          attemptsRemaining: Math.max(0, 5 - result.attempts),
        },
        {
          status: 401,
        }
      );
    }

    const user = users[0];

    // 4. Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      const result = await recordFailedLogin(normalizedEmail);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          attemptsRemaining: Math.max(0, 5 - result.attempts),
        },
        {
          status: 401,
        }
      );
    }

    // 5. Reset attempts after successful login
    await resetLoginAttempts(normalizedEmail);

    // 6. Validate JWT secret
    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("AUTH_SECRET must contain at least 32 characters");
    }

    // 7. Generate JWT
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("shopease")
      .setAudience("shopease-users")
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(secret));

    // 8. Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // 9. Set HTTP-only cookie
    response.cookies.set("shopease_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in" },
      { status: 500 }
    );
  }
}

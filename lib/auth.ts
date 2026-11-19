
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "./db";

export interface AuthUser {
  userId: number;
  email: string;
  role: "user" | "admin";
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = (await cookies()).get("shopease_token")?.value;
    const secret = process.env.AUTH_SECRET;

    if (!token || !secret || secret.length < 32) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"], 
        issuer: "shopease",
        audience: "shopease-users",
      }
    );

    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    const [rows] = await db.execute(
      `SELECT id, email, role
       FROM users
       WHERE id = ? AND email = ?
       LIMIT 1`,
      [payload.userId, payload.email]
    );

    const users = rows as {
      id: number;
      email: string;
      role: "user" | "admin";
    }[];

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    if (user.role !== "user" && user.role !== "admin") {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required. Please log in.",
      },
      { status: 401 }
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        message: "Forbidden. Admin access required.",
      },
      { status: 403 }
    );
  }

  return null;
}

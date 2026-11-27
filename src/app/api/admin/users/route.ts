import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireOwnerAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Only Owner Admin can create admin accounts.
    const authError = await requireOwnerAdmin();

    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, password and role are required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid input." },
        { status: 400 }
      );
    }

    // This endpoint cannot create another Owner Admin.
    const allowedRoles = ["admin", "employee_admin"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin role." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate name and email.
    if (
      !normalizedName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid name and email." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Check whether the email is already registered.
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if ((existingUsers as unknown[]).length > 0) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    // Hash the password before saving it.
    const passwordHash = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [normalizedName, normalizedEmail, passwordHash, role]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create admin account.",
      },
      { status: 500 }
    );
  }
}
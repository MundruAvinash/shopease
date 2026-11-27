
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to view your profile",
        },
        { status: 401 }
      );
    }

    const [rows] = await db.execute(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [currentUser.userId]
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      role: "user" | "admin" | "Owner_admin" | "employee_admin";
      created_at: Date;
    }[];

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User profile not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile fetched successfully",
      data: users[0],
    });
  } catch (error) {
    console.error("GET Profile Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

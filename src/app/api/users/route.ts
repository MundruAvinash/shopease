import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  requireAdmin,
  requireOwnerAdmin,
} from "@/lib/auth";

// GET /api/users
// Any admin can view the user list.
export async function GET() {
  const denied = await requireAdmin();

  if (denied) {
    return denied;
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const [rows] = await db.execute(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      currentUser: {
        id: currentUser.userId,
        role: currentUser.role,
      },
      users: rows,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH /api/users
// Only the owner can revoke an employee admin's admin access.
export async function PATCH(request: NextRequest) {
  const denied = await requireOwnerAdmin();

  if (denied) {
    return denied;
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const targetUserId = Number(body.targetUserId);

    if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid targetUserId is required" },
        { status: 400 }
      );
    }

    // Prevent the owner from changing their own access.
    if (targetUserId === currentUser.userId) {
      return NextResponse.json(
        { success: false, message: "You cannot change your own access" },
        { status: 403 }
      );
    }

    // Only employee admins can be downgraded by this endpoint.
    const [result] = await db.execute(
      `UPDATE users
       SET role = 'user'
       WHERE id = ? AND role = 'employee_admin'`,
      [targetUserId]
    );

    const updateResult = result as ResultSetHeader;

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee admin not found or access was already changed",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Employee admin access has been removed",
    });
  } catch (error) {
    console.error("Revoke employee admin access error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update user access" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const adminRoles = ["admin", "owner_admin", "employee_admin"];

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in.",
        },
        { status: 401 }
      );
    }

    if (!adminRoles.includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(`
      SELECT
        c.id,
        c.customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        c.status,
        c.created_at,
        c.updated_at,
        (
          SELECT m.message
          FROM support_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS last_message
      FROM support_conversations c
      JOIN users u ON u.id = c.customer_id
      ORDER BY c.updated_at DESC, c.id DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET Admin Messages Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch conversations.",
      },
      { status: 500 }
    );
  }
}
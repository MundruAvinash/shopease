import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Only regular customers can use this API.
const customerRole = "user";

export async function GET() {
  try {
    // 1. Find who is currently logged in.
    const currentUser = await getCurrentUser();

    // 2. If nobody is logged in, reject the request.
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    // 3. This API is for customers, not admins.
    if (currentUser.role !== customerRole) {
      return NextResponse.json(
        { success: false, message: "Customer access required." },
        { status: 403 }
      );
    }

    // 4. Find conversations belonging to this customer.
    const [rows] = await db.execute(
      `SELECT id, customer_id, status, created_at, updated_at
       FROM support_conversations
       WHERE customer_id = ?
       ORDER BY updated_at DESC, id DESC`,
      [currentUser.userId]
    );

    // 5. Send the conversations back to the frontend.
    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET Customer Conversations Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 1. Identify the logged-in customer.
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    if (currentUser.role !== customerRole) {
      return NextResponse.json(
        { success: false, message: "Customer access required." },
        { status: 403 }
      );
    }

    // 2. Look for this customer's latest open conversation.
    const [rows] = await db.execute(
      `SELECT id, customer_id, status
       FROM support_conversations
       WHERE customer_id = ? AND status = 'open'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [currentUser.userId]
    );

    const conversations = rows as {
      id: number;
      customer_id: number;
      status: "open" | "closed";
    }[];

    // 3. If one exists, return it instead of creating another.
    if (conversations.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Existing conversation found.",
        conversation: conversations[0],
      });
    }

    // 4. Otherwise, create a new conversation for this customer.
    const [result] = await db.execute(
      `INSERT INTO support_conversations (customer_id)
       VALUES (?)`,
      [currentUser.userId]
    );

    const insertResult = result as { insertId: number };

    // 5. Return the new conversation ID.
    return NextResponse.json(
      {
        success: true,
        message: "Conversation created.",
        conversation: {
          id: insertResult.insertId,
          customer_id: currentUser.userId,
          status: "open",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Customer Conversation Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create conversation." },
      { status: 500 }
    );
  }
}
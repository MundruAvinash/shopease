import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const adminRoles = ["admin", "owner_admin", "employee_admin"];

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

async function authorizeAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Please log in.",
        },
        { status: 401 }
      ),
    };
  }

  if (!adminRoles.includes(currentUser.role)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: currentUser,
    response: null,
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await authorizeAdmin();

    if (auth.response) {
      return auth.response;
    }

    const { conversationId } = await context.params;
    const id = Number(conversationId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid conversation ID.",
        },
        { status: 400 }
      );
    }

    const [conversationRows] = await db.execute(
      `SELECT id, customer_id, status
       FROM support_conversations
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const conversations = conversationRows as {
      id: number;
      customer_id: number;
      status: "open" | "closed";
    }[];

    if (conversations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    const [messageRows] = await db.execute(
      `SELECT
         m.id,
         m.conversation_id,
         m.sender_id,
         m.sender_role,
         m.message,
         m.created_at,
         u.name AS sender_name
       FROM support_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      conversation: conversations[0],
      data: messageRows,
    });
  } catch (error) {
    console.error("GET Conversation Messages Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch messages.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await authorizeAdmin();

    if (auth.response) {
      return auth.response;
    }

    const { conversationId } = await context.params;
    const id = Number(conversationId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid conversation ID.",
        },
        { status: 400 }
      );
    }

    let body: { message?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message || message.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message must contain 1–5000 characters.",
        },
        { status: 400 }
      );
    }

    const [conversationRows] = await db.execute(
      `SELECT id, status
       FROM support_conversations
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const conversations = conversationRows as {
      id: number;
      status: "open" | "closed";
    }[];

    if (conversations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    if (conversations[0].status === "closed") {
      return NextResponse.json(
        {
          success: false,
          message: "This conversation is closed.",
        },
        { status: 409 }
      );
    }

    const [result] = await db.execute(
      `INSERT INTO support_messages
         (conversation_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        auth.user!.userId,
        auth.user!.role,
        message,
      ]
    );

    await db.execute(
      `UPDATE support_conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully.",
        data: {
          id: (result as { insertId: number }).insertId,
          conversation_id: id,
          sender_id: auth.user!.userId,
          sender_role: auth.user!.role,
          message,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Conversation Message Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message.",
      },
      { status: 500 }
    );
  }
}
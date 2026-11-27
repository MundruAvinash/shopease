import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Find the user by email.
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
       
    const [dbInfo] = await db.execute<RowDataPacket[]>(
  "SELECT DATABASE() AS databaseName"
);

console.log("API database:", dbInfo[0]?.databaseName);



    const user = rows[0];

    // Return the same message whether the account exists or not.
    // This prevents revealing which emails are registered.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, a reset link will be sent.",
      });
    }

    // Generate a secure, random token.
    const resetToken = randomBytes(32).toString("hex");

    // Store only the token's SHA-256 hash in the database.
    const tokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // The reset link will expire after 30 minutes.
    await db.execute(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))`,
      [user.id, tokenHash]
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured");
    }

    const resetUrl =
      `${appUrl}/reset-password?token=${resetToken}`;

    // Send the reset link to the user's email.
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process the request right now." },
      { status: 500 }
    );
  }
}
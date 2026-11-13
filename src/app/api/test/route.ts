
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    await db.query("SELECT 1");

    return NextResponse.json({
      success: true,
      message: "MySQL database connected successfully!",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}

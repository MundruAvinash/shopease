
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    const [products] = await db.execute(
      "SELECT * FROM products"
    );

    return NextResponse.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("GET Products Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch all products (public)
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

// POST: Create a product (admin only)
export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    const {
      name,
      description,
      price,
      category,
      stock,
      image_url,
    } = body;

    if (!name || price === undefined || Number(price) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and a valid price are required",
        },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `INSERT INTO products
       (name, description, price, category, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description ?? null,
        price,
        category ?? null,
        stock ?? 0,
        image_url ?? null,
      ]
    );

    // Invalidate cached product data after successful insertion
    revalidateTag("products", "max");

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        productId: (result as { insertId: number }).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Products Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 }
    );
  }
}

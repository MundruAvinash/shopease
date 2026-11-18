
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch one product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    const products = rows as object[];

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product fetched successfully",
      data: products[0],
    });
  } catch (error) {
    console.error("GET Product by ID Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT: Update product (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

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
        { success: false, message: "Name and valid price are required" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `UPDATE products
       SET name = ?, description = ?, price = ?,
           category = ?, stock = ?, image_url = ?
       WHERE id = ?`,
      [
        name,
        description ?? null,
        price,
        category ?? null,
        stock ?? 0,
        image_url ?? null,
        productId,
      ]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found or no changes made" },
        { status: 404 }
      );
    }

    // Invalidate cached product data after successful update
    revalidateTag("products", "max");

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("PUT Product Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE: Delete product (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      "DELETE FROM products WHERE id = ?",
      [productId]
    );

    const deleteResult = result as { affectedRows: number };

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Invalidate cached product data after successful deletion
    revalidateTag("products", "max");

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}

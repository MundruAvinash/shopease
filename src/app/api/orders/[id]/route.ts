
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch one order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );

    const orders = rows as object[];

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order fetched successfully",
      data: orders[0],
    });
  } catch (error) {
    console.error("GET Order by ID Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT: Update order (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      customer_name,
      email,
      phone,
      address,
      total_amount,
      status,
    } = body;

    const allowedStatus = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (
      !customer_name ||
      !email ||
      !address ||
      total_amount === undefined ||
      !Number.isFinite(Number(total_amount)) ||
      Number(total_amount) <= 0 ||
      (status !== undefined && !allowedStatus.includes(status))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing order details" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `UPDATE orders
       SET customer_name = ?,
           email = ?,
           phone = ?,
           address = ?,
           total_amount = ?,
           status = ?
       WHERE id = ?`,
      [
        customer_name,
        email,
        phone ?? null,
        address,
        total_amount,
        status ?? "Pending",
        orderId,
      ]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found or no changes made" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("PUT Order Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE: Delete order (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );

    const deleteResult = result as { affectedRows: number };

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Order Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete order" },
      { status: 500 }
    );
  }
}

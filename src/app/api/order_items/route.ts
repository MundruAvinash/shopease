
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch all order items
export async function GET() {
  try {
    const [orderItems] = await db.execute(`
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        o.customer_name,
        p.name AS product_name
      FROM order_items AS oi
      INNER JOIN orders AS o ON oi.order_id = o.id
      INNER JOIN products AS p ON oi.product_id = p.id
      ORDER BY oi.id DESC
    `);

    return NextResponse.json({
      success: true,
      message: "Order items fetched successfully",
      data: orderItems,
    });
  } catch (error) {
    console.error("GET Order Items Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order items",
      },
      { status: 500 }
    );
  }
}

// POST: Add multiple products to an existing order
export async function POST(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();

    const orderId = Number(body.order_id);
    const items = body.items;

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid order ID and product items are required",
        },
        { status: 400 }
      );
    }

    const quantities = new Map<number, number>();

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID or quantity",
          },
          { status: 400 }
        );
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    await connection.beginTransaction();

    // Lock and verify the order
    const [orderRows] = await connection.execute(
      "SELECT id FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    if ((orderRows as object[]).length === 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    let addedAmount = 0;

    for (const [productId, quantity] of quantities) {
      // Lock product row
      const [productRows] = await connection.execute(
        `SELECT id, name, price, stock
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [productId]
      );

      const products = productRows as {
        id: number;
        name: string;
        price: string;
        stock: number | null;
      }[];

      if (products.length === 0) {
        throw new Error(`Product ID ${productId} not found`);
      }

      const product = products[0];
      const availableStock = Number(product.stock ?? 0);

      if (availableStock < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${availableStock}`
        );
      }

      addedAmount += Number(product.price) * quantity;

      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, productId, quantity, product.price]
      );

      await connection.execute(
        `UPDATE products
         SET stock = stock - ?
         WHERE id = ?`,
        [quantity, productId]
      );
    }

    // Recalculate total from all order items
    await connection.execute(
      `UPDATE orders
       SET total_amount = (
         SELECT COALESCE(SUM(quantity * price), 0)
         FROM order_items
         WHERE order_id = ?
       )
       WHERE id = ?`,
      [orderId, orderId]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Products added to order successfully",
        orderId,
        addedAmount: addedAmount.toFixed(2),
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    console.error("POST Order Items Error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to add products to order";

    const status =
      message.includes("not found") ||
      message.includes("Insufficient stock")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  } finally {
    connection.release();
  }
}

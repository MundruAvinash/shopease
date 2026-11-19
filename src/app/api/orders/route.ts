
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";


// GET: Admin fetches all orders; customers fetch only their own
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to view orders",
        },
        { status: 401 }
      );
    }

    let orders;

    if (user.role === "admin") {
      const [rows] = await db.execute(
        "SELECT * FROM orders ORDER BY created_at DESC"
      );
      orders = rows;
    } else {
      const [rows] = await db.execute(
        `SELECT *
         FROM orders
         WHERE email = ?
         ORDER BY created_at DESC`,
        [user.email]
      );
      orders = rows;
    }

    return NextResponse.json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("GET Orders Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// POST: Create an order for the authenticated customer
export async function POST(request: Request) {
    //CRSF protection 
 
  // Authenticate before acquiring a database connection
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Please log in before placing an order",
      },
      { status: 401 }
    );
  }

  let connection;
  let transactionStarted = false;

  try {
    const body = await request.json();

    const { phone, address, items } = body;

    // Get trusted customer details from the database
    const [userRows] = await db.execute(
      `SELECT name, email
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [user.userId]
    );

    const customers = userRows as {
      name: string;
      email: string;
    }[];

    if (customers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer account not found",
        },
        { status: 404 }
      );
    }

    const customer = customers[0];

    // Validate checkout information
    if (
      typeof address !== "string" ||
      !address.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery address is required",
        },
        { status: 400 }
      );
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number",
        },
        { status: 400 }
      );
    }

    // Validate cart items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one product is required",
        },
        { status: 400 }
      );
    }

    // Combine duplicate product IDs
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

      const newQuantity =
        (quantities.get(productId) || 0) + quantity;

      if (!Number.isSafeInteger(newQuantity)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid total product quantity",
          },
          { status: 400 }
        );
      }

      quantities.set(productId, newQuantity);
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    const orderProducts: {
      id: number;
      name: string;
      price: string;
      stock: number | null;
    }[] = [];

    let totalAmount = 0;

    // Lock product rows and validate stock
    for (const [productId, quantity] of quantities) {
      const [rows] = await connection.execute(
        `SELECT id, name, price, stock
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [productId]
      );

      const products = rows as {
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

      orderProducts.push(product);

      totalAmount += Number(product.price) * quantity;
    }

    // Create order using authenticated customer details
    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (customer_name, email, phone, address, total_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.email,
        phone?.trim() || null,
        address.trim(),
        totalAmount.toFixed(2),
      ]
    );

    const orderId = (
      orderResult as { insertId: number }
    ).insertId;

    // Insert order items and reduce product stock
    for (const product of orderProducts) {
      const quantity = quantities.get(product.id)!;

      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [
          orderId,
          product.id,
          quantity,
          product.price,
        ]
      );

      await connection.execute(
        `UPDATE products
         SET stock = stock - ?
         WHERE id = ?`,
        [quantity, product.id]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        orderId,
        totalAmount: totalAmount.toFixed(2),
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    console.error("POST Orders Error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create order";

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
    connection?.release();
  }
}

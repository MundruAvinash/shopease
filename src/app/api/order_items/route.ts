import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

// GET API: Fetch all order items with order and product details
export async function GET() {
  try {
    // Join order_items with orders and products
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

    // Return the order items
    return NextResponse.json({
      success: true,
      message: "Order items fetched successfully",
      data: orderItems,
    });

  } catch (error) {
    // Display the actual error in the terminal
    console.error("GET Order Items Error:", error);

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order items",
      },
      { status: 500 }
    );
  }
}


// POST API: Add a product to an existing order
export async function POST(request: Request) {
  try {
    // Read the JSON data sent by Thunder Client
    const body = await request.json();

    // Extract order and product information
    const { order_id, product_id, quantity } = body;

    // Validate the required values
    if (
      !Number.isInteger(Number(order_id)) ||
      Number(order_id) <= 0 ||
      !Number.isInteger(Number(product_id)) ||
      Number(product_id) <= 0 ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid order ID, product ID and quantity are required",
        },
        { status: 400 }
      );
    }

    // Check whether the order and product exist
    const [orders] = await db.execute(
      "SELECT id FROM orders WHERE id = ?",
      [Number(order_id)]
    );

    const [products] = await db.execute(
      "SELECT id, price, stock FROM products WHERE id = ?",
      [Number(product_id)]
    );

    // Return 404 if the order does not exist
    if ((orders as object[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Return 404 if the product does not exist
    if ((products as object[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Get the product's price and available stock
    const product = (products as {
      id: number;
      price: string;
      stock: number;
    }[])[0];

    // Check whether enough stock is available
    if (product.stock < Number(quantity)) {
      return NextResponse.json(
        { success: false, message: "Insufficient product stock" },
        { status: 400 }
      );
    }

    // Save the product in the order_items table
    const [result] = await db.execute(
      `INSERT INTO order_items
       (order_id, product_id, quantity, price)
       VALUES (?, ?, ?, ?)`,
      [
        Number(order_id),
        Number(product_id),
        Number(quantity),
        product.price,
      ]
    );

    // Get the newly created order item ID
    const itemId = (result as { insertId: number }).insertId;

    // Return the success response
    return NextResponse.json(
      {
        success: true,
        message: "Product added to order successfully",
        itemId,
      },
      { status: 201 }
    );

  } catch (error) {
    // Display the actual error in the terminal
    console.error("POST Order Items Error:", error);

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product to order",
      },
      { status: 500 }
    );
  }
}
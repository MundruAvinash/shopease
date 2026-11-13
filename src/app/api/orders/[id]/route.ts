import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

// GET API: Fetch one order using its ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the order ID from the URL
    const { id } = await params;

    // Convert the URL ID into a number
    const orderId = Number(id);

    // Validate the order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Fetch the matching order from MySQL
    const [rows] = await db.execute(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );

    // Convert the database result into an array
    const orders = rows as object[];

    // Check whether the order exists
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Return the matching order
    return NextResponse.json({
      success: true,
      message: "Order fetched successfully",
      data: orders[0],
    });

  } catch (error) {
    // Print the actual error in the terminal
    console.error("GET Order by ID Error:", error);

    // Return an error response
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}



//PUT API : Update an existing order using its ID 
export async function PUT(
  request:Request,
  {params} : {params:Promise< {id:string } >}
){
  try{
    //GET the order ID from the URL
    const { id } =await params;
    const orderId = Number(id);

    //validation the order ID
    if(!Number.isInteger(orderId)|| orderId<= 0){
      return NextResponse.json(
        {success: false, message: "Invalide order ID "},
        {status : 400}
      );

    }

    // Read update order details from the request body
    const body = await request.json();

    //Extract the order fields
        const{
          customer_name,
          email,
          phone,
          address,
          total_amount,
          status,
        } = body;

        //Validation required fields
        const allowedStatus = [
          "Pending",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ];

        if(
          !customer_name ||
          !email ||
          !address ||
          total_amount === undefined ||
          !Number.isFinite(Number(total_amount)) ||
          Number(total_amount) <= 0 ||
          (status !== undefined && !allowedStatus.includes(status))
        ){
          return NextResponse.json(
            {succeess: false, message:"Invalid or missing order details"},
            {status : 400}
          );
        }
         // Update the matching order in MySQL
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

    // Check whether an order was updated
    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found or no changes made" },
        { status: 404 }
      );
    }

    // Return a success response
    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    });

  } catch (error) {
    // Display the actual error in the terminal
    console.error("PUT Order Error:", error);

    // Return an error response
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}
  

// DELETE API: Delete an order using its ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the order ID from the URL
    const { id } = await params;

    // Convert the ID into a number
    const orderId = Number(id);

    // Validate the order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Delete the order from the database
    const [result] = await db.execute(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );

    // Get the number of deleted rows
    const deleteResult = result as { affectedRows: number };

    // Check whether the order exists
    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Return the success response
    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });

  } catch (error) {
    // Print the actual error in the terminal
    console.error("DELETE Order Error:", error);

    // Return an error response
    return NextResponse.json(
      { success: false, message: "Failed to delete order" },
      { status: 500 }
    );
  }
}
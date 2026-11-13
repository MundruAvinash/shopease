
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

// GET API: Fetch one product using its ID
// params contains the dynamic ID from the URL
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from the URL
    const { id } = await params;

    // Convert the URL ID from string to number
    const productId = Number(id);

    // Check whether the ID is a valid positive number
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Search for a product with the matching ID
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    // Convert database results into a product array
    const products = rows as object[];

    // Return 404 if the product does not exist
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Return the matching product
    return NextResponse.json({
      success: true,
      message: "Product fetched successfully",
      data: products[0],
    });

  } catch (error) {
    // Display the actual error in the terminal
    console.error("GET Product by ID Error:", error);

    // Send an error response to the client
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}



// PUT API: Update an existing product using its ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the product ID from the URL
    const { id } = await params;
    const productId = Number(id);

    // Check whether the product ID is valid
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Read the updated product details from the request body
    const body = await request.json();

    // Extract product fields from the body
    const { name, description, price, category, stock, image_url } = body;

    // Check whether required fields are provided
    if (!name || price === undefined || Number(price) <= 0) {
      return NextResponse.json(
        { success: false, message: "Name and valid price are required" },
        { status: 400 }
      );
    }

    // Update the matching product in the MySQL database
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

    // Check whether a product with this ID exists
    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found or no changes made" },
        { status: 404 }
      );
    }

    // Return a success response
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });

  } catch (error) {
    // Display errors in the terminal
    console.error("PUT Product Error:", error);

    // Return an error response
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}


//DELETE API: Delete a product using its ID
export async function DELETE(
  request: Request,
  {params}: {params: Promise<{id: string}>}
){
  try{
    //GET the products ID from the url
    const {id} = await params;

    //Convert the URL ID into a number
    const productId = Number(id);

    //Check whether the ID is valid
      if(!Number.isInteger(productId) || productId <=0){
        return NextResponse.json(
          {success: false, message: "Invalid products ID "},
          {status: 400}
        );
      }

      //Delete the products matching this ID 
      const [result] = await db.execute(
        "DELETE FROM products WHERE id = ?",
        [productId]
      );

      //Get the number of deleted rows
      const deleteResult = result as { affectedRows: number};

      //Check whether the product existed
      if(deleteResult.affectedRows === 0){
        return NextResponse.json(
          {success:false, message:"Products not found"},
          {status: 404}
        );
      }

      //send a succes response
      return NextResponse.json({
        success: true,
        message: "Products deleted successfully",
      });
  }catch(error){
    //Displaying the actual error in the terminal 
    console.error("DELETE products Error:", error);

    //send on error response
    return NextResponse.json(
      {success: false,message: "Failed to delete products"},
      {status: 500}
    );
  }
}
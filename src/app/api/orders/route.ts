import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

//GET API: Fetch all orders from MySql
export async function GET(){
    try{
        //Fetch all orders, newest orders first
            const [ orders ]= await db.execute(
                "SELECT * FROM orders ORDER BY created_at DESC"
            );

            //Send the orders as a JSON response
            return NextResponse.json({
                success: true,
                message: "Orders fetched successfully",
                data: orders,
            });
    }catch(error){
        //Display the actual error in the terminal
        console.error("GET Orders Error:", error);

        //Send an error response to the client 
        return NextResponse.json(
            {
                success: false,
                message:"Failed to fetch orders",
            },
            {status: 500}
        );
    }
}

//POST API: Create a new customer order
export async function POST(request: Request){
    try{
        //READ customer detailes sent by Thunder Client 
        const body = await request.json();

        //Extract the required order information 

        const {
            customer_name,
            email,
            phone,
            address,
            total_amount,
        } = body;

        //Validate the required fields
        if(
            !customer_name ||
            !email ||
            !address ||
            total_amount === undefined ||
            Number(total_amount)<=0
        ){
            return NextResponse.json (
                {
                    success:false,
                    message:"Customer name, email,address and valid total amount are required",
                },
                {status:400}
            );
        }

        //Insert the order into the MySQL orders table
        const [result] = await db.execute(
            `INSERT INTO orders
            (customer_name, email, phone, address, total_amount)
            VALUES(?, ?, ?, ?, ?)`,
            [
                customer_name,
                email,
                phone ?? null,
                address,
                total_amount,
            ]
        );

        //GET the automatically generated order ID
        const orderId = (result as { insertId: number }).insertId;

        //Return the newly created order ID
        return NextResponse.json(
            {
                success: true,
                message: "Order created successfully",
                orderId: orderId,
            },
            {status: 201}
        );
    }catch(error){
        //Print the actual error in the terminal

        console.error("POST order Error:",error);

        //Return an error response
        return NextResponse.json(
            {
                success: false,
                message:"Failed to create order",
            },
            {status : 500}
        );
    }
}
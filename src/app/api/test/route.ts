import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

export async function GET() {
    try{
        const connection = await db.getConnection();

        connection.release();

        return NextResponse.json({
            success: true,
            message:"MySql database connected successfully!",
        });
    } catch(error){
        console.error("Database connection error:", error);

        return NextResponse.json({
            success: false,
            message:"MySql database connection failed",
        },
    {status: 500}
);
    }
    
}
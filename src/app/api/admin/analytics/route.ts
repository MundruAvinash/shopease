import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in" },
        { status: 401 }
      );
    }

    // Only admin roles can view analytics
    const allowedRoles = ["admin", "owner_admin", "employee_admin"];

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (
      (from && !isValidDate(from)) ||
      (to && !isValidDate(to))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (from && to && from > to) {
      return NextResponse.json(
        { success: false, message: "'from' date must be before 'to' date" },
        { status: 400 }
      );
    }

    const conditions: string[] = [];
    const params: string[] = [];

    if (from) {
      conditions.push("created_at >= ?");
      params.push(from);
    }

    if (to) {
      conditions.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(to);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Summary cards
    const [summaryRows] = await db.execute(
      `SELECT
         COUNT(*) AS totalOrders,
         COALESCE(SUM(total_amount), 0) AS totalRevenue,
         COALESCE(AVG(total_amount), 0) AS averageOrderValue
       FROM orders
       ${whereClause}`,
      params
    );

    // Daily sales for the chart
    const [dailyRows] = await db.execute(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*) AS orders,
         COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       ${whereClause}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      params
    );

    const summary = (summaryRows as {
      totalOrders: number;
      totalRevenue: number | string;
      averageOrderValue: number | string;
    }[])[0];

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: Number(summary.totalOrders),
        totalRevenue: Number(summary.totalRevenue),
        averageOrderValue: Number(summary.averageOrderValue),
        dailySales: dailyRows,
      },
    });
  } catch (error) {
    console.error("GET Admin Analytics Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
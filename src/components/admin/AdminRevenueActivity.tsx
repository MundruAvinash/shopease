"use client";

import { useMemo } from "react";

type Order = {
  id: number;
  customer_name: string;
  total_amount: string;
  status: string;
  created_at: string;
};

type AdminRevenueActivityProps = {
  orders: Order[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AdminRevenueActivity({
  orders,
}: AdminRevenueActivityProps) {
  const { chartData, recentOrders } = useMemo(() => {
    const today = new Date();

    // Build the last 7 days, including today.
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - (6 - index)
      );

      return {
        key: getDateKey(date),
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        amount: 0,
      };
    });

    const amountsByDate = new Map(
      days.map((day) => [day.key, day.amount])
    );

    orders.forEach((order) => {
      // Exclude cancelled orders from the chart.
      if (order.status.toLowerCase() === "cancelled") return;

      const orderDate = new Date(order.created_at);
      const dateKey = getDateKey(orderDate);

      if (amountsByDate.has(dateKey)) {
        const currentAmount = amountsByDate.get(dateKey) ?? 0;
        amountsByDate.set(
          dateKey,
          currentAmount + Number(order.total_amount || 0)
        );
      }
    });

    const chartData = days.map((day) => ({
      ...day,
      amount: amountsByDate.get(day.key) ?? 0,
    }));

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return { chartData, recentOrders };
  }, [orders]);

  const maxAmount = Math.max(...chartData.map((day) => day.amount), 1);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-violet-100 text-violet-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Order value chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Order Value
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Non-cancelled orders over the last 7 days
          </p>
        </div>

        <div className="flex h-56 items-end gap-3 sm:gap-5">
          {chartData.map((day) => {
            const height =
              day.amount === 0 ? 4 : (day.amount / maxAmount) * 100;

            return (
              <div
                key={day.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="max-w-full truncate text-xs text-gray-500">
                  {day.amount > 0 ? formatCurrency(day.amount) : "—"}
                </span>

                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-indigo-500 transition-all hover:bg-indigo-600"
                    style={{ height: `${height}%` }}
                    title={`${day.label}: ${formatCurrency(day.amount)}`}
                  />
                </div>

                <span className="text-xs text-gray-500">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest orders in your store
          </p>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders to show yet.</p>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Order #{order.id} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(order.total_amount || 0))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
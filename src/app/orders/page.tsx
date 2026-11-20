
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: number;
  customer_name: string;
  email: string;
  phone: string | null;
  address: string;
  total_amount: string | number;
  status: string;
  created_at: string;
}

interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/orders");

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const result: OrdersResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Unable to load orders");
        }

        setOrders(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-white">
        <p className="text-xl font-semibold">Loading orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <p className="rounded-lg bg-red-50 p-4 text-lg text-red-600 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl">

        {/* Page Heading */}
        <h1 className="mb-3 text-3xl font-bold text-gray-800 dark:text-white">
          My Orders
        </h1>

        <p className="mb-8 text-gray-500 dark:text-gray-400">
          View your order history and details.
        </p>

        {orders.length === 0 ? (
          /* Empty Orders */
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 text-6xl">📦</div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              No Orders Found
            </h2>

            <p className="mt-3 text-gray-500 dark:text-gray-400">
              You haven't placed any orders yet.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900"
              >

                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      Order #{order.id}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold capitalize text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                    {order.status}
                  </span>
                </div>

                {/* Customer and Delivery Details */}
                <div className="mt-5 grid gap-5 sm:grid-cols-2">

                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                      Customer Information
                    </h3>

                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {order.customer_name}
                    </p>

                    <p className="break-all text-gray-600 dark:text-gray-300">
                      {order.email}
                    </p>

                    <p className="text-gray-600 dark:text-gray-300">
                      {order.phone || "Phone not provided"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                      Delivery Address
                    </h3>

                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {order.address}
                    </p>
                  </div>

                </div>

                {/* Total Amount */}
                <div className="mt-5 flex justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Total Amount
                  </span>

                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(order.total_amount).toLocaleString("en-IN")}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

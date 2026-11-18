
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-xl font-semibold">Loading orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <h1 className="mb-3 text-3xl font-bold text-gray-800">
          My Orders
        </h1>

        <p className="mb-8 text-gray-500">
          View your order history and details.
        </p>

        {orders.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-bold">
              No Orders Found
            </h2>

            <p className="mt-3 text-gray-500">
              You haven't placed any orders yet.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Order #{order.id}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Customer Information
                    </h3>

                    <p className="mt-2 text-gray-600">
                      {order.customer_name}
                    </p>

                    <p className="text-gray-600">
                      {order.email}
                    </p>

                    <p className="text-gray-600">
                      {order.phone || "Phone not provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Delivery Address
                    </h3>

                    <p className="mt-2 text-gray-600">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-between border-t pt-4">
                  <span className="font-semibold">
                    Total Amount
                  </span>

                  <span className="text-xl font-bold text-blue-600">
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

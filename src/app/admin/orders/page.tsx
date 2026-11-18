
"use client";

import { useEffect, useState } from "react";

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

const allowedStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders");
      const result: OrdersResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch orders");
      }

      setOrders(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status
  const updateOrderStatus = async (
    order: Order,
    newStatus: string
  ) => {
    try {
      setUpdatingId(order.id);
      setMessage("");
      setError("");

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: order.customer_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          total_amount: Number(order.total_amount),
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update order");
      }

      setOrders((previousOrders) =>
        previousOrders.map((item) =>
          item.id === order.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setMessage(`Order #${order.id} status updated successfully!`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete order
  const deleteOrder = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete order #${id}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete order");
      }

      setOrders((previousOrders) =>
        previousOrders.filter((order) => order.id !== id)
      );

      setMessage(`Order #${id} deleted successfully!`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Shipped":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-xl font-semibold">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Order Management
            </h1>
            <p className="mt-2 text-gray-500">
              View orders and manage their delivery status.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Refresh Orders
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-lg bg-green-100 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Orders", value: orders.length },
            {
              title: "Pending",
              value: orders.filter((o) => o.status === "Pending").length,
            },
            {
              title: "Processing",
              value: orders.filter((o) => o.status === "Processing").length,
            },
            {
              title: "Delivered",
              value: orders.filter((o) => o.status === "Delivered").length,
            },
          ].map((stat) => (
            <div key={stat.title} className="rounded-xl bg-white p-5 shadow">
              <p className="text-gray-500">{stat.title}</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold">#{order.id}</td>

                    <td className="p-4">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">{order.email}</p>
                    </td>

                    <td className="p-4 font-semibold">
                      ₹{Number(order.total_amount).toLocaleString("en-IN")}
                    </td>

                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-2 text-sm font-semibold ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            updateOrderStatus(order, e.target.value)
                          }
                          className="rounded-lg border p-2 text-sm"
                        >
                          {allowedStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                        >
                          Delete Order
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

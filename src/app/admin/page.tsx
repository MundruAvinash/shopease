"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/src/components/admin/AdminShell";
import AdminRevenueActivity from "@/src/components/admin/AdminRevenueActivity";

type Product = {
  id: number;
  name?: string;
  price?: string | number;
  stock?: number;
};

type Order = {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  total_amount: string | number;
  status: string;
  created_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type UsersResponse = {
  success: boolean;
  message?: string;
  users?: User[];
};

type DashboardStats = {
  productCount: number;
  orderCount: number;
  customerCount: number;
  userCount: number;
  orderValue: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";

    case "shipped":
      return "bg-blue-100 text-blue-700";

    case "processing":
      return "bg-amber-100 text-amber-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        ordersResponse,
        usersResponse,
      ] = await Promise.all([
        fetch("/api/products", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/orders", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/users", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!productsResponse.ok) {
        throw new Error("Could not fetch products.");
      }

      if (!ordersResponse.ok) {
        throw new Error("Could not fetch orders.");
      }

      if (!usersResponse.ok) {
        throw new Error("Could not fetch users.");
      }

      const productsResult =
        (await productsResponse.json()) as ApiResponse<Product[]>;

      const ordersResult =
        (await ordersResponse.json()) as ApiResponse<Order[]>;

      const usersResult =
        (await usersResponse.json()) as UsersResponse;

      if (
        !productsResult.success ||
        !ordersResult.success ||
        !usersResult.success
      ) {
        throw new Error("The dashboard data could not be loaded.");
      }

      const productData = Array.isArray(productsResult.data)
        ? productsResult.data
        : [];

      const orderData = Array.isArray(ordersResult.data)
        ? ordersResult.data
        : [];

      const userData = Array.isArray(usersResult.users)
        ? usersResult.users
        : [];

      setProducts(productData);
      setOrders(orderData);
      setUserCount(userData.length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats: DashboardStats = {
    productCount: products.length,
    orderCount: orders.length,
    customerCount: new Set(
      orders.map((order) => order.email).filter(Boolean)
    ).size,
    userCount,
    orderValue: orders
      .filter(
        (order) => order.status.toLowerCase() !== "cancelled"
      )
      .reduce(
        (total, order) =>
          total + Number(order.total_amount || 0),
        0
      ),
  };

  const statusCounts = orders.reduce<Record<string, number>>(
    (counts, order) => {
      const status = order.status || "Unknown";

      counts[status] = (counts[status] || 0) + 1;

      return counts;
    },
    {}
  );

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const statCards = [
    {
      title: "Total Users",
      value: stats.userCount.toLocaleString("en-IN"),
      description: "Registered accounts",
      icon: "👥",
      iconClass: "bg-purple-100 text-purple-700",
    },
    {
      title: "Total Products",
      value: stats.productCount.toLocaleString("en-IN"),
      description: "Products in your store",
      icon: "📦",
      iconClass: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Total Orders",
      value: stats.orderCount.toLocaleString("en-IN"),
      description: "Orders received",
      icon: "🛍️",
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Customers",
      value: stats.customerCount.toLocaleString("en-IN"),
      description: "Unique customer emails",
      icon: "🧑",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Order Value",
      value: formatCurrency(stats.orderValue),
      description: "Excludes cancelled orders",
      icon: "₹",
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <AdminShell>
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Welcome back! Here&apos;s what&apos;s happening with your store.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-semibold">
                Unable to load dashboard data
              </p>

              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={fetchDashboardData}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>

                    <p className="mt-2 break-words text-2xl font-bold text-gray-900">
                      {loading ? "—" : card.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${card.iconClass}`}
                  >
                    {card.icon}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            ))}
          </section>

          {/* Revenue chart and recent activity */}
          <section>
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Loading chart and recent activity...
              </div>
            ) : (
              <AdminRevenueActivity orders={orders} />
            )}
          </section>

          {/* Recent Orders */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  The five most recently placed orders
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all orders →
              </Link>
            </div>

            {loading ? (
              <p className="p-6 text-sm text-gray-500">
                Loading recent orders...
              </p>
            ) : recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                No orders available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Order ID</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-medium text-gray-900">
                          #{order.id}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {order.customer_name || "Guest"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {order.email || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-900">
                          {formatCurrency(Number(order.total_amount || 0))}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                              order.status || "Unknown"
                            )}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Order status summary */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current order breakdown by status
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">
                Loading order statuses...
              </p>
            ) : Object.keys(statusCounts).length === 0 ? (
              <p className="text-sm text-gray-500">
                No orders available.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-500">{status}</p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admin/products"
                className="rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="font-semibold text-gray-900">
                  Manage Products
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  View and manage store products
                </p>
              </Link>

              <Link
                href="/admin/orders"
                className="rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="font-semibold text-gray-900">
                  Manage Orders
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Review and update customer orders
                </p>
              </Link>

              <Link
                href="/admin/users"
                className="rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="font-semibold text-gray-900">
                  Manage Users
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  View users and manage admin access
                </p>
              </Link>

              <Link
                href="/products"
                className="rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="font-semibold text-gray-900">
                  View Store
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Open the customer-facing store
                </p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
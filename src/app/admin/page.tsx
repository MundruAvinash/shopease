
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: string | number;
  stock: number;
}

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch products and orders
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const productsResult: ApiResponse<Product> =
        await productsResponse.json();

      const ordersResult: ApiResponse<Order> =
        await ordersResponse.json();

      if (!productsResult.success || !ordersResult.success) {
        throw new Error("Unable to load dashboard data");
      }

      setProducts(productsResult.data);
      setOrders(ordersResult.data);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dashboard calculations
  const uniqueCustomers = new Set(
    orders.map((order) => order.email.toLowerCase())
  ).size;

  const totalRevenue = orders.reduce(
    (total, order) => total + Number(order.total_amount),
    0
  );

  // Product stock calculations
  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) > 0 &&
      Number(product.stock) <= 5
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) <= 0
  );

  // Order status calculations
  const orderStatusCounts = {
    Pending: orders.filter((order) => order.status === "Pending").length,
    Processing: orders.filter((order) => order.status === "Processing").length,
    Shipped: orders.filter((order) => order.status === "Shipped").length,
    Delivered: orders.filter((order) => order.status === "Delivered").length,
    Cancelled: orders.filter((order) => order.status === "Cancelled").length,
  };

  // Latest five orders
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // Main statistics
  const stats = [
    {
      title: "Total Products",
      value: products.length,
      icon: "📦",
      color: "bg-blue-100",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: "🛒",
      color: "bg-green-100",
    },
    {
      title: "Unique Customers",
      value: uniqueCustomers,
      icon: "👥",
      color: "bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: "💰",
      color: "bg-yellow-100",
    },
  ];

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Processing: "bg-purple-100 text-purple-700",
    Shipped: "bg-blue-100 text-blue-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">
          Loading Admin Dashboard...
        </p>
      </main>
    );
  }

  // Error screen
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-lg font-semibold text-red-600">
          {error}
        </p>

        <button
          onClick={fetchDashboardData}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Dashboard Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Welcome to the ShopEase administration panel.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            ↻ Refresh Dashboard
          </button>
        </div>

        {/* Main Statistics */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">{stat.title}</p>

                  <h2 className="mt-3 text-3xl font-bold text-gray-800">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${stat.color}`}
                >
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Product Stock Summary */}
        <section className="mt-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Product Stock Management
          </h2>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-5">
              <p className="font-medium text-blue-700">
                Total Stock Available
              </p>
              <h3 className="mt-3 text-3xl font-bold text-blue-800">
                {totalStock}
              </h3>
              <p className="mt-1 text-sm text-blue-600">
                Total units across all products
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-5">
              <p className="font-medium text-yellow-700">
                Low Stock Products
              </p>
              <h3 className="mt-3 text-3xl font-bold text-yellow-800">
                {lowStockProducts.length}
              </h3>
              <p className="mt-1 text-sm text-yellow-600">
                Products with 1–5 units
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-5">
              <p className="font-medium text-red-700">
                Out of Stock Products
              </p>
              <h3 className="mt-3 text-3xl font-bold text-red-800">
                {outOfStockProducts.length}
              </h3>
              <p className="mt-1 text-sm text-red-600">
                Products with zero stock
              </p>
            </div>
          </div>

          {/* Low Stock Product List */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Low Stock Alerts
            </h3>

            {lowStockProducts.length === 0 &&
            outOfStockProducts.length === 0 ? (
              <p className="rounded-lg bg-green-50 p-4 text-green-700">
                All products have sufficient stock.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-500">
                      <th className="p-4">Product ID</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Available Stock</th>
                      <th className="p-4">Stock Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...lowStockProducts, ...outOfStockProducts].map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="border-b last:border-0"
                        >
                          <td className="p-4">#{product.id}</td>

                          <td className="p-4 font-medium">
                            {product.name}
                          </td>

                          <td className="p-4 font-semibold">
                            {product.stock}
                          </td>

                          <td className="p-4">
                            {Number(product.stock) <= 0 ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                                Low Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Link
            href="/admin/products"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Manage Product Inventory
          </Link>
        </section>

        {/* Order Status Summary */}
        <section className="mt-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Order Status Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(orderStatusCounts).map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg border p-5 text-center"
              >
                <h3 className="font-semibold text-gray-600">
                  {status}
                </h3>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {count}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="mt-10 rounded-xl bg-white p-6 shadow">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Recent Orders
            </h2>

            <Link
              href="/admin/orders"
              className="font-semibold text-blue-600 hover:underline"
            >
              Manage All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500"
                    >
                      No orders available.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b transition hover:bg-gray-50 last:border-0"
                    >
                      <td className="p-4 font-semibold">
                        #{order.id}
                      </td>

                      <td className="p-4">
                        {order.customer_name}
                      </td>

                      <td className="p-4 text-gray-500">
                        {order.email}
                      </td>

                      <td className="p-4 font-semibold">
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            statusColors[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Product Management */}
        <section className="mt-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-3 text-2xl font-bold text-gray-800">
            Product Management
          </h2>

          <p className="mb-5 text-gray-500">
            You currently have {products.length} products in your store.
            Manage your product inventory here.
          </p>

          <Link
            href="/admin/products"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Manage Products
          </Link>
        </section>

        {/* Quick Links */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/products"
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800">
              🛍️ View Store
            </h3>

            <p className="mt-2 text-gray-500">
              View all products available in ShopEase.
            </p>
          </Link>

          <Link
            href="/orders"
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800">
              📋 Order History
            </h3>

            <p className="mt-2 text-gray-500">
              View all customer orders.
            </p>
          </Link>
        </section>

      </div>
    </main>
  );
}

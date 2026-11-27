"use client";

import { useCallback, useEffect, useState } from "react";

type DailySale = {
  date: string;
  orders: number;
  revenue: number | string;
};

type AnalyticsData = {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  dailySales: DailySale[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) => {
  // Keep the date returned by MySQL; don't shift it through UTC.
  const datePart = date.slice(0, 10);
  const [year, month, day] = datePart.split("-");

  return `${day}/${month}/${year}`;
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const query = params.toString();
      const response = await fetch(
        `/api/admin/analytics${query ? `?${query}` : ""}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load analytics");
      }

      setAnalytics(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const dailySales = analytics?.dailySales ?? [];

  const maxRevenue = Math.max(
    ...dailySales.map((sale) => Number(sale.revenue)),
    1
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your store's sales and order performance.
          </p>
        </div>

        {/* Date filters */}
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="from-date"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              From date
            </label>
            <input
              id="from-date"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex-1">
            <label
              htmlFor="to-date"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              To date
            </label>
            <input
              id="to-date"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Clear dates
          </button>
        </section>

        {/* Loading and error messages */}
        {loading && (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-500">
            Loading analytics...
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={fetchAnalytics}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        {!loading && !error && analytics && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard
                title="Total Revenue"
                value={formatCurrency(analytics.totalRevenue)}
                description="Revenue from orders in this period"
                color="text-emerald-600"
              />

              <SummaryCard
                title="Total Orders"
                value={analytics.totalOrders.toLocaleString("en-IN")}
                description="Orders placed in this period"
                color="text-indigo-600"
              />

              <SummaryCard
                title="Average Order Value"
                value={formatCurrency(analytics.averageOrderValue)}
                description="Average revenue per order"
                color="text-violet-600"
              />
            </section>

            {/* Sales chart */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Daily Sales
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Revenue and order count for each day with sales.
                </p>
              </div>

              {dailySales.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No sales found for the selected dates.
                </p>
              ) : (
                <div className="space-y-5">
                  {dailySales.map((sale) => {
                    const revenue = Number(sale.revenue);
                    const width = Math.max(
                      (revenue / maxRevenue) * 100,
                      2
                    );

                    return (
                      <div key={sale.date} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-slate-700">
                            {formatDate(sale.date)}
                          </span>
                          <span className="text-slate-600">
                            {formatCurrency(revenue)}
                            <span className="ml-2 text-slate-400">
                              {sale.orders}{" "}
                              {sale.orders === 1 ? "order" : "orders"}
                            </span>
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Daily sales table */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Sales Details
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Orders</th>
                      <th className="px-6 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {dailySales.map((sale) => (
                      <tr key={sale.date} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-700">
                          {formatDate(sale.date)}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {sale.orders}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {formatCurrency(Number(sale.revenue))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}
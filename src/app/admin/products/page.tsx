"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/src/components/admin/AdminShell";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  category: string | null;
  stock: number;
  image_url: string | null;
  created_at: string;
};

type ProductsApiResponse = {
  success: boolean;
  message?: string;
  data: Product[];
};

const PRODUCTS_PER_PAGE = 10;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch products from the API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const result = (await response.json()) as ProductsApiResponse;

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || "Could not fetch products.");
      }

      setProducts(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Delete product
  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete product.");
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Get available categories
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category?.trim() || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [products]
  );

  // Filter products using search and category
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const category = product.category ?? "";

      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch) ||
        String(product.id).includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "All" ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Calculate pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Keep the current page valid after deleting products
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Get only the products for the current page
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

    return filteredProducts.slice(
      startIndex,
      startIndex + PRODUCTS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  const startProduct =
    filteredProducts.length === 0
      ? 0
      : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;

  const endProduct = Math.min(
    currentPage * PRODUCTS_PER_PAGE,
    filteredProducts.length
  );

  // Inventory summary
  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const lowStockCount = products.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) <= 5
  ).length;

  const outOfStockCount = products.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  return (
    <AdminShell>
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Products
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View your products and monitor inventory.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchProducts}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/admin/products/new"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                + Add Product
              </Link>
            </div>
          </div>

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total Products"
              value={loading ? "—" : products.length.toLocaleString("en-IN")}
            />

            <SummaryCard
              label="Low Stock (1–5)"
              value={loading ? "—" : lowStockCount.toLocaleString("en-IN")}
              valueClass="text-amber-600"
            />

            <SummaryCard
              label="Out of Stock"
              value={
                loading ? "—" : outOfStockCount.toLocaleString("en-IN")
              }
              valueClass="text-red-600"
            />
          </section>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-semibold">
                Unable to complete the request
              </p>

              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={fetchProducts}
                className="mt-3 font-semibold underline"
              >
                Refresh products
              </button>
            </div>
          )}

          {/* Inventory */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {loading
                    ? "Loading inventory..."
                    : `${totalStock.toLocaleString("en-IN")} units across ${products.length} products`}
                </p>
              </div>

              {/* Search and category filter */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="product-search">
                  Search products
                </label>

                <input
                  id="product-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, category, or ID..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-72"
                />

                <label className="sr-only" htmlFor="product-category">
                  Filter by category
                </label>

                <select
                  id="product-category"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile product cards */}
            <div className="mt-5 space-y-3 md:hidden">
              {loading ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Loading products...
                </p>
              ) : paginatedProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No products match your search.
                </p>
              ) : (
                paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    deleting={deletingId === product.id}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>

            {/* Desktop product table */}
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3 font-semibold">Product</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Price</th>
                    <th className="px-3 py-3 font-semibold">Stock</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-10 text-center text-sm text-gray-500"
                      >
                        Loading products...
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-10 text-center text-sm text-gray-500"
                      >
                        No products match your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage product={product} />

                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                ID: {product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-sm text-gray-600">
                          {product.category || "—"}
                        </td>

                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(Number(product.price || 0))}
                        </td>

                        <td className="px-3 py-4 text-sm text-gray-700">
                          {Number(product.stock || 0)}
                        </td>

                        <td className="px-3 py-4">
                          <StockBadge stock={Number(product.stock || 0)} />
                        </td>

                        <td className="px-3 py-4">
                          <ProductActions
                            product={product}
                            deleting={deletingId === product.id}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-900">
                    {startProduct}–{endProduct}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {filteredProducts.length}
                  </span>{" "}
                  products
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={
                          currentPage === page ? "page" : undefined
                        }
                        className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          currentPage === page
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty result message */}
            {!loading && filteredProducts.length === 0 && (
              <p className="mt-4 text-center text-xs text-gray-500">
                Showing 0 of {products.length} products
              </p>
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

// Summary card
function SummaryCard({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

// Product image
function ProductImage({ product }: { product: Product }) {
  const imageSrc = product.image_url
    ? `/images/${encodeURIComponent(product.image_url)}`
    : "";

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs text-gray-400">No image</span>
      )}
    </div>
  );
}

// Mobile product card
function ProductCard({
  product,
  deleting,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  onDelete: (product: Product) => void;
}) {
  return (
    <article className="rounded-xl border border-gray-200 p-3">
      <div className="flex gap-3">
        <ProductImage product={product} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {product.name}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {product.category || "—"} · ID {product.id}
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold text-gray-900">
              {formatCurrency(Number(product.price || 0))}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-600">
              Stock: {Number(product.stock || 0)}
            </p>

            <StockBadge stock={Number(product.stock || 0)} />
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <ProductActions
          product={product}
          deleting={deleting}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

// Edit and Delete actions
function ProductActions({
  product,
  deleting,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  onDelete: (product: Product) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
      >
        Edit
      </Link>

      <button
        type="button"
        onClick={() => onDelete(product)}
        disabled={deleting}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

// Stock status badge
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        Low stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
      In stock
    </span>
  );
}
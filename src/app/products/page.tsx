
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import type { AppDispatch } from "@/lib/store";
import { addToCart } from "@/lib/cartSlice";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  category: string;
  stock: number;
  image_url: string;
  created_at: string;
}

interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const result: ProductsResponse = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Unable to load products"
          );
        }

        setProducts(result.data);
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

    void fetchProducts();
  }, []);

  // Get unique categories (case-insensitive)
  const categories = useMemo<CategoryOption[]>(() => {
    const uniqueCategories = new Map<string, string>();

    products.forEach((product) => {
      const originalCategory = product.category?.trim();

      if (!originalCategory) return;

      const normalizedCategory = originalCategory.toLowerCase();

      if (!uniqueCategories.has(normalizedCategory)) {
        uniqueCategories.set(
          normalizedCategory,
          originalCategory
        );
      }
    });

    return [
      { value: "all", label: "All Categories" },
      ...Array.from(uniqueCategories.entries()).map(
        ([value, originalLabel]) => ({
          value,
          label: originalLabel
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        })
      ),
    ];
  }, [products]);

  // Search, filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search by product name
    if (search.trim()) {
      result = result.filter((product) =>
        product.name
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );
    }

    // Filter by category (case-insensitive)
    if (category !== "all") {
      result = result.filter(
        (product) =>
          product.category.trim().toLowerCase() === category
      );
    }

    // Sorting
    if (sort === "low-high") {
      result.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    } else if (sort === "high-low") {
      result.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    } else if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [products, search, category, sort]);

  // Get product image URL
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("/")
    ) {
      return imageUrl;
    }

    return `/images/${imageUrl}`;
  };

  // Add product to Redux cart
  const handleAddToCart = (product: Product) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
      })
    );
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white">
        <p className="text-xl font-semibold">
          Loading products...
        </p>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6 text-gray-900 dark:bg-gray-950 dark:text-white">
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        {/* Page Heading */}
        <h1 className="mb-3 text-center text-3xl font-bold">
          Our Products
        </h1>

        <p className="mb-10 text-center text-gray-500 dark:text-gray-400">
          Explore our latest products.
        </p>

        {/* Search and Filters */}
        <div className="mb-8 grid gap-4 rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900 sm:grid-cols-3">

          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="default">Default Sorting</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
            <option value="newest">Newest Products</option>
          </select>
        </div>

        {/* Product Count */}
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm dark:bg-gray-900">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No products found.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
              >

                {/* Product Image - Click to View Details */}
                <Link href={`/products/${product.id}`}>
                  <div className="group flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {product.image_url ? (
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-125"
                      />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="mt-5">

                  {/* Category */}
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {product.category
                      .trim()
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </span>

                  {/* Product Name */}
                  <Link href={`/products/${product.id}`}>
                    <h2 className="mt-3 cursor-pointer text-xl font-bold text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {product.name}
                    </h2>
                  </Link>

                  {/* Description */}
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
                    {product.description}
                  </p>

                  {/* Price */}
                  <p className="mt-4 text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>

                  {/* Stock */}
                  <p
                    className={`mt-2 text-sm font-medium ${
                      product.stock > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {product.stock > 0
                      ? `In Stock: ${product.stock}`
                      : "Out of Stock"}
                  </p>

                  {/* View Details */}
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-4 block w-full rounded-lg border border-blue-600 py-2.5 text-center font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
                  >
                    View Details
                  </Link>

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="mt-3 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-700"
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}

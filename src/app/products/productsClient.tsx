// app/products/ProductsClient.tsx

"use client";

import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import type { AppDispatch } from "@/lib/store";
import { addToCart } from "@/lib/cartSlice";

// Describes the product data received from the server page.
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

// Props passed from the server page to this client component.
interface ProductsClientProps {
  products: Product[];
  generatedAt: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function ProductsClient({
  products: initialProducts,
  generatedAt,
}: ProductsClientProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Initialize the product list with the data fetched by the server.
  const [products] = useState<Product[]>(initialProducts);

  // State for the search box, category filter, and sorting option.
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");

  // Get unique categories from the available products.
  const categories = useMemo<CategoryOption[]>(() => {
    const uniqueCategories = new Map<string, string>();

    products.forEach((product) => {
      const originalCategory = product.category?.trim();

      // Ignore products that have no category.
      if (!originalCategory) return;

      // Normalize the category so duplicate categories with different
      // capitalization are treated as the same category.
      const normalizedCategory = originalCategory.toLowerCase();

      if (!uniqueCategories.has(normalizedCategory)) {
        uniqueCategories.set(normalizedCategory, originalCategory);
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

  // Search, filter, and sort the products shown on the page.
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search products by name.
    if (search.trim()) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    // Filter products by category, ignoring capitalization.
    if (category !== "all") {
      result = result.filter(
        (product) => product.category.trim().toLowerCase() === category
      );
    }

    // Sort products by price or creation date.
    if (sort === "low-high") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "high-low") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [products, search, category, sort]);

  // Get the correct image URL for each product.
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";

    // Keep full URLs and paths that already start with "/".
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("/")
    ) {
      return imageUrl;
    }

    // Treat a filename as an image inside the public/images folder.
    return `/images/${imageUrl}`;
  };

  // Add the selected product to the Redux cart.
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

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <h1 className="mb-3 text-center text-3xl font-bold">
          Our Products
        </h1>

        <p className="mb-3 text-center text-gray-500 dark:text-gray-400">
          Explore our latest products.
        </p>

        {/* Show when this cached product data was generated. */}
        <p className="mb-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Product data revalidates after 3 minutes.
          <br />
          <strong>Cached data generated:</strong> {generatedAt} IST
        </p>

        {/* Search and filters */}
        <div className="mb-8 grid gap-4 rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900 sm:grid-cols-3">
          {/* Search products by name */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />

          {/* Filter products by category */}
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

          {/* Sort products by price or newest first */}
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

        {/* Show the number of products currently displayed. */}
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Show a message when no products match the search or filters. */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm dark:bg-gray-900">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No products found.
            </p>
          </div>
        ) : (
          // Display the filtered products in a responsive grid.
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Click the product image to open its details page. */}
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

                {/* Product details */}
                <div className="mt-5">
                  {/* Product category */}
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {product.category
                      .trim()
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </span>

                  {/* Product name links to the details page. */}
                  <Link href={`/products/${product.id}`}>
                    <h2 className="mt-3 cursor-pointer text-xl font-bold text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {product.name}
                    </h2>
                  </Link>

                  {/* Product description */}
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
                    {product.description}
                  </p>

                  {/* Product price */}
                  <p className="mt-4 text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>

                  {/* Show stock status and quantity. */}
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

                  {/* Link to the product details page. */}
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-4 block w-full rounded-lg border border-blue-600 py-2.5 text-center font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
                  >
                    View Details
                  </Link>

                  {/* Add the product to the cart unless it is out of stock. */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="mt-3 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-700"
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
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
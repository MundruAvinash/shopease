
"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
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

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const result: ProductsResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Unable to load products");
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

    fetchProducts();
  }, []);

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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-xl font-semibold">
          Loading products...
        </p>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold text-red-600">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <h1 className="mb-3 text-center text-3xl font-bold">
          Our Products
        </h1>

        <p className="mb-10 text-center text-gray-500">
          Explore our latest products.
        </p>

        {products.length === 0 ? (
          <p className="text-center text-gray-500">
            No products available.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
              >

                {/* Product Image */}
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={
                        product.image_url.startsWith("http")
                          ? product.image_url
                          : `/images/${product.image_url}`
                      }
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl">📦</span>
                  )}
                </div>

                {/* Product Details */}
                <h2 className="mt-5 text-xl font-bold">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {product.description}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Category: {product.category}
                </p>

                <p className="mt-4 text-xl font-bold text-blue-600">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Stock: {product.stock}
                </p>

                {/* Add to Cart */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                  className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}

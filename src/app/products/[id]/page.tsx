
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import { addToCart } from "@/lib/cartSlice";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  category: string;
  stock: number;
  image_url: string;
  created_at?: string;
}

function getImageUrl(imageUrl: string | undefined) {
  if (!imageUrl) {
    return "/images/no-image.png";
  }

  if(imageUrl.startsWith("http") || imageUrl.startsWith("/")){
    return imageUrl;
  }

  return `/images/${imageUrl}`;
}

function ProductDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch selected product
        const productResponse = await fetch(
          `/api/products/${productId}`,
          { cache: "no-store" }
        );

        const productResult = await productResponse.json();

        if (!productResponse.ok || !productResult.success) {
          throw new Error(
            productResult.message || "Product not found"
          );
        }

        const selectedProduct: Product = productResult.data;
        setProduct(selectedProduct);

        // Fetch all products for related products
        const allProductsResponse = await fetch("/api/products", {
          cache: "no-store",
        });

        const allProductsResult = await allProductsResponse.json();

        if (allProductsResponse.ok && allProductsResult.success) {
          const related = (allProductsResult.data as Product[])
            .filter(
              (item) =>
                item.id !== selectedProduct.id &&
                item.category === selectedProduct.category
            )
            .slice(0, 4);

          setRelatedProducts(related);
        }
      } catch (err) {
        console.error("Product details error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
      })
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    handleAddToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white">
        <p className="text-xl font-semibold">
          Loading product details...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-4 text-gray-900 dark:bg-gray-950 dark:text-white">
        <h1 className="text-2xl font-bold">
          {error || "Product not found"}
        </h1>

        <Link
          href="/products"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Back to Products
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          {" / "}
          <Link href="/products" className="hover:text-blue-500">
            Products
          </Link>
          {" / "}
          <span className="text-gray-900 dark:text-white">
            {product.name}
          </span>
        </div>

        {/* Product Details */}
        <section className="grid grid-cols-1 gap-10 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-900 md:grid-cols-2 md:p-10">

          {/* Product Image */}
          <div className="flex items-center justify-center overflow-hidden rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
            <div className="group h-[350px] w-full overflow-hidden rounded-lg md:h-[500px]">
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-500 ease-in-out group-hover:scale-150"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-center">

            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {product.category}
            </p>

            <h1 className="mb-4 text-3xl font-bold md:text-4xl">
              {product.name}
            </h1>

            <p className="mb-6 leading-7 text-gray-600 dark:text-gray-300">
              {product.description}
            </p>

            <div className="mb-5">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </div>

            <p className="mb-6 text-sm">
              Availability:{" "}
              {product.stock > 0 ? (
                <span className="font-semibold text-green-600">
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="font-semibold text-red-500">
                  Out of Stock
                </span>
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="rounded-lg bg-yellow-500 px-8 py-3 font-semibold text-black transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>

             

            </div>

            <Link
              href="/products"
              className="mt-6 w-fit text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Continue Shopping
            </Link>
          </div>
        </section>

        {/* Related Products */}
        <section className="mt-14">

          <h2 className="mb-6 text-2xl font-bold md:text-3xl">
            Related Products
          </h2>

          {relatedProducts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No related products available in this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:bg-gray-900"
                >
                  <div className="h-56 overflow-hidden bg-gray-100 p-4 dark:bg-gray-800">
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.name}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-5">
                    <p className="mb-2 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                      {item.category}
                    </p>

                    <h3 className="mb-3 line-clamp-2 font-semibold">
                      {item.name}
                    </h3>

                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>

                    <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                      View Product →
                    </p>
                  </div>
                </Link>
              ))}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}

// Suspense wrapper fixes the Next.js useParams prerendering error.
export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white">
          <p className="text-xl font-semibold">
            Loading product details...
          </p>
        </main>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}

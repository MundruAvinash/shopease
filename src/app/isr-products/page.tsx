// app/isr-products/page.tsx

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Describes the product fields returned by the database.
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock: number;
}

// Fetches and caches the product data.
async function getProducts(): Promise<{
  products: Product[];
  generatedAt: string;
}> {
  "use cache";

  // Revalidate this cached data after 180 seconds (3 minutes).
  cacheLife({ revalidate: 60 });

  // Tag the cache so it can be invalidated manually if needed.
  cacheTag("products");

  // Read the latest product data from MySQL.
  const [rows] = await db.query(
    `SELECT id, name, description, price, category, stock
     FROM products
     ORDER BY id DESC`
  );

  // This timestamp is cached with the product data.
  // It changes when Next.js regenerates this cached result.
  const generatedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return {
    products: rows as Product[],
    generatedAt,
  };
}

// Renders the cached products on the page.
export default async function ISRProductsPage() {
  const { products, generatedAt } = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-2 text-3xl font-bold text-blue-600">
        ISR Products
      </h1>

      {/* Show the cache revalidation interval and generation timestamp. */}
      <p className="mb-6 text-gray-600">
        Product data revalidates after 3 minutes.
        <br />
        <strong>Cached data generated:</strong> {generatedAt} IST
      </p>

      {/* Show a message if the database contains no products. */}
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            // Use the database ID as the unique key for each product.
            <div
              key={product.id}
              className="rounded-xl bg-white p-5 shadow"
            >
              <h2 className="mb-2 text-xl font-semibold">
                {product.name}
              </h2>

              {/* Display a fallback when the description is empty. */}
              <p className="mb-3 text-gray-600">
                {product.description ?? "No description available."}
              </p>

              {/* Format the price using Indian number formatting. */}
              <p className="font-bold">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </p>

              <p>Category: {product.category}</p>
              <p>Stock: {product.stock}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
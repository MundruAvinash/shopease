
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock: number;
}

async function getProducts(): Promise<Product[]> {
  "use cache";

  // Cache the product data
  cacheLife("minutes");

  // Give this cached data a tag for future invalidation
  cacheTag("products");

  const [rows] = await db.query(
    `SELECT id, name, description, price, category, stock
     FROM products
     ORDER BY id DESC`
  );

  return rows as Product[];
}

export default async function ISRProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-2 text-3xl font-bold text-blue-600">
        ISR Products
      </h1>

      <p className="mb-6 text-gray-600">
        Product data is cached and revalidated.
      </p>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-xl bg-white p-5 shadow"
            >
              <h2 className="mb-2 text-xl font-semibold">
                {product.name}
              </h2>

              <p className="mb-3 text-gray-600">
                {product.description}
              </p>

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

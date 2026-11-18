
import { cacheLife } from "next/cache";
import { db } from "@/lib/db";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("max");

  const [rows] = await db.execute(
    "SELECT id, name, price, stock FROM products"
  );

  return rows as Product[];
}

export default async function SSGProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold">
        SSG Products
      </h1>

      <div className="grid gap-5 md:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl bg-white p-5 shadow"
          >
            <h2 className="text-xl font-semibold">
              {product.name}
            </h2>

            <p className="mt-2">
              Price: ₹{product.price}
            </p>

            <p>
              Stock: {product.stock}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

// app/products/page.tsx

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import ProductsClient from "./productsClient";

// Describes the product fields returned by the database.
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

// The cached result includes both the products and the generation timestamp.
interface CachedProducts {
  products: Product[];
  generatedAt: string;
}

// Fetches product data from MySQL and caches the result.
async function getProducts(): Promise<CachedProducts> {
  "use cache";

  // Revalidate this cached result after 180 seconds (3 minutes).
  cacheLife({ revalidate: 60 });

  // Add a tag so this cache can be invalidated manually if needed.
  cacheTag("products");

  // Read the product information from MySQL.
  const [rows] = await db.query(
    `SELECT id, name, description, price, category, stock, image_url, created_at
     FROM products
     ORDER BY id DESC`
  );

  // Record the time when this cached result is generated.
  // This timestamp is cached along with the product data.
  const generatedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  // Return the products and timestamp together.
  return {
    products: rows as Product[],
    generatedAt,
  };
}

// This server component gets cached data and renders the client UI.
export default async function ProductsPage() {
  const { products, generatedAt } = await getProducts();

  // Pass the cached product data and its generation time to the UI.
  return <ProductsClient products={products} generatedAt={generatedAt} />;
}
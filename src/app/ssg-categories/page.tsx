
import { cacheLife } from "next/cache";
import { db } from "@/lib/db";

interface Category {
  category: string;
}

async function getCategories(): Promise<Category[]> {
  "use cache";

  cacheLife("days");

  const [rows] = await db.query(
    `SELECT DISTINCT category
     FROM products
     WHERE category IS NOT NULL
     ORDER BY category`
  );

  return rows as Category[];
}

export default async function SSCCategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        ShopEase Categories
      </h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((item) => (
          <div
            key={item.category}
            className="rounded-lg border p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              {item.category}
            </h2>
          </div>
        ))}
      </div>
    </main>
  );
}


const products = [
  { id: 1, name: "Laptop", price: 50000, category: "Electronics" },
  { id: 2, name: "Mobile", price: 30000, category: "Electronics" },
  { id: 3, name: "Headphones", price: 3000, category: "Accessories" },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">
        Our Products
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl bg-white p-6 shadow-md"
          >
            <h2 className="mb-2 text-xl font-semibold">
              {product.name}
            </h2>

            <p className="mb-2 text-gray-500">
              {product.category}
            </p>

            <p className="mb-4 text-lg font-bold text-blue-600">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

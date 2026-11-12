
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <nav className="flex items-center justify-between bg-white px-8 py-5 shadow">
        <h1 className="text-2xl font-bold text-blue-600">
          ShopEase
        </h1>

        <div className="flex gap-6">
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/cart">Cart</a>
        </div>
      </nav>

      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h2 className="mb-4 text-5xl font-bold text-gray-800">
          Welcome to ShopEase
        </h2>

        <p className="mb-6 text-lg text-gray-600">
          Discover amazing products at great prices.
        </p>

        <a
          href="/products"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Explore Products
        </a>
      </section>
    </main>
  );
}

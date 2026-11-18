
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="flex min-h-[450px] flex-col items-center justify-center bg-blue-600 px-6 text-center text-white">

        <h1 className="text-5xl font-bold">
          Welcome to ShopEase
        </h1>

        <p className="mt-5 max-w-xl text-lg">
          Discover quality products at great prices.
          Shop your favourite products with ease.
        </p>

        <Link
          href="/products"
          className="mt-8 rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-gray-100"
        >
          Explore Products
        </Link>
      </section>

      {/* Categories Section */}
      <section className="px-8 py-16">

        <h2 className="mb-10 text-center text-3xl font-bold text-gray-800">
          Shop by Category
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">

          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h3 className="text-xl font-semibold">
              Electronics
            </h3>
            <p className="mt-2 text-gray-500">
              Explore laptops and gadgets.
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h3 className="text-xl font-semibold">
              Mobiles
            </h3>
            <p className="mt-2 text-gray-500">
              Find your favourite smartphones.
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h3 className="text-xl font-semibold">
              Accessories
            </h3>
            <p className="mt-2 text-gray-500">
              Discover useful accessories.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 pb-16 text-center">
        <h2 className="text-2xl font-bold">
          Ready to start shopping?
        </h2>

        <Link
          href="/products"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
        >
          Shop Now
        </Link>
        
      </section>

    </main>
  );
}

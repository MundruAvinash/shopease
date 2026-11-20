
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">

      {/* Hero Section - Background Image with Text Overlay */}
      <section
        className="relative flex min-h-[650px] items-center overflow-hidden bg-cover bg-center bg-no-repeat md:min-h-[700px]"
        style={{
          backgroundImage: "url('/images/shopease-products-hero.jpg')",
        }}
      >
        {/* Background Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/10 dark:from-gray-950/95 dark:via-gray-950/75 dark:to-gray-950/10" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 md:px-12">

          <div className="max-w-2xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-3 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              🛒 Shop Smart <span>•</span> Shop Better
            </div>

            {/* Heading */}
            <h1 className="mt-8 text-5xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white md:text-7xl">
              Welcome to
              <span className="block text-blue-600 dark:text-blue-400">
                ShopEase
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-xl text-lg leading-8 text-gray-700 dark:text-gray-200 md:text-xl">
              Discover quality products at great prices.
              Shop your favourite products with ease.
            </p>

            {/* Explore Products Button */}
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-blue-600 px-9 py-5 text-lg font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
            >
              Explore Products
              <span className="text-2xl">→</span>
            </Link>

            {/* Shopping Benefits */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-6">

              <div className="flex items-center gap-3">
                <span className="text-3xl">🚚</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Free Shipping
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    On orders above ₹999
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Secure Payment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    100% Secure
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl">🎧</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    24/7 Support
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Always here for you
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50 px-8 py-16 dark:bg-gray-950">

        <h2 className="mb-10 text-center text-3xl font-bold text-gray-800 dark:text-white">
          Shop by Category
        </h2>

        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 md:grid-cols-3">

          <Link
            href="/products?category=Electronics"
            className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 text-5xl">💻</div>
            <h3 className="text-xl font-semibold">Electronics</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Explore laptops and gadgets.
            </p>
          </Link>

          <Link
            href="/products?category=Mobiles"
            className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 text-5xl">📱</div>
            <h3 className="text-xl font-semibold">Mobiles</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Find your favourite smartphones.
            </p>
          </Link>

          <Link
            href="/products?category=Accessories"
            className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 text-5xl">🎧</div>
            <h3 className="text-xl font-semibold">Accessories</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Discover useful accessories.
            </p>
          </Link>

        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 pb-16 text-center">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ready to start shopping?
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Find something you love today.
        </p>

        <Link
          href="/products"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Shop Now
        </Link>

      </section>

    </main>
  );
}

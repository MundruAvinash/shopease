

export default function CartPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Shopping Cart
      </h1>

      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="text-gray-600">
          Your cart is currently empty.
        </p>

        <a
          href="/products"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Continue Shopping
        </a>
      </div>
    </main>
  );
}


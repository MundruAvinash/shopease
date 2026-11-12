
export default function OrdersPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        My Orders
      </h1>

      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="text-gray-600">
          You haven't placed any orders yet.
        </p>

        <a
          href="/products"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Start Shopping
        </a>
      </div>
    </main>
  );
}


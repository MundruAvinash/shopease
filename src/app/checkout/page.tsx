
export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Checkout
      </h1>

      <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-md">
        <form className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Delivery Address
            </label>
            <textarea
              placeholder="Enter your delivery address"
              className="w-full rounded-lg border p-3"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            Place Order
          </button>
        </form>
      </div>
    </main>
  );
}


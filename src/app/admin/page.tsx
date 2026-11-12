
export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">
        Admin Dashboard
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold">Total Products</h2>
          <p className="mt-3 text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="mt-3 text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="mt-3 text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>
    </main>
  );
}

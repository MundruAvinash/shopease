
"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  category: string | null;
  stock: number;
  image_url: string | null;
}

interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  image_url: string;
}

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // READ: Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const result: ProductsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch products");
      }

      setProducts(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle input changes
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  // CREATE and UPDATE
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category.trim(),
        stock: Number(formData.stock),
        image_url: formData.image_url.trim(),
      };

      if (
        !payload.name ||
        !Number.isFinite(payload.price) ||
        payload.price <= 0 ||
        !Number.isInteger(payload.stock) ||
        payload.stock < 0
      ) {
        throw new Error("Enter a valid name, price, and stock quantity.");
      }

      const url =
        editingId !== null
          ? `/api/products/${editingId}`
          : "/api/products";

      const method = editingId !== null ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save product");
      }

      setMessage(
        editingId !== null
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  // Load product details into the form for editing
  const handleEdit = (product: Product) => {
    setEditingId(product.id);

    setFormData({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      category: product.category ?? "",
      stock: String(product.stock),
      image_url: product.image_url ?? "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete product");
      }

      setMessage("Product deleted successfully!");

      if (editingId === id) {
        resetForm();
      }

      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Product Management
          </h1>

          <p className="mt-2 text-gray-500">
            Add, view, edit, and delete your ShopEase products.
          </p>
        </div>

        {/* Add / Edit Product Form */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold">
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid gap-5 md:grid-cols-2">

              {/* Product Name */}
              <div>
                <label className="mb-2 block font-medium">
                  Product Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block font-medium">
                  Price (₹) *
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block font-medium">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Electronics, Accessories..."
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="mb-2 block font-medium">
                  Stock Quantity
                </label>

                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="mb-2 block font-medium">
                  Image URL or Filename
                </label>

                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="laptop.jpg or https://example.com/image.jpg"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  For local images, enter the filename stored in public/images.
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-2 block font-medium">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
        </section>

        {/* Products Table */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">
              All Products ({products.length})
            </h2>

            <button
              onClick={fetchProducts}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No products found. Add your first product above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-4">ID</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-0"
                    >
                      <td className="p-4">
                        #{product.id}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold">
                          {product.name}
                        </div>

                        <div className="mt-1 max-w-xs text-sm text-gray-500">
                          {product.description}
                        </div>
                      </td>

                      <td className="p-4">
                        {product.category || "-"}
                      </td>

                      <td className="p-4 font-semibold">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </td>

                      <td className="p-4">
                        {product.stock}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/src/components/admin/AdminShell";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

export default function NewProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    setError("");

    if (files.length > MAX_IMAGES) {
      setError(`You can select a maximum of ${MAX_IMAGES} images.`);
      e.target.value = "";
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE
    );

    if (invalidFile) {
      setError(
        !ALLOWED_TYPES.includes(invalidFile.type)
          ? "Only JPG, PNG, WEBP, and GIF images are allowed."
          : "Each image must be 5 MB or less."
      );

      e.target.value = "";
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    setImageFiles(files);
    setImagePreviews(
      files.map((file) => URL.createObjectURL(file))
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (
      !formData.price ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      setError("Price must be greater than zero.");
      return;
    }

    if (
      formData.stock === "" ||
      !Number.isInteger(Number(formData.stock)) ||
      Number(formData.stock) < 0
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    try {
      setLoading(true);

      const body = new FormData();

      body.append("name", formData.name.trim());
      body.append("description", formData.description);
      body.append("price", formData.price);
      body.append("category", formData.category);
      body.append("stock", formData.stock);

      imageFiles.forEach((file) => {
        body.append("images", file);
      });

      const response = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to add product.");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error("Add product error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Add New Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Enter product details and select one or more images.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Product Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
              className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={4}
              className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium"
              >
                Price (₹)
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
                className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium"
              >
                Stock
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                placeholder="Enter stock quantity"
                required
                className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium"
            >
              Category
            </label>

            <input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              placeholder="Example: Electronics"
              className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label
              htmlFor="images"
              className="mb-2 block text-sm font-medium"
            >
              Product Images
            </label>

            <input
              id="images"
              name="images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="w-full rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />

            <p className="mt-1 text-xs text-gray-500">
              Select up to 10 images. JPG, PNG, WEBP, or GIF.
              Maximum size: 5 MB per image.
            </p>

            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">
                  Image Previews
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview} className="min-w-0">
                      <img
                        src={preview}
                        alt={`Product image ${index + 1}`}
                        className="h-32 w-full rounded-lg border bg-white object-contain p-2 dark:border-gray-700"
                      />

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {imageFiles[index]?.name}
                      </p>

                      {index === 0 && (
                        <p className="text-xs font-medium text-blue-600">
                          Main Image
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              disabled={loading}
              className="rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
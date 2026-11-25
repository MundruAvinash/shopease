"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/src/components/admin/AdminShell";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  stock: number;
  image_url: string | null;
  images?: string[] | string | null;
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

function parseImages(images: Product["images"]): string[] {
  if (Array.isArray(images)) {
    return images.filter((image) => typeof image === "string");
  }

  if (typeof images === "string") {
    try {
      const parsed: unknown = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (image): image is string => typeof image === "string"
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

function getImageUrl(filename: string) {
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  if (filename.startsWith("/")) {
    return filename;
  }

  return `/images/${filename}`;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image_url: "",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [newImagePreviews]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${productId}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch product.");
        }

        const product: Product = result.data;
        const images = parseImages(product.images);

        // Older products may have only image_url.
        const allImages =
          images.length > 0
            ? images
            : product.image_url
              ? [product.image_url]
              : [];

        setExistingImages(allImages);

        setFormData({
          name: product.name ?? "",
          description: product.description ?? "",
          price: String(product.price ?? ""),
          category: product.category ?? "",
          stock: String(product.stock ?? 0),
          image_url: product.image_url ?? allImages[0] ?? "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

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

    if (existingImages.length + files.length > MAX_IMAGES) {
      setError(
        `A product can have a maximum of ${MAX_IMAGES} images in total.`
      );
      e.target.value = "";
      setNewImageFiles([]);
      setNewImagePreviews([]);
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
      setNewImageFiles([]);
      setNewImagePreviews([]);
      return;
    }

    setNewImageFiles(files);
    setNewImagePreviews(
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
      setSaving(true);

      const body = new FormData();

      body.append("name", formData.name.trim());
      body.append("description", formData.description);
      body.append("price", formData.price);
      body.append("category", formData.category);
      body.append("stock", formData.stock);
      body.append("image_url", formData.image_url);

      // Send current gallery filenames as JSON.
      body.append("images", JSON.stringify(existingImages));

      // New images use a separate field.
      newImageFiles.forEach((file) => {
        body.append("newImages", file);
      });

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        credentials: "include",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update product details and add more gallery images.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              Loading product details...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-medium text-gray-700"
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
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="mb-2 block text-sm font-medium text-gray-700"
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
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label
                  htmlFor="image_url"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Main Image Filename
                </label>

                <input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="Example: laptop.jpg"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Use a filename from public/images. This field does not
                  upload a file.
                </p>
              </div>

              <div>
                <p className="mb-2 block text-sm font-medium text-gray-700">
                  Current Gallery Images
                </p>

                {existingImages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No gallery images currently saved.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {existingImages.map((filename, index) => (
                      <div key={`${filename}-${index}`} className="min-w-0">
                        <img
                          src={getImageUrl(filename)}
                          alt={`Current product image ${index + 1}`}
                          className="h-32 w-full rounded-lg border bg-white object-contain p-2"
                        />

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {filename}
                        </p>

                        {filename === formData.image_url && (
                          <p className="text-xs font-medium text-blue-600">
                            Main Image
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="newImages"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Add More Images
                </label>

                <input
                  id="newImages"
                  name="newImages"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Select additional images. Up to 10 images total,
                  maximum 5 MB per image.
                </p>

                {newImagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {newImagePreviews.map((preview, index) => (
                      <div key={preview} className="min-w-0">
                        <img
                          src={preview}
                          alt={`New product image ${index + 1}`}
                          className="h-32 w-full rounded-lg border bg-white object-contain p-2"
                        />

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {newImageFiles[index]?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/products")}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </AdminShell>
  );
}
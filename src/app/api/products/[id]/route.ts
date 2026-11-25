import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type ProductImage = string;

interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  stock: number;
  image_url: string | null;
  images: ProductImage[] | string | null;
  created_at?: string;
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

function parseProductImages(
  images: ProductImage[] | string | null | undefined
): ProductImage[] {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images.filter(
      (image): image is string =>
        typeof image === "string" && image.trim().length > 0
    );
  }

  try {
    const parsed: unknown = JSON.parse(images);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0
      );
    }

    return [];
  } catch {
    return [];
  }
}

// GET: Fetch one product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    const products = rows as ProductRow[];

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const product = products[0];

    return NextResponse.json({
      success: true,
      message: "Product fetched successfully",
      data: {
        ...product,
        images: parseProductImages(product.images),
      },
    });
  } catch (error) {
    console.error("GET Product by ID Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT: Update product and optionally add gallery images (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const savedImagePaths: string[] = [];

  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Confirm the product exists and get its current gallery.
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    const products = rows as ProductRow[];

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const currentProduct = products[0];
    const currentImages = parseProductImages(currentProduct.images);

    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "");
    const price = Number(formData.get("price"));
    const category = String(formData.get("category") ?? "").trim();
    const stock = Number(formData.get("stock") ?? 0);
    const requestedMainImage = String(
      formData.get("image_url") ?? ""
    ).trim();

    const imagesField = formData.get("images");
    const newImageEntries = formData.getAll("newImages");

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and valid price are required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Stock must be a non-negative whole number.",
        },
        { status: 400 }
      );
    }

    // The edit form sends the existing gallery as a JSON string.
    let submittedImages = currentImages;

    if (typeof imagesField === "string") {
      try {
        const parsed: unknown = JSON.parse(imagesField);

        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (image) =>
              typeof image === "string" &&
              image.trim().length > 0
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Images must be an array of filenames.",
            },
            { status: 400 }
          );
        }

        submittedImages = parsed;
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid images data.",
          },
          { status: 400 }
        );
      }
    }

    const newImageFiles = newImageEntries.filter(
      (entry): entry is File =>
        entry instanceof File && entry.size > 0
    );

    if (submittedImages.length + newImageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          message: `A product can have a maximum of ${MAX_IMAGES} images.`,
        },
        { status: 400 }
      );
    }

    // Validate all new files before saving any.
    for (const file of newImageFiles) {
      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          {
            success: false,
            message: "Only JPG, PNG, WEBP, and GIF images are allowed.",
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Each image must be 5 MB or less.",
          },
          { status: 400 }
        );
      }
    }

    const imagesDirectory = path.join(
      process.cwd(),
      "public",
      "images"
    );

    await mkdir(imagesDirectory, { recursive: true });

    const newImageFilenames: string[] = [];

    for (const file of newImageFiles) {
      const extension = ALLOWED_TYPES[file.type];
      const filename = `${randomUUID()}${extension}`;
      const imagePath = path.join(imagesDirectory, filename);

      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(imagePath, buffer);

      savedImagePaths.push(imagePath);
      newImageFilenames.push(filename);
    }

    const allImages = [
      ...submittedImages,
      ...newImageFilenames,
    ];

    const mainImage =
      requestedMainImage ||
      currentProduct.image_url ||
      allImages[0] ||
      null;

    await db.execute(
      `UPDATE products
       SET name = ?,
           description = ?,
           price = ?,
           category = ?,
           stock = ?,
           image_url = ?,
           images = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        price,
        category || null,
        stock,
        mainImage,
        JSON.stringify(allImages),
        productId,
      ]
    );

    revalidateTag("products", "max");

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: {
        image_url: mainImage,
        images: allImages,
      },
    });
  } catch (error) {
    // Remove newly uploaded files if the update fails.
    for (const imagePath of savedImagePaths) {
      await unlink(imagePath).catch(() => {});
    }

    console.error("PUT Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete product (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      "DELETE FROM products WHERE id = ?",
      [productId]
    );

    const deleteResult = result as { affectedRows: number };

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    revalidateTag("products", "max");

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

// GET: Fetch all products (public)
export async function GET() {
  try {
    const [products] = await db.execute(
      "SELECT * FROM products"
    );

    return NextResponse.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("GET Products Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// POST: Create a product with multiple images (admin only)
export async function POST(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const savedImagePaths: string[] = [];

  try {
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "");
    const price = Number(formData.get("price"));
    const category = String(formData.get("category") ?? "").trim();
    const stock = Number(formData.get("stock") ?? 0);

    const imageEntries = formData.getAll("images");

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and a valid price are required.",
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

    const imageFiles = imageEntries.filter(
      (entry): entry is File =>
        entry instanceof File && entry.size > 0
    );

    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          message: `You can upload a maximum of ${MAX_IMAGES} images.`,
        },
        { status: 400 }
      );
    }

    // Validate all files before writing any of them.
    for (const file of imageFiles) {
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

    const imageFilenames: string[] = [];

    for (const file of imageFiles) {
      const extension = ALLOWED_TYPES[file.type];
      const filename = `${randomUUID()}${extension}`;
      const imagePath = path.join(imagesDirectory, filename);

      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(imagePath, buffer);

      savedImagePaths.push(imagePath);
      imageFilenames.push(filename);
    }

    const mainImage = imageFilenames[0] ?? null;
    const imagesJson = JSON.stringify(imageFilenames);

    await db.execute(
      `INSERT INTO products
       (name, description, price, category, stock, image_url, images)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        category || null,
        stock,
        mainImage,
        imagesJson,
      ]
    );

    revalidateTag("products", "max");

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: {
          image_url: mainImage,
          images: imageFilenames,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Remove saved files if product creation fails.
    for (const imagePath of savedImagePaths) {
      await unlink(imagePath).catch(() => {});
    }

    console.error("POST Products Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product.",
      },
      { status: 500 }
    );
  }
}
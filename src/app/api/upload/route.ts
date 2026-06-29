// src/app/api/upload/route.ts
// Semua upload dikonversi ke .webp via sharp untuk optimasi ukuran & SEO.
// Install: npm install sharp
// sharp adalah native addon — Turbopack sudah mendukung ini secara otomatis.

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "5242880"); // 5MB default
const UPLOAD_DIR    = path.join(process.cwd(), "public", "uploads");
const WEBP_QUALITY  = 82; // 0-100; 82 = good balance quality vs size

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize filename: strip non-alphanumeric, limit length */
function sanitizeBasename(original: string): string {
  const withoutExt = original.replace(/\.[^.]+$/, "");
  return withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "upload";
}

/** Build a unique webp filename */
function buildFilename(original: string): string {
  const base = sanitizeBasename(original);
  return `${base}_${Date.now()}.webp`;
}

/** Convert any image buffer to WebP via sharp */
async function toWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()           // auto-rotate from EXIF (important for mobile photos)
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type harus multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "File tidak ditemukan dalam request" },
        { status: 400 }
      );
    }

    // ── Validate MIME type ──
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/heic",
      "image/heif",
      "image/tiff",
      "image/bmp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type}. Gunakan JPEG, PNG, WebP, HEIC, atau GIF.` },
        { status: 400 }
      );
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        { error: `Ukuran file terlalu besar. Maksimal ${maxMB}MB.` },
        { status: 400 }
      );
    }

    // ── Read buffer ──
    const arrayBuffer  = await file.arrayBuffer();
    const inputBuffer  = Buffer.from(arrayBuffer);

    // ── Convert to WebP ──
    let webpBuffer: Buffer;
    try {
      webpBuffer = await toWebp(inputBuffer);
    } catch (sharpErr) {
      console.error("[upload] sharp conversion failed:", sharpErr);
      return NextResponse.json(
        { error: "Gagal memproses gambar. Pastikan file tidak rusak." },
        { status: 422 }
      );
    }

    // ── Save file ──
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename    = buildFilename(file.name);
    const outputPath  = path.join(UPLOAD_DIR, filename);
    await writeFile(outputPath, webpBuffer);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json(
      {
        imageUrl,         // primary field (semua komponen baca ini)
        url: imageUrl,    // backward-compat alias
        filename,
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
        convertedSize: webpBuffer.length,
        format: "webp",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat upload" },
      { status: 500 }
    );
  }
}

// ─── GET — health check ───────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/upload",
    accepts: "multipart/form-data (field: file)",
    converts: "all images → .webp",
    maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
  });
}
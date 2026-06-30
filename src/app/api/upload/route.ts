// src/app/api/upload/route.ts
// Semua upload dikonversi ke .webp via sharp untuk optimasi ukuran & SEO.
// Storage: Vercel Blob di production, folder lokal /public/uploads saat development.
// Install: npm install sharp @vercel/blob

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { put } from "@vercel/blob";

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "5242880"); // 5MB default
const UPLOAD_DIR     = path.join(process.cwd(), "public", "uploads");
const WEBP_QUALITY   = 82; // 0-100; 82 = good balance quality vs size

// Vercel Blob aktif kalau token tersedia (otomatis di-inject Vercel setelah
// Storage > Blob di-connect ke project). Di lokal tanpa token → fallback ke disk.
const USE_BLOB_STORAGE = !!process.env.BLOB_READ_WRITE_TOKEN;

export const runtime = "nodejs"; // sharp & fs butuh Node runtime, bukan Edge

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

/**
 * Simpan file webp ke storage yang aktif.
 * Production (Vercel): Vercel Blob — persistent, public URL langsung.
 * Development (lokal): folder /public/uploads — seperti behavior sebelumnya.
 */
async function saveWebp(buffer: Buffer, filename: string): Promise<string> {
  if (USE_BLOB_STORAGE) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      contentType: "image/webp",
    });
    return blob.url;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
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
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

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

    // ── Save file (Blob di production, disk di lokal) ──
    const filename = buildFilename(file.name);
    let imageUrl: string;
    try {
      imageUrl = await saveWebp(webpBuffer, filename);
    } catch (storageErr) {
      console.error("[upload] storage write failed:", storageErr);
      return NextResponse.json(
        { error: "Gagal menyimpan file ke storage." },
        { status: 500 }
      );
    }

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
        storage: USE_BLOB_STORAGE ? "vercel-blob" : "local-disk",
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
    storage: USE_BLOB_STORAGE ? "vercel-blob" : "local-disk",
  });
}
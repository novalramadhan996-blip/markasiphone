// src/app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';  // ← FIX: named import { db }, bukan default import pool
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ─── helpers ──────────────────────────────────────────────────────────────────

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('markas_admin_logged_in')?.value;
  return cookie === 'true';
}

async function savePhoto(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const ext      = file.name.split('.').pop() ?? 'jpg';
  const filename = `testimoni_${Date.now()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

// ─── GET — publik (approved) atau admin (semua) ────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminMode = isAdmin(req);
    const status    = searchParams.get('status');

    let query        = 'SELECT * FROM testimonials';
    const args: unknown[] = [];

    if (adminMode && status) {
      query += ' WHERE status = ?';
      args.push(status);
    } else if (!adminMode) {
      query += " WHERE status = 'approved'";
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, args);  // ← pakai db
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal memuat data' }, { status: 500 });
  }
}

// ─── POST — customer submit testimoni ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = req.formData ? await req.formData() : null;

    let customer_name: string;
    let customer_email: string;
    let rating: number;
    let message: string;
    let photo_url: string | null = null;

    if (formData) {
      customer_name  = (formData.get('customer_name') as string)?.trim();
      customer_email = (formData.get('customer_email') as string)?.trim().toLowerCase();
      rating         = parseInt(formData.get('rating') as string, 10);
      message        = (formData.get('message') as string)?.trim();

      const photo = formData.get('photo') as File | null;
      if (photo && photo.size > 0) {
        if (photo.size > 5 * 1024 * 1024) {
          return NextResponse.json({ success: false, message: 'Foto maksimal 5MB' }, { status: 400 });
        }
        photo_url = await savePhoto(photo);
      }
    } else {
      const body     = await req.json();
      customer_name  = body.customer_name?.trim();
      customer_email = body.customer_email?.trim().toLowerCase();
      rating         = parseInt(body.rating, 10);
      message        = body.message?.trim();
    }

    if (!customer_name || !customer_email || !rating || !message) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: 'Rating harus antara 1–5' }, { status: 400 });
    }

    const [orderRows] = await db.query(  // ← pakai db
      "SELECT id FROM orders WHERE LOWER(customer_email) = ? AND status != 'dibatalkan' LIMIT 1",
      [customer_email]
    ) as [Array<{ id: number }>, unknown];

    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email tidak ditemukan dalam riwayat pesanan. Hanya pelanggan yang sudah pernah order yang dapat memberi testimoni.' },
        { status: 403 }
      );
    }

    const order_id = orderRows[0].id;

    const [existing] = await db.query(  // ← pakai db
      "SELECT id FROM testimonials WHERE customer_email = ? AND status != 'rejected'",
      [customer_email]
    ) as [Array<{ id: number }>, unknown];

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Anda sudah pernah mengirim testimoni. Silakan tunggu review admin.' },
        { status: 409 }
      );
    }

    const [result] = await db.query(  // ← pakai db
      `INSERT INTO testimonials (customer_name, customer_email, order_id, rating, message, photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [customer_name, customer_email, order_id, rating, message, photo_url]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({
      success: true,
      message: 'Testimoni berhasil dikirim! Akan ditampilkan setelah disetujui admin.',
      id: result.insertId,
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan testimoni' }, { status: 500 });
  }
}

// ─── PATCH — admin approve / reject ───────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 });
    }

    await db.query('UPDATE testimonials SET status = ? WHERE id = ?', [status, id]);  // ← pakai db
    return NextResponse.json({ success: true, message: `Testimoni berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}` });
  } catch (err) {
    console.error('[PATCH /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal update status' }, { status: 500 });
  }
}

// ─── DELETE — admin hapus ──────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    await db.query('DELETE FROM testimonials WHERE id = ?', [id]);  // ← pakai db
    return NextResponse.json({ success: true, message: 'Testimoni berhasil dihapus' });
  } catch (err) {
    console.error('[DELETE /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal menghapus' }, { status: 500 });
  }
}
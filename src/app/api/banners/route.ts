import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-request") === "true";
}

// ─── GET — list all banners ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const adminReq = isAdmin(req);

    // Public: only active banners, ordered by sort_order
    // Admin: all banners
    const query = adminReq
      ? "SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC"
      : "SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC";

    const [rows] = await db.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/banners]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST — create banner ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, subtitle, image_url, link_url, sort_order, is_active } = body;

    if (!title?.trim() || !image_url?.trim()) {
      return NextResponse.json(
        { error: "title and image_url are required" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      `INSERT INTO banners (title, subtitle, image_url, link_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        subtitle?.trim() || null,
        image_url.trim(),
        link_url?.trim() || null,
        sort_order ?? 0,
        is_active ?? 1,
      ]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/banners]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH — update banner ────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (Array.isArray(body.reorder)) {
      if (body.reorder.length === 0) {
        return NextResponse.json({ error: "reorder array kosong" }, { status: 400 });
      }

      for (const item of body.reorder) {
        if (!item?.id || item.sort_order === undefined) continue;
        await db.query("UPDATE banners SET sort_order = ? WHERE id = ?", [
          Number(item.sort_order),
          Number(item.id),
        ]);
      }

      return NextResponse.json({ success: true });
    }

    const { id, title, subtitle, image_url, link_url, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Build partial update — only update provided fields
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (title !== undefined) { fields.push("title = ?"); values.push(title.trim()); }
    if (subtitle !== undefined) { fields.push("subtitle = ?"); values.push(subtitle?.trim() || null); }
    if (image_url !== undefined) { fields.push("image_url = ?"); values.push(image_url.trim()); }
    if (link_url !== undefined) { fields.push("link_url = ?"); values.push(link_url?.trim() || null); }
    if (sort_order !== undefined) { fields.push("sort_order = ?"); values.push(Number(sort_order)); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(Number(is_active)); }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(Number(id));
    await db.query(`UPDATE banners SET ${fields.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/banners]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE — remove banner ───────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.query("DELETE FROM banners WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/banners]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
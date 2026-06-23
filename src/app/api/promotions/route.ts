import { db } from "../../../lib/db";

type PromotionRow = {
  id: number;
  product_id: number;
  discount_percent: number;
  is_active: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_slug?: string;
};

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.product_id,
        p.discount_percent,
        p.is_active,
        p.valid_until,
        p.created_at,
        p.updated_at,
        pr.name AS product_name,
        pr.slug AS product_slug
      FROM promotions p
      LEFT JOIN products pr ON pr.id = p.product_id
      ORDER BY p.created_at DESC
    `);

    return Response.json({ promotions: rows });
  } catch (error) {
    return Response.json(
      { message: "Gagal mengambil promo", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, discount_percent, valid_until } = body;

    if (!product_id || !discount_percent) {
      return Response.json(
        { message: "product_id dan discount_percent wajib diisi" },
        { status: 400 }
      );
    }

    const pct = Number(discount_percent);
    if (pct < 1 || pct > 99) {
      return Response.json(
        { message: "discount_percent harus antara 1-99" },
        { status: 400 }
      );
    }

    if (valid_until) {
      const vt = new Date(valid_until);
      if (isNaN(vt.getTime()) || vt <= new Date()) {
        return Response.json(
          { message: "valid_until tidak boleh masa lalu" },
          { status: 400 }
        );
      }
    }

    const [existing] = await db.query(
      `SELECT id FROM promotions WHERE product_id = ? AND is_active = 1`,
      [product_id]
    );
    if ((existing as any[]).length > 0) {
      return Response.json(
        { message: "Produk ini sudah memiliki promo aktif" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO promotions (product_id, discount_percent, is_active, valid_until) VALUES (?, ?, 1, ?)`,
      [product_id, pct, valid_until || null]
    );

    return Response.json({ message: "Promo berhasil ditambahkan" });
  } catch (error) {
    return Response.json(
      { message: "Gagal menambah promo", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, discount_percent, is_active, valid_until } = body;

    if (!id) {
      return Response.json({ message: "ID promo wajib ada" }, { status: 400 });
    }

    if (discount_percent !== undefined) {
      const pct = Number(discount_percent);
      if (pct < 1 || pct > 99) {
        return Response.json(
          { message: "discount_percent harus antara 1-99" },
          { status: 400 }
        );
      }
    }

    if (valid_until !== undefined && valid_until !== null) {
      const vt = new Date(valid_until);
      if (isNaN(vt.getTime()) || vt <= new Date()) {
        return Response.json(
          { message: "valid_until tidak boleh masa lalu" },
          { status: 400 }
        );
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (discount_percent !== undefined) {
      fields.push("discount_percent = ?");
      values.push(Number(discount_percent));
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(Number(is_active));
    }
    if (valid_until !== undefined) {
      fields.push("valid_until = ?");
      values.push(valid_until);
    }

    if (fields.length === 0) {
      return Response.json({ message: "Tidak ada field yang diupdate" }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE promotions SET ${fields.join(", ")} WHERE id = ?`, values);

    return Response.json({ message: "Promo berhasil diupdate" });
  } catch (error) {
    return Response.json(
      { message: "Gagal update promo", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ message: "ID promo wajib ada" }, { status: 400 });
    }

    await db.query("DELETE FROM promotions WHERE id = ?", [id]);

    return Response.json({ message: "Promo berhasil dihapus" });
  } catch (error) {
    return Response.json(
      { message: "Gagal hapus promo", error: String(error) },
      { status: 500 }
    );
  }
}
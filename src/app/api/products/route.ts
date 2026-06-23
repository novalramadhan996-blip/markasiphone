import { db } from "../../../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  base_price: number;
  stock: number;
  is_active: number;
  created_at: string;
  // Kolom tambahan dari LEFT JOIN promotions (null kalau tidak ada promo aktif & valid)
  promo_id: number | null;
  discount_percent: number | null;
  promo_valid_until: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichWithPromo(row: ProductRow) {
  const hasPromo = row.promo_id !== null && row.discount_percent !== null;
  const finalPrice = hasPromo
    ? Math.round(row.base_price * (1 - row.discount_percent! / 100))
    : row.base_price;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    image_url: row.image_url,
    base_price: row.base_price,
    stock: row.stock,
    is_active: row.is_active,
    created_at: row.created_at,
    promo: hasPromo
      ? {
          id: row.promo_id,
          discount_percent: row.discount_percent,
          valid_until: row.promo_valid_until,
          final_price: finalPrice,
        }
      : null,
    final_price: finalPrice, // selalu ada — sama dengan base_price kalau tidak ada promo
  };
}

// GET semua produk, di-enrich dengan promo aktif & masih berlaku (belum expired)
export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        p.*,
        promo.id AS promo_id,
        promo.discount_percent AS discount_percent,
        promo.valid_until AS promo_valid_until
      FROM products p
      LEFT JOIN promotions promo
        ON promo.product_id = p.id
        AND promo.is_active = 1
        AND (promo.valid_until IS NULL OR promo.valid_until > NOW())
      ORDER BY p.created_at DESC
    `);

    const enriched = (rows as ProductRow[]).map(enrichWithPromo);
    return Response.json({ products: enriched });
  } catch (error) {
    return Response.json(
      { message: "Gagal mengambil produk", error: String(error) },
      { status: 500 }
    );
  }
}

// POST tambah produk baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, category, description, image_url, base_price, stock } = body;

    if (!name || !slug || !category || !base_price) {
      return Response.json(
        { message: "Data wajib belum lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      INSERT INTO products (
        name, slug, category, description, image_url, base_price, stock
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        category,
        description || "",
        image_url || "",
        Number(base_price),
        Number(stock) || 0,
      ]
    );

    return Response.json({ message: "Produk berhasil ditambahkan" });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Slug sudah dipakai" }, { status: 400 });
    }
    return Response.json(
      { message: "Gagal menambahkan produk", error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH update produk
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, slug, category, description, image_url, base_price, stock } = body;

    if (!id || !name || !slug || !category || !base_price) {
      return Response.json(
        { message: "Data update belum lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE products
      SET
        name = ?,
        slug = ?,
        category = ?,
        description = ?,
        image_url = ?,
        base_price = ?,
        stock = ?
      WHERE id = ?
      `,
      [
        name,
        slug,
        category,
        description || "",
        image_url || "",
        Number(base_price),
        Number(stock) || 0,
        id,
      ]
    );

    return Response.json({ message: "Produk berhasil diupdate" });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Slug sudah dipakai produk lain" },
        { status: 400 }
      );
    }
    return Response.json(
      { message: "Gagal update produk", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE hapus produk
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ message: "ID produk wajib ada" }, { status: 400 });
    }

    await db.query("DELETE FROM products WHERE id = ?", [id]);

    return Response.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    return Response.json(
      { message: "Gagal menghapus produk", error: String(error) },
      { status: 500 }
    );
  }
}
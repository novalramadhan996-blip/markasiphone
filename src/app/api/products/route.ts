import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM products
      ORDER BY created_at DESC
    `);

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      {
        message: "Gagal mengambil produk",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, slug, category, description, image_url, base_price } = body;

    if (!name || !slug || !category || !base_price) {
      return Response.json(
        { message: "Data wajib belum lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      INSERT INTO products (
        name,
        slug,
        category,
        description,
        image_url,
        base_price
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        category,
        description || "",
        image_url || "",
        Number(base_price),
      ]
    );

    return Response.json({
      message: "Produk berhasil ditambahkan",
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Slug sudah dipakai" },
        { status: 400 }
      );
    }

    return Response.json(
      {
        message: "Gagal menambahkan produk",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      name,
      slug,
      category,
      description,
      image_url,
      base_price,
    } = body;

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
        base_price = ?
      WHERE id = ?
      `,
      [
        name,
        slug,
        category,
        description || "",
        image_url || "",
        Number(base_price),
        id,
      ]
    );

    return Response.json({
      message: "Produk berhasil diupdate",
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Slug sudah dipakai produk lain" },
        { status: 400 }
      );
    }

    return Response.json(
      {
        message: "Gagal update produk",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { message: "ID produk wajib ada" },
        { status: 400 }
      );
    }

    await db.query("DELETE FROM products WHERE id = ?", [id]);

    return Response.json({
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal menghapus produk",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
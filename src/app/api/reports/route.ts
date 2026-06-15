import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT id, customer_name, product, total_price, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `);

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { message: "Gagal mengambil laporan", error: String(error) },
      { status: 500 }
    );
  }
}
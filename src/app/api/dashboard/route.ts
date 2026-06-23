// src/app/api/dashboard/route.ts
import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [orders]: any = await db.query(`
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) AS completed_orders
      FROM orders
    `);

    const [revenue]: any = await db.query(`
      SELECT total_price
      FROM orders
      WHERE status = 'selesai'
    `);

    // ← FIX: query nyata, bukan string literal
    const [promoRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM promotions WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > NOW())"
    );

    const totalRevenue = revenue.reduce((sum: number, item: any) => {
      const numberOnly = String(item.total_price).replace(/[^\d]/g, "");
      return sum + Number(numberOnly || 0);
    }, 0);

    return Response.json({
      total_orders:     orders[0].total_orders     || 0,
      pending_orders:   orders[0].pending_orders   || 0,
      completed_orders: orders[0].completed_orders || 0,
      total_revenue:    totalRevenue,
      activePromos:     promoRows[0].count         || 0,  // ← FIX: key dan value benar
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal mengambil statistik dashboard",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
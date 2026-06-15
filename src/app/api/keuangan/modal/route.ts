import { db } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const { total_modal } = await request.json();

    await db.query(`
      UPDATE finance_settings
      SET total_modal = ?
      WHERE id = 1
    `, [total_modal]);

    return Response.json({
      success: true
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error)
      },
      {
        status: 500
      }
    );
  }
}
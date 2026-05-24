import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM products");

    return Response.json(rows);
  } catch (error) {
    return Response.json({
      error,
    });
  }
}
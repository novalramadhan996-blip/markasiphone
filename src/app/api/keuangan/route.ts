
import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT *
      FROM transactions
      ORDER BY created_at DESC
    `);

    const [financeRows]: any = await db.query(`
      SELECT total_modal
      FROM finance_settings
      LIMIT 1
    `);

    const totalModal =
      financeRows.length > 0
        ? Number(financeRows[0].total_modal)
        : 0;

    const income = rows
      .filter((item: any) => item.type === "income")
      .reduce(
        (sum: number, item: any) =>
          sum + Number(item.amount),
        0
      );

    const expense = rows
      .filter((item: any) => item.type === "expense")
      .reduce(
        (sum: number, item: any) =>
          sum + Number(item.amount),
        0
      );

    return Response.json({
      transactions: rows,
      income,
      expense,
      totalModal,
      profit: income - expense,
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal mengambil data keuangan",
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { type, title, amount } = body;

    await db.query(
      `
      INSERT INTO transactions (
        type,
        title,
        amount
      )
      VALUES (?, ?, ?)
      `,
      [type, title, amount]
    );

    return Response.json({
      message: "Transaksi berhasil ditambahkan",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal tambah transaksi",
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await db.query(
      `
      DELETE FROM transactions
      WHERE id = ?
      `,
      [id]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}
import nodemailer from "nodemailer";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      {
        message: "Gagal mengambil orders",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      phone,
      address,
      product,
      total_price,
    } = body;

    if (
      !customer_name ||
      !customer_email ||
      !phone ||
      !address ||
      !product ||
      !total_price
    ) {
      return Response.json(
        { message: "Data order belum lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      INSERT INTO orders (
        customer_name,
        customer_email,
        phone,
        address,
        product,
        total_price
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [customer_name, customer_email, phone, address, product, total_price]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
      },
    });

    await transporter.sendMail({
      from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "Order Baru - Markas iPhone",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
          <h2>Order Baru Masuk</h2>
          <p><b>Nama:</b> ${customer_name}</p>
          <p><b>Email:</b> ${customer_email}</p>
          <p><b>No. WhatsApp:</b> ${phone}</p>
          <p><b>Alamat:</b> ${address}</p>
          <p><b>Produk:</b> ${product}</p>
          <p><b>Total:</b> ${total_price}</p>
        </div>
      `,
    });

    await transporter.sendMail({
      from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: "Invoice Pesanan - Markas iPhone",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
          <h2>Invoice Pesanan Markas iPhone</h2>
          <p>Halo <b>${customer_name}</b>,</p>
          <p>Terima kasih sudah melakukan pemesanan di Markas iPhone.</p>

          <div style="margin: 24px 0; padding: 20px; background: #f5f5f7; border-radius: 16px;">
            <p><b>Produk:</b> ${product}</p>
            <p><b>Total:</b> ${total_price}</p>
            <p><b>Status:</b> Menunggu pembayaran</p>
            <p><b>Metode Pembayaran:</b> Transfer Bank BCA</p>
            <p><b>No. Rekening:</b> 1234567890</p>
            <p><b>Atas Nama:</b> Markas iPhone</p>
          </div>

          <p>Silakan lakukan pembayaran, lalu kirim bukti transfer ke admin melalui WhatsApp.</p>
          <p>Salam,<br/><b>Markas iPhone</b></p>
        </div>
      `,
    });

    return Response.json({
      message:
        "Order berhasil dibuat, email admin terkirim, dan invoice customer terkirim",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal membuat order",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const { id, status } = body;

    if (!id || !status) {
      return Response.json(
        { message: "ID dan status wajib ada" },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    if (status === "selesai") {
      const [rows]: any = await db.query(
        `
        SELECT *
        FROM orders
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      const order = rows[0];

      if (order?.customer_email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
          },
        });

        await transporter.sendMail({
          from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
          to: order.customer_email,
          subject: "Pembayaran Berhasil - Markas iPhone",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
              <h2>Pembayaran Berhasil</h2>

              <p>Halo <b>${order.customer_name}</b>,</p>
              <p>Pembayaran kamu sudah kami konfirmasi. Pesanan kamu sekarang berstatus <b>SELESAI</b>.</p>

              <div style="margin: 24px 0; padding: 20px; background: #f5f5f7; border-radius: 16px;">
                <p><b>Invoice:</b> #${order.id}</p>
                <p><b>Produk:</b> ${order.product}</p>
                <p><b>Total:</b> ${order.total_price}</p>
                <p><b>Status:</b> Selesai</p>
                <p><b>Tanggal:</b> ${new Date(order.created_at).toLocaleString("id-ID")}</p>
              </div>

              <p>Terima kasih sudah berbelanja di Markas iPhone.</p>
              <p>Salam,<br/><b>Markas iPhone</b></p>
            </div>
          `,
        });
      }
    }

    return Response.json({
      message: "Status order berhasil diupdate",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Gagal update status",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
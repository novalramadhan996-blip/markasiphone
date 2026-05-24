"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Receipt, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  product: string;
  total_price: string;
  status: string;
  created_at: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isLogin = localStorage.getItem("admin_logged_in");

    if (isLogin !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }

    getOrders();
  }, [router]);

  const getOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/orders");
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil order");
    } finally {
      setLoading(false);
    }
  };
const updateStatus = async (
  id: number,
  status: string
) => {
  try {
    const res = await fetch("/api/orders", {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        id,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Gagal update status");
      return;
    }

    getOrders();
  } catch (error) {
    console.error(error);
    alert("Terjadi error");
  }
};
  const downloadInvoice = async (order: Order) => {
    setSelectedOrder(order);

    setTimeout(async () => {
      if (!invoiceRef.current) return;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`invoice-markas-iphone-${order.id}.pdf`);
    }, 300);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <Link
              href="/rahasia-admin-markas/dashboard"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 backdrop-blur-xl hover:text-white"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
              Order Manager
            </p>

            <h1 className="text-6xl font-black tracking-[-0.07em]">
              Pesanan.
            </h1>

            <p className="mt-4 text-lg text-white/50">
              Lihat order masuk dan cetak nota transaksi.
            </p>
          </div>

          <button
            onClick={getOrders}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-[42px] border border-white/10 bg-white/10 p-10 text-center backdrop-blur-2xl">
            <Receipt className="mx-auto mb-5 text-blue-300" size={52} />
            <h2 className="mb-2 text-3xl font-black">Belum ada pesanan</h2>
            <p className="text-white/50">
              Pesanan dari checkout akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-[36px] border border-white/10 bg-white/10 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="mb-2 text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                      Invoice #{order.id}
                    </p>

                    <h2 className="text-3xl font-black">
                      {order.customer_name}
                    </h2>

                    <p className="mt-2 text-white/50">{order.phone}</p>
                    <p className="mt-1 text-white/50">{order.address}</p>
                  </div>

                  <div className="text-right">
                   <p
  className={`rounded-full px-4 py-2 text-sm font-black ${
    order.status === "selesai"
      ? "bg-green-500/20 text-green-300"
      : "bg-yellow-500/20 text-yellow-300"
  }`}
>
  {order.status}
</p>

                    <p className="mt-4 text-3xl font-black">
                      {order.total_price}
                    </p>
                  </div>
                </div>

                <div className="my-6 h-px bg-white/10" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/40">Produk</p>
                    <p className="text-xl font-black">{order.product}</p>
                    <p className="mt-2 text-sm text-white/35">
                      {new Date(order.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>

                 <div className="flex flex-wrap gap-3">
  {order.status !== "selesai" && (
    <button
      onClick={() =>
        updateStatus(order.id, "selesai")
      }
      className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
    >
      Tandai Selesai
    </button>
  )}

  <button
    onClick={() => downloadInvoice(order)}
    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-700"
  >
    <Download size={18} />
    Cetak Nota
  </button>
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="fixed -left-[9999px] top-0">
        {selectedOrder && (
          <div
            ref={invoiceRef}
            style={{
              width: "794px",
              minHeight: "1123px",
              background: "#ffffff",
              color: "#111111",
              padding: "56px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontSize: "34px", margin: 0 }}>
                  Markas iPhone
                </h1>
                <p style={{ marginTop: "8px", color: "#666" }}>
                  Premium Apple Store
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0 }}>INVOICE</h2>
                <p>#{selectedOrder.id}</p>
              </div>
            </div>

            <hr style={{ margin: "36px 0" }} />

            <h3>Data Customer</h3>
            <p><b>Nama:</b> {selectedOrder.customer_name}</p>
            <p><b>No. WhatsApp:</b> {selectedOrder.phone}</p>
            <p><b>Alamat:</b> {selectedOrder.address}</p>

            <div style={{ marginTop: "36px" }}>
              <h3>Detail Pesanan</h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "16px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f5f5f7" }}>
                    <th style={{ padding: "14px", textAlign: "left" }}>
                      Produk
                    </th>
                    <th style={{ padding: "14px", textAlign: "right" }}>
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #eee" }}>
                      {selectedOrder.product}
                    </td>
                    <td
                      style={{
                        padding: "14px",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedOrder.total_price}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "36px",
                padding: "24px",
                background: "#f5f5f7",
                borderRadius: "18px",
              }}
            >
              <p><b>Status:</b> {selectedOrder.status}</p>
              <p>
                <b>Tanggal:</b>{" "}
                {new Date(selectedOrder.created_at).toLocaleString("id-ID")}
              </p>
              <p><b>Pembayaran:</b> Transfer Bank BCA</p>
            </div>

            <p style={{ marginTop: "60px", color: "#666" }}>
              Terima kasih sudah berbelanja di Markas iPhone.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
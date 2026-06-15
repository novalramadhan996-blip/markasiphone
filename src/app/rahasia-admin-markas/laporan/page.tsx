"use client";

import { ArrowLeft, Download, Receipt, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Report = {
  id: number;
  customer_name: string;
  product: string;
  total_price: string;
  status: string;
  created_at: string;
};

export default function LaporanPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(Array.isArray(data) ? data : []));
  }, []);

  const parsePrice = (price: string) =>
    Number(String(price).replace(/[^\d]/g, "") || 0);

  const selesai = reports.filter((item) => item.status === "selesai");

  const totalOmset = selesai.reduce(
    (sum, item) => sum + parsePrice(item.total_price),
    0
  );

  const totalPending = reports.filter((item) => item.status === "pending").length;

  const formatRupiah = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

  const exportCSV = () => {
    const header = "Invoice,Customer,Produk,Total,Status,Tanggal\n";

    const rows = reports
      .map(
        (item) =>
          `#${item.id},${item.customer_name},${item.product},${item.total_price},${item.status},${new Date(
            item.created_at
          ).toLocaleString("id-ID")}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-keuangan-markas-iphone.csv";
    a.click();
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/rahasia-admin-markas/dashboard"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-black text-white/70"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
              Financial Report
            </p>
            <h1 className="text-6xl font-black tracking-[-0.07em]">
              Buku Laporan Keuangan.
            </h1>
            <p className="mt-4 text-white/50">
              Rekap omset, pesanan, dan transaksi toko.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-black text-white"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-4">
          <div className="rounded-[34px] border border-white/10 bg-white/10 p-7">
            <Wallet className="mb-5 text-blue-300" />
            <p className="text-white/45">Total Omset</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatRupiah(totalOmset)}
            </h2>
          </div>

          <div className="rounded-[34px] border border-green-500/20 bg-green-500/10 p-7">
            <TrendingUp className="mb-5 text-green-300" />
            <p className="text-green-300">Transaksi Selesai</p>
            <h2 className="mt-2 text-3xl font-black">{selesai.length}</h2>
          </div>

          <div className="rounded-[34px] border border-yellow-500/20 bg-yellow-500/10 p-7">
            <Receipt className="mb-5 text-yellow-300" />
            <p className="text-yellow-300">Pending</p>
            <h2 className="mt-2 text-3xl font-black">{totalPending}</h2>
          </div>

          <div className="rounded-[34px] border border-blue-500/20 bg-blue-500/10 p-7">
            <Wallet className="mb-5 text-blue-300" />
            <p className="text-blue-300">Profit Sementara</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatRupiah(totalOmset)}
            </h2>
          </div>
        </div>

        <div className="rounded-[42px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
          <h2 className="mb-6 text-3xl font-black">Transaksi Terbaru</h2>

          <div className="space-y-4">
            {reports.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-black/30 p-5"
              >
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                    Invoice #{item.id}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    {item.customer_name}
                  </h3>
                  <p className="mt-1 text-white/45">{item.product}</p>
                  <p className="mt-1 text-sm text-white/30">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={
                      item.status === "selesai"
                        ? "text-green-300"
                        : "text-yellow-300"
                    }
                  >
                    {item.status}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    {item.total_price}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
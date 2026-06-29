import type { Metadata } from "next";
import "./globals.css";
import ProductsLoader from "./ProductsLoader";

export const metadata: Metadata = {
  title: "Markas iPhone",
  description: "Toko resmi produk Apple di Indonesia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        {/*
          ProductsLoader adalah client component tipis yang cukup
          memanggil fetchProducts() sekali saat app pertama kali dimuat.
          Diletakkan di sini agar aktif di semua halaman.
        */}
        <ProductsLoader />
        {children}
      </body>
    </html>
  );
}
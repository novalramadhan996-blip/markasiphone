import mysql from "mysql2/promise";

// ─── Config ───────────────────────────────────────────────────────────────────
// SSL wajib untuk PlanetScale (production). Set DB_SSL=true di Environment
// Variables Vercel. Biarkan kosong/tidak di-set di .env.local (XAMPP tidak butuh SSL).
const useSSL = process.env.DB_SSL === "true";

// Serverless function (Vercel) butuh connection limit kecil agar tidak exhaust
// quota koneksi PlanetScale. Di lokal (dev server long-running) bisa lebih besar.
const isServerless = !!process.env.VERCEL;

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "markas_iphone",
  ssl: useSSL ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: isServerless ? 3 : 10,
  maxIdle: isServerless ? 3 : 10,
  idleTimeout: 60_000,
  queueLimit: 0,
});

// Test connection sekali saat module pertama kali dimuat.
// Di serverless ini jalan tiap cold start — ringan & aman, tidak perlu dihapus.
db.getConnection()
  .then((connection) => {
    console.log("✅ Database connection successful!");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error.message);
  });
import { db } from "../../../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "model"; text: string };

type ProductRow = {
  id: number;
  name: string;
  category: string;
  description: string;
  base_price: number;
  stock: number;
  is_active: number;
  discount_percent: number | null;
};

// gemini-2.0-flash dimatikan Google per 1 Juni 2026 — pakai model yang masih aktif di free tier.
// Disusun sebagai fallback chain: kalau model pertama kena limit/error, coba model berikutnya.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash-preview"];

function buildGeminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

async function getActiveProducts(): Promise<ProductRow[]> {
  const [rows] = await db.query(`
    SELECT
      p.id, p.name, p.category, p.description, p.base_price, p.stock, p.is_active,
      promo.discount_percent
    FROM products p
    LEFT JOIN promotions promo
      ON promo.product_id = p.id
      AND promo.is_active = 1
      AND (promo.valid_until IS NULL OR promo.valid_until > NOW())
    WHERE p.is_active = 1
    ORDER BY p.category, p.name
  `);
  return rows as ProductRow[];
}

function buildCatalogText(products: ProductRow[]): string {
  if (products.length === 0) {
    return "Saat ini belum ada produk yang tersedia di katalog.";
  }

  return products
    .map((p) => {
      const stockInfo = p.stock > 0 ? `Stok: ${p.stock} unit` : "Stok: HABIS";
      const hasPromo = p.discount_percent !== null && p.discount_percent > 0;
      const priceInfo = hasPromo
        ? `Harga normal: ${formatRupiah(p.base_price)} — PROMO ${p.discount_percent}% OFF jadi: ${formatRupiah(
            Math.round(p.base_price * (1 - p.discount_percent! / 100))
          )} 🔥`
        : `Harga: ${formatRupiah(p.base_price)}`;

      return `- ${p.name} (${p.category}) — ${priceInfo} — ${stockInfo}${
        p.description ? `\n  Deskripsi: ${p.description}` : ""
      }`;
    })
    .join("\n");
}

function buildSystemPrompt(catalogText: string): string {
  return `Kamu adalah asisten virtual ramah dari "Markas iPhone", toko online resmi produk Apple di Indonesia.

ATURAN PENTING:
- Jawab dalam Bahasa Indonesia yang santai tapi profesional.
- HANYA gunakan data produk dari katalog di bawah ini. Jangan mengarang produk, harga, stok, atau promo yang tidak ada di daftar.
- Jika ada produk dengan tanda PROMO, beritahu customer dengan antusias soal diskonnya — sebutkan harga normal dan harga setelah promo.
- Jika customer tanya "ada promo apa aja?", sebutkan semua produk yang ada tanda PROMO di katalog.
- Jika customer tanya produk yang tidak ada di katalog, sampaikan dengan jujur bahwa produk tersebut tidak tersedia saat ini, dan tawarkan alternatif dari katalog jika relevan.
- Jika stok produk adalah 0 atau "HABIS", informasikan ke customer bahwa produk sedang kosong, jangan sarankan untuk membelinya walau sedang promo.
- Jangan menyebutkan kamu menggunakan AI, model, atau teknologi di balik chat ini.
- Jawaban singkat dan jelas, maksimal 4-5 kalimat kecuali customer minta detail lebih.
- Jika customer ingin memesan, arahkan untuk memilih produk di halaman toko dan melanjutkan ke checkout.

KATALOG PRODUK AKTIF SAAT INI:
${catalogText}`;
}

// Error yang sengaja dilempar untuk menghentikan seluruh fallback chain,
// dipakai saat error jelas berasal dari request kita (bukan masalah sementara di server Gemini)
class NonRetryableError extends Error {}

const RETRYABLE_STATUSES = [429, 404, 503, 500, 502];

// Coba beberapa model berurutan. Kalau satu kena rate-limit (429), model tidak
// ditemukan (404), atau server Gemini overload (503/500/502), lanjut ke model berikutnya.
// Untuk 503 khususnya, retry sekali dengan delay singkat dulu sebelum pindah model,
// karena biasanya cuma lonjakan traffic sementara di sisi Google.
async function callGeminiWithFallback(apiKey: string, contents: unknown[]) {
  let lastError = "";

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${buildGeminiUrl(model)}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
      }).catch((err) => {
        lastError = `Model ${model} gagal koneksi: ${String(err)}`;
        return null;
      });

      if (!res) break; // network error → coba model berikutnya

      if (res.ok) {
        const data = await res.json();
        const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return { reply: reply.trim(), modelUsed: model };
        lastError = `Model ${model} memberi respons kosong`;
        break; // respons kosong tidak ada gunanya diulang, langsung ke model berikutnya
      }

      const errText = await res.text();
      lastError = `Model ${model} gagal (${res.status}): ${errText}`;
      console.error("Gemini API error:", lastError);

      if (!RETRYABLE_STATUSES.includes(res.status)) {
        // Error permanen (400 bad request, 403 permission, dll) → stop semua, tidak ada gunanya coba model lain
        throw new NonRetryableError(lastError);
      }

      // 503 layak di-retry sekali dengan delay singkat sebelum pindah model — biasanya lonjakan sementara
      if (res.status === 503 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }

      break; // lanjut ke model berikutnya
    }
  }

  throw new Error(lastError || "Semua model Gemini gagal merespons");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { message: "Layanan chat belum dikonfigurasi. Hubungi admin." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history } = body as { message: string; history?: ChatMessage[] };

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ message: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // Ambil katalog produk real-time dari MySQL
    const products    = await getActiveProducts();
    const catalogText  = buildCatalogText(products);
    const systemPrompt = buildSystemPrompt(catalogText);

    // Susun riwayat percakapan untuk konteks (maks 10 pesan terakhir)
    const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Baik, saya siap membantu customer Markas iPhone dengan data katalog di atas." }] },
      ...trimmedHistory.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: message }] },
    ];

    try {
      const { reply } = await callGeminiWithFallback(apiKey, contents);
      return Response.json({ reply });
    } catch (err) {
      console.error("Semua model Gemini gagal:", err);

      if (err instanceof NonRetryableError) {
        return Response.json(
          { message: "Layanan chat sedang bermasalah. Hubungi admin untuk cek konfigurasi." },
          { status: 502 }
        );
      }

      return Response.json(
        { message: "Server AI sedang sibuk, coba lagi dalam beberapa saat ya." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server", error: String(error) },
      { status: 500 }
    );
  }
}
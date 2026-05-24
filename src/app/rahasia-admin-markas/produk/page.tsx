"use client";

import {
  ArrowLeft,
  Database,
  Edit3,
  ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  base_price: number;
  created_at: string;
};

export default function AdminProdukPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    base_price: "",
    image_url: "",
    description: "",
  });

  useEffect(() => {
    const isLogin = localStorage.getItem("admin_logged_in");

    if (isLogin !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }

    getProducts();
  }, [router]);

  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replaceAll(" ", "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const formatRupiah = (value: number) => {
    return `Rp ${Number(value).toLocaleString("id-ID")}`;
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      slug: "",
      category: "",
      base_price: "",
      image_url: "",
      description: "",
    });
  };

  const getProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/products");
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil produk");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setForm({
      ...form,
      name: value,
      slug: createSlug(value),
    });
  };

  const handleUploadImage = async (file: File) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Upload gambar gagal");
        return;
      }

      setForm((prev) => ({
        ...prev,
        image_url: data.imageUrl,
      }));

      alert("Upload gambar berhasil");
    } catch (error) {
      console.error(error);
      alert("Terjadi error saat upload gambar");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditId(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      base_price: String(product.base_price),
      image_url: product.image_url,
      description: product.description,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.base_price) {
      alert("Nama, kategori, dan harga wajib diisi");
      return;
    }

    if (!form.image_url) {
      alert("Gambar produk wajib diupload");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/products", {
        method: editId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editId,
          name: form.name,
          slug: form.slug || createSlug(form.name),
          category: form.category,
          description: form.description,
          image_url: form.image_url,
          base_price: Number(form.base_price),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menyimpan produk");
        return;
      }

      alert(editId ? "Produk berhasil diupdate" : "Produk berhasil disimpan");

      resetForm();
      getProducts();
    } catch (error) {
      console.error(error);
      alert("Terjadi error saat menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    const confirmDelete = confirm("Yakin mau hapus produk ini?");

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal hapus produk");
        return;
      }

      alert("Produk berhasil dihapus");

      if (editId === id) {
        resetForm();
      }

      getProducts();
    } catch (error) {
      console.error(error);
      alert("Terjadi error saat hapus produk");
    } finally {
      setLoading(false);
    }
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
              MySQL Product Manager
            </p>

            <h1 className="text-6xl font-black tracking-[-0.07em]">
              CMS Produk.
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/50">
              Tambah, edit, hapus produk, dan upload gambar langsung dari CMS.
            </p>
          </div>

          <button
            onClick={getProducts}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-[42px] border border-white/10 bg-white/10 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          >
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
              {editId ? <Edit3 size={28} /> : <Plus size={28} />}
            </div>

            <h2 className="mb-2 text-4xl font-black tracking-[-0.05em]">
              {editId ? "Edit Produk" : "Tambah Produk"}
            </h2>

            <p className="mb-7 text-white/45">
              {editId
                ? "Ubah data produk lalu klik update."
                : "Upload gambar, isi data, lalu simpan ke MySQL."}
            </p>

            <div className="space-y-4">
              <input
                placeholder="Nama produk"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <input
                placeholder="Slug otomatis"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <input
                placeholder="Kategori, contoh: iPhone"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                placeholder="Harga angka saja, contoh: 18999000"
                value={form.base_price}
                onChange={(e) =>
                  setForm({ ...form, base_price: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-sm font-black text-white/50">
                  Upload Gambar Produk
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleUploadImage(file);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-bold file:text-white"
                />

                {form.image_url && (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white p-4">
                    <img
                      src={form.image_url}
                      alt="Preview produk"
                      className="h-52 w-full object-contain"
                    />

                    <p className="mt-3 break-all text-xs font-bold text-neutral-500">
                      {form.image_url}
                    </p>
                  </div>
                )}
              </div>

              <textarea
                placeholder="Deskripsi produk"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {loading
                  ? "Memproses..."
                  : editId
                  ? "Update Produk"
                  : "Simpan ke Database"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4 font-black text-white transition hover:bg-white/20"
                >
                  <X size={18} />
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-[-0.05em]">
                  Daftar Produk
                </h2>
                <p className="text-white/45">Total produk: {products.length}</p>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-black text-blue-300 md:flex">
                <Database size={18} />
                MySQL Connected
              </div>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[42px] border border-white/10 bg-white/10 p-10 text-center backdrop-blur-2xl">
                <ImageIcon className="mx-auto mb-5 text-blue-300" size={46} />
                <h3 className="mb-2 text-3xl font-black">
                  Belum ada produk
                </h3>
                <p className="text-white/45">
                  Tambahkan produk pertama dari form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-[36px] border p-5 shadow-[0_30px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl ${
                      editId === product.id
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-white/10 bg-white/10"
                    }`}
                  >
                    <div className="mb-5 flex h-56 items-center justify-center overflow-hidden rounded-[28px] bg-white p-6">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-full object-contain"
                      />
                    </div>

                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
                        {product.category}
                      </p>

                      <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">
                        #{product.id}
                      </p>
                    </div>

                    <h3 className="text-3xl font-black tracking-[-0.05em]">
                      {product.name}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-white/45">
                      {product.description}
                    </p>

                    <p className="mt-5 text-2xl font-black">
                      {formatRupiah(product.base_price)}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-5 py-3 text-sm font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
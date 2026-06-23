"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("markas_admin_logged_in", "true");
        router.push("/rahasia-admin-markas/dashboard");
      } else {
        setError(data.message || "Email atau password salah");
      }
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb33_0%,transparent_50%),radial-gradient(circle_at_bottom_right,#9333ea33_0%,transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-xl">
            <ShieldCheck size={40} className="text-blue-400" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-4xl font-black tracking-tight">
          Admin Login
        </h1>
        <p className="mb-10 text-center text-white/50">
          Akses dashboard Markas iPhone
        </p>

        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-bold text-white/60">
                Email Admin
              </label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-bold text-white/60">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 pr-12 text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/30">
          Markas iPhone • Private CMS
        </p>
      </div>
    </main>
  );
}
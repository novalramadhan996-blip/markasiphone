"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const ADMIN_EMAIL = "ramadhannoval924@gmail.com";
  const ADMIN_PASSWORD = "markasiphone123";

  const handleLogin = () => {
    if (
      email === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      localStorage.setItem("admin_logged_in", "true");

      router.push("/rahasia-admin-markas/dashboard");
    } else {
      alert("Email atau password salah");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6 text-black">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-4xl font-black tracking-tight">
          CMS Login
        </h1>

        <p className="mb-8 text-neutral-500">
          Masuk ke dashboard Markas iPhone.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-black/10 px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-black/10 px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleLogin}
            className="block w-full rounded-2xl bg-black py-4 text-center font-bold text-white transition hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}
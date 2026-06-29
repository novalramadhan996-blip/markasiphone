// src/app/rahasia-admin-markas/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  BarChart3,
  Star,
  Tag,
  Image,
  LogOut,
} from "lucide-react";
import { BadgeCount } from "@/components/BadgeCount";
import { usePendingOrders } from "@/hooks/usePendingOrders";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/rahasia-admin-markas/dashboard", label: "Dashboard", Icon: LayoutDashboard, showBadge: false },
  { href: "/rahasia-admin-markas/orders",    label: "Orders",    Icon: ShoppingBag,    showBadge: true  },
  { href: "/rahasia-admin-markas/produk",    label: "Produk",    Icon: Package,        showBadge: false },
  { href: "/rahasia-admin-markas/keuangan",  label: "Keuangan",  Icon: DollarSign,     showBadge: false },
  { href: "/rahasia-admin-markas/laporan",   label: "Laporan",   Icon: BarChart3,      showBadge: false },
  { href: "/rahasia-admin-markas/testimoni", label: "Testimoni", Icon: Star,           showBadge: false },
  { href: "/rahasia-admin-markas/promosi",   label: "Promosi",   Icon: Tag,            showBadge: false },
  { href: "/rahasia-admin-markas/banner",    label: "Banner",    Icon: Image,          showBadge: false },
] as const;

// ─── Inner layout (hanya render saat isLoggedIn = true) ───────────────────────
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { pendingCount } = usePendingOrders(); // ← hook hanya dipanggil di sini

  function handleLogout() {
    localStorage.removeItem("markas_admin_logged_in");
    router.push("/rahasia-admin-markas/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Admin</p>
          <h1 className="mt-1 text-xl font-black">Markas iPhone</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map(({ href, label, Icon, showBadge }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
                {showBadge && pendingCount > 0 && (
                  <BadgeCount count={pendingCount} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/40 transition hover:bg-white/5 hover:text-red-400"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1">{children}</main>
      </div>

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-black/90 backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, Icon, showBadge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold transition-colors ${
                active ? "text-blue-400" : "text-white/30"
              }`}
            >
              <Icon size={20} />
              {label}
              {showBadge && pendingCount > 0 && (
                <span className="absolute right-1/2 top-2 translate-x-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Root layout — gate auth ──────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const isLoginPage = pathname === "/rahasia-admin-markas/login";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = belum dicek

  useEffect(() => {
    const loggedIn = localStorage.getItem("markas_admin_logged_in") === "true";
    setIsLoggedIn(loggedIn);
    if (!loggedIn && !isLoginPage) {
      router.push("/rahasia-admin-markas/login");
    }
  }, [pathname, isLoginPage, router]);

  // Halaman login — render langsung tanpa layout admin
  if (isLoginPage) return <>{children}</>;

  // Belum tahu status login (SSR/hydration) — tampilkan loading screen
  if (isLoggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
      </div>
    );
  }

  // Belum login — router sudah redirect, render null biar tidak flicker
  if (!isLoggedIn) return null;

  // Sudah login — render full layout + hook polling aktif
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
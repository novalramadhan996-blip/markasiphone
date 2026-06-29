"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

const AUTO_PLAY_INTERVAL = 5000; // 5 detik

// ─── Component ────────────────────────────────────────────────────────────────

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch banners (public — no admin header)
  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.banners ?? []);
        setBanners(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (banners.length || 1));
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + (banners.length || 1)) % (banners.length || 1));
  }, [banners.length]);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    timerRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, paused, next]);

  // No banners — render nothing
  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = banner.link_url
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={banner.link_url!} className="block w-full h-full">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="w-full h-full">{children}</div>
      );

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] select-none"
      style={{ aspectRatio: "21/8" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {banners.map((b, idx) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: idx === current ? 1 : 0, pointerEvents: idx === current ? "auto" : "none" }}
        >
          <Wrapper>
            {/* Background image */}
            <img
              src={b.image_url}
              alt={b.title}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Text overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <h2 className="text-white font-black text-xl lg:text-3xl drop-shadow-lg leading-tight">
                {b.title}
              </h2>
              {b.subtitle && (
                <p className="text-white/80 text-sm lg:text-base mt-1 drop-shadow-md">
                  {b.subtitle}
                </p>
              )}
            </div>
          </Wrapper>
        </div>
      ))}

      {/* Controls — only show if multiple banners */}
      {banners.length > 1 && (
        <>
          {/* Prev / Next */}
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); setCurrent(idx); }}
                className={`rounded-full transition-all ${
                  idx === current
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
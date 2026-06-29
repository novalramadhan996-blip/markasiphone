// src/hooks/usePendingOrders.ts
import { useEffect, useState } from "react";

const POLL_INTERVAL = 30_000;

export function usePendingOrders() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch(
          "/api/orders?status=pending&page=1&limit=1",
          {
            headers: { "x-admin-request": "true" }, // ← FIX: header wajib
          }
        );
        if (!res.ok) return;

        const data = await res.json();

        // Response baru: { data: [...], meta: { total, ... } }
        const count =
          data?.meta?.total ??
          (Array.isArray(data?.data) ? data.data.length : 0);

        setPendingCount(count);
      } catch {
        // silent — jangan crash jika network error
      }
    }

    fetchPending();
    const interval = setInterval(fetchPending, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { pendingCount };
}
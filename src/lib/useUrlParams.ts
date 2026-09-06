"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

// Mirrors filter/tab state into the URL's query string (via history.replaceState,
// so it doesn't grow the back-button stack) so that navigating to another page and
// pressing back restores this exact view instead of resetting to its defaults.
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );
}

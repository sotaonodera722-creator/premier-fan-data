"use client";

import { useCallback } from "react";

// Mirrors filter/tab state into the URL's query string so that navigating away
// and pressing back restores this exact view instead of resetting to defaults.
//
// Deliberately writes history directly rather than going through router.replace:
// the router treats a replace as a navigation and re-renders the whole server
// tree for it, which on this site put roughly a second between tapping a round
// and the URL catching up. Nothing here needs the server — the state that
// matters already lives in the component, and the query string is only read on
// a fresh load. History updates are also skipped when the URL would not change,
// so holding an arrow key down doesn't queue up redundant writes.
export function useUrlParams() {
  return useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    window.history.replaceState(window.history.state, "", next);
  }, []);
}

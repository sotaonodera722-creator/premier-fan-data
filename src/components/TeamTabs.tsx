"use client";

import { useState, type ReactNode } from "react";

type TabKey = "overview" | "matches" | "stats" | "squad";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概要" },
  { key: "matches", label: "試合" },
  { key: "stats", label: "スタッツ" },
  { key: "squad", label: "スカッド" },
];

export default function TeamTabs({
  overview,
  matches,
  stats,
  squad,
}: Record<TabKey, ReactNode>) {
  const [tab, setTab] = useState<TabKey>("overview");
  const content: Record<TabKey, ReactNode> = { overview, matches, stats, squad };

  return (
    <div>
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === t.key
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{content[tab]}</div>
    </div>
  );
}

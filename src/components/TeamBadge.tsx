"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";

function initials(name: string) {
  return name
    .replace(/\bFC\b|\bAFC\b/gi, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default function TeamBadge({
  team,
  size = 40,
}: {
  team: Pick<Team, "shortName" | "name" | "crest">;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !team.crest) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-[family-name:var(--font-display)] font-bold text-muted"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
        title={team.name}
      >
        {initials(team.shortName || team.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.crest}
      alt={team.name}
      title={team.name}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

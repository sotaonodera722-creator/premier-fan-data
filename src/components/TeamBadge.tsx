"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";
import { teamNameFull } from "@/lib/teamNamesJa";

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
  team: Pick<Team, "id" | "shortName" | "name" | "crest">;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  // What a screen reader says, and what a hover reveals. The English name is
  // still what initials() reads, since a crest abbreviation is built from the
  // Latin letters — but nothing else here should be read out in English.
  const label = teamNameFull(team);

  if (failed || !team.crest) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-[family-name:var(--font-display)] font-bold text-muted"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
        title={label}
      >
        {initials(team.shortName || team.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.crest}
      alt={label}
      title={label}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

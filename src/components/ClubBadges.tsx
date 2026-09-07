import { TIER_LABELS, type ClubProfile } from "@/lib/clubProfiles";

// The facts about a club that a position number cannot carry. Deliberately
// monochrome: "promoted" and "big six" are categories, not good or bad news, so
// they get an outline rather than a colour. Only the relegation marker is
// semantic — it means the same thing here as the red badge on the table.
export default function ClubBadges({
  profile,
  inRelegationZone = false,
  className = "",
}: {
  profile: ClubProfile | undefined;
  inRelegationZone?: boolean;
  className?: string;
}) {
  if (!profile) return null;

  const outline =
    "inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] leading-4 text-muted";

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {profile.tier !== "midtable" && (
        <span className="inline-flex items-center rounded-sm border border-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-foreground">
          {TIER_LABELS[profile.tier]}
          {profile.promotedAfterYears != null && (
            <span className="ml-1 font-normal tabular-nums">
              {profile.promotedAfterYears}年ぶり
            </span>
          )}
        </span>
      )}
      {profile.leagueTitles > 0 && (
        <span className={outline}>
          1部優勝<span className="tabular-nums">{profile.leagueTitles}</span>回
        </span>
      )}
      {profile.europeanCups > 0 && (
        <span className={outline}>
          欧州制覇<span className="tabular-nums">{profile.europeanCups}</span>回
        </span>
      )}
      {profile.leagueTitles === 0 && profile.europeanCups === 0 && (
        <span className={outline}>1部優勝なし</span>
      )}
      {inRelegationZone && (
        <span className="inline-flex items-center rounded-sm border border-danger px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-danger">
          残留争い
        </span>
      )}
    </div>
  );
}

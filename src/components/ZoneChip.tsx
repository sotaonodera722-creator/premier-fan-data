import { ZONE_LABELS, ZONE_NAMES, type StandingZone } from "@/lib/leagueRules";

const TONE: Record<StandingZone, string> = {
  cl: "border-success text-success",
  el: "border-info text-info",
  relegation: "border-danger text-danger",
};

/**
 * The one place a position number is turned into a consequence. Semantic colour
 * only — these three tones are the table's meaning, not decoration.
 */
export default function ZoneChip({
  zone,
  provisional = false,
}: {
  zone: StandingZone;
  /** The clubs level on this position do not all sit in the same zone. */
  provisional?: boolean;
}) {
  return (
    <span
      title={provisional ? `${ZONE_NAMES[zone]}（同着のため暫定）` : ZONE_NAMES[zone]}
      className={`inline-flex items-center rounded-sm border px-1 text-[9px] font-bold leading-4 ${TONE[zone]} ${
        provisional ? "border-dashed" : ""
      }`}
    >
      {ZONE_LABELS[zone]}
      {provisional && "?"}
    </span>
  );
}

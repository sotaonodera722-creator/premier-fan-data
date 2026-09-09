import {
  CHAMPIONS_LEAGUE_SPOTS,
  EUROPA_LEAGUE_SPOTS,
  RELEGATION_SPOTS,
  ZONE_MEANINGS,
  ZONE_NAMES,
  type StandingZone,
} from "@/lib/leagueRules";
import ZoneChip from "@/components/ZoneChip";
import Term from "@/components/Term";

// A position number is meaningless to a reader who has never followed the
// league — "3rd" carries no consequence until someone says what 3rd wins you.
// This is the legend that turns the table's colours into stakes.
function zoneRange(zone: StandingZone, totalTeams: number): string {
  if (zone === "cl") return `1〜${CHAMPIONS_LEAGUE_SPOTS}位`;
  if (zone === "el") {
    const first = CHAMPIONS_LEAGUE_SPOTS + 1;
    const last = CHAMPIONS_LEAGUE_SPOTS + EUROPA_LEAGUE_SPOTS;
    return first === last ? `${first}位` : `${first}〜${last}位`;
  }
  return `${totalTeams - RELEGATION_SPOTS + 1}〜${totalTeams}位`;
}

const ZONES: StandingZone[] = ["cl", "el", "relegation"];

export default function ZoneLegend({
  totalTeams,
  hasProvisionalBoundary = false,
}: {
  totalTeams: number;
  /** Some clubs are level on a position that spans a zone edge. */
  hasProvisionalBoundary?: boolean;
}) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-background-alt p-4 sm:p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        順位が意味すること
      </h2>
      <ul className="mt-3 space-y-3">
        {ZONES.map((zone) => (
          <li key={zone} className="grid grid-cols-[auto_1fr] gap-x-3">
            <span className="pt-0.5">
              <ZoneChip zone={zone} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {ZONE_NAMES[zone]}
                <span className="ml-1.5 text-xs font-normal tabular-nums text-muted">
                  {zoneRange(zone, totalTeams)}
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {ZONE_MEANINGS[zone]}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {/* Not folded into the paragraph below: a reader looking up 得失点差 is
          scanning for the word, not reading a rules summary, and a word buried
          mid-sentence is one they have to find before they can open it. */}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border pt-3 text-[11px] text-muted">
        <span className="font-medium text-foreground">表の見方</span>
        <Term name="goalDiff" />
        <Term name="gamesInHand" />
      </p>
      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
        全{totalTeams}クラブが、他の全クラブとホームで1回・アウェイで1回ずつ、8月から翌年5月まで38試合を戦います。勝利で勝点3、引き分けで1。勝点が並んだときは得失点差、次に総得点の多いほうが上位です。
        カップ戦の優勝クラブの順位によっては、6位以下にも欧州大会の出場権が回ることがあります。
        {hasProvisionalBoundary && (
          <>
            {" "}
            破線の「
            <span className="font-semibold">?</span>
            」付きバッジは、勝点・得失点差・総得点まで並んでいて順位が確定していないクラブです。
          </>
        )}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        「直近5試合」は左が古い順で、W＝勝ち・D＝引き分け・L＝負け。左端の色帯はクラブカラーです。
      </p>
    </div>
  );
}

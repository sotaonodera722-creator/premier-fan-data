import { getDataFreshness, getSampleSize } from "@/lib/data";
import { jstFullDateTime, jstLongDate, jstTime } from "@/lib/datetime";
import { TimeAgo } from "@/components/RelativeTime";

// The refresh cadence set in .github/workflows — stated here so a reader can
// judge for themselves whether a score in front of them can be trusted as final.
const REFRESH_INTERVAL_LABEL = "約4時間ごと";

export default function Footer() {
  const { lastUpdated, sources } = getDataFreshness();
  const { matchday, playedMatches, totalMatches } = getSampleSize();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              データ最終更新
            </h2>
            <p className="mt-2 text-sm text-foreground">
              <time dateTime={lastUpdated} className="tabular-nums">
                {jstFullDateTime(lastUpdated)}
              </time>
              <span className="ml-1 text-xs text-muted">日本時間</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {REFRESH_INTERVAL_LABEL}に自動更新
              <TimeAgo iso={lastUpdated} className="ml-1" parenthesized />
            </p>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">対象範囲</h2>
            <p className="mt-2 text-sm text-foreground tabular-nums">
              2026/27シーズン 第{matchday}節時点
            </p>
            <p className="mt-1 text-xs text-muted tabular-nums">
              全{totalMatches}試合中{playedMatches}試合が終了
            </p>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">出典</h2>
            <ul className="mt-2 space-y-1.5">
              {sources.map((s) => (
                <li key={s.label} className="text-xs leading-tight">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted"> — {s.provider}</span>
                  <span className="block text-muted tabular-nums">
                    更新 {jstLongDate(s.lastUpdated)} {jstTime(s.lastUpdated)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-7 border-t border-border pt-5 text-xs leading-relaxed text-muted">
          日時はすべて日本時間で表示しています。速報サイトではないため、試合中のスコアは最新でない場合があります。
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          非公式のファン向けデータベースです。プレミアリーグ及び各クラブとは提携関係にありません。
        </p>
      </div>
    </footer>
  );
}

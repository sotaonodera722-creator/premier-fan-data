import { getTeamStyle } from "@/lib/data";
import Term from "@/components/Term";
import type { GlossaryKey } from "@/lib/glossary";
import { getStyleVerdict, getGroupLine, positionIn } from "@/lib/teamStyle";
import { getTeamColor } from "@/lib/teamColors";
import type { AxisReading, StyleGroup } from "@/lib/teamStyle";
import SectionHeading from "@/components/SectionHeading";
import DataNote from "@/components/DataNote";

// Axes whose name is a word rather than a description. The rest ("シュート数")
// explain themselves.
const AXIS_TERMS: Record<string, GlossaryKey | undefined> = {
  "ファイナルサードへのパス": "finalThird",
  "ボール保持率": "possession",
};

/**
 * How a club plays, against how the other nineteen play.
 *
 * Each axis is drawn as the league's own distribution — one tick per club — with
 * this club marked on it. A bar chart would say only "more" or "less"; this says
 * whether the club is out on its own or in the middle of a cluster, which is the
 * part that carries meaning. Hull City sitting alone at the left of the
 * possession axis is the whole of what there is to know about Hull City.
 */

function Spectrum({
  reading,
  color,
  baseline,
}: {
  reading: AxisReading;
  color: string;
  /** Matches behind this club's ordinary figures, for spotting the exceptions. */
  baseline: number;
}) {
  const { axis, distribution, median, value } = reading;
  const pos = positionIn(distribution, value) * 100;
  const medianPos = positionIn(distribution, median) * 100;
  // One fixture is missing the extended categories, so two clubs have an axis
  // or two drawn from fewer matches than the rest of their own page. Saying it
  // once at the top leaves the reader to work out which figures it applies to;
  // it belongs on the figure itself.
  const thinner = reading.sampleSize < baseline;

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-xs text-muted">
          {axis.label}
          {AXIS_TERMS[axis.label] && (
            <Term name={AXIS_TERMS[axis.label]!} label={null} className="ml-1" />
          )}
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
          {axis.format(value)}
          <span className="ml-1.5 text-[11px] font-medium text-muted">
            {reading.rank}位 / {reading.outOf}
          </span>
          {thinner && (
            <span
              className="ml-1.5 border border-border px-1 text-[10px] font-semibold text-muted"
              title={`このクラブのこの項目は${reading.sampleSize}試合ぶんしか記録がありません`}
            >
              {reading.sampleSize}試合
            </span>
          )}
        </span>
      </div>

      <div
        className="relative mt-1.5 h-7"
        role="img"
        aria-label={`${axis.label}は${axis.format(value)}で、${reading.outOf}クラブ中${reading.rank}位`}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-3.5 h-px bg-border" />
        {distribution.map((v, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute top-2.5 h-2.5 w-px bg-border"
            style={{ left: `${positionIn(distribution, v) * 100}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="absolute top-1.5 h-4 w-px bg-muted/60"
          style={{ left: `${medianPos}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1 h-5 w-[5px] rounded-sm ring-2 ring-background"
          style={{ left: `${pos}%`, backgroundColor: color, transform: "translateX(-2px)" }}
        />
      </div>

      <div className="flex justify-between text-[10px] leading-none text-muted">
        <span>{axis.low}</span>
        <span>{axis.high}</span>
      </div>
    </div>
  );
}

function Group({ group, color, baseline }: { group: StyleGroup; color: string; baseline: number }) {
  const line = getGroupLine(group);
  return (
    <div className="mt-8 first:mt-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {group.label}
      </p>
      {line && <p className="mt-1.5 text-sm font-semibold leading-relaxed text-foreground">{line}</p>}
      {group.readings.map((r) => (
        <Spectrum key={r.axis.key} reading={r} color={color} baseline={baseline} />
      ))}
    </div>
  );
}

export default function TeamStyleSection({ teamId }: { teamId: number }) {
  const style = getTeamStyle(teamId);
  if (!style) return null;

  const verdict = getStyleVerdict(style);
  const color = getTeamColor(teamId);
  const partial = style.extendedSampleSize < style.sampleSize;

  return (
    <section className="mt-12">
      <SectionHeading title="このクラブの戦い方" />

      <div className="glass rounded-xl p-5">
        {/* A clause to a line. Japanese breaks at any character, so joining these
            into one paragraph split 「敵陣まで運べない」 across two lines. */}
        <p className="font-[family-name:var(--font-display)] text-xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
          {verdict.clauses.map((c) => (
            <span key={c} className="block">
              {c}
            </span>
          ))}
        </p>
        {verdict.support && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted">{verdict.support}</p>
        )}

        {/* The denominator sits with the figures rather than in a footnote:
            three matches is three matches, and the whole section is built on it. */}
        <p className="mt-4 border-l-2 border-border pl-3 text-[11px] leading-relaxed text-muted">
          <span className="font-medium text-foreground">{style.sampleSize}試合ぶんの平均。</span>{" "}
          順位も同じ{style.sampleSize}試合で20クラブを並べたものです。
          {partial &&
            `期待得点など一部の項目はこのクラブでは${style.extendedSampleSize}試合ぶんしか記録がありません。`}
        </p>

        {style.groups.map((g) => (
          <Group key={g.key} group={g} color={color} baseline={style.sampleSize} />
        ))}
      </div>

      <DataNote>
        目盛りの縦線は20クラブそれぞれの値、太い線が中央値、色のついた印がこのクラブです。
        シーズンが進めば数字は動きます。
      </DataNote>
    </section>
  );
}

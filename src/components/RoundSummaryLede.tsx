import { getRoundSummary } from "@/lib/data";

/**
 * The round in a sentence, above the scores rather than below them.
 *
 * Ten scorelines are data; they only become a week once someone says what they
 * add up to. A reader with ten minutes on a Sunday morning wants that sentence
 * first and the ten results second, so this sits between the round's status and
 * the board of scores. Every word of it is derived — see getRoundSummary — so
 * there is nothing here for anyone to keep up to date by hand.
 */
export default function RoundSummaryLede() {
  const summary = getRoundSummary();
  if (!summary) return null;

  return (
    <div className="mt-4 max-w-[62ch]">
      <p className="text-[10px] font-medium tracking-[0.15em] text-muted">今節を1文で</p>
      <p className="mt-1 text-[13px] leading-[1.95] text-foreground sm:text-sm sm:leading-[2]">
        {summary.text}
      </p>
    </div>
  );
}

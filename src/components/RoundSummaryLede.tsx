import { getRoundSummary } from "@/lib/data";

/**
 * The round in a sentence, above the scores rather than below them.
 *
 * Ten scorelines are data; they only become a week once someone says what they
 * add up to. A reader with ten minutes on a Sunday morning wants that sentence
 * first and the ten results second, so this sits between the round's status and
 * the board of scores. Every word of it is derived — see getRoundSummary — so
 * there is nothing here for anyone to keep up to date by hand.
 *
 * Set at the standfirst step, the one size between body copy and a heading,
 * because it is exactly that: the paragraph under the headline.
 */
export default function RoundSummaryLede() {
  const summary = getRoundSummary();
  if (!summary) return null;

  return (
    <div className="mt-panel max-w-[62ch]">
      <p className="text-micro font-label text-muted">今節を1文で</p>
      <p className="mt-hair text-lead text-foreground">{summary.text}</p>
    </div>
  );
}

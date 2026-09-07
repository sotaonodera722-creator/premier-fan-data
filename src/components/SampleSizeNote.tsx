import { getSampleSize } from "@/lib/data";
import DataNote from "@/components/DataNote";

// Three rounds in, every season-to-date number here is a small sample. Saying so
// next to the number is cheaper than letting a reader draw a conclusion from it
// and later find out it was built on two matches.
export default function SampleSizeNote({
  derived = false,
  children,
}: {
  /**
   * Set on anything counted out of lineups and match events rather than taken
   * from an official published total — minutes, goals, assists, appearances.
   */
  derived?: boolean;
  children?: React.ReactNode;
}) {
  const { matchday, playedMatches, totalMatches, coveredMatches } = getSampleSize();

  return (
    <DataNote>
      <span className="tabular-nums">
        第{matchday}節時点・全{totalMatches}試合中{playedMatches}試合分の数字です。
      </span>
      {derived && (
        <>
          {" "}
          出場時間・得点・アシストは
          <span className="tabular-nums">{coveredMatches}試合</span>
          分のラインナップと試合イベントから算出しているため、公式発表と一致しない場合があります。
        </>
      )}
      {children && <> {children}</>}
    </DataNote>
  );
}

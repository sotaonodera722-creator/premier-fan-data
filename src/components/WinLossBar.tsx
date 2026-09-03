export default function WinLossBar({
  wins,
  draws,
  losses,
}: {
  wins: number;
  draws: number;
  losses: number;
}) {
  const total = wins + draws + losses || 1;
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div style={{ width: seg(wins) }} className="bg-accent" title={`${wins}勝`} />
      <div style={{ width: seg(draws) }} className="bg-yellow-400" title={`${draws}分`} />
      <div style={{ width: seg(losses) }} className="bg-danger" title={`${losses}敗`} />
    </div>
  );
}

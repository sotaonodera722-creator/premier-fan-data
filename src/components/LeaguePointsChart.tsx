"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function LeaguePointsChart({
  data,
}: {
  data: { name: string; points: number; zone: "top" | "mid" | "bottom" }[];
}) {
  const colorFor = (zone: string) =>
    zone === "top" ? "#39ff88" : zone === "bottom" ? "#f43f5e" : "#22d3ee";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#8892a8", fontSize: 10 }}
            axisLine={{ stroke: "#212a3f" }}
            tickLine={false}
            interval={0}
            angle={-40}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fill: "#8892a8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#0f1420",
              border: "1px solid #212a3f",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#eef2ff" }}
          />
          <Bar dataKey="points" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorFor(d.zone)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

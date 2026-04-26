import { Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";

export function Leaderboard() {
  const { data: leaderboard } = useGetLeaderboard({ query: { refetchInterval: 30000, queryKey: getGetLeaderboardQueryKey() } });

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <section className="mt-16 w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Trophy className="w-8 h-8" style={{ color: "#FFD700" }} />
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">🏆 Hall of Shame — Most Savage Roasts Today</h2>
      </div>

      <div className="flex flex-col gap-3">
        {leaderboard.slice(0, 5).map((entry, i) => {
          const rankStyles: Record<number, { borderLeft: string; boxShadow?: string; bg: string; opacity: number; rankColor: string }> = {
            0: { borderLeft: "3px solid #FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.15)",  bg: "rgba(255,215,0,0.05)",  opacity: 1,   rankColor: "#FFD700" },
            1: { borderLeft: "3px solid #C0C0C0", boxShadow: "0 0 15px rgba(192,192,192,0.1)", bg: "rgba(192,192,192,0.03)", opacity: 1,   rankColor: "#C0C0C0" },
            2: { borderLeft: "3px solid #CD7F32", boxShadow: "0 0 15px rgba(205,127,50,0.1)",  bg: "rgba(205,127,50,0.03)",  opacity: 1,   rankColor: "#CD7F32" },
            3: { borderLeft: "3px solid #2A2A2A", bg: "transparent",                           opacity: 0.4, rankColor: "#555555" },
            4: { borderLeft: "3px solid #2A2A2A", bg: "transparent",                           opacity: 0.4, rankColor: "#555555" },
          };
          const rs = rankStyles[i] ?? rankStyles[4];
          return (
            <motion.div
              key={entry.rank + entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`card-leaderboard-${entry.rank}`}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border-y border-r border-border transition-all"
              style={{
                backgroundColor: rs.bg || "hsl(var(--card))",
                borderLeft: rs.borderLeft,
                boxShadow: rs.boxShadow,
                opacity: rs.opacity,
              }}
            >
              <div className="flex items-center gap-4 min-w-[150px]">
                <span
                  className="text-2xl font-bold font-display"
                  style={{ color: rs.rankColor }}
                >
                  #{entry.rank}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-white truncate max-w-[120px]">{entry.name}</span>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "#777777" }}>{entry.job}</span>
                </div>
              </div>
              
              <p className="flex-1 text-sm sm:text-base italic leading-snug" style={{ color: "#999999" }}>
                "{entry.text}"
              </p>

              <div
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full font-bold tabular-nums"
                style={{
                  backgroundColor: "rgba(255, 107, 0, 0.1)",
                  border: "1px solid rgba(255, 107, 0, 0.3)",
                  color: "#FF6B00",
                }}
              >
                <Flame size={16} />
                <span>{entry.burnScore.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

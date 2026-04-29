import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { Roast } from "@workspace/api-client-react";

interface Props {
  roasts: Roast[];
  fireVotes: Record<string, number>;
}

const MIN_FIRE = 5;

export function Leaderboard({ roasts, fireVotes }: Props) {
  const entries = roasts
    .filter(r => (fireVotes[r.id] ?? 0) >= MIN_FIRE)
    .sort((a, b) => (fireVotes[b.id] ?? 0) - (fireVotes[a.id] ?? 0))
    .slice(0, 5);

  if (entries.length === 0) return (
    <section className="mt-16 w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Trophy className="w-8 h-8" style={{ color: "#FFD700" }} />
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Hall of Shame — Most Savage Roasts Today</h2>
      </div>
      <p className="text-sm text-muted-foreground text-center py-6">
        No roasts have earned 5+ 🔥 yet. Vote on Live Feed cards to crown the most savage roast!
      </p>
    </section>
  );

  return (
    <section className="mt-16 w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Trophy className="w-8 h-8" style={{ color: "#FFD700" }} />
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Hall of Shame — Most Savage Roasts Today</h2>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((roast, i) => {
          const rankStyles: Record<number, { borderLeft: string; boxShadow?: string; bg: string; opacity: number; rankColor: string }> = {
            0: { borderLeft: "3px solid #FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.15)",  bg: "rgba(255,215,0,0.05)",  opacity: 1,   rankColor: "#FFD700" },
            1: { borderLeft: "3px solid #C0C0C0", boxShadow: "0 0 15px rgba(192,192,192,0.1)", bg: "rgba(192,192,192,0.03)", opacity: 1,   rankColor: "#C0C0C0" },
            2: { borderLeft: "3px solid #CD7F32", boxShadow: "0 0 15px rgba(205,127,50,0.1)",  bg: "rgba(205,127,50,0.03)",  opacity: 1,   rankColor: "#CD7F32" },
            3: { borderLeft: "3px solid #2A2A2A", bg: "transparent", opacity: 0.4, rankColor: "#555555" },
            4: { borderLeft: "3px solid #2A2A2A", bg: "transparent", opacity: 0.4, rankColor: "#555555" },
          };
          const rs = rankStyles[i] ?? rankStyles[4];
          const votes = fireVotes[roast.id] ?? 0;
          return (
            <motion.div
              key={roast.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`card-leaderboard-${i + 1}`}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border-y border-r border-border transition-all"
              style={{
                backgroundColor: rs.bg || "hsl(var(--card))",
                borderLeft: rs.borderLeft,
                boxShadow: rs.boxShadow,
                opacity: rs.opacity,
              }}
            >
              <div className="flex items-center gap-4 min-w-[150px]">
                <span className="text-2xl font-bold font-display" style={{ color: rs.rankColor }}>
                  #{i + 1}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-foreground truncate max-w-[120px]">{roast.name || "Anonymous"}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{roast.job}</span>
                </div>
              </div>

              <p className="flex-1 text-sm sm:text-base italic leading-snug" style={{ color: "#999999" }}>
                "{roast.text}"
              </p>

              <div
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full font-bold tabular-nums"
                style={{
                  backgroundColor: "rgba(255,69,0,0.12)",
                  border: "1px solid rgba(255,69,0,0.35)",
                  color: "#FF4500",
                }}
              >
                <span>🔥</span>
                <span>{votes}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

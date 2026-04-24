import { Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";

export function Leaderboard() {
  const { data: leaderboard } = useGetLeaderboard({ query: { refetchInterval: 30000, queryKey: getGetLeaderboardQueryKey() } });

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <section className="mt-16 w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Trophy className="text-yellow-500 w-8 h-8" />
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">🏆 Hall of Shame — Most Savage Roasts Today</h2>
      </div>

      <div className="flex flex-col gap-3">
        {leaderboard.slice(0, 5).map((entry, i) => {
          const isFirst = i === 0;
          return (
            <motion.div
              key={entry.rank + entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`card-leaderboard-${entry.rank}`}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border ${isFirst ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-black/40 border-white/5'} transition-all`}
            >
              <div className="flex items-center gap-4 min-w-[150px]">
                <span className={`text-2xl font-bold font-display ${isFirst ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                  #{entry.rank}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-white/90 truncate max-w-[120px]">{entry.name}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{entry.job}</span>
                </div>
              </div>
              
              <p className="flex-1 text-sm sm:text-base font-medium text-white/80 leading-snug">
                "{entry.text}"
              </p>

              <div className="flex items-center gap-1.5 shrink-0 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 font-bold tabular-nums">
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
